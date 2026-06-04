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
    // In production: GET /api/supervisor/:id/alerts
    const alerts: Alert[] = [];

    // Generate mock alerts
    alerts.push(
      this.createAlert({
        id: "ALERT-001",
        configKey: "NO_CHECKIN_DELAY",
        title: "Washer Not Checked-In (5:10 AM)",
        description: "Rajesh Kumar has not checked in. Expected: 5:00 AM",
        washerId: "WASHER-001",
        washerName: "Rajesh Kumar",
        minutesAgo: 5,
        status: "PENDING",
        actions: [
          { id: "call", label: "Call Washer", icon: "phone", action: "CALL", washerId: "WASHER-001" },
          { id: "markabsent", label: "Mark Absent", icon: "userx", action: "MARK_ABSENT", washerId: "WASHER-001" },
          { id: "autoassign", label: "Auto-Assign Cars", icon: "car", action: "AUTO_ASSIGN_CARS", washerId: "WASHER-001" },
          { id: "escalate", label: "Escalate", icon: "alert", action: "ESCALATE" },
        ],
      })
    );

    alerts.push(
      this.createAlert({
        id: "ALERT-002",
        configKey: "GPS_MISMATCH",
        title: "GPS Location Mismatch",
        description: "Amit Patel GPS is 850m away from assigned location",
        washerId: "WASHER-005",
        washerName: "Amit Patel",
        minutesAgo: 12,
        status: "PENDING",
        actions: [
          { id: "verify", label: "Verify GPS", icon: "map", action: "VERIFY_GPS", washerId: "WASHER-005" },
          { id: "call", label: "Call Washer", icon: "phone", action: "CALL", washerId: "WASHER-005" },
          { id: "escalate", label: "Escalate", icon: "alert", action: "ESCALATE" },
        ],
      })
    );

    alerts.push(
      this.createAlert({
        id: "ALERT-003",
        configKey: "LOW_UNITS",
        title: "Low Unit Progress",
        description: "Team completed only 45/180 units by 7:45 AM",
        minutesAgo: 8,
        status: "PENDING",
        actions: [
          { id: "reassign", label: "Reassign", icon: "repeat", action: "REASSIGN" },
          { id: "view", label: "View Details", icon: "eye", action: "VIEW_DETAILS" },
        ],
      })
    );

    alerts.push(
      this.createAlert({
        id: "ALERT-004",
        configKey: "AUDIT_OVERDUE",
        title: "Audit Overdue",
        description: "Suresh Shah - Last audit 5 days ago",
        washerId: "WASHER-008",
        washerName: "Suresh Shah",
        minutesAgo: 25,
        status: "PENDING",
        actions: [
          { id: "audit", label: "Start Audit", icon: "clipboard", action: "START_AUDIT", washerId: "WASHER-008" },
          { id: "escalate", label: "Escalate", icon: "alert", action: "ESCALATE" },
        ],
      })
    );

    alerts.push(
      this.createAlert({
        id: "ALERT-005",
        configKey: "ISSUE_UNRESOLVED",
        title: "Issue Unresolved (15 min)",
        description: "Quality issue reported 18 minutes ago - No action taken",
        washerId: "WASHER-012",
        washerName: "Vikram Singh",
        minutesAgo: 18,
        status: "ESCALATED",
        escalatedTo: "Ops Manager",
        actions: [],
      })
    );

    alerts.push(
      this.createAlert({
        id: "ALERT-006",
        configKey: "LEAD_QUALITY",
        title: "Lead Quality Issue",
        description: "Conversion rate dropped to 28% (threshold: 30%)",
        minutesAgo: 35,
        status: "PENDING",
        actions: [
          { id: "view", label: "View Details", icon: "eye", action: "VIEW_DETAILS" },
        ],
      })
    );

    return alerts;
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
