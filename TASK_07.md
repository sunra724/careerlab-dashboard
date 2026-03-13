# TASK_07 — 산출물 관리

## 목표
7종 산출물 제출 현황을 D-day 뱃지와 함께 관리하고,
URL 등록 및 상태 변경 기능을 구현한다.

## 전제 조건
TASK_00~TASK_06 완료

---

## Step 1 — 산출물 API

파일: `app/api/deliverables/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  const db = getDb()
  return NextResponse.json(db.prepare('SELECT * FROM deliverables ORDER BY due_date').all())
}
```

파일: `app/api/deliverables/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const body = await req.json()
  const allowed = ['status', 'file_url', 'submitted_at', 'note']
  const fields = allowed.filter(f => f in body).map(f => `${f}=?`)
  const values = allowed.filter(f => f in body).map(f => body[f])

  // 제출 완료 시 자동으로 submitted_at 설정
  if (body.status === 'submitted' && !body.submitted_at) {
    fields.push('submitted_at=?')
    values.push(new Date().toISOString().split('T')[0])
  }
  if (fields.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 })
  db.prepare(`UPDATE deliverables SET ${fields.join(',')} WHERE id=?`).run(...values, params.id)
  return NextResponse.json({ ok: true })
}
```

## Step 2 — 산출물 행 컴포넌트
파일: `components/deliverables/DeliverableRow.tsx`
```tsx
'use client'
import { useState } from 'react'
import { differenceInDays, parseISO } from 'date-fns'
import { ExternalLink, CheckCircle, Clock, FileText } from 'lucide-react'

interface Deliverable {
  id: number; title: string; deliverable_type: string
  due_date: string; submitted_at: string | null
  file_url: string | null; status: string; note: string | null
}

function DdayBadge({ dueDate, status }: { dueDate: string; status: string }) {
  if (status === 'submitted' || status === 'approved') {
    return (
      <span className="flex items-center gap-1 text-[11px] bg-green-50 text-green-800 px-2 py-0.5 rounded-md">
        <CheckCircle size={10} /> 제출 완료
      </span>
    )
  }
  const diff = differenceInDays(parseISO(dueDate), new Date())
  if (diff < 0) return <span className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-md">기한 초과 {Math.abs(diff)}일</span>
  if (diff === 0) return <span className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-md font-medium">오늘 마감</span>
  if (diff <= 7) return <span className="text-[11px] bg-red-50 text-red-700 px-2 py-0.5 rounded-md">D-{diff}</span>
  if (diff <= 14) return <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">D-{diff}</span>
  return <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">D-{diff}</span>
}

const TYPE_ICON: Record<string, string> = {
  plan:             '📋',
  workshop_plan:    '📅',
  workshop_result:  '📝',
  activity_report:  '🏃',
  problem_solution: '💡',
  photo_record:     '📸',
  final_report:     '📊',
}

export default function DeliverableRow({
  item, onUpdate
}: {
  item: Deliverable
  onUpdate: (id: number, data: object) => void
}) {
  const [urlInput, setUrlInput] = useState(item.file_url ?? '')
  const [editing, setEditing] = useState(false)

  return (
    <div className={`flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-0 ${
      item.status === 'submitted' || item.status === 'approved' ? 'bg-green-50/30' : ''
    }`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="text-[16px] flex-shrink-0">{TYPE_ICON[item.deliverable_type] ?? '📄'}</span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-gray-800 truncate">{item.title}</p>
          <p className="text-[11px] text-gray-400">마감: {item.due_date}</p>
          {item.submitted_at && (
            <p className="text-[11px] text-green-600">제출: {item.submitted_at}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* 파일 URL */}
        {editing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              placeholder="파일 URL 입력"
              className="border border-gray-300 rounded px-2 py-0.5 text-[11px] w-48 focus:outline-none focus:border-navy"
            />
            <button
              onClick={async () => {
                await onUpdate(item.id, { file_url: urlInput })
                setEditing(false)
              }}
              className="text-[11px] px-2 py-0.5 bg-navy text-white rounded"
            >저장</button>
            <button onClick={() => setEditing(false)} className="text-[11px] text-gray-400">취소</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {item.file_url ? (
              <a href={item.file_url} target="_blank" rel="noopener"
                className="text-[11px] text-blue-600 flex items-center gap-1 hover:underline">
                <ExternalLink size={11} /> 파일 보기
              </a>
            ) : (
              <button onClick={() => setEditing(true)} className="text-[11px] text-gray-400 hover:text-gray-600">
                URL 등록
              </button>
            )}
          </div>
        )}

        <DdayBadge dueDate={item.due_date} status={item.status} />

        {/* 상태 변경 */}
        {item.status !== 'submitted' && item.status !== 'approved' && (
          <button
            onClick={() => onUpdate(item.id, { status: 'submitted' })}
            className="text-[11px] px-2.5 py-1 border border-green-500 text-green-700 rounded-md hover:bg-green-50 transition-colors"
          >
            제출 완료
          </button>
        )}
        {(item.status === 'submitted' || item.status === 'approved') && (
          <button
            onClick={() => onUpdate(item.id, { status: 'pending', submitted_at: null })}
            className="text-[10px] text-gray-400 hover:text-gray-600"
          >
            되돌리기
          </button>
        )}
      </div>
    </div>
  )
}
```

