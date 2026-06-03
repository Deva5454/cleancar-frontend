/**
 * Smart Alerts Service
 *
 * AI-based alert generation for HR anomalies
 * Detects: Late attendance, missing check-outs, overtime anomalies
 */

import { DataService } from "./DataService";
import { attendanceMaster } from "./attendanceMaster";
import { logger } from "./logger";

// ========== TYPES ==========

export type AlertType =
  | "LATE_ATTENDANCE"
  | "MISSING_CHECKOUT"
  | "OVERTIME_ANOMALY"
  | "CONSECUTIVE_LATES"
  | "PATTERN_CHANGE"
  | "SUSPICIOUS_HOURS";

export type AlertPriority = "Low" | "Medium" | "High" | "Critical";
export type AlertStatus = "Active" | "Acknowledged" | "Resolved" | "Dismissed";

export interface SmartAlert {
  alertId: string;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;

  // Employee info
  employeeId: string;
  employeeName: string;
  cityId: string;

  // Alert details
  title: string;
  description: string;
  detectedAt: string;
  affectedDates: string[];

  // Metrics
  metrics?: {
    lateBy?: number; // minutes
    hoursWorked?: number;
    expectedHours?: number;
    consecutiveDays?: number;
  };

  // Actions
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface AlertSummary {
  total: number;
  byType: Record<AlertType, number>;
  byPriority: Record<AlertPriority, number>;
  byStatus: Record<AlertStatus, number>;
  topEmployees: Array<{ employeeId: string; name: string; count: number }>;
}

// ========== SERVICE ==========

class SmartAlertsService {
  private readonly STORAGE_KEY = "SMART_ALERTS";

  /**
   * Generate alerts for today
   */
  generateDailyAlerts(date: string): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const records = attendanceMaster.getByDate(date);

    records.forEach(record => {
      // Late attendance alert
      if (record.checkInTime) {
        const parts = record.checkInTime.split(':');
        const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
        const lateBy = minutes - (9 * 60); // 9:00 AM standard

        if (lateBy > 15) { // More than 15 minutes late
          alerts.push({
            alertId: this.generateAlertId(),
            type: "LATE_ATTENDANCE",
            priority: lateBy > 60 ? "High" : "Medium",
            status: "Active",
            employeeId: record.employeeId,
            employeeName: record.employeeId, // Would be populated from employee master
            cityId: record.cityId,
            title: "Late Check-In",
            description: `Employee checked in at ${record.checkInTime} (${Math.floor(lateBy / 60)}h ${lateBy % 60}m late)`,
            detectedAt: new Date().toISOString(),
            affectedDates: [date],
            metrics: { lateBy },
          });
        }
      }

      // Missing checkout alert
      if (record.status === "Present" && !record.checkOutTime) {
        const today = new Date().toISOString().split('T')[0];
        if (date < today) { // Only alert for past dates
          alerts.push({
            alertId: this.generateAlertId(),
            type: "MISSING_CHECKOUT",
            priority: "Medium",
            status: "Active",
            employeeId: record.employeeId,
            employeeName: record.employeeId,
            cityId: record.cityId,
            title: "Missing Check-Out",
            description: `No check-out time recorded for ${date}`,
            detectedAt: new Date().toISOString(),
            affectedDates: [date],
          });
        }
      }

      // Overtime anomaly alert
      if (record.hoursWorked && record.hoursWorked > 12) {
        alerts.push({
          alertId: this.generateAlertId(),
          type: "OVERTIME_ANOMALY",
          priority: "High",
          status: "Active",
          employeeId: record.employeeId,
          employeeName: record.employeeId,
          cityId: record.cityId,
          title: "Excessive Overtime",
          description: `Worked ${record.hoursWorked} hours (expected ~9 hours)`,
          detectedAt: new Date().toISOString(),
          affectedDates: [date],
          metrics: {
            hoursWorked: record.hoursWorked,
            expectedHours: 9,
          },
        });
      }
    });

    // Save new alerts
    alerts.forEach(alert => this.saveAlert(alert));

    logger.log("SmartAlerts: Generated daily alerts", {
      date,
      count: alerts.length,
    });

    return alerts;
  }

  /**
   * Generate pattern-based alerts (weekly)
   */
  generatePatternAlerts(employeeId: string): SmartAlert[] {
    const alerts: SmartAlert[] = [];
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const startDate = last30Days.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];

    const records = attendanceMaster.getByDateRange(employeeId, startDate, endDate);

    // Check for consecutive late days
    let consecutiveLates = 0;
    const lateDates: string[] = [];

    records
      .sort((a, b) => a.date.localeCompare(b.date))
      .forEach(record => {
        if (record.checkInTime) {
          const parts = record.checkInTime.split(':');
          const minutes = parseInt(parts[0]) * 60 + parseInt(parts[1]);
          const isLate = minutes > 9 * 60 + 15;

          if (isLate) {
            consecutiveLates++;
            lateDates.push(record.date);
          } else {
            if (consecutiveLates >= 3) {
              // Alert: 3+ consecutive late days
              alerts.push({
                alertId: this.generateAlertId(),
                type: "CONSECUTIVE_LATES",
                priority: consecutiveLates >= 5 ? "Critical" : "High",
                status: "Active",
                employeeId: record.employeeId,
                employeeName: record.employeeId,
                cityId: record.cityId,
                title: "Pattern: Consecutive Late Arrivals",
                description: `Late for ${consecutiveLates} consecutive days`,
                detectedAt: new Date().toISOString(),
                affectedDates: lateDates.slice(-consecutiveLates),
                metrics: { consecutiveDays: consecutiveLates },
              });
            }
            consecutiveLates = 0;
            lateDates.length = 0;
          }
        }
      });

