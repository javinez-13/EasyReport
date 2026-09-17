import type { ComplaintStatus, Priority } from "./types";

const LEGACY_STATUS_MAP: Record<string, ComplaintStatus> = {
  "Forwarded to Court": "Unsettled",
  Rejected: "Cancelled",
};

const PRIORITY_RANK: Record<string, number> = {
  High: 0,
  Medium: 1,
  Normal: 2,
  Low: 2,
};

export type ClientProgressStep = "Submitted" | "In Review" | "In Progress" | "Resolved";

export function normalizeStatus(status: string): ComplaintStatus {
  if (!status) return "Pending";
  const trimmed = status.trim();

  if (/^pending$/i.test(trimmed)) return "Pending";
  if (/in\s*progress/i.test(trimmed)) return "In Progress";
  if (/scheduled/i.test(trimmed)) return "Scheduled";
  if (/resolved/i.test(trimmed)) return "Resolved";
  if (/cancelled|canceled|rejected/i.test(trimmed)) return "Cancelled";
  if (/unsettled|forwarded/i.test(trimmed)) return "Unsettled";

  return (LEGACY_STATUS_MAP[trimmed] ?? trimmed) as ComplaintStatus;
}

/** Map admin workflow statuses into a simplified resident-facing progress step. */
export function mapToClientProgressStep(status: string): ClientProgressStep {
  const normalized = normalizeStatus(status);

  switch (normalized) {
    case "Pending":
      return "In Review";
    case "In Progress":
    case "Scheduled":
      return "In Progress";
    case "Resolved":
      return "Resolved";
    case "Cancelled":
    case "Unsettled":
      return "Resolved";
    default:
      return "Submitted";
  }
}

export function getClientProgressIndex(status: string): number {
  const step = mapToClientProgressStep(status);
  const flow: ClientProgressStep[] = ["Submitted", "In Review", "In Progress", "Resolved"];
  return flow.indexOf(step);
}

export function getClientStatusLabel(status: string): string {
  const normalized = normalizeStatus(status);
  if (normalized === "Scheduled") return "Hearing Scheduled";
  if (normalized === "Pending") return "Pending";
  if (normalized === "In Progress") return "In Progress";
  if (normalized === "Resolved") return "Resolved";
  if (normalized === "Cancelled") return "Cancelled";
  if (normalized === "Unsettled") return "Unsettled";
  return status;
}

export function normalizePriority(priority: string): Priority {
  if (priority === "Low") return "Normal";
  return priority as Priority;
}

export function sortByPriority<T extends { priority: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rankA = PRIORITY_RANK[a.priority] ?? 99;
    const rankB = PRIORITY_RANK[b.priority] ?? 99;
    if (rankA !== rankB) return rankA - rankB;
    return 0;
  });
}

export const COMPLAINT_STATUSES: ComplaintStatus[] = [
  "Pending",
  "In Progress",
  "Scheduled",
  "Resolved",
  "Cancelled",
  "Unsettled",
];

export const CLIENT_PROGRESS_STEPS: ClientProgressStep[] = [
  "Submitted",
  "In Review",
  "In Progress",
  "Resolved",
];
