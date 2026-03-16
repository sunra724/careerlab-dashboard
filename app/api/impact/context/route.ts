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

    const kpi =
      (db
        .prepare(
          `
            SELECT *
            FROM kpi_snapshots
            ORDER BY snapshot_date DESC, id DESC
            LIMIT 1
          `,
        )
        .get() as ImpactContextResponse["kpi"] | undefined) ?? null;

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
            GROUP_CONCAT(
              CASE
                WHEN ta.summary IS NOT NULL AND TRIM(ta.summary) <> '' THEN ta.summary
              END,
              ' | '
            ) as activity_summaries,
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

    const photoSummary = db
      .prepare(
        `
          SELECT
            COUNT(*) as total,
            COUNT(DISTINCT CASE WHEN session_type = 'workshop' THEN session_id END) as workshop_sessions,
            COUNT(DISTINCT CASE WHEN session_type = 'activity' THEN session_id END) as activity_sessions
          FROM session_photos
        `,
      )
      .get() as {
      total: number;
      workshop_sessions: number;
      activity_sessions: number;
    };

    const recentCaptions = db
      .prepare(
        `
          SELECT caption
          FROM session_photos
          WHERE caption IS NOT NULL AND TRIM(caption) <> ''
          ORDER BY taken_at DESC, id DESC
          LIMIT 6
        `,
      )
      .all() as Array<{ caption: string }>;

    const normalizedParticipants = {
      total: Number(participants.total ?? 0),
      active: Number(participants.active ?? 0),
    };
    const normalizedTeams = teams.map((team) => ({
      ...team,
      activities_done: Number(team.activities_done ?? 0),
    }));
    const normalizedWorkshops = workshops.map((workshop) => ({
      ...workshop,
      attended_count: Number(workshop.attended_count ?? 0),
    }));
    const attendanceWorkshops = normalizedWorkshops.filter(
      (workshop) =>
        workshop.status !== "planned" ||
        Boolean(workshop.held_date) ||
        workshop.attended_count > 0,
    );
    const workshopsForAttendance =
      attendanceWorkshops.length > 0 ? attendanceWorkshops : normalizedWorkshops;
    const totalAttendance = workshopsForAttendance.reduce(
      (sum, workshop) => sum + workshop.attended_count,
      0,
    );
    const possibleAttendance =
      workshopsForAttendance.length * Math.max(normalizedParticipants.active, 1);

    return NextResponse.json({
      kpi,
      participants: normalizedParticipants,
      participantNotes,
      teams: normalizedTeams,
      workshops: normalizedWorkshops,
      solutions,
      photos: {
        total: Number(photoSummary.total ?? 0),
        workshop_sessions: Number(photoSummary.workshop_sessions ?? 0),
        activity_sessions: Number(photoSummary.activity_sessions ?? 0),
        recent_captions: recentCaptions.map((item) => item.caption),
      },
      attendanceRate:
        possibleAttendance > 0
          ? Math.round((totalAttendance / possibleAttendance) * 100)
          : 0,
      budget: 30_000_000,
      projectName: "2026년 경력보유여성 재도약 리빙랩 「배운김에 남구」",
      organization: "협동조합 소이랩 / 대구광역시 남구",
      period: "2026년 3월~6월",
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
