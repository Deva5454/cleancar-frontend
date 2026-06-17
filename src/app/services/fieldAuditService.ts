/**
 * Field Audit Service
 * Handles quality control audits with strict compliance
 */

export type AuditStatus = "COMPLETED" | "PENDING" | "OVERDUE";
export type AuditResult = "PASS" | "MINOR" | "MAJOR" | "FAILED";
export type PackageType = "WATER_WASH" | "SHAMPOO_WASH" | "SHAMPOO_WAX";

export interface AuditWasher {
  id: string;
  name: string;
  lastAuditDate?: Date;
  daysSinceAudit: number;
  status: AuditStatus;
  currentLocation?: { lat: number; lng: number };
  activeJob?: string;
}

export interface AuditChecklistItem {
  id: string;
  category: "DAILY" | "WEEKLY" | "MONTHLY";
  item: string;
  isCompleted: boolean;
  isRequired: boolean;
}

export interface AuditPhoto {
  id: string;
  url: string;
  timestamp: Date;
  type: "WASH_IN_PROGRESS" | "PRE_DAMAGE" | "QUALITY_ISSUE";
}

export interface AuditSubmission {
  auditId: string;
  washerId: string;
  washerName: string;
  supervisorId: string;
  packageType: PackageType;
  gps: { lat: number; lng: number; isValid: boolean };
  timestamp: Date;
  photos: AuditPhoto[];
  checklist: AuditChecklistItem[];
  score: number;
  result: AuditResult;
  feedback?: string;
  preDamageDetected: boolean;
}

export interface AuditResultAction {
  result: AuditResult;
  message: string;
  color: "green" | "amber" | "red";
  requiresFeedback: boolean;
  reAuditSchedule?: string;
  escalated: boolean;
}

class FieldAuditService {
  private readonly GPS_TOLERANCE_METERS = 10;
  private readonly OVERDUE_DAYS = 4;
  private readonly PASS_THRESHOLD = 80;
  private readonly MINOR_THRESHOLD = 60;

  // ========== AUDIT DASHBOARD ==========

  getAuditWashers(supervisorId: string): AuditWasher[] {
    // Read real washers from EMPLOYEE_DATABASE_RECORDS
    const PINCODE_GPS: Record<string, { lat: number; lng: number }> = {
      "395001": { lat: 21.1959, lng: 72.8302 },
      "PIN-395001": { lat: 21.1959, lng: 72.8302 },
      "395007": { lat: 21.1384, lng: 72.7842 },
      "PIN-395007": { lat: 21.1384, lng: 72.7842 },
      "395009": { lat: 21.1783, lng: 72.7942 },
      "PIN-395009": { lat: 21.1783, lng: 72.7942 },
    };

    try {
      const raw = typeof localStorage !== "undefined"
        ? localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") : null;
      if (raw) {
        const allEmps: any[] = JSON.parse(raw);
        // Find supervisor pincodes
        const sup = allEmps.find((e: any) =>
          e.id === supervisorId || e.loginMobile === supervisorId
        );
        const supPins: string[] = sup?.pinCodes || [];
        const washers = allEmps.filter((e: any) =>
          e.designation === "Car Washer" &&
          (supPins.length === 0 || (e.pinCodes || []).some((p: string) => supPins.includes(p)))
        );

        if (washers.length > 0) {
          return washers.map((w: any, i: number) => {
            // Get last audit from localStorage
            let daysSince = 5; // default PENDING
            let lastAuditDate: Date | undefined;
            try {
              const auditRaw = localStorage.getItem(`SUPERVISOR_AUDITS_${w.id}`);
              if (auditRaw) {
                const audits = JSON.parse(auditRaw);
                if (audits.length > 0) {
                  const last = audits[audits.length - 1];
                  lastAuditDate = new Date(last.timestamp);
                  daysSince = Math.floor((Date.now() - lastAuditDate.getTime()) / 86400000);
                }
              }
            } catch (_) {}

            const pin = (w.pinCodes || [])[0] || "395001";
            const base = PINCODE_GPS[pin] || { lat: 21.1702, lng: 72.8311 };

            return {
              id: w.id,
              name: w.fullName || `${w.firstName || ""} ${w.lastName || ""}`.trim(),
              lastAuditDate,
              daysSinceAudit: daysSince,
              status: !lastAuditDate
                ? ("OVERDUE" as const)
                : daysSince >= this.OVERDUE_DAYS
                  ? ("OVERDUE" as const)
                  : daysSince >= 3
                    ? ("PENDING" as const)
                    : ("COMPLETED" as const),
              currentLocation: {
                lat: base.lat + Math.sin(i * 1.7) * 0.002,
                lng: base.lng + Math.cos(i * 1.7) * 0.002,
              },
              activeJob: w.id,
            };
          });
        }
      }
    } catch (_) {}

    // Fallback — real Surat washer names if EDB not loaded
    const fallback = [
      { id: "EDB-CW-SUR1A", name: "Mahesh Bharwad" },
      { id: "EDB-CW-SUR1B", name: "Ramesh Koli" },
      { id: "EDB-CW-SUR1C", name: "Sunil Thakor" },
    ];
    return fallback.map((w, i) => ({
      id: w.id,
      name: w.name,
      lastAuditDate: undefined,
      daysSinceAudit: 5,
      status: "PENDING" as const,
      currentLocation: { lat: 21.1959 + i * 0.002, lng: 72.8302 + i * 0.002 },
      activeJob: w.id,
    }));
  }

