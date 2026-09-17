"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { complaintsApi } from "@/services/api";
import type { Complaint } from "@/lib/types";
import { normalizeStatus } from "@/lib/complaint-utils";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

const ITEMS_PER_PAGE = 15;

export default function ManageComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Filters state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");


  const fetchComplaints = useCallback(() => {
    setLoading(true);
    complaintsApi
      .getAll({
        search: search.trim(),
        status: statusFilter,
        priority: priorityFilter,

      })
      .then(setComplaints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter,]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, priorityFilter,]);

  useEffect(() => {
    complaintsApi
      .getCategories()
      .then(setCategories)
      .catch(console.error);
  }, []);


  const totalPages = Math.max(1, Math.ceil(complaints.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, complaints.length);
  const paginatedComplaints = complaints.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getTargetRoute = (c: Complaint) => {
    const normStatus = normalizeStatus(c.status);
    const stage = c.latestHearingNumber && c.latestHearingNumber > 0 ? c.latestHearingNumber : 1;

    switch (normStatus) {
      case "Pending":
        return `/admin/complaints/${c.id}/pending`;
      case "In Progress":
        return `/admin/complaints/${c.id}/progress/${stage}`;
      case "Scheduled":
        return `/admin/complaints/${c.id}/hearing/${stage}`;
      case "Resolved":
        return `/admin/complaints/${c.id}/resolve/${stage}`;
      case "Unsettled":
        return `/admin/complaints/${c.id}/unsettled`;
      case "Cancelled":
        return `/admin/complaints/${c.id}/cancel`;
      default:
        return `/admin/complaints/${c.id}/progress/${stage}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Complaints Management</h1>
        <p className="mt-1 text-gray-500">Manage all complaints and their proceedings</p>
      </div>
      {/* Filter and Search Bar Card */}
      <div className="admin-search p-3 space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <MaterialIcon name="search" className="text-xl" />
            </div>
            <input
              type="text"
              placeholder="Search Complaint #, Name, Category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Unsettled">Unsettled</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal</option>
            </select>
          </div>
        </div>

      </div>

      {/* Complaints Table Card */}
      <div className="admin-card admin-table-wrap mt-8">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-500 text-sm">
            Loading complaints...
          </div>
        ) : (

          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "10%" }}>Complaint #</th>
                <th style={{ width: "10%" }}>Date Filed</th>
                <th style={{ width: "10%" }}>Complainant</th>
                <th style={{ width: "10%" }}>Respondent</th>
                <th style={{ width: "10%" }}>Category</th>
                <th style={{ width: "10%" }}>Priority</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "10%" }}>Action</th>
              </tr>

            </thead>
            <tbody>
              {paginatedComplaints.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-primary">{c.complaintNo}</td>
                  <td className="text-gray-600">{c.dateFiled}</td>
                  <td className="wrap-cell text-gray-900 font-medium">{c.complainant}</td>
                  <td className="wrap-cell text-gray-700">{c.respondent}</td>
                  <td className="wrap-cell text-gray-600">{c.category}</td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <StatusBadge status={c.status} hearingNumber={c.latestHearingNumber} />
                  </td>
                  <td>
                    <Link href={getTargetRoute(c)} className="btn btn-primary btn-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && complaints.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            <MaterialIcon name="search_off" className="mx-auto mb-2 text-3xl text-gray-400 block" />
            No complaints found matching your criteria.
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && complaints.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-white rounded-b-2xl">
            <p className="text-xs text-gray-500 font-medium">
              Showing <strong className="text-gray-900">{complaints.length > 0 ? startIndex : 0}</strong> to{" "}
              <strong className="text-gray-900">{endIndex}</strong> of{" "}
              <strong className="text-gray-900">{complaints.length}</strong> complaints
            </p>
            <p className="text-xs text-gray-500 font-medium">
              Page <strong className="text-gray-900">{currentPage}</strong> of{" "}
              <strong className="text-gray-900">{totalPages}</strong>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                <MaterialIcon name="chevron_left" className="text-base" />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    totalPages <= 7 ||
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 text-xs font-semibold rounded-lg transition cursor-pointer ${currentPage === page
                          ? "bg-primary text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                          }`}
                      >
                        {page}
                      </button>
                    );
                  }
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <span key={page} className="px-1 text-xs text-gray-400">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1 cursor-pointer"
              >
                Next
                <MaterialIcon name="chevron_right" className="text-base" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

