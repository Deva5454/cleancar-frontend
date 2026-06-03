/**
 * Audit Log Service
 *
 * Tracks all employee lifecycle and data changes with full audit trail
 * Records: Who updated what, when, and why
 */

import { DataService } from "./DataService";
import { logger } from "./logger";

// ========== TYPES ==========

export type AuditEventType =
  | "Employee Created"
  | "Employee Updated"
  | "State Transition"
  | "Onboarding Step"
  | "Approval Requested"
  | "Approval Processed"
  | "Document Uploaded"
  | "Role Assigned"
  | "Shift Assigned"
  | "Validation Check"
  | "Payroll Validation"
  | "Exit Initiated"
  | "Exit Completed";

export type AuditSeverity = "Info" | "Warning" | "Error" | "Critical";

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  auditId: string;
  timestamp: string;
  eventType: AuditEventType;
  severity: AuditSeverity;

  // Who
  performedBy: string;
  performedByRole?: string;

  // What
  entityType: "Employee" | "Attendance" | "Payroll" | "System";
  entityId: string;
  action: string;
  description: string;

  // Details
  changedFields?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: Record<string, any>;

  // Context
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

/**
 * Audit query filters
 */
export interface AuditQueryFilters {
  entityId?: string;
  entityType?: AuditLogEntry["entityType"];
  eventType?: AuditEventType;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  severity?: AuditSeverity;
}

// ========== SERVICE ==========

class AuditLogService {
  private readonly STORAGE_KEY = "AUDIT_LOGS";

  /**
   * Get all audit logs
   */
  getAll(): AuditLogEntry[] {
    return DataService.get<AuditLogEntry>(this.STORAGE_KEY);
  }

