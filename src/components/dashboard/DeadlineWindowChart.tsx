"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";

interface DeadlineWindowChartProps {
  data: Array<{ window: string; count: number }>;
}

const WINDOW_COLORS: Record<string, string> = {
  Overdue: "#ef4444",
  "≤ 7 Days": "#f97316",
  "≤ 30 Days": "#f59e0b",
  "≤ 90 Days": "#3b82f6",
  "> 90 Days": "#10b981",
  "Needs Human Date": "#8b5cf6",
};

export function DeadlineWindowChart({ data }: DeadlineWindowChartProps) {
  const totalDated = data.reduce((sum, item) => sum + item.count, 0);

  if (totalDated === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
        No dated obligations or deadline specifications found in this contract.
      </div>
    );
  }

  return (
    <div className="h-64 w-full outline-none select-none [&_*]:outline-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          accessibilityLayer={false}
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="window"
            interval={0}
            angle={-20}
            textAnchor="end"
            tick={{ fontSize: 10, fill: "#64748b", fontWeight: 500 }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <Tooltip
            cursor={false}
            formatter={(value: unknown) => [`${value} deadlines`, "Count"]}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={WINDOW_COLORS[entry.window] || "#6366f1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
