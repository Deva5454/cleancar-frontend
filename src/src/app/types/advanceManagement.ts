/**
 * Advance Management System - Type Definitions
 * Financial control interface with zero manual bypass
 */

// Advance Types
export type AdvanceType = "LONG_TERM" | "SHORT_TERM";

// Advance Status
export type AdvanceStatus =
  | "DRAFT"                    // Application started but not submitted
  | "PENDING_APPROVAL"         // Submitted, awaiting approval
  | "APPROVED"                 // Approved by authority
  | "REJECTED"                 // Rejected by authority
  | "CHEQUE_PENDING"          // Long-term: Waiting for cheque deposit
  | "DISBURSED"               // Money released to employee
  | "ACTIVE"                  // EMI deductions ongoing
  | "COMPLETED"               // Fully repaid
  | "DEFAULTED"               // Missed EMI / Exit with pending
  | "SETTLED";                // Cleared via F&F settlement

// EMI Status
export type EMIStatus = "PENDING" | "DEDUCTED" | "SKIPPED" | "ADJUSTED";

// Approval Authority Levels
export type ApprovalAuthority =
  | "Supervisor"
  | "Operations Manager"
  | "Sr Operations Manager"
  | "City Manager"
  | "HR"
  | "Admin"
  | "Super Admin";

// Security Cheque
export interface SecurityCheque {
  chequeNumber: string;
  chequeAmount: number;
  bankName: string;
  accountNumber: string;
  chequeDate: string;
  imageUrl?: string;

  // Deposit tracking
  isDeposited: boolean;
  depositedDate?: string;
  depositedBy?: string;
  bankDepositReference?: string;
}

// EMI Schedule Item
export interface EMISchedule {
  id: string;
  emiNumber: number;
  emiAmount: number;
  dueDate: string;
  status: EMIStatus;
  deductedDate?: string;
  deductedAmount?: number;
  salaryMonth?: string;
  remarks?: string;
}

// Long-Term Advance
export interface LongTermAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;

  // Application details
  advanceAmount: number;
  tenureMonths: number;
  emiAmount: number;
  isEmiEditable: boolean;       // Controlled by approval toggle

  // Security
  securityCheque: SecurityCheque;

  // Approval flow
  status: AdvanceStatus;
  appliedDate: string;
  approvalAuthority: ApprovalAuthority;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Disbursement (locked until cheque deposited)
  isDisbursementLocked: boolean;
  disbursedDate?: string;
  disbursedBy?: string;
  disbursedAmount?: number;

  // EMI tracking
  emiSchedule: EMISchedule[];
  totalPaid: number;
  remainingAmount: number;
  nextEmiDate?: string;
  missedEmis: number;

  // Exit settlement
  isExitSettlement: boolean;
  exitDate?: string;
  settlementAmount?: number;
  settlementStatus?: "PENDING" | "CLEARED";

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Short-Term Advance
export interface ShortTermAdvance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;

  // Auto-calculation (system-driven)
  daysWorked: number;
  salaryTillDate: number;
  maxEligible: number;          // 60% of salary till date

  // Request
  requestedAmount: number;
  isOverLimit: boolean;
  requiresOverrideApproval: boolean;

  // Approval (only if over limit)
  status: AdvanceStatus;
  appliedDate: string;
  approvalAuthority?: ApprovalAuthority;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;

  // Recovery (single deduction in current cycle)
  recoveryMonth: string;
  recoveryDate?: string;
  recoveryAmount?: number;
  isRecovered: boolean;

  // Audit
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

// Advance Application (combined)
export type Advance = LongTermAdvance | ShortTermAdvance;

// Approval Request
export interface ApprovalRequest {
  id: string;
  advanceId: string;
  advanceType: AdvanceType;
  employeeId: string;
  employeeName: string;
  requestedAmount: number;

  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedDate: string;
  approvalAuthority: ApprovalAuthority;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  notes?: string;
}

// Audit Log Entry
export interface AuditLogEntry {
  id: string;
  advanceId: string;
  advanceType: AdvanceType;
  action:
    | "CREATED"
    | "SUBMITTED"
    | "APPROVED"
    | "REJECTED"
    | "CHEQUE_DEPOSITED"
    | "DISBURSED"
    | "EMI_DEDUCTED"
    | "EMI_MISSED"
    | "SETTLED"
    | "DEFAULTED";

  performedBy: string;
  performedByRole: string;
  timestamp: string;
  details: string;
  metadata?: Record<string, any>;
}

// Dashboard Analytics
export interface AdvanceAnalytics {
  // Overall stats
  totalAdvances: number;
  activeAdvances: number;
  totalOutstanding: number;
  totalDisbursed: number;

  // By type
  longTerm: {
    count: number;
    outstanding: number;
    avgAmount: number;
  };
  shortTerm: {
    count: number;
    outstanding: number;
    avgAmount: number;
  };

  // Risk indicators
  missedEmis: number;
  defaultedAdvances: number;
  pendingSettlements: number;

  // Pending actions
  pendingApprovals: number;
  pendingDisbursements: number;
  chequesNotDeposited: number;
}

// Employee Advance Summary
export interface EmployeeAdvanceSummary {
  employeeId: string;
  employeeName: string;
  employeeRole: string;

  // Active advances
  activeAdvances: Advance[];
  totalOutstanding: number;
  nextEmiDate?: string;
  nextEmiAmount?: number;

  // History
  completedAdvances: number;
  totalRepaid: number;
  missedEmis: number;

  // Eligibility
  isEligibleForLongTerm: boolean;
  isEligibleForShortTerm: boolean;
  shortTermMaxEligible?: number;
}

// Alert Types
export type AlertType =
  | "EMI_MISSED"
  | "EXIT_PENDING_DUES"
  | "OVER_LIMIT_REQUEST"
  | "CHEQUE_NOT_DEPOSITED"
  | "APPROVAL_PENDING"
  | "DISBURSEMENT_BLOCKED";

export interface Alert {
  id: string;
  type: AlertType;
  severity: "HIGH" | "MEDIUM" | "LOW";
  advanceId: string;
  employeeId: string;
  employeeName: string;
  message: string;
  timestamp: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedDate?: string;
}

// Validation Result
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Disbursement Lock Reason
export interface DisbursementLockReason {
  isLocked: boolean;
  reason: string;
  requiredAction: string;
}
