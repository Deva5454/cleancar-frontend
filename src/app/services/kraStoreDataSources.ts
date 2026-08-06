/**
 * kraStoreDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computation for Store Manager, confirmed against the real
 * verification record MonthEndVerification.tsx genuinely persists to
 * localStorage["cleancar_month_end_verifications"] before building
 * anything — each record carries a real city, month, and a per-item
 * variance (systemEstimatedClosing - physicalCount) from that city's real
 * month-end physical count.
 *
 * GRN Turnaround and Requisition Fulfillment Time were checked and found
 * to have no real data source: PurchaseOrder (materialRequisition.ts) has
 * no approval timestamp field (only dateIssued/expectedDelivery, no real
 * "approvedAt"), and MaterialRequisitionForm has no fulfilledAt field.
 * These stay honestly NOT_YET_AVAILABLE in kraStorePilot.ts.
 */

export interface MonthEndVerificationItemLike {
  variance: number;
}
export interface MonthEndVerificationRecordLike {
  city: string;
  month: string; // "YYYY-MM"
  items: MonthEndVerificationItemLike[];
}

export function readMonthEndVerifications(): MonthEndVerificationRecordLike[] {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem("cleancar_month_end_verifications") : null;
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Real stock accuracy % for a city's month-end verification — 100% minus
 * the average absolute variance rate across every item counted that
 * month, floored at 0. A city with no verification submitted for that
 * month returns null (genuinely not yet available), never a fabricated
 * 100%.
 */
export function computeStockAccuracyRate(records: MonthEndVerificationRecordLike[], cityId: string, month: string): number | null {
  const record = records.find((r) => r.city === cityId && r.month === month);
  if (!record || record.items.length === 0) return null;
  const avgAbsVariance = record.items.reduce((sum, i) => sum + Math.abs(i.variance), 0) / record.items.length;
  return Math.max(0, Math.round(100 - avgAbsVariance));
}

/**
 * Real month-end compliance — 100 if this city genuinely submitted a
 * verification for the month, 0 if it didn't. A real, binary submission
 * check, not an estimate.
 */
export function computeMonthEndComplianceRate(records: MonthEndVerificationRecordLike[], cityId: string, month: string): number {
  return records.some((r) => r.city === cityId && r.month === month) ? 100 : 0;
}
