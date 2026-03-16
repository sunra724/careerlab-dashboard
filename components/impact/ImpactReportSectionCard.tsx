"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function ImpactReportSectionCard({
  title,
  content,
  error,
  isGenerating,
  isOpen,
  onGenerate,
  onToggle,
  prepend,
}: {
  title: string;
  content: string;
  error?: string;
  isGenerating: boolean;
  isOpen: boolean;
  onGenerate: () => void;
  onToggle: () => void;
  prepend?: ReactNode;
}) {
  const hasContent = content.trim().length > 0;
  const shouldRenderBody = isOpen || isGenerating || hasContent || Boolean(error);

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div
        className="no-print flex cursor-pointer items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50"
        onClick={onToggle}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={[
              "h-2.5 w-2.5 rounded-full",
              error
                ? "bg-red-500"
                : isGenerating
                  ? "animate-pulse bg-lab-blue"
                  : hasContent
                    ? "bg-lab-green"
                    : "bg-slate-300",
            ].join(" ")}
          />
          <h2 className="truncate text-sm font-semibold text-ink">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl"
            onClick={(event) => {
              event.stopPropagation();
              onGenerate();
            }}
            size="sm"
            variant="outline"
          >
            {isGenerating ? "생성 중..." : hasContent ? "재생성" : "생성"}
          </Button>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {shouldRenderBody ? (
        <div className="border-t border-slate-100 px-5 py-5">
          {prepend}
          {error ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          {hasContent ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
              {content}
            </p>
          ) : isGenerating ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-lab-blue border-t-transparent" />
              AI가 섹션 초안을 작성하고 있습니다.
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              생성 버튼을 누르면 이 섹션 초안이 스트리밍으로 작성됩니다.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}
