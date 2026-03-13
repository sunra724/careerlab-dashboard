import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { TeamActivityRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();
    const activities = db
      .prepare(
        `
          SELECT
            ta.*,
            t.name as team_name,
            t.color as team_color
          FROM team_activities ta
          JOIN teams t ON t.id = ta.team_id
          ORDER BY ta.team_id, ta.activity_no
        `,
      )
      .all() as TeamActivityRecord[];

    return NextResponse.json(activities);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "팀별 활동 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
