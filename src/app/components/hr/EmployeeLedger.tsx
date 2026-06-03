// Employee Ledger - Complete Employment Lifecycle Tracking
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { BackButton } from "../ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Download,
  Filter,
  X,
  Printer,
  User,
  FileText,
  Upload,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { MASTER_EMPLOYEES } from "../../data/employeeData";
import {
  ATTENDANCE_TYPES,
  ATTENDANCE_TYPE_LABELS,
  ATTENDANCE_TYPE_COLORS,
  SALARY_HOLD_STATUS,
} from "../../constants/payrollConstants";
import { gracePeriodService } from "../../services/gracePeriodService";
import { salaryHoldService } from "../../services/salaryHoldService";
import { EmployeeStatusBadge } from "../shared/EmployeeStatusBadge";

interface LedgerEntry {
  date: string;
  eventType:
    | "Onboarding"
    | "Compensation"
    | "Statutory"
    | "Statutory-PF"
    | "Statutory-ESIC"
    | "Attendance"
    | "LifeCycle"
    | "Exit";
  description: string;
  amount?: string;
  recordedBy: string;
  referenceNo: string;
  additionalDetails?: string;
}

const generateEmployeeLedger = (empId: string): LedgerEntry[] => {
  const emp = MASTER_EMPLOYEES.find((e) => e.id === empId);
  if (!emp) return [];

  const ledger: LedgerEntry[] = [];

  // Onboarding events
  ledger.push({
    date: emp.joiningDate,
    eventType: "Onboarding",
    description: "Offer Letter Issued",
    recordedBy: "HR Department",
    referenceNo: `OL-${empId}`,
  });

  ledger.push({
    date: emp.joiningDate,
    eventType: "Onboarding",
    description: "Appointment Letter Issued",
    recordedBy: "HR Department",
    referenceNo: `AL-${empId}`,
  });

  ledger.push({
    date: emp.joiningDate,
    eventType: "Onboarding",
    description: "Onboarding Form Submitted",
    recordedBy: emp.name,
    referenceNo: `OF-${empId}`,
  });

  ledger.push({
    date: emp.joiningDate,
    eventType: "Onboarding",
    description: "ID Card Issued",
    recordedBy: "HR Department",
    referenceNo: `ID-${empId}`,
  });

  // Generate monthly salary entries (last 6 months)
  const months = ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
  months.forEach((month) => {
    const grossSalary = emp.baseSalary * 1.6; // Approximation
    const pf = emp.baseSalary * 0.12;
    const esi = grossSalary * 0.0075;
    const netSalary = grossSalary - pf - esi;

    ledger.push({
      date: `${month}-05`,
      eventType: "Compensation",
      description: `Salary Disbursed for ${month}`,
      amount: `Gross: ₹${grossSalary.toLocaleString()} | PF: ₹${pf.toLocaleString()} | ESIC: ₹${esi.toLocaleString()} | Net: ₹${netSalary.toLocaleString()}`,
      recordedBy: "Finance Department",
      referenceNo: `SAL-${month}-${empId}`,
    });

    // Statutory contributions
    ledger.push({
      date: `${month}-10`,
      eventType: "Statutory-PF",
      description: `PF Contribution for ${month}`,
      amount: `Employee: ₹${pf.toLocaleString()} | Employer: ₹${pf.toLocaleString()}`,
      recordedBy: "Finance Department",
      referenceNo: `PF-${month}-${empId}`,
    });

    ledger.push({
      date: `${month}-10`,
      eventType: "Statutory-ESIC",
      description: `ESIC Contribution for ${month}`,
      amount: `Employee: ₹${esi.toLocaleString()} | Employer: ₹${(esi * 4.33).toLocaleString()}`,
      recordedBy: "Finance Department",
      referenceNo: `ESI-${month}-${empId}`,
    });
  });

  // Life cycle events
  if (emp.confirmationDate) {
    ledger.push({
      date: emp.confirmationDate,
      eventType: "LifeCycle",
      description: "Probation Completion & Confirmation Letter Issued",
      recordedBy: "HR Department",
      referenceNo: `CONF-${empId}`,
    });
  }

  // Attendance & Leave events (sample)
  ledger.push({
    date: "2026-01-15",
    eventType: "Attendance",
    description: "Leave Applied - Casual Leave (2 days)",
    recordedBy: emp.name,
    referenceNo: `LA-2026-001`,
  });

  ledger.push({
    date: "2026-01-16",
    eventType: "Attendance",
    description: "Leave Approved - Casual Leave (2 days)",
    recordedBy: "Reporting Manager",
    referenceNo: `LA-2026-001`,
  });

  // Exit events (if applicable)
  if (emp.status === "Resigned" && emp.lastWorkingDay) {
    const lwdDate = new Date(emp.lastWorkingDay);
    const ffCalculatedDate = new Date(lwdDate);
    ffCalculatedDate.setDate(ffCalculatedDate.getDate() + 15); // 15 days after LWD
    const ffReleasedDate = new Date(ffCalculatedDate);
    ffReleasedDate.setDate(ffReleasedDate.getDate() + 30); // 30 days after calculation (45 days total)
    const expLetterDate = new Date(lwdDate);
    expLetterDate.setDate(expLetterDate.getDate() + 7); // 7 days after LWD
    const relievingLetterDate = new Date(lwdDate);
    relievingLetterDate.setDate(relievingLetterDate.getDate() + 7); // Same as experience letter

    ledger.push({
      date: emp.lastWorkingDay,
      eventType: "Exit",
      description: "Resignation Submitted",
      recordedBy: emp.name,
      referenceNo: `RES-${empId}`,
    });

    ledger.push({
      date: emp.lastWorkingDay,
      eventType: "Exit",
      description: "Exit Interview Conducted",
      recordedBy: "HR Department",
      referenceNo: `EXIT-${empId}`,
    });

    ledger.push({
      date: emp.lastWorkingDay,
      eventType: "Exit",
      description: "Last Working Day",
      recordedBy: "HR Department",
      referenceNo: `LWD-${empId}`,
    });

    ledger.push({
      date: ffCalculatedDate.toISOString().split("T")[0],
      eventType: "Exit",
      description: "F&F Calculated",
      amount: `Total Settlement: ₹${(emp.baseSalary * 2.5).toLocaleString()}`,
      recordedBy: "Finance Department",
      referenceNo: `FFC-${empId}`,
      additionalDetails: "Includes pro-rata salary, leave encashment, and notice period recovery",
    });

    ledger.push({
      date: ffReleasedDate.toISOString().split("T")[0],
      eventType: "Exit",
      description: "F&F Released",
      amount: `₹${(emp.baseSalary * 2.5).toLocaleString()}`,
      recordedBy: "Finance Department",
      referenceNo: `FFR-${empId}`,
      additionalDetails: "Full and Final settlement disbursed via NEFT",
    });

    ledger.push({
      date: expLetterDate.toISOString().split("T")[0],
      eventType: "Exit",
      description: "Experience Letter Issued",
      recordedBy: "HR Department",
      referenceNo: `EXP-${empId}`,
    });

    ledger.push({
      date: relievingLetterDate.toISOString().split("T")[0],
      eventType: "Exit",
      description: "Relieving Letter Issued",
      recordedBy: "HR Department",
      referenceNo: `REL-${empId}`,
    });
  }

  // Sort by date (newest first)
  return ledger.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export function EmployeeLedger() {
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [filters, setFilters] = useState({
    eventType: "",
    dateFrom: "",
    dateTo: "",
  });
  const [showPreview, setShowPreview] = useState(false);
  const [graceStats, setGraceStats] = useState<any>(null);
  const [salaryHoldRecord, setSalaryHoldRecord] = useState<any>(null);

  const employee = MASTER_EMPLOYEES.find((e) => e.id === selectedEmployee);
  const ledgerEntries = selectedEmployee ? generateEmployeeLedger(selectedEmployee) : [];

  // Load grace period and salary hold data when employee changes
  useEffect(() => {
    if (selectedEmployee) {
      const stats = gracePeriodService.getGraceStatistics(selectedEmployee);
      setGraceStats(stats);

      const holdRecord = salaryHoldService.getHoldRecord(selectedEmployee);
      setSalaryHoldRecord(holdRecord);
    } else {
      setGraceStats(null);
      setSalaryHoldRecord(null);
    }
  }, [selectedEmployee]);

  const filteredEntries = ledgerEntries.filter((entry) => {
    if (filters.eventType && filters.eventType !== "all" && entry.eventType !== filters.eventType) return false;
    if (filters.dateFrom && entry.date < filters.dateFrom) return false;
    if (filters.dateTo && entry.date > filters.dateTo) return false;
    return true;
  });

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "Onboarding":
        return "bg-blue-100 text-blue-800";
      case "Compensation":
        return "bg-green-100 text-green-800";
      case "Statutory":
        return "bg-purple-100 text-purple-800";
      case "Attendance":
        return "bg-yellow-100 text-yellow-800";
      case "LifeCycle":
        return "bg-teal-100 text-teal-800";
      case "Exit":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTenure = (joiningDate: string, leavingDate?: string | null) => {
    const start = new Date(joiningDate);
    const end = leavingDate ? new Date(leavingDate) : new Date();
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
  };

  return (
    <div className="space-y-6">
      <BackButton to="/hr" />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employee Ledger</h2>
          <p className="text-gray-600">
            Complete employment lifecycle tracking for each employee
          </p>
        </div>
      </div>

      {/* Employee Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
            <SelectTrigger>
              <SelectValue placeholder="Choose an employee..." />
            </SelectTrigger>
            <SelectContent>
              {MASTER_EMPLOYEES.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.empCode} - {emp.name} ({emp.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Employee Header Card */}
      {employee && (
        <>
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="w-12 h-12 rounded-full bg-[#00C896] flex items-center justify-center text-white text-xl font-bold">
                {employee.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="text-xl">{employee.name}</div>
                  <EmployeeStatusBadge status={employee.status} size="sm" />
                </div>
                <div className="text-sm text-gray-600 font-normal">
                  {employee.empCode} • {employee.role} • {employee.department}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date of Joining</p>
                <p className="font-semibold">
                  {new Date(employee.joiningDate).toLocaleDateString("en-IN")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date of Leaving</p>
                <p className="font-semibold">
                  {employee.lastWorkingDay
                    ? new Date(employee.lastWorkingDay).toLocaleDateString("en-IN")
                    : "Currently Employed"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Tenure</p>
                <p className="font-semibold">
                  {getTenure(employee.joiningDate, employee.lastWorkingDay)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Employment Status</p>
                <Badge
                  variant={employee.status === "Active" ? "default" : "secondary"}
                >
                  {employee.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salary Hold Alert (if applicable) */}
        {salaryHoldRecord &&
         salaryHoldRecord.status &&
         salaryHoldRecord.status !== SALARY_HOLD_STATUS.RELEASED &&
         salaryHoldRecord.status !== SALARY_HOLD_STATUS.ACTIVE && (
          <Card className="border-red-300 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <ShieldAlert className="w-5 h-5" />
                Salary Hold Alert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900">
                    {salaryHoldRecord.status === SALARY_HOLD_STATUS.ON_HOLD
                      ? "⛔ SALARY BLOCKED - Ghosting Detected"
                      : "⏳ SALARY HOLD - Override Request Pending"}
                  </p>
                  {salaryHoldRecord.holdReason && (
                    <p className="text-sm text-red-700 mt-1">{salaryHoldRecord.holdReason}</p>
                  )}
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    {salaryHoldRecord.consecutiveAbsentDays !== undefined && (
                      <div>
                        <p className="text-red-600">Consecutive Absent Days</p>
                        <p className="font-semibold text-red-900">{salaryHoldRecord.consecutiveAbsentDays} days</p>
                      </div>
                    )}
                    {salaryHoldRecord.holdDate && (
                      <div>
                        <p className="text-red-600">Hold Date</p>
                        <p className="font-semibold text-red-900">
                          {new Date(salaryHoldRecord.holdDate).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    )}
                  </div>
                  {salaryHoldRecord.overrideRequest &&
                   salaryHoldRecord.overrideRequest.approvalChain &&
                   salaryHoldRecord.overrideRequest.currentLevel !== undefined && (
                    <div className="mt-3 p-3 bg-white rounded border border-red-200">
                      <p className="text-xs text-red-600 font-semibold">Override Request Status</p>
                      <p className="text-sm text-gray-900 mt-1">
                        Current Level: {salaryHoldRecord.overrideRequest.approvalChain[salaryHoldRecord.overrideRequest.currentLevel]?.level || "Unknown"}
                      </p>
                      {salaryHoldRecord.overrideRequest.requestedBy &&
                       salaryHoldRecord.overrideRequest.requestedDate && (
                        <p className="text-xs text-gray-600">
                          Requested by: {salaryHoldRecord.overrideRequest.requestedBy} on{" "}
                          {new Date(salaryHoldRecord.overrideRequest.requestedDate).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grace Period & Attendance Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Grace Period & Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Grace Period Usage */}
            {graceStats && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">10-Minute Grace Period Usage</h4>
                  <Badge
                    variant={graceStats.remainingQuota === 0 ? "destructive" : "default"}
                    className={graceStats.remainingQuota === 0 ? "bg-red-600" : "bg-blue-600"}
                  >
                    {graceStats.currentUsage}/{graceStats.totalQuota} Used
                  </Badge>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      graceStats.usagePercentage >= 100
                        ? "bg-red-600"
                        : graceStats.usagePercentage >= 66
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(graceStats.usagePercentage, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-gray-600">Remaining Quota</p>
                    <p className="font-semibold text-gray-900">{graceStats.remainingQuota} times</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Last Used</p>
                    <p className="font-semibold text-gray-900">
                      {graceStats.lastUsed
                        ? new Date(graceStats.lastUsed).toLocaleDateString("en-IN")
                        : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Next Reset</p>
                    <p className="font-semibold text-gray-900">1st of next month</p>
                  </div>
                </div>

                {/* Grace Usage History */}
                {graceStats.history && graceStats.history.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Recent Usage History</p>
                    <div className="space-y-1">
                      {graceStats.history.slice(-3).reverse().map((usage: any) => (
                        <div key={usage.id} className="flex items-center justify-between text-xs p-2 bg-white rounded">
                          <span className="text-gray-700">
                            {new Date(usage.date).toLocaleDateString("en-IN")} at {usage.time}
                          </span>
                          <span className="text-gray-600">{usage.minutesLate} min late</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Recent Attendance with Status Badges */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recent Attendance (Last 7 Days)</h4>
              <div className="grid grid-cols-7 gap-2">
                {[
                  { date: "Apr 01", status: ATTENDANCE_TYPES.PRESENT, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.PRESENT] },
                  { date: "Apr 02", status: ATTENDANCE_TYPES.PRESENT, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.PRESENT] },
                  { date: "Apr 03", status: ATTENDANCE_TYPES.WEEKLY_OFF, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.WEEKLY_OFF] },
                  { date: "Apr 04", status: ATTENDANCE_TYPES.FIRST_HALF, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.FIRST_HALF] },
                  { date: "Apr 05", status: ATTENDANCE_TYPES.PAID_LEAVE, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.PAID_LEAVE] },
                  { date: "Apr 06", status: ATTENDANCE_TYPES.WEEKLY_OFF, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.WEEKLY_OFF] },
                  { date: "Apr 07", status: ATTENDANCE_TYPES.PRESENT, label: ATTENDANCE_TYPE_LABELS[ATTENDANCE_TYPES.PRESENT] },
                ].map((day, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-xs text-gray-600 mb-1">{day.date}</p>
                    <div
                      className={`p-2 rounded border text-xs font-semibold ${ATTENDANCE_TYPE_COLORS[day.status]}`}
                      title={day.label}
                    >
                      {day.status}
                    </div>
                  </div>
                ))}
              </div>

              {/* Attendance Legend */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs font-semibold text-gray-600 mb-2">Status Color Legend</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-200" />
                    <span className="text-gray-700">Full Pay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-200" />
                    <span className="text-gray-700">Half Pay</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 border border-red-200" />
                    <span className="text-gray-700">Unpaid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-100 border border-purple-200" />
                    <span className="text-gray-700">Adjustment</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Onboarding Documents & Resume Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Onboarding Documents & Resume
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              All documents submitted by employee during onboarding and resume uploaded by HR
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resume Section - Uploaded by HR */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Upload className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Resume (Uploaded by HR)</h4>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{employee.name}_Resume.pdf</p>
                      <p className="text-sm text-gray-600">Uploaded by HR Department • {new Date(employee.joiningDate).toLocaleDateString("en-IN")} • 245 KB</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success("Opening resume...")}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => toast.success("Downloading resume...")}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Details Form */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-teal-600" />
                <h4 className="font-semibold text-gray-900">Personal Details Form</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Full Name</p>
                  <p className="font-medium">{employee.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Date of Birth</p>
                  <p className="font-medium">15/08/1995</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Gender</p>
                  <p className="font-medium">Male</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Marital Status</p>
                  <p className="font-medium">Married</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Mobile Number</p>
                  <p className="font-medium">+91 9876543210</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email Address</p>
                  <p className="font-medium">{employee.email}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-600">Current Address</p>
                  <p className="font-medium">123, Green Valley Apartments, {employee.city}, Gujarat - 395007</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-600">Permanent Address</p>
                  <p className="font-medium">Same as Current Address</p>
                </div>
              </div>
            </div>

            {/* KYC Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <h4 className="font-semibold text-gray-900">KYC Documents</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Aadhaar Card", file: "Aadhaar_" + employee.empCode + ".pdf", status: "Verified" },
                  { name: "PAN Card", file: "PAN_" + employee.empCode + ".pdf", status: "Verified" },
                  { name: "Voter ID", file: "VoterID_" + employee.empCode + ".pdf", status: "Verified" },
                  { name: "Passport (Optional)", file: "Passport_" + employee.empCode + ".pdf", status: "Not Submitted" },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      doc.status === "Verified" ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <FileText className={`w-4 h-4 ${doc.status === "Verified" ? "text-green-600" : "text-gray-400"}`} />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-600">{doc.file}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === "Verified" ? "default" : "secondary"} className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.status === "Verified" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.success(`Viewing ${doc.name}...`)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Educational Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-blue-600" />
                <h4 className="font-semibold text-gray-900">Educational Certificates</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "10th Marksheet", file: "10th_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "12th Marksheet", file: "12th_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "Graduation Degree", file: "Degree_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "Post Graduation (Optional)", file: "PG_" + employee.empCode + ".pdf", status: "Not Submitted" },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      doc.status === "Submitted" ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <FileText className={`w-4 h-4 ${doc.status === "Submitted" ? "text-blue-600" : "text-gray-400"}`} />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-600">{doc.file}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === "Submitted" ? "default" : "secondary"} className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.status === "Submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.success(`Viewing ${doc.name}...`)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Experience Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-orange-600" />
                <h4 className="font-semibold text-gray-900">Previous Employment Documents</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Experience Letter 1", company: "ABC Corporation", file: "Exp1_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "Experience Letter 2", company: "XYZ Ltd", file: "Exp2_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "Relieving Letter", company: "ABC Corporation", file: "Relieving_" + employee.empCode + ".pdf", status: "Submitted" },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-600">{doc.company} • {doc.file}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">
                        {doc.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success(`Viewing ${doc.name}...`)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-teal-600" />
                <h4 className="font-semibold text-gray-900">Bank Account Details</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-teal-50 border border-teal-200 rounded-lg">
                <div>
                  <p className="text-xs text-gray-600">Bank Name</p>
                  <p className="font-medium">HDFC Bank</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Account Number</p>
                  <p className="font-medium">50200012345678</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">IFSC Code</p>
                  <p className="font-medium">HDFC0001234</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Account Type</p>
                  <p className="font-medium">Savings Account</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-600">Cancelled Cheque / Passbook</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-1"
                    onClick={() => toast.success("Viewing cancelled cheque...")}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Document
                  </Button>
                </div>
              </div>
            </div>

            {/* Statutory Forms */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-gray-900">Statutory Forms</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "PF Form 11 (Declaration)", ref: "PF11-" + employee.empCode, status: "Filed", date: employee.joiningDate },
                  { name: "ESIC Form 1 (Declaration)", ref: "ESIC1-" + employee.empCode, status: "Filed", date: employee.joiningDate },
                ].map((form, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="font-medium text-sm">{form.name}</p>
                        <p className="text-xs text-gray-600">
                          Ref: {form.ref} • Filed on {new Date(form.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs bg-purple-600">
                        {form.status}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.success(`Viewing ${form.name}...`)}
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Other Documents */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-600" />
                <h4 className="font-semibold text-gray-900">Other Documents</h4>
              </div>
              <div className="space-y-2">
                {[
                  { name: "Medical Fitness Certificate", file: "Medical_" + employee.empCode + ".pdf", status: "Submitted" },
                  { name: "Police Verification", file: "Police_" + employee.empCode + ".pdf", status: "Pending" },
                  { name: "Reference Check Documents", file: "Reference_" + employee.empCode + ".pdf", status: "Submitted" },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      doc.status === "Submitted" ? "bg-gray-50 border-gray-200" : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <FileText className={`w-4 h-4 ${doc.status === "Submitted" ? "text-gray-600" : "text-yellow-600"}`} />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-600">{doc.file}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.status === "Submitted" ? "default" : "secondary"} className="text-xs">
                        {doc.status}
                      </Badge>
                      {doc.status === "Submitted" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toast.success(`Viewing ${doc.name}...`)}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        </>
      )}

      {/* Filter Panel */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Ledger Entries
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Event Type</Label>
                <Select
                  value={filters.eventType}
                  onValueChange={(value) =>
                    setFilters({ ...filters, eventType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All event types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Event Types</SelectItem>
                    <SelectItem value="Onboarding">Onboarding</SelectItem>
                    <SelectItem value="Compensation">Compensation</SelectItem>
                    <SelectItem value="Statutory">Statutory</SelectItem>
                    <SelectItem value="Attendance">Attendance & Leave</SelectItem>
                    <SelectItem value="LifeCycle">Life Cycle</SelectItem>
                    <SelectItem value="Exit">Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date From</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters({ ...filters, dateFrom: e.target.value })
                  }
                />
              </div>

              <div>
                <Label>Date To</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters({ ...filters, dateTo: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setFilters({ eventType: "", dateFrom: "", dateTo: "" })
                }
              >
                Clear Filters
              </Button>
              <Button onClick={() => setShowPreview(true)}>
                <Download className="w-4 h-4 mr-2" />
                Download Ledger ({filteredEntries.length} entries)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ledger Table */}
      {selectedEmployee && (
        <Card>
          <CardHeader>
            <CardTitle>
              Ledger Entries
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({filteredEntries.length} entries)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <div className="min-w-[700px] sm:min-w-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount / Value</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead>Reference No.</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {filteredEntries.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEventBadgeColor(entry.eventType)}>
                        {entry.eventType}
                      </Badge>
                    </TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell className="text-sm">
                      {entry.amount || "-"}
                    </TableCell>
                    <TableCell className="text-sm">{entry.recordedBy}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {entry.referenceNo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Preview Modal */}
      {showPreview && employee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Employee Ledger - {employee.name}</h3>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => toast.success("Printing...")}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPreview(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-[#00C896]">CleanCar 360°</h1>
                <p className="text-lg font-semibold mt-2">Employee Ledger</p>
                <p className="text-sm text-gray-600">
                  Generated on {new Date().toLocaleDateString("en-IN")}
                </p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Employee Name:</p>
                    <p className="font-semibold">{employee.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Employee ID:</p>
                    <p className="font-semibold">{employee.empCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Designation:</p>
                    <p className="font-semibold">{employee.role}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Department:</p>
                    <p className="font-semibold">{employee.department}</p>
                  </div>
                </div>
              </div>

              <table className="w-full border-collapse border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border p-2 text-left">Date</th>
                    <th className="border p-2 text-left">Event Type</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Amount</th>
                    <th className="border p-2 text-left">Recorded By</th>
                    <th className="border p-2 text-left">Ref No.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="border p-2">
                        {new Date(entry.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="border p-2">{entry.eventType}</td>
                      <td className="border p-2">{entry.description}</td>
                      <td className="border p-2">{entry.amount || "-"}</td>
                      <td className="border p-2">{entry.recordedBy}</td>
                      <td className="border p-2 font-mono text-xs">
                        {entry.referenceNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