## Step 3 — 산출물 관리 페이지
파일: `app/dashboard/deliverables/page.tsx`
```tsx
'use client'
import useSWR from 'swr'
import Header from '@/components/layout/Header'
import DeliverableRow from '@/components/deliverables/DeliverableRow'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function DeliverablesPage() {
  const { data, mutate } = useSWR('/api/deliverables', fetcher)
  const deliverables = data ?? []
  const submitted = deliverables.filter((d: any) => ['submitted','approved'].includes(d.status)).length

  async function handleUpdate(id: number, payload: object) {
    await fetch(`/api/deliverables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    mutate()
  }

  const urgent = deliverables.filter((d: any) => {
    if (d.status === 'submitted' || d.status === 'approved') return false
    const diff = Math.ceil((new Date(d.due_date).getTime() - Date.now()) / 86400000)
    return diff <= 14
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="산출물 관리"
        subtitle={`총 7종 · ${submitted}종 제출 완료`}
        badge={{ label: `${submitted}/7 제출`, color: submitted >= 7 ? 'green' : 'blue' }}
      />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* 진행률 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between text-[12px] mb-2">
            <span className="text-gray-600">제출 현황</span>
            <span className="text-gray-500">{submitted} / 7</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full">
            <div className="h-2 bg-green-500 rounded-full transition-all" style={{ width: `${(submitted / 7) * 100}%` }} />
          </div>
        </div>

        {/* 긴급 알림 */}
        {urgent.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-[12px] font-medium text-amber-800 mb-1">⚠️ 마감 임박 산출물</p>
            {urgent.map((d: any) => (
              <p key={d.id} className="text-[11px] text-amber-700">· {d.title} — {d.due_date} 마감</p>
            ))}
          </div>
        )}

        {/* 산출물 목록 */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {deliverables.map((item: any) => (
            <DeliverableRow key={item.id} item={item} onUpdate={handleUpdate} />
          ))}
        </div>
      </div>
    </div>
  )
}
```

## 검증 체크리스트
- [ ] 산출물 7개 전체 표시
- [ ] D-day 뱃지 날짜 계산 정확
- [ ] '제출 완료' 버튼 → 상태 변경 + submitted_at 자동 설정
- [ ] URL 등록 → '파일 보기' 링크로 전환
- [ ] 마감 임박 알림 박스 14일 이내 표시

## PR 제목
`feat: 산출물 관리 페이지 구현 (TASK_07)`
