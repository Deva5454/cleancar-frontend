/**
 * NEXT DAY READINESS PANEL (V7 - PRE-DAY MODE)
 * Shows tomorrow's projections, capacity gaps, and pending actions
 * Displayed during Pre-Day Mode (8 PM - Midnight)
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Calendar,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
} from "lucide-react";
import type { NextDayReadiness } from "../../types/clusterManager.types";

interface CMNextDayReadinessPanelProps {
  readiness: NextDayReadiness;
}

export function CMNextDayReadinessPanel({ readiness }: CMNextDayReadinessPanelProps) {
  const getCapacityStatusConfig = (status: "GOOD" | "AT_RISK" | "CRITICAL") => {
    if (status === "GOOD") return { color: "bg-green-600", textColor: "text-green-700", label: "Good" };
    if (status === "AT_RISK") return { color: "bg-amber-600", textColor: "text-amber-700", label: "At Risk" };
    return { color: "bg-red-600", textColor: "text-red-700", label: "Critical" };
  };

  const capacityPercentage = (readiness.clusterCapacity.confirmedWashers / readiness.clusterCapacity.expectedWashers) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 border-2 border-indigo-600 bg-indigo-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-indigo-900">Next Day Readiness Check</h3>
            <p className="text-sm text-indigo-700">
              {readiness.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <Badge className="bg-indigo-600 text-white">Pre-Day Mode</Badge>
        </div>
      </Card>

      {/* Cluster Capacity */}
      <Card className="p-4 border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700" />
            <h4 className="font-semibold text-slate-900">Cluster Capacity</h4>
          </div>
          <Badge
            className={`${
              capacityPercentage >= 95 ? "bg-green-600" : capacityPercentage >= 85 ? "bg-amber-600" : "bg-red-600"
            } text-white`}
          >
            {capacityPercentage.toFixed(1)}% Confirmed
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-3">
          <div className="p-3 bg-slate-50 rounded-lg">
            <span className="text-xs text-slate-600">Expected</span>
            <p className="text-lg font-semibold text-slate-900">{readiness.clusterCapacity.expectedWashers}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <span className="text-xs text-green-700">Confirmed</span>
            <p className="text-lg font-semibold text-green-900">{readiness.clusterCapacity.confirmedWashers}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <span className="text-xs text-red-700">Leave Requests</span>
            <p className="text-lg font-semibold text-red-900">{readiness.clusterCapacity.leaveRequests}</p>
          </div>
        </div>

        {readiness.clusterCapacity.coverageGaps.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-semibold text-red-900">Coverage Gaps Detected</span>
            </div>
            <div className="flex gap-2">
              {readiness.clusterCapacity.coverageGaps.map((gap, index) => (
                <Badge key={index} variant="outline" className="text-red-700 border-red-600 gap-1">
                  <MapPin className="w-3 h-3" />
                  {gap}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* OM Projections */}
      <Card className="p-4 border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-slate-700" />
          <h4 className="font-semibold text-slate-900">OM Revenue Projections</h4>
        </div>

        <div className="space-y-2">
          {readiness.omProjections.map((om) => {
            const statusConfig = getCapacityStatusConfig(om.capacityStatus);
            return (
              <div
                key={om.omId}
                className={`p-3 rounded-lg border ${
                  om.capacityStatus === "CRITICAL" ? "bg-red-50 border-red-200" :
                  om.capacityStatus === "AT_RISK" ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{om.omName}</span>
                    {om.openEscalations > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                        {om.openEscalations} alerts
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="text-right">
                      <span className="text-xs text-slate-600">Projected Revenue</span>
                      <p className="font-semibold text-slate-900">
                        ₹{(om.projectedRevenue / 100000).toFixed(1)}L
                      </p>
                    </div>
                    <Badge className={`${statusConfig.color} text-white`}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Churn Risk List */}
      {readiness.churnRiskList.length > 0 && (
        <Card className="p-4 border-2 border-red-300 bg-red-50">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-900">High Churn Risk - Immediate Action Required</h4>
            <Badge variant="destructive">{readiness.churnRiskList.length}</Badge>
          </div>

          <div className="space-y-2">
            {readiness.churnRiskList.map((customer) => (
              <div key={customer.customerId} className="p-3 bg-white rounded-lg border border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-900">{customer.customerName}</span>
                    <span className="text-sm text-slate-600 ml-2">• {customer.omName}</span>
                  </div>
                  <Badge className={`${customer.risk === "HIGH" ? "bg-red-600" : "bg-amber-600"} text-white`}>
                    {customer.risk} RISK
                  </Badge>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  ⚠️ {customer.actionRequired}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pending Actions */}
      <Card className="p-4 border-2 border-amber-300 bg-amber-50">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-5 h-5 text-amber-600" />
          <h4 className="font-semibold text-amber-900">Pending Actions - Must Clear Tomorrow</h4>
        </div>

        <div className="space-y-2">
          {readiness.pendingActions.map((action, index) => (
            <div key={index} className="p-3 bg-white rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-slate-900">{action.category}</span>
                  <Badge variant="outline" className="ml-2 text-amber-700 border-amber-600">
                    {action.count} pending
                  </Badge>
                </div>
                {action.mustClearBy && (
                  <div className="text-sm text-amber-700">
                    <strong>Clear by:</strong>{" "}
                    {action.mustClearBy.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Action Footer */}
      <div className="flex gap-2">
        <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Mark as Reviewed
        </Button>
        <Button variant="outline" className="gap-2">
          <TrendingUp className="w-4 h-4" />
          Generate Full Report
        </Button>
      </div>
    </div>
  );
}
