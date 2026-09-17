import type { Priority } from "@/lib/types";
import { normalizePriority } from "@/lib/complaint-utils";

const priorityStyles: Record<Priority, string> = {
  Critical: "bg-rose-100 text-rose-900 ring-1 ring-rose-300 font-bold",
  High: "bg-red-100 text-red-800 ring-1 ring-red-200",
  Medium: "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
  Normal: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Low: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
};

export function PriorityBadge({ priority }: { priority: string }) {
  const normalized = normalizePriority(priority) as Priority;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${priorityStyles[normalized] ?? "bg-slate-100 text-slate-600"}`}
    >
      {normalized || priority}
    </span>
  );
}
