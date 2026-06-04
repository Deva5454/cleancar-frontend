/**
 * Savings Insight Card
 *
 * Small visual cards showing tax savings and optimization hints
 * Can be placed anywhere in salary/payroll screens
 *
 * LIGHT TOUCH: Non-intrusive, informational only
 */

import { TrendingUp, TrendingDown, Lightbulb, AlertCircle } from "lucide-react";

export type InsightType = "savings" | "warning" | "tip" | "info";

interface SavingsInsightCardProps {
  type: InsightType;
  title: string;
  value?: number;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export function SavingsInsightCard({
  type,
  title,
  value,
  description,
  action,
  compact = false,
}: SavingsInsightCardProps) {
  const getTypeConfig = () => {
    switch (type) {
      case "savings":
        return {
          icon: TrendingUp,
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-900",
          valueColor: "text-green-600",
        };
      case "warning":
        return {
          icon: AlertCircle,
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-900",
          valueColor: "text-yellow-600",
        };
      case "tip":
        return {
          icon: Lightbulb,
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-900",
          valueColor: "text-blue-600",
        };
      case "info":
        return {
          icon: TrendingDown,
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-600",
          titleColor: "text-gray-900",
          valueColor: "text-gray-600",
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 ${config.bgColor} border ${config.borderColor} rounded-lg`}
      >
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${config.titleColor} truncate`}>
            {title}
          </div>
          {value !== undefined && (
            <div className={`text-lg font-bold ${config.valueColor}`}>
              ₹{value.toLocaleString()}
            </div>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 ${config.bgColor} border ${config.borderColor} rounded-lg`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 bg-white rounded-lg flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-semibold ${config.titleColor}`}>
            {title}
          </div>
          {value !== undefined && (
            <div className={`text-2xl font-bold ${config.valueColor} mt-1`}>
              ₹{value.toLocaleString()}
            </div>
          )}
          <p className="text-sm text-gray-600 mt-2">{description}</p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Preset: Tax Savings Card
 */
export function TaxSavingsCard({
  savings,
  onOptimize,
}: {
  savings: number;
  onOptimize?: () => void;
}) {
  return (
    <SavingsInsightCard
      type="savings"
      title="Potential Tax Savings"
      value={savings}
      description="Optimize your salary structure to save more on taxes"
      action={
        onOptimize
          ? {
              label: "Optimize Now",
              onClick: onOptimize,
            }
          : undefined
      }
    />
  );
}

/**
 * Preset: Regime Switch Card
 */
export function RegimeSwitchCard({
  savings,
  regime,
  onLearnMore,
}: {
  savings: number;
  regime: "old" | "new";
  onLearnMore?: () => void;
}) {
  return (
    <SavingsInsightCard
      type="tip"
      title={`Switch to ${regime === "old" ? "Old" : "New"} Tax Regime`}
      value={savings}
      description={`${regime === "old" ? "Old" : "New"} regime could save you ₹${savings.toLocaleString()} annually`}
      action={
        onLearnMore
          ? {
              label: "Learn More",
              onClick: onLearnMore,
            }
          : undefined
      }
    />
  );
}

/**
 * Preset: Investment Tip Card
 */
export function InvestmentTipCard({
  amount,
  savings,
  onInvest,
}: {
  amount: number;
  savings: number;
  onInvest?: () => void;
}) {
  return (
    <SavingsInsightCard
      type="tip"
      title="Invest to Save Taxes"
      description={`Invest ₹${amount.toLocaleString()} in ELSS/PPF to save ₹${savings.toLocaleString()} in taxes`}
      action={
        onInvest
          ? {
              label: "Tax Planner",
              onClick: onInvest,
            }
          : undefined
      }
    />
  );
}

/**
 * Preset: Compliance Warning Card
 */
export function ComplianceWarningCard({
  message,
  onFix,
}: {
  message: string;
  onFix?: () => void;
}) {
  return (
    <SavingsInsightCard
      type="warning"
      title="Compliance Alert"
      description={message}
      action={
        onFix
          ? {
              label: "Fix Now",
              onClick: onFix,
            }
          : undefined
      }
    />
  );
}
