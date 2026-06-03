/**
 * CLUSTER MANAGER APP - Control Tower Interface (V12 Enhanced)
 * Performance oversight, not execution
 *
 * Philosophy: Monitor → Intervene → Escalate → Plan
 * Hierarchy: CM → OMs → Teams (indirect)
 *
 * TIME-BASED MODES & DAILY FLOW (V12):
 * PRE_DAY (8:00 PM): Next day readiness, coverage planning
 * MORNING_REVIEW (10:00 AM): Start of day summary - yesterday performance + today priorities
 * LIVE MONITORING (9:00 AM - 8:00 PM): Real-time performance tracking (conversions, revenue, SLA)
 * MIDDAY (12:00 PM - 6:00 PM): At Risk Today panel - pipeline health, conversion gaps, follow-up issues
 * PROBLEM_SOLVING (3:00 PM): Intervention focus - underperforming OMs, escalations
 * PLANNING (5:00 PM): EOD summary, next-day planning
 * DATA LOCK (Midnight - 6:00 AM): System freeze, incentive calculation
 *
 * V12 TSM INTEGRATION:
 * - Shows TSM-driven insights (SLA impact, conversion quality, funnel health)
 * - Never exposes CRM/TSE screens - only aggregated outcomes
 * - Complete lifecycle visibility: Sales → Ops → Retention → Renewal
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Shield, 
  BarChart3,
  Clock,
  Activity,
  Crosshair,
  Award,
  Bell
} from "lucide-react";
import { CMCommandDashboard } from "./CMCommandDashboard";
import { CMOMPerformance } from "./CMOMPerformance";
import { CMEscalationQueue } from "./CMEscalationQueue";
import { CMRevenuePipeline } from "./CMRevenuePipeline";
import { CMRetentionHealth } from "./CMRetentionHealth";
import { CMReportsAnalytics } from "./CMReportsAnalytics";
import { CMInterventionCenter } from "./CMInterventionCenter";
import { CMIncentiveTracker } from "./CMIncentiveTracker";
import { CMAlertSystem } from "./CMAlertSystem";
import { CMDataStateBadge } from "./CMDataStateBadge";
import { CMMorningDeadlineIndicator } from "./CMMorningDeadlineIndicator";
import { CMNextDayReadinessPanel } from "./CMNextDayReadinessPanel";
import { CMEODSummaryPanel } from "./CMEODSummaryPanel";
import { CMStartOfDaySummary } from "./CMStartOfDaySummary";
import { CMAtRiskTodayPanel } from "./CMAtRiskTodayPanel";
import { CMLivePerformanceIndicator } from "./CMLivePerformanceIndicator";
import { clusterManagerService } from "../../services/clusterManagerService";
import { CM_TIME_MODE_CONFIGS, CURRENT_CM_NAME, MORNING_DEADLINE_HOUR } from "../../constants/clusterManager.constants";
import type { CMTimeMode } from "../../types/clusterManager.types";
import { useRole } from "../../contexts/RoleContext";
import { useBusinessRules } from "../../contexts/BusinessRulesContext";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";

function getCurrentTimeMode(hour: number): CMTimeMode {
  // Find matching time mode
  for (const config of CM_TIME_MODE_CONFIGS) {
    if (hour >= config.startHour && hour < config.endHour) {
      return config.mode;
    }
  }
  
  return "NORMAL";
}

export function ClusterManagerApp() {
  const { currentUser, currentRole } = useRole();
  const { getRevenueTarget } = useBusinessRules();
  const [currentScreen, setCurrentScreen] = useState("interventions");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedOMId, setSelectedOMId] = useState<string | null>(null);

  // ✅ Get cluster assignment for current user
  const userCluster = currentUser.clusterId
    ? organizationHierarchyService.getClusterById(currentUser.clusterId)
    : null;

  const userPincodes = currentUser.assignedPincodes || [];

  // ✅ Get city-specific revenue target
  const revenueTarget = getRevenueTarget(currentUser.cityId);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const timeMode = getCurrentTimeMode(hour);

  // Load dashboard data with city-specific revenue target
  const clusterKPIs = clusterManagerService.getClusterKPIs(revenueTarget);
  const clusterSummary = clusterManagerService.getClusterSummary();
  const omCards = clusterManagerService.getOMPerformanceCards();
  const escalations = clusterManagerService.getEscalations();
  const clusterRevenue = clusterManagerService.getClusterRevenue();
  const clusterRetention = clusterManagerService.getClusterRetention();
  const clusterAnalytics = clusterManagerService.getClusterAnalytics();
  const interventions = clusterManagerService.getInterventions();
  const customerEscalations = clusterManagerService.getCustomerEscalations();
  const incentiveData = clusterManagerService.getCMIncentiveTracker();

  // Load system-generated alerts
  const [alerts, setAlerts] = useState(clusterManagerService.getSystemAlerts());

  // V7: Load time-based data
  const dataState = clusterManagerService.getCurrentDataState();
  const pendingActionCount = clusterManagerService.getPendingActionCount();
  const nextDayReadiness = timeMode === "PRE_DAY" ? clusterManagerService.getNextDayReadiness() : null;
  const eodSummary = timeMode === "PLANNING" ? clusterManagerService.getEODSummary() : null;

  // V12: Load daily flow data
  const startOfDaySummary = timeMode === "MORNING_REVIEW" ? clusterManagerService.getStartOfDaySummary() : null;
  const atRiskToday = (timeMode === "PROBLEM_SOLVING" || timeMode === "NORMAL") ? clusterManagerService.getAtRiskTodayPanel() : null;
  const livePerformance = clusterManagerService.getLivePerformanceIndicator();

  const getTimeModeInfo = () => {
    const config = CM_TIME_MODE_CONFIGS.find((c) => c.mode === timeMode);
    if (config) {
      return {
        label: config.label,
        color: config.color,
        priorities: config.priorities,
      };
    }
    return {
      label: "Normal Mode",
      color: "bg-gray-600",
      priorities: [],
    };
  };

  const modeInfo = getTimeModeInfo();

  // Count critical items
  const criticalEscalations = escalations.filter((e) => e.severity === "CRITICAL").length;
  const criticalInterventions = interventions.filter((i) => i.severity === "CRITICAL" && i.status !== "RESOLVED").length;
  const redOMs = omCards.filter((om) => om.overallHealth === "RED").length;
  const amberOMs = omCards.filter((om) => om.overallHealth === "AMBER").length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* V7: CRITICAL ALERT BANNER (Priority Override - Sticky) */}
      {criticalInterventions > 0 || criticalEscalations > 0 ? (
        <div className="bg-red-600 text-white sticky top-0 z-50 animate-pulse">
          <div className="max-w-[1920px] mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 animate-bounce" />
                <div>
                  <span className="font-semibold">
                    CRITICAL ALERTS REQUIRE IMMEDIATE ACTION
                  </span>
                  <span className="ml-3 text-sm opacity-90">
                    {criticalInterventions} Critical Interventions • {criticalEscalations} Critical Escalations
                  </span>
                </div>
              </div>
              <Button
                onClick={() => setCurrentScreen("interventions")}
                className="bg-white text-red-600 hover:bg-red-50 font-semibold"
              >
                Go to Intervention Center
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                Cluster Manager - Control Tower
              </h1>
              <p className="text-sm text-slate-600 mt-0.5">
                {currentUser.name} • {userCluster?.name || "No Cluster Assigned"}
                {userPincodes.length > 0 && (
                  <span className="ml-2 text-xs text-teal-600 font-medium">
                    ({userPincodes.length} Pincode{userPincodes.length !== 1 ? 's' : ''})
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Time Mode Indicator */}
              <div className={`${modeInfo.color} text-white px-4 py-2 rounded-lg`}>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <div>
                    <div className="text-xs font-medium">
                      {modeInfo.label}
                      {timeMode === "FIELD_MODE" && " (Lightweight)"}
                    </div>
                    <div className="text-xs opacity-90">
                      {currentTime.toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-2">
                {/* V7: Data State Badge */}
                <CMDataStateBadge state={dataState} />

                <Badge variant="outline" className="gap-1.5">
                  <Activity className="w-3 h-3 text-green-600" />
                  {clusterSummary.omsOnline.active}/{clusterSummary.omsOnline.total} OMs Active
                </Badge>
                {criticalEscalations > 0 && (
                  <Badge variant="destructive" className="gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    {criticalEscalations} Critical
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* V7: Morning Deadline Indicator (10 AM - 11:30 AM) */}
      {timeMode === "MORNING_REVIEW" && pendingActionCount > 0 && (
        <div className="max-w-[1920px] mx-auto px-6 pt-4">
          <CMMorningDeadlineIndicator
            pendingCount={pendingActionCount}
            deadlineHour={MORNING_DEADLINE_HOUR}
            onNavigateToActions={() => setCurrentScreen("interventions")}
          />
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        {/* V7: Pre-Day Mode - Next Day Readiness Panel */}
        {timeMode === "PRE_DAY" && nextDayReadiness && (
          <div className="mb-6">
            <CMNextDayReadinessPanel readiness={nextDayReadiness} />
          </div>
        )}

        {/* V12: Morning Review - Start of Day Summary */}
        {timeMode === "MORNING_REVIEW" && startOfDaySummary && (
          <div className="mb-6">
            <CMStartOfDaySummary summary={startOfDaySummary} />
          </div>
        )}

        {/* V12: Live Performance Indicator (during operational hours) */}
        {hour >= 9 && hour < 20 && dataState === "LIVE" && (
          <div className="mb-6">
            <CMLivePerformanceIndicator indicator={livePerformance} />
          </div>
        )}

        {/* V12: At Risk Today Panel (midday/afternoon) */}
        {(timeMode === "PROBLEM_SOLVING" || (timeMode === "NORMAL" && hour >= 12 && hour < 18)) && atRiskToday && (
          <div className="mb-6">
            <CMAtRiskTodayPanel data={atRiskToday} />
          </div>
        )}

        {/* V7: Planning Mode - EOD Summary Panel */}
        {timeMode === "PLANNING" && eodSummary && (
          <div className="mb-6">
            <CMEODSummaryPanel summary={eodSummary} />
          </div>
        )}

        <Tabs value={currentScreen} onValueChange={setCurrentScreen}>
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="interventions" className="gap-2">
              <Crosshair className="w-4 h-4" />
              Interventions
              {criticalInterventions > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 animate-pulse">
                  {criticalInterventions}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
              {redOMs > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {redOMs}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="om-performance" className="gap-2">
              <Users className="w-4 h-4" />
              OM Performance
            </TabsTrigger>

            <TabsTrigger value="escalations" className="gap-2">
              <AlertTriangle className="w-4 h-4" />
              Escalations
              {criticalEscalations > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                  {criticalEscalations}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="revenue" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Revenue
            </TabsTrigger>

            <TabsTrigger value="retention" className="gap-2">
              <Shield className="w-4 h-4" />
              Retention
              {clusterKPIs.churnRisk.high > 0 && (
                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-red-600 border-red-600">
                  {clusterKPIs.churnRisk.high}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="incentives" className="gap-2">
              <Award className="w-4 h-4" />
              Incentive Tracker
            </TabsTrigger>

            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Reports & Planning
            </TabsTrigger>
          </TabsList>

          {/* Screen 0: OM Intervention Center (PRIMARY WORKING SCREEN) */}
          <TabsContent value="interventions" className="mt-0">
            <CMInterventionCenter
              interventions={interventions}
              customerEscalations={customerEscalations}
            />
          </TabsContent>

          {/* Screen 1: Cluster Command Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <CMCommandDashboard
              kpis={clusterKPIs}
              summary={clusterSummary}
              omCards={omCards}
              onOMClick={(omId) => {
                setSelectedOMId(omId);
                setCurrentScreen("om-performance");
              }}
              onOpenEscalations={() => setCurrentScreen("escalations")}
            />
          </TabsContent>

          {/* Screen 2: OM Performance View */}
          <TabsContent value="om-performance" className="mt-0">
            <CMOMPerformance
              omCards={omCards}
              selectedOMId={selectedOMId}
              onSelectOM={setSelectedOMId}
            />
          </TabsContent>

          {/* Screen 3: Escalation & Intervention Queue */}
          <TabsContent value="escalations" className="mt-0">
            <CMEscalationQueue escalations={escalations} />
          </TabsContent>

          {/* Screen 4: Revenue & Pipeline Dashboard */}
          <TabsContent value="revenue" className="mt-0">
            <CMRevenuePipeline revenue={clusterRevenue} />
          </TabsContent>

          {/* Screen 5: Retention & Customer Health */}
          <TabsContent value="retention" className="mt-0">
            <CMRetentionHealth retention={clusterRetention} />
          </TabsContent>

          {/* Screen 6: Reports & Analytics */}
          <TabsContent value="reports" className="mt-0">
            <CMReportsAnalytics analytics={clusterAnalytics} />
          </TabsContent>

          {/* Screen 7: Incentive Tracker */}
          <TabsContent value="incentives" className="mt-0">
            <CMIncentiveTracker incentiveData={incentiveData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Global Alert System Overlay */}
      <CMAlertSystem
        alerts={alerts}
        onDismiss={(alertId) => {
          setAlerts(alerts.filter((a) => a.id !== alertId));
        }}
        onTakeAction={(alertId) => {
          // Navigate to intervention center
          setCurrentScreen("interventions");
          // In production, would scroll to/highlight the specific intervention
        }}
      />
    </div>
  );
}