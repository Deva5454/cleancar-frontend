/**
 * REPORTS & PLANNING (V6)
 * Strategic reporting layer + Expansion planning
 * OM ranking, productivity charts, compliance trends, territory proposals
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  AlertTriangle,
  MapPin,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  Send,
  Building2,
  Users,
  DollarSign,
  Target,
} from "lucide-react";
import type { ClusterAnalytics, TerritoryProposal } from "../../types/clusterManager.types";
import { REPORT_TYPES } from "../../constants/clusterManager.constants";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMReportsAnalyticsProps {
  analytics: ClusterAnalytics;
}

export function CMReportsAnalytics({ analytics }: CMReportsAnalyticsProps) {
  const [showNewProposalForm, setShowNewProposalForm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<TerritoryProposal | null>(null);

  const getTrendIcon = (trend: "UP" | "STABLE" | "DOWN") => {
    if (trend === "UP") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "DOWN") return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-600" />;
  };

  const getTrendColor = (trend: "IMPROVING" | "STABLE" | "DECLINING") => {
    if (trend === "IMPROVING") return "text-green-600";
    if (trend === "DECLINING") return "text-red-600";
    return "text-slate-600";
  };

  const getProposalStatusConfig = (status: TerritoryProposal["status"]) => {
    const configs = {
      DRAFT: { label: "Draft", color: "bg-slate-500", textColor: "text-slate-700", borderColor: "border-slate-300" },
      SUBMITTED: { label: "Submitted", color: "bg-blue-600", textColor: "text-blue-700", borderColor: "border-blue-300" },
      UNDER_REVIEW: { label: "Under Review", color: "bg-purple-600", textColor: "text-purple-700", borderColor: "border-purple-300" },
      APPROVED: { label: "Approved", color: "bg-green-600", textColor: "text-green-700", borderColor: "border-green-300" },
      REJECTED: { label: "Rejected", color: "bg-red-600", textColor: "text-red-700", borderColor: "border-red-300" },
    };
    return configs[status];
  };

  return (
    <div className="space-y-6">
      {/* Report Download Section */}
      <Card className="p-4 border border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-900">Generate Reports</h3>
          <Badge variant="outline">6 Report Types</Badge>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {REPORT_TYPES.map((report) => (
            <Button key={report.id} size="sm" variant="outline" className="gap-2">
              <Download className="w-3 h-3" />
              {report.label}
            </Button>
          ))}
        </div>
      </Card>

      {/* OM Ranking Leaderboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">OM Performance Ranking</h3>
          <Badge variant="outline" className="gap-1">
            <Trophy className="w-3 h-3" />
            Top Performers
          </Badge>
        </div>

        <Card className="border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">OM Name</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Overall Score
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Conversion
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Retention
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Compliance
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Trend</th>
                </tr>
              </thead>
              <tbody>
                {analytics.omRanking.map((om, index) => {
                  const isTopPerformer = index < 2;
                  return (
                    <tr
                      key={om.omId}
                      className={`border-b border-slate-100 ${
                        isTopPerformer ? "bg-green-50" : ""
                      } hover:bg-slate-50`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isTopPerformer && <Trophy className="w-4 h-4 text-yellow-600" />}
                          <span className="font-semibold text-slate-900">#{om.rank}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-900">{om.omName}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge className="bg-blue-600 text-white">{om.overallScore.toFixed(1)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        {om.revenue.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        {om.conversion.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">
                        {om.retention.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-900">{om.compliance}</td>
                      <td className="px-4 py-3 text-center">{getTrendIcon(om.trend)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Unit Productivity Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Unit Productivity by OM</h3>
        <Card className="p-4 border border-slate-200">
          <div className="space-y-3">
            {analytics.unitProductivity.map((om, index) => {
              const percentage = (om.avgUnitsPerWasher / om.target) * 100;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{om.omName}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold ${getTrendColor(om.trend)}`}>
                        {om.avgUnitsPerWasher.toFixed(1)} units/washer
                      </span>
                      <Badge
                        variant="outline"
                        className={`${
                          om.variance >= 0
                            ? "text-green-600 border-green-600"
                            : "text-red-600 border-red-600"
                        }`}
                      >
                        {om.variance >= 0 ? "+" : ""}
                        {om.variance.toFixed(1)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-200 rounded-full h-2">
                      <div
                        className={`${
                          percentage >= 100
                            ? "bg-green-600"
                            : percentage >= 90
                            ? "bg-amber-600"
                            : "bg-red-600"
                        } rounded-full h-2`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-600 w-12 text-right">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Compliance Trends */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Compliance Trends (Monthly)</h3>
        <Card className="p-4 border border-slate-200">
          <div className="space-y-3">
            {analytics.complianceTrends.map((week, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <Calendar className="w-4 h-4 text-slate-600" />
                  <span className="font-medium text-slate-900">{week.week}</span>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-slate-600">Score: </span>
                    <span className="font-semibold text-slate-900">{week.score}/100</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600">Issues: </span>
                    <span className="font-semibold text-red-600">{week.issues}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-600">Resolved: </span>
                    <span className="font-semibold text-green-600">{week.resolved}</span>
                  </div>
                  <div className="w-24 bg-slate-200 rounded-full h-2">
                    <div
                      className={`${
                        week.score >= 90
                          ? "bg-green-600"
                          : week.score >= 75
                          ? "bg-amber-600"
                          : "bg-red-600"
                      } rounded-full h-2`}
                      style={{ width: `${week.score}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Attrition Heatmap */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Attrition Heatmap</h3>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Monitor Staff Turnover
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {analytics.attritionHeatmap.map((om) => (
            <Card
              key={om.omName}
              className={`p-4 border ${
                om.severity === "HIGH"
                  ? "border-red-300 bg-red-50"
                  : om.severity === "MEDIUM"
                  ? "border-amber-300 bg-amber-50"
                  : "border-green-300 bg-green-50"
              }`}
            >
              <h4 className="font-semibold text-slate-900 mb-3">{om.omName}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Washer Attrition</span>
                  <span
                    className={`font-bold ${
                      om.washerAttrition > 10
                        ? "text-red-600"
                        : om.washerAttrition > 5
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {om.washerAttrition}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Supervisor Attrition</span>
                  <span
                    className={`font-bold ${
                      om.supervisorAttrition > 5
                        ? "text-red-600"
                        : om.supervisorAttrition > 2
                        ? "text-amber-600"
                        : "text-green-600"
                    }`}
                  >
                    {om.supervisorAttrition}%
                  </span>
                </div>
              </div>
              <Badge
                className={`mt-3 w-full justify-center ${
                  om.severity === "HIGH"
                    ? "bg-red-600"
                    : om.severity === "MEDIUM"
                    ? "bg-amber-600"
                    : "bg-green-600"
                } text-white`}
              >
                {om.severity} Risk
              </Badge>
            </Card>
          ))}
        </div>
      </div>

      {/* Territory Coverage */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Territory Coverage Map</h3>
        <Card className="border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Area</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">OM</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Active Customers
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Coverage %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Potential
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.territoryCoverage.map((territory, index) => (
                  <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-600" />
                        <span className="font-medium text-slate-900">{territory.area}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">{territory.omName}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                      {territory.customers}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge
                        className={`${
                          territory.coverage >= 70
                            ? "bg-green-600"
                            : territory.coverage >= 50
                            ? "bg-amber-600"
                            : "bg-red-600"
                        } text-white`}
                      >
                        {territory.coverage}%
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600 font-semibold">
                      +{territory.potential}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Incentive Forecast (Read-Only) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Incentive Forecast</h3>
          <Badge variant="outline">Read-Only View</Badge>
        </div>
        <Card className="p-4 border border-slate-200">
          <div className="space-y-2">
            {analytics.incentiveForecast.map((month, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <span className="font-medium text-slate-900">{month.month}</span>
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <span className="text-slate-600">Projected: </span>
                    <span className="font-semibold text-slate-900">
                      ₹{(month.projected / 100000).toFixed(2)}L
                    </span>
                  </div>
                  {month.actual !== undefined && (
                    <>
                      <div className="text-sm">
                        <span className="text-slate-600">Actual: </span>
                        <span className="font-semibold text-slate-900">
                          ₹{(month.actual / 100000).toFixed(2)}L
                        </span>
                      </div>
                      <div className="text-sm">
                        <Badge
                          variant="outline"
                          className={`${
                            month.variance! >= 0
                              ? "text-green-600 border-green-600"
                              : "text-red-600 border-red-600"
                          }`}
                        >
                          {month.variance! >= 0 ? "+" : ""}₹{(month.variance! / 1000).toFixed(1)}K
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 🆕 V6: EXPANSION PLANNING - Territory Proposals */}
      <div className="pt-6 border-t-2 border-slate-300">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Territory Expansion Planning</h3>
            <p className="text-sm text-slate-600 mt-1">
              Propose new territories with data for City Manager approval
            </p>
          </div>
          <Button
            onClick={() => setShowNewProposalForm(true)}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            New Proposal
          </Button>
        </div>

        {/* Territory Proposals List */}
        <div className="grid grid-cols-1 gap-4">
          {analytics.territoryProposals.map((proposal) => {
            const statusConfig = getProposalStatusConfig(proposal.status);
            return (
              <Card
                key={proposal.id}
                className={`p-4 border-2 ${statusConfig.borderColor} ${
                  proposal.status === "APPROVED" ? "bg-green-50" :
                  proposal.status === "REJECTED" ? "bg-red-50" :
                  proposal.status === "UNDER_REVIEW" ? "bg-purple-50" : "bg-white"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Building2 className="w-5 h-5 text-slate-700" />
                      <h4 className="font-semibold text-slate-900 text-lg">
                        {proposal.territoryName}
                      </h4>
                      <Badge className={`${statusConfig.color} text-white`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>{proposal.location}</span>
                      <span className="text-slate-400">•</span>
                      <span>Cluster: {proposal.clusterAssignment}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedProposal(proposal)}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </Button>
                    {proposal.status === "DRAFT" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-slate-600">Expected Revenue</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      ₹{(proposal.expectedRevenue / 100000).toFixed(1)}L/mo
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="text-xs text-slate-600">Required Staff</span>
                    </div>
                    <p className="font-semibold text-slate-900">
                      {proposal.requiredWashers}W + {proposal.requiredSupervisors}S
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-purple-600" />
                      <span className="text-xs text-slate-600">Customer Density</span>
                    </div>
                    <p className="font-semibold text-slate-900">{proposal.customerDensity}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-xs text-slate-600">Breakeven</span>
                    </div>
                    <p className="font-semibold text-slate-900">{proposal.estimatedBreakeven} months</p>
                  </div>
                </div>

                <div className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 mb-3">
                  <strong>Rationale:</strong> {proposal.rationale}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-slate-600">
                    <span>
                      Competitor: <strong className={`${
                        proposal.competitorPresence === "LOW" ? "text-green-600" :
                        proposal.competitorPresence === "MEDIUM" ? "text-amber-600" : "text-red-600"
                      }`}>{proposal.competitorPresence}</strong>
                    </span>
                    <span>
                      Infrastructure: <strong className={proposal.infrastructureReady ? "text-green-600" : "text-red-600"}>
                        {proposal.infrastructureReady ? "Ready" : "Not Ready"}
                      </strong>
                    </span>
                    <span>
                      Setup Cost: <strong>₹{(proposal.estimatedSetupCost / 100000).toFixed(1)}L</strong>
                    </span>
                  </div>
                  {proposal.status === "DRAFT" && (
                    <Button
                      size="sm"
                      className="gap-2 bg-blue-600 hover:bg-blue-700"
                      onClick={() => {
                        clusterManagerService.updateTerritoryProposal(proposal.id, { status: "SUBMITTED", submittedAt: new Date() });
                      }}
                    >
                      <Send className="w-3 h-3" />
                      Submit to City Manager
                    </Button>
                  )}
                  {proposal.status === "UNDER_REVIEW" && proposal.reviewNotes && (
                    <div className="text-xs text-purple-700 bg-purple-100 px-3 py-2 rounded-lg">
                      <strong>Review Notes:</strong> {proposal.reviewNotes}
                    </div>
                  )}
                  {proposal.status === "APPROVED" && proposal.approvalStatus && (
                    <div className="text-xs text-green-700 bg-green-100 px-3 py-2 rounded-lg">
                      ✅ Approved by {proposal.approvalStatus.approvedBy} • Timeline: {proposal.approvalStatus.implementationTimeline}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {analytics.territoryProposals.length === 0 && (
          <Card className="p-8 border-2 border-dashed border-slate-300 bg-slate-50">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-900 mb-2">No Territory Proposals Yet</h4>
              <p className="text-sm text-slate-600 mb-4">
                Propose new territories with customer density and revenue data for City Manager approval
              </p>
              <Button
                onClick={() => setShowNewProposalForm(true)}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Create First Proposal
              </Button>
            </div>
          </Card>
        )}

        {/* New Proposal Form Modal (Placeholder) */}
        {showNewProposalForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">New Territory Proposal</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewProposalForm(false)}
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-900">
                    <strong>Note:</strong> Territory proposals require detailed data including customer density,
                    revenue potential, and resource planning. All proposals require City Manager approval before implementation.
                  </p>
                </div>
                <p className="text-slate-600 text-center py-8">
                  [Form fields would be implemented here in production]
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowNewProposalForm(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Save as Draft
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Proposal Detail View Modal (Placeholder) */}
        {selectedProposal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {selectedProposal.territoryName} - Detailed View
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProposal(null)}
                >
                  ✕
                </Button>
              </div>
              <div className="space-y-4 text-sm">
                <p className="text-slate-600">[Full proposal details would be shown here]</p>
                <Button variant="outline" onClick={() => setSelectedProposal(null)}>
                  Close
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
