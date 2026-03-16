"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Download, ExternalLink, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetcher";
import type { AttendanceSessionType } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function QrModal({
  sessionId,
  sessionTitle,
  sessionType,
  onClose,
}: {
  sessionId: number;
  sessionTitle: string;
  sessionType: AttendanceSessionType;
  onClose: () => void;
}) {
  const [data, setData] = useState<{ qr: string; url: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchJson<{ qr: string; url: string }>(
      `/api/qr?session_type=${sessionType}&session_id=${sessionId}`,
    )
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("QR 코드를 불러오지 못했습니다.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, sessionType]);

  function downloadQr() {
    if (!data) {
      return;
    }

    const link = document.createElement("a");
    link.href = data.qr;
    link.download = `attendance-qr-${sessionType}-${sessionId}.png`;
    link.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" onClick={(event) => { if (event.target === event.currentTarget) { onClose(); } }}>
      <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-ink">출석 QR 코드</p>
            <p className="mt-1 text-sm text-slate-500">{sessionTitle}</p>
          </div>
          <button className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {error ? (
            <p className="py-16 text-center text-sm text-red-700">{error}</p>
          ) : data ? (
            <Image alt="출석 QR 코드" className="mx-auto rounded-2xl bg-white" height={256} src={data.qr} unoptimized width={256} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">QR 코드를 생성하는 중입니다.</p>
          )}
        </div>

        {data ? <p className="mt-3 break-all text-xs text-slate-400">{data.url}</p> : null}

        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button disabled={!data} onClick={downloadQr} variant="outline">
            <Download className="mr-1 h-4 w-4" />
            이미지 저장
          </Button>
          <a
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50",
              !data && "pointer-events-none opacity-50",
            )}
            href={data?.url ?? "#"}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="mr-1 h-4 w-4" />
            링크 열기
          </a>
        </div>
      </div>
    </div>
  );
}
