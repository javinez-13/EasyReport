"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { complaintsApi, hearingsApi } from "@/services/api";
import type { Complaint, Hearing } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

export default function ComplaintUnsettledPage({
  params,
}: {
  params: Promise<{ id: string; stage?: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const cData = await complaintsApi.getById(id);
      setComplaint(cData);

      const hData = await hearingsApi.getByComplaint(id);
      setHearings(hData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 text-sm font-medium">
        Loading unsettled complaint details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Complaint record not found.</p>
        <Link href="/admin/complaints" className="mt-4 text-primary hover:underline text-sm font-medium inline-block">
          ← Back to Complaints
        </Link>
      </div>
    );
  }

  // Filter and deduplicate existing saved hearings in order (Hearing 1 to 4)
  const existingHearings = [1, 2, 3, 4]
    .map((num) => {
      // Find the latest saved record for each stage number
      return [...hearings].reverse().find((h) => h.hearingNumber === num) || null;
    })
    .filter((record): record is Hearing => record !== null);

  // Complainant & Respondent Information fallbacks
  const complainantName = complaint.complainantInfo?.name || complaint.complainant || "N/A";
  const complainantEmail = complaint.complainantInfo?.email || "N/A";
  const complainantContact = complaint.complainantInfo?.contact || "N/A";
  const complainantAddress = complaint.complainantInfo?.address || "N/A";
  const complainantAge = (complaint.complainantInfo as any)?.age || "N/A";

  const respondentName = complaint.respondentInfo?.name || complaint.respondent || "N/A";
  const respondentAddress = complaint.respondentInfo?.address || "N/A";
  const respondentContact = complaint.respondentInfo?.contact || "N/A";
  const respondentEmail = complaint.respondentInfo?.email || "N/A";

  const stageTitles: Record<number, string> = {
    1: "HEARING 1",
    2: "HEARING 2",
    3: "HEARING 3",
    4: "HEARING 4",
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title={`UNSETTLED — Complaint #${complaint.complaintNo}`}
        action={
          <button
            type="button"
            onClick={() => router.push("/admin/complaints")}
            className="text-sm font-medium text-primary hover:text-primary-dark"
          >
            ← Back to Complaints
          </button>
        }
      />

      {/* Case Overview Summary Header */}
      <div className="admin-card p-5 space-y-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            Case Overview Summary
          </h3>
          <StatusBadge status="Unsettled" hearingNumber={complaint.latestHearingNumber} />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 font-medium">Complaint #</p>
            <p className="font-bold text-primary">{complaint.complaintNo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Date Filed</p>
            <p className="font-semibold text-gray-800">{complaint.dateFiled}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Category</p>
            <p className="font-semibold text-gray-800">{complaint.category}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Priority</p>
            <div className="mt-0.5">
              <PriorityBadge priority={complaint.priority} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Complete Case Information (READ-ONLY) */}
      <div className="admin-card p-6 md:p-8 bg-white space-y-6 border border-gray-200 shadow-sm rounded-2xl">
        <div className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-200 pb-3">
          <MaterialIcon name="folder_open" className="text-primary text-xl" />
          CASE INFORMATION
        </div>

        {/* Complainant Information */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold py-2 text-gray-800 uppercase tracking-wide">Complainant Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium">Full Name</p>
              <p className="font-semibold py-2 text-gray-900 mt-0.5 capitalize">{complainantName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Email Address</p>
              <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantEmail}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
              <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantContact}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Complete Address</p>
              <p className="font-semibold py-2 text-gray-900 mt-0.5 capitalize">{complainantAddress}</p>
            </div>
            {complainantAge !== "N/A" && (
              <div>
                <p className="text-xs text-gray-400 font-medium">Age</p>
                <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantAge}</p>
              </div>
            )}
          </div>
        </div>

        {/* Respondent Information */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Respondent Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Full Name</p>
              <div className="w-full py-2 rounded-lg font-semibold text-gray-800 capitalize text-sm">
                {respondentName}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Complete Address</p>
              <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                {respondentAddress}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Mobile Number</p>
              <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                {respondentContact}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1">Email Address</p>
              <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                {respondentEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Complaint Description */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Complaint Description</h4>
          <div className="w-full py-4 rounded-2xl text-sm text-gray-800 leading-relaxed min-h-[80px]">
            {complaint.description || "No description provided."}
          </div>
        </div>

        {/* Complaint Evidence */}
        {complaint.evidence && complaint.evidence.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Complaint Evidence</h4>
            <div className="flex flex-wrap gap-3">
              {complaint.evidence.map((ev: any, idx: number) => (
                <a
                  key={idx}
                  href={typeof ev === "string" ? ev : ev.url || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
                >
                  <MaterialIcon name="attach_file" className="text-sm" />
                  {typeof ev === "string" ? `Evidence ${idx + 1}` : ev.name || `Evidence ${idx + 1}`}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Hearing History (READ-ONLY) */}
      <div className="space-y-6">
        {existingHearings.length > 0 ? (
          existingHearings.map((record) => {
            const stageNum = record.hearingNumber;
            const witObj = (record.witnesses && record.witnesses.length > 0) ? record.witnesses[0] : null;
            const witName = typeof witObj === "string"
              ? witObj
              : (witObj && typeof witObj === "object" && "name" in (witObj as object) ? String((witObj as any).name) : "N/A");
            const witAddress = witObj && typeof witObj === "object" && "address" in (witObj as object)
              ? String((witObj as any).address)
              : "N/A";

            const hDate = record.date || complaint.hearingDate || "N/A";
            const hTime = record.time || complaint.hearingTime || "N/A";
            const hDuration = record.timeConsumed || "N/A";
            const hMediator = record.assignedMediator || "N/A";
            const hDecision = record.decision || "Unsettled";
            const hNotes = record.mediationNotes || "No mediation notes recorded.";

            return (
              <div
                key={record.id || stageNum}
                className="admin-card p-6 md:p-8 bg-white space-y-6 border border-gray-200 shadow-sm rounded-2xl"
              >
                <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <MaterialIcon name="event_note" className="text-primary text-xl" />
                    {stageTitles[stageNum] || `HEARING ${stageNum}`}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Stage {stageNum} Record
                  </span>
                </div>

                {/* Complainant Information */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">Complainant Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Full Name</p>
                      <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Email Address</p>
                      <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantEmail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
                      <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantContact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Complete Address</p>
                      <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantAddress}</p>
                    </div>
                    {complainantAge !== "N/A" && (
                      <div>
                        <p className="text-xs text-gray-400 font-medium">Age</p>
                        <p className="font-semibold py-2 text-gray-900 mt-0.5">{complainantAge}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Respondent Information */}
                <div className="space-y-6 pt-2">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wide">Respondent Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Full Name</p>
                      <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                        {respondentName}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Complete Address</p>
                      <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                        {respondentAddress}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Mobile Number</p>
                      <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                        {respondentContact}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Email Address</p>
                      <div className="w-full py-2 rounded-lg font-semibold text-gray-800 text-sm">
                        {respondentEmail}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Witness Information */}
                <div className="space-y-6">
                  <h4 className="text-sm font-bold text-black uppercase tracking-wider">Witness</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Full Name</p>
                      <div className="w-full py-2 capitalize rounded-lg font-semibold text-gray-800 text-sm">
                        {witName}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium mb-1">Complete Address</p>
                      <div className="w-full py-2 capitalize rounded-lg font-semibold text-gray-800 text-sm">
                        {witAddress}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hearing Schedule & Decision Details */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-sm font-bold text-black uppercase mb-1">Hearing Date</p>
                      <div className="w-full py-4 flex items-center justify-between font-medium text-gray-800 text-sm">
                        <span>{hDate}</span>
                      </div>
                    </div>
                    <div className="hidden md:block" />

                    <div>
                      <p className="text-sm font-bold text-gray-900 uppercase mb-1">Hearing Time</p>
                      <div className="w-full py-4 flex items-center justify-between font-medium text-gray-800 text-sm">
                        {hTime}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900 uppercase mb-1">Time Consumed</p>
                      <div className="w-full py-4 flex items-center justify-between font-medium text-gray-800 text-sm">
                        {hDuration}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900 uppercase mb-1">Assign Mediator</p>
                      <div className="w-full py-4 flex items-center justify-between font-medium text-gray-800 text-sm">
                        <span>{hMediator}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900 uppercase mb-1">Decision</p>
                      <div className="w-full py-4 flex items-center justify-between font-medium text-gray-800 text-sm">
                        <span>{hDecision}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-gray-900 uppercase mb-1">Note</p>
                    <div className="w-full capitalize py-4 text-sm text-gray-800 leading-relaxed">
                      &ldquo;{hNotes}&rdquo;
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="admin-card p-6 bg-white text-center text-sm text-gray-500 rounded-2xl border border-gray-200">
            No hearing history recorded for this case.
          </div>
        )}
      </div>

      {/* Trial Court Settlement Notice */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-5 text-center shadow-sm">
        <p className="text-base font-bold text-amber-900">
          For further settlement will proceed to trial court.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center pt-2">
        <button
          type="button"
          onClick={() => router.push("/admin/complaints")}
          className="px-8 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold text-sm transition-colors min-w-[140px]"
        >
          BACK
        </button>
      </div>
    </div>
  );
}
