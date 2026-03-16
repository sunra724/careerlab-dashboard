"use client";

import { useState } from "react";
import {
  ExternalLink,
  FileText,
  PencilLine,
  QrCode,
  Users,
} from "lucide-react";

import AttendancePanel from "@/components/attendance/AttendancePanel";
import QrModal from "@/components/attendance/QrModal";
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
  const [showAttendance, setShowAttendance] = useState(false);
  const [showQr, setShowQr] = useState(false);
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
            <p>출석 현황: {workshop.attended_count}/{workshop.total_invited}명</p>
            <div className="flex flex-wrap items-center gap-2">
              {workshop.plan_doc_url ? (
                <a className="inline-flex items-center gap-1 text-lab-blue hover:underline" href={workshop.plan_doc_url} rel="noreferrer" target="_blank">
                  <FileText className="h-4 w-4" />
                  운영계획서
                </a>
              ) : (
                <span className="text-slate-300">운영계획서 미등록</span>
              )}
              {workshop.result_doc_url ? (
                <a className="inline-flex items-center gap-1 text-lab-green hover:underline" href={workshop.result_doc_url} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                  결과보고서
                </a>
              ) : (
                <span className="text-slate-300">결과보고서 미등록</span>
              )}
              <button className="inline-flex items-center gap-1 text-slate-400 hover:text-slate-600" onClick={() => setIsEditingLinks((prev) => !prev)}>
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
              <Button key={status} onClick={() => onUpdate(workshop.id, { status })} size="sm" variant={workshop.status === status ? "primary" : "outline"}>
                {STATUS_META[status].label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 pl-12">
        <Button onClick={() => setShowQr(true)} size="sm" variant="ghost">
          <QrCode className="mr-1 h-4 w-4" />
          QR 출석
        </Button>
        <Button onClick={() => setShowAttendance((prev) => !prev)} size="sm" variant="ghost">
          <Users className="mr-1 h-4 w-4" />
          출석 현황
        </Button>
      </div>

      {showAttendance ? (
        <div className="mt-4 border-t border-slate-100 pt-4 pl-12">
          <AttendancePanel sessionId={workshop.id} sessionType="workshop" />
        </div>
      ) : null}

      {isEditingLinks ? (
        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 md:grid-cols-2">
          <input className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10" onChange={(event) => setPlanUrl(event.target.value)} placeholder="운영계획서 링크" type="text" value={planUrl} />
          <input className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10" onChange={(event) => setResultUrl(event.target.value)} placeholder="결과보고서 링크" type="text" value={resultUrl} />
          <div className="md:col-span-2 flex justify-end gap-2">
            <Button onClick={() => setIsEditingLinks(false)} size="sm" variant="outline">취소</Button>
            <Button onClick={saveLinks} size="sm">링크 저장</Button>
          </div>
        </div>
      ) : null}

      {showQr ? (
        <QrModal
          onClose={() => setShowQr(false)}
          sessionId={workshop.id}
          sessionTitle={workshop.title}
          sessionType="workshop"
        />
      ) : null}
    </article>
  );
}
