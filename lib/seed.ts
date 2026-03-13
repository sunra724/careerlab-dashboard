import { getDb } from "@/lib/db";
import { TEAM_META } from "@/lib/teams";

const TEAM_TOPICS = [
  "경력단절 후 재취업 정보 접근성 개선",
  "지역 내 경력보유여성 네트워크 구축",
  "육아·돌봄 병행 취업 환경 조성",
  "여성 창업 초기 단계 지원 체계",
  "경력보유여성 역량 강화 교육 다양화",
  "일·생활 균형 실현을 위한 지역 인프라",
];

const PARTICIPANT_NAMES = [
  "김지수",
  "이민지",
  "박소연",
  "최유진",
  "정현아",
  "한수진",
  "오지현",
  "서민경",
  "임다은",
  "강예린",
  "윤소희",
  "장미래",
  "류지영",
  "신은지",
  "조하은",
  "배나영",
  "홍수정",
  "문지아",
  "노가을",
  "안세연",
  "권은혜",
  "허지민",
  "남은비",
  "남궁혜린",
  "황보미",
  "이서진",
  "김나현",
  "박하늘",
  "최수아",
  "정가영",
];

const WORKSHOPS = [
  {
    session_no: 1,
    title: "발대식 및 역량강화 워크숍 1 - 페르소나·이해관계자 분석",
    held_date: "2026-04-07",
    location: "남구 주민센터 회의실",
    facilitator: "강아름 코디네이터",
  },
  {
    session_no: 2,
    title: "역량강화 워크숍 2 - 현장활동 계획 수립",
    held_date: "2026-04-07",
    location: "남구 주민센터 회의실",
    facilitator: "강아름 코디네이터",
  },
  {
    session_no: 3,
    title: "워크숍 3 - 문제정의 및 솔루션 방향 설정",
    held_date: "2026-04-14",
    location: "대구여성가족재단 세미나실",
    facilitator: "김유정 퍼실리테이터",
  },
  {
    session_no: 4,
    title: "워크숍 4 - 프로토타입 도출 및 실증 설계",
    held_date: "2026-04-28",
    location: "남구 혁신센터",
    facilitator: "송하늘 퍼실리테이터",
  },
  {
    session_no: 5,
    title: "워크숍 5 - 결과 발표 및 피드백",
    held_date: "2026-05-12",
    location: "남구 주민센터 대회의실",
    facilitator: "이서윤 자문위원",
  },
];

const ACTIVITY_TYPES = [
  "공감/현장조사",
  "자료조사/현장답사",
  "솔루션검증",
];

const ACTIVITY_DATES = ["2026-04-10", "2026-04-21", "2026-05-06"];

const DELIVERABLES = [
  { type: "plan", title: "사업수행계획서", due_date: "2026-04-20" },
  { type: "workshop_plan", title: "회차별 운영계획서 (1~5회)", due_date: "2026-04-02" },
  { type: "workshop_result", title: "회차별 결과보고서 (1~5회)", due_date: "2026-05-19" },
  { type: "activity_report", title: "팀별 활동보고서 (6팀)", due_date: "2026-05-13" },
  { type: "problem_solution", title: "문제정의서/솔루션제안서 (6식)", due_date: "2026-06-14" },
  { type: "photo_record", title: "활동 사진·기록물", due_date: "2026-06-14" },
  { type: "final_report", title: "최종 결과보고서", due_date: "2026-06-14" },
];

export function seedDatabase() {
  const db = getDb();
  const teamCountRow = db
    .prepare("SELECT COUNT(*) as count FROM teams")
    .get() as { count: number };

  if (teamCountRow.count > 0) {
    return;
  }

  const seed = db.transaction(() => {
    const insertTeam = db.prepare(
      "INSERT INTO teams (name, topic, color) VALUES (?, ?, ?)",
    );
    const insertParticipant = db.prepare(
      `
        INSERT INTO participants (name, phone, email, team_id, role, joined_at, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    );
    const insertWorkshop = db.prepare(
      `
        INSERT INTO workshops (session_no, title, held_date, location, facilitator, status)
        VALUES (?, ?, ?, ?, ?, 'planned')
      `,
    );
    const insertAttendance = db.prepare(
      `
        INSERT INTO workshop_attendance (workshop_id, participant_id, attended)
        VALUES (?, ?, ?)
      `,
    );
    const insertActivity = db.prepare(
      `
        INSERT INTO team_activities (
          team_id,
          activity_no,
          activity_type,
          held_date,
          status,
          summary
        ) VALUES (?, ?, ?, ?, 'planned', ?)
      `,
    );
    const insertDeliverable = db.prepare(
      `
        INSERT INTO deliverables (deliverable_type, title, due_date, status)
        VALUES (?, ?, ?, 'pending')
      `,
    );

    TEAM_META.forEach((team, index) => {
      insertTeam.run(team.name, TEAM_TOPICS[index], team.hex);
    });

    PARTICIPANT_NAMES.forEach((name, index) => {
      const teamId = Math.floor(index / 5) + 1;
      const role = index % 5 === 4 ? "facilitator" : "participant";
      insertParticipant.run(
        name,
        `010-41${String(index + 1).padStart(2, "0")}-${String(1100 + index).padStart(4, "0")}`,
        `participant${String(index + 1).padStart(2, "0")}@careerlab.kr`,
        teamId,
        role,
        "2026-04-07",
        role === "facilitator" ? "팀별 진행 지원 담당" : null,
      );
    });

    WORKSHOPS.forEach((workshop) => {
      insertWorkshop.run(
        workshop.session_no,
        workshop.title,
        workshop.held_date,
        workshop.location,
        workshop.facilitator,
      );
    });

    for (let workshopId = 1; workshopId <= WORKSHOPS.length; workshopId += 1) {
      for (let participantId = 1; participantId <= PARTICIPANT_NAMES.length; participantId += 1) {
        insertAttendance.run(workshopId, participantId, 0);
      }
    }

    for (let teamId = 1; teamId <= TEAM_META.length; teamId += 1) {
      ACTIVITY_TYPES.forEach((activityType, index) => {
        insertActivity.run(
          teamId,
          index + 1,
          activityType,
          ACTIVITY_DATES[index],
          `${TEAM_META[teamId - 1].name} ${activityType} 준비 단계`,
        );
      });
    }

    DELIVERABLES.forEach((deliverable) => {
      insertDeliverable.run(
        deliverable.type,
        deliverable.title,
        deliverable.due_date,
      );
    });

    db.prepare(
      `
        INSERT INTO kpi_snapshots (
          snapshot_date,
          participants_count,
          workshops_done,
          activities_done,
          solutions_count,
          trainings_done,
          note
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    ).run("2026-03-13", 0, 0, 0, 0, 0, "사업 시작 전 기준값");
  });

  seed();
}
