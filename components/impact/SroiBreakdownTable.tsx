import { calculateSroi, formatKRW, type SroiInput } from "@/lib/sroi";

export default function SroiBreakdownTable({
  input,
}: {
  input: SroiInput;
}) {
  const sroi = calculateSroi(input);

  const rows = [
    {
      label: "재취업 소득 증대",
      unit: "270만원/인 기준",
      quantity: `${input.participantsCount}명`,
      value: sroi.incomeValue,
    },
    {
      label: "돌봄 비용 절감",
      unit: "120만원/인 기준",
      quantity: `${input.participantsCount}명`,
      value: sroi.caringValue,
    },
    {
      label: "지역 네트워크 형성",
      unit: "500만원/팀 기준",
      quantity: `${input.teamsCount}팀`,
      value: sroi.networkValue,
    },
    {
      label: "정책 기여 가치",
      unit: "240~800만원/식 기준",
      quantity: `${input.solutionsCount}식`,
      value: sroi.policyValue,
    },
  ];

  return (
    <div className="mb-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="border border-slate-200 px-3 py-2 text-left font-medium">항목</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-medium">단가</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-medium">적용 수량</th>
            <th className="border border-slate-200 px-3 py-2 text-right font-medium">가치</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border border-slate-200 px-3 py-2">{row.label}</td>
              <td className="border border-slate-200 px-3 py-2 text-right text-slate-500">{row.unit}</td>
              <td className="border border-slate-200 px-3 py-2 text-right">{row.quantity}</td>
              <td className="border border-slate-200 px-3 py-2 text-right font-medium">{formatKRW(row.value)}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-medium">
            <td className="border border-slate-200 px-3 py-2" colSpan={3}>총 사회적 가치</td>
            <td className="border border-slate-200 px-3 py-2 text-right text-navy">{formatKRW(sroi.totalSocialValue)}</td>
          </tr>
          <tr className="bg-navy text-white">
            <td className="border border-navy/30 px-3 py-2 font-semibold" colSpan={3}>
              SROI (총 사회적 가치 ÷ 총예산 {formatKRW(input.totalBudget)})
            </td>
            <td className="border border-navy/30 px-3 py-2 text-right font-semibold">
              {sroi.sroi.toFixed(2)} : 1
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
