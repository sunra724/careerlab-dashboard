"use client";

import useSWR from "swr";

import Header from "@/components/layout/Header";
import { ProgressBar } from "@/components/ui/progress-bar";
import WorkshopCard from "@/components/workshops/WorkshopCard";
import { fetchJson } from "@/lib/fetcher";
import type { WorkshopRecord } from "@/lib/types";

export default function WorkshopsPage() {
  const { data, mutate } = useSWR<WorkshopRecord[]>(
    "/api/workshops",
    (url: string) => fetchJson<WorkshopRecord[]>(url),
  );

  const workshops = data ?? [];
  const doneCount = workshops.filter((workshop) => workshop.status === "done").length;

  async function handleUpdate(id: number, payload: Partial<WorkshopRecord>) {
    await fetch(`/api/workshops/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="워크숍 관리"
        subtitle="5회차 통합 워크숍 운영 현황"
        badge={{ label: `${doneCount}/5회 완료`, color: doneCount === 5 ? "green" : "amber" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="panel-surface p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Workshop Progress
              </p>
              <h3 className="mt-1 text-sm font-semibold text-ink">전체 진행률</h3>
            </div>
            <p className="text-sm text-slate-500">{doneCount}/5 회차 완료</p>
          </div>
          <ProgressBar value={doneCount} max={5} tone="blue" segments={5} className="mt-4" />
        </section>

        <div className="mt-4 space-y-4">
          {workshops.map((workshop) => (
            <WorkshopCard
              key={workshop.id}
              workshop={workshop}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
