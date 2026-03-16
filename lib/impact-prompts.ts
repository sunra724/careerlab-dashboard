import { calculateSroi, formatKRW, type SroiInput } from "@/lib/sroi";
import type { ImpactContextResponse, ImpactSectionKey } from "@/lib/types";

export const IMPACT_SYSTEM_PROMPT = `당신은 지방정부와 공공기관 보고서를 작성하는 사회성과 평가 전문 연구자입니다.
문장은 한국어 공공보고서 문체로 작성하고, 과장 없이 근거 중심으로 설명합니다.
수치와 사실은 제공된 데이터 범위 안에서만 활용하고, 추정이나 한계가 있으면 분명히 밝힙니다.
응답은 마크다운 없이 일반 텍스트로 작성하되, 문단 구분은 명확하게 해주세요.`;

const SECTION_PROMPTS: Record<ImpactSectionKey, string> = {
  overview: `1장에서는 사업 배경, 목적, 필요성, 핵심 이해관계자를 정리해주세요.
참여자, 운영기관, 발주기관, 지역사회가 어떤 방식으로 연결되는지 설명하고, 리빙랩 접근의 의미를 포함해주세요.
분량은 600~800자 수준으로 작성해주세요.`,
  logicmodel: `2장에서는 투입(Input), 활동(Activity), 산출(Output), 성과(Outcome), 파급효과(Impact)를 서술형으로 정리해주세요.
예산, 기간, 프로그램 구성, 참여 규모, 팀 활동, 산출물과의 연결을 분명히 보여주세요.
분량은 700~900자 수준으로 작성해주세요.`,
  sroi: `3장에서는 SROI 개념 설명, 가치 항목별 해설, 비율 해석, 측정의 한계를 포함해주세요.
사회적 가치 산정 근거와 보수적 추정 원칙을 함께 설명해주세요.
분량은 900~1,100자 수준으로 작성해주세요.`,
  policy: `4장에서는 본 사업 성과가 여성정책, 고용정책, 주민참여정책과 어떻게 맞물리는지 분석해주세요.
제시된 솔루션들이 지역 정책 의제와 어떤 접점을 가지는지 구체적으로 써주세요.
분량은 800~1,000자 수준으로 작성해주세요.`,
  scalability: `5장에서는 남구 고도화, 대구 권역 확산, 타 지자체 확산의 3단계 시나리오를 제시해주세요.
각 단계별 필요 조건, 운영체계, 기대효과, 리스크를 균형 있게 설명해주세요.
분량은 800~1,000자 수준으로 작성해주세요.`,
  solutions: `6장에서는 각 팀의 문제 인식과 활동 내용을 바탕으로 솔루션 제안 내용을 요약해주세요.
팀별로 핵심 문제, 제안 내용, 기대 효과를 간결하게 정리해주세요.
분량은 전체 600~900자 수준으로 작성해주세요.`,
  conclusion: `7장에서는 핵심 성과 3가지, 정책 제언 3가지, 운영기관 후속과제 2가지를 정리해주세요.
마무리 문단에서는 리빙랩 방식이 지역 여성의 재도약과 지역문제 해결에 주는 의미를 담아주세요.
분량은 700~900자 수준으로 작성해주세요.`,
};

function formatTeamSummary(context: ImpactContextResponse) {
  return context.teams
    .map(
      (team) =>
        `- ${team.name}: 주제=${team.topic ?? "미정"}, 완료 활동=${team.activities_done}/3, 활동 요약=${team.activity_summaries ?? "기록 없음"}`,
    )
    .join("\n");
}

function formatWorkshopSummary(context: ImpactContextResponse) {
  return context.workshops
    .map(
      (workshop) =>
        `- ${workshop.session_no}회차 ${workshop.title}: 상태=${workshop.status}, 일자=${workshop.held_date ?? "미정"}, 출석=${workshop.attended_count}명`,
    )
    .join("\n");
}

function formatSolutionSummary(context: ImpactContextResponse) {
  return context.solutions
    .map(
      (solution, index) =>
        `${index + 1}. ${solution.title}: ${solution.note ?? "세부 메모 없음"} (상태: ${solution.status})`,
    )
    .join("\n");
}

function formatParticipantNotes(context: ImpactContextResponse) {
  if (context.participantNotes.length === 0) {
    return "- 별도 참여 후기 기록 없음";
  }

  return context.participantNotes
    .slice(0, 6)
    .map((item) => `- ${item.name}: ${item.note}`)
    .join("\n");
}

export function buildImpactUserPrompt(
  context: ImpactContextResponse,
  sroiInput: SroiInput,
  section: ImpactSectionKey,
) {
  const sroi = calculateSroi(sroiInput);
  const completedWorkshops = context.workshops.filter(
    (workshop) => workshop.status === "done",
  ).length;

  return `
[사업 기본 정보]
- 사업명: ${context.projectName}
- 운영기관: ${context.organization}
- 사업 기간: ${context.period}
- 총예산: ${formatKRW(sroiInput.totalBudget)}
- 참여자: ${context.participants.active}명
- 팀 수: ${context.teams.length}개
- 솔루션 제안 수: ${context.solutions.length}식
- 워크숍 완료 수: ${completedWorkshops}회
- 전체 워크숍 평균 출석률: ${context.attendanceRate}%

[최신 KPI]
- 참여자 수: ${context.kpi?.participants_count ?? context.participants.active}
- 완료 워크숍: ${context.kpi?.workshops_done ?? completedWorkshops}
- 완료 팀활동: ${context.kpi?.activities_done ?? 0}
- 솔루션 수: ${context.kpi?.solutions_count ?? context.solutions.length}
- 역량강화 교육 수: ${context.kpi?.trainings_done ?? 0}

[팀별 활동 요약]
${formatTeamSummary(context)}

[워크숍 요약]
${formatWorkshopSummary(context)}

[솔루션 메모]
${formatSolutionSummary(context)}

[참여자 후기 또는 메모]
${formatParticipantNotes(context)}

[SROI 계산 결과]
- 총 사회적 가치: ${formatKRW(sroi.totalSocialValue)}
- 순 사회적 가치: ${formatKRW(sroi.netSocialValue)}
- SROI 비율: ${sroi.sroi.toFixed(2)} : 1
- 소득 증대 가치: ${formatKRW(sroi.incomeValue)}
- 돌봄 비용 절감 가치: ${formatKRW(sroi.caringValue)}
- 네트워크 형성 가치: ${formatKRW(sroi.networkValue)}
- 정책 기여 가치: ${formatKRW(sroi.policyValue)}
- 기여율: ${Math.round(sroiInput.attributionRate * 100)}%
- 사중효과: ${Math.round(sroiInput.deadweightRate * 100)}%
- 효과 감소율: ${Math.round(sroiInput.dropOffRate * 100)}%
- 채택된 솔루션 수: ${sroiInput.solutionsAdopted}식

[작성 지시]
${SECTION_PROMPTS[section]}
`.trim();
}
