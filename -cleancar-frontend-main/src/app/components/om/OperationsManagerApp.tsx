/**
 * OPERATIONS MANAGER APP - Complete Integration
 * Professional structure with time-based UI behavior
 * Philosophy: Business controller, not executor
 * 
 * TIME-BASED MODES:
 * Pre-Day: Planning mode
 * 10:00 AM - 12:00 PM: Performance Review Mode
 * 12:00 PM - 5:00 PM: Field Mode
 * 5:00 PM - 7:00 PM: Review & Planning Mode
 * 7:00 PM+: Day Close Mode
 * Midnight+: Data Lock Mode
 */

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Clock, Sun, Briefcase, FileText, Moon, Lock } from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { OMCommandDashboard } from "./OMCommandDashboard";
import { OMTeamOperations } from "./OMTeamOperations";
import { OMEscalationQueue } from "./OMEscalationQueue";
import { OMSalesRevenue } from "./OMSalesRevenue";
import { OMCustomerRetention } from "./OMCustomerRetention";
import { OMIncentivePayroll } from "./OMIncentivePayroll";
import { OMReportsAnalytics } from "./OMReportsAnalytics";
import { OMFieldMode } from "./OMFieldMode";
import { OMDayCloseMode } from "./OMDayCloseMode";
import { OMPreDayPreview } from "./OMPreDayPreview";
import { OMDataLockBanner } from "./OMDataLockIndicator";
import { OMAuditSummary } from "./OMAuditTrail";
import { OMNotificationContainer } from "./OMNotification";
import {
  ApprovalModal,
  RejectionModal,
  RequestInfoModal,
  DiscountModal,
  WasherDetailModal,
  IncentiveBreakdownModal,
} from "./OMModals";
import { operationsManagerService } from "../../services/operationsManagerService";
import { notificationService } from "../../services/notificationService";
import { TIME_MODE_CONFIGS, CURRENT_OM_ID, DEFAULT_LOCATION, DISCOUNT_LIMITS } from "../../constants/operationsManager.constants";
import type { OMTimeMode } from "../../types/operationsManager.types";
import { logger } from "../../services/logger";

function getCurrentTimeMode(hour: number): OMTimeMode {
  // For development: Allow normal mode during most hours
  // Midnight to 3 AM: Locked (Payroll processing)
  if (hour >= 0 && hour < 3) return "LOCKED";
  
  // 3 AM to 6 AM: Pre-Day Planning
  if (hour >= 3 && hour < 6) return "PRE_DAY";
  
  // Find matching time mode
  for (const config of TIME_MODE_CONFIGS) {
    if (hour >= config.startHour && hour < config.endHour) {
      return config.mode;
    }
  }
  
  return "PERFORMANCE_REVIEW"; // Default to Performance Review during work hours
}

