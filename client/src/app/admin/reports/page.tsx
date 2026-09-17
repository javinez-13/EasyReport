"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { GlassStatCard } from "@/components/admin/GlassStatCard";
import { MaterialIcon } from "@/components/admin/MaterialIcon";
import { PriorityBadge } from "@/components/admin/PriorityBadge";
import {
  CategoryPieChart,
  StatusPieChart,
  MonthlyBarChart,
  PriorityBarChart,
  HearingStageBarChart,
  MediatorWorkloadBarChart,
} from "@/components/admin/ReportCharts";
import {
  reportsApi,
  ReportsData,
  ReportFilters,
} from "@/services/api";

type DatePreset = "all" | "today" | "30days" | "month" | "year" | "custom";

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters state
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // Handle date preset change
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().slice(0, 10);

    if (preset === "all") {
      setStartDate("");
      setEndDate("");
    } else if (preset === "today") {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "30days") {
      const past = new Date(today);
      past.setDate(today.getDate() - 30);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
    } else if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
    } else if (preset === "year") {
      const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
      setStartDate(formatDate(firstDayOfYear));
      setEndDate(formatDate(today));
    }
  };

  // Construct active filters
  const activeFilters = useMemo<ReportFilters>(() => {
    const filters: ReportFilters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (selectedStatus && selectedStatus !== "All") filters.status = selectedStatus;
    if (selectedPriority && selectedPriority !== "All") filters.priority = selectedPriority;
    if (selectedCategory && selectedCategory !== "All") filters.category = selectedCategory;
    if (search.trim()) filters.search = search.trim();
    if (selectedYear && selectedYear !== "all") filters.year = Number(selectedYear);
    if (selectedMonth && selectedMonth !== "all") filters.month = Number(selectedMonth);
    return filters;
  }, [
    startDate,
    endDate,
    selectedStatus,
    selectedPriority,
    selectedCategory,
    search,
    selectedYear,
    selectedMonth,
  ]);

  // Fetch report data
  const loadReports = useCallback(async (isSilentRefresh = false) => {
    try {
      if (isSilentRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const res = await reportsApi.getAll(activeFilters);
      setData(res);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load reports data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilters]);

  // Trigger load on filter changes
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Reset all filters
  const handleResetFilters = () => {
    setDatePreset("all");
    setStartDate("");
    setEndDate("");
    setSelectedYear("all");
    setSelectedMonth("all");
    setSelectedStatus("All");
    setSelectedPriority("All");
    setSelectedCategory("All");
    setSearch("");
  };

  // Export Excel / CSV
  const allComplaints = data?.complaints || [];
  const handleExportCSV = () => {
    if (!data || allComplaints.length === 0) {
      alert("No complaint records available to export with the current filters.");
      return;
    }

    const headers = [
      "Complaint No",
      "Date Filed",
      "Complainant",
      "Respondent",
      "Category",
      "Priority",
      "Status",
      "Hearings Conducted",
      "Description",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = allComplaints.map((c) => [
      escapeCsv(c.complaintNo),
      escapeCsv(c.dateFiled || ""),
      escapeCsv(c.complainant),
      escapeCsv(c.respondent),
      escapeCsv(c.category || "Uncategorized"),
      escapeCsv(c.priority),
      escapeCsv(c.status),
      escapeCsv(c.latestHearingNumber || 0),
      escapeCsv(c.description || ""),
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Barangay_Reports_Complaints_${dateStamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Print Report / PDF
  const handlePrint = () => {
    window.print();
  };

  // Available categories for dropdown
  const categoryOptions = useMemo(() => {
    if (!data?.categoryReports) return [];
    return data.categoryReports.map((c) => c.category);
  }, [data]);

  // Status data for StatusPieChart
  const statusPieData = useMemo(() => {
    if (!data?.statusCounts) return [];
    return Object.entries(data.statusCounts).map(([status, count]) => ({
      status,
      count,
    }));
  }, [data]);

  // Check if any filter is active
  const isFiltered =
    datePreset !== "all" ||
    !!startDate ||
    !!endDate ||
    selectedYear !== "all" ||
    selectedMonth !== "all" ||
    selectedStatus !== "All" ||
    selectedPriority !== "All" ||
    selectedCategory !== "All" ||
    !!search.trim();

  return (
    <div className="space-y-6">
      {/* 1. Top Header & Action Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Real-time dispute resolution metrics and KP mediation proceedings
            {lastUpdated && (
              <span className="ml-2 text-xs text-gray-400">
                · Last synced: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Working Action Buttons */}
        <div className="no-print flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadReports(true)}
            disabled={refreshing || loading}
            title="Re-fetch latest data from database"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-60"
          >
            <MaterialIcon
              name="refresh"
              className={`text-lg text-primary ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={loading || allComplaints.length === 0}
            title="Download CSV spreadsheet of current complaints"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 disabled:opacity-60"
          >
            <MaterialIcon name="table_chart" className="text-lg text-emerald-600" />
            Export Excel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            title="Print or export as PDF"
            className="btn btn-primary flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-sm transition active:scale-95"
          >
            <MaterialIcon name="print" className="text-lg" />
            Print Report / PDF
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MaterialIcon name="error" className="text-xl text-red-600" />
              <p className="text-sm font-semibold">{error}</p>
            </div>
            <button
              onClick={() => loadReports()}
              className="text-xs font-semibold text-red-700 underline hover:text-red-900"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* 2. Unified Filter Bar & Query Controls */}
      <div className="no-print admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <MaterialIcon name="tune" className="text-lg text-primary" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
              Filter & Query Controls
            </h2>
            {isFiltered && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                Active Filter
              </span>
            )}
          </div>
          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <MaterialIcon name="restart_alt" className="text-sm" />
              Reset All Filters
            </button>
          )}
        </div>

        {/* Date Presets Selector */}
        <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs font-medium text-gray-600">
          <span className="mr-1 text-gray-400">Date Range:</span>
          {(
            [
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "30days", label: "Last 30 Days" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
              { id: "custom", label: "Custom Range" },
            ] as const
          ).map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleDatePresetChange(preset.id)}
              className={`rounded-lg px-3 py-1.5 transition-all ${datePreset === preset.id
                ? "bg-primary text-white font-semibold shadow-xs"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {/* Custom Date Pickers */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setDatePreset("custom");
                setStartDate(e.target.value);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-primary focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setDatePreset("custom");
                setEndDate(e.target.value);
              }}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-primary focus:bg-white focus:outline-none"
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-primary focus:bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Resolved">Resolved</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Unsettled">Unsettled</option>
            </select>
          </div>

          {/* Priority Dropdown */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-primary focus:bg-white focus:outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High / Urgent</option>
              <option value="Medium">Medium</option>
              <option value="Normal">Normal / Low</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2 text-xs text-gray-800 focus:border-primary focus:bg-white focus:outline-none"
            >
              <option value="All">All Categories</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">Search Records</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Case #, person, keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2 pr-3 pl-8 text-xs text-gray-800 placeholder-gray-400 focus:border-primary focus:bg-white focus:outline-none"
              />
              <MaterialIcon
                name="search"
                className="absolute top-2.5 left-2 text-sm text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Top 4 Glass Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GlassStatCard
          label="Total Complaints"
          value={loading ? "..." : (data?.stats.totalComplaints ?? 0)}
          icon="assignment"
          variant="blue"
        />
        <GlassStatCard
          label="Resolved Rate"
          value={loading ? "..." : `${data?.stats.resolvedRate ?? 0}%`}
          icon="trending_up"
          variant="green"
        />
        <GlassStatCard
          label="Avg Resolution Time"
          value={loading ? "..." : `${data?.stats.avgResolutionTime ?? 0} days`}
          icon="schedule"
          variant="purple"
        />
        <GlassStatCard
          label="Active Cases"
          value={loading ? "..." : (data?.stats.activeCases ?? 0)}
          icon="folder_open"
          variant="amber"
        />
      </div>

      {/* 4. Visual Analytics Grid (4 Charts in Balanced 2x2) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Complaints Activity */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Monthly Complaints Activity</h3>
              <p className="text-xs text-gray-500">Complaints filed by status over the last 6 months</p>
            </div>
            <MaterialIcon name="bar_chart" className="text-xl text-primary" />
          </div>
          <MonthlyBarChart data={data?.monthlyAnalytics || []} />
        </div>

        {/* Complaints by Category */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Complaints by Category</h3>
              <p className="text-xs text-gray-500">Dispute category distribution in database</p>
            </div>
            <MaterialIcon name="pie_chart" className="text-xl text-emerald-600" />
          </div>
          <CategoryPieChart data={data?.categoryReports || []} />
        </div>

        {/* Status Distribution */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Status Distribution</h3>
              <p className="text-xs text-gray-500">Breakdown of active and resolved case statuses</p>
            </div>
            <MaterialIcon name="donut_large" className="text-xl text-purple-600" />
          </div>
          <StatusPieChart data={statusPieData} />
        </div>

        {/* Cases by Priority Level */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Cases by Priority Level</h3>
              <p className="text-xs text-gray-500">Distribution across urgency and severity levels</p>
            </div>
            <MaterialIcon name="flag" className="text-xl text-rose-600" />
          </div>
          <PriorityBarChart data={data?.priorityReports || []} />
        </div>
      </div>

      {/* 5. Katarungang Pambarangay (KP) Mediation Analytics */}
      <div className="admin-card rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/40 via-white to-indigo-50/20 p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-blue-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
                <MaterialIcon name="balance" className="text-base" />
              </span>
              <h3 className="text-base font-bold text-gray-900">
                Katarungang Pambarangay (KP) Mediation Analytics
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-gray-500">
              Hearing stage progression and mediator caseloads from actual hearing records
            </p>
          </div>

          {/* KPI Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 text-xs shadow-xs">
              <span className="text-gray-500">Total Hearings: </span>
              <span className="font-bold text-blue-700">
                {data?.hearingAnalytics?.totalHearings ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-purple-200 bg-white px-3 py-1.5 text-xs shadow-xs">
              <span className="text-gray-500">Cases with Hearings: </span>
              <span className="font-bold text-purple-700">
                {data?.hearingAnalytics?.complaintsWithHearings ?? 0}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white px-3 py-1.5 text-xs shadow-xs">
              <span className="text-gray-500">Avg Hearings/Case: </span>
              <span className="font-bold text-emerald-700">
                {data?.hearingAnalytics?.avgHearingsPerCase ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              Proceedings Progression (Stage 1 to 4)
            </h4>
            <HearingStageBarChart data={data?.hearingAnalytics?.hearingsByStage} />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-600">
              Mediator / Hearing Officer Workload
            </h4>
            <MediatorWorkloadBarChart data={data?.hearingAnalytics?.hearingsByMediator} />
          </div>
        </div>
      </div>

      {/* 6. Summary Tables: Category Performance & Priority Analytics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Category Performance Matrix (2 cols) */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Category Resolution Performance</h3>
              <p className="text-xs text-gray-500">Settlement success rate and metrics per category</p>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {data?.categoryPerformance?.length || 0} Categories
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-600">
                  <th className="py-2.5 px-3">Complaint Category</th>
                  <th className="py-2.5 px-3 text-center">Total</th>
                  <th className="py-2.5 px-3 text-center">Resolved</th>
                  <th className="py-2.5 px-3 text-center">In Progress</th>
                  <th className="py-2.5 px-3 text-center">Unsettled</th>
                  <th className="py-2.5 px-3 text-right">Settlement Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {(data?.categoryPerformance || []).map((cp) => (
                  <tr key={cp.category} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-900">{cp.category}</td>
                    <td className="py-2.5 px-3 text-center font-semibold text-gray-700">{cp.total}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-emerald-600">{cp.resolved}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-blue-600">{cp.inProgress}</td>
                    <td className="py-2.5 px-3 text-center font-medium text-rose-600">{cp.unsettled}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 font-bold ${cp.rate >= 75
                          ? "bg-emerald-100 text-emerald-800"
                          : cp.rate >= 40
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {cp.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
                {(data?.categoryPerformance || []).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-gray-400">
                      No category metrics matching current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Priority Analytics Table (1 col) */}
        <div className="admin-card rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Priority Breakdown</h3>
              <p className="text-xs text-gray-500">Case share by severity</p>
            </div>
            <MaterialIcon name="insights" className="text-xl text-primary" />
          </div>

          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-600">
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3 text-center">Cases</th>
                <th className="py-2.5 px-3 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {(data?.priorityReports || []).map((p) => {
                const total = data?.stats.totalComplaints || 1;
                const share = total > 0 ? Math.round((p.cases / total) * 100) : 0;
                return (
                  <tr key={p.priority} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3 px-3">
                      <PriorityBadge priority={p.priority} />
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900">{p.cases}</td>
                    <td className="py-3 px-3 text-right font-medium text-gray-500">{share}%</td>
                  </tr>
                );
              })}
              {(data?.priorityReports || []).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-xs text-gray-400">
                    No priority data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
