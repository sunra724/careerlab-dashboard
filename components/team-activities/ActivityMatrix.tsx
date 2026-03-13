import { getTeamMeta } from "@/lib/teams";
import type { TeamActivityRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

import ActivityCell from "./ActivityCell";

export default function ActivityMatrix({
  activities,
  onUpdate,
}: {
  activities: TeamActivityRecord[];
  onUpdate: (id: number, payload: Partial<TeamActivityRecord>) => Promise<void>;
}) {
  const grouped = activities.reduce<Record<number, TeamActivityRecord[]>>((acc, activity) => {
    if (!acc[activity.team_id]) {
      acc[activity.team_id] = [];
    }
    acc[activity.team_id].push(activity);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([teamId, teamActivities]) => {
          const meta = getTeamMeta(Number(teamId));
          const sortedActivities = [...teamActivities].sort(
            (left, right) => left.activity_no - right.activity_no,
          );
          return (
            <section key={teamId} className="panel-surface p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className={cn("text-base font-semibold", meta?.textClass)}>
                    {sortedActivities[0]?.team_name}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">3회 활동 로드맵</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    meta?.badgeClass ?? "bg-slate-100 text-slate-600",
                  )}
                >
                  {sortedActivities.filter((activity) => activity.status === "done").length}/3 완료
                </span>
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                {sortedActivities.map((activity) => (
                  <ActivityCell
                    key={activity.id}
                    activity={activity}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}
