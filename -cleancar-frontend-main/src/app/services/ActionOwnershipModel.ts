/**
 * Action Ownership Model - Defines Primary Entry Points
 *
 * Each task has ONE primary owner who can directly execute it.
 * Other modules can only view or request changes.
 */

// ========== OWNERSHIP DEFINITIONS ==========

export type ActionOwner = "HR" | "Supervisor" | "Finance" | "System";
export type ActionPermission = "Primary" | "Request" | "View Only";

export interface ActionOwnership {
  action: string;
  primaryOwner: ActionOwner;
  allowedModules: {
    [module: string]: ActionPermission;
  };
  description: string;
}

// ========== EMPLOYEE ACTIONS ==========

export const EMPLOYEE_ACTIONS: ActionOwnership[] = [
  {
    action: "CREATE_EMPLOYEE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary", // Only HR can create via onboarding flow
      Admin: "View Only",
      Supervisor: "View Only",
    },
    description: "Employee creation - Only via HR onboarding flow",
  },
  {
    action: "UPDATE_EMPLOYEE_PROFILE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary",
      Admin: "View Only",
      Supervisor: "View Only",
    },
    description: "Update employee basic details",
  },
  {
    action: "ASSIGN_ROLE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary", // Only HR module assigns roles
      Admin: "View Only",
      Supervisor: "View Only",
    },
    description: "Role assignment - Only HR module",
  },
  {
    action: "EXIT_EMPLOYEE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary",
      Admin: "View Only",
      Supervisor: "View Only",
    },
    description: "Mark employee as exited",
  },
];

// ========== ATTENDANCE ACTIONS ==========

export const ATTENDANCE_ACTIONS: ActionOwnership[] = [
  {
    action: "MARK_ATTENDANCE",
    primaryOwner: "Supervisor",
    allowedModules: {
      Supervisor: "Primary", // Only supervisor marks attendance
      HR: "Request", // HR can only request corrections
      Admin: "View Only",
    },
    description: "Mark attendance - Only supervisor marks, HR requests corrections",
  },
  {
    action: "CORRECT_ATTENDANCE",
    primaryOwner: "Supervisor",
    allowedModules: {
      Supervisor: "Primary",
      HR: "Request", // HR must request, cannot directly correct
      Admin: "View Only",
    },
    description: "Correct attendance - Supervisor approves HR requests",
  },
  {
    action: "APPROVE_LEAVE",
    primaryOwner: "Supervisor",
    allowedModules: {
      Supervisor: "Primary",
      HR: "View Only",
      Admin: "View Only",
    },
    description: "Approve leave requests",
  },
];

// ========== SHIFT ACTIONS ==========

export const SHIFT_ACTIONS: ActionOwnership[] = [
  {
    action: "ASSIGN_SHIFT",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary", // Only HR assigns shifts
      Supervisor: "Request", // Supervisor can request shift changes
      Admin: "View Only",
    },
    description: "Shift assignment - Only HR assigns, Supervisor requests",
  },
  {
    action: "MODIFY_SHIFT",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary",
      Supervisor: "Request",
      Admin: "View Only",
    },
    description: "Modify shift schedule",
  },
];

// ========== PAYROLL ACTIONS ==========

export const PAYROLL_ACTIONS: ActionOwnership[] = [
  {
    action: "PROCESS_PAYROLL",
    primaryOwner: "System",
    allowedModules: {
      System: "Primary", // Auto-processing
      Finance: "Primary", // Finance can also process
      HR: "View Only",
      Admin: "View Only",
    },
    description: "Process monthly payroll - System auto-processes",
  },
  {
    action: "APPROVE_PAYROLL",
    primaryOwner: "Finance",
    allowedModules: {
      Finance: "Primary",
      HR: "View Only",
      Admin: "View Only",
    },
    description: "Approve payroll - Finance only",
  },
  {
    action: "MARK_PAYROLL_PAID",
    primaryOwner: "Finance",
    allowedModules: {
      Finance: "Primary",
      HR: "View Only",
      Admin: "View Only",
    },
    description: "Mark payroll as paid - Finance only",
  },
  {
    action: "CORRECT_PAYROLL",
    primaryOwner: "Finance",
    allowedModules: {
      Finance: "Primary",
      HR: "Request", // HR must request corrections
      Admin: "View Only",
    },
    description: "Correct payroll - Finance approves HR requests",
  },
];

