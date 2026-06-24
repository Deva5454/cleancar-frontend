import React from "react";
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
import { DataService } from "../../services/DataService";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { TeamAttendanceMonitorV2 } from "./TeamAttendanceMonitorV2";
import { CoverDistributionScreen } from "./CoverDistributionScreen";
import { AutoAssignCarsModal } from "./AutoAssignCarsModal";
import { FieldAuditScreen, AuditResultScreen } from "./FieldAuditScreen";
import { AuditFlowScreen } from "./AuditFlowScreen";
import { CashDepositScreen } from "./CashDepositScreen";
import { SupervisorMaterialManagement } from "./SupervisorMaterialManagement";
import { BTLLeadScreen, LeadPipelineView } from "./BTLLeadScreen";
import { IncentiveTrackerScreen } from "./IncentiveTrackerScreen";
import { EscalationScreen } from "./EscalationScreen"; // full version
import { AlertCenterScreen, StickyAlertBanner } from "./AlertCenterScreen";
import { HierarchyVisibilityScreen } from "./HierarchyVisibilityScreen";
import { AuditTrailScreen } from "./AuditTrailScreen";
import { DailyFlowScreen } from "./DailyFlowScreen";
import { SupervisorPeriodicScheduleScreen } from "./SupervisorPeriodicScheduleScreen";
import { KPIDashboardScreen } from "./KPIDashboardScreen";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Bell } from "lucide-react";
import { coverRedistributionService } from "../../services/coverRedistributionService";
import { fieldAuditService } from "../../services/fieldAuditService";
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

  // ── Exit Verification State ──────────────────────────────────────────────
  const _safeName = (v: any): string => {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object") return v?.name ?? v?.fullName ?? "";
    return String(v);
  };
  const _loadExits = () => {
    try {
      const stored = DataService.get<any>("EXIT_SETTLEMENTS");
      const raw = stored.length > 0 ? stored : (() => {
        const r = localStorage.getItem("cleancar_CITY-SURAT_exit_settlements");
        return r ? JSON.parse(r) : [];
      })();
      return raw.map((r: any) => ({
        ...r,
        supervisorVerifiedBy: _safeName(r.supervisorVerifiedBy),
        hrVerifiedBy: _safeName(r.hrVerifiedBy),
        materials: Array.isArray(r.materials) ? r.materials.map((m: any) => ({
          ...m, verifiedBy: _safeName(m.verifiedBy),
        })) : [],
      }));
    } catch { return []; }
  };
  const [exitRecords, setExitRecords] = useState<any[]>(_loadExits);
  const pendingExits = exitRecords.filter(
    e => (e.status === "Supervisor Verification Pending" || e.status === "Exit Initiated")
      && (e.verifierRole === "Supervisor" || !e.verifierRole) // only show exits this supervisor should verify
  );
  const _persistExits = (records: any[]) => {
    try { DataService.setAll("EXIT_SETTLEMENTS", records); } catch {}
    try {
      localStorage.setItem("cleancar_CITY-SURAT_exit_settlements", JSON.stringify(records));
      localStorage.setItem("cleancar_exit_settlements", JSON.stringify(records));
    } catch {}
  };
  const handleExitMaterialMark = (exitId: string, matId: string, condition: string) => {
    const comments = condition !== "Good" ? window.prompt(`Comments for "${condition}":`) ?? "" : "";
    const updated = exitRecords.map(e =>
      e.id !== exitId ? e : {
        ...e,
        materials: e.materials.map((m: any) =>
          m.id !== matId ? m : {
            ...m, condition, comments,
            verifiedBy: currentUser?.name ?? "Supervisor",
            verifiedOn: new Date().toISOString().split("T")[0],
          }
        ),
      }
    );
    setExitRecords(updated);
    _persistExits(updated);
    toast.success(`Marked as: ${condition}`);
  };
  const handleExitVerificationComplete = (exitId: string) => {
    const exit = exitRecords.find(e => e.id === exitId);
    if (!exit) return;
    const pending = exit.materials.filter((m: any) => m.condition === "Pending");
    if (pending.length > 0) {
      toast.error(`Verify all ${pending.length} pending items first.`);
      return;
    }
    const updated = exitRecords.map(e =>
      e.id !== exitId ? e : {
        ...e,
        status: "Supervisor Verified",
        supervisorVerifiedBy: currentUser?.name ?? "Supervisor",
        supervisorVerifiedOn: new Date().toISOString().split("T")[0],
      }
    );
    setExitRecords(updated);
    _persistExits(updated);
    toast.success(`✅ Verification complete for ${exit.employeeName}. HR notified.`);
  };
  // ── End Exit Verification ────────────────────────────────────────────────
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
    jobs,
    assignJobToWasher,
  } = useSupervisor() as any;

  // URL is source of truth - derived via useMemo, not useState
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
    "/supervisor-app/schedule":     "schedule",
    "/supervisor-app/exit":         "exit",
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
    "daily-flow":   "/supervisor-app/daily-flow",
    "audit-flow":   "/supervisor-app/audit",
    "audit-result": "/supervisor-app/audit",
    "kpi-dashboard":"/supervisor-app/kpi-dashboard",
    "schedule":     "/supervisor-app/schedule",
    "exit":         "/supervisor-app/exit",
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
    } else {
      navigate(SCREEN_TO_PATH["alerts"] ?? "/supervisor-app/alerts");
    }
  };

  const handleNavigate = (screen: string) => {
    navigate(SCREEN_TO_PATH[screen] ?? "/supervisor-app");
  };

  const handleTabChange = (value: string) => {
    // URL is source of truth - just navigate, useMemo derives currentScreen
    navigate(SCREEN_TO_PATH[value] ?? "/supervisor-app", { replace: true });
  };

  const handleViewWasherDetails = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    // Navigate to Team tab - washer cards are visible there
    navigate(SCREEN_TO_PATH["team"] ?? "/supervisor-app/team");
    if (washer) toast.info(`Viewing ${washer.name} on Team tab`);
  };

  const handleManualOverride = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    if (typeof window !== 'undefined' && washer) {
      toast.info(`Manual attendance override for ${washer.name}\n\nIn production: This would show a manual override modal.`);
    }
  };

  const handleTriggerCover = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    if (washer) {
      toast.info(`Opening cover plan for ${washer.name}`);
      handleReassignFromAlert(washerId);
    }
  };

  // V2 handlers with visual feedback
  const handleCallWasher = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);

    // Show toast notification for user feedback
    if (typeof window !== 'undefined' && washer) {
      toast.info(`Calling ${washer.name} at ${washer.phone || "N/A"}...`);
    }

    if (washer?.phone) {
      window.location.href = `tel:${washer.phone}`;
    }
  };

  const handleMarkAttendance = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    openEscalationModal("mark_attendance", `Mark Attendance - ${washer?.name || washerId}`, [
      { key: "status", label: "Attendance status", type: "select", options: ["Present", "Late", "Absent", "Half Day"] },
      { key: "reason", label: "Reason / notes (optional)" },
    ], (data) => {
      if (data.status) {
        try {
          const records = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_attendance_records") || "[]");
          const today = new Date().toISOString().split("T")[0];
          const filtered = records.filter((r: any) => !(r.employeeId === washerId && r.date === today));
          filtered.push({
            attendanceId: `ATT-${washerId}-${today}-MANUAL`,
            employeeId: washerId,
            cityId: "CITY-SURAT",
            date: today,
            status: data.status,
            checkInTime: new Date().toTimeString().slice(0, 8),
            lateMinutes: data.status === "Late" ? 15 : 0,
            manualOverride: true,
            overrideBy: currentUser?.employeeId || "EDB-SUP-SUR1",
            overrideReason: data.reason || "",
          });
          localStorage.setItem("cleancar_CITY-SURAT_attendance_records", JSON.stringify(filtered));
          refreshData();
        } catch (_) {}
        toast.success(`${washer?.name || washerId} marked as ${data.status}${data.reason ? " - " + data.reason : ""}`);
      }
      setEscalationModal(null);
    });
  };

  const handleVerifyGPS = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    if (!washer) return;
    if (washer.gpsLocation) {
      const { lat, lng } = washer.gpsLocation;
      const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
      window.open(mapsUrl, "_blank");
      toast.success(`Opening GPS location for ${washer.name}`);
    } else {
      toast.error(`No GPS location available for ${washer.name}`);
    }
  };

  const handleViewSelfie = (washerId: string, selfieUrl: string) => {
    if (selfieUrl) {
      window.open(selfieUrl, "_blank");
    } else {
      toast.error("No selfie available for this washer");
    }
  };

  const handleRequestOverride = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    openEscalationModal("request_override", `Attendance Override - ${washer?.name || washerId}`, [
      { key: "overrideType", label: "Override type", type: "select", options: ["Mark Present", "Mark Late", "Excuse Absence", "Adjust Check-in Time"] },
      { key: "reason", label: "Reason for override (required for manager approval)" },
    ], (data) => {
      if (data.overrideType && data.reason) {
        escalationService.requestAttendanceOverride(washerId, data.reason, "", currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`Override request submitted for ${washer?.name || washerId} - ${data.overrideType}. Pending manager approval.`);
      }
      setEscalationModal(null);
    });
  };

  const handleSubmitIncident = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    openEscalationModal("incident", `Incident Report - ${washer?.name || washerId}`, [
      { key: "type", label: "Incident type", type: "select", options: ["Equipment damage", "Customer complaint", "Safety issue", "Quality issue", "Other"] },
      { key: "description", label: "Description of incident" },
    ], (data) => {
      if (data.type && data.description) {
        escalationService.escalateVehicleDamage(washerId, data.type, "", data.description, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.warning(`Incident report submitted for ${washer?.name || washerId}`);
      }
      setEscalationModal(null);
    });
  };

  const handleAddNote = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    openEscalationModal("add_note", `Add Note - ${washer?.name || washerId}`, [
      { key: "category", label: "Category", type: "select", options: ["Performance", "Attendance", "Behaviour", "Quality", "General"] },
      { key: "note", label: "Note" },
    ], (data) => {
      if (data.note) {
        toast.success(`Note saved for ${washer?.name || washerId}: ${data.note}`);
      }
      setEscalationModal(null);
    });
  };

  // -- Escalation modal state (replaces prompt/confirm) ----------------------
  const [escalationModal, setEscalationModal] = useState<{
    type: string;
    title: string;
    fields: { key: string; label: string; type?: string; options?: string[] }[];
    data: Record<string, string>;
    onSubmit: (data: Record<string, string>) => void;
  } | null>(null);

  const openEscalationModal = (
    type: string,
    title: string,
    fields: { key: string; label: string; type?: string; options?: string[] }[],
    onSubmit: (data: Record<string, string>) => void
  ) => {
    const data: Record<string, string> = {};
    fields.forEach(f => { data[f.key] = ""; });
    setEscalationModal({ type, title, fields, data, onSubmit });
  };

  // Auto-assign cars handlers
  const [autoAssignModalOpen, setAutoAssignModalOpen] = useState(false);
  const [assigningJobId, setAssigningJobId] = useState<string | null>(null);
  const [assignWasherId, setAssignWasherId] = useState<string>("");
  const [assigningInProgress, setAssigningInProgress] = useState(false);
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

      toast.success(`? Car Auto-Assignment Completed\n\nAbsent Washer: ${selectedAbsentWasher?.name}\nTotal Cars Reassigned: ${assignments.length}\n\nNew Assignments:\n${summaryText}\n\nIn production: This would update the database and notify assigned washers.`);
    }
  };

  // Real car data from jobs context for the absent washer
  const getAssignedCars = (washerId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const washerJobs = (jobs || []).filter((j: any) =>
      j.washerId === washerId &&
      j.scheduledDate === today &&
      ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
    );
    if (washerJobs.length > 0) {
      return washerJobs.map((j: any) => ({
        carId: j.jobId,
        carName: `${j.packageName || "Wash"} - ${j.vehicleDetails?.registration || j.customerId}`,
        location: j.serviceDetails?.area || j.cityId || "Surat",
      }));
    }
    // Fallback if no real jobs found
    return [
      { carId: "CAR-001", carName: "No jobs found for this washer today", location: "Surat" },
    ];
  };

  // Real washer capacity from jobs context
  const getAvailableWashers = () => {
    const absentMember = team.find((w: any) => w.id === selectedAbsentWasher?.id);
    const absentGPS = absentMember?.gpsLocation;
    return team
      .filter(w => w.status === "CHECKED_IN" || w.status === "LATE")
      .map(w => {
        const today = new Date().toISOString().split("T")[0];
        const activeCount = (jobs || []).filter((j: any) =>
          j.washerId === w.id &&
          j.scheduledDate === today &&
          ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
        ).length;
        let distanceKm = 0;
        if (absentGPS && (w as any).gpsLocation) {
          const wGPS = (w as any).gpsLocation;
          distanceKm = Math.round(
            Math.sqrt(
              Math.pow((wGPS.lat - absentGPS.lat) * 111, 2) +
              Math.pow((wGPS.lng - absentGPS.lng) * 111, 2)
            ) * 10
          ) / 10;
        }
        return {
          id: w.id,
          name: w.name,
          currentCars: activeCount,
          maxCapacity: 5,
          distanceKm,
        };
      });
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

    // Try loading a previously confirmed cover plan for today before auto-generating a new one
    if (team && team.length > 0 && !coverPlan && scenario !== "cover") {
      try {
        const saved = localStorage.getItem("SUPERVISOR_COVER_PLAN");
        if (saved) {
          const parsed = JSON.parse(saved);
          const todayStr = new Date().toISOString().split("T")[0];
          const savedDate = (parsed.generatedAt || "").split("T")[0];
          if (savedDate === todayStr) {
            setCoverPlan({ ...parsed, generatedAt: new Date(parsed.generatedAt) });
            return;
          }
        }
      } catch (_) {}
    }
    // Default behavior: auto-generate from team data using real absent washer
    if (team && team.length > 0 && !coverPlan && scenario !== "cover") {
      // Priority: LEAVE > ABSENT > first washer with most jobs
      const absentWasher =
        team.find((w: any) => w.isOnLeave || w.status === "LEAVE") ||
        team.find((w: any) => w.status === "ABSENT") ||
        team[0];
      if (absentWasher) {
        // Use real jobs from JobContext instead of mock data
        const today = new Date().toISOString().split("T")[0];
        const realJobsForWasher = (jobs || []).filter((j: any) =>
          j.washerId === absentWasher.id &&
          j.scheduledDate === today &&
          ["Assigned","Acknowledged","In Progress","Unassigned"].includes(j.status)
        );
        const jobsToRedistribute = realJobsForWasher.length > 0
          ? realJobsForWasher.map((j: any) => ({
              id: j.jobId,
              customerId: j.customerId,
              customerFirstName: j.customerName || j.customerId,
              scheduledTime: j.timeSlot || "08:00",
              area: j.location?.area || j.serviceDetails?.area || "Surat",
              packageType: j.packageName || "Daily Wash",
              subscriptionStartDate: today,
            }))
          : mockWasherDataService.getTodayJobs(absentWasher.id, 8);
        // Include any active washer - not just CHECKED_IN (covers GAP shift)
        const PINCODE_GPS: Record<string, { lat: number; lng: number }> = {
          "395001": { lat: 21.1959, lng: 72.8302 },
          "395007": { lat: 21.1384, lng: 72.7842 },
          "395009": { lat: 21.1783, lng: 72.7942 },
          "PIN-395001": { lat: 21.1959, lng: 72.8302 },
          "PIN-395007": { lat: 21.1384, lng: 72.7842 },
          "PIN-395009": { lat: 21.1783, lng: 72.7942 },
        };
        const absentPin = (absentWasher as any).assignedPincodes?.[0] || "395001";
        const absentGPS = PINCODE_GPS[absentPin] || { lat: 21.1702, lng: 72.8311 };

        const availableWashers = team
          .filter((w: any) => !w.isOnLeave && w.status !== "LEAVE" && w.status !== "ABSENT" && w.id !== absentWasher.id)
          .slice(0, 12)
          .map((w: any) => {
            // Calculate approximate distance from pincode GPS
            const wPin = w.assignedPincodes?.[0] || "395001";
            const wGPS = PINCODE_GPS[wPin] || { lat: 21.1702, lng: 72.8311 };
            const distKm = Math.round(
              Math.sqrt(
                Math.pow((wGPS.lat - absentGPS.lat) * 111, 2) +
                Math.pow((wGPS.lng - absentGPS.lng) * 111, 2)
              ) * 10
            ) / 10;
            return {
              id: w.id,
              name: w.name,
              phone: w.phone || "",
              baseUnits: w.unitsCompleted || 0,
              area: wPin.replace("PIN-", ""),
              distanceKm: distKm,
            };
          });

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
    const notifiedPlan = { ...coverPlan, status: "NOTIFIED" as const };
    setCoverPlan(notifiedPlan);
    // Persist cover plan status
    try {
      localStorage.setItem("SUPERVISOR_COVER_PLAN", JSON.stringify({
        ...notifiedPlan,
        generatedAt: notifiedPlan.generatedAt?.toISOString?.() || new Date().toISOString(),
      }));
    } catch (_) {}
    toast.success(`Cover plan confirmed. ${coverPlan.coverWashers.length} washers notified.`);
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
      toast.success(`? Cover Reassignment Successful\n\nReassigned ${units.toFixed(1)} units\nFrom: ${fromWasher.name}\nTo: ${toWasher.name}\n\nIn production: Notifications would be sent to both washers.`);
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
      toast.error("No cover plan available");
      return;
    }
    const affected = coverPlan.absentWasher.jobs.length;
    const unassigned = coverPlan.unassignedUnits;
    openEscalationModal("adjust_allocation", `Adjust Allocation - ${coverPlan.absentWasher.name} Absent`, [
      { key: "action", label: "Action", type: "select", options: [
        "Postpone affected washes to tomorrow",
        "Redistribute to part-time washers",
        "Contact customers to reschedule",
        "Mark as service skipped today",
      ]},
      { key: "notes", label: `Notes (${affected} jobs affected, ${unassigned.toFixed(1)} unassigned units)` },
    ], (data) => {
      if (data.action) {
        coverRedistributionService.contactCustomers(coverPlan.absentWasher.jobs);
        // Persist allocation decision
        try {
          const key = "COVER_ALLOCATION_ACTIONS";
          const existing = JSON.parse(localStorage.getItem(key) || "[]");
          existing.push({
            id: `ALLOC-${Date.now()}`,
            supervisorId: currentUser?.employeeId || "EDB-SUP-SUR1",
            absentWasherId: coverPlan.absentWasher.id,
            absentWasherName: coverPlan.absentWasher.name,
            action: data.action,
            notes: data.notes,
            affectedJobs: affected,
            timestamp: new Date().toISOString(),
          });
          localStorage.setItem(key, JSON.stringify(existing));
        } catch (_) {}
        toast.success(`Allocation adjusted: ${data.action}`);
      }
      setEscalationModal(null);
    });
  };

  // Field audit handlers
  const [auditWashers, setAuditWashers] = useState(() => 
    fieldAuditService.getAuditWashers("EDB-SUP-SUR1")
  );
  const [auditSummary, setAuditSummary] = useState(() => 
    fieldAuditService.getAuditSummary("EDB-SUP-SUR1")
  );
  const [auditFlow, setAuditFlow] = useState<{
    active: boolean;
    washerGPS?: { lat: number; lng: number };
    washerSelfieUrl?: string;
    washerId: string;
    washerName: string;
    checklist: any[];
    photos: number;
    gpsValid: boolean;
    gpsDistance: number;
  } | null>(null);
  const [auditResult, setAuditResult] = useState<any>(null);
  const [showPreDamageModal, setShowPreDamageModal] = useState(false);
  const [showCashDeposit, setShowCashDeposit] = useState(false);
  const [preDamageNote, setPreDamageNote] = useState("");

  const handleStartAudit = (washerId: string) => {
    const washer = auditWashers.find(w => w.id === washerId);
    if (!washer) return;

    // Determine package type from the washer's current job
    const today = new Date().toISOString().split("T")[0];
    const washerJob = (jobs || []).find((j: any) =>
      j.washerId === washer.id &&
      j.scheduledDate === today &&
      ["Assigned", "Acknowledged", "In Progress"].includes(j.status)
    );
    const detectedPackage = washerJob?.packageType || washerJob?.packageName || "SMART_WASH";

    // Also get real GPS + selfie from SupervisorContext team data
    const teamMember = team.find((t: any) => t.id === washer.id);

    setAuditFlow({
      active: true,
      washerId: washer.id,
      washerName: washer.name,
      washerGPS: teamMember?.gpsLocation || washer.currentLocation || null,
      washerSelfieUrl: teamMember?.selfieUrl || washer.selfieUrl || null,
      checklist: [],
      photos: 0,
      gpsValid: true,
      gpsDistance: 0,
      packageType: detectedPackage,
    });
    // Stay on audit tab - AuditFlowScreen renders inline when auditFlow is set
    navigate(SCREEN_TO_PATH["audit"] ?? "/supervisor-app/audit");
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

  const handleReportPreDamage = () => { setShowPreDamageModal(true); };
  const handleSubmitPreDamage = () => {
    if (auditFlow) setAuditFlow({ ...auditFlow, preDamageReported: true } as any);
    setShowPreDamageModal(false); setPreDamageNote("");
    toast.warning("Pre-damage logged.", { duration: 3000 });
  };

  const handleSubmitAudit = (enhancedSubmission?: any) => {
    if (!auditFlow) return;

    // If new enhanced submission format received, use it directly
    if (enhancedSubmission && enhancedSubmission.score !== undefined) {
      const { score, result, flags, washerId, washerName } = enhancedSubmission;
      toast.success(`Audit submitted - ${score}/100 (${result})`);
      if (flags?.length > 0) {
        toast.warning(`${flags.length} flag(s) recorded`);
      }
      setAuditFlow(null);
      return;
    }

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
    setAuditWashers(fieldAuditService.getAuditWashers("EDB-SUP-SUR1"));
    setAuditSummary(fieldAuditService.getAuditSummary("EDB-SUP-SUR1"));
  };

  // Incentive tracker
  const [incentiveDashboard, setIncentiveDashboard] = useState(() =>
    supervisorIncentiveService.getIncentiveDashboard("EDB-SUP-SUR1")
  );

  // BTL Lead handlers
  const [leadMetrics, setLeadMetrics] = useState(() => {
    const metrics = btlLeadService.getSupervisorMetrics("EDB-SUP-SUR1");
    return metrics;
  });
  const [selectedPipeline, setSelectedPipeline] = useState<{ lead: any; pipeline: any[] } | null>(null);
  const [btlLeads, setBtlLeads] = useState(() => {
    const leads = btlLeadService.getSupervisorLeadsWithTracking("EDB-SUP-SUR1");
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
      "EDB-SUP-SUR1",
      "Supervisor 1"
    );
    // Refresh leads list
    setBtlLeads(btlLeadService.getSupervisorLeadsWithTracking("EDB-SUP-SUR1"));
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
    leadNotificationService.getNotifications("EDB-SUP-SUR1")
  );
  const [unreadLeadNotificationsCount, setUnreadLeadNotificationsCount] = useState(() =>
    leadNotificationService.getUnreadCount("EDB-SUP-SUR1")
  );
  const [showNotifications, setShowNotifications] = useState(false);

  // Subscribe to real-time lead notifications
  useEffect(() => {
    const unsubscribe = leadNotificationService.subscribe("EDB-SUP-SUR1", (notification) => {
      setLeadNotifications(leadNotificationService.getNotifications("EDB-SUP-SUR1"));
      setUnreadLeadNotificationsCount(leadNotificationService.getUnreadCount("EDB-SUP-SUR1"));
    });

    return () => unsubscribe();
  }, []);

  const handleNotificationClick = (notificationId: string) => {
    leadNotificationService.markAsRead(notificationId);
    setLeadNotifications(leadNotificationService.getNotifications("EDB-SUP-SUR1"));
    setUnreadLeadNotificationsCount(leadNotificationService.getUnreadCount("EDB-SUP-SUR1"));
  };

  const handleMarkAllNotificationsRead = () => {
    leadNotificationService.markAllAsRead("EDB-SUP-SUR1");
    setLeadNotifications(leadNotificationService.getNotifications("EDB-SUP-SUR1"));
    setUnreadLeadNotificationsCount(0);
  };

  // Escalation handlers
  const [escalationIssues, setEscalationIssues] = useState(() => escalationService.getIssues("EDB-SUP-SUR1"));
  const [escalationSummary, setEscalationSummary] = useState(() =>
    escalationService.getEscalationSummary("EDB-SUP-SUR1")
  );

  const handleManualAttendanceOverride = () => {
    const washers = team.map(w => w.name).join("|");
    openEscalationModal("attendance_override", "Manual Attendance Override", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "reason", label: "Reason for override" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.reason) {
        escalationService.requestAttendanceOverride(washer.id, data.reason, "", currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`Attendance override submitted for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };

  const handleForceEarlyCheckout = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);
    openEscalationModal("force_checkout", `Force Early Checkout - ${washer?.name || washerId}`, [
      { key: "reason", label: "Reason for early checkout" },
    ], (data) => {
      if (data.reason) {
        escalationService.forceEarlyCheckOut(washerId, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`Early checkout processed for ${washer?.name || washerId}`);
      }
      setEscalationModal(null);
    });
  };

  const handleReassignCoverFromEscalation = () => {
    // Navigate to cover tab - escalationService.navigateToCoverReassignment() removed (method does not exist)
    if (location.pathname === "/supervisor-app/cover") {
      navigate("/supervisor-app/dashboard", { replace: true });
      setTimeout(() => navigate("/supervisor-app/cover"), 50);
    } else {
      navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app/cover");
    }
  };

  const handlePauseWasherSchedule = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);
    openEscalationModal("pause_schedule", `Pause Schedule - ${washer?.name || washerId}`, [
      { key: "reason", label: "Reason for pausing schedule" },
    ], (data) => {
      if (data.reason) {
        escalationService.pauseWasherSchedule(washerId, data.reason, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`Schedule paused for ${washer?.name || washerId}`);
      }
      setEscalationModal(null);
    });
  };

  const handleVehicleDamageEscalation = () => {
    openEscalationModal("vehicle_damage", "Vehicle Damage Escalation", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "vehicleDetails", label: "Vehicle details (registration, model)" },
      { key: "notes", label: "Damage description" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.vehicleDetails && data.notes) {
        escalationService.escalateVehicleDamage(washer.id, data.vehicleDetails, "", data.notes, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.warning(`Vehicle damage escalation submitted for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };

  const handleSOSAlert = () => {
    openEscalationModal("sos", "?? SOS Safety Alert", [
      { key: "situation", label: "Describe the emergency situation" },
    ], (data) => {
      if (data.situation) {
        escalationService.triggerSOSAlert(currentUser?.employeeId || "EDB-SUP-SUR1", { lat: 21.1702, lng: 72.8311 }, data.situation);
        toast.error(`SOS Alert triggered. All managers notified.`);
      }
      setEscalationModal(null);
    });
  };

  const handleIncentiveOverrideRequest = () => {
    openEscalationModal("incentive_override", "Incentive Override Request", [
      { key: "caseType", label: "Case type", type: "select", options: ["Missed visit credit", "Quality dispute", "Bonus correction", "Other"] },
      { key: "reason", label: "Reason / supporting details" },
    ], (data) => {
      if (data.caseType && data.reason) {
        escalationService.requestIncentiveOverride(data.caseType, data.reason, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success("Incentive override request submitted to Finance");
      }
      setEscalationModal(null);
    });
  };

  const handleReassignCarAction = () => {
    openEscalationModal("reassign_car", "Reassign Car Between Washers", [
      { key: "fromWasherName", label: "From washer", type: "select", options: team.map(w => w.name) },
      { key: "toWasherName", label: "To washer", type: "select", options: team.map(w => w.name) },
      { key: "reason", label: "Reason for reassignment" },
    ], (data) => {
      const fromW = team.find(w => w.name === data.fromWasherName);
      const toW   = team.find(w => w.name === data.toWasherName);
      if (fromW && toW && data.reason) {
        escalationService.reassignCar("JOB", fromW.id, toW.id, data.reason, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`Car reassigned from ${fromW.name} to ${toW.name}`);
      }
      setEscalationModal(null);
    });
  };

  const handleBatchInvalidationAction = () => {
    openEscalationModal("batch_invalidation", "Cloth Batch Invalidation", [
      { key: "washerName", label: "Washer", type: "select", options: team.map(w => w.name) },
      { key: "batchId", label: "Batch ID", type: "select", options: ["A", "B", "C", "D"] },
      { key: "reason", label: "Reason for invalidation" },
    ], (data) => {
      const washer = team.find(w => w.name === data.washerName);
      if (washer && data.batchId && data.reason) {
        escalationService.invalidateBatch(washer.id, data.batchId, data.reason, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.warning(`Batch ${data.batchId} invalidated for ${washer.name}`);
      }
      setEscalationModal(null);
    });
  };

  const handleEscalateToOpsManager = (issueId: string) => {
    openEscalationModal("escalate_ops", "Escalate to Ops Manager", [
      { key: "reason", label: "Escalation reason" },
    ], (data) => {
      if (data.reason) {
        escalationService.escalateToOpsManager(issueId, data.reason, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.info("Escalated to Operations Manager");
      }
      setEscalationModal(null);
    });
  };

  const handleMarkIssueInProgress = (issueId: string) => {
    escalationService.markInProgress(issueId, "EDB-SUP-SUR1");
  };

  const handleResolveEscalationIssue = (issueId: string) => {
    openEscalationModal("resolve_issue", "Resolve Issue", [
      { key: "resolution", label: "Resolution notes" },
    ], (data) => {
      if (data.resolution) {
        escalationService.resolveIssue(issueId, data.resolution, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success("Issue resolved");
      }
      setEscalationModal(null);
    });
  };

  // Alert system handlers
  const [systemAlerts, setSystemAlerts] = useState(() => alertService.getAlerts("EDB-SUP-SUR1"));
  const [alertSummary, setAlertSummary] = useState(() => alertService.getAlertSummary("EDB-SUP-SUR1"));

  const handleReassignFromAlert = (washerId?: string) => {
    // If already on cover tab, navigate away then back to force re-render
    if (location.pathname === "/supervisor-app/cover") {
      navigate("/supervisor-app/dashboard", { replace: true });
      setTimeout(() => navigate("/supervisor-app/cover"), 50);
    } else {
      navigate(SCREEN_TO_PATH["cover"] ?? "/supervisor-app/cover");
    }
    // Pre-select the absent washer in cover plan if provided
    if (washerId) {
      const washer = team.find((w: any) => w.id === washerId);
      if (washer && coverPlan) {
        setCoverPlan({ ...coverPlan, highlightedWasherId: washerId });
      }
    }
  };

  const handleViewDetailsFromAlert = (alert?: any) => {
    if (alert?.id) markAlertRead(alert.id);
    if (alert?.actionUrl) {
      const screen = alert.actionUrl.split("/").pop() || "dashboard";
      navigate(SCREEN_TO_PATH[screen] ?? "/supervisor-app");
    } else {
      navigate(SCREEN_TO_PATH["alerts"] ?? "/supervisor-app/alerts");
    }
  };

  const handleEscalateAlert = (alertId: string) => {
    openEscalationModal("escalate_alert", "Escalate Alert", [
      { key: "reason", label: "Escalation reason" },
    ], (data) => {
      if (data.reason) {
        alertService.escalateAlert(alertId, currentUser?.employeeId || "EDB-SUP-SUR1", data.reason);
        toast.info("Alert escalated to Ops Manager");
      }
      setEscalationModal(null);
    });
  };

  const handleMarkPresentFromAlert = (washerId: string) => {
    const washer = team.find(w => w.id === washerId);
    try {
      const records = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_attendance_records") || "[]");
      const today = new Date().toISOString().split("T")[0];
      const filtered = records.filter((r: any) => !(r.employeeId === washerId && r.date === today));
      filtered.push({
        attendanceId: `ATT-${washerId}-${today}-MANUAL`,
        employeeId: washerId,
        cityId: "CITY-SURAT",
        date: today,
        status: "Present",
        checkInTime: new Date().toTimeString().slice(0, 8),
        manualOverride: true,
        overrideBy: currentUser?.employeeId || "EDB-SUP-SUR1",
      });
      localStorage.setItem("cleancar_CITY-SURAT_attendance_records", JSON.stringify(filtered));
      refreshData();
    } catch (_) {}
    alertService.markAlertActioned(`ALERT-NOCHECKIN-${washerId}`, currentUser?.employeeId || "EDB-SUP-SUR1");
    toast.success(`${washer?.name || washerId} marked as PRESENT`);
  };

  const handleMarkAbsentFromAlert = (washerId: string) => {
    const washer = team.find((w: any) => w.id === washerId);
    const washerName = washer?.name || washerId;
    openEscalationModal("mark_absent_alert", `Mark Absent - ${washerName}`, [
      { key: "reason", label: "Reason for absence", type: "select", options: ["Not reachable", "Personal emergency", "Sick leave", "No show", "Other"] },
    ], (data) => {
      if (data.reason) {
        try {
          const records = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_attendance_records") || "[]");
          const today = new Date().toISOString().split("T")[0];
          const filtered = records.filter((r: any) => !(r.employeeId === washerId && r.date === today));
          filtered.push({
            attendanceId: `ATT-${washerId}-${today}-MANUAL`,
            employeeId: washerId,
            cityId: "CITY-SURAT",
            date: today,
            status: "Absent",
            manualOverride: true,
            overrideBy: currentUser?.employeeId || "EDB-SUP-SUR1",
            overrideReason: data.reason,
          });
          localStorage.setItem("cleancar_CITY-SURAT_attendance_records", JSON.stringify(filtered));
          refreshData();
        } catch (_) {}
        alertService.markAlertActioned(`ALERT-NOCHECKIN-${washerId}`, currentUser?.employeeId || "EDB-SUP-SUR1");
        toast.success(`${washerName} marked ABSENT - ${data.reason}`);
      }
      setEscalationModal(null);
    });
  };

  const handleResolveAlert = (alertId: string) => {
    openEscalationModal("resolve_alert", "Resolve Alert", [
      { key: "notes", label: "Resolution notes (optional)" },
    ], (data) => {
      alertService.resolveAlert(alertId, currentUser?.employeeId || "EDB-SUP-SUR1", data.notes || undefined);
      toast.success("Alert resolved");
      setEscalationModal(null);
    });
  };

  // Hierarchy visibility handlers
  const [performanceData, setPerformanceData] = useState(() =>
    hierarchyVisibilityService.getSupervisorPerformance("EDB-SUP-SUR1")
  );
  const [dataVisibilityMap, setDataVisibilityMap] = useState(() =>
    hierarchyVisibilityService.getDataVisibilityMap()
  );
  const [hierarchyViews, setHierarchyViews] = useState(() => hierarchyVisibilityService.getHierarchyViews());
  const [kpiComparison, setKpiComparison] = useState(() =>
    hierarchyVisibilityService.getKPIComparison("EDB-SUP-SUR1")
  );
  const [escalationVisibility, setEscalationVisibility] = useState(() =>
    hierarchyVisibilityService.getEscalationVisibility("EDB-SUP-SUR1")
  );

  // Audit trail handlers
  const [auditTrailData, setAuditTrailData] = useState(() =>
    auditTrailService.getAuditTrail("ALL")
  );
  const [auditTrailSummary, setAuditTrailSummary] = useState(() =>
    auditTrailService.getAuditTrailSummary("ALL")
  );

  // Job notifications state
  const [jobNotifications, setJobNotifications] = React.useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem("SUPERVISOR_JOB_NOTIFICATIONS") || "[]"); } catch(_) { return []; }
  });
  const unreadJobNotifs = jobNotifications.filter((n: any) => !n.read).length;

  const markJobNotifsRead = () => {
    const updated = jobNotifications.map((n: any) => ({ ...n, read: true }));
    setJobNotifications(updated);
    localStorage.setItem("SUPERVISOR_JOB_NOTIFICATIONS", JSON.stringify(updated));
  };

  const refreshAuditTrail = () => {
    setAuditTrailData(auditTrailService.getAuditTrail("ALL"));
    setAuditTrailSummary(auditTrailService.getAuditTrailSummary("ALL"));
  };

  // Daily flow handlers
  const [dailyFlowData, setDailyFlowData] = useState(() => dailyFlowService.getDailyFlow("EDB-SUP-SUR1"));
  const [dailyFlowSummary, setDailyFlowSummary] = useState(() => dailyFlowService.getDailyFlowSummary("EDB-SUP-SUR1"));

  // KPI dashboard handlers
  const [kpiDashboardData, setKpiDashboardData] = useState(() => kpiDashboardService.getKPIDashboard("EDB-SUP-SUR1"));

  useEffect(() => {
    const sid = currentUser?.employeeId;
    if (!sid) return;
    setIncentiveDashboard(supervisorIncentiveService.getIncentiveDashboard(sid));
    setLeadMetrics(btlLeadService.getSupervisorMetrics(sid));
    setBtlLeads(btlLeadService.getSupervisorLeadsWithTracking(sid));
    setEscalationIssues(escalationService.getIssues(sid));
    setEscalationSummary(escalationService.getEscalationSummary(sid));
    setSystemAlerts(alertService.getAlerts(sid));
    setAlertSummary(alertService.getAlertSummary(sid));
    setPerformanceData(hierarchyVisibilityService.getSupervisorPerformance(sid));
    setDataVisibilityMap(hierarchyVisibilityService.getDataVisibilityMap());
    setHierarchyViews(hierarchyVisibilityService.getHierarchyViews());
    setKpiComparison(hierarchyVisibilityService.getKPIComparison(sid));
    setEscalationVisibility(hierarchyVisibilityService.getEscalationVisibility(sid));
    setDailyFlowData(dailyFlowService.getDailyFlow(sid));
    setDailyFlowSummary(dailyFlowService.getDailyFlowSummary(sid));
    setKpiDashboardData(kpiDashboardService.getKPIDashboard(sid));
    setAuditWashers(fieldAuditService.getAuditWashers(sid));
    setAuditSummary(fieldAuditService.getAuditSummary(sid));
  }, [currentUser?.employeeId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {/* Offline indicator for field supervisors */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-center text-xs py-1.5 px-3 font-medium">
          Warning: You are offline  - changes will sync when connection is restored
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
          ?? {currentUser.name} ({currentUser.employeeId})
        </div>
      )}

      {/* Top Bar */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Supervisor App</h1>
              <p className="text-xs text-gray-600">
                Shift {currentShift} - {team.length} washers
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button size="sm" variant="outline" onClick={refreshData}>
                Refresh
              </Button>

              {/* Lead Notifications Bell */}
              <button
                type="button"
                style={{position:"relative",background:"none",border:"none",cursor:"pointer",padding:"4px"}}
                onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
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
              <TabsTrigger value="cover" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Cover
              </TabsTrigger>
              <TabsTrigger value="audit-trail" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                Audit Trail
              </TabsTrigger>
              <TabsTrigger value="kpi-dashboard" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer">
                KPI
              </TabsTrigger>
              <TabsTrigger value="exit" className="text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[36px] cursor-pointer relative">
                Exit Verify
                {pendingExits.length > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                    {pendingExits.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Screen 1: Dashboard */}
          <TabsContent value="dashboard" className="mt-0">
            <SupervisorDashboard
              todayDate={new Date()}
              dayNumber={new Date().getDate()}
              totalDays={new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()}
              summary={summary}
              alerts={alerts}
              currentShift={currentShift}
              shiftFocusAreas={shiftFocusAreas}
              onAlertClick={handleAlertClick}
              onNavigate={handleNavigate}
              onCashDeposit={() => setShowCashDeposit(true)}
            />

            {/* Unassigned Jobs - quick assign panel */}
            {(() => {
              const today = new Date().toISOString().split("T")[0];
              const unassigned = (jobs || []).filter((j: any) =>
                j.scheduledDate === today && j.status === "Unassigned"
              );
              if (unassigned.length === 0) return null;
              return (
                <div className="mt-4 px-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-gray-800">
                      ?? {unassigned.length} Unassigned Job{unassigned.length > 1 ? "s" : ""} Today
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {unassigned.map((j: any) => (
                      <div key={j.jobId} className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{j.packageName}</p>
                              {j.isComplimentary && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">??? COMP 2W</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{j.customerName || j.customerId} - {j.timeSlot} - {j.vehicleDetails?.registration || ""}</p>
                            {j.isComplimentary && (
                              <p className="text-xs text-purple-600 font-medium">Free 2W wash - Linked 4W: {j.vehicle4WReg || "see offer"} - Cost {"->"} Marketing Expense</p>
                            )}
                            <p className="text-xs text-gray-400">{j.serviceDetails?.area || j.cityId || "Surat"}</p>
                          </div>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Unassigned</span>
                        </div>
                        {assigningJobId === j.jobId ? (
                          <div className="flex gap-2 mt-1">
                            <select
                              className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                              value={assignWasherId}
                              onChange={e => setAssignWasherId(e.target.value)}
                            >
                              <option value="">Select washer...</option>
                              {(() => {
                                // Rank washers: (1) pincode match ? (2) idle (no active jobs) ? (3) fewest active jobs
                                const activeWashers = team.filter((w: any) => w.status === "CHECKED_IN" || w.status === "LATE");
                                const jobPinCode = (j.pinCode || j.serviceDetails?.area || "").toLowerCase();
                                const ranked = [...activeWashers].sort((a: any, b: any) => {
                                  const aPin = (a.pinCode || a.area || "").toLowerCase();
                                  const bPin = (b.pinCode || b.area || "").toLowerCase();
                                  const aMatch = jobPinCode && aPin && aPin.includes(jobPinCode.slice(0,4)) ? 0 : 1;
                                  const bMatch = jobPinCode && bPin && bPin.includes(jobPinCode.slice(0,4)) ? 0 : 1;
                                  if (aMatch !== bMatch) return aMatch - bMatch;
                                  const aJobs = jobs.filter((jj: any) => jj.washerId === a.id && ["Assigned","Acknowledged","In Progress"].includes(jj.status)).length;
                                  const bJobs = jobs.filter((jj: any) => jj.washerId === b.id && ["Assigned","Acknowledged","In Progress"].includes(jj.status)).length;
                                  return aJobs - bJobs;
                                });
                                return ranked.map((w: any) => {
                                  const activeCount = jobs.filter((jj: any) => jj.washerId === w.id && ["Assigned","Acknowledged","In Progress"].includes(jj.status)).length;
                                  const pinMatch = jobPinCode && (w.pinCode||w.area||"").toLowerCase().includes(jobPinCode.slice(0,4));
                                  return (
                                    <option key={w.id} value={w.id}>
                                      {pinMatch ? "[NEAR] " : ""}{w.name} ({activeCount} active{activeCount === 0 ? " - idle" : ""})
                                    </option>
                                  );
                                });
                              })()}
                            </select>
                            <button
                              disabled={assigningInProgress || !assignWasherId}
                              onClick={async () => {
                                if (assignWasherId && !assigningInProgress) {
                                  setAssigningInProgress(true);
                                  const washer = team.find(w => w.id === assignWasherId);
                                  await assignJobToWasher(j.jobId, assignWasherId, washer?.name || assignWasherId);
                                  toast.success(`Job assigned to ${washer?.name || assignWasherId}`);
                                  setAssigningJobId(null);
                                  setAssignWasherId("");
                                  setAssigningInProgress(false);
                                }
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >{assigningInProgress ? "Assigning..." : "Assign"}</button>
                            <button
                              onClick={() => { setAssigningJobId(null); setAssignWasherId(""); }}
                              className="px-2 py-1.5 border border-gray-300 text-xs rounded-lg"
                            >?</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAssigningJobId(j.jobId); setAssignWasherId(""); }}
                            className="w-full mt-1 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >Assign Washer</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
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
            {auditFlow ? (
              <AuditFlowScreen washerId={auditFlow.washerId} washerName={auditFlow.washerName} washerGPS={(auditFlow as any).washerGPS} washerSelfieUrl={(auditFlow as any).washerSelfieUrl} packageType={(auditFlow as any).packageType || "SMART_WASH"} supervisorId={currentUser?.employeeId || "EDB-SUP-SUR1"} supervisorName={currentUser?.name || "Supervisor"} onSubmit={handleSubmitAudit} onCancel={() => setAuditFlow(null)} />
            ) : (
              <FieldAuditScreen washers={auditWashers} todayTarget={auditSummary.todayTarget} completed={auditSummary.completed} onStartAudit={handleStartAudit} />
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
          <TabsContent value="schedule" className="mt-0">
            <SupervisorPeriodicScheduleScreen />
          </TabsContent>

          {/* Screen 6: BTL Leads */}
          <TabsContent value="leads" className="mt-0">
            <BTLLeadScreen
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
            <EscalationScreen
              issues={escalationIssues}
              summary={escalationSummary}
              onManualOverride={handleManualAttendanceOverride}
              onForceCheckout={handleForceEarlyCheckout}
              onReassignCover={handleReassignCoverFromEscalation}
              onPauseSchedule={handlePauseWasherSchedule}
              onVehicleDamage={handleVehicleDamageEscalation}
              onSOSAlert={handleSOSAlert}
              onIncentiveOverride={handleIncentiveOverrideRequest}
              onReassignCar={handleReassignCarAction}
              onBatchInvalidation={handleBatchInvalidationAction}
              onEscalateToOps={handleEscalateToOpsManager}
              onMarkInProgress={handleMarkIssueInProgress}
              onResolveIssue={handleResolveEscalationIssue}
            />
          </TabsContent>

          {/* MODULE 7: Alert Center */}
          <TabsContent value="alerts" className="mt-0">
            <AlertCenterScreen
              alerts={alerts}
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
            <div>
              <div className="flex justify-end p-2">
                <button
                  onClick={refreshAuditTrail}
                  className="text-xs text-indigo-600 underline"
                >
                  Refresh
                </button>
              </div>
              <AuditTrailScreen logs={auditTrailData} summary={auditTrailSummary} />
            </div>
          </TabsContent>

          {/* Daily Flow (Bonus Tab) */}
          <TabsContent value="daily-flow" className="mt-0">
            <DailyFlowScreen stages={dailyFlowData} summary={dailyFlowSummary} />
          </TabsContent>

          {/* KPI Dashboard (Bonus Tab) */}
          <TabsContent value="kpi-dashboard" className="mt-0">
            <KPIDashboardScreen dashboard={kpiDashboardData} />
          </TabsContent>

          {/* Exit Verifications Tab */}
          <TabsContent value="exit" className="mt-0 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Exit Material Verifications</h2>
              <p className="text-sm text-gray-500 mt-0.5">Verify items returned by exiting team members</p>
            </div>

            {pendingExits.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-medium text-gray-700">No pending verifications</p>
                <p className="text-sm text-gray-400 mt-1">All material returns are verified</p>
              </div>
            ) : (
              pendingExits.map((exit: any) => {
                const totalItems = exit.materials.length;
                const doneItems = exit.materials.filter((m: any) => m.condition !== "Pending").length;
                const progress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
                return (
                  <div key={exit.id} className="bg-white border border-orange-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-orange-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{exit.employeeName}</p>
                        <p className="text-xs text-gray-500">{exit.empCode} · {exit.designation} · Last day: {exit.lastWorkingDate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Progress</p>
                        <p className="text-sm font-bold text-orange-700">{doneItems}/{totalItems}</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100">
                      <div
                        className={`h-1.5 transition-all ${progress === 100 ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Reason */}
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs text-gray-400">Reason: </span>
                      <span className="text-xs text-gray-700">{exit.reasonForLeaving}</span>
                    </div>

                    {/* Materials */}
                    <div className="px-4 pb-3 space-y-2 mt-2">
                      {exit.materials.map((mat: any) => (
                        <div
                          key={mat.id}
                          className={`rounded-lg border px-3 py-2 ${
                            mat.condition === "Good"         ? "bg-green-50 border-green-200" :
                            mat.condition === "Pending"      ? "bg-gray-50 border-gray-200" :
                            mat.condition === "Missing"      ? "bg-red-50 border-red-200" :
                            mat.condition === "Minor Damage" ? "bg-yellow-50 border-yellow-200" :
                                                              "bg-orange-50 border-orange-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {mat.condition === "Good"    ? "✅" :
                                 mat.condition === "Pending" ? "⏳" :
                                 mat.condition === "Missing" ? "❌" : "⚠️"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{mat.name}</p>
                                {mat.comments && <p className="text-xs text-gray-500">{mat.comments}</p>}
                                {mat.verifiedBy && (
                                  <p className="text-xs text-gray-400">by {mat.verifiedBy} · {mat.verifiedOn}</p>
                                )}
                              </div>
                            </div>
                            {mat.condition !== "Pending" && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                                mat.condition === "Good" ? "bg-green-100 text-green-700" :
                                mat.condition === "Missing" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {mat.condition}
                              </span>
                            )}
                          </div>
                          {mat.condition === "Pending" && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {["Good", "Minor Damage", "Major Damage", "Missing"].map(cond => (
                                <button
                                  key={cond}
                                  onClick={() => handleExitMaterialMark(exit.id, mat.id, cond)}
                                  className={`text-xs rounded-lg px-2.5 py-1 border font-medium transition-colors ${
                                    cond === "Good"         ? "bg-green-50  text-green-700  border-green-300  hover:bg-green-100" :
                                    cond === "Minor Damage" ? "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100" :
                                    cond === "Major Damage" ? "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100" :
                                                              "bg-red-50    text-red-700    border-red-300    hover:bg-red-100"
                                  }`}
                                >
                                  {cond === "Minor Damage" ? "Minor" : cond === "Major Damage" ? "Major" : cond}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Complete button */}
                    <div className="px-4 pb-4 flex items-center justify-between">
                      <p className="text-xs text-gray-400">
                        {exit.materials.filter((m: any) => m.condition === "Pending").length > 0
                          ? `${exit.materials.filter((m: any) => m.condition === "Pending").length} items still pending`
                          : "All items verified — ready to complete"}
                      </p>
                      <button
                        disabled={exit.materials.some((m: any) => m.condition === "Pending")}
                        onClick={() => handleExitVerificationComplete(exit.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          exit.materials.some((m: any) => m.condition === "Pending")
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        ✓ Complete Verification
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Escalation Action Modal - replaces all prompt()/confirm() */}
      {escalationModal && (
        <div style={{position:"fixed",inset:0,zIndex:10001,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"440px",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
            <h3 style={{fontWeight:800,fontSize:"18px",marginBottom:"4px",color:"#0f172a"}}>{escalationModal.title}</h3>
            <div style={{height:2,background:"linear-gradient(90deg,#6366f1,#8b5cf6)",borderRadius:2,marginBottom:"20px"}} />
            <div style={{display:"flex",flexDirection:"column",gap:"14px",marginBottom:"20px"}}>
              {escalationModal.fields.map(field => (
                <div key={field.key}>
                  <label style={{display:"block",fontSize:"12px",fontWeight:700,color:"#475569",marginBottom:"6px",textTransform:"uppercase",letterSpacing:"0.05em"}}>{field.label}</label>
                  {field.type === "select" && field.options ? (
                    <select
                      value={escalationModal.data[field.key] || ""}
                      onChange={e => setEscalationModal(prev => prev ? {...prev, data: {...prev.data, [field.key]: e.target.value}} : null)}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"10px 12px",fontSize:"14px",background:"#f8fafc",color:"#0f172a",outline:"none"}}
                    >
                      <option value="">Select...</option>
                      {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <textarea
                      value={escalationModal.data[field.key] || ""}
                      onChange={e => setEscalationModal(prev => prev ? {...prev, data: {...prev.data, [field.key]: e.target.value}} : null)}
                      rows={2}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{width:"100%",border:"1.5px solid #e2e8f0",borderRadius:"10px",padding:"10px 12px",fontSize:"14px",background:"#f8fafc",color:"#0f172a",outline:"none",resize:"vertical",fontFamily:"inherit"}}
                    />
                  )}
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:"10px"}}>
              <button
                onClick={() => setEscalationModal(null)}
                style={{flex:1,padding:"12px",border:"1.5px solid #e2e8f0",borderRadius:"10px",cursor:"pointer",fontSize:"14px",fontWeight:600,color:"#475569",background:"#f8fafc"}}
              >Cancel</button>
              <button
                onClick={() => escalationModal.onSubmit(escalationModal.data)}
                style={{flex:2,padding:"12px",border:"none",borderRadius:"10px",cursor:"pointer",fontSize:"14px",fontWeight:700,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",color:"white"}}
              >Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Pipeline View */}
      {selectedPipeline && (
        <LeadPipelineView
          lead={selectedPipeline.lead}
          pipeline={selectedPipeline.pipeline}
          onClose={handleClosePipeline}
        />
      )}

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
      {showPreDamageModal && (
        <div style={{position:"fixed",inset:0,zIndex:10000,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
          <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"400px"}}>
            <h3 style={{fontWeight:700,fontSize:"18px",marginBottom:"8px",color:"#dc2626"}}>Report Pre-Existing Damage</h3>
            <textarea style={{width:"100%",border:"1px solid #d1d5db",borderRadius:"8px",padding:"8px",fontSize:"14px",minHeight:"80px",marginBottom:"12px"}} placeholder="Describe the damage..." value={preDamageNote} onChange={e => setPreDamageNote(e.target.value)} />
            <div style={{display:"flex",gap:"8px"}}>
              <button onClick={() => setShowPreDamageModal(false)} style={{flex:1,padding:"10px",border:"1px solid #d1d5db",borderRadius:"8px",cursor:"pointer"}}>Cancel</button>
              <button onClick={handleSubmitPreDamage} style={{flex:1,padding:"10px",border:"none",borderRadius:"8px",background:"#dc2626",color:"white",cursor:"pointer",fontWeight:600}}>Log Damage</button>
            </div>
          </div>
        </div>
      )}

      {/* Cash Deposit Overlay */}
      {showCashDeposit && (
        <div style={{position:"fixed",inset:0,zIndex:9999,background:"white",overflowY:"auto"}}>
          <CashDepositScreen
            supervisorId={currentUser?.employeeId || "EDB-SUP-SUR1"}
            supervisorName={currentUser?.name || "Supervisor"}
            cityId="CITY-SURAT"
            onBack={() => setShowCashDeposit(false)}
          />
        </div>
      )}
    </div>
  );
}

