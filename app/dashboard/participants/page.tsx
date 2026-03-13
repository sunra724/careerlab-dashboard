"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import Header from "@/components/layout/Header";
import ParticipantCreateForm from "@/components/participants/ParticipantCreateForm";
import ParticipantTable from "@/components/participants/ParticipantTable";
import { fetchJson } from "@/lib/fetcher";
import { TEAM_META } from "@/lib/teams";
import type { ParticipantRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMPTY_PARTICIPANTS: ParticipantRecord[] = [];

export default function ParticipantsPage() {
  const [selectedTeam, setSelectedTeam] = useState(0);
  const { data, mutate } = useSWR<ParticipantRecord[]>(
    "/api/participants",
    (url: string) => fetchJson<ParticipantRecord[]>(url),
  );

  const participants = data ?? EMPTY_PARTICIPANTS;
  const filteredParticipants = useMemo(() => {
    if (selectedTeam === 0) {
      return participants;
    }
    return participants.filter((participant) => participant.team_id === selectedTeam);
  }, [participants, selectedTeam]);

  const activeCount = participants.filter((participant) => participant.status === "active").length;

  async function handleStatusChange(
    id: number,
    status: "active" | "withdrawn",
  ) {
    await fetch(`/api/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await mutate();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        title="참여자 관리"
        subtitle={`총 ${activeCount}명 활동 중 · 목표 30명`}
        badge={{ label: `${activeCount}/30명`, color: activeCount >= 30 ? "green" : "amber" }}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <ParticipantCreateForm
          onCreated={async () => {
            await mutate();
          }}
        />

        <div className="mt-4 panel-surface p-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTeam(0)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                selectedTeam === 0
                  ? "bg-navy text-white"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200",
              )}
            >
              전체
            </button>
            {TEAM_META.map((team) => (
              <button
                key={team.id}
                onClick={() => setSelectedTeam(team.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  selectedTeam === team.id
                    ? "bg-navy text-white"
                    : team.badgeClass,
                )}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {TEAM_META.map((team) => {
            const count = participants.filter(
              (participant) => participant.team_id === team.id && participant.status === "active",
            ).length;
            return (
              <div key={team.id} className="panel-surface p-4 text-center">
                <p className={cn("text-sm font-semibold", team.textClass)}>{team.name}</p>
                <p className="mt-2 text-3xl font-semibold text-ink">{count}</p>
                <p className="mt-1 text-xs text-slate-400">목표 5명</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4">
          <ParticipantTable
            participants={filteredParticipants}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>
    </div>
  );
}
