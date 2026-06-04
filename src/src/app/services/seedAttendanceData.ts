/**
 * Data Seeding Service for Attendance System
 * Populates March 2026 dummy data with various scenarios
 */

import { gracePeriodService } from "./gracePeriodService";
import { salaryHoldService } from "./salaryHoldService";
import { ATTENDANCE_TYPES, GRACE_PERIOD_APPLICATIONS } from "../constants/payrollConstants";

export interface EmployeeAttendanceRecord {
  employeeId: string;
  employeeName: string;
  empCode: string;
  role: string;
  dailyAttendance: {
    date: string;
    status: string;
    checkIn?: string;
    checkOut?: string;
    lateMinutes?: number;
    graceUsed?: boolean;
  }[];
  graceUsageCount: number;
  hasGhosting: boolean;
  salaryHoldStatus?: "ON_HOLD" | "OVERRIDE_PENDING";
}

/**
 * Seed March 2026 attendance data for multiple employees
 * Demonstrates all possible attendance scenarios
 */
export function seedMarchAttendanceData(): EmployeeAttendanceRecord[] {
  const employees: EmployeeAttendanceRecord[] = [
    // Employee 1: Perfect Attendance - No grace used, no issues
    {
      employeeId: "EMP-002",
      employeeName: "Priya Sharma",
      empCode: "PS002",
      role: "Sales Executive",
      graceUsageCount: 0,
      hasGhosting: false,
      dailyAttendance: generatePerfectAttendance("2026-03"),
    },

    // Employee 2: Used 2/3 grace period - within quota
    {
      employeeId: "EMP-003",
      employeeName: "Amit Kumar",
      empCode: "AK003",
      role: "Finance Manager",
      graceUsageCount: 2,
      hasGhosting: false,
      dailyAttendance: generateAttendanceWithGrace("2026-03", [
        { date: "2026-03-05", lateMinutes: 8 },
        { date: "2026-03-12", lateMinutes: 10 },
      ]),
    },

    // Employee 3: Exhausted grace period (3/3 used)
    {
      employeeId: "CW-101",
      employeeName: "Ravi Verma",
      empCode: "RV101",
      role: "Car Washer / Technician",
      graceUsageCount: 3,
      hasGhosting: false,
      dailyAttendance: generateAttendanceWithGrace("2026-03", [
        { date: "2026-03-04", lateMinutes: 9 },
        { date: "2026-03-11", lateMinutes: 10 },
        { date: "2026-03-18", lateMinutes: 8 },
      ]),
    },

    // Employee 4: Ghosting detected (3 consecutive absences) - ON_HOLD
    {
      employeeId: "CW-102",
      employeeName: "Suresh Yadav",
      empCode: "SY102",
      role: "Field Supervisor",
      graceUsageCount: 1,
      hasGhosting: true,
      salaryHoldStatus: "ON_HOLD",
      dailyAttendance: generateAttendanceWithGhosting("2026-03", [
        "2026-03-24",
        "2026-03-25",
        "2026-03-26",
      ]),
    },

    // Employee 5: Multiple half-days and mixed attendance
    {
      employeeId: "EMP-004",
      employeeName: "Neha Patel",
      empCode: "NP004",
      role: "HR Coordinator",
      graceUsageCount: 1,
      hasGhosting: false,
      dailyAttendance: generateMixedAttendance("2026-03"),
    },

    // Employee 6: Ghosting with override request PENDING
    {
      employeeId: "CW-103",
      employeeName: "Anjali Rao",
      empCode: "AR103",
      role: "Tele Sales Executive",
      graceUsageCount: 2,
      hasGhosting: true,
      salaryHoldStatus: "OVERRIDE_PENDING",
      dailyAttendance: generateAttendanceWithGhosting("2026-03", [
        "2026-03-17",
        "2026-03-18",
        "2026-03-19",
      ]),
    },

    // Employee 7: Multiple LWP (Leave Without Pay) days
    {
      employeeId: "EMP-006",
      employeeName: "Sneha Gupta",
      empCode: "SG006",
      role: "Marketing Executive",
      graceUsageCount: 0,
      hasGhosting: false,
      dailyAttendance: generateAttendanceWithLWP("2026-03"),
    },

    // Employee 8: Exceeded grace quota + late arrival triggering HPLRG
    {
      employeeId: "CW-104",
      employeeName: "Deepak Joshi",
      empCode: "DJ104",
      role: "Cluster Manager",
      graceUsageCount: 3,
      hasGhosting: false,
      dailyAttendance: generateAttendanceWithGraceExceeded("2026-03"),
    },
  ];

  // Populate grace period service
  employees.forEach((emp) => {
    if (emp.graceUsageCount > 0) {
      const usageRecords = emp.dailyAttendance
        .filter((d) => d.graceUsed)
        .map((d, index) => ({
          id: `grace-${emp.employeeId}-${index}`,
          date: d.date,
          time: d.checkIn || "09:08 AM",
          minutesLate: d.lateMinutes || 8,
          recordedAt: new Date(d.date).toISOString(),
        }));

      usageRecords.forEach((usage) => {
        // Correct parameter order: employeeId, minutesLate, applicationType, date
        gracePeriodService.recordGraceUsage(
          emp.employeeId,
          usage.minutesLate,
          GRACE_PERIOD_APPLICATIONS.SHIFT_START,
          new Date(usage.date)
        );
      });
    }
  });

  // Populate salary hold service
  employees.forEach((emp) => {
    if (emp.hasGhosting) {
      const absentDates = emp.dailyAttendance
        .filter(
          (d) =>
            d.status === ATTENDANCE_TYPES.ABSENT ||
            d.status === ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY
        )
        .map((d) => d.date)
        .slice(0, 3); // First 3 consecutive

      // Create hold record
      const holdRecord = salaryHoldService.checkForGhosting(
        emp.employeeId,
        emp.employeeName,
        absentDates
      );

      if (holdRecord && emp.salaryHoldStatus === "OVERRIDE_PENDING") {
        // Submit override request
        salaryHoldService.submitOverrideRequest(
          emp.employeeId,
          "Supervisor Team Lead",
          "Employee was on medical emergency. Hospital admission proof attached.",
          ["Hospital_Admission_Certificate.pdf"]
        );
      }
    }
  });

  return employees;
}

