/**
 * Bridge between an expense claim reaching "Approved" and it becoming a
 * Finance Payable added to payroll. Mirrors useTravelPayableBridge.ts —
 * previously ClaimHRView's "Add to Payroll" button only flipped the claim's
 * own status flag and stamped a fake payrollRunId; it never created a real
 * Finance Payable, so an approved claim was never actually paid.
 */
import { useFinance } from "../contexts/FinanceContext";
import { expenseClaimService, type ExpenseClaim } from "../services/expenseClaimService";

export function useClaimPayableBridge() {
  const { createPayable } = useFinance();

  function finalizeClaimApproval(claim: ExpenseClaim, opts?: { isAdhoc?: boolean }): void {
    const isAdhoc = opts?.isAdhoc ?? false;
    const dueDate = isAdhoc
      ? new Date().toISOString().split("T")[0]
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split("T")[0];
    const payrollMonth = new Date().toISOString().slice(0, 7);
    const payrollRunId = isAdhoc ? `ADHOC-CLAIM-${claim.id}` : `PAYROLL-CLAIM-${claim.id}`;

    createPayable({
      type: "Claim",
      employeeId: claim.employeeId,
      employeeName: claim.employeeName,
      description: `Expense Claim — ${claim.category} — ${claim.expenseDate}`,
      amount: claim.amount,
      dueDate,
      status: "Pending",
      cityId: claim.cityId,
      claimId: claim.id,
      isAdhoc,
    });

    expenseClaimService.markAddedToPayroll(claim.id, payrollMonth, payrollRunId);
  }

  return { finalizeClaimApproval };
}
