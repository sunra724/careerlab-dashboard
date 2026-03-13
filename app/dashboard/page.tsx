"use client";

import useSWR from "swr";

import DeliverableStatusCard from "@/components/dashboard/DeliverableStatusCard";
import KpiCard from "@/components/dashboard/KpiCard";
import TeamSummaryGrid from "@/components/dashboard/TeamSummaryGrid";
import TimelineCard from "@/components/dashboard/TimelineCard";
import Header from "@/components/layout/Header";
import { fetchJson } from "@/lib/fetcher";
import type { OverviewResponse } from "@/lib/types";

const KPI_ITEMS = [
  { key: "participantsCount", label: "참여자 모집", target: 30, unit: "명", tone: "navy" },
  { key: "workshopsDone", label: "워크숍 운영", target: 5, unit: "회", tone: "blue" },
  { key: "activitiesDone", label: "팀별 활동", target: 18, unit: "건", tone: "green" },
  { key: "solutionsCount", label: "솔루션 제안", target: 6, unit: "식", tone: "red" },
] as const;

export default function DashboardPage() {
  const { data } = useSWR<OverviewResponse>(
    "/api/overview",
    (url: string) => fetchJson<OverviewResponse>(url),
  );

  if (!data) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
        대시보드 데이터를 불러오는 중입니다...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="개요 대시보드"
        subtitle="2026년 경력보유여성 재도약 리빙랩 「배운김에 남구」"
        badge={{ label: "모집·선발 단계", color: "green" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <div className="grid gap-4 xl:grid-cols-4">
          {KPI_ITEMS.map((item) => (
            <KpiCard
              key={item.key}
              label={item.label}
              current={data.kpi[item.key]}
              target={item.target}
              unit={item.unit}
              tone={item.tone}
            />
          ))}
        </div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <TimelineCard currentStage={data.currentStage} />
          <DeliverableStatusCard deliverables={data.deliverables} />
        </div>
        <div className="mt-4">
          <TeamSummaryGrid teams={data.teams} />
        </div>
      </div>
    </div>
  );
}
