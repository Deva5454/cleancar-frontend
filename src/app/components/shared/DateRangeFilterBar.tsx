/**
 * DateRangeFilterBar.tsx — shared Today / Yesterday / Last 7 Days /
 * Last Month / Custom Range filter, used identically by the washer's own
 * job history, the supervisor's per-washer job history, and the city
 * manager's all-washers job history, so the three screens can never drift
 * apart on what these presets mean.
 */
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";

export type DateRangePreset = "all" | "today" | "yesterday" | "last7" | "lastmonth" | "custom";

export interface DateRange {
  from: string; // ISO yyyy-mm-dd, inclusive
  to: string;   // ISO yyyy-mm-dd, inclusive
}

const toISO = (d: Date) => d.toISOString().split("T")[0];

/** Returns null for "all" (no date narrowing) or an incomplete custom range. */
export function computeDateRange(preset: DateRangePreset, customFrom: string, customTo: string): DateRange | null {
  const today = new Date();
  switch (preset) {
    case "today": {
      const t = toISO(today);
      return { from: t, to: t };
    }
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const t = toISO(y);
      return { from: t, to: t };
    }
    case "last7": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { from: toISO(start), to: toISO(today) };
    }
    case "lastmonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: toISO(start), to: toISO(end) };
    }
    case "custom":
      return customFrom && customTo ? { from: customFrom, to: customTo } : null;
    case "all":
    default:
      return null;
  }
}

/** True if the given ISO-ish date string falls within the range (inclusive), or true if range is null. */
export function isWithinDateRange(dateStr: string | undefined, range: DateRange | null): boolean {
  if (!range) return true;
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= range.from && d <= range.to;
}

export function DateRangeFilterBar({
  preset, onPresetChange, customFrom, customTo, onCustomFromChange, onCustomToChange,
}: {
  preset: DateRangePreset;
  onPresetChange: (p: DateRangePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (v: string) => void;
  onCustomToChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={preset} onValueChange={(v) => onPresetChange(v as DateRangePreset)}>
        <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="yesterday">Yesterday</SelectItem>
          <SelectItem value="last7">Last 7 Days</SelectItem>
          <SelectItem value="lastmonth">Last Month</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>
      {preset === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="border rounded px-2 py-1.5 text-sm"
          />
        </>
      )}
    </div>
  );
}
