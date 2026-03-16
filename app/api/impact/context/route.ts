import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { seedDatabase } from "@/lib/seed";
import type {
  ImpactContextResponse,
  ImpactParticipantNote,
  ImpactParticipantsSummary,
  ImpactSolutionContext,
  ImpactTeamContext,
  ImpactWorkshopContext,
} from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    seedDatabase();
    const db = getDb();

    const kpi = db
      .prepare(
        `
          SELECT *
          FROM kpi_snapshots
          ORDER BY snapshot_date DESC, id DESC
          LIMIT 1
        `,
      )
      .get() as ImpactContextResponse["kpi"];

    const participants = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
          FROM participants
        `,
      )
      .get() as ImpactParticipantsSummary;

    const participantNotes = db
      .prepare(
        `
          SELECT id, name, note
          FROM participants
          WHERE note IS NOT NULL AND TRIM(note) <> ''
          ORDER BY id
        `,
      )
      .all() as ImpactParticipantNote[];

    const teams = db
      .prepare(
        `
          SELECT
            t.id,
            t.name,
            t.topic,
            t.color,
            GROUP_CONCAT(ta.summary, ' | ') as activity_summaries,
            SUM(CASE WHEN ta.status = 'done' THEN 1 ELSE 0 END) as activities_done
          FROM teams t
          LEFT JOIN team_activities ta ON ta.team_id = t.id
          GROUP BY t.id
          ORDER BY t.id
        `,
      )
      .all() as ImpactTeamContext[];

    const workshops = db
      .prepare(
        `
          SELECT
            w.id,
            w.session_no,
            w.title,
            w.held_date,
            w.status,
            (
              SELECT COUNT(*)
              FROM workshop_attendance wa
              WHERE wa.session_type = 'workshop'
                AND wa.session_id = w.id
                AND wa.attended = 1
            ) as attended_count
          FROM workshops w
          ORDER BY w.session_no
        `,
      )
      .all() as ImpactWorkshopContext[];

    const solutions = db
      .prepare(
        `
          SELECT id, title, note, status
          FROM deliverables
          WHERE deliverable_type = 'problem_solution'
          ORDER BY id
        `,
      )
      .all() as ImpactSolutionContext[];

    const possibleAttendance = workshops.length * Math.max(participants.active ?? 0, 1);
    const totalAttendance = workshops.reduce(
      (sum, workshop) => sum + Number(workshop.attended_count ?? 0),
      0,
    );

    return NextResponse.json({
      kpi,
      participants: {
        total: Number(participants.total ?? 0),
        active: Number(participants.active ?? 0),
      },
      participantNotes,
      teams: teams.map((team) => ({
        ...team,
        activities_done: Number(team.activities_done ?? 0),
      })),
      workshops: workshops.map((workshop) => ({
        ...workshop,
        attended_count: Number(workshop.attended_count ?? 0),
      })),
      solutions,
      attendanceRate:
        possibleAttendance > 0
          ? Math.round((totalAttendance / possibleAttendance) * 100)
          : 0,
      budget: 30_000_000,
      projectName:
        "2026년 경력보유여성 재도약 리빙랩 「배운김에 남구」 성과·영향 분석",
      organization: "협동조합 소이랩 / 대구광역시 남구",
      period: "2026년 3월 ~ 6월",
    } satisfies ImpactContextResponse);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "영향보고서 컨텍스트를 불러오지 못했습니다.",
      },
      { status: 500 },
    );
  }
}