  getAuditSummary(supervisorId: string) {
    const washers = this.getAuditWashers(supervisorId);
    return {
      todayTarget: 4,
      completed: washers.filter((w) => w.status === "COMPLETED").length,
      pending: washers.filter((w) => w.status === "PENDING").length,
      overdue: washers.filter((w) => w.status === "OVERDUE").length,
    };
  }

  // ========== AUDIT CHECKLIST (DYNAMIC) ==========

  getAuditChecklist(packageType: PackageType): AuditChecklistItem[] {
    const baseChecklist: AuditChecklistItem[] = [
      // WATER WASH (All packages include this)
      { id: "1", category: "DAILY", item: "Pressure rinse", isCompleted: false, isRequired: true },
      { id: "2", category: "DAILY", item: "Wheel rim rinse", isCompleted: false, isRequired: true },
      { id: "3", category: "DAILY", item: "Tyre spray", isCompleted: false, isRequired: true },
      { id: "4", category: "DAILY", item: "Glass wipe", isCompleted: false, isRequired: true },
      { id: "5", category: "WEEKLY", item: "Door jam cleaning", isCompleted: false, isRequired: false },
    ];

    if (packageType === "SHAMPOO_WASH" || packageType === "SHAMPOO_WAX") {
      baseChecklist.push(
        { id: "6", category: "DAILY", item: "Foam application", isCompleted: false, isRequired: true },
        { id: "7", category: "DAILY", item: "Glass polish", isCompleted: false, isRequired: true },
        { id: "8", category: "WEEKLY", item: "Dashboard wipe", isCompleted: false, isRequired: false }
      );
    }

    if (packageType === "SHAMPOO_WAX") {
      baseChecklist.push(
        { id: "9", category: "DAILY", item: "Wax application", isCompleted: false, isRequired: true },
        { id: "10", category: "MONTHLY", item: "Interior vacuuming", isCompleted: false, isRequired: false }
      );
    }

    return baseChecklist;
  }

  // ========== GPS VALIDATION ==========

