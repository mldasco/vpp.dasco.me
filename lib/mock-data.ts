export type SystemMode = "SELLING" | "CHARGING" | "HOLDING" | "SELF-CONSUMPTION";

export interface SystemState {
  mode: SystemMode;
  feedInPrice: number;   // cents/kWh
  buyPrice: number;      // cents/kWh
  batterySoC: number;    // %
  currentExport: number; // kW (negative = importing)
  todayEarnings: number; // AUD
  todaySavings: number;  // AUD
  solarOutput: number;   // kW
  houseLoad: number;     // kW
  lastUpdated: string;
}

export interface PriceInterval {
  time: string;
  feedIn: number;   // cents/kWh
  buy: number;      // cents/kWh
  soc: number;      // %
  exported: boolean;
}

export interface ActivityEntry {
  time: string;
  action: SystemMode;
  price: number;  // cents/kWh
  export: number; // kW
}

export interface DailyEarnings {
  date: string;
  earnings: number;  // AUD
  baseline: number;  // AUD (what self-consumption would have cost/earned)
}

export interface IntervalRecord {
  timestamp: string;
  mode: SystemMode;
  feedInPrice: number;
  exportKw: number;
  earnings: number;
}

// ── Current system state ──────────────────────────────────────────────────────

export const mockSystemState: SystemState = {
  mode: "SELLING",
  feedInPrice: 182,
  buyPrice: 28,
  batterySoC: 87,
  currentExport: 4.8,
  todayEarnings: 3.42,
  todaySavings: 1.15,
  solarOutput: 1.2,
  houseLoad: 0.4,
  lastUpdated: "2026-05-17T17:34:00+10:00",
};

// ── 24-hour price + SoC intervals (288 x 5-min) ──────────────────────────────

function generatePriceIntervals(): PriceInterval[] {
  const intervals: PriceInterval[] = [];
  for (let i = 0; i < 288; i++) {
    const hour = Math.floor(i / 12);
    const minute = (i % 12) * 5;
    const timeLabel = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

    // Base price curve: low overnight, moderate midday, spike evening
    let feedIn: number;
    let soc: number;
    if (hour >= 0 && hour < 6) {
      feedIn = 8 + Math.random() * 4;
      soc = 20 + (i / 12) * 0.5;
    } else if (hour >= 6 && hour < 10) {
      feedIn = 12 + Math.random() * 8;
      soc = 22 + (i - 72) * 0.6;
    } else if (hour >= 10 && hour < 15) {
      feedIn = 5 + Math.random() * 6;
      soc = 55 + (i - 120) * 0.8;
    } else if (hour >= 15 && hour < 17) {
      feedIn = 20 + Math.random() * 15;
      soc = Math.min(100, 90 + (i - 180) * 0.3);
    } else if (hour >= 17 && hour < 20) {
      // Evening spike
      const spike = 120 + Math.random() * 80 + (hour === 18 ? 40 : 0);
      feedIn = spike;
      soc = Math.max(20, 100 - (i - 204) * 2.5);
    } else if (hour >= 20 && hour < 22) {
      feedIn = 25 + Math.random() * 20;
      soc = Math.max(20, 40 - (i - 240) * 0.5);
    } else {
      feedIn = 8 + Math.random() * 5;
      soc = Math.max(20, 30 - (i - 264) * 0.3);
    }

    intervals.push({
      time: timeLabel,
      feedIn: Math.round(feedIn),
      buy: Math.round(22 + Math.random() * 10),
      soc: Math.min(100, Math.max(15, Math.round(soc))),
      exported: feedIn > 150,
    });
  }
  return intervals;
}

export const mockPriceIntervals = generatePriceIntervals();

// ── Recent activity feed ──────────────────────────────────────────────────────

