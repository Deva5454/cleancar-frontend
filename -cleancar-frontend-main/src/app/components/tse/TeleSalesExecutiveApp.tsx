/**
 * Tele Sales Executive (TSE) - Main Application
 * Web-only interface for sales execution and lead conversion
 *
 * 5 Primary Screens:
 * 1. Lead Queue - Priority-sorted leads with SLA timers
 * 2. Active Call - In-call workspace with pricing engine
 * 3. CRM Update - Mandatory post-call update form
 * 4. Incentive Tracker - Real-time earnings dashboard
 * 5. Renewals - Renewal lead management (optional)
 *
 * Platform: Desktop/Laptop only (1024px+)
 *
 * @component
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Phone,
  Clock,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Users,
  Bell,
  User,
  LogOut,
} from "lucide-react";
import { TSELeadQueue } from "./TSELeadQueue";
import { TSEActiveCall } from "./TSEActiveCall";
import { TSECRMUpdate } from "./TSECRMUpdate";
import { TSEIncentiveTracker } from "./TSEIncentiveTracker";
import { teleSalesExecutiveService } from "../../services/teleSalesExecutiveService";
import type {
  TSELead,
  TSEDailyStats,
  PricingCalculation,
  CRMUpdate,
  TSEAlert,
} from "../../types/teleSalesExecutive.types";
import { DAILY_CALL_TARGET, CONVERSION_TARGETS } from "../../constants/teleSalesExecutive.constants";
import { logger } from "../../services/logger";

type ScreenType = "LEAD_QUEUE" | "ACTIVE_CALL" | "CRM_UPDATE" | "INCENTIVE_TRACKER";
type TabType = "leads" | "incentives";

interface ActiveCallSession {
  lead: TSELead;
  callStartTime: Date;
  notes: string;
  tags: string[];
  pricingData: PricingCalculation;
}

export function TeleSalesExecutiveApp() {
  const [searchParams] = useSearchParams();

  // Initialize screen based on URL tab parameter
  const getInitialScreen = (): ScreenType => {
    const tab = searchParams.get("tab");
    if (tab === "incentives") return "INCENTIVE_TRACKER";
    return "LEAD_QUEUE";
  };

  const [currentScreen, setCurrentScreen] = useState<ScreenType>(getInitialScreen);
  const [activeCallSession, setActiveCallSession] = useState<ActiveCallSession | null>(null);
  const [dailyStats, setDailyStats] = useState<TSEDailyStats | null>(null);
  const [alerts, setAlerts] = useState<TSEAlert[]>([]);
  // A4 FIX: track dismissed IDs in a ref so reload interval doesn't re-show them
  const dismissedAlertIds = useState<Set<string>>(() => new Set())[0];
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update screen when URL tab parameter changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "incentives") {
      setCurrentScreen("INCENTIVE_TRACKER");
    } else if (tab === "leads") {
      setCurrentScreen("LEAD_QUEUE");
    }
  }, [searchParams]);

  // Load daily stats
  useEffect(() => {
    const loadStats = () => {
      const stats = teleSalesExecutiveService.getTodayStats();
      setDailyStats(stats);
    };

    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Load alerts
  useEffect(() => {
    const loadAlerts = () => {
      const activeAlerts = teleSalesExecutiveService.getActiveAlerts();
      // A4 FIX: filter out alerts the user has dismissed this session
      setAlerts(activeAlerts.filter((a) => !a.dismissed && !dismissedAlertIds.has(a.id)));
    };

    loadAlerts();
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle starting a call
  const handleCallLead = (lead: TSELead) => {
    const basePricing = teleSalesExecutiveService.calculatePricingForLead(lead);

    setActiveCallSession({
      lead,
      callStartTime: new Date(),
      notes: "",
      tags: [],
      pricingData: basePricing,
    });
    setCurrentScreen("ACTIVE_CALL");
  };

  // Handle ending a call
  const handleEndCall = (notes: string, tags: string[], pricingData: PricingCalculation) => {
    if (activeCallSession) {
      // A6 FIX: pricingData here is the FINAL state from TSEActiveCall (not the opening pricing)
      // TSEActiveCall passes its latest pricingCalculation state via this callback
      setActiveCallSession({
        ...activeCallSession,
        notes,
        tags,
        pricingData,  // this is now the final, TSE-selected pricing
      });
      setCurrentScreen("CRM_UPDATE");
    }
  };

  // Handle canceling a call — A3 FIX: require confirmation to prevent accidental mid-call cancel
  const handleCancelCall = () => {
    const confirmCancel = window.confirm(
      "Cancel this call? All call notes and pricing selections will be lost."
    );
    if (confirmCancel) {
      setActiveCallSession(null);
      setCurrentScreen("LEAD_QUEUE");
    }
  };

  // Handle CRM update submission
  const handleCRMSubmit = (crmUpdate: CRMUpdate) => {
    if (activeCallSession) {
      // Persist the outcome to the lead cache
      const updates: Partial<TSELead> = {
        status: crmUpdate.outcome as any,
        notes: crmUpdate.notes,
        tags: crmUpdate.tags || [],
      };
      // A1 FIX: followUpDate (Date object) not callbackTime (field doesn't exist on CRMUpdate)
      if (crmUpdate.outcome === "CALLBACK" && crmUpdate.followUpDate) {
        (updates as any).nextFollowUpAt = crmUpdate.followUpDate;
      }
      teleSalesExecutiveService.updateLeadCRM(activeCallSession.lead.id, updates);
      if (crmUpdate.outcome === "CONVERTED") {
        // A2 FIX: finalPrice and dealType come from pricingData, not CRMUpdate (those fields don't exist)
        const finalPrice = activeCallSession.pricingData?.finalPrice ?? 0;
        const dealType   = activeCallSession.pricingData?.dealType   ?? "BASE";
        teleSalesExecutiveService.convertLead(
          activeCallSession.lead.id,
          finalPrice,
          dealType
        );
      } else if (crmUpdate.outcome === "LOST") {
        teleSalesExecutiveService.markLeadLost(
          activeCallSession.lead.id,
          crmUpdate.lostReason || "Not interested"
        );
      }
    }
    logger.log("CRM Update:", crmUpdate);
    // Reset call session and return to lead queue — queue auto-refreshes via interval
    setActiveCallSession(null);
    setCurrentScreen("LEAD_QUEUE");
    toast.success("CRM updated successfully!");
  };

  // Handle CRM update cancel
  const handleCRMCancel = () => {
    const confirmCancel = window.confirm(
      "Are you sure? Call notes will be lost and CRM will remain incomplete."
    );
    if (confirmCancel) {
      setActiveCallSession(null);
      setCurrentScreen("LEAD_QUEUE");
    }
  };

  // Dismiss alert
  const dismissAlert = (alertId: string) => {
    // A4 FIX: persist dismissal in session set so it survives the 30s reload
    dismissedAlertIds.add(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  };

  const getCallsColor = () => {
    if (!dailyStats) return "text-gray-700";
    if (dailyStats.callsMade >= DAILY_CALL_TARGET.IDEAL) return "text-green-700";
    if (dailyStats.callsMade >= DAILY_CALL_TARGET.MIN) return "text-yellow-700";
    return "text-red-700";
  };

  const getConversionColor = () => {
    if (!dailyStats) return "text-gray-700";
    if (dailyStats.conversionRate >= CONVERSION_TARGETS.TARGET) return "text-green-700";
    if (dailyStats.conversionRate >= CONVERSION_TARGETS.MIN) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Tele Sales Executive</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              Web Application
            </Badge>
          </div>

          <div className="flex items-center gap-6">
            {/* Current Time */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="font-mono">
                {currentTime.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>

            {/* Alerts */}
            <div className="relative">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <Badge className="bg-red-600 px-1.5 py-0 text-xs">
                    {alerts.length}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-900 font-medium">TSE User</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {dailyStats && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Calls */}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-600">Calls Today</div>
                  <div className={`text-lg font-bold ${getCallsColor()}`}>
                    {dailyStats.callsMade}/{dailyStats.callsTarget}
                  </div>
                </div>
              </div>

              {/* Conversions */}
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-600">Conversions</div>
                  <div className={`text-lg font-bold ${getConversionColor()}`}>
                    {dailyStats.conversions} ({dailyStats.conversionRate.toFixed(1)}%)
                  </div>
                </div>
              </div>

              {/* Revenue */}
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-600">Revenue Today</div>
                  <div className="text-lg font-bold text-gray-900">
                    ₹{dailyStats.revenueGenerated.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* CRM Compliance */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-600">CRM Compliance</div>
                  <div
                    className={`text-lg font-bold ${
                      dailyStats.crmComplianceRate >= 100
                        ? "text-green-700"
                        : dailyStats.crmComplianceRate >= 95
                        ? "text-yellow-700"
                        : "text-red-700"
                    }`}
                  >
                    {dailyStats.crmComplianceRate.toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* SLA Breaches */}
              {dailyStats.slaBreaches > 0 && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <div>
                    <div className="text-xs text-gray-600">SLA Breaches</div>
                    <div className="text-lg font-bold text-red-700">
                      {dailyStats.slaBreaches}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Screen Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant={currentScreen === "LEAD_QUEUE" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentScreen("LEAD_QUEUE")}
                disabled={currentScreen === "ACTIVE_CALL" || currentScreen === "CRM_UPDATE"}
              >
                Lead Queue
                {dailyStats.leadsInQueue > 0 && (
                  <Badge className="ml-2 bg-blue-600 px-1.5 py-0 text-xs">
                    {dailyStats.leadsInQueue}
                  </Badge>
                )}
              </Button>
              <Button
                variant={currentScreen === "INCENTIVE_TRACKER" ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentScreen("INCENTIVE_TRACKER")}
                disabled={currentScreen === "ACTIVE_CALL" || currentScreen === "CRM_UPDATE"}
              >
                My Incentives
              </Button>
              {/* A5 FIX: Renewals screen was declared but had no nav button */}
              <Button
                variant={currentScreen === ("RENEWALS" as any) ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentScreen("RENEWALS" as any)}
                disabled={currentScreen === "ACTIVE_CALL" || currentScreen === "CRM_UPDATE"}
              >
                Renewals
                {dailyStats && dailyStats.leadsInQueue > 0 && (
                  <Badge className="ml-2 bg-purple-600 px-1.5 py-0 text-xs">
                    {teleSalesExecutiveService.getRenewalLeads().length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Banner */}
      {alerts.length > 0 && currentScreen === "LEAD_QUEUE" && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                {alerts[0].title}
              </span>
              <span className="text-sm text-red-700">— {alerts[0].message}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dismissAlert(alerts[0].id)}
              className="text-red-700 hover:text-red-900"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        {currentScreen === "LEAD_QUEUE" && (
          <TSELeadQueue onCallLead={handleCallLead} />
        )}

        {currentScreen === "ACTIVE_CALL" && activeCallSession && (
          <TSEActiveCall
            lead={activeCallSession.lead}
            onEndCall={handleEndCall}
            onCancel={handleCancelCall}
          />
        )}

        {currentScreen === "CRM_UPDATE" && activeCallSession && (
          <TSECRMUpdate
            lead={activeCallSession.lead}
            callNotes={activeCallSession.notes}
            callTags={activeCallSession.tags}
            pricingData={activeCallSession.pricingData}
            onSubmit={handleCRMSubmit}
            onCancel={handleCRMCancel}
          />
        )}

        {currentScreen === "INCENTIVE_TRACKER" && <TSEIncentiveTracker />}
      </div>
    </div>
  );
}
