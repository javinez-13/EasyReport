"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { clientApi } from "@/services/api";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import { StatusBadge } from "@/components/admin/StatusBadge";
import type { Complaint } from "@/lib/types";
import {
  CLIENT_PROGRESS_STEPS,
  getClientProgressIndex,
  getClientStatusLabel,
} from "@/lib/complaint-utils";
import { ClientPageShell } from "../../components/ClientPageShell";
import { mediaUrl } from "@/lib/media";

export default function ClientComplaintDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!id) return;
        const data = await clientApi.getComplaintById(id as string);
        setComplaint(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Unable to load complaint details.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const progressIndex = complaint ? getClientProgressIndex(complaint.status) : -1;

  return (
    <ClientPageShell
      title="Complaint Details"
      subtitle="Read-only view synced with the admin complaint workflow."
    >
      <div className="rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        {loading ? (
          <p className="text-slate-600">Loading complaint details...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : complaint ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200 p-6">
              <DetailRow label="Tracking ID" value={complaint.complaintNo} />
              <DetailRow label="Category" value={complaint.category} />
              <DetailRow label="Date Filed" value={complaint.dateFiled || "N/A"} />
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    status={complaint.status}
                    hearingNumber={complaint.latestHearingNumber}
                  />
                }
              />
              <DetailRow label="Progress Label" value={getClientStatusLabel(complaint.status)} />
              <DetailRow label="Priority" value={<PriorityBadge priority={complaint.priority} />} />
              <DetailRow label="Respondent" value={complaint.respondent} />
              <DetailRow
                label="Respondent Contact"
                value={complaint.respondentInfo.contact || "N/A"}
              />
              <DetailRow
                label="Respondent Email"
                value={complaint.respondentInfo.email || "N/A"}
              />
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 p-6">
                <p className="text-xs uppercase tracking-wide text-slate-500">Description</p>
                <p className="mt-2 text-sm text-slate-700">
                  {complaint.description || "No description available."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <p className="text-xs uppercase tracking-wide text-slate-500">Evidence</p>
                {complaint.evidence?.length ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {complaint.evidence.map((item, index) => {
                      const src = mediaUrl(item);
                      return src ? (
                        <a
                          key={`${item}-${index}`}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="overflow-hidden rounded-xl border border-slate-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`Evidence ${index + 1}`} className="h-28 w-full object-cover" />
                        </a>
                      ) : (
                        <p key={`${item}-${index}`} className="text-sm text-slate-700">
                          {item}
                        </p>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">No evidence attached.</p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-6">
                <p className="text-xs uppercase tracking-wide text-slate-500">Progress</p>
                <div className="mt-4 space-y-3">
                  {CLIENT_PROGRESS_STEPS.map((step, index) => {
                    const done = progressIndex >= index;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            done
                              ? "bg-[#22C55E] text-white"
                              : "border border-slate-300 text-slate-400"
                          }`}
                        >
                          {done ? "✓" : index + 1}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            done ? "text-slate-900" : "text-slate-400"
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {(complaint.hearingDate || complaint.venue || complaint.summonNo) && (
                <div className="rounded-2xl border border-slate-200 p-6">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Hearing Information
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-slate-700">
                    {complaint.summonNo ? <p>Summon No: {complaint.summonNo}</p> : null}
                    {complaint.hearingDate ? <p>Date: {complaint.hearingDate}</p> : null}
                    {complaint.hearingTime ? <p>Time: {complaint.hearingTime}</p> : null}
                    {complaint.venue ? <p>Venue: {complaint.venue}</p> : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <p className="text-lg font-semibold text-slate-900">Complaint details not available.</p>
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => router.push("/client/complaints")}
            className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Back to Complaints
          </button>
        </div>
      </div>
    </ClientPageShell>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}
