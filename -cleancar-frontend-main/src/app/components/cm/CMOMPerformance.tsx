/**
 * OM PERFORMANCE VIEW
 * Deep dive into individual OM performance with trends
 * KPI grids, sparklines, and actionable insights
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertCircle,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";
import type { OMPerformanceCard } from "../../types/clusterManager.types";
import { clusterManagerService } from "../../services/clusterManagerService";
import { HEALTH_STATUS } from "../../constants/clusterManager.constants";

interface CMOMPerformanceProps {
  omCards: OMPerformanceCard[];
  selectedOMId: string | null;
  onSelectOM: (omId: string) => void;
}

export function CMOMPerformance({ omCards, selectedOMId, onSelectOM }: CMOMPerformanceProps) {
  const [showActionModal, setShowActionModal] = useState(false);

  const selectedOM = selectedOMId ? omCards.find((om) => om.id === selectedOMId) || omCards[0] : omCards[0];
  const omDetails = clusterManagerService.getOMDetailedPerformance(selectedOM.id);

  const Sparkline = ({ data, color }: { data: { day: string; value: number }[]; color: string }) => {
    const max = Math.max(...data.map((d) => d.value));
    const min = Math.min(...data.map((d) => d.value));
    const range = max - min;

    return (
      <div className="flex items-end gap-1 h-12">
        {data.map((point, i) => {
          const height = range === 0 ? 50 : ((point.value - min) / range) * 100;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex-1 w-full flex items-end">
                <div
                  className={`w-full ${color} rounded-sm`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-[9px] text-slate-500">{point.day}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const healthConfig = HEALTH_STATUS[selectedOM.overallHealth];

  return (
    <div className="space-y-6">
      {/* OM Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {omCards.map((om) => {
          const config = HEALTH_STATUS[om.overallHealth];
          const isSelected = om.id === selectedOM.id;
          return (
            <Button
              key={om.id}
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => onSelectOM(om.id)}
              className={`whitespace-nowrap ${isSelected ? "" : config.borderColor}`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${config.dotColor}`} />
              {om.name}
              {om.alerts > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5">
                  {om.alerts}
                </Badge>
              )}
            </Button>
          );
        })}
      </div>

      {/* OM Header */}
      <Card className={`p-6 border-2 ${healthConfig.borderColor}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${healthConfig.dotColor}`} />
              <h2 className="text-2xl font-bold text-slate-900">{selectedOM.name}</h2>
              <Badge className={`${healthConfig.color} text-white`}>
                {healthConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {selectedOM.location}
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {selectedOM.teamsSummary.teams} Teams • {selectedOM.teamsSummary.washers} Washers
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Last Activity: {Math.floor((Date.now() - selectedOM.lastActivity.getTime()) / 60000)}m ago
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Initiate Review Session
            </Button>
            <Button variant="destructive" size="sm">
              Raise Intervention Flag
            </Button>
          </div>
        </div>
      </Card>

      {/* KPI Grid with Trends */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Revenue Trend */}
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Revenue MTD</h3>
            <Badge className={`${HEALTH_STATUS[selectedOM.kpis.revenue.status].color} text-white`}>
              {selectedOM.kpis.revenue.percentage.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            ₹{(selectedOM.kpis.revenue.mtd / 100000).toFixed(2)}L
          </div>
          <div className="text-xs text-slate-600 mb-3">
            Target: ₹{(selectedOM.kpis.revenue.target / 100000).toFixed(2)}L
          </div>
          <Sparkline data={omDetails.trends.revenue.sparkline} color="bg-blue-500" />
          <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
            <TrendingUp className="w-3 h-3" />
            {omDetails.trends.revenue.growth.toFixed(1)}% growth
          </div>
        </Card>

        {/* Conversion Trend */}
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Conversion Rate</h3>
            <Badge className={`${HEALTH_STATUS[selectedOM.kpis.conversion.status].color} text-white`}>
              {selectedOM.kpis.conversion.rate.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {selectedOM.kpis.conversion.rate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-600 mb-3">
            Target: {selectedOM.kpis.conversion.target}%
          </div>
          <Sparkline data={omDetails.trends.conversion.sparkline} color="bg-purple-500" />
          <div className="text-xs text-slate-600 mt-2">
            7-day avg: {omDetails.trends.conversion.average.toFixed(1)}%
          </div>
        </Card>

        {/* Retention Trend */}
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Retention Rate</h3>
            <Badge className={`${HEALTH_STATUS[selectedOM.kpis.retention.status].color} text-white`}>
              {selectedOM.kpis.retention.rate.toFixed(1)}%
            </Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {selectedOM.kpis.retention.rate.toFixed(1)}%
          </div>
          <div className="text-xs text-slate-600 mb-3">
            Target: {selectedOM.kpis.retention.target}%
          </div>
          <Sparkline data={omDetails.trends.retention.sparkline} color="bg-green-500" />
          <div className="text-xs text-slate-600 mt-2">
            7-day avg: {omDetails.trends.retention.average.toFixed(1)}%
          </div>
        </Card>

        {/* Compliance Trend */}
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Compliance Score</h3>
            <Badge className={`${HEALTH_STATUS[selectedOM.kpis.compliance.status].color} text-white`}>
              {selectedOM.kpis.compliance.score}
            </Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">
            {selectedOM.kpis.compliance.score}/100
          </div>
          <div className="text-xs text-slate-600 mb-3">
            {selectedOM.kpis.compliance.issues} open issues
          </div>
          <Sparkline data={omDetails.trends.compliance.sparkline} color="bg-amber-500" />
          <div className="text-xs text-slate-600 mt-2">
            7-day avg: {omDetails.trends.compliance.average.toFixed(1)}
          </div>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Pipeline Status */}
        <Card className="p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Pipeline Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Active Leads</span>
              <span className="text-sm font-semibold text-slate-900">{omDetails.pipeline.leads}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Demos Scheduled</span>
              <span className="text-sm font-semibold text-slate-900">{omDetails.pipeline.demos}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">In Negotiation</span>
              <span className="text-sm font-semibold text-slate-900">{omDetails.pipeline.negotiations}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-sm font-semibold text-slate-900">Pipeline Value</span>
              <span className="text-sm font-bold text-blue-600">
                ₹{(omDetails.pipeline.value / 100000).toFixed(2)}L
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Full Pipeline
          </Button>
        </Card>

        {/* Team & Operations */}
        <Card className="p-4 border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Team Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Attendance Rate</span>
              <span className="text-sm font-semibold text-slate-900">
                {omDetails.teamStatus.attendanceRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Avg Units/Washer</span>
              <span className="text-sm font-semibold text-slate-900">
                {omDetails.teamStatus.avgUnitsPerWasher.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Open Complaints</span>
              <span className={`text-sm font-semibold ${omDetails.openComplaints > 0 ? "text-red-600" : "text-green-600"}`}>
                {omDetails.openComplaints}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Pending Approvals</span>
              <span className={`text-sm font-semibold ${omDetails.pendingApprovals > 0 ? "text-amber-600" : "text-green-600"}`}>
                {omDetails.pendingApprovals}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            View Team Status (Read-Only)
          </Button>
        </Card>
      </div>

      {/* Last Field Visit */}
      {omDetails.lastFieldVisit && (
        <Card className="p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-600" />
              <span className="text-sm text-slate-600">
                Last Field Visit: {omDetails.lastFieldVisit.toLocaleDateString()} (
                {Math.floor((Date.now() - omDetails.lastFieldVisit.getTime()) / (24 * 60 * 60 * 1000))} days ago)
              </span>
            </div>
            <Button variant="outline" size="sm">
              View Visit History
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