  validateGPS(
    supervisorGPS: { lat: number; lng: number },
    washerGPS: { lat: number; lng: number }
  ): { isValid: boolean; distanceMeters: number } {
    // Haversine formula (simplified)
    const R = 6371e3; // Earth radius in meters
    const phi1 = (supervisorGPS.lat * Math.PI) / 180;
    const phi2 = (washerGPS.lat * Math.PI) / 180;
    const deltaPhi = ((washerGPS.lat - supervisorGPS.lat) * Math.PI) / 180;
    const deltaLambda = ((washerGPS.lng - supervisorGPS.lng) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return {
      isValid: distance <= this.GPS_TOLERANCE_METERS,
      distanceMeters: Math.round(distance),
    };
  }

  // ========== AUDIT SCORING ==========

  calculateScore(checklist: AuditChecklistItem[]): number {
    const requiredItems = checklist.filter((item) => item.isRequired);
    const completedRequired = requiredItems.filter((item) => item.isCompleted).length;

    const optionalItems = checklist.filter((item) => !item.isRequired);
    const completedOptional = optionalItems.filter((item) => item.isCompleted).length;

    // Required items: 80% weight, Optional: 20% weight
    const requiredScore = requiredItems.length > 0 ? (completedRequired / requiredItems.length) * 80 : 80;
    const optionalScore = optionalItems.length > 0 ? (completedOptional / optionalItems.length) * 20 : 20;

    return Math.round(requiredScore + optionalScore);
  }

  getAuditResult(score: number): AuditResult {
    if (score >= this.PASS_THRESHOLD) return "PASS";
    if (score >= this.MINOR_THRESHOLD) return "MINOR";
    return "MAJOR";
  }

  getResultAction(result: AuditResult, isRepeatFailure: boolean): AuditResultAction {
    if (isRepeatFailure) {
      return {
        result: "FAILED",
        message: "Repeated failure - Escalated to City Manager",
        color: "red",
        requiresFeedback: true,
        escalated: true,
      };
    }

    switch (result) {
      case "PASS":
        return {
          result: "PASS",
          message: "Audit passed! Quality standards met.",
          color: "green",
          requiresFeedback: false,
          escalated: false,
        };
      case "MINOR":
        return {
          result: "MINOR",
          message: "Minor issues found. Feedback required.",
          color: "amber",
          requiresFeedback: true,
          reAuditSchedule: "2 days",
          escalated: false,
        };
      case "MAJOR":
        return {
          result: "MAJOR",
          message: "Major issues - Warning issued. Ops Manager notified.",
          color: "red",
          requiresFeedback: true,
          reAuditSchedule: "Next day",
          escalated: true,
        };
      default:
        return {
          result: "FAILED",
          message: "Audit failed",
          color: "red",
          requiresFeedback: true,
          escalated: true,
        };
    }
  }

  // ========== SUBMISSION ==========

  submitAudit(submission: AuditSubmission): { success: boolean; error?: string } {
    // Validate GPS
    if (!submission.gps.isValid) {
      return { success: false, error: "GPS validation failed. Must be within 10m of washer." };
    }

    // Validate photos
    if (submission.photos.length === 0) {
      return { success: false, error: "At least one photo is required." };
    }

    // Calculate score
    const score = this.calculateScore(submission.checklist);
    submission.score = score;
    submission.result = this.getAuditResult(score);

    // Handle pre-damage
    if (submission.preDamageDetected) {
      console.log("PRE-DAMAGE DETECTED:", submission.washerId);
      console.log("Supervisor must reach in 15 minutes");
      // In production: Trigger alerts
    }

    // In production: POST /api/supervisor/audit/submit
    console.log("Audit submitted:", submission);
    return { success: true };
  }

  // ========== PRE-WASH DAMAGE ==========

  reportPreDamage(
    washerId: string,
    photos: AuditPhoto[],
    supervisorId: string
  ): { success: boolean } {
    // In production: POST /api/supervisor/pre-damage
    console.log("Pre-damage reported:", washerId);
    console.log("Photos:", photos.length);
    console.log("Supervisor:", supervisorId);
    console.log("Customer and Management notified");
    console.log("Wash paused - supervisor must reach in 15 min");

    return { success: true };
  }

  // ========== CORRECTION REQUEST ==========

  requestCorrection(auditId: string, reason: string): { success: boolean } {
    // In production: POST /api/supervisor/audit/correction
    console.log("Correction requested for audit:", auditId);
    console.log("Reason:", reason);
    return { success: true };
  }
}

// Singleton instance
export const fieldAuditService = new FieldAuditService();
