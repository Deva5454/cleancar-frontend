/**
 * MetricCard Component
 * Reusable card for displaying key metrics in analytics dashboards
 */

import { Card, CardContent } from "../ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: "blue" | "green" | "purple" | "orange" | "red";
  trend?: {
    value: number;
    label?: string;
  };
}

const iconColorClasses = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-green-50 text-green-600",
  purple: "bg-purple-50 text-purple-600",
  orange: "bg-orange-50 text-orange-600",
  red: "bg-red-50 text-red-600",
} as const;

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  iconColor = "blue",
  trend,
}: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold mt-1">{value}</div>
            {subtitle && <div className="text-xs text-muted-foreground mt-2">{subtitle}</div>}
            {trend && (
              <div
                className={cn(
                  "text-xs mt-2 font-medium",
                  trend.value > 0 ? "text-green-600" : trend.value < 0 ? "text-red-600" : "text-gray-600"
                )}
              >
                {trend.value > 0 ? "+" : ""}
                {trend.value}% {trend.label}
              </div>
            )}
          </div>
          <div className={cn("p-2 rounded", iconColorClasses[iconColor])}>
            <Icon className="w-5 h-5" aria-hidden="true" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
