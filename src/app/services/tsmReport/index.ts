/** Adapter: turns the app's employees, leads and jobs into engine inputs. */
import { loadEmployees } from "../incentiveV7/facts";
import type { JobIn, LeadIn, TseIn } from "./engine";

export * from "./engine";

/** TSEs visible to this user. A TSM sees their own team (reporting manager); higher roles see all TSEs in their city. */
export function loadTeam(user: { role?: string; employeeId?: string; name?: string; cityId?: string }, tsmOverride?: string): TseIn[] {
  const emps = loadEmployees();
  const active = (s: string) => !/exit|terminat|resign|inactive/i.test(s);
  let tses = emps.filter((e) => e.role === "TSE");
  const mgrRef = tsmOverride || (user.role === "TSM" ? user.employeeId : undefined);
  if (mgrRef) {
    const mgr = emps.find((e) => e.aliases.includes(mgrRef) || e.name === user.name);
    const keys = new Set([mgrRef, ...(mgr?.aliases ?? [])]);
    tses = tses.filter((e) => e.reportingManagerId && keys.has(e.reportingManagerId));
  } else if (user.role !== "Super Admin" && user.cityId) {
    tses = tses.filter((e) => e.city_id === user.cityId);
  }
  return tses.map((e) => ({ id: e.id, name: e.name, aliases: e.aliases, absent: !active(e.status) }));
}

export function toLeadIn(l: any): LeadIn {
  return {
    leadId: l.leadId, owner: l.assignedTSE || l.assignedTo, assignedAt: l.assignedAt, createdAt: l.createdAt,
    stage: l.stage, status: l.status, followUpDate: l.followUpDate, lastContactedAt: l.lastContactedAt, timeline: l.timeline,
  };
}
export function toJobIn(j: any): JobIn {
  return {
    jobId: j.jobId, leadId: j.leadId, bookedByTseId: j.bookedByTseId, status: j.status, amount: j.amount,
    finalAmount: j.finalAmount, paymentStatus: j.paymentStatus, createdAt: j.createdAt,
    paidAt: j.paymentConfirmedAt || j.paidAt, completedAt: j.completedAt, cancelledAt: j.cancelledAt,
  };
}
