"use client";

import { mockDailyEarnings, mockIntervalHistory, SystemMode } from "@/lib/mock-data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const modeColor: Record<SystemMode, string> = {
  SELLING:            "text-emerald-400",
  CHARGING:           "text-blue-400",
  HOLDING:            "text-amber-400",
  "SELF-CONSUMPTION": "text-white/50",
};

export default function HistoryPage() {
  const totalEarnings = mockDailyEarnings.reduce((s, d) => s + d.earnings, 0);
  const totalBaseline = mockDailyEarnings.reduce((s, d) => s + d.baseline, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">History</h1>
        <span className="text-sm text-white/40">Last 14 days</span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Total Earnings</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${totalEarnings.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Amber Baseline (est.)</span>
          <p className="text-2xl font-bold text-white/60 mt-1">${totalBaseline.toFixed(2)}</p>
          <p className="text-xs text-white/30 mt-1">SmartShift self-consumption</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Advantage vs Amber</span>
          <p className="text-2xl font-bold text-sky-400 mt-1">
            +${(totalEarnings - totalBaseline).toFixed(2)}
          </p>
          <p className="text-xs text-white/30 mt-1">extra earned over SmartShift</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <span className="text-[10px] uppercase tracking-widest text-white/40">Avg Daily</span>
          <p className="text-2xl font-bold text-white mt-1">
            ${(totalEarnings / mockDailyEarnings.length).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest mb-4">
          Daily Earnings vs Baseline
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={mockDailyEarnings} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
            <Tooltip
              contentStyle={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#e6edf3", fontSize: 12 }}
              formatter={(v, name) => [`$${Number(v).toFixed(2)}`, name === "earnings" ? "Arbitrage Earnings" : "Amber SmartShift Baseline"]}
            />
            <Legend wrapperStyle={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }} />
            <Bar dataKey="earnings" name="earnings" fill="#34d399" radius={[3, 3, 0, 0]} />
            <Bar dataKey="baseline" name="Amber SmartShift Baseline" fill="rgba(255,255,255,0.15)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Interval table */}
      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Interval Log</h2>
          <button className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded transition-colors">
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-white/30 border-b border-white/10">
                <th className="text-left px-5 py-3 font-normal">Timestamp</th>
                <th className="text-left px-5 py-3 font-normal">Mode</th>
                <th className="text-right px-5 py-3 font-normal">Feed-In (¢)</th>
                <th className="text-right px-5 py-3 font-normal">Export (kW)</th>
                <th className="text-right px-5 py-3 font-normal">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {mockIntervalHistory.map((row, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3 text-white/50 font-mono text-xs">{row.timestamp}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium ${modeColor[row.mode]}`}>{row.mode}</span>
                  </td>
                  <td className={`px-5 py-3 text-right ${row.feedInPrice < 0 ? "text-red-400" : "text-white/70"}`}>
                    {row.feedInPrice}
                  </td>
                  <td className="px-5 py-3 text-right text-white/70">{row.exportKw}</td>
                  <td className={`px-5 py-3 text-right font-medium ${row.earnings > 0 ? "text-emerald-400" : "text-white/30"}`}>
                    {row.earnings > 0 ? `$${row.earnings.toFixed(3)}` : "—"}
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
