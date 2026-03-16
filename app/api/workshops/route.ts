import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { WorkshopRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();

    const workshops = db
      .prepare(
        `
          SELECT *
          FROM workshops
          ORDER BY session_no
        `,
      )
      .all() as Array<Omit<WorkshopRecord, "attended_count" | "total_invited">>;

    const attendanceRows = db
      .prepare(
        `
          SELECT
            session_id,
            COUNT(*) as attended_count
          FROM workshop_attendance
          WHERE session_type = 'workshop' AND attended = 1
          GROUP BY session_id
        `,
      )
      .all() as Array<{
      session_id: number;
      attended_count: number;
    }>;

    const activeParticipantRow = db
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM participants
          WHERE status = 'active'
        `,
      )
      .get() as { count: number };

    const attendanceMap = new Map(
      attendanceRows.map((row) => [
        row.session_id,
        Number(row.attended_count),
      ]),
    );

    const totalInvited = Number(activeParticipantRow.count ?? 0);
    const result = workshops.map((workshop) => ({
      ...workshop,
      attended_count: attendanceMap.get(workshop.id) ?? 0,
      total_invited: totalInvited,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "워크숍 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
