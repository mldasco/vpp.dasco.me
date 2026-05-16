import { mockSystemState } from "@/lib/mock-data";

interface StatusRowProps {
  label: string;
  value: string;
  status: "ok" | "error" | "warn" | "neutral";
}

function StatusRow({ label, value, status }: StatusRowProps) {
  const dot: Record<string, string> = {
    ok:      "bg-emerald-400",
    error:   "bg-red-400",
    warn:    "bg-amber-400",
    neutral: "bg-white/30",
  };
  const text: Record<string, string> = {
    ok:      "text-emerald-400",
    error:   "text-red-400",
    warn:    "text-amber-400",
    neutral: "text-white/50",
  };
  return (
    <tr className="border-b border-white/5">
      <td className="px-5 py-3 text-sm text-white/50">{label}</td>
      <td className="px-5 py-3">
        <span className={`flex items-center gap-2 text-sm font-medium ${text[status]}`}>
          <span className={`w-2 h-2 rounded-full ${dot[status]}`} />
          {value}
        </span>
      </td>
    </tr>
  );
}

export default function StatusPage() {
  const s = mockSystemState;
  const updated = new Date(s.lastUpdated).toLocaleString("en-AU");

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">System Status</h1>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/30 font-normal">Item</th>
              <th className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-white/30 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            <StatusRow label="Sigenergy OpenAPI"      value="Connected"       status="ok"      />
            <StatusRow label="Amber Electric API"     value="Connected"       status="ok"      />
            <StatusRow label="Last Telemetry Received" value={updated}        status="neutral" />
            <StatusRow label="Last Command Dispatched" value={`${updated} — FORCED_DISCHARGE`} status="neutral" />
            <StatusRow label="Inverter SoC"           value={`${s.batterySoC}%`} status="ok"  />
            <StatusRow label="Inverter Active Mode"   value={s.mode}          status="ok"      />
            <StatusRow label="Solar Output"           value={`${s.solarOutput} kW`} status="ok" />
            <StatusRow label="House Load"             value={`${s.houseLoad} kW`}  status="ok" />
            <StatusRow label="Grid Export"            value={`${s.currentExport} kW`} status="ok" />
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4 text-sm text-amber-300">
        <strong className="font-semibold">Demo Mode</strong> — All data is sourced from static mock fixtures.
        Connect your Amber API token and Sigenergy credentials in{" "}
        <a href="/config" className="underline hover:text-amber-200">Config</a> to enable live data.
      </div>
    </div>
  );
}
