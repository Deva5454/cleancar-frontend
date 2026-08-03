/**
 * compOffLeaveRequestService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real workflow: every employee can apply to take a day off against their
 * real, earned comp-off balance (holidayPayService.ts — credited
 * automatically when they genuinely work a real public holiday while
 * scheduled off per the duty roster; the only real, payroll-connected
 * earning path in this app). This is the request-and-approval side of
 * that balance: it routes through the same real 3-stage chain as
 * attendance regularization:
 *   Reporting Manager → City Manager → HR (final approval + record update)
 * Every stage can reject, and every rejection requires a real, mandatory
 * comment - never a silent reject.
 *
 * A rejected request (at any of the 3 stages) can be resubmitted, tagged
 * and linked back to the original, with its own mandatory comment.
 *
 * If a request is still unresolved when payroll runs for that period, it
 * auto-rejects rather than blocking payroll - same real policy as
 * attendance regularization, fires both at payroll generation
 * (PayrollRun.tsx) and again at HR's payroll approval
 * (PayrollReviewApproval.tsx).
 *
 * Every request keeps a real, append-only history of every stage's
 * action (who, what, when, why), shown to the employee and everyone in
 * the chain as a full real trail, not just a flat "current status".
 *
 * On final HR approval, this actually consumes one real earned credit
 * (oldest first) via holidayPayService.useCompOff() - never automatic,
 * even after both manager approvals.
 */

import { getEmployeeCompOffBalance, useCompOff } from "./holidayPayService";
import { findCityManagerForCity } from "./orgResolution";

export type CompOffLeaveStatus =
  | "Pending Manager"
  | "Manager Rejected"
  | "Pending City Manager"
  | "City Manager Rejected"
  | "Pending HR"
  | "HR Rejected"
  | "HR Applied"
  | "Auto-Rejected";

export type CompOffLeaveHistoryStage = "Employee" | "Manager" | "City Manager" | "HR" | "System";
export type CompOffLeaveHistoryAction = "Submitted" | "Resubmitted" | "Approved" | "Rejected" | "Applied" | "Auto-Rejected";

export interface CompOffLeaveHistoryEntry {
  stage: CompOffLeaveHistoryStage;
  action: CompOffLeaveHistoryAction;
  actorId?: string;
  actorName?: string;
  comment?: string;
  at: string;
}

export interface CompOffLeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  cityId: string;
  date: string; // the real day off being requested, YYYY-MM-DD
  reason: string;
  status: CompOffLeaveStatus;
  reportingManagerId: string;
  reportingManagerName?: string;
  managerComment?: string;
  managerActionBy?: string;
  managerActionAt?: string;
  cityManagerId?: string;
  cityManagerName?: string;
  cmComment?: string;
  cmActionBy?: string;
  cmActionAt?: string;
  hrComment?: string;
  hrAppliedBy?: string;
  hrAppliedAt?: string;
  consumedCreditId?: string; // which real earned credit this request drew from, once applied
  isResubmission: boolean;
  originalRequestId?: string;
  resubmissionComment?: string;
  submittedAt: string;
  history: CompOffLeaveHistoryEntry[];
}

const REQUESTS_KEY = "cleancar_comp_off_leave_requests";
const REJECTED_STATUSES: CompOffLeaveStatus[] = ["Manager Rejected", "City Manager Rejected", "HR Rejected"];
const PENDING_STATUSES: CompOffLeaveStatus[] = ["Pending Manager", "Pending City Manager", "Pending HR"];

