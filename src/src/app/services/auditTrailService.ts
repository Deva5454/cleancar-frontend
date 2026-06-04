/**
 * Audit Trail Service
 * Captures and logs every critical action with full traceability
 */

export type ActionCategory = "ATTENDANCE" | "AUDIT" | "LEAD" | "CLOTH" | "ESCALATION" | "COVER" | "OTHER";

export interface AuditLogEntry {
  id: string;
  category: ActionCategory;
  action: string;
  entity: string; // Washer name, Lead ID, Batch ID, etc.
  entityId: string;
  supervisorId: string;
  supervisorName: string;
  timestamp: Date;
  gpsLocation?: { lat: number; lng: number };
  gpsStatus?: "VERIFIED" | "MISMATCH" | "NOT_REQUIRED";
  outcome: string;
  metadata?: Record<string, any>;
  locked: boolean; // Once locked, cannot be edited
}

export interface ActionConfirmation {
  title: string;
  message: string;
  timestamp: Date;
  gpsVerified?: boolean;
  linkedEntity: string;
  category: ActionCategory;
  icon: "success" | "warning" | "info";
}

export interface AuditTrailSummary {
  total: number;
  attendance: number;
  audits: number;
  leads: number;
  cloth: number;
  escalations: number;
  todayLogs: number;
}

class AuditTrailService {
  // ========== ACTION LOGGING ==========

  logAction(params: {
    category: ActionCategory;
    action: string;
    entity: string;
    entityId: string;
    supervisorId: string;
    supervisorName: string;
    gpsLocation?: { lat: number; lng: number };
    gpsStatus?: "VERIFIED" | "MISMATCH" | "NOT_REQUIRED";
    outcome: string;
    metadata?: Record<string, any>;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `LOG-${Date.now()}`,
      category: params.category,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      supervisorId: params.supervisorId,
      supervisorName: params.supervisorName,
      timestamp: new Date(),
      gpsLocation: params.gpsLocation,
      gpsStatus: params.gpsStatus || "NOT_REQUIRED",
      outcome: params.outcome,
      metadata: params.metadata,
      locked: true, // All logs are immutable
    };

    console.log("🔒 AUDIT LOG CREATED:", entry);
    // Store in memory
    this.storeLog(entry);
    // In production: POST /api/audit-trail

    return entry;
  }

  // ========== SPECIFIC ACTION CONFIRMATIONS ==========

  // 1. Supervisor Check-In
  logSupervisorCheckIn(
    supervisorId: string,
    supervisorName: string,
    gpsLocation: { lat: number; lng: number },
    selfieUrl: string
  ): ActionConfirmation {
    this.logAction({
      category: "ATTENDANCE",
      action: "Supervisor Check-In",
      entity: supervisorName,
      entityId: supervisorId,
      supervisorId,
      supervisorName,
      gpsLocation,
      gpsStatus: "VERIFIED",
      outcome: "Check-in successful",
      metadata: { selfieUrl },
    });

    return {
      title: "✅ Check-in Recorded",
      message: "Location Verified • Selfie Captured",
      timestamp: new Date(),
      gpsVerified: true,
      linkedEntity: supervisorName,
      category: "ATTENDANCE",
      icon: "success",
    };
  }

