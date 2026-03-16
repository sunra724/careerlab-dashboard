import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { deleteFile } from "@/lib/upload";

export const dynamic = "force-dynamic";

function normalizeCaption(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const body = (await request.json()) as { caption?: string };

    db.prepare(
      `
        UPDATE session_photos
        SET caption = ?
        WHERE id = ?
      `,
    ).run(normalizeCaption(body.caption), Number(params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "사진 설명 수정에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    const photo = db
      .prepare(
        `
          SELECT filename
          FROM session_photos
          WHERE id = ?
        `,
      )
      .get(Number(params.id)) as { filename: string } | undefined;

    if (!photo) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    deleteFile(photo.filename);
    db.prepare("DELETE FROM session_photos WHERE id = ?").run(Number(params.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "사진 삭제에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
