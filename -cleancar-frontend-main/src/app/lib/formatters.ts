/**
 * Formatting Utilities - SINGLE SOURCE OF TRUTH
 *
 * ⚠️ CRITICAL: DO NOT CREATE DUPLICATE FORMATTERS ⚠️
 *
 * Use these functions ONLY. Do not create new formatCurrency functions.
 * If you need a different format, add it here and import from this file.
 *
 * NO DUPLICATION - single source of truth for all formatting
 */

// ==================== CURRENCY FORMATTING ====================

/**
 * Format currency with options for compact or full display
 *
 * @param amount - Amount in rupees (handles null/undefined as 0)
 * @param options - Formatting options
 * @param options.compact - Use compact format (₹1.2L) vs full (₹1,23,456)
 * @param options.decimals - Number of decimal places (default: auto based on amount)
 * @param options.intl - Use Intl.NumberFormat for full format
 *
 * @returns Formatted string
 *
 * @example
 * formatCurrency(123456) // "₹1.2L"
 * formatCurrency(123456, { compact: false }) // "₹1,23,456"
 * formatCurrency(50.5, { decimals: 2 }) // "₹50.50"
 */
export function formatCurrency(
  amount: number | null | undefined,
  options: {
    compact?: boolean;
    decimals?: number;
    intl?: boolean;
  } = {}
): string {
  // Handle null/undefined
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0;
  }

  const { compact = true, decimals, intl = false } = options;

  // Use Intl.NumberFormat for precise Indian format (used in invoices/reports)
  if (intl && !compact) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: decimals ?? 0,
      maximumFractionDigits: decimals ?? 0,
    }).format(amount);
  }

  // Compact format (default) - for dashboards and summary views
  if (compact) {
    if (amount >= 10000000) {
      // 1 Crore or more
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      // 1 Lakh or more
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      // 1 Thousand or more
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      const decimalPlaces = decimals ?? (amount < 1000 ? 2 : 0);
      return `₹${amount.toFixed(decimalPlaces)}`;
    }
  }

  // Full format with Indian comma notation - for detailed views
  const decimalPlaces = decimals ?? (amount < 1000 ? 2 : 0);
  const fixed = amount.toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split(".");

  // Indian number format: X,XX,XXX (last 3 digits, then groups of 2)
  const lastThree = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);

  let formatted = "";
  if (otherDigits) {
    formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
  } else {
    formatted = lastThree;
  }

  return decimalPart ? `₹${formatted}.${decimalPart}` : `₹${formatted}`;
}

/**
 * Format currency with full precision (no abbreviation)
 * @param amount - Amount in rupees
 * @returns Formatted string with commas (e.g., "₹1,23,456")
 */
export function formatCurrencyFull(amount: number | null | undefined): string {
  return formatCurrency(amount, { compact: false });
}

/**
 * Format amount in Lakhs (for financial reports)
 * @param amount - Amount in rupees
 * @returns Formatted string (e.g., "₹12.5L")
 */
export function formatLakhs(amount: number): string {
  return `₹${(amount / 100000).toFixed(1)}L`;
}

/**
 * Format amount in Crores (for large numbers)
 * @param amount - Amount in rupees
 * @returns Formatted string (e.g., "₹1.5Cr")
 */
export function formatCrores(amount: number): string {
  return `₹${(amount / 10000000).toFixed(2)}Cr`;
}

// ==================== NUMBER FORMATTING ====================

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted string (e.g., "1,234")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN");
}

/**
 * Format percentage
 * @param value - Percentage value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "45.5%")
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format decimal as percentage (0.455 -> "45.5%")
 * @param decimal - Decimal value (0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string
 */
export function formatDecimalAsPercentage(decimal: number, decimals: number = 1): string {
  return `${(decimal * 100).toFixed(decimals)}%`;
}

// ==================== DATE FORMATTING ====================

/**
 * Format date in DD/MM/YYYY format
 * @param date - Date string or Date object
 * @returns Formatted string (e.g., "20/04/2026")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format date in DD MMM YYYY format
 * @param date - Date string or Date object
 * @returns Formatted string (e.g., "20 Apr 2026")
 */
export function formatDateLong(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format time in HH:MM format
 * @param date - Date string or Date object
 * @returns Formatted string (e.g., "14:30")
 */
export function formatTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Format date and time
 * @param date - Date string or Date object
 * @returns Formatted string (e.g., "20/04/2026 14:30")
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

// ==================== DURATION FORMATTING ====================

/**
 * Format duration in hours and minutes
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m")
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Format phone number in Indian format
 * @param phone - Phone number string
 * @returns Formatted string (e.g., "+91 98765 43210")
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, "");

  // Check if it's an Indian number (10 digits)
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  } else if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }

  return phone; // Return as-is if not recognized
}

/**
 * Capitalize first letter of each word
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeWords(text: string): string {
  return text
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format city name (convert to title case)
 * @param city - City name
 * @returns Formatted city name
 */
export function formatCityName(city: string): string {
  return capitalizeWords(city);
}

// ─── Additional Financial Formatters ─────────────────────────────────────────

/** Round a financial amount to nearest rupee */
export const roundAmount = (amount: number): number => Math.round(amount);

/** Format a percentage to 1 decimal place consistently */
export const formatPct = (pct: number): string =>
  `${(Math.round(pct * 10) / 10).toFixed(1)}%`;

/** Format EBITDA as amount + margin */
export const formatEBITDA = (amount: number, margin: number): string =>
  `${formatCurrency(amount, { compact: true })} (${formatPct ? formatPct(margin) : margin.toFixed(1) + '%'})`;

/** Format a financial growth % with colour class */
export const formatGrowth = (pct: number): { text: string; cls: string } => ({
  text: `${pct >= 0 ? '+' : ''}${(Math.round(pct * 10) / 10).toFixed(1)}%`,
  cls: pct >= 0 ? 'text-green-600' : 'text-red-600',
});
