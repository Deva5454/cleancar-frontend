/**
 * HR Execution Index - Single Point of Execution Services
 *
 * Import all HR execution services from this file
 * These services enforce single execution points for all HR operations
 *
 * Usage:
 * ```
 * import { EmployeeService, AttendanceService, PayrollEngine } from './services/hrExecutionIndex';
 * ```
 */

// ========== EXECUTION SERVICES ==========

export {
  EmployeeService,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest,
  type BulkCreateEmployeeRequest,
  type EmployeeOperationResult,
} from "./EmployeeService";

export {
  AttendanceService,
  type MarkAttendanceRequest,
  type AttendanceCorrectionRequest,
  type BulkMarkAttendanceRequest,
  type AttendanceOperationResult,
} from "./AttendanceService";

export {
  PayrollEngine,
  type ProcessPayrollRequest,
  type PayrollCorrectionRequest,
  type BulkProcessPayrollRequest,
  type PayrollOperationResult,
} from "./PayrollEngine";

export {
  PayrollAutomationEngine,
  type PayrollInputs,
  type PayrollCalculation,
  type PayrollValidationResult,
  type AutoProcessPayrollResult,
} from "./PayrollAutomationEngine";

export {
  ShiftService,
  type AssignShiftRequest,
  type ShiftChangeRequest,
  type ShiftOperationResult,
} from "./ShiftService";

export {
  ActionOwnershipHelper,
  type ActionOwner,
  type ActionPermission,
  type ActionOwnership,
  EMPLOYEE_ACTIONS,
  ATTENDANCE_ACTIONS,
  SHIFT_ACTIONS,
  PAYROLL_ACTIONS,
  INCENTIVE_ACTIONS,
} from "./ActionOwnershipModel";

export {
  exitWorkflowService,
  type ExitWorkflow,
  type ExitStage,
  type InitiateExitRequest,
  type ExitWorkflowResult,
} from "./ExitWorkflowService";

export {
  dataExportService,
  type ExportFormat,
  type ExportFilters,
  type ExportOptions,
  type ExportResult,
} from "./DataExportService";

// ========== QUICK ACCESS ==========

/**
 * Quick access object for all HR execution services
 */
export const HRExecution = {
  employee: EmployeeService,
  attendance: AttendanceService,
  payroll: PayrollEngine,
  payrollAutomation: PayrollAutomationEngine,
  shift: ShiftService,
  ownership: ActionOwnershipHelper,
  exitWorkflow: exitWorkflowService,
  dataExport: dataExportService,
};