  // 2. Washer Check-In Validation
  logWasherCheckInValidation(
    washerId: string,
    washerName: string,
    gpsMatch: boolean,
    selfieVerified: boolean,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "ATTENDANCE",
      action: "Washer Check-In Validation",
      entity: washerName,
      entityId: washerId,
      supervisorId,
      supervisorName: "Supervisor",
      gpsStatus: gpsMatch ? "VERIFIED" : "MISMATCH",
      outcome: gpsMatch ? "GPS Verified" : "GPS Mismatch Flagged",
      metadata: { selfieVerified },
    });

    return {
      title: gpsMatch ? "✅ GPS Verified" : "🔴 GPS Mismatch Flagged",
      message: `${washerName} • Check-in ${gpsMatch ? "approved" : "requires review"}`,
      timestamp: new Date(),
      gpsVerified: gpsMatch,
      linkedEntity: washerName,
      category: "ATTENDANCE",
      icon: gpsMatch ? "success" : "warning",
    };
  }

  // 3. Cover Assignment
  logCoverAssignment(
    absentWasherId: string,
    coverWasherId: string,
    coverWasherName: string,
    unitsAssigned: number,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "COVER",
      action: "Cover Assignment",
      entity: coverWasherName,
      entityId: coverWasherId,
      supervisorId,
      supervisorName: "Supervisor",
      outcome: `${unitsAssigned} units assigned`,
      metadata: { absentWasherId, unitsAssigned },
    });

    return {
      title: "✅ Assignment Logged",
      message: `${coverWasherName} • ${unitsAssigned} units reassigned`,
      timestamp: new Date(),
      linkedEntity: coverWasherName,
      category: "COVER",
      icon: "success",
    };
  }

  // 4. Field Audit
  logFieldAudit(
    washerId: string,
    washerName: string,
    score: number,
    gpsLocation: { lat: number; lng: number },
    photoCount: number,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "AUDIT",
      action: "Field Audit Completed",
      entity: washerName,
      entityId: washerId,
      supervisorId,
      supervisorName: "Supervisor",
      gpsLocation,
      gpsStatus: "VERIFIED",
      outcome: `Score: ${score}/5 • Photos: ${photoCount}`,
      metadata: { score, photoCount },
    });

    return {
      title: "🔒 Audit Locked — No Edits Allowed",
      message: `${washerName} • Score: ${score}/5 • ${photoCount} photos`,
      timestamp: new Date(),
      gpsVerified: true,
      linkedEntity: washerName,
      category: "AUDIT",
      icon: "success",
    };
  }

  // 5. Cloth Batch Issue
  logClothBatchIssue(
    washerId: string,
    washerName: string,
    batchId: string,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "CLOTH",
      action: "Cloth Batch Issued",
      entity: `${washerName} - Batch ${batchId}`,
      entityId: batchId,
      supervisorId,
      supervisorName: "Supervisor",
      outcome: "Inventory Updated",
      metadata: { washerId, batchId },
    });

    return {
      title: "✅ Inventory Updated",
      message: `Batch ${batchId} issued to ${washerName}`,
      timestamp: new Date(),
      linkedEntity: washerName,
      category: "CLOTH",
      icon: "success",
    };
  }

  // 6. Cloth Batch Collection
  logClothBatchCollection(
    washerId: string,
    washerName: string,
    batchId: string,
    condition: string,
    count: number,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "CLOTH",
      action: "Cloth Batch Collected",
      entity: `${washerName} - Batch ${batchId}`,
      entityId: batchId,
      supervisorId,
      supervisorName: "Supervisor",
      outcome: `${count} cloths collected - ${condition}`,
      metadata: { washerId, batchId, condition, count },
    });

    return {
      title: "✅ Inventory Updated",
      message: `Batch ${batchId} collected from ${washerName} • ${count} cloths • ${condition}`,
      timestamp: new Date(),
      linkedEntity: washerName,
      category: "CLOTH",
      icon: "success",
    };
  }

  // 7. Lead Submission
  logLeadSubmission(
    leadId: string,
    customerName: string,
    leadType: string,
    gpsLocation: { lat: number; lng: number },
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "LEAD",
      action: "BTL Lead Submitted",
      entity: `${customerName} (${leadType})`,
      entityId: leadId,
      supervisorId,
      supervisorName: "Supervisor",
      gpsLocation,
      gpsStatus: "VERIFIED",
      outcome: "Lead sent to Telesales Queue",
      metadata: { customerName, leadType },
    });

    return {
      title: "✅ Lead Submitted to Telesales Queue",
      message: `${customerName} • ${leadType} • Location captured`,
      timestamp: new Date(),
      gpsVerified: true,
      linkedEntity: customerName,
      category: "LEAD",
      icon: "success",
    };
  }

  // 8. Escalation Action
  logEscalationAction(
    actionType: string,
    reason: string,
    washerId: string,
    washerName: string,
    supervisorId: string
  ): ActionConfirmation {
    this.logAction({
      category: "ESCALATION",
      action: actionType,
      entity: washerName,
      entityId: washerId,
      supervisorId,
      supervisorName: "Supervisor",
      outcome: "Escalation Logged & Shared",
      metadata: { actionType, reason },
    });

    return {
      title: "✅ Escalation Logged & Shared",
      message: `${actionType} • ${washerName} • Ops Manager notified`,
      timestamp: new Date(),
      linkedEntity: washerName,
      category: "ESCALATION",
      icon: "info",
    };
  }

  // ========== AUDIT TRAIL RETRIEVAL ==========

  private auditLogs: AuditLogEntry[] = [];

  getAuditTrail(
    supervisorId: string,
    filter?: ActionCategory,
    date?: Date
  ): AuditLogEntry[] {
    // In production: GET /api/audit-trail?supervisorId=X&filter=Y&date=Z

    let filteredLogs = this.auditLogs;

    // Filter by supervisor if needed
    if (supervisorId !== "ALL") {
      filteredLogs = filteredLogs.filter(log => log.supervisorId === supervisorId);
    }

    // Filter by category
    if (filter) {
      filteredLogs = filteredLogs.filter(log => log.category === filter);
    }

    // Filter by date
    if (date) {
      const targetDate = date.toDateString();
      filteredLogs = filteredLogs.filter(log => log.timestamp.toDateString() === targetDate);
    }

    return filteredLogs;
  }

  getAllAuditLogs(): AuditLogEntry[] {
    return this.auditLogs;
  }

  private storeLog(entry: AuditLogEntry): void {
    this.auditLogs.unshift(entry); // Add to beginning for reverse chronological order
    // Keep only last 1000 logs in memory
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(0, 1000);
    }
  }

  getAuditTrailSummary(supervisorId: string = "ALL"): AuditTrailSummary {
    const logs = this.getAuditTrail(supervisorId);
    const today = new Date().toDateString();
    const todayLogs = logs.filter((log) => log.timestamp.toDateString() === today);

    return {
      total: logs.length,
      attendance: logs.filter((log) => log.category === "ATTENDANCE").length,
      audits: logs.filter((log) => log.category === "AUDIT").length,
      leads: logs.filter((log) => log.category === "LEAD").length,
      cloth: logs.filter((log) => log.category === "CLOTH").length,
      escalations: logs.filter((log) => log.category === "ESCALATION").length,
      todayLogs: todayLogs.length,
    };
  }
}

// Singleton instance
export const auditTrailService = new AuditTrailService();