  /**
   * Create audit log entry
   */
  log(entry: Omit<AuditLogEntry, "auditId" | "timestamp">): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      ...entry,
      auditId: this.generateAuditId(),
      timestamp: new Date().toISOString(),
    };

    const logs = this.getAll();
    DataService.setAll(this.STORAGE_KEY, [...logs, auditEntry]);

    // Also log to console in development
    if (entry.severity === "Error" || entry.severity === "Critical") {
      logger.error("Audit Log", auditEntry);
    } else {
      logger.log("Audit Log", auditEntry);
    }

    return auditEntry;
  }

  /**
   * Query audit logs with filters
   */
  query(filters: AuditQueryFilters): AuditLogEntry[] {
    let logs = this.getAll();

    if (filters.entityId) {
      logs = logs.filter(log => log.entityId === filters.entityId);
    }

    if (filters.entityType) {
      logs = logs.filter(log => log.entityType === filters.entityType);
    }

    if (filters.eventType) {
      logs = logs.filter(log => log.eventType === filters.eventType);
    }

    if (filters.performedBy) {
      logs = logs.filter(log => log.performedBy === filters.performedBy);
    }

    if (filters.severity) {
      logs = logs.filter(log => log.severity === filters.severity);
    }

    if (filters.startDate) {
      logs = logs.filter(log => log.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      logs = logs.filter(log => log.timestamp <= filters.endDate!);
    }

    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get audit logs for specific employee
   */
  getByEmployee(employeeId: string): AuditLogEntry[] {
    return this.query({ entityId: employeeId, entityType: "Employee" });
  }

  /**
   * Get recent activity
   */
  getRecent(limit: number = 50): AuditLogEntry[] {
    const logs = this.getAll();
    return logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get activity summary
   */
  getSummary(startDate?: string, endDate?: string): {
    totalEvents: number;
    byType: Record<AuditEventType, number>;
    bySeverity: Record<AuditSeverity, number>;
    byUser: Record<string, number>;
  } {
    let logs = this.getAll();

    if (startDate) {
      logs = logs.filter(log => log.timestamp >= startDate);
    }
    if (endDate) {
      logs = logs.filter(log => log.timestamp <= endDate);
    }

    const summary = {
      totalEvents: logs.length,
      byType: {} as Record<AuditEventType, number>,
      bySeverity: {} as Record<AuditSeverity, number>,
      byUser: {} as Record<string, number>,
    };

    logs.forEach(log => {
      // By type
      summary.byType[log.eventType] = (summary.byType[log.eventType] || 0) + 1;

      // By severity
      summary.bySeverity[log.severity] = (summary.bySeverity[log.severity] || 0) + 1;

      // By user
      summary.byUser[log.performedBy] = (summary.byUser[log.performedBy] || 0) + 1;
    });

    return summary;
  }

  /**
   * Export audit logs as CSV
   */
  exportToCSV(filters?: AuditQueryFilters): string {
    const logs = filters ? this.query(filters) : this.getAll();

    const headers = [
      "Audit ID",
      "Timestamp",
      "Event Type",
      "Severity",
      "Performed By",
      "Entity Type",
      "Entity ID",
      "Action",
      "Description",
    ];

    const rows = logs.map(log => [
      log.auditId,
      log.timestamp,
      log.eventType,
      log.severity,
      log.performedBy,
      log.entityType,
      log.entityId,
      log.action,
      log.description,
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");
  }

  /**
   * Clear old logs (retention policy)
   */
  clearOldLogs(daysToKeep: number = 365): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoff = cutoffDate.toISOString();

    const logs = this.getAll();
    const kept = logs.filter(log => log.timestamp >= cutoff);
    const removed = logs.length - kept.length;

    DataService.setAll(this.STORAGE_KEY, kept);

    logger.log("AuditLog: Cleared old logs", { removed, kept: kept.length });
    return removed;
  }

  /**
   * Generate unique audit ID
   */
  private generateAuditId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `AUDIT-${timestamp}-${random}`;
  }

  // ========== CONVENIENCE METHODS ==========

  /**
   * Log employee creation
   */
  logEmployeeCreated(employeeId: string, createdBy: string, metadata?: any): void {
    this.log({
      eventType: "Employee Created",
      severity: "Info",
      performedBy: createdBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "CREATE",
      description: `Employee ${employeeId} created`,
      metadata,
    });
  }

  /**
   * Log employee update
   */
  logEmployeeUpdated(
    employeeId: string,
    updatedBy: string,
    changedFields: AuditLogEntry["changedFields"]
  ): void {
    this.log({
      eventType: "Employee Updated",
      severity: "Info",
      performedBy: updatedBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "UPDATE",
      description: `Employee ${employeeId} updated: ${changedFields?.map(f => f.field).join(", ")}`,
      changedFields,
    });
  }

  /**
   * Log state transition
   */
  logStateTransition(
    employeeId: string,
    fromState: string,
    toState: string,
    triggeredBy: string
  ): void {
    this.log({
      eventType: "State Transition",
      severity: "Info",
      performedBy: triggeredBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "STATE_CHANGE",
      description: `State changed from ${fromState} to ${toState}`,
      changedFields: [
        { field: "state", oldValue: fromState, newValue: toState }
      ],
    });
  }

  /**
   * Log onboarding step completion
   */
  logOnboardingStep(
    employeeId: string,
    step: string,
    completedBy: string
  ): void {
    this.log({
      eventType: "Onboarding Step",
      severity: "Info",
      performedBy: completedBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "ONBOARDING",
      description: `Completed onboarding step: ${step}`,
      metadata: { step },
    });
  }

  /**
   * Log approval request
   */
  logApprovalRequested(
    employeeId: string,
    approvalType: string,
    requestedBy: string
  ): void {
    this.log({
      eventType: "Approval Requested",
      severity: "Info",
      performedBy: requestedBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "APPROVAL_REQUEST",
      description: `${approvalType} approval requested`,
      metadata: { approvalType },
    });
  }

  /**
   * Log approval processing
   */
  logApprovalProcessed(
    employeeId: string,
    approvalType: string,
    status: "Approved" | "Rejected",
    processedBy: string,
    comments?: string
  ): void {
    this.log({
      eventType: "Approval Processed",
      severity: status === "Approved" ? "Info" : "Warning",
      performedBy: processedBy,
      entityType: "Employee",
      entityId: employeeId,
      action: status === "Approved" ? "APPROVE" : "REJECT",
      description: `${approvalType} approval ${status.toLowerCase()}`,
      metadata: { approvalType, status, comments },
    });
  }

  /**
   * Log validation check
   */
  logValidationCheck(
    employeeId: string,
    validationType: string,
    passed: boolean,
    checkedBy: string,
    message?: string
  ): void {
    this.log({
      eventType: "Validation Check",
      severity: passed ? "Info" : "Warning",
      performedBy: checkedBy,
      entityType: "Employee",
      entityId: employeeId,
      action: "VALIDATE",
      description: `${validationType} validation ${passed ? "passed" : "failed"}${message ? `: ${message}` : ""}`,
      metadata: { validationType, passed },
    });
  }
}

// ========== EXPORT ==========

export const auditLogService = new AuditLogService();
