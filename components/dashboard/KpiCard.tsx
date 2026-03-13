import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/utils";

const TONE_CLASS = {
  navy: "text-navy",
  blue: "text-lab-blue",
  green: "text-lab-green",
  red: "text-red-600",
  violet: "text-lab-violet",
} as const;

export default function KpiCard({
  label,
  current,
  target,
  unit,
  tone,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  tone: keyof typeof TONE_CLASS;
}) {
  const percentage = Math.min(Math.round((current / Math.max(target, 1)) * 100), 100);

  return (
    <article className="panel-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            KPI
          </p>
          <h3 className="mt-2 text-sm font-semibold text-ink">{label}</h3>
        </div>
        <p className={cn("text-sm font-semibold", TONE_CLASS[tone])}>{percentage}%</p>
      </div>
      <p className="mt-4 text-3xl font-semibold text-ink">
        {current}
        <span className="ml-1 text-sm font-normal text-slate-400">
          / {target}
          {unit}
        </span>
      </p>
      <ProgressBar value={current} max={target} tone={tone} className="mt-4" />
      <p className="mt-2 text-xs text-slate-400">달성률 {percentage}%</p>
    </article>
  );
}
