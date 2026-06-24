/**


 * Tele Sales Manager Application - Pipeline Control Tower


 *


 * Main orchestrator for the TSM module providing real-time pipeline governance


 * and team performance oversight. This is a revenue conversion governance system


 * where TSM controls funnel performance without executing sales.


 *


 * Philosophy: Monitor → Alert → Control → Report


 * Role: TSM sees aggregated outcomes, not execution details


 *


 * Daily Workflow:


 * - Morning (9:00 AM - 12:00 PM): New lead queue review, SLA monitoring


 * - Midday (12:00 PM - 3:00 PM): Team performance check, conversion tracking


 * - Afternoon (3:00 PM - 6:00 PM): Pricing audit, lost lead approvals


 * - Evening (6:00 PM - 8:00 PM): Daily reconciliation, renewal planning


 *


 * @component


 */





import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";


import { Badge } from "../ui/badge";


import {


  LayoutDashboard,


  Users,


  FileText,


  DollarSign,


  RefreshCw,


  Award,


  BarChart3,


  AlertTriangle,


  Clock,


  Bell,


} from "lucide-react";


import { TSMCommandDashboard } from "./TSMCommandDashboard";


import { TSMTeamPerformance } from "./TSMTeamPerformance";


import { TSMLeadPipeline } from "./TSMLeadPipeline";


import { TSMPricingAudit } from "./TSMPricingAudit";


import { TSMRenewalDashboard } from "./TSMRenewalDashboard";


import { TSMIncentiveTracker } from "./TSMIncentiveTracker";
import { TSMComplimentary2W } from "./TSMComplimentary2W";
import { TSMCancellationQueue } from "./TSMCancellationQueue";


import { TSMReportsAnalytics } from "./TSMReportsAnalytics";


import { TSMAlertSystem } from "./TSMAlertSystem";
import { TSMLeadPoolAssignment } from "./TSMLeadPoolAssignment";
import { RescheduleQueuePanel } from "../shared/RescheduleQueuePanel";
import { TSMReschedulePanel } from "./TSMReschedulePanel";
import { UpsellTasksPanel, TSMSettingsPanel } from "./TSMUpsellAndSettings";
import { rescheduleService } from "../../services/whatsappRescheduleHandler";


import { useCustomers } from "../../contexts/CustomerContext";
import { useCity } from "../../contexts/CityContext";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";

import { TATNotificationBell } from "../shared/TATNotificationBell";
import { tatTrackingService } from "../../services/tatTrackingService";


import { TATNotificationBell } from "../shared/TATNotificationBell";
import { tatTrackingService } from "../../services/tatTrackingService";


import {
  TIME_MODE_HOURS,
  REFRESH_INTERVALS,
} from "../../constants/teleSalesManager.constants";
import { DataService } from "../../services/DataService";
import { useRole } from "../../contexts/RoleContext";
import { toast } from "sonner";





// A5 FIX: Replace with auth context in production — e.g. useAuth().user.name


const _tsmSess = (() => { try { return JSON.parse(localStorage.getItem("cc360_session") || "{}"); } catch { return {}; } })(); const CURRENT_TSM_NAME = _tsmSess.employeeName || "TSM"; const CURRENT_TSM_ID = _tsmSess.employeeId || "EDB-TSM-SUR1";





/** Time mode type for daily workflow */


type TimeMode = "MORNING" | "MIDDAY" | "AFTERNOON" | "EVENING" | "OFF_HOURS";





/**


 * Main Tele Sales Manager Application Component


 *


 * Provides tab-based navigation between TSM screens, real-time alerts,


 * and time-based workflow modes.


 */


