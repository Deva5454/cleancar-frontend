/**
 * attendanceRegularizationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed workflow: an employee submits a regularization request
 * for a genuine mispunch (missing IN, OUT, or both) - never a direct HR
 * edit. It routes through a real, 3-stage approval chain:
 *   Reporting Manager → City Manager → HR (final approval + record update)
 * Every stage can reject, and every rejection requires a real, mandatory
 * comment - never a silent reject.
 *
 * A rejected request (at any of the 3 stages) can be resubmitted, tagged
 * and linked back to the original so a reviewer can see it was rejected
 * once before, and the employee's resubmission comment is also mandatory.
 *
 * If a request is still unresolved when payroll runs for that period, it
 * auto-rejects rather than blocking payroll - confirmed, real policy. This
 * fires both when payroll is generated (PayrollRun.tsx) and again, as the
 * real enforcement point, when HR approves that payroll run
 * (PayrollReviewApproval.tsx) - so nothing can slip through between the
 * two if HR approves a run generated before this fix shipped.
 *
 * Every request keeps a real, append-only history of every stage's
 * action (who, what, when, why) - not just a flat "current status" -
 * so the employee and everyone in the approval chain can see the full
 * real trail, not just where things stand right now.
 *
 * The real limits - how many days back a request can cover, and how many
 * requests one employee can submit per month - are HR-configurable, not
 * hardcoded, and apply the same way to everyone.
 */

import { DataService } from "./DataService";
import { findCityManagerForCity } from "./orgResolution";

export type RegularizationStatus =
  | "Pending Manager"
  | "Manager Rejected"
  | "Pending City Manager"
  | "City Manager Rejected"
  | "Pending HR"
  | "HR Rejected"
  | "HR Applied"
  | "Auto-Rejected";

export type RegularizationHistoryStage = "Employee" | "Manager" | "City Manager" | "HR" | "System";
export type RegularizationHistoryAction = "Submitted" | "Resubmitted" | "Approved" | "Rejected" | "Applied" | "Auto-Rejected";

export interface RegularizationHistoryEntry {
  stage: RegularizationHistoryStage;
  action: RegularizationHistoryAction;
  actorId?: string;
  actorName?: string;
  comment?: string;
  at: string;
}

export interface RegularizationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  cityId: string;
  date: string; // the real attendance date being regularized, YYYY-MM-DD
  punchType: "IN" | "OUT" | "BOTH";
  requestedCheckInTime?: string; // HH:MM
  requestedCheckOutTime?: string; // HH:MM
  reason: string;
  status: RegularizationStatus;
  reportingManagerId: string;
  reportingManagerName?: string;
  managerComment?: string;
  managerActionBy?: string;
  managerActionAt?: string;
  // Real city manager stage - the employee's city's designated City
  // Manager, resolved at submission time (not organizationHierarchyService,
  // whose seed cityManagerId values like "CM-SURAT-001" don't correspond
  // to any real employee record — resolved instead against the real
  // employee database by designation + cityId).
  cityManagerId?: string;
  cityManagerName?: string;
  cmComment?: string;
  cmActionBy?: string;
  cmActionAt?: string;
  hrComment?: string;
  hrAppliedBy?: string;
  hrAppliedAt?: string;
  isResubmission: boolean;
  originalRequestId?: string;
  resubmissionComment?: string;
  submittedAt: string;
  history: RegularizationHistoryEntry[];
}

const REJECTED_STATUSES: RegularizationStatus[] = ["Manager Rejected", "City Manager Rejected", "HR Rejected"];
const PENDING_STATUSES: RegularizationStatus[] = ["Pending Manager", "Pending City Manager", "Pending HR"];

export interface RegularizationPolicy {
  maxDaysBack: number; // how many real days back a request can cover
  maxRequestsPerMonth: number; // per-employee real cap
}

const REQUESTS_KEY = "cleancar_regularization_requests";
const POLICY_KEY = "cleancar_regularization_policy";

const DEFAULT_POLICY: RegularizationPolicy = {
  maxDaysBack: 7,
  maxRequestsPerMonth: 3,
};

export function getRegularizationPolicy(): RegularizationPolicy {
  try {
    const raw = localStorage.getItem(POLICY_KEY);
    return raw ? { ...DEFAULT_POLICY, ...JSON.parse(raw) } : DEFAULT_POLICY;
  } catch {
    return DEFAULT_POLICY;
  }
}

/**
 * Real, previously-missing provision - HR can set the real days-back and
 * monthly-cap limits, applied the same way to every employee.
 */
export function setRegularizationPolicy(policy: Partial<RegularizationPolicy>): void {
  const current = getRegularizationPolicy();
  localStorage.setItem(POLICY_KEY, JSON.stringify({ ...current, ...policy }));
}

export function getAllRegularizationRequests(cityId?: string): RegularizationRequest[] {
  try {
    const all = JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]");
    // Real fix (learned from a real production crash in a similar spot):
    // requests saved before the history field existed won't have it —
    // normalize to an empty array rather than letting every .map/.filter
    // over req.history crash the whole screen on old data.
    const normalized = all.map((r: any) => (r && Array.isArray(r.history)) ? r : { ...r, history: [] });
    return cityId ? normalized.filter((r: any) => r.cityId === cityId) : normalized;
  } catch {
    return [];
  }
}

