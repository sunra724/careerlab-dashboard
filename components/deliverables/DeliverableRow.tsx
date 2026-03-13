"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { calculateDday } from "@/lib/format";
import type { DeliverableRecord } from "@/lib/types";

const TYPE_ICON: Record<string, string> = {
  plan: "계획",
  workshop_plan: "운영",
  workshop_result: "결과",
  activity_report: "활동",
  problem_solution: "솔루션",
  photo_record: "기록",
  final_report: "최종",
};

export default function DeliverableRow({
  item,
  onUpdate,
}: {
  item: DeliverableRecord;
  onUpdate: (id: number, payload: Partial<DeliverableRecord>) => Promise<void>;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [urlInput, setUrlInput] = useState(item.file_url ?? "");
  const dday = calculateDday(item.due_date, item.status);
  const isSubmitted = item.status === "submitted" || item.status === "approved";

  async function saveUrl() {
    await onUpdate(item.id, { file_url: urlInput || null });
    setIsEditing(false);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            {TYPE_ICON[item.deliverable_type] ?? "문서"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-xs text-slate-400">마감: {item.due_date}</p>
            {item.submitted_at ? (
              <p className="mt-1 text-xs text-lab-green">제출: {item.submitted_at}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isEditing ? (
          <>
            <input
              type="text"
              value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              placeholder="파일 URL 입력"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10 md:w-72"
            />
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              취소
            </Button>
            <Button size="sm" onClick={saveUrl}>
              저장
            </Button>
          </>
        ) : (
          <>
            {item.file_url ? (
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-lab-blue hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                파일 보기
              </a>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600"
              >
                <Link2 className="h-4 w-4" />
                URL 등록
              </button>
            )}
            <Badge tone={dday.tone}>{dday.label}</Badge>
            {isSubmitted ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdate(item.id, { status: "pending", submitted_at: null })}
              >
                되돌리기
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => onUpdate(item.id, { status: "submitted" })}
              >
                <CheckCircle2 className="mr-1 h-4 w-4" />
                제출 완료
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
