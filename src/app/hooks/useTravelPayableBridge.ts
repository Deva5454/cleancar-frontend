/**
 * Shared bridge between a travel claim reaching "Approved" and it becoming
 * a Finance Payable added to payroll. Used by both TravelHRView (HR approval,
 * with the optional "pay immediately" ad-hoc path) and TravelAdminSettings
 * (City Manager approval, for claims above CITY_MANAGER_APPROVAL_THRESHOLD).
 * Kept as a hook (not part of travelReimbursementService) because it needs
 * FinanceContext's createPayable, which is only available via useFinance().
 */
import { useFinance } from "../contexts/FinanceContext";
import { travelReimbursementService, type TravelTrip } from "../services/travelReimbursementService";

export function useTravelPayableBridge() {
  const { createPayable } = useFinance();

  function finalizeTravelApproval(trip: TravelTrip, opts?: { isAdhoc?: boolean }): void {
    const isAdhoc = opts?.isAdhoc ?? false;
    const dueDate = isAdhoc
      ? new Date().toISOString().split("T")[0]
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split("T")[0];

    createPayable({
      type: "Salary",
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

  return { finalizeTravelApproval };
}
