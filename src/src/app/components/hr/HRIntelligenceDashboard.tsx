/**
 * HR Intelligence Dashboard
 *
 * AI-powered HR analytics and automation dashboard
 * Features:
 * - Attendance health monitoring
 * - Employee risk flags
 * - Payroll anomalies
 * - Smart alerts
 * - Trust scores
 */

import React, { useState, useEffect } from "react";
import { DataService } from "../../services/DataService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Shield,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Target,
  Activity,
  Eye,
  RefreshCw,
} from "lucide-react";
import { attendanceTrustScoreService } from "../../services/attendanceTrustScore";
import { smartAlertsService } from "../../services/smartAlertsService";
import { incentiveEngine } from "../../services/incentiveEngine";
import { exitWorkflowService } from "../../services/exitWorkflowService";

export function HRIntelligenceDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "trustScores" | "alerts" | "incentives" | "exits">("overview");
  const [loading, setLoading] = useState(true);

  // Data states
  const [trustScores, setTrustScores] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertSummary, setAlertSummary] = useState<any>(null);
  const [incentiveSummary, setIncentiveSummary] = useState<any>(null);
  const [exitWorkflows, setExitWorkflows] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);

    // Load trust scores
    const scores = attendanceTrustScoreService.getAllScores();
    setTrustScores(scores.sort((a, b) => a.overallScore - b.overallScore));

    // Load alerts
    const activeAlerts = smartAlertsService.getActiveAlerts();
    setAlerts(activeAlerts);
    setAlertSummary(smartAlertsService.getSummary());

    // Load incentives
    const incSummary = incentiveEngine.getSummary();
    setIncentiveSummary(incSummary);

    // Load exit workflows
    const exits = exitWorkflowService.getActiveExits();
    setExitWorkflows(exits);

    setLoading(false);
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    smartAlertsService.acknowledgeAlert(alertId, "Admin");
    loadData();
  };

  const handleResolveAlert = (alertId: string) => {
    smartAlertsService.resolveAlert(alertId, "Admin");
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading Intelligence Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">HR Intelligence Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-powered insights and automation for workforce management
          </p>
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
                <p className="text-xs text-red-600 mt-1">
                  {alerts.filter(a => a.priority === "Critical" || a.priority === "High").length} high priority
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Bell className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Risk Employees</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trustScores.filter(s => s.trustLevel === "Low" || s.trustLevel === "Critical").length}
                </p>
                <p className="text-xs text-orange-600 mt-1">Low/Critical trust</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Incentives</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{incentiveSummary?.byStatus?.Pending?.amount.toLocaleString() || 0}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  {incentiveSummary?.byStatus?.Pending?.count || 0} employees
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Exits</p>
                <p className="text-2xl font-bold text-gray-900">{exitWorkflows.length}</p>
                <p className="text-xs text-gray-600 mt-1">In progress</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-6">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "trustScores", label: "Trust Scores", icon: Shield },
            { id: "alerts", label: "Smart Alerts", icon: Bell },
            { id: "incentives", label: "Incentives", icon: Target },
            { id: "exits", label: "Exit Workflows", icon: Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 px-1 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab alerts={alerts} trustScores={trustScores} />}
      {activeTab === "trustScores" && <TrustScoresTab scores={trustScores} />}
      {activeTab === "alerts" && (
        <AlertsTab
          alerts={alerts}
          onAcknowledge={handleAcknowledgeAlert}
          onResolve={handleResolveAlert}
        />
      )}
      {activeTab === "incentives" && <IncentivesTab summary={incentiveSummary} />}
      {activeTab === "exits" && <ExitsTab workflows={exitWorkflows} />}
    </div>
  );
}

/**
 * Overview Tab
 */
