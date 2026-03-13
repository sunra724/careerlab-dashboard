export interface TeamMeta {
  id: number;
  name: string;
  hex: string;
  textClass: string;
  softClass: string;
  badgeClass: string;
  ringClass: string;
}

export const TEAM_META: TeamMeta[] = [
  {
    id: 1,
    name: "팀 A",
    hex: "#46549C",
    textClass: "text-navy",
    softClass: "bg-navy/10",
    badgeClass: "bg-navy/10 text-navy",
    ringClass: "ring-navy/20",
  },
  {
    id: 2,
    name: "팀 B",
    hex: "#248DAC",
    textClass: "text-lab-blue",
    softClass: "bg-lab-blue/10",
    badgeClass: "bg-lab-blue/10 text-lab-blue",
    ringClass: "ring-lab-blue/20",
  },
  {
    id: 3,
    name: "팀 C",
    hex: "#228D7B",
    textClass: "text-lab-green",
    softClass: "bg-lab-green/10",
    badgeClass: "bg-lab-green/10 text-lab-green",
    ringClass: "ring-lab-green/20",
  },
  {
    id: 4,
    name: "팀 D",
    hex: "#7C5CBF",
    textClass: "text-lab-violet",
    softClass: "bg-lab-violet/10",
    badgeClass: "bg-lab-violet/10 text-lab-violet",
    ringClass: "ring-lab-violet/20",
  },
  {
    id: 5,
    name: "팀 E",
    hex: "#C0713A",
    textClass: "text-lab-orange",
    softClass: "bg-lab-orange/10",
    badgeClass: "bg-lab-orange/10 text-lab-orange",
    ringClass: "ring-lab-orange/20",
  },
  {
    id: 6,
    name: "팀 F",
    hex: "#1E6B9A",
    textClass: "text-lab-sky",
    softClass: "bg-lab-sky/10",
    badgeClass: "bg-lab-sky/10 text-lab-sky",
    ringClass: "ring-lab-sky/20",
  },
];

export function getTeamMeta(teamId: number | null | undefined): TeamMeta | undefined {
  return TEAM_META.find((team) => team.id === teamId);
}
