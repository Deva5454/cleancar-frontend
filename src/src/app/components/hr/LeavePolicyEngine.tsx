// Leave Policy Engine - Centralized Configuration System
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { BackButton } from "../ui/back-button";
import {
  Settings,
  Save,
  Download,
  Eye,
  History,
  AlertCircle,
  CheckCircle,
  FileText,
  Bell,
  Edit,
  Calendar,
  Clock,
  RefreshCw,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner";
import {
  CURRENT_LEAVE_POLICY,
  LEAVE_POLICY_HISTORY,
  generateLeavePolicyDocument,
  getLeavePolicySummary,
  type LeaveTypePolicy,
  type LeavePolicyVersion,
} from "../../config/leavePolicyConfiguration";

export function LeavePolicyEngine() {
  const [activePolicies, setActivePolicies] = useState<LeaveTypePolicy[]>(CURRENT_LEAVE_POLICY);
  const [showPolicyDocument, setShowPolicyDocument] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<LeaveTypePolicy | null>(null);
  const [editMode, setEditMode] = useState(false);

  const handleSavePolicy = () => {
    toast.success(
      `✅ Leave Policy Updated!\n\nNew version created and deployed.\nAll employees will be notified of the changes.`
    );
    setEditMode(false);
  };

  const handleDownloadPolicy = () => {
    const document = generateLeavePolicyDocument();
    const blob = new Blob([document], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement("a");
    a.href = url;
    a.download = `CleanCar_Leave_Policy_v${LEAVE_POLICY_HISTORY[0].version}.txt`;
    a.click();
    toast.info("Policy document export coming in Phase 2.");
  };

  const handleNotifyAll = () => {
    toast.success(
      `🔔 Notification Sent!\n\nAll ${156} employees have been notified of the leave policy changes.`
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Leave Policy Engine</h1>
            <p className="text-sm text-gray-500">{getLeavePolicySummary()}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowVersionHistory(true)}
          >
            <History className="w-4 h-4 mr-2" />
            Version History
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPolicyDocument(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Policy
          </Button>
          <Button onClick={handleDownloadPolicy}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Warning Banner */}
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-orange-900 mb-1">
                ⚠️ Centralized Leave Policy Control
              </h4>
              <p className="text-sm text-orange-800">
                All changes made here will automatically reflect across the entire system including:
                Leave Applications, Leave Balances, Accrual Engine, Approval Workflows, and Employee Portal.
                Changes will be versioned and all employees will be notified.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policy Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {activePolicies.map((policy) => (
          <Card
            key={policy.type}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPolicy?.type === policy.type ? "border-2 border-blue-500 bg-blue-50" : ""
            }`}
            onClick={() => setSelectedPolicy(policy)}
          >
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-4xl mb-2">{policy.icon}</div>
                <h3 className="font-bold text-lg">{policy.fullName}</h3>
                <Badge className="mt-2">{policy.type}</Badge>
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  <div>
                    Probation: {policy.probation.enabled ? "✅ Enabled" : "❌ Disabled"}
                  </div>
                  <div>
                    Confirmed: {policy.confirmed.enabled ? "✅ Enabled" : "❌ Disabled"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Configuration */}
      {selectedPolicy && (
        <Card className="border-2 border-blue-300">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className="text-4xl">{selectedPolicy.icon}</span>
                <div>
                  <CardTitle>
                    {selectedPolicy.fullName} ({selectedPolicy.type}) Configuration
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedPolicy.description}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setEditMode(!editMode)}
                variant={editMode ? "destructive" : "default"}
              >
                {editMode ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Policy
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <Tabs defaultValue="probation">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="probation">
                  During Probation
                </TabsTrigger>
                <TabsTrigger value="confirmed">
                  After Confirmation
                </TabsTrigger>
                <TabsTrigger value="rules">
                  Rules & Validations
                </TabsTrigger>
              </TabsList>

              {/* Probation Settings */}
              <TabsContent value="probation" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Enable during probation</Label>
                    <Switch
                      checked={selectedPolicy.probation.enabled}
                      disabled={!editMode}
                    />
                  </div>

                  {selectedPolicy.probation.enabled && (
                    <>
                      <div>
                        <Label>Annual Quota (days)</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.probation.annualQuota}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Accrual Days</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.probation.accrualDays}
                          disabled={!editMode}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Days after which leave is credited
                        </p>
                      </div>

                      <div>
                        <Label>Accrual Amount</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.probation.accrualAmount}
                          disabled={!editMode}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Leaves credited per accrual period
                        </p>
                      </div>

                      <div>
                        <Label>Max Consecutive Days</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.probation.maxConsecutiveDays}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <Label>Allow Carry Forward</Label>
                        <Switch
                          checked={selectedPolicy.probation.carryForward}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <Label>Allow Encashment</Label>
                        <Switch
                          checked={selectedPolicy.probation.encashment}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Accrual Rule Description</Label>
                        <Input
                          value={selectedPolicy.probation.accrualRule}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Confirmed Settings */}
              <TabsContent value="confirmed" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Enable after confirmation</Label>
                    <Switch
                      checked={selectedPolicy.confirmed.enabled}
                      disabled={!editMode}
                    />
                  </div>

                  {selectedPolicy.confirmed.enabled && (
                    <>
                      <div>
                        <Label>Annual Quota (days)</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.confirmed.annualQuota}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Accrual Days</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.confirmed.accrualDays}
                          disabled={!editMode}
                          className="mt-1"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          0 = Full quota from day 1
                        </p>
                      </div>

                      <div>
                        <Label>Accrual Amount</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.confirmed.accrualAmount}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Max Consecutive Days</Label>
                        <Input
                          type="number"
                          value={selectedPolicy.confirmed.maxConsecutiveDays}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <Label>Allow Carry Forward</Label>
                        <Switch
                          checked={selectedPolicy.confirmed.carryForward}
                          disabled={!editMode}
                        />
                      </div>

                      {selectedPolicy.confirmed.carryForward && (
                        <div>
                          <Label>Carry Forward Limit (days)</Label>
                          <Input
                            type="number"
                            value={selectedPolicy.confirmed.carryForwardLimit}
                            disabled={!editMode}
                            className="mt-1"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <Label>Allow Encashment</Label>
                        <Switch
                          checked={selectedPolicy.confirmed.encashment}
                          disabled={!editMode}
                        />
                      </div>

                      <div className="col-span-2">
                        <Label>Accrual Rule Description</Label>
                        <Input
                          value={selectedPolicy.confirmed.accrualRule}
                          disabled={!editMode}
                          className="mt-1"
                        />
                      </div>

                      {selectedPolicy.confirmed.encashment && (
                        <div className="col-span-2">
                          <Label>Encashment Rules</Label>
                          <Textarea
                            value={selectedPolicy.confirmed.encashmentRules.join("\n")}
                            disabled={!editMode}
                            rows={3}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            One rule per line
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* Rules & Validations */}
              <TabsContent value="rules" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Prior Approval Required</Label>
                    <Switch
                      checked={selectedPolicy.rules.priorApprovalRequired}
                      disabled={!editMode}
                    />
                  </div>

                  {selectedPolicy.rules.priorApprovalRequired && (
                    <div>
                      <Label>Prior Approval Days</Label>
                      <Input
                        type="number"
                        value={selectedPolicy.rules.priorApprovalDays}
                        disabled={!editMode}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Days before leave starts
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Medical Certificate Required</Label>
                    <Switch
                      checked={selectedPolicy.rules.medicalCertificateRequired}
                      disabled={!editMode}
                    />
                  </div>

                  {selectedPolicy.rules.medicalCertificateRequired && (
                    <div>
                      <Label>Required After (days)</Label>
                      <Input
                        type="number"
                        value={selectedPolicy.rules.medicalCertificateAfterDays}
                        disabled={!editMode}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Allow Public Holiday Clubbing</Label>
                    <Switch
                      checked={selectedPolicy.rules.canClubWithPublicHoliday}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <Label>Allow Sandwiching</Label>
                    <Switch
                      checked={selectedPolicy.rules.allowSandwiching}
                      disabled={!editMode}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Can Club With (leave types)</Label>
                    <div className="flex gap-2 mt-2">
                      {["PL", "CL", "SL", "LWP"].map((type) => (
                        <Badge
                          key={type}
                          variant={
                            selectedPolicy.rules.canClubWith.includes(type as any)
                              ? "default"
                              : "outline"
                          }
                          className="cursor-pointer"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <Label>Cannot Club With (leave types)</Label>
                    <div className="flex gap-2 mt-2">
                      {["PL", "CL", "SL", "LWP"].map((type) => (
                        <Badge
                          key={type}
                          variant={
                            selectedPolicy.rules.cannotClubWith.includes(type as any)
                              ? "destructive"
                              : "outline"
                          }
                          className="cursor-pointer"
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedPolicy.salaryImpact && (
                    <div className="col-span-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="font-semibold text-yellow-900 mb-2">
                        💰 Salary Impact
                      </h4>
                      <p className="text-sm text-yellow-800">
                        {selectedPolicy.salaryImpact.isPaid
                          ? "✅ This is PAID leave - no salary deduction"
                          : `❌ This is UNPAID leave - Deduction: ${selectedPolicy.salaryImpact.deductionFormula}`}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {editMode && (
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handleSavePolicy}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes & Create New Version
                </Button>
                <Button variant="outline" onClick={handleNotifyAll}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notify All Employees
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Automation & Triggers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col">
              <Calendar className="w-6 h-6 mb-2 text-blue-600" />
              <span className="font-semibold">Run Year-End Process</span>
              <span className="text-xs text-gray-500 mt-1">
                Carry forward PL, Reset CL/SL
              </span>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col">
              <Clock className="w-6 h-6 mb-2 text-green-600" />
              <span className="font-semibold">Run Accrual Engine</span>
              <span className="text-xs text-gray-500 mt-1">
                Credit leaves based on working days
              </span>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex-col">
              <FileText className="w-6 h-6 mb-2 text-orange-600" />
              <span className="font-semibold">Generate Policy Report</span>
              <span className="text-xs text-gray-500 mt-1">
                Full policy document with stats
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Policy Document Modal */}
      {showPolicyDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Leave Policy Document</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowPolicyDocument(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <pre className="whitespace-pre-wrap text-sm font-mono bg-gray-50 p-6 rounded">
                {generateLeavePolicyDocument()}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="border-b sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <CardTitle>Policy Version History</CardTitle>
                <Button
                  variant="ghost"
                  onClick={() => setShowVersionHistory(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                {LEAVE_POLICY_HISTORY.map((version) => (
                  <Card key={version.version} className="border-2 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg">
                            Version {version.version}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Effective: {version.effectiveDate}
                          </p>
                          <p className="text-xs text-gray-500">
                            Modified by {version.modifiedBy} on {version.modifiedOn}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Current
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">Changes:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                          {version.changelog.map((change, i) => (
                            <li key={i}>{change}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
