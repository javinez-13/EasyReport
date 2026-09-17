import { normalizeStatus } from "@/lib/complaint-utils";

export function getStatusDotClass(status: string) {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case "Resolved":
      return "bg-[#22C55E]";
    case "Pending":
      return "bg-[#EAB308]";
    case "In Progress":
      return "bg-[#2563EB]";
    case "Scheduled":
      return "bg-[#F97316]";
    case "Cancelled":
      return "bg-[#EF4444]";
    case "Unsettled":
      return "bg-slate-700";
    default:
      return "bg-slate-400";
  }
}

/** How many horizontal stepper steps are completed (0-based inclusive). */
export function getDashboardStepperCompletedIndex(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "Pending") return 0;
  if (normalized === "In Progress" || normalized === "Scheduled") return 2;
  if (normalized === "Resolved" || normalized === "Cancelled" || normalized === "Unsettled") {
    return 3;
  }
  return 0;
}
