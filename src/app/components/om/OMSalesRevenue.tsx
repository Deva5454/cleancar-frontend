/**
 * OPERATIONS MANAGER: SALES & REVENUE DASHBOARD
 * Pipeline management with strict pricing control
 * Discount authority enforcement + Management visibility
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { DollarSign, TrendingUp, Users, Eye, MapPin, Phone, Mail, Calendar, Tag, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { DISCOUNT_LIMITS, PIPELINE_RULES } from "../../constants/operationsManager.constants";
import { OMLeadLostReasonModal, type LostReasonData, type LostReason } from "./OMLeadLostReasonModal";

export interface Lead {
  id: string;
  customerName: string;
  location: string;
  source: string;
  stage: "PROSPECT" | "DEMO" | "NEGOTIATION" | "PROPOSAL" | "CLOSED" | "LOST";
  value: number;
  estimatedValue: number;
  probability: number;
  daysInStage: number;
  assignedTo: string;
  lostReason?: LostReason;
  lostNotes?: string;
}

export interface SalesMetrics {
  leads: Lead[];
  pipelineData: {
    prospect: number;
    demo: number;
    proposal: number;
    negotiation: number;
    closed: number;
    lost: number;
  };
  conversionRate: number;
  mtdRevenue: number;
  target: number;
}

export interface OMSalesRevenueProps {
  metrics: SalesMetrics;
  onAddLead: () => void;
  onUpdateStage: (leadId: string, newStage: string, lostData?: LostReasonData) => void;
  onScheduleVisit: (leadId: string) => void;
  onApplyDiscount?: (leadId: string, discount: number) => void;
  onRequestApproval?: (leadId: string, discount: number) => void;
}

export function OMSalesRevenue({
  metrics,
  onAddLead,
  onUpdateStage,
  onScheduleVisit,
  onApplyDiscount = () => {},
  onRequestApproval = () => {},
}: OMSalesRevenueProps) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showLostReasonModal, setShowLostReasonModal] = useState(false);
  const [pendingLostLeadId, setPendingLostLeadId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState(0);
  const discountAuthorityLimit = DISCOUNT_LIMITS.OM_AUTHORITY;

  // Safety check - if metrics is completely undefined, show error
  if (!metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg border-2 border-red-300 shadow-lg p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-900 mb-4">Data Unavailable</h2>
          <p className="text-red-700">Sales metrics could not be loaded.</p>
        </div>
      </div>
    );
  }

  const {
    leads = [],
    pipelineData = { prospect: 0, demo: 0, proposal: 0, negotiation: 0, closed: 0, lost: 0 },
    conversionRate = 0,
    mtdRevenue = 0,
    target: mtdTarget = 0
  } = metrics || {};

  const safePercentage = (value: number, total: number) => {
    if (!total || total === 0) return 0;
    return Math.min(100, (value / total) * 100);
  };

  const getStageColor = (stage: Lead["stage"]) => {
    switch (stage) {
      case "PROSPECT": return "bg-gray-100 text-gray-700";
      case "DEMO": return "bg-blue-100 text-blue-700";
      case "NEGOTIATION": return "bg-yellow-100 text-yellow-700";
      case "PROPOSAL": return "bg-purple-100 text-purple-700";
      case "CLOSED": return "bg-green-100 text-green-700";
      case "LOST": return "bg-red-100 text-red-700";
    }
  };

  const handleApplyDiscount = () => {
    if (!selectedLead) return;

    if (discountInput <= discountAuthorityLimit) {
      onApplyDiscount(selectedLead.id, discountInput);
      setShowPricingModal(false);
      setDiscountInput(0);
    } else {
      onRequestApproval(selectedLead.id, discountInput);
      setShowPricingModal(false);
      setDiscountInput(0);
    }
  };

  const handleStageChange = (leadId: string, newStage: string) => {
    if (newStage === "LOST") {
      // Trigger lost reason modal
      setPendingLostLeadId(leadId);
      setShowLostReasonModal(true);
    } else {
      // Direct stage update for other stages
      onUpdateStage(leadId, newStage);
    }
  };

  const handleLostReasonConfirm = (data: LostReasonData) => {
    if (pendingLostLeadId) {
      onUpdateStage(pendingLostLeadId, "LOST", data);
      setPendingLostLeadId(null);
      setShowLostReasonModal(false);
    }
  };

  const handleLostReasonCancel = () => {
    setPendingLostLeadId(null);
    setShowLostReasonModal(false);
  };

  const totalPipelineValue = leads
    .filter(l => l.stage !== "LOST" && l.stage !== "CLOSED")
    .reduce((sum, l) => sum + l.value, 0);

  const negotiationStagnant = leads.filter(
    l => l.stage === "NEGOTIATION" && l.daysInStage > PIPELINE_RULES.NEGOTIATION_STAGNATION_DAYS
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER WITH VISIBILITY INDICATOR */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">Sales & Revenue Dashboard</h1>
              <p className="text-sm text-green-100">Pricing Control • Pipeline Management</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Eye className="h-5 w-5" />
              <div className="text-sm">
                <p className="font-bold">Visible to City Manager</p>
                <p className="text-xs text-green-100">All pipeline data tracked</p>
              </div>
            </div>
          </div>

          {/* KEY METRICS */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <p className="text-sm text-green-100 mb-1">Revenue MTD</p>
                <p className="text-2xl font-bold">₹{((mtdRevenue || 0) / 100000).toFixed(1)}L</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-green-100">Target: ₹{((mtdTarget || 0) / 100000).toFixed(1)}L</p>
                  <Badge className={`${
                    safePercentage(mtdRevenue || 0, mtdTarget || 1) >= 90 ? "bg-green-600" : "bg-yellow-600"
                  } text-white text-xs`}>
                    {safePercentage(mtdRevenue || 0, mtdTarget || 1).toFixed(0)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <p className="text-sm text-green-100 mb-1">Pipeline Value</p>
                <p className="text-2xl font-bold">₹{((totalPipelineValue || 0) / 100000).toFixed(1)}L</p>
                <p className="text-xs text-green-100 mt-2">Active opportunities</p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <p className="text-sm text-green-100 mb-1">Conversion Rate</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-green-100">Target: 40%</p>
                  <Badge className={`${
                    conversionRate >= 40 ? "bg-green-600" : "bg-yellow-600"
                  } text-white text-xs`}>
                    {conversionRate >= 40 ? "✓ On Track" : "Below Target"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <p className="text-sm text-green-100 mb-1">Discount Authority</p>
                <p className="text-2xl font-bold">≤{discountAuthorityLimit}%</p>
                <p className="text-xs text-green-100 mt-2">OM approval limit</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* STAGNATION ALERTS */}
        {negotiationStagnant.length > 0 && (
          <Card className="bg-red-50 border-2 border-red-300">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-bold text-red-900">Pipeline Stagnation Alert</h3>
                  <p className="text-sm text-red-700">
                    {negotiationStagnant.length} lead(s) in negotiation for &gt;10 days — Action Required
                  </p>
                </div>
                <Badge className="bg-red-600 text-white px-3 py-1">
                  🔴 Critical
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PIPELINE FUNNEL */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sales Funnel</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>Visible to: City Manager, Head Office</span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Prospect */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Prospect</span>
                  <span className="text-sm font-bold text-gray-900">{pipelineData.prospect || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-gray-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: "100%" }}
                  >
                    {pipelineData.prospect || 0} leads
                  </div>
                </div>
              </div>

              {/* Demo */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Demo Scheduled</span>
                  <span className="text-sm font-bold text-gray-900">{pipelineData.demo || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-blue-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${safePercentage(pipelineData.demo || 0, pipelineData.prospect || 1)}%` }}
                  >
                    {pipelineData.demo || 0} demos
                  </div>
                </div>
              </div>

              {/* Proposal */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Proposal Sent</span>
                  <span className="text-sm font-bold text-gray-900">{pipelineData.proposal || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-purple-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${safePercentage(pipelineData.proposal || 0, pipelineData.prospect || 1)}%` }}
                  >
                    {pipelineData.proposal || 0} proposals
                  </div>
                </div>
              </div>

              {/* Negotiation */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Negotiation</span>
                  <span className="text-sm font-bold text-gray-900">{pipelineData.negotiation || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-yellow-500 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${safePercentage(pipelineData.negotiation || 0, pipelineData.prospect || 1)}%` }}
                  >
                    {pipelineData.negotiation || 0} negotiating
                  </div>
                </div>
              </div>

              {/* Closed */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Closed Won</span>
                  <span className="text-sm font-bold text-gray-900">{pipelineData.closed || 0}</span>
                </div>
                <div className="bg-gray-200 rounded-full h-8">
                  <div
                    className="bg-green-600 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ width: `${safePercentage(pipelineData.closed || 0, pipelineData.prospect || 1)}%` }}
                  >
                    {pipelineData.closed || 0} closed ({conversionRate || 0}%)
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ACTIVE LEADS */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Active Leads</h2>
            <div className="space-y-3">
              {leads.map((lead) => (
                <div key={lead.id} className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{lead.customerName}</h3>
                      <p className="text-xs text-gray-600">{lead.location}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStageColor(lead.stage)}>{lead.stage}</Badge>
                      {lead.stage === "LOST" && lead.lostReason && (
                        <Badge className="bg-red-100 text-red-700 border border-red-300">
                          <Tag className="h-3 w-3 mr-1" />
                          {lead.lostReason}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-500 text-xs">Value</p>
                      <p className="font-bold">₹{(lead.value / 1000).toFixed(1)}k</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Probability</p>
                      <p className="font-bold">{lead.probability}%</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Source</p>
                      <p className="font-bold text-xs">{lead.source}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Assigned To</p>
                      <p className="font-bold text-xs">{lead.assignedTo}</p>
                    </div>
                  </div>
                  {lead.stage === "LOST" && lead.lostNotes && (
                    <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                      <span className="font-semibold">Lost Notes: </span>
                      {lead.lostNotes}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleStageChange(lead.id, "next")}>
                      Move Stage
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleStageChange(lead.id, "LOST")}>
                      Mark Lost
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onScheduleVisit(lead.id)}>
                      <Calendar className="h-4 w-4 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* LOST REASON MODAL */}
      {showLostReasonModal && pendingLostLeadId && (
        <OMLeadLostReasonModal
          leadName={leads.find(l => l.id === pendingLostLeadId)?.customerName || "Lead"}
          onConfirm={handleLostReasonConfirm}
          onCancel={handleLostReasonCancel}
        />
      )}
    </div>
  );
}