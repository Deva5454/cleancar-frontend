import { useState } from "react";
import { X, CheckCheck, AlertCircle, Users, Wallet, Clock } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";

interface Notification {
  id: string;
  type: "complaint" | "operations" | "payroll" | "general";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
}

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NOTIFICATION_ICONS = {
  complaint: AlertCircle,
  operations: Users,
  payroll: Wallet,
  general: Clock,
};

const NOTIFICATION_COLORS = {
  complaint: "text-red-600 bg-red-50",
  operations: "text-blue-600 bg-blue-50",
  payroll: "text-green-600 bg-green-50",
  general: "text-gray-600 bg-gray-50",
};

export function NotificationDrawer({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "complaint" | "operations" | "payroll">("all");

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    return notif.type === activeTab;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Notifications</h2>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("all")}
            >
              All
            </Button>
            <Button
              variant={activeTab === "complaint" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("complaint")}
            >
              Complaints
            </Button>
            <Button
              variant={activeTab === "operations" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("operations")}
            >
              Operations
            </Button>
            <Button
              variant={activeTab === "payroll" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("payroll")}
            >
              Payroll
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>No notifications</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => {
                const Icon = NOTIFICATION_ICONS[notification.type];
                const colorClass = NOTIFICATION_COLORS[notification.type];

                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      notification.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                    }`}
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-medium text-sm">{notification.title}</h3>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {notification.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {notification.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {unreadCount > 0 && (
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onMarkAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

