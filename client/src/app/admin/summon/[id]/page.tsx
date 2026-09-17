"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { complaintsApi, summonsApi } from "@/services/api";
import type { Complaint } from "@/lib/types";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { PageHeader } from "@/components/admin/PageHeader";

export default function GenerateSummonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [summonNo] = useState(`S-${String(Math.floor(Math.random() * 900) + 100).padStart(5, "0")}`);
  const [hearingDate, setHearingDate] = useState("2026-07-15");
  const [hearingTime, setHearingTime] = useState("9:00 AM");
  const [venue, setVenue] = useState("Barangay Hall Conference Room");
  const [generated, setGenerated] = useState(false);

  useEffect(() => {
    complaintsApi
      .getById(id)
      .then(setComplaint)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading complaint...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Complaint not found.</p>
        <Link href="/admin/complaints" className="mt-4 text-primary hover:underline">
          Back to complaints
        </Link>
      </div>
    );
  }

  const handleGenerate = async () => {
    setSaving(true);
    try {
      await summonsApi.create({
        complaintId: id,
        hearingDate,
        hearingTime,
        venue,
        officer: "Brgy. Captain Reyes",
        summonNo,
      });
      setGenerated(true);
    } catch (err) {
      console.error(err);
      alert("Failed to generate summon.");
    } finally {
      setSaving(false);
    }
  };

  const handleNotify = async () => {
    try {
      await summonsApi.notify(id);
      alert("Notification sent to respondent.");
    } catch (err) {
      console.error(err);
      alert("Failed to send notification.");
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Generate Summon" />

      {generated && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700">
            <MaterialIcon name="check_circle" />
            <p className="font-medium">
              Summon generated successfully. Status changed to{" "}
              <strong>Scheduled</strong>.
            </p>
          </div>
        </div>
      )}

      <div
        id="summon-form"
        className="mx-auto max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm print:border-none print:shadow-none"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <MaterialIcon name="account_balance" className="text-3xl text-primary" />
          </div>
          <p className="text-sm text-gray-500">Republic of the Philippines</p>
          <h2 className="text-xl font-bold text-gray-900">Barangay EasyReport</h2>
          <p className="mt-1 text-sm text-gray-600">Barangay San Jose</p>
          <hr className="my-5 border-gray-200" />
          <h3 className="text-lg font-bold uppercase tracking-wide text-gray-900">
            Summon to Appear
          </h3>
        </div>

        <div className="space-y-4">
          <FormField label="Summon No." value={summonNo} readOnly />
          <FormField label="Complaint No." value={complaint.complaintNo} readOnly />
          <FormField label="Complainant" value={complaint.complainant} readOnly />
          <FormField label="Respondent" value={complaint.respondent} readOnly />

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Hearing Date
            </label>
            <input
              type="date"
              value={hearingDate}
              onChange={(e) => setHearingDate(e.target.value)}
              disabled={generated}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Time
            </label>
            <input
              type="text"
              value={hearingTime}
              onChange={(e) => setHearingTime(e.target.value)}
              disabled={generated}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-500">
              Venue
            </label>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              disabled={generated}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
            />
          </div>
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-600">
          You are hereby summoned to appear before the Lupon Tagapamayapa on the
          date, time, and venue specified above in connection with Complaint No.{" "}
          {complaint.complaintNo}. Failure to appear may result in further
          action as provided by law.
        </p>
      </div>

      <div className="no-print flex flex-wrap justify-center gap-3">
        {!generated ? (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={saving}
            className="btn btn-primary btn-lg"
          >
            <MaterialIcon name="description" className="text-lg" />
            {saving ? "Generating..." : "Generate Summon"}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => window.print()}
              className="btn btn-secondary btn-lg"
            >
              <MaterialIcon name="print" className="text-lg" />
              Print Summon
            </button>
            <button
              type="button"
              onClick={handleNotify}
              className="btn btn-secondary btn-lg"
            >
              <MaterialIcon name="send" className="text-lg" />
              Send Notification
            </button>
            <button
              type="button"
              onClick={() => router.push("/admin/complaints")}
              className="btn btn-primary btn-lg"
            >
              <MaterialIcon name="arrow_forward" className="text-lg" />
              Back to Complaints
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  readOnly,
}: {
  label: string;
  value: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-500">
        {label}
      </label>
      <input
        type="text"
        value={value}
        readOnly={readOnly}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm read-only:bg-gray-50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
