"use client";

import { useDeferredValue, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ParticipantRecord } from "@/lib/types";

import TeamBadge from "./TeamBadge";

const ROLE_LABEL: Record<string, string> = {
  participant: "참여자",
  facilitator: "퍼실리테이터",
  coordinator: "코디네이터",
};

export default function ParticipantTable({
  participants,
  onStatusChange,
}: {
  participants: ParticipantRecord[];
  onStatusChange: (id: number, status: "active" | "withdrawn") => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());

  const filteredParticipants = useMemo(() => {
    if (!deferredSearch) {
      return participants;
    }

    return participants.filter((participant) => {
      const keyword = deferredSearch.toLowerCase();
      return (
        participant.name.toLowerCase().includes(keyword) ||
        (participant.team_name ?? "").toLowerCase().includes(keyword)
      );
    });
  }, [deferredSearch, participants]);

  return (
    <div className="panel-surface overflow-hidden">
      <div className="border-b border-slate-100 px-4 py-4">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="이름 또는 팀명 검색"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10 md:w-72"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50/80 text-left text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-4 py-3 font-medium">이름</th>
              <th className="px-4 py-3 font-medium">팀</th>
              <th className="px-4 py-3 font-medium">역할</th>
              <th className="px-4 py-3 font-medium">연락처</th>
              <th className="px-4 py-3 font-medium">참여일</th>
              <th className="px-4 py-3 font-medium">상태</th>
              <th className="px-4 py-3 font-medium text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredParticipants.map((participant) => {
              const nextStatus =
                participant.status === "active" ? "withdrawn" : "active";
              return (
                <tr key={participant.id} className="bg-white/80">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{participant.name}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {participant.email ?? "이메일 미등록"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <TeamBadge
                      teamId={participant.team_id}
                      name={participant.team_name}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {ROLE_LABEL[participant.role] ?? participant.role}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {participant.phone ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{participant.joined_at}</td>
                  <td className="px-4 py-3">
                    <Badge tone={participant.status === "active" ? "green" : "red"}>
                      {participant.status === "active" ? "활동 중" : "철회"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStatusChange(participant.id, nextStatus)}
                    >
                      {participant.status === "active" ? "철회 처리" : "재등록"}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filteredParticipants.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">
          검색 결과가 없습니다.
        </p>
      ) : null}
    </div>
  );
}
