import type { Month, TimeWindow } from "./energy-rules-config";

export interface DnspPlan {
  id: string;
  name: string;
  description: string;
  demandWindow: TimeWindow;
  peakMonths: Month[];
  offPeakMonths: Month[];
}

export interface Dnsp {
  id: string;
  name: string;
  state: string;
  plans: DnspPlan[];
}

export const DNSP_LIST: Dnsp[] = [
  {
    id: "ausgrid",
    name: "Ausgrid",
    state: "NSW",
    plans: [
      {
        id: "ea025",
        name: "EA025 – Residential Demand",
        description:
          "Ausgrid measures your highest 30-minute grid import during the demand window each month. The charge is applied per kW of that peak — so a single unguarded evening in summer or winter can add significantly to your bill.",
        demandWindow: { startHour: 15, startMinute: 0, endHour: 21, endMinute: 0 },
        peakMonths: [11, 12, 1, 2, 3, 6, 7, 8],
        offPeakMonths: [4, 5, 9, 10],
      },
    ],
  },
  {
    id: "endeavour",
    name: "Endeavour Energy",
    state: "NSW",
    plans: [
      {
        id: "residential-demand",
        name: "Residential Demand",
        description:
          "Endeavour Energy's demand tariff applies during summer peak months only. The demand charge is based on your highest 30-minute import during the demand window.",
        demandWindow: { startHour: 15, startMinute: 0, endHour: 21, endMinute: 0 },
        peakMonths: [11, 12, 1, 2, 3],
        offPeakMonths: [4, 5, 6, 7, 8, 9, 10],
      },
    ],
  },
  {
    id: "ausnet",
    name: "AusNet Services",
    state: "VIC",
    plans: [
      {
        id: "residential-demand",
        name: "Residential Demand",
        description:
          "AusNet's demand charge applies during Victorian summer. Peak demand is recorded as your highest 30-minute import in the demand window across the month.",
        demandWindow: { startHour: 15, startMinute: 0, endHour: 21, endMinute: 0 },
        peakMonths: [12, 1, 2],
        offPeakMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11],
      },
    ],
  },
  {
    id: "sapn",
    name: "SA Power Networks",
    state: "SA",
    plans: [
      {
        id: "residential-demand",
        name: "Residential Demand",
        description:
          "SA Power Networks applies its demand charge during South Australian summer months. The window starts slightly later in the afternoon than eastern states.",
        demandWindow: { startHour: 16, startMinute: 0, endHour: 21, endMinute: 0 },
        peakMonths: [11, 12, 1, 2, 3],
        offPeakMonths: [4, 5, 6, 7, 8, 9, 10],
      },
    ],
  },
  {
    id: "energex",
    name: "Energex",
    state: "QLD",
    plans: [
      {
        id: "tariff-12a",
        name: "Tariff 12A – Demand",
        description:
          "Energex's residential demand tariff peaks during Queensland winter, when heating loads are higher. The demand window is shorter than eastern states.",
        demandWindow: { startHour: 15, startMinute: 0, endHour: 20, endMinute: 0 },
        peakMonths: [6, 7, 8],
        offPeakMonths: [1, 2, 3, 4, 5, 9, 10, 11, 12],
      },
    ],
  },
];

export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
