"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface Datum {
  name: string;
  revenue: number;
  color?: string;
}

const FALLBACK_COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#3B82F6", "#EF4444"];

export function RevenueBarChart({ data }: { data: Datum[] }) {
  if (!data.length) {
    return <div className="py-12 text-center text-sm text-[#9CA3AF]">No revenue data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FA" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} />
        <Tooltip
          cursor={{ fill: "#F8F9FF" }}
          contentStyle={{ borderRadius: 10, border: "1px solid #E8EAEF", fontSize: 12 }}
          formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]}
        />
        <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
