/**
 * Centralized Status System
 * 
 * Single source of truth for all status values across the application.
 * Eliminates hardcoded status strings and ensures consistency.
 * 
 * @module StatusSystem
 */

// ==================== STATUS CATEGORIES ====================

/**
 * General entity statuses
 */
export enum GeneralStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  PENDING = "Pending",
  COMPLETED = "Completed",
  CANCELLED = "Cancelled",
  ARCHIVED = "Archived",
}

/**
 * Approval workflow statuses
 */
export enum ApprovalStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  PENDING_L1 = "Pending L1 Approval",
  PENDING_L2 = "Pending L2 Approval",
  APPROVED_L1 = "Approved by L1",
  APPROVED_L2 = "Approved by L2",
  REJECTED_L1 = "Rejected by L1",
  REJECTED_L2 = "Rejected by L2",
  APPROVED_BY_SUPERVISOR = "Approved by Supervisor",
  APPROVED_BY_MANAGER = "Approved by Manager",
  APPROVED_BY_HR = "Approved by HR",
  AUTO_APPROVED = "Auto-Approved",
}

/**
 * Attendance statuses
 */
export enum AttendanceStatus {
  PRESENT = "Present",
  ABSENT = "Absent",
  LATE = "Late",
  HALF_DAY = "Half Day",
  ON_LEAVE = "On Leave",
  WORKING = "Working",
}

/**
 * Leave request statuses
 */
export enum LeaveStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  CANCELLED = "Cancelled",
  PENDING_SUPERVISOR = "Pending Supervisor Approval",
  PENDING_HR = "Pending HR Approval",
  APPROVED_SUPERVISOR = "Approved by Supervisor",
  APPROVED_HR = "Approved by HR",
  REJECTED_SUPERVISOR = "Rejected by Supervisor",
  REJECTED_HR = "Rejected by HR",
}

/**
 * Demo request statuses
 */
export enum DemoStatus {
  PENDING = "Pending",
  SCHEDULED = "Scheduled",
  REQUEST_SENT = "Demo Request Sent",
  ACCEPTED = "Demo Accepted by Washer",
  DECLINED = "Demo Declined by Washer",
  IN_PROGRESS = "Demo Job Started",
  COMPLETED = "Demo Completed",
  CANCELLED = "Cancelled",
  EXPIRED = "Expired",
}

/**
 * Customer subscription statuses
 */
export enum SubscriptionStatus {
  ACTIVE = "Active",
  INACTIVE = "Inactive",
  PAUSED = "Paused",
  EXPIRED = "Expired",
  CANCELLED = "Cancelled",
  PENDING_PAYMENT = "Pending Payment",
}

/**
 * Payment statuses
 */
export enum PaymentStatus {
  PENDING = "Pending",
  PAID = "Paid",
  PARTIALLY_PAID = "Partially Paid",
  OVERDUE = "Overdue",
  FAILED = "Failed",
  REFUNDED = "Refunded",
  PROCESSING = "Processing",
}

/**
 * Complaint statuses
 */
export enum ComplaintStatus {
  OPEN = "Open",
  IN_PROGRESS = "In Progress",
  RESOLVED = "Resolved",
  CLOSED = "Closed",
  ESCALATED = "Escalated",
  PENDING_CUSTOMER = "Pending Customer Response",
}

/**
 * Task statuses
 */
export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  IN_REVIEW = "In Review",
  COMPLETED = "Completed",
  BLOCKED = "Blocked",
  CANCELLED = "Cancelled",
}

/**
 * Purchase order statuses
 */
export enum PurchaseOrderStatus {
  DRAFT = "Draft",
  PENDING_APPROVAL = "Pending Approval",
  APPROVED = "Approved",
  ORDERED = "Ordered",
  PARTIALLY_RECEIVED = "Partially Received",
  RECEIVED = "Received",
  CANCELLED = "Cancelled",
  REJECTED = "Rejected",
}

/**
 * Inventory statuses
 */
export enum InventoryStatus {
  IN_STOCK = "In Stock",
  LOW_STOCK = "Low Stock",
  OUT_OF_STOCK = "Out of Stock",
  ORDERED = "Ordered",
  DISCONTINUED = "Discontinued",
}

/**
 * Verification statuses
 */
export enum VerificationStatus {
  VERIFIED = "Verified",
  PENDING = "Pending",
  UNVERIFIED = "Unverified",
  FAILED = "Failed",
}

/**
 * Store performance statuses
 */
export enum StoreStatus {
  PROFITABLE = "profitable",
  BREAK_EVEN = "break-even",
  LOSS_MAKING = "loss-making",
}

/**
 * Onboarding statuses
 */
export enum OnboardingStatus {
  PENDING = "Pending",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  REJECTED = "Rejected",
  WITHDRAWN = "Withdrawn",
}

