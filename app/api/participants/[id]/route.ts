import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import type { ParticipantRole, ParticipantStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const EDITABLE_FIELDS = [
  "name",
  "phone",
  "email",
  "team_id",
  "role",
  "status",
  "note",
] as const;

function normalizeField(
  field: (typeof EDITABLE_FIELDS)[number],
  value: unknown,
): string | number | null {
  if (field === "team_id") {
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  }

  if (field === "role") {
    const roles: ParticipantRole[] = ["participant", "facilitator", "coordinator"];
    return typeof value === "string" && roles.includes(value as ParticipantRole)
      ? value
      : "participant";
  }

  if (field === "status") {
    const statuses: ParticipantStatus[] = ["active", "withdrawn"];
    return typeof value === "string" && statuses.includes(value as ParticipantStatus)
      ? value
      : "active";
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
    const values: Array<string | number | null> = [];

    EDITABLE_FIELDS.forEach((field) => {
      if (field in body) {
        fields.push(`${field} = ?`);
        values.push(normalizeField(field, body[field]));
      }
    });

    if (fields.length === 0) {
      return NextResponse.json({ error: "수정할 항목이 없습니다." }, { status: 400 });
    }

    db.prepare(`UPDATE participants SET ${fields.join(", ")} WHERE id = ?`).run(
      ...values,
      Number(params.id),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "참여자 정보를 수정하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = getDb();
    db.prepare("UPDATE participants SET status = 'withdrawn' WHERE id = ?").run(
      Number(params.id),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "참여자 상태를 변경하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
