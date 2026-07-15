/**
 * Escalation & Emergency Actions Service
 * Time-critical action system with logging
 */

export type IssueStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED";
export type IssueType =
  | "ATTENDANCE"
  | "QUALITY"
  | "DAMAGE"
  | "SAFETY"
  | "TECHNICAL"
  | "CUSTOMER_COMPLAINT"
  | "OTHER";

export interface Issue {
  id: string;
  washerId: string;
  washerName: string;
  type: IssueType;
  status: IssueStatus;
  description: string;
  raisedAt: Date;
  minutesSinceRaised: number;
  isCritical: boolean; // >15 minutes
  resolvedAt?: Date;
  escalatedTo?: string;
}

export interface EscalationSummary {
  openCount: number;
  criticalCount: number;
  avgResponseTimeMinutes: number;
}

export interface EmergencyActionLog {
  id: string;
  action: string;
  supervisorId: string;
  timestamp: Date;
  details: any;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

class EscalationService {
  private readonly CRITICAL_THRESHOLD_MINUTES = 15;

  // ========== ISSUE MANAGEMENT ==========

  getIssues(supervisorId: string): Issue[] {
    // In production: GET /api/supervisor/:id/issues
    const issues: Issue[] = [];

    const issueTypes: IssueType[] = ["ATTENDANCE", "QUALITY", "DAMAGE", "SAFETY", "CUSTOMER_COMPLAINT"];
    const statuses: IssueStatus[] = ["OPEN", "IN_PROGRESS", "ESCALATED"];
    const washerNames = ["Rajesh Kumar", "Amit Patel", "Suresh Shah", "Vikram Singh"];

    for (let i = 0; i < 5; i++) {
      const minutesAgo = Math.floor(Math.random() * 60);
      const raisedAt = new Date(Date.now() - minutesAgo * 60 * 1000);

      issues.push({
        id: `ISSUE-${i + 1}`,
        washerId: `WASHER-${String(i + 1).padStart(3, "0")}`,
        washerName: washerNames[i % washerNames.length],
        type: issueTypes[i % issueTypes.length],
        status: statuses[i % statuses.length],
        description: `Issue ${i + 1} description`,
        raisedAt,
        minutesSinceRaised: minutesAgo,
        isCritical: minutesAgo > this.CRITICAL_THRESHOLD_MINUTES,
      });
    }

    return issues;
  }

  getEscalationSummary(supervisorId: string): EscalationSummary {
    const issues = this.getIssues(supervisorId);
    const openIssues = issues.filter((i) => i.status === "OPEN" || i.status === "IN_PROGRESS");
    const criticalIssues = issues.filter((i) => i.isCritical);

    const avgResponseTime =
      openIssues.length > 0
        ? openIssues.reduce((sum, i) => sum + i.minutesSinceRaised, 0) / openIssues.length
        : 0;

    return {
      openCount: openIssues.length,
      criticalCount: criticalIssues.length,
      avgResponseTimeMinutes: Math.round(avgResponseTime),
    };
  }

  // ========== EMERGENCY ACTIONS ==========

  // 1. Manual Attendance Override
  requestAttendanceOverride(
    washerId: string,
    reason: string,
    selfieUrl: string,
    supervisorId: string
  ): { success: boolean; actionId: string } {
    const action: EmergencyActionLog = {
      id: `ACTION-${Date.now()}`,
      action: "MANUAL_ATTENDANCE_OVERRIDE",
      supervisorId,
      timestamp: new Date(),
      details: { washerId, reason, selfieUrl },
      status: "PENDING",
    };

    // In production: POST /api/supervisor/emergency/attendance-override
    console.log("🚨 MANUAL ATTENDANCE OVERRIDE REQUESTED");
    console.log("Washer:", washerId);
    console.log("Reason:", reason);
    console.log("Selfie:", selfieUrl);
    console.log("Status: Pending Approval (Ops + HR)");
    console.log("Logged:", action);

    return { success: true, actionId: action.id };
  }

  // 2. Force Early Check-Out
  forceEarlyCheckOut(washerId: string, supervisorId: string): { success: boolean } {
    // In production: POST /api/supervisor/emergency/force-checkout
    console.log("🚨 FORCE EARLY CHECK-OUT");
    console.log("Washer:", washerId);
    console.log("Supervisor:", supervisorId);
    console.log("Timestamp:", new Date());
    console.log("System logged: All actions recorded");

    return { success: true };
  }

  // 3. Reassign Cover Cars (navigates to cover screen)
  navigateToCoverReassignment(): void {
    console.log("🚨 REASSIGN COVER CARS");
    console.log("Navigating to cover redistribution screen");
  }

  // 4. Pause Washer Schedule
  pauseWasherSchedule(
    washerId: string,
    reason: string,
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/emergency/pause-schedule
    console.log("🚨 PAUSE WASHER SCHEDULE");
    console.log("Washer:", washerId);
    console.log("Reason:", reason);
    console.log("Effect: All pending cars paused");
    console.log("Notifications sent to:");
    console.log("  - Ops Manager");
    console.log("  - Affected customers");
    console.log("Logged by:", supervisorId);

    return { success: true };
  }

