/**
 * TSM Command Dashboard - Primary Control Tower
 *
 * Real-time pipeline governance and team performance overview.
 * This is the main decision-making screen for the Tele Sales Manager.
 *
 * Philosophy: Monitor → Alert → Control
 * Role: TSM sees outcomes, not execution details
 *
 * @component
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Users,
  Phone,
  UserCheck,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Target,
  DollarSign,
  Activity,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import type { TSMCommandMetrics } from "../../types/teleSalesManager.types";
import {
  CONVERSION_THRESHOLDS,
  REVENUE_THRESHOLDS,
  DEAL_VALUE_DEFAULTS,
} from "../../constants/teleSalesManager.constants";

/**
 * Props for TSMCommandDashboard component
 */
interface TSMCommandDashboardProps {
  /** Callback when user clicks to drill into a specific lead stage */
  onDrillIntoStage?: (stage: string) => void;
  /** Callback when user clicks to view SLA breaches */
  onOpenSLABreaches?: () => void;
  /** Callback when user clicks to view team performance */
  onOpenTeamView?: () => void;
  /** Callback when user clicks to view alerts */
  onOpenAlerts?: () => void;
}

/**
 * TSM Command Dashboard Component
 *
 * Displays real-time metrics and provides navigation to detailed views.
 * Handles error states and empty data gracefully.
 */
