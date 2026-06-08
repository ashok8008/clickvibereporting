"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Point {
  date: string;
  siteId: string;
  siteName: string;
  color: string;
  conversions: number;
}

export function ConversionLineChart({ data }: { data: Point[] }) {
  // Pivot into { date, [siteName]: conversions }
  const dates = Array.from(new Set(data.map((d) => d.date))).sort();
  const sites = new Map<string, string>();
  data.forEach((d) => sites.set(d.siteName, d.color));

  const rows = dates.map((date) => {
    const row: Record<string, string | number> = { date };
    sites.forEach((_, name) => {
      const match = data.find((d) => d.date === date && d.siteName === name);
      row[name] = match ? match.conversions : 0;
    });
    return row;
  });

  if (!rows.length) {
    return <div className="py-12 text-center text-sm text-[#9CA3AF]">No conversion data yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={rows} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F0F2FA" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} />
        <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: 10, border: "1px solid #E8EAEF", fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {[...sites.entries()].map(([name, color]) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
