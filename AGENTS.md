# AGENTS.md — 경력보유여성 재도약 리빙랩 대시보드

> Codex가 모든 세션 시작 시 이 파일을 먼저 읽고, TASK 파일의 지시를 따른다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | 2026년 경력보유여성 재도약 리빙랩 「배운김에 남구」 성과관리 대시보드 |
| 발주기관 | 대구광역시 남구 |
| 운영기관 | 협동조합 소이랩 |
| 과업기간 | 계약체결일 ~ 2026. 6. |
| 예산 | 30,000,000원 |
| 참여자 목표 | 30명 / 6팀 (팀당 5명) |
| 주요 KPI | 참여자 30명, 워크숍 5회, 팀별 활동 3회, 솔루션 제안 6식, 역량강화 교육 2회 |

---

## 기술 스택

```
Frontend:   Next.js 14 App Router + TypeScript + Tailwind CSS
UI:         shadcn/ui + Lucide React + Recharts
Data:       better-sqlite3 (로컬 SQLite)
Fetching:   SWR
Auth:       쿠키 기반 미들웨어 (비밀번호: careerlab2026)
Deployment: Vercel + GitHub
```

---

## 디렉토리 구조

```
careerlab-dashboard/
├── AGENTS.md                      ← 이 파일
├── app/
│   ├── layout.tsx                 ← 루트 레이아웃 (폰트, 전역 스타일)
│   ├── page.tsx                   ← / → /dashboard 리다이렉트
│   ├── login/
│   │   └── page.tsx               ← 로그인 페이지
│   ├── dashboard/
│   │   ├── layout.tsx             ← 사이드바 + 헤더 레이아웃
│   │   ├── page.tsx               ← 홈/개요 대시보드
│   │   ├── participants/
│   │   │   └── page.tsx           ← 참여자 관리
│   │   ├── workshops/
│   │   │   └── page.tsx           ← 워크숍 관리
│   │   ├── team-activities/
│   │   │   └── page.tsx           ← 팀별 활동
│   │   ├── kpi/
│   │   │   └── page.tsx           ← 성과 지표
│   │   ├── deliverables/
│   │   │   └── page.tsx           ← 산출물 관리
│   │   └── schedule/
│   │       └── page.tsx           ← 추진 일정 (간트차트)
│   └── api/
│       ├── auth/route.ts
│       ├── participants/route.ts
│       ├── workshops/route.ts
│       ├── team-activities/route.ts
│       ├── kpi/route.ts
│       ├── deliverables/route.ts
│       └── overview/route.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   │   ├── KpiCard.tsx
│   │   ├── TimelineCard.tsx
│   │   ├── DeliverableStatusCard.tsx
│   │   └── TeamSummaryGrid.tsx
│   ├── participants/
│   │   ├── ParticipantTable.tsx
│   │   └── TeamBadge.tsx
│   ├── workshops/
│   │   ├── WorkshopCard.tsx
│   │   └── AttendanceTable.tsx
│   ├── team-activities/
│   │   ├── ActivityMatrix.tsx
│   │   └── ActivityDetailDrawer.tsx
│   ├── kpi/
│   │   ├── KpiGauge.tsx
│   │   └── KpiRadarChart.tsx
│   ├── deliverables/
│   │   └── DeliverableRow.tsx
│   └── schedule/
│       └── GanttChart.tsx
├── lib/
│   ├── db.ts                      ← SQLite 연결 싱글톤
│   └── auth.ts                    ← 쿠키 인증 헬퍼
├── middleware.ts                  ← /dashboard/* 인증 보호
├── public/
│   └── logo.svg
├── .env.local                     ← ADMIN_PASSWORD=careerlab2026
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 브랜드 컬러

```css
--color-navy:  #46549C;   /* 소이랩 네이비 — 메인 사이드바, 강조 */
--color-blue:  #248DAC;   /* 소이랩 블루  — 워크숍, 보조 강조 */
--color-green: #228D7B;   /* 소이랩 그린  — 팀별 활동, 완료 상태 */
```

---

## 데이터베이스 스키마 (SQLite)

```sql
-- 참여자
CREATE TABLE participants (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT,
  email       TEXT,
  team_id     INTEGER REFERENCES teams(id),
  role        TEXT DEFAULT 'participant',  -- participant | facilitator | coordinator
  joined_at   TEXT DEFAULT (date('now')),
  status      TEXT DEFAULT 'active',       -- active | withdrawn
  note        TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- 팀
CREATE TABLE teams (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,              -- 팀 A ~ 팀 F
  topic       TEXT,                      -- 팀 현안 주제 (워크숍 2차 이후 확정)
  color       TEXT DEFAULT '#46549C',
  created_at  TEXT DEFAULT (datetime('now'))
);

-- 워크숍
CREATE TABLE workshops (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  session_no      INTEGER NOT NULL,      -- 1~5
  title           TEXT NOT NULL,
  held_date       TEXT,
  location        TEXT,
  facilitator     TEXT,
  status          TEXT DEFAULT 'planned', -- planned | ongoing | done
  plan_doc_url    TEXT,                  -- 운영계획서 링크
  result_doc_url  TEXT,                  -- 결과보고서 링크
  note            TEXT
);

-- 워크숍 출석
CREATE TABLE workshop_attendance (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  workshop_id     INTEGER REFERENCES workshops(id),
  participant_id  INTEGER REFERENCES participants(id),
  attended        INTEGER DEFAULT 0,     -- 0 | 1
  UNIQUE(workshop_id, participant_id)
);

-- 팀별 활동
CREATE TABLE team_activities (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id         INTEGER REFERENCES teams(id),
  activity_no     INTEGER NOT NULL,      -- 1~3
  activity_type   TEXT,                  -- 공감/현장조사 | 자료조사/현장답사 | 솔루션검증
  held_date       TEXT,
  location        TEXT,
  summary         TEXT,
  status          TEXT DEFAULT 'planned',-- planned | ongoing | done
  report_url      TEXT,
  evidence_urls   TEXT,                  -- JSON 배열 문자열
  created_at      TEXT DEFAULT (datetime('now'))
);

-- 성과 지표 (수동 업데이트)
CREATE TABLE kpi_snapshots (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_date         TEXT DEFAULT (date('now')),
  participants_count    INTEGER DEFAULT 0,
  workshops_done        INTEGER DEFAULT 0,
  activities_done       INTEGER DEFAULT 0,
  solutions_count       INTEGER DEFAULT 0,
  trainings_done        INTEGER DEFAULT 0,
  note                  TEXT
);

-- 산출물
CREATE TABLE deliverables (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  deliverable_type TEXT NOT NULL,  -- plan | workshop_plan | workshop_result |
                                    -- activity_report | problem_solution |
                                    -- photo_record | final_report
  title           TEXT NOT NULL,
  due_date        TEXT,
  submitted_at    TEXT,
  file_url        TEXT,
  status          TEXT DEFAULT 'pending', -- pending | submitted | approved
  note            TEXT
);
```

---

## 코딩 규칙 (Codex 필독)

1. **TypeScript strict 모드** — 모든 파일 `.tsx` / `.ts`, `any` 금지
2. **Tailwind 클래스만** — 인라인 style 금지 (색상 변수 예외)
3. **서버 컴포넌트 기본** — 클라이언트 상태가 필요한 경우에만 `'use client'`
4. **API Route 패턴** — `lib/db.ts` 의 싱글톤 DB 인스턴스만 사용
5. **에러 처리** — 모든 API route는 try/catch + 적절한 HTTP 상태코드 반환
6. **시드 데이터** — `lib/seed.ts` 에 현실적인 이름/날짜 포함 (TASK_00 참고)
7. **인증** — `/dashboard/*` 전체는 middleware.ts 에서 쿠키(`careerlab_auth`) 검사
8. **컴포넌트 크기** — 150줄 초과 시 하위 컴포넌트로 분리
9. **PR 단위** — TASK 1개 = PR 1개, 커밋 메시지는 한국어 허용

---

## 인증 흐름

```
사용자 접근 /dashboard/* 
  → middleware.ts: 쿠키 careerlab_auth 확인
  → 없으면 /login 으로 리다이렉트
  → /login POST: body.password === process.env.ADMIN_PASSWORD
  → 일치 시 careerlab_auth=1 쿠키 설정 (httpOnly, 7일)
  → /dashboard 로 리다이렉트
```

---

## 상태 뱃지 색상 규칙

| 상태 | 배경 | 텍스트 |
|------|------|--------|
| 완료 / 제출 | `bg-green-50` | `text-green-800` |
| 진행중 | `bg-blue-50` | `text-blue-800` |
| 예정 / 대기 | `bg-amber-50` | `text-amber-800` |
| 미시작 | `bg-gray-100` | `text-gray-600` |
| 철회 / 지연 | `bg-red-50` | `text-red-700` |

---

## 추진 일정 기준 (과업지시서)

| 기간 | 단계 | 주요 내용 |
|------|------|-----------|
| 3월 4주~4월 1주 | 모집·선발 | 공고, 심사, 팀 구성 |
| 4월 1주 | 발대식·워크숍 1·2 | 발대식 + 역량강화 워크숍 |
| 4월 1주 | 팀별 활동 1 | 공감/현장조사 |
| 4월 2주 | 워크숍 3 | 문제정의, 솔루션 방향 |
| 4월 3주 | 팀별 활동 2 | 자료조사/현장답사 |
| 4월 4주 | 워크숍 4 | 프로토타입 도출 및 실증 설계 |
| 5월 1주 | 팀별 활동 3 | 솔루션 검증/자료 제작 |
| 5월 2주 | 워크숍 5 | 결과 발표, 피드백 |
| 5월 3주~6월 | 결과보고 | 최종보고서 및 산출물 제출 |

---

## 산출물 7종 제출 기한

| 산출물 | 형식 | 제출 기한 |
|--------|------|-----------|
| 사업수행계획서 | PDF | 계약 후 14일 이내 |
| 회차별 운영계획서 | PDF | 회차 시작 5일 전 |
| 회차별 결과보고서 | PDF | 회차 종료 후 7일 이내 |
| 팀별 활동보고서 | HWP, PDF | 활동 종료 후 7일 이내 |
| 활동 사진/기록물 | JPG 등 | 사업 종료 후 14일 이내 |
| 문제정의서/솔루션제안서 | HWP, PDF | 사업 종료 후 14일 이내 |
| 최종 결과보고서 | PDF | 사업 종료 후 14일 이내 |
