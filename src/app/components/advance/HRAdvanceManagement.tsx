/**
 * HR Advance Management Dashboard
 * Admin interface for managing employee advances
 * Shows: Approvals, Ledger, EMI Tracker, Alerts
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { advanceManagementService } from "../../services/advanceManagementService";
import { getAdvanceSettings, updateAdvanceSettings, type AdvanceSettings } from "../../config/advanceSettings";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  FileText,
  Lock,
  Search,
  Filter,
  Download,
  Calendar,
  Shield,
  Settings,
  Save,
} from "lucide-react";
import type { AdvanceAnalytics, LongTermAdvance, ShortTermAdvance } from "../../types/advanceManagement";

type TabType = "approvals" | "ledger" | "emi-tracker" | "alerts" | "settings";

export function HRAdvanceManagement() {
  const navigate = useNavigate();
  const { currentRole, currentUser } = useRole();
  const [activeTab, setActiveTab] = useState<TabType>("approvals");
  const [analytics, setAnalytics] = useState<AdvanceAnalytics | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [allAdvances, setAllAdvances] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Settings state
  const [advanceSettings, setAdvanceSettings] = useState<AdvanceSettings>(getAdvanceSettings());
  const [washerSupervisorLimit, setWasherSupervisorLimit] = useState(advanceSettings.washerSupervisorLimit);
  const [otherRolesLimit, setOtherRolesLimit] = useState(advanceSettings.otherRolesLimit);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Get analytics
    const analyticsData = advanceManagementService.getAnalytics();
    setAnalytics(analyticsData);

    // Get pending approvals
    const pending = advanceManagementService.getPendingApprovals();
    setPendingApprovals(pending);

    // Get all advances
    const longTerm = advanceManagementService.getAllLongTermAdvances();
    const shortTerm = advanceManagementService.getAllShortTermAdvances();
    setAllAdvances([...longTerm, ...shortTerm]);
  };

  const filteredAdvances = allAdvances.filter((advance) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      advance.employeeName?.toLowerCase().includes(query) ||
      advance.employeeId?.toLowerCase().includes(query) ||
      advance.id?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Advance Management</h1>
          <p className="text-sm text-gray-600 mt-2">
            Approvals • Disbursements • EMI Tracking • Financial Control
          </p>
        </div>

        {/* Analytics Overview */}
        {analytics && (
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            {/* Pending Approvals */}
            <Card className="border-amber-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setActiveTab("approvals")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Pending Approvals</p>
                    <p className="text-3xl font-bold text-amber-600">{analytics.pendingApprovals}</p>
                  </div>
                  <Clock className="w-10 h-10 text-amber-300" />
                </div>
              </CardContent>
            </Card>

            {/* Total Outstanding */}
            <Card className="border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Outstanding</p>
                    <p className="text-2xl font-bold text-red-600">
                      ₹{(analytics?.totalOutstanding ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <DollarSign className="w-10 h-10 text-red-300" />
                </div>
              </CardContent>
            </Card>

            {/* Active Advances */}
            <Card className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Active Advances</p>
                    <p className="text-3xl font-bold text-blue-600">{analytics.activeAdvances}</p>
                  </div>
                  <Users className="w-10 h-10 text-blue-300" />
                </div>
              </CardContent>
            </Card>

            {/* Total Disbursed */}
            <Card className="border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total Disbursed</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{(analytics?.totalDisbursed ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-green-300" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Risk Indicators */}
        {analytics && (analytics.missedEmis > 0 || analytics.defaultedAdvances > 0 || analytics.pendingSettlements > 0) && (
          <Card className="mb-6 border-red-300 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 text-sm mb-2">⚠️ Risk Alerts</p>
                  <div className="grid md:grid-cols-3 gap-3">
                    {analytics.missedEmis > 0 && (
                      <div className="p-2 bg-white border border-red-200 rounded">
                        <p className="text-xs text-gray-600">Missed EMIs</p>
                        <p className="text-lg font-bold text-red-600">{analytics.missedEmis}</p>
                      </div>
                    )}
                    {analytics.defaultedAdvances > 0 && (
                      <div className="p-2 bg-white border border-red-200 rounded">
                        <p className="text-xs text-gray-600">Defaulted</p>
                        <p className="text-lg font-bold text-red-600">{analytics.defaultedAdvances}</p>
                      </div>
                    )}
                    {analytics.pendingSettlements > 0 && (
                      <div className="p-2 bg-white border border-red-200 rounded">
                        <p className="text-xs text-gray-600">Exit Pending</p>
                        <p className="text-lg font-bold text-red-600">{analytics.pendingSettlements}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {analytics && (analytics.pendingDisbursements > 0 || analytics.chequesNotDeposited > 0) && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900 text-sm mb-2">🔐 Pending Actions</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {analytics.chequesNotDeposited > 0 && (
                      <div className="p-2 bg-white border border-blue-200 rounded">
                        <p className="text-xs text-gray-600">Cheques Not Deposited</p>
                        <p className="text-lg font-bold text-blue-600">{analytics.chequesNotDeposited}</p>
                        <p className="text-xs text-blue-700 mt-1">⚠️ Disbursement blocked</p>
                      </div>
                    )}
                    {analytics.pendingDisbursements > 0 && (
                      <div className="p-2 bg-white border border-blue-200 rounded">
                        <p className="text-xs text-gray-600">Ready to Disburse</p>
                        <p className="text-lg font-bold text-blue-600">{analytics.pendingDisbursements}</p>
                        <p className="text-xs text-green-700 mt-1">✓ Cheque deposited</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("approvals")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "approvals"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Approvals Dashboard
                  {pendingApprovals.length > 0 && (
                    <Badge className="bg-amber-600">{pendingApprovals.length}</Badge>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("ledger")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "ledger"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Advance Ledger
                </div>
              </button>

              <button
                onClick={() => setActiveTab("emi-tracker")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "emi-tracker"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  EMI Tracker
                </div>
              </button>

              <button
                onClick={() => setActiveTab("alerts")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "alerts"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Alerts / Exceptions
                </div>
              </button>

              {/* Settings Tab - Super Admin Only */}
              {currentRole === "Super Admin" && (
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "settings"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Settings
                    <Badge className="bg-purple-600 text-xs">Admin</Badge>
                  </div>
                </button>
              )}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "approvals" && (
          <ApprovalsTab
            pendingApprovals={pendingApprovals}
            onRefresh={loadData}
          />
        )}

        {activeTab === "ledger" && (
          <LedgerTab
            advances={filteredAdvances}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === "emi-tracker" && (
          <EMITrackerTab advances={allAdvances} />
        )}

        {activeTab === "alerts" && (
          <AlertsTab analytics={analytics} advances={allAdvances} />
        )}

        {/* Settings Tab - Super Admin Only */}
        {activeTab === "settings" && currentRole === "Super Admin" && (
          <div className="space-y-6">
            {/* Settings Header */}
            <Card className="border-2 border-purple-200 bg-purple-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-purple-900 mb-1">
                      Super Admin — Advance Limit Configuration
                    </p>
                    <p className="text-sm text-purple-800">
                      Configure role-based advance percentage limits. Changes apply to all new advance
                      applications immediately.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Settings Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="w-5 h-5 text-gray-700" />
                  Current Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      Car Washer & Supervisor Limit
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {advanceSettings.washerSupervisorLimit}%
                    </p>
                    <p className="text-xs text-blue-700 mt-1">of monthly gross salary</p>
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs text-green-700 font-medium mb-1">All Other Roles Limit</p>
                    <p className="text-3xl font-bold text-green-900">
                      {advanceSettings.otherRolesLimit}%
                    </p>
                    <p className="text-xs text-green-700 mt-1">of monthly gross salary</p>
                  </div>
                </div>

                {advanceSettings.lastUpdatedBy && (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-700">
                      <strong>Last updated by:</strong> {advanceSettings.lastUpdatedBy}
                      <span className="ml-2">on</span>{" "}
                      {new Date(advanceSettings.lastUpdatedOn).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Edit Advance Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Car Washer & Supervisor Limit */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900">
                      Car Washer and Supervisor Advance Limit (%) *
                    </Label>
                    <p className="text-xs text-gray-600 mb-2">
                      Percentage of monthly gross salary that Car Washers and Supervisors can request
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={washerSupervisorLimit}
                        onChange={(e) => setWasherSupervisorLimit(Number(e.target.value))}
                        className="max-w-[200px]"
                      />
                      <Badge className="bg-blue-600">
                        {washerSupervisorLimit}% of gross salary
                      </Badge>
                    </div>
                  </div>

                  {/* Other Roles Limit */}
                  <div>
                    <Label className="text-sm font-semibold text-gray-900">
                      All Other Roles Advance Limit (%) *
                    </Label>
                    <p className="text-xs text-gray-600 mb-2">
                      Percentage of monthly gross salary that all other employees can request
                    </p>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={otherRolesLimit}
                        onChange={(e) => setOtherRolesLimit(Number(e.target.value))}
                        className="max-w-[200px]"
                      />
                      <Badge className="bg-green-600">
                        {otherRolesLimit}% of gross salary
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Example Calculation */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                    Example Calculation:
                  </p>
                  <div className="space-y-1 text-xs text-amber-800">
                    <p>
                      • Car Washer with ₹30,000 gross salary → Max advance: ₹
                      {((30000 * washerSupervisorLimit) / 100).toLocaleString()} (
                      {washerSupervisorLimit}%)
                    </p>
                    <p>
                      • Other role with ₹30,000 gross salary → Max advance: ₹
                      {((30000 * otherRolesLimit) / 100).toLocaleString()} ({otherRolesLimit}%)
                    </p>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => {
                      if (
                        washerSupervisorLimit < 1 ||
                        washerSupervisorLimit > 100 ||
                        otherRolesLimit < 1 ||
                        otherRolesLimit > 100
                      ) {
                        toast.error("⚠️ Invalid Input\n\nPercentage values must be between 1 and 100.");
                        return;
                      }

                      try {
                        updateAdvanceSettings(
                          washerSupervisorLimit,
                          otherRolesLimit,
                          currentUser.name
                        );

                        const updatedSettings = getAdvanceSettings();
                        setAdvanceSettings(updatedSettings);

                        toast.success(
                          `✅ Advance Limits Updated!\n\n` +
                            `Car Washer/Supervisor: ${washerSupervisorLimit}%\n` +
                            `Other Roles: ${otherRolesLimit}%\n\n` +
                            `Changes will apply to all new advance applications immediately.`
                        );
                      } catch (error: any) {
                        toast.error(`❌ Failed to save settings: ${error.message}`);
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setWasherSupervisorLimit(advanceSettings.washerSupervisorLimit);
                      setOtherRolesLimit(advanceSettings.otherRolesLimit);
                    }}
                  >
                    Reset to Current
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Important Notice */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900 text-sm mb-1">Important</p>
                    <ul className="text-xs text-red-800 space-y-1 list-disc list-inside">
                      <li>Changes apply immediately to all new advance applications</li>
                      <li>Existing approved advances are not affected</li>
                      <li>Employees will see their role-based limit when applying</li>
                      <li>Limits are based on monthly gross salary, not earned salary</li>
                      <li>
                        All changes are logged with timestamp and user who made the change
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Approvals Tab
function ApprovalsTab({ pendingApprovals, onRefresh }: { pendingApprovals: any[]; onRefresh: () => void }) {
  const [selectedAdvance, setSelectedAdvance] = useState<any>(null);

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</h3>
            <p className="text-sm text-gray-600">
              No pending approvals at the moment. All advance requests have been processed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {pendingApprovals.map((advance) => (
        <Card key={advance.id} className="border-2 border-amber-200 hover:border-amber-400 transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{advance.employeeName}</h3>
                  <Badge className="bg-amber-600">Pending Approval</Badge>
                  <Badge variant="outline">
                    {"emiSchedule" in advance ? "Long-Term" : "Short-Term"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Employee ID: {advance.employeeId} • Role: {advance.employeeRole}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Applied: {new Date(advance.appliedDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  ₹{"emiSchedule" in advance ? (advance?.advanceAmount ?? 0).toLocaleString() : (advance?.requestedAmount ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Approval Authority: {advance.approvalAuthority}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              {"emiSchedule" in advance && (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Tenure</p>
                    <p className="text-sm font-semibold">{advance.tenureMonths} months</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">EMI Amount</p>
                    <p className="text-sm font-semibold">₹{(advance?.emiAmount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Cheque Amount</p>
                    <p className="text-sm font-semibold">₹{(advance?.securityCheque?.chequeAmount ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Cheque Number</p>
                    <p className="text-sm font-semibold font-mono">{advance.securityCheque.chequeNumber}</p>
                  </div>
                </>
              )}
              {!("emiSchedule" in advance) && (
                <>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Days Worked</p>
                    <p className="text-sm font-semibold">{advance.daysWorked} days</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Salary Till Date</p>
                    <p className="text-sm font-semibold">₹{(advance?.salaryTillDate ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Max Eligible</p>
                    <p className="text-sm font-semibold">₹{(advance?.maxEligible ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-600">Over Limit</p>
                    <p className={`text-sm font-semibold ${advance.isOverLimit ? "text-red-600" : "text-green-600"}`}>
                      {advance.isOverLimit ? "Yes - Override" : "No - Within Limit"}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                onClick={() => {
                  if ("emiSchedule" in advance) {
                    advanceManagementService.approveLongTermAdvance(
                      advance.id,
                      "HR Manager",
                      "HR",
                      "Approved by HR"
                    );
                  } else {
                    advanceManagementService.approveShortTermOverride(
                      advance.id,
                      "HR Manager",
                      "HR"
                    );
                  }
                  toast.success("✅ Advance approved successfully!");
                  onRefresh();
                }}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>

              <Button
                onClick={() => {
                  const reason = prompt("Enter rejection reason:");
                  if (reason) {
                    if ("emiSchedule" in advance) {
                      advanceManagementService.rejectLongTermAdvance(
                        advance.id,
                        "HR Manager",
                        "HR",
                        reason
                      );
                    }
                    toast.info("❌ Advance rejected");
                    onRefresh();
                  }
                }}
                variant="destructive"
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>

              <Button
                onClick={() => setSelectedAdvance(advance)}
                variant="outline"
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Ledger Tab
function LedgerTab({
  advances,
  searchQuery,
  onSearchChange,
}: {
  advances: any[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by employee name, ID, or advance ID..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advances Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {advances.map((advance) => (
                  <tr key={advance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{advance.employeeName}</p>
                        <p className="text-xs text-gray-500">{advance.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">
                        {"emiSchedule" in advance ? "Long-Term" : "Short-Term"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      ₹{"emiSchedule" in advance ? (advance?.advanceAmount ?? 0).toLocaleString() : (advance?.requestedAmount ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <AdvanceStatusBadge status={advance.status} />
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600">
                      {"remainingAmount" in advance ? `₹${(advance?.remainingAmount ?? 0).toLocaleString()}` : advance.isRecovered ? "₹0" : `₹${(advance?.requestedAmount ?? 0).toLocaleString()}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(advance.appliedDate).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// EMI Tracker Tab
function EMITrackerTab({ advances }: { advances: any[] }) {
  const longTermAdvances = advances.filter((a) => "emiSchedule" in a);

  return (
    <div className="space-y-4">
      {longTermAdvances.map((advance) => (
        <Card key={advance.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{advance.employeeName}</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  ID: {advance.id} • ₹{(advance?.advanceAmount ?? 0).toLocaleString()}
                </p>
              </div>
              <AdvanceStatusBadge status={advance.status} />
            </div>
          </CardHeader>
          <CardContent>
            {/* EMI Schedule */}
            <div className="space-y-2">
              {advance.emiSchedule.map((emi: any) => (
                <div
                  key={emi.id}
                  className={`p-3 rounded border-2 ${
                    emi.status === "DEDUCTED"
                      ? "border-green-200 bg-green-50"
                      : emi.status === "PENDING"
                      ? "border-gray-200 bg-gray-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        emi.status === "DEDUCTED" ? "bg-green-600" : "bg-gray-300"
                      }`}>
                        <span className="text-white text-sm font-bold">{emi.emiNumber}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">EMI #{emi.emiNumber}</p>
                        <p className="text-xs text-gray-600">
                          Due: {new Date(emi.dueDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₹{(emi?.emiAmount ?? 0).toLocaleString()}</p>
                      <Badge
                        variant={emi.status === "DEDUCTED" ? "default" : "outline"}
                        className={emi.status === "DEDUCTED" ? "bg-green-600" : ""}
                      >
                        {emi.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Alerts Tab
function AlertsTab({ analytics, advances }: { analytics: AdvanceAnalytics | null; advances: any[] }) {
  const alertAdvances = advances.filter(
    (a) => a.status === "DEFAULTED" || ("missedEmis" in a && a.missedEmis > 0)
  );

  return (
    <div className="space-y-4">
      {alertAdvances.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Alerts</h3>
              <p className="text-sm text-gray-600">All advances are on track. No exceptions found.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        alertAdvances.map((advance) => (
          <Card key={advance.id} className="border-2 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 mb-1">{advance.employeeName}</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {advance.status === "DEFAULTED" ? "⚠️ Defaulted Advance" : `⚠️ ${advance.missedEmis} Missed EMI(s)`}
                  </p>
                  <p className="text-xs text-gray-600">
                    Advance ID: {advance.id} • Amount: ₹{advance.advanceAmount?.toLocaleString() || advance.requestedAmount?.toLocaleString()}
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  Take Action
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// Status Badge Component
function AdvanceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    PENDING_APPROVAL: { color: "bg-amber-100 text-amber-800 border-amber-300", label: "Pending" },
    APPROVED: { color: "bg-green-100 text-green-800 border-green-300", label: "Approved" },
    REJECTED: { color: "bg-red-100 text-red-800 border-red-300", label: "Rejected" },
    CHEQUE_PENDING: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Cheque Pending" },
    DISBURSED: { color: "bg-purple-100 text-purple-800 border-purple-300", label: "Disbursed" },
    ACTIVE: { color: "bg-green-100 text-green-800 border-green-300", label: "Active" },
    COMPLETED: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Completed" },
    DEFAULTED: { color: "bg-red-100 text-red-800 border-red-300", label: "Defaulted" },
  };

  const { color, label } = config[status] || config.ACTIVE;
  return (
    <Badge variant="outline" className={`${color} border`}>
      {label}
    </Badge>
  );
}
