/**
 * Week-Off & Cover Job System Types
 * System-driven redistribution with progressive disclosure
 */

// Day Status (System-controlled)
export type DayStatus = "WORKING" | "WEEK_OFF" | "COVER";

// Day Type Info
export interface DayTypeInfo {
  status: DayStatus;
  message: string;
  color: string;
  icon: string;
  isExecutionAllowed: boolean;
}

// Week-Off Schedule
export interface WeekOffSchedule {
  washerId: string;
  washerName: string;
  assignedWeekOffDay: string; // e.g., "Monday", "Tuesday"
  isRotational: boolean;
  nextWeekOff: Date;
  previousWeekOff?: Date;
}

// Cover Job Assignment
export interface CoverJobAssignment {
  id: string;
  originalWasherId: string;
  originalWasherName: string;
  coverWasherId: string;
  coverWasherName: string;
  jobId: string;
  assignedAt: Date;
  reason: "WEEK_OFF" | "LEAVE" | "ABSENCE";
  isRevealed: boolean; // Progressive disclosure flag
}

// Cover Job Summary (Before base completion)
export interface CoverJobSummary {
  totalCoverUnits: number;
  fromWashers: string[]; // List of washer names
  message: string;
  isLocked: boolean; // Locked until base completion
}

// Cover Job (Full details - After base completion)
export interface CoverJob {
  id: string;
  jobId: string;
  isCoverJob: true;
  originalWasher: string;
  coverReason: "WEEK_OFF" | "LEAVE" | "ABSENCE";

  // Standard job fields
  timeSlot: string;
  customerFirstName: string;
  area: string;
  pinCode: string;
  city: string;
  addressLine1?: string;
  vehicleCategory: string;
  vehicleColor: string;
  vehicleBrand: string;
  vehicleRegistration: string;
  packageName: string;
  packageType: string;
  status: string;
  specialNotes?: string;
}

// Notification for cover assignment
export interface CoverNotification {
  id: string;
  washerId: string;
  washerName: string;
  coverJobCount: number;
  assignedAt: Date;
  isRead: boolean;
  message: string;
}

// Washer Day Context (What the UI needs to know)
export interface WasherDayContext {
  washerId: string;
  washerName: string;
  today: Date;

  // Day status
  dayStatus: DayStatus;
  dayInfo: DayTypeInfo;

  // Week-off schedule
  weekOffSchedule: WeekOffSchedule;

  // Cover jobs (if any)
  hasCoverJobs: boolean;
  coverSummary: CoverJobSummary | null;
  coverJobs: CoverJob[];

  // Base completion gate
  baseUnitsCompleted: number;
  baseQuota: number;
  isBaseComplete: boolean;
  canSeeCoverDetails: boolean;

  // Check-in context
  isCheckedIn: boolean;
  checkInTime: Date | null;
  isCoverAssignmentTime: boolean; // After 5:15 AM

  // Limits
  totalUnitsToday: number;
  maxDailyLimit: number;
  isAtLimit: boolean;
}

// Edge Case States
export type CoverJobVisibilityState =
  | "NOT_CHECKED_IN"        // Before check-in
  | "CHECKED_IN_EARLY"      // Before 5:15 AM
  | "ASSIGNMENT_PENDING"    // After 5:15, waiting for assignment
  | "ASSIGNED_LOCKED"       // Assigned but base not complete
  | "UNLOCKED"              // Base complete, can see details
  | "NO_COVER"              // No cover jobs assigned
  | "AT_LIMIT";             // Daily limit reached

export interface CoverJobVisibility {
  state: CoverJobVisibilityState;
  message: string;
  showCount: boolean;
  showDetails: boolean;
}
