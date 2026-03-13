# TASK_04 — 워크숍 관리

## 목표
5회차 워크숍 카드 UI, 회차별 출석 현황, 운영계획서·결과보고서 URL 관리를 구현한다.

## 전제 조건
TASK_00~TASK_03 완료

---

## Step 1 — 워크숍 API

파일: `app/api/workshops/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  const workshops = db.prepare('SELECT * FROM workshops ORDER BY session_no').all()
  const attendance = db.prepare(`
    SELECT wa.workshop_id,
      COUNT(CASE WHEN wa.attended=1 THEN 1 END) as attended_count,
      COUNT(wa.id) as total_count
    FROM workshop_attendance wa
    GROUP BY wa.workshop_id
  `).all() as { workshop_id: number; attended_count: number; total_count: number }[]
  const attMap = Object.fromEntries(attendance.map(a => [a.workshop_id, a]))
  const result = (workshops as any[]).map(w => ({
    ...w,
    attended_count: attMap[w.id]?.attended_count ?? 0,
    total_invited: attMap[w.id]?.total_count ?? 0,
  }))
  return NextResponse.json(result)
}
```

파일: `app/api/workshops/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const body = await req.json()
  const allowed = ['status','held_date','location','facilitator','plan_doc_url','result_doc_url','note']
  const fields = allowed.filter(f => f in body).map(f => `${f}=?`)
  const values = allowed.filter(f => f in body).map(f => body[f])
  if (fields.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 })
  db.prepare(`UPDATE workshops SET ${fields.join(',')} WHERE id=?`).run(...values, params.id)
  return NextResponse.json({ ok: true })
}
```

## Step 2 — 워크숍 카드 컴포넌트
파일: `components/workshops/WorkshopCard.tsx`
```tsx
'use client'
import { ExternalLink, FileText } from 'lucide-react'

interface Workshop {
  id: number; session_no: number; title: string; held_date: string
  location: string; facilitator: string; status: string
  plan_doc_url: string | null; result_doc_url: string | null
  attended_count: number; total_invited: number
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  planned:  { label: '예정', cls: 'bg-amber-50 text-amber-800' },
  ongoing:  { label: '진행 중', cls: 'bg-blue-50 text-blue-800' },
  done:     { label: '완료', cls: 'bg-green-50 text-green-800' },
}

export default function WorkshopCard({
  workshop, onUpdate
}: {
  workshop: Workshop
  onUpdate: (id: number, data: Partial<Workshop>) => void
}) {
  const s = STATUS_MAP[workshop.status] ?? STATUS_MAP.planned

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-medium flex items-center justify-center flex-shrink-0">
            {workshop.session_no}
          </span>
          <p className="text-[13px] font-medium text-gray-900 leading-tight">{workshop.title}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ml-2 ${s.cls}`}>{s.label}</span>
      </div>
      <div className="space-y-1 text-[11px] text-gray-500 ml-8">
        <p>📅 {workshop.held_date ?? '날짜 미정'} · {workshop.location ?? '장소 미정'}</p>
        <p>👤 {workshop.facilitator ?? '퍼실리테이터 미정'}</p>
        {workshop.total_invited > 0 && (
          <p>참석 {workshop.attended_count}/{workshop.total_invited}명</p>
        )}
        <div className="flex gap-3 mt-2">
          {workshop.plan_doc_url ? (
            <a href={workshop.plan_doc_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-blue-600 hover:underline">
              <FileText size={11} /> 운영계획서
            </a>
          ) : (
            <span className="text-gray-300">운영계획서 미등록</span>
          )}
          {workshop.result_doc_url ? (
            <a href={workshop.result_doc_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-green-600 hover:underline">
              <ExternalLink size={11} /> 결과보고서
            </a>
          ) : (
            <span className="text-gray-300">결과보고서 미등록</span>
          )}
        </div>
      </div>
      <div className="mt-3 ml-8 flex gap-2">
        {['planned','ongoing','done'].map(s => (
          <button
            key={s}
            onClick={() => onUpdate(workshop.id, { status: s })}
            className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
              workshop.status === s
                ? 'border-navy bg-navy text-white'
                : 'border-gray-200 text-gray-500 hover:border-gray-400'
            }`}
          >
            {STATUS_MAP[s].label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

## Step 3 — 워크숍 관리 페이지
파일: `app/dashboard/workshops/page.tsx`
```tsx
'use client'
import useSWR from 'swr'
import Header from '@/components/layout/Header'
import WorkshopCard from '@/components/workshops/WorkshopCard'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function WorkshopsPage() {
  const { data, mutate } = useSWR('/api/workshops', fetcher)
  const workshops = data ?? []
  const doneCount = workshops.filter((w: any) => w.status === 'done').length

  async function handleUpdate(id: number, payload: object) {
    await fetch(`/api/workshops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    mutate()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="워크숍 관리"
        subtitle="5회차 통합 워크숍 운영 현황"
        badge={{ label: `${doneCount}/5회 완료`, color: doneCount >= 5 ? 'green' : 'amber' }}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {/* 진행률 바 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between text-[12px] text-gray-500 mb-2">
            <span>전체 진행률</span>
            <span>{doneCount}/5 회차 완료</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div
              className="h-2 bg-blue-lab rounded-full transition-all duration-500"
              style={{ width: `${(doneCount / 5) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {workshops.map((w: any) => (
              <div key={w.id} className="text-center">
                <div className={`w-3 h-3 rounded-full mx-auto ${
                  w.status === 'done' ? 'bg-green-500' :
                  w.status === 'ongoing' ? 'bg-blue-500' : 'bg-gray-200'
                }`} />
                <p className="text-[9px] text-gray-400 mt-0.5">{w.session_no}회</p>
              </div>
            ))}
          </div>
        </div>
        {/* 워크숍 카드 목록 */}
        <div className="space-y-3">
          {workshops.map((w: any) => (
            <WorkshopCard key={w.id} workshop={w} onUpdate={handleUpdate} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 검증 체크리스트
- [ ] 워크숍 5개 카드 렌더링
- [ ] 상태 버튼 클릭 → 즉시 반영
- [ ] 진행률 바 업데이트 확인
- [ ] 운영계획서/결과보고서 링크 영역 표시

## PR 제목
`feat: 워크숍 관리 페이지 구현 (TASK_04)`
