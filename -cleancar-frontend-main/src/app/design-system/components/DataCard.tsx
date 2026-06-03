/**
 * DataCard Component
 * 
 * Standardized card component for displaying data metrics.
 * Replaces duplicate card patterns across the application.
 * 
 * @component
 */

import { Card, CardContent } from "../../components/ui/card";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

export interface DataCardProps {
  /** Card title */
  title: string;
  
  /** Main value to display */
  value: string | number;
  
  /** Optional subtitle */
  subtitle?: string;
  
  /** Icon component */
  icon?: LucideIcon;
  
  /** Icon background color */
  iconBgColor?: string;
  
  /** Icon color */
  iconColor?: string;
  
  /** Trend indicator */
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  
  /** Additional content */
  children?: ReactNode;
  
  /** Custom className */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
}

/**
 * DataCard component for displaying metrics
 * 
 * @example
 * ```tsx
 * <DataCard
 *   title="Total Revenue"
 *   value="₹8.9L"
 *   subtitle="This month"
 *   icon={DollarSign}
 *   iconBgColor="bg-green-50"
 *   iconColor="text-green-600"
 *   trend={{ value: "+12.5%", direction: "up" }}
 * />
 * ```
 */
export function DataCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = "bg-blue-50",
  iconColor = "text-blue-600",
  trend,
  children,
  className = "",
  onClick,
}: DataCardProps) {
  const getTrendColor = () => {
    if (!trend) return "";
    switch (trend.direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  
  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case "up":
        return "↑";
      case "down":
        return "↓";
      default:
        return "→";
    }
  };
  
  return (
    <Card 
      className={`${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500">{title}</p>
            <div className="mt-2">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-600 mt-1">{subtitle}</p>
              )}
              {trend && (
                <div className={`flex items-center gap-1 mt-2 ${getTrendColor()}`}>
                  <span className="text-sm font-medium">
                    {getTrendIcon()} {trend.value}
                  </span>
                </div>
              )}
            </div>
            {children}
          </div>
          
          {Icon && (
            <div className={`p-3 rounded-lg ${iconBgColor} ${iconColor}`}>
              <Icon className="w-6 h-6" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default DataCard;
