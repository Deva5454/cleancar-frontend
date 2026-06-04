/**
 * OPERATIONS MANAGER - NOTIFICATION COMPONENT
 * Toast-style notifications for user feedback
 */

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { notificationService, NotificationOptions } from "../../services/notificationService";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const COLORS = {
  success: "bg-green-50 border-green-500 text-green-900",
  error: "bg-red-50 border-red-500 text-red-900",
  warning: "bg-yellow-50 border-yellow-500 text-yellow-900",
  info: "bg-blue-50 border-blue-500 text-blue-900",
};

const ICON_COLORS = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
};

export function OMNotificationContainer() {
  const [notifications, setNotifications] = useState<(NotificationOptions & { id: number })[]>([]);
  const [nextId, setNextId] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      const id = nextId;
      setNextId(nextId + 1);
      setNotifications((prev) => [...prev, { ...notification, id }]);

      // Auto-remove after duration
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration || 3000);
    });

    return unsubscribe;
  }, [nextId]);

  const handleRemove = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-3 max-w-md">
      {notifications.map((notification) => {
        const Icon = ICONS[notification.type];
        const colorClass = COLORS[notification.type];
        const iconColorClass = ICON_COLORS[notification.type];

        return (
          <div
            key={notification.id}
            className={`${colorClass} border-l-4 p-4 rounded-lg shadow-lg animate-in slide-in-from-right`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`h-5 w-5 ${iconColorClass} mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-sm mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => handleRemove(notification.id)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
