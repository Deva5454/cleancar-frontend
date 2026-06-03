/**
 * Comparison Metric Card
 *
 * Displays side-by-side comparison of current vs simulated metric values
 * Shows the delta change with visual indicator
 *
 * @component
 */

import { Card, CardContent } from "../ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

export interface ComparisonMetricCardProps {
  /** Metric label */
  label: string;

  /** Current value */
  currentValue: string;

  /** Simulated value */
  simulatedValue: string;

  /** Change information */
  change: {
    /** Change value (with sign) */
    value: string;
    /** Change percentage */
    percentage: number;
  };

  /** Optional custom className */
  className?: string;
}

/**
 * ComparisonMetricCard - Shows current vs simulated metric comparison
 *
 * @example
 * ```tsx
 * <ComparisonMetricCard
 *   label="Total Incentive"
 *   currentValue="₹5,625"
 *   simulatedValue="₹6,450"
 *   change={{ value: "+₹825", percentage: 14.7 }}
 * />
 * ```
 */
export function ComparisonMetricCard({
  label,
  currentValue,
  simulatedValue,
  change,
  className = ""
}: ComparisonMetricCardProps) {
  const isIncrease = change.percentage > 0;
  const isDecrease = change.percentage < 0;
  const isNeutral = change.percentage === 0;

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1">
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Compares current performance values with simulated overrides.
                  The change shows the impact of your modifications.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="transition-all duration-200">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Current</p>
            <p className="text-xl font-bold text-gray-900">{currentValue}</p>
          </div>
          <div className="transition-all duration-200">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Simulated</p>
            <p className="text-xl font-bold text-blue-600">{simulatedValue}</p>
          </div>
        </div>

        <div className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all duration-200 ${
          isIncrease ? "bg-green-50 border border-green-200" :
          isDecrease ? "bg-red-50 border border-red-200" :
          "bg-gray-50 border border-gray-200"
        }`}>
          {isIncrease && <TrendingUp className="w-4 h-4 text-green-600 animate-in fade-in duration-300" />}
          {isDecrease && <TrendingDown className="w-4 h-4 text-red-600 animate-in fade-in duration-300" />}
          {isNeutral && <Minus className="w-4 h-4 text-gray-500" />}
          <span className={`text-sm font-semibold ${
            isIncrease ? "text-green-700" :
            isDecrease ? "text-red-700" :
            "text-gray-600"
          }`}>
            {change.value} ({change.percentage > 0 ? "+" : ""}{(change?.percentage ?? 0).toFixed(1)}%)
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default ComparisonMetricCard;
