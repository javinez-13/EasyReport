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

export default function ComplaintProgressPage({
  params,
}: {
  params: Promise<{ id: string; stage?: string }>;
}) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const rawStage = resolvedParams.stage;

  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Editable Respondent Form State
  const [respondentName, setRespondentName] = useState("");
  const [respondentAddress, setRespondentAddress] = useState("");
  const [respondentContact, setRespondentContact] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");

  // Editable Witness State
  const [witnessName, setWitnessName] = useState("");
  const [witnessAddress, setWitnessAddress] = useState("");

  // Editable Hearing Details State
  const [hearingDate, setHearingDate] = useState("");
  const [hearingTime, setHearingTime] = useState("");
  const [timeConsumed, setTimeConsumed] = useState("");
  const [assignedMediator, setAssignedMediator] = useState("");
  const [decision, setDecision] = useState("");
  const [mediationNotes, setMediationNotes] = useState("");
  const [venue, setVenue] = useState("Barangay Hall Session Room");

  const loadData = useCallback(async () => {
    try {
      const cData = await complaintsApi.getById(id);
      setComplaint(cData);

      setRespondentName(cData.respondentInfo?.name || cData.respondent || "");
      setRespondentAddress(cData.respondentInfo?.address || "");
      setRespondentContact(cData.respondentInfo?.contact || "");
      setRespondentEmail(cData.respondentInfo?.email || "");

      const hData = await hearingsApi.getByComplaint(id);
      setHearings(hData);

      const latestHearingNum = cData.latestHearingNumber || hData.length || 1;
      const targetStage = Math.max(1, Math.min(4, rawStage ? Number(rawStage) : latestHearingNum));

      const found = hData.find((h) => h.hearingNumber === targetStage);
      if (found) {
        if (found.date) setHearingDate(found.date);
        if (found.time) setHearingTime(found.time);
        if (found.timeConsumed) setTimeConsumed(found.timeConsumed);
        if (found.assignedMediator) setAssignedMediator(found.assignedMediator);
        if (found.decision) setDecision(found.decision);
        if (found.mediationNotes) setMediationNotes(found.mediationNotes);
        if (found.venue) setVenue(found.venue);

        if (found.witnesses && found.witnesses.length > 0) {
          const wit = found.witnesses[0];
          if (typeof wit === "string") {
            setWitnessName(wit);
          } else if (typeof wit === "object" && wit) {
            setWitnessName((wit as { name?: string }).name || "");
            setWitnessAddress((wit as { address?: string }).address || "");
          }
        }
      } else {
        if (cData.hearingDate) setHearingDate(cData.hearingDate);
        if (cData.hearingTime) setHearingTime(cData.hearingTime);
        if (!assignedMediator) setAssignedMediator("Cap. Nicolas C. Antipuesto");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, rawStage, assignedMediator]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const latestHearingNum = complaint?.latestHearingNumber || hearings.length || 1;
  const stageNumber = Math.max(1, Math.min(4, rawStage ? Number(rawStage) : latestHearingNum));

  const saveFormDetails = async (desiredComplaintStatus: string) => {
    // Save respondent updates
    if (respondentName.trim()) {
      await complaintsApi.updateRespondent(id, {
        name: respondentName.trim(),
        address: respondentAddress.trim(),
        contact: respondentContact.trim(),
        email: respondentEmail.trim(),
      });
    }

    // Prepare witness payload
    const witnessPayload = witnessName.trim()
      ? [{ name: witnessName.trim(), address: witnessAddress.trim() }]
      : [];

    // Save hearing updates
    await hearingsApi.save({
      complaintId: id,
      hearingNumber: stageNumber,
      hearingDate: hearingDate || new Date().toISOString().slice(0, 10),
      hearingTime: hearingTime || "09:00 AM",
      timeConsumed: timeConsumed.trim(),
      assignedMediator: assignedMediator.trim(),
      venue: venue.trim(),
      witnesses: witnessPayload as any,
      decision: decision.trim(),
      mediationNotes: mediationNotes.trim(),
      complaintStatus: desiredComplaintStatus,
      status: desiredComplaintStatus === "Scheduled" ? "Scheduled" : "Conducted",
    });
  };

  const handleScheduleHearing = async () => {
    if (stageNumber >= 4) return;
    setActionLoading(true);
    try {
      await saveFormDetails("Scheduled");
      router.push("/admin/complaints");
    } catch (err) {
      console.error(err);
      alert("Failed to save and schedule hearing.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!confirm("Are you sure you want to mark this complaint as RESOLVED?")) return;
    setActionLoading(true);
    try {
      await saveFormDetails("Resolved");
      router.push(`/admin/complaints/${id}/resolve/${stageNumber}`);
    } catch (err) {
      console.error(err);
      alert("Failed to resolve complaint.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsettled = async () => {
    if (!confirm("Are you sure you want to mark this complaint as UNSETTLED?")) return;
    setActionLoading(true);
    try {
      await saveFormDetails("Unsettled");
      router.push("/admin/complaints");
    } catch (err) {
      console.error(err);
      alert("Failed to set complaint to unsettled.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 text-sm">
        Loading progress form...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Complaint not found.</p>
        <Link href="/admin/complaints" className="mt-4 text-primary hover:underline text-sm font-medium">
          ← Back to Complaints
        </Link>
      </div>
    );
  }



  // Complainant Display info
  const complainantName = complaint.complainantInfo?.name || complaint.complainant || "N/A";
  const complainantEmail = complaint.complainantInfo?.email || "N/A";
  const complainantContact = complaint.complainantInfo?.contact || "N/A";
  const complainantAddress = complaint.complainantInfo?.address || "N/A";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={``}
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

      {/* Overview Header */}
      <div className="admin-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Complaint Overview
          </h3>
          <StatusBadge status={complaint.status} hearingNumber={stageNumber} />
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

      {/* Main Interactive Form with Exact Styling of Reference Image */}
      <div className="admin-card p-6 md:p-8 bg-white space-y-6 border border-gray-200 shadow-sm rounded-2xl">
        {/* Section 1: Complainant Information */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm py-2 font-bold uppercase text-gray-900">Complainant Information</h3>
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
          </div>
        </div>

        {/* Section 2: Respondent Information (Inputable) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm py-2 font-bold uppercase text-gray-900">Respondent Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter Respondent Full Name"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="w-full capitalize px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Complete Address</label>
              <input
                type="text"
                placeholder="Enter Complete Address"
                value={respondentAddress}
                onChange={(e) => setRespondentAddress(e.target.value)}
                className="w-full capitalize px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Mobile Number</label>
              <input
                type="text"
                placeholder="Enter Mobile Number"
                value={respondentContact}
                onChange={(e) => setRespondentContact(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Email Address</label>
              <input
                type="email"
                placeholder="Enter Email Address"
                value={respondentEmail}
                onChange={(e) => setRespondentEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Witness (Inputable) */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm py-2 font-bold uppercase text-gray-900">Witness</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter Witness Full Name"
                value={witnessName}
                onChange={(e) => setWitnessName(e.target.value)}
                className="w-full capitalize px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 font-medium mb-1">Complete Address</label>
              <input
                type="text"
                placeholder="Enter Witness Address"
                value={witnessAddress}
                onChange={(e) => setWitnessAddress(e.target.value)}
                className="w-full capitalize px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Hearing Schedule & Decision Details (Inputable) */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-sm py-2 font-semibold uppercase text-gray-900 mb-1">Hearing Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={hearingDate}
                  onChange={(e) => setHearingDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-full bg-white font-medium text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                />
              </div>
            </div>
            <div className="hidden md:block" />

            <div>
              <label className="block py-2 text-sm font-semibold uppercase text-gray-900 mb-1">Hearing Time</label>
              <input
                type="text"
                placeholder="1:00 PM"
                value={hearingTime}
                onChange={(e) => setHearingTime(e.target.value)}
                className="w-full uppercase px-4 py-2.5 border border-gray-300 rounded-full bg-white font-medium text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block py-2 text-sm font-semibold uppercase text-gray-900 mb-1">Time Consumed</label>
              <input
                type="text"
                placeholder="1 hour"
                value={timeConsumed}
                onChange={(e) => setTimeConsumed(e.target.value)}
                className="w-full uppercase px-4 py-2.5 border border-gray-300 rounded-full bg-white font-medium text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
              />
            </div>

            <div>
              <label className="block py-2 text-sm font-semibold uppercase text-gray-900 mb-1">Assign Mediator</label>
              <div className="relative">
                <select
                  value={assignedMediator}
                  onChange={(e) => setAssignedMediator(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-full bg-white font-medium text-gray-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm pr-10"
                >
                  <option value="">Select Mediator...</option>
                  <option value="Lupong Bentong">Lupong Bentong</option>
                  <option value="Cap. Nicolas C. Antipuesto">Cap. Nicolas C. Antipuesto</option>
                  <option value="Brgy. Captain / Lupon Officer">Brgy. Captain / Lupon Officer</option>
                  <option value="Brgy. Kagawad Ramos">Brgy. Kagawad Ramos</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <MaterialIcon name="expand_more" className="text-xl" />
                </div>
              </div>
            </div>

            <div>
              <label className="block py-2 text-sm font-semibold uppercase text-gray-900 mb-1">Decision</label>
              <div className="relative">
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-full bg-white font-medium text-gray-900 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm pr-10"
                >
                  <option value="">Select Decision...</option>
                  <option value="Unsettled">Unsettled</option>
                  <option value="Settled">Settled</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Pending Conciliation">Pending Conciliation</option>
                  <option value="Re-schedule">Re-schedule</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <MaterialIcon name="expand_more" className="text-xl" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block py-2 text-sm font-semibold uppercase text-gray-900 mb-1">Message / Note</label>
            <textarea
              rows={3}
              placeholder='e.g. "Despite multiple hearings, including the fourth session, no resolution has been achieved. The case remains unsettled and is recommended for escalation to the trial court for appropriate legal action."'
              value={mediationNotes}
              onChange={(e) => setMediationNotes(e.target.value)}
              className="w-full capitalize p-4 border border-gray-300 rounded-2xl bg-white text-sm text-gray-900 leading-relaxed shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        {/* Action Buttons matching Reference Image layout */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-100">
          {stageNumber < 4 && (
            <>
              <button
                type="button"
                onClick={handleResolve}
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-w-[140px]"
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={handleScheduleHearing}
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-w-[180px]"
              >
                Schedule Hearing
              </button>
            </>
          )}

          {stageNumber >= 4 && (
            <>
              <button
                type="button"
                onClick={handleResolve}
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-w-[140px]"
              >
                Resolved
              </button>
              <button
                type="button"
                onClick={handleUnsettled}
                disabled={actionLoading}
                className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors min-w-[140px]"
              >
                Unsettled
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => router.push("/admin/complaints")}
            disabled={actionLoading}
            className="px-8 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold text-sm transition-colors min-w-[120px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
