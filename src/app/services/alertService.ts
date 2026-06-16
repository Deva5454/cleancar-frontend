/**
 * Automated Alert Service
 * Real-time decision triggers with auto-escalation
 */

export type AlertPriority = "CRITICAL" | "HIGH" | "MEDIUM";
export type AlertType =
  | "OPERATIONAL"
  | "VALIDATION"
  | "QUALITY"
  | "INVENTORY"
  | "PERFORMANCE"
  | "SYSTEM";
export type AlertStatus = "PENDING" | "ACTIONED" | "ESCALATED" | "RESOLVED";

export interface Alert {
  id: string;
  priority: AlertPriority;
  type: AlertType;
  title: string;
  description: string;
  washerId?: string;
  washerName?: string;
  triggeredAt: Date;
  responseDeadlineMinutes: number; // Minutes before auto-escalation
  remainingMinutes: number; // Calculated countdown
  status: AlertStatus;
  actionedAt?: Date;
  escalatedAt?: Date;
  resolvedAt?: Date;
  actionedBy?: string;
  escalatedTo?: string;
  actions: AlertAction[]; // Available quick actions
}

export interface AlertAction {
  id: string;
  label: string;
  icon: string;
  action: "CALL" | "REASSIGN" | "VERIFY_GPS" | "START_AUDIT" | "ESCALATE" | "MARK_PRESENT" | "MARK_ABSENT" | "VIEW_DETAILS" | "AUTO_ASSIGN_CARS";
  washerId?: string;
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  pendingAction: number;
  escalated: number;
  unread: number;
}

export interface AlertConfig {
  type: string;
  priority: AlertPriority;
  responseMinutes: number;
  notificationMode: "PUSH_SMS" | "PUSH" | "IN_APP";
}

class AlertService {
  // Alert configurations
  private readonly ALERT_CONFIGS: Record<string, AlertConfig> = {
    // CRITICAL (Push + SMS)
    NO_CHECKIN_DELAY: {
      type: "Washer Not Checked-In",
      priority: "CRITICAL",
      responseMinutes: 10,
      notificationMode: "PUSH_SMS",
    },
    MULTIPLE_ABSENT: {
      type: "3+ Washers Absent",
      priority: "CRITICAL",
      responseMinutes: 15,
      notificationMode: "PUSH_SMS",
    },
    COVER_PENDING: {
      type: "Cover Units Pending",
      priority: "CRITICAL",
      responseMinutes: 30,
      notificationMode: "PUSH_SMS",
    },

    // HIGH (Push)
    GPS_MISMATCH: {
      type: "GPS Mismatch",
      priority: "HIGH",
      responseMinutes: 20,
      notificationMode: "PUSH",
    },
    LOW_UNITS: {
      type: "Low Units Progress",
      priority: "HIGH",
      responseMinutes: 30,
      notificationMode: "PUSH",
    },
    ISSUE_UNRESOLVED: {
      type: "Issue Unresolved (15m)",
      priority: "HIGH",
      responseMinutes: 15,
      notificationMode: "PUSH",
    },

    // MEDIUM (In-App)
    LEAD_QUALITY: {
      type: "Lead Quality Issue",
      priority: "MEDIUM",
      responseMinutes: 60,
      notificationMode: "IN_APP",
    },
    RETENTION_DROP: {
      type: "Retention Rate Drop",
      priority: "MEDIUM",
      responseMinutes: 120,
      notificationMode: "IN_APP",
    },
    AUDIT_OVERDUE: {
      type: "Audit Overdue",
      priority: "MEDIUM",
      responseMinutes: 45,
      notificationMode: "IN_APP",
    },
  };

  // ========== ALERT GENERATION ==========

