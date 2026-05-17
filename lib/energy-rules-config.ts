/**
 * Energy Automation Settings Configuration
 *
 * Defines all configurable parameters for the energy automation system.
 * Settings are named to match the UI: plain English, no internal rule numbers.
 */

export type Month = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type Season = "SUMMER" | "WINTER" | "AUTUMN" | "SPRING";

export interface TimeWindow {
  startHour: number;   // 0-23
  startMinute: number; // 0-59
  endHour: number;
  endMinute: number;
}

export interface EVChargingTier {
  socMin: number;
  socMax: number;
  level: "CRITICAL" | "LOW" | "BELOW_TARGET" | "TARGET_RANGE" | "FULL";
  behaviour: string;
  priceCeiling: number | null; // cents/kWh, null = solar only
}

export interface SeasonalChargingBehaviour {
  season: Season;
  solarExpectation: "HIGH" | "MODERATE" | "LOW";
  overnightChargingBeyondSafetyNet: string;
  chargingCapPercent: number | null; // null = skip overnight charging
}

export interface EnergyAutomationConfig {
  // ============================================================
  // SETTING 1 (UI): Daily Charge Target
  // Ensure the Powerwall is fully charged before the demand window
  // ============================================================
  dailyChargeTarget: {
    enabled: boolean;
    targetSoC: number;               // % (default: 100)
    targetTimeHour: number;          // hour to be charged by (default: 15 = 3pm)
    targetTimeMinute: number;        // minute (default: 0)
    solarSpongeWindow: TimeWindow;   // cheap solar hours, default: 10am–3pm
    gridTopUpEnabled: boolean;       // buy from grid if solar falls short
    gridTopUpPriceCeiling: number;   // cents/kWh max for grid top-up
    cloudyDayEarlyTopUp: boolean;    // start earlier on forecast-cloudy days
  };

  // ============================================================
  // SETTING 2 (UI): Minimum Battery Reserve  [SAFETY]
  // Floor below which automation never deliberately discharges
  // ============================================================
  minimumBatteryReserve: {
    enabled: boolean;
    minimumSoC: number;              // % (default: 20)
    appliesToAutomationOnly: boolean; // passive home load can still drain below this
    bufferRationale: string;         // plain-English explanation shown in UI
  };

  // ============================================================
  // SETTING 3 (UI): Avoid Demand Charges  [CRITICAL]
  // Zero grid import during network demand window in peak months
  // ============================================================
  avoidDemandCharges: {
    enabled: boolean;
    peakMonths: Month[];             // months when demand charge applies
    offPeakMonths: Month[];          // months with no demand charge
    demandWindow: TimeWindow;        // default: 3pm–9pm
    zeroGridImportInPeakMonths: boolean;
    loadSheddingEnabled: boolean;
    lowBatteryCriticalThreshold: number; // % SoC for warning
  };

  // ============================================================
  // SETTING 4 (UI): Avoid Negative Feed-in Tariff
  // Stop exporting when the grid would charge you to take power
  // ============================================================
  avoidNegativeFeedIn: {
    enabled: boolean;
    stopExportBelowPrice: number;    // cents/kWh threshold (default: 0)
    curtailmentEnabled: boolean;     // throttle solar as last resort
    diversionPriority: ("BATTERY" | "EV" | "GRID_EXPORT")[];
    exportPenaltyWindow: TimeWindow; // window when export penalty may apply
    exportPenaltyEnabled: boolean;
  };

  // ============================================================
  // SETTING 5 (UI): Get Paid to Charge  [OPPORTUNITY]
  // Charge everything when wholesale prices go negative
  // ============================================================
  getPaidToCharge: {
    enabled: boolean;
    chargePowerwallTo100: boolean;
    chargeEVTo100: boolean;
    triggerSmartAppliances: boolean;         // future: AC, heat pump, dishwasher
    overrideAllSettingsExceptDemandWindow: boolean;
    negativePriceThreshold: number;          // cents/kWh (default: 0)
  };

  // ============================================================
  // SETTING 6 (UI): Smart Car Charging
  // Charge the EV based on urgency — lower battery = willing to pay more
  // ============================================================
  smartCarCharging: {
    enabled: boolean;
    tiers: EVChargingTier[];
    respectDemandWindow: boolean;    // no EV grid charging during demand window
    lowerPriorityThanPowerwall: boolean;
    departureTimeEnabled: boolean;   // future: deadline-based charging
    publicChargerCostReference: number; // cents/kWh — benchmark for "is home charging worth it?"
  };

