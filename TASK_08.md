# TASK_08 — 추진 일정 (간트차트)

## 목표
3월~6월 전체 추진 일정을 Recharts 기반 간트차트로 시각화한다.
각 단계의 시작일·종료일을 막대로 표현하고, 오늘 날짜 기준선을 표시한다.

## 전제 조건
TASK_00~TASK_07 완료

---

## Step 1 — 간트차트 컴포넌트
파일: `components/schedule/GanttChart.tsx`
```tsx
'use client'
import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer
} from 'recharts'

interface GanttRow {
  name: string
  type: string    // 'recruit' | 'workshop' | 'activity' | 'report'
  start: number   // 날짜를 타임스탬프(ms)로 변환
  duration: number // ms
  startLabel: string
  endLabel: string
}

const SCHEDULE = [
  { name: '모집 공고·홍보', type: 'recruit',  start: '2026-03-23', end: '2026-04-03' },
  { name: '심사 및 팀 구성', type: 'recruit',  start: '2026-04-01', end: '2026-04-07' },
  { name: '발대식 · 워크숍 1·2', type: 'workshop', start: '2026-04-07', end: '2026-04-07' },
  { name: '팀별 활동 1 (공감조사)', type: 'activity', start: '2026-04-08', end: '2026-04-10' },
  { name: '워크숍 3 (문제정의)', type: 'workshop', start: '2026-04-14', end: '2026-04-14' },
  { name: '팀별 활동 2 (자료조사)', type: 'activity', start: '2026-04-17', end: '2026-04-21' },
  { name: '워크숍 4 (프로토타입)', type: 'workshop', start: '2026-04-28', end: '2026-04-28' },
  { name: '팀별 활동 3 (검증)', type: 'activity', start: '2026-05-04', end: '2026-05-07' },
  { name: '워크숍 5 (결과 발표)', type: 'workshop', start: '2026-05-12', end: '2026-05-12' },
  { name: '결과보고서 작성', type: 'report', start: '2026-05-18', end: '2026-06-14' },
  { name: '산출물 최종 제출', type: 'report', start: '2026-06-01', end: '2026-06-14' },
]

const TYPE_COLORS: Record<string, string> = {
  recruit:  '#46549C',
  workshop: '#248DAC',
  activity: '#228D7B',
  report:   '#7C5CBF',
}

const DAY_MS = 86400000
const BASE_DATE = new Date('2026-03-16').getTime()

function toOffset(dateStr: string): number {
  return (new Date(dateStr).getTime() - BASE_DATE) / DAY_MS
}

function formatDate(ts: number): string {
  const d = new Date(BASE_DATE + ts * DAY_MS)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// X축 눈금 생성 (월별)
const TICKS = [0, 15, 31, 46, 61, 76, 91]  // 대략 3/16, 4/1, 5/1, 6/1 ...
const TICK_LABELS = ['3월말', '4월초', '4월중', '5월초', '5월중', '6월초', '6월중']

export default function GanttChart() {
  const today = (new Date().getTime() - BASE_DATE) / DAY_MS

  const data = useMemo(() => SCHEDULE.map(item => ({
    name: item.name,
    type: item.type,
    offset: toOffset(item.start),
    duration: Math.max(toOffset(item.end) - toOffset(item.start) + 1, 1),
    startLabel: item.start,
    endLabel: item.end,
  })), [])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0]?.payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-sm text-[11px]">
        <p className="font-medium text-gray-800 mb-1">{d.name}</p>
        <p className="text-gray-500">시작: {d.startLabel}</p>
        <p className="text-gray-500">종료: {d.endLabel}</p>
        <p className="text-gray-500">기간: {d.duration}일</p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <p className="text-[12px] font-medium">전체 추진 일정</p>
        <div className="flex items-center gap-3">
          {Object.entries(TYPE_COLORS).map(([type, color]) => {
            const labels: Record<string,string> = {
              recruit:'모집·선발', workshop:'워크숍', activity:'팀별활동', report:'결과보고'
            }
            return (
              <div key={type} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-[10px] text-gray-500">{labels[type]}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-1">
            <div className="w-px h-3 bg-red-500" />
            <span className="text-[10px] text-red-600">오늘</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 20, left: 130, bottom: 4 }}
          barSize={14}
        >
          <XAxis
            type="number"
            domain={[0, 95]}
            ticks={TICKS}
            tickFormatter={(v) => TICK_LABELS[TICKS.indexOf(v)] ?? ''}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={125}
            tick={{ fontSize: 11, fill: '#4b5563' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />

          {/* 오늘 기준선 */}
          <ReferenceLine
            x={today}
            stroke="#ef4444"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            label={{ value: '오늘', position: 'top', fontSize: 9, fill: '#ef4444' }}
          />

          {/* 투명 offset 막대 (공백용) */}
          <Bar dataKey="offset" stackId="a" fill="transparent" />

          {/* 실제 기간 막대 */}
          <Bar dataKey="duration" stackId="a" radius={[3, 3, 3, 3]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={TYPE_COLORS[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

## Step 2 — 추진 일정 페이지
파일: `app/dashboard/schedule/page.tsx`
```tsx
import Header from '@/components/layout/Header'
import GanttChart from '@/components/schedule/GanttChart'