  getAlerts(supervisorId: string): Alert[] {
    const alerts: Alert[] = [];

    // Read real employees from EMPLOYEE_DATABASE_RECORDS
    let washers: any[] = [];
    try {
      const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
      if (raw) {
        const allEmps = JSON.parse(raw);
        // Find the supervisor to get their pincodes
        const sup = allEmps.find((e: any) =>
          e.id === supervisorId ||
          e.loginMobile === supervisorId
        );
        const supPins: string[] = sup?.pinCodes || [];
        // Get washers under this supervisor (same pincodes)
        washers = allEmps.filter((e: any) =>
          e.designation === "Car Washer" &&
          (supPins.length === 0 ||
            (e.pinCodes || []).some((p: string) => supPins.includes(p)))
        );
      }
    } catch (_) {}

    // Fallback to hardcoded if no real data found
    if (washers.length === 0) {
      washers = [
        { id: "EDB-CW-SUR1A", fullName: "Mahesh Bharwad", mobile: "9100000009", status: "Active" },
        { id: "EDB-CW-SUR1B", fullName: "Ramesh Koli",    mobile: "9100000010", status: "Active" },
        { id: "EDB-CW-SUR1C", fullName: "Sunil Thakor",   mobile: "9100000011", status: "Active" },
      ];
    }

    const today = new Date().toISOString().split("T")[0];

    // Get attendance records for today
    let attendance: any[] = [];
    try {
      const raw = localStorage.getItem(`cleancar_CITY-SURAT_attendance`);
      if (raw) attendance = JSON.parse(raw).filter((a: any) => a.date === today);
    } catch (_) {}

    // Build real alerts from actual washer data
    washers.forEach((w: any, i: number) => {
      const todayAtt = attendance.find((a: any) => a.employeeId === w.id);
      const isOnLeave = w.status === "On Leave";

      // Alert: not checked in (active washers only)
      if (!isOnLeave && !todayAtt) {
        alerts.push(this.createAlert({
          id: `ALERT-NOCHECKIN-${w.id}`,
          configKey: "NO_CHECKIN_DELAY",
          title: `${w.fullName} Not Checked In`,
          description: `${w.fullName} has not checked in today. Expected by 5:00 AM.`,
          washerId: w.id,
          washerName: w.fullName,
          minutesAgo: 5 + i * 3,
          status: "PENDING",
          actions: [
            { id: `call-${w.id}`, label: "Call Washer", icon: "phone", action: "CALL", washerId: w.id },
            { id: `absent-${w.id}`, label: "Mark Absent", icon: "userx", action: "MARK_ABSENT", washerId: w.id },
            { id: `assign-${w.id}`, label: "Auto-Assign Cars", icon: "car", action: "AUTO_ASSIGN_CARS", washerId: w.id },
            { id: `esc-${w.id}`, label: "Escalate", icon: "alert", action: "ESCALATE" },
          ],
        }));
      }

      // Alert: late check-in
      if (todayAtt?.status === "Late") {
        alerts.push(this.createAlert({
          id: `ALERT-LATE-${w.id}`,
          configKey: "GPS_MISMATCH",
          title: `${w.fullName} Checked In Late`,
          description: `${w.fullName} checked in late. Expected: 5:00 AM.`,
          washerId: w.id,
          washerName: w.fullName,
          minutesAgo: 10 + i * 5,
          status: "PENDING",
          actions: [
            { id: `call-${w.id}`, label: "Call Washer", icon: "phone", action: "CALL", washerId: w.id },
            { id: `audit-${w.id}`, label: "Start Audit", icon: "clipboard", action: "START_AUDIT", washerId: w.id },
          ],
        }));
      }

      // Alert: on leave — reassign their cars
      if (isOnLeave) {
        alerts.push(this.createAlert({
          id: `ALERT-LEAVE-${w.id}`,
          configKey: "COVER_PENDING",
          title: `${w.fullName} On Leave`,
          description: `${w.fullName} is on leave today. Cars need reassignment.`,
          washerId: w.id,
          washerName: w.fullName,
          minutesAgo: 30,
          status: "PENDING",
          actions: [
            { id: `assign-${w.id}`, label: "Auto-Assign Cars", icon: "car", action: "AUTO_ASSIGN_CARS", washerId: w.id },
            { id: "reassign", label: "Cover Plan", icon: "repeat", action: "REASSIGN" },
          ],
        }));
      }
    });

    // Always add a team-level audit reminder
    alerts.push(this.createAlert({
      id: "ALERT-AUDIT-TEAM",
      configKey: "AUDIT_OVERDUE",
      title: "Daily Audit Required",
      description: "Conduct field audit for at least 2 washers today.",
      minutesAgo: 20,
      status: "PENDING",
      actions: [
        { id: "audit-team", label: "Start Audit", icon: "clipboard", action: "START_AUDIT", washerId: washers[0]?.id },
        { id: "view", label: "View Details", icon: "eye", action: "VIEW_DETAILS" },
      ],
    }));

    // Apply persisted actions (so resolved/actioned alerts stay that way)
    try {
      const actions = JSON.parse(localStorage.getItem("SUPERVISOR_ALERT_ACTIONS") || "{}");
      alerts.forEach(alert => {
        if (actions[alert.id]) {
          alert.status = actions[alert.id].status as AlertStatus;
          if (actions[alert.id].status === "ACTIONED") alert.actionedAt = new Date(actions[alert.id].actionedAt);
          if (actions[alert.id].status === "RESOLVED") alert.resolvedAt = new Date(actions[alert.id].actionedAt);
          if (actions[alert.id].status === "ESCALATED") {
            alert.escalatedAt = new Date(actions[alert.id].actionedAt);
            alert.escalatedTo = "Ops Manager";
          }
        }
      });
    } catch (_) {}

    return alerts.sort((a, b) => {
      const p = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 };
      return (p[a.priority] || 2) - (p[b.priority] || 2);
    });
  }

  getAlertSummary(supervisorId: string): AlertSummary {
    const alerts = this.getAlerts(supervisorId);

    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.priority === "CRITICAL").length,
      high: alerts.filter((a) => a.priority === "HIGH").length,
      medium: alerts.filter((a) => a.priority === "MEDIUM").length,
      pendingAction: alerts.filter((a) => a.status === "PENDING").length,
      escalated: alerts.filter((a) => a.status === "ESCALATED").length,
      unread: alerts.filter((a) => a.status === "PENDING" || a.status === "ESCALATED").length,
    };
  }

  // ========== ALERT CREATION ==========

  private createAlert(params: {
    id: string;
    configKey: string;
    title: string;
    description: string;
    washerId?: string;
    washerName?: string;
    minutesAgo: number;
    status: AlertStatus;
    escalatedTo?: string;
    actions: AlertAction[];
  }): Alert {
    const config = this.ALERT_CONFIGS[params.configKey];
    const triggeredAt = new Date(Date.now() - params.minutesAgo * 60 * 1000);
    const remainingMinutes = Math.max(0, config.responseMinutes - params.minutesAgo);

    return {
      id: params.id,
      priority: config.priority,
      type: this.getAlertType(params.configKey),
      title: params.title,
      description: params.description,
      washerId: params.washerId,
      washerName: params.washerName,
      triggeredAt,
      responseDeadlineMinutes: config.responseMinutes,
      remainingMinutes,
      status: params.status,
      escalatedTo: params.escalatedTo,
      actions: params.actions,
    };
  }

  private getAlertType(configKey: string): AlertType {
    if (["NO_CHECKIN_DELAY", "MULTIPLE_ABSENT", "COVER_PENDING", "LOW_UNITS", "ISSUE_UNRESOLVED"].includes(configKey)) {
      return "OPERATIONAL";
    }
    if (["GPS_MISMATCH", "AUDIT_OVERDUE"].includes(configKey)) {
      return "VALIDATION";
    }
    if (["LEAD_QUALITY", "RETENTION_DROP"].includes(configKey)) {
      return "PERFORMANCE";
    }
    return "SYSTEM";
  }

  // ========== ALERT ACTIONS ==========

  markAlertActioned(alertId: string, supervisorId: string): { success: boolean } {
    console.log("Alert actioned:", alertId, "by", supervisorId);
    // In production: POST /api/alerts/:id/action
    return { success: true };
  }

  resolveAlert(alertId: string, supervisorId: string, notes?: string): { success: boolean } {
    console.log("Alert resolved:", alertId, "by", supervisorId, notes);
    // In production: POST /api/alerts/:id/resolve
    return { success: true };
  }

  escalateAlert(alertId: string, supervisorId: string, reason: string): { success: boolean } {
    console.log("Alert escalated:", alertId, "by", supervisorId, "reason:", reason);
    console.log("🚨 Escalated to Ops Manager");
    console.log("Notification sent: Push + SMS");
    // In production: POST /api/alerts/:id/escalate
    return { success: true };
  }

  // ========== AUTO-ESCALATION ==========

  checkAutoEscalation(alerts: Alert[]): Alert[] {
    // In production: This would be a background job
    return alerts.map((alert) => {
      if (alert.status === "PENDING" && alert.remainingMinutes <= 0) {
        console.log(`⚠️ AUTO-ESCALATED: ${alert.id} - ${alert.title}`);
        return {
          ...alert,
          status: "ESCALATED",
          escalatedTo: "Ops Manager",
          escalatedAt: new Date(),
        };
      }
      return alert;
    });
  }

  // ========== STICKY BANNER ALERTS ==========

  getStickyAlerts(alerts: Alert[]): Alert[] {
    // Return critical pending alerts for sticky banner
    return alerts.filter((a) => a.priority === "CRITICAL" && a.status === "PENDING");
  }
}

// Singleton instance
export const alertService = new AlertService();
