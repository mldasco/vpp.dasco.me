"use client";

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { PriceInterval } from "@/lib/mock-data";

interface Props {
  intervals: PriceInterval[];
}

// Show every 24th point as an x-axis tick (every 2 hours)
const tickFormatter = (value: string, index: number) =>
  index % 24 === 0 ? value : "";

export default function PriceChart({ intervals }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
          24-Hour Price &amp; Battery
        </h2>
        <div className="flex gap-4 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded" /> Feed-In (¢/kWh)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-sky-400 inline-block rounded" /> Battery SoC %
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={intervals} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis
            dataKey="time"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={tickFormatter}
            interval={0}
          />
          <YAxis
            yAxisId="price"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="soc"
            orientation="right"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            unit="%"
          />
          <Tooltip
            contentStyle={{
              background: "#161b22",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "#e6edf3",
              fontSize: 12,
            }}
            formatter={(value, name) => {
              const v = Number(value);
              if (name === "feedIn") return [`${v}¢/kWh`, "Feed-In Price"];
              if (name === "soc") return [`${v}%`, "Battery SoC"];
              return [`${v}`, String(name)];
            }}
          />
          {/* Highlight exported intervals */}
          {intervals
            .filter((d) => d.exported)
            .map((d) => (
              <ReferenceLine
                key={d.time}
                x={d.time}
                yAxisId="price"
                stroke="rgba(52,211,153,0.12)"
                strokeWidth={6}
              />
            ))}
          <Bar yAxisId="price" dataKey="feedIn" fill="rgba(52,211,153,0.15)" radius={[2, 2, 0, 0]} />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="feedIn"
            stroke="#34d399"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            yAxisId="soc"
            type="monotone"
            dataKey="soc"
            stroke="#38bdf8"
            strokeWidth={1.5}
            dot={false}
            strokeDasharray="4 2"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
