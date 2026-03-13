"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "로그인에 실패했습니다.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "로그인에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-soft backdrop-blur lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative hidden overflow-hidden bg-navy px-10 py-12 text-white lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(36,141,172,0.28),transparent_34%)]" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.24em] text-white/55">
              Living Lab Dashboard
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-tight">
              배운김에 남구
              <br />
              성과관리 허브
            </h1>
            <p className="mt-6 max-w-md text-sm leading-7 text-white/75">
              2026년 경력보유여성 재도약 리빙랩의 모집, 워크숍, 팀 활동, 산출물,
              성과지표를 한 화면에서 관리합니다.
            </p>
            <div className="mt-12 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">참여 목표</p>
                <p className="mt-2 text-2xl font-semibold">30명</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs text-white/55">팀 구성</p>
                <p className="mt-2 text-2xl font-semibold">6팀</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-10 sm:px-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8 flex items-center gap-3">
              <Image src="/logo.svg" alt="배운김에 남구 로고" width={52} height={52} />
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                  Careerlab 2026
                </p>
                <h2 className="mt-1 text-xl font-semibold text-ink">
                  관리자 로그인
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="관리자 비밀번호를 입력하세요"
                  className="mt-3"
                />
                <p className="mt-3 text-xs text-slate-400">
                  기본 개발 비밀번호는 <code>careerlab2026</code> 입니다.
                </p>
              </div>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <Button
                type="submit"
                disabled={isSubmitting || !password.trim()}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? "확인 중..." : "대시보드 입장"}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
