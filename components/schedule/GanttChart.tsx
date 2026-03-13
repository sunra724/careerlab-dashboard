"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ScheduleItem {
  name: string;
  type: "recruit" | "workshop" | "activity" | "report";
  start: string;
  end: string;
}

interface GanttDatum {
  name: string;
  type: ScheduleItem["type"];
  offset: number;
  duration: number;
  startLabel: string;
  endLabel: string;
}

const DAY_MS = 86_400_000;
const BASE_DATE = new Date("2026-03-01").getTime();
const MAX_OFFSET = Math.round((new Date("2026-06-15").getTime() - BASE_DATE) / DAY_MS);

const SCHEDULE: ScheduleItem[] = [
  { name: "모집 공고·홍보", type: "recruit", start: "2026-03-23", end: "2026-04-03" },
  { name: "심사 및 팀 구성", type: "recruit", start: "2026-04-01", end: "2026-04-07" },
  { name: "발대식 · 워크숍 1·2", type: "workshop", start: "2026-04-07", end: "2026-04-07" },
  { name: "팀별 활동 1 (공감조사)", type: "activity", start: "2026-04-08", end: "2026-04-10" },
  { name: "워크숍 3 (문제정의)", type: "workshop", start: "2026-04-14", end: "2026-04-14" },
  { name: "팀별 활동 2 (자료조사)", type: "activity", start: "2026-04-17", end: "2026-04-21" },
  { name: "워크숍 4 (프로토타입)", type: "workshop", start: "2026-04-28", end: "2026-04-28" },
  { name: "팀별 활동 3 (검증)", type: "activity", start: "2026-05-04", end: "2026-05-07" },
  { name: "워크숍 5 (결과 발표)", type: "workshop", start: "2026-05-12", end: "2026-05-12" },
  { name: "결과보고서 작성", type: "report", start: "2026-05-18", end: "2026-06-14" },
  { name: "산출물 최종 제출", type: "report", start: "2026-06-01", end: "2026-06-14" },
];

const TYPE_COLORS: Record<ScheduleItem["type"], string> = {
  recruit: "#46549C",
  workshop: "#248DAC",
  activity: "#228D7B",
  report: "#7C5CBF",
};

const TICKS = [0, 15, 31, 45, 61, 76, 92, 106];
const TICK_LABELS = ["3/1", "3/16", "4/1", "4/15", "5/1", "5/16", "6/1", "6/15"];

function toOffset(date: string) {
  return Math.round((new Date(date).getTime() - BASE_DATE) / DAY_MS);
}

function GanttTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: GanttDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const item = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-soft">
      <p className="font-semibold text-ink">{item.name}</p>
      <p className="mt-1 text-slate-500">시작: {item.startLabel}</p>
      <p className="text-slate-500">종료: {item.endLabel}</p>
      <p className="text-slate-500">기간: {item.duration}일</p>
    </div>
  );
}

export default function GanttChart() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const today = useMemo(() => {
    const rawOffset = Math.round((Date.now() - BASE_DATE) / DAY_MS);
    return Math.min(Math.max(rawOffset, 0), MAX_OFFSET);
  }, []);

  const data = useMemo<GanttDatum[]>(() => {
    return SCHEDULE.map((item) => {
      const offset = toOffset(item.start);
      const duration = Math.max(toOffset(item.end) - offset + 1, 1);
      return {
        name: item.name,
        type: item.type,
        offset,
        duration,
        startLabel: item.start,
        endLabel: item.end,
      };
    });
  }, []);

  return (
    <section className="panel-surface p-4">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Gantt Chart
          </p>
          <h3 className="mt-1 text-sm font-semibold text-ink">전체 추진 일정</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-navy" />
            모집·선발
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-lab-blue" />
            워크숍
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-lab-green" />
            팀별활동
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-sm bg-lab-violet" />
            결과보고
          </span>
          <span className="inline-flex items-center gap-2 text-red-500">
            <span className="h-3 w-px bg-red-500" />
            오늘
          </span>
        </div>
      </div>
      <div className="h-[360px]">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 136, bottom: 8 }}
              barSize={16}
            >
              <XAxis
                type="number"
                domain={[0, MAX_OFFSET]}
                ticks={TICKS}
                tickFormatter={(value) => TICK_LABELS[TICKS.indexOf(value)] ?? ""}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "#94A3B8" }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={132}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "#475569" }}
              />
              <Tooltip content={<GanttTooltip />} />
              <ReferenceLine
                x={today}
                stroke="#EF4444"
                strokeWidth={1.5}
                strokeDasharray="4 3"
                label={{ value: "오늘", position: "top", fill: "#EF4444", fontSize: 10 }}
              />
              <Bar dataKey="offset" stackId="timeline" fill="transparent" />
              <Bar dataKey="duration" stackId="timeline" radius={[4, 4, 4, 4]}>
                {data.map((item) => (
                  <Cell key={`${item.name}-${item.type}`} fill={TYPE_COLORS[item.type]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-2xl bg-slate-50" />
        )}
      </div>
    </section>
  );
}
