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
            workshop_id,
            COUNT(*) as total_invited,
            SUM(CASE WHEN attended = 1 THEN 1 ELSE 0 END) as attended_count
          FROM workshop_attendance
          GROUP BY workshop_id
        `,
      )
      .all() as Array<{
      workshop_id: number;
      total_invited: number;
      attended_count: number;
    }>;

    const attendanceMap = new Map(
      attendanceRows.map((row) => [
        row.workshop_id,
        {
          total_invited: Number(row.total_invited),
          attended_count: Number(row.attended_count),
        },
      ]),
    );

    const result = workshops.map((workshop) => ({
      ...workshop,
      attended_count: attendanceMap.get(workshop.id)?.attended_count ?? 0,
      total_invited: attendanceMap.get(workshop.id)?.total_invited ?? 0,
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
