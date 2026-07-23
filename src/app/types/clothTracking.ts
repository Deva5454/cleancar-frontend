/**
 * Cloth Tracking System - Type Definitions
 * V3 Logic: Quantity-based matching, scan-first UX
 */

// Cloth Types
export type ClothType = "EXTERIOR" | "INTERIOR";

// Real fabric color, matching how deliveries actually arrive from a
// supplier (e.g. GT Exim Solutions) - a separate real dimension from
// ClothType above, not a replacement for it.
export type ClothColor = "Yellow" | "Blue" | "Black" | "Green";

// Real position in the actual multi-tier supply chain (Kim → Branch →
// Supervisor → Washer) - previously this system only knew about a
// generic "Store," with no real concept of Kim or a branch at all.
export type ClothLocation = "Kim" | "Branch" | "Supervisor" | "Washer" | "Laundry";

// Cloth Status
export type ClothStatus =
  | "CLEAN_PACKED"              // Ready for issue
  | "ISSUED"                    // Given to washer (clean cloth sent out)
  | "USED_PENDING_COLLECTION"   // Dirty, awaiting collection at exchange point
  | "IN_LAUNDRY_PROCESS"        // Sent to laundry for cleaning
  | "EXPIRED";                  // Past usable date — must be replaced
  // NOTE: Locking is NOT a status — use isLocked boolean + lockedBy string on ClothItem

// User Roles
export type ClothTrackingRole = "WASHER" | "SUPERVISOR" | "STORE" | "LAUNDRY";

// Cloth Item
export interface ClothItem {
  id: string;                   // Full barcode ID
  shortId: string;              // Last 4 digits for display
  type: ClothType;
  color?: ClothColor;           // Real fabric color, as actually received from the supplier
  status: ClothStatus;
  // Real, per-cloth wash-cycle count - each full loop (issued → used →
  // collected → laundered → clean again) increments this by 1. At 90,
  // the cloth is automatically retired (status forced to EXPIRED),
  // confirmed directly as the real business rule.
  washCount: number;
  currentLocation: ClothLocation;
  currentLocationId?: string;   // Real branch ID, supervisor ID, or washer ID - whichever currentLocation applies to
  issuedTo?: string;            // Employee ID
  issuedAt?: string;            // ISO timestamp
  collectedAt?: string;         // ISO timestamp
  laundryProcessedAt?: string;  // ISO timestamp
  expiryDate?: string;          // ISO date
  isLocked: boolean;            // Real-time lock indicator
  lockedBy?: string;            // Process/user holding lock
  createdAt: string;
  updatedAt: string;
}

// Exchange Transaction
export interface ClothExchange {
  id: string;
  employeeId: string;
  employeeName: string;
  role: ClothTrackingRole;

  // Dirty received
  dirtyClothIds: string[];
  dirtyExterior: number;
  dirtyInterior: number;

  // Clean issued
  cleanClothIds: string[];
  cleanExterior: number;
  cleanInterior: number;

  // Matching status
  exteriorMatched: boolean;
  interiorMatched: boolean;
  isComplete: boolean;

  timestamp: string;
  location?: string;
}

// Scan Result
export interface ScanResult {
  success: boolean;
  cloth?: ClothItem;
  error?: ScanError;
}

// Scan Errors
export type ScanErrorType =
  | "INVALID_STAGE"       // Cloth not allowed at this stage
  | "EXPIRED"             // Cloth expired
  | "DUPLICATE"           // Already scanned
  | "LOCKED"              // Cloth locked in another process
  | "NOT_FOUND"           // Barcode not recognized
  | "WRONG_STATUS";       // Status doesn't match expected

export interface ScanError {
  type: ScanErrorType;
  message: string;
  clothId?: string;
}

// Live Match Status
export interface MatchStatus {
  exterior: {
    dirty: number;
    clean: number;
    matched: boolean;
  };
  interior: {
    dirty: number;
    clean: number;
    matched: boolean;
  };
  allMatched: boolean;
}

// Scan Feedback
export interface ScanFeedback {
  type: "success" | "error";
  cloth?: {
    shortId: string;
    type: ClothType;
    status: "DIRTY" | "CLEAN";
  };
  error?: ScanError;
  timestamp: number;
}

// Admin Analytics
export interface ClothAnalytics {
  totalCloths: number;
  byType: {
    exterior: number;
    interior: number;
  };
  byStatus: Record<ClothStatus, number>;

  // Anomalies
  anomalies: {
    invalidScans: number;
    stageViolations: number;
    lockConflicts: number;
    expiredCloths: number;
  };

  // Performance
  performance: {
    avgScanTime: number;        // milliseconds
    fastestOperator: string;
    slowestOperator: string;
    totalScansToday: number;
  };
}

// Operator Performance
export interface OperatorPerformance {
  employeeId: string;
  employeeName: string;
  role: ClothTrackingRole;

  totalScans: number;
  avgScanTime: number;          // milliseconds
  fastestScan: number;
  slowestScan: number;
  errorRate: number;            // percentage

  lastActiveAt: string;
}
