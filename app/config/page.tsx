"use client";

import { useState } from "react";
import { mockConfig } from "@/lib/mock-data";

export default function ConfigPage() {
  const [config, setConfig] = useState(mockConfig);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-semibold">Configuration</h1>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Minimum Export Price */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white">
              Minimum Export Price (¢/kWh)
            </label>
            <p className="text-xs text-white/40 mt-1">
              The system will only begin selling to the grid when the live feed-in price exceeds
              this value. Set higher to be more selective; set lower to export more frequently.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              step={1}
              value={config.minExportPrice}
              onChange={(e) => setConfig({ ...config, minExportPrice: Number(e.target.value) })}
              className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-sm text-white/40">¢/kWh</span>
            <span className="ml-auto text-xs text-white/30">
              ≈ ${(config.minExportPrice / 100).toFixed(2)}/kWh
            </span>
          </div>
          {config.minExportPrice < 80 && (
            <p className="text-xs text-amber-400">
              ⚠ Low threshold — ensure this exceeds your off-peak buy price plus round-trip losses.
            </p>
          )}
        </div>

        {/* Minimum Battery Reserve */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white">
              Minimum Battery Reserve (%)
            </label>
            <p className="text-xs text-white/40 mt-1">
              The system will never discharge below this level, preserving capacity for household backup.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={config.minBatteryReserve}
              onChange={(e) => setConfig({ ...config, minBatteryReserve: Number(e.target.value) })}
              className="flex-1 accent-emerald-400"
            />
            <span className="w-12 text-right text-white font-semibold">{config.minBatteryReserve}%</span>
          </div>
        </div>

        {/* Max Export Power */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white">
              Export Power Limit (kW)
            </label>
            <p className="text-xs text-white/40 mt-1">
              Maximum power to push to the grid during a sell event. Must not exceed your
              DNSP single-phase limit (typically 5 kW).
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0.5}
              max={5}
              step={0.5}
              value={config.maxExportPower}
              onChange={(e) => setConfig({ ...config, maxExportPower: Number(e.target.value) })}
              className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-sm text-white/40">kW</span>
          </div>
          {config.maxExportPower > 5 && (
            <p className="text-xs text-red-400">⚠ Exceeds standard single-phase DNSP export limit of 5 kW.</p>
          )}
        </div>

        {/* Command Duration */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white">
              Command Duration (minutes)
            </label>
            <p className="text-xs text-white/40 mt-1">
              How long each dispatch command stays active before the inverter automatically
              reverts to self-consumption if the cloud connection drops.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={5}
              max={120}
              step={5}
              value={config.commandDuration}
              onChange={(e) => setConfig({ ...config, commandDuration: Number(e.target.value) })}
              className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <span className="text-sm text-white/40">minutes</span>
          </div>
        </div>

        {/* Amber API Token */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-white">Amber API Token</label>
            <p className="text-xs text-white/40 mt-1">
              Your personal API token from{" "}
              <a
                href="https://app.amber.com.au/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                app.amber.com.au/developers
              </a>
            </p>
          </div>
          <input
            type="password"
            placeholder="psk_live_••••••••••••••••"
            value={config.amberToken}
            onChange={(e) => setConfig({ ...config, amberToken: e.target.value })}
            className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-white/20"
          />
        </div>

        {/* Save */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors"
          >
            Save & Apply
          </button>
          {saved && (
            <span className="text-sm text-emerald-400">
              ✓ Configuration saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
