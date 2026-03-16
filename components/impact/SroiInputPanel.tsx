"use client";

import { ProgressBar } from "@/components/ui/progress-bar";
import { calculateSroi, formatKRW, type SroiInput } from "@/lib/sroi";

const VALUE_ITEMS = [
  { key: "incomeValue", label: "재취업 소득 증대", tone: "navy" },
  { key: "caringValue", label: "돌봄 비용 절감", tone: "blue" },
  { key: "networkValue", label: "지역 네트워크 형성", tone: "green" },
  { key: "policyValue", label: "정책 기여 가치", tone: "violet" },
] as const;

const SLIDERS = [
  {
    key: "attributionRate",
    label: "기여율",
    hint: "사업 기여 비중",
    min: 0.05,
    max: 0.5,
    step: 0.05,
  },
  {
    key: "deadweightRate",
    label: "사중효과",
    hint: "사업 없이도 발생했을 비중",
    min: 0,
    max: 0.5,
    step: 0.05,
  },
  {
    key: "dropOffRate",
    label: "효과 감소율",
    hint: "시간 경과에 따른 감소 비율",
    min: 0,
    max: 0.3,
    step: 0.05,
  },
] as const;

export default function SroiInputPanel({
  input,
  onChange,
}: {
  input: SroiInput;
  onChange: (input: SroiInput) => void;
}) {
  const sroi = calculateSroi(input);
  const safeTotal = Math.max(sroi.totalSocialValue, 1);

  function update(key: keyof SroiInput, value: number) {
    onChange({ ...input, [key]: value });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-navy p-5 text-white shadow-lg shadow-navy/10">
        <p className="text-xs uppercase tracking-[0.18em] text-white/55">SROI</p>
        <p className="mt-3 text-4xl font-semibold leading-none">
          {sroi.sroi.toFixed(2)}
          <span className="ml-2 text-lg font-normal text-white/70">: 1</span>
        </p>
        <p className="mt-2 text-sm text-white/75">
          1원 투자 시 {sroi.sroi.toFixed(2)}원의 사회적 가치 창출
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4 text-sm">
          <div>
            <p className="text-white/55">총 사회적 가치</p>
            <p className="mt-1 font-medium">{formatKRW(sroi.totalSocialValue)}</p>
          </div>
          <div>
            <p className="text-white/55">순 사회적 가치</p>
            <p className="mt-1 font-medium">{formatKRW(sroi.netSocialValue)}</p>
          </div>
        </div>
      </section>

      <section className="panel-surface p-4">
        <p className="text-sm font-semibold text-ink">사회적 가치 항목별 비중</p>
        <div className="mt-4 space-y-3">
          {VALUE_ITEMS.map((item) => {
            const value = sroi[item.key];
            const percentage = Math.round((value / safeTotal) * 100);

            return (
              <div key={item.key}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-medium text-ink">
                    {formatKRW(value)} · {percentage}%
                  </span>
                </div>
                <ProgressBar
                  className="mt-2"
                  max={100}
                  tone={item.tone}
                  value={percentage}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-surface p-4">
        <div>
          <p className="text-sm font-semibold text-ink">가정값 조정</p>
          <p className="mt-1 text-xs text-slate-400">
            보수적 추정을 위해 기여율, 사중효과, 감소율을 조정할 수 있습니다.
          </p>
        </div>
        <div className="mt-4 space-y-4">
          {SLIDERS.map((slider) => (
            <div key={slider.key}>
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-600">
                  {slider.label}
                  <span className="ml-1 text-slate-400">({slider.hint})</span>
                </span>
                <span className="font-medium text-ink">
                  {Math.round(input[slider.key] * 100)}%
                </span>
              </div>
              <input
                className="mt-2 h-2 w-full accent-navy"
                max={slider.max}
                min={slider.min}
                onChange={(event) =>
                  update(slider.key, Number.parseFloat(event.target.value))
                }
                step={slider.step}
                type="range"
                value={input[slider.key]}
              />
            </div>
          ))}
          <div>
            <div className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-600">
                정책 채택 솔루션 수
                <span className="ml-1 text-slate-400">(실무 확인 후 조정)</span>
              </span>
              <span className="font-medium text-ink">
                {input.solutionsAdopted}식
              </span>
            </div>
            <input
              className="mt-2 h-2 w-full accent-lab-green"
              max={input.solutionsCount}
              min={0}
              onChange={(event) =>
                update("solutionsAdopted", Number.parseInt(event.target.value, 10))
              }
              step={1}
              type="range"
              value={input.solutionsAdopted}
            />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
        <p className="font-medium text-slate-700">산정 근거</p>
        <p className="mt-2">소득·돌봄: 한국여성정책연구원 및 보건복지부 유사 연구 기준</p>
        <p className="mt-1">네트워크: CSES 사회적 자본 가치 기준</p>
        <p className="mt-1">정책 기여: 주민참여형 정책제안 효과 분석 기준</p>
      </section>
    </div>
  );
}
