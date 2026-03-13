import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { getCurrentKpiMetrics } from "@/lib/queries";
import { seedDatabase } from "@/lib/seed";
import type { KpiSnapshot } from "@/lib/types";

export const dynamic = "force-dynamic";

function parseOptionalNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();
    const snapshots = db
      .prepare(
        `
          SELECT *
          FROM kpi_snapshots
          ORDER BY snapshot_date DESC, id DESC
          LIMIT 6
        `,
      )
      .all() as KpiSnapshot[];

    return NextResponse.json({
      current: getCurrentKpiMetrics(db),
      snapshots,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "KPI 데이터를 불러오지 못했습니다.",
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
    const current = getCurrentKpiMetrics(db);
    const note =
      typeof body.note === "string" && body.note.trim().length > 0
        ? body.note.trim()
        : null;

    db.prepare(
      `
        INSERT INTO kpi_snapshots (
          snapshot_date,
          participants_count,
          workshops_done,
          activities_done,
          solutions_count,
          trainings_done,
          note
        ) VALUES (date('now'), ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      parseOptionalNumber(body.participants_count, current.participants.value),
      parseOptionalNumber(body.workshops_done, current.workshops.value),
      parseOptionalNumber(body.activities_done, current.activities.value),
      parseOptionalNumber(body.solutions_count, current.solutions.value),
      parseOptionalNumber(body.trainings_done, current.trainings.value),
      note,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "KPI 스냅샷을 저장하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
