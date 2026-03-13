"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEAM_META } from "@/lib/teams";

interface ParticipantFormState {
  name: string;
  phone: string;
  email: string;
  team_id: string;
}

const INITIAL_STATE: ParticipantFormState = {
  name: "",
  phone: "",
  email: "",
  team_id: "",
};

export default function ParticipantCreateForm({
  onCreated,
}: {
  onCreated: () => Promise<void>;
}) {
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          team_id: form.team_id ? Number(form.team_id) : null,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "참여자를 추가하지 못했습니다.");
      }

      setForm(INITIAL_STATE);
      await onCreated();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "참여자를 추가하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel-surface p-4">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          Quick Add
        </p>
        <h3 className="mt-1 text-sm font-semibold text-ink">참여자 추가</h3>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <Label htmlFor="participant-name">이름</Label>
          <Input
            id="participant-name"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            placeholder="이름 입력"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="participant-phone">연락처</Label>
          <Input
            id="participant-phone"
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            placeholder="010-0000-0000"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="participant-email">이메일</Label>
          <Input
            id="participant-email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="example@careerlab.kr"
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="participant-team">팀 배정</Label>
          <select
            id="participant-team"
            value={form.team_id}
            onChange={(event) => setForm((prev) => ({ ...prev, team_id: event.target.value }))}
            className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10"
          >
            <option value="">미배정</option>
            {TEAM_META.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-red-500">{error}</p>
        <Button type="submit" disabled={isSaving || !form.name.trim()}>
          {isSaving ? "저장 중..." : "참여자 등록"}
        </Button>
      </div>
    </form>
  );
}
