export type DatePreset =
  | "last7"
  | "last30"
  | "lastMonth"
  | "thisMonth"
  | "mtd"
  | "custom";

export interface DateRange {
  from: string;
  to: string;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function getDateRangeForPreset(preset: DatePreset): DateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  switch (preset) {
    case "last7": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from: toDateString(from), to: toDateString(today) };
    }
    case "last30": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from: toDateString(from), to: toDateString(today) };
    }
    case "lastMonth": {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toDateString(from), to: toDateString(to) };
    }
    case "thisMonth": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      const to = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return { from: toDateString(from), to: toDateString(to) };
    }
    case "mtd": {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: toDateString(from), to: toDateString(today) };
    }
    case "custom":
    default:
      return { from: "", to: "" };
  }
}

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "last7", label: "Last 7 Days" },
  { id: "last30", label: "Last 30 Days" },
  { id: "lastMonth", label: "Last Month" },
  { id: "thisMonth", label: "This Month" },
  { id: "mtd", label: "Month To Date" },
  { id: "custom", label: "Custom Range" },
];

export function monthToDateStart(): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}
