import { NextRequest, NextResponse } from "next/server";

import {
  getParticipantsForSession,
  isAttendanceSessionType,
  maskPhone,
} from "@/lib/attendance";
import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";

export const dynamic = "force-dynamic";

function parseInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return Number(value);
}

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();
    const rawSessionType = request.nextUrl.searchParams.get("session_type") ?? "workshop";
    const sessionId = parseInteger(request.nextUrl.searchParams.get("session_id"));

    if (!isAttendanceSessionType(rawSessionType)) {
      return NextResponse.json({ error: "invalid session_type" }, { status: 400 });
    }

    const participants = getParticipantsForSession(
      db,
      rawSessionType,
      sessionId ?? undefined,
    ).map(
      (participant) => ({
        ...participant,
        phone: maskPhone(participant.phone),
      }),
    );

    return NextResponse.json(participants);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "참여자 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
