/**
 * Employee Attendance Drill-Down View
 * 
 * Opens as a right drawer when clicking employee name in payroll/attendance screens
 * Shows detailed monthly attendance report with:
 * - Raw attendance data (BLUE) vs Calculated fields (GREEN)
 * - Complete attendance grid with all punches and calculations
 * - Summary sections with attendance, presence, and deductions
 * - Leave adjustment grid
 */

import React, { useState, useEffect } from "react";
import { DataService } from "../../services/DataService";
import {
  X,
  Download,
  Calendar,
  User,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  Printer,
  Edit,
  ThumbsUp,
  ThumbsDown,
  Info,
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Textarea } from "../ui/textarea";
// GeneratedPayslip is statically imported here.
// HRModule lazy-loads THIS component (EmployeeAttendanceDrillDown) as the lazy boundary.
// GeneratedPayslip is bundled INTO this chunk — no nested React.lazy needed.
// Nested lazy-within-lazy caused "Cannot access 'y' before initialization" (React useState TDZ).
import { GeneratedPayslip } from "./GeneratedPayslip";
import { useEmployeeData } from "../../hooks/useEmployeeData";

// ==================== INTERFACES ====================

interface AttendanceRecord {
  date: string; // DD-MM-YYYY format
  day: string; // Mon, Tue, etc.
  attendanceType: "P" | "A" | "WOFF" | "PH" | "PL" | "CSL" | "HPL" | "COFF" | "LWP";
  inTime: string | null; // HH:MM format or null
  outTime: string | null; // HH:MM format or null
  workingHours: number; // Calculated
  lateComingCount: number; // Calculated (0 or 1)
  autoLogoutCount: number; // Calculated (0 or 1)
  isSunday: boolean;
  isPublicHoliday: boolean;
  publicHolidayName?: string;
}

interface AttendanceSummary {
  totalDays: number;
  payDays: number;
  weeklyOff: number;
  publicHoliday: number;
  presentDays: number;
  absentDays: number;
  leaveWithSalary: number;
  leaveWithoutPay: number;
}

interface AdjustmentSummary {
  lateComingCount: number;
  autoLogoutCount: number;
  attendanceDeduction: number; // In days
  daysDeducted: number; // Final calculated
}

interface LeaveAdjustment {
  fullCSL: number;
  halfCSL: number;
  fullPL: number;
  halfHPL: number;
  fullCOFF: number;
  halfCOFF: number;
  publicHoliday: number;
  fullLWP: number;
  halfLWP: number;
}

interface EmployeeAttendanceData {
  employeeCode: string;
  employeeName: string;
  department: string;
  fromDate: string;
  toDate: string;
  reportDate: string;
  records: AttendanceRecord[];
  summary: AttendanceSummary;
  adjustment: AdjustmentSummary;
  leaveAdjustment: LeaveAdjustment;
}

interface EmployeeAttendanceDrillDownProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  month: number; // 1-12
  year: number;
}

// ==================== MOCK DATA GENERATOR ====================