// ==================== STATUS UTILITIES ====================

/**
 * Status configuration for UI rendering
 */
export interface StatusConfig {
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
  bgColor: string;
  icon?: string;
}

/**
 * Get badge variant for a given status
 */
export function getStatusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  // Success states
  if (
    status.includes("Approved") ||
    status.includes("Completed") ||
    status.includes("Active") ||
    status.includes("Verified") ||
    status === GeneralStatus.ACTIVE ||
    status === ApprovalStatus.APPROVED
  ) {
    return "secondary";
  }

  // Error states
  if (
    status.includes("Rejected") ||
    status.includes("Failed") ||
    status.includes("Cancelled") ||
    status.includes("Overdue") ||
    status === ApprovalStatus.REJECTED
  ) {
    return "destructive";
  }

  // Pending states
  if (status.includes("Pending")) {
    return "outline";
  }

  // Default
  return "default";
}

/**
 * Get full status configuration for UI
 */
export function getStatusConfig(status: string): StatusConfig {
  const variant = getStatusVariant(status);

  const configs: Record<typeof variant, StatusConfig> = {
    secondary: {
      variant: "secondary",
      color: "text-green-600",
      bgColor: "bg-green-50",
      icon: "CheckCircle",
    },
    destructive: {
      variant: "destructive",
      color: "text-red-600",
      bgColor: "bg-red-50",
      icon: "XCircle",
    },
    outline: {
      variant: "outline",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      icon: "Clock",
    },
    default: {
      variant: "default",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      icon: "Circle",
    },
  };

  return configs[variant];
}

/**
 * Check if status is in a specific category
 */
export function isStatusPending(status: string): boolean {
  return status.includes("Pending") || status === ApprovalStatus.PENDING;
}

export function isStatusApproved(status: string): boolean {
  return status.includes("Approved") || status === ApprovalStatus.APPROVED;
}

export function isStatusRejected(status: string): boolean {
  return status.includes("Rejected") || status === ApprovalStatus.REJECTED;
}

export function isStatusActive(status: string): boolean {
  return status === GeneralStatus.ACTIVE || status === SubscriptionStatus.ACTIVE;
}

export function isStatusCompleted(status: string): boolean {
  return status.includes("Completed") || status === GeneralStatus.COMPLETED;
}

// ==================== STATUS TRANSITIONS ====================

/**
 * Valid status transitions for approval workflows
 */
export const APPROVAL_TRANSITIONS: Record<string, string[]> = {
  [ApprovalStatus.PENDING]: [
    ApprovalStatus.APPROVED,
    ApprovalStatus.REJECTED,
    ApprovalStatus.PENDING_L1,
  ],
  [ApprovalStatus.PENDING_L1]: [
    ApprovalStatus.APPROVED_L1,
    ApprovalStatus.REJECTED_L1,
    ApprovalStatus.PENDING_L2,
  ],
  [ApprovalStatus.PENDING_L2]: [ApprovalStatus.APPROVED_L2, ApprovalStatus.REJECTED_L2],
  [ApprovalStatus.APPROVED_L1]: [ApprovalStatus.PENDING_L2, ApprovalStatus.APPROVED],
};

/**
 * Valid status transitions for demos
 */
export const DEMO_TRANSITIONS: Record<string, string[]> = {
  [DemoStatus.PENDING]: [DemoStatus.SCHEDULED, DemoStatus.CANCELLED],
  [DemoStatus.SCHEDULED]: [DemoStatus.REQUEST_SENT, DemoStatus.CANCELLED],
  [DemoStatus.REQUEST_SENT]: [DemoStatus.ACCEPTED, DemoStatus.DECLINED, DemoStatus.EXPIRED],
  [DemoStatus.ACCEPTED]: [DemoStatus.IN_PROGRESS, DemoStatus.CANCELLED],
  [DemoStatus.IN_PROGRESS]: [DemoStatus.COMPLETED, DemoStatus.CANCELLED],
  [DemoStatus.DECLINED]: [DemoStatus.SCHEDULED],
};

/**
 * Validate if a status transition is allowed
 */
export function isValidTransition(
  currentStatus: string,
  newStatus: string,
  transitions: Record<string, string[]>
): boolean {
  const allowedTransitions = transitions[currentStatus];
  return allowedTransitions ? allowedTransitions.includes(newStatus) : false;
}

// ==================== EXPORTS ====================

export type Status =
  | GeneralStatus
  | ApprovalStatus
  | AttendanceStatus
  | LeaveStatus
  | DemoStatus
  | SubscriptionStatus
  | PaymentStatus
  | ComplaintStatus
  | TaskStatus
  | PurchaseOrderStatus
  | InventoryStatus
  | VerificationStatus
  | StoreStatus
  | OnboardingStatus;
