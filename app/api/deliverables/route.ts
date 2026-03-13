import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { DeliverableRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();
    const deliverables = db
      .prepare(
        `
          SELECT *
          FROM deliverables
          ORDER BY due_date
        `,
      )
      .all() as DeliverableRecord[];

    return NextResponse.json(deliverables);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "산출물 목록을 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
