/**
 * HR Data Sync Service
 *
 * Automatically syncs data between legacy structures and new master schemas
 * Keeps old structures intact while populating new unified schemas
 */

import { employeeMasterService, EmployeeAdapter } from "./employeeMaster";
import { attendanceMasterService, AttendanceAdapter } from "./attendanceMaster";
import { payrollMasterService, PayrollAdapter } from "./payrollMaster";
import { incentiveLedgerService, IncentiveAdapter } from "./incentiveLedger";
import { hrMasterValidator } from "./hrMasterValidator";
import { logger } from "./logger";
import { DataService } from "./DataService";

// ========== SYNC RESULTS ==========

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
}

// ========== SYNC SERVICE ==========

class HRDataSyncService {
  /**
   * Sync all HR data from legacy to master schemas
   */
  syncAll(): {
    employees: SyncResult;
    attendance: SyncResult;
    payroll: SyncResult;
    incentives: SyncResult;
  } {
    logger.log("HRDataSync: Starting full sync");

    const results = {
      employees: this.syncEmployees(),
      attendance: this.syncAttendance(),
      payroll: this.syncPayroll(),
      incentives: this.syncIncentives(),
    };

    logger.log("HRDataSync: Full sync completed", results);
    return results;
  }

  /**
   * Sync employees from legacy EmployeeDatabase to EmployeeMaster
   */
  syncEmployees(): SyncResult {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get legacy employees
      const legacyEmployees = DataService.get<any>("EMPLOYEE_DATABASE") || [];
      logger.log(`HRDataSync: Found ${legacyEmployees.length} legacy employees`);

      // Get existing master records
      const existingMaster = employeeMasterService.getAll();
      const existingIds = new Set(existingMaster.map(e => e.employeeId));

      // Sync each legacy employee
      legacyEmployees.forEach((legacyEmp: any) => {
        try {
          // Skip if already in master
          if (existingIds.has(legacyEmp.employeeId)) {
            skipped++;
            return;
          }

          // Convert to master format
          const masterEmp = EmployeeAdapter.toMaster(legacyEmp);

          // Validate
          const validation = hrMasterValidator.validateEmployeeId(masterEmp.employeeId);
          if (!validation.valid && existingIds.has(masterEmp.employeeId)) {
            // Already exists, skip
            skipped++;
            return;
          }

          // Create in master
          employeeMasterService.create({
            name: masterEmp.name,
            phone: masterEmp.phone,
            roleId: masterEmp.roleId,
            cityId: masterEmp.cityId,
            status: masterEmp.status,
            joiningDate: masterEmp.joiningDate,
            exitDate: masterEmp.exitDate,
            createdBy: "sync",
            updatedBy: "sync",
          });

          synced++;
        } catch (error) {
          failed++;
          errors.push(`Failed to sync employee ${legacyEmp.employeeId}: ${error}`);
        }
      });

      return { success: failed === 0, synced, failed, skipped, errors };
    } catch (error) {
      errors.push(`Employee sync failed: ${error}`);
      return { success: false, synced, failed, skipped, errors };
    }
  }

  /**
   * Sync attendance from legacy ATTENDANCE to AttendanceMaster
   */
  syncAttendance(): SyncResult {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get legacy attendance records
      const legacyAttendance = DataService.get<any>("ATTENDANCE") || [];
      logger.log(`HRDataSync: Found ${legacyAttendance.length} legacy attendance records`);

      // Get existing master records
      const existingMaster = attendanceMasterService.getAll();
      const existingKeys = new Set(
        existingMaster.map(a => `${a.employeeId}-${a.date}`)
      );

      // Sync each legacy record
      legacyAttendance.forEach((legacyAtt: any) => {
        try {
          // Skip if employeeId is missing or undefined
          if (!legacyAtt.employeeId) {
            failed++;
            errors.push(`Invalid employeeId for attendance: ${legacyAtt.employeeId}`);
            logger.warn("HRDataSync: Skipping attendance record with missing employeeId", { date: legacyAtt.date, record: legacyAtt });
            return;
          }

          const key = `${legacyAtt.employeeId}-${legacyAtt.date}`;

          // Skip if already in master
          if (existingKeys.has(key)) {
            skipped++;
            return;
          }

          // Validate employee exists
          const validation = hrMasterValidator.validateEmployeeId(legacyAtt.employeeId);
          if (!validation.valid) {
            failed++;
            errors.push(`Invalid employeeId for attendance: ${legacyAtt.employeeId}`);
            return;
          }

          // Convert to master format
          const masterAtt = AttendanceAdapter.toMaster(legacyAtt);

          // Create in master (remove auto-generated fields)
          const { attendanceId, createdAt, ...attData } = masterAtt;
          attendanceMasterService.create(attData);

          synced++;
        } catch (error) {
          failed++;
          errors.push(`Failed to sync attendance for ${legacyAtt.employeeId}: ${error}`);
        }
      });

      return { success: failed === 0, synced, failed, skipped, errors };
    } catch (error) {
      errors.push(`Attendance sync failed: ${error}`);
      return { success: false, synced, failed, skipped, errors };
    }
  }

  /**
   * Sync payroll from legacy payroll records to PayrollMaster
   */
  syncPayroll(): SyncResult {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get legacy payroll records (stored in PAYROLL_RUNS)
      const legacyPayroll = DataService.get<any>("PAYROLL_RUNS") || [];
      logger.log(`HRDataSync: Found ${legacyPayroll.length} legacy payroll records`);

      // Get existing master records
      const existingMaster = payrollMasterService.getAll();
      const existingKeys = new Set(
        existingMaster.map(p => `${p.employeeId}-${p.month}-${p.year}`)
      );

      // Sync each legacy record
      legacyPayroll.forEach((legacyPay: any) => {
        try {
          // Skip if employeeId is missing or undefined
          if (!legacyPay.employeeId) {
            failed++;
            errors.push(`Invalid employeeId for payroll: ${legacyPay.employeeId}`);
            logger.warn("HRDataSync: Skipping payroll record with missing employeeId", { payrollId: legacyPay.payrollId, record: legacyPay });
            return;
          }

          // Parse month from PayrollRun format (YYYY-MM)
          const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
          let month: string;
          let year: number;

          if (typeof legacyPay.month === 'string' && legacyPay.month.includes('-')) {
            // PayrollRun format: "2026-04"
            const [yearStr, monthStr] = legacyPay.month.split('-');
            year = parseInt(yearStr);
            const monthNum = parseInt(monthStr);
            month = monthNames[monthNum - 1] || "January";
          } else if (typeof legacyPay.month === 'number') {
            // Old format: month number
            month = monthNames[legacyPay.month - 1] || "January";
            year = legacyPay.year;
          } else {
            failed++;
            errors.push(`Invalid month format for payroll: ${legacyPay.month}`);
            return;
          }

          const key = `${legacyPay.employeeId}-${month}-${year}`;

          // Skip if already in master
          if (existingKeys.has(key)) {
            skipped++;
            return;
          }

          // Validate employee exists
          const validation = hrMasterValidator.validateEmployeeId(legacyPay.employeeId);
          if (!validation.valid) {
            failed++;
            errors.push(`Invalid employeeId for payroll: ${legacyPay.employeeId}`);
            return;
          }

          // Convert PayrollRun to LegacyPayrollRecord format if needed
          const legacyPayrollRecord = this.convertToLegacyFormat(legacyPay, month, year);

          // Convert to master format
          const masterPay = PayrollAdapter.toMaster(legacyPayrollRecord);

          // Create in master (remove auto-generated fields)
          const { payrollId, createdAt, ...payData } = masterPay;
          payrollMasterService.create(payData);

          synced++;
        } catch (error) {
          failed++;
          errors.push(`Failed to sync payroll for ${legacyPay.employeeId}: ${error}`);
        }
      });

      return { success: failed === 0, synced, failed, skipped, errors };
    } catch (error) {
      errors.push(`Payroll sync failed: ${error}`);
      return { success: false, synced, failed, skipped, errors };
    }
  }

  /**
   * Sync incentives from legacy incentive records to IncentiveLedger
   */
  syncIncentives(): SyncResult {
    const errors: string[] = [];
    let synced = 0;
    let failed = 0;
    let skipped = 0;

    try {
      // Get legacy incentive records
      const legacyIncentives = DataService.get<any>("INCENTIVE_RECORDS") || [];
      logger.log(`HRDataSync: Found ${legacyIncentives.length} legacy incentive records`);

      // Get existing master records
      const existingMaster = incentiveLedgerService.getAll();
      const existingIds = new Set(existingMaster.map(i => i.incentiveId));

      // Sync each legacy record
      legacyIncentives.forEach((legacyInc: any) => {
        try {
          // Skip if employeeId is missing or undefined
          if (!legacyInc.employeeId) {
            failed++;
            errors.push(`Invalid employeeId for incentive: ${legacyInc.employeeId}`);
            logger.warn("HRDataSync: Skipping incentive record with missing employeeId", { incentiveId: legacyInc.incentiveId, record: legacyInc });
            return;
          }

          // Skip if already in master
          if (legacyInc.incentiveId && existingIds.has(legacyInc.incentiveId)) {
            skipped++;
            return;
          }

          // Validate employee exists
          const validation = hrMasterValidator.validateEmployeeId(legacyInc.employeeId);
          if (!validation.valid) {
            failed++;
            errors.push(`Invalid employeeId for incentive: ${legacyInc.employeeId}`);
            return;
          }

          // Convert to master format
          const masterInc = IncentiveAdapter.toMaster(legacyInc, "sync");

          // Create in master (remove auto-generated fields)
          const { incentiveId, createdAt, ...incData } = masterInc;
          incentiveLedgerService.create(incData);

          synced++;
        } catch (error) {
          failed++;
          errors.push(`Failed to sync incentive for ${legacyInc.employeeId}: ${error}`);
        }
      });

      return { success: failed === 0, synced, failed, skipped, errors };
    } catch (error) {
      errors.push(`Incentive sync failed: ${error}`);
      return { success: false, synced, failed, skipped, errors };
    }
  }

  /**
   * Auto-sync on data changes (call this after any legacy data update)
   */
  autoSync(dataType: "employee" | "attendance" | "payroll" | "incentive"): void {
    logger.log(`HRDataSync: Auto-sync triggered for ${dataType}`);

    switch (dataType) {
      case "employee":
        this.syncEmployees();
        break;
      case "attendance":
        this.syncAttendance();
        break;
      case "payroll":
        this.syncPayroll();
        break;
      case "incentive":
        this.syncIncentives();
        break;
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    lastSyncTime?: string;
    employeesInMaster: number;
    attendanceInMaster: number;
    payrollInMaster: number;
    incentivesInMaster: number;
  } {
    return {
      lastSyncTime: DataService.get<string>("LAST_SYNC_TIME")[0],
      employeesInMaster: employeeMasterService.getAll().length,
      attendanceInMaster: attendanceMasterService.getAll().length,
      payrollInMaster: payrollMasterService.getAll().length,
      incentivesInMaster: incentiveLedgerService.getAll().length,
    };
  }

  /**
   * Mark sync as completed
   */
  private markSyncComplete(): void {
    DataService.setAll("LAST_SYNC_TIME", [new Date().toISOString()]);
  }

  /**
   * Convert PayrollRun format to LegacyPayrollRecord format
   */
  private convertToLegacyFormat(payrollRun: any, month: string, year: number): any {
    // If it's already in legacy format (has earnings array), return as-is
    if (payrollRun.earnings && Array.isArray(payrollRun.earnings)) {
      return payrollRun;
    }

    // Convert PayrollRun to LegacyPayrollRecord
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    const monthNumber = monthNames.indexOf(month) + 1;

    return {
      payrollId: payrollRun.payrollId,
      employeeId: payrollRun.employeeId,
      month: monthNumber,
      year: year,
      earnings: [
        { name: "Basic Salary", amount: payrollRun.baseSalary || 0 },
        { name: "Incentive", amount: payrollRun.incentiveAmount || 0 },
        { name: "Add-on Earnings", amount: payrollRun.addOnEarnings || 0 },
        { name: "Allowances", amount: payrollRun.allowances || 0 },
      ].filter(e => e.amount > 0),
      deductions: [
        { name: "EPF", amount: payrollRun.pf || 0 },
        { name: "ESIC", amount: payrollRun.esic || 0 },
        { name: "Professional Tax", amount: payrollRun.pt || 0 },
        { name: "TDS", amount: payrollRun.tds || 0 },
        { name: "Advances", amount: payrollRun.advances || 0 },
        { name: "Penalties", amount: payrollRun.penalties || 0 },
      ].filter(d => d.amount > 0),
      grossPay: payrollRun.grossSalary || 0,
      totalDeductions: payrollRun.totalDeductions || 0,
      netPay: payrollRun.netSalary || 0,
      status: payrollRun.status,
      paymentDate: payrollRun.paidAt,
    };
  }
}

// ========== EXPORT ==========

export const hrDataSync = new HRDataSyncService();
