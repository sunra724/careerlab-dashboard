import { getTeamMeta } from "@/lib/teams";
import { cn } from "@/lib/utils";

export default function TeamBadge({
  teamId,
  name,
}: {
  teamId: number | null;
  name: string | null;
}) {
  const meta = getTeamMeta(teamId ?? undefined);

  if (!teamId || !name) {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
        미배정
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        meta?.badgeClass ?? "bg-slate-100 text-slate-600",
      )}
    >
      {name}
    </span>
  );
}
