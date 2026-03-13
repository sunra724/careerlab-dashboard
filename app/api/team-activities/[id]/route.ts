import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import type { WorkStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "status",
  "held_date",
  "location",
  "summary",
  "report_url",
  "evidence_urls",
  "activity_type",
] as const;

function normalizeField(
  field: (typeof EDITABLE_FIELDS)[number],
  value: unknown,
): string | null {
  if (field === "status") {
    const statuses: WorkStatus[] = ["planned", "ongoing", "done"];
    return typeof value === "string" && statuses.includes(value as WorkStatus)
      ? value
      : "planned";
  }

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
    const body = (await request.json()) as Record<string, unknown>;
    const fields: string[] = [];
    const values: Array<string | null> = [];

    EDITABLE_FIELDS.forEach((field) => {
      if (field in body) {
        fields.push(`${field} = ?`);
        values.push(normalizeField(field, body[field]));
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
    }

    db.prepare(`UPDATE team_activities SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values,
      Number(params.id),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "팀별 활동 정보를 수정하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
