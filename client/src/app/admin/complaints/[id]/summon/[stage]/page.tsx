"use client";

import { use, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { complaintsApi, hearingsApi } from "@/services/api";
import type { Complaint } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

export default function StageSummonFormPage({
  params,
}: {
  params: Promise<{ id: string; stage: string }>;
}) {
  const { id, stage } = use(params);
  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  const [hearingDate, setHearingDate] = useState("2026-08-20");
  const [hearingTime, setHearingTime] = useState("09:00 AM");
  const [venue, setVenue] = useState("Barangay Hall Session Hall");
  const [officer, setOfficer] = useState("Brgy. Captain / Lupon Officer");

  const stageNum = Number(stage) || 2;
  const stageOrdinals: Record<number, string> = {
    1: "FIRST",
    2: "SECOND",
    3: "THIRD",
    4: "FOURTH",
  };
  const stageOrdinal = stageOrdinals[stageNum] || `${stageNum}TH`;

  const initSummon = useCallback(async () => {
    try {
      await hearingsApi.save({
        complaintId: id,
        hearingNumber: stageNum,
        complaintStatus: "In Progress",
        status: "In Progress",
      });
      const data = await complaintsApi.getById(id);
      setComplaint(data);
      if (data.hearingDate) setHearingDate(data.hearingDate);
      if (data.hearingTime) setHearingTime(data.hearingTime);
      if (data.venue) setVenue(data.venue);
    } catch (err) {
      console.error(`Failed to initialize summon ${stageNum} stage`, err);
    } finally {
      setLoading(false);
    }
  }, [id, stageNum]);

  useEffect(() => {
    initSummon();
  }, [initSummon]);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = async () => {
    try {
      await hearingsApi.save({
        complaintId: id,
        hearingNumber: stageNum,
        complaintStatus: "In Progress",
        status: "In Progress",
      });
    } catch (err) {
      console.error(`Failed to preserve In Progress ${stageNum} status`, err);
    }
    router.push("/admin/complaints");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading summon form...
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

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header controls (Hidden on print) */}
      <div className="no-print">
        <PageHeader
          title={`${stageOrdinal} SUMMON FORM — Complaint #${complaint.complaintNo}`}
          action={
            <button
              type="button"
              onClick={handleBack}
              className="text-sm font-medium text-primary hover:text-primary-dark"
            >
              ← Back to Complaints
            </button>
          }
        />
      </div>

      {/* Printable Summon Container Area */}
      <div
        id="summon-print-area"
        className="admin-card p-8 bg-white border border-gray-300 rounded-xl shadow-sm space-y-6 print:border-none print:shadow-none print:p-0 print:m-0"
      >
        {/* Placeholder banner for future Official Summon Form Image */}
        <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-6 text-center">
          <MaterialIcon name="image" className="text-4xl text-primary mb-1 inline-block" />
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            [ Official {stageOrdinal} Hearing Summon Form Image / Template Placeholder ]
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Insert official barangay logo header and seal here
          </p>
        </div>

        {/* Header Title */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-gray-600">
            Republic of the Philippines • City of Manila
          </p>
          <h2 className="text-xl font-extrabold uppercase text-gray-900 tracking-wide">
            OFFICE OF THE LUPON TAGAPAMAYAPA
          </h2>
          <p className="text-sm font-semibold text-gray-700">Barangay EasyReport Jurisdiction</p>
          <div className="my-3 border-b-2 border-gray-900 w-full" />
          <h3 className="text-lg font-extrabold uppercase tracking-wider text-gray-900 mt-2">
            KP FORM NO. 9: {stageOrdinal} SUMMON FOR RESPONDENT
          </h3>
        </div>

        {/* Complaint Information */}
        <div className="grid grid-cols-2 gap-4 text-sm border-t border-b border-gray-200 py-4">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Complaint No:</span>
            <p className="font-bold text-primary text-base">{complaint.complaintNo}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Date Filed:</span>
            <p className="font-medium text-gray-800">{complaint.dateFiled}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Complainant:</span>
            <p className="font-semibold text-gray-900">{complaint.complainantInfo.name || complaint.complainant}</p>
            <p className="text-xs text-gray-600">{complaint.complainantInfo.address}</p>
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase">Respondent:</span>
            <p className="font-semibold text-gray-900">{complaint.respondentInfo.name || complaint.respondent}</p>
            <p className="text-xs text-gray-600">{complaint.respondentInfo.address}</p>
          </div>
        </div>

        {/* Hearing Schedule Details */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
            {stageOrdinal} HEARING SCHEDULE DETAILS
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            <div>
              <label className="block text-xs font-medium text-gray-500">Hearing Date</label>
              <input
                type="date"
                value={hearingDate}
                onChange={(e) => setHearingDate(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Hearing Time</label>
              <input
                type="text"
                value={hearingTime}
                onChange={(e) => setHearingTime(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Venue</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white font-medium text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">Assigned Officer</label>
              <input
                type="text"
                value={officer}
                onChange={(e) => setOfficer(e.target.value)}
                className="w-full mt-1 px-2.5 py-1.5 border border-gray-300 rounded text-sm bg-white font-medium text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Legal Text */}
        <div className="text-sm text-gray-800 leading-relaxed space-y-2">
          <p>
            You are hereby summoned for your <strong>{stageOrdinal} HEARING</strong> to appear in person before the Office of the Lupon Tagapamayapa on{" "}
            <strong>{hearingDate}</strong> at <strong>{hearingTime}</strong> at the <strong>{venue}</strong> for conciliation of Complaint No. {complaint.complaintNo}.
          </p>
          <p className="text-xs text-gray-600 italic">
            FAIL NOT, under penalty of law. Defaulters may be subject to legal proceedings in accordance with Chapter VII, R.A. 7160.
          </p>
        </div>

        {/* Signature Lines */}
        <div className="grid grid-cols-2 gap-8 pt-8 text-center text-sm">
          <div>
            <div className="border-b border-gray-900 mx-auto w-48 mb-1" />
            <p className="font-bold text-gray-900">{officer}</p>
            <p className="text-xs text-gray-500">Punong Barangay / Officer-in-Charge</p>
          </div>
          <div>
            <div className="border-b border-gray-900 mx-auto w-48 mb-1" />
            <p className="font-bold text-gray-900">Lupon Secretary</p>
            <p className="text-xs text-gray-500">Attested By</p>
          </div>
        </div>
      </div>

      {/* Buttons (Hidden on print) */}
      <div className="no-print flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-secondary btn-lg min-w-[120px]"
        >
          <MaterialIcon name="arrow_back" />
          BACK
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="btn btn-primary btn-lg min-w-[140px]"
        >
          <MaterialIcon name="print" />
          PRINT
        </button>
      </div>
    </div>
  );
}
