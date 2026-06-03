/**
 * Washer Data Service - Centralized Data Management
 * Single source of truth for all washer module data
 * NO hardcoded data in components - all through this service
 *
 * CRITICAL: Delegates attendance to washerAttendanceService
 */

import { mockWasherDataService, type CustomerJob, type WasherStats } from "./mockWasherDataService";
import { incentiveEngineService } from "./incentiveEngineService";
import { weekOffCoverService } from "./weekOffCoverService";
import { WasherAttendanceService } from "./washerAttendanceService";

// ========== TYPES ==========

export interface WasherProfile {
  id: string;
  name: string;
  phone: string;
  employeeId: string;
  joiningDate: Date;
  baseTarget: number; // 25 units
  photo?: string;
}

export interface CheckInData {
  washerId: string;
  timestamp: Date;
  gpsLocation: { lat: number; lng: number };
  photo: string;
  firstCarId: string;
  validations: {
    face: boolean;
    numberPlate: boolean;
    gps: boolean;
  };
}

export interface CheckOutData {
  washerId: string;
  timestamp: Date;
  gpsLocation: { lat: number; lng: number };
  photo: string;
  lastCarId: string;
  validations: {
    face: boolean;
    gps: boolean;
  };
}

export interface JobExecution {
  jobId: string;
  washerId: string;
  startTime: Date;
  endTime?: Date;
  steps: JobStep[];
  consumables: ConsumableUsage[];
  clothBatch?: string;
  photos: JobPhoto[];
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
}

export interface JobStep {
  id: string;
  name: string;
  order: number;
  isCompleted: boolean;
  completedAt?: Date;
  requiresPhoto: boolean;
  photoTaken: boolean;
  photoUrl?: string;
}

export interface ConsumableUsage {
  itemId: string;
  name: string;
  quantity: number;
  unit: string;
  isUsed: boolean;
}

export interface JobPhoto {
  id: string;
  type: "BEFORE" | "DURING" | "AFTER" | "ISSUE";
  url: string;
  timestamp: Date;
  stepId?: string;
}

export interface DayStatus {
  date: Date;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime?: Date;
  checkOutTime?: Date;
  status: "NOT_STARTED" | "CHECKED_IN" | "WORKING" | "CHECKED_OUT";
  isWeekOff: boolean;
  isLate: boolean;
  lateReason?: string;
}

// ========== SERVICE CLASS ==========

class WasherDataService {
  private currentWasherId: string = "WASHER-001"; // In real app, from auth
  private dayStatusCache: Map<string, DayStatus> = new Map();
  private jobExecutionCache: Map<string, JobExecution> = new Map();

  // ========== WASHER PROFILE ==========

  getWasherProfile(washerId: string = this.currentWasherId): WasherProfile {
    // In production: fetch from API
    return {
      id: washerId,
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      employeeId: "EMP-2024-001",
      joiningDate: new Date("2024-01-15"),
      baseTarget: 25,
      photo: undefined,
    };
  }

  updateWasherProfile(washerId: string, updates: Partial<WasherProfile>): void {
    // In production: PUT /api/washer/:id/profile
    console.log("Updating washer profile:", washerId, updates);
  }

  // ========== DAY STATUS ==========

  getDayStatus(washerId: string = this.currentWasherId, date: Date = new Date()): DayStatus {
    const key = `${washerId}-${date.toDateString()}`;
    
    if (this.dayStatusCache.has(key)) {
      return this.dayStatusCache.get(key)!;
    }

    // In production: GET /api/washer/:id/day-status?date=YYYY-MM-DD
    const status: DayStatus = {
      date,
      isCheckedIn: false,
      isCheckedOut: false,
      status: "NOT_STARTED",
      isWeekOff: false,
      isLate: false,
    };

    this.dayStatusCache.set(key, status);
    return status;
  }

  // ========== CHECK-IN ==========