export function TeleSalesManagerApp() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "dashboard";
  const [currentScreen, setCurrentScreen] = useState<string>(initialTab);
  const { currentUser } = useRole();

  // ── Exit Verification State (TSM verifies TSE exits) ────────────────────
  const _sn = (v: any) => !v ? "" : typeof v === "string" ? v : v?.name ?? "";
  const _loadExits = () => {
    try {
      const s = DataService.get<any>("EXIT_SETTLEMENTS");
      const r = s.length > 0 ? s : (() => {
        const raw = localStorage.getItem("cleancar_CITY-SURAT_exit_settlements");
        return raw ? JSON.parse(raw) : [];
      })();
      return r.map((x: any) => ({ ...x, supervisorVerifiedBy: _sn(x.supervisorVerifiedBy) }));
    } catch { return []; }
  };
  const [tsmExitRecords, setTsmExitRecords] = useState<any[]>(_loadExits);
  const pendingTSEExits = tsmExitRecords.filter(
    e => (e.status === "Supervisor Verification Pending" || e.status === "Exit Initiated")
      && e.verifierRole === "TSM"
  );
  const _persistExits = (records: any[]) => {
    try { DataService.setAll("EXIT_SETTLEMENTS", records); } catch {}
    try {
      localStorage.setItem("cleancar_CITY-SURAT_exit_settlements", JSON.stringify(records));
      localStorage.setItem("cleancar_exit_settlements", JSON.stringify(records));
    } catch {}
  };
  const handleTSMMaterialMark = (exitId: string, matId: string, condition: string) => {
    const comments = condition !== "Good" ? window.prompt(`Comments for "${condition}":`) ?? "" : "";
    const updated = tsmExitRecords.map(e =>
      e.id !== exitId ? e : {
        ...e,
        materials: e.materials.map((m: any) =>
          m.id !== matId ? m : { ...m, condition, comments, verifiedBy: currentUser?.name ?? CURRENT_TSM_NAME, verifiedOn: new Date().toISOString().split("T")[0] }
        ),
      }
    );
    setTsmExitRecords(updated); _persistExits(updated);
    toast.success(`Marked as: ${condition}`);
  };
  const handleTSMCompleteVerification = (exitId: string) => {
    const exit = tsmExitRecords.find(e => e.id === exitId);
    if (!exit) return;
    const pending = exit.materials.filter((m: any) => m.condition === "Pending");
    if (pending.length > 0) { toast.error(`Verify all ${pending.length} items first.`); return; }
    const updated = tsmExitRecords.map(e =>
      e.id !== exitId ? e : {
        ...e, status: "Supervisor Verified",
        supervisorVerifiedBy: currentUser?.name ?? CURRENT_TSM_NAME,
        supervisorVerifiedOn: new Date().toISOString().split("T")[0],
      }
    );
    setTsmExitRecords(updated); _persistExits(updated);
    toast.success(`✅ Verification complete for ${exit.employeeName}. HR notified.`);
  };
  // ── End Exit Verification ────────────────────────────────────────────────


  // A3 FIX: track pre-selected stage so drill-down actually filters


  const { leads } = useCustomers();
  const { city } = useCity();
  const poolLeadCount = leads.filter((l: any) =>
    (!l.assignedTo || l.assignedTo.trim() === "") &&
    (l.cityId === city || !l.cityId) &&
    l.status !== "Converted" && l.status !== "Rejected"
  ).length;

  const [pipelineStageFilter, setPipelineStageFilter] = useState<string>("ALL");


  const [currentTime, setCurrentTime] = useState<Date>(new Date());


  const [alerts, setAlerts] = useState(teleSalesManagerService.getSystemAlerts());


  // A1 FIX: persist dismissed IDs so 30s reload doesn't re-show them


  const dismissedAlertIds = useState<Set<string>>(() => new Set())[0];





  /**


   * Update current time every minute to refresh time-based UI elements


   */


  useEffect(() => {


    // A2 FIX: update every 60s not 120s — time mode must switch at exact hour boundary


    const timer = setInterval(() => {


      setCurrentTime(new Date());


    }, 60000);


    return () => clearInterval(timer);


  }, []);





  /**


   * Reload alerts periodically to show real-time pipeline issues


   */


  useEffect(() => {


    const timer = setInterval(() => {


      // A1 FIX: filter out dismissed alerts on every reload


      const fresh = teleSalesManagerService.getSystemAlerts();


      setAlerts(fresh.filter(a => !dismissedAlertIds.has(a.id)));


    }, REFRESH_INTERVALS.ALERTS);


    return () => clearInterval(timer);


  }, []);





  const metrics = teleSalesManagerService.getCommandMetrics();


  const criticalAlerts = alerts.filter((a) => a.severity === "CRITICAL").length;


  const warningAlerts = alerts.filter((a) => a.severity === "WARNING").length;





  /**


   * Determines time-based workflow mode based on current hour


   * @returns Current time mode for workflow prioritization


   */


  const getTimeMode = (): TimeMode => {


    const hour = currentTime.getHours();


    if (hour >= TIME_MODE_HOURS.MORNING_START && hour < TIME_MODE_HOURS.MORNING_END) {


      return "MORNING";


    }


    if (hour >= TIME_MODE_HOURS.MIDDAY_START && hour < TIME_MODE_HOURS.MIDDAY_END) {


      return "MIDDAY";


    }


    if (hour >= TIME_MODE_HOURS.AFTERNOON_START && hour < TIME_MODE_HOURS.AFTERNOON_END) {


      return "AFTERNOON";


    }


    if (hour >= TIME_MODE_HOURS.EVENING_START && hour < TIME_MODE_HOURS.EVENING_END) {


      return "EVENING";


    }


    return "OFF_HOURS";


  };





  const timeMode = getTimeMode();





  const getTimeModeInfo = () => {


    switch (timeMode) {


      case "MORNING":


        return {


          label: "Morning Queue Review",


          color: "bg-blue-600",


          priority: "New lead queue + SLA monitoring",


        };


      case "MIDDAY":


        return {


          label: "Midday Performance Check",


          color: "bg-purple-600",


          priority: "Team performance + conversion tracking",


        };


      case "AFTERNOON":


        return {


          label: "Afternoon Governance",


          color: "bg-indigo-600",


          priority: "Pricing audit + lost lead approvals",


        };


      case "EVENING":


        return {


          label: "Evening Reconciliation",


          color: "bg-amber-600",


          priority: "Daily wrap-up + renewal planning",


        };


      default:


        return {


          label: "Off Hours",


          color: "bg-gray-600",


          priority: "Limited operations",


        };


    }


  };





  const modeInfo = getTimeModeInfo();





  return (


    <div className="min-h-screen bg-slate-50">


      {/* Critical Alert Banner */}


      {criticalAlerts > 0 && (


        <div


          className="bg-red-600 text-white sticky top-0 z-50 animate-pulse"


          role="alert"


          aria-live="assertive"


          aria-atomic="true"


        >


          <div className="max-w-[1920px] mx-auto px-6 py-3">


            <div className="flex items-center justify-between">


              <div className="flex flex-wrap items-center gap-2 sm:gap-3">


                <AlertTriangle className="w-5 h-5 animate-bounce" aria-hidden="true" />


                <div>


                  <span className="font-semibold">


                    CRITICAL PIPELINE ALERTS REQUIRE IMMEDIATE ACTION


                  </span>


                  <span className="ml-3 text-sm opacity-90">


                    {criticalAlerts} Critical • {warningAlerts} Warning


                  </span>


                </div>


              </div>


            </div>


          </div>


        </div>


      )}





      {/* Header */}


      <div className="bg-white border-b sticky top-0 z-40">


        <div className="max-w-[1920px] mx-auto px-6 py-4">


          <div className="flex items-center justify-between">


            <div>


              <h1 className="text-xl font-semibold text-slate-900">


                Tele Sales Manager - Pipeline Control Tower


              </h1>


              <p className="text-sm text-slate-600 mt-0.5">


                {CURRENT_TSM_NAME} • Revenue Conversion Governance


              </p>


            </div>





            <div className="flex flex-wrap items-center gap-2 sm:gap-4">


              {/* Time Mode Indicator */}


              <div


                className={`${modeInfo.color} text-white px-4 py-2 rounded-lg`}


                aria-label={`Current workflow mode: ${modeInfo.label}. Priority: ${modeInfo.priority}`}


              >


                <div className="flex items-center gap-2">


                  <Clock className="w-4 h-4" aria-hidden="true" />


                  <div>


                    <div className="text-xs font-medium">{modeInfo.label}</div>


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


                <Badge


                  variant="outline"


                  className={`gap-1.5 ${


                    metrics.teamConversionRate >= metrics.teamConversionTarget


                      ? "border-green-600 text-green-700"


                      : "border-red-600 text-red-700"


                  }`}


                >


                  <span className="text-xs">Conversion:</span>


                  {metrics.teamConversionRate.toFixed(1)}%


                </Badge>


                <Badge


                  variant="outline"


                  className={`gap-1.5 ${


                    metrics.slaBreachesToday === 0


                      ? "border-green-600 text-green-700"


                      : metrics.slaBreachesToday <= 5


                      ? "border-amber-600 text-amber-700"


                      : "border-red-600 text-red-700"


                  }`}


                >


                  <span className="text-xs">SLA Breaches:</span>


                  {metrics.slaBreachesToday}


                </Badge>


                <TATNotificationBell role="TSM" employeeId={CURRENT_TSM_ID} />


                {criticalAlerts > 0 && (


                  <Badge


                    variant="destructive"


                    className="gap-1.5 animate-pulse"


                    aria-label={`${criticalAlerts} critical alerts require immediate action`}


                  >


                    <AlertTriangle className="w-3 h-3" aria-hidden="true" />


                    {criticalAlerts} Critical


                  </Badge>


                )}


              </div>


            </div>


          </div>





          {/* Time-based Priority Banner */}


          {timeMode !== "OFF_HOURS" && (


            <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">


              <div className="text-xs text-blue-900">


                <span className="font-semibold">Current Priority:</span> {modeInfo.priority}


              </div>


            </div>


          )}


        </div>


      </div>





      {/* Main Navigation Tabs */}


      <div className="max-w-[1920px] mx-auto px-6 py-6">


        <Tabs value={currentScreen} onValueChange={setCurrentScreen}>


          <TabsList className="grid w-full grid-cols-11 mb-6">


            <TabsTrigger
              value="pool"
              className="gap-2 bg-orange-50 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <span>🎯</span>
              Lead Pool
              {poolLeadCount > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 animate-pulse">
                  {poolLeadCount}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="dashboard"


              className="gap-2"


              aria-label={`Command Dashboard${


                metrics.slaBreachesToday > 5 ? ` - ${metrics.slaBreachesToday} SLA breaches` : ""


              }`}


            >


              <LayoutDashboard className="w-4 h-4" aria-hidden="true" />


              Command Dashboard


              {metrics.slaBreachesToday > 5 && (


                <Badge variant="destructive" className="ml-1 h-5 px-1.5">


                  {metrics.slaBreachesToday}


                </Badge>


              )}


            </TabsTrigger>





            <TabsTrigger value="team" className="gap-2" aria-label="Team Performance">


              <Users className="w-4 h-4" aria-hidden="true" />


              Team Performance


            </TabsTrigger>





            <TabsTrigger


              value="pipeline"


              className="gap-2"


              aria-label={`Lead Pipeline${


                metrics.leadStages.new > 30 ? ` - ${metrics.leadStages.new} new leads` : ""


              }`}


            >


              <FileText className="w-4 h-4" aria-hidden="true" />


              Lead Pipeline


              {metrics.leadStages.new > 30 && (


                <Badge variant="outline" className="ml-1 h-5 px-1.5 text-amber-600 border-amber-600">


                  {metrics.leadStages.new}


                </Badge>


              )}


            </TabsTrigger>
            <TabsTrigger value="reschedules" className="flex items-center gap-1 text-xs">
              🔄 Reschedules
              {rescheduleService.getPendingCount() > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {rescheduleService.getPendingCount()}
                </span>
              )}
            </TabsTrigger>





            <TabsTrigger value="pricing" className="gap-2" aria-label="Pricing Audit">


              <DollarSign className="w-4 h-4" aria-hidden="true" />


              Pricing Audit


            </TabsTrigger>





            <TabsTrigger


              value="renewals"


              className="gap-2"


              aria-label={`Renewals${


                metrics.openAlerts.critical > 0 ? ` - ${metrics.openAlerts.critical} critical alerts` : ""


              }`}


            >


              <RefreshCw className="w-4 h-4" aria-hidden="true" />


              Renewals


              {metrics.openAlerts.critical > 0 && (


                <Badge variant="destructive" className="ml-1 h-5 px-1.5">


                  {metrics.openAlerts.critical}


                </Badge>


              )}


            </TabsTrigger>





            <TabsTrigger value="incentives" className="gap-2" aria-label="Incentive Tracker">


              <Award className="w-4 h-4" aria-hidden="true" />


              Incentive Tracker


            </TabsTrigger>





            <TabsTrigger value="reports" className="gap-2" aria-label="Reports and Analytics">


              <BarChart3 className="w-4 h-4" aria-hidden="true" />


              Reports & Analytics


            </TabsTrigger>





            {/* A4 FIX: Alerts tab so TSM can navigate to full alert list */}


            <TabsTrigger value="cancellations" className="gap-2" aria-label="Cancellations">
              ❌
              <span className="hidden sm:inline">Cancellations</span>
            </TabsTrigger>

            <TabsTrigger value="comp2w" className="gap-2" aria-label="Complimentary 2W">
              🛵
              <span className="hidden sm:inline">2W Offers</span>
            </TabsTrigger>

            <TabsTrigger value="alerts" className="gap-2" aria-label="Alerts">


              <Bell className="w-4 h-4" aria-hidden="true" />


              Alerts


              {criticalAlerts > 0 && (


                <Badge variant="destructive" className="ml-1 h-5 px-1.5 animate-pulse">


                  {criticalAlerts}


                </Badge>


              )}


            </TabsTrigger>



            <TabsTrigger value="retention" className="gap-2">
              <span>📞</span>Upsell
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <span>⚙️</span>Settings
            </TabsTrigger>
            <TabsTrigger value="exit-verify" className="gap-2 relative">
              <span>🚪</span>
              <span className="hidden sm:inline">Exit Verify</span>
              {pendingTSEExits.length > 0 && (
                <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {pendingTSEExits.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>





          {/* Lead Pool — overnight unassigned leads */}
          <TabsContent value="pool" className="mt-0">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Morning Lead Pool</h2>
              <p className="text-sm text-gray-500 mt-1">
                Overnight and unassigned leads waiting to be distributed to your TSEs.
              </p>
            </div>
            <TSMLeadPoolAssignment />
          </TabsContent>

          {/* Screen 1: Command Dashboard (PRIMARY) */}


          <TabsContent value="dashboard" className="mt-0">


            <TSMCommandDashboard


              onDrillIntoStage={(stage) => {


                // A3 FIX: pass stage through so pipeline pre-filters


                setPipelineStageFilter(stage);


                setCurrentScreen("pipeline");


              }}


              onOpenSLABreaches={() => {


                setPipelineStageFilter("BREACHED");


                setCurrentScreen("pipeline");


              }}


              onOpenTeamView={() => {


                setCurrentScreen("team");


              }}


              onOpenAlerts={() => {


                // A4 FIX: navigate to dedicated alerts tab


                setCurrentScreen("alerts");


              }}


            />


          </TabsContent>





          {/* Screen 2: Team Performance */}


          <TabsContent value="team" className="mt-0">


            <TSMTeamPerformance


              onSelectTSE={(tseId: string) => {


                // In production, this would drill down to TSE detail view


                // For now, the selection is handled within the component itself


              }}


            />


          </TabsContent>





          {/* Screen 3: Lead Pipeline & CRM Monitor */}


          <TabsContent value="pipeline" className="mt-0">


            <TSMLeadPipeline initialStageFilter={pipelineStageFilter} />


          </TabsContent>

          {/* Reschedule requests queue */}
          <TabsContent value="reschedules" className="mt-0">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reschedule Requests</h2>
              <p className="text-sm text-gray-500 mt-1">
                Customer requests received via WhatsApp replies or IVR.
              </p>
            </div>
            <RescheduleQueuePanel />
          </TabsContent>





          {/* Screen 4: Pricing Audit */}


          <TabsContent value="pricing" className="mt-0">


            <TSMPricingAudit />


          </TabsContent>





          {/* Screen 5: Renewal Dashboard */}


          <TabsContent value="renewals" className="mt-0">


            <TSMRenewalDashboard />


          </TabsContent>





          {/* Screen 6: Incentive Tracker */}


          <TabsContent value="incentives" className="mt-0">


            <TSMIncentiveTracker />


          </TabsContent>

          <TabsContent value="comp2w" className="mt-0">
            <TSMComplimentary2W />
          </TabsContent>

          <TabsContent value="cancellations" className="mt-0">
            <TSMCancellationQueue />
          </TabsContent>





          {/* Screen 7: Reports & Analytics */}


          <TabsContent value="reports" className="mt-0">


            <TSMReportsAnalytics />


          </TabsContent>





          {/* Screen 8: Alerts — A4 FIX */}


          <TabsContent value="alerts" className="mt-0">


            <div className="space-y-4">


              <h2 className="text-lg font-semibold">All Active Alerts</h2>


              {alerts.length === 0 && (


                <div className="text-gray-500 p-8 text-center">No active alerts</div>


              )}


              {alerts.map(alert => (


                <div key={alert.id} className={`p-4 rounded-lg border-2 ${


                  alert.severity === "CRITICAL" ? "border-red-400 bg-red-50" :


                  alert.severity === "WARNING"  ? "border-amber-400 bg-amber-50" :


                                                  "border-blue-400 bg-blue-50"


                }`}>


                  <div className="flex justify-between items-start">


                    <div>


                      <div className="font-semibold text-gray-900">{alert.title}</div>


                      <div className="text-sm text-gray-700 mt-1">{alert.description}</div>


                      {alert.tseName && <div className="text-xs text-gray-600 mt-1">TSE: {alert.tseName}</div>}


                      <div className="text-xs font-medium mt-2 text-gray-800">Action: {alert.actionRequired}</div>


                    </div>


                    <button


                      className="text-gray-400 hover:text-gray-600 ml-4"


                      onClick={() => {


                        dismissedAlertIds.add(alert.id);


                        setAlerts(alerts.filter(a => a.id !== alert.id));


                      }}


                    >✕</button>


                  </div>


                </div>


              ))}


            </div>


          </TabsContent>



          <TabsContent value="retention" className="mt-0">
            <UpsellTasksPanel cityId={city} />
          </TabsContent>
          <TabsContent value="settings" className="mt-0">
            <TSMSettingsPanel />
          </TabsContent>

          {/* TSE Exit Material Verification */}
          <TabsContent value="exit-verify" className="mt-0 p-4 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">TSE Exit Verifications</h2>
              <p className="text-sm text-gray-500 mt-0.5">Verify items returned by exiting TSE team members</p>
            </div>
            {pendingTSEExits.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl border">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">✅</span>
                </div>
                <p className="font-medium text-gray-700">No pending TSE exit verifications</p>
                <p className="text-sm text-gray-400 mt-1">All material returns are verified</p>
              </div>
            ) : (
              pendingTSEExits.map((exit: any) => {
                const done = exit.materials.filter((m: any) => m.condition !== "Pending").length;
                const total = exit.materials.length;
                return (
                  <div key={exit.id} className="bg-white border border-purple-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-purple-50 px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{exit.employeeName}</p>
                        <p className="text-xs text-gray-500">{exit.empCode} · TSE · Last day: {exit.lastWorkingDate}</p>
                        <p className="text-xs text-gray-400">Reason: {exit.reasonForLeaving}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-700">{done}/{total}</p>
                        <p className="text-xs text-gray-400">verified</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-gray-100">
                      <div className={`h-1.5 ${done === total ? "bg-green-500" : "bg-purple-500"}`} style={{ width: `${total > 0 ? (done/total)*100 : 0}%` }} />
                    </div>
                    <div className="p-4 space-y-2">
                      {exit.materials.map((mat: any) => (
                        <div key={mat.id} className={`rounded-lg border px-3 py-2 flex items-start justify-between ${
                          mat.condition === "Good" ? "bg-green-50 border-green-200" :
                          mat.condition === "Pending" ? "bg-gray-50 border-gray-200" :
                          mat.condition === "Missing" ? "bg-red-50 border-red-200" : "bg-yellow-50 border-yellow-200"
                        }`}>
                          <div className="flex items-center gap-2">
                            <span>{mat.condition === "Good" ? "✅" : mat.condition === "Pending" ? "⏳" : mat.condition === "Missing" ? "❌" : "⚠️"}</span>
                            <div>
                              <p className="text-sm font-medium">{mat.name}</p>
                              {mat.comments && <p className="text-xs text-gray-500">{mat.comments}</p>}
                              {mat.verifiedBy && <p className="text-xs text-gray-400">by {mat.verifiedBy} · {mat.verifiedOn}</p>}
                            </div>
                          </div>
                          {mat.condition === "Pending" && (
                            <div className="flex gap-1 flex-wrap justify-end">
                              {["Good","Minor Damage","Major Damage","Missing"].map(c => (
                                <button key={c} onClick={() => handleTSMMaterialMark(exit.id, mat.id, c)}
                                  className={`text-xs px-2 py-1 rounded border font-medium ${
                                    c === "Good" ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100" :
                                    c === "Minor Damage" ? "bg-yellow-50 text-yellow-700 border-yellow-300 hover:bg-yellow-100" :
                                    c === "Major Damage" ? "bg-orange-50 text-orange-700 border-orange-300 hover:bg-orange-100" :
                                    "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"}`}>
                                  {c === "Minor Damage" ? "Minor" : c === "Major Damage" ? "Major" : c}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-end pt-2">
                        <button
                          disabled={exit.materials.some((m: any) => m.condition === "Pending")}
                          onClick={() => handleTSMCompleteVerification(exit.id)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                            exit.materials.some((m: any) => m.condition === "Pending")
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                        >
                          ✓ Complete Verification
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

        </Tabs>


      </div>





      {/* Global Alert System Overlay */}


      <TSMAlertSystem


        alerts={alerts}


        onDismiss={(alertId) => {


          // A1 FIX: mark as dismissed so reload interval doesn't re-add it


          dismissedAlertIds.add(alertId);


          setAlerts(alerts.filter((a) => a.id !== alertId));


        }}


        onTakeAction={(alertId) => {


          const alert = alerts.find((a) => a.id === alertId);


          if (alert) {


            // Navigate to appropriate screen based on alert type


            if (


              alert.type === "LEAD_NOT_CALLED_10MIN" ||


              alert.type === "CRM_NOT_UPDATED_30MIN" ||


              alert.type === "15_ATTEMPTS_REACHED"


            ) {


              setCurrentScreen("pipeline");


            } else if (alert.type === "EBITDA_BREACH_ATTEMPT") {


              setCurrentScreen("pricing");


            } else if (alert.type === "RENEWAL_DROP") {


              setCurrentScreen("renewals");


            } else if (


              alert.type === "CONVERSION_DROP" ||


              alert.type === "SLA_BREACH_SPIKE"


            ) {


              setCurrentScreen("dashboard");


            }


            // Navigate to alerts tab for general review


            setCurrentScreen("alerts");


          }


        }}


      />


    </div>


  );


}

export default TeleSalesManagerApp;

