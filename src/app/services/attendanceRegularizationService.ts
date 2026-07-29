/**
 * attendanceRegularizationService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, confirmed workflow: an employee submits a regularization request
 * for a genuine mispunch (missing IN, OUT, or both) - never a direct HR
 * edit. It routes to that employee's real reporting manager for
 * approval or rejection (rejection requires a real, mandatory comment).
 * Once the manager approves, it moves to HR, who must take an explicit,
 * real action to apply it - never automatic, even after manager approval.
 *
 * A rejected request can be resubmitted, but the resubmission is tagged
 * and linked back to the original so a reviewer can see it was rejected
 * once before, and the employee's resubmission comment is also mandatory.
 *
 * If a request is still unresolved when payroll runs for that period, it
 * auto-rejects rather than blocking payroll - confirmed, real policy.
 *
 * The real limits - how many days back a request can cover, and how many
 * requests one employee can submit per month - are HR-configurable, not
 * hardcoded, and apply the same way to everyone.
 */

import { DataService } from "./DataService";

export type RegularizationStatus =
  | "Pending Manager"
  | "Manager Approved"
  | "Manager Rejected"
  | "Pending HR"
  | "HR Applied"
  | "Auto-Rejected";

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
  hrAppliedBy?: string;
  hrAppliedAt?: string;
  isResubmission: boolean;
  originalRequestId?: string;
  resubmissionComment?: string;
  submittedAt: string;
}

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
    return cityId ? all.filter((r: any) => r.cityId === cityId) : all;
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

  const request: RegularizationRequest = {
    id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "Pending Manager",
    isResubmission: false,
    submittedAt: new Date().toISOString(),
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
  if (original.status !== "Manager Rejected") {
    return { success: false, error: "Only a rejected request can be resubmitted" };
  }

  const eligibility = checkRegularizationEligibility(original.employeeId, original.date);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  const resubmission: RegularizationRequest = {
    ...original,
    id: `REG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    requestedCheckInTime: updates.requestedCheckInTime,
    requestedCheckOutTime: updates.requestedCheckOutTime,
    reason: updates.reason,
    status: "Pending Manager",
    isResubmission: true,
    originalRequestId: original.id,
    resubmissionComment,
    managerComment: undefined,
    managerActionBy: undefined,
    managerActionAt: undefined,
    submittedAt: new Date().toISOString(),
  };

  saveAll([resubmission, ...all]);
  return { success: true, request: resubmission };
}

export function getPendingManagerApprovals(managerId: string): RegularizationRequest[] {
  return getAllRegularizationRequests().filter(
    (r) => r.status === "Pending Manager" && r.reportingManagerId === managerId
  );
}

export function managerApproveRegularization(requestId: string, managerName: string, comment?: string): boolean {
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  all[idx] = {
    ...all[idx],
    status: "Pending HR",
    managerComment: comment,
    managerActionBy: managerName,
    managerActionAt: new Date().toISOString(),
  };
  saveAll(all);
  return true;
}

/**
 * Real, confirmed rule - a rejection always requires a real, mandatory
 * comment, never a silent reject.
 */
export function managerRejectRegularization(requestId: string, managerName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) {
    return { success: false, error: "A comment is required to reject a request" };
  }
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: "Request not found" };
  all[idx] = {
    ...all[idx],
    status: "Manager Rejected",
    managerComment: comment,
    managerActionBy: managerName,
    managerActionAt: new Date().toISOString(),
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
export function markRegularizationHRApplied(requestId: string, hrName: string): boolean {
  const all = getAllRegularizationRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  all[idx] = {
    ...all[idx],
    status: "HR Applied",
    hrAppliedBy: hrName,
    hrAppliedAt: new Date().toISOString(),
  };
  saveAll(all);
  return true;
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
      (r.status === "Pending Manager" || r.status === "Pending HR")
    ) {
      count++;
      return { ...r, status: "Auto-Rejected" as RegularizationStatus, managerComment: r.managerComment || "Auto-rejected: payroll processed before resolution" };
    }
    return r;
  });
  if (count > 0) saveAll(updated);
  return count;
}
