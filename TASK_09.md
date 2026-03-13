# TASK_09 — 최종 점검 · Railway/Vercel 배포 설정

## 목표
전체 기능 통합 점검, 빌드 오류 수정, Railway(SQLite 영속성) 또는 Vercel 배포 설정을 완료한다.

## 전제 조건
TASK_00~TASK_08 완료

---

## Step 1 — 빌드 점검

```bash
npm run build
```

아래 항목을 순서대로 수정:
- `@ts-ignore` 없이 TypeScript 에러 0개
- `Image` 컴포넌트 미사용 `<img>` 경고 수정
- `use client` 누락된 클라이언트 컴포넌트 확인
- `date-fns` 미설치 시: `npm install date-fns`

---

## Step 2 — 환경변수 확인

파일: `.env.local` (로컬 개발)
```
ADMIN_PASSWORD=careerlab2026
```

파일: `.env.production` (배포 환경 — 실제 비밀번호로 변경)
```
ADMIN_PASSWORD=실제비밀번호
```

---

## Step 3 — Railway 배포 (권장 — SQLite 파일 영속성 필요)

> Vercel은 서버리스라 SQLite 파일이 재배포 시 초기화됨.  
> Railway는 볼륨 마운트를 지원하므로 SQLite 데이터 영속 가능.

### 3-1. railway.json 생성
파일: `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

### 3-2. DB 경로를 환경변수로 분리
파일: `lib/db.ts` 수정 — DB_PATH 라인:
```typescript
const DB_PATH = process.env.DB_PATH
  ?? path.join(process.cwd(), 'data', 'careerlab.db')
```

Railway 환경변수 설정:
```
DB_PATH=/data/careerlab.db
ADMIN_PASSWORD=실제비밀번호
```

Railway 볼륨 마운트 경로: `/data`

### 3-3. package.json scripts 확인
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 3-4. GitHub 연동 & 배포
```bash
git init
git add .
git commit -m "feat: 경력보유여성 재도약 리빙랩 대시보드 초기 배포"
git branch -M main
git remote add origin https://github.com/[계정]/careerlab-dashboard.git
git push -u origin main
```
→ Railway 대시보드에서 GitHub 레포 연결 → Deploy

---

## Step 4 — 첫 배포 후 시드 데이터 삽입

배포 후 한 번만 실행:
```bash
curl -X POST https://[your-railway-domain].up.railway.app/api/seed
```

---

## Step 5 — 전체 기능 체크리스트

### 인증
- [ ] `/login` 잘못된 비밀번호 → 에러 메시지
- [ ] 올바른 비밀번호 → `/dashboard` 이동
- [ ] 로그아웃 → `/login` 이동
- [ ] 쿠키 삭제 후 직접 URL 접근 → `/login` 리다이렉트

### 홈 대시보드
- [ ] KPI 카드 4개 (참여자·워크숍·팀별활동·솔루션) 렌더링
- [ ] 진행률 바 수치 정확
- [ ] 타임라인 '모집·선발' 하이라이트
- [ ] 산출물 7개 상태 표시
- [ ] 팀 6개 카드 표시

### 참여자 관리
- [ ] 30명 명단 표시
- [ ] 팀 A~F 필터 정확
- [ ] 검색 동작
- [ ] 팀별 통계 카드 합산 30명

### 워크숍 관리
- [ ] 5회차 카드 표시
- [ ] 상태 버튼 클릭 → 즉시 반영
- [ ] 진행률 바 업데이트

### 팀별 활동
- [ ] 6팀 × 3열 매트릭스 표시
- [ ] 셀 확장 토글
- [ ] 상태 변경 반영

### 성과 지표
- [ ] 게이지 5개 (SVG 원형)
- [ ] 레이더 차트 렌더링
- [ ] 과업지시서 지표 목표값 일치

### 산출물 관리
- [ ] 7종 표시
- [ ] D-day 뱃지 계산 정확
- [ ] '제출 완료' 버튼 동작
- [ ] URL 등록 → 링크 표시

### 추진 일정
- [ ] 간트차트 11개 막대
- [ ] 오늘 기준선 표시
- [ ] 마일스톤 D-day 표시

---

## Step 6 — 선택 개선사항 (TASK 완료 후 별도 PR)

다음은 본 TASK 범위 외 선택 기능. 필요 시 별도 TASK 파일 추가:

- `TASK_10.md` — 워크숍 출석 체크 기능 (workshop_attendance 테이블 활용)
- `TASK_11.md` — 솔루션 제안서 상세 입력 폼 (문제정의 → 솔루션 링크)
- `TASK_12.md` — 관리자 메모 기능 (활동별 노트 저장)
- `TASK_13.md` — 인쇄/PDF 내보내기 (window.print CSS 최적화)

---

## PR 제목
`feat: 최종 빌드 점검 및 Railway 배포 설정 완료 (TASK_09)`
