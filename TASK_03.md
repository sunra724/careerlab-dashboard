# TASK_03 — 참여자 관리

## 목표
30명 참여자 명단을 팀별 필터·검색과 함께 표시하고,
참여자 추가/상태변경 기능을 구현한다.

## 전제 조건
- TASK_00~TASK_02 완료

---

## Step 1 — 참여자 API

파일: `app/api/participants/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  const db = getDb()
  const teamId = req.nextUrl.searchParams.get('team_id')
  const query = teamId
    ? `SELECT p.*, t.name as team_name, t.color as team_color
       FROM participants p LEFT JOIN teams t ON t.id=p.team_id
       WHERE p.team_id=? ORDER BY p.team_id, p.id`
    : `SELECT p.*, t.name as team_name, t.color as team_color
       FROM participants p LEFT JOIN teams t ON t.id=p.team_id
       ORDER BY p.team_id, p.id`
  const rows = teamId ? db.prepare(query).all(teamId) : db.prepare(query).all()
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const db = getDb()
  const body = await req.json()
  const { name, phone, email, team_id, role, note } = body
  if (!name) return NextResponse.json({ error: '이름 필수' }, { status: 400 })
  const result = db.prepare(
    `INSERT INTO participants (name, phone, email, team_id, role, note, joined_at)
     VALUES (?, ?, ?, ?, ?, ?, date('now'))`
  ).run(name, phone ?? null, email ?? null, team_id ?? null, role ?? 'participant', note ?? null)
  return NextResponse.json({ id: result.lastInsertRowid })
}
```

파일: `app/api/participants/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  const body = await req.json()
  const fields = ['name','phone','email','team_id','role','status','note']
    .filter(f => f in body)
    .map(f => `${f}=?`)
  if (fields.length === 0) return NextResponse.json({ error: 'no fields' }, { status: 400 })
  const values = fields.map(f => body[f.replace('=?', '')])
  db.prepare(`UPDATE participants SET ${fields.join(',')} WHERE id=?`).run(...values, params.id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb()
  db.prepare("UPDATE participants SET status='withdrawn' WHERE id=?").run(params.id)
  return NextResponse.json({ ok: true })
}
```

## Step 2 — 팀 배지 컴포넌트
파일: `components/participants/TeamBadge.tsx`
```tsx
export default function TeamBadge({ name, color }: { name: string; color: string }) {
  const bgHex = color + '20'
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-md font-medium"
      style={{ background: bgHex, color }}
    >
      {name}
    </span>
  )
}
```

## Step 3 — 참여자 테이블
파일: `components/participants/ParticipantTable.tsx`
```tsx
'use client'
import { useState } from 'react'
import TeamBadge from './TeamBadge'
import { Badge } from '@/components/ui/badge'

interface Participant {
  id: number; name: string; phone: string; email: string
  team_id: number; team_name: string; team_color: string
  role: string; status: string; joined_at: string; note: string
}

const ROLE_LABEL: Record<string, string> = {
  participant: '참여자',
  facilitator: '퍼실리테이터',
  coordinator: '코디네이터',
}

export default function ParticipantTable({
  participants, onStatusChange
}: {
  participants: Participant[]
  onStatusChange: (id: number, status: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = participants.filter(p =>
    p.name.includes(search) || p.team_name?.includes(search)
  )

  return (
    <div>
      <div className="mb-3">
        <input
          type="text"
          placeholder="이름 또는 팀 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-1.5 text-sm w-64 focus:outline-none focus:border-navy"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-gray-500 font-medium">이름</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">팀</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">역할</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">연락처</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">참여일</th>
              <th className="text-left py-2 px-3 text-gray-500 font-medium">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-2 px-3 font-medium">{p.name}</td>
                <td className="py-2 px-3">
                  {p.team_name
                    ? <TeamBadge name={p.team_name} color={p.team_color} />
                    : <span className="text-gray-400">미배정</span>}
                </td>
                <td className="py-2 px-3 text-gray-600">{ROLE_LABEL[p.role] ?? p.role}</td>
                <td className="py-2 px-3 text-gray-500">{p.phone ?? '-'}</td>
                <td className="py-2 px-3 text-gray-500">{p.joined_at ?? '-'}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] ${
                    p.status === 'active' ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.status === 'active' ? '활동 중' : '철회'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  )
}
```

## Step 4 — 참여자 관리 페이지
파일: `app/dashboard/participants/page.tsx`
```tsx
'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Header from '@/components/layout/Header'
import ParticipantTable from '@/components/participants/ParticipantTable'
import TeamBadge from '@/components/participants/TeamBadge'

const fetcher = (url: string) => fetch(url).then(r => r.json())

const TEAM_FILTERS = [
  { id: 0, name: '전체', color: '#888' },
  { id: 1, name: '팀 A', color: '#46549C' },
  { id: 2, name: '팀 B', color: '#248DAC' },
  { id: 3, name: '팀 C', color: '#228D7B' },
  { id: 4, name: '팀 D', color: '#7C5CBF' },
  { id: 5, name: '팀 E', color: '#C0713A' },
  { id: 6, name: '팀 F', color: '#1E6B9A' },
]

export default function ParticipantsPage() {
  const [selectedTeam, setSelectedTeam] = useState(0)
  const url = selectedTeam === 0
    ? '/api/participants'
    : `/api/participants?team_id=${selectedTeam}`
  const { data, mutate } = useSWR(url, fetcher)

  const participants = data ?? []
  const activeCount = participants.filter((p: any) => p.status === 'active').length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Header
        title="참여자 관리"
        subtitle={`총 ${activeCount}명 활동 중 · 목표 30명`}
        badge={{ label: `${activeCount}/30명`, color: activeCount >= 30 ? 'green' : 'amber' }}
      />
      <div className="flex-1 overflow-y-auto p-4">
        {/* 팀 필터 탭 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {TEAM_FILTERS.map(team => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id)}
              className={`px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
                selectedTeam === team.id
                  ? 'border-navy bg-navy text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {team.name}
            </button>
          ))}
        </div>

        {/* 팀별 통계 카드 */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {TEAM_FILTERS.slice(1).map(team => {
            const count = (data ?? []).filter((p: any) => p.team_id === team.id && p.status === 'active').length
            return (
              <div key={team.id} className="bg-white border border-gray-200 rounded-md p-2.5 text-center">
                <p className="text-[10px] font-medium" style={{ color: team.color }}>{team.name}</p>
                <p className="text-[18px] font-medium text-gray-800 mt-0.5">{count}</p>
                <p className="text-[10px] text-gray-400">/ 5명</p>
              </div>
            )
          })}
        </div>

        {/* 참여자 테이블 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ParticipantTable
            participants={participants}
            onStatusChange={async (id, status) => {
              await fetch(`/api/participants/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
              })
              mutate()
            }}
          />
        </div>
      </div>
    </div>
  )
}
```

## 검증 체크리스트

- [ ] 전체 탭: 30명 표시
- [ ] 팀 A~F 필터 탭 클릭 시 해당 팀원만 표시
- [ ] 상단 팀별 통계 카드 6개 렌더링
- [ ] 이름/팀명 검색 동작 확인
- [ ] 팀 뱃지 색상 올바르게 표시

## PR 제목
`feat: 참여자 관리 페이지 구현 (TASK_03)`
