import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Edit,
  Save,
  X,
  Plus,
  Minus,
  Send,
  Download,
  AlertCircle,
  CheckCircle,
  Eye,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { EmployeeAttendanceDrillDown } from "../hr/EmployeeAttendanceDrillDown";
import { usePayroll } from "../../contexts/PayrollContext";
import { useEmployee } from "../../contexts/EmployeeContext";

interface PayrollEntry {
  id: string;
  empId: string;
  name: string;
  role: string;
  fixedSalary: number;
  incentives: number;
  bonuses: number;
  deductions: number;
  manualAdditions: number;
  manualDeductions: number;
  netSalary: number;
  notes: string;
  status: "pending" | "reviewed" | "approved";
  // Leave related fields
  leaveDays?: {
    CL: number;
    PL: number;
    SL: number;
    UL: number;
  };
  leaveDeduction?: number;
  attendanceDays?: number;
}

export function PayrollReviewScreen() {
  const { payrollRuns } = usePayroll();
  const { employees } = useEmployee();
  const { currentRole, currentUser } = useRole();
  const hasHRPermission =
    currentRole === "Super Admin" ||
    currentRole === "Admin" ||
    currentRole === "HR Manager" ||
    currentRole === "HR Coordinator";

  // PHASE 2: Migrated to useEmployeeData
  const { applyHROverride, approvePayrollByHR, getEmployeeById } = useEmployeeData();

  const entries = payrollRuns.slice(0,20).map(run => {
    const emp = employees.find(e => e.employeeId === run.employeeId);
    return { id:run.payrollId, employeeId:run.employeeId, employeeName:emp?emp.firstName+" "+emp.lastName:run.employeeId, role:emp?.role||"Employee", gross:run.grossSalary, deductions:run.deductions?.total||0, net:run.netSalary, status:run.status||"Pending", month:run.month };
  });
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<"addition" | "deduction">("addition");
  const [adjustmentAmount, setAdjustmentAmount] = useState(0);
  const [adjustmentNotes, setAdjustmentNotes] = useState("");
  
  // State for attendance drill-down
  const [showAttendanceDrillDown, setShowAttendanceDrillDown] = useState(false);
  const [selectedEmployeeForDrillDown, setSelectedEmployeeForDrillDown] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openAdjustment = (entry: PayrollEntry, type: "addition" | "deduction") => {
    setSelectedEntry(entry);
    setAdjustmentType(type);
    setAdjustmentAmount(0);
    setAdjustmentNotes("");
    setShowAdjustModal(true);
  };

  const openAttendanceDrillDown = (entry: PayrollEntry) => {
    setSelectedEmployeeForDrillDown({
      id: entry.empId,
      name: entry.name,
    });
    setShowAttendanceDrillDown(true);
  };

  const saveAdjustment = () => {
    if (!selectedEntry || adjustmentAmount === 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Calculate new net salary based on adjustment
    const originalNetSalary = selectedEntry.netSalary - selectedEntry.manualAdditions + selectedEntry.manualDeductions;
    const newNetSalary =
      adjustmentType === "addition"
        ? originalNetSalary + adjustmentAmount
        : originalNetSalary - adjustmentAmount;

    // Apply HR override in HRDataContext
    applyHROverride(selectedEntry.id, newNetSalary, adjustmentNotes);

    setShowAdjustModal(false);
    toast.success(
      `${adjustmentType === "addition" ? "Addition" : "Deduction"} of ₹${adjustmentAmount} saved`
    );
  };

  const markAsReviewed = (id: string) => {
    approvePayrollByHR(id, currentUser.name);
    toast.success("Marked as reviewed and approved by HR");
  };

  const sendForApproval = () => {
    const reviewedCount = entries.filter((e) => e.status === "reviewed").length;
    if (reviewedCount === 0) {
      toast.error("Please review at least one entry before sending for approval");
      return;
    }
    toast.success(`Payroll sent for approval (${reviewedCount} employees)`);
  };

  const totalNetPayable = entries.reduce((sum, e) => sum + e.netSalary, 0);
  const reviewedCount = entries.filter((e) => e.status === "reviewed").length;
  const pendingCount = entries.filter((e) => e.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* HR Permission Banner */}
      {hasHRPermission && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">HR Access Enabled - Full Payroll Visibility</p>
                <p className="text-sm text-blue-700">
                  As <strong>{currentRole}</strong>, you can view and review all employee payroll data. 
                  Approval Workflow: <Badge className="ml-1 bg-blue-600 text-white text-xs">HR Review</Badge>
                  <span className="mx-1">→</span>
                  <Badge className="bg-purple-600 text-white text-xs">Admin Approval</Badge>
                  <span className="mx-1">→</span>
                  <Badge className="bg-green-600 text-white text-xs">Accounts Payment</Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payroll Review Screen</h2>
          <p className="text-sm text-gray-600 mt-1">
            Review and adjust payroll before processing
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={sendForApproval} className="bg-blue-600 hover:bg-blue-700">
            <Send className="w-4 h-4 mr-2" />
            Send for Approval
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-blue-700">Total Employees</p>
            <p className="text-2xl font-bold text-blue-900">{entries.length}</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-orange-700">Pending Review</p>
            <p className="text-2xl font-bold text-orange-900">{pendingCount}</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-green-700">Reviewed</p>
            <p className="text-2xl font-bold text-green-900">{reviewedCount}</p>
          </CardContent>
        </Card>

        <Card className="border-gray-900 bg-gray-900 text-white">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-300">Net Payable</p>
            <p className="text-2xl font-bold">₹{(totalNetPayable / 100000).toFixed(2)}L</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Payroll Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 text-sm font-semibold">
                    <div className="flex items-center gap-1">
                      Employee
                      <span className="text-xs text-blue-600 font-normal">(Click for attendance)</span>
                    </div>
                  </th>
                  <th className="text-left p-3 text-sm font-semibold">Role</th>
                  <th className="text-center p-3 text-sm font-semibold">Attendance</th>
                  <th className="text-center p-3 text-sm font-semibold">Leaves</th>
                  <th className="text-right p-3 text-sm font-semibold">Fixed</th>
                  <th className="text-right p-3 text-sm font-semibold">Incentives</th>
                  <th className="text-right p-3 text-sm font-semibold">Bonus</th>
                  <th className="text-right p-3 text-sm font-semibold">Deductions</th>
                  <th className="text-right p-3 text-sm font-semibold">Net</th>
                  <th className="text-center p-3 text-sm font-semibold">Status</th>
                  <th className="text-center p-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <p 
                          className="font-medium text-sm text-blue-600 hover:text-blue-800 cursor-pointer hover:underline"
                          onClick={() => openAttendanceDrillDown(entry)}
                          title="Click to view detailed attendance report"
                        >
                          {entry.name}
                        </p>
                        <p className="text-xs text-gray-500">{entry.empId}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {entry.role}
                      </Badge>
                    </td>
                    <td className="p-3 text-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{entry.attendanceDays}/31</p>
                        <p className="text-xs text-gray-500">days</p>
                      </div>
                    </td>
                    <td className="p-3">
                      {entry.leaveDays && (
                        <div className="flex gap-1 flex-wrap justify-center">
                          {entry.leaveDays.CL > 0 && (
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs px-1">
                              CL:{entry.leaveDays.CL}
                            </Badge>
                          )}
                          {entry.leaveDays.PL > 0 && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-1">
                              PL:{entry.leaveDays.PL}
                            </Badge>
                          )}
                          {entry.leaveDays.SL > 0 && (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs px-1">
                              SL:{entry.leaveDays.SL}
                            </Badge>
                          )}
                          {entry.leaveDays.UL > 0 && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs px-1">
                              UL:{entry.leaveDays.UL}⚠️
                            </Badge>
                          )}
                          {entry.leaveDays.CL === 0 && entry.leaveDays.PL === 0 && 
                           entry.leaveDays.SL === 0 && entry.leaveDays.UL === 0 && (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right text-sm">₹{(entry?.fixedSalary ?? 0).toLocaleString()}</td>
                    <td className="p-3 text-right text-sm text-purple-600">
                      +₹{(entry?.incentives ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm text-orange-600">
                      +₹{(entry?.bonuses ?? 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-right text-sm">
                      <div>
                        <p className="text-red-600">-₹{(entry.deductions + entry.manualDeductions).toLocaleString()}</p>
                        {entry.leaveDeduction && entry.leaveDeduction > 0 && (
                          <p className="text-xs text-red-500">
                            (UL: -₹{entry.leaveDeduction})
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-blue-600">₹{(entry?.netSalary ?? 0).toLocaleString()}</span>
                    </td>
                    <td className="p-3 text-center">
                      {entry.status === "reviewed" ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Reviewed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-orange-300 text-orange-700">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustment(entry, "addition")}
                          className="h-7 px-2"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openAdjustment(entry, "deduction")}
                          className="h-7 px-2"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        {entry.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReviewed(entry.id)}
                            className="h-7 px-2"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Adjustment Modal */}
      {showAdjustModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-bold">
                {adjustmentType === "addition" ? "Add Manual Addition" : "Add Manual Deduction"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAdjustModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium">{selectedEntry.name}</p>
                <p className="text-xs text-gray-600">{selectedEntry.empId} • {selectedEntry.role}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Current Net: ₹{(selectedEntry?.netSalary ?? 0).toLocaleString()}
                </p>
              </div>

              <div>
                <Label>Amount (₹) *</Label>
                <Input
                  type="number"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <Label>Reason / Notes *</Label>
                <Textarea
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder={
                    adjustmentType === "addition"
                      ? "e.g., Special bonus, Advance recovery reversal"
                      : "e.g., Damage recovery, Advance given, Penalty"
                  }
                  rows={3}
                />
              </div>

              <Card
                className={
                  adjustmentType === "addition"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }
              >
                <CardContent className="p-4">
                  <p className="text-sm font-medium mb-2">Preview</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Current Net Salary:</span>
                      <span>₹{(selectedEntry?.netSalary ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>{adjustmentType === "addition" ? "Addition:" : "Deduction:"}</span>
                      <span className={adjustmentType === "addition" ? "text-green-600" : "text-red-600"}>
                        {adjustmentType === "addition" ? "+" : "-"}₹{adjustmentAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t font-bold">
                      <span>New Net Salary:</span>
                      <span className="text-blue-600">
                        ₹
                        {(adjustmentType === "addition"
                          ? selectedEntry.netSalary + adjustmentAmount
                          : selectedEntry.netSalary - adjustmentAmount
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={saveAdjustment}
                className={
                  adjustmentType === "addition"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                <Save className="w-4 h-4 mr-2" />
                Save Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Drill-Down Modal */}
      {showAttendanceDrillDown && selectedEmployeeForDrillDown && (
        <EmployeeAttendanceDrillDown
          isOpen={showAttendanceDrillDown}
          onClose={() => setShowAttendanceDrillDown(false)}
          employeeId={selectedEmployeeForDrillDown.id}
          employeeName={selectedEmployeeForDrillDown.name}
          month={3}
          year={2026}
        />
      )}
    </div>
  );
}