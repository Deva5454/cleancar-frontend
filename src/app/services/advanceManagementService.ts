/**
 * Advance Management Service
 * Enforces financial controls with zero manual bypass
 */

import type {
  LongTermAdvance,
  ShortTermAdvance,
  EMISchedule,
  ValidationResult,
  DisbursementLockReason,
  AuditLogEntry,
  ApprovalRequest,
  Alert,
  AdvanceAnalytics,
  EmployeeAdvanceSummary,
  AdvanceStatus,
  ApprovalAuthority,
} from "../types/advanceManagement";

class AdvanceManagementService {
  private longTermAdvances: Map<string, LongTermAdvance> = new Map();
  private shortTermAdvances: Map<string, ShortTermAdvance> = new Map();
  private auditLogs: AuditLogEntry[] = [];
  private alerts: Alert[] = [];

  private readonly STORAGE_KEY = "cleancar_advance_management";

  constructor() {
    this.loadFromStorage();
    // Only seed if storage is empty (first-time setup)
    if (this.longTermAdvances.size === 0 && this.shortTermAdvances.size === 0) {
      this.seedMockData();
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        longTermAdvances: Array.from(this.longTermAdvances.entries()),
        shortTermAdvances: Array.from(this.shortTermAdvances.entries()),
        auditLogs: this.auditLogs,
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* ignore storage errors */ }
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.longTermAdvances)  this.longTermAdvances  = new Map(data.longTermAdvances);
      if (data.shortTermAdvances) this.shortTermAdvances = new Map(data.shortTermAdvances);
      if (data.auditLogs)         this.auditLogs         = data.auditLogs;
    } catch (e) { /* ignore parse errors */ }
  }

  // ==================== LONG-TERM ADVANCE ====================

  /**
   * Validate Long-Term Advance Application
   * HARD VALIDATIONS - No bypass allowed
   */
  validateLongTermApplication(data: Partial<LongTermAdvance>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.advanceAmount || data.advanceAmount <= 0) {
      errors.push("Advance amount is required and must be greater than 0");
    }

    if (!data.tenureMonths || data.tenureMonths <= 0) {
      errors.push("Tenure is required and must be greater than 0");
    }

    if (!data.emiAmount || data.emiAmount <= 0) {
      errors.push("EMI amount is required and must be greater than 0");
    }

    // Security cheque validations (HARD BLOCK)
    if (!data.securityCheque) {
      errors.push("Security cheque is mandatory");
    } else {
      if (!data.securityCheque.chequeNumber) {
        errors.push("Cheque number is required");
      }
      if (!data.securityCheque.chequeAmount) {
        errors.push("Cheque amount is required");
      }
      if (data.securityCheque.chequeAmount < (data.advanceAmount || 0)) {
        errors.push("❌ Cheque amount must be >= Advance amount");
      }
      if (!data.securityCheque.chequeDate) {
        errors.push("Cheque date is required");
      }
    }

    // EMI validation
    if (data.advanceAmount && data.tenureMonths && data.emiAmount) {
      const expectedEmi = data.advanceAmount / data.tenureMonths;
      if (Math.abs(data.emiAmount - expectedEmi) > 1) {
        warnings.push(`EMI amount mismatch. Expected: ₹${expectedEmi.toFixed(2)}`);
      }
    }

    // Approval authority
    if (!data.approvalAuthority) {
      errors.push("Approval authority is required");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create Long-Term Advance
   */
  createLongTermAdvance(
    employeeId: string,
    employeeName: string,
    employeeRole: string,
    data: Partial<LongTermAdvance>
  ): LongTermAdvance {
    const validation = this.validateLongTermApplication(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
    }

    const id = `LT-${Date.now()}-${(0.9).toString(36).substr(2, 9)}`;

    const advance: LongTermAdvance = {
      id,
      employeeId,
      employeeName,
      employeeRole,
      advanceAmount: data.advanceAmount!,
      tenureMonths: data.tenureMonths!,
      emiAmount: data.emiAmount!,
      isEmiEditable: data.isEmiEditable || false,
      securityCheque: data.securityCheque!,
      status: "PENDING_APPROVAL",
      appliedDate: new Date().toISOString(),
      approvalAuthority: data.approvalAuthority!,
      isDisbursementLocked: true, // LOCKED until cheque deposited
      emiSchedule: this.generateEMISchedule(
        data.advanceAmount!,
        data.emiAmount!,
        data.tenureMonths!
      ),
      totalPaid: 0,
      remainingAmount: data.advanceAmount!,
      missedEmis: 0,
      isExitSettlement: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: employeeId,
    };

    this.longTermAdvances.set(id, advance);
    this.saveToStorage();
    this.logAudit(id, "LONG_TERM", "CREATED", employeeId, employeeRole, "Application created");

    return advance;
  }

  /**
   * Generate EMI Schedule
   */
  private generateEMISchedule(
    totalAmount: number,
    emiAmount: number,
    tenureMonths: number
  ): EMISchedule[] {
    const schedule: EMISchedule[] = [];
    const startDate = new Date();

    for (let i = 1; i <= tenureMonths; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      // Last EMI may be adjusted for rounding
      const isLastEmi = i === tenureMonths;
      const actualEmiAmount = isLastEmi
        ? totalAmount - emiAmount * (tenureMonths - 1)
        : emiAmount;

      schedule.push({
        id: `EMI-${i}`,
        emiNumber: i,
        emiAmount: actualEmiAmount,
        dueDate: dueDate.toISOString().split("T")[0],
        status: "PENDING",
      });
    }

    return schedule;
  }

  /**
   * Approve Long-Term Advance
   */
  approveLongTermAdvance(
    advanceId: string,
    approvedBy: string,
    approverRole: string,
    notes?: string
  ): void {
    const advance = this.longTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    if (advance.status !== "PENDING_APPROVAL") {
      throw new Error("Advance is not in pending approval state");
    }

    advance.status = "APPROVED";
    advance.approvedBy = approvedBy;
    advance.approvedDate = new Date().toISOString();
    advance.updatedAt = new Date().toISOString();

    // Still locked until cheque deposited
    advance.isDisbursementLocked = !advance.securityCheque.isDeposited;

    this.longTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(advanceId, "LONG_TERM", "APPROVED", approvedBy, approverRole, notes || "Approved");
  }

  /**
   * Reject Long-Term Advance
   */
  rejectLongTermAdvance(
    advanceId: string,
    rejectedBy: string,
    rejectorRole: string,
    reason: string
  ): void {
    const advance = this.longTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    advance.status = "REJECTED";
    advance.rejectionReason = reason;
    advance.updatedAt = new Date().toISOString();

    this.longTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(advanceId, "LONG_TERM", "REJECTED", rejectedBy, rejectorRole, reason);
  }

  /**
   * Mark Cheque as Deposited
   * CRITICAL: Unlocks disbursement
   */
  markChequeDeposited(
    advanceId: string,
    depositedBy: string,
    depositorRole: string,
    depositReference: string
  ): void {
    const advance = this.longTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    if (advance.status !== "APPROVED") {
      throw new Error("Advance must be approved before depositing cheque");
    }

    advance.securityCheque.isDeposited = true;
    advance.securityCheque.depositedDate = new Date().toISOString();
    advance.securityCheque.depositedBy = depositedBy;
    advance.securityCheque.bankDepositReference = depositReference;

    // UNLOCK DISBURSEMENT
    advance.isDisbursementLocked = false;
    advance.status = "CHEQUE_PENDING"; // Waiting for disbursement
    advance.updatedAt = new Date().toISOString();

    this.longTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(
      advanceId,
      "LONG_TERM",
      "CHEQUE_DEPOSITED",
      depositedBy,
      depositorRole,
      `Cheque deposited. Ref: ${depositReference}`
    );
  }

  /**
   * Check if Disbursement is Locked
   */
  checkDisbursementLock(advanceId: string): DisbursementLockReason {
    const advance = this.longTermAdvances.get(advanceId);
    if (!advance) {
      return {
        isLocked: true,
        reason: "Advance not found",
        requiredAction: "N/A",
      };
    }

    if (advance.status !== "APPROVED" && advance.status !== "CHEQUE_PENDING") {
      return {
        isLocked: true,
        reason: "Advance not approved",
        requiredAction: "Wait for approval",
      };
    }

    if (!advance.securityCheque.isDeposited) {
      return {
        isLocked: true,
        reason: "Cheque not deposited",
        requiredAction: "Deposit security cheque",
      };
    }

    if (advance.status === "DISBURSED") {
      return {
        isLocked: true,
        reason: "Already disbursed",
        requiredAction: "N/A",
      };
    }

    return {
      isLocked: false,
      reason: "Disbursement allowed",
      requiredAction: "Click to disburse",
    };
  }

  /**
   * Disburse Advance
   * LOCKED until cheque deposited
   */
  disburseAdvance(advanceId: string, disbursedBy: string, disburserRole: string): void {
    const lockStatus = this.checkDisbursementLock(advanceId);
    if (lockStatus.isLocked) {
      throw new Error(`Disbursement locked: ${lockStatus.reason}`);
    }

    const advance = this.longTermAdvances.get(advanceId)!;

    advance.status = "DISBURSED";
    advance.disbursedDate = new Date().toISOString();
    advance.disbursedBy = disbursedBy;
    advance.disbursedAmount = advance.advanceAmount;
    advance.updatedAt = new Date().toISOString();

    // Set next EMI date
    if (advance.emiSchedule.length > 0) {
      advance.nextEmiDate = advance.emiSchedule[0].dueDate;
      advance.status = "ACTIVE"; // Start EMI cycle
    }

    this.longTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(
      advanceId,
      "LONG_TERM",
      "DISBURSED",
      disbursedBy,
      disburserRole,
      `Disbursed ₹${advance.advanceAmount}`
    );
  }

  /**
   * Deduct EMI (Auto-triggered by Payroll)
   * NO MANUAL BYPASS - System enforced
   */
  deductEMI(advanceId: string, emiNumber: number, salaryMonth: string): void {
    const advance = this.longTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    const emi = advance.emiSchedule.find((e) => e.emiNumber === emiNumber);
    if (!emi) throw new Error("EMI not found");

    if (emi.status !== "PENDING") {
      throw new Error("EMI already processed");
    }

    // HARD LOCK: No skipping, no partial deduction
    emi.status = "DEDUCTED";
    emi.deductedDate = new Date().toISOString();
    emi.deductedAmount = emi.emiAmount;
    emi.salaryMonth = salaryMonth;

    advance.totalPaid += emi.emiAmount;
    advance.remainingAmount -= emi.emiAmount;
    advance.updatedAt = new Date().toISOString();

    // Update next EMI date
    const nextEmi = advance.emiSchedule.find((e) => e.status === "PENDING");
    advance.nextEmiDate = nextEmi?.dueDate;

    // Check if completed
    if (advance.remainingAmount <= 0) {
      advance.status = "COMPLETED";
    }

    this.longTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(
      advanceId,
      "LONG_TERM",
      "EMI_DEDUCTED",
      "SYSTEM",
      "PAYROLL",
      `EMI ${emiNumber} deducted: ₹${emi.emiAmount}`
    );
  }

  // ==================== SHORT-TERM ADVANCE ====================

  /**
   * Calculate Short-Term Eligibility
   * System-driven, read-only
   * Role-based limit: 50% for Car Washer/Supervisor, 20% for others
   */
  calculateShortTermEligibility(
    employeeId: string,
    monthlySalary: number,
    daysWorked: number,
    totalDaysInMonth: number,
    employeeRole: string
  ): { salaryTillDate: number; maxEligible: number; limitPercentage: number } {
    // Import the role-based limit calculation
    const calculateMaxAdvanceAmount = (t: string) => t === "LONG_TERM" ? 50000 : 10000;

    const salaryPerDay = monthlySalary / totalDaysInMonth;
    const salaryTillDate = salaryPerDay * daysWorked;

    // Calculate max advance based on MONTHLY gross salary and role
    const { maxAmount, limitPercentage } = calculateMaxAdvanceAmount(monthlySalary, employeeRole);

    return {
      salaryTillDate: Math.round(salaryTillDate),
      maxEligible: Math.round(maxAmount),
      limitPercentage,
    };
  }

  /**
   * Validate Short-Term Request
   */
  validateShortTermRequest(
    requestedAmount: number,
    maxEligible: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (requestedAmount <= 0) {
      errors.push("Requested amount must be greater than 0");
    }

    if (requestedAmount > maxEligible) {
      warnings.push(
        `⚠️ Requested amount exceeds limit (Max: ₹${maxEligible}). Override approval required.`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create Short-Term Advance
   */
  createShortTermAdvance(
    employeeId: string,
    employeeName: string,
    employeeRole: string,
    requestedAmount: number,
    eligibility: { daysWorked: number; salaryTillDate: number; maxEligible: number }
  ): ShortTermAdvance {
    const id = `ST-${Date.now()}-${(0.9).toString(36).substr(2, 9)}`;
    const isOverLimit = requestedAmount > eligibility.maxEligible;

    const advance: ShortTermAdvance = {
      id,
      employeeId,
      employeeName,
      employeeRole,
      daysWorked: eligibility.daysWorked,
      salaryTillDate: eligibility.salaryTillDate,
      maxEligible: eligibility.maxEligible,
      requestedAmount,
      isOverLimit,
      requiresOverrideApproval: isOverLimit,
      status: isOverLimit ? "PENDING_APPROVAL" : "APPROVED", // Auto-approve if within limit
      appliedDate: new Date().toISOString(),
      recoveryMonth: new Date().toISOString().substring(0, 7), // YYYY-MM
      isRecovered: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: employeeId,
    };

    this.shortTermAdvances.set(id, advance);
    this.saveToStorage();
    this.logAudit(
      id,
      "SHORT_TERM",
      "CREATED",
      employeeId,
      employeeRole,
      `Requested ₹${requestedAmount}`
    );

    return advance;
  }

  /**
   * Approve Short-Term Override
   */
  approveShortTermOverride(
    advanceId: string,
    approvedBy: string,
    approverRole: string
  ): void {
    const advance = this.shortTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    if (!advance.requiresOverrideApproval) {
      throw new Error("This advance does not require override approval");
    }

    advance.status = "APPROVED";
    advance.approvedBy = approvedBy;
    advance.approvedDate = new Date().toISOString();
    advance.updatedAt = new Date().toISOString();

    this.shortTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(advanceId, "SHORT_TERM", "APPROVED", approvedBy, approverRole, "Override approved");
  }

  /**
   * Recover Short-Term Advance
   * Auto-triggered by Payroll in current cycle
   */
  recoverShortTermAdvance(advanceId: string, salaryMonth: string): void {
    const advance = this.shortTermAdvances.get(advanceId);
    if (!advance) throw new Error("Advance not found");

    if (advance.status !== "APPROVED" && advance.status !== "DISBURSED") {
      throw new Error("Advance not approved/disbursed");
    }

    advance.isRecovered = true;
    advance.recoveryDate = new Date().toISOString();
    advance.recoveryAmount = advance.requestedAmount;
    advance.status = "COMPLETED";
    advance.updatedAt = new Date().toISOString();

    this.shortTermAdvances.set(advanceId, advance);
    this.saveToStorage();
    this.logAudit(
      advanceId,
      "SHORT_TERM",
      "EMI_DEDUCTED",
      "SYSTEM",
      "PAYROLL",
      `Recovered ₹${advance.requestedAmount} in ${salaryMonth}`
    );
  }

  // ==================== ANALYTICS ====================

  getAnalytics(): AdvanceAnalytics {
    const longTermArray = Array.from(this.longTermAdvances.values());
    const shortTermArray = Array.from(this.shortTermAdvances.values());

    const activeLongTerm = longTermArray.filter((a) => a.status === "ACTIVE");
    const activeShortTerm = shortTermArray.filter((a) => a.status === "APPROVED" || a.status === "DISBURSED");

    return {
      totalAdvances: longTermArray.length + shortTermArray.length,
      activeAdvances: activeLongTerm.length + activeShortTerm.length,
      totalOutstanding:
        activeLongTerm.reduce((sum, a) => sum + a.remainingAmount, 0) +
        activeShortTerm.reduce((sum, a) => sum + (a.isRecovered ? 0 : a.requestedAmount), 0),
      totalDisbursed:
        longTermArray.reduce((sum, a) => sum + (a.disbursedAmount || 0), 0) +
        shortTermArray.reduce((sum, a) => sum + (a.status === "DISBURSED" || a.status === "COMPLETED" ? a.requestedAmount : 0), 0),

      longTerm: {
        count: longTermArray.length,
        outstanding: activeLongTerm.reduce((sum, a) => sum + a.remainingAmount, 0),
        avgAmount:
          longTermArray.length > 0
            ? longTermArray.reduce((sum, a) => sum + a.advanceAmount, 0) / longTermArray.length
            : 0,
      },

      shortTerm: {
        count: shortTermArray.length,
        outstanding: activeShortTerm.reduce(
          (sum, a) => sum + (a.isRecovered ? 0 : a.requestedAmount),
          0
        ),
        avgAmount:
          shortTermArray.length > 0
            ? shortTermArray.reduce((sum, a) => sum + a.requestedAmount, 0) / shortTermArray.length
            : 0,
      },

      missedEmis: longTermArray.reduce((sum, a) => sum + a.missedEmis, 0),
      defaultedAdvances: longTermArray.filter((a) => a.status === "DEFAULTED").length,
      pendingSettlements: longTermArray.filter(
        (a) => a.isExitSettlement && a.settlementStatus === "PENDING"
      ).length,

      pendingApprovals:
        longTermArray.filter((a) => a.status === "PENDING_APPROVAL").length +
        shortTermArray.filter((a) => a.status === "PENDING_APPROVAL").length,
      pendingDisbursements: longTermArray.filter((a) => a.status === "CHEQUE_PENDING").length,
      chequesNotDeposited: longTermArray.filter(
        (a) => a.status === "APPROVED" && !a.securityCheque.isDeposited
      ).length,
    };
  }

  getEmployeeSummary(employeeId: string): EmployeeAdvanceSummary {
    const longTerm = Array.from(this.longTermAdvances.values()).filter(
      (a) => a.employeeId === employeeId
    );
    const shortTerm = Array.from(this.shortTermAdvances.values()).filter(
      (a) => a.employeeId === employeeId
    );

    const activeAdvances: any[] = [
      ...longTerm.filter((a) => a.status === "ACTIVE" || a.status === "DISBURSED"),
      ...shortTerm.filter((a) => a.status === "APPROVED" || a.status === "DISBURSED"),
    ];

    const nextActiveLongTerm = activeAdvances.find((a) => "emiSchedule" in a);

    return {
      employeeId,
      employeeName: longTerm[0]?.employeeName || shortTerm[0]?.employeeName || "Unknown",
      employeeRole: longTerm[0]?.employeeRole || shortTerm[0]?.employeeRole || "Unknown",
      activeAdvances,
      totalOutstanding:
        longTerm.reduce((sum, a) => sum + (a.status === "ACTIVE" ? a.remainingAmount : 0), 0) +
        shortTerm.reduce((sum, a) => sum + (!a.isRecovered ? a.requestedAmount : 0), 0),
      nextEmiDate: nextActiveLongTerm?.nextEmiDate,
      nextEmiAmount: nextActiveLongTerm?.emiAmount,
      completedAdvances:
        longTerm.filter((a) => a.status === "COMPLETED").length +
        shortTerm.filter((a) => a.status === "COMPLETED").length,
      totalRepaid: longTerm.reduce((sum, a) => sum + a.totalPaid, 0),
      missedEmis: longTerm.reduce((sum, a) => sum + a.missedEmis, 0),
      isEligibleForLongTerm: activeAdvances.length === 0, // Simplified rule
      isEligibleForShortTerm: !shortTerm.some((a) => !a.isRecovered),
    };
  }

  // ==================== AUDIT ====================

  private logAudit(
    advanceId: string,
    advanceType: "LONG_TERM" | "SHORT_TERM",
    action: any,
    performedBy: string,
    performedByRole: string,
    details: string
  ): void {
    this.auditLogs.push({
      id: `AUDIT-${Date.now()}-${(0.9).toString(36).substr(2, 9)}`,
      advanceId,
      advanceType,
      action,
      performedBy,
      performedByRole,
      timestamp: new Date().toISOString(),
      details,
    });
  }

  getAuditLogs(advanceId?: string): AuditLogEntry[] {
    if (advanceId) {
      return this.auditLogs.filter((log) => log.advanceId === advanceId);
    }
    return this.auditLogs;
  }

  // ==================== GETTERS ====================

  getLongTermAdvance(id: string): LongTermAdvance | undefined {
    return this.longTermAdvances.get(id);
  }

  getShortTermAdvance(id: string): ShortTermAdvance | undefined {
    return this.shortTermAdvances.get(id);
  }

  getAllLongTermAdvances(): LongTermAdvance[] {
    return Array.from(this.longTermAdvances.values());
  }

  getAllShortTermAdvances(): ShortTermAdvance[] {
    return Array.from(this.shortTermAdvances.values());
  }

  getPendingApprovals(): (LongTermAdvance | ShortTermAdvance)[] {
    const longTerm = Array.from(this.longTermAdvances.values()).filter(
      (a) => a.status === "PENDING_APPROVAL"
    );
    const shortTerm = Array.from(this.shortTermAdvances.values()).filter(
      (a) => a.status === "PENDING_APPROVAL"
    );
    return [...longTerm, ...shortTerm];
  }

  // ==================== MOCK DATA ====================

  private seedMockData(): void {
    // Seed some test data
    // Long-term advance
    const lt1 = this.createLongTermAdvance(
      "EMP001",
      "Rahul Verma",
      "Car Washer",
      {
        advanceAmount: 50000,
        tenureMonths: 10,
        emiAmount: 5000,
        isEmiEditable: false,
        approvalAuthority: "HR",
        securityCheque: {
          chequeNumber: "123456",
          chequeAmount: 50000,
          bankName: "HDFC Bank",
          accountNumber: "1234567890",
          chequeDate: "2026-05-01",
          isDeposited: false,
        },
      }
    );

    // Approve it
    this.approveLongTermAdvance(lt1.id, "HR Manager", "HR", "Approved for medical emergency");

    // Short-term advance
    this.createShortTermAdvance("EMP002", "Suresh Yadav", "Supervisor", 8000, {
      daysWorked: 20,
      salaryTillDate: 20000,
      maxEligible: 12000,
    });
  }
}

// Singleton instance
export const advanceManagementService = new AdvanceManagementService();
