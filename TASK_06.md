# TASK_06 — 성과 지표

## 목표
과업지시서 성과 지표 5개를 게이지·레이더 차트로 시각화하고,
KPI 스냅샷 수동 업데이트 기능을 구현한다.

## 전제 조건
TASK_00~TASK_05 완료

---

## Step 1 — KPI API

파일: `app/api/kpi/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()

  // DB 실시간 집계
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
    "SELECT COUNT(*) as c FROM deliverables WHERE deliverable_type='problem_solution' AND status IN ('submitted','approved')"
  ).get() as { c: number }).c
  const snapshots = db.prepare(
    'SELECT * FROM kpi_snapshots ORDER BY snapshot_date DESC LIMIT 6'
  ).all()

  return NextResponse.json({
    current: {
      participants: { value: participantsCount, target: 30, label: '참여자 모집' },
      workshops:    { value: workshopsDone,     target: 5,  label: '워크숍 운영 횟수' },
      activities:   { value: activitiesDone,    target: 3,  label: '팀별 활동 횟수' },
      solutions:    { value: solutionsCount,    target: 6,  label: '문제정의·솔루션 제안' },
      trainings:    { value: 0,                 target: 2,  label: '역량강화 교육 횟수' },
    },
    snapshots,
  })
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  db.prepare(`
    INSERT INTO kpi_snapshots (snapshot_date, participants_count, workshops_done,
      activities_done, solutions_count, trainings_done, note)
    VALUES (date('now'), ?, ?, ?, ?, ?, ?)
  `).run(
    body.participants_count ?? 0,
    body.workshops_done ?? 0,
    body.activities_done ?? 0,
    body.solutions_count ?? 0,
    body.trainings_done ?? 0,
    body.note ?? null
  )
  return NextResponse.json({ ok: true })
}
```

## Step 2 — KPI 게이지 컴포넌트
파일: `components/kpi/KpiGauge.tsx`
```tsx
interface KpiGaugeProps {
  label: string; value: number; target: number; color: string; unit?: string
}

export default function KpiGauge({ label, value, target, color, unit = '' }: KpiGaugeProps) {
  const pct = Math.min((value / target) * 100, 100)
  const r = 36, cx = 48, cy = 48
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" fontWeight="600" fill={color}>{value}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#9ca3af">/{target}{unit}</text>
      </svg>
      <p className="text-[12px] text-gray-600 text-center leading-tight mt-1">{label}</p>
      <p className="text-[11px] font-medium mt-0.5" style={{ color }}>{Math.round(pct)}%</p>
    </div>
  )
}
```

## Step 3 — KPI 레이더 차트
파일: `components/kpi/KpiRadarChart.tsx`
```tsx
'use client'
import {
  RadarChart, PolarGrid, PolarAngleAxis,
  Radar, ResponsiveContainer, Tooltip
} from 'recharts'

interface RadarData {
  subject: string; value: number; fullMark: number
}

export default function KpiRadarChart({ data }: { data: RadarData[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-[12px] font-medium mb-3">종합 달성도</p>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#6b7280' }}
          />
          <Radar
            name="달성률"
            dataKey="value"
            stroke="#46549C"
            fill="#46549C"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip
            formatter={(val: number, _, props) =>
              [`${val} / ${props.payload.fullMark}`, props.payload.subject]
            }
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Step 4 — 성과 지표 페이지
파일: `app/dashboard/kpi/page.tsx`
```tsx
'use client'
import useSWR from 'swr'
import Header from '@/components/layout/Header'
import KpiGauge from '@/components/kpi/KpiGauge'
import KpiRadarChart from '@/components/kpi/KpiRadarChart'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const KPI_COLORS = {
  participants: '#46549C',
  workshops:    '#248DAC',
  activities:   '#228D7B',
  solutions:    '#A32D2D',
  trainings:    '#7C5CBF',
}

const RADAR_SUBJECTS: Record<string, string> = {
  participants: '참여자',
  workshops:    '워크숍',
  activities:   '팀활동',
  solutions:    '솔루션',
  trainings:    '역량교육',
}

export default function KpiPage() {
  const { data } = useSWR('/api/kpi', fetcher)
  if (!data) return <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">로딩 중...</div>

  const { current } = data
  const gauges = Object.entries(current) as [string, { value: number; target: number; label: string }][]

  const radarData = gauges.map(([key, kpi]) => ({
    subject: RADAR_SUBJECTS[key],
    value: Math.round((kpi.value / kpi.target) * 100),
    fullMark: 100,
  }))

  const overallPct = Math.round(
    gauges.reduce((sum, [, kpi]) => sum + (kpi.value / kpi.target) * 100, 0) / gauges.length
  )

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="성과 지표"
        subtitle={`전체 달성률 ${overallPct}%`}
        badge={{ label: `${overallPct}%`, color: overallPct >= 80 ? 'green' : overallPct >= 50 ? 'blue' : 'amber' }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 게이지 5개 */}
        <div className="grid grid-cols-5 gap-3">
          {gauges.map(([key, kpi]) => (
            <KpiGauge
              key={key}
              label={kpi.label}
              value={kpi.value}
              target={kpi.target}
              color={KPI_COLORS[key as keyof typeof KPI_COLORS]}
            />
          ))}
        </div>

        {/* 레이더 + 지표 목표 표 */}
        <div className="grid grid-cols-2 gap-3">
          <KpiRadarChart data={radarData} />
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-[12px] font-medium mb-3">성과 지표 목표 (과업지시서)</p>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-1.5 text-gray-500 font-medium">구분</th>
                  <th className="text-left py-1.5 text-gray-500 font-medium">지표</th>
                  <th className="text-right py-1.5 text-gray-500 font-medium">목표</th>
                  <th className="text-right py-1.5 text-gray-500 font-medium">현황</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {gauges.map(([key, kpi]) => (
                  <tr key={key}>
                    <td className="py-1.5 text-gray-500 text-[10px]">정량</td>
                    <td className="py-1.5">{kpi.label}</td>
                    <td className="py-1.5 text-right text-gray-600">{kpi.target}</td>
                    <td className="py-1.5 text-right font-medium" style={{ color: KPI_COLORS[key as keyof typeof KPI_COLORS] }}>
                      {kpi.value}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1.5 text-gray-500 text-[10px]">정성</td>
                  <td className="py-1.5">참여자 역량 강화</td>
                  <td className="py-1.5 text-right text-gray-600">설문/인터뷰</td>
                  <td className="py-1.5 text-right text-gray-400">진행 중</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 검증 체크리스트
- [ ] KPI 게이지 5개 정상 렌더링 (SVG 원형)
- [ ] 레이더 차트 5각형 표시
- [ ] 지표 목표표 과업지시서 기준과 일치
- [ ] 전체 달성률 헤더 뱃지 표시

## PR 제목
`feat: 성과 지표 게이지·레이더 차트 페이지 구현 (TASK_06)`
