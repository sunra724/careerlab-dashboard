"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem =
  | { label: string; type: "section" }
  | {
      type: "link";
      href: string;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
      exact?: boolean;
    };

const NAV_ITEMS: NavItem[] = [
  {
    type: "link",
    href: "/dashboard",
    label: "개요 대시보드",
    icon: LayoutDashboard,
    exact: true,
  },
  { label: "참여자·팀", type: "section" },
  { type: "link", href: "/dashboard/participants", label: "참여자 관리", icon: Users },
  { label: "프로그램", type: "section" },
  { type: "link", href: "/dashboard/workshops", label: "워크숍 관리", icon: BookOpen },
  {
    type: "link",
    href: "/dashboard/team-activities",
    label: "팀별 활동",
    icon: ClipboardList,
  },
  { label: "성과·산출물", type: "section" },
  { type: "link", href: "/dashboard/kpi", label: "성과 지표", icon: BarChart3 },
  { type: "link", href: "/dashboard/deliverables", label: "산출물 관리", icon: FileText },
  { type: "link", href: "/dashboard/schedule", label: "추진 일정", icon: CalendarDays },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/login";
  }

  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/15 bg-navy text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="배운김에 남구 로고" width={44} height={44} />
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
              Careerlab 2026
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-white">
              배운김에 남구
              <br />
              성과관리 대시보드
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          if (item.type === "section") {
            return (
              <p
                key={item.label}
                className="px-3 text-[11px] uppercase tracking-[0.2em] text-white/35"
              >
                {item.label}
              </p>
            );
          }

          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition-colors",
                isActive
                  ? "bg-white/16 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                  : "text-white/72 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <p className="mb-3 text-xs text-white/45">운영기관 · 협동조합 소이랩</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full justify-start rounded-2xl px-3 text-white hover:bg-white/10 hover:text-white"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
        </Button>
      </div>
    </aside>
  );
}
