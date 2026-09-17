"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApi } from "@/services/api";
import type { ActivityLog } from "@/lib/types";
import { ClientPageShell } from "../components/ClientPageShell";

const MARKER_COLORS = [
  "bg-[#C4B5FD]",
  "bg-[#EC4899]",
  "bg-[#FB923C]",
  "bg-[#94A3B8]",
];

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const datePart = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} • ${timePart}`;
}

function parseDetails(details: ActivityLog["details"]) {
  if (!details) return null;
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }
  return details;
}

function getStatusTitle(activity: ActivityLog) {
  const action = (activity.action || "").toLowerCase();
  if (action.includes("resolve")) return "Complaint Resolved";
  if (action.includes("hearing") || action.includes("schedule")) {
    return "Mediation Session Scheduled";
  }
  if (action.includes("summon")) return "Summons Issued";
  if (action.includes("approve")) return "Complaint Approved";
  if (action.includes("review")) return "Reviewed by Admin";
  if (action.includes("submit") || action.includes("filed")) return "Complaint Filed";
  if (action.includes("progress")) return "In Progress";
  if (action.includes("cancel")) return "Cancelled";
  if (action.includes("status") || action.includes("update")) return "Complaint Updated";
  return activity.action || "Activity Update";
}

function getLogDescription(activity: ActivityLog) {
  const details = parseDetails(activity.details);
  const action = (activity.action || "").toLowerCase();
  const complaintNo = activity.complaintNo || details?.complaintNo;
  const category = activity.category || details?.category;
  const status = details?.status;

  const parts: string[] = [];

  if (action.includes("resolve")) {
    parts.push("Your complaint has been successfully resolved by the barangay.");
  } else if (action.includes("approve")) {
    parts.push("Your complaint was approved and is now being processed.");
  } else if (action.includes("summon")) {
    parts.push(
      details?.hearingDate
        ? `A summons was issued for appearance on ${details.hearingDate}${
            details.hearingTime ? ` at ${details.hearingTime}` : ""
          }${details.venue ? ` (${details.venue})` : ""}.`
        : "A summons has been issued for your complaint."
    );
  } else if (action.includes("hearing") || action.includes("schedule")) {
    parts.push(
      details?.hearingDate
        ? `Mediation session scheduled on ${details.hearingDate}${
            details.hearingTime ? ` at ${details.hearingTime}` : ""
          }${details.venue ? ` at ${details.venue}` : ""}.`
        : "A mediation session has been scheduled for your complaint."
    );
  } else if (action.includes("review")) {
    parts.push("The complaint is now under evaluation by barangay officials.");
  } else if (action.includes("submit") || action.includes("filed")) {
    parts.push("Your complaint has been successfully filed and is pending review.");
  } else if (action.includes("progress") || action.includes("status") || action.includes("update")) {
    parts.push(status ? `Status changed to ${status}.` : "Your case progress was updated.");
  } else if (action.includes("cancel")) {
    parts.push("Your complaint was cancelled.");
  } else if (typeof details === "string") {
    parts.push(details);
  } else {
    parts.push("An update was recorded for your complaint.");
  }

  if (complaintNo) parts.push(`Complaint No: ${complaintNo}`);
  if (category) parts.push(`Category: ${category}`);

  return parts.join(" ");
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await clientApi.getActivity();
        setActivities(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Unable to load activity timeline.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const sorted = useMemo(
    () =>
      [...activities].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    [activities]
  );

  return (
    <ClientPageShell
      title="Activity Timeline"
      subtitle="View all actions and updates related to your complaints"
    >
      <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-8">
        {loading ? (
          <p className="text-slate-600">Loading activity...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : sorted.length ? (
          <div className="relative ml-2 border-l-2 border-slate-400 pl-8 sm:ml-3 sm:pl-10">
            <div className="space-y-10">
              {sorted.map((activity, index) => {
                const markerColor = MARKER_COLORS[index % MARKER_COLORS.length];

                return (
                  <div key={activity.id} className="relative">
                    {/* Node sits on the vertical axis */}
                    <span
                      className={`absolute -left-[2.55rem] top-1 h-5 w-5 rounded-full ring-4 ring-white sm:-left-[3.05rem] sm:h-6 sm:w-6 sm:ring-[5px] ${markerColor}`}
                      aria-hidden
                    />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-8">
                      <p className="w-full shrink-0 text-sm font-bold leading-snug text-slate-900 sm:w-[12.5rem] sm:text-[15px]">
                        {formatDateTime(activity.createdAt)}
                      </p>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 sm:text-[15px]">
                          {getStatusTitle(activity)}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {getLogDescription(activity)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">No activity yet.</p>
            <p className="mt-2 text-sm text-slate-500">
              Your timeline will appear once you submit a complaint or the barangay updates your case.
            </p>
          </div>
        )}
      </div>
    </ClientPageShell>
  );
}
