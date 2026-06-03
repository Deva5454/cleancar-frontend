// Formatting utilities for CleanCar 360° ERP

/**
 * ⚠️ DEPRECATED: Use lib/formatters.ts instead
 * This file is kept for backward compatibility only
 * New code should import from: import { formatCurrency } from "../lib/formatters"
 */

/**
 * Format currency in Indian format with proper comma separation
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 2 for per-wash, 0 for totals)
 */
export function formatIndianCurrency(amount: number, decimals?: number): string {
  // Determine decimal places based on amount
  let decimalPlaces = decimals;
  if (decimalPlaces === undefined) {
    // Per-wash costs (< ₹1000) get 2 decimals, totals get 0 decimals
    decimalPlaces = amount < 1000 ? 2 : 0;
  }
  
  const fixed = amount.toFixed(decimalPlaces);
  const [integerPart, decimalPart] = fixed.split('.');
  
  // Indian number format: X,XX,XXX
  // Last 3 digits, then groups of 2
  const lastThree = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  
  let formatted = '';
  if (otherDigits) {
    // Add commas every 2 digits for the part before last 3 digits
    formatted = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  } else {
    formatted = lastThree;
  }
  
  return decimalPart ? `${formatted}.${decimalPart}` : formatted;
}

/**
 * Format currency with ₹ symbol
 */
export function formatCurrency(amount: number, decimals?: number): string {
  return `₹${formatIndianCurrency(amount, decimals)}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date in Indian format (DD MMM YYYY)
 */
export function formatIndianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format datetime with time
 */
export function formatIndianDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dateStr = formatIndianDate(d);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Check if a date is more than N months in the past
 */
export function isMoreThanMonthsAgo(date: Date | string, months: number): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const monthsAgo = new Date(now);
  monthsAgo.setMonth(monthsAgo.getMonth() - months);
  return d < monthsAgo;
}

/**
 * Validate backdating (max 3 months without Super Admin approval)
 */
export function validateBackdating(date: Date | string, isSuperAdmin: boolean = false): {
  isValid: boolean;
  message?: string;
} {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (d > new Date()) {
    return {
      isValid: false,
      message: 'Cannot set future dates',
    };
  }
  
  if (isMoreThanMonthsAgo(d, 3) && !isSuperAdmin) {
    return {
      isValid: false,
      message: 'Cannot backdate more than 3 months without Super Admin approval. This prevents retroactive manipulation of historical cost figures.',
    };
  }
  
  return { isValid: true };
}
