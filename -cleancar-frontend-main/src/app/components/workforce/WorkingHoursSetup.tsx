import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  Lock,
  Edit,
  History,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  role: string;
  currentShift: ShiftConfig;
}

interface ShiftConfig {
  type: "fixed" | "editable" | "split";
  shift1Start: string;
  shift1End: string;
  shift2Start?: string;
  shift2End?: string;
  totalHours: number;
  unitBase?: number;
  incentiveNote?: string;
  fieldBandStart?: string;
  fieldBandEnd?: string;
  constraints?: string;
}

interface ShiftChange {
  id: string;
  employeeName: string;
  oldShift: string;
  newShift: string;
  changedBy: string;
  timestamp: string;
  reason: string;
  effectiveDate: string;
  status: "Pending" | "Approved" | "Applied";
}

const roleDefaults: Record<string, ShiftConfig> = {
  "Washer - Part Time": {
    type: "fixed",
    shift1Start: "05:00",
    shift1End: "09:00",
    totalHours: 4,
    unitBase: 25,
    incentiveNote: "Incentive only within band",
    constraints: "Non-editable base template",
  },
  "Washer - Full Time": {
    type: "editable",
    shift1Start: "09:00",
    shift1End: "17:00",
    totalHours: 8,
    unitBase: 50,
    incentiveNote: "Incentive applicable post 50 units within shift",
    constraints: "Must be within 9:00 AM – 10:00 PM",
  },
  Supervisor: {
    type: "split",
    shift1Start: "05:00",
    shift1End: "09:00",
    shift2Start: "14:00",
    shift2End: "22:00",
    totalHours: 8,
    constraints: "Split Shift (Operations + Planning)",
  },
  "Cluster Manager": {
    type: "editable",
    shift1Start: "10:00",
    shift1End: "19:00",
    totalHours: 9,
    fieldBandStart: "11:30",
    fieldBandEnd: "15:00",
    constraints: "Field band highlight: 11:30 AM – 3:00 PM",
  },
  Default: {
    type: "editable",
    shift1Start: "10:00",
    shift1End: "19:00",
    totalHours: 9,
    constraints: "Standard office hours",
  },
};

const employees: Employee[] = [
  {
    id: "1",
    name: "Ramesh Kumar",
    role: "Washer - Part Time",
    currentShift: roleDefaults["Washer - Part Time"],
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Washer - Full Time",
    currentShift: roleDefaults["Washer - Full Time"],
  },
  {
    id: "3",
    name: "Amit Patel",
    role: "Supervisor",
    currentShift: roleDefaults["Supervisor"],
  },
  {
    id: "4",
    name: "Sneha Reddy",
    role: "Cluster Manager",
    currentShift: roleDefaults["Cluster Manager"],
  },
  {
    id: "5",
    name: "Vijay Singh",
    role: "TSE",
    currentShift: roleDefaults["Default"],
  },
];

const shiftHistory: ShiftChange[] = [
  {
    id: "1",
    employeeName: "Ramesh Kumar",
    oldShift: "05:00 AM - 09:00 AM",
    newShift: "06:00 AM - 10:00 AM",
    changedBy: "HR Manager",
    timestamp: "2026-01-15 10:30 AM",
    reason: "Employee requested later start time",
    effectiveDate: "2026-01-20",
    status: "Applied",
  },
  {
    id: "2",
    employeeName: "Priya Sharma",
    oldShift: "09:00 AM - 05:00 PM",
    newShift: "10:00 AM - 06:00 PM",
    changedBy: "Operations Manager",
    timestamp: "2026-01-18 02:15 PM",
    reason: "Shift coverage adjustment",
    effectiveDate: "2026-01-22",
    status: "Approved",
  },
  {
    id: "3",
    employeeName: "Amit Patel",
    oldShift: "05:00 AM - 09:00 AM, 02:00 PM - 06:00 PM",
    newShift: "06:00 AM - 10:00 AM, 02:00 PM - 06:00 PM",
    changedBy: "City Manager",
    timestamp: "2026-01-20 09:45 AM",
    reason: "Route optimization",
    effectiveDate: "2026-02-01",
    status: "Pending",
  },
];