function saveAll(requests: RegularizationRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

/**
 * Real, genuine eligibility check before a request can even be created -
 * both real limits come from the HR-configurable policy, not hardcoded.
 */
export function checkRegularizationEligibility(
  employeeId: string,
  date: string
): { eligible: boolean; reason?: string } {
  const policy = getRegularizationPolicy();

  const daysAgo = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  if (daysAgo > policy.maxDaysBack) {
    return { eligible: false, reason: `Requests can only cover the last ${policy.maxDaysBack} real days` };
  }
  if (daysAgo < 0) {
    return { eligible: false, reason: "Cannot regularize a future date" };
  }

  const thisMonth = date.slice(0, 7);
  const monthCount = getAllRegularizationRequests().filter(
    (r) => r.employeeId === employeeId && r.submittedAt.slice(0, 7) === thisMonth && !r.isResubmission
  ).length;
  if (monthCount >= policy.maxRequestsPerMonth) {
    return { eligible: false, reason: `Already submitted ${policy.maxRequestsPerMonth} real requests this month` };
  }

  return { eligible: true };
}

export function submitRegularizationRequest(input: {
  employeeId: string;
  employeeName: string;
  cityId: string;
  date: string;
  punchType: "IN" | "OUT" | "BOTH";
  requestedCheckInTime?: string;
  requestedCheckOutTime?: string;
  reason: string;
  reportingManagerId: string;
  reportingManagerName?: string;
}): { success: boolean; request?: RegularizationRequest; error?: string } {
  const eligibility = checkRegularizationEligibility(input.employeeId, input.date);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  if (!input.reason.trim()) {
    return { success: false, error: "A reason is required" };
  }

  const cityManager = findCityManagerForCity(input.cityId);
  const submittedAt = new Date().toISOString();
  const request: RegularizationRequest = {
    id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "Pending Manager",
    cityManagerId: cityManager?.id,
    cityManagerName: cityManager?.name,
    isResubmission: false,
    submittedAt,
    history: [{ stage: "Employee", action: "Submitted", actorId: input.employeeId, actorName: input.employeeName, at: submittedAt }],
  };

  const all = getAllRegularizationRequests();
  saveAll([request, ...all]);
  return { success: true, request };
}

/**
 * Real resubmission - genuinely tagged and linked to the original
 * rejected request, with its own mandatory employee comment, so a
 * reviewer can see this was rejected once before rather than treating
 * it as a fresh, unrelated request.
 */
export function resubmitRegularizationRequest(
  originalRequestId: string,
  updates: {
    requestedCheckInTime?: string;
    requestedCheckOutTime?: string;
    reason: string;
  },
  resubmissionComment: string
): { success: boolean; request?: RegularizationRequest; error?: string } {
  if (!resubmissionComment.trim()) {
    return { success: false, error: "A comment explaining the resubmission is required" };
  }
  const all = getAllRegularizationRequests();
  const original = all.find((r) => r.id === originalRequestId);
  if (!original) return { success: false, error: "Original request not found" };
  if (!REJECTED_STATUSES.includes(original.status)) {
    return { success: false, error: "Only a rejected request can be resubmitted" };
  }

  const eligibility = checkRegularizationEligibility(original.employeeId, original.date);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  // Re-resolve the city manager fresh (the assignment may have changed
  // since the original submission), same as a brand-new submission.
  const cityManager = findCityManagerForCity(original.cityId);
  const submittedAt = new Date().toISOString();
  const resubmission: RegularizationRequest = {
    ...original,
    id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    requestedCheckInTime: updates.requestedCheckInTime,
    requestedCheckOutTime: updates.requestedCheckOutTime,
    reason: updates.reason,
    status: "Pending Manager",
    cityManagerId: cityManager?.id,
    cityManagerName: cityManager?.name,
    isResubmission: true,
    originalRequestId: original.id,
    resubmissionComment,
    managerComment: undefined,
    managerActionBy: undefined,
    managerActionAt: undefined,
    cmComment: undefined,
    cmActionBy: undefined,
    cmActionAt: undefined,
    hrComment: undefined,
    hrAppliedBy: undefined,
    hrAppliedAt: undefined,
    submittedAt,
    history: [{ stage: "Employee", action: "Resubmitted", actorId: original.employeeId, actorName: original.employeeName, comment: resubmissionComment, at: submittedAt }],
  };

  saveAll([resubmission, ...all]);
  return { success: true, request: resubmission };
}

export function getPendingManagerApprovals(managerId: string): RegularizationRequest[] {
  return getAllRegularizationRequests().filter(
    (r) => r.status === "Pending Manager" && r.reportingManagerId === managerId
  );
}

export function managerApproveRegularization(requestId: string, managerId: string, managerName: string, comment?: string): boolean {
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  const at = new Date().toISOString();
  const req = all[idx];
  // Real fix: if this request's city genuinely has no City Manager
  // assigned, don't leave it stuck forever waiting for a stage that can
  // never act — route it straight to HR instead, with a system note.
  const hasCityManager = !!req.cityManagerId;
  all[idx] = {
    ...req,
    status: hasCityManager ? "Pending City Manager" : "Pending HR",
    managerComment: comment,
    managerActionBy: managerName,
    managerActionAt: at,
    history: [
      ...req.history,
      { stage: "Manager", action: "Approved", actorId: managerId, actorName: managerName, comment, at },
      ...(hasCityManager ? [] : [{ stage: "System" as const, action: "Approved" as const, comment: "No City Manager assigned for this city — routed directly to HR", at }]),
    ],
  };
  saveAll(all);
  return true;
}

/**
 * Real, confirmed rule - a rejection always requires a real, mandatory
 * comment, never a silent reject.
 */
export function managerRejectRegularization(requestId: string, managerId: string, managerName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) {
    return { success: false, error: "A comment is required to reject a request" };
  }
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: "Request not found" };
  const at = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "Manager Rejected",
    managerComment: comment,
    managerActionBy: managerName,
    managerActionAt: at,
    history: [...all[idx].history, { stage: "Manager", action: "Rejected", actorId: managerId, actorName: managerName, comment, at }],
  };
  saveAll(all);
  return { success: true };
}

