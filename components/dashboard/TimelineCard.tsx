import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TIMELINE = [
  { label: "모집·선발", period: "3월 4주~4월 1주", key: "recruit" },
  { label: "발대식·워크숍 1·2", period: "4월 1주", key: "ws12" },
  { label: "워크숍 3 + 팀별 활동 1·2", period: "4월 2~4주", key: "mid" },
  { label: "팀별 활동 3 · 결과 발표", period: "5월 1~2주", key: "ws5" },
  { label: "결과보고", period: "5월 3주~6월", key: "report" },
];

export default function TimelineCard({
  currentStage,
}: {
  currentStage: string;
}) {
  const currentIndex = TIMELINE.findIndex((item) => item.key === currentStage);

  return (
    <section className="panel-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Project Flow
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">추진 일정</h3>
        </div>
        <Badge tone="blue">과업지시서 기준</Badge>
      </div>
      <div className="space-y-3">
        {TIMELINE.map((item, index) => {
          const isDone = currentIndex > index;
          const isCurrent = currentIndex === index;
          return (
            <div key={item.key} className="flex gap-3">
              <div className="flex flex-col items-center pt-1">
                <span
                  className={cn(
                    "h-3 w-3 rounded-full border-2",
                    isDone && "border-lab-green bg-lab-green",
                    isCurrent && "border-navy bg-navy",
                    !isDone && !isCurrent && "border-slate-300 bg-white",
                  )}
                />
                {index < TIMELINE.length - 1 ? (
                  <span
                    className={cn(
                      "mt-1 h-10 w-px",
                      isDone ? "bg-lab-green/40" : "bg-slate-200",
                    )}
                  />
                ) : null}
              </div>
              <div className="pb-1">
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCurrent && "text-navy",
                    isDone && "text-slate-400",
                    !isDone && !isCurrent && "text-slate-700",
                  )}
                >
                  {item.label}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {item.period}
                  {isCurrent ? " · 진행 중" : ""}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
