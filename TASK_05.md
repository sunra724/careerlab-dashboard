# TASK_05 — 팀별 활동

## 목표
6팀 × 3회 활동을 매트릭스 형태로 시각화하고,
각 활동의 상태 변경·활동보고서 URL 등록을 구현한다.

## 전제 조건
TASK_00~TASK_04 완료

---

## Step 1 — 팀별 활동 API

파일: `app/api/team-activities/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const activities = db.prepare(`
    SELECT ta.*, t.name as team_name, t.color as team_color
    FROM team_activities ta
    JOIN teams t ON t.id = ta.team_id
    ORDER BY ta.team_id, ta.activity_no
  `).all()
  return NextResponse.json(activities)
}
```

파일: `app/api/team-activities/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const body = await req.json()
  const allowed = ['status','held_date','location','summary','report_url','evidence_urls','activity_type']
  const fields = allowed.filter(f => f in body).map(f => `${f}=?`)
  const values = allowed.filter(f => f in body).map(f => body[f])
  if (fields.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 })
  db.prepare(`UPDATE team_activities SET ${fields.join(',')} WHERE id=?`).run(...values, params.id)
  return NextResponse.json({ ok: true })
}
```

## Step 2 — 활동 매트릭스 컴포넌트
파일: `components/team-activities/ActivityMatrix.tsx`
```tsx
'use client'
import { useState } from 'react'
import { FileText, MapPin, ChevronDown, ChevronUp } from 'lucide-react'

interface Activity {
  id: number; team_id: number; team_name: string; team_color: string
  activity_no: number; activity_type: string; held_date: string | null
  location: string | null; summary: string | null
  status: string; report_url: string | null
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  planned:  { label: '예정',    cls: 'bg-amber-50 text-amber-800' },
  ongoing:  { label: '진행 중', cls: 'bg-blue-50 text-blue-800' },
  done:     { label: '완료',    cls: 'bg-green-50 text-green-800' },
}

const ACTIVITY_LABELS = ['1회 공감·현장조사', '2회 자료조사·구체화', '3회 솔루션 검증']

export default function ActivityMatrix({
  activities, onUpdate
}: {
  activities: Activity[]
  onUpdate: (id: number, data: object) => void
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // 팀별 그룹화
  const byTeam: Record<number, Activity[]> = {}
  activities.forEach(a => {
    if (!byTeam[a.team_id]) byTeam[a.team_id] = []
    byTeam[a.team_id].push(a)
  })
  const teamIds = Object.keys(byTeam).map(Number).sort()

  return (
    <div className="space-y-3">
      {/* 헤더 */}
      <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-2 text-[11px] text-gray-500 font-medium px-1">
        <div>팀</div>
        {ACTIVITY_LABELS.map(l => <div key={l}>{l}</div>)}
      </div>

      {/* 팀별 행 */}
      {teamIds.map(tid => {
        const teamActs = byTeam[tid].sort((a, b) => a.activity_no - b.activity_no)
        const team = teamActs[0]

        return (
          <div key={tid} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[120px_1fr_1fr_1fr] gap-2 p-3 items-start">
              {/* 팀명 */}
              <div>
                <span className="text-[12px] font-medium" style={{ color: team.team_color }}>
                  {team.team_name}
                </span>
              </div>

              {/* 활동 1~3 */}
              {teamActs.map(act => {
                const s = STATUS_MAP[act.status] ?? STATUS_MAP.planned
                const isExpanded = expandedId === act.id
                return (
                  <div key={act.id} className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.cls}`}>{s.label}</span>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : act.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>

                    {act.held_date && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        📅 {act.held_date}
                      </p>
                    )}

                    {isExpanded && (
                      <div className="space-y-1.5 pt-1 border-t border-gray-100">
                        {act.location && (
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <MapPin size={10} /> {act.location}
                          </p>
                        )}
                        {act.summary && (
                          <p className="text-[10px] text-gray-600 leading-tight">{act.summary}</p>
                        )}
                        {act.report_url ? (
                          <a href={act.report_url} target="_blank" rel="noopener"
                            className="text-[10px] text-blue-600 flex items-center gap-1 hover:underline">
                            <FileText size={10} /> 활동보고서
                          </a>
                        ) : (
                          <p className="text-[10px] text-gray-300">보고서 미등록</p>
                        )}
                        <div className="flex gap-1">
                          {['planned','ongoing','done'].map(st => (
                            <button
                              key={st}
                              onClick={() => onUpdate(act.id, { status: st })}
                              className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                                act.status === st
                                  ? 'border-navy bg-navy text-white'
                                  : 'border-gray-200 text-gray-400 hover:border-gray-400'
                              }`}
                            >
                              {STATUS_MAP[st].label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

## Step 3 — 팀별 활동 페이지
파일: `app/dashboard/team-activities/page.tsx`
```tsx
'use client'
import useSWR from 'swr'
import Header from '@/components/layout/Header'
import ActivityMatrix from '@/components/team-activities/ActivityMatrix'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function TeamActivitiesPage() {
  const { data, mutate } = useSWR('/api/team-activities', fetcher)
  const activities = data ?? []
  const doneCount = activities.filter((a: any) => a.status === 'done').length

  async function handleUpdate(id: number, payload: object) {
    await fetch(`/api/team-activities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    mutate()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="팀별 활동"
        subtitle={`6팀 × 3회 = 총 18건 · ${doneCount}건 완료`}
        badge={{ label: `${doneCount}/18건`, color: doneCount >= 18 ? 'green' : 'blue' }}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {/* 요약 통계 */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['planned','ongoing','done'].map(s => {
            const count = activities.filter((a: any) => a.status === s).length
            const labels: Record<string,string> = { planned:'예정', ongoing:'진행 중', done:'완료' }
            const colors: Record<string,string> = { planned:'text-amber-700', ongoing:'text-blue-700', done:'text-green-700' }
            return (
              <div key={s} className="bg-white border border-gray-200 rounded-lg p-3 text-center">
                <p className="text-[10px] text-gray-500">{labels[s]}</p>
                <p className={`text-[22px] font-medium ${colors[s]}`}>{count}</p>
                <p className="text-[10px] text-gray-400">건</p>
              </div>
            )
          })}
        </div>
        <ActivityMatrix activities={activities} onUpdate={handleUpdate} />
      </div>
    </div>
  )
}
```

## 검증 체크리스트
- [ ] 6팀 × 3열 매트릭스 정상 표시
- [ ] 각 셀 클릭 시 상세 정보 확장
- [ ] 상태 버튼 → 즉시 반영
- [ ] 요약 통계 카드 합계 = 18

## PR 제목
`feat: 팀별 활동 매트릭스 페이지 구현 (TASK_05)`