export const mockActivity: ActivityEntry[] = [
  { time: "17:30", action: "SELLING",          price: 182, export: 4.8 },
  { time: "17:25", action: "SELLING",          price: 175, export: 4.8 },
  { time: "17:20", action: "SELLING",          price: 163, export: 4.8 },
  { time: "17:15", action: "SELLING",          price: 157, export: 4.8 },
  { time: "14:50", action: "HOLDING",          price: 8,   export: 0   },
  { time: "12:05", action: "CHARGING",         price: -2,  export: 0   },
  { time: "10:30", action: "SELF-CONSUMPTION", price: 18,  export: 0   },
  { time: "07:00", action: "SELF-CONSUMPTION", price: 22,  export: 0   },
  { time: "02:15", action: "CHARGING",         price: 6,   export: 0   },
  { time: "00:00", action: "SELF-CONSUMPTION", price: 9,   export: 0   },
];

// ── Daily earnings (last 14 days) ─────────────────────────────────────────────

export const mockDailyEarnings: DailyEarnings[] = [
  { date: "May 4",  earnings: 1.82, baseline: 0.45 },
  { date: "May 5",  earnings: 4.21, baseline: 0.52 },
  { date: "May 6",  earnings: 2.95, baseline: 0.48 },
  { date: "May 7",  earnings: 5.60, baseline: 0.61 },
  { date: "May 8",  earnings: 3.10, baseline: 0.44 },
  { date: "May 9",  earnings: 0.90, baseline: 0.39 },
  { date: "May 10", earnings: 1.45, baseline: 0.41 },
  { date: "May 11", earnings: 4.80, baseline: 0.57 },
  { date: "May 12", earnings: 6.22, baseline: 0.63 },
  { date: "May 13", earnings: 3.75, baseline: 0.50 },
  { date: "May 14", earnings: 2.10, baseline: 0.46 },
  { date: "May 15", earnings: 5.30, baseline: 0.58 },
  { date: "May 16", earnings: 4.05, baseline: 0.52 },
  { date: "May 17", earnings: 3.42, baseline: 0.44 },
];

// ── Interval history table (last 20 intervals) ────────────────────────────────

export const mockIntervalHistory: IntervalRecord[] = [
  { timestamp: "2026-05-17 17:30", mode: "SELLING",          feedInPrice: 182, exportKw: 4.8, earnings: 0.146 },
  { timestamp: "2026-05-17 17:25", mode: "SELLING",          feedInPrice: 175, exportKw: 4.8, earnings: 0.140 },
  { timestamp: "2026-05-17 17:20", mode: "SELLING",          feedInPrice: 163, exportKw: 4.8, earnings: 0.130 },
  { timestamp: "2026-05-17 17:15", mode: "SELLING",          feedInPrice: 157, exportKw: 4.8, earnings: 0.126 },
  { timestamp: "2026-05-17 17:10", mode: "SELLING",          feedInPrice: 160, exportKw: 4.8, earnings: 0.128 },
  { timestamp: "2026-05-17 17:05", mode: "HOLDING",          feedInPrice: 140, exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 17:00", mode: "HOLDING",          feedInPrice: 122, exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 14:50", mode: "HOLDING",          feedInPrice: 8,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 14:45", mode: "SELF-CONSUMPTION", feedInPrice: 7,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 12:05", mode: "CHARGING",         feedInPrice: -2,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 12:00", mode: "CHARGING",         feedInPrice: -3,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 11:55", mode: "CHARGING",         feedInPrice: 1,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 10:30", mode: "SELF-CONSUMPTION", feedInPrice: 18,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 10:25", mode: "SELF-CONSUMPTION", feedInPrice: 20,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 07:00", mode: "SELF-CONSUMPTION", feedInPrice: 22,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 06:55", mode: "SELF-CONSUMPTION", feedInPrice: 21,  exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 02:15", mode: "CHARGING",         feedInPrice: 6,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 02:10", mode: "CHARGING",         feedInPrice: 7,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 00:05", mode: "SELF-CONSUMPTION", feedInPrice: 9,   exportKw: 0,   earnings: 0     },
  { timestamp: "2026-05-17 00:00", mode: "SELF-CONSUMPTION", feedInPrice: 8,   exportKw: 0,   earnings: 0     },
];

// ── Config defaults ───────────────────────────────────────────────────────────

export const mockConfig = {
  minExportPrice: 150,     // cents/kWh
  minBatteryReserve: 20,   // %
  maxExportPower: 5,        // kW
  commandDuration: 30,      // minutes
  amberToken: "",
};
