"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { complaintsApi } from "@/services/api";
import type { Complaint, MonthlyAnalytics } from "@/lib/types";
import { GlassStatCard } from "@/components/admin/GlassStatCard";
import { StatusOverview } from "@/components/admin/StatusOverview";
import { MonthlyChart } from "@/components/admin/MonthlyChart";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import { MaterialIcon } from "@/components/admin/MaterialIcon";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    scheduled: 0,
    resolved: 0,
    cancelled: 0,
    unsettled: 0,
  });
  const [statusOverview, setStatusOverview] = useState<
    { status: string; count: number }[]
  >([]);
  const [monthlyAnalytics, setMonthlyAnalytics] = useState<MonthlyAnalytics[]>(
    []
  );
  const [recentComplaints, setRecentComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashboard, recent] = await Promise.all([
          complaintsApi.getDashboard(),
          complaintsApi.getRecent(10),
        ]);
        setStats(dashboard.stats);
        setStatusOverview(dashboard.statusOverview);
        setMonthlyAnalytics(dashboard.monthlyAnalytics);
        setRecentComplaints(recent);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-500">Welcome back, Administrator</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-7 py-7">
        <GlassStatCard
          label="Total"
          value={stats.total}
          icon="description"
          variant="blue"
        />
        <GlassStatCard
          label="Pending"
          value={stats.pending}
          icon="pending_actions"
          variant="amber"
        />
        <GlassStatCard
          label="In Progress"
          value={stats.inProgress}
          icon="sync"
          variant="blue"
        />
        <GlassStatCard
          label="Scheduled"
          value={stats.scheduled}
          icon="event"
          variant="purple"
        />
        <GlassStatCard
          label="Resolved"
          value={stats.resolved}
          icon="check_circle"
          variant="green"
        />
        <GlassStatCard
          label="Cancelled"
          value={stats.cancelled}
          icon="cancel"
          variant="red"
        />
        <GlassStatCard
          label="Unsettled"
          value={stats.unsettled}
          icon="balance"
          variant="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 ">
        <div className="admin-card p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 ">
            Case Overview
          </h3>
          <StatusOverview data={statusOverview} />
        </div>

        <div className="admin-card p-5 ">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 ">
            Monthly Complaint Analytics
          </h3>
          <MonthlyChart data={monthlyAnalytics} />
        </div>
      </div>

      <div className="admin-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Complaints
          </h3>
          <Link
            href="/admin/complaints"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-dark"
          >
            View All Complaints
            <MaterialIcon name="arrow_forward" className="text-lg" />
          </Link>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Complaint #</th>
                <th>Complainant</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Date Filed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentComplaints.map((c) => (
                <tr key={c.id}>
                  <td className="font-semibold text-primary">{c.complaintNo}</td>
                  <td className="wrap-cell text-gray-900">{c.complainant}</td>
                  <td className="text-gray-600">{c.category}</td>
                  <td>
                    <PriorityBadge priority={c.priority} />
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-gray-600">{c.dateFiled}</td>
                  <td>
                    <Link
                      href={`/admin/complaints/${c.id}`}
                      className="btn btn-primary btn-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
