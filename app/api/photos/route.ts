import { writeFileSync } from "fs";
import { NextRequest, NextResponse } from "next/server";

import { isAttendanceSessionType } from "@/lib/attendance";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { SessionPhotoRecord } from "@/lib/types";
import {
  ALLOWED_MIME,
  ensureUploadDir,
  generateFilename,
  getFilePath,
  getFileUrl,
  MAX_FILE_SIZE,
} from "@/lib/upload";

export const dynamic = "force-dynamic";

function normalizeCaption(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function updatePhotoDeliverable(db: ReturnType<typeof getDb>) {
  const totalPhotos = db
    .prepare(
      `
        SELECT COUNT(*) as count
        FROM session_photos
      `,
    )
    .get() as { count: number };

  if (Number(totalPhotos.count ?? 0) < 5) {
    return;
  }

  db.prepare(
    `
      UPDATE deliverables
      SET
        status = 'submitted',
        submitted_at = COALESCE(submitted_at, date('now')),
        note = ?
      WHERE deliverable_type = 'photo_record'
        AND status = 'pending'
    `,
  ).run(`사진 ${Number(totalPhotos.count ?? 0)}건 업로드 완료 (자동 갱신)`);
}

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();
    const sessionType = request.nextUrl.searchParams.get("session_type") ?? "workshop";
    const sessionId = request.nextUrl.searchParams.get("session_id");

    if (!isAttendanceSessionType(sessionType)) {
      return NextResponse.json({ error: "invalid session_type" }, { status: 400 });
    }

    if (!sessionId || !/^\d+$/.test(sessionId)) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const photos = db
      .prepare(
        `
          SELECT *
          FROM session_photos
          WHERE session_type = ? AND session_id = ?
          ORDER BY taken_at DESC, id DESC
        `,
      )
      .all(sessionType, Number(sessionId)) as SessionPhotoRecord[];

    return NextResponse.json(
      photos.map((photo) => ({
        ...photo,
        url: getFileUrl(photo.filename),
      })),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "사진 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDatabase();
    ensureUploadDir();
    const db = getDb();
    const formData = await request.formData();
    const file = formData.get("file");
    const rawSessionType = formData.get("session_type");
    const rawSessionId = formData.get("session_id");
    const sessionType =
      typeof rawSessionType === "string" && isAttendanceSessionType(rawSessionType)
        ? rawSessionType
        : "workshop";

    if (!(file instanceof File) || typeof rawSessionId !== "string") {
      return NextResponse.json(
        { error: "file과 session_id는 필수입니다." },
        { status: 400 },
      );
    }

    if (!/^\d+$/.test(rawSessionId)) {
      return NextResponse.json(
        { error: "유효한 session_id가 필요합니다." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "파일 크기는 10MB 이하여야 합니다." },
        { status: 413 },
      );
    }

    if (
      !ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number]) &&
      !file.type.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 415 },
      );
    }

    const filename = generateFilename(file.name);
    const filePath = getFilePath(filename);
    const arrayBuffer = await file.arrayBuffer();
    writeFileSync(filePath, Buffer.from(arrayBuffer));

    const result = db
      .prepare(
        `
          INSERT INTO session_photos (
            session_type,
            session_id,
            filename,
            original_name,
            caption,
            file_size
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
      )
      .run(
        sessionType,
        Number(rawSessionId),
        filename,
        file.name,
        normalizeCaption(formData.get("caption")),
        file.size,
      );

    updatePhotoDeliverable(db);

    const photo = db
      .prepare(
        `
          SELECT *
          FROM session_photos
          WHERE id = ?
        `,
      )
      .get(Number(result.lastInsertRowid)) as SessionPhotoRecord;

    return NextResponse.json({
      ...photo,
      url: getFileUrl(photo.filename),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "사진 업로드에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
