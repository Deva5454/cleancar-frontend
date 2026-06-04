/**
 * StatCard Component
 * 
 * Simplified metric card for quick statistics display.
 * Lightweight alternative to DataCard for simple metrics.
 * 
 * @component
 */

import { Card, CardContent } from "../../components/ui/card";
import { LucideIcon } from "lucide-react";

export interface StatCardProps {
  /** Stat label */
  label: string;
  
  /** Stat value */
  value: string | number;
  
  /** Icon component */
  icon?: LucideIcon;
  
  /** Icon color */
  iconColor?: string;
  
  /** Change from previous period */
  change?: {
    value: string;
    type: "increase" | "decrease" | "neutral";
  };
  
  /** Card variant */
  variant?: "default" | "success" | "warning" | "danger" | "info";
  
  /** Click handler */
  onClick?: () => void;
  
  /** Custom className */
  className?: string;
}

/**
 * Get colors based on variant
 */
function getVariantColors(variant: StatCardProps["variant"]) {
  switch (variant) {
    case "success":
      return {
        border: "border-green-200",
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
      };
    case "warning":
      return {
        border: "border-amber-200",
        iconBg: "bg-amber-50",
        iconColor: "text-amber-600",
      };
    case "danger":
      return {
        border: "border-red-200",
        iconBg: "bg-red-50",
        iconColor: "text-red-600",
      };
    case "info":
      return {
        border: "border-blue-200",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
      };
    default:
      return {
        border: "border-gray-200",
        iconBg: "bg-gray-50",
        iconColor: "text-gray-600",
      };
  }
}

/**
 * StatCard component for displaying simple statistics
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Users"
 *   value="1,234"
 *   icon={Users}
 *   variant="success"
 *   change={{ value: "+12%", type: "increase" }}
 * />
 * 
 * <StatCard
 *   label="Pending Approvals"
 *   value="45"
 *   icon={Clock}
 *   variant="warning"
 * />
 * ```
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  change,
  variant = "default",
  onClick,
  className = "",
}: StatCardProps) {
  const colors = getVariantColors(variant);
  const finalIconColor = iconColor || colors.iconColor;
  
  const changeColors = {
    increase: "text-green-600",
    decrease: "text-red-600",
    neutral: "text-gray-600",
  };
  
  return (
    <Card
      className={`${colors.border} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-600">{label}</p>
          {Icon && (
            <div className={`p-2 rounded-lg ${colors.iconBg}`}>
              <Icon className={`w-4 h-4 ${finalIconColor}`} />
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {change && (
            <span className={`text-sm font-medium ${changeColors[change.type]}`}>
              {change.type === "increase" && "↑"}
              {change.type === "decrease" && "↓"}
              {change.value}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
