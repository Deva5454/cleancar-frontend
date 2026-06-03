/**
 * Workflow Control System - Type Definitions
 * Strict execution control with AI validation and job locking
 */

// Job Lock Status
export type JobLockStatus = "UNLOCKED" | "LOCKED" | "ACTIVE" | "COMPLETED";

// AI Validation Types
export type AIValidationType =
  | "FACE_DETECTION"
  | "NUMBER_PLATE"
  | "VEHICLE_DETECTION"
  | "LOCATION_MATCH"
  | "PHOTO_QUALITY"
  | "DUPLICATE_CHECK";

export type AIValidationStatus = "IDLE" | "PROCESSING" | "SUCCESS" | "FAILED";

// Photo Capture States
export type PhotoCaptureState = "IDLE" | "CAPTURING" | "PROCESSING" | "SUCCESS" | "FAILED";

// Task Execution States
export type TaskStatus = "LOCKED" | "ACTIVE" | "IN_PROGRESS" | "COMPLETED" | "SKIPPED";

// Alert Types
export type AlertType =
  | "FIRST_WASH_START"
  | "DELAY_WARNING"
  | "COVER_UNLOCK"
  | "VALIDATION_FAILURE"
  | "SUPERVISOR_NOTIFICATION"
  | "JOB_ABANDONED"
  | "SLA_BREACH";

// Job Lock Information
export interface JobLock {
  isLocked: boolean;
  activeJobId: string | null;
  lockedAt: string | null;
  lockedBy: string;
  reason: string;
  canUnlock: boolean;
}

// AI Validation Result
export interface AIValidationResult {
  success: boolean;
  validationType: AIValidationType;
  confidence: number;
  errors: string[];
  warnings: string[];
  timestamp: string;
  metadata?: {
    detectedPlate?: string;
    faceDetected?: boolean;
    vehicleType?: string;
    locationMatch?: boolean;
    duplicateDetected?: boolean;
  };
}

// Photo Validation
export interface PhotoValidation {
  photoId: string;
  photoUrl: string;
  capturedAt: string;
  status: PhotoCaptureState;
  validationResults: AIValidationResult[];
  isValid: boolean;
  retryCount: number;
  maxRetries: number;
}

// Task Definition
export interface WorkflowTask {
  id: string;
  taskNumber: number;
  name: string;
  description: string;
  category: "DAILY" | "WEEKLY" | "MONTHLY";
  isConditional: boolean;
  requiredForPackage: string[]; // Package types that require this task
  estimatedTime: number; // in seconds
  requiresPhoto: boolean;
  photoCount: number;
  status: TaskStatus;
  startedAt?: string;
  completedAt?: string;
  photos: PhotoValidation[];
  validationRequired: boolean;
  dependencies: string[]; // Task IDs that must be completed first
}

// Active Job Workflow
export interface ActiveJobWorkflow {
  jobId: string;
  vehicleRegNo: string;
  packageType: string;
  startedAt: string;
  estimatedCompletionTime: string;
  slaDeadline: string;
  isOverdue: boolean;

  // Task Engine
  tasks: WorkflowTask[];
  currentTaskIndex: number;
  completedTasks: number;
  totalTasks: number;

  // Photos
  mandatoryPhotos: PhotoValidation[];
  photoValidationComplete: boolean;

  // Lock Status
  isLocked: boolean;
  canComplete: boolean;
  blockingReasons: string[];
}

// SLA Tracking
export interface SLATracker {
  checkInTime: string;
  firstWashDeadline: string; // 5 min after check-in
  hasStartedFirstWash: boolean;
  isDelayed: boolean;
  delayMinutes: number;
  totalWashesCompleted: number;
  currentWashStartTime?: string;
  averageWashTime: number; // in minutes
}

// Cover Jobs Visibility
export interface CoverJobsVisibility {
  baseUnitsCompleted: number;
  coverUnitsAssigned: number;
  threshold: number; // 25
  isCoverVisible: boolean;
  coverJobs: any[]; // Hidden until threshold reached
}

// Alert Definition
export interface WorkflowAlert {
  id: string;
  type: AlertType;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  requiresAction: boolean;
  actionLabel?: string;
  actionCallback?: string;
  autoCloseAfter?: number; // seconds
}

// Check-in Validation
export interface CheckInValidation {
  selfiePhoto: PhotoValidation | null;
  firstCarPhoto: PhotoValidation | null;
  gpsLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  isValid: boolean;
  validationErrors: string[];
}

// Check-out Validation
export interface CheckOutValidation {
  selfiePhoto: PhotoValidation | null;
  lastCarPhoto: PhotoValidation | null;
  gpsLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: string;
  };
  isValid: boolean;
  validationErrors: string[];
}

// Job Abandonment
export interface JobAbandonment {
  jobId: string;
  abandonedAt: string;
  timeElapsed: number; // in minutes
  tasksCompleted: number;
  totalTasks: number;
  canResume: boolean;
  flaggedForSupervisor: boolean;
  reason: string;
}

// Offline Mode
export interface OfflineMode {
  isOffline: boolean;
  pendingValidations: PhotoValidation[];
  syncQueue: any[];
  lastSyncTime: string | null;
}

// Workflow State (Global)
export interface WorkflowState {
  userId: string;
  userName: string;

  // Session
  isCheckedIn: boolean;
  checkInTime: string | null;
  checkInValidation: CheckInValidation | null;

  // Job Lock
  jobLock: JobLock;

  // Active Job
  activeJob: ActiveJobWorkflow | null;

  // SLA
  sla: SLATracker | null;

  // Cover Visibility
  coverVisibility: CoverJobsVisibility;

  // Alerts
  activeAlerts: WorkflowAlert[];

  // Offline
  offlineMode: OfflineMode;

  // Abandonment
  abandonedJobs: JobAbandonment[];
}

// Validation Error Types
export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  type: "BLOCKER" | "WARNING";
}

// AI Validation Request
export interface AIValidationRequest {
  photoUrl: string;
  validationType: AIValidationType;
  context: {
    vehicleRegNo?: string;
    expectedLocation?: { lat: number; lng: number };
    previousPhotos?: string[];
  };
}

// Task Execution Control
export interface TaskExecutionControl {
  canStart: boolean;
  blockingReasons: string[];
  nextTask: WorkflowTask | null;
  isSequential: boolean;
}