// Helper: Generate perfect attendance (all Present except Sundays)
function generatePerfectAttendance(monthYear: string) {
  const days = [];
  const [year, month] = monthYear.split("-").map(Number);

  for (let day = 1; day <= 31; day++) {
    const date = new Date(year, month - 1, day);
    if (date.getMonth() !== month - 1) break; // Stop at month end

    const dateStr = `${monthYear}-${String(day).padStart(2, "0")}`;
    const dayOfWeek = date.getDay();

    days.push({
      date: dateStr,
      status: dayOfWeek === 0 ? ATTENDANCE_TYPES.WEEKLY_OFF : ATTENDANCE_TYPES.PRESENT,
      checkIn: dayOfWeek === 0 ? undefined : "09:00 AM",
      checkOut: dayOfWeek === 0 ? undefined : "06:00 PM",
    });
  }

  return days;
}

// Helper: Generate attendance with specific grace period usage
function generateAttendanceWithGrace(
  monthYear: string,
  graceInstances: { date: string; lateMinutes: number }[]
) {
  const days = generatePerfectAttendance(monthYear);

  graceInstances.forEach(({ date, lateMinutes }) => {
    const dayRecord = days.find((d) => d.date === date);
    if (dayRecord) {
      dayRecord.checkIn = `09:${String(lateMinutes).padStart(2, "0")} AM`;
      dayRecord.lateMinutes = lateMinutes;
      dayRecord.graceUsed = true;
    }
  });

  return days;
}

// Helper: Generate attendance with ghosting (3 consecutive absences)
function generateAttendanceWithGhosting(monthYear: string, absentDates: string[]) {
  const days = generatePerfectAttendance(monthYear);

  absentDates.forEach((date) => {
    const dayRecord = days.find((d) => d.date === date);
    if (dayRecord) {
      dayRecord.status = ATTENDANCE_TYPES.ABSENT;
      dayRecord.checkIn = undefined;
      dayRecord.checkOut = undefined;
    }
  });

  return days;
}

// Helper: Generate mixed attendance with various statuses
function generateMixedAttendance(monthYear: string) {
  const days = generatePerfectAttendance(monthYear);

  // Add some variety
  const modifications = [
    { date: "2026-03-06", status: ATTENDANCE_TYPES.FIRST_HALF }, // Half day (1st half)
    { date: "2026-03-13", status: ATTENDANCE_TYPES.SECOND_HALF }, // Half day (2nd half)
    { date: "2026-03-20", status: ATTENDANCE_TYPES.PAID_LEAVE }, // Full PL
    { date: "2026-03-27", status: ATTENDANCE_TYPES.CASUAL_LEAVE }, // Casual leave
    { date: "2026-03-10", status: ATTENDANCE_TYPES.COMP_OFF }, // Comp off
    { date: "2026-03-07", status: ATTENDANCE_TYPES.PUBLIC_HOLIDAY }, // Public holiday
  ];

  modifications.forEach(({ date, status }) => {
    const dayRecord = days.find((d) => d.date === date);
    if (dayRecord) {
      dayRecord.status = status;
      if (
        status === ATTENDANCE_TYPES.PAID_LEAVE ||
        status === ATTENDANCE_TYPES.CASUAL_LEAVE ||
        status === ATTENDANCE_TYPES.COMP_OFF ||
        status === ATTENDANCE_TYPES.PUBLIC_HOLIDAY
      ) {
        dayRecord.checkIn = undefined;
        dayRecord.checkOut = undefined;
      } else if (status === ATTENDANCE_TYPES.FIRST_HALF) {
        dayRecord.checkIn = "09:00 AM";
        dayRecord.checkOut = "01:00 PM";
      } else if (status === ATTENDANCE_TYPES.SECOND_HALF) {
        dayRecord.checkIn = "02:00 PM";
        dayRecord.checkOut = "06:00 PM";
      }
    }
  });

  return days;
}

