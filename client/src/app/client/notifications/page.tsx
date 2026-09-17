"use client";

import { useEffect, useMemo, useState } from "react";
import { clientApi } from "@/services/api";
import type { Notification } from "@/lib/types";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { ClientPageShell } from "../components/ClientPageShell";

const READ_KEY = "client_notification_read_ids";

function loadReadIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = raw ? (JSON.parse(raw) as number[]) : [];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<number>) {
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function formatDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const diffMs = Date.now() - date.getTime();
  const hourMs = 1000 * 60 * 60;
  if (diffMs >= 0 && diffMs < hourMs * 24) {
    const hours = Math.max(1, Math.floor(diffMs / hourMs));
    return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getVisual(type?: string) {
  const value = String(type || "").toLowerCase();
  if (value.includes("resolve")) {
    return { wrap: "bg-emerald-50 text-[#22C55E]", icon: "check_circle", title: "Complaint Resolved" };
  }
  if (value.includes("hearing") || value.includes("schedule")) {
    return { wrap: "bg-orange-50 text-[#F97316]", icon: "calendar_month", title: "Hearing Scheduled" };
  }
  if (value.includes("approv")) {
    return { wrap: "bg-blue-50 text-[#2563EB]", icon: "description", title: "Complaint Approved" };
  }
  if (value.includes("review") || value.includes("status")) {
    return { wrap: "bg-blue-50 text-[#2563EB]", icon: "mail", title: "Complaint Reviewed" };
  }
  if (value.includes("submit")) {
    return { wrap: "bg-emerald-50 text-[#22C55E]", icon: "check_circle", title: "Complaint Submitted" };
  }
  return { wrap: "bg-slate-100 text-slate-600", icon: "notifications", title: type || "Notification" };
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<number>>(new Set());
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReadIds(loadReadIds());
    async function load() {
      try {
        const data = await clientApi.getNotifications();
        setNotifications(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Unable to load notifications.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const visible = useMemo(() => {
    if (tab === "unread") return notifications.filter((item) => !readIds.has(item.id));
    return notifications;
  }, [notifications, readIds, tab]);

  const markRead = (id: number) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveReadIds(next);
      return next;
    });
  };

  return (
    <ClientPageShell
      title="Notifications"
      subtitle="Stay updated with your complaint activities"
    >
      <div className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="mb-4 flex items-center gap-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`pb-3 text-sm font-semibold ${
              tab === "all"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`pb-3 text-sm font-semibold ${
              tab === "unread"
                ? "border-b-2 border-slate-900 text-slate-900"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            Unread
          </button>
        </div>

        {loading ? (
          <p className="text-slate-600">Loading notifications...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : visible.length ? (
          <div className="divide-y divide-slate-200">
            {visible.map((notification) => {
              const visual = getVisual(notification.type);
              const unread = !readIds.has(notification.id);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markRead(notification.id)}
                  className={`flex w-full items-start gap-4 py-4 text-left transition ${
                    unread ? "bg-blue-50/40" : "hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${visual.wrap}`}
                  >
                    <MaterialIcon name={visual.icon} className="text-[22px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-slate-900">{visual.title}</span>
                    <span className="mt-1 block text-sm text-slate-600">
                      {notification.message}
                    </span>
                    <span className="mt-2 block text-xs text-slate-400">
                      {formatDate(notification.sentAt)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {tab === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              You will receive updates when your complaint status changes.
            </p>
          </div>
        )}
      </div>
    </ClientPageShell>
  );
}
