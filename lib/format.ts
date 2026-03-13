import { differenceInCalendarDays, format, parseISO } from "date-fns";

import type { BadgeTone, DeliverableStatus } from "@/lib/types";

export function formatKoreanDate(dateString: string | null | undefined) {
  if (!dateString) {
    return "미정";
  }

  return format(parseISO(dateString), "yyyy.MM.dd");
}

export function calculateDday(
  dueDate: string,
  status: DeliverableStatus,
): { label: string; tone: BadgeTone } {
  if (status === "submitted" || status === "approved") {
    return { label: "제출 완료", tone: "green" };
  }

  const diff = differenceInCalendarDays(parseISO(dueDate), new Date());

  if (diff < 0) {
    return { label: `기한 초과 ${Math.abs(diff)}일`, tone: "red" };
  }

  if (diff === 0) {
    return { label: "오늘 마감", tone: "red" };
  }

  if (diff <= 7) {
    return { label: `D-${diff}`, tone: "red" };
  }

  if (diff <= 14) {
    return { label: `D-${diff}`, tone: "amber" };
  }

  return { label: `D-${diff}`, tone: "gray" };
}