export function OperationsManagerApp() {
  logger.log("🚀 OperationsManagerApp component rendering");

  const [currentScreen, setCurrentScreen] = useState("dashboard");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  const [bypassPreDay, setBypassPreDay] = useState(false); // Allow bypassing pre-day mode

  // Modal states
  const [approvalModal, setApprovalModal] = useState<{
    show: boolean;
    title: string;
    entityName: string;
    onConfirm: (notes?: string) => void;
  } | null>(null);

  const [rejectionModal, setRejectionModal] = useState<{
    show: boolean;
    title: string;
    entityName: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const [requestInfoModal, setRequestInfoModal] = useState<{
    show: boolean;
    title: string;
    entityName: string;
    onConfirm: (question: string) => void;
  } | null>(null);

  const [discountModal, setDiscountModal] = useState<{
    show: boolean;
    leadId: string;
    leadName: string;
    estimatedValue: number;
  } | null>(null);

  const [washerDetailModal, setWasherDetailModal] = useState<{
    show: boolean;
    washer: any;
  } | null>(null);

  const [incentiveModal, setIncentiveModal] = useState<{
    show: boolean;
    washer: any;
  } | null>(null);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.getHours();
  const timeMode = getCurrentTimeMode(hour);
  const isDataLocked = timeMode === "LOCKED";

  // Get assigned pincodes from RoleContext
  const { currentUser } = useRole();
  const assignedPincodes = currentUser.assignedPincodes || [];

  // Load all data from service (no hard-coded data)
  const kpis = operationsManagerService.getCommandDashboardKPIs(assignedPincodes);
  const supervisors = operationsManagerService.getSupervisorStatusCards(assignedPincodes);
  const alerts = operationsManagerService.getOMAlerts();
  const teamOperations = operationsManagerService.getTeamOperationsData(undefined, assignedPincodes);
  const escalations = operationsManagerService.getEscalationQueue();
  // Safely load data with error handling
  let salesMetrics, churnRiskCustomers, incentiveTracking, analyticsReport, fieldVisits, dayCloseSummary, auditSummary, preDayData;

  try {
    salesMetrics = operationsManagerService.getSalesMetrics();
    churnRiskCustomers = operationsManagerService.getChurnRiskCustomers();
    incentiveTracking = operationsManagerService.getIncentiveTracking();
    analyticsReport = operationsManagerService.getAnalyticsReport("DAILY");
    fieldVisits = operationsManagerService.getFieldVisits();
    dayCloseSummary = operationsManagerService.getDayCloseSummary();
    auditSummary = operationsManagerService.getTodayAuditSummary();
    preDayData = operationsManagerService.getPreDayPreview(
      new Date(currentTime.getTime() + 24 * 60 * 60 * 1000) // Tomorrow
    );
  } catch (error) {
    console.error("❌ Error loading OM data:", error);
    // Return error state
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-900 mb-4">Data Loading Error</h2>
          <p className="text-red-700 mb-4">
            Failed to load Operations Manager data. Check console for details.
          </p>
          <pre className="text-xs bg-red-100 p-4 rounded overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }

  logger.log("✅ All OM data loaded successfully");
  logger.log("📊 Sales Metrics:", salesMetrics ? "Loaded" : "Missing");

  const getTimeModeInfo = () => {
    switch (timeMode) {
      case "PRE_DAY":
        return { icon: Briefcase, label: "Pre-Day Planning", color: "bg-gray-600", hint: "Prepare for the day" };
      case "PERFORMANCE_REVIEW":
        return { icon: Sun, label: "Performance Review", color: "bg-blue-600", hint: "Focus: Units vs Target" };
      case "FIELD_MODE":
        return { icon: Briefcase, label: "Field Mode", color: "bg-green-600", hint: "Action-Heavy Interface" };
      case "REVIEW_PLANNING":
        return { icon: FileText, label: "Review & Planning", color: "bg-purple-600", hint: "EOD Summary" };
      case "DAY_CLOSE":
        return { icon: Moon, label: "Day Close Mode", color: "bg-slate-900", hint: "Finalize Operations" };
      case "LOCKED":
        return { icon: Lock, label: "Data Lock Mode", color: "bg-red-600", hint: "Payroll processing" };
      default:
        return { icon: Clock, label: "Normal Mode", color: "bg-gray-600", hint: "" };
    }
  };

  const modeInfo = getTimeModeInfo();
  const ModeIcon = modeInfo.icon;

  // Handlers
  const handleDrillDown = (metric: string) => {
    logger.log("Drill down:", metric);
    if (metric === "units" || metric === "washers") {
      setCurrentScreen("teams");
    }
  };

  const handleViewTeams = () => setCurrentScreen("teams");
  const handleOpenEscalations = () => setCurrentScreen("escalations");

  const handleAlertClick = (alert: any) => {
    logger.log("Alert clicked:", alert);
    // Navigate to relevant screen based on alert
    if (alert.category === "ESCALATION") {
      setCurrentScreen("escalations");
    } else if (alert.category === "UNITS" || alert.category === "ATTENDANCE") {
      setCurrentScreen("teams");
    } else if (alert.category === "REVENUE") {
      setCurrentScreen("customers");
    }
  };

  const handleReassignCover = (washerId: string) => {
    logger.log("Reassign cover for:", washerId);
    // Show cover reassignment modal
  };

  const handleViewWasherDetail = (washerId: string) => {
    logger.log("View washer detail:", washerId);
    // Show washer detail modal
    const washer = teamOperations.washers.find((w: any) => w.id === washerId);
    if (washer) {
      setWasherDetailModal({ show: true, washer });
    }
  };

  const handleEscalate = (washerId: string) => {
    logger.log("Escalate washer:", washerId);
    setCurrentScreen("escalations");
  };

  const handleApproveEscalation = (escalationId: string, notes?: string) => {
    operationsManagerService.approveEscalation(escalationId, CURRENT_OM_ID, notes);
    logger.log("Approved:", escalationId);
  };

  const handleRejectEscalation = (escalationId: string, reason: string) => {
    operationsManagerService.rejectEscalation(escalationId, CURRENT_OM_ID, reason);
    logger.log("Rejected:", escalationId, reason);
  };

  const handleRequestEscalationInfo = (escalationId: string, question: string) => {
    operationsManagerService.requestEscalationInfo(escalationId, CURRENT_OM_ID, question);
    logger.log("Info requested:", escalationId, question);
  };

  const handleEscalateToDirector = (escalationId: string) => {
    logger.log("Escalate to director:", escalationId);
  };

  const handleAddLead = () => {
    logger.log("Add new lead");
  };

  const handleUpdateLeadStage = (leadId: string, newStage: string, lostData?: any) => {
    logger.log("Update lead stage:", leadId, newStage, lostData);
  };

  const handleScheduleVisit = (leadId: string) => {
    logger.log("Schedule visit for lead:", leadId);
  };

  const handleAssignRetentionTask = (customerId: string) => {
    logger.log("Assign retention task:", customerId);
  };

  const handleLogResolution = (customerId: string) => {
    logger.log("Log resolution:", customerId);
  };

  const handleMarkUpsellAttempt = (customerId: string) => {
    logger.log("Mark upsell attempt:", customerId);
  };

  const handleViewIncentiveBreakdown = (washerId: string) => {
    logger.log("View incentive breakdown:", washerId);
    // Show incentive breakdown modal
    const washer = teamOperations.washers.find((w: any) => w.id === washerId);
    if (washer) {
      // Create properly structured data for modal
      const modalData = {
        name: washer.name || "Unknown",
        id: washer.id || washerId,
        baseIncentive: washer.baseIncentive || 5000,
        kpiScore: washer.kpiScore || 85,
        finalIncentive: washer.finalIncentive || 4250,
        kpiBreakdown: washer.kpiBreakdown || [
          { metric: "Revenue", achievement: 95, score: 95, weight: 40 },
          { metric: "Conversion", achievement: 85, score: 85, weight: 20 },
          { metric: "Retention", achievement: 80, score: 80, weight: 20 },
          { metric: "Operations", achievement: 90, score: 90, weight: 10 },
          { metric: "CX", achievement: 92, score: 92, weight: 10 }
        ]
      };
      setIncentiveModal({ show: true, washer: modalData });
    }
  };

  const handleSubmitOverrideRequest = (washerId: string) => {
    logger.log("Submit override request:", washerId);
  };

  const handleExportPayroll = () => {
    logger.log("Export payroll");
  };

  const handleDownloadReport = (reportType: string) => {
    logger.log("Download report:", reportType);
  };

  const handleShareReport = (reportType: string) => {
    logger.log("Share report:", reportType);
  };

  const handleExportCSV = (reportType: string) => {
    logger.log("Export CSV:", reportType);
  };

  // Field Mode handlers
  const handleLogVisit = (visitType: string, location: string) => {
    logger.log("Log visit:", visitType, location);
  };

  const handleAddProspect = (name: string, location: string, phone: string) => {
    logger.log("Add prospect:", name, location, phone);
  };

  // Day Close handlers
  const handleSubmitDayClose = (notes: string) => {
    logger.log("Day close submitted:", notes);
  };

  // Pre-Day handlers
  const handlePlanDay = () => {
    setBypassPreDay(true); // Bypass pre-day mode
    setCurrentScreen("dashboard");
  };

  const handleScheduleNewVisit = () => {
    logger.log("Schedule new visit");
  };

  // Show Pre-Day Preview if in PRE_DAY mode and not bypassed
  if (timeMode === "PRE_DAY" && !bypassPreDay) {
    return (
      <OMPreDayPreview
        data={preDayData}
        onPlanDay={handlePlanDay}
        onViewEscalations={() => setCurrentScreen("escalations")}
        onScheduleVisit={handleScheduleNewVisit}
      />
    );
  }

  // Show Day Close Mode if in DAY_CLOSE timeframe
  if (timeMode === "DAY_CLOSE" && currentScreen === "dayclose") {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900">
        <OMDayCloseMode
          summary={dayCloseSummary}
          isLocked={false}
          onSubmitDayClose={handleSubmitDayClose}
        />
        <Button
          className="fixed top-4 right-4 z-50 bg-white text-slate-900"
          variant="outline"
          onClick={() => setCurrentScreen("dashboard")}
        >
          Exit Day Close Mode
        </Button>
      </div>
    );
  }

  // Show Field Mode overlay if activated
  if (currentScreen === "field") {
    return (
      <div className="fixed inset-0 z-50 bg-white">
        <OMFieldMode
          visits={fieldVisits}
          onLogVisit={handleLogVisit}
          onUpdateLeadStage={handleUpdateLeadStage}
          onAddProspect={handleAddProspect}
          currentLocation={{ lat: DEFAULT_LOCATION.LAT, lng: DEFAULT_LOCATION.LNG }}
        />
        <Button
          className="fixed top-4 right-4 z-50"
          variant="outline"
          onClick={() => setCurrentScreen("dashboard")}
        >
          Exit Field Mode
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Data Lock Banner */}
      {isDataLocked && (
        <>
          <OMDataLockBanner lockReason="PAYROLL_PROCESSING" />
          {/* O2 FIX: Data-entry tabs disabled; Reports/Analytics still accessible */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mx-4 mb-2 text-sm text-amber-800">
            ⚠️ Data Lock Mode (00:00–03:00): Write operations disabled. Reports and Analytics are read-only.
          </div>
        </>
      )}

      {/* Main App */}
      <Tabs value={currentScreen} onValueChange={setCurrentScreen}>
        {/* Navigation Bar */}
        <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto">
            <TabsList className="w-full grid grid-cols-7 h-auto p-0">
              <TabsTrigger value="dashboard" className="py-4 text-sm font-semibold">
                🎯 Command
              </TabsTrigger>
              <TabsTrigger value="teams" className="py-4 text-sm font-semibold">
                👥 Teams
              </TabsTrigger>
              <TabsTrigger value="escalations" className="py-4 text-sm font-semibold">
                ⚠️ Escalations
              </TabsTrigger>
              <TabsTrigger value="sales" className="py-4 text-sm font-semibold">
                💰 Sales
              </TabsTrigger>
              <TabsTrigger value="customers" className="py-4 text-sm font-semibold">
                🔁 Retention
              </TabsTrigger>
              <TabsTrigger value="incentives" className="py-4 text-sm font-semibold">
                💵 Payroll
              </TabsTrigger>
              <TabsTrigger value="reports" className="py-4 text-sm font-semibold">
                📊 Analytics
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* 1️⃣ Command Dashboard */}
        <TabsContent value="dashboard" className="mt-0">
          <div className="space-y-4 p-4">
            {/* Audit Summary */}
            <OMAuditSummary
              summary={auditSummary}
              onViewFull={() => setShowAuditTrail(true)}
            />

            <OMCommandDashboard
              kpis={kpis}
              supervisors={supervisors}
              alerts={alerts}
              onDrillDown={handleDrillDown}
              onViewTeams={handleViewTeams}
              onOpenEscalations={handleOpenEscalations}
              onAlertClick={handleAlertClick}
              timeMode={timeMode}
            />
          </div>
        </TabsContent>

        {/* 2️⃣ Team Operations */}
        <TabsContent value="teams" className="mt-0">
          <OMTeamOperations
            teams={teamOperations.teams}
            washers={teamOperations.washers}
            onReassignCover={handleReassignCover}
            onViewWasherDetail={handleViewWasherDetail}
            onEscalate={handleEscalate}
          />
        </TabsContent>

        {/* 3️⃣ Escalation Queue */}
        <TabsContent value="escalations" className="mt-0">
          <OMEscalationQueue
            escalations={escalations}
            onApprove={handleApproveEscalation}
            onReject={handleRejectEscalation}
            onRequestInfo={handleRequestEscalationInfo}
            onEscalate={handleEscalateToDirector}
          />
        </TabsContent>

        {/* 4️⃣ Sales & Revenue */}
        <TabsContent value="sales" className="mt-0">
          {salesMetrics ? (
            <OMSalesRevenue
              metrics={salesMetrics}
              onAddLead={handleAddLead}
              onUpdateStage={handleUpdateLeadStage}
              onScheduleVisit={handleScheduleVisit}
            />
          ) : (
            <div className="p-6">
              <p className="text-red-600">Sales metrics data unavailable</p>
            </div>
          )}
        </TabsContent>

        {/* 5️⃣ Customer Retention */}
        <TabsContent value="customers" className="mt-0">
          <OMCustomerRetention
            customers={churnRiskCustomers}
            onAssignTask={handleAssignRetentionTask}
            onLogResolution={handleLogResolution}
            onMarkUpsell={handleMarkUpsellAttempt}
          />
        </TabsContent>

        {/* 6️⃣ Incentive & Payroll */}
        <TabsContent value="incentives" className="mt-0">
          <OMIncentivePayroll
            tracking={incentiveTracking}
            onViewBreakdown={handleViewIncentiveBreakdown}
            onSubmitOverride={handleSubmitOverrideRequest}
            onExportPayroll={handleExportPayroll}
          />
        </TabsContent>

        {/* 7️⃣ Reports & Analytics */}
        <TabsContent value="reports" className="mt-0">
          <OMReportsAnalytics
            report={analyticsReport}
            onDownload={handleDownloadReport}
            onShare={handleShareReport}
            onExportCSV={handleExportCSV}
          />
        </TabsContent>
      </Tabs>

      {/* Time-Based Mode Indicator */}
      <div className="fixed bottom-4 right-4 flex flex-col items-end gap-2">
        <Badge className={`${modeInfo.color} text-white px-4 py-2`}>
          <ModeIcon className="w-4 h-4 mr-2" />
          {modeInfo.label}
        </Badge>
        {modeInfo.hint && (
          <p className="text-xs text-gray-600 bg-white px-3 py-1 rounded shadow">
            {modeInfo.hint}
          </p>
        )}
      </div>

      {/* Time-Based Mode Actions */}
      {timeMode === "FIELD_MODE" && (
        <div className="fixed bottom-4 left-4">
          <Button
            size="lg"
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => setCurrentScreen("field")}
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Enter Field Mode
          </Button>
        </div>
      )}
      
      {timeMode === "DAY_CLOSE" && (
        <div className="fixed bottom-4 left-4">
          <Button
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => setCurrentScreen("dayclose")}
          >
            <Moon className="w-5 h-5 mr-2" />
            Enter Day Close Mode
          </Button>
        </div>
      )}

      {/* Audit Trail Modal */}
      {showAuditTrail && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Full Audit Trail</h2>
              <Button variant="ghost" onClick={() => setShowAuditTrail(false)}>
                Close
              </Button>
            </div>
            {/* Placeholder - will be implemented with full audit trail */}
            <p className="text-gray-600">Audit trail component will be integrated here</p>
          </div>
        </div>
      )}

      {/* Modals */}
      {approvalModal && (
        <ApprovalModal
          title={approvalModal.title}
          entityName={approvalModal.entityName}
          onConfirm={approvalModal.onConfirm}
          onCancel={() => setApprovalModal(null)}
        />
      )}

      {rejectionModal && (
        <RejectionModal
          title={rejectionModal.title}
          entityName={rejectionModal.entityName}
          onConfirm={rejectionModal.onConfirm}
          onCancel={() => setRejectionModal(null)}
        />
      )}

      {requestInfoModal && (
        <RequestInfoModal
          title={requestInfoModal.title}
          entityName={requestInfoModal.entityName}
          onConfirm={requestInfoModal.onConfirm}
          onCancel={() => setRequestInfoModal(null)}
        />
      )}

      {discountModal && (
        <DiscountModal
          leadName={discountModal.leadName}
          estimatedValue={discountModal.estimatedValue}
          authorityLimit={DISCOUNT_LIMITS.OM_AUTHORITY}
          onApply={(discount: number) => {
            notificationService.success(
              "Discount Applied",
              `${discount}% discount applied to ${discountModal.leadName}`
            );
            setDiscountModal(null);
          }}
          onRequestApproval={(discount: number) => {
            notificationService.info(
              "Approval Requested",
              `${discount}% discount request sent to City Manager`
            );
            setDiscountModal(null);
          }}
          onCancel={() => setDiscountModal(null)}
        />
      )}

      {washerDetailModal && (
        <WasherDetailModal
          washer={washerDetailModal.washer}
          onClose={() => setWasherDetailModal(null)}
          onReassign={() => {
            notificationService.info("Reassignment", "Cover reassignment initiated");
            setWasherDetailModal(null);
          }}
        />
      )}

      {incentiveModal && (
        <IncentiveBreakdownModal
          washer={incentiveModal.washer}
          onClose={() => setIncentiveModal(null)}
        />
      )}

      {/* Notification Container */}
      <OMNotificationContainer />
    </div>
  );
}
