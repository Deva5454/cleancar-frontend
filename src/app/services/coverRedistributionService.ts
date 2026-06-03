/**
 * Cover Redistribution Service
 * Handles auto-assignment logic for absent washer job redistribution
 */

import type { CustomerJob } from "./mockWasherDataService";

export interface AbsentWasher {
  id: string;
  name: string;
  totalUnits: number;
  jobs: CustomerJob[];
}

export interface CoverWasher {
  id: string;
  name: string;
  baseUnits: number;
  coverAssigned: number;
  totalUnits: number;
  maxCoverCapacity: number; // Always 5.0
  distanceKm: number;
  coverJobs: CustomerJob[];
  isAcknowledged: boolean;
}

export interface CoverAssignmentPlan {
  absentWasher: AbsentWasher;
  coverWashers: CoverWasher[];
  totalCapacity: number;
  totalRequired: number;
  unassignedUnits: number;
  isCapacitySufficient: boolean;
  generatedAt: Date;
  status: "DRAFT" | "CONFIRMED" | "NOTIFIED";
}

export interface WeekOffSwapRequest {
  id: string;
  requestedBy: string;
  requestedByName: string;
  swapWith: string;
  swapWithName: string;
  requestedDate: Date;
  swapDate: Date;
  noticeGivenDays: number;
  isValidNotice: boolean; // ≥4 days
  status: "PENDING" | "APPROVED" | "REJECTED";
  coverPlanCreated: boolean;
}

class CoverRedistributionService {
  private readonly MAX_COVER_PER_WASHER = 5.0;
  private readonly MIN_NOTICE_DAYS = 4;
  private readonly CRITICAL_PENDING_THRESHOLD = 3; // 3+ units unstarted at 7:45 AM

  // ========== AUTO-ASSIGNMENT LOGIC ==========

  generateCoverPlan(
    absentWasherId: string,
    absentWasherName: string,
    jobsToRedistribute: CustomerJob[],
    availableWashers: Array<{ id: string; name: string; baseUnits: number; area: string }>
  ): CoverAssignmentPlan {
    // Calculate total units to redistribute
    const totalUnits = jobsToRedistribute.length; // Simplified: 1 job = 1 unit

    // Sort available washers by:
    // 1. Lowest current load (equity)
    // 2. Proximity (area match)
    const sortedWashers = availableWashers
      .map((w) => ({
        ...w,
        distanceKm: 0.8 * 5, // Simulated distance
      }))
      .sort((a, b) => {
        // First by load (lowest first)
        if (a.baseUnits !== b.baseUnits) {
          return a.baseUnits - b.baseUnits;
        }
        // Then by distance (closest first)
        return a.distanceKm - b.distanceKm;
      });

    // Auto-assign jobs
    const coverWashers: CoverWasher[] = [];
    let remainingJobs = [...jobsToRedistribute];
    let totalCapacity = sortedWashers.length * this.MAX_COVER_PER_WASHER;

    for (const washer of sortedWashers) {
      const availableCapacity = this.MAX_COVER_PER_WASHER;
      const jobsToAssign = Math.min(availableCapacity, remainingJobs.length);

      const assignedJobs = remainingJobs.slice(0, jobsToAssign);
      remainingJobs = remainingJobs.slice(jobsToAssign);

      coverWashers.push({
        id: washer.id,
        name: washer.name,
        baseUnits: washer.baseUnits,
        coverAssigned: jobsToAssign,
        totalUnits: washer.baseUnits + jobsToAssign,
        maxCoverCapacity: this.MAX_COVER_PER_WASHER,
        distanceKm: washer.distanceKm,
        coverJobs: assignedJobs,
        isAcknowledged: false,
      });

      if (remainingJobs.length === 0) break;
    }

    return {
      absentWasher: {
        id: absentWasherId,
        name: absentWasherName,
        totalUnits,
        jobs: jobsToRedistribute,
      },
      coverWashers,
      totalCapacity,
      totalRequired: totalUnits,
      unassignedUnits: remainingJobs.length,
      isCapacitySufficient: remainingJobs.length === 0,
      generatedAt: new Date(),
      status: "DRAFT",
    };
  }

  // ========== MANUAL ADJUSTMENT ==========

