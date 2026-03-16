import { NextRequest, NextResponse } from "next/server";

import { getParticipantsForSession, isAttendanceSessionType } from "@/lib/attendance";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { AttendanceRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseInteger(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number(value);
  }

  return null;
}

function readClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();
    const rawSessionType = request.nextUrl.searchParams.get("session_type") ?? "workshop";
    const rawSessionId = request.nextUrl.searchParams.get("session_id");

    if (!isAttendanceSessionType(rawSessionType)) {
      return NextResponse.json({ error: "invalid session_type" }, { status: 400 });
    }

    const sessionId = parseInteger(rawSessionId);
    if (!sessionId) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const attendance = db
      .prepare(
        `
          SELECT
            wa.*,
            p.name as participant_name_db,
            p.phone,
            p.team_id,
            t.name as team_name,
            t.color as team_color
          FROM workshop_attendance wa
          LEFT JOIN participants p ON p.id = wa.participant_id
          LEFT JOIN teams t ON t.id = p.team_id
          WHERE wa.session_type = ? AND wa.session_id = ? AND wa.attended = 1
          ORDER BY wa.attended_at DESC, wa.id DESC
        `,
      )
      .all(rawSessionType, sessionId) as AttendanceRecord[];

    const participants = getParticipantsForSession(db, rawSessionType, sessionId);

    return NextResponse.json({ attendance, participants });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "출석 정보를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();
    const body = (await request.json()) as Record<string, unknown>;
    const rawSessionType =
      typeof body.session_type === "string" ? body.session_type : null;
    const sessionType = isAttendanceSessionType(rawSessionType)
      ? rawSessionType
      : "workshop";
    const sessionId = parseInteger(body.session_id);
    const participantId = parseInteger(body.participant_id);
    const signatureData =
      typeof body.signature_data === "string" ? body.signature_data.trim() : "";
    const phoneLast4 =
      typeof body.phone_last4 === "string" ? body.phone_last4.replace(/\D/g, "") : "";

    if (sessionId === null || participantId === null || !signatureData) {
      return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
    }

    if (!signatureData.startsWith("data:image/png;base64,")) {
      return NextResponse.json({ error: "서명 이미지 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const participant = db
      .prepare(
        `
          SELECT id, name, phone
          FROM participants
          WHERE id = ? AND status = 'active'
        `,
      )
      .get(participantId) as { id: number; name: string; phone: string | null } | undefined;

    if (!participant) {
      return NextResponse.json({ error: "참여자를 찾을 수 없습니다." }, { status: 404 });
    }

    const realLast4 = participant.phone?.replace(/\D/g, "").slice(-4) ?? "";
    if (realLast4 && phoneLast4 !== realLast4) {
      return NextResponse.json(
        { error: "전화번호 뒤 4자리가 일치하지 않습니다." },
        { status: 401 },
      );
    }

    const existing = db
      .prepare(
        `
          SELECT id, attended
          FROM workshop_attendance
          WHERE session_type = ? AND session_id = ? AND participant_id = ?
        `,
      )
      .get(sessionType, sessionId, participantId) as
      | { id: number; attended: number }
      | undefined;

    if (existing?.attended === 1) {
      return NextResponse.json(
        { error: "이미 출석 처리되었습니다.", already: true },
        { status: 409 },
      );
    }

    const ipAddress = readClientIp(request);

    if (existing) {
      db.prepare(
        `
          UPDATE workshop_attendance
          SET
            participant_name = ?,
            attended = 1,
            attended_at = datetime('now', 'localtime'),
            signature_data = ?,
            ip_address = ?
          WHERE id = ?
        `,
      ).run(participant.name, signatureData, ipAddress, existing.id);
    } else {
      db.prepare(
        `
          INSERT INTO workshop_attendance (
            session_type,
            session_id,
            participant_id,
            participant_name,
            attended,
            attended_at,
            signature_data,
            ip_address
          )
          VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'), ?, ?)
        `,
      ).run(sessionType, sessionId, participantId, participant.name, signatureData, ipAddress);
    }

    return NextResponse.json({ ok: true, name: participant.name });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "출석 저장에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
