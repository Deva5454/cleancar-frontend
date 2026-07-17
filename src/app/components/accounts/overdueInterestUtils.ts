/**
 * overdueInterest — real interest calculation on overdue balances.
 *
 * Simple interest, computed daily from the real due date: amount ×
 * (annual rate / 100) × (days overdue / 365). Only genuinely overdue
 * amounts accrue interest — nothing not-yet-due ever does.
 *
 * The rate is a real, adjustable input, not hardcoded — different
 * businesses (and different vendor/customer agreements) use different
 * rates, so this is shown as a live setting on-screen rather than baked
 * into the code.
 */

export function daysOverdue(dueDate: string): number {
  const days = Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000);
  return Math.max(0, days);
}

export function calculateOverdueInterest(
  amount: number,
  dueDate: string,
  annualRatePercent: number
): number {
  const days = daysOverdue(dueDate);
  if (days === 0 || annualRatePercent <= 0) return 0;
  return (amount * (annualRatePercent / 100) * days) / 365;
}

// A reasonable starting default for Indian B2B overdue terms — not a
// business-confirmed figure, just a sensible number to start from.
// Shown and editable on-screen, never silently assumed.
export const DEFAULT_OVERDUE_INTEREST_RATE = 18;
