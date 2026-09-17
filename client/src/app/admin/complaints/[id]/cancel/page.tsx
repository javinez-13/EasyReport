"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { complaintsApi } from "@/services/api";
import type { Complaint } from "@/lib/types";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

export default function CancelledComplaintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complaintsApi
      .getById(id)
      .then(setComplaint)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 font-medium">
        Loading complaint details...
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">Complaint not found.</p>
        <Link href="/admin/complaints" className="mt-4 inline-block text-primary hover:underline text-sm font-medium">
          ← Back to Complaints
        </Link>
      </div>
    );
  }

  const getEvidenceUrl = (item: string) => {
    if (!item) return "";
    if (item.startsWith("http://") || item.startsWith("https://") || item.startsWith("data:")) {
      return item;
    }
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const path = item.startsWith("/") ? item : `/${item}`;
    return `${baseUrl}${path}`;
  };

  const isImageFile = (item: string) => {
    if (!item) return false;
    if (item.startsWith("data:image")) return true;
    const lower = item.toLowerCase();
    return (
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg") ||
      lower.endsWith(".png") ||
      lower.endsWith(".gif") ||
      lower.endsWith(".webp") ||
      lower.endsWith(".svg") ||
      lower.includes("/uploads/")
    );
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <PageHeader
          title={`Cancel Complaint #${complaint.complaintNo}`}
          action={
            <Link
              href="/admin/complaints"
              className="text-sm font-medium text-primary ml-100 hover:text-primary-dark flex items-center gap-1"
            >
              ← Back to Complaints
            </Link>
          }
        />
      </div>

      {/* Complaint Overview Card */}
      <div className="admin-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Complaint Overview
          </h3>
          <StatusBadge status="Cancelled" hearingNumber={complaint.latestHearingNumber} />
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

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-sm space-y-10">
        {/* Complainant Information */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Complainant Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <p className="text-xs text-gray-400 font-medium">Full Name</p>
              <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                {complaint.complainantInfo?.name || complaint.complainant || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Email Address</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {complaint.complainantInfo?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {complaint.complainantInfo?.contact || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Complete Address</p>
              <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                {complaint.complainantInfo?.address || "N/A"}
              </p>
            </div>
            {complaint.complainantInfo?.age ? (
              <div>
                <p className="text-xs text-gray-400 font-medium">Age</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {complaint.complainantInfo.age} yrs old
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Respondent Information */}
        <div className="space-y-6 pt-2 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Respondent Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
            <div>
              <p className="text-xs text-gray-400 font-medium">Full Name</p>
              <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                {complaint.respondentInfo?.name || complaint.respondent || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Email Address</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {complaint.respondentInfo?.email || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Mobile Number</p>
              <p className="text-base font-semibold text-gray-900 mt-1">
                {complaint.respondentInfo?.contact || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium">Complete Address</p>
              <p className="text-base font-semibold text-gray-900 mt-1 capitalize">
                {complaint.respondentInfo?.address || "N/A"}
              </p>
            </div>
            {complaint.respondentInfo?.age ? (
              <div>
                <p className="text-xs text-gray-400 font-medium">Age</p>
                <p className="text-base font-semibold text-gray-900 mt-1">
                  {complaint.respondentInfo.age} yrs old
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Complaint Details */}
        <div className="space-y-6 border-t border-gray-100 pt-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Complaint Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-gray-600 font-semibold mb-2 block">
                Complaint Category
              </label>
              <div className="w-full rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-800 shadow-sm flex items-center min-h-[48px]">
                {complaint.category || "N/A"}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-600 font-semibold mb-2 block">
                Who is involved on this incident?
              </label>
              <div className="w-full rounded-full border border-gray-200 bg-white px-6 py-3.5 text-sm font-medium text-gray-800 shadow-sm flex items-center min-h-[48px]">
                {complaint.respondentInfo?.name || complaint.respondent || "N/A"}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 font-semibold mb-2 block">
              Complaint Description
            </label>
            <div className="w-full rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-800 leading-relaxed shadow-sm min-h-[140px]">
              {complaint.description || "No description provided."}
            </div>
          </div>
        </div>

        {/* Complaint Evidence */}
        <div className="space-y-6 border-t border-gray-100 pt-6">
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Complaint Evidence
          </h2>

          {complaint.evidence && complaint.evidence.length > 0 ? (
            <div className="space-y-4">
              {complaint.evidence.map((item, idx) => {
                const url = getEvidenceUrl(item);
                if (isImageFile(item) || url) {
                  return (
                    <div
                      key={idx}
                      className="rounded-3xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 max-w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Complaint Evidence ${idx + 1}`}
                        className="w-full h-auto max-h-[500px] object-cover rounded-3xl block"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                  );
                }
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4 text-sm border border-gray-200"
                  >
                    <MaterialIcon name="attach_file" className="text-primary text-xl" />
                    <span className="text-gray-700 truncate font-medium">{item}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-400">
              No evidence submitted.
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.push("/admin/complaints")}
            className="px-6 py-2.5 rounded-full border border-gray-300 font-semibold text-gray-700 bg-white hover:bg-gray-50 transition shadow-sm flex items-center gap-2 text-sm cursor-pointer"
          >
            <MaterialIcon name="arrow_back" className="text-lg" />
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}
