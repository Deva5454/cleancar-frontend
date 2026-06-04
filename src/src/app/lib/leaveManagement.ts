// Leave Management System

export interface LeaveBalance {
  casualLeave: number;
  sickLeave: number;
  paidLeave: number;
  lwp: number;
  totalUsed: number;
  totalAvailable: number;
  nationalHolidaysCompensated: number;
}

export interface LeaveApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "Casual Leave" | "Sick Leave" | "Paid Leave" | "LWP" | "Emergency Leave";
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectedBy?: string;
  rejectedOn?: string;
  rejectionReason?: string;
  reportingManager?: string;
  remarks?: string;
}

export interface NationalHoliday {
  date: string;
  name: string;
  compensationType: "Week Off" | "Double Pay";
  compensated: boolean;
}

// Annual leave allocation
export const ANNUAL_LEAVE_QUOTA = {
  casualLeave: 6,
  sickLeave: 6,
  paidLeave: 12, // Total annual quota
  lwp: 999, // Unlimited but unpaid
};

// Surat National Holidays 2026
export const nationalHolidays2026: NationalHoliday[] = [
  { date: "2026-01-26", name: "Republic Day", compensationType: "Week Off", compensated: false },
  { date: "2026-03-14", name: "Holi", compensationType: "Week Off", compensated: false },
  { date: "2026-04-02", name: "Ram Navami", compensationType: "Week Off", compensated: false },
  { date: "2026-04-06", name: "Mahavir Jayanti", compensationType: "Week Off", compensated: false },
  { date: "2026-04-14", name: "Ambedkar Jayanti", compensationType: "Week Off", compensated: false },
  { date: "2026-05-01", name: "Labour Day", compensationType: "Week Off", compensated: false },
  { date: "2026-07-06", name: "Eid ul-Fitr", compensationType: "Week Off", compensated: false },
  { date: "2026-08-15", name: "Independence Day", compensationType: "Week Off", compensated: false },
  { date: "2026-09-12", name: "Eid ul-Adha", compensationType: "Week Off", compensated: false },
  { date: "2026-10-02", name: "Gandhi Jayanti", compensationType: "Week Off", compensated: false },
  { date: "2026-10-19", name: "Dussehra", compensationType: "Week Off", compensated: false },
  { date: "2026-11-08", name: "Diwali", compensationType: "Week Off", compensated: false },
  { date: "2026-11-16", name: "Guru Nanak Jayanti", compensationType: "Week Off", compensated: false },
  { date: "2026-12-25", name: "Christmas", compensationType: "Week Off", compensated: false },
];

export function calculateLeaveDays(fromDate: string, toDate: string): number {
  const start = new Date(fromDate);
  const end = new Date(toDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

export function calculateProrateSalary(
  baseSalary: number,
  joiningDate: string,
  leavingDate: string | null,
  month: string
): {
  daysWorked: number;
  totalDays: number;
  proratedSalary: number;
  isProrateApplicable: boolean;
} {
  const [year, monthNum] = month.split("-").map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0);
  const totalDays = monthEnd.getDate();

  const joining = new Date(joiningDate);
  const leaving = leavingDate ? new Date(leavingDate) : null;

  let daysWorked = totalDays;
  let isProrateApplicable = false;

  // Check if joining is in this month
  if (joining.getFullYear() === year && joining.getMonth() === monthNum - 1) {
    daysWorked = totalDays - joining.getDate() + 1;
    isProrateApplicable = true;
  }

  // Check if leaving is in this month
  if (leaving && leaving.getFullYear() === year && leaving.getMonth() === monthNum - 1) {
    daysWorked = leaving.getDate();
    isProrateApplicable = true;
  }

  const proratedSalary = Math.round((baseSalary / totalDays) * daysWorked);

  return {
    daysWorked,
    totalDays,
    proratedSalary,
    isProrateApplicable,
  };
}

export function getLeaveBalance(employeeId: string, year: number): LeaveBalance {
  // Mock implementation - in real app, fetch from database
  return {
    casualLeave: 4,
    sickLeave: 5,
    paidLeave: 8,
    lwp: 0,
    totalUsed: 4,
    totalAvailable: 8,
    nationalHolidaysCompensated: 2,
  };
}

export function validateLeaveApplication(
  application: LeaveApplication,
  currentBalance: LeaveBalance
): { valid: boolean; error?: string } {
  const requiredDays = application.days;

  switch (application.leaveType) {
    case "Casual Leave":
      if (currentBalance.casualLeave < requiredDays) {
        return { valid: false, error: `Insufficient casual leave balance. Available: ${currentBalance.casualLeave}` };
      }
      break;
    case "Sick Leave":
      if (currentBalance.sickLeave < requiredDays) {
        return { valid: false, error: `Insufficient sick leave balance. Available: ${currentBalance.sickLeave}` };
      }
      break;
    case "Paid Leave":
      if (currentBalance.paidLeave < requiredDays) {
        return { valid: false, error: `Insufficient paid leave balance. Available: ${currentBalance.paidLeave}` };
      }
      break;
    case "LWP":
      // LWP is always allowed
      break;
    case "Emergency Leave":
      // Emergency leave is always allowed
      break;
  }

  return { valid: true };
}