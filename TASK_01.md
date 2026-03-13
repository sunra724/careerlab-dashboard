# TASK_01 — 미들웨어 인증 · 사이드바 · 헤더 레이아웃

## 목표
로그인 페이지 + 쿠키 기반 미들웨어 인증 + 대시보드 공통 레이아웃(사이드바 + 헤더)을 구현한다.
이 TASK 완료 후 비로그인 상태로 `/dashboard` 접근 시 `/login` 으로 리다이렉트되어야 한다.

## 전제 조건
- TASK_00 완료 (프로젝트, DB, 시드 세팅)

---

## Step 1 — 인증 헬퍼
파일: `lib/auth.ts`
```typescript
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

export const AUTH_COOKIE = 'careerlab_auth'

export function isAuthenticated(req: NextRequest): boolean {
  return req.cookies.get(AUTH_COOKIE)?.value === '1'
}

export async function getAuthCookie(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(AUTH_COOKIE)?.value === '1'
}
```

## Step 2 — 미들웨어
파일: `middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'

export function middleware(req: NextRequest) {
  const isAuth = req.cookies.get(AUTH_COOKIE)?.value === '1'
  if (!isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
```

## Step 3 — 로그인 API
파일: `app/api/auth/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(AUTH_COOKIE, '1', {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(AUTH_COOKIE)
  return res
}
```

## Step 4 — 로그인 페이지
파일: `app/login/page.tsx`
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    })
    if (res.ok) {
      router.push('/dashboard')
    } else {
      const data = await res.json()
      setError(data.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-xl border border-gray-200 p-8 w-full max-w-sm shadow-sm">
        <div className="mb-6 text-center">
          <div className="w-10 h-10 rounded-lg bg-navy mx-auto mb-3 flex items-center justify-center">
            <span className="text-white font-bold text-sm">소이</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">배운김에 남구</h1>
          <p className="text-sm text-gray-500 mt-1">경력보유여성 재도약 리빙랩</p>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-sm">비밀번호</Label>
            <Input
              id="password"
              type="password"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder="비밀번호 입력"
              className="mt-1"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button
            onClick={handleSubmit}
            disabled={loading || !pw}
            className="w-full bg-navy hover:bg-navy/90 text-white"
          >
            {loading ? '확인 중...' : '로그인'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

## Step 5 — 루트 리다이렉트
파일: `app/page.tsx`
```tsx
import { redirect } from 'next/navigation'
export default function RootPage() {
  redirect('/dashboard')
}
```

## Step 6 — 사이드바 컴포넌트
파일: `components/layout/Sidebar.tsx`
```tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, BookOpen,
  ClipboardList, BarChart2, FileText,
  CalendarDays, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/dashboard', label: '개요 대시보드', icon: LayoutDashboard, exact: true },
  { label: '참여자·팀', type: 'section' },
  { href: '/dashboard/participants', label: '참여자 관리', icon: Users },
  { label: '프로그램', type: 'section' },
  { href: '/dashboard/workshops', label: '워크숍 관리', icon: BookOpen },
  { href: '/dashboard/team-activities', label: '팀별 활동', icon: ClipboardList },
  { label: '성과·산출물', type: 'section' },
  { href: '/dashboard/kpi', label: '성과 지표', icon: BarChart2 },
  { href: '/dashboard/deliverables', label: '산출물 관리', icon: FileText },
  { href: '/dashboard/schedule', label: '추진 일정', icon: CalendarDays },
]

async function logout() {
  await fetch('/api/auth', { method: 'DELETE' })
  window.location.href = '/login'
}

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-48 min-h-screen bg-navy flex flex-col flex-shrink-0">
      {/* 로고 영역 */}
      <div className="px-4 py-4 border-b border-white/15">
        <p className="text-white/50 text-[10px] tracking-wide mb-1">배운김에 남구</p>
        <p className="text-white text-[13px] font-medium leading-snug">
          경력보유여성<br />재도약 리빙랩
        </p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item, i) => {
          if (item.type === 'section') {
            return (
              <p key={i} className="text-white/40 text-[10px] tracking-wide px-2 pt-3 pb-1">
                {item.label}
              </p>
            )
          }
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href!)
          const Icon = item.icon!
          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-[12px] transition-colors ${
                isActive
                  ? 'bg-white/20 text-white font-medium'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon size={14} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* 하단 */}
      <div className="p-3 border-t border-white/15">
        <p className="text-white/35 text-[10px] mb-2">협동조합 소이랩</p>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-[11px] transition-colors"
        >
          <LogOut size={12} />
          로그아웃
        </button>
      </div>
    </aside>
  )
}
```

## Step 7 — 헤더 컴포넌트
파일: `components/layout/Header.tsx`
```tsx
interface HeaderProps {
  title: string
  subtitle?: string
  badge?: { label: string; color?: 'green' | 'blue' | 'amber' | 'gray' }
  actions?: React.ReactNode
}

const badgeClasses = {
  green: 'bg-green-50 text-green-800',
  blue: 'bg-blue-50 text-blue-800',
  amber: 'bg-amber-50 text-amber-800',
  gray: 'bg-gray-100 text-gray-600',
}

export default function Header({ title, subtitle, badge, actions }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-[14px] font-medium text-gray-900">{title}</h1>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-[11px] px-2.5 py-1 rounded-md font-medium ${badgeClasses[badge.color ?? 'gray']}`}>
            {badge.label}
          </span>
        )}
        {actions}
      </div>
    </header>
  )
}
```

## Step 8 — 대시보드 레이아웃
파일: `app/dashboard/layout.tsx`
```tsx
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  )
}
```

## 검증 체크리스트

- [ ] `http://localhost:3000` 접근 시 `/login` 으로 리다이렉트
- [ ] 잘못된 비밀번호 입력 시 에러 메시지 표시
- [ ] 올바른 비밀번호(`careerlab2026`) 입력 시 `/dashboard` 진입
- [ ] 사이드바 모든 링크 클릭 가능 (페이지 없어도 OK)
- [ ] 현재 페이지 사이드바 항목 하이라이트 확인
- [ ] 로그아웃 버튼 → `/login` 이동

## PR 제목
`feat: 인증 미들웨어 · 사이드바 · 헤더 레이아웃 구현 (TASK_01)`
