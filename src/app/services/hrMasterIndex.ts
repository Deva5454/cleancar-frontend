/**
 * HR Master Index - Central Export for Unified HR Data Structure
 *
 * Import all HR master services from this single file
 *
 * Usage:
 * ```
 * import { employeeMaster, attendanceMaster, payrollMaster, incentiveLedger } from './services/hrMasterIndex';
 * ```
 */

// ========== MASTER SERVICES ==========

export {
  employeeMasterService,
  employeeMaster,
  EmployeeAdapter,
  type EmployeeMaster,
  type EmployeeStatus,
  type LegacyEmployee,
} from "./employeeMaster";

export {
  attendanceMasterService,
  attendanceMaster,
  AttendanceAdapter,
  type AttendanceMaster,
  type AttendanceStatus,
  type FraudFlag,
  type MonthlyAttendanceSummary,
  type LegacyAttendanceRecord,
} from "./attendanceMaster";

export {
  payrollMasterService,
  payrollMaster,
  PayrollAdapter,
  type PayrollMaster,
  type PayrollStatus,
  type LegacyPayrollRecord,
} from "./payrollMaster";

export {
  incentiveLedgerService,
  incentiveLedger,
  IncentiveAdapter,
  type IncentiveLedger,
  type IncentiveType,
  type IncentiveStatus,
  type LegacyIncentiveRecord,
} from "./incentiveLedger";

// ========== VALIDATION & SYNC ==========

export {
  hrMasterValidator,
  type ValidationResult,
} from "./hrMasterValidator";

export {
  hrDataSync,
  type SyncResult,
} from "./hrDataSync";

// ========== QUICK ACCESS ==========

/**
 * Quick access object for all HR master services
 */
export const HRMaster = {
  employee: employeeMasterService,
  attendance: attendanceMasterService,
  payroll: payrollMasterService,
  incentive: incentiveLedgerService,
  validator: hrMasterValidator,
  sync: hrDataSync,
};

/**
 * Import everything at once
 */
import { employeeMasterService } from "./employeeMaster";
import { attendanceMasterService } from "./attendanceMaster";
import { payrollMasterService } from "./payrollMaster";
import { incentiveLedgerService } from "./incentiveLedger";
import { hrMasterValidator } from "./hrMasterValidator";
import { hrDataSync } from "./hrDataSync";
