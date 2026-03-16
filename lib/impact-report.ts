import type { ImpactSectionKey } from "@/lib/types";

export const IMPACT_REPORT_SECTIONS: Array<{
  key: ImpactSectionKey;
  title: string;
}> = [
  { key: "overview", title: "1. 사업 개요 및 이해관계자 분석" },
  { key: "logicmodel", title: "2. 투입·산출·성과 분석 (Logic Model)" },
  { key: "sroi", title: "3. 사회성과투자수익률 (SROI) 분석" },
  { key: "policy", title: "4. 정책부합성 분석" },
  { key: "scalability", title: "5. 확장가능성 및 지속가능성 분석" },
  { key: "solutions", title: "6. 팀별 솔루션 제안 요약" },
  { key: "conclusion", title: "7. 결론 및 제언" },
];

export function isImpactSectionKey(value: string): value is ImpactSectionKey {
  return IMPACT_REPORT_SECTIONS.some((section) => section.key === value);
}
