# TASK_02 — 홈/개요 대시보드

## 목표
`/dashboard` 메인 페이지에 KPI 카드 4개, 타임라인, 산출물 현황, 팀별 요약 그리드를 구현한다.
모든 데이터는 API Route를 통해 SQLite에서 가져온다.

## 전제 조건
- TASK_00, TASK_01 완료

---

## Step 1 — 개요 API
파일: `app/api/overview/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  const participantsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM participants WHERE status='active'"
  ).get() as { c: number }).c

  const workshopsDone = (db.prepare(
    "SELECT COUNT(*) as c FROM workshops WHERE status='done'"
  ).get() as { c: number }).c

  const activitiesDone = (db.prepare(
    "SELECT COUNT(*) as c FROM team_activities WHERE status='done'"
  ).get() as { c: number }).c

  const solutionsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM deliverables WHERE deliverable_type='problem_solution' AND status='submitted'"
  ).get() as { c: number }).c

  const deliverables = db.prepare(
    'SELECT id, title, due_date, status, deliverable_type FROM deliverables ORDER BY due_date'
  ).all()

  const teams = db.prepare(`
    SELECT t.id, t.name, t.topic, t.color,
      COUNT(DISTINCT p.id) as member_count,
      SUM(CASE WHEN ta.status='done' THEN 1 ELSE 0 END) as activities_done
    FROM teams t
    LEFT JOIN participants p ON p.team_id = t.id AND p.status='active'
    LEFT JOIN team_activities ta ON ta.team_id = t.id
    GROUP BY t.id
    ORDER BY t.id
  `).all()

  return NextResponse.json({
    kpi: { participantsCount, workshopsDone, activitiesDone, solutionsCount },
    deliverables,
    teams,
  })
}
```

## Step 2 — KPI 카드 컴포넌트
파일: `components/dashboard/KpiCard.tsx`
```tsx
interface KpiCardProps {
  label: string
  current: number
  target: number
  unit: string
  color: string
}

export default function KpiCard({ label, current, target, unit, color }: KpiCardProps) {
  const pct = Math.min(Math.round((current / target) * 100), 100)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3.5">
      <p className="text-[10px] text-gray-500 mb-2">{label}</p>
      <p className="text-[19px] font-medium" style={{ color }}>
        {current}
        <span className="text-[11px] text-gray-400 font-normal ml-1">/ {target}{unit}</span>
      </p>
      <div className="h-1.5 bg-gray-100 rounded-full mt-2.5">
        <div
          className="h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">달성률 {pct}%</p>
    </div>
  )
}
```

