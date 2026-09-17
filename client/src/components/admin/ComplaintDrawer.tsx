"use client";

import Link from "next/link";
import type { Complaint } from "@/lib/types";
import { MaterialIcon } from "./MaterialIcon";
import { PriorityBadge } from "./PriorityBadge";
import { StatusBadge } from "./StatusBadge";

interface ComplaintDrawerProps {
  complaint: Complaint | null;
  open: boolean;
  onClose: () => void;
  onReject?: () => void;
}

export function ComplaintDrawer({
  complaint,
  open,
  onClose,
  onReject,
}: ComplaintDrawerProps) {
  if (!open || !complaint) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 overlay-enter"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-white shadow-2xl drawer-enter">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Complaint Information
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <MaterialIcon name="close" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="mb-4 flex gap-2">
            <StatusBadge status={complaint.status} />
            <PriorityBadge priority={complaint.priority} />
          </div>

          <dl className="space-y-4">
            <InfoRow label="Complaint No." value={complaint.complaintNo} />
            <InfoRow label="Date Filed" value={complaint.dateFiled} />
            <InfoRow label="Complainant" value={complaint.complainant} />
            <InfoRow label="Respondent" value={complaint.respondent} />
            <InfoRow label="Category" value={complaint.category} />
            <InfoRow label="Priority" value={complaint.priority} />
            <div>
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {complaint.description}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Evidence</dt>
              <dd className="mt-2 space-y-2">
                {complaint.evidence.map((file) => (
                  <div
                    key={file}
                    className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                  >
                    <MaterialIcon
                      name="attach_file"
                      className="text-lg text-primary"
                    />
                    {file}
                  </div>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        {complaint.status === "Pending" && (
          <div className="flex gap-3 border-t border-gray-100 px-6 py-4">
            <Link
              href={`/admin/summon/${complaint.id}`}
              className="btn btn-success btn-md btn-block"
            >
              <MaterialIcon name="check_circle" className="text-lg" />
              Approve Complaint
            </Link>
            <button
              type="button"
              onClick={onReject}
              className="btn btn-danger btn-md btn-block"
            >
              <MaterialIcon name="cancel" className="text-lg" />
              Cancel Complaint
            </button>
          </div>
        )}

        {complaint.status === "In Progress" && (
          <div className="border-t border-gray-100 px-6 py-4">
            <Link
              href={`/admin/summon/${complaint.id}`}
              className="btn btn-primary btn-md w-full"
            >
              <MaterialIcon name="description" className="text-lg" />
              Generate Summon
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
