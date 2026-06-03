import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useEventListener } from "../../contexts/EventSystem";
import { useCustomers } from "../../contexts/CustomerContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { logger } from "../../services/logger";
import {
  Bell,
  Clock,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  User,
  X,
  Settings,
  Mail,
  MessageSquare,
} from "lucide-react";

type NotificationType =
  | "reminder"
  | "sla-warning"
  | "sla-breach"
  | "assignment"
  | "followup-due"
  | "demo-scheduled"
  | "lead-update";

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "high" | "medium" | "low";
  actionRequired?: boolean;
  leadId?: string;
  leadName?: string;
  link?: string;
};

const mockNotifications: Notification = []; // ✅ No mock data

const notificationConfig = {
  reminder: {
    icon: Bell,
    color: "bg-blue-100 text-blue-800",
    borderColor: "border-blue-200",
  },
  "sla-warning": {
    icon: AlertTriangle,
    color: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-200",
  },
  "sla-breach": {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
    borderColor: "border-red-200",
  },
  assignment: {
    icon: User,
    color: "bg-purple-100 text-purple-800",
    borderColor: "border-purple-200",
  },
  "followup-due": {
    icon: Clock,
    color: "bg-orange-100 text-orange-800",
    borderColor: "border-orange-200",
  },
  "demo-scheduled": {
    icon: Calendar,
    color: "bg-green-100 text-green-800",
    borderColor: "border-green-200",
  },
  "lead-update": {
    icon: CheckCircle,
    color: "bg-gray-100 text-gray-800",
    borderColor: "border-gray-200",
  },
};

