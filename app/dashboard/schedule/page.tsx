import { differenceInCalendarDays, parseISO } from "date-fns";

import Header from "@/components/layout/Header";
import GanttChart from "@/components/schedule/GanttChart";
import { Badge } from "@/components/ui/badge";

const MILESTONES = [
  { date: "2026-04-20", label: "사업수행계획서 제출", type: "산출물" },
  { date: "2026-04-07", label: "발대식 · 워크숍 1·2", type: "워크숍" },
  { date: "2026-04-14", label: "워크숍 3", type: "워크숍" },
  { date: "2026-04-28", label: "워크숍 4", type: "워크숍" },
  { date: "2026-05-12", label: "워크숍 5 (결과 발표)", type: "워크숍" },
  { date: "2026-05-13", label: "팀별 활동보고서 제출", type: "산출물" },
  { date: "2026-06-14", label: "최종 결과보고서 제출", type: "산출물" },
];

const STAGES: Array<[string, string, string]> = [
  ["3월 4주~4월 1주", "모집·선발", "모집 공고/홍보, 심사, 팀 구성 운영"],
  ["4월 1주", "발대식·워크숍 1·2", "발대식 및 역량강화워크숍"],
  ["4월 1주", "팀별 활동 1", "공감/현장조사 활동 운영"],
  ["4월 2주", "워크숍 3", "문제정의, 솔루션 방향 설정"],
  ["4월 3주", "팀별 활동 2", "자료조사/현장답사/아이디어 구체화"],
  ["4월 4주", "워크숍 4", "프로토타입 도출 및 실증 설계"],
  ["5월 1주", "팀별 활동 3", "솔루션 검증/자료 제작"],
  ["5월 2주", "워크숍 5", "결과 발표, 피드백"],
  ["5월 3주~6월", "결과보고", "결과보고서 및 결과자료 제출"],
];

export default function SchedulePage() {
  const today = new Date();
  const upcoming = MILESTONES.filter((item) => parseISO(item.date) >= today)
    .sort((left, right) => parseISO(left.date).getTime() - parseISO(right.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="추진 일정" subtitle="2026년 3월~6월 전체 일정 현황" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="panel-surface p-4">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Upcoming Milestones
            </p>
            <h3 className="mt-1 text-sm font-semibold text-ink">주요 마일스톤</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hidden">
            {upcoming.map((item) => {
              const diff = differenceInCalendarDays(parseISO(item.date), today);
              return (
                <article
                  key={`${item.date}-${item.label}`}
                  className="min-w-[190px] rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <Badge tone={item.type === "워크숍" ? "blue" : "amber"}>
                    {item.type}
                  </Badge>
                  <p className="mt-3 text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-2 text-xs text-slate-400">{item.date}</p>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {diff === 0 ? "오늘" : `D-${diff}`}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <div className="mt-4">
          <GanttChart />
        </div>

        <section className="panel-surface mt-4 p-4">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Stage Summary
            </p>
            <h3 className="mt-1 text-sm font-semibold text-ink">
              단계별 일정 요약 (과업지시서)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th className="pb-2 font-medium">기간</th>
                  <th className="pb-2 font-medium">구분</th>
                  <th className="pb-2 font-medium">주요 내용</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {STAGES.map(([period, stage, description]) => (
                  <tr key={`${period}-${stage}`}>
                    <td className="py-3 text-slate-500">{period}</td>
                    <td className="py-3">
                      <Badge
                        tone={
                          stage.includes("워크숍")
                            ? "blue"
                            : stage.includes("활동")
                              ? "green"
                              : stage.includes("모집")
                                ? "gray"
                                : "amber"
                        }
                      >
                        {stage}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-600">{description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