export function getAllCompOffLeaveRequests(cityId?: string): CompOffLeaveRequest[] {
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

function saveAll(requests: CompOffLeaveRequest[]): void {
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

/**
 * Real eligibility check - must have at least one real available earned
 * credit, and the day off must be a real future date (not already past).
 */
export function checkCompOffLeaveEligibility(employeeId: string, date: string): { eligible: boolean; reason?: string } {
  const today = new Date().toISOString().split("T")[0];
  if (date < today) {
    return { eligible: false, reason: "Cannot request a comp-off day that's already in the past" };
  }
  const balance = getEmployeeCompOffBalance(employeeId);
  if (balance.length === 0) {
    return { eligible: false, reason: "No available comp-off credit — you haven't earned one, or it's already been used/expired" };
  }
  const alreadyPendingOrApproved = getAllCompOffLeaveRequests().some(
    (r) => r.employeeId === employeeId && r.date === date && r.status !== "Manager Rejected" && r.status !== "City Manager Rejected" && r.status !== "HR Rejected" && r.status !== "Auto-Rejected"
  );
  if (alreadyPendingOrApproved) {
    return { eligible: false, reason: "You already have a request for this date" };
  }
  return { eligible: true };
}

export function submitCompOffLeaveRequest(input: {
  employeeId: string;
  employeeName: string;
  cityId: string;
  date: string;
  reason: string;
  reportingManagerId: string;
  reportingManagerName?: string;
}): { success: boolean; request?: CompOffLeaveRequest; error?: string } {
  const eligibility = checkCompOffLeaveEligibility(input.employeeId, input.date);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  if (!input.reason.trim()) {
    return { success: false, error: "A reason is required" };
  }

  const cityManager = findCityManagerForCity(input.cityId);
  const submittedAt = new Date().toISOString();
  const request: CompOffLeaveRequest = {
    id: `COMPOFF-LV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...input,
    status: "Pending Manager",
    cityManagerId: cityManager?.id,
    cityManagerName: cityManager?.name,
    isResubmission: false,
    submittedAt,
    history: [{ stage: "Employee", action: "Submitted", actorId: input.employeeId, actorName: input.employeeName, at: submittedAt }],
  };

  const all = getAllCompOffLeaveRequests();
  saveAll([request, ...all]);
  return { success: true, request };
}

export function resubmitCompOffLeaveRequest(
  originalRequestId: string,
  updates: { date: string; reason: string },
  resubmissionComment: string
): { success: boolean; request?: CompOffLeaveRequest; error?: string } {
  if (!resubmissionComment.trim()) {
    return { success: false, error: "A comment explaining the resubmission is required" };
  }
  const all = getAllCompOffLeaveRequests();
  const original = all.find((r) => r.id === originalRequestId);
  if (!original) return { success: false, error: "Original request not found" };
  if (!REJECTED_STATUSES.includes(original.status)) {
    return { success: false, error: "Only a rejected request can be resubmitted" };
  }

  const eligibility = checkCompOffLeaveEligibility(original.employeeId, updates.date);
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }

  const cityManager = findCityManagerForCity(original.cityId);
  const submittedAt = new Date().toISOString();
  const resubmission: CompOffLeaveRequest = {
    ...original,
    id: `COMPOFF-LV-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: updates.date,
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
    consumedCreditId: undefined,
    submittedAt,
    history: [{ stage: "Employee", action: "Resubmitted", actorId: original.employeeId, actorName: original.employeeName, comment: resubmissionComment, at: submittedAt }],
  };

  saveAll([resubmission, ...all]);
  return { success: true, request: resubmission };
}

export function getPendingManagerCompOffApprovals(managerId: string): CompOffLeaveRequest[] {
  return getAllCompOffLeaveRequests().filter((r) => r.status === "Pending Manager" && r.reportingManagerId === managerId);
}

export function managerApproveCompOffLeave(requestId: string, managerId: string, managerName: string, comment?: string): boolean {
  const all = getAllCompOffLeaveRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return false;
  const at = new Date().toISOString();
  const req = all[idx];
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

export function managerRejectCompOffLeave(requestId: string, managerId: string, managerName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) return { success: false, error: "A comment is required to reject a request" };
  const all = getAllCompOffLeaveRequests();
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

export function getPendingCityManagerCompOffApprovals(cityManagerId: string): CompOffLeaveRequest[] {
  return getAllCompOffLeaveRequests().filter((r) => r.status === "Pending City Manager" && r.cityManagerId === cityManagerId);
}

export function cityManagerApproveCompOffLeave(requestId: string, cmId: string, cmName: string, comment?: string): boolean {
  const all = getAllCompOffLeaveRequests();
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

export function cityManagerRejectCompOffLeave(requestId: string, cmId: string, cmName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) return { success: false, error: "A comment is required to reject a request" };
  const all = getAllCompOffLeaveRequests();
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

export function getPendingHRCompOffApprovals(cityId?: string): CompOffLeaveRequest[] {
  return getAllCompOffLeaveRequests(cityId).filter((r) => r.status === "Pending HR");
}

/**
 * Real, confirmed rule - HR's explicit action both marks the request
 * applied AND consumes one real earned credit (oldest first, via
 * holidayPayService.useCompOff) - never automatic. Returns false if the
 * employee's real balance ran out between submission and this approval
 * (e.g. it expired) rather than silently marking it applied anyway.
 */
export function hrApplyCompOffLeave(requestId: string, hrName: string, comment?: string): { success: boolean; error?: string } {
  const all = getAllCompOffLeaveRequests();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx === -1) return { success: false, error: "Request not found" };
  const req = all[idx];

  const balance = getEmployeeCompOffBalance(req.employeeId).sort((a, b) => a.earnedAt.localeCompare(b.earnedAt));
  const oldestCredit = balance[0];
  if (!oldestCredit) {
    return { success: false, error: "No available comp-off credit left to apply — it may have expired since this request was submitted" };
  }
  const consumed = useCompOff(oldestCredit.id, req.date);
  if (!consumed) {
    return { success: false, error: "Could not consume the comp-off credit — it may already have been used" };
  }

  const at = new Date().toISOString();
  all[idx] = {
    ...req,
    status: "HR Applied",
    hrComment: comment,
    hrAppliedBy: hrName,
    hrAppliedAt: at,
    consumedCreditId: oldestCredit.id,
    history: [...req.history, { stage: "HR", action: "Applied", actorName: hrName, comment, at }],
  };
  saveAll(all);
  return { success: true };
}

export function hrRejectCompOffLeave(requestId: string, hrName: string, comment: string): { success: boolean; error?: string } {
  if (!comment.trim()) return { success: false, error: "A comment is required to reject a request" };
  const all = getAllCompOffLeaveRequests();
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

export function getEmployeeCompOffLeaveRequests(employeeId: string): CompOffLeaveRequest[] {
  return getAllCompOffLeaveRequests()
    .filter((r) => r.employeeId === employeeId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Real, confirmed policy - if a request is still pending manager, city
 * manager, or HR action when payroll runs for that period, it
 * auto-rejects rather than blocking payroll processing. Mirrors
 * attendanceRegularizationService's autoRejectPendingForPayrollPeriod.
 */
export function autoRejectPendingCompOffForPayrollPeriod(cityId: string, periodEndDate: string): number {
  const all = getAllCompOffLeaveRequests();
  let count = 0;
  const updated = all.map((r) => {
    if (r.cityId === cityId && r.date <= periodEndDate && PENDING_STATUSES.includes(r.status)) {
      count++;
      const at = new Date().toISOString();
      const reason = "Auto-rejected: payroll approved before this request was resolved";
      return {
        ...r,
        status: "Auto-Rejected" as CompOffLeaveStatus,
        history: [...r.history, { stage: "System" as const, action: "Auto-Rejected" as const, comment: reason, at }],
      };
    }
    return r;
  });
  if (count > 0) saveAll(updated);
  return count;
}