export function TSMCommandDashboard({
  onDrillIntoStage,
  onOpenSLABreaches,
  onOpenTeamView,
  onOpenAlerts,
}: TSMCommandDashboardProps) {
  const metrics = teleSalesManagerService.getCommandMetrics();
  const alerts = teleSalesManagerService.getSystemAlerts();

  // Handle null/undefined metrics
  if (!metrics) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
        <p className="text-gray-700">Unable to load command metrics. Please try again.</p>
      </Card>
    );
  }

  /**
   * Determines conversion rate health status
   * @returns Health status: GREEN (at/above target), AMBER (5% below), RED (>5% below)
   */
  const getConversionStatus = (): "GREEN" | "AMBER" | "RED" => {
    const gap = metrics.teamConversionTarget - metrics.teamConversionRate;
    if (metrics.teamConversionRate >= metrics.teamConversionTarget) return "GREEN";
    if (gap <= 5) return "AMBER";
    return "RED";
  };

  /**
   * Determines revenue achievement health status
   * @returns Health status based on REVENUE_THRESHOLDS
   */
  const getRevenueStatus = (): "GREEN" | "AMBER" | "RED" => {
    if (metrics.revenue.percentage >= REVENUE_THRESHOLDS.ON_TRACK) return "GREEN";
    if (metrics.revenue.percentage >= REVENUE_THRESHOLDS.WARNING) return "AMBER";
    return "RED";
  };

  /**
   * Determines SLA compliance health status
   * @returns Health status based on breach count
   */
  const getSLAStatus = (): "GREEN" | "AMBER" | "RED" => {
    if (metrics.slaBreachesToday === 0) return "GREEN";
    if (metrics.slaBreachesToday <= 5) return "AMBER";
    return "RED";
  };

  const conversionGap = metrics.teamConversionTarget - metrics.teamConversionRate;
  const conversionStatus = getConversionStatus();
  const revenueStatus = getRevenueStatus();
  const slaStatus = getSLAStatus();

  return (
    <div className="space-y-6">
      {/* Critical Alerts Banner */}
      {metrics.openAlerts.critical > 0 && (
        <div className="bg-red-600 text-white p-4 rounded-lg border-2 border-red-700 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <div className="font-bold text-lg">
                  {metrics.openAlerts.critical} Critical Alert
                  {metrics.openAlerts.critical > 1 ? "s" : ""} Require Immediate Action
                </div>
                <div className="text-sm opacity-90">
                  Pipeline governance issues detected - click to review
                </div>
              </div>
            </div>
            <Button
              onClick={onOpenAlerts}
              className="bg-white text-red-600 hover:bg-red-50 font-semibold"
            >
              View Alerts
            </Button>
          </div>
        </div>
      )}

      {/* Top KPIs Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Team Conversion Rate */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-600">
                Team Conversion Rate
              </span>
            </div>
            <Badge
              className={
                conversionStatus === "GREEN"
                  ? "bg-green-600"
                  : conversionStatus === "AMBER"
                  ? "bg-amber-600"
                  : "bg-red-600"
              }
            >
              {conversionStatus}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">
                {metrics.teamConversionRate.toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500">
                vs {metrics.teamConversionTarget}% target
              </span>
            </div>
            {conversionGap > 0 && (
              <div className="text-sm text-red-600 font-medium">
                -{conversionGap.toFixed(1)}% below target
              </div>
            )}
            {conversionGap <= 0 && (
              <div className="text-sm text-green-600 font-medium">
                +{Math.abs(conversionGap).toFixed(1)}% above target
              </div>
            )}
          </div>
        </Card>

        {/* Revenue MTD */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Revenue (MTD)
              </span>
            </div>
            <Badge
              className={
                revenueStatus === "GREEN"
                  ? "bg-green-600"
                  : revenueStatus === "AMBER"
                  ? "bg-amber-600"
                  : "bg-red-600"
              }
            >
              {metrics.revenue.percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-gray-900">
              ₹{(metrics.revenue.mtd / 100000).toFixed(1)}L
            </div>
            <div className="text-sm text-gray-600">
              Target: ₹{(metrics.revenue.target / 100000).toFixed(1)}L
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className={`h-2 rounded-full ${
                  revenueStatus === "GREEN"
                    ? "bg-green-600"
                    : revenueStatus === "AMBER"
                    ? "bg-amber-600"
                    : "bg-red-600"
                }`}
                style={{ width: `${Math.min(metrics.revenue.percentage, 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* SLA Breaches Today */}
        <Card
          className={`p-6 cursor-pointer hover:shadow-lg transition-shadow ${
            slaStatus === "RED" ? "border-2 border-red-300 bg-red-50" : ""
          }`}
          onClick={onOpenSLABreaches}
          role="button"
          tabIndex={0}
          aria-label={`View SLA breaches. ${metrics.slaBreachesToday} breaches today. Status: ${slaStatus}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenSLABreaches?.();
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-600">
                SLA Breaches (Today)
              </span>
            </div>
            <Badge
              className={
                slaStatus === "GREEN"
                  ? "bg-green-600"
                  : slaStatus === "AMBER"
                  ? "bg-amber-600"
                  : "bg-red-600"
              }
            >
              {slaStatus}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-3xl font-bold text-red-600">
              {metrics.slaBreachesToday}
            </div>
            {metrics.slaBreachesToday > 0 && (
              <div className="text-sm text-red-600 font-medium">
                Click to view breach details
              </div>
            )}
            {metrics.slaBreachesToday === 0 && (
              <div className="text-sm text-green-600 font-medium">
                All leads within SLA
              </div>
            )}
          </div>
        </Card>

        {/* Open Alerts Summary */}
        <Card
          className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={onOpenAlerts}
          role="button"
          tabIndex={0}
          aria-label={`View alerts. ${metrics.openAlerts.critical} critical, ${metrics.openAlerts.warning} warning, ${metrics.openAlerts.info} info alerts`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpenAlerts?.();
            }
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-600">
                Open Alerts
              </span>
            </div>
            {metrics.openAlerts.critical > 0 && (
              <Badge className="bg-red-600 animate-pulse">CRITICAL</Badge>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-2xl font-bold text-red-600">
                {metrics.openAlerts.critical}
              </div>
              <span className="text-sm text-gray-600">Critical</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-xl font-bold text-amber-600">
                {metrics.openAlerts.warning}
              </div>
              <span className="text-sm text-gray-600">Warning</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="text-lg font-bold text-blue-600">
                {metrics.openAlerts.info}
              </div>
              <span className="text-sm text-gray-600">Info</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Lead Pipeline Stages */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Lead Pipeline Stages
          </h2>
          <Button
            variant="outline"
            onClick={onOpenTeamView}
            aria-label="View team performance details"
          >
            <Users className="w-4 h-4 mr-2" aria-hidden="true" />
            View Team Performance
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          {/* New Leads */}
          <Card
            className="p-5 cursor-pointer hover:shadow-lg hover:border-blue-400 transition-all"
            onClick={() => onDrillIntoStage?.("NEW")}
            role="button"
            tabIndex={0}
            aria-label={`View ${metrics.leadStages.new} new leads`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrillIntoStage?.("NEW");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">
                  New
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.leadStages.new}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Require first contact within 10 min
            </div>
            {metrics.leadStages.new > 30 && (
              <Badge className="mt-2 bg-amber-600">High Volume</Badge>
            )}
          </Card>

          {/* Attempted */}
          <Card
            className="p-5 cursor-pointer hover:shadow-lg hover:border-purple-400 transition-all"
            onClick={() => onDrillIntoStage?.("ATTEMPTED")}
            role="button"
            tabIndex={0}
            aria-label={`View ${metrics.leadStages.attempted} attempted leads`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrillIntoStage?.("ATTEMPTED");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">
                  Attempted
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.leadStages.attempted}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              In active calling cycle
            </div>
          </Card>

          {/* Follow-up */}
          <Card
            className="p-5 cursor-pointer hover:shadow-lg hover:border-indigo-400 transition-all"
            onClick={() => onDrillIntoStage?.("FOLLOW_UP")}
            role="button"
            tabIndex={0}
            aria-label={`View ${metrics.leadStages.followUp} follow-up leads`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrillIntoStage?.("FOLLOW_UP");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center" aria-hidden="true">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">
                  Follow-up
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {metrics.leadStages.followUp}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Scheduled callbacks and nurture
            </div>
          </Card>

          {/* Converted */}
          <Card
            className="p-5 cursor-pointer hover:shadow-lg hover:border-green-400 transition-all"
            onClick={() => onDrillIntoStage?.("CONVERTED")}
            role="button"
            tabIndex={0}
            aria-label={`View ${metrics.leadStages.converted} converted leads`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrillIntoStage?.("CONVERTED");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center" aria-hidden="true">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">
                  Converted
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.leadStages.converted}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Successfully closed deals
            </div>
          </Card>

          {/* Lost */}
          <Card
            className="p-5 cursor-pointer hover:shadow-lg hover:border-red-400 transition-all"
            onClick={() => onDrillIntoStage?.("LOST")}
            role="button"
            tabIndex={0}
            aria-label={`View ${metrics.leadStages.lost} lost leads`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onDrillIntoStage?.("LOST");
              }
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center" aria-hidden="true">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase font-medium">
                  Lost
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.leadStages.lost}
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-600">
              Require approval and analysis
            </div>
          </Card>
        </div>
      </div>

      {/* Pipeline Health Insights */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Pipeline Health Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Active Leads</div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics.leadStages.new +
                metrics.leadStages.attempted +
                metrics.leadStages.followUp}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              In pipeline (excl. converted/lost)
            </div>
          </div>
          <div>
<div className="text-xs text-gray-500 mb-1">Closed Win Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.leadStages.converted + metrics.leadStages.lost > 0
                ? (
                    (metrics.leadStages.converted /
                      (metrics.leadStages.converted + metrics.leadStages.lost)) *
                    100
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {metrics.leadStages.converted} won vs {metrics.leadStages.lost} lost
            </div>
            <div className="text-xs text-amber-600 mt-1">
              {/* B4 FIX: clarify this excludes active leads */}
              (vs closed leads only — excludes {metrics.leadStages.new + metrics.leadStages.attempted + metrics.leadStages.followUp} active)
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Pipeline Value (Annual Est.)</div>
            <div className="text-2xl font-bold text-indigo-600">
              ₹
              {(
                ((metrics.leadStages.new +
                  metrics.leadStages.attempted +
                  metrics.leadStages.followUp) *
                  DEAL_VALUE_DEFAULTS.AVERAGE) /
                100000
              ).toFixed(1)}
              L
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {/* B2 FIX: DEAL_VALUE_DEFAULTS.AVERAGE=₹25K is annual; label as such */}
              Est. at ₹{(DEAL_VALUE_DEFAULTS.AVERAGE / 1000).toFixed(0)}K avg annual value per lead
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
