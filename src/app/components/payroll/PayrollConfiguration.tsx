/**
 * Payroll Configuration - System Settings Only
 *
 * Single source of truth enforcement:
 * - Salary configuration: ONLY in Salary Structure screen
 * - System settings: payroll cycle, payout timing, approval flow, processing rules
 *
 * @component
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  LayoutGrid,
  Settings,
  CheckCircle,
  TrendingUp,
  Database,
  Clock,
  Calendar,
  Shield,
  AlertCircle,
  Users,
  FileText,
  ClipboardCheck,
} from "lucide-react";
import { PayrollProcessingFlow } from "./PayrollProcessingFlow";
import { PayrollProcessingTab } from "./PayrollProcessingTab";

export function PayrollConfiguration() {
  const [activeTab, setActiveTab] = useState("dashboard");

  // System Settings State
  const [payrollCycle, setPayrollCycle] = useState("monthly");
  const [payrollDay, setPayrollDay] = useState("28");
  const [payoutTiming, setPayoutTiming] = useState("end-of-month");
  const [approvalRequired, setApprovalRequired] = useState(true);
  const [autoProcessing, setAutoProcessing] = useState(false);

  const stats = {
    totalEmployees: 10,
    totalPayroll: 343505,
    pendingApprovals: 1,
    slipsGenerated: 10,
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll System Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure payroll cycle, payout timing, approval flow, and processing rules
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-sm">System Settings</span>
          </Badge>
        </div>

        {/* Engine Labels */}
        <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Database className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">System Settings</p>
            <p className="text-xs text-blue-700">
              Payroll execution configuration • Salary configuration in{" "}
              <span className="font-semibold">Salary Structure</span> screen
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-orange-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900">Single Source of Truth</p>
            <p className="text-xs text-orange-700">
              All salary, incentive, and compliance configuration is managed in the{" "}
              <span className="font-semibold">Salary Structure</span> screen.
              This screen only contains system execution settings.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 mb-1">Total Employees</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalEmployees}</p>
              </div>
              <Users className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 mb-1">Monthly Payroll</p>
                <p className="text-3xl font-bold text-green-900">
                  ₹{(stats.totalPayroll / 100000).toFixed(1)}L
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 mb-1">Pending Approvals</p>
                <p className="text-3xl font-bold text-orange-900">{stats.pendingApprovals}</p>
              </div>
              <ClipboardCheck className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 mb-1">Slips Generated</p>
                <p className="text-3xl font-bold text-purple-900">{stats.slipsGenerated}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="system-settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">System Settings</span>
          </TabsTrigger>
          <TabsTrigger value="processing-flow" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Processing Flow</span>
          </TabsTrigger>
          <TabsTrigger value="payroll-processing" className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Payroll Processing</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* System Configuration Overview */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold">System Configuration Overview</h2>
                  <p className="text-sm text-gray-600 mt-1">Current payroll system settings</p>
                </div>
                <Badge variant="outline" className="flex items-center gap-1.5 px-2.5 py-1">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-xs">Active Configuration</span>
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Calendar className="w-8 h-8 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      Active
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">Payroll Cycle</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Current: <span className="font-semibold">Monthly</span>
                  </p>
                  <p className="text-xs text-gray-500">Payment Day: {payrollDay}th of month</p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Clock className="w-8 h-8 text-green-600" />
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      Active
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">Payout Timing</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Current: <span className="font-semibold">End of Month</span>
                  </p>
                  <p className="text-xs text-gray-500">Processed after approval</p>
                </div>

                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Shield className="w-8 h-8 text-purple-600" />
                    <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-xs">
                      {approvalRequired ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">Approval Flow</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Status: <span className="font-semibold">{approvalRequired ? "Enabled" : "Disabled"}</span>
                  </p>
                  <p className="text-xs text-gray-500">Multi-stage approval workflow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-3 sm:p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setActiveTab("system-settings")}
                  className="p-4 border rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Settings className="w-8 h-8 text-blue-600" />
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      Configure
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">Configure System Settings</h3>
                  <p className="text-sm text-gray-600">
                    Set payroll cycle, payout timing, and processing rules
                  </p>
                </div>

                <div
                  onClick={() => setActiveTab("processing-flow")}
                  className="p-4 border rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <TrendingUp className="w-8 h-8 text-orange-600" />
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                      Workflow
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2">Processing Flow</h3>
                  <p className="text-sm text-gray-600">
                    Calculate → Review → Approve workflow
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Configuration Notice */}
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-600 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 mb-2">Salary Configuration</h3>
                  <p className="text-sm text-orange-800 mb-3">
                    All salary structure, incentive rules, and compliance configuration is managed
                    in the <span className="font-bold">Salary Structure</span> screen.
                  </p>
                  <p className="text-xs text-orange-700">
                    This ensures a single source of truth for all pay calculation settings used by payrollEngine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="system-settings" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payroll Cycle Settings</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-xs">Used by payrollEngine</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Payroll Cycle</Label>
                  <Select value={payrollCycle} onValueChange={setPayrollCycle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Day of Month</Label>
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={payrollDay}
                    onChange={(e) => setPayrollDay(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">Day of month to process payroll</p>
                </div>
              </div>

              <div className="pt-4">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Cycle Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payout Timing</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">System Configuration</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payout Schedule</Label>
                <Select value={payoutTiming} onValueChange={setPayoutTiming}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (Same Day)</SelectItem>
                    <SelectItem value="next-day">Next Business Day</SelectItem>
                    <SelectItem value="end-of-month">End of Month</SelectItem>
                    <SelectItem value="first-of-next-month">1st of Next Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Payout Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Approval Flow Configuration</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="text-xs">Workflow Settings</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Require Approval</p>
                  <p className="text-sm text-gray-600">Enable multi-stage approval workflow</p>
                </div>
                <Button
                  variant={approvalRequired ? "default" : "outline"}
                  onClick={() => setApprovalRequired(!approvalRequired)}
                >
                  {approvalRequired ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {approvalRequired && (
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Approval Stages</h4>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge>1</Badge>
                      <span className="text-sm">HR Manager Review</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge>2</Badge>
                      <span className="text-sm">Admin Approval</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Badge>3</Badge>
                      <span className="text-sm">Accounts Manager Final Approval</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Approval Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Processing Rules</CardTitle>
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5" />
                  <span className="text-xs">Execution Settings</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Auto-Processing</p>
                  <p className="text-sm text-gray-600">Automatically run payroll on scheduled day</p>
                </div>
                <Button
                  variant={autoProcessing ? "default" : "outline"}
                  onClick={() => setAutoProcessing(!autoProcessing)}
                >
                  {autoProcessing ? "Enabled" : "Disabled"}
                </Button>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Processing rules define how payrollEngine executes calculations. All salary components
                  are configured in the Salary Structure screen.
                </p>
              </div>

              <div className="pt-4">
                <Button>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Processing Rules
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Processing Flow Tab */}
        <TabsContent value="processing-flow">
          <PayrollProcessingFlow />
        </TabsContent>

        {/* Payroll Processing Tab */}
        <TabsContent value="payroll-processing">
          <PayrollProcessingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
