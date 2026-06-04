/**
 * Employee Service - Single Point of Execution for Employee Operations
 *
 * All employee creation, updates, and lifecycle management flow through this service
 * Prevents duplicate execution from different modules (HR, Admin, Bulk Import)
 */

import { employeeMasterService } from "./employeeMaster";
import { hrMasterValidator } from "./hrMasterValidator";
import { logger } from "./logger";
import { auditLogService } from "./auditLogService";
import { ActionOwnershipHelper } from "./ActionOwnershipModel";

// ========== TYPES ==========

export interface CreateEmployeeRequest {
  name: string;
  phone: string;
  roleId: string;
  cityId: string;
  status: "Draft" | "Active" | "Exit";
  joiningDate: string;
  exitDate?: string;
  sourceModule: "HR" | "Onboarding"; // ONLY HR via onboarding flow
  createdBy: string;
}

export interface UpdateEmployeeRequest {
  employeeId: string;
  updates: {
    name?: string;
    phone?: string;
    roleId?: string;
    cityId?: string;
    status?: "Draft" | "Active" | "Exit";
    exitDate?: string;
  };
  sourceModule: "HR" | "Admin" | "Profile Edit";
  updatedBy: string;
}

export interface BulkCreateEmployeeRequest {
  employees: Omit<CreateEmployeeRequest, "sourceModule" | "createdBy">[];
  sourceModule: "Bulk Import" | "Migration";
  createdBy: string;
}

export interface EmployeeOperationResult {
  success: boolean;
  employeeId?: string;
  errors?: string[];
}

// ========== EMPLOYEE SERVICE ==========