// Helper: Generate attendance with multiple LWP days
function generateAttendanceWithLWP(monthYear: string) {
  const days = generatePerfectAttendance(monthYear);

  const lwpDates = ["2026-03-11", "2026-03-14", "2026-03-21"];

  lwpDates.forEach((date) => {
    const dayRecord = days.find((d) => d.date === date);
    if (dayRecord) {
      dayRecord.status = ATTENDANCE_TYPES.LEAVE_WITHOUT_PAY;
      dayRecord.checkIn = undefined;
      dayRecord.checkOut = undefined;
    }
  });

  return days;
}

// Helper: Generate attendance with grace exceeded (4th late arrival triggers HPLRG)
function generateAttendanceWithGraceExceeded(monthYear: string) {
  const days = generatePerfectAttendance(monthYear);

  // First 3 use grace
  const graceUsed = [
    { date: "2026-03-03", lateMinutes: 9, graceUsed: true },
    { date: "2026-03-10", lateMinutes: 10, graceUsed: true },
    { date: "2026-03-17", lateMinutes: 8, graceUsed: true },
  ];

  // 4th late arrival triggers HPLRG (Half PL Grace Adjustment)
  const graceExceeded = { date: "2026-03-24", status: ATTENDANCE_TYPES.HALF_PL_GRACE_ADJUSTMENT };

  graceUsed.forEach(({ date, lateMinutes }) => {
    const dayRecord = days.find((d) => d.date === date);
    if (dayRecord) {
      dayRecord.checkIn = `09:${String(lateMinutes).padStart(2, "0")} AM`;
      dayRecord.lateMinutes = lateMinutes;
      dayRecord.graceUsed = true;
    }
  });

  const exceededRecord = days.find((d) => d.date === graceExceeded.date);
  if (exceededRecord) {
    exceededRecord.status = graceExceeded.status;
    exceededRecord.checkIn = "09:15 AM"; // Arrived 15 min late
    exceededRecord.lateMinutes = 15;
  }

  return days;
}

/**
 * Clear all attendance data from services
 */
export function clearAllAttendanceData() {
  // Clear grace period data
  localStorage.removeItem("grace_period_usage");

  // Clear salary hold data
  localStorage.removeItem("salary_hold_records");

  console.log("✅ All attendance data cleared");
}

/**
 * Get summary statistics of seeded data
 */
export function getDataSummary() {
  const graceUsages = gracePeriodService.getAllGraceUsage();
  const holdRecords = salaryHoldService.getAllRecords();

  // Count total grace records (sum of all usageHistory items)
  const totalGraceRecords = graceUsages.reduce((sum, usage) => sum + usage.usageHistory.length, 0);

  return {
    totalEmployees: 8,
    graceRecords: totalGraceRecords,
    holdRecords: holdRecords.length,
    holdStatuses: {
      onHold: holdRecords.filter((r) => r.status === "ON_HOLD").length,
      overridePending: holdRecords.filter((r) => r.status === "OVERRIDE_PENDING").length,
    },
  };
}

/**
 * Initialize data on app load if not already present
 */
export function initializeAttendanceData() {
  try {
    const existingGrace = localStorage.getItem("grace_period_usage");
    const existingHolds = localStorage.getItem("salary_hold_records");

    // Only seed if no data exists
    if (!existingGrace && !existingHolds) {
      console.log("🌱 Seeding March 2026 attendance data...");
      const employees = seedMarchAttendanceData();
      const summary = getDataSummary();

      console.log("✅ Data seeding complete:");
      console.log(`   - ${employees.length} employees`);
      console.log(`   - ${summary.graceRecords} grace period records`);
      console.log(`   - ${summary.holdRecords.onHold} employees on salary hold`);
      console.log(`   - ${summary.holdRecords.overridePending} override requests pending`);

      return { seeded: true, summary, employees };
    }

    console.log("ℹ️ Attendance data already exists. Use clearAllAttendanceData() to reset.");
    return { seeded: false };
  } catch (error) {
    console.error("❌ Error initializing attendance data:", error);
    return { seeded: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
