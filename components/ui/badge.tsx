import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/lib/types";

const TONE_CLASS: Record<BadgeTone, string> = {
  green: "bg-green-50 text-green-800 ring-1 ring-green-100",
  blue: "bg-blue-50 text-blue-800 ring-1 ring-blue-100",
  amber: "bg-amber-50 text-amber-800 ring-1 ring-amber-100",
  gray: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-1 ring-red-100",
};

export function Badge({
  tone = "gray",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
