import { getTeamMeta } from "@/lib/teams";
import type { TeamSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function TeamSummaryGrid({ teams }: { teams: TeamSummary[] }) {
  return (
    <section className="panel-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Team Summary
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">팀별 현황</h3>
        </div>
        <p className="text-sm text-slate-400">총 {teams.length}팀</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => {
          const meta = getTeamMeta(team.id);
          return (
            <article
              key={team.id}
              className={cn(
                "rounded-2xl border p-4",
                meta?.softClass ?? "bg-slate-50",
                meta?.ringClass ?? "ring-slate-200",
                "ring-1",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-semibold", meta?.textClass)}>{team.name}</p>
                <span
                  className={cn(
                    "rounded-full px-2 py-1 text-xs font-medium",
                    team.activities_done > 0
                      ? "bg-white text-slate-700"
                      : "bg-white/70 text-slate-400",
                  )}
                >
                  활동 {team.activities_done}/3
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                {team.topic ?? "현안 주제 협의 중"}
              </p>
              <p className="mt-4 text-xs text-slate-500">{team.member_count}명 참여</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
