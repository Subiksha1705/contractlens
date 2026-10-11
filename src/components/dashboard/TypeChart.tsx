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
} from "recharts";

interface TypeChartProps {
  data: Array<{ type: string; count: number }>;
}

export function TypeChart({ data }: TypeChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs italic">
        No clause types categorized yet.
      </div>
    );
  }

  return (
    <div className="h-64 w-full outline-none select-none">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} />
          <YAxis
            type="category"
            dataKey="type"
            width={90}
            tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(0, 92, 185, 0.04)" }}
            formatter={(value: unknown) => [`${value} items`, "Count"]}
            contentStyle={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="count" fill="#005CB9" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