  async checkIn(data: CheckInData): Promise<{ success: boolean; message?: string }> {
    // In production: POST /api/washer/check-in
    console.log("Check-in:", data);

    // Validate
    if (!data.validations.face || !data.validations.numberPlate || !data.validations.gps) {
      return { success: false, message: "All validations must pass" };
    }

    // Update day status
    const dayStatus = this.getDayStatus(data.washerId, new Date());
    dayStatus.isCheckedIn = true;
    dayStatus.checkInTime = data.timestamp;
    dayStatus.status = "CHECKED_IN";
    
    // Check if late
    const checkInHour = data.timestamp.getHours();
    if (checkInHour > 9) {
      dayStatus.isLate = true;
      dayStatus.lateReason = "Checked in after 9:00 AM";
    }

    return { success: true };
  }

  // ========== CHECK-OUT ==========

  async checkOut(data: CheckOutData): Promise<{ success: boolean; message?: string }> {
    // In production: POST /api/washer/check-out
    console.log("Check-out:", data);

    // Validate
    if (!data.validations.face || !data.validations.gps) {
      return { success: false, message: "All validations must pass" };
    }

    // Update day status
    const dayStatus = this.getDayStatus(data.washerId, new Date());
    dayStatus.isCheckedOut = true;
    dayStatus.checkOutTime = data.timestamp;
    dayStatus.status = "CHECKED_OUT";

    return { success: true };
  }

  // ========== JOBS ==========

  getTodayJobs(washerId: string = this.currentWasherId): CustomerJob[] {
    // Use mock service for now, in production: GET /api/washer/:id/jobs/today
    return mockWasherDataService.getTodayJobs(washerId, 12);
  }

  getJobById(jobId: string): CustomerJob | null {
    const jobs = this.getTodayJobs();
    return jobs.find(j => j.id === jobId) || null;
  }

  getJobsByStatus(washerId: string, status: CustomerJob["status"]): CustomerJob[] {
    return mockWasherDataService.getJobsByStatus(washerId, status);
  }

  getInProgressJob(washerId: string = this.currentWasherId): CustomerJob | null {
    return mockWasherDataService.getInProgressJob(washerId);
  }

  // ========== JOB EXECUTION ==========

  startJob(jobId: string, washerId: string = this.currentWasherId): JobExecution {
    // In production: POST /api/washer/job/:jobId/start
    
    const execution: JobExecution = {
      jobId,
      washerId,
      startTime: new Date(),
      status: "IN_PROGRESS",
      steps: this.getJobSteps(jobId),
      consumables: this.getJobConsumables(jobId),
      photos: [],
    };

    this.jobExecutionCache.set(jobId, execution);
    return execution;
  }

  getJobExecution(jobId: string): JobExecution | null {
    if (this.jobExecutionCache.has(jobId)) {
      return this.jobExecutionCache.get(jobId)!;
    }

    // In production: GET /api/washer/job/:jobId/execution
    return null;
  }

  completeStep(jobId: string, stepId: string): void {
    // In production: POST /api/washer/job/:jobId/step/:stepId/complete
    const execution = this.getJobExecution(jobId);
    if (!execution) return;

    const step = execution.steps.find(s => s.id === stepId);
    if (step) {
      step.isCompleted = true;
      step.completedAt = new Date();
      
      // Activate next step
      const currentIndex = execution.steps.findIndex(s => s.id === stepId);
      if (currentIndex < execution.steps.length - 1) {
        // No explicit "isActive" in type, but next step becomes accessible
      }
    }
  }

  addJobPhoto(jobId: string, photo: JobPhoto): void {
    // In production: POST /api/washer/job/:jobId/photo
    const execution = this.getJobExecution(jobId);
    if (!execution) return;

    execution.photos.push(photo);

    // If photo is for a step, mark as taken
    if (photo.stepId) {
      const step = execution.steps.find(s => s.id === photo.stepId);
      if (step) {
        step.photoTaken = true;
        step.photoUrl = photo.url;
      }
    }
  }

  markConsumableUsed(jobId: string, consumableId: string): void {
    // In production: POST /api/washer/job/:jobId/consumable/:id/use
    const execution = this.getJobExecution(jobId);
    if (!execution) return;

    const consumable = execution.consumables.find(c => c.itemId === consumableId);
    if (consumable) {
      consumable.isUsed = true;
    }
  }

  completeJob(jobId: string): void {
    // In production: POST /api/washer/job/:jobId/complete
    const execution = this.getJobExecution(jobId);
    if (!execution) return;

    execution.status = "COMPLETED";
    execution.endTime = new Date();

    // Update job status in mock service
    mockWasherDataService.completeJob(jobId);
  }

