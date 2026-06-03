/**
 * Customer Notification Feedback
 * Shows confirmation when customer is notified after job completion
 * Design Principle: Quick, subtle confirmation
 */

import { CheckCircle, Send, Bell } from "lucide-react";
import { Badge } from "../ui/badge";

export interface CustomerNotificationFeedbackProps {
  isNotified: boolean;
  notificationTime?: Date;
  compact?: boolean;
}

export function CustomerNotificationFeedback({
  isNotified,
  notificationTime,
  compact = false
}: CustomerNotificationFeedbackProps) {
  if (!isNotified) {
    return null;
  }

  // Compact version (for job cards)
  if (compact) {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        <Bell className="h-3 w-3 mr-1" />
        Notified
      </Badge>
    );
  }

  // Full version (for job completion screen)
  return (
    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-green-600" />
        </div>
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-green-900">
          Customer notified successfully
        </p>
        {notificationTime && (
          <p className="text-xs text-green-700 mt-0.5">
            Sent at {notificationTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
      <Send className="h-4 w-4 text-green-600 flex-shrink-0" />
    </div>
  );
}