export function getPendingCityManagerApprovals(cityManagerId: string): RegularizationRequest[] {
  return getAllRegularizationRequests().filter(
    (r) => r.status === "Pending City Manager" && r.cityManagerId === cityManagerId
  );
}

export function cityManagerApproveRegularization(requestId: string, cmId: string, cmName: string, comment?: string): boolean {
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  const at = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "Pending HR",
    cmComment: comment,
    cmActionBy: cmName,
    cmActionAt: at,
    history: [...all[idx].history, { stage: "City Manager", action: "Approved", actorId: cmId, actorName: cmName, comment, at }],
  };
  saveAll(all);
  return true;
}

/**
 * Real, confirmed rule - same as the manager stage, a City Manager
 * rejection always requires a real, mandatory comment.
 */
export function cityManagerRejectRegularization(requestId: string, cmId: string, cmName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) {
    return { success: false, error: "A comment is required to reject a request" };
  }
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: "Request not found" };
  const at = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "City Manager Rejected",
    cmComment: comment,
    cmActionBy: cmName,
    cmActionAt: at,
    history: [...all[idx].history, { stage: "City Manager", action: "Rejected", actorId: cmId, actorName: cmName, comment, at }],
  };
  saveAll(all);
  return { success: true };
}

export function getPendingHRApprovals(cityId?: string): RegularizationRequest[] {
  return getAllRegularizationRequests(cityId).filter((r) => r.status === "Pending HR");
}

/**
 * Real, confirmed rule - marks a request as applied by HR. This does NOT
 * touch the real attendance record itself - that real update must happen
 * through AttendanceContext's own updateAttendance, using real React
 * state, from the component that calls this (a standalone service like
 * this one cannot safely write to that context's live data directly).
 */
export function markRegularizationHRApplied(requestId: string, hrName: string, comment?: string): boolean {
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  const at = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "HR Applied",
    hrComment: comment,
    hrAppliedBy: hrName,
    hrAppliedAt: at,
    history: [...all[idx].history, { stage: "HR", action: "Applied", actorName: hrName, comment, at }],
  };
  saveAll(all);
  return true;
}

/**
 * Real, previously-missing capability - HR can reject too, with the same
 * mandatory-comment rule as the other 2 stages. Previously HR could only
 * apply; a request HR disagreed with would just sit unresolved until
 * payroll auto-rejected it with a generic reason.
 */
export function hrRejectRegularization(requestId: string, hrName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) {
    return { success: false, error: "A comment is required to reject a request" };
  }
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: "Request not found" };
  const at = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "HR Rejected",
    hrComment: comment,
    hrAppliedBy: hrName,
    hrAppliedAt: at,
    history: [...all[idx].history, { stage: "HR", action: "Rejected", actorName: hrName, comment, at }],
  };
  saveAll(all);
  return { success: true };
}

export function getEmployeeRegularizationRequests(employeeId: string): RegularizationRequest[] {
  return getAllRegularizationRequests()
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Real, confirmed policy - if a request is still pending manager or HR
 * action when payroll runs for that period, it auto-rejects rather than
 * blocking payroll processing.
 */
export function autoRejectPendingForPayrollPeriod(cityId: string, periodEndDate: string): number {
  const all = getAllRegularizationRequests();
  let count = 0;
  const updated = all.map((r) => {
    if (
      r.cityId === cityId &&
      r.date <= periodEndDate &&
      PENDING_STATUSES.includes(r.status)
    ) {
      count++;
      const at = new Date().toISOString();
      const reason = "Auto-rejected: payroll approved before this request was resolved";
      return {
        ...r,
        status: "Auto-Rejected" as RegularizationStatus,
        history: [...r.history, { stage: "System" as const, action: "Auto-Rejected" as const, comment: reason, at }],
      };
    }
    return r;
  });
  if (count > 0) saveAll(updated);
  return count;
}
