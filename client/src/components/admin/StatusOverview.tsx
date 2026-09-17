"use client";

interface StatusOverviewProps {
  data: { status: string; count: number }[];
}

export function StatusOverview({ data }: StatusOverviewProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const barColors: Record<string, string> = {
    Pending: "bg-amber-500",
    "In Progress": "bg-primary",
    Scheduled: "bg-purple-500",
    Resolved: "bg-green-500",
    Cancelled: "bg-red-500",
    Unsettled: "bg-red-400",
  };

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.status}>
          <div className="mb-1 flex items-center justify-between text-sm ">
            <span className="font-medium text-gray-700">{item.status}</span>
            <span className="font-semibold text-gray-900">{item.count}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg--100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColors[item.status] ?? "bg-gray-400"}`}
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