  // 5. Vehicle Damage Escalation
  escalateVehicleDamage(
    washerId: string,
    vehicleDetails: string,
    photoUrl: string,
    notes: string,
    supervisorId: string
  ): { success: boolean; actionId: string } {
    const action: EmergencyActionLog = {
      id: `DAMAGE-${Date.now()}`,
      action: "VEHICLE_DAMAGE_ESCALATION",
      supervisorId,
      timestamp: new Date(),
      details: { washerId, vehicleDetails, photoUrl, notes },
      status: "PENDING",
    };

    // In production: POST /api/supervisor/emergency/vehicle-damage
    console.log("🚨 VEHICLE DAMAGE ESCALATION");
    console.log("Washer:", washerId);
    console.log("Vehicle:", vehicleDetails);
    console.log("Photo:", photoUrl);
    console.log("Notes:", notes);
    console.log("Notified:");
    console.log("  - Customer");
    console.log("  - Ops Manager");
    console.log("⚠️ DO NOT PROCEED UNTIL ACKNOWLEDGED");
    console.log("Logged:", action);

    return { success: true, actionId: action.id };
  }

  // 6. SOS Safety Alert
  triggerSOSAlert(
    supervisorId: string,
    location: { lat: number; lng: number },
    emergencyType: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/emergency/sos
    console.log("🔴🔴🔴 SOS — SAFETY ALERT 🔴🔴🔴");
    console.log("Supervisor:", supervisorId);
    console.log("GPS Location:", location);
    console.log("Emergency Type:", emergencyType);
    console.log("Alert sent to:");
    console.log("  🚨 Supervisor");
    console.log("  🚨 Ops Manager");
    console.log("  🚨 City Manager");
    console.log("GPS shared instantly");
    console.log("Timestamp:", new Date());

    // In production: Trigger SMS, push notifications, calls
    return { success: true };
  }

  // 7. Incentive Override Request
  requestIncentiveOverride(
    caseType: string,
    reason: string,
    supervisorId: string
  ): { success: boolean; requestId: string } {
    const request: EmergencyActionLog = {
      id: `INCENTIVE-${Date.now()}`,
      action: "INCENTIVE_OVERRIDE_REQUEST",
      supervisorId,
      timestamp: new Date(),
      details: { caseType, reason },
      status: "PENDING",
    };

    // In production: POST /api/supervisor/emergency/incentive-override
    console.log("🚨 INCENTIVE OVERRIDE REQUEST");
    console.log("Case Type:", caseType);
    console.log("Reason:", reason);
    console.log("Supervisor:", supervisorId);
    console.log("Status: Under Review");
    console.log("Logged:", request);

    return { success: true, requestId: request.id };
  }

  // 8. Reassign Car
  reassignCar(
    carId: string,
    fromWasherId: string,
    toWasherId: string,
    reason: string,
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/emergency/reassign-car
    console.log("🚨 REASSIGN CAR");
    console.log("Car:", carId);
    console.log("From:", fromWasherId);
    console.log("To:", toWasherId);
    console.log("Reason:", reason);
    console.log("Hierarchy notified:");
    console.log("  - Ops Manager");
    console.log("  - Both washers");
    console.log("Logged by:", supervisorId);

    return { success: true };
  }

  // 9. Batch Invalidation
  invalidateBatch(
    washerId: string,
    batchId: string,
    reason: string,
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/emergency/invalidate-batch
    console.log("🚨 BATCH INVALIDATION");
    console.log("Washer:", washerId);
    console.log("Batch:", batchId);
    console.log("Reason:", reason);
    console.log("Actions:");
    console.log("  ✓ Batch marked invalid");
    console.log("  ✓ Replacement issued");
    console.log("  ✓ Incident logged");
    console.log("Logged by:", supervisorId);

    return { success: true };
  }

  // 10. Escalate to Ops Manager
  escalateToOpsManager(
    issueId: string,
    reason: string,
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/emergency/escalate-ops
    console.log("🚨 ESCALATE TO OPS MANAGER");
    console.log("Issue:", issueId);
    console.log("Reason:", reason);
    console.log("Supervisor:", supervisorId);
    console.log("Push + SMS sent");
    console.log("⚠️ Issue cannot close without acknowledgement");
    console.log("Timestamp:", new Date());

    return { success: true };
  }

  // ========== ISSUE ACTIONS ==========

  markInProgress(issueId: string, supervisorId: string): { success: boolean } {
    console.log("Issue marked in progress:", issueId, "by", supervisorId);
    return { success: true };
  }

  resolveIssue(issueId: string, resolution: string, supervisorId: string): { success: boolean } {
    console.log("Issue resolved:", issueId);
    console.log("Resolution:", resolution);
    console.log("Resolved by:", supervisorId);
    return { success: true };
  }
}

// Singleton instance
export const escalationService = new EscalationService();
