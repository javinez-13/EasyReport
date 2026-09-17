"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { CategoryReport, MonthlyAnalytics } from "@/lib/types";

const PIE_COLORS = ["#0575FF", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"];

export function CategoryPieChart({ data }: { data: { category: string; total: number }[] }) {
  const filtered = (data || []).filter((d) => d.total > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-sm text-gray-400">
        <span className="material-icons mb-1 text-3xl text-gray-300">pie_chart</span>
        No category data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          dataKey="total"
          nameKey="category"
          paddingAngle={2}
          labelLine={false}
        >
          {filtered.map((_, index) => (
            <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
          formatter={(val: any) => [`${val} complaints`, "Cases"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS: Record<string, string> = {
  "In Progress": "#3b82f6",
  Resolved: "#22c55e",
  Scheduled: "#a855f7",
  Unsettled: "#dc2626",
  Pending: "#f59e0b",
  Cancelled: "#94a3b8",
};

export function StatusPieChart({
  data,
}: {
  data: { status: string; count: number }[];
}) {
  const filtered = (data || []).filter((d) => d.count > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-sm text-gray-400">
        <span className="material-icons mb-1 text-3xl text-gray-300">donut_large</span>
        No status data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={filtered}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={95}
          paddingAngle={3}
          dataKey="count"
          nameKey="status"
        >
          {filtered.map((entry) => (
            <Cell
              key={entry.status}
              fill={STATUS_COLORS[entry.status] || "#6b7280"}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
          formatter={(val: any) => [`${val} complaints`, "Cases"]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  High: "#ef4444",
  Critical: "#b91c1c",
  Medium: "#f97316",
  Normal: "#3b82f6",
  Low: "#60a5fa",
};

export function PriorityBarChart({
  data,
}: {
  data: { priority: string; cases: number }[];
}) {
  const filtered = (data || []).filter((d) => d.cases > 0);

  if (filtered.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-sm text-gray-400">
        <span className="material-icons mb-1 text-3xl text-gray-300">bar_chart</span>
        No priority data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={filtered} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="priority"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
          }}
          formatter={(val: any) => [`${val} complaints`, "Cases"]}
        />
        <Bar dataKey="cases" name="Cases" radius={[6, 6, 0, 0]}>
          {filtered.map((entry) => (
            <Cell
              key={entry.priority}
              fill={PRIORITY_COLORS[entry.priority] || "#3b82f6"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MonthlyBarChart({ data }: { data: MonthlyAnalytics[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        />
        <Legend />
        <Bar dataKey="pending" name="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        <Bar dataKey="inProgress" name="In Progress" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="scheduled" name="Scheduled" fill="#a855f7" radius={[4, 4, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
        <Bar dataKey="unsettled" name="Unsettled" fill="#dc2626" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ResolutionLineChart({ data }: { data: MonthlyAnalytics[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
          }}
        />
        <Legend />
        <Bar dataKey="complaints" name="Total Filed" fill="#0066ff" radius={[6, 6, 0, 0]} />
        <Bar dataKey="resolved" name="Resolved" fill="#22c55e" radius={[6, 6, 0, 0]} />
        <Bar dataKey="unsettled" name="Unsettled" fill="#dc2626" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
const STAGE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#dc2626"];

export function HearingStageBarChart({
  data,
}: {
  data?: { stageNumber: number; stage: string; count: number }[];
}) {
  const filteredData = (data || []).filter((d) => d.count > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-sm text-gray-400">
        <span className="material-icons text-3xl mb-1 text-gray-300">event_repeat</span>
        No hearing stage data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={filteredData}
        margin={{ top: 10, right: 15, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            fontSize: "12px",
          }}
          formatter={(val: any) => [`${val} hearing session(s)`, "Proceedings"]}
        />
        <Bar dataKey="count" name="Hearings Conducted" radius={[4, 4, 0, 0]}>
          {filteredData.map((_, idx) => (
            <Cell
              key={`stage-${idx}`}
              fill={STAGE_COLORS[idx % STAGE_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MediatorWorkloadBarChart({
  data,
}: {
  data?: { mediator: string; count: number }[];
}) {
  const filteredData = (data || []).filter((d) => d.count > 0);

  if (filteredData.length === 0) {
    return (
      <div className="flex h-[280px] flex-col items-center justify-center text-sm text-gray-400">
        <span className="material-icons text-3xl mb-1 text-gray-300">gavel</span>
        No mediator workload data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        layout="vertical"
        data={filteredData}
        margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="mediator"
          width={130}
          tick={{ fontSize: 11, fill: "#334155" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
            fontSize: "12px",
          }}
          formatter={(val: any) => [`${val} hearings handled`, "Workload"]}
        />
        <Bar dataKey="count" name="Hearings" fill="#0066ff" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

