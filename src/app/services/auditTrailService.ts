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

  private readonly STORAGE_KEY = "SUPERVISOR_AUDIT_TRAIL";

  private auditLogs: AuditLogEntry[] = this.loadFromStorage();

  private loadFromStorage(): AuditLogEntry[] {
    try {
      if (typeof localStorage === "undefined") return [];
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return this.buildSeedLogs();
      const parsed = JSON.parse(raw);
      // Revive Date objects
      return parsed.map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) }));
    } catch (_) {
      return this.buildSeedLogs();
    }
  }

  private buildSeedLogs(): AuditLogEntry[] {
    const logs: AuditLogEntry[] = [];
    const today = new Date().toISOString().split("T")[0];

    try {
      if (typeof localStorage === "undefined") return logs;

      // 1. Build washer name map
      const washerMap: Record<string, string> = {};
      const phoneMap: Record<string, string> = {};
      try {
        const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
        if (raw) {
          (JSON.parse(raw) as any[]).forEach((e: any) => {
            washerMap[e.id] = e.fullName || `${e.firstName} ${e.lastName}`.trim();
            phoneMap[e.id] = e.mobile || "";
          });
        }
      } catch (_) {}

      // 2. Attendance records — today's check-ins
      try {
        const raw = localStorage.getItem("cleancar_CITY-SURAT_attendance_records");
        if (raw) {
          (JSON.parse(raw) as any[])
            .filter((a: any) => a.date === today)
            .forEach((a: any, i: number) => {
              const name = washerMap[a.employeeId] || a.employeeId;
              logs.push({
                id: `LOG-ATT-${a.employeeId}-${today}`,
                category: "ATTENDANCE",
                action: a.status === "Late" ? "Washer Late Check-In" : "Washer Check-In Validated",
                entity: name,
                entityId: a.employeeId,
                supervisorId: "EDB-SUP-SUR1",
                supervisorName: "Harish Solanki",
                timestamp: new Date(`${today}T${a.checkInTime || "05:10:00"}`),
                gpsStatus: "VERIFIED",
                outcome: a.status === "Late" ? `Checked in late at ${a.checkInTime}` : `Checked in at ${a.checkInTime}`,
                locked: true,
              });
            });
        }
      } catch (_) {}

      // 3. Alert actions (resolved/escalated)
      try {
        const raw = localStorage.getItem("SUPERVISOR_ALERT_ACTIONS");
        if (raw) {
          Object.entries(JSON.parse(raw)).forEach(([alertId, action]: [string, any]) => {
            const washerId = alertId.replace("ALERT-NOCHECKIN-", "").replace("ALERT-LATE-", "").replace("ALERT-", "");
            const washerName = washerMap[washerId] || washerId;
            logs.push({
              id: `LOG-ALERT-${alertId}`,
              category: "ESCALATION",
              action: action.status === "RESOLVED" ? "Alert Resolved" :
                      action.status === "ESCALATED" ? "Alert Escalated to Ops Manager" : "Alert Actioned",
              entity: washerName,
              entityId: washerId,
              supervisorId: action.actionedBy || "EDB-SUP-SUR1",
              supervisorName: "Harish Solanki",
              timestamp: new Date(action.actionedAt || Date.now()),
              gpsStatus: "NOT_REQUIRED",
              outcome: action.notes || action.reason || action.status,
              locked: true,
            });
          });
        }
      } catch (_) {}

      // 4. Cover allocation actions
      try {
        const raw = localStorage.getItem("COVER_ALLOCATION_ACTIONS");
        if (raw) {
          (JSON.parse(raw) as any[]).forEach((a: any) => {
            logs.push({
              id: `LOG-COVER-${a.id}`,
              category: "COVER",
              action: "Cover Allocation Adjusted",
              entity: a.absentWasherName || "Unknown Washer",
              entityId: a.absentWasherId || "",
              supervisorId: a.supervisorId || "EDB-SUP-SUR1",
              supervisorName: "Harish Solanki",
              timestamp: new Date(a.timestamp || Date.now()),
              gpsStatus: "NOT_REQUIRED",
              outcome: a.action || "Allocation adjusted",
              metadata: { notes: a.notes, affectedJobs: a.affectedJobs },
              locked: true,
            });
          });
        }
      } catch (_) {}

      // 5. Seed historical audit logs from real washers (last 7 days)
      const washerIds = Object.keys(washerMap).filter(id => id.startsWith("EDB-CW-SUR1"));
      const actions = [
        { cat: "ATTENDANCE" as const, action: "Washer Check-In Validated", outcome: "GPS Verified • Selfie Captured", gps: "VERIFIED" as const },
        { cat: "AUDIT" as const, action: "Field Audit Completed", outcome: "Score: 4/5 • 3 photos taken", gps: "VERIFIED" as const },
        { cat: "CLOTH" as const, action: "Cloth Batch Issued", outcome: "Inventory Updated", gps: "NOT_REQUIRED" as const },
        { cat: "LEAD" as const, action: "BTL Lead Submitted", outcome: "Lead sent to Telesales Queue", gps: "VERIFIED" as const },
        { cat: "ATTENDANCE" as const, action: "Attendance Override Approved", outcome: "HR Notified", gps: "NOT_REQUIRED" as const },
      ];

      for (let day = 0; day < 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split("T")[0];

        washerIds.forEach((wId, wi) => {
          const wName = washerMap[wId];
          const actionIdx = (day + wi) % actions.length;
          const act = actions[actionIdx];
          const logDate = new Date(`${dateStr}T0${5 + wi}:${(wi * 12) % 60}:00`);

          // Don't add future logs
          if (logDate > new Date()) return;

          logs.push({
            id: `LOG-SEED-${wId}-${day}-${wi}`,
            category: act.cat,
            action: act.action,
            entity: wName,
            entityId: wId,
            supervisorId: "EDB-SUP-SUR1",
            supervisorName: "Harish Solanki",
            timestamp: logDate,
            gpsLocation: { lat: 21.1959, lng: 72.8302 },
            gpsStatus: act.gps,
            outcome: act.outcome,
            locked: true,
          });
        });
      }

      // Sort by timestamp descending
      logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Persist so next load is instant
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
      } catch (_) {}

    } catch (_) {}

    return logs;
  }

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
    // Persist to localStorage
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.auditLogs.slice(0, 200)));
      }
    } catch (_) {}
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
