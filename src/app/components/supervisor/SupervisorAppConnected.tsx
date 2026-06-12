/**
 * Supervisor App - Complete Implementation
 * All 8 screens with centralized data and functional buttons
 * Integrated with existing design system
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { useSupervisor } from "../../contexts/SupervisorContext";
import { useRole } from "../../contexts/RoleContext";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { TeamAttendanceMonitorV2 } from "./TeamAttendanceMonitorV2";
import { CoverDistributionScreen } from "./CoverDistributionScreen";
import { AutoAssignCarsModal } from "./AutoAssignCarsModal";
import { FieldAuditScreen, AuditFlowScreen, AuditResultScreen } from "./FieldAuditScreen";
import { ClothManagementScreenV2 } from "./ClothManagementScreenV2";
import { SupervisorMaterialManagement } from "./SupervisorMaterialManagement";
import { BTLLeadScreen, LeadPipelineView } from "./BTLLeadScreen";
import { BTLLeadScreenSimple } from "./BTLLeadScreenSimple";
import { IncentiveTrackerScreen } from "./IncentiveTrackerScreen";
import { EscalationScreen } from "./EscalationScreen";
import { EscalationScreenSimple } from "./EscalationScreenSimple";
import { AlertCenterScreen, StickyAlertBanner } from "./AlertCenterScreen";
import { HierarchyVisibilityScreen } from "./HierarchyVisibilityScreen";
import { AuditTrailScreen } from "./AuditTrailScreen";
import { DailyFlowScreen } from "./DailyFlowScreen";
import { KPIDashboardScreen } from "./KPIDashboardScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Bell } from "lucide-react";
import { coverRedistributionService } from "../../services/coverRedistributionService";
import { fieldAuditService } from "../../services/fieldAuditService";
import { clothManagementService } from "../../services/clothManagementService";
import { btlLeadService } from "../../services/btlLeadService";
import { leadNotificationService } from "../../services/leadNotificationService";
import { supervisorIncentiveService } from "../../services/supervisorIncentiveService";
import { escalationService } from "../../services/escalationService";
import { alertService } from "../../services/alertService";
import { hierarchyVisibilityService } from "../../services/hierarchyVisibilityService";
import { auditTrailService } from "../../services/auditTrailService";
import { dailyFlowService } from "../../services/dailyFlowService";
import { kpiDashboardService } from "../../services/kpiDashboardService";
import { mockWasherDataService } from "../../services/mockWasherDataService";
import { useScenario } from "../../contexts/ScenarioContext";
import { logger } from "../../services/logger";

export function SupervisorAppConnected() {
  const location = useLocation();
  const navigate = useNavigate();
  const { scenario, scenarioData } = useScenario();
  const { currentUser } = useRole();
  const {
    summary,
    team,
    alerts,
    unreadAlertsCount,
    auditTasks,
    clothBatches,
    schedule,
    leads,
    incentive,
    issues,
    markAlertRead,
    submitAudit,
    issueNewBatch,
    collectBatch,
    reassignJob,
    submitLead,
    submitIssue,
    resolveIssue,
    escalateIssue,
    refreshData,
    currentShift,
    shiftFocusAreas,
    isLoading,
  } = useSupervisor();

  // URL is source of truth — derived via useMemo, not useState
  // SCREEN_TO_PATH and PATH_TO_SCREEN defined below
  // Offline detection for field supervisors
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); };
  }, []);



  const PATH_TO_SCREEN: Record<string, string> = {
    "/supervisor-app/dashboard":    "dashboard",
    "/supervisor-app/team":         "team",
    "/supervisor-app/audit":        "audit",
    "/supervisor-app/cloth":        "cloth",
    "/supervisor-app/leads":        "leads",
    "/supervisor-app/incentive":    "incentive",
    "/supervisor-app/issues":       "issues",
    "/supervisor-app/alerts":       "alerts",
    "/supervisor-app/cover":        "cover",
    "/supervisor-app/visibility":   "visibility",
    "/supervisor-app/audit-trail":  "audit-trail",
    "/supervisor-app/kpi-dashboard":"kpi-dashboard",
  };
  const SCREEN_TO_PATH: Record<string, string> = {
    "dashboard":    "/supervisor-app",
    "team":         "/supervisor-app/team",
    "audit":        "/supervisor-app/audit",
    "cloth":        "/supervisor-app/cloth",
    "leads":        "/supervisor-app/leads",
    "incentive":    "/supervisor-app/incentive",
    "issues":       "/supervisor-app/issues",
    "alerts":       "/supervisor-app/alerts",
    "cover":        "/supervisor-app/cover",
    "visibility":   "/supervisor-app/visibility",
    "audit-trail":  "/supervisor-app/audit-trail",
    "audit-flow":   "/supervisor-app/audit",
    "audit-result": "/supervisor-app/audit",
    "kpi-dashboard":"/supervisor-app/kpi-dashboard",
  };
  const currentScreen = useMemo(
    () => PATH_TO_SCREEN[location.pathname] ?? "dashboard",
    [location.pathname]
  );

    // Handlers
  const handleAlertClick = (alert: any) => {
    markAlertRead(alert.id);
    if (alert.actionUrl) {
      const screen = alert.actionUrl.split("/").pop() || "dashboard";
      navigate(SCREEN_TO_PATH[screen] ?? "/supervisor-app");
    }
  };

  const handleNavigate = (screen: string) => {
    navigate(SCREEN_TO_PATH[screen] ?? "/supervisor-app");
  };

  const handleTabChange = (value: string) => {
    // URL is source of truth — just navigate, useMemo derives currentScreen
    navigate(SCREEN_TO_PATH[value] ?? "/supervisor-app", { replace: true });
  };

  const handleViewWasherDetails = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Viewing details for ${washer.name}\n\nIn production: This would navigate to the washer detail view showing:\n- Performance metrics\n- Attendance history\n- Unit completion\n- Quality scores`);
    }
  };

  const handleManualOverride = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Manual attendance override for ${washer.name}\n\nIn production: This would show a manual override modal.`);
    }
  };

  const handleTriggerCover = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Triggering cover redistribution for ${washer.name}\n\nIn production: This would show the cover assignment modal with:\n- Available washers\n- Job redistribution plan\n- Capacity analysis`);
    }
  };

  // V2 handlers with visual feedback
  const handleCallWasher = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    // Show toast notification for user feedback
    if (typeof window !== 'undefined' && washer) {
      toast.info(`Calling ${washer.name} at ${washer.phone || 'N/A'}\n\nIn production: This would initiate a phone call.`);
    }

    // In production: initiate phone call or show call dialog
    if (washer?.phone) {
      // Uncomment for production: window.location.href = `tel:${washer.phone}`;
    }
  };

  const handleMarkAttendance = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.error(`Marking attendance for ${washer.name}\n\nIn production: This would open an attendance marking modal with reason field.`);
    }
  };

  const handleVerifyGPS = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Verifying GPS for ${washer.name}\n\nIn production: This would show a map view with GPS verification interface.`);
    }
  };

  const handleViewSelfie = (washerId: string, selfieUrl: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Viewing selfie for ${washer.name}\n\nIn production: This would show a full-screen selfie modal.`);
    }
  };

  const handleRequestOverride = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Requesting attendance override for ${washer.name}\n\nIn production: This would show an override request form requiring manager approval.`);
    }
  };

  const handleSubmitIncident = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Submitting incident report for ${washer.name}\n\nIn production: This would show an incident report form.`);
    }
  };

  const handleAddNote = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Adding note for ${washer.name}\n\nIn production: This would show a note-adding modal.`);
    }
  };

  // Auto-assign cars handlers
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);
  const [selectedAbsentWasher, setSelectedAbsentWasher] = useState<{ id: string; name: string } | null>(null);

  const handleAutoAssignCars = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (washer) {
      setSelectedAbsentWasher({ id: washer.id, name: washer.name });
      setAutoAssignModalOpen(true);
    }
  };

  const handleConfirmCarAssignment = (assignments: any[]) => {

    if (typeof window !== 'undefined') {
      const summary = assignments
        .reduce((acc, a) => {
          if (!acc[a.assignedToName]) {
            acc[a.assignedToName] = [];
          }
          acc[a.assignedToName].push(a.carName);
          return acc;
        }, {} as Record<string, string[]>);

      const summaryText = Object.entries(summary)
        .map(([name, cars]) => `${name}: ${cars.join(", ")}`)
        .join("\n");

      toast.success(`✅ Car Auto-Assignment Completed\n\nAbsent Washer: ${selectedAbsentWasher?.name}\nTotal Cars Reassigned: ${assignments.length}\n\nNew Assignments:\n${summaryText}\n\nIn production: This would update the database and notify assigned washers.`);
    }
  };

  // Mock car data for absent washer
  const getAssignedCars = (washerId: string) => {
    return [
      { carId: "CAR-001", carName: "Honda City MH12AB1234", location: "Athwalines, Surat" },
      { carId: "CAR-002", carName: "Maruti Swift GJ05CD5678", location: "Piplod, Surat" },
      { carId: "CAR-003", carName: "Hyundai i20 GJ05EF9012", location: "Adajan, Surat" },
      { carId: "CAR-004", carName: "Toyota Innova GJ05GH3456", location: "Vesu, Surat" },
    ];
  };

  // Mock available washers with capacity
  const getAvailableWashers = () => {
    return team
      .filter(w => w.status === "CHECKED_IN" || w.status === "LATE")
      .map(w => ({
        id: w.id,
        name: w.name,
        currentCars: Math.floor(Math.random() * 3), // Simulated current cars
        maxCapacity: 5, // Max 5 cars per washer
        distanceKm: Math.random() * 10,
      }));
  };

  // Cover redistribution handlers
  const [coverPlan, setCoverPlan] = useState<any>(null);

  // Initialize cover plan after team data is loaded
  // SCENARIO INTEGRATION: Use scenario data when scenario === "cover"
  useEffect(() => {
    // Check if "cover" scenario is active and has cover plan data
    if (scenario === "cover" && scenarioData.coverPlan) {
      const { coverPlan: scenarioCoverPlan } = scenarioData;

      // Build cover plan from scenario data
      const plan = coverRedistributionService.generateCoverPlan(
        scenarioCoverPlan.absentWasherId,
        scenarioCoverPlan.absentWasherName,
        mockWasherDataService.getTodayJobs(scenarioCoverPlan.absentWasherId, scenarioCoverPlan.requiredUnits),
        scenarioCoverPlan.coverAssignments.map((assignment) => ({
          id: assignment.washerId,
          name: assignment.washerName,
          baseUnits: 15, // Default base units for scenario
          area: "Surat",
        }))
      );
      setCoverPlan(plan);
      return;
    }

    // Default behavior: auto-generate from team data
    if (team && team.length > 0 && !coverPlan && scenario !== "cover") {
      const absentWasher = team.find(w => w.status === "LEAVE") || team[0];
      if (absentWasher) {
        const jobsToRedistribute = mockWasherDataService.getTodayJobs(absentWasher.id, 25);
        const availableWashers = team
          .filter(w => w.status === "CHECKED_IN" && w.id !== absentWasher.id)
          .slice(0, 12)
          .map(w => ({ id: w.id, name: w.name, baseUnits: w.unitsCompleted, area: "Surat" }));

        const plan = coverRedistributionService.generateCoverPlan(
          absentWasher.id,
          absentWasher.name,
          jobsToRedistribute,
          availableWashers
        );
        setCoverPlan(plan);
      }
    }
  }, [team, scenario, scenarioData]);

  const handleAdjustCover = (washerId: string, newUnits: number) => {
    if (!coverPlan) return;
    const result = coverRedistributionService.adjustCoverAssignment(coverPlan, washerId, newUnits);
    if (result.success) {
      setCoverPlan({ ...coverPlan });
    } else {
      console.error("Adjustment failed:", result.error);
    }
  };

  const handleConfirmAndNotify = () => {
    if (!coverPlan) return;
    coverRedistributionService.confirmAndNotify(coverPlan);
    setCoverPlan({ ...coverPlan, status: "NOTIFIED" });
  };

  const handleCoverReassign = (fromWasherId: string, toWasherId: string, units: number) => {

    if (!coverPlan) return;

    // Update cover plan with reassignment
    const updatedCoverWashers = coverPlan.coverWashers.map((w) => {
      if (w.id === fromWasherId) {
        const newCoverAssigned = Math.max(0, w.coverAssigned - units);
        return { ...w, coverAssigned: newCoverAssigned, totalUnits: w.baseUnits + newCoverAssigned };
      }
      if (w.id === toWasherId) {
        const newCoverAssigned = w.coverAssigned + units;
        return { ...w, coverAssigned: newCoverAssigned, totalUnits: w.baseUnits + newCoverAssigned };
      }
      return w;
    });

    const fromWasher = coverPlan.coverWashers.find(w => w.id === fromWasherId);
    const toWasher = coverPlan.coverWashers.find(w => w.id === toWasherId);

    setCoverPlan({
      ...coverPlan,
      coverWashers: updatedCoverWashers,
    });

    // Visual feedback
    if (typeof window !== 'undefined' && fromWasher && toWasher) {
      toast.success(`✅ Cover Reassignment Successful\n\nReassigned ${units.toFixed(1)} units\nFrom: ${fromWasher.name}\nTo: ${toWasher.name}\n\nIn production: Notifications would be sent to both washers.`);
    }
  };

  const handleCoverEscalate = (reason?: string) => {
    if (!coverPlan) {
      logger.warn("No cover plan available");
      return;
    }

    const escalationReason = reason || "Insufficient capacity";
    coverRedistributionService.escalateToOpsManager(coverPlan, escalationReason);

    // Visual feedback for user
    if (typeof window !== 'undefined') {
      const message = reason === "COVER_OVERRIDE"
        ? `Operations Manager Notified\n\nType: Cover Override\nAbsent Washer: ${coverPlan.absentWasher.name}\nOverride Applied: Units exceeded recommended maximum\n\nOps Manager will acknowledge this override.`
        : `Escalation to Operations Manager initiated\n\nReason: ${escalationReason}\nAbsent Washer: ${coverPlan.absentWasher.name}\nUnassigned Units: ${coverPlan.unassignedUnits.toFixed(1)}\n\nIn production: This would notify the Operations Manager and create an escalation ticket.`;

      toast.info(message);
    }
  };

  const handleContactCustomers = () => {
    if (!coverPlan) {
      logger.warn("No cover plan available");
      return;
    }

    coverRedistributionService.contactCustomers(coverPlan.absentWasher.jobs);

    // Visual feedback for user
    if (typeof window !== 'undefined') {
      toast.success(`Adjusting allocation for cover capacity shortage\n\nAbsent Washer: ${coverPlan.absentWasher.name}\nAffected Jobs: ${coverPlan.absentWasher.jobs.length}\nUnassigned Units: ${coverPlan.unassignedUnits.toFixed(1)}\n\nIn production: This would open a modal to manually adjust job allocations across available washers.`);
    }
  };

  // Field audit handlers
  const [auditWashers, setAuditWashers] = useState(() => 
    fieldAuditService.getAuditWashers("SUP-001")
  );
  const [auditSummary, setAuditSummary] = useState(() => 
    fieldAuditService.getAuditSummary("SUP-001")
  );
  const [auditFlow, setAuditFlow] = useState<{
    active: boolean;
    washerId: string;
    washerName: string;
    checklist: any[];
    photos: number;
    gpsValid: boolean;
    gpsDistance: number;
  } | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);

  const handleStartAudit = (washerId: string) => {
    const washer = auditWashers.find(w => w.id === washerId);
    if (!washer) return;

    const checklist = fieldAuditService.getAuditChecklist("SHAMPOO_WASH");
    
    // Simulate GPS validation
    const gpsValidation = fieldAuditService.validateGPS(
      { lat: 21.1702, lng: 72.8311 },
      washer.currentLocation || { lat: 21.1702, lng: 72.8311 }
    );

    setAuditFlow({
      active: true,
      washerId: washer.id,
      washerName: washer.name,
      checklist,
      photos: 0,
      gpsValid: gpsValidation.isValid,
      gpsDistance: gpsValidation.distanceMeters,
    });
    navigate(SCREEN_TO_PATH["audit-flow"] ?? "/supervisor-app");
  };

  const handleToggleChecklistItem = (itemId: string) => {
    if (!auditFlow) return;
    const updatedChecklist = auditFlow.checklist.map(item =>
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    setAuditFlow({ ...auditFlow, checklist: updatedChecklist });
  };

  const handleTakePhoto = () => {
    if (!auditFlow) return;
    setAuditFlow({ ...auditFlow, photos: auditFlow.photos + 1 });
  };

  const handleReportPreDamage = () => {
    // In production: show pre-damage form
  };

  const handleSubmitAudit = () => {
    if (!auditFlow) return;

    const score = fieldAuditService.calculateScore(auditFlow.checklist);
    const result = fieldAuditService.getAuditResult(score);
    const action = fieldAuditService.getResultAction(result, false);

    setAuditResult({
      washerName: auditFlow.washerName,
      score,
      ...action,
    });
    navigate(SCREEN_TO_PATH["audit-result"] ?? "/supervisor-app");
  };

  const handleCloseAuditResult = () => {
    setAuditFlow(null);
    setAuditResult(null);
    navigate(SCREEN_TO_PATH["audit"] ?? "/supervisor-app");
    // Refresh audit list
    setAuditWashers(fieldAuditService.getAuditWashers("SUP-001"));
    setAuditSummary(fieldAuditService.getAuditSummary("SUP-001"));
  };

  // Incentive tracker
  const [incentiveDashboard] = useState(() =>
    supervisorIncentiveService.getIncentiveDashboard("SUP-001")
  );

  // BTL Lead handlers
  const [leadMetrics] = useState(() => {
    const metrics = btlLeadService.getSupervisorMetrics("SUP-001");
    return metrics;
  });
  const [selectedPipeline, setSelectedPipeline] = useState<{ lead: any; pipeline: any[] } | null>(null);
  const [btlLeads, setBtlLeads] = useState(() => {
    const leads = btlLeadService.getSupervisorLeadsWithTracking("SUP-001");
    return leads;
  });

  const handleSubmitLeadWithParams = (
    name: string,
    mobile: string,
    vehicleType: any,
    location: { lat: number; lng: number; address: string },
    interestLevel: any,
    gpsLocation: { lat: number; lng: number }
  ) => {
    const leadData = btlLeadService.submitLead(
      name,
      mobile,
      vehicleType,
      location,
      interestLevel,
      gpsLocation,
      "SUP-001",
      "Supervisor 1"
    );
    // Refresh leads list
    setBtlLeads(btlLeadService.getSupervisorLeadsWithTracking("SUP-001"));
  };

  const handleViewPipeline = (leadId: string) => {
    const lead = btlLeads.find((l: any) => l.id === leadId);
    if (lead) {
      const pipeline = btlLeadService.getLeadPipeline(leadId);
      setSelectedPipeline({ lead, pipeline });
    }
  };

  const handleClosePipeline = () => {
    setSelectedPipeline(null);
  };

  // Lead notifications
  const [leadNotifications, setLeadNotifications] = useState(() =>
    leadNotificationService.getNotifications("SUP-001")
  );
  const [unreadLeadNotificationsCount, setUnreadLeadNotificationsCount] = useState(() =>
    leadNotificationService.getUnreadCount("SUP-001")
  );
  const [showNotifications, setShowNotifications] = useState(false);

  // Subscribe to real-time lead notifications
  useEffect(() => {
    const unsubscribe = leadNotificationService.subscribe("SUP-001", (notification) => {
      setLeadNotifications(leadNotificationService.getNotifications("SUP-001"));
      setUnreadLeadNotificationsCount(leadNotificationService.getUnreadCount("SUP-001"));
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = (notificationId: string) => {
    leadNotificationService.markAsRead(notificationId);
    setLeadNotifications(leadNotificationService.getNotifications("SUP-001"));
    setUnreadLeadNotificationsCount(leadNotificationService.getUnreadCount("SUP-001"));
  };

  const handleMarkAllNotificationsRead = () => {
    leadNotificationService.markAllAsRead("SUP-001");
    setLeadNotifications(leadNotificationService.getNotifications("SUP-001"));
    setUnreadLeadNotificationsCount(0);
  };

  // Escalation handlers
  const [escalationIssues] = useState(() => escalationService.getIssues("SUP-001"));
  const [escalationSummary] = useState(() =>
    escalationService.getEscalationSummary("SUP-001")
  );

  const handleManualAttendanceOverride = () => {
    const washerId = prompt("Enter Washer ID:");
    const reason = prompt("Enter reason:");
    const selfieUrl = "SELFIE_PLACEHOLDER.jpg";
    if (washerId && reason) {
      escalationService.requestAttendanceOverride(washerId, reason, selfieUrl, "SUP-001");
    }
  };

  const handleForceEarlyCheckout = (washerId: string) => {
    if (confirm(`Force early checkout for ${washerId}?`)) {
      escalationService.forceEarlyCheckOut(washerId, "SUP-001");
    }
  };

  const handleReassignCoverFromEscalation = () => {
    escalationService.navigateToCoverReassignment();
    navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app");
  };

  const handlePauseWasherSchedule = (washerId: string) => {
    const reason = prompt("Enter reason for pausing schedule:");
    if (reason) {
      escalationService.pauseWasherSchedule(washerId, reason, "SUP-001");
    }
  };

  const handleVehicleDamageEscalation = () => {
    const washerId = prompt("Enter Washer ID:");
    const vehicleDetails = prompt("Enter vehicle details:");
    const notes = prompt("Enter notes:");
    if (washerId && vehicleDetails && notes) {
      escalationService.escalateVehicleDamage(
        washerId,
        vehicleDetails,
        "PHOTO_PLACEHOLDER.jpg",
        notes,
        "SUP-001"
      );
    }
  };

  const handleSOSAlert = () => {
    if (confirm("🔴 TRIGGER SOS SAFETY ALERT? This will notify all managers.")) {
      escalationService.triggerSOSAlert("SUP-001", { lat: 21.1702, lng: 72.8311 }, "Emergency");
    }
  };

  const handleIncentiveOverrideRequest = () => {
    const caseType = prompt("Enter case type:");
    const reason = prompt("Enter reason:");
    if (caseType && reason) {
      escalationService.requestIncentiveOverride(caseType, reason, "SUP-001");
    }
  };

  const handleReassignCarAction = () => {
    const carId = prompt("Enter Car ID:");
    const fromWasherId = prompt("From Washer ID:");
    const toWasherId = prompt("To Washer ID:");
    const reason = prompt("Enter reason:");
    if (carId && fromWasherId && toWasherId && reason) {
      escalationService.reassignCar(carId, fromWasherId, toWasherId, reason, "SUP-001");
    }
  };

  const handleBatchInvalidationAction = () => {
    const washerId = prompt("Enter Washer ID:");
    const batchId = prompt("Enter Batch ID (A/B/C/D):");
    const reason = prompt("Enter reason:");
    if (washerId && batchId && reason) {
      escalationService.invalidateBatch(washerId, batchId, reason, "SUP-001");
    }
  };

  const handleEscalateToOpsManager = (issueId: string) => {
    const reason = prompt("Enter escalation reason:");
    if (reason) {
      escalationService.escalateToOpsManager(issueId, reason, "SUP-001");
    }
  };

  const handleMarkIssueInProgress = (issueId: string) => {
    escalationService.markInProgress(issueId, "SUP-001");
  };

  const handleResolveEscalationIssue = (issueId: string) => {
    const resolution = prompt("Enter resolution notes:");
    if (resolution) {
      escalationService.resolveIssue(issueId, resolution, "SUP-001");
    }
  };

  // Alert system handlers
  const [systemAlerts] = useState(() => alertService.getAlerts("SUP-001"));
  const [alertSummary] = useState(() => alertService.getAlertSummary("SUP-001"));

  const handleReassignFromAlert = () => {
    navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app");
  };

  const handleViewDetailsFromAlert = () => {
  };

  const handleEscalateAlert = (alertId: string) => {
    const reason = prompt("Enter escalation reason:");
    if (reason) {
      alertService.escalateAlert(alertId, "SUP-001", reason);
    }
  };

  const handleMarkPresentFromAlert = (washerId: string) => {
    alertService.markAlertActioned(`ALERT-${washerId}`, "SUP-001");
  };

  const handleMarkAbsentFromAlert = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      const confirmed = confirm(`Mark ${washer.name} as ABSENT?\n\nThis will:\n- Change status to ABSENT\n- Trigger cover redistribution\n- Notify Operations Manager\n\nContinue?`);

      if (confirmed) {
        alertService.markAlertActioned(`ALERT-${washerId}`, "SUP-001");
        toast.success(`✅ ${washer.name} marked as ABSENT\n\nCover redistribution initiated.\nOps Manager notified.\n\nIn production: This would update the database and trigger notifications.`);
      }
    }
  };

  const handleResolveAlert = (alertId: string) => {
    const notes = prompt("Enter resolution notes (optional):");
    alertService.resolveAlert(alertId, "SUP-001", notes || undefined);
  };

  // Hierarchy visibility handlers
  const [performanceData] = useState(() =>
    hierarchyVisibilityService.getSupervisorPerformance("SUP-001")
  );
  const [dataVisibilityMap] = useState(() =>
    hierarchyVisibilityService.getDataVisibilityMap()
  );
  const [hierarchyViews] = useState(() => hierarchyVisibilityService.getHierarchyViews());
  const [kpiComparison] = useState(() =>
    hierarchyVisibilityService.getKPIComparison("SUP-001")
  );
  const [escalationVisibility] = useState(() =>
    hierarchyVisibilityService.getEscalationVisibility("SUP-001")
  );

  // Audit trail handlers
  const [auditTrailData] = useState(() => auditTrailService.getAuditTrail("SUP-001"));
  const [auditTrailSummary] = useState(() => auditTrailService.getAuditTrailSummary("SUP-001"));

  // Daily flow handlers
  const [dailyFlowData] = useState(() => dailyFlowService.getDailyFlow("SUP-001"));
  const [dailyFlowSummary] = useState(() => dailyFlowService.getDailyFlowSummary("SUP-001"));

  // KPI dashboard handlers
  const [kpiDashboardData] = useState(() => kpiDashboardService.getKPIDashboard("SUP-001"));

  // Cloth management handlers
  const clothInventory = clothManagementService.getInventorySummary(clothBatches, 15);

  const handleDispatchToHO = (clothCount: number, transportMode: string, courierDetails?: string) => {
    clothManagementService.dispatchToHO(clothCount, transportMode, "SUP-001", courierDetails);
  };

  const handleReportLossDamage = (washerId: string, clothCount: number, reason: string, photoUrl?: string) => {
    clothManagementService.reportLossDamage(washerId, clothCount, reason, photoUrl, "SUP-001");
  };

  const handleRequestStock = (batchesNeeded: number, urgency: "NORMAL" | "URGENT") => {
    clothManagementService.requestStock(batchesNeeded, urgency, "SUP-001");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Offline indicator for field supervisors */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 px-3 font-medium">
          ⚠ You are offline — changes will sync when connection is restored
        </div>
      )}
        <p className="text-gray-600">Loading supervisor data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* DEV ONLY: Debug display showing logged-in user */}
      {import.meta.env.DEV && currentUser.employeeId && (
        <div className="fixed top-0 right-0 z-50 m-2 px-3 py-1 bg-purple-600 text-white text-xs rounded-full shadow-lg">
          👤 {currentUser.name} ({currentUser.employeeId})
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Supervisor App</h1>
              <p className="text-xs text-gray-600">
                Shift {currentShift} • {team.length} washers
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button size="sm" variant="outline" onClick={refreshData}>
                Refresh
              </Button>

              {/* Lead Notifications Bell */}
              <button
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-5 w-5 text-indigo-600" />
                {unreadLeadNotificationsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-indigo-600 text-white border-0 text-xs"
                  >
                    {unreadLeadNotificationsCount}
                  </Badge>
                )}
              </button>

              {/* System Alerts Bell */}
              <div className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                {unreadAlertsCount > 0 && (
                  <Badge
                    variant="outline"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-600 text-white border-0 text-xs"
                  >
                    {unreadAlertsCount}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Notifications Panel */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <Card className="w-full max-w-md mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Lead Notifications</h3>
                  <p className="text-xs text-gray-600">
                    {unreadLeadNotificationsCount} unread
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {unreadLeadNotificationsCount > 0 && (
                    <Button size="sm" variant="outline" onClick={handleMarkAllNotificationsRead}>
                      Mark All Read
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowNotifications(false)}>
                    Close
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              {leadNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {leadNotifications.map((notification) => {
                    const priorityColors = {
                      LOW: "bg-gray-100 border-gray-300",
                      MEDIUM: "bg-blue-100 border-blue-300",
                      HIGH: "bg-amber-100 border-amber-300",
                      URGENT: "bg-red-100 border-red-300",
                    };

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 ${
                          notification.isRead ? "bg-white" : "bg-indigo-50"
                        } hover:bg-gray-50 cursor-pointer`}
                        onClick={() => handleNotificationClick(notification.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold text-sm">{notification.title}</p>
                              {!notification.isRead && (
                                <div className="h-2 w-2 rounded-full bg-indigo-600" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{notification.message}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${priorityColors[notification.priority]}`}
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{notification.leadName}</span>
                          <span>{new Date(notification.timestamp).toLocaleString()}</span>
                        </div>
                        {notification.actionUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2 h-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification.id);
                              setShowNotifications(false);
                              navigate(SCREEN_TO_PATH["leads"] ?? "/supervisor-app");
                            }}
                          >
                            {notification.actionLabel || "View Details"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <Tabs value={currentScreen} onValueChange={handleTabChange} className="w-full">
          <div className="sticky top-[65px] z-40 bg-white border-b pointer-events-auto">
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 pointer-events-auto">
              <TabsTrigger value="dashboard" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Team
              </TabsTrigger>
              <TabsTrigger value="audit" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Audit
              </TabsTrigger>
              <TabsTrigger value="cloth" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Cloth
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Alerts
              </TabsTrigger>
            </TabsList>
            <TabsList className="flex flex-wrap h-auto gap-1 p-1 border-t pointer-events-auto">
              <TabsTrigger value="schedule" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Schedule
              </TabsTrigger>
              <TabsTrigger value="leads" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Leads
              </TabsTrigger>
              <TabsTrigger value="incentive" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Incentive
              </TabsTrigger>
              <TabsTrigger value="issues" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Issues
              </TabsTrigger>
              <TabsTrigger value="visibility" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Visibility
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Screen 1: Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <SupervisorDashboard
              todayDate={new Date()}
              dayNumber={15}
              totalDays={26}
              summary={summary}
              alerts={alerts}
              currentShift={currentShift}
              shiftFocusAreas={shiftFocusAreas}
              onAlertClick={handleAlertClick}
              onNavigate={handleNavigate}
            />
          </TabsContent>

          {/* Screen 2: Team Attendance */}
          <TabsContent value="team" className="mt-0">
            <TeamAttendanceMonitorV2
              team={team}
              currentTime={new Date()}
              onCallWasher={handleCallWasher}
              onMarkAttendance={handleMarkAttendance}
              onTriggerCover={handleTriggerCover}
              onVerifyGPS={handleVerifyGPS}
              onViewWasher={handleViewWasherDetails}
              onViewSelfie={handleViewSelfie}
              onRequestOverride={handleRequestOverride}
              onSubmitIncident={handleSubmitIncident}
              onAddNote={handleAddNote}
              onAutoAssignCars={handleAutoAssignCars}
            />
          </TabsContent>

          {/* Screen 3: Field Audit */}
          <TabsContent value="audit" className="mt-0">
            <FieldAuditScreen
              washers={auditWashers}
              todayTarget={auditSummary.todayTarget}
              completed={auditSummary.completed}
              onStartAudit={handleStartAudit}
            />
          </TabsContent>

          {/* Audit Flow Screen (Modal-like) */}
          <TabsContent value="audit-flow" className="mt-0">
            {auditFlow && (
              <AuditFlowScreen
                washerId={auditFlow.washerId}
                washerName={auditFlow.washerName}
                packageType="SHAMPOO_WASH"
                checklist={auditFlow.checklist}
                gpsValid={auditFlow.gpsValid}
                gpsDistance={auditFlow.gpsDistance}
                photosTaken={auditFlow.photos}
                onToggleChecklistItem={handleToggleChecklistItem}
                onTakePhoto={handleTakePhoto}
                onReportPreDamage={handleReportPreDamage}
                onSubmit={handleSubmitAudit}
                onCancel={() => navigate(SCREEN_TO_PATH["audit"] ?? "/supervisor-app")}
              />
            )}
          </TabsContent>

          {/* Audit Result Screen */}
          <TabsContent value="audit-result" className="mt-0">
            {auditResult && (
              <AuditResultScreen
                {...auditResult}
                onClose={handleCloseAuditResult}
                onSubmitFeedback={(feedback) => {
                  handleCloseAuditResult();
                }}
              />
            )}
          </TabsContent>

          {/* Screen 4: Material Management (Unified System) */}
          <TabsContent value="cloth" className="mt-0">
            <SupervisorMaterialManagement />
          </TabsContent>

          {/* Screen 5: Team Schedule */}
          <TabsContent value="schedule" className="mt-0 p-4">
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-bold mb-2">Team Schedule & Cars</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {schedule.length} washers • {summary.totalUnitsCompleted} units completed
                </p>
                <p className="text-xs text-gray-500">
                  Full schedule view with job reassignment and cover management
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Screen 6: BTL Leads */}
          <TabsContent value="leads" className="mt-0">
            <BTLLeadScreenSimple
              leads={btlLeads}
              metrics={leadMetrics}
              onSubmitLead={handleSubmitLeadWithParams}
              onViewPipeline={handleViewPipeline}
            />
          </TabsContent>

          {/* Screen 7: Incentive */}
          <TabsContent value="incentive" className="mt-0">
            <IncentiveTrackerScreen dashboard={incentiveDashboard} />
          </TabsContent>

          {/* Screen 8: Issues */}
          <TabsContent value="issues" className="mt-0">
            <EscalationScreenSimple
              issues={escalationIssues}
              summary={escalationSummary}
            />
          </TabsContent>

          {/* MODULE 7: Alert Center */}
          <TabsContent value="alerts" className="mt-0">
            <AlertCenterScreen
              alerts={systemAlerts}
              summary={alertSummary}
              onCallWasher={handleCallWasher}
              onReassign={handleReassignFromAlert}
              onVerifyGPS={handleVerifyGPS}
              onStartAudit={handleStartAudit}
              onEscalate={handleEscalateAlert}
              onMarkPresent={handleMarkPresentFromAlert}
              onMarkAbsent={handleMarkAbsentFromAlert}
              onViewDetails={handleViewDetailsFromAlert}
              onResolve={handleResolveAlert}
              onAutoAssignCars={handleAutoAssignCars}
            />
          </TabsContent>

          {/* MODULE 8: Hierarchy Visibility */}
          <TabsContent value="visibility" className="mt-0">
            <HierarchyVisibilityScreen
              performanceData={performanceData}
              dataVisibilityMap={dataVisibilityMap}
              hierarchyViews={hierarchyViews}
              kpiComparison={kpiComparison}
              escalationVisibility={escalationVisibility}
            />
          </TabsContent>

          {/* Cover Distribution (Bonus Tab) */}
          <TabsContent value="cover" className="mt-0">
            <CoverDistributionScreen
              plan={coverPlan}
              currentTime={new Date()}
              onAdjustCover={handleAdjustCover}
              onConfirmAndNotify={handleConfirmAndNotify}
              onReassign={handleCoverReassign}
              onEscalate={handleCoverEscalate}
              onContactCustomers={handleContactCustomers}
            />
          </TabsContent>

          {/* Audit Trail (Bonus Tab) */}
          <TabsContent value="audit-trail" className="mt-0">
            <AuditTrailScreen logs={auditTrailData} summary={auditTrailSummary} />
          </TabsContent>

          {/* Daily Flow (Bonus Tab) */}
          <TabsContent value="daily-flow" className="mt-0">
            <DailyFlowScreen stages={dailyFlowData} summary={dailyFlowSummary} />
          </TabsContent>

          {/* KPI Dashboard (Bonus Tab) */}
          <TabsContent value="kpi-dashboard" className="mt-0">
            <KPIDashboardScreen dashboard={kpiDashboardData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Auto-Assign Cars Modal */}
      {selectedAbsentWasher && (
        <AutoAssignCarsModal
          isOpen={autoAssignModalOpen}
          onClose={() => {
            setAutoAssignModalOpen(false);
            setSelectedAbsentWasher(null);
          }}
          absentWasherId={selectedAbsentWasher.id}
          absentWasherName={selectedAbsentWasher.name}
          assignedCars={getAssignedCars(selectedAbsentWasher.id)}
          availableWashers={getAvailableWashers()}
          onConfirmAssignment={handleConfirmCarAssignment}
        />
      )}
    </div>
  );
}