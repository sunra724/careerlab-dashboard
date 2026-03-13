"use client";

import { useState } from "react";
import useSWR from "swr";

import KpiGauge from "@/components/kpi/KpiGauge";
import KpiRadarChart from "@/components/kpi/KpiRadarChart";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetcher";
import type { KpiResponse } from "@/lib/types";

const KPI_META = {
  participants: { tone: "navy", subject: "참여자" },
  workshops: { tone: "blue", subject: "워크숍" },
  activities: { tone: "green", subject: "팀활동" },
  solutions: { tone: "red", subject: "솔루션" },
  trainings: { tone: "violet", subject: "역량교육" },
} as const;

export default function KpiPage() {
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { data, mutate } = useSWR<KpiResponse>(
    "/api/kpi",
    (url: string) => fetchJson<KpiResponse>(url),
  );

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        KPI 데이터를 불러오는 중입니다...
      </div>
    );
  }

  const gauges = Object.entries(data.current) as Array<
    [keyof typeof KPI_META, (typeof data.current)[keyof typeof data.current]]
  >;
  const overall = Math.round(
    gauges.reduce(
      (sum, [, metric]) => sum + (metric.value / Math.max(metric.target, 1)) * 100,
      0,
    ) / gauges.length,
  );
  const radarData = gauges.map(([key, metric]) => ({
    subject: KPI_META[key].subject,
    value: Math.min(Math.round((metric.value / Math.max(metric.target, 1)) * 100), 100),
    fullMark: 100,
  }));

  async function saveSnapshot() {
    setIsSaving(true);
    await fetch("/api/kpi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setNote("");
    setIsSaving(false);
    await mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="성과 지표"
        subtitle={`전체 달성률 ${overall}%`}
        badge={{ label: `${overall}%`, color: overall >= 80 ? "green" : overall >= 50 ? "blue" : "amber" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="grid gap-4 xl:grid-cols-5">
          {gauges.map(([key, metric]) => (
            <KpiGauge
              key={key}
              label={metric.label}
              value={metric.value}
              target={metric.target}
              tone={KPI_META[key].tone}
            />
          ))}
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <KpiRadarChart data={radarData} />
          <section className="panel-surface p-4">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                KPI Targets
              </p>
              <h3 className="mt-1 text-sm font-semibold text-ink">
                성과 지표 목표 (과업지시서)
              </h3>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">구분</th>
                  <th className="pb-2 font-medium">지표</th>
                  <th className="pb-2 text-right font-medium">목표</th>
                  <th className="pb-2 text-right font-medium">현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gauges.map(([key, metric]) => (
                  <tr key={key}>
                    <td className="py-2 text-xs text-slate-400">정량</td>
                    <td className="py-2 text-slate-700">{metric.label}</td>
                    <td className="py-2 text-right text-slate-500">{metric.target}</td>
                    <td className="py-2 text-right font-semibold text-ink">{metric.value}</td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 text-xs text-slate-400">정성</td>
                  <td className="py-2 text-slate-700">참여자 역량 강화</td>
                  <td className="py-2 text-right text-slate-500">설문/인터뷰</td>
                  <td className="py-2 text-right text-slate-400">진행 중</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="panel-surface p-4">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Snapshot
              </p>
              <h3 className="mt-1 text-sm font-semibold text-ink">현재 KPI 저장</h3>
            </div>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="스냅샷 메모를 입력하세요"
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={saveSnapshot} disabled={isSaving}>
                {isSaving ? "저장 중..." : "현재 현황 저장"}
              </Button>
            </div>
          </section>

          <section className="panel-surface p-4">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Recent Snapshots
              </p>
              <h3 className="mt-1 text-sm font-semibold text-ink">최근 저장 이력</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                  <tr>
                    <th className="pb-2 font-medium">날짜</th>
                    <th className="pb-2 font-medium">참여자</th>
                    <th className="pb-2 font-medium">워크숍</th>
                    <th className="pb-2 font-medium">활동</th>
                    <th className="pb-2 font-medium">솔루션</th>
                    <th className="pb-2 font-medium">교육</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.snapshots.map((snapshot) => (
                    <tr key={snapshot.id}>
                      <td className="py-2 text-slate-700">
                        <p>{snapshot.snapshot_date}</p>
                        {snapshot.note ? (
                          <p className="mt-1 text-xs text-slate-400">{snapshot.note}</p>
                        ) : null}
                      </td>
                      <td className="py-2 text-slate-500">{snapshot.participants_count}</td>
                      <td className="py-2 text-slate-500">{snapshot.workshops_done}</td>
                      <td className="py-2 text-slate-500">{snapshot.activities_done}</td>
                      <td className="py-2 text-slate-500">{snapshot.solutions_count}</td>
                      <td className="py-2 text-slate-500">{snapshot.trainings_done}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