  // ============================================================
  // BACKGROUND: Excess Solar to EV  (not yet in UI)
  // Use Zappi eco mode to absorb surplus solar into the car
  // ============================================================
  excessSolarToEV: {
    enabled: boolean;
    zappiEcoModeEnabled: boolean;
    priority: ("BATTERY" | "EV" | "GRID_EXPORT")[];
    onlyChargeIfPluggedIn: boolean;
    minimumExcessThreshold: number;  // kW minimum surplus before diverting
  };

  // ============================================================
  // BACKGROUND: Overnight Charging  (not yet in UI)
  // Safety net + opportunistic cheap-rate charging overnight
  // ============================================================
  overnightCharging: {
    enabled: boolean;
    safetyNetTopUp: {
      enabled: boolean;
      targetSoC: number;               // % (default: 20 — match minimum reserve)
      priceCeiling: number;            // cents/kWh (default: 25)
      evaluateBeforeSolarTime: number; // hour solar kicks in (default: 9.5)
    };
    additionalCharging: {
      enabled: boolean;
      compareWithSolarSponge: boolean;
      capAtSoC: number;                // % (default: 80)
      seasonalBehaviour: SeasonalChargingBehaviour[];
    };
    requiresSolcastIntegration: boolean;
    requiresWeatherForecast: boolean;
  };

  // ============================================================
  // BACKGROUND: Cloudy Day Detection  (not yet in UI)
  // Pre-charge early when solar forecast is poor
  // ============================================================
  cloudyDayDetection: {
    enabled: boolean;
    solarForecastThreshold: number;  // kWh/day below which it's a "cloudy day"
    gridTopUpTargetSoC: number;      // % target (default: 80)
    gridTopUpWindow: TimeWindow;     // default: before 9am
    usesCheapestMorningWindow: boolean;
    requiresSolcastIntegration: boolean;
  };

  // ============================================================
  // DECISION PRIORITY ORDER
  // Applied highest-priority first when settings conflict
  // ============================================================
  decisionPriorityOrder: {
    settings: (
      | "MINIMUM_BATTERY_RESERVE"
      | "AVOID_DEMAND_CHARGES"
      | "AVOID_NEGATIVE_FEED_IN"
      | "GET_PAID_TO_CHARGE"
      | "DAILY_CHARGE_TARGET"
      | "EXCESS_SOLAR_TO_EV"
      | "SMART_CAR_CHARGING"
      | "OVERNIGHT_CHARGING"
    )[];
  };

  // ============================================================
  // SYSTEM METADATA
  // ============================================================
  system: {
    powerwallCapacityKwh: number;    // default: 13.5
    powerwallChargeRateKw: number;   // default: 5
    powerwallDischargeRateKw: number;
    solarPeakKw: number;             // default: 5
    hasEV: boolean;                  // enables all EV-related settings in the UI
    evBatteryCapacityKwh: number;    // default: 100 (Polestar 4)
    zappiChargeRateKw: number;       // default: 7.4
    tariff: string;                  // "Amber Electric"
    distributionNetwork: string;     // e.g. "Ausgrid EA025"
  };

  // ============================================================
  // ADVANCED SETTINGS
  // ============================================================
  advanced: {
    enableAutomationSettings: boolean; // master switch
    dryRunMode: boolean;               // log decisions without executing
    notificationsEnabled: boolean;
    logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
    overrideUntil: string | null;      // ISO timestamp for manual override expiry
  };
}

// ============================================================
// DEFAULT CONFIGURATION
// ============================================================

