import { SystemState, SystemMode } from "@/lib/mock-data";

const modeStyle: Record<SystemMode, { bg: string; text: string; dot: string }> = {
  SELLING:          { bg: "bg-emerald-500/15", text: "text-emerald-400", dot: "bg-emerald-400" },
  CHARGING:         { bg: "bg-blue-500/15",    text: "text-blue-400",    dot: "bg-blue-400"    },
  HOLDING:          { bg: "bg-amber-500/15",   text: "text-amber-400",   dot: "bg-amber-400"   },
  "SELF-CONSUMPTION": { bg: "bg-white/10",     text: "text-white/60",    dot: "bg-white/40"    },
};

const modeLabel: Record<SystemMode, string> = {
  SELLING:            "Selling to Grid",
  CHARGING:           "Charging Battery",
  HOLDING:            "Holding Charge",
  "SELF-CONSUMPTION": "Self-Consumption",
};

interface Props { state: SystemState }

export default function StatusBar({ state }: Props) {
  const s = modeStyle[state.mode];
  const updated = new Date(state.lastUpdated).toLocaleTimeString("en-AU", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-white/5 px-5 py-4">
      {/* Mode badge */}
      <span className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${s.bg} ${s.text}`}>
        <span className={`w-2 h-2 rounded-full animate-pulse ${s.dot}`} />
        {modeLabel[state.mode]}
      </span>

      <div className="h-5 w-px bg-white/10" />

      {/* Feed-in price */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Feed-In</span>
        <span className="text-lg font-semibold text-emerald-400 leading-none">
          {state.feedInPrice}¢<span className="text-xs font-normal text-white/40">/kWh</span>
        </span>
      </div>

      <div className="h-5 w-px bg-white/10" />

      {/* Buy price */}
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-widest text-white/40">Buy Price</span>
        <span className="text-lg font-semibold text-white/70 leading-none">
          {state.buyPrice}¢<span className="text-xs font-normal text-white/40">/kWh</span>
        </span>
      </div>

      <div className="ml-auto text-xs text-white/30">
        Updated {updated}
      </div>
    </div>
  );
}