  // ========== JOB STEPS (Template) ==========

  private getJobSteps(jobId: string): JobStep[] {
    // In production: GET /api/job-templates/:packageType/steps
    const job = this.getJobById(jobId);
    if (!job) return [];

    // Different steps based on package
    const baseSteps = [
      { id: "1", name: "Exterior Wash", order: 1, requiresPhoto: true },
      { id: "2", name: "Interior Cleaning", order: 2, requiresPhoto: true },
      { id: "3", name: "Tire Cleaning", order: 3, requiresPhoto: false },
      { id: "4", name: "Final Polish", order: 4, requiresPhoto: true },
    ];

    if (job.packageType === "Water + Shampoo + Wax" || job.packageType === "Water + Shampoo + Wax") {
      baseSteps.push(
        { id: "5", name: "Dashboard Cleaning", order: 5, requiresPhoto: false },
        { id: "6", name: "Vacuum Interior", order: 6, requiresPhoto: true }
      );
    }

    return baseSteps.map(step => ({
      ...step,
      isCompleted: false,
      photoTaken: false,
    }));
  }

  // ========== CONSUMABLES (Template) ==========

  private getJobConsumables(jobId: string): ConsumableUsage[] {
    // In production: GET /api/job-templates/:packageType/consumables
    const job = this.getJobById(jobId);
    if (!job) return [];

    const baseConsumables = [
      { itemId: "C001", name: "Car Wash Shampoo", quantity: 50, unit: "ml" },
      { itemId: "C002", name: "Tire Cleaner", quantity: 30, unit: "ml" },
      { itemId: "C003", name: "Polish", quantity: 20, unit: "ml" },
    ];

    if (job.packageType === "Water + Shampoo + Wax" || job.packageType === "Water + Shampoo + Wax") {
      baseConsumables.push(
        { itemId: "C004", name: "Dashboard Cleaner", quantity: 15, unit: "ml" },
        { itemId: "C005", name: "Glass Cleaner", quantity: 25, unit: "ml" }
      );
    }

    return baseConsumables.map(item => ({
      ...item,
      isUsed: false,
    }));
  }

  // ========== STATS & PERFORMANCE ==========

  getWasherStats(washerId: string = this.currentWasherId): WasherStats {
    // Get base stats from mock service
    const stats = mockWasherDataService.getWasherStats(washerId);
    
    // Enhance with incentive data
    const incentiveState = incentiveEngineService.getTrackerState();
    stats.totalEarnings = incentiveState.totalEarningsToday;

    return stats;
  }

  getTodayPerformance(washerId: string = this.currentWasherId) {
    const stats = this.getWasherStats(washerId);
    const incentiveState = incentiveEngineService.getTrackerState();
    const dayStatus = this.getDayStatus(washerId);

    return {
      ...stats,
      incentiveUnits: incentiveState.incentiveUnits,
      baseTarget: 25,
      isEligibleForIncentive: incentiveState.incentiveUnits > 0,
      checkInTime: dayStatus.checkInTime,
      checkOutTime: dayStatus.checkOutTime,
      isLate: dayStatus.isLate,
    };
  }

  // ========== MONTHLY DATA ==========

  getMonthlyStats(washerId: string = this.currentWasherId, month: number, year: number) {
    // In production: GET /api/washer/:id/monthly-stats?month=X&year=Y
    return {
      totalUnits: 420,
      incentiveUnits: 95,
      totalEarnings: 18750,
      incentiveEarnings: 4750,
      workingDays: 24,
      lateDays: 2,
      perfectDays: 18, // Days with 25+ units
      averageUnitsPerDay: 17.5,
    };
  }

  // ========== CACHE MANAGEMENT ==========

  clearCache(): void {
    this.dayStatusCache.clear();
    this.jobExecutionCache.clear();
  }

  refreshData(washerId: string = this.currentWasherId): void {
    // Force reload from API
    this.clearCache();
    this.getDayStatus(washerId);
    this.getTodayJobs(washerId);
  }
}

// Singleton instance
export const washerDataService = new WasherDataService();
