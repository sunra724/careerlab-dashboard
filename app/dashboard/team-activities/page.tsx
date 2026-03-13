"use client";

import useSWR from "swr";

import Header from "@/components/layout/Header";
import ActivityMatrix from "@/components/team-activities/ActivityMatrix";
import { fetchJson } from "@/lib/fetcher";
import type { TeamActivityRecord } from "@/lib/types";

const LABELS = {
  planned: "예정",
  ongoing: "진행 중",
  done: "완료",
} as const;

const VALUE_CLASS = {
  planned: "text-amber-700",
  ongoing: "text-lab-blue",
  done: "text-lab-green",
} as const;

export default function TeamActivitiesPage() {
  const { data, mutate } = useSWR<TeamActivityRecord[]>(
    "/api/team-activities",
    (url: string) => fetchJson<TeamActivityRecord[]>(url),
  );

  const activities = data ?? [];
  const doneCount = activities.filter((activity) => activity.status === "done").length;

  async function handleUpdate(id: number, payload: Partial<TeamActivityRecord>) {
    await fetch(`/api/team-activities/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="팀별 활동"
        subtitle={`6팀 × 3회 = 총 18건 · ${doneCount}건 완료`}
        badge={{ label: `${doneCount}/18건`, color: doneCount === 18 ? "green" : "blue" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="grid gap-3 md:grid-cols-3">
          {(["planned", "ongoing", "done"] as const).map((status) => {
            const count = activities.filter((activity) => activity.status === status).length;
            return (
              <article key={status} className="panel-surface p-4 text-center">
                <p className="text-sm text-slate-500">{LABELS[status]}</p>
                <p className={`mt-2 text-3xl font-semibold ${VALUE_CLASS[status]}`}>{count}</p>
                <p className="mt-1 text-xs text-slate-400">건</p>
              </article>
            );
          })}
        </div>

        <div className="mt-4">
          <ActivityMatrix activities={activities} onUpdate={handleUpdate} />
        </div>
      </div>
    </div>
  );
}