export const defaultEnergyConfig: EnergyAutomationConfig = {
  dailyChargeTarget: {
    enabled: true,
    targetSoC: 100,
    targetTimeHour: 15,
    targetTimeMinute: 0,
    solarSpongeWindow: {
      startHour: 10,
      startMinute: 0,
      endHour: 15,
      endMinute: 0,
    },
    gridTopUpEnabled: true,
    gridTopUpPriceCeiling: 12,
    cloudyDayEarlyTopUp: true,
  },

  minimumBatteryReserve: {
    enabled: true,
    minimumSoC: 20,
    appliesToAutomationOnly: true,
    bufferRationale:
      "Buffer against unexpected load spikes, protection against deep discharge degradation, and safety margin if automation makes a timing error near the demand window",
  },

  avoidDemandCharges: {
    enabled: true,
    peakMonths: [11, 12, 1, 2, 3, 6, 7, 8],
    offPeakMonths: [4, 5, 9, 10],
    demandWindow: {
      startHour: 15,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    },
    zeroGridImportInPeakMonths: true,
    loadSheddingEnabled: false,
    lowBatteryCriticalThreshold: 15,
  },

  avoidNegativeFeedIn: {
    enabled: true,
    stopExportBelowPrice: 0,
    curtailmentEnabled: true,
    diversionPriority: ["BATTERY", "EV", "GRID_EXPORT"],
    exportPenaltyWindow: {
      startHour: 10,
      startMinute: 0,
      endHour: 15,
      endMinute: 0,
    },
    exportPenaltyEnabled: true,
  },

  getPaidToCharge: {
    enabled: true,
    chargePowerwallTo100: true,
    chargeEVTo100: true,
    triggerSmartAppliances: false,
    overrideAllSettingsExceptDemandWindow: true,
    negativePriceThreshold: 0,
  },

  smartCarCharging: {
    enabled: true,
    tiers: [
      {
        socMin: 0,
        socMax: 15,
        level: "CRITICAL",
        behaviour: "Charge immediately",
        priceCeiling: 40,
      },
      {
        socMin: 15,
        socMax: 30,
        level: "LOW",
        behaviour: "Charge when reasonably priced",
        priceCeiling: 20,
      },
      {
        socMin: 30,
        socMax: 60,
        level: "BELOW_TARGET",
        behaviour: "Cheap windows only",
        priceCeiling: 12,
      },
      {
        socMin: 60,
        socMax: 80,
        level: "TARGET_RANGE",
        behaviour: "Very cheap or solar excess only",
        priceCeiling: 8,
      },
      {
        socMin: 80,
        socMax: 100,
        level: "FULL",
        behaviour: "Solar excess only, no grid charging",
        priceCeiling: null,
      },
    ],
    respectDemandWindow: true,
    lowerPriorityThanPowerwall: true,
    departureTimeEnabled: false,
    publicChargerCostReference: 60,
  },

  excessSolarToEV: {
    enabled: true,
    zappiEcoModeEnabled: true,
    priority: ["BATTERY", "EV", "GRID_EXPORT"],
    onlyChargeIfPluggedIn: true,
    minimumExcessThreshold: 1.5,
  },

  overnightCharging: {
    enabled: true,
    safetyNetTopUp: {
      enabled: true,
      targetSoC: 20,
      priceCeiling: 25,
      evaluateBeforeSolarTime: 9.5,
    },
    additionalCharging: {
      enabled: true,
      compareWithSolarSponge: true,
      capAtSoC: 80,
      seasonalBehaviour: [
        {
          season: "SUMMER",
          solarExpectation: "HIGH",
          overnightChargingBeyondSafetyNet: "Skip — Solar Sponge rate will be cheaper",
          chargingCapPercent: null,
        },
        {
          season: "WINTER",
          solarExpectation: "LOW",
          overnightChargingBeyondSafetyNet:
            "Charge to 80% if overnight price < Solar Sponge forecast",
          chargingCapPercent: 80,
        },
        {
          season: "AUTUMN",
          solarExpectation: "MODERATE",
          overnightChargingBeyondSafetyNet:
            "Charge only if overnight rate beats Solar Sponge forecast",
          chargingCapPercent: 80,
        },
        {
          season: "SPRING",
          solarExpectation: "MODERATE",
          overnightChargingBeyondSafetyNet:
            "Charge only if overnight rate beats Solar Sponge forecast",
          chargingCapPercent: 80,
        },
      ],
    },
    requiresSolcastIntegration: true,
    requiresWeatherForecast: true,
  },

  cloudyDayDetection: {
    enabled: true,
    solarForecastThreshold: 10,
    gridTopUpTargetSoC: 80,
    gridTopUpWindow: {
      startHour: 6,
      startMinute: 0,
      endHour: 9,
      endMinute: 0,
    },
    usesCheapestMorningWindow: true,
    requiresSolcastIntegration: true,
  },

  decisionPriorityOrder: {
    settings: [
      "MINIMUM_BATTERY_RESERVE",
      "AVOID_DEMAND_CHARGES",
      "AVOID_NEGATIVE_FEED_IN",
      "GET_PAID_TO_CHARGE",
      "DAILY_CHARGE_TARGET",
      "EXCESS_SOLAR_TO_EV",
      "SMART_CAR_CHARGING",
      "OVERNIGHT_CHARGING",
    ],
  },

  system: {
    powerwallCapacityKwh: 13.5,
    powerwallChargeRateKw: 5,
    powerwallDischargeRateKw: 5,
    solarPeakKw: 5,
    hasEV: false,
    evBatteryCapacityKwh: 100,
    zappiChargeRateKw: 7.4,
    tariff: "Amber Electric",
    distributionNetwork: "Ausgrid EA025",
  },

  advanced: {
    enableAutomationSettings: true,
    dryRunMode: false,
    notificationsEnabled: true,
    logLevel: "INFO",
    overrideUntil: null,
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1;
  if ([12, 1, 2].includes(month)) return "SUMMER";
  if ([3, 4, 5].includes(month)) return "AUTUMN";
  if ([6, 7, 8].includes(month)) return "WINTER";
  return "SPRING";
}

export function isPeakMonth(config: EnergyAutomationConfig): boolean {
  const month = (new Date().getMonth() + 1) as Month;
  return config.avoidDemandCharges.peakMonths.includes(month);
}

export function isInDemandWindow(
  config: EnergyAutomationConfig,
  time: Date = new Date()
): boolean {
  const window = config.avoidDemandCharges.demandWindow;
  const currentMinutes = time.getHours() * 60 + time.getMinutes();
  const startMinutes = window.startHour * 60 + window.startMinute;
  const endMinutes = window.endHour * 60 + window.endMinute;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function isInSolarSpongeWindow(
  config: EnergyAutomationConfig,
  time: Date = new Date()
): boolean {
  const window = config.dailyChargeTarget.solarSpongeWindow;
  const currentMinutes = time.getHours() * 60 + time.getMinutes();
  const startMinutes = window.startHour * 60 + window.startMinute;
  const endMinutes = window.endHour * 60 + window.endMinute;
  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

export function getEVChargingTier(
  config: EnergyAutomationConfig,
  evSoC: number
): EVChargingTier | null {
  return (
    config.smartCarCharging.tiers.find(
      (tier) => evSoC >= tier.socMin && evSoC < tier.socMax
    ) || null
  );
}

export function getSeasonalChargingBehaviour(
  config: EnergyAutomationConfig
): SeasonalChargingBehaviour | null {
  const season = getCurrentSeason();
  return (
    config.overnightCharging.additionalCharging.seasonalBehaviour.find(
      (s) => s.season === season
    ) || null
  );
}

export function formatTimeWindow(window: TimeWindow): string {
  const start = `${String(window.startHour).padStart(2, "0")}:${String(window.startMinute).padStart(2, "0")}`;
  const end = `${String(window.endHour).padStart(2, "0")}:${String(window.endMinute).padStart(2, "0")}`;
  return `${start} – ${end}`;
}

export function validateConfig(config: EnergyAutomationConfig): string[] {
  const errors: string[] = [];

  if (
    config.dailyChargeTarget.targetSoC < 0 ||
    config.dailyChargeTarget.targetSoC > 100
  ) {
    errors.push("Daily Charge Target: target must be between 0–100%");
  }

  if (
    config.minimumBatteryReserve.minimumSoC < 0 ||
    config.minimumBatteryReserve.minimumSoC > 100
  ) {
    errors.push("Minimum Battery Reserve: must be between 0–100%");
  }

  const validateWindow = (window: TimeWindow, label: string) => {
    if (window.startHour < 0 || window.startHour > 23)
      errors.push(`${label}: start hour must be 0–23`);
    if (window.endHour < 0 || window.endHour > 23)
      errors.push(`${label}: end hour must be 0–23`);
    if (window.startMinute < 0 || window.startMinute > 59)
      errors.push(`${label}: start minute must be 0–59`);
    if (window.endMinute < 0 || window.endMinute > 59)
      errors.push(`${label}: end minute must be 0–59`);
  };

  validateWindow(config.dailyChargeTarget.solarSpongeWindow, "Daily Charge Target (Solar Sponge Window)");
  validateWindow(config.avoidDemandCharges.demandWindow, "Avoid Demand Charges (Demand Window)");

  const tiers = config.smartCarCharging.tiers;
  if (tiers.length === 0) {
    errors.push("Smart Car Charging: at least one tier must be defined");
  } else {
    if (tiers[0].socMin !== 0)
      errors.push("Smart Car Charging: first tier must start at 0%");
    if (tiers[tiers.length - 1].socMax !== 100)
      errors.push("Smart Car Charging: last tier must end at 100%");
  }

  return errors;
}
