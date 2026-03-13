# TASK_00 — 프로젝트 초기화 · DB 스키마 · 시드 데이터

## 목표
Next.js 14 프로젝트를 생성하고, SQLite 스키마를 초기화하며, 현실적인 시드 데이터를 삽입한다.
이 TASK 완료 후 `npm run dev` 가 오류 없이 실행되어야 한다.

## 작업 순서

### Step 1 — 프로젝트 생성
```bash
npx create-next-app@14 careerlab-dashboard \
  --typescript --tailwind --eslint \
  --app --src-dir=false --import-alias="@/*"
cd careerlab-dashboard
```

### Step 2 — 의존성 설치
```bash
npm install better-sqlite3 swr lucide-react recharts
npm install -D @types/better-sqlite3
npx shadcn-ui@latest init
# style: default, baseColor: slate, cssVariables: yes
npx shadcn-ui@latest add button badge card table tabs dialog input label select textarea
```

### Step 3 — 환경변수 파일 생성
파일: `.env.local`
```
ADMIN_PASSWORD=careerlab2026
```

### Step 4 — DB 연결 싱글톤 생성
파일: `lib/db.ts`
```typescript
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'careerlab.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initSchema(db)
  }
  return db
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      topic      TEXT,
      color      TEXT DEFAULT '#46549C',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS participants (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      phone      TEXT,
      email      TEXT,
      team_id    INTEGER REFERENCES teams(id),
      role       TEXT DEFAULT 'participant',
      joined_at  TEXT DEFAULT (date('now')),
      status     TEXT DEFAULT 'active',
      note       TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS workshops (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      session_no      INTEGER NOT NULL,
      title           TEXT NOT NULL,
      held_date       TEXT,
      location        TEXT,
      facilitator     TEXT,
      status          TEXT DEFAULT 'planned',
      plan_doc_url    TEXT,
      result_doc_url  TEXT,
      note            TEXT
    );

    CREATE TABLE IF NOT EXISTS workshop_attendance (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      workshop_id     INTEGER REFERENCES workshops(id),
      participant_id  INTEGER REFERENCES participants(id),
      attended        INTEGER DEFAULT 0,
      UNIQUE(workshop_id, participant_id)
    );

    CREATE TABLE IF NOT EXISTS team_activities (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id       INTEGER REFERENCES teams(id),
      activity_no   INTEGER NOT NULL,
      activity_type TEXT,
      held_date     TEXT,
      location      TEXT,
      summary       TEXT,
      status        TEXT DEFAULT 'planned',
      report_url    TEXT,
      evidence_urls TEXT,
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kpi_snapshots (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      snapshot_date      TEXT DEFAULT (date('now')),
      participants_count INTEGER DEFAULT 0,
      workshops_done     INTEGER DEFAULT 0,
      activities_done    INTEGER DEFAULT 0,
      solutions_count    INTEGER DEFAULT 0,
      trainings_done     INTEGER DEFAULT 0,
      note               TEXT
    );

    CREATE TABLE IF NOT EXISTS deliverables (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      deliverable_type TEXT NOT NULL,
      title            TEXT NOT NULL,
      due_date         TEXT,
      submitted_at     TEXT,
      file_url         TEXT,
      status           TEXT DEFAULT 'pending',
      note             TEXT
    );
  `)
}
```

### Step 5 — 시드 데이터 파일 생성
파일: `lib/seed.ts`
```typescript
import { getDb } from './db'

