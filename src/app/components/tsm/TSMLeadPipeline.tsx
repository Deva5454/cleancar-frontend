/**
 * TSM LEAD PIPELINE & CRM MONITOR
 * Lead stage tracking, SLA monitoring, and CRM compliance oversight
 *
 * Philosophy: Pipeline governance, not lead execution
 * Shows: Stage status, SLA health, assignment distribution
 * Actions: Reassign leads, approve lost leads (governance only)
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Phone,
  RefreshCw,
} from "lucide-react";
import { teleSalesManagerService } from "../../services/teleSalesManagerService";
import type { Lead, LeadStage, LeadSource } from "../../types/teleSalesManager.types";

interface TSMLeadPipelineProps {
  initialStageFilter?: string;
}

export function TSMLeadPipeline({ initialStageFilter = "ALL" }: TSMLeadPipelineProps) {
  // A3 FIX: accept initialStageFilter from parent drill-down
  const [selectedStage, setSelectedStage] = useState<LeadStage | "ALL">(
    (initialStageFilter as LeadStage | "ALL") || "ALL"
  );
  const [selectedSLA, setSelectedSLA] = useState<"MET" | "AT_RISK" | "BREACHED" | "ALL">("ALL");
  // D3 FIX: date range filter (was declared in type but never implemented)
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [leads, setLeads] = useState(teleSalesManagerService.getLeadPipeline());

  const filteredLeads = leads.filter((lead) => {
    if (selectedStage !== "ALL" && lead.stage !== selectedStage) return false;
    if (selectedSLA !== "ALL" && lead.slaStatus !== selectedSLA) return false;
    // D3 FIX: apply date range filter
    if (dateFrom && new Date(lead.createdAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(lead.createdAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  });

  const getStageBadgeColor = (stage: LeadStage) => {
    switch (stage) {
      case "NEW":
        return "bg-blue-600";
      case "ATTEMPTED":
        return "bg-purple-600";
      case "FOLLOW_UP":
        return "bg-indigo-600";
      case "CONVERTED":
        return "bg-green-600";
      case "LOST":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSLABadgeColor = (slaStatus: string) => {
    switch (slaStatus) {
      case "MET":
        return "bg-green-600";
      case "AT_RISK":
        return "bg-amber-600";
      case "BREACHED":
        return "bg-red-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSourceBadge = (source: LeadSource) => {
    const colors: Record<LeadSource, string> = {
      WEBSITE: "bg-blue-100 text-blue-700 border-blue-300",
      REFERRAL: "bg-purple-100 text-purple-700 border-purple-300",
      MARKETING: "bg-pink-100 text-pink-700 border-pink-300",
      WALK_IN: "bg-green-100 text-green-700 border-green-300",
      OTHER: "bg-gray-100 text-gray-700 border-gray-300",
    };
    return colors[source];
  };

  const handleReassignLead = (leadId: string, toTSEId: string, reason: string) => {
    // D1 FIX: service returns void — always refresh (was checking undefined as truthy)
    teleSalesManagerService.reassignLead(leadId, toTSEId, reason);
    setLeads(teleSalesManagerService.getLeadPipeline());
  };

  const handleApproveLost = (leadId: string, reason: string) => {
    // D2 FIX: correct arg order — service is approveLostLead(leadId, tsmId, notes)
    // was called as (leadId, reason, "TSM-001") — reason was used as tsmId
    teleSalesManagerService.approveLostLead(leadId, "TSM-001", reason);
    setLeads(teleSalesManagerService.getLeadPipeline());
  };

  // Pipeline summary stats
  const pipelineStats = {
    total: leads.length,
    new: leads.filter((l) => l.stage === "NEW").length,
    attempted: leads.filter((l) => l.stage === "ATTEMPTED").length,
    followUp: leads.filter((l) => l.stage === "FOLLOW_UP").length,
    converted: leads.filter((l) => l.stage === "CONVERTED").length,
    lost: leads.filter((l) => l.stage === "LOST").length,
    slaBreached: leads.filter((l) => l.slaStatus === "BREACHED").length,
    slaAtRisk: leads.filter((l) => l.slaStatus === "AT_RISK").length,
    crmNonCompliant: leads.filter((l) => !l.crmCompliant).length,
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Stats */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="text-xs text-gray-500 mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-gray-900">
            {pipelineStats.total}
          </div>
        </Card>
        <Card className="p-4 border-2 border-blue-200 bg-blue-50">
          <div className="text-xs text-gray-600 mb-1">New</div>
          <div className="text-2xl font-bold text-blue-600">
            {pipelineStats.new}
          </div>
        </Card>
        <Card className="p-4 border-2 border-purple-200 bg-purple-50">
          <div className="text-xs text-gray-600 mb-1">Attempted</div>
          <div className="text-2xl font-bold text-purple-600">
            {pipelineStats.attempted}
          </div>
        </Card>
        <Card className="p-4 border-2 border-indigo-200 bg-indigo-50">
          <div className="text-xs text-gray-600 mb-1">Follow-up</div>
          <div className="text-2xl font-bold text-indigo-600">
            {pipelineStats.followUp}
          </div>
        </Card>
        <Card className="p-4 border-2 border-red-200 bg-red-50">
          <div className="text-xs text-gray-600 mb-1">SLA Breached</div>
          <div className="text-2xl font-bold text-red-600">
            {pipelineStats.slaBreached}
          </div>
        </Card>
        <Card className="p-4 border-2 border-amber-200 bg-amber-50">
          <div className="text-xs text-gray-600 mb-1">CRM Non-Compliant</div>
          <div className="text-2xl font-bold text-amber-600">
            {pipelineStats.crmNonCompliant}
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

          {/* Stage Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Stage:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedStage === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedStage === "NEW" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("NEW")}
              >
                New ({pipelineStats.new})
              </Button>
              <Button
                variant={selectedStage === "ATTEMPTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("ATTEMPTED")}
              >
                Attempted ({pipelineStats.attempted})
              </Button>
              <Button
                variant={selectedStage === "FOLLOW_UP" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("FOLLOW_UP")}
              >
                Follow-up ({pipelineStats.followUp})
              </Button>
              {/* D7 FIX: CONVERTED and LOST filter buttons were missing */}
              <Button
                variant={selectedStage === "CONVERTED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("CONVERTED")}
                className={selectedStage === "CONVERTED" ? "bg-green-600" : ""}
              >
                Converted ({pipelineStats.converted})
              </Button>
              <Button
                variant={selectedStage === "LOST" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStage("LOST")}
                className={selectedStage === "LOST" ? "bg-red-600" : ""}
              >
                Lost ({pipelineStats.lost})
              </Button>
            </div>
          </div>

          {/* SLA Filter */}
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-600">SLA:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedSLA === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("ALL")}
              >
                All
              </Button>
              <Button
                variant={selectedSLA === "BREACHED" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("BREACHED")}
                className={selectedSLA === "BREACHED" ? "bg-red-600" : ""}
              >
                Breached ({pipelineStats.slaBreached})
              </Button>
              <Button
                variant={selectedSLA === "AT_RISK" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSLA("AT_RISK")}
                className={selectedSLA === "AT_RISK" ? "bg-amber-600" : ""}
              >
                At Risk ({pipelineStats.slaAtRisk})
              </Button>
            </div>
          </div>

          {/* D3 FIX: date range filter */}
          <div className="flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-600">From:</span>
            <input type="date" value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1" />
            <span className="text-xs text-gray-600">To:</span>
            <input type="date" value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1" />
            {(dateFrom || dateTo) && (
              <button className="text-xs text-red-600 underline"
                onClick={() => { setDateFrom(""); setDateTo(""); }}>
                Clear
              </button>
            )}
          </div>
          <div className="ml-auto text-sm text-gray-600">
            Showing {filteredLeads.length} of {pipelineStats.total} leads
          </div>
        </div>
      </Card>

      {/* Lead List */}
      <div className="space-y-3">
        {filteredLeads.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-gray-500">No leads match the selected filters</div>
          </Card>
        )}

        {filteredLeads.map((lead) => (
          <Card
            key={lead.id}
            className={`p-4 ${
              lead.slaStatus === "BREACHED"
                ? "border-2 border-red-300 bg-red-50"
                : lead.slaStatus === "AT_RISK"
                ? "border-2 border-amber-300 bg-amber-50"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Lead Info */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div>
                  <div className="font-semibold text-gray-900">
                    {lead.customerName}
                  </div>
                  <div className="text-sm text-gray-600">{lead.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lead ID: {lead.id}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className={getStageBadgeColor(lead.stage)}>
                    {lead.stage.replace("_", " ")}
                  </Badge>
                  <Badge className={getSLABadgeColor(lead.slaStatus)}>
                    {lead.slaStatus === "BREACHED" && (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {lead.slaStatus === "AT_RISK" && (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {lead.slaStatus === "MET" && (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    )}
                    SLA {lead.slaStatus}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={getSourceBadge(lead.source)}
                  >
                    {lead.source}
                  </Badge>
                  {!lead.crmCompliant && (
                    <Badge className="bg-amber-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      CRM Issue
                    </Badge>
                  )}
                </div>
              </div>

              {/* Lead Metrics */}
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {lead.tseName}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Attempts</div>
                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {lead.attemptCount}
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Est. Value</div>
                  <div className="text-sm font-semibold text-green-600">
                    ₹{(lead.estimatedValue / 1000).toFixed(0)}K
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-gray-500">Created</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(lead.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* D6 FIX: compute SLA countdown live from createdAt + 10min threshold */}
                {(() => {
                  const deadlineMs = new Date(lead.createdAt).getTime() + 10 * 60 * 1000;
                  const minsLeft = Math.floor((deadlineMs - Date.now()) / 60000);
                  if (lead.slaStatus === "MET" && minsLeft > 30) return null;
                  return (
                    <div className="text-center">
                      <div className="text-xs text-gray-500">SLA Remaining</div>
                      <div className={`text-sm font-semibold ${
                        minsLeft < 0 ? "text-red-600" : minsLeft < 60 ? "text-amber-600" : "text-green-600"
                      }`}>
                        {minsLeft < 0 ? `${Math.abs(minsLeft)}m overdue` : `${minsLeft}m left`}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {lead.stage === "LOST" && !lead.approvedBy && (
                  // D5 FIX: require confirmation with reason before approving lost
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt(
                        `Approve LOST for ${lead.customerName}?\nEnter/confirm reason:`,
                        lead.lostReason || "Price too high"
                      );
                      if (reason) handleApproveLost(lead.id, reason);
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Approve Lost
                  </Button>
                )}

                {lead.attemptCount >= 10 && lead.stage !== "CONVERTED" && (
                  // D4 FIX: prompt for target TSE instead of hardcoding TSE-002
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const targetTSE = window.prompt(
                        `Reassign ${lead.customerName} to which TSE?\n(TSE-001 Rahul / TSE-002 Priya / TSE-003 Amit / TSE-004 Sneha / TSE-005 Karan)`,
                        "TSE-002"
                      );
                      if (targetTSE) handleReassignLead(lead.id, targetTSE.trim(), `TSM reassignment: high attempt count (${lead.attemptCount})`);
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Reassign
                  </Button>
                )}

                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>

            {/* Additional Info Row */}
            {(lead.lastContactedAt || lead.nextFollowUpDate || lead.lostReason) && (
              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-6 text-xs text-gray-600">
                {lead.lastContactedAt && (
                  <div>
                    Last Contact:{" "}
                    {new Date(lead.lastContactedAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                {lead.nextFollowUpDate && (
                  <div>
                    Next Follow-up:{" "}
                    {new Date(lead.nextFollowUpDate).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
                {lead.lostReason && (
                  <div className="text-red-600">
                    Lost Reason: {lead.lostReason}
                  </div>
                )}
                {lead.approvedBy && (
                  <div className="text-green-600">
                    Approved by: {lead.approvedBy}
                  </div>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
