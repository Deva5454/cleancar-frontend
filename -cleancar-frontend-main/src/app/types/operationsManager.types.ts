/**
 * OPERATIONS MANAGER - TYPE DEFINITIONS
 * Centralized type system for OM module
 */

// ============================================
// AUDIT TRAIL TYPES
// ============================================

export type AuditActionType = 
  | "APPROVAL" 
  | "REJECTION" 
  | "VISIT" 
  | "DISCOUNT" 
  | "COMPLAINT" 
  | "PIPELINE_UPDATE" 
  | "OVERRIDE" 
  | "EOD_SIGNOFF";

export type ActorRole = "OM" | "SUPERVISOR" | "CITY_MANAGER";

export interface AuditActor {
  id: string;
  name: string;
  role: ActorRole;
}

export interface AuditLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface AuditImpactedEntity {
  type: string;
  id: string;
  name: string;
}

export interface AuditEntry {
  id: string;
  action: AuditActionType;
  actor: AuditActor;
  timestamp: Date;
  location?: AuditLocation;
  actionTaken: string;
  reason?: string;
  impactedEntity: AuditImpactedEntity;
  metadata?: Record<string, any>;
}

export interface AuditSummary {
  todayActions: number;
  approvals: number;
  rejections: number;
  fieldVisits: number;
}

// ============================================
// PRE-DAY PREVIEW TYPES
// ============================================

export interface AttendanceProjection {
  expected: number;
  projected: number;
  confirmed: number;
  leavePlanned: number;
  uncertainty: number;
}

export interface CoverRequirement {
  estimatedUnits: number;
  coverWashersNeeded: number;
  currentCoverPool: number;
  shortfall: number;
}

export type VisitType = "DEMO" | "RENEWAL" | "COMPLAINT" | "SOCIETY" | "CORPORATE";
export type VisitPriority = "HIGH" | "MEDIUM" | "LOW";

export interface ScheduledVisit {
  id: string;
  customerName: string;
  location: string;
  type: VisitType;
  scheduledTime: string;
  priority: VisitPriority;
}

export interface OpenEscalations {
  critical: number;
  high: number;
  medium: number;
  total: number;
}

export interface YesterdayPerformance {
  unitsAchieved: number;
  unitsTarget: number;
  percentage: number;
}

export interface PreDayData {
  date: Date;
  attendance: AttendanceProjection;
  coverRequirement: CoverRequirement;
  scheduledVisits: ScheduledVisit[];
  openEscalations: OpenEscalations;
  yesterdayPerformance: YesterdayPerformance;
}

// ============================================
// DATA LOCK TYPES
// ============================================

export type DataLockReason = "PAYROLL_PROCESSING" | "MONTH_END_CLOSE" | "AUDIT_FREEZE";

export interface DataLockInfo {
  lockDate: Date;
  lockReason: DataLockReason;
  estimatedUnlockTime?: Date;
  affectedModules: string[];
}

// ============================================
// TIME MODE TYPES
// ============================================

export type OMTimeMode = 
  | "PRE_DAY" 
  | "PERFORMANCE_REVIEW" 
  | "FIELD_MODE" 
  | "TEAM_REVIEW" 
  | "DAY_CLOSE" 
  | "LOCKED";

export interface TimeModeConfig {
  mode: OMTimeMode;
  startHour: number;
  endHour: number;
  displayName: string;
  description: string;
  primaryColor: string;
}
