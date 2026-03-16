"use client";

import { useEffect, useMemo, useState } from "react";
import { Printer, RefreshCw } from "lucide-react";

import ImpactReportCover from "@/components/impact/ImpactReportCover";
import ImpactReportSectionCard from "@/components/impact/ImpactReportSectionCard";
import SroiBreakdownTable from "@/components/impact/SroiBreakdownTable";
import SroiInputPanel from "@/components/impact/SroiInputPanel";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { IMPACT_REPORT_SECTIONS } from "@/lib/impact-report";
import { fetchJson } from "@/lib/fetcher";
import type { SroiInput } from "@/lib/sroi";
import type { ImpactContextResponse, ImpactSectionKey } from "@/lib/types";

const DEFAULT_SROI_INPUT: SroiInput = {
  totalBudget: 30_000_000,
  participantsCount: 30,
  teamsCount: 6,
  solutionsCount: 6,
  solutionsAdopted: 0,
  attributionRate: 0.15,
  deadweightRate: 0.2,
  dropOffRate: 0.1,
};

export default function ImpactReportPage() {
  const [context, setContext] = useState<ImpactContextResponse | null>(null);
  const [sroiInput, setSroiInput] = useState<SroiInput>(DEFAULT_SROI_INPUT);
  const [generated, setGenerated] = useState<Partial<Record<ImpactSectionKey, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<ImpactSectionKey, string>>>({});
  const [activeSection, setActiveSection] = useState<ImpactSectionKey | null>(null);
  const [generating, setGenerating] = useState<ImpactSectionKey | null>(null);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  useEffect(() => {
    fetchJson<ImpactContextResponse>("/api/impact/context")
      .then((data) => {
        setContext(data);
        setSroiInput((prev) => ({
          ...prev,
          totalBudget: data.budget,
          participantsCount: data.participants.active,
          teamsCount: data.teams.length,
          solutionsCount: data.solutions.length,
        }));
      })
      .catch(() => undefined);
  }, []);

  const generatedCount = useMemo(
    () => IMPACT_REPORT_SECTIONS.filter((section) => generated[section.key]?.trim()).length,
    [generated],
  );

  async function generateSection(sectionKey: ImpactSectionKey) {
    if (!context) return;
    setGenerating(sectionKey);
    setActiveSection(sectionKey);
    setErrors((prev) => ({ ...prev, [sectionKey]: "" }));
    setGenerated((prev) => ({ ...prev, [sectionKey]: "" }));

    try {
      const response = await fetch("/api/impact/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, sroiInput, section: sectionKey }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "섹션 생성에 실패했습니다.");
      }

      if (!response.body) {
        throw new Error("스트리밍 응답을 받지 못했습니다.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setGenerated((prev) => ({
          ...prev,
          [sectionKey]: `${prev[sectionKey] ?? ""}${chunk}`,
        }));
      }
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        [sectionKey]:
          error instanceof Error ? error.message : "섹션 생성 중 오류가 발생했습니다.",
      }));
    } finally {
      setGenerating(null);
    }
  }

  async function generateAll() {
    setIsGeneratingAll(true);
    for (const section of IMPACT_REPORT_SECTIONS) {
      await generateSection(section.key);
    }
    setIsGeneratingAll(false);
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 32px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="flex min-h-screen flex-col">
        <Header
          actions={
            <div className="flex flex-wrap justify-end gap-2">
              <Button disabled={!context || isGeneratingAll} onClick={generateAll} size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingAll ? "animate-spin" : ""}`} />
                {isGeneratingAll ? "전체 생성 중..." : "전체 보고서 생성"}
              </Button>
              <Button disabled={generatedCount < IMPACT_REPORT_SECTIONS.length} onClick={() => window.print()} size="sm" variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                PDF 인쇄
              </Button>
            </div>
          }
          badge={{ label: `${generatedCount}/${IMPACT_REPORT_SECTIONS.length} 섹션 완료`, color: generatedCount === IMPACT_REPORT_SECTIONS.length ? "green" : "blue" }}
          subtitle="SROI, 정책부합성, 확장가능성을 결합한 AI 기반 영향보고서 생성"
          title="영향보고서 생성기"
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <aside className="no-print hidden w-[320px] shrink-0 overflow-y-auto border-r border-slate-200 bg-slate-50 px-4 py-5 xl:block">
            {context ? <SroiInputPanel input={sroiInput} onChange={setSroiInput} /> : <div className="panel-surface p-6 text-center text-sm text-slate-400">보고서 컨텍스트를 불러오는 중입니다.</div>}
          </aside>
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            <div className="mx-auto max-w-5xl space-y-4" id="print-area">
              <div className="no-print xl:hidden">
                {context ? (
                  <SroiInputPanel input={sroiInput} onChange={setSroiInput} />
                ) : (
                  <div className="panel-surface p-6 text-center text-sm text-slate-400">
                    보고서 컨텍스트를 불러오는 중입니다.
                  </div>
                )}
              </div>
              {context ? <ImpactReportCover context={context} input={sroiInput} /> : <div className="panel-surface p-8 text-center text-sm text-slate-400">보고서 데이터를 준비하는 중입니다.</div>}
              {IMPACT_REPORT_SECTIONS.map((section) => (
                <ImpactReportSectionCard
                  content={generated[section.key] ?? ""}
                  error={errors[section.key]}
                  isGenerating={generating === section.key}
                  isOpen={activeSection === section.key}
                  key={section.key}
                  onGenerate={() => void generateSection(section.key)}
                  onToggle={() => setActiveSection((prev) => (prev === section.key ? null : section.key))}
                  prepend={section.key === "sroi" ? <SroiBreakdownTable input={sroiInput} /> : undefined}
                  title={section.title}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