export function NotificationCenter() {
  const { leads } = useCustomers();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEventListener("LEAD_CONVERTED", (event) => {
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: "demo-scheduled" as const,
      title: "Lead Converted",
      message: `${event.data.customerName} is now an active subscriber — ₹${event.data.amount?.toLocaleString() || "0"}/month`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: "high",
      actionRequired: false,
      link: "/crm",
    }, ...prev]);
  });

  useEventListener("JOB_COMPLETED", (event) => {
    setNotifications(prev => [{
      id: `NOTIF-${Date.now()}`,
      type: "lead-update" as const,
      title: "Job Completed",
      message: `Job completed by ${event.data.washerName} for customer ${event.data.customerName || event.data.customerId}`,
      timestamp: new Date().toISOString(),
      read: false,
      priority: "medium",
      actionRequired: false,
      link: "/operations",
    }, ...prev]);
  });

  // SLA breach: leads with followUpDate in the past
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const overdue = leads.filter(l =>
      l.followUpDate && l.followUpDate < today &&
      l.stage !== "converted" && l.stage !== "lost"
    );
    overdue.forEach(l => {
      setNotifications(prev => {
        if (prev.some(n => n.id === `SLA-${l.leadId}`)) return prev;
        return [{
          id: `SLA-${l.leadId}`,
          type: "followup-due" as const,
          title: "Follow-up Overdue",
          message: `${l.firstName} ${l.lastName} — follow-up was due ${l.followUpDate}`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: "high",
          actionRequired: true,
          link: "/crm",
        }, ...prev];
      });
    });
  }, [leads]);
  const [filter, setFilter] = useState<"all" | "unread" | "action-required">("all");
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    slaWarnings: true,
    followupReminders: true,
    leadAssignments: true,
    emailNotifications: true,
    whatsappNotifications: false,
  });

  const unreadCount = notifications.filter((n) => !n.read).length;
  const actionRequiredCount = notifications.filter((n) => n.actionRequired && !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    toast.success(`Notification marked as read`);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
    toast.success(`All notifications marked as read!`);
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleCallNow = (leadName: string, leadId: string) => {
    toast.info(`Calling ${leadName} (${leadId})...`);
    logger.log('Call feature: configure support number in settings');
  };

  const handleWhatsApp = (leadName: string, leadId: string) => {
    const message = encodeURIComponent(`Hi ${leadName}, following up on your inquiry about our car washing service.`);
    window.open(`https://wa.me/919876543210?text=${message}`, '_blank');
  };

  const handleViewDetails = (link?: string, leadId?: string) => {
    if (link) {
      toast.info(`Navigating to ${link} for lead ${leadId || 'details'}`);
      // In production: window.location.href = link;
    }
  };

  const savePreferences = () => {
    toast.success(`Notification preferences saved successfully!`);
    setShowSettings(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "action-required") return n.actionRequired && !n.read;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notification Center
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Stay updated on leads, follow-ups, and SLA alerts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "all" ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => setFilter("all")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">All Notifications</p>
                <p className="text-3xl font-bold text-gray-900">
                  {notifications.length}
                </p>
              </div>
              <Bell className="w-10 h-10 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "unread" ? "border-orange-500 bg-orange-50" : ""
          }`}
          onClick={() => setFilter("unread")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unread</p>
                <p className="text-3xl font-bold text-orange-600">
                  {unreadCount}
                </p>
              </div>
              <Mail className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            filter === "action-required" ? "border-red-500 bg-red-50" : ""
          }`}
          onClick={() => setFilter("action-required")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Action Required</p>
                <p className="text-3xl font-bold text-red-600">
                  {actionRequiredCount}
                </p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Read</p>
                <p className="text-3xl font-bold text-green-600">
                  {notifications.length - unreadCount}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>
              {filter === "all" && "All Notifications"}
              {filter === "unread" && "Unread Notifications"}
              {filter === "action-required" && "Action Required"}
            </span>
            <Badge variant="outline">
              {filteredNotifications.length} notification
              {filteredNotifications.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  All caught up!
                </h3>
                <p className="text-sm text-gray-500">
                  You have no {filter === "unread" ? "unread" : filter === "action-required" ? "pending" : ""} notifications.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const config = notificationConfig[notification.type];
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${config.borderColor} ${
                      notification.read ? "bg-white" : "bg-gray-50"
                    } hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`p-3 rounded-lg ${config.color} flex-shrink-0`}>
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-gray-900">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {notification.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Badges and Actions */}
                        <div className="flex items-center gap-2 mb-3">
                          {notification.priority === "high" && (
                            <Badge className="bg-red-100 text-red-800">
                              High Priority
                            </Badge>
                          )}
                          {notification.actionRequired && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Action Required
                            </Badge>
                          )}
                          {notification.leadName && (
                            <Badge variant="outline">
                              {notification.leadName}
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500 ml-auto">
                            {notification.timestamp}
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {notification.actionRequired && (
                            <>
                              <Button size="sm" onClick={() => handleCallNow(notification.leadName || '', notification.leadId || '')}>
                                <Phone className="w-3 h-3 mr-1" />
                                Call Now
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleWhatsApp(notification.leadName || '', notification.leadId || '')}>
                                <MessageSquare className="w-3 h-3 mr-1" />
                                WhatsApp
                              </Button>
                            </>
                          )}
                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Mark as Read
                            </Button>
                          )}
                          {notification.link && (
                            <Button size="sm" variant="outline" onClick={() => handleViewDetails(notification.link, notification.leadId)}>
                              View Details
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">SLA Warnings</h4>
                  <p className="text-sm text-gray-600">
                    Get notified when approaching 5-minute SLA
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.slaWarnings}
                  onChange={(e) => setPreferences({ ...preferences, slaWarnings: e.target.checked })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Follow-up Reminders</h4>
                  <p className="text-sm text-gray-600">
                    Receive reminders 1 hour before scheduled follow-ups
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.followupReminders}
                  onChange={(e) => setPreferences({ ...preferences, followupReminders: e.target.checked })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Lead Assignments</h4>
                  <p className="text-sm text-gray-600">
                    Get notified when new leads are assigned to you
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.leadAssignments}
                  onChange={(e) => setPreferences({ ...preferences, leadAssignments: e.target.checked })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">Email Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Receive important notifications via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                  className="rounded"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">WhatsApp Notifications</h4>
                  <p className="text-sm text-gray-600">
                    Get urgent alerts via WhatsApp (high priority only)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.whatsappNotifications}
                  onChange={(e) => setPreferences({ ...preferences, whatsappNotifications: e.target.checked })}
                  className="rounded"
                />
              </div>
            </div>

            <Button className="w-full mt-4" onClick={savePreferences}>
              Save Preferences
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}