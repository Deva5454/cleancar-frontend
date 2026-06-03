/**
 * HR Master Validator
 *
 * Centralized validation for all HR master data
 * Enforces employeeId requirements and referential integrity
 */

import { employeeMasterService } from "./employeeMaster";
import { logger } from "./logger";

// ========== VALIDATION RESULTS ==========

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ========== VALIDATOR SERVICE ==========

class HRMasterValidatorService {
  /**
   * Validate employeeId exists in EmployeeMaster
   */
  validateEmployeeId(employeeId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if employeeId is provided
    if (!employeeId || employeeId.trim() === "") {
      errors.push("employeeId is required");
      return { valid: false, errors, warnings };
    }

    // Check if employee exists
    const employee = employeeMasterService.getById(employeeId);
    if (!employee) {
      errors.push(`Employee with ID ${employeeId} not found in EmployeeMaster`);
      return { valid: false, errors, warnings };
    }

    // Check if employee is active
    if (employee.status === "Exit") {
      warnings.push(`Employee ${employeeId} has exited status`);
    }

    if (employee.status === "Draft") {
      warnings.push(`Employee ${employeeId} is in draft status`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate attendance record
   */
  validateAttendance(data: {
    employeeId: string;
    date: string;
    cityId: string;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate employeeId
    const employeeValidation = this.validateEmployeeId(data.employeeId);
    errors.push(...employeeValidation.errors);
    warnings.push(...employeeValidation.warnings);

    // Validate date format
    if (!this.isValidDate(data.date)) {
      errors.push("Invalid date format. Expected YYYY-MM-DD");
    }

    // Validate cityId
    if (!data.cityId || data.cityId.trim() === "") {
      errors.push("cityId is required");
    }

    // Check if employee belongs to the specified city
    const employee = employeeMasterService.getById(data.employeeId);
    if (employee && employee.cityId !== data.cityId) {
      warnings.push(`Employee ${data.employeeId} is assigned to city ${employee.cityId}, but attendance is being marked for ${data.cityId}`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate payroll record
   */
  validatePayroll(data: {
    employeeId: string;
    month: string;
    year: number;
    netPay: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate employeeId
    const employeeValidation = this.validateEmployeeId(data.employeeId);
    errors.push(...employeeValidation.errors);
    warnings.push(...employeeValidation.warnings);

    // Validate month
    const validMonths = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    if (!validMonths.includes(data.month)) {
      errors.push(`Invalid month. Expected one of: ${validMonths.join(", ")}`);
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (data.year < 2000 || data.year > currentYear + 1) {
      errors.push(`Invalid year. Expected between 2000 and ${currentYear + 1}`);
    }

    // Validate netPay
    if (data.netPay < 0) {
      errors.push("Net pay cannot be negative");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate incentive record
   */
  validateIncentive(data: {
    employeeId: string;
    month: string;
    year: number;
    amount: number;
  }): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate employeeId
    const employeeValidation = this.validateEmployeeId(data.employeeId);
    errors.push(...employeeValidation.errors);
    warnings.push(...employeeValidation.warnings);

    // Validate month
    const validMonths = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    if (!validMonths.includes(data.month)) {
      errors.push(`Invalid month. Expected one of: ${validMonths.join(", ")}`);
    }

    // Validate year
    const currentYear = new Date().getFullYear();
    if (data.year < 2000 || data.year > currentYear + 1) {
      errors.push(`Invalid year. Expected between 2000 and ${currentYear + 1}`);
    }

    // Validate amount
    if (data.amount <= 0) {
      errors.push("Incentive amount must be greater than zero");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Batch validate employeeIds
   */
  validateEmployeeIds(employeeIds: string[]): {
    valid: string[];
    invalid: { employeeId: string; reason: string }[];
  } {
    const valid: string[] = [];
    const invalid: { employeeId: string; reason: string }[] = [];

    employeeIds.forEach(employeeId => {
      const result = this.validateEmployeeId(employeeId);
      if (result.valid) {
        valid.push(employeeId);
      } else {
        invalid.push({
          employeeId,
          reason: result.errors.join(", "),
        });
      }
    });

    return { valid, invalid };
  }

  /**
   * Helper: Check if date is valid YYYY-MM-DD format
   */
  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const timestamp = date.getTime();

    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
      return false;
    }

    return dateString === date.toISOString().split('T')[0];
  }

  /**
   * Log validation failure
   */
  logValidationFailure(context: string, result: ValidationResult): void {
    if (!result.valid) {
      logger.error(`Validation failed: ${context}`, {
        errors: result.errors,
        warnings: result.warnings,
      });
    }
  }
}

// ========== EXPORT ==========

export const hrMasterValidator = new HRMasterValidatorService();
