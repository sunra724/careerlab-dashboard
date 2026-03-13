import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type { ParticipantRecord } from "@/lib/types";

export const dynamic = "force-dynamic";

function normalizeNullableText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function GET(request: NextRequest) {
  try {
    seedDatabase();
    const db = getDb();
    const teamId = request.nextUrl.searchParams.get("team_id");

    const query = teamId
      ? `
          SELECT
            p.*,
            t.name as team_name,
            t.color as team_color
          FROM participants p
          LEFT JOIN teams t ON t.id = p.team_id
          WHERE p.team_id = ?
          ORDER BY p.team_id, p.id
        `
      : `
          SELECT
            p.*,
            t.name as team_name,
            t.color as team_color
          FROM participants p
          LEFT JOIN teams t ON t.id = p.team_id
          ORDER BY p.team_id, p.id
        `;

    const rows = teamId
      ? (db.prepare(query).all(Number(teamId)) as ParticipantRecord[])
      : (db.prepare(query).all() as ParticipantRecord[]);

    return NextResponse.json(rows);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "참여자 목록을 불러오지 못했습니다.",
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
    const name = normalizeNullableText(body.name);

    if (!name) {
      return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
    }

    const teamId =
      typeof body.team_id === "number" && Number.isFinite(body.team_id)
        ? body.team_id
        : null;
    const result = db
      .prepare(
        `
          INSERT INTO participants (
            name,
            phone,
            email,
            team_id,
            role,
            note,
            joined_at
          )
          VALUES (?, ?, ?, ?, ?, ?, date('now'))
        `,
      )
      .run(
        name,
        normalizeNullableText(body.phone),
        normalizeNullableText(body.email),
        teamId,
        "participant",
        normalizeNullableText(body.note),
      );

    return NextResponse.json({
      id: Number(result.lastInsertRowid),
      ok: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "참여자를 추가하지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
