"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import useSWR from "swr";

import DeliverableRow from "@/components/deliverables/DeliverableRow";
import Header from "@/components/layout/Header";
import { ProgressBar } from "@/components/ui/progress-bar";
import { fetchJson } from "@/lib/fetcher";
import type { DeliverableRecord } from "@/lib/types";

export default function DeliverablesPage() {
  const { data, mutate } = useSWR<DeliverableRecord[]>(
    "/api/deliverables",
    (url: string) => fetchJson<DeliverableRecord[]>(url),
  );

  const deliverables = data ?? [];
  const submittedCount = deliverables.filter((item) =>
    ["submitted", "approved"].includes(item.status),
  ).length;
  const urgentItems = deliverables.filter((item) => {
    if (item.status === "submitted" || item.status === "approved") {
      return false;
    }
    return differenceInCalendarDays(parseISO(item.due_date), new Date()) <= 14;
  });

  async function handleUpdate(id: number, payload: Partial<DeliverableRecord>) {
    await fetch(`/api/deliverables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="산출물 관리"
        subtitle={`총 7종 · ${submittedCount}종 제출 완료`}
        badge={{ label: `${submittedCount}/7 제출`, color: submittedCount === 7 ? "green" : "blue" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="panel-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Submission Progress
              </p>
              <h3 className="mt-1 text-sm font-semibold text-ink">제출 현황</h3>
            </div>
            <p className="text-sm text-slate-500">{submittedCount} / 7</p>
          </div>
          <ProgressBar value={submittedCount} max={7} tone="green" segments={7} className="mt-4" />
        </section>

        {urgentItems.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
            <p className="text-sm font-semibold text-amber-800">마감 임박 산출물</p>
            <div className="mt-3 space-y-1 text-sm text-amber-700">
              {urgentItems.map((item) => (
                <p key={item.id}>
                  {item.title} · {item.due_date}
                </p>
              ))}
            </div>
          </section>
        ) : null}

        <section className="panel-surface mt-4 overflow-hidden">
          {deliverables.map((item) => (
            <DeliverableRow key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
        </section>
      </div>
    </div>
  );
}
