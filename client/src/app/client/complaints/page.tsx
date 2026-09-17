"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/services/api";
import type { Complaint } from "@/lib/types";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { COMPLAINT_STATUSES, getClientStatusLabel } from "@/lib/complaint-utils";
import { ClientPageShell } from "../components/ClientPageShell";
import { FeeConfirmModal } from "../components/FeeConfirmModal";
import { getStatusDotClass } from "../components/statusStyles";

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ComplaintsPage() {
  const router = useRouter();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [feeModalOpen, setFeeModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await clientApi.getComplaints({
          search: debouncedSearch || undefined,
          status: status === "All" ? undefined : status,
        });
        setComplaints(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Unable to load complaints.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [debouncedSearch, status]);

  const emptyMessage = useMemo(
    () =>
      debouncedSearch || status !== "All"
        ? "No complaints matched your search or filter."
        : "You have not submitted any complaints yet.",
    [debouncedSearch, status]
  );

  return (
    <ClientPageShell
      title="My Complaints"
      subtitle="Track and manage your submitted complaints"
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative block flex-1">
          <MaterialIcon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-[#2563EB]"
          />
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#2563EB] sm:w-40"
        >
          <option value="All">All</option>
          {COMPLAINT_STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-slate-600">Loading complaints...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <p className="text-red-600">{error}</p>
        </div>
      ) : complaints.length ? (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <article
              key={complaint.id}
              className="rounded-2xl bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.06)]"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold text-slate-900">{complaint.complaintNo}</h2>
                <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  {getClientStatusLabel(complaint.status)}
                  <span className={`h-2.5 w-2.5 rounded-full ${getStatusDotClass(complaint.status)}`} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <InfoRow label="Category" value={complaint.category} />
                <InfoRow
                  label="Description"
                  value={complaint.description || "No description provided."}
                  clamp
                />
                <InfoRow label="Date" value={formatDate(complaint.dateFiled)} />
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => router.push(`/client/complaints/${complaint.id}`)}
                  className="text-sm font-semibold text-slate-700 hover:text-[#2563EB]"
                >
                  View Details
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-slate-900">{emptyMessage}</p>
          <p className="mt-2 text-sm text-slate-500">
            Submitted complaints sync with the admin complaint workflow automatically.
          </p>
          <button
            type="button"
            onClick={() => setFeeModalOpen(true)}
            className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white"
          >
            File a Complaint
          </button>
        </div>
      )}

      <FeeConfirmModal
        open={feeModalOpen}
        onClose={() => setFeeModalOpen(false)}
        onProceed={() => {
          setFeeModalOpen(false);
          router.push("/client/complaints/new");
        }}
      />
    </ClientPageShell>
  );
}

function InfoRow({
  label,
  value,
  clamp = false,
}: {
  label: string;
  value: string;
  clamp?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {label}:
      </span>
      <p className={`pt-0.5 text-sm text-slate-700 ${clamp ? "line-clamp-2" : ""}`}>{value}</p>
    </div>
  );
}