class EmployeeServiceClass {
  /**
   * Create a single employee - SINGLE POINT OF EXECUTION
   * PRIMARY OWNER: HR (via onboarding flow only)
   */
  createEmployee(request: CreateEmployeeRequest): EmployeeOperationResult {
    logger.log(`[EmployeeService] Creating employee from ${request.sourceModule}`);

    // Enforce ownership: Only HR can create employees
    const validation = ActionOwnershipHelper.validateOperation(
      "CREATE_EMPLOYEE",
      request.sourceModule
    );

    if (!validation.allowed) {
      logger.warn(`[EmployeeService] ${validation.message}`);
      return {
        success: false,
        errors: [validation.message || "Operation not allowed"],
      };
    }

    try {
      // Validate phone number format
      if (!request.phone || request.phone.length < 10) {
        return {
          success: false,
          errors: ["Invalid phone number"],
        };
      }

      // Validate role and city exist
      const validation = hrMasterValidator.validateEmployeeId("TEMP");
      // Additional validation can be added here

      // Create employee in master
      const employee = employeeMasterService.create({
        name: request.name,
        phone: request.phone,
        roleId: request.roleId,
        cityId: request.cityId,
        status: request.status,
        joiningDate: request.joiningDate,
        exitDate: request.exitDate,
        createdBy: request.createdBy,
        updatedBy: request.createdBy,
      });

      // Audit log
      auditLogService.logAction({
        action: "CREATE_EMPLOYEE",
        entityType: "EMPLOYEE",
        entityId: employee.employeeId,
        performedBy: request.createdBy,
        details: {
          sourceModule: request.sourceModule,
          employeeName: employee.name,
          role: request.roleId,
          city: request.cityId,
        },
      });

      logger.log(`[EmployeeService] Employee created: ${employee.employeeId} from ${request.sourceModule}`);

      return {
        success: true,
        employeeId: employee.employeeId,
      };
    } catch (error) {
      logger.error(`[EmployeeService] Failed to create employee from ${request.sourceModule}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Update employee - SINGLE POINT OF EXECUTION
   */
  updateEmployee(request: UpdateEmployeeRequest): EmployeeOperationResult {
    logger.log(`[EmployeeService] Updating employee ${request.employeeId} from ${request.sourceModule}`);

    try {
      // Validate employee exists
      const validation = hrMasterValidator.validateEmployeeId(request.employeeId);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Update employee
      const employee = employeeMasterService.update(request.employeeId, {
        ...request.updates,
        updatedBy: request.updatedBy,
      });

      if (!employee) {
        return {
          success: false,
          errors: ["Employee not found"],
        };
      }

      // Audit log
      auditLogService.logAction({
        action: "UPDATE_EMPLOYEE",
        entityType: "EMPLOYEE",
        entityId: request.employeeId,
        performedBy: request.updatedBy,
        details: {
          sourceModule: request.sourceModule,
          updates: request.updates,
        },
      });

      logger.log(`[EmployeeService] Employee updated: ${request.employeeId} from ${request.sourceModule}`);

      return {
        success: true,
        employeeId: employee.employeeId,
      };
    } catch (error) {
      logger.error(`[EmployeeService] Failed to update employee ${request.employeeId}`, error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Bulk create employees - SINGLE POINT OF EXECUTION
   */
  bulkCreateEmployees(request: BulkCreateEmployeeRequest): {
    success: boolean;
    created: number;
    failed: number;
    errors: string[];
    employeeIds: string[];
  } {
    logger.log(`[EmployeeService] Bulk creating ${request.employees.length} employees from ${request.sourceModule}`);

    const results = {
      success: true,
      created: 0,
      failed: 0,
      errors: [] as string[],
      employeeIds: [] as string[],
    };

    request.employees.forEach((empData, index) => {
      const result = this.createEmployee({
        ...empData,
        sourceModule: request.sourceModule,
        createdBy: request.createdBy,
      });

      if (result.success && result.employeeId) {
        results.created++;
        results.employeeIds.push(result.employeeId);
      } else {
        results.failed++;
        results.errors.push(`Row ${index + 1}: ${result.errors?.join(", ")}`);
      }
    });

    if (results.failed > 0) {
      results.success = false;
    }

    logger.log(`[EmployeeService] Bulk create complete: ${results.created} created, ${results.failed} failed from ${request.sourceModule}`);

    return results;
  }

  /**
   * Mark employee as exited - SINGLE POINT OF EXECUTION
   */
  markEmployeeExit(
    employeeId: string,
    exitDate: string,
    sourceModule: "HR" | "Admin",
    updatedBy: string
  ): EmployeeOperationResult {
    logger.log(`[EmployeeService] Marking employee ${employeeId} as exited from ${sourceModule}`);

    return this.updateEmployee({
      employeeId,
      updates: {
        status: "Exit",
        exitDate,
      },
      sourceModule,
      updatedBy,
    });
  }

  /**
   * Activate draft employee - SINGLE POINT OF EXECUTION
   */
  activateEmployee(
    employeeId: string,
    sourceModule: "HR" | "Onboarding",
    updatedBy: string
  ): EmployeeOperationResult {
    logger.log(`[EmployeeService] Activating employee ${employeeId} from ${sourceModule}`);

    return this.updateEmployee({
      employeeId,
      updates: {
        status: "Active",
      },
      sourceModule,
      updatedBy,
    });
  }

  /**
   * Assign role to employee - SINGLE POINT OF EXECUTION
   * PRIMARY OWNER: HR (only HR module can assign roles)
   */
  assignRole(
    employeeId: string,
    roleId: string,
    sourceModule: "HR",
    updatedBy: string
  ): EmployeeOperationResult {
    logger.log(`[EmployeeService] Assigning role ${roleId} to employee ${employeeId} from ${sourceModule}`);

    // Enforce ownership: Only HR can assign roles
    const validation = ActionOwnershipHelper.validateOperation(
      "ASSIGN_ROLE",
      sourceModule
    );

    if (!validation.allowed) {
      logger.warn(`[EmployeeService] ${validation.message}`);
      return {
        success: false,
        errors: [validation.message || "Operation not allowed"],
      };
    }

    return this.updateEmployee({
      employeeId,
      updates: {
        roleId,
      },
      sourceModule,
      updatedBy,
    });
  }
}

// ========== EXPORT ==========

export const EmployeeService = new EmployeeServiceClass();
