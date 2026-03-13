export type ParticipantRole = "participant" | "facilitator" | "coordinator";
export type ParticipantStatus = "active" | "withdrawn";
export type WorkStatus = "planned" | "ongoing" | "done";
export type DeliverableStatus = "pending" | "submitted" | "approved";
export type BadgeTone = "green" | "blue" | "amber" | "gray" | "red";

export interface TeamRecord {
  id: number;
  name: string;
  topic: string | null;
  color: string;
  created_at: string;
}

export interface ParticipantRecord {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  team_id: number | null;
  role: ParticipantRole;
  joined_at: string;
  status: ParticipantStatus;
  note: string | null;
  created_at: string;
  team_name: string | null;
  team_color: string | null;
}

export interface WorkshopRecord {
  id: number;
  session_no: number;
  title: string;
  held_date: string | null;
  location: string | null;
  facilitator: string | null;
  status: WorkStatus;
  plan_doc_url: string | null;
  result_doc_url: string | null;
  note: string | null;
  attended_count: number;
  total_invited: number;
}

export interface TeamActivityRecord {
  id: number;
  team_id: number;
  team_name: string;
  team_color: string;
  activity_no: number;
  activity_type: string | null;
  held_date: string | null;
  location: string | null;
  summary: string | null;
  status: WorkStatus;
  report_url: string | null;
  evidence_urls: string | null;
  created_at: string;
}

export interface DeliverableRecord {
  id: number;
  deliverable_type: string;
  title: string;
  due_date: string;
  submitted_at: string | null;
  file_url: string | null;
  status: DeliverableStatus;
  note: string | null;
}

export interface TeamSummary {
  id: number;
  name: string;
  topic: string | null;
  color: string;
  member_count: number;
  activities_done: number;
}

export interface OverviewResponse {
  kpi: {
    participantsCount: number;
    workshopsDone: number;
    activitiesDone: number;
    solutionsCount: number;
  };
  deliverables: DeliverableRecord[];
  teams: TeamSummary[];
  currentStage: string;
}

export interface KpiMetric {
  value: number;
  target: number;
  label: string;
}

export interface KpiSnapshot {
  id: number;
  snapshot_date: string;
  participants_count: number;
  workshops_done: number;
  activities_done: number;
  solutions_count: number;
  trainings_done: number;
  note: string | null;
}

export interface KpiResponse {
  current: {
    participants: KpiMetric;
    workshops: KpiMetric;
    activities: KpiMetric;
    solutions: KpiMetric;
    trainings: KpiMetric;
  };
  snapshots: KpiSnapshot[];
}
