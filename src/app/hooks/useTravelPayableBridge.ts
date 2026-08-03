/**
 * Shared bridge between a travel claim being finalized and it becoming a
 * real Finance Payable. Kept as a hook (not part of travelReimbursementService)
 * because it needs FinanceContext's createPayable, which is only available
 * via useFinance().
 *
 * Two paths:
 *  - finalizeTravelApproval(): Monthly-track claims (everyone except Car
 *    Washer / Supervisor) — called by TravelHRView right after HR's final
 *    approval, same as before.
 *  - releaseTravelWeeklyBatchPayables(): Weekly-track claims (Car Washer /
 *    Supervisor) — called right after Super Admin approves a
 *    TravelWeeklyBatch (travelWeeklyPayoutService.ts). One Payable per
 *    claim, due the batch's Wednesday disbursement date. Nothing is ever
 *    payable to Accounts before this gate.
 */
import { useFinance } from "../contexts/FinanceContext";
import { travelReimbursementService, type TravelTrip } from "../services/travelReimbursementService";
import type { TravelWeeklyBatch } from "../services/travelWeeklyPayoutService";

export function useTravelPayableBridge() {
  const { createPayable } = useFinance();

  function finalizeTravelApproval(trip: TravelTrip, opts?: { isAdhoc?: boolean }): void {
    const isAdhoc = opts?.isAdhoc ?? false;
    const dueDate = isAdhoc
      ? new Date().toISOString().split("T")[0]
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split("T")[0];

    createPayable({
      type: "Travel",
      employeeId:   trip.employeeId,
      employeeName: trip.employeeName,
      description:  `Travel Reimbursement — ${trip.tripDate} — ${trip.purposeOfVisit}`,
      amount:       trip.netPayableAmount || 0,
      dueDate,
      status:       "Pending",
      cityId:       trip.cityId,
      travelTripId: trip.id,
      taxAmount:    0,
      tdsAmount:    0,
      isAdhoc,
    });

    travelReimbursementService.markAddedToPayroll(
      trip.id,
      new Date().toISOString().slice(0, 7),
      isAdhoc ? `ADHOC-TRAVEL-${trip.id}` : `PAYROLL-TRAVEL-${trip.id}`
    );
  }

  function releaseTravelWeeklyBatchPayables(batch: TravelWeeklyBatch, trips: TravelTrip[]): void {
    trips.forEach(trip => {
      createPayable({
        type: "Travel",
        employeeId:   trip.employeeId,
        employeeName: trip.employeeName,
        description:  `Weekly Travel Reimbursement — ${batch.weekStartDate} to ${batch.weekEndDate} — ${trip.tripDate} — ${trip.purposeOfVisit}`,
        amount:       trip.netPayableAmount || 0,
        dueDate:      batch.disbursementDate,
        status:       "Pending",
        cityId:       trip.cityId,
        travelTripId: trip.id,
        taxAmount:    0,
        tdsAmount:    0,
        isAdhoc:      false,
      });
      travelReimbursementService.markAddedToPayroll(trip.id, batch.weekStartDate, `WEEKLY-TRAVEL-${batch.id}`);
    });
  }

  return { finalizeTravelApproval, releaseTravelWeeklyBatchPayables };
}
