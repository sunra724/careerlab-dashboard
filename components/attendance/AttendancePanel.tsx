"use client";

import Image from "next/image";
import { useState } from "react";
import useSWR from "swr";

import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/fetcher";
import { getTeamMeta } from "@/lib/teams";
import type { AttendanceResponse, AttendanceSessionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AttendancePanel({
  sessionId,
  sessionType,
}: {
  sessionId: number;
  sessionType: AttendanceSessionType;
}) {
  const [selectedSignature, setSelectedSignature] = useState<{
    image: string;
    name: string;
  } | null>(null);

  const { data, error, isLoading } = useSWR<AttendanceResponse>(
    `/api/attendance?session_type=${sessionType}&session_id=${sessionId}`,
    (url: string) => fetchJson<AttendanceResponse>(url),
    { refreshInterval: 10_000 },
  );

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-slate-500">출석 정보를 불러오는 중입니다.</p>;
  }

  if (error) {
    return <p className="py-4 text-center text-sm text-red-700">출석 정보를 불러오지 못했습니다.</p>;
  }

  const attendance = data?.attendance ?? [];
  const participants = data?.participants ?? [];
  const attendanceMap = new Map(
    attendance
      .filter((record) => typeof record.participant_id === "number")
      .map((record) => [record.participant_id as number, record]),
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="green">{attendance.length}명 출석</Badge>
        <Badge tone="gray">{participants.length}명 대상</Badge>
        <p className="text-xs text-slate-400">10초마다 자동 새로고침</p>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        {participants.map((participant) => {
          const record = attendanceMap.get(participant.id);
          const teamMeta = getTeamMeta(participant.team_id);
          return (
            <div key={participant.id} className={cn("rounded-2xl border px-3 py-2.5 text-sm", record ? "border-green-200 bg-green-50/80" : "border-slate-200 bg-white")}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", teamMeta?.dotClass ?? "bg-slate-300")} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{participant.name}</p>
                    <p className="truncate text-xs text-slate-400">{participant.team_name ?? "팀 미배정"}</p>
                  </div>
                </div>
                {record ? (
                  <div className="text-right">
                    <p className="text-xs font-medium text-green-700">{record.attended_at?.slice(11, 16) ?? "--:--"}</p>
                    {record.signature_data ? (
                      <button className="text-xs text-navy hover:underline" onClick={() => setSelectedSignature({ image: record.signature_data as string, name: participant.name })}>
                        서명 보기
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">미출석</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedSignature ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setSelectedSignature(null)}>
          <div className="w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <p className="text-base font-semibold text-ink">{selectedSignature.name} 서명</p>
            <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
              <Image alt={`${selectedSignature.name} 서명`} className="w-full" height={220} src={selectedSignature.image} unoptimized width={420} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
