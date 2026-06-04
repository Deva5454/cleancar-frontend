/**
 * REVENUE & PIPELINE DASHBOARD (V10 Enhanced)
 * Cluster-level revenue intelligence + Sales Quality + TSM Funnel Integration
 * Complete funnel: Leads → Attempts → Conversions → Active → Retained → Renewed
 * SLA breach impact tracking and conversion quality monitoring
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TrendingUp, DollarSign, AlertTriangle, Calendar } from "lucide-react";
import type { ClusterRevenue } from "../../types/clusterManager.types";
import { HEALTH_STATUS, STALLED_PIPELINE_THRESHOLD } from "../../constants/clusterManager.constants";
import { CMConversionQualityPanel } from "./CMConversionQualityPanel";
import { CMEarlyChurnTracker } from "./CMEarlyChurnTracker";
import { CMInsightLayer } from "./CMInsightLayer";
import { CMSLAImpactPanel } from "./CMSLAImpactPanel";
import { CMFunnelVisualization } from "./CMFunnelVisualization";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMRevenuePipelineProps {
  revenue: ClusterRevenue;
}

export function CMRevenuePipeline({ revenue }: CMRevenuePipelineProps) {
  // V8: Load sales quality data
  const conversionQuality = clusterManagerService.getConversionQualityMetrics();
  const earlyChurn = clusterManagerService.getEarlyChurnMetrics();
  const insights = clusterManagerService.getInsightSuggestions();

  // V10: Load TSM funnel governance data
  const slaImpact = clusterManagerService.getSLAImpactMetrics();
  const funnelVisualization = clusterManagerService.getFunnelVisualizationData();

  const funnelStages = [
    { label: "Leads", value: revenue.funnel.leads, color: "bg-slate-400" },
    { label: "Demos", value: revenue.funnel.demos, color: "bg-blue-400" },
    { label: "Negotiations", value: revenue.funnel.negotiations, color: "bg-purple-400" },
    { label: "Closed Won", value: revenue.funnel.closedWon, color: "bg-green-500" },
    { label: "Closed Lost", value: revenue.funnel.closedLost, color: "bg-red-400" },
  ];

  const maxFunnelValue = Math.max(...funnelStages.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* Cluster Revenue Summary */}
      <Card className="p-6 border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Cluster Revenue Performance</h2>
          <Badge
            className={`${
              revenue.cluster.percentage >= 95
                ? "bg-green-600"
                : revenue.cluster.percentage >= 80
                ? "bg-amber-600"
                : "bg-red-600"
            } text-white`}
          >
            {revenue.cluster.percentage.toFixed(1)}%
          </Badge>
        </div>

        <div className="flex items-end gap-4 mb-4">
          <div>
            <div className="text-xs text-slate-600 mb-1">MTD Revenue</div>
            <div className="text-3xl font-bold text-slate-900">
              ₹{(revenue.cluster.mtd / 10000000).toFixed(2)}Cr
            </div>
          </div>
          <div className="pb-2 text-sm text-slate-600">
            / ₹{(revenue.cluster.target / 10000000).toFixed(2)}Cr Target
          </div>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`${
              revenue.cluster.percentage >= 95
                ? "bg-green-600"
                : revenue.cluster.percentage >= 80
                ? "bg-amber-600"
                : "bg-red-600"
            } rounded-full h-3 transition-all`}
            style={{ width: `${Math.min(revenue.cluster.percentage, 100)}%` }}
          />
        </div>
      </Card>

      {/* Revenue by OM */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Operations Manager</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {revenue.byOM.map((om) => {
            const statusConfig = HEALTH_STATUS[om.status];
            return (
              <Card key={om.omId} className={`p-4 border ${statusConfig.borderColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-900">{om.omName}</h4>
                  <Badge className={`${statusConfig.color} text-white`}>
                    {om.percentage.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <div className="text-xl font-bold text-slate-900">
                    ₹{(om.revenue / 100000).toFixed(2)}L
                  </div>
                  <div className="text-xs text-slate-600">
                    / ₹{(om.target / 100000).toFixed(2)}L
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`${statusConfig.color} rounded-full h-2`}
                    style={{ width: `${Math.min(om.percentage, 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sales Funnel */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Sales Funnel Visualization</h3>
        <Card className="p-6 border border-slate-200">
          <div className="space-y-4">
            {funnelStages.map((stage, index) => {
              const widthPercent = (stage.value / maxFunnelValue) * 100;
              const conversionFromPrevious =
                index > 0 && funnelStages[index - 1].value > 0
                  ? ((stage.value / funnelStages[index - 1].value) * 100).toFixed(1)
                  : null;

              return (
                <div key={stage.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-900">{stage.label}</span>
                    <div className="flex items-center gap-2">
                      {conversionFromPrevious && index < 4 && (
                        <span className="text-xs text-slate-600">
                          {conversionFromPrevious}% conversion
                        </span>
                      )}
                      <Badge variant="outline">{stage.value}</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-lg h-12 flex items-center px-4">
                    <div
                      className={`${stage.color} rounded-lg h-8 flex items-center justify-center text-white font-semibold text-sm transition-all`}
                      style={{ width: `${widthPercent}%`, minWidth: stage.value > 0 ? "60px" : "0" }}
                    >
                      {stage.value > 0 && stage.value}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">Overall Conversion Rate</span>
              <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                {revenue.funnel.conversionRate.toFixed(1)}%
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Stalled Pipeline */}
      {revenue.stalledPipeline.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Stalled Pipeline</h3>
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" />
              {revenue.stalledPipeline.length} Stalled Leads
            </Badge>
          </div>

          <div className="space-y-3">
            {revenue.stalledPipeline.map((lead) => (
              <Card
                key={lead.leadId}
                className="p-4 border border-amber-200 bg-amber-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{lead.customerName}</h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>OM: {lead.omName}</span>
                      <span>Stage: {lead.stage}</span>
                      <div className="flex items-center gap-1 text-amber-700 font-medium">
                        <Calendar className="w-4 h-4" />
                        Stuck for {lead.daysStuck} days
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-slate-600">Estimated Value: </span>
                      <span className="font-semibold text-slate-900">
                        ₹{lead.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Request OM Action Plan
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* V8: Sales Quality Integration */}
      <CMInsightLayer insights={insights} />

      {/* V8: Conversion Quality Panel */}
      <CMConversionQualityPanel metrics={conversionQuality} />

      {/* V8: Early Churn Tracker */}
      <CMEarlyChurnTracker metrics={earlyChurn} />

      {/* V10: TSM Funnel Governance */}
      <CMSLAImpactPanel metrics={slaImpact} />

      {/* V10: Complete Funnel Visualization */}
      <CMFunnelVisualization stages={funnelVisualization} />

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2">
          <DollarSign className="w-4 h-4" />
          Download Revenue Report
        </Button>
        <Button variant="outline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          View Pipeline Trends
        </Button>
        <Button variant="outline" className="gap-2">
          Flag Underperforming OMs
        </Button>
      </div>
    </div>
  );
}
