import { cn } from "@/lib/utils";

const SEGMENT_TONES = {
  navy: "bg-navy",
  blue: "bg-lab-blue",
  green: "bg-lab-green",
  red: "bg-red-500",
  violet: "bg-lab-violet",
  gray: "bg-slate-400",
} as const;

export function ProgressBar({
  value,
  max,
  tone,
  segments = 12,
  className,
}: {
  value: number;
  max: number;
  tone: keyof typeof SEGMENT_TONES;
  segments?: number;
  className?: string;
}) {
  const safeMax = max <= 0 ? 1 : max;
  const filledSegments = Math.max(
    0,
    Math.min(segments, Math.round((value / safeMax) * segments)),
  );

  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={`${tone}-${index + 1}`}
          className={cn(
            "h-2 flex-1 rounded-full",
            index < filledSegments ? SEGMENT_TONES[tone] : "bg-slate-100",
          )}
        />
      ))}
    </div>
  );
}
