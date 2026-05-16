import { SystemState } from "@/lib/mock-data";

interface FlowNodeProps {
  label: string;
  value: string;
  color: string;
}

function Node({ label, value, color }: FlowNodeProps) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl border ${color} bg-white/5 w-24 h-16 sm:w-28 sm:h-20 px-2 shrink-0`}>
      <span className="text-[10px] text-white/40 uppercase tracking-widest">{label}</span>
      <span className="text-base sm:text-lg font-bold text-white mt-0.5">{value}</span>
    </div>
  );
}

function Arrow({ label, active, vertical }: { label: string; active: boolean; vertical?: boolean }) {
  if (vertical) {
    return (
      <div className={`flex flex-col items-center gap-0.5 h-8 justify-center ${active ? "opacity-100" : "opacity-20"}`}>
        <span className="text-[10px] text-white/30">{label}</span>
        <span className={`text-sm ${active ? "text-emerald-400" : "text-white/30"}`}>▼</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center gap-1 w-12 shrink-0">
      <span className="text-[10px] text-white/30">{label}</span>
      <div className={`flex items-center gap-0.5 ${active ? "opacity-100" : "opacity-20"}`}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block w-1.5 h-0.5 rounded-full ${active ? "bg-emerald-400" : "bg-white/30"}`}
            style={{ opacity: active ? 1 - i * 0.25 : 1 }}
          />
        ))}
        <span className={`text-xs ${active ? "text-emerald-400" : "text-white/30"}`}>▶</span>
      </div>
    </div>
  );
}

interface Props { state: SystemState }

export default function EnergyFlow({ state }: Props) {
  const exporting = state.currentExport > 0;
  const charging = state.mode === "CHARGING";

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-sm font-medium text-white/50 mb-5 uppercase tracking-widest">Energy Flow</h2>

      {/* Desktop: horizontal row */}
      <div className="hidden sm:flex items-center justify-center gap-1 flex-wrap gap-y-4">
        <Node label="Solar" value={`${state.solarOutput} kW`} color="border-amber-500/40" />
        <Arrow label="generates" active={state.solarOutput > 0} />
        <Node label="Home" value={`${state.houseLoad} kW`} color="border-white/20" />
        <Arrow label={charging ? "charges" : "powers"} active={true} />
        <Node label="Battery" value={`${state.batterySoC}%`} color="border-emerald-500/40" />
        <Arrow label={exporting ? "exports" : "holds"} active={exporting} />
        <Node label="Grid" value={exporting ? `+${state.currentExport} kW` : "0 kW"} color={exporting ? "border-emerald-500/60" : "border-white/10"} />
      </div>

      {/* Mobile: 2-column grid layout */}
      <div className="sm:hidden grid grid-cols-2 gap-x-6 gap-y-1 items-center justify-items-center">
        <Node label="Solar" value={`${state.solarOutput} kW`} color="border-amber-500/40" />
        <Node label="Home" value={`${state.houseLoad} kW`} color="border-white/20" />
        <Arrow label="generates → powers battery" active={state.solarOutput > 0} vertical />
        <Arrow label={charging ? "charges" : "powers house"} active={true} vertical />
        <Node label="Battery" value={`${state.batterySoC}%`} color="border-emerald-500/40" />
        <Node label="Grid" value={exporting ? `+${state.currentExport} kW` : "0 kW"} color={exporting ? "border-emerald-500/60" : "border-white/10"} />
      </div>
    </div>
  );
}
