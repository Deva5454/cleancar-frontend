/**
 * travelWeeklyPayoutService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Weekly reimbursement cycle for Car Washer / Supervisor travel claims
 * (travelReimbursementService.ts's payoutTrack === "Weekly"). These are
 * NOT bridged into the normal monthly payroll Finance Payable — instead:
 *
 *   1. Every Monday, HR runs reconciliation for the just-completed
 *      Mon-Sun week: every HR-Applied, not-yet-batched Weekly-track claim
 *      in that window is gathered into a TravelWeeklyBatch.
 *   2. Super Admin approves (or rejects, with a mandatory comment — a
 *      rejected batch's claims become eligible again for the next run)
 *      the batch.
 *   3. On approval, one Finance Payable per claim is created (due the
 *      following Wednesday) — see useTravelPayableBridge.ts's
 *      releaseTravelWeeklyBatchPayables(), which needs useFinance()'s
 *      createPayable and so can't live in this plain service module.
 *      Accounts then disburses each payable through the existing, already
 *      real PayablesDashboard — no separate disbursement screen needed.
 *
 * No approval/payable exists for a batch's claims until Super Admin
 * approves, so nothing is ever payable to Accounts before that gate.
 */

import { DataService } from "./DataService";
import { travelReimbursementService, type TravelTrip } from "./travelReimbursementService";

export type TravelBatchStatus = "Pending Super Admin" | "Super Admin Rejected" | "Approved";
export type TravelBatchHistoryStage = "HR" | "Super Admin" | "Accounts";
export type TravelBatchHistoryAction = "Created" | "Approved" | "Rejected";

export interface TravelBatchHistoryEntry {
  stage: TravelBatchHistoryStage;
  action: TravelBatchHistoryAction;
  actorId?: string;
  actorName?: string;
  comment?: string;
  at: string;
}

export interface TravelWeeklyBatch {
  id: string;
  cityId: string;
  weekStartDate: string;   // Monday, YYYY-MM-DD
  weekEndDate: string;     // Sunday, YYYY-MM-DD
  disbursementDate: string; // Wednesday following weekEndDate
  tripIds: string[];
  totalAmount: number;
  status: TravelBatchStatus;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  superAdminActionBy?: string;
  superAdminActionAt?: string;
  superAdminComment?: string;
  history: TravelBatchHistoryEntry[];
}

const KEY = "TRAVEL_WEEKLY_BATCHES";

function toISODate(d: Date): string {
  return d.toISOString().split("T")[0];
}

/** Monday on/before the given date, at local midnight. */
export function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** The most recently completed Mon-Sun week relative to referenceDate (defaults to today) — what HR reconciles "every Monday". */
export function getPreviousWeekRange(referenceDate: Date = new Date()): { weekStartDate: string; weekEndDate: string; disbursementDate: string } {
  const thisMonday = getMondayOf(referenceDate);
  const prevMonday = new Date(thisMonday);
  prevMonday.setDate(prevMonday.getDate() - 7);
  const prevSunday = new Date(thisMonday);
  prevSunday.setDate(prevSunday.getDate() - 1);
  const disbursement = new Date(prevSunday);
  disbursement.setDate(disbursement.getDate() + 3); // Sunday + 3 = Wednesday
  return { weekStartDate: toISODate(prevMonday), weekEndDate: toISODate(prevSunday), disbursementDate: toISODate(disbursement) };
}

class TravelWeeklyPayoutService {

  getBatches(cityId?: string): TravelWeeklyBatch[] {
    const all = DataService.get<TravelWeeklyBatch>(KEY);
    const normalized = all.map(b => (b && Array.isArray(b.history)) ? b : { ...b, history: [] });
    return cityId ? normalized.filter(b => b.cityId === cityId) : normalized;
  }

  private saveAll(batches: TravelWeeklyBatch[]): void {
    DataService.setAll(KEY, batches);
  }