// ========== INCENTIVE ACTIONS ==========

export const INCENTIVE_ACTIONS: ActionOwnership[] = [
  {
    action: "CALCULATE_INCENTIVE",
    primaryOwner: "System",
    allowedModules: {
      System: "Primary", // Only via IncentiveEngine
      HR: "View Only",
      Finance: "View Only",
      Admin: "View Only",
    },
    description: "Calculate incentive - Only via IncentiveEngine",
  },
  {
    action: "APPROVE_INCENTIVE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary",
      Finance: "View Only",
      Admin: "View Only",
    },
    description: "Approve incentive - HR only",
  },
  {
    action: "MANUAL_INCENTIVE",
    primaryOwner: "HR",
    allowedModules: {
      HR: "Primary",
      Finance: "View Only",
      Admin: "View Only",
    },
    description: "Create manual incentive - HR only",
  },
];

// ========== OWNERSHIP HELPER ==========

export class ActionOwnershipHelper {
  /**
   * Get permission for a specific action and module
   */
  static getPermission(action: string, module: string): ActionPermission | null {
    const allActions = [
      ...EMPLOYEE_ACTIONS,
      ...ATTENDANCE_ACTIONS,
      ...SHIFT_ACTIONS,
      ...PAYROLL_ACTIONS,
      ...INCENTIVE_ACTIONS,
    ];

    const actionDef = allActions.find((a) => a.action === action);
    if (!actionDef) return null;

    return actionDef.allowedModules[module] || null;
  }

  /**
   * Check if a module can perform an action
   */
  static canPerform(action: string, module: string): boolean {
    const permission = this.getPermission(action, module);
    return permission === "Primary";
  }

  /**
   * Check if a module can only request an action
   */
  static canRequest(action: string, module: string): boolean {
    const permission = this.getPermission(action, module);
    return permission === "Request";
  }

  /**
   * Check if a module has any access to an action
   */
  static hasAccess(action: string, module: string): boolean {
    const permission = this.getPermission(action, module);
    return permission !== null;
  }

  /**
   * Get primary owner of an action
   */
  static getPrimaryOwner(action: string): ActionOwner | null {
    const allActions = [
      ...EMPLOYEE_ACTIONS,
      ...ATTENDANCE_ACTIONS,
      ...SHIFT_ACTIONS,
      ...PAYROLL_ACTIONS,
      ...INCENTIVE_ACTIONS,
    ];

    const actionDef = allActions.find((a) => a.action === action);
    return actionDef?.primaryOwner || null;
  }

  /**
   * Get all actions for a module
   */
  static getModuleActions(module: string): {
    primary: string[];
    request: string[];
    viewOnly: string[];
  } {
    const allActions = [
      ...EMPLOYEE_ACTIONS,
      ...ATTENDANCE_ACTIONS,
      ...SHIFT_ACTIONS,
      ...PAYROLL_ACTIONS,
      ...INCENTIVE_ACTIONS,
    ];

    const result = {
      primary: [] as string[],
      request: [] as string[],
      viewOnly: [] as string[],
    };

    allActions.forEach((actionDef) => {
      const permission = actionDef.allowedModules[module];
      if (permission === "Primary") {
        result.primary.push(actionDef.action);
      } else if (permission === "Request") {
        result.request.push(actionDef.action);
      } else if (permission === "View Only") {
        result.viewOnly.push(actionDef.action);
      }
    });

    return result;
  }

  /**
   * Validate if operation is allowed
   */
  static validateOperation(
    action: string,
    module: string
  ): {
    allowed: boolean;
    permission: ActionPermission | null;
    primaryOwner: ActionOwner | null;
    message?: string;
  } {
    const permission = this.getPermission(action, module);
    const primaryOwner = this.getPrimaryOwner(action);

    if (!permission) {
      return {
        allowed: false,
        permission: null,
        primaryOwner,
        message: `Module '${module}' has no access to action '${action}'`,
      };
    }

    if (permission === "View Only") {
      return {
        allowed: false,
        permission,
        primaryOwner,
        message: `Module '${module}' can only view '${action}', primary owner is '${primaryOwner}'`,
      };
    }

    if (permission === "Request") {
      return {
        allowed: false,
        permission,
        primaryOwner,
        message: `Module '${module}' must request '${action}', primary owner is '${primaryOwner}'`,
      };
    }

    return {
      allowed: true,
      permission,
      primaryOwner,
    };
  }
}