## Step 3 — 타임라인 카드
파일: `components/dashboard/TimelineCard.tsx`
```tsx
const TIMELINE = [
  { label: '모집·선발', period: '3월 4주~4월 1주', key: 'recruit' },
  { label: '발대식·워크숍 1·2', period: '4월 1주', key: 'ws12' },
  { label: '워크숍 3 + 팀별 활동 1·2', period: '4월 2~4주', key: 'mid' },
  { label: '팀별 활동 3 · 결과 발표', period: '5월 1~2주', key: 'ws5' },
  { label: '결과보고', period: '5월 3주~6월', key: 'report' },
]

interface TimelineCardProps {
  currentStage?: string
}

export default function TimelineCard({ currentStage = 'recruit' }: TimelineCardProps) {
  const currentIdx = TIMELINE.findIndex(t => t.key === currentStage)
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3.5 h-full">
      <p className="text-[12px] font-medium mb-3">추진 일정</p>
      <div className="flex flex-col gap-0">
        {TIMELINE.map((item, i) => {
          const isDone = i < currentIdx
          const isCurrent = i === currentIdx
          return (
            <div key={item.key} className="flex gap-2.5">
              <div className="flex flex-col items-center flex-shrink-0 pt-1">
                <div className={`w-2 h-2 rounded-full border-[1.5px] flex-shrink-0 ${
                  isDone ? 'bg-green-500 border-green-500' :
                  isCurrent ? 'bg-navy border-navy' :
                  'bg-white border-gray-300'
                }`} />
                {i < TIMELINE.length - 1 && (
                  <div className={`w-px flex-1 mt-0.5 min-h-[18px] ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
              <div className={`pb-2.5 ${i < TIMELINE.length - 1 ? '' : ''}`}>
                <p className={`text-[11px] font-medium leading-tight ${
                  isCurrent ? 'text-navy' : isDone ? 'text-gray-400' : 'text-gray-700'
                }`}>{item.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{item.period}{isCurrent ? ' · 진행 중' : ''}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

## Step 4 — 산출물 현황 카드
파일: `components/dashboard/DeliverableStatusCard.tsx`
```tsx
import { format, differenceInDays, parseISO } from 'date-fns'

interface Deliverable {
  id: number; title: string; due_date: string; status: string
}

const STATUS_CLASS: Record<string, string> = {
  submitted: 'bg-green-50 text-green-800',
  approved:  'bg-green-100 text-green-900',
  pending:   'bg-amber-50 text-amber-800',
}

function DdayBadge({ dueDate, status }: { dueDate: string; status: string }) {
  if (status === 'submitted' || status === 'approved') {
    return <span className="text-[10px] bg-green-50 text-green-800 px-2 py-0.5 rounded">제출 완료</span>
  }
  const diff = differenceInDays(parseISO(dueDate), new Date())
  if (diff < 0) return <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded">기한 초과</span>
  if (diff <= 7) return <span className="text-[10px] bg-red-50 text-red-700 px-2 py-0.5 rounded">D-{diff}</span>
  if (diff <= 14) return <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded">D-{diff}</span>
  return <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">미시작</span>
}

export default function DeliverableStatusCard({ deliverables }: { deliverables: Deliverable[] }) {
  const submitted = deliverables.filter(d => d.status === 'submitted' || d.status === 'approved').length
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3.5 h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[12px] font-medium">산출물 제출 현황</p>
        <p className="text-[10px] text-gray-400">{submitted} / {deliverables.length} 제출</p>
      </div>
      <div className="divide-y divide-gray-100">
        {deliverables.map(d => (
          <div key={d.id} className="flex justify-between items-center py-1.5">
            <span className="text-[11px] text-gray-700 truncate max-w-[160px]">{d.title}</span>
            <DdayBadge dueDate={d.due_date} status={d.status} />
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Step 5 — 팀 요약 그리드
파일: `components/dashboard/TeamSummaryGrid.tsx`
```tsx
interface TeamSummary {
  id: number; name: string; topic: string | null; color: string
  member_count: number; activities_done: number
}

export default function TeamSummaryGrid({ teams }: { teams: TeamSummary[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3.5">
      <p className="text-[12px] font-medium mb-3">
        팀별 현황
        <span className="text-[10px] text-gray-400 font-normal ml-2">총 {teams.length}팀</span>
      </p>
      <div className="grid grid-cols-3 gap-2">
        {teams.map(team => (
          <div key={team.id} className="border border-gray-200 rounded-md p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] font-medium" style={{ color: team.color }}>{team.name}</span>
              <span className={`w-2 h-2 rounded-full ${team.activities_done > 0 ? 'bg-green-400' : 'bg-gray-300'}`} />
            </div>
            <p className="text-[10px] text-gray-500 leading-tight line-clamp-2 mb-1.5">
              {team.topic ?? '현안 미정'}
            </p>
            <p className="text-[10px] text-gray-400">{team.member_count}명 · 활동 {team.activities_done}/3</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

## Step 6 — 홈 페이지 조합
파일: `app/dashboard/page.tsx`
```tsx
import Header from '@/components/layout/Header'
import KpiCard from '@/components/dashboard/KpiCard'
import TimelineCard from '@/components/dashboard/TimelineCard'
import DeliverableStatusCard from '@/components/dashboard/DeliverableStatusCard'
import TeamSummaryGrid from '@/components/dashboard/TeamSummaryGrid'
import { getDb } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  seedDatabase()
  const db = getDb()

  const participantsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM participants WHERE status='active'"
  ).get() as { c: number }).c
  const workshopsDone = (db.prepare(
    "SELECT COUNT(*) as c FROM workshops WHERE status='done'"
  ).get() as { c: number }).c
  const activitiesDone = (db.prepare(
    "SELECT COUNT(*) as c FROM team_activities WHERE status='done'"
  ).get() as { c: number }).c
  const solutionsCount = (db.prepare(
    "SELECT COUNT(*) as c FROM deliverables WHERE deliverable_type='problem_solution' AND status='submitted'"
  ).get() as { c: number }).c
  const deliverables = db.prepare(
    'SELECT id, title, due_date, status FROM deliverables ORDER BY due_date'
  ).all() as any[]
  const teams = db.prepare(`
    SELECT t.id, t.name, t.topic, t.color,
      COUNT(DISTINCT p.id) as member_count,
      SUM(CASE WHEN ta.status='done' THEN 1 ELSE 0 END) as activities_done
    FROM teams t
    LEFT JOIN participants p ON p.team_id=t.id AND p.status='active'
    LEFT JOIN team_activities ta ON ta.team_id=t.id
    GROUP BY t.id ORDER BY t.id
  `).all() as any[]

  const KPI_ITEMS = [
    { label: '참여자 모집', current: participantsCount, target: 30, unit: '명', color: '#46549C' },
    { label: '워크숍 운영', current: workshopsDone, target: 5, unit: '회', color: '#248DAC' },
    { label: '팀별 활동', current: activitiesDone, target: 18, unit: '건', color: '#228D7B' },
    { label: '솔루션 제안', current: solutionsCount, target: 6, unit: '식', color: '#A32D2D' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="개요 대시보드"
        subtitle="2026년 경력보유여성 재도약 리빙랩 「배운김에 남구」"
        badge={{ label: '모집·선발 단계', color: 'green' }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* KPI 카드 4개 */}
        <div className="grid grid-cols-4 gap-3">
          {KPI_ITEMS.map(item => <KpiCard key={item.label} {...item} />)}
        </div>
        {/* 타임라인 + 산출물 */}
        <div className="grid grid-cols-2 gap-3">
          <TimelineCard currentStage="recruit" />
          <DeliverableStatusCard deliverables={deliverables} />
        </div>
        {/* 팀 요약 */}
        <TeamSummaryGrid teams={teams} />
      </div>
    </div>
  )
}
```

## 검증 체크리스트

- [ ] `/dashboard` 접근 시 KPI 카드 4개 렌더링
- [ ] 진행률 바 0% 표시 (시드 데이터 초기값)
- [ ] 타임라인 '모집·선발' 단계 하이라이트
- [ ] 산출물 7개 모두 '미시작' 뱃지 표시
- [ ] 팀 6개 카드 3열 그리드 표시
- [ ] 페이지 스크롤 가능, 레이아웃 깨짐 없음

## PR 제목
`feat: 홈/개요 대시보드 구현 (TASK_02)`
