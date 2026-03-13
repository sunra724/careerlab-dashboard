import { cn } from "@/lib/utils";

const TONE_META = {
  navy: { stroke: "#46549C", textClass: "text-navy" },
  blue: { stroke: "#248DAC", textClass: "text-lab-blue" },
  green: { stroke: "#228D7B", textClass: "text-lab-green" },
  red: { stroke: "#DC2626", textClass: "text-red-600" },
  violet: { stroke: "#7C5CBF", textClass: "text-lab-violet" },
} as const;

export default function KpiGauge({
  label,
  value,
  target,
  unit = "",
  tone,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  tone: keyof typeof TONE_META;
}) {
  const safeTarget = Math.max(target, 1);
  const percentage = Math.min(Math.round((value / safeTarget) * 100), 100);
  const radius = 34;
  const center = 48;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);

  return (
    <article className="panel-surface flex flex-col items-center p-4">
      <svg viewBox="0 0 96 96" className="h-24 w-24">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="8"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={TONE_META[tone].stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
        <text
          x={center}
          y={center - 4}
          textAnchor="middle"
          fontSize="18"
          fontWeight="700"
          fill={TONE_META[tone].stroke}
        >
          {value}
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          fontSize="10"
          fill="#94A3B8"
        >
          / {target}
          {unit}
        </text>
      </svg>
      <p className="mt-2 text-center text-sm font-medium text-slate-600">{label}</p>
      <p className={cn("mt-1 text-xs font-semibold", TONE_META[tone].textClass)}>
        달성률 {percentage}%
      </p>
    </article>
  );
}
