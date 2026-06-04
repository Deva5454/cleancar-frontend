/**
 * TSM RENEWAL DASHBOARD
 * Expiring customer tracking and renewal rate monitoring
 *
 * Philosophy: Proactive renewal governance
 * Shows: Expiring customers, renewal rates, upgrade tracking, lapse analysis
 * Purpose: Prevent revenue loss through renewal management
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
  Users,
  Award,
  Filter,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import type { RenewalLead } from "../../types/teleSalesManager.types";

export function TSMRenewalDashboard() {
  const renewals = teleSalesManagerService.getRenewalLeads();
  const metrics = teleSalesManagerService.getRenewalMetrics();
  const [selectedUrgency, setSelectedUrgency] = useState<
    "TODAY" | "2_DAYS" | "7_DAYS" | "LATER" | "ALL"
  >("ALL");
  const [selectedStatus, setSelectedStatus] = useState<
    "PENDING" | "CONTACTED" | "RENEWED" | "UPGRADED" | "LAPSED" | "ALL"
  >("ALL");

  const filteredRenewals = renewals.filter((renewal) => {
    if (selectedUrgency !== "ALL" && renewal.urgency !== selectedUrgency)
      return false;
    if (selectedStatus !== "ALL" && renewal.status !== selectedStatus)
      return false;
    return true;
  });

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "TODAY":
        return { color: "bg-red-600", label: "Expires Today" };
      case "2_DAYS":
        return { color: "bg-amber-600", label: "2 Days" };
      case "7_DAYS":
        return { color: "bg-blue-600", label: "7 Days" };
      case "LATER":
        return { color: "bg-gray-600", label: "Later" };
      default:
        return { color: "bg-gray-600", label: urgency };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return { color: "bg-gray-600", icon: Clock };
      case "CONTACTED":
        return { color: "bg-blue-600", icon: Users };
      case "RENEWED":
        return { color: "bg-green-600", icon: CheckCircle2 };
      case "UPGRADED":
        return { color: "bg-purple-600", icon: TrendingUp };
      case "LAPSED":
        return { color: "bg-red-600", icon: XCircle };
      default:
        return { color: "bg-gray-600", icon: Clock };
    }
  };

  // Renewal summary stats
  const renewalStats = {
    total: renewals.length,
    // F3 FIX: exclude LAPSED from expiring-today count (negative days inflate it)
    expiringToday: renewals.filter((r) => r.urgency === "TODAY" && r.status !== "LAPSED").length,
    expiring2Days: renewals.filter((r) => r.urgency === "2_DAYS").length,
    expiring7Days: renewals.filter((r) => r.urgency === "7_DAYS").length,
    pending: renewals.filter((r) => r.status === "PENDING").length,
    contacted: renewals.filter((r) => r.status === "CONTACTED").length,
    renewed: renewals.filter((r) => r.status === "RENEWED").length,
    upgraded: renewals.filter((r) => r.status === "UPGRADED").length,
    lapsed: renewals.filter((r) => r.status === "LAPSED").length,
    totalValue: renewals.reduce((sum, r) => sum + r.monthlyValue, 0),
  };

  // Calculate renewal rate status
  const renewalGap = metrics.renewalTarget - metrics.renewalRate;
  const renewalStatus =
    metrics.renewalRate >= metrics.renewalTarget
      ? "GREEN"
      : renewalGap <= 5
      ? "AMBER"
      : "RED";

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {renewalStats.expiringToday > 0 && (
        <div className="bg-red-600 text-white p-4 rounded-lg border-2 border-red-700 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-6 h-6 animate-bounce" />
              <div>
                <div className="font-bold text-lg">
                  {renewalStats.expiringToday} Customer
                  {renewalStats.expiringToday > 1 ? "s" : ""} Expire Today
                </div>
                <div className="text-sm opacity-90">
                  Immediate action required to prevent lapse
                </div>
              </div>
            </div>
            <Button
              onClick={() => setSelectedUrgency("TODAY")}
              className="bg-white text-red-600 hover:bg-red-50 font-semibold"
            >
              View Expiring Today
            </Button>
          </div>
        </div>
      )}

      {/* Renewal Metrics Header */}
      <div className="grid grid-cols-5 gap-4">
        {/* Renewal Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-500">Renewal Rate</div>
            <Badge
              className={
                renewalStatus === "GREEN"
                  ? "bg-green-600"
                  : renewalStatus === "AMBER"
                  ? "bg-amber-600"
                  : "bg-red-600"
              }
            >
              {renewalStatus}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.renewalRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Target: {metrics.renewalTarget}%
          </div>
          {renewalGap > 0 && (
            <div className="text-xs text-red-600 font-medium mt-1">
              -{renewalGap.toFixed(1)}% gap
            </div>
          )}
        </Card>

        {/* Expiring Today */}
        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <div className="text-xs text-gray-600 mb-2">Expiring Today</div>
          <div className="text-2xl font-bold text-red-600">
            {metrics.expiringToday}
          </div>
          <div className="text-xs text-gray-600 mt-1">Require immediate action</div>
        </Card>

        {/* Expiring 2 Days */}
        <Card className="p-4 border-2 border-amber-200 bg-amber-50">
          <div className="text-xs text-gray-600 mb-2">Expiring in 2 Days</div>
          <div className="text-2xl font-bold text-amber-600">
            {metrics.expiring2Days}
          </div>
          <div className="text-xs text-gray-600 mt-1">High priority contact</div>
        </Card>

        {/* Upgrade Conversions */}
        <Card className="p-4 border-2 border-purple-200 bg-purple-50">
          <div className="text-xs text-gray-600 mb-2">Upgrade Conversions</div>
          <div className="text-2xl font-bold text-purple-600">
            {metrics.upgradeConversions}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            Additional revenue generated
          </div>
        </Card>

        {/* Lapsed Count */}
        <Card className="p-4 border-2 border-gray-200">
          <div className="text-xs text-gray-600 mb-2">Lapsed This Month</div>
          <div className="text-2xl font-bold text-red-600">
            {metrics.lapsedCount}
          </div>
          <div className="text-xs text-gray-600 mt-1">Revenue loss impact</div>
        </Card>
      </div>

      {/* Lapsed Reasons Breakdown */}
      {metrics.lapsedReasons.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Top Lapse Reasons (This Month)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {metrics.lapsedReasons.map((reason, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-sm font-medium text-gray-900">
                  {reason.reason}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-xl font-bold text-red-600">
                    {reason.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {reason.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Urgency:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedUrgency === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUrgency("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedUrgency === "TODAY" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUrgency("TODAY")}
                className={selectedUrgency === "TODAY" ? "bg-red-600" : ""}
              >
                Today ({renewalStats.expiringToday})
              </Button>
              <Button
                variant={selectedUrgency === "2_DAYS" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUrgency("2_DAYS")}
                className={selectedUrgency === "2_DAYS" ? "bg-amber-600" : ""}
              >
                2 Days ({renewalStats.expiring2Days})
              </Button>
              <Button
                variant={selectedUrgency === "7_DAYS" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedUrgency("7_DAYS")}
              >
                7 Days ({renewalStats.expiring7Days})
              </Button>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-600">Status:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedStatus === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === "PENDING" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("PENDING")}
              >
                Pending ({renewalStats.pending})
              </Button>
              <Button
                variant={selectedStatus === "RENEWED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("RENEWED")}
                className={selectedStatus === "RENEWED" ? "bg-green-600" : ""}
              >
                Renewed ({renewalStats.renewed})
              </Button>
              <Button
                variant={selectedStatus === "LAPSED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("LAPSED")}
                className={selectedStatus === "LAPSED" ? "bg-red-600" : ""}
              >
                Lapsed ({renewalStats.lapsed})
              </Button>
            </div>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredRenewals.length} of {renewalStats.total} renewals
          </div>
        </div>
      </Card>

      {/* Renewal List */}
      <div className="space-y-3">
        {filteredRenewals.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              No renewals match the selected filters
            </div>
          </Card>
        )}

        {filteredRenewals.map((renewal) => {
          const urgencyBadge = getUrgencyBadge(renewal.urgency);
          const statusBadge = getStatusBadge(renewal.status);
          const StatusIcon = statusBadge.icon;

          return (
            <Card
              key={renewal.id}
              className={`p-4 ${
                renewal.urgency === "TODAY" && renewal.status === "PENDING"
                  ? "border-2 border-red-300 bg-red-50"
                  : renewal.urgency === "2_DAYS" && renewal.status === "PENDING"
                  ? "border-2 border-amber-300 bg-amber-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Renewal Info */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {renewal.customerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      Customer ID: {renewal.customerId}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Assigned to: {renewal.tseName}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={urgencyBadge.color}>
                      <Clock className="w-3 h-3 mr-1" />
                      {urgencyBadge.label}
                    </Badge>
                    <Badge className={statusBadge.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {renewal.status}
                    </Badge>
                    {renewal.upgraded && (
                      <Badge className="bg-purple-600">
                        <Award className="w-3 h-3 mr-1" />
                        Upgraded
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Renewal Metrics */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Current Plan</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {renewal.currentPlan}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Monthly Value</div>
                    <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ₹{(renewal.monthlyValue / 1000).toFixed(1)}K
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Expiry Date</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(renewal.expiryDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Days Until Expiry</div>
                    <div
                      className={`text-lg font-bold ${
                        renewal.daysUntilExpiry === 0
                          ? "text-red-600"
                          : renewal.daysUntilExpiry <= 2
                          ? "text-amber-600"
                          : "text-gray-900"
                      }`}
                    >
                      {renewal.daysUntilExpiry}
                    </div>
                  </div>

                  {renewal.renewalValue && (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Renewal Value</div>
                      <div
                        className={`text-sm font-semibold ${
                          renewal.upgraded ? "text-purple-600" : "text-green-600"
                        }`}
                      >
                        ₹{(renewal.renewalValue / 1000).toFixed(1)}K
                      </div>
                      {renewal.upgraded && (
                        <div className="text-xs text-purple-600">
                          +
                          {(
                            ((renewal.renewalValue - renewal.monthlyValue) /
                              renewal.monthlyValue) *
                            100
                          ).toFixed(0)}
                          % uplift
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* F4 FIX: Action buttons added — was read-only */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline"
                    disabled={renewal.status === "RENEWED" || renewal.status === "UPGRADED" || renewal.status === "LAPSED"}
                    onClick={() => {
                      const note = window.prompt(`Mark ${renewal.customerName} as Contacted?\nAdd note:`, "Called — follow-up scheduled");
                      if (note) alert(`Marked Contacted: ${note}`);
                    }}>
                    Mark Contacted
                  </Button>
                  {(renewal.status === "PENDING" || renewal.status === "CONTACTED") && (
                    <Button size="sm" variant="outline"
                      onClick={() => {
                        const newTSE = window.prompt(`Reassign ${renewal.customerName} to TSE:`, renewal.assignedTSE);
                        if (newTSE) alert(`Reassigned to ${newTSE}`);
                      }}>
                      Reassign
                    </Button>
                  )}
                </div>
              </div>

              {/* Lapsed Reason */}
              {renewal.status === "LAPSED" && renewal.lapsedReason && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-900">
                      Lapsed Reason:
                    </span>
                    <span className="text-gray-700">{renewal.lapsedReason}</span>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Renewal Performance Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Renewal Performance Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">Total Renewal Pipeline</div>
            <div className="text-2xl font-bold text-gray-900">
              {renewalStats.total}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              ₹{(renewalStats.totalValue / 100000).toFixed(1)}L monthly value
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {renewalStats.renewed + renewalStats.upgraded > 0
                ? (
                    ((renewalStats.renewed + renewalStats.upgraded) /
                      (renewalStats.renewed +
                        renewalStats.upgraded +
                        renewalStats.lapsed)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {renewalStats.renewed + renewalStats.upgraded} won vs{" "}
              {renewalStats.lapsed} lost
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Upgrade Rate</div>
            <div className="text-2xl font-bold text-purple-600">
              {renewalStats.renewed + renewalStats.upgraded > 0
                ? (
                    (renewalStats.upgraded /
                      (renewalStats.renewed + renewalStats.upgraded)) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {renewalStats.upgraded} upgraded renewals
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Pending Action</div>
            <div className="text-2xl font-bold text-amber-600">
              {renewalStats.pending + renewalStats.contacted}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              Require TSE follow-up
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
