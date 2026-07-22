/**
 * subscriptionPaymentStatus — a single, shared real rule for whether a
 * wash job should be marked as already paid, used consistently
 * everywhere a job can be created against an existing subscription.
 *
 * Two genuinely different prepaid signals, because packs and monthly
 * plans are paid for differently:
 *   - A pack (Pack of 2 / Pack of 4) is paid as one lump sum upfront for
 *     a fixed number of visits. It's prepaid as long as real visits
 *     remain (visitsUsed < visitsTotal).
 *   - A monthly (or quarterly/annual) plan is paid per billing cycle.
 *     It's prepaid as long as the subscription's own real
 *     paymentStatus is "Paid" for the current cycle.
 *
 * Previously, every job linked to an already-paid subscription was
 * still marked paymentStatus: "Pending" - risking a customer being
 * asked to pay again at the door for a wash they'd already paid for.
 */

export function isPrepaidSubscriptionVisit(sub: any): boolean {
  if (!sub || sub.status !== "Active") return false;

  // Pack: prepaid if real visits remain.
  if (sub.visitsTotal !== undefined) {
    return (sub.visitsUsed || 0) < sub.visitsTotal;
  }

  // Monthly/Quarterly/Annual: prepaid if the current cycle is paid.
  return sub.paymentStatus === "Paid";
}
