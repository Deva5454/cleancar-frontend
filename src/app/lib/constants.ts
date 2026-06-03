/**
 * Application Constants
 *
 * Centralized constants to avoid duplication
 * DO NOT hardcode values in components - import from here
 */

// ==================== CHART COLORS ====================

/**
 * Standard chart color palette
 * Use for consistent data visualization across all components
 */
export const CHART_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Orange
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
] as const;

/**
 * Role-based colors
 */
export const ROLE_COLORS = {
  washer: "#3b82f6",      // Blue
  supervisor: "#10b981",  // Green
  manager: "#f59e0b",     // Orange
  admin: "#8b5cf6",       // Purple
  incentive: "#ec4899",   // Pink
} as const;

/**
 * Status colors
 */
export const STATUS_COLORS = {
  success: "#10b981",     // Green
  warning: "#f59e0b",     // Orange
  error: "#ef4444",       // Red
  info: "#3b82f6",        // Blue
  pending: "#6b7280",     // Gray
} as const;

// ==================== CITIES ====================

/**
 * Application cities
 * All city data should reference these
 * MUST match CityContext configuration
 */
export const CITIES = ["SURAT", "MUMBAI", "AHMEDABAD"] as const;

export type City = typeof CITIES[number];

export const CITY_LABELS: Record<City, string> = {
  SURAT: "Surat",
  MUMBAI: "Mumbai",
  AHMEDABAD: "Ahmedabad",
};

// ==================== CLUSTERS ====================

/**
 * Clusters (logical service areas/operational zones)
 * NOT pin codes - these are operational groupings
 */
export const CLUSTERS = {
  SURAT: ["ADAJAN", "VESU", "RANDER", "KATARGAM"],
  MUMBAI: ["ANDHERI", "BORIVALI", "MALAD", "POWAI"],
  AHMEDABAD: ["SATELLITE", "MANINAGAR", "VASTRAPUR", "BOPAL"],
} as const;

export type ClusterId =
  | typeof CLUSTERS.SURAT[number]
  | typeof CLUSTERS.MUMBAI[number]
  | typeof CLUSTERS.AHMEDABAD[number];

export const CLUSTER_LABELS: Record<ClusterId, string> = {
  // Surat
  ADAJAN: "Adajan",
  VESU: "Vesu",
  RANDER: "Rander",
  KATARGAM: "Katargam",
  // Mumbai
  ANDHERI: "Andheri",
  BORIVALI: "Borivali",
  MALAD: "Malad",
  POWAI: "Powai",
  // Ahmedabad
  SATELLITE: "Satellite",
  MANINAGAR: "Maninagar",
  VASTRAPUR: "Vastrapur",
  BOPAL: "Bopal",
};

// ==================== SPACING ====================

/**
 * Standard spacing scale (in rem)
 * Use for consistent spacing across components
 */
export const SPACING = {
  xs: "0.25rem",    // 4px
  sm: "0.5rem",     // 8px
  md: "1rem",       // 16px
  lg: "1.5rem",     // 24px
  xl: "2rem",       // 32px
  "2xl": "3rem",    // 48px
  "3xl": "4rem",    // 64px
} as const;

/**
 * Standard gaps for grid/flex layouts
 */
export const GAPS = {
  sm: "gap-2",      // 8px
  md: "gap-4",      // 16px
  lg: "gap-6",      // 24px
  xl: "gap-8",      // 32px
} as const;

// ==================== TYPOGRAPHY ====================

/**
 * Standard font sizes
 */
export const FONT_SIZES = {
  xs: "text-xs",      // 12px
  sm: "text-sm",      // 14px
  base: "text-base",  // 16px
  lg: "text-lg",      // 18px
  xl: "text-xl",      // 20px
  "2xl": "text-2xl",  // 24px
  "3xl": "text-3xl",  // 30px
} as const;

/**
 * Standard font weights
 */
export const FONT_WEIGHTS = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
} as const;

// ==================== ENGINE LABELS ====================

/**
 * Engine display names
 */
export const ENGINE_LABELS = {
  payrollEngine: "Payroll Engine",
  incentiveEngine: "Incentive Engine",
  financeEngine: "Finance Engine",
  analyticsEngine: "Analytics Engine",
  operationsEngine: "Operations Engine",
  subscriptionEngine: "Subscription Engine",
  inventoryEngine: "Inventory Engine",
  hrEngine: "HR Engine",
} as const;

// ==================== COMMON THRESHOLDS ====================

/**
 * Business metric thresholds
 */
export const THRESHOLDS = {
  refundRate: {
    healthy: 7,     // < 7% is healthy
    warning: 12,    // 7-12% needs monitoring
    critical: 12,   // > 12% is critical
  },
  efficiency: {
    excellent: 90,  // >= 90% is excellent
    good: 80,       // 80-90% is good
    poor: 80,       // < 80% is poor
  },
  washesPerWasher: {
    target: 180,    // Monthly target
    minimum: 150,   // Minimum acceptable
  },
  labourCostPerWash: {
    target: 150,    // ₹150 per wash
    maximum: 160,   // Maximum acceptable
  },
} as const;

// ==================== DATE FORMATS ====================

/**
 * Standard date format patterns
 */
export const DATE_FORMATS = {
  short: "DD/MM/YYYY",
  long: "DD MMM YYYY",
  full: "DD MMMM YYYY",
  time: "HH:mm",
  datetime: "DD/MM/YYYY HH:mm",
} as const;

// ==================== PAGINATION ====================

/**
 * Standard pagination sizes
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

// ==================== ICONS ====================

/**
 * Standard icon sizes
 */
export const ICON_SIZES = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
  xl: "w-8 h-8",
  "2xl": "w-12 h-12",
} as const;
