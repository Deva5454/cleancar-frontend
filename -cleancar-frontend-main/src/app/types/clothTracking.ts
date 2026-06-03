/**
 * Cloth Tracking System - Type Definitions
 * V3 Logic: Quantity-based matching, scan-first UX
 */

// Cloth Types
export type ClothType = "EXTERIOR" | "INTERIOR";

// Cloth Status
export type ClothStatus =
  | "CLEAN_PACKED"              // Ready for issue
  | "ISSUED"                    // Given to washer
  | "USED_PENDING_COLLECTION"   // Dirty, awaiting collection
  | "IN_LAUNDRY_PROCESS"        // Being cleaned
  | "EXPIRED"                   // Past usable date
  | "LOCKED";                   // In another process

// User Roles
export type ClothTrackingRole = "WASHER" | "SUPERVISOR" | "STORE" | "LAUNDRY";

// Cloth Item
export interface ClothItem {
  id: string;                   // Full barcode ID
  shortId: string;              // Last 4 digits for display
  type: ClothType;
  status: ClothStatus;
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
