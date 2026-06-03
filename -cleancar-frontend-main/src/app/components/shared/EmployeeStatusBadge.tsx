/**
 * Employee Status Badge Component
 *
 * Displays visual status indicator for employee lifecycle state
 * Status: Draft | Active | Exit
 */

import React from "react";
import { Badge } from "../ui/badge";
import type { EmployeeStatus } from "../../services/employeeMaster";

interface EmployeeStatusBadgeProps {
  status: EmployeeStatus | "Active" | "On Leave" | "Inactive" | "Terminated";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

/**
 * Map legacy status to new status
 */
function normalizeStatus(status: string): EmployeeStatus {
  const statusMap: Record<string, EmployeeStatus> = {
    "Active": "Active",
    "On Leave": "Active",
    "Inactive": "Draft",
    "Terminated": "Exit",
    "Draft": "Draft",
    "Exit": "Exit",
  };
  return statusMap[status] || "Draft";
}

export function EmployeeStatusBadge({ status, size = "md", showIcon = true }: EmployeeStatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status);

  const statusConfig = {
    Draft: {
      label: "Draft",
      className: "bg-gray-100 text-gray-700 border-gray-300",
      icon: "📝",
    },
    Active: {
      label: "Active",
      className: "bg-green-100 text-green-700 border-green-300",
      icon: "✅",
    },
    Exit: {
      label: "Exited",
      className: "bg-red-100 text-red-700 border-red-300",
      icon: "🚪",
    },
  };

  const config = statusConfig[normalizedStatus];

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <Badge
      variant="outline"
      className={`${config.className} ${sizeClasses[size]} font-medium`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </Badge>
  );
}
