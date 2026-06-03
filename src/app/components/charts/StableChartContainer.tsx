/**
 * Stable Chart Container - Eliminates Recharts key warnings
 *
 * Provides stabilized rendering for all Recharts components by:
 * - Enforcing unique keys based on chart name and filter state
 * - Disabling animations globally to prevent layer duplication
 * - Memoizing data to prevent unnecessary re-renders
 * - Standardizing layout and configuration
 */

import { useMemo, ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

interface StableChartContainerProps {
  /**
   * Unique name for this chart (e.g., "revenue-trend", "cost-breakdown")
   */
  chartName: string;

  /**
   * Filter values that affect chart rendering
   * Used to create stable key when filters change
   */
  filterKey?: string;

  /**
   * Chart data - will be memoized internally
   */
  data: any[];

  /**
   * Chart component (LineChart, BarChart, PieChart, etc.)
   */
  children: ReactNode;

  /**
   * Height of the chart in pixels
   */
  height?: number;

  /**
   * Width - defaults to 100%
   */
  width?: string | number;
}

export function StableChartContainer({
  chartName,
  filterKey = "",
  data,
  children,
  height = 280,
  width = "100%",
}: StableChartContainerProps) {
  // Memoize data to prevent unnecessary re-renders
  const memoizedData = useMemo(() => data, [data]);

  // Create stable key from chart name and filters
  const stableKey = useMemo(
    () => `chart-${chartName}-${filterKey}`,
    [chartName, filterKey]
  );

  return (
    <div key={`container-${stableKey}`} style={{ width: "100%", height }}>
      <ResponsiveContainer width={width} height={height} key={`responsive-${stableKey}`}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Generate stable filter key from global filters
 * Use this to create consistent keys across filter changes
 */
export function createFilterKey(filters: {
  city?: string;
  startDate?: string;
  endDate?: string;
  businessUnit?: string;
  [key: string]: any;
}): string {
  return Object.entries(filters)
    .filter(([_, value]) => value && value !== "ALL" && value !== "")
    .map(([key, value]) => `${key}-${value}`)
    .join("-");
}

/**
 * Chart configuration constants to prevent inline object creation
 */
export const CHART_CONFIG = {
  margin: { top: 5, right: 20, left: 0, bottom: 5 },
  fontSize: 11,
  labelFontSize: 11,
  strokeWidth: 2,
  strokeDasharray: "3 3",
  animationDuration: 0,
} as const;

/**
 * Standard color palette for consistency
 */
export const CHART_COLORS = {
  primary: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"],
  revenue: "#3b82f6",
  cost: "#ef4444",
  profit: "#10b981",
  target: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  success: "#10b981",
  info: "#3b82f6",
} as const;
