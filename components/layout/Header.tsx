import { Badge } from "@/components/ui/badge";
import type { BadgeTone } from "@/lib/types";

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: {
    label: string;
    color?: BadgeTone;
  };
  actions?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  badge,
  actions,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 px-5 py-4 backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">{title}</h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {badge ? <Badge tone={badge.color}>{badge.label}</Badge> : null}
          {actions}
        </div>
      </div>
    </header>
  );
}