    // Check for pattern changes (last 7 days vs previous 7 days)
    const last7Days = records.filter(r => {
      const recordDate = new Date(r.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= weekAgo;
    });

    const previous7Days = records.filter(r => {
      const recordDate = new Date(r.date);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return recordDate >= twoWeeksAgo && recordDate < weekAgo;
    });

    if (last7Days.length >= 3 && previous7Days.length >= 3) {
      const avgLast7 = this.calculateAverageCheckInMinutes(last7Days);
      const avgPrevious7 = this.calculateAverageCheckInMinutes(previous7Days);
      const change = avgLast7 - avgPrevious7;

      if (Math.abs(change) > 60) { // More than 1 hour change
        alerts.push({
          alertId: this.generateAlertId(),
          type: "PATTERN_CHANGE",
          priority: "Medium",
          status: "Active",
          employeeId,
          employeeName: employeeId,
          cityId: records[0]?.cityId || "",
          title: "Behavior Pattern Change",
          description: `Check-in time shifted by ${Math.abs(Math.round(change))} minutes (${change > 0 ? 'later' : 'earlier'})`,
          detectedAt: new Date().toISOString(),
          affectedDates: last7Days.map(r => r.date),
        });
      }
    }

    // Save alerts
    alerts.forEach(alert => this.saveAlert(alert));

    return alerts;
  }

  /**
   * Get all alerts
   */
  getAllAlerts(): SmartAlert[] {
    return DataService.get<SmartAlert>(this.STORAGE_KEY);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): SmartAlert[] {
    return this.getAllAlerts()
      .filter(a => a.status === "Active")
      .sort((a, b) => {
        const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  /**
   * Get alerts by employee
   */
  getByEmployee(employeeId: string): SmartAlert[] {
    return this.getAllAlerts()
      .filter(a => a.employeeId === employeeId)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  /**
   * Get alerts by type
   */
  getByType(type: AlertType): SmartAlert[] {
    return this.getAllAlerts().filter(a => a.type === type);
  }

  /**
   * Get alerts by priority
   */
  getByPriority(priority: AlertPriority): SmartAlert[] {
    return this.getAllAlerts().filter(a => a.priority === priority);
  }

  /**
   * Get alert summary
   */
  getSummary(): AlertSummary {
    const alerts = this.getAllAlerts();

    const summary: AlertSummary = {
      total: alerts.length,
      byType: {
        LATE_ATTENDANCE: 0,
        MISSING_CHECKOUT: 0,
        OVERTIME_ANOMALY: 0,
        CONSECUTIVE_LATES: 0,
        PATTERN_CHANGE: 0,
        SUSPICIOUS_HOURS: 0,
      },
      byPriority: {
        Low: 0,
        Medium: 0,
        High: 0,
        Critical: 0,
      },
      byStatus: {
        Active: 0,
        Acknowledged: 0,
        Resolved: 0,
        Dismissed: 0,
      },
      topEmployees: [],
    };

    const employeeCounts: Record<string, { name: string; count: number }> = {};

    alerts.forEach(alert => {
      summary.byType[alert.type]++;
      summary.byPriority[alert.priority]++;
      summary.byStatus[alert.status]++;

      if (!employeeCounts[alert.employeeId]) {
        employeeCounts[alert.employeeId] = {
          name: alert.employeeName,
          count: 0,
        };
      }
      employeeCounts[alert.employeeId].count++;
    });

    summary.topEmployees = Object.entries(employeeCounts)
      .map(([employeeId, data]) => ({
        employeeId,
        name: data.name,
        count: data.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return summary;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): SmartAlert | null {
    return this.updateAlertStatus(alertId, "Acknowledged", acknowledgedBy);
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string, notes?: string): SmartAlert | null {
    const alerts = this.getAllAlerts();
    const index = alerts.findIndex(a => a.alertId === alertId);

    if (index === -1) return null;

    alerts[index].status = "Resolved";
    alerts[index].resolvedBy = resolvedBy;
    alerts[index].resolvedAt = new Date().toISOString();
    if (notes) alerts[index].notes = notes;

    DataService.setAll(this.STORAGE_KEY, alerts);
    return alerts[index];
  }

  /**
   * Dismiss alert
   */
  dismissAlert(alertId: string): SmartAlert | null {
    return this.updateAlertStatus(alertId, "Dismissed");
  }

  // ========== PRIVATE METHODS ==========

  /**
   * Update alert status
   */
  private updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    actorName?: string
  ): SmartAlert | null {
    const alerts = this.getAllAlerts();
    const index = alerts.findIndex(a => a.alertId === alertId);

    if (index === -1) return null;

    alerts[index].status = status;
    if (status === "Acknowledged" && actorName) {
      alerts[index].acknowledgedBy = actorName;
      alerts[index].acknowledgedAt = new Date().toISOString();
    }

    DataService.setAll(this.STORAGE_KEY, alerts);
    return alerts[index];
  }

  /**
   * Calculate average check-in time in minutes
   */
  private calculateAverageCheckInMinutes(records: any[]): number {
    const times = records
      .filter(r => r.checkInTime)
      .map(r => {
        const parts = r.checkInTime.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
      });

    if (times.length === 0) return 9 * 60; // Default 9:00 AM
    return times.reduce((a, b) => a + b, 0) / times.length;
  }

  /**
   * Save alert
   */
  private saveAlert(alert: SmartAlert): void {
    const alerts = this.getAllAlerts();
    alerts.push(alert);
    DataService.setAll(this.STORAGE_KEY, alerts);
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    const timestamp = Date.now();
    const random = (0.5).toString(36).substr(2, 6).toUpperCase();
    return `ALERT-${timestamp}-${random}`;
  }
}

// ========== EXPORT ==========

export const smartAlertsService = new SmartAlertsService();
