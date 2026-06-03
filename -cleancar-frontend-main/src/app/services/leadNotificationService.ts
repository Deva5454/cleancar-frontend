/**
 * LEAD NOTIFICATION SERVICE
 * Role-based notifications for lead lifecycle events
 *
 * Supervisors receive notifications when:
 * - Lead is assigned to TSE
 * - Lead status changes
 * - Lead is converted or lost
 */

export type LeadNotificationType =
  | "LEAD_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_CONVERTED"
  | "LEAD_LOST"
  | "LEAD_CONTACTED"
  | "INCENTIVE_EARNED";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface LeadNotification {
  id: string;
  type: LeadNotificationType;
  priority: NotificationPriority;
  recipientId: string;              // Supervisor ID who should receive this
  recipientRole: "SUPERVISOR" | "TSM" | "OM" | "CM";
  leadId: string;
  leadName: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;

  // Event details
  assignedTo?: string;               // TSE name if assigned
  oldStatus?: string;
  newStatus?: string;
  incentiveAmount?: number;

  // Action metadata
  actionUrl?: string;                // Link to view lead details
  actionLabel?: string;              // e.g., "View Lead", "Track Progress"
}

class LeadNotificationService {
  private notifications: LeadNotification[] = [];
  private listeners: Map<string, (notification: LeadNotification) => void> = new Map();

  // ========== NOTIFICATION CREATION ==========

  /**
   * Notify supervisor when their lead is assigned to a TSE
   */
  notifyLeadAssigned(
    supervisorId: string,
    leadId: string,
    leadName: string,
    tseName: string
  ): void {
    const notification: LeadNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type: "LEAD_ASSIGNED",
      priority: "MEDIUM",
      recipientId: supervisorId,
      recipientRole: "SUPERVISOR",
      leadId,
      leadName,
      title: "Lead Assigned to Telesales",
      message: `Your lead "${leadName}" has been assigned to ${tseName} for follow-up`,
      timestamp: new Date(),
      isRead: false,
      assignedTo: tseName,
      actionUrl: `/supervisor-app/leads/${leadId}`,
      actionLabel: "Track Progress"
    };

    this.addNotification(notification);
  }

  /**
   * Notify supervisor when lead status changes
   */
  notifyStatusChange(
    supervisorId: string,
    leadId: string,
    leadName: string,
    oldStatus: string,
    newStatus: string
  ): void {
    const priority = this.getPriorityForStatusChange(oldStatus, newStatus);

    const notification: LeadNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type: "LEAD_STATUS_CHANGED",
      priority,
      recipientId: supervisorId,
      recipientRole: "SUPERVISOR",
      leadId,
      leadName,
      title: "Lead Status Updated",
      message: `Lead "${leadName}" moved from ${oldStatus} to ${newStatus}`,
      timestamp: new Date(),
      isRead: false,
      oldStatus,
      newStatus,
      actionUrl: `/supervisor-app/leads/${leadId}`,
      actionLabel: "View Details"
    };

    this.addNotification(notification);
  }

  /**
   * Notify supervisor when lead is converted (SUCCESS!)
   */
  notifyLeadConverted(
    supervisorId: string,
    leadId: string,
    leadName: string,
    incentiveAmount: number
  ): void {
    const notification: LeadNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type: "LEAD_CONVERTED",
      priority: "HIGH",
      recipientId: supervisorId,
      recipientRole: "SUPERVISOR",
      leadId,
      leadName,
      title: "🎉 Lead Converted!",
      message: `Congratulations! Lead "${leadName}" has been converted. You earned ₹${incentiveAmount}`,
      timestamp: new Date(),
      isRead: false,
      newStatus: "CONVERTED",
      incentiveAmount,
      actionUrl: `/supervisor-app/leads/${leadId}`,
      actionLabel: "View Incentive"
    };

    this.addNotification(notification);
  }

  /**
   * Notify supervisor when lead is lost/disqualified
   */
  notifyLeadLost(
    supervisorId: string,
    leadId: string,
    leadName: string,
    reason: string
  ): void {
    const notification: LeadNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type: "LEAD_LOST",
      priority: "LOW",
      recipientId: supervisorId,
      recipientRole: "SUPERVISOR",
      leadId,
      leadName,
      title: "Lead Disqualified",
      message: `Lead "${leadName}" was disqualified. Reason: ${reason}`,
      timestamp: new Date(),
      isRead: false,
      newStatus: "DISQUALIFIED",
      actionUrl: `/supervisor-app/leads/${leadId}`,
      actionLabel: "View Details"
    };

    this.addNotification(notification);
  }

  /**
   * Notify supervisor when TSE makes first contact
   */
  notifyLeadContacted(
    supervisorId: string,
    leadId: string,
    leadName: string,
    tseName: string
  ): void {
    const notification: LeadNotification = {
      id: `NOTIF-${Date.now()}-${Math.random()}`,
      type: "LEAD_CONTACTED",
      priority: "MEDIUM",
      recipientId: supervisorId,
      recipientRole: "SUPERVISOR",
      leadId,
      leadName,
      title: "Lead Contacted",
      message: `${tseName} has contacted your lead "${leadName}"`,
      timestamp: new Date(),
      isRead: false,
      newStatus: "IN_TELESALES",
      actionUrl: `/supervisor-app/leads/${leadId}`,
      actionLabel: "View Activity"
    };

    this.addNotification(notification);
  }

  // ========== NOTIFICATION MANAGEMENT ==========

  private addNotification(notification: LeadNotification): void {
    this.notifications.unshift(notification); // Add to beginning

    // Trigger listeners
    const listener = this.listeners.get(notification.recipientId);
    if (listener) {
      listener(notification);
    }

    // Keep only last 100 notifications per user
    const userNotifications = this.notifications.filter(n => n.recipientId === notification.recipientId);
    if (userNotifications.length > 100) {
      const oldestNotifId = userNotifications[userNotifications.length - 1].id;
      this.notifications = this.notifications.filter(n => n.id !== oldestNotifId);
    }

    console.log(`📬 Notification created for ${notification.recipientId}:`, notification.title);
  }

  /**
   * Get all notifications for a supervisor
   */
  getNotifications(supervisorId: string): LeadNotification[] {
    return this.notifications
      .filter(n => n.recipientId === supervisorId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(supervisorId: string): number {
    return this.notifications.filter(
      n => n.recipientId === supervisorId && !n.isRead
    ).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  /**
   * Mark all notifications as read for a supervisor
   */
  markAllAsRead(supervisorId: string): void {
    this.notifications
      .filter(n => n.recipientId === supervisorId)
      .forEach(n => n.isRead = true);
  }

  /**
   * Subscribe to real-time notifications
   */
  subscribe(supervisorId: string, callback: (notification: LeadNotification) => void): () => void {
    this.listeners.set(supervisorId, callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(supervisorId);
    };
  }

  /**
   * Clear all notifications for a supervisor
   */
  clearNotifications(supervisorId: string): void {
    this.notifications = this.notifications.filter(n => n.recipientId !== supervisorId);
  }

  // ========== HELPERS ==========

  private getPriorityForStatusChange(oldStatus: string, newStatus: string): NotificationPriority {
    if (newStatus === "CONVERTED") return "HIGH";
    if (newStatus === "DISQUALIFIED") return "LOW";
    if (newStatus === "IN_TELESALES" && oldStatus === "PENDING") return "MEDIUM";
    return "LOW";
  }
}

// Singleton instance
export const leadNotificationService = new LeadNotificationService();