function OverviewTab({ alerts = [], trustScores = [] }: any) {
  const criticalAlerts = (alerts || []).filter((a: any) => a.priority === "Critical");
  const lowTrustEmployees = (trustScores || []).filter((s: any) => s.trustLevel === "Low" || s.trustLevel === "Critical");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Critical Alerts ({criticalAlerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {criticalAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No critical alerts</div>
          ) : (
            <div className="space-y-3">
              {criticalAlerts.slice(0, 5).map((alert: any, idx: number) => (
                <div key={alert.alertId || `alert-${idx}`} className="border border-red-200 bg-red-50 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-red-900">{alert.title}</div>
                      <div className="text-xs text-red-700 mt-1">{alert.description}</div>
                      <div className="text-xs text-red-600 mt-1">{alert.employeeName}</div>
                    </div>
                    <Badge className="bg-red-600 text-white">Critical</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Trust Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="w-5 h-5 text-orange-600" />
            Risk Employees ({lowTrustEmployees.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowTrustEmployees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No risk employees</div>
          ) : (
            <div className="space-y-3">
              {lowTrustEmployees.slice(0, 5).map((score: any, idx: number) => (
                <div key={score.employeeId || `emp-${idx}`} className="border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{score.employeeName}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Score: {score.overallScore}/100 • {score.flagCount} flags
                      </div>
                    </div>
                    <Badge className={score.trustLevel === "Critical" ? "bg-red-600 text-white" : "bg-orange-500 text-white"}>
                      {score.trustLevel}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Trust Scores Tab
 */
function TrustScoresTab({ scores = [] }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee Trust Scores</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Employee</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Overall Score</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Trust Level</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Flags</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Punctuality</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Consistency</th>
              </tr>
            </thead>
            <tbody>
              {(scores || []).map((score: any, idx: number) => (
                <tr key={score.employeeId || `score-${idx}`} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">{score.employeeName}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-900">{score.overallScore}</div>
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            score.overallScore >= 85 ? "bg-green-500" :
                            score.overallScore >= 70 ? "bg-yellow-500" :
                            "bg-red-500"
                          }`}
                          style={{ width: `${score.overallScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      className={
                        score.trustLevel === "High" ? "bg-green-100 text-green-700" :
                        score.trustLevel === "Medium" ? "bg-yellow-100 text-yellow-700" :
                        score.trustLevel === "Low" ? "bg-orange-100 text-orange-700" :
                        "bg-red-100 text-red-700"
                      }
                    >
                      {score.trustLevel}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{score.flagCount}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{score.punctualityScore}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{score.consistencyScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Alerts Tab
 */
function AlertsTab({ alerts = [], onAcknowledge, onResolve }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Smart Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {(alerts || []).length === 0 ? (
            <div className="text-center py-8 text-gray-500">No active alerts</div>
          ) : (
            (alerts || []).map((alert: any, idx: number) => (
              <div
                key={alert.alertId || `alert-item-${idx}`}
                className={`border rounded-lg p-4 ${
                  alert.priority === "Critical" ? "border-red-300 bg-red-50" :
                  alert.priority === "High" ? "border-orange-300 bg-orange-50" :
                  "border-yellow-300 bg-yellow-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          alert.priority === "Critical" ? "bg-red-600 text-white" :
                          alert.priority === "High" ? "bg-orange-600 text-white" :
                          "bg-yellow-600 text-white"
                        }
                      >
                        {alert.priority}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">{alert.title}</span>
                    </div>
                    <div className="text-sm text-gray-700 mt-2">{alert.description}</div>
                    <div className="text-xs text-gray-600 mt-2">
                      Employee: {alert.employeeName} • {alert.type} • {new Date(alert.detectedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => onAcknowledge(alert.alertId)}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Acknowledge
                    </button>
                    <button
                      onClick={() => onResolve(alert.alertId)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Incentives Tab
 */
function IncentivesTab({ summary = null }: any) {
  if (!summary || !summary.topEmployees) {
    return <div className="text-center py-8 text-gray-500">No incentive data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <p className="text-sm text-gray-600">Total Incentives</p>
            <p className="text-2xl font-bold text-gray-900">{summary.totalIncentives}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <p className="text-sm text-gray-600">Total Amount</p>
            <p className="text-2xl font-bold text-green-600">₹{(summary?.totalAmount ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <p className="text-sm text-gray-600">Pending Approval</p>
            <p className="text-2xl font-bold text-orange-600">
              ₹{summary.byStatus?.Pending?.amount.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Employees */}
      <Card>
        <CardHeader>
          <CardTitle>Top Earning Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.topEmployees.slice(0, 10).map((emp: any, idx: number) => (
              <div key={emp.employeeId || `top-emp-${idx}`} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                </div>
                <div className="text-sm font-semibold text-green-600">₹{(emp?.totalAmount ?? 0).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Exits Tab
 */
function ExitsTab({ workflows = [] }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Exit Workflows</CardTitle>
      </CardHeader>
      <CardContent>
        {(workflows || []).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No active exit workflows</div>
        ) : (
          <div className="space-y-4">
            {(workflows || []).map((workflow: any, idx: number) => (
              <div key={workflow.exitId || `workflow-${idx}`} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{workflow.employeeName}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {workflow.exitType} • Initiated: {workflow.initiatedDate}
                    </div>
                    <div className="text-xs text-gray-600">
                      Last Working Date: {workflow.lastWorkingDate}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="text-xs">
                        Assets: {(workflow.assets || []).filter((a: any) => a.status === "Returned").length}/{(workflow.assets || []).length}
                      </div>
                      <div className="text-xs">
                        Clearances: {(workflow.clearances || []).filter((c: any) => c.status === "Approved").length}/{(workflow.clearances || []).filter((c: any) => c.required).length}
                      </div>
                    </div>
                  </div>
                  <Badge
                    className={
                      workflow.exitStatus === "Completed" ? "bg-green-100 text-green-700" :
                      workflow.exitStatus === "Clearance Pending" ? "bg-orange-100 text-orange-700" :
                      "bg-blue-100 text-blue-700"
                    }
                  >
                    {workflow.exitStatus}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
