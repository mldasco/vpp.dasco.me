import { ActivityEntry, SystemMode } from "@/lib/mock-data";

const modeColor: Record<SystemMode, string> = {
  SELLING:            "text-emerald-400 bg-emerald-500/10",
  CHARGING:           "text-blue-400 bg-blue-500/10",
  HOLDING:            "text-amber-400 bg-amber-500/10",
  "SELF-CONSUMPTION": "text-white/50 bg-white/5",
};

interface Props { entries: ActivityEntry[] }

export default function ActivityFeed({ entries }: Props) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 flex flex-col gap-4">
      <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">Recent Activity</h2>
      <ul className="space-y-2">
        {entries.map((e, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className="text-white/30 w-10 shrink-0 pt-0.5">{e.time}</span>
            <div className="flex-1">
              <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${modeColor[e.action]}`}>
                {e.action}
              </span>
              <div className="text-white/40 text-xs mt-0.5">
                {e.price < 0
                  ? `${e.price}¢/kWh — curtailed`
                  : e.export > 0
                  ? `${e.price}¢/kWh · ${e.export} kW export`
                  : `${e.price}¢/kWh`}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
