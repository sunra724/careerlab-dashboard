"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import SignatureCanvas, {
  type SignatureCanvasHandle,
} from "@/components/attendance/SignatureCanvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetcher";
import { getTeamMeta } from "@/lib/teams";
import type {
  AttendanceParticipant,
  AttendanceSessionType,
  TeamActivityRecord,
  WorkshopRecord,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Step = "select" | "sign" | "done";

const SESSION_LABELS: Record<AttendanceSessionType, string> = {
  workshop: "워크숍",
  activity: "팀별 활동",
};

function buildSessionLabel(
  sessionType: AttendanceSessionType,
  sessionId: string,
  sessions: Array<WorkshopRecord | TeamActivityRecord>,
) {
  const session = sessions.find((item) => String(item.id) === sessionId);
  if (!session) {
    return null;
  }

  if (sessionType === "workshop" && "session_no" in session) {
    return `${session.session_no}회차 · ${session.title}`;
  }

  if ("activity_no" in session) {
    return `${session.activity_no}차 활동 · ${session.activity_type ?? "활동 미정"}`;
  }

  return null;
}

export default function AttendClient({
  sessionType,
  sessionId,
}: {
  sessionType: string;
  sessionId: string;
}) {
  const signatureRef = useRef<SignatureCanvasHandle>(null);
  const [participants, setParticipants] = useState<AttendanceParticipant[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [sessionLabel, setSessionLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [doneMessage, setDoneMessage] = useState("출석이 정상적으로 처리되었습니다.");
  const [hasSigned, setHasSigned] = useState(false);

  const selected = participants.find((participant) => String(participant.id) === selectedId) ?? null;
  const teamMeta = getTeamMeta(selected?.team_id);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (sessionType !== "workshop" && sessionType !== "activity") {
        setErrorMessage("잘못된 접근입니다.");
        setLoading(false);
        return;
      }

      try {
        const [participantRows, sessionRows] = await Promise.all([
          fetchJson<AttendanceParticipant[]>(
            `/api/attendance/participants?session_type=${sessionType}&session_id=${sessionId}`,
          ),
          fetchJson<Array<WorkshopRecord | TeamActivityRecord>>(
            sessionType === "workshop" ? "/api/workshops" : "/api/team-activities",
          ),
        ]);

        if (cancelled) {
          return;
        }

        setParticipants(participantRows);
        const label = buildSessionLabel(sessionType, sessionId, sessionRows);
        if (!label) {
          setErrorMessage("회차 정보를 찾을 수 없습니다.");
        } else {
          setSessionLabel(label);
        }
      } catch {
        if (!cancelled) {
          setErrorMessage("출석 페이지를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionType]);

  async function handleSubmit() {
    const signatureData = signatureRef.current?.toDataUrl() ?? "";
    if (!selected || !signatureData) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_type: sessionType,
        session_id: Number(sessionId),
        participant_id: selected.id,
        signature_data: signatureData,
        phone_last4: phoneLast4,
      }),
    });
    const data = (await response.json()) as { already?: boolean; error?: string };

    if (response.ok || data.already) {
      setDoneMessage(data.already ? "이미 출석 처리된 참여자입니다." : "출석이 정상적으로 처리되었습니다.");
      setStep("done");
    } else {
      setErrorMessage(data.error ?? "출석 처리 중 오류가 발생했습니다.");
    }

    setSubmitting(false);
  }

  if (loading) {
    return <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-5 text-sm text-slate-500">출석 페이지를 준비하고 있습니다.</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6">
      <div className="rounded-3xl bg-navy px-5 py-6 text-white shadow-lg shadow-navy/20">
        <p className="text-xs uppercase tracking-[0.2em] text-white/65">Baewoon Gimae Namgu</p>
        <h1 className="mt-2 text-xl font-semibold">{SESSION_LABELS[sessionType as AttendanceSessionType] ?? "행사"} 출석 체크</h1>
        <p className="mt-2 text-sm text-white/80">{sessionLabel || "회차 정보를 확인 중입니다."}</p>
      </div>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        {errorMessage ? <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p> : null}

        {step === "select" ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink">본인 정보를 선택해 주세요</p>
              <p className="mt-1 text-sm text-slate-500">이름 선택 후 휴대전화 뒤 4자리를 입력하면 서명 단계로 이동합니다.</p>
            </div>
            <select className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setErrorMessage(""); }}>
              <option value="">이름을 선택하세요</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  {participant.name} {participant.team_name ? `(${participant.team_name})` : ""}
                </option>
              ))}
            </select>
            <input className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-center text-lg tracking-[0.3em] outline-none transition focus:border-navy focus:ring-2 focus:ring-navy/10" inputMode="numeric" maxLength={4} onChange={(event) => setPhoneLast4(event.target.value.replace(/\D/g, ""))} placeholder="뒤 4자리 입력" value={phoneLast4} />
            <Button className="w-full" disabled={!selected || phoneLast4.length !== 4} onClick={() => { setErrorMessage(""); setStep("sign"); }}>
              서명하러 가기
            </Button>
          </div>
        ) : null}

        {step === "sign" && selected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-ink">{selected.name}</p>
                <p className="mt-1 text-xs text-slate-500">{selected.team_name ?? "팀 미배정"}</p>
              </div>
              <Badge className={cn(teamMeta?.badgeClass)} tone="gray">
                서명 진행
              </Badge>
            </div>
            <div className="overflow-hidden rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50">
              <SignatureCanvas ref={signatureRef} onSignedChange={setHasSigned} />
            </div>
            <p className="text-sm text-slate-500">박스 안에 손가락이나 마우스로 서명해 주세요.</p>
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => signatureRef.current?.clear()} variant="outline">지우기</Button>
              <Button onClick={() => { setStep("select"); setHasSigned(false); signatureRef.current?.clear(); }} variant="outline">이전</Button>
            </div>
            <Button className="w-full bg-lab-green hover:bg-lab-green/90 disabled:bg-lab-green/50" disabled={!hasSigned || submitting} onClick={handleSubmit}>
              {submitting ? "처리 중..." : "출석 완료"}
            </Button>
          </div>
        ) : null}

        {step === "done" ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 className="h-14 w-14 text-lab-green" />
            <p className="mt-4 text-xl font-semibold text-ink">출석 완료</p>
            <p className="mt-2 text-sm text-slate-500">{selected?.name}님, {doneMessage}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
