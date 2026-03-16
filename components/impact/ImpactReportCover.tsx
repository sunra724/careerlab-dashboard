import { calculateSroi, formatKRW, type SroiInput } from "@/lib/sroi";
import type { ImpactContextResponse } from "@/lib/types";

export default function ImpactReportCover({
  context,
  input,
}: {
  context: ImpactContextResponse;
  input: SroiInput;
}) {
  const sroi = calculateSroi(input);

  return (
    <section className="rounded-3xl bg-navy px-8 py-9 text-white shadow-lg shadow-navy/10 print:rounded-none">
      <p className="text-xs uppercase tracking-[0.22em] text-white/50">Impact Report</p>
      <h1 className="mt-3 text-3xl font-semibold leading-snug">
        {context.projectName}
      </h1>
      <p className="mt-2 text-lg text-white/80">성과와 사회적 파급효과 종합 분석</p>
      <div className="mt-7 grid gap-4 border-t border-white/15 pt-5 md:grid-cols-3">
        <div>
          <p className="text-sm text-white/55">SROI</p>
          <p className="mt-1 text-2xl font-semibold">{sroi.sroi.toFixed(2)} : 1</p>
        </div>
        <div>
          <p className="text-sm text-white/55">총 사회적 가치</p>
          <p className="mt-1 text-lg font-medium">{formatKRW(sroi.totalSocialValue)}</p>
        </div>
        <div>
          <p className="text-sm text-white/55">운영기관</p>
          <p className="mt-1 text-sm font-medium">{context.organization}</p>
          <p className="mt-1 text-xs text-white/50">{context.period}</p>
        </div>
      </div>
    </section>
  );
}
