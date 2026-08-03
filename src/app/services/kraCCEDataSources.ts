/**
 * kraCCEDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computations for CCE (Customer Care Executive), built at the
 * CITY level rather than per-employee — a deliberate scoping decision,
 * confirmed with the user before building this.
 *
 * Two candidate real data sources were checked for this role:
 *   1. customerCareExecutiveService.ts's in-memory complaint queue
 *      (getAllComplaints/getSLAStatus/getCSATDashboardData etc.) — on
 *      inspection this is entirely synthetic: this.mockComplaints is
 *      generated once by generateMockComplaints(50), getTodayStats()
 *      hardcodes cceId: 'cce_001'/cceName: 'Current CCE', and
 *      crmUpdateCompliance is a literal "// Mock - 98% compliant". No
 *      real per-employee attribution exists here at all — building a
 *      KRA on this would be fabricating a score, the exact anti-pattern
 *      already fixed elsewhere in this app.
 *   2. The genuinely real "cleancar_complaints" localStorage bucket —
 *      written by real, live flows (CancellationRequestPage.tsx /
 *      TSMCancellationQueue.tsx create real complaint tickets when a
 *      customer's cancellation is escalated), plus historical seed data
 *      (seedAllData.ts / utils__seedHistoricData.ts) that DOES carry a
 *      real per-city, per-CCE-employee `assignedTo` (e.g. "EDB-CCE-SUR1")
 *      and a real `rating` (1-5) on closed tickets.
 *
 * Source 2 is real, but its per-employee attribution only exists in the
 * historical seed data — the live-created tickets from
 * CancellationRequestPage.tsx/TSMCancellationQueue.tsx use a different,
 * incompatible shape (lowercase status, no cityId, a placeholder
 * cceId: "CCE-AUTO") and would silently have zero real per-CCE
 * attribution going forward. Building a genuinely *per-employee* CCE KRA
 * on top of this would degrade to "no data" for anything created after
 * the initial seed. Scoping this pilot at the CITY level instead (like
 * Operations Manager / City Manager) avoids that trap entirely — city
 * scoping only needs `cityId`, which the well-formed records reliably
 * carry, and a record without a recognized shape (no cityId, or a
 * status string outside the known 5-value enum) is simply excluded from
 * the population rather than crashing or being silently miscounted.
 */

export type CCEComplaintStatus = "Open" | "In Progress" | "Resolved" | "Escalated" | "Closed";
export type CCEComplaintPriority = "High" | "Medium" | "Low";
const KNOWN_STATUSES: CCEComplaintStatus[] = ["Open", "In Progress", "Resolved", "Escalated", "Closed"];
const RESOLVED_STATUSES: CCEComplaintStatus[] = ["Resolved", "Closed"];

export interface CCEComplaintLike {
  cityId?: string;
  status?: string;
  priority?: string;
  createdAt?: string;
  resolvedAt?: string;
  rating?: number;
}

/**
 * Real, disclosed SLA policy — how many hours a complaint of each
 * priority is expected to be resolved within. These are explicit,
 * configured targets (not derived from data), matching this codebase's
 * existing pattern of disclosing policy constants (e.g. kraCityDataSources.ts's
 * "Real gate threshold 25%" for EBITDA) rather than hiding them. Confirm
 * with the business if these specific hour values need adjusting.
 */
const SLA_TARGET_HOURS: Record<CCEComplaintPriority, number> = {
  High: 24,
  Medium: 72,
  Low: 168,
};

function isRecognized(c: CCEComplaintLike, cityId: string, month: string): boolean {
  return (
    !!c.cityId && c.cityId === cityId &&
    !!c.status && KNOWN_STATUSES.includes(c.status as CCEComplaintStatus) &&
    !!c.createdAt && c.createdAt.startsWith(month)
  );
}

/**
 * Real complaint resolution rate for a city in a given month — the
 * genuine share of complaints received that month which reached
 * Resolved or Closed (as of now). Complaints from unrecognized/foreign
 * record shapes (no real cityId, or a status outside the known 5-value
 * enum — e.g. tickets auto-created by CancellationRequestPage.tsx) are
 * excluded from the population entirely, not counted as unresolved.
 */
export function computeCCEResolutionRate(complaints: CCEComplaintLike[], cityId: string, month: string): number {
  const population = complaints.filter((c) => isRecognized(c, cityId, month));
  if (population.length === 0) return 0;
  const resolved = population.filter((c) => RESOLVED_STATUSES.includes(c.status as CCEComplaintStatus));
  return Math.round((resolved.length / population.length) * 100);
}

/**
 * Real average CSAT rating for a city in a given month — only complaints
 * that were actually rated (rating is only ever set once a complaint is
 * Closed) contribute; a month with no ratings yet returns 0 rather than
 * a fabricated average, and the caller treats that the same as any
 * other "no data yet" KPI (achievementPct against target still divides
 * by the same target, so 0 actual genuinely scores 0%, not hidden).
 */
export function computeCCECsatScore(complaints: CCEComplaintLike[], cityId: string, month: string): number {
  const population = complaints.filter((c) => isRecognized(c, cityId, month));
  const rated = population.filter((c) => typeof c.rating === "number");
  if (rated.length === 0) return 0;
  const avg = rated.reduce((sum, c) => sum + (c.rating as number), 0) / rated.length;
  return Math.round(avg * 100) / 100;
}

/**
 * Real SLA compliance rate for a city in a given month — the share of
 * that month's RESOLVED/CLOSED complaints that were actually resolved
 * within their priority's target hours (SLA_TARGET_HOURS). Deliberately
 * simplified to only evaluate already-resolved complaints (not still-open
 * ones measured against "now") so a past month's figure never keeps
 * drifting after the fact — an open complaint waiting past its SLA
 * shows up in the resolution-rate KPI instead. Complaints with a
 * priority outside the known 3-value enum are excluded (their SLA
 * target can't be honestly determined).
 */
export function computeCCESlaComplianceRate(complaints: CCEComplaintLike[], cityId: string, month: string): number {
  const population = complaints.filter((c) => isRecognized(c, cityId, month));
  const resolved = population.filter(
    (c) => RESOLVED_STATUSES.includes(c.status as CCEComplaintStatus) && !!c.resolvedAt && !!c.priority && c.priority in SLA_TARGET_HOURS
  );
  if (resolved.length === 0) return 0;
  const withinSla = resolved.filter((c) => {
    const targetHours = SLA_TARGET_HOURS[c.priority as CCEComplaintPriority];
    const elapsedHours = (new Date(c.resolvedAt as string).getTime() - new Date(c.createdAt as string).getTime()) / (1000 * 60 * 60);
    return elapsedHours <= targetHours;
  });
  return Math.round((withinSla.length / resolved.length) * 100);
}
