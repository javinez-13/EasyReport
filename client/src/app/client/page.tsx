"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authApi } from "@/services/auth";
import { clientApi } from "@/services/api";
import type { Complaint, AuthUser } from "@/lib/types";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { CLIENT_PROGRESS_STEPS, getClientStatusLabel } from "@/lib/complaint-utils";
import { ClientTopBar } from "./components/ClientTopBar";
import { FeeConfirmModal } from "./components/FeeConfirmModal";
import {
  getDashboardStepperCompletedIndex,
  getStatusDotClass,
} from "./components/statusStyles";

function friendlyError(err: any) {
  const message = err?.response?.data?.message || err?.message || "";
  if (/invalid token|expired|unauthorized|access token/i.test(String(message))) {
    return "Your session has expired. Please log in again.";
  }
  return message || "Unable to load client data.";
}

export default function ClientHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [profile, complaints] = await Promise.all([
          clientApi.getProfile(),
          clientApi.getComplaints({ limit: 5 }),
        ]);
        setUser(profile);
        setRecentComplaints(complaints);
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (err: any) {
        setError(friendlyError(err));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const latestComplaint = useMemo(() => recentComplaints[0] || null, [recentComplaints]);
  const completedIndex = latestComplaint
    ? getDashboardStepperCompletedIndex(latestComplaint.status)
    : -1;

  const displayName = user?.fullname || user?.username || "Resident";
  const initials =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R";

  const handleLogout = async () => {
    await authApi.logout();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <ClientTopBar rightSlot="avatar" avatarInitials="..." />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <p className="text-slate-600">Loading your resident portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F3F4F6]">
        <ClientTopBar rightSlot="avatar" avatarInitials={initials} />
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <p className="text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <div className="relative" ref={menuRef}>
        <ClientTopBar
          rightSlot="avatar"
          avatarInitials={initials}
          avatarUrl={user?.profilePicture}
          onAvatarClick={() => setMenuOpen((prev) => !prev)}
        />
        {menuOpen ? (
          <div className="absolute right-4 top-[68px] z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl sm:right-8">
            <Link
              href="/client/profile"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Profile
            </Link>
            <Link
              href="/client/activity"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Activity Timeline
            </Link>
            <Link
              href="/client/complaints"
              onClick={() => setMenuOpen(false)}
              className="block cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              View Complaints
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="block w-full cursor-pointer rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
            >
              Log out
            </button>
          </div>
        ) : null}
      </div>

      <section
        className="relative flex min-h-[280px] items-center justify-center bg-cover bg-center px-4 py-16 sm:min-h-[340px]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.35), rgba(15,23,42,0.35)), url('/hero-banner.png')",
        }}
      >
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <h1 className="text-3xl font-bold text-white drop-shadow sm:text-4xl">
            Welcome, {displayName}!
          </h1>
          <button
            type="button"
            onClick={() => setFeeModalOpen(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
          >
            <MaterialIcon name="folder_open" className="text-[20px]" />
            File a Complaint
          </button>
        </div>
      </section>

      <FeeConfirmModal
        open={feeModalOpen}
        onClose={() => setFeeModalOpen(false)}
        onProceed={() => {
          setFeeModalOpen(false);
          router.push("/client/complaints/new");
        }}
      />

      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Recent Complaints</h2>

          {recentComplaints.length ? (
            <div className="mt-4 divide-y divide-slate-200">
              {recentComplaints.map((complaint) => (
                <button
                  key={complaint.id}
                  type="button"
                  onClick={() => router.push(`/client/complaints/${complaint.id}`)}
                  className="flex w-full items-center gap-3 py-4 text-left transition hover:bg-slate-50"
                >
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full ${getStatusDotClass(complaint.status)}`}
                  />
                  <span className="min-w-0 flex-1 text-sm text-slate-800">
                    <span className="font-semibold">{complaint.complaintNo}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span>{complaint.category}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-600">{getClientStatusLabel(complaint.status)}</span>
                  </span>
                  <MaterialIcon name="chevron_right" className="shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-900">No recent complaints.</p>
              <p className="mt-2 text-sm text-slate-500">
                Your submitted complaints will appear here after filing.
              </p>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <Link
              href="/client/complaints"
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View all complaints
              <MaterialIcon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-6">
          <h2 className="text-lg font-bold text-slate-900">Complaint Status</h2>

          {latestComplaint ? (
            <div className="mt-8 px-2 sm:px-6">
              <div className="relative flex items-start justify-between">
                <div className="absolute left-[12%] right-[12%] top-4 h-[3px] bg-slate-200" />
                <div
                  className="absolute left-[12%] top-4 h-[3px] bg-[#22C55E] transition-all"
                  style={{
                    width:
                      completedIndex <= 0
                        ? "0%"
                        : completedIndex >= 3
                          ? "76%"
                          : `${(completedIndex / 3) * 76}%`,
                  }}
                />

                {CLIENT_PROGRESS_STEPS.map((step, index) => {
                  const done = completedIndex >= index;
                  return (
                    <div key={step} className="relative z-10 flex w-1/4 flex-col items-center">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                          done
                            ? "border-[#22C55E] bg-[#22C55E] text-white"
                            : "border-slate-300 bg-white text-slate-300"
                        }`}
                      >
                        <MaterialIcon name="check" className="text-[18px]" />
                      </span>
                      <p
                        className={`mt-3 text-center text-xs font-semibold sm:text-sm ${
                          done ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {step}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-semibold text-slate-900">No complaint progress yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                File a complaint to start tracking Submitted → Resolved.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
