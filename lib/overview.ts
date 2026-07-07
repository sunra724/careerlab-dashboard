import { getDb } from "@/lib/db";
import { getCurrentStage, getOverviewCounts } from "@/lib/queries";
import { seedDatabase } from "@/lib/seed";
import type { DeliverableRecord, OverviewResponse, TeamSummary } from "@/lib/types";

export function getOverviewData(): OverviewResponse {
  seedDatabase();
  const db = getDb();

  const deliverables = db
    .prepare(
      `
        SELECT id, deliverable_type, title, due_date, submitted_at, file_url, status, note
        FROM deliverables
        ORDER BY due_date
      `,
    )
    .all() as DeliverableRecord[];

  const teams = db
    .prepare(
      `
        SELECT
          t.id,
          t.name,
          t.topic,
          t.color,
          COUNT(DISTINCT p.id) as member_count,
          COALESCE(SUM(CASE WHEN ta.status = 'done' THEN 1 ELSE 0 END), 0) as activities_done
        FROM teams t
        LEFT JOIN participants p
          ON p.team_id = t.id
         AND p.status = 'active'
        LEFT JOIN team_activities ta
          ON ta.team_id = t.id
        GROUP BY t.id
        ORDER BY t.id
      `,
    )
    .all() as TeamSummary[];

  return {
    kpi: getOverviewCounts(db),
    deliverables,
    teams,
    currentStage: getCurrentStage(),
  };
}