const MILESTONES = [
  { date: '2026-04-20', label: '사업수행계획서 제출', type: '산출물' },
  { date: '2026-04-07', label: '발대식 · 워크숍 1·2', type: '워크숍' },
  { date: '2026-04-14', label: '워크숍 3', type: '워크숍' },
  { date: '2026-04-28', label: '워크숍 4', type: '워크숍' },
  { date: '2026-05-12', label: '워크숍 5 (결과 발표)', type: '워크숍' },
  { date: '2026-05-13', label: '팀별 활동보고서 제출', type: '산출물' },
  { date: '2026-06-14', label: '최종 결과보고서 제출', type: '산출물' },
]

export default function SchedulePage() {
  const today = new Date()
  const upcoming = MILESTONES
    .filter(m => new Date(m.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="추진 일정"
        subtitle="2026년 3월~6월 전체 일정 현황"
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 다가오는 마일스톤 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[12px] font-medium mb-3">주요 마일스톤</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {upcoming.map((m, i) => {
              const diff = Math.ceil((new Date(m.date).getTime() - today.getTime()) / 86400000)
              return (
                <div key={i} className="flex-shrink-0 border border-gray-200 rounded-lg p-3 min-w-[140px]">
                  <p className={`text-[10px] font-medium mb-1 ${
                    m.type === '워크숍' ? 'text-blue-600' : 'text-purple-600'
                  }`}>{m.type}</p>
                  <p className="text-[12px] text-gray-800 leading-tight mb-1.5">{m.label}</p>
                  <p className="text-[11px] text-gray-400">{m.date}</p>
                  <p className={`text-[11px] font-medium mt-1 ${
                    diff <= 7 ? 'text-red-600' : diff <= 14 ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {diff === 0 ? '오늘' : `D-${diff}`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* 간트차트 */}
        <GanttChart />

        {/* 전체 일정표 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-[12px] font-medium mb-3">단계별 일정 요약 (과업지시서)</p>
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-gray-500 font-medium w-36">기간</th>
                <th className="text-left py-2 text-gray-500 font-medium w-28">구분</th>
                <th className="text-left py-2 text-gray-500 font-medium">주요 내용</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[
                ['3월 4주~4월 1주', '모집·선발', '모집 공고/홍보, 심사, 팀 구성 운영'],
                ['4월 1주', '발대식·워크숍 1·2', '발대식 및 역량강화워크숍'],
                ['4월 1주', '팀별 활동 1', '공감/현장조사 활동 운영'],
                ['4월 2주', '워크숍 3', '문제정의, 솔루션 방향 설정'],
                ['4월 3주', '팀별 활동 2', '자료조사/현장답사/아이디어 구체화'],
                ['4월 4주', '워크숍 4', '프로토타입 도출 및 실증 설계'],
                ['5월 1주', '팀별 활동 3', '솔루션 검증/자료 제작'],
                ['5월 2주', '워크숍 5', '결과 발표, 피드백'],
                ['5월 3주~6월', '결과보고', '결과보고서 및 결과자료 제출'],
              ].map(([period, stage, desc], i) => (
                <tr key={i}>
                  <td className="py-2 text-gray-500">{period}</td>
                  <td className="py-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      stage.includes('워크숍') ? 'bg-blue-50 text-blue-700' :
                      stage.includes('활동') ? 'bg-green-50 text-green-700' :
                      stage.includes('모집') ? 'bg-navy/10 text-navy' :
                      'bg-purple-50 text-purple-700'
                    }`}>{stage}</span>
                  </td>
                  <td className="py-2 text-gray-600">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

## 검증 체크리스트
- [ ] 간트차트 수평 막대 11개 정상 표시
- [ ] 오늘 날짜 빨간 점선 기준선 표시
- [ ] 색상 범례 4종 표시
- [ ] 마일스톤 카드 D-day 계산 정확
- [ ] 일정 요약 표 9행 표시

## PR 제목
`feat: 추진 일정 간트차트 페이지 구현 (TASK_08)`
