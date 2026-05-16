import { SystemState } from "@/lib/mock-data";

interface Props { state: SystemState }

function Card({ label, value, sub, accent }: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-widest text-white/40">{label}</span>
      <span className={`text-2xl font-bold leading-none ${accent ?? "text-white"}`}>{value}</span>
      {sub && <span className="text-xs text-white/40 mt-1">{sub}</span>}
    </div>
  );
}

function BatteryCard({ soc }: { soc: number }) {
  const color = soc > 50 ? "bg-emerald-400" : soc > 20 ? "bg-amber-400" : "bg-red-400";
  const textColor = soc > 50 ? "text-emerald-400" : soc > 20 ? "text-amber-400" : "text-red-400";
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-3">
      <span className="text-[10px] uppercase tracking-widest text-white/40">Battery Level</span>
      <div className="flex items-end gap-3">
        <span className={`text-2xl font-bold leading-none ${textColor}`}>{soc}%</span>
        <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden mb-0.5">
          <div
            className={`h-full rounded-full transition-all ${color}`}
            style={{ width: `${soc}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function MetricCards({ state }: Props) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <BatteryCard soc={state.batterySoC} />
      <Card
        label="Current Export"
        value={`${state.currentExport} kW`}
        sub="to grid"
        accent="text-emerald-400"
      />
      <Card
        label="Today's Earnings"
        value={`$${state.todayEarnings.toFixed(2)}`}
        sub="from grid exports"
        accent="text-emerald-300"
      />
      <Card
        label="Advantage vs Amber"
        value={`$${state.todaySavings.toFixed(2)}`}
        sub="vs SmartShift baseline"
        accent="text-sky-400"
      />
    </div>
  );
}
