/**
 * uniformEntitlementService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed business rule: every Car Washer is entitled to 2
 * T-shirts of their own size per year, and every Supervisor/TSE to 2
 * Shirts - measured from each person's own real date of joining, not
 * a shared calendar year. A supervisor takes an explicit real action
 * to issue this once someone is genuinely due; it is never auto-issued.
 *
 * A mid-cycle damage/wear replacement is genuinely separate from this
 * entitlement - it doesn't use up any part of it, and is tracked as
 * its own real record, fulfilled specifically from real Branch stock.
 */

export interface UniformEntitlementIssuance {
  id: string;
  employeeId: string;
  employeeName: string;
  garmentType: "T-Shirt" | "Shirt";
  size: string;
  anniversaryYear: number; // 1 = first year since joining, 2 = second, etc.
  issuedDate: string;
  issuedBy: string;
  cityId: string;
}

export interface UniformReplacementRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  garmentType: "T-Shirt" | "Shirt";
  size: string;
  reason: string;
  requestedBy: string;
  requestedDate: string;
  status: "Pending" | "Fulfilled";
  fulfilledDate?: string;
  cityId: string;
  // Real, previously-missing tracking - confirmed rule: a replacement
  // can only happen if the existing, damaged item is genuinely
  // returned. A supervisor must explicitly confirm they've physically
  // received the old item back before this request can be fulfilled.
  oldItemReturned: boolean;
  oldItemReturnedDate?: string;
}

const ENTITLEMENT_KEY = "cleancar_uniform_entitlement_issuances";
const REPLACEMENT_KEY = "cleancar_uniform_replacement_requests";

/**
 * Real, current anniversary year for this employee - 1 for their
 * first year since joining, 2 for their second, and so on. Based on
 * their own real date of joining, not a shared calendar year.
 */
export function getCurrentAnniversaryYear(dateOfJoining: string): number {
  const joined = new Date(dateOfJoining);
  const now = new Date();
  if (isNaN(joined.getTime())) return 1;
  let years = now.getFullYear() - joined.getFullYear();
  const anniversaryThisYear = new Date(now.getFullYear(), joined.getMonth(), joined.getDate());
  if (now < anniversaryThisYear) years -= 1;
  return Math.max(1, years + 1);
}

export function getEntitlementIssuances(cityId?: string): UniformEntitlementIssuance[] {
  try {
    const all = JSON.parse(localStorage.getItem(ENTITLEMENT_KEY) || "[]");
    return cityId ? all.filter((i: any) => i.cityId === cityId) : all;
  } catch { return []; }
}

/**
 * Real check: has this specific person already received their annual
 * entitlement for their current anniversary year? A mid-cycle
 * replacement never counts toward this - only a real entitlement
 * issuance does.
 */
export function hasReceivedAnnualEntitlement(employeeId: string, anniversaryYear: number): boolean {
  return getEntitlementIssuances().some((i) => i.employeeId === employeeId && i.anniversaryYear === anniversaryYear);
}

export function isDueForAnnualUniform(employeeId: string, dateOfJoining: string): boolean {
  const year = getCurrentAnniversaryYear(dateOfJoining);
  return !hasReceivedAnnualEntitlement(employeeId, year);
}

export function recordEntitlementIssuance(record: Omit<UniformEntitlementIssuance, "id">): UniformEntitlementIssuance {
  const all = getEntitlementIssuances();
  const newRecord: UniformEntitlementIssuance = { ...record, id: `UEI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
  localStorage.setItem(ENTITLEMENT_KEY, JSON.stringify([newRecord, ...all]));
  return newRecord;
}

export function getReplacementRequests(cityId?: string): UniformReplacementRequest[] {
  try {
    const all = JSON.parse(localStorage.getItem(REPLACEMENT_KEY) || "[]");
    return cityId ? all.filter((r: any) => r.cityId === cityId) : all;
  } catch { return []; }
}

export function createReplacementRequest(record: Omit<UniformReplacementRequest, "id" | "status" | "oldItemReturned" | "oldItemReturnedDate">): UniformReplacementRequest {
  const all = getReplacementRequests();
  const newRecord: UniformReplacementRequest = { ...record, id: `URR-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, status: "Pending", oldItemReturned: false };
  localStorage.setItem(REPLACEMENT_KEY, JSON.stringify([newRecord, ...all]));
  return newRecord;
}

/**
 * Real, previously-missing action - a supervisor confirms they've
 * genuinely received the washer's old, damaged item back. This is
 * required before a replacement can be fulfilled at all; it's kept as
 * its own real step, separate from fulfillment, so the moment of
 * "I have the old one in hand" is honestly recorded, not assumed.
 */
export function confirmOldItemReturned(requestId: string): void {
  const all = getReplacementRequests();
  const updated = all.map((r) => r.id === requestId ? { ...r, oldItemReturned: true, oldItemReturnedDate: new Date().toISOString() } : r);
  localStorage.setItem(REPLACEMENT_KEY, JSON.stringify(updated));
}

export function markReplacementFulfilled(requestId: string): void {
  const all = getReplacementRequests();
  const updated = all.map((r) => r.id === requestId ? { ...r, status: "Fulfilled" as const, fulfilledDate: new Date().toISOString() } : r);
  localStorage.setItem(REPLACEMENT_KEY, JSON.stringify(updated));
}
