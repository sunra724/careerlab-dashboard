import { calculateSroi, formatKRW, type SroiInput } from "@/lib/sroi";
import type { ImpactContextResponse, ImpactSectionKey } from "@/lib/types";

export const IMPACT_SYSTEM_PROMPT = `당신은 지방정부와 공공기관 보고서를 작성하는 사회성과 분석 연구자입니다.
문장은 한국어 공공보고서 문체로 작성하고, 과장 없이 사실과 수치에 기반해 설명합니다.
제공된 데이터 범위를 벗어나는 추정은 최소화하고, 필요한 경우 추정 또는 해석임을 분명히 밝히십시오.
현장 사진 정보는 활동 맥락을 보강하는 보조 근거로만 활용하고, 사진만으로 확인할 수 없는 사실은 단정하지 마십시오.
응답은 마크다운 없이 일반 텍스트 문단으로 작성하십시오.`;

const SECTION_PROMPTS: Record<ImpactSectionKey, string> = {
  overview:
    "1장에서는 사업 배경, 목표, 운영 주체, 참여자 구성, 지역사회 맥락을 중심으로 개요를 정리해 주세요. 분량은 600~800자 내외로 작성합니다.",
  logicmodel:
    "2장에서는 Input, Activity, Output, Outcome, Impact의 흐름이 드러나도록 논리모형을 서술형으로 정리해 주세요. 예산, 참여 규모, 워크숍과 팀 활동, 산출물의 연결을 분명히 보여 주세요. 분량은 700~900자 내외입니다.",
  sroi:
    "3장에서는 SROI 산출 근거, 가정, 가치 항목별 의미, 비율 해석, 한계를 포함해 설명해 주세요. 계산 결과를 반복 나열하기보다 의미를 해석하는 방식으로 작성해 주세요. 분량은 900~1100자 내외입니다.",
  policy:
    "4장에서는 본 사업이 여성 경력복귀, 지역문제 해결, 주민참여, 돌봄과 공동체 정책과 어떻게 맞닿는지 분석해 주세요. 지역 정책 관점의 시사점을 포함해 주세요. 분량은 800~1000자 내외입니다.",
  scalability:
    "5장에서는 남구 내 고도화, 대구권 확산, 타 지자체 확산의 3단계 확장 가능성을 제시해 주세요. 각 단계의 필요 조건과 기대효과, 리스크를 함께 설명해 주세요. 분량은 800~1000자 내외입니다.",
  solutions:
    "6장에서는 팀별 문제정의와 솔루션 제안을 요약하고, 제안의 특징과 기대효과를 간결하게 비교해 주세요. 분량은 600~900자 내외입니다.",
  conclusion:
    "7장에서는 핵심 성과, 정책 제언, 후속 과제를 중심으로 결론을 작성해 주세요. 실행 가능성과 지역사회 파급효과가 드러나도록 정리해 주세요. 분량은 700~900자 내외입니다.",
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
  if (context.solutions.length === 0) {
    return "- 등록된 솔루션 제안이 없습니다.";
  }

  return context.solutions
    .map(
      (solution, index) =>
        `${index + 1}. ${solution.title}: ${solution.note ?? "별도 메모 없음"} (상태: ${solution.status})`,
    )
    .join("\n");
}

function formatParticipantNotes(context: ImpactContextResponse) {
  if (context.participantNotes.length === 0) {
    return "- 별도 참여자 메모가 없습니다.";
  }

  return context.participantNotes
    .slice(0, 6)
    .map((item) => `- ${item.name}: ${item.note}`)
    .join("\n");
}

function formatPhotoSummary(context: ImpactContextResponse) {
  const lines = [
    `- 전체 사진 수: ${context.photos.total}장`,
    `- 사진이 등록된 워크숍: ${context.photos.workshop_sessions}회`,
    `- 사진이 등록된 팀 활동: ${context.photos.activity_sessions}회`,
  ];

  if (context.photos.recent_captions.length === 0) {
    lines.push("- 최근 캡션: 없음");
  } else {
    lines.push(
      ...context.photos.recent_captions.map((caption) => `- 최근 캡션: ${caption}`),
    );
  }

  return lines.join("\n");
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
- 솔루션 제안 수: ${context.solutions.length}건
- 완료 워크숍: ${completedWorkshops}회
- 평균 출석률: ${context.attendanceRate}%

[최신 KPI]
- 참여자 수: ${context.kpi?.participants_count ?? context.participants.active}
- 완료 워크숍: ${context.kpi?.workshops_done ?? completedWorkshops}
- 완료 팀 활동: ${context.kpi?.activities_done ?? 0}
- 솔루션 수: ${context.kpi?.solutions_count ?? context.solutions.length}
- 역량강화 교육 수: ${context.kpi?.trainings_done ?? 0}

[팀 활동 요약]
${formatTeamSummary(context)}

[워크숍 요약]
${formatWorkshopSummary(context)}

[솔루션 메모]
${formatSolutionSummary(context)}

[참여자 메모]
${formatParticipantNotes(context)}

[현장 사진 기록]
${formatPhotoSummary(context)}

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
- 채택된 솔루션 수: ${sroiInput.solutionsAdopted}건

[작성 지시]
${SECTION_PROMPTS[section]}
`.trim();
}
