"use client";

import { useEffect, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarDatum {
  subject: string;
  value: number;
  fullMark: number;
}

function RadarTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: RadarDatum }>;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const datum = payload[0].payload;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-soft">
      <p className="font-semibold text-ink">{datum.subject}</p>
      <p className="mt-1 text-slate-500">
        {datum.value} / {datum.fullMark}
      </p>
    </div>
  );
}

export default function KpiRadarChart({ data }: { data: RadarDatum[] }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <section className="panel-surface p-4">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Radar
        </p>
        <h3 className="mt-1 text-sm font-semibold text-ink">종합 달성도</h3>
      </div>
      <div className="h-72">
        {isMounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data}>
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "#64748B" }}
              />
              <Radar
                dataKey="value"
                stroke="#46549C"
                fill="#46549C"
                fillOpacity={0.18}
                strokeWidth={2}
              />
              <Tooltip content={<RadarTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full rounded-2xl bg-slate-50" />
        )}
      </div>
    </section>
  );
}
