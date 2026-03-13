import { Badge } from "@/components/ui/badge";
import { calculateDday } from "@/lib/format";
import type { DeliverableRecord } from "@/lib/types";

export default function DeliverableStatusCard({
  deliverables,
}: {
  deliverables: DeliverableRecord[];
}) {
  const submittedCount = deliverables.filter((item) =>
    ["submitted", "approved"].includes(item.status),
  ).length;

  return (
    <section className="panel-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Deliverables
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">산출물 제출 현황</h3>
        </div>
        <Badge tone={submittedCount === deliverables.length ? "green" : "amber"}>
          {submittedCount}/{deliverables.length} 제출
        </Badge>
      </div>
      <div className="space-y-2">
        {deliverables.map((item) => {
          const dday = calculateDday(item.due_date, item.status);
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700">{item.title}</p>
                <p className="mt-1 text-xs text-slate-400">{item.due_date} 마감</p>
              </div>
              <Badge tone={dday.tone}>{dday.label}</Badge>
            </div>
          );
        })}
      </div>
    </section>
  );
}