  adjustCoverAssignment(
    plan: CoverAssignmentPlan,
    washerId: string,
    newCoverUnits: number
  ): { success: boolean; error?: string; warning?: string } {
    // Validate: cannot be negative
    if (newCoverUnits < 0) {
      return { success: false, error: "Cover units cannot be negative" };
    }

    // Update washer's cover assignment
    const washer = plan.coverWashers.find((w) => w.id === washerId);
    if (!washer) {
      return { success: false, error: "Washer not found in plan" };
    }

    const oldCover = washer.coverAssigned;
    washer.coverAssigned = newCoverUnits;
    washer.totalUnits = washer.baseUnits + newCoverUnits;

    // Recalculate unassigned units
    const totalAssigned = plan.coverWashers.reduce((sum, w) => sum + w.coverAssigned, 0);
    plan.unassignedUnits = plan.totalRequired - totalAssigned;
    plan.isCapacitySufficient = plan.unassignedUnits === 0;

    // Soft limit warning (no longer blocks)
    if (newCoverUnits > this.MAX_COVER_PER_WASHER) {
      console.log(`✓ Override: ${washer.name} ${oldCover} → ${newCoverUnits} units (exceeds recommended max)`);
      return {
        success: true,
        warning: `Override: Exceeds recommended max of ${this.MAX_COVER_PER_WASHER} units`
      };
    }

    console.log(`✓ Adjusted: ${washer.name} ${oldCover} → ${newCoverUnits} units`);
    return { success: true };
  }

  // ========== NOTIFICATION ==========

  confirmAndNotify(plan: CoverAssignmentPlan): { success: boolean } {
    // In production: POST /api/supervisor/cover/notify
    plan.status = "NOTIFIED";
    console.log("Cover washers notified:", plan.coverWashers.map((w) => w.name));
    return { success: true };
  }

  acknowledgeCover(washerId: string, plan: CoverAssignmentPlan): void {
    const washer = plan.coverWashers.find((w) => w.id === washerId);
    if (washer) {
      washer.isAcknowledged = true;
    }
  }

  // ========== ALERTS ==========

  checkPendingCoverAlert(plan: CoverAssignmentPlan, currentTime: Date): boolean {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();

    // 7:45 AM check
    if (hour === 7 && minute >= 45) {
      const pendingUnits = plan.coverWashers.reduce((sum, w) => {
        return sum + (w.isAcknowledged ? 0 : w.coverAssigned);
      }, 0);

      return pendingUnits >= this.CRITICAL_PENDING_THRESHOLD;
    }

    return false;
  }

  // ========== WEEK-OFF SWAP ==========

  createSwapRequest(
    requestedBy: string,
    requestedByName: string,
    swapWith: string,
    swapWithName: string,
    swapDate: Date
  ): WeekOffSwapRequest {
    const requestedDate = new Date();
    const daysDifference = Math.floor(
      (swapDate.getTime() - requestedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      id: `SWAP-${Date.now()}`,
      requestedBy,
      requestedByName,
      swapWith,
      swapWithName,
      requestedDate,
      swapDate,
      noticeGivenDays: daysDifference,
      isValidNotice: daysDifference >= this.MIN_NOTICE_DAYS,
      status: "PENDING",
      coverPlanCreated: false,
    };
  }

  approveSwap(
    request: WeekOffSwapRequest,
    coverPlanCreated: boolean
  ): { success: boolean; error?: string } {
    if (!request.isValidNotice) {
      return { success: false, error: "Insufficient notice (minimum 4 days)" };
    }

    if (!coverPlanCreated) {
      return { success: false, error: "Must create cover plan before approving" };
    }

    request.status = "APPROVED";
    request.coverPlanCreated = true;
    console.log("Swap approved:", request.id);
    return { success: true };
  }

  rejectSwap(request: WeekOffSwapRequest, reason: string): void {
    request.status = "REJECTED";
    console.log("Swap rejected:", request.id, reason);
  }

  // ========== ESCALATION ==========

  escalateToOpsManager(plan: CoverAssignmentPlan, reason: string): void {
    // In production: POST /api/supervisor/escalate
    console.log("Escalated to Ops Manager:", reason);
    console.log("Plan details:", plan);
  }

  contactCustomers(unassignedJobs: CustomerJob[]): void {
    // In production: Trigger customer notification
    console.log("Contacting customers for rescheduling:", unassignedJobs.length, "jobs");
  }
}

// Singleton instance
export const coverRedistributionService = new CoverRedistributionService();
