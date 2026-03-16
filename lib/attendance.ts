import type Database from "better-sqlite3";

import type { AttendanceParticipant, AttendanceSessionType } from "@/lib/types";

export const ATTENDANCE_SESSION_TYPES = ["workshop", "activity"] as const;

export function isAttendanceSessionType(
  value: string | null | undefined,
): value is AttendanceSessionType {
  return value === "workshop" || value === "activity";
}

export function maskPhone(phone: string | null) {
  if (!phone) {
    return null;
  }

  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) {
    return null;
  }

  return `****${digits.slice(-4)}`;
}

export function getParticipantsForSession(
  db: Database.Database,
  sessionType: AttendanceSessionType,
  sessionId?: number,
) {
  if (sessionType === "activity") {
    if (typeof sessionId !== "number") {
      return [];
    }

    return db
      .prepare(
        `
          SELECT
            p.id,
            p.name,
            p.phone,
            p.team_id,
            t.name as team_name,
            t.color as team_color
          FROM participants p
          JOIN team_activities ta ON ta.team_id = p.team_id
          LEFT JOIN teams t ON t.id = p.team_id
          WHERE ta.id = ? AND p.status = 'active'
          ORDER BY p.team_id, p.id
        `,
      )
      .all(sessionId) as AttendanceParticipant[];
  }

  return db
    .prepare(
      `
        SELECT
          p.id,
          p.name,
          p.phone,
          p.team_id,
          t.name as team_name,
          t.color as team_color
        FROM participants p
        LEFT JOIN teams t ON t.id = p.team_id
        WHERE p.status = 'active'
        ORDER BY p.team_id, p.id
      `,
    )
    .all() as AttendanceParticipant[];
}
