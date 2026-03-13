"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TeamActivityRecord } from "@/lib/types";

const STATUS_META = {
  planned: { label: "예정", tone: "amber" },
  ongoing: { label: "진행 중", tone: "blue" },
  done: { label: "완료", tone: "green" },
} as const;

export default function ActivityCell({
  activity,
  onUpdate,
}: {
  activity: TeamActivityRecord;
  onUpdate: (id: number, payload: Partial<TeamActivityRecord>) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [reportUrl, setReportUrl] = useState(activity.report_url ?? "");
  const statusMeta = STATUS_META[activity.status];

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">
            {activity.activity_no}회차
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {activity.activity_type ?? "활동 유형 미정"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <button
            onClick={() => setExpanded((prev) => !prev)}
            className="rounded-full p-1 text-slate-400 hover:bg-white hover:text-slate-600"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{activity.held_date ?? "날짜 미정"}</p>

      {expanded ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          <p className="text-sm leading-6 text-slate-600">
            {activity.summary ?? "활동 요약은 아직 등록되지 않았습니다."}
          </p>
          <p className="flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="h-4 w-4" />
            {activity.location ?? "장소 미정"}
          </p>
          {activity.report_url ? (
            <a
              href={activity.report_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-lab-blue hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              활동보고서 보기
            </a>
          ) : (
            <p className="text-sm text-slate-300">활동보고서 미등록</p>
          )}
          <input
            type="text"
            value={reportUrl}
            onChange={(event) => setReportUrl(event.target.value)}
            placeholder="활동보고서 URL 입력"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          />
          <div className="flex flex-wrap gap-2">
            {(["planned", "ongoing", "done"] as const).map((status) => (
              <Button
                key={status}
                variant={activity.status === status ? "primary" : "outline"}
                size="sm"
                onClick={() =>
                  onUpdate(activity.id, {
                    status,
                    report_url: reportUrl || null,
                  })
                }
              >
                {STATUS_META[status].label}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
