/**
 * Expense Claim Service
 * General-purpose reimbursement claims (Food, Internet, Mobile Bill, Medical,
 * Office Supplies, Other) — separate from Travel Reimbursement, which stays
 * focused on odometer/GPS-based mileage claims.
 *
 * Workflow mirrors the proven Travel Reimbursement pattern:
 *   Draft -> Pending Manager -> Pending HR -> Approved -> Added to Payroll
 *                                          \-> Rejected
 */

export type ExpenseCategory =
  | "Food"
  | "Internet"
  | "Mobile Bill"
  | "Medical"
  | "Office Supplies"
  | "Other";

export type ExpenseClaimStatus =
  | "Draft"
  | "Pending Manager"
  | "Pending HR"
  | "Approved"
  | "Rejected"
  | "Added to Payroll";

export interface ExpenseClaim {
  id: string;
  employeeId: string;
  employeeName: string;
  designation: string;
  cityId: string;
  city: string;
  reportingManagerId: string;
  reportingManagerName: string;

  category: ExpenseCategory;
  amount: number;
  expenseDate: string; // ISO date
  description: string;
  receiptDataUrl?: string; // base64 image, stored like TripPhoto

  status: ExpenseClaimStatus;
  submittedAt?: string;

  managerApprovedBy?: string;
  managerApprovedAt?: string;
  managerComments?: string;

  hrApprovedBy?: string;
  hrApprovedAt?: string;
  hrComments?: string;

  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  payrollMonth?: string;
  payrollRunId?: string;

  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "EXPENSE_CLAIMS";

class ExpenseClaimService {
  private subscribers: Set<(claims: ExpenseClaim[]) => void> = new Set();

  private read(): ExpenseClaim[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as ExpenseClaim[]) : [];
    } catch {
      return [];
    }
  }

  private write(claims: ExpenseClaim[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
    this.subscribers.forEach((cb) => cb(claims));
  }

  subscribe(cb: (claims: ExpenseClaim[]) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  getAll(): ExpenseClaim[] {
    return this.read();
  }

  getByEmployee(employeeId: string): ExpenseClaim[] {
    return this.read().filter((c) => c.employeeId === employeeId);
  }

  getPendingForManager(managerId: string): ExpenseClaim[] {
    return this.read().filter(
      (c) => c.status === "Pending Manager" && c.reportingManagerId === managerId
    );
  }

  getPendingForHR(cityId?: string): ExpenseClaim[] {
    return this.read().filter(
      (c) => c.status === "Pending HR" && (!cityId || c.cityId === cityId)
    );
  }

  create(
    input: Omit<
      ExpenseClaim,
      "id" | "status" | "createdAt" | "updatedAt" | "submittedAt"
    >
  ): ExpenseClaim {
    const now = new Date().toISOString();
    const claim: ExpenseClaim = {
      ...input,
      id: `CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };
    this.write([...this.read(), claim]);
    return claim;
  }

  submit(claimId: string): ExpenseClaim | null {
    const claims = this.read();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim || claim.status !== "Draft") return null;
    claim.status = "Pending Manager";
    claim.submittedAt = new Date().toISOString();
    claim.updatedAt = claim.submittedAt;
    this.write(claims);
    return claim;
  }

  managerApprove(claimId: string, managerName: string, comments?: string): ExpenseClaim | null {
    const claims = this.read();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim || claim.status !== "Pending Manager") return null;
    claim.status = "Pending HR";
    claim.managerApprovedBy = managerName;
    claim.managerApprovedAt = new Date().toISOString();
    claim.managerComments = comments;
    claim.updatedAt = claim.managerApprovedAt;
    this.write(claims);
    return claim;
  }

  hrApprove(claimId: string, hrName: string, comments?: string): ExpenseClaim | null {
    const claims = this.read();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim || claim.status !== "Pending HR") return null;
    claim.status = "Approved";
    claim.hrApprovedBy = hrName;
    claim.hrApprovedAt = new Date().toISOString();
    claim.hrComments = comments;
    claim.updatedAt = claim.hrApprovedAt;
    this.write(claims);
    return claim;
  }

  reject(claimId: string, rejectedBy: string, reason: string): ExpenseClaim | null {
    const claims = this.read();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim || (claim.status !== "Pending Manager" && claim.status !== "Pending HR")) return null;
    claim.status = "Rejected";
    claim.rejectedBy = rejectedBy;
    claim.rejectedAt = new Date().toISOString();
    claim.rejectionReason = reason;
    claim.updatedAt = claim.rejectedAt;
    this.write(claims);
    return claim;
  }

  markAddedToPayroll(claimId: string, payrollMonth: string, payrollRunId: string): ExpenseClaim | null {
    const claims = this.read();
    const claim = claims.find((c) => c.id === claimId);
    if (!claim || claim.status !== "Approved") return null;
    claim.status = "Added to Payroll";
    claim.payrollMonth = payrollMonth;
    claim.payrollRunId = payrollRunId;
    claim.updatedAt = new Date().toISOString();
    this.write(claims);
    return claim;
  }

  getApprovedTotalForEmployee(employeeId: string, month: string): number {
    return this.read()
      .filter((c) => c.employeeId === employeeId && c.status === "Approved" && c.expenseDate.startsWith(month))
      .reduce((sum, c) => sum + c.amount, 0);
  }
}

export const expenseClaimService = new ExpenseClaimService();
