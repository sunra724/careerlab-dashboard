export interface SroiInput {
  totalBudget: number;
  participantsCount: number;
  teamsCount: number;
  solutionsCount: number;
  solutionsAdopted: number;
  attributionRate: number;
  deadweightRate: number;
  dropOffRate: number;
}

export interface SroiResult {
  incomeValue: number;
  caringValue: number;
  networkValue: number;
  policyValue: number;
  totalSocialValue: number;
  netSocialValue: number;
  sroi: number;
  unitRates: {
    income: number;
    caring: number;
    network: number;
    policy: number;
  };
}

const DEFAULT_ATTRIBUTION_RATE = 0.15;

const BASE_UNIT_RATES = {
  income: 2_700_000,
  caring: 1_200_000,
  network: 5_000_000,
  policyAdopted: 8_000_000,
  policyProposed: 2_400_000,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateSroi(input: SroiInput): SroiResult {
  const solutionsCount = Math.max(0, input.solutionsCount);
  const solutionsAdopted = clamp(input.solutionsAdopted, 0, solutionsCount);
  const attributionFactor =
    clamp(input.attributionRate, 0, 1) / DEFAULT_ATTRIBUTION_RATE;
  const adjustmentFactor =
    (1 - clamp(input.deadweightRate, 0, 1)) *
    (1 - clamp(input.dropOffRate, 0, 1));

  const incomeValue =
    input.participantsCount *
    BASE_UNIT_RATES.income *
    attributionFactor *
    adjustmentFactor;
  const caringValue =
    input.participantsCount *
    BASE_UNIT_RATES.caring *
    attributionFactor *
    adjustmentFactor;
  const networkValue =
    input.teamsCount *
    BASE_UNIT_RATES.network *
    attributionFactor *
    adjustmentFactor;
  const policyValue =
    (solutionsAdopted * BASE_UNIT_RATES.policyAdopted +
      (solutionsCount - solutionsAdopted) * BASE_UNIT_RATES.policyProposed) *
    attributionFactor *
    adjustmentFactor;

  const totalSocialValue =
    incomeValue + caringValue + networkValue + policyValue;
  const budget = Math.max(1, input.totalBudget);

  return {
    incomeValue,
    caringValue,
    networkValue,
    policyValue,
    totalSocialValue,
    netSocialValue: totalSocialValue - input.totalBudget,
    sroi: totalSocialValue / budget,
    unitRates: {
      income: BASE_UNIT_RATES.income,
      caring: BASE_UNIT_RATES.caring,
      network: BASE_UNIT_RATES.network,
      policy: BASE_UNIT_RATES.policyProposed,
    },
  };
}

export function formatKRW(value: number) {
  const abs = Math.abs(value);
  const prefix = value < 0 ? "-₩" : "₩";

  if (abs >= 100_000_000) {
    return `${prefix}${(abs / 100_000_000).toFixed(1)}억원`;
  }

  if (abs >= 10_000) {
    return `${prefix}${Math.round(abs / 10_000).toLocaleString("ko-KR")}만원`;
  }

  return `${prefix}${Math.round(abs).toLocaleString("ko-KR")}원`;
}