export function seedDatabase() {
  const db = getDb()

  // 이미 데이터 있으면 스킵
  const count = (db.prepare('SELECT COUNT(*) as c FROM teams').get() as { c: number }).c
  if (count > 0) return

  // ── 팀 6개 ──
  const teamColors = ['#46549C', '#248DAC', '#228D7B', '#7C5CBF', '#C0713A', '#1E6B9A']
  const teamTopics = [
    '경력단절 후 재취업 정보 접근성 개선',
    '지역 내 경력보유여성 네트워크 구축',
    '육아·돌봄 병행 취업 환경 조성',
    '여성 창업 초기 단계 지원 체계',
    '경력보유여성 역량 강화 교육 다양화',
    '일·생활 균형 실현을 위한 지역 인프라'
  ]
  const teamInsert = db.prepare(
    'INSERT INTO teams (name, topic, color) VALUES (?, ?, ?)'
  )
  for (let i = 0; i < 6; i++) {
    teamInsert.run(`팀 ${['A','B','C','D','E','F'][i]}`, teamTopics[i], teamColors[i])
  }

  // ── 참여자 30명 ──
  const names = [
    '김지수','이민지','박소연','최유진','정현아','한수진','오지현','서민경','임다은','강예린',
    '윤소희','장미래','류지영','신은지','조하은','배나영','홍수정','문지아','노가을','안세연',
    '권은혜','허지민','남은비','남궁혜린','황보미','이서진','김나현','박하늘','최수아','정가영'
  ]
  const roles = ['participant','participant','participant','participant','facilitator']
  const participantInsert = db.prepare(
    `INSERT INTO participants (name, phone, email, team_id, role, joined_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  names.forEach((name, i) => {
    const teamId = Math.floor(i / 5) + 1
    const role = i % 5 === 4 ? 'facilitator' : 'participant'
    participantInsert.run(
      name,
      `010-${String(Math.floor(Math.random()*9000)+1000)}-${String(Math.floor(Math.random()*9000)+1000)}`,
      `${name.replace(' ','')}@email.com`,
      teamId,
      role,
      '2026-04-07'
    )
  })

  // ── 워크숍 5회 ──
  const workshops = [
    { no: 1, title: '발대식 및 역량강화 워크숍 1 — 페르소나·이해관계자 분석', date: '2026-04-07', status: 'planned', loc: '남구 주민센터 회의실' },
    { no: 2, title: '역량강화 워크숍 2 — 현장활동 계획 수립', date: '2026-04-07', status: 'planned', loc: '남구 주민센터 회의실' },
    { no: 3, title: '워크숍 3 — 문제정의 및 솔루션 방향 설정', date: '2026-04-14', status: 'planned', loc: '대구 여성가족재단 세미나실' },
    { no: 4, title: '워크숍 4 — 프로토타입 도출 및 실증 설계', date: '2026-04-28', status: 'planned', loc: '남구 혁신센터' },
    { no: 5, title: '워크숍 5 — 결과 발표 및 피드백', date: '2026-05-12', status: 'planned', loc: '남구 주민센터 대회의실' },
  ]
  const wsInsert = db.prepare(
    `INSERT INTO workshops (session_no, title, held_date, location, facilitator, status)
     VALUES (?, ?, ?, ?, ?, ?)`
  )
  workshops.forEach(w => wsInsert.run(w.no, w.title, w.date, w.loc, '강아름 코디네이터', w.status))

  // ── 팀별 활동 (6팀 × 3회) ──
  const activityTypes = [
    '공감/현장조사 활동',
    '자료조사/현장답사/아이디어 구체화',
    '솔루션 검증/자료 제작'
  ]
  const actDates = ['2026-04-10', '2026-04-21', '2026-05-06']
  const actInsert = db.prepare(
    `INSERT INTO team_activities (team_id, activity_no, activity_type, held_date, status)
     VALUES (?, ?, ?, ?, 'planned')`
  )
  for (let t = 1; t <= 6; t++) {
    for (let a = 1; a <= 3; a++) {
      actInsert.run(t, a, activityTypes[a - 1], actDates[a - 1])
    }
  }

  // ── 산출물 7종 ──
  const deliverables = [
    { type: 'plan', title: '사업수행계획서', due: '2026-04-20', status: 'pending' },
    { type: 'workshop_plan', title: '회차별 운영계획서 (1~5회)', due: '2026-04-02', status: 'pending' },
    { type: 'workshop_result', title: '회차별 결과보고서 (1~5회)', due: '2026-05-19', status: 'pending' },
    { type: 'activity_report', title: '팀별 활동보고서 (6팀)', due: '2026-05-13', status: 'pending' },
    { type: 'problem_solution', title: '문제정의서/솔루션제안서 (6식)', due: '2026-06-14', status: 'pending' },
    { type: 'photo_record', title: '활동 사진·기록물', due: '2026-06-14', status: 'pending' },
    { type: 'final_report', title: '최종 결과보고서', due: '2026-06-14', status: 'pending' },
  ]
  const delInsert = db.prepare(
    `INSERT INTO deliverables (deliverable_type, title, due_date, status)
     VALUES (?, ?, ?, ?)`
  )
  deliverables.forEach(d => delInsert.run(d.type, d.title, d.due, d.status))

  // ── 초기 KPI 스냅샷 ──
  db.prepare(`
    INSERT INTO kpi_snapshots (snapshot_date, participants_count, workshops_done,
      activities_done, solutions_count, trainings_done, note)
    VALUES ('2026-03-13', 0, 0, 0, 0, 0, '사업 시작 전 기준값')
  `).run()

  console.log('✅ Seed data inserted')
}
```

### Step 6 — 시드 자동 실행 API 추가
파일: `app/api/seed/route.ts`
```typescript
import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed'

export async function POST() {
  try {
    seedDatabase()
    return NextResponse.json({ ok: true, message: '시드 데이터 삽입 완료' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
```

### Step 7 — next.config.js 수정 (Node 모듈 번들링 제외)
파일: `next.config.js`
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['better-sqlite3'],
}
module.exports = nextConfig
```

### Step 8 — tailwind.config.ts 브랜드 색상 추가
```typescript
// theme.extend.colors 에 추가
colors: {
  navy:  '#46549C',
  'blue-lab': '#248DAC',
  green: { lab: '#228D7B' },
}
```

## 검증 체크리스트

- [ ] `npm run dev` 오류 없이 실행
- [ ] `curl -X POST http://localhost:3000/api/seed` → `{"ok":true}` 응답
- [ ] `data/careerlab.db` 파일 생성 확인
- [ ] DB 확인: teams 6개, participants 30개, workshops 5개, team_activities 18개, deliverables 7개

## PR 제목
`feat: 프로젝트 초기화 및 DB 스키마·시드 데이터 세팅 (TASK_00)`
