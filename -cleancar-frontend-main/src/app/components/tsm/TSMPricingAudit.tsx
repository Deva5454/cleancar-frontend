/**
 * TSM PRICING AUDIT LOG
 * EBITDA tracking and pricing discipline monitoring
 *
 * Philosophy: Revenue quality governance, not pricing control
 * Shows: EBITDA percentages, system blocks, override approvals
 * Purpose: Ensure healthy margins and pricing discipline
 */

import { useState, useCallback } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Shield,
  TrendingDown,
  Filter,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import type { DealType, PricingAuditEntry } from "../../types/teleSalesManager.types";

export function TSMPricingAudit() {
  const auditLog = teleSalesManagerService.getPricingAuditLog();
  const [selectedDealType, setSelectedDealType] = useState<DealType | "ALL">("ALL");
  // E2+E3 FIX: detail/flag state — View Details was dead button
  const [detailEntry, setDetailEntry] = useState<typeof auditLog[0] | null>(null);
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set());

  const handleFlagAnomaly = useCallback((entryId: string, tseId: string) => {
    const reason = window.prompt("Enter reason for flagging this pricing anomaly:");
    if (reason) {
      teleSalesManagerService.flagPricingAnomaly(entryId, tseId, reason);
      setFlaggedIds(prev => new Set([...prev, entryId]));
      alert(`Anomaly flagged. Audit entry ${entryId} has been marked for review.`);
    }
  }, []);
  const [selectedEBITDAStatus, setSelectedEBITDAStatus] = useState<
    "HEALTHY" | "WARNING" | "CRITICAL" | "ALL"
  >("ALL");

  const filteredAudit = auditLog.filter((entry) => {
    if (selectedDealType !== "ALL" && entry.dealType !== selectedDealType)
      return false;
    if (
      selectedEBITDAStatus !== "ALL" &&
      entry.ebitdaStatus !== selectedEBITDAStatus
    )
      return false;
    return true;
  });

  const getDealTypeBadge = (dealType: DealType) => {
    const badges: Record<DealType, { color: string; label: string }> = {
      BASE: { color: "bg-blue-600", label: "Base" },
      ADD_ON: { color: "bg-green-600", label: "Add-On" },
      BUNDLE_MID: { color: "bg-purple-600", label: "Bundle MID" },
      BUNDLE_LOW: { color: "bg-red-600", label: "Bundle LOW" },
    };
    return badges[dealType];
  };

  const getEBITDAStatusColor = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return "text-green-600";
      case "WARNING":
        return "text-amber-600";
      case "CRITICAL":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  // Audit summary stats
  const auditStats = {
    totalDeals: auditLog.length,
    totalValue: auditLog.reduce((sum, e) => sum + e.dealValue, 0),
    avgEBITDA:
      auditLog.reduce((sum, e) => sum + e.ebitdaPercentage, 0) /
      auditLog.length,
    healthyCount: auditLog.filter((e) => e.ebitdaStatus === "HEALTHY").length,
    warningCount: auditLog.filter((e) => e.ebitdaStatus === "WARNING").length,
    criticalCount: auditLog.filter((e) => e.ebitdaStatus === "CRITICAL").length,
    blockedDeals: auditLog.filter((e) => e.systemBlockEvent).length,
    overrideApprovals: auditLog.filter((e) => e.overrideApproved).length,
    addOnUsage: auditLog.filter((e) => e.addOnUsed).length,
  };

  return (
    <div className="space-y-6">
      {/* Critical Alert Banner */}
      {auditStats.criticalCount > 0 && (
        <div className="bg-red-600 text-white p-4 rounded-lg border-2 border-red-700">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-6 h-6" />
            <div>
              <div className="font-bold text-lg">
                {auditStats.criticalCount} Critical EBITDA Breaches Detected
              </div>
              <div className="text-sm opacity-90">
                Deals closed below minimum margin threshold - review pricing
                discipline
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Summary Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Total Deals</div>
          <div className="text-2xl font-bold text-gray-900">
            {auditStats.totalDeals}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            ₹{(auditStats.totalValue / 100000).toFixed(1)}L value
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Avg EBITDA</div>
          <div
            className={`text-2xl font-bold ${
              auditStats.avgEBITDA >= 35
                ? "text-green-600"
                : auditStats.avgEBITDA >= 20
                ? "text-amber-600"
                : "text-red-600"
            }`}
          >
            {auditStats.avgEBITDA.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">Floor: 30%+ (Healthy: 35%+)</div>
        </Card>

        <Card className="p-4 border-2 border-green-200 bg-green-50">
          <div className="text-xs text-gray-600 mb-1">Healthy</div>
          <div className="text-2xl font-bold text-green-600">
            {auditStats.healthyCount}
          </div>
          <div className="text-xs text-gray-600 mt-1">EBITDA ≥35% (healthy — floor is 30%)</div>
        </Card>

        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <div className="text-xs text-gray-600 mb-1">Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {auditStats.criticalCount}
          </div>
          <div className="text-xs text-gray-600 mt-1">EBITDA &lt;30% (below 30% floor)</div>
        </Card>

        <Card className="p-4 border-2 border-purple-200 bg-purple-50">
          <div className="text-xs text-gray-600 mb-1">System Blocks</div>
          <div className="text-2xl font-bold text-purple-600">
            {auditStats.blockedDeals}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {auditStats.overrideApprovals} approved
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>

          {/* Deal Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Deal Type:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedDealType === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDealType("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedDealType === "BASE" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDealType("BASE")}
              >
                Base
              </Button>
              <Button
                variant={selectedDealType === "ADD_ON" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDealType("ADD_ON")}
              >
                Add-On
              </Button>
              <Button
                variant={selectedDealType === "BUNDLE_MID" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDealType("BUNDLE_MID")}
              >
                Bundle MID
              </Button>
              <Button
                variant={selectedDealType === "BUNDLE_LOW" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDealType("BUNDLE_LOW")}
              >
                Bundle LOW
              </Button>
            </div>
          </div>

          {/* EBITDA Status Filter */}
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-600">EBITDA Status:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedEBITDAStatus === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedEBITDAStatus("ALL")}
              >
                All
              </Button>
              <Button
                variant={
                  selectedEBITDAStatus === "CRITICAL" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedEBITDAStatus("CRITICAL")}
                className={selectedEBITDAStatus === "CRITICAL" ? "bg-red-600" : ""}
              >
                Critical ({auditStats.criticalCount})
              </Button>
              <Button
                variant={
                  selectedEBITDAStatus === "WARNING" ? "default" : "outline"
                }
                size="sm"
                onClick={() => setSelectedEBITDAStatus("WARNING")}
                className={
                  selectedEBITDAStatus === "WARNING" ? "bg-amber-600" : ""
                }
              >
                Warning ({auditStats.warningCount})
              </Button>
            </div>
          </div>

          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredAudit.length} of {auditStats.totalDeals} deals
          </div>
        </div>
      </Card>

      {/* Audit Log Entries */}
      <div className="space-y-3">
        {filteredAudit.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">
              No audit entries match the selected filters
            </div>
          </Card>
        )}

        {filteredAudit.map((entry) => {
          const dealBadge = getDealTypeBadge(entry.dealType);
          return (
            <Card
              key={entry.id}
              className={`p-4 ${
                entry.ebitdaStatus === "CRITICAL"
                  ? "border-2 border-red-300 bg-red-50"
                  : entry.systemBlockEvent && !entry.overrideApproved
                  ? "border-2 border-purple-300 bg-purple-50"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Entry Info */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {entry.customerName}
                    </div>
                    <div className="text-sm text-gray-600">
                      TSE: {entry.tseName}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Lead ID: {entry.leadId}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={dealBadge.color}>{dealBadge.label}</Badge>
                    {entry.addOnUsed && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Add-On Used
                      </Badge>
                    )}
                    {entry.systemBlockEvent && (
                      <Badge className="bg-purple-600">
                        <Shield className="w-3 h-3 mr-1" />
                        System Block
                      </Badge>
                    )}
                    {entry.overrideApproved && (
                      <Badge className="bg-amber-600">
                        Override Approved
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Pricing Metrics */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500">Deal Value</div>
                    <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ₹{(entry.dealValue / 1000).toFixed(0)}K
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">EBITDA</div>
                    <div
                      className={`text-lg font-bold ${getEBITDAStatusColor(
                        entry.ebitdaStatus
                      )}`}
                    >
                      {entry.ebitdaPercentage.toFixed(1)}%
                    </div>
                    {entry.ebitdaStatus === "CRITICAL" && (
                      <div className="flex items-center gap-1 text-xs text-red-600">
                        <TrendingDown className="w-3 h-3" />
                        Below minimum
                      </div>
                    )}
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Status</div>
                    <Badge
                      className={
                        entry.ebitdaStatus === "HEALTHY"
                          ? "bg-green-600"
                          : entry.ebitdaStatus === "WARNING"
                          ? "bg-amber-600"
                          : "bg-red-600"
                      }
                    >
                      {entry.ebitdaStatus}
                    </Badge>
                  </div>

                  <div className="text-center">
                    <div className="text-xs text-gray-500">Closed</div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(entry.closedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {/* E2 FIX: View Details now opens detail panel */}
                  <Button size="sm" variant="outline"
                    onClick={() => setDetailEntry(entry)}>
                    View Details
                  </Button>
                  {/* E3 FIX: Flag anomaly now has state + service call */}
                  <Button size="sm" variant="outline"
                    className={flaggedIds.has(entry.id) ? "border-red-400 text-red-600" : ""}
                    onClick={() => handleFlagAnomaly(entry.id, entry.tseId)}>
                    {flaggedIds.has(entry.id) ? "⚑ Flagged" : "Flag"}
                  </Button>
                </div>
              </div>

              {/* Additional Info Row */}
              {(entry.blockReason ||
                entry.approvedBy ||
                entry.flags.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-1">
                    {entry.systemBlockEvent && entry.blockReason && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">
                          Block Reason:
                        </span>
                        <span className="text-gray-700">{entry.blockReason}</span>
                      </div>
                    )}
                    {entry.overrideApproved && entry.approvedBy && (
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">
                          Override Approved By:
                        </span>
                        <span className="text-gray-700">{entry.approvedBy}</span>
                      </div>
                    )}
                    {entry.flags.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                        <div>
                          <span className="font-medium text-amber-900">
                            Flags:
                          </span>
                          <div className="flex gap-2 mt-1">
                            {entry.flags.map((flag, idx) => (
                              <Badge
                                key={idx}
                                variant="outline"
                                className="bg-amber-50 text-amber-700 border-amber-300"
                              >
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Pricing Discipline Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Pricing Discipline Summary
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div>
            <div className="text-xs text-gray-500 mb-1">Add-On Usage Rate</div>
            <div className="text-2xl font-bold text-green-600">
              {((auditStats.addOnUsage / auditStats.totalDeals) * 100).toFixed(
                1
              )}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {auditStats.addOnUsage} of {auditStats.totalDeals} deals
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">System Block Rate</div>
            <div className="text-2xl font-bold text-purple-600">
              {((auditStats.blockedDeals / auditStats.totalDeals) * 100).toFixed(
                1
              )}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {auditStats.blockedDeals} blocked deals
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Override Approval Rate</div>
            <div className="text-2xl font-bold text-amber-600">
              {auditStats.blockedDeals > 0
                ? (
                    (auditStats.overrideApprovals / auditStats.blockedDeals) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {auditStats.overrideApprovals} of {auditStats.blockedDeals} blocks
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">
              Healthy EBITDA Rate
            </div>
            <div className="text-2xl font-bold text-green-600">
              {((auditStats.healthyCount / auditStats.totalDeals) * 100).toFixed(
                1
              )}
              %
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {auditStats.healthyCount} healthy deals
            </div>
          </div>
        </div>
      </Card>
      {/* E2 FIX: Detail modal */}
      {detailEntry && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
          onClick={() => setDetailEntry(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold">Pricing Audit Detail</h3>
              <button onClick={() => setDetailEntry(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium text-gray-600">Customer:</span> {detailEntry.customerName}</div>
              <div><span className="font-medium text-gray-600">TSE:</span> {detailEntry.tseName} ({detailEntry.tseId})</div>
              <div><span className="font-medium text-gray-600">Deal Type:</span> {detailEntry.dealType}</div>
              <div><span className="font-medium text-gray-600">Deal Value:</span> ₹{detailEntry.dealValue.toLocaleString()}</div>
              <div><span className="font-medium text-gray-600">EBITDA:</span>
                <span className={detailEntry.ebitdaPercentage >= 30 ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
                  {" "}{detailEntry.ebitdaPercentage.toFixed(1)}%
                  {detailEntry.ebitdaPercentage < 30 && " ⚠ Below 30% floor"}
                </span>
              </div>
              <div><span className="font-medium text-gray-600">Add-On Used:</span> {detailEntry.addOnUsed ? "Yes" : "No"}</div>
              <div><span className="font-medium text-gray-600">System Block:</span> {detailEntry.systemBlockEvent ? "Yes" : "No"}</div>
              {detailEntry.blockReason && <div><span className="font-medium text-gray-600">Block Reason:</span> {detailEntry.blockReason}</div>}
              {detailEntry.overrideApproved && <div className="text-amber-700 font-medium">Override approved by: {detailEntry.approvedBy}</div>}
              {detailEntry.flags.length > 0 && (
                <div><span className="font-medium text-gray-600">Flags:</span> {detailEntry.flags.join(", ")}</div>
              )}
              <div><span className="font-medium text-gray-600">Closed:</span> {new Date(detailEntry.closedAt).toLocaleString()}</div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleFlagAnomaly(detailEntry.id, detailEntry.tseId)}
                className="bg-red-600 text-white">Flag Anomaly</Button>
              <Button size="sm" variant="outline" onClick={() => setDetailEntry(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