export function WorkingHoursSetup() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [shiftStart, setShiftStart] = useState("");
  const [shiftEnd, setShiftEnd] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      setSelectedEmployee(employee);
      setShiftStart(employee.currentShift.shift1Start);
      setShiftEnd(employee.currentShift.shift1End);
      setEditMode(false);
      setChangeReason("");
      setEffectiveDate("");
      setShowValidationError(false);
    }
  };

  const calculateTotalHours = (start: string, end: string) => {
    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
    return Math.round(totalMinutes / 60 * 10) / 10;
  };

  const validateShift = () => {
    if (!selectedEmployee) return false;

    const totalHours = calculateTotalHours(shiftStart, shiftEnd);

    // Washer Full Time validation
    if (selectedEmployee.role === "Washer - Full Time") {
      const [startHour] = shiftStart.split(":").map(Number);
      const [endHour] = shiftEnd.split(":").map(Number);

      if (startHour < 9 || endHour > 22) {
        setShowValidationError(true);
        toast.error("Shift must be within 9:00 AM – 10:00 PM");
        return false;
      }

      if (totalHours !== 8) {
        setShowValidationError(true);
        toast.error("Total hours must be exactly 8 hours");
        return false;
      }
    }

    if (!changeReason || !effectiveDate) {
      toast.error("Please provide change reason and effective date");
      return false;
    }

    setShowValidationError(false);
    return true;
  };

  const handleSaveShiftChange = () => {
    if (!validateShift()) return;

    toast.success("Shift change saved successfully");
    setEditMode(false);
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Working Hours & Shift Configuration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure and manage employee working hours with full audit trail
        </p>
      </div>

      {/* System Rules Badge */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Audit Enabled
        </Badge>
        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
          All changes logged in employee ledger
        </Badge>
        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
          No overwrite allowed – only append history
        </Badge>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Employee</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <Select
                value={selectedEmployee?.id}
                onValueChange={handleEmployeeSelect}
              >
                <SelectTrigger id="employee">
                  <SelectValue placeholder="Search & select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} - {emp.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedEmployee && (
              <div className="space-y-2">
                <Label>Role</Label>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <User className="w-4 h-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{selectedEmployee.role}</span>
                  <Badge className="ml-auto">Auto-populated</Badge>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Shift Configuration */}
      {selectedEmployee && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Shift Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Current Shift Configuration</CardTitle>
                  {selectedEmployee.currentShift.type === "editable" && !editMode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditMode(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Shift
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role-based shift display */}
                {selectedEmployee.role === "Washer - Part Time" && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-blue-600">4 Hour Active Band</Badge>
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold">
                          {selectedEmployee.currentShift.shift1Start} – {selectedEmployee.currentShift.shift1End}
                        </span>
                      </div>
                      <div className="text-sm text-blue-700">
                        Unit Base: {selectedEmployee.currentShift.unitBase} Units
                      </div>
                      <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                        {selectedEmployee.currentShift.incentiveNote}
                      </div>
                    </div>
                  </div>
                )}

                {selectedEmployee.role === "Washer - Full Time" && (
                  <div className="space-y-4">
                    {editMode ? (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="shift-start">Start Time</Label>
                            <Input
                              id="shift-start"
                              type="time"
                              value={shiftStart}
                              onChange={(e) => setShiftStart(e.target.value)}
                              className={showValidationError ? "border-red-500" : ""}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="shift-end">End Time</Label>
                            <Input
                              id="shift-end"
                              type="time"
                              value={shiftEnd}
                              onChange={(e) => setShiftEnd(e.target.value)}
                              className={showValidationError ? "border-red-500" : ""}
                            />
                          </div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                          <div className="flex items-center gap-2 text-sm text-orange-800">
                            <AlertCircle className="w-4 h-4" />
                            <span>
                              Total Hours: <strong>{calculateTotalHours(shiftStart, shiftEnd)} hrs</strong>
                            </span>
                          </div>
                          <div className="text-xs text-orange-700 mt-1">
                            {selectedEmployee.currentShift.constraints}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <Clock className="w-5 h-5 text-green-600" />
                            <span className="text-lg font-semibold">
                              {selectedEmployee.currentShift.shift1Start} – {selectedEmployee.currentShift.shift1End}
                            </span>
                          </div>
                          <div className="text-sm text-green-700">
                            Total Hours: {selectedEmployee.currentShift.totalHours} hours
                          </div>
                          <div className="text-sm text-green-700">
                            Unit Base: {selectedEmployee.currentShift.unitBase} Units
                          </div>
                          <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                            {selectedEmployee.currentShift.incentiveNote}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedEmployee.role === "Supervisor" && (
                  <div className="space-y-3">
                    <Badge className="bg-purple-600">Split Shift (Operations + Planning)</Badge>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-600 mb-1">Shift 1</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold">
                            {selectedEmployee.currentShift.shift1Start} – {selectedEmployee.currentShift.shift1End}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-xs text-purple-600 mb-1">Shift 2</div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold">
                            {selectedEmployee.currentShift.shift2Start} – {selectedEmployee.currentShift.shift2End}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-purple-700">
                      Total Hours: {selectedEmployee.currentShift.totalHours} hours
                    </div>
                  </div>
                )}

                {selectedEmployee.role === "Cluster Manager" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className="text-lg font-semibold">
                          {selectedEmployee.currentShift.shift1Start} – {selectedEmployee.currentShift.shift1End}
                        </span>
                      </div>

                      {/* Field Band Highlight */}
                      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="absolute h-full bg-gradient-to-r from-orange-400 to-orange-500"
                          style={{
                            left: "15%",
                            width: "35%",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-medium text-white drop-shadow">
                            Field Band: {selectedEmployee.currentShift.fieldBandStart} – {selectedEmployee.currentShift.fieldBandEnd}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Default Roles */}
                {!["Washer - Part Time", "Washer - Full Time", "Supervisor", "Cluster Manager"].includes(selectedEmployee.role) && (
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-gray-600" />
                      <span className="text-lg font-semibold">
                        {selectedEmployee.currentShift.shift1Start} – {selectedEmployee.currentShift.shift1End}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Total Hours: {selectedEmployee.currentShift.totalHours} hours
                    </div>
                    <div className="mt-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Allow Custom Shift Override
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Control Panel */}
            {editMode && (
              <Card className="border-2 border-orange-300">
                <CardHeader className="bg-orange-50">
                  <CardTitle className="text-base text-orange-900">Shift Change Panel</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Changed By</Label>
                      <Input value="HR Manager" disabled className="bg-gray-100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="effective-date">Effective From Date *</Label>
                      <Input
                        id="effective-date"
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="change-reason">Change Reason *</Label>
                    <Select value={changeReason} onValueChange={setChangeReason}>
                      <SelectTrigger id="change-reason">
                        <SelectValue placeholder="Select reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee-request">Employee Request</SelectItem>
                        <SelectItem value="coverage-adjustment">Coverage Adjustment</SelectItem>
                        <SelectItem value="route-optimization">Route Optimization</SelectItem>
                        <SelectItem value="business-need">Business Need</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveShiftChange} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Shift Change
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditMode(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: History Button */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Shift History</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowHistory(true)}
                >
                  <History className="w-4 h-4 mr-2" />
                  View Full History
                </Button>

                {/* Recent Changes Preview */}
                <div className="mt-4 space-y-2">
                  <div className="text-xs font-semibold text-gray-700 uppercase">Recent Changes</div>
                  {shiftHistory.slice(0, 3).map((change) => (
                    <div key={change.id} className="p-2 bg-gray-50 rounded text-xs">
                      <div className="font-medium">{change.timestamp}</div>
                      <div className="text-gray-600">{change.changedBy}</div>
                      <Badge
                        variant="outline"
                        className={
                          change.status === "Applied"
                            ? "bg-green-100 text-green-700 border-green-200 mt-1"
                            : change.status === "Approved"
                            ? "bg-blue-100 text-blue-700 border-blue-200 mt-1"
                            : "bg-orange-100 text-orange-700 border-orange-200 mt-1"
                        }
                      >
                        {change.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* History Drawer */}
      <Sheet open={showHistory} onOpenChange={setShowHistory}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Shift History Log</SheetTitle>
            <SheetDescription>
              Complete audit trail of all shift changes
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {shiftHistory.map((change, index) => (
              <Card key={change.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-gray-900">{change.employeeName}</div>
                      <div className="text-sm text-gray-600">{change.timestamp}</div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        change.status === "Applied"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : change.status === "Approved"
                          ? "bg-blue-100 text-blue-700 border-blue-200"
                          : "bg-orange-100 text-orange-700 border-orange-200"
                      }
                    >
                      {change.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Old:</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {change.oldShift}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">New:</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {change.newShift}
                      </Badge>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="text-gray-600">
                        <strong>Changed By:</strong> {change.changedBy}
                      </div>
                      <div className="text-gray-600">
                        <strong>Reason:</strong> {change.reason}
                      </div>
                      <div className="text-gray-600">
                        <strong>Effective:</strong> {change.effectiveDate}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
