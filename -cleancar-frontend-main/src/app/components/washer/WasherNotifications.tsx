// Notifications Center for Washers
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Bell,
  Camera,
  CheckCircle,
  AlertTriangle,
  Package,
  Calendar,
  Award,
  MessageSquare,
  Clock,
} from "lucide-react";

interface Notification {
  id: string;
  type: "job" | "demo" | "replenishment" | "equipment" | "leave" | "feedback" | "badge" | "verification";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon: any;
  color: string;
}

interface WasherNotificationsProps {
  unreadCount: number;
}

export function WasherNotifications({ unreadCount }: WasherNotificationsProps) {
  const notifications: Notification[] = [
    {
      id: "N001",
      type: "demo",
      title: "New Demo Request",
      message: "Demo request for Subscription Demo in Vesu area assigned to you",
      timestamp: "5 minutes ago",
      read: false,
      icon: Camera,
      color: "amber",
    },
    {
      id: "N002",
      type: "replenishment",
      title: "Replenishment Approved",
      message: "Your request for Car Wash Shampoo 5L has been approved",
      timestamp: "1 hour ago",
      read: false,
      icon: Package,
      color: "green",
    },
    {
      id: "N003",
      type: "feedback",
      title: "Customer Feedback",
      message: "A customer said something nice about your work today!",
      timestamp: "2 hours ago",
      read: false,
      icon: MessageSquare,
      color: "purple",
    },
    {
      id: "N004",
      type: "verification",
      title: "Stock Verification Due",
      message: "Stock verification due tonight by 9:00 PM",
      timestamp: "3 hours ago",
      read: true,
      icon: Package,
      color: "red",
    },
    {
      id: "N005",
      type: "job",
      title: "New Job Assigned",
      message: "Job for 05:00 - 05:30 time slot in Adajan assigned",
      timestamp: "Yesterday",
      read: true,
      icon: Bell,
      color: "blue",
    },
    {
      id: "N006",
      type: "badge",
      title: "New Badge Earned!",
      message: "You've earned the 'Perfect Week' badge. Great work!",
      timestamp: "2 days ago",
      read: true,
      icon: Award,
      color: "teal",
    },
  ];

  const getIconColor = (color: string) => {
    switch (color) {
      case "amber":
        return "bg-amber-100 text-amber-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      case "red":
        return "bg-red-100 text-red-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "teal":
        return "bg-teal-100 text-teal-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount} unread notifications
          </p>
        </div>
        <Button size="sm" variant="outline">
          Mark All Read
        </Button>
      </div>

      {/* Notification List */}
      <div className="space-y-2">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          return (
            <Card
              key={notification.id}
              className={`border ${
                !notification.read
                  ? "border-teal-200 bg-teal-50"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(
                      notification.color
                    )}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`font-semibold ${
                          !notification.read ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {notification.title}
                      </h3>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-teal-600 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    <p
                      className={`text-sm mt-1 ${
                        !notification.read ? "text-gray-700" : "text-gray-600"
                      }`}
                    >
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {notification.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* View Older */}
      <Button variant="outline" className="w-full h-12">
        View Older Notifications
      </Button>
    </div>
  );
}
