/**
 * RETENTION & RENEWAL HEALTH (V11 Enhanced)
 * Complete lifecycle monitoring: Churn risk → Retention → Renewals
 * SLA tracking, customer stability, upsell opportunities, and renewal performance
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
} from "lucide-react";
import type { ClusterRetention } from "../../types/clusterManager.types";
import { CHURN_RISK_LEVELS } from "../../constants/clusterManager.constants";
import { CMRenewalHealthPanel } from "./CMRenewalHealthPanel";
import { CMRenewalFunnelVisualization } from "./CMRenewalFunnelVisualization";
import { clusterManagerService } from "../../services/clusterManagerService";

interface CMRetentionHealthProps {
  retention: ClusterRetention;
}

export function CMRetentionHealth({ retention }: CMRetentionHealthProps) {
  // V11: Load renewal lifecycle data
  const renewalHealth = clusterManagerService.getRenewalHealthMetrics();
  const renewalFunnel = clusterManagerService.getRenewalFunnelData();

  const getSLAStatusConfig = (status: "MET" | "AT_RISK" | "BREACHED") => {
    if (status === "BREACHED")
      return { color: "bg-red-600", textColor: "text-red-600", label: "SLA Breached" };
    if (status === "AT_RISK")
      return { color: "bg-amber-600", textColor: "text-amber-600", label: "At Risk" };
    return { color: "bg-green-600", textColor: "text-green-600", label: "On Track" };
  };

  const getTrendIcon = (trend: "UP" | "STABLE" | "DOWN") => {
    if (trend === "UP") return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === "DOWN") return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-slate-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="text-xs text-slate-600 mb-1">High Churn Risk</div>
          <div className="text-2xl font-bold text-red-600">{retention.churnRisk.length}</div>
          <div className="text-xs text-slate-600 mt-1">
            ₹
            {retention.churnRisk
              .reduce((sum, c) => sum + c.subscriptionValue, 0)
              .toLocaleString()}{" "}
            at risk
          </div>
        </Card>

        <Card className="p-4 border border-amber-200 bg-amber-50">
          <div className="text-xs text-slate-600 mb-1">SLA Breaches</div>
          <div className="text-2xl font-bold text-amber-600">
            {retention.slaTracker.filter((s) => s.slaStatus === "BREACHED").length}
          </div>
          <div className="text-xs text-slate-600 mt-1">Immediate action required</div>
        </Card>

        <Card className="p-4 border border-green-200 bg-green-50">
          <div className="text-xs text-slate-600 mb-1">Upsell Opportunities</div>
          <div className="text-2xl font-bold text-green-600">
            {retention.upsellOpportunities.length}
          </div>
          <div className="text-xs text-slate-600 mt-1">
            ₹
            {retention.upsellOpportunities
              .reduce((sum, u) => sum + u.additionalRevenue, 0)
              .toLocaleString()}{" "}
            potential
          </div>
        </Card>
      </div>

      {/* Churn Risk Customers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">High Churn Risk Customers</h3>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            Immediate Attention Required
          </Badge>
        </div>

        <div className="space-y-3">
          {retention.churnRisk.map((customer) => {
            const riskConfig = CHURN_RISK_LEVELS[customer.risk];
            return (
              <Card
                key={customer.customerId}
                className={`p-4 border ${riskConfig.borderColor} ${riskConfig.color}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-slate-900">{customer.customerName}</h4>
                      <Badge className={`${riskConfig.textColor} bg-white border ${riskConfig.borderColor}`}>
                        {riskConfig.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                      <div>
                        <span className="text-slate-600">OM: </span>
                        <span className="font-medium text-slate-900">{customer.omName}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Subscription Value: </span>
                        <span className="font-semibold text-slate-900">
                          ₹{customer.subscriptionValue.toLocaleString()}/mo
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-600">Missed Washes: </span>
                        <span className="font-medium text-red-600">{customer.missedWashes}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Complaints: </span>
                        <span className="font-medium text-red-600">{customer.complaints}</span>
                      </div>
                      <div>
                        <span className="text-slate-600">Last Wash: </span>
                        <span className="font-medium text-slate-900">
                          {customer.lastWashDate.toLocaleDateString()} (
                          {Math.floor((Date.now() - customer.lastWashDate.getTime()) / (24 * 60 * 60 * 1000))}{" "}
                          days ago)
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
                      <strong>Recommended Action:</strong> {customer.recommendedAction}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button size="sm" variant="outline">
                      Assign Retention Task
                    </Button>
                    <Button size="sm" variant="outline">
                      Log CM Intervention
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* SLA Tracker */}
      {retention.slaTracker.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Complaint SLA Tracker</h3>
          <div className="space-y-3">
            {retention.slaTracker.map((complaint) => {
              const slaConfig = getSLAStatusConfig(complaint.slaStatus);
              return (
                <Card
                  key={complaint.complaintId}
                  className={`p-4 border ${
                    complaint.slaStatus === "BREACHED"
                      ? "border-red-200 bg-red-50"
                      : complaint.slaStatus === "AT_RISK"
                      ? "border-amber-200 bg-amber-50"
                      : "border-green-200 bg-green-50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">{complaint.customerName}</h4>
                        <Badge className={`${slaConfig.color} text-white`}>
                          {slaConfig.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <span className="text-slate-600">OM: </span>
                          <span className="font-medium text-slate-900">{complaint.omName}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Created: </span>
                          <span className="font-medium text-slate-900">
                            {complaint.createdAt.toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-600">Time Remaining: </span>
                          <span className={`font-semibold ${slaConfig.textColor}`}>
                            {complaint.minutesRemaining > 0
                              ? `${complaint.minutesRemaining} min`
                              : `${Math.abs(complaint.minutesRemaining)} min overdue`}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        {complaint.acknowledgementTime ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Acknowledged at {complaint.acknowledgementTime.toLocaleTimeString()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <Clock className="w-3 h-3" />
                            Not yet acknowledged
                          </div>
                        )}

                        {complaint.resolutionTime ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved at {complaint.resolutionTime.toLocaleTimeString()}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-amber-600">
                            <Clock className="w-3 h-3" />
                            Resolution pending
                          </div>
                        )}
                      </div>
                    </div>

                    {complaint.slaStatus === "BREACHED" && (
                      <Button size="sm" variant="destructive">
                        Escalate to CM
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Upsell Opportunities */}
      {retention.upsellOpportunities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Upsell Opportunities</h3>
            <Badge className="bg-green-600 text-white gap-1">
              <DollarSign className="w-3 h-3" />
              ₹
              {retention.upsellOpportunities
                .reduce((sum, u) => sum + u.additionalRevenue, 0)
                .toLocaleString()}{" "}
              Revenue Potential
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {retention.upsellOpportunities.map((opportunity) => (
              <Card
                key={opportunity.customerId}
                className="p-4 border border-green-200 bg-green-50"
              >
                <h4 className="font-semibold text-slate-900 mb-2">{opportunity.customerName}</h4>
                <div className="space-y-2 text-sm mb-3">
                  <div>
                    <span className="text-slate-600">OM: </span>
                    <span className="font-medium text-slate-900">{opportunity.omName}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Current: </span>
                    <span className="font-medium text-slate-900">{opportunity.currentPackage}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Suggested: </span>
                    <span className="font-medium text-green-700">{opportunity.suggestedPackage}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Additional Revenue: </span>
                    <span className="font-bold text-green-600">
                      +₹{opportunity.additionalRevenue.toLocaleString()}/mo
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Assign to OM
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Retention by OM */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Retention Rate by OM</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {retention.retentionByOM.map((om) => (
            <Card key={om.omId} className="p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-900">{om.omName}</h4>
                {getTrendIcon(om.satisfactionTrend)}
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">
                {om.retentionRate.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-600">
                {om.churnCount} churned this month
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 mt-3">
                <div
                  className={`${
                    om.retentionRate >= 90
                      ? "bg-green-600"
                      : om.retentionRate >= 85
                      ? "bg-amber-600"
                      : "bg-red-600"
                  } rounded-full h-2`}
                  style={{ width: `${om.retentionRate}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* V11: Renewal Health Panel */}
      <CMRenewalHealthPanel metrics={renewalHealth} />

      {/* V11: Renewal Funnel Visualization */}
      <CMRenewalFunnelVisualization stages={renewalFunnel} />
    </div>
  );
}
