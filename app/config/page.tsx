"use client";

import { useState } from "react";
import { mockConfig } from "@/lib/mock-data";
import {
  type EnergyAutomationConfig,
  defaultEnergyConfig,
  validateConfig,
  formatTimeWindow,
  getCurrentSeason,
  isPeakMonth,
} from "@/lib/energy-rules-config";
import { DNSP_LIST, MONTH_NAMES } from "@/lib/dnsp-plans";
import { InfoIcon, HelpText, WarningText } from "@/components/Tooltip";

export default function ConfigPage() {
  const [config, setConfig] = useState<EnergyAutomationConfig>(defaultEnergyConfig);
  const [dispatch, setDispatch] = useState(mockConfig);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"basic" | "settings" | "advanced">("basic");
  const [selectedDnspId, setSelectedDnspId] = useState("ausgrid");
  const [selectedPlanId, setSelectedPlanId] = useState("ea025");

  const selectedDnsp = DNSP_LIST.find((d) => d.id === selectedDnspId) ?? DNSP_LIST[0];
  const selectedPlan = selectedDnsp.plans.find((p) => p.id === selectedPlanId) ?? selectedDnsp.plans[0];

  function applyDnspPlan(dnspId: string, planId: string) {
    const dnsp = DNSP_LIST.find((d) => d.id === dnspId) ?? DNSP_LIST[0];
    const plan = dnsp.plans.find((p) => p.id === planId) ?? dnsp.plans[0];
    setSelectedDnspId(dnsp.id);
    setSelectedPlanId(plan.id);
    setConfig((prev) => ({
      ...prev,
      avoidDemandCharges: {
        ...prev.avoidDemandCharges,
        demandWindow: plan.demandWindow,
        peakMonths: plan.peakMonths,
        offPeakMonths: plan.offPeakMonths,
      },
    }));
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validateConfig(config);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // TODO: Save to backend via API
  }

  const currentSeason = getCurrentSeason();
  const inPeakMonth = isPeakMonth(config);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Configuration</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-white/40">Season:</span>
          <span className="font-semibold text-emerald-400">{currentSeason}</span>
          <span className="text-white/20">•</span>
          <span className={`font-semibold ${inPeakMonth ? "text-amber-400" : "text-sky-400"}`}>
            {inPeakMonth ? "Peak Month (Demand Charge Active)" : "Off-Peak Month"}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-white/10">
        {[
          { id: "basic", label: "Basic Settings" },
          { id: "settings", label: "Automation Settings" },
          { id: "advanced", label: "Advanced" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? "border-emerald-400 text-white"
                : "border-transparent text-white/50 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
            <strong className="text-red-400 font-semibold">Validation Errors:</strong>
            <ul className="mt-2 space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm text-red-300">• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* BASIC SETTINGS TAB */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            {/* System Information */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                System Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Powerwall Capacity (kWh)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.system.powerwallCapacityKwh}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        system: { ...config.system, powerwallCapacityKwh: Number(e.target.value) },
                      })
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Solar Peak Output (kW)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.system.solarPeakKw}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        system: { ...config.system, solarPeakKw: Number(e.target.value) },
                      })
                    }
                    className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>

              {/* EV toggle */}
              <div className="border-t border-white/10 pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.system.hasEV}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        system: { ...config.system, hasEV: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div>
                    <span className="text-white font-medium">I have an electric vehicle</span>
                    <p className="text-xs text-white/40 mt-0.5">
                      Enables EV charging settings and shows EV-related automation options.
                    </p>
                  </div>
                </label>

                {config.system.hasEV && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        EV Battery Capacity (kWh)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={config.system.evBatteryCapacityKwh}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            system: { ...config.system, evBatteryCapacityKwh: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Zappi Charge Rate (kW)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.system.zappiChargeRateKw}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            system: { ...config.system, zappiChargeRateKw: Number(e.target.value) },
                          })
                        }
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Master Controls */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                Master Controls
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.advanced.enableAutomationSettings}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        advanced: { ...config.advanced, enableAutomationSettings: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <div>
                    <span className="text-white font-medium">Enable Automation Settings</span>
                    <p className="text-xs text-white/40 mt-0.5">
                      Master switch for all energy automation. Disable to return to manual control.
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.advanced.dryRunMode}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        advanced: { ...config.advanced, dryRunMode: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-amber-500 focus:ring-2 focus:ring-amber-500/50"
                  />
                  <div>
                    <span className="text-white font-medium">Dry Run Mode</span>
                    <p className="text-xs text-white/40 mt-0.5">
                      Log decisions without executing commands. Use for testing setting changes.
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.advanced.notificationsEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        advanced: { ...config.advanced, notificationsEnabled: e.target.checked },
                      })
                    }
                    className="w-5 h-5 rounded border-white/20 bg-white/10 text-sky-500 focus:ring-2 focus:ring-sky-500/50"
                  />
                  <div>
                    <span className="text-white font-medium">Enable Notifications</span>
                    <p className="text-xs text-white/40 mt-0.5">
                      Send alerts for critical events (low battery, demand window, negative prices).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Dispatch Settings */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                Dispatch Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Minimum Export Price (¢/kWh)
                  </label>
                  <p className="text-xs text-white/40 mb-2">
                    Only begin selling when the live feed-in price exceeds this value.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={dispatch.minExportPrice}
                      onChange={(e) => setDispatch({ ...dispatch, minExportPrice: Number(e.target.value) })}
                      className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-white/40">¢/kWh</span>
                    <span className="ml-auto text-xs text-white/30">
                      ≈ ${(dispatch.minExportPrice / 100).toFixed(2)}/kWh
                    </span>
                  </div>
                  {dispatch.minExportPrice < 80 && (
                    <p className="text-xs text-amber-400 mt-1">
                      ⚠ Low threshold — ensure this exceeds your off-peak buy price plus round-trip losses.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Export Power Limit (kW)
                  </label>
                  <p className="text-xs text-white/40 mb-2">
                    Maximum power to push to the grid. Must not exceed your DNSP single-phase limit (5 kW).
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0.5}
                      max={5}
                      step={0.5}
                      value={dispatch.maxExportPower}
                      onChange={(e) => setDispatch({ ...dispatch, maxExportPower: Number(e.target.value) })}
                      className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-white/40">kW</span>
                  </div>
                  {dispatch.maxExportPower > 5 && (
                    <p className="text-xs text-red-400 mt-1">⚠ Exceeds standard single-phase DNSP export limit of 5 kW.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-white mb-1">
                    Command Duration (minutes)
                  </label>
                  <p className="text-xs text-white/40 mb-2">
                    How long each dispatch command stays active before the inverter reverts to self-consumption.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={5}
                      max={120}
                      step={5}
                      value={dispatch.commandDuration}
                      onChange={(e) => setDispatch({ ...dispatch, commandDuration: Number(e.target.value) })}
                      className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-white/40">minutes</span>
                  </div>
                </div>
              </div>
            </div>

            {/* API & Connections */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                API & Connections
              </h2>
              <div>
                <label className="block text-sm font-medium text-white mb-1">Amber API Token</label>
                <p className="text-xs text-white/40 mb-2">
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
                <input
                  type="password"
                  placeholder="psk_live_••••••••••••••••"
                  value={dispatch.amberToken}
                  onChange={(e) => setDispatch({ ...dispatch, amberToken: e.target.value })}
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 placeholder:text-white/20"
                />
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            {/* 1: Daily Charge Target */}
            <RuleCard
              number={1}
              title="Daily Charge Target"
              enabled={config.dailyChargeTarget.enabled}
              onToggle={(enabled) =>
                setConfig({
                  ...config,
                  dailyChargeTarget: { ...config.dailyChargeTarget, enabled },
                })
              }
            >
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                    Target: Powerwall at {config.dailyChargeTarget.targetSoC}% by this time every day:
                    <InfoIcon tooltip="This is your daily 'topped up by' deadline. The system will use cheap solar or off-peak grid power to reach your target charge level before this time — so you're fully loaded heading into the evening price spike." />
                  </label>
                  <input
                    type="time"
                    value={`${String(config.dailyChargeTarget.targetTimeHour).padStart(2, "0")}:${String(config.dailyChargeTarget.targetTimeMinute).padStart(2, "0")}`}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(":").map(Number);
                      setConfig({
                        ...config,
                        dailyChargeTarget: {
                          ...config.dailyChargeTarget,
                          targetTimeHour: h,
                          targetTimeMinute: m,
                        },
                      });
                    }}
                    className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <p className="flex items-center gap-1.5 text-sm text-white/60">
                  Solar Sponge Window: {formatTimeWindow(config.dailyChargeTarget.solarSpongeWindow)}
                  <InfoIcon tooltip="The hours when rooftop solar is typically at its peak. The system prioritises charging your Powerwall during this window using free solar energy, before considering any grid top-up." />
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.dailyChargeTarget.gridTopUpEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        dailyChargeTarget: {
                          ...config.dailyChargeTarget,
                          gridTopUpEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    Top up from the grid if solar falls short
                    <InfoIcon tooltip="If there isn't enough solar to reach your target by the deadline, the system will buy a small amount of grid power to make up the difference — but only if the price is below your ceiling." />
                  </span>
                </label>
                {config.dailyChargeTarget.gridTopUpEnabled && (
                  <div>
                    <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                      Maximum price to pay for grid top-up (¢/kWh)
                      <InfoIcon tooltip="The system will only buy grid power to top up your battery if the price is below this limit. Set it low to only charge during cheap off-peak rates, or higher to ensure you always hit your target regardless of price." />
                    </label>
                    <input
                      type="number"
                      value={config.dailyChargeTarget.gridTopUpPriceCeiling}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          dailyChargeTarget: {
                            ...config.dailyChargeTarget,
                            gridTopUpPriceCeiling: Number(e.target.value),
                          },
                        })
                      }
                      className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white text-sm"
                    />
                  </div>
                )}
              </div>
            </RuleCard>

            {/* 2: Minimum Battery Reserve */}
            <RuleCard
              number={2}
              title="Minimum Battery Reserve"
              enabled={config.minimumBatteryReserve.enabled}
              priority="SAFETY"
              onToggle={(enabled) =>
                setConfig({
                  ...config,
                  minimumBatteryReserve: { ...config.minimumBatteryReserve, enabled },
                })
              }
            >
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-1.5 text-sm text-white/60">
                      Minimum reserve
                      <InfoIcon tooltip="The lowest your Powerwall will go during automated decisions. Think of it like the reserve fuel light in your car — automation stops discharging here so you always have a buffer for unexpected usage or a price spike later in the day." />
                    </label>
                    <span className="text-lg font-semibold text-white">
                      {config.minimumBatteryReserve.minimumSoC}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={50}
                    step={5}
                    value={config.minimumBatteryReserve.minimumSoC}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        minimumBatteryReserve: {
                          ...config.minimumBatteryReserve,
                          minimumSoC: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-xs text-white/30 mt-1">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>
                <p className="text-xs text-white/40">
                  {config.minimumBatteryReserve.bufferRationale}
                </p>
                <p className="text-xs text-sky-300/70">
                  Your home can still drain below this naturally — this floor only applies to
                  deliberate automation decisions.
                </p>
              </div>
            </RuleCard>

            {/* 3: Avoid Demand Charges */}
            <RuleCard
              number={3}
              title="Avoid Demand Charges"
              enabled={config.avoidDemandCharges.enabled}
              priority="CRITICAL"
              onToggle={(enabled) =>
                setConfig({
                  ...config,
                  avoidDemandCharges: { ...config.avoidDemandCharges, enabled },
                })
              }
            >
              <div className="space-y-4">
                <WarningText>
                  One bad 30-minute window during the demand period can add $50–100 to your monthly
                  bill. This rule ensures zero grid import during that window in peak months — it
                  overrides everything else and should never be disabled.{" "}
                  <InfoIcon tooltip="Your network distributor (not your retailer) measures your highest 30-minute grid import each month. They charge you $/kW for that peak — applied to your whole bill. It's separate from the energy you use and catches many people off guard." />
                </WarningText>

                {/* DNSP selector */}
                <div className="space-y-3">
                  <h3 className="text-xs font-medium text-white/50 uppercase tracking-widest">
                    Your Network Distributor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:items-end">
                    <div>
                      <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                        Distributor (DNSP)
                        <InfoIcon tooltip="Your DNSP owns the poles and wires. They set the demand tariff rules — separate from your energy retailer (e.g. Amber). Check your network bill or look up your address at energymadeeasy.gov.au." />
                      </label>
                      <select
                        value={selectedDnspId}
                        onChange={(e) => {
                          const dnsp = DNSP_LIST.find((d) => d.id === e.target.value) ?? DNSP_LIST[0];
                          applyDnspPlan(dnsp.id, dnsp.plans[0].id);
                        }}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        {DNSP_LIST.map((d) => (
                          <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Tariff Plan</label>
                      <select
                        value={selectedPlanId}
                        onChange={(e) => applyDnspPlan(selectedDnspId, e.target.value)}
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      >
                        {selectedDnsp.plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-white/40">{selectedPlan.description}</p>
                </div>

                {/* Demand window */}
                <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 space-y-1">
                  <p className="flex items-center gap-1.5 text-xs text-white/40">
                    Demand window
                    <InfoIcon tooltip="The hours each day when your DNSP measures peak demand. You must have zero grid import during this window in peak months to avoid the demand charge." />
                  </p>
                  <p className="text-xl font-semibold text-amber-400 tabular-nums">
                    {formatTimeWindow(config.avoidDemandCharges.demandWindow)}
                  </p>
                </div>

                {/* Month grid */}
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                    Peak months
                    <InfoIcon tooltip="The demand charge only applies during these months. In off-peak months you can import freely during the demand window without any penalty." />
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {MONTH_NAMES.map((name, i) => {
                      const month = i + 1;
                      const isPeak = config.avoidDemandCharges.peakMonths.includes(month as any);
                      return (
                        <span
                          key={month}
                          className={`px-2.5 py-1 rounded text-xs font-medium border ${
                            isPeak
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-white/5 text-white/30 border-white/10"
                          }`}
                        >
                          {name}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-white/30">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/30" />
                      Demand charge active
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-white/10 border border-white/10" />
                      No demand charge
                    </span>
                  </div>
                </div>
              </div>
            </RuleCard>

            {/* 4: Avoid Negative Feed-in Tariff */}
            <RuleCard
              number={4}
              title="Avoid Negative Feed-in Tariff"
              enabled={config.avoidNegativeFeedIn.enabled}
              onToggle={(enabled) =>
                setConfig({
                  ...config,
                  avoidNegativeFeedIn: { ...config.avoidNegativeFeedIn, enabled },
                })
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-white/60">
                  When the grid is paying negative prices, stop exporting — otherwise you're paying
                  the grid to take your solar.{" "}
                  <InfoIcon tooltip="Negative prices happen when there's too much renewable energy on the grid. Instead of being paid for your exports, you'd be charged. This rule stops that automatically." />
                </p>
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-white/40 mb-2">
                    Spare solar diversion order
                    <InfoIcon tooltip="When export stops, surplus solar is redirected in this priority order. Drag to change the order." />
                  </p>
                  <DiversionPriorityList
                    priority={config.avoidNegativeFeedIn.diversionPriority}
                    hasEV={config.system.hasEV}
                    onChange={(priority) =>
                      setConfig({
                        ...config,
                        avoidNegativeFeedIn: {
                          ...config.avoidNegativeFeedIn,
                          diversionPriority: priority,
                        },
                      })
                    }
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.avoidNegativeFeedIn.curtailmentEnabled}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        avoidNegativeFeedIn: {
                          ...config.avoidNegativeFeedIn,
                          curtailmentEnabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    Reduce solar output if batteries are full
                    <InfoIcon tooltip="Last resort: if the Powerwall is full and prices are still negative, the inverter will throttle solar production to avoid paying to export. Rarely needed." />
                  </span>
                </label>
              </div>
            </RuleCard>

            {/* 5: Get Paid to Charge (always visible) / 6: Smart Car Charging (EV only) */}
            <RuleCard
              number={5}
              title="Get Paid to Charge"
              enabled={config.getPaidToCharge.enabled}
              priority="OPPORTUNITY"
              onToggle={(enabled) =>
                setConfig({
                  ...config,
                  getPaidToCharge: { ...config.getPaidToCharge, enabled },
                })
              }
            >
              <div className="space-y-3">
                <p className="text-sm text-white/60">
                  Occasionally, wholesale electricity prices go negative — meaning the grid will
                  actually pay you to consume power. When that happens, this rule charges everything
                  you have so you can sell it back later at a profit.{" "}
                  <InfoIcon tooltip="Negative prices occur when there's a surplus of renewable energy (e.g. a sunny, windy day). Grid operators pay consumers to absorb the excess. Charging your battery at -5¢ and selling at 150¢ later is free money." />
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.getPaidToCharge.chargePowerwallTo100}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        getPaidToCharge: {
                          ...config.getPaidToCharge,
                          chargePowerwallTo100: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    Fill the Powerwall to 100%
                    <InfoIcon tooltip="Normally the Powerwall charges to your daily target (e.g. 90%). During negative prices, top it up completely so you have maximum capacity to sell during the next price spike." />
                  </span>
                </label>
                {config.system.hasEV && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.getPaidToCharge.chargeEVTo100}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          getPaidToCharge: {
                            ...config.getPaidToCharge,
                            chargeEVTo100: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded border-white/20 bg-white/10"
                    />
                    <span className="flex items-center gap-1.5 text-sm text-white/70">
                      Fill the EV to 100%
                      <InfoIcon tooltip="Charge your EV for free (or better — get paid to charge it). Only applies if your Zappi is connected and the car is plugged in." />
                    </span>
                  </label>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.getPaidToCharge.triggerSmartAppliances}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        getPaidToCharge: {
                          ...config.getPaidToCharge,
                          triggerSmartAppliances: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded border-white/20 bg-white/10"
                  />
                  <span className="flex items-center gap-1.5 text-sm text-white/70">
                    Run smart appliances
                    <InfoIcon tooltip="Future: automatically trigger high-draw appliances (AC, heat pump, dishwasher) during negative price windows to absorb free electricity. Not yet wired up." />
                  </span>
                </label>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1">
                    Trigger when price drops below (¢/kWh)
                    <InfoIcon tooltip="0 means only trigger when prices go truly negative (the grid pays you). Lower this to a negative number to be even more selective, or raise it slightly to also capture near-zero prices." />
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step={1}
                      value={config.getPaidToCharge.negativePriceThreshold}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          getPaidToCharge: {
                            ...config.getPaidToCharge,
                            negativePriceThreshold: Number(e.target.value),
                          },
                        })
                      }
                      className="w-24 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-white/40">¢/kWh</span>
                  </div>
                </div>
              </div>
            </RuleCard>

            {/* 6: Smart Car Charging */}
            {config.system.hasEV && (
              <RuleCard
                number={6}
                title="Smart Car Charging"
                enabled={config.smartCarCharging.enabled}
                onToggle={(enabled) =>
                  setConfig({
                    ...config,
                    smartCarCharging: { ...config.smartCarCharging, enabled },
                  })
                }
              >
                <div className="space-y-3">
                  <p className="text-sm text-white/60">
                    Charge the EV based on urgency — the lower the battery, the more you&apos;re willing to pay.{" "}
                    <InfoIcon tooltip="Instead of a fixed schedule, this adjusts the maximum price you'll pay based on how urgent the charge is. An empty car charges at almost any price; a nearly-full car waits for cheap solar." />
                  </p>
                  <div className="space-y-2">
                    {config.smartCarCharging.tiers.map((tier) => (
                      <div
                        key={tier.level}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                      >
                        <span className="w-16 text-xs text-white/40 shrink-0 tabular-nums">
                          {tier.socMin}–{tier.socMax}%
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${
                            tier.level === "CRITICAL"
                              ? "bg-red-500/20 text-red-300"
                              : tier.level === "LOW"
                              ? "bg-amber-500/20 text-amber-300"
                              : tier.level === "BELOW_TARGET"
                              ? "bg-yellow-500/20 text-yellow-300"
                              : tier.level === "TARGET_RANGE"
                              ? "bg-sky-500/20 text-sky-300"
                              : "bg-white/10 text-white/40"
                          }`}
                        >
                          {tier.level.replace(/_/g, " ")}
                        </span>
                        <span className="text-white/60 flex-1">{tier.behaviour}</span>
                        <span className="text-xs text-white/30 shrink-0">
                          {tier.priceCeiling !== null ? `≤ ${tier.priceCeiling}¢` : "Solar only"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.smartCarCharging.respectDemandWindow}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          smartCarCharging: {
                            ...config.smartCarCharging,
                            respectDemandWindow: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded border-white/20 bg-white/10"
                    />
                    <span className="flex items-center gap-1.5 text-sm text-white/70">
                      No EV charging during demand window
                      <InfoIcon tooltip="Prevents the Zappi from drawing grid power during the demand window — even if the car battery is critical. The Powerwall always takes priority." />
                    </span>
                  </label>
                </div>
              </RuleCard>
            )}

          </div>
        )}

        {/* ADVANCED TAB */}
        {activeTab === "advanced" && (
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
              <h2 className="text-sm font-medium text-white/50 uppercase tracking-widest">
                Logging & Debugging
              </h2>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Log Level</label>
                <select
                  value={config.advanced.logLevel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      advanced: {
                        ...config.advanced,
                        logLevel: e.target.value as "DEBUG" | "INFO" | "WARN" | "ERROR",
                      },
                    })
                  }
                  className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="DEBUG">DEBUG (verbose)</option>
                  <option value="INFO">INFO (recommended)</option>
                  <option value="WARN">WARN (important only)</option>
                  <option value="ERROR">ERROR (critical only)</option>
                </select>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
              <h3 className="text-sm font-semibold text-amber-300 mb-2">⚠️ Integration Dependencies</h3>
              <ul className="space-y-1 text-sm text-amber-300/80">
                <li>• <strong>Solcast</strong>: Required for Overnight Charging and Cloudy Day Detection</li>
                <li>• <strong>Weather Forecast</strong>: Required for Overnight Charging</li>
                <li>• <strong>Amber Forecast</strong>: Used by all price-dependent settings</li>
                {config.system.hasEV && (
                  <li>• <strong>Zappi API</strong>: Required for Smart Car Charging and EV diversion</li>
                )}
              </ul>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors"
          >
            Save & Apply
          </button>
          {saved && <span className="text-sm text-emerald-400">✓ Configuration saved</span>}
        </div>
      </form>
    </div>
  );
}

function RuleCard({
  number,
  title,
  enabled,
  priority,
  children,
  onToggle,
}: {
  number: number;
  title: string;
  enabled: boolean;
  priority?: "CRITICAL" | "SAFETY" | "OPPORTUNITY";
  children: React.ReactNode;
  onToggle: (enabled: boolean) => void;
}) {
  const priorityColors = {
    CRITICAL: "border-red-500/30 bg-red-500/5",
    SAFETY: "border-amber-500/30 bg-amber-500/5",
    OPPORTUNITY: "border-emerald-500/30 bg-emerald-500/5",
  };

  return (
    <div
      className={`rounded-xl border bg-white/5 p-5 space-y-4 ${
        priority ? priorityColors[priority] : "border-white/10"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
            {number}
          </span>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {priority && (
              <span
                className={`text-xs font-medium mt-1 inline-block ${
                  priority === "CRITICAL"
                    ? "text-red-400"
                    : priority === "SAFETY"
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {priority}
              </span>
            )}
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-2 focus:ring-emerald-500/50"
          />
          <span className="text-sm text-white/70">Enabled</span>
        </label>
      </div>
      {enabled && <div className="pl-11">{children}</div>}
    </div>
  );
}

type DiversionItem = "BATTERY" | "EV" | "GRID_EXPORT";

const DIVERSION_META: Record<DiversionItem, { label: string; description: string }> = {
  BATTERY: { label: "Powerwall", description: "Charge the home battery" },
  EV:      { label: "EV",        description: "Charge the car via Zappi" },
  GRID_EXPORT: { label: "Grid",  description: "Allow export as last resort" },
};

function DiversionPriorityList({
  priority,
  hasEV,
  onChange,
}: {
  priority: DiversionItem[];
  hasEV: boolean;
  onChange: (priority: DiversionItem[]) => void;
}) {
  const visible = hasEV ? priority : priority.filter((item) => item !== "EV");
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...visible];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    if (hasEV) {
      onChange(next);
    } else {
      // Reinsert EV at its original position in the full priority array
      const evIndex = priority.indexOf("EV");
      const merged = [...next];
      if (evIndex !== -1) merged.splice(evIndex, 0, "EV");
      onChange(merged);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <ol className="space-y-1.5">
      {visible.map((item, i) => {
        const meta = DIVERSION_META[item];
        const isOver = overIndex === i && dragIndex !== i;
        return (
          <li
            key={item}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragEnd={() => { setDragIndex(null); setOverIndex(null); }}
            onDragOver={(e) => { e.preventDefault(); setOverIndex(i); }}
            onDrop={() => handleDrop(i)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors cursor-grab active:cursor-grabbing select-none ${
              dragIndex === i
                ? "opacity-40 border-white/10 bg-white/5"
                : isOver
                ? "border-emerald-500/50 bg-emerald-500/10"
                : "border-white/10 bg-white/5 hover:border-white/20"
            }`}
          >
            <span className="text-white/20 text-xs leading-none">⠿</span>
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
              {i + 1}
            </span>
            <span className="font-medium text-white">{meta.label}</span>
            <span className="text-white/40">{meta.description}</span>
          </li>
        );
      })}
    </ol>
  );
}
