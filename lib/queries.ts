import type Database from "better-sqlite3";

import type { KpiResponse, OverviewResponse } from "@/lib/types";

function readCount(
  db: Database.Database,
  query: string,
  ...params: Array<string | number>
) {
  const row = db.prepare(query).get(...params) as { count: number };
  return Number(row.count ?? 0);
}

export function getOverviewCounts(
  db: Database.Database,
): OverviewResponse["kpi"] {
  return {
    participantsCount: readCount(
      db,
      "SELECT COUNT(*) as count FROM participants WHERE status = 'active'",
    ),
    workshopsDone: readCount(
      db,
      "SELECT COUNT(*) as count FROM workshops WHERE status = 'done'",
    ),
    activitiesDone: readCount(
      db,
      "SELECT COUNT(*) as count FROM team_activities WHERE status = 'done'",
    ),
    solutionsCount: readCount(
      db,
      "SELECT COUNT(*) as count FROM team_activities WHERE activity_no = 3 AND status = 'done'",
    ),
  };
}

export function getCurrentKpiMetrics(
  db: Database.Database,
): KpiResponse["current"] {
  const workshopTrainingsDone = readCount(
    db,
    "SELECT COUNT(*) as count FROM workshops WHERE session_no IN (1, 2) AND status = 'done'",
  );
  const completedRounds = readCount(
    db,
    `
      SELECT COUNT(*) as count FROM (
        SELECT activity_no
        FROM team_activities
        WHERE status = 'done'
        GROUP BY activity_no
        HAVING COUNT(DISTINCT team_id) = 6
      )
    `,
  );
  const overview = getOverviewCounts(db);

  return {
    participants: {
      value: overview.participantsCount,
      target: 30,
      label: "참여자 모집",
    },
    workshops: {
      value: overview.workshopsDone,
      target: 5,
      label: "워크숍 운영 횟수",
    },
    activities: {
      value: completedRounds,
      target: 3,
      label: "팀별 활동 라운드",
    },
    solutions: {
      value: overview.solutionsCount,
      target: 6,
      label: "문제정의·솔루션 제안",
    },
    trainings: {
      value: workshopTrainingsDone,
      target: 2,
      label: "역량강화 교육 횟수",
    },
  };
}

export function getCurrentStage(now = new Date()) {
  if (now < new Date("2026-04-08")) {
    return "recruit";
  }
  if (now < new Date("2026-04-14")) {
    return "ws12";
  }
  if (now < new Date("2026-05-04")) {
    return "mid";
  }
  if (now < new Date("2026-05-18")) {
    return "ws5";
  }
  return "report";
}
