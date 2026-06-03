/**
 * StatusBadge Component
 * 
 * Reusable status badge with consistent styling across the application.
 * Automatically styled based on status type.
 * 
 * @component
 */

import { Badge } from "../../components/ui/badge";
import { getStatusConfig } from "../../core/StatusSystem";
import { CheckCircle, Clock, XCircle, AlertCircle, Circle } from "lucide-react";

export interface StatusBadgeProps {
  /** Status value to display */
  status: string;
  
  /** Size variant */
  size?: "sm" | "md" | "lg";
  
  /** Show icon */
  showIcon?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * Get icon component based on status
 */
function getStatusIcon(status: string) {
  const lowerStatus = status.toLowerCase();
  
  if (lowerStatus.includes("approved") || lowerStatus.includes("completed") || lowerStatus.includes("active")) {
    return CheckCircle;
  }
  
  if (lowerStatus.includes("pending")) {
    return Clock;
  }
  
  if (lowerStatus.includes("rejected") || lowerStatus.includes("failed") || lowerStatus.includes("cancelled")) {
    return XCircle;
  }
  
  if (lowerStatus.includes("warning") || lowerStatus.includes("overdue")) {
    return AlertCircle;
  }
  
  return Circle;
}

/**
 * StatusBadge component for displaying status values
 * 
 * @example
 * ```tsx
 * <StatusBadge status="Approved" />
 * <StatusBadge status="Pending" size="sm" showIcon />
 * <StatusBadge status="Rejected" size="lg" />
 * ```
 */
export function StatusBadge({ 
  status, 
  size = "md", 
  showIcon = true,
  className = "" 
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  const Icon = getStatusIcon(status);
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-0.5",
    lg: "text-base px-3 py-1",
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };
  
  return (
    <Badge 
      variant={config.variant}
      className={`${sizeClasses[size]} ${className}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} mr-1`} />}
      {status}
    </Badge>
  );
}

export default StatusBadge;
