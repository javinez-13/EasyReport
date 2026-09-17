"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MonthlyAnalytics } from "@/lib/types";

export function MonthlyChart({ data }: { data: MonthlyAnalytics[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="complaints"
          name="Complaints"
          stroke="#0066ff"
          strokeWidth={2}
          dot={{ fill: "#0066ff", r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="pending"
          name="Pending"
          stroke="#f59e0b"
          strokeWidth={2}
          dot={{ fill: "#f59e0b", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="inProgress"
          name="In Progress"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: "#3b82f6", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="scheduled"
          name="Scheduled"
          stroke="#a855f7"
          strokeWidth={2}
          dot={{ fill: "#a855f7", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="resolved"
          name="Resolved"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: "#22c55e", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="cancelled"
          name="Cancelled"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ fill: "#ef4444", r: 3 }}
        />
        <Line
          type="monotone"
          dataKey="unsettled"
          name="Unsettled"
          stroke="#dc2626"
          strokeWidth={2}
          dot={{ fill: "#dc2626", r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
