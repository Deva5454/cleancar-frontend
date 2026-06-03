/**
 * Audit Service - Complete Audit Trail for Business Operations
 *
 * Purpose:
 * - Log all business-critical operations
 * - Track success, failure, and errors
 * - Provide audit trail for compliance
 * - Enable troubleshooting and debugging
 *
 * Usage:
 * ```typescript
 * AuditService.log({
 *   action: "LEAD_CONVERTED",
 *   entityType: "Lead",
 *   entityId: "LEAD-123",
 *   userId: "USER-001",
 *   status: "SUCCESS",
 *   metadata: { revenue: 1599 }
 * });
 * ```
 */

import { logger } from "./logger";

export interface AuditLogEntry {
  auditId: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  userId?: string;
  status: "STARTED" | "SUCCESS" | "FAILED" | "ERROR";
  metadata?: Record<string, any>;
  error?: string;
  duration?: number;
}

class AuditServiceClass {
  private logs: AuditLogEntry[] = [];
  private storageKey = "AUDIT_LOGS";

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load audit logs from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
        logger.debug("AuditService: Loaded logs from storage", { count: this.logs.length });
      }
    } catch (error) {
      logger.error("AuditService: Failed to load logs", error as Error);
    }
  }

  /**
   * Save audit logs to localStorage
   */
  private saveToStorage() {
    try {
      // Keep only last 1000 logs to prevent storage overflow
      const logsToSave = this.logs.slice(-1000);
      localStorage.setItem(this.storageKey, JSON.stringify(logsToSave));
    } catch (error) {
      logger.error("AuditService: Failed to save logs", error as Error);
    }
  }

  /**
   * Log an audit entry
   */
  log(entry: Omit<AuditLogEntry, "auditId" | "timestamp">): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      ...entry,
      auditId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.push(auditEntry);
    this.saveToStorage();

    // Log to console in development
    logger.debug("Audit logged", {
      action: entry.action,
      status: entry.status,
      entityId: entry.entityId,
    });

    return auditEntry;
  }

  /**
   * Get logs by action
   */
  getLogsByAction(action: string): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  /**
   * Get logs by entity
   */
  getLogsByEntity(entityType: string, entityId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.entityType === entityType && log.entityId === entityId);
  }

  /**
   * Get logs by user
   */
  getLogsByUser(userId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.userId === userId);
  }

  /**
   * Get logs by status
   */
  getLogsByStatus(status: AuditLogEntry["status"]): AuditLogEntry[] {
    return this.logs.filter(log => log.status === status);
  }

  /**
   * Get logs by date range
   */
  getLogsByDateRange(startDate: string, endDate: string): AuditLogEntry[] {
    return this.logs.filter(log => {
      const logDate = log.timestamp.split("T")[0];
      return logDate >= startDate && logDate <= endDate;
    });
  }

  /**
   * Get all logs
   */
  getAllLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number = 50): AuditLogEntry[] {
    return this.logs.slice(-count).reverse();
  }

  /**
   * Get failed operations
   */
  getFailedOperations(): AuditLogEntry[] {
    return this.logs.filter(log => log.status === "FAILED" || log.status === "ERROR");
  }

  /**
   * Clear old logs (older than N days)
   */
  clearOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffISO = cutoffDate.toISOString();

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffISO);
    const afterCount = this.logs.length;

    this.saveToStorage();

    logger.log("AuditService: Cleared old logs", {
      removed: beforeCount - afterCount,
      remaining: afterCount,
    });
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const total = this.logs.length;
    const success = this.logs.filter(l => l.status === "SUCCESS").length;
    const failed = this.logs.filter(l => l.status === "FAILED").length;
    const errors = this.logs.filter(l => l.status === "ERROR").length;

    const actionCounts = this.logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      success,
      failed,
      errors,
      successRate: total > 0 ? ((success / total) * 100).toFixed(2) : "0",
      actionCounts,
    };
  }
}

export const AuditService = new AuditServiceClass();