const generateMockAttendanceData = (
  employeeId: string,
  employeeName: string,
  month: number,
  year: number
): EmployeeAttendanceData => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const records: AttendanceRecord[] = [];

  // Define some holidays
  const holidays: { [key: string]: string } = {
    "26-01-2022": "Republic Day",
    "01-05-2022": "May Day",
    "15-08-2022": "Independence Day",
  };

  // Generate daily records
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dateStr = `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    
    const isSunday = date.getDay() === 0;
    const isPublicHoliday = holidays[dateStr] !== undefined;
    
    let attendanceType: AttendanceRecord["attendanceType"] = "P";
    let inTime: string | null = "09:00";
    let outTime: string | null = "18:00";
    let workingHours = 9;
    let lateComingCount = 0;
    let autoLogoutCount = 0;

    // Sundays
    if (isSunday) {
      attendanceType = "WOFF";
      inTime = null;
      outTime = null;
      workingHours = 0;
    }
    // Public Holidays
    else if (isPublicHoliday) {
      attendanceType = "PH";
      inTime = null;
      outTime = null;
      workingHours = 0;
    }
    // Some random leave patterns
    else if (day === 5) {
      attendanceType = "CSL";
      inTime = null;
      outTime = null;
      workingHours = 0;
    } else if (day === 12) {
      attendanceType = "PL";
      inTime = null;
      outTime = null;
      workingHours = 0;
    } else if (day === 20) {
      attendanceType = "LWP";
      inTime = null;
      outTime = null;
      workingHours = 0;
    }
    // Late coming
    else if (day === 8 || day === 15 || day === 22) {
      inTime = "09:45";
      outTime = "18:30";
      workingHours = 8.75;
      lateComingCount = 1;
    }
    // Auto logout
    else if (day === 10 || day === 18) {
      inTime = "09:00";
      outTime = null; // Auto logout
      workingHours = 8;
      autoLogoutCount = 1;
    }
    // Absent
    else if (day === 25) {
      attendanceType = "A";
      inTime = null;
      outTime = null;
      workingHours = 0;
    }

    records.push({
      date: dateStr,
      day: dayName,
      attendanceType,
      inTime,
      outTime,
      workingHours,
      lateComingCount,
      autoLogoutCount,
      isSunday,
      isPublicHoliday,
      publicHolidayName: holidays[dateStr],
    });
  }

  // Calculate summaries
  const weeklyOff = records.filter((r) => r.attendanceType === "WOFF").length;
  const publicHoliday = records.filter((r) => r.attendanceType === "PH").length;
  const workingDays = daysInMonth - weeklyOff;
  const presentDays = records.filter((r) => r.attendanceType === "P").length +
    records.filter((r) => ["H","HCSL","HCOFF","HPL"].includes(r.attendanceType)).length * 0.5;
  const absentDays = records.filter((r) => r.attendanceType === "A").length +
    records.filter((r) => r.attendanceType === "H").length * 0.5;
  const leaveWithSalary = records.filter((r) => ["CSL","PL","COFF"].includes(r.attendanceType)).length +
    records.filter((r) => ["HCSL","HPL","HCOFF"].includes(r.attendanceType)).length * 0.5;
  const leaveWithoutPay = records.filter((r) => r.attendanceType === "LWP").length +
    records.filter((r) => r.attendanceType === "HLWP").length * 0.5;

  const totalLateComingCount = records.filter((r) => r.lateComingCount > 0).length;
  const totalAutoLogoutCount = records.filter((r) => r.autoLogoutCount > 0).length;

  const lateDeduction = totalLateComingCount * 0.5;
  const autoLogoutDeduction = totalAutoLogoutCount * 0.5;
  const attendanceDeduction = lateDeduction + autoLogoutDeduction;
  const daysDeducted = attendanceDeduction;

  const payDays = workingDays - absentDays - leaveWithoutPay;


  return {
    employeeCode: employeeId,
    employeeName: employeeName,
    department: "Operation",
    fromDate: `01-${String(month).padStart(2, "0")}-${year}`,
    toDate: `${daysInMonth}-${String(month).padStart(2, "0")}-${year}`,
    reportDate: new Date().toLocaleDateString("en-GB"),
    records,
    summary: {
      totalDays: daysInMonth,
      workingDays,
      payDays,
      weeklyOff,
      publicHoliday,
      presentDays,
      absentDays,
      leaveWithSalary,
      leaveWithoutPay,
    },
    adjustment: {
      lateComingCount: totalLateComingCount,
      autoLogoutCount: totalAutoLogoutCount,
      attendanceDeduction,
      daysDeducted,
    },
    leaveAdjustment: {
      fullCSL: records.filter((r) => r.attendanceType === "CSL").length,
      halfCSL: 0,
      fullPL: records.filter((r) => r.attendanceType === "PL").length,
      halfHPL: 0,
      fullCOFF: 0,
      halfCOFF: 0,
      publicHoliday,
      fullLWP: leaveWithoutPay,
      halfLWP: 0,
    },
  };
};

// ==================== COMPONENT ====================

export function EmployeeAttendanceDrillDown({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  month,
  year,
}: EmployeeAttendanceDrillDownProps) {
  const [data, setData] = useState<EmployeeAttendanceData | null>(null);
  // PHASE 2: Migrated to useEmployeeData (dual-read from EmployeeContext + HRDataContext)
  const { getEmployeeById, getAttendanceByEmployee, getMonthlyAttendanceSummary, publicHolidays } = useEmployeeData();

  useEffect(() => {
    if (isOpen) {
      // Try to load real attendance data from context
      const employee = getEmployeeById(employeeId);
      const attendanceRecords = getAttendanceByEmployee(employeeId, month, year);
      const summary = getMonthlyAttendanceSummary(employeeId, month, year);

      // If no real data exists, generate mock data for demonstration
      if (attendanceRecords.length === 0 || !summary) {
        const attendanceData = generateMockAttendanceData(employeeId, employeeName, month, year);
        setData(attendanceData);
      } else {
        // Use real data from context
        const daysInMonth = new Date(year, month, 0).getDate();
        setData({
          employeeCode: employee?.employeeCode || employeeId,
          employeeName: employee?.personalInfo.fullName || employeeName,
          department: employee?.employmentInfo.department || "Operations",
          fromDate: `01-${String(month).padStart(2, "0")}-${year}`,
          toDate: `${daysInMonth}-${String(month).padStart(2, "0")}-${year}`,
          reportDate: new Date().toLocaleDateString("en-GB"),
          records: attendanceRecords,
          summary: {
            totalDays: summary.totalDays,
            payDays: summary.paidDays,
            weeklyOff: summary.weeklyOff,
            publicHoliday: summary.publicHolidays,
            presentDays: summary.presentDays,
            absentDays: summary.absentDays,
            leaveWithSalary: summary.leaveWithSalary,
            leaveWithoutPay: summary.leaveWithoutPay,
          },
          adjustment: {
            lateComingCount: summary.lateComingCount,
            autoLogoutCount: summary.autoLogoutCount,
            attendanceDeduction: summary.attendanceDeduction,
            daysDeducted: summary.daysDeducted,
          },
          leaveAdjustment: {
            fullCSL: summary.leaveAdjustment.casualLeave,
            halfCSL: 0,
            fullPL: summary.leaveAdjustment.privilegedLeave,
            halfHPL: summary.leaveAdjustment.halfDayLeave,
            fullCOFF: summary.leaveAdjustment.compOff,
            halfCOFF: 0,
            publicHoliday: summary.publicHolidays,
            fullLWP: summary.leaveAdjustment.lwp,
            halfLWP: 0,
          },
        });
      }
    }
  }, [isOpen, employeeId, employeeName, month, year, getEmployeeById, getAttendanceByEmployee, getMonthlyAttendanceSummary]);

  if (!isOpen) return null;

  const handleExportExcel = () => {
    toast.info("Excel export — coming in Phase 2.");
  };

  const handleExportPDF = () => {
    toast.info("PDF export — coming in Phase 2.");
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Right Drawer */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[95%] lg:w-[90%] xl:w-[85%] bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Sticky Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <FileText className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Attendance Report</h2>
                <p className="text-blue-100 text-sm">Detailed Monthly View</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-blue-500"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Company Info & Report Header */}
          {data && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">24/9 CAR</h3>
                  <p className="text-sm text-blue-100">Car Washing Service</p>
                  <p className="text-xs text-blue-200 mt-2">
                    ATTENDANCE REPORT – {monthNames[month - 1].toUpperCase()} {year}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Employee Code:</span>
                    <span className="font-semibold">{data.employeeCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Employee Name:</span>
                    <span className="font-semibold">{data.employeeName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Department:</span>
                    <span className="font-semibold">{data.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">From - To:</span>
                    <span className="font-semibold">{data.fromDate} to {data.toDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Report Date:</span>
                    <span className="font-semibold">{data.reportDate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {data ? (
            <>
              {/* Export Actions */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportExcel}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportPDF}
                  className="gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Export PDF
                </Button>
              </div>

              {/* Color Legend */}
              <Card className="border-2 border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-sm font-medium">🔵 BLUE = RAW DATA (From Employee)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-sm font-medium">🟩 GREEN = CALCULATED (System Generated)</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Blue fields are sourced from employee attendance. Green fields are system-calculated and drive payroll, deductions, and leave adjustments.
                  </p>
                </CardContent>
              </Card>

              {/* Main Attendance Table */}
              <Card>
                <CardHeader className="bg-gray-50 border-b">
                  <CardTitle className="text-lg">Daily Attendance Grid</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-xs font-semibold text-gray-700 border-r bg-gray-200 sticky left-0 z-10">
                            Date
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-blue-700 bg-blue-50 border-r">
                            Attendance Type
                            <div className="text-[10px] font-normal text-blue-600 mt-1">🔵 Raw</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-blue-700 bg-blue-50 border-r">
                            In Time
                            <div className="text-[10px] font-normal text-blue-600 mt-1">🔵 Raw</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-blue-700 bg-blue-50 border-r">
                            Out Time
                            <div className="text-[10px] font-normal text-blue-600 mt-1">🔵 Raw</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-green-700 bg-green-50 border-r">
                            Working Hours
                            <div className="text-[10px] font-normal text-green-600 mt-1">🟩 Calculated</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-green-700 bg-green-50 border-r">
                            Late Coming Count
                            <div className="text-[10px] font-normal text-green-600 mt-1">🟩 Calculated</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-green-700 bg-green-50 border-r">
                            Auto Logout Count
                            <div className="text-[10px] font-normal text-green-600 mt-1">🟩 Calculated</div>
                          </th>
                          <th className="text-center p-3 text-xs font-semibold text-blue-700 bg-blue-50">
                            Sunday / PH
                            <div className="text-[10px] font-normal text-blue-600 mt-1">🔵 Raw</div>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.records.map((record, index) => {
                          const isWeekend = record.isSunday;
                          const isHoliday = record.isPublicHoliday;
                          const isLate = record.lateComingCount > 0;
                          const isAutoLogout = record.autoLogoutCount > 0;

                          return (
                            <tr
                              key={index}
                              className={`border-b hover:bg-gray-50 ${
                                isWeekend ? "bg-gray-100" : isHoliday ? "bg-purple-50" : ""
                              }`}
                            >
                              <td className="p-3 text-sm font-medium text-gray-900 border-r bg-gray-50 sticky left-0">
                                <div>{record.date}</div>
                                <div className="text-xs text-gray-500">{record.day}</div>
                              </td>
                              <td className="p-3 text-center border-r bg-blue-50/30">
                                <Badge
                                  variant="outline"
                                  className={`${
                                    record.attendanceType === "P"
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : record.attendanceType === "A"
                                      ? "bg-red-100 text-red-700 border-red-300"
                                      : record.attendanceType === "WOFF"
                                      ? "bg-gray-100 text-gray-700 border-gray-300"
                                      : record.attendanceType === "PH"
                                      ? "bg-purple-100 text-purple-700 border-purple-300"
                                      : record.attendanceType === "LWP"
                                      ? "bg-orange-100 text-orange-700 border-orange-300"
                                      : "bg-blue-100 text-blue-700 border-blue-300"
                                  } text-xs font-semibold`}
                                >
                                  {record.attendanceType}
                                </Badge>
                              </td>
                              <td className="p-3 text-center text-sm border-r bg-blue-50/30">
                                {record.inTime || "-"}
                              </td>
                              <td className="p-3 text-center text-sm border-r bg-blue-50/30">
                                {record.outTime || "-"}
                              </td>
                              <td className="p-3 text-center text-sm font-semibold border-r bg-green-50/30">
                                {record.workingHours > 0 ? `${(record?.workingHours ?? 0).toFixed(2)}h` : "-"}
                              </td>
                              <td className="p-3 text-center border-r bg-green-50/30">
                                {isLate ? (
                                  <span className="inline-flex items-center gap-1 text-yellow-700 bg-yellow-100 px-2 py-1 rounded text-xs font-semibold">
                                    <AlertCircle className="w-3 h-3" />1
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center border-r bg-green-50/30">
                                {isAutoLogout ? (
                                  <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded text-xs font-semibold">
                                    <AlertCircle className="w-3 h-3" />1
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="p-3 text-center text-sm bg-blue-50/30">
                                {isWeekend ? (
                                  <Badge className="bg-gray-500 text-white text-xs">SUNDAY</Badge>
                                ) : isHoliday ? (
                                  <Badge className="bg-purple-500 text-white text-xs">
                                    {record.publicHolidayName}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Summary Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Attendance Summary */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="bg-green-100 border-b border-green-200">
                    <CardTitle className="text-base text-green-900">
                      📊 Attendance Summary
                      <span className="text-xs font-normal text-green-600 ml-2">🟩 Calculated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Total Days</span>
                      <span className="font-bold text-gray-900">{data.summary.totalDays}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Pay Days</span>
                      <span className="font-bold text-green-700">{(data?.summary?.payDays ?? 0).toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Weekly Off</span>
                      <span className="font-bold text-gray-900">{data.summary.weeklyOff}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Public Holiday</span>
                      <span className="font-bold text-purple-700">{data.summary.publicHoliday}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Presence Summary */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="bg-blue-100 border-b border-blue-200">
                    <CardTitle className="text-base text-blue-900">
                      👥 Presence Summary
                      <span className="text-xs font-normal text-blue-600 ml-2">🟩 Calculated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Present Days</span>
                      <span className="font-bold text-green-700">{data.summary.presentDays}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Absent Days</span>
                      <span className="font-bold text-red-700">{data.summary.absentDays}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Leave With Salary</span>
                      <span className="font-bold text-blue-700">{data.summary.leaveWithSalary}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Leave Without Pay</span>
                      <span className="font-bold text-orange-700">{data.summary.leaveWithoutPay}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Adjustment Section */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader className="bg-orange-100 border-b border-orange-200">
                    <CardTitle className="text-base text-orange-900">
                      ⚠️ Adjustment Section
                      <span className="text-xs font-normal text-orange-600 ml-2">🟩 Calculated</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Late Coming Count</span>
                      <span className="font-bold text-yellow-700">{data.adjustment.lateComingCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Auto Logout Count</span>
                      <span className="font-bold text-red-700">{data.adjustment.autoLogoutCount}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Attendance Deduction</span>
                      <span className="font-bold text-orange-700">{(data?.adjustment?.attendanceDeduction ?? 0).toFixed(1)} days</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gray-900">Days Deducted</span>
                      <span className="font-bold text-red-800">{(data?.adjustment?.daysDeducted ?? 0).toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Deduction Rules Info */}
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-700 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-yellow-900 mb-1">Deduction Rules Applied:</p>
                      <ul className="list-disc list-inside space-y-1 text-yellow-800">
                        <li>3 Late Coming instances = 0.5 Day Deduction</li>
                        <li>1 Auto Logout = 0.5 Day Deduction</li>
                        <li>1 Absent = 1 Day Deduction</li>
                        <li>1 LWP = 1 Day Deduction</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Adjustment Grid */}
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader className="bg-purple-100 border-b border-purple-200">
                  <CardTitle className="text-base text-purple-900">
                    🔁 Leave Adjustment Grid
                    <span className="text-xs font-normal text-purple-600 ml-2">🟩 Calculated / System Applied</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Row 1 */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">TOTAL DAYS</p>
                        <p className="text-lg font-bold text-gray-900">{data.summary.totalDays}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">Working Days</p>
                        <p className="text-lg font-bold text-gray-900">{data.summary.totalDays - data.summary.weeklyOff}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">PAID DAYS</p>
                        <p className="text-lg font-bold text-green-700">{(data?.summary?.payDays ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">WEEKLY OFF</p>
                        <p className="text-lg font-bold text-gray-900">{data.summary.weeklyOff}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">PUBLIC HOLIDAY</p>
                        <p className="text-lg font-bold text-purple-700">{data.summary.publicHoliday}</p>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">PRESENT DAYS</p>
                        <p className="text-lg font-bold text-green-700">{(data?.summary?.presentDays ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">ABSENT DAYS</p>
                        <p className="text-lg font-bold text-red-700">{data.summary.absentDays}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">LEAVE WITH SALARY</p>
                        <p className="text-lg font-bold text-blue-700">{data.summary.leaveWithSalary}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">LEAVE WITHOU PAY</p>
                        <p className="text-lg font-bold text-orange-700">{(data?.summary?.leaveWithoutPay ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 opacity-0">
                        <p className="text-xs text-gray-700 mb-1">&nbsp;</p>
                        <p className="text-lg font-bold">&nbsp;</p>
                      </div>
                    </div>

                    {/* Row 3 */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">MATERNITY LEAVE</p>
                        <p className="text-lg font-bold text-gray-900">0</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">LATE COMING COUNT</p>
                        <p className="text-lg font-bold text-yellow-700">{data.adjustment.lateComingCount}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">AUTO LOGOUT COUNT</p>
                        <p className="text-lg font-bold text-red-700">{data.adjustment.autoLogoutCount}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">ATTENDANCE - DAYS TO BE DEDUCT</p>
                        <p className="text-lg font-bold text-orange-700">{(data?.adjustment?.attendanceDeduction ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">LEAVE ADJUSTED</p>
                        <p className="text-lg font-bold text-gray-900">0</p>
                      </div>
                    </div>

                    {/* Row 4 */}
                    <div className="grid grid-cols-5 gap-3">
                      <div className="bg-white p-3 rounded border border-gray-200 opacity-0">
                        <p className="text-xs text-gray-700 mb-1">&nbsp;</p>
                        <p className="text-lg font-bold">&nbsp;</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 opacity-0">
                        <p className="text-xs text-gray-700 mb-1">&nbsp;</p>
                        <p className="text-lg font-bold">&nbsp;</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 opacity-0">
                        <p className="text-xs text-gray-700 mb-1">&nbsp;</p>
                        <p className="text-lg font-bold">&nbsp;</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-300">
                        <p className="text-xs text-gray-700 mb-1 font-semibold">ATTENDANCE - DAYS DEDUCTED</p>
                        <p className="text-lg font-bold text-red-800">{(data?.adjustment?.attendanceDeduction ?? 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-200 opacity-0">
                        <p className="text-xs text-gray-700 mb-1">&nbsp;</p>
                        <p className="text-lg font-bold">&nbsp;</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Audit Trail */}
              <Card className="border-gray-300">
                <CardHeader className="bg-gray-100 border-b">
                  <CardTitle className="text-base text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Audit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Generated By</p>
                      <p className="font-semibold">System Auto</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Generated On</p>
                      <p className="font-semibold">{data.reportDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Source</p>
                      <p className="font-semibold">Attendance Logs</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <Badge className="bg-green-600 text-white">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <GeneratedPayslip
                  data={data}
                  month={month}
                  year={year}
                  currentRole={(() => { try { const s = localStorage.getItem("cc360_session"); return s ? JSON.parse(s).role : undefined; } catch { return undefined; } })()}
                  currentUser={(() => { try { const s = localStorage.getItem("cc360_session"); const p = s ? JSON.parse(s) : null; return p ? { name: p.employeeName } : undefined; } catch { return undefined; } })()}
                />
            </>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading attendance data...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