  /** Trips eligible for a NEW batch: HR-Applied, Weekly track, in-window, not already claimed by a live (non-rejected) batch. */
  getEligibleTrips(cityId: string, weekStartDate: string, weekEndDate: string): TravelTrip[] {
    return travelReimbursementService.getTripsByCity(cityId).filter(t =>
      t.status === "HR Applied" &&
      t.payoutTrack === "Weekly" &&
      t.tripDate >= weekStartDate && t.tripDate <= weekEndDate &&
      !t.travelBatchId
    );
  }

  runWeeklyReconciliation(
    cityId: string, weekStartDate: string,
    hrId: string, hrName: string
  ): { success: boolean; error?: string; batch?: TravelWeeklyBatch } {
    const monday = new Date(weekStartDate + "T00:00:00");
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    const weekEndDate = toISODate(sunday);
    const disbursement = new Date(sunday);
    disbursement.setDate(disbursement.getDate() + 3);
    const disbursementDate = toISODate(disbursement);

    const eligible = this.getEligibleTrips(cityId, weekStartDate, weekEndDate);
    if (eligible.length === 0) {
      return { success: false, error: "No HR-applied Weekly-track claims found for this week that aren't already in another batch." };
    }

    const now = new Date().toISOString();
    const batch: TravelWeeklyBatch = {
      id: `TWB-${Date.now()}`,
      cityId, weekStartDate, weekEndDate, disbursementDate,
      tripIds: eligible.map(t => t.id),
      totalAmount: eligible.reduce((s, t) => s + (t.netPayableAmount || 0), 0),
      status: "Pending Super Admin",
      createdBy: hrId, createdByName: hrName, createdAt: now,
      history: [{ stage: "HR", action: "Created", actorId: hrId, actorName: hrName, at: now }],
    };

    const all = this.getBatches();
    this.saveAll([batch, ...all]);
    eligible.forEach(t => travelReimbursementService.markInWeeklyBatch(t.id, batch.id));

    return { success: true, batch };
  }

  getPendingSuperAdminBatches(cityId?: string): TravelWeeklyBatch[] {
    return this.getBatches(cityId).filter(b => b.status === "Pending Super Admin");
  }

  superAdminApproveBatch(batchId: string, adminId: string, adminName: string, comment?: string): { success: boolean; error?: string; batch?: TravelWeeklyBatch } {
    const all = this.getBatches();
    const idx = all.findIndex(b => b.id === batchId);
    if (idx === -1) return { success: false, error: "Batch not found" };
    const now = new Date().toISOString();
    const updated: TravelWeeklyBatch = {
      ...all[idx], status: "Approved",
      superAdminActionBy: adminName, superAdminActionAt: now, superAdminComment: comment,
      history: [...all[idx].history, { stage: "Super Admin", action: "Approved", actorId: adminId, actorName: adminName, comment, at: now }],
    };
    all[idx] = updated;
    this.saveAll(all);
    return { success: true, batch: updated };
  }

  superAdminRejectBatch(batchId: string, adminId: string, adminName: string, comment: string): { success: boolean; error?: string } {
    if (!comment.trim()) return { success: false, error: "A comment is required to reject a batch" };
    const all = this.getBatches();
    const idx = all.findIndex(b => b.id === batchId);
    if (idx === -1) return { success: false, error: "Batch not found" };
    const now = new Date().toISOString();
    all[idx] = {
      ...all[idx], status: "Super Admin Rejected",
      superAdminActionBy: adminName, superAdminActionAt: now, superAdminComment: comment,
      history: [...all[idx].history, { stage: "Super Admin", action: "Rejected", actorId: adminId, actorName: adminName, comment, at: now }],
    };
    this.saveAll(all);
    // Release these claims so the next reconciliation run picks them back up.
    all[idx].tripIds.forEach(tripId => travelReimbursementService.markInWeeklyBatch(tripId, undefined));
    return { success: true };
  }
}

export const travelWeeklyPayoutService = new TravelWeeklyPayoutService();
