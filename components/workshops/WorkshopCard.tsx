"use client";

import { useState } from "react";
import { ExternalLink, FileText, PencilLine } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { WorkshopRecord } from "@/lib/types";

const STATUS_META = {
  planned: { label: "예정", tone: "amber" },
  ongoing: { label: "진행 중", tone: "blue" },
  done: { label: "완료", tone: "green" },
} as const;

export default function WorkshopCard({
  workshop,
  onUpdate,
}: {
  workshop: WorkshopRecord;
  onUpdate: (id: number, payload: Partial<WorkshopRecord>) => Promise<void>;
}) {
  const [isEditingLinks, setIsEditingLinks] = useState(false);
  const [planUrl, setPlanUrl] = useState(workshop.plan_doc_url ?? "");
  const [resultUrl, setResultUrl] = useState(workshop.result_doc_url ?? "");
  const statusMeta = STATUS_META[workshop.status];

  async function saveLinks() {
    await onUpdate(workshop.id, {
      plan_doc_url: planUrl || null,
      result_doc_url: resultUrl || null,
    });
    setIsEditingLinks(false);
  }

  return (
    <article className="panel-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-semibold text-white">
              {workshop.session_no}
            </span>
            <div>
              <h3 className="text-base font-semibold text-ink">{workshop.title}</h3>
              <p className="mt-1 text-sm text-slate-500">
                {workshop.held_date ?? "날짜 미정"} · {workshop.location ?? "장소 미정"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2 pl-12 text-sm text-slate-500">
            <p>퍼실리테이터: {workshop.facilitator ?? "미정"}</p>
            <p>
              출석 현황: {workshop.attended_count}/{workshop.total_invited}명
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {workshop.plan_doc_url ? (
                <a
                  href={workshop.plan_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-lab-blue hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  운영계획서
                </a>
              ) : (
                <span className="text-sm text-slate-300">운영계획서 미등록</span>
              )}
              {workshop.result_doc_url ? (
                <a
                  href={workshop.result_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-lab-green hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  결과보고서
                </a>
              ) : (
                <span className="text-sm text-slate-300">결과보고서 미등록</span>
              )}
              <button
                onClick={() => setIsEditingLinks((prev) => !prev)}
                className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
              >
                <PencilLine className="h-4 w-4" />
                링크 관리
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
          <div className="flex flex-wrap gap-2">
            {(["planned", "ongoing", "done"] as const).map((status) => (
              <Button
                key={status}
                variant={workshop.status === status ? "primary" : "outline"}
                size="sm"
                onClick={() => onUpdate(workshop.id, { status })}
              >
                {STATUS_META[status].label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {isEditingLinks ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              운영계획서
            </p>
            <input
              type="text"
              value={planUrl}
              onChange={(event) => setPlanUrl(event.target.value)}
              placeholder="링크 입력"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              결과보고서
            </p>
            <input
              type="text"
              value={resultUrl}
              onChange={(event) => setResultUrl(event.target.value)}
              placeholder="링크 입력"
              className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditingLinks(false)}>
              취소
            </Button>
            <Button size="sm" onClick={saveLinks}>
              링크 저장
            </Button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
