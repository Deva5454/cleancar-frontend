/**
 * incentiveVisibilityService.ts
 *
 * Super Admin controls:
 *  1. Which ROLES have an incentive tab in their app (the "incentive-eligible" list)
 *  2. Per-role: visible or hidden for ALL employees in that role
 *  3. Per-employee: override that beats the role default
 *
 * Storage key: cc360_incentive_visibility
 */

export interface IncentiveVisibilityConfig {
  /** Roles that have an incentive tab at all (admin can add/remove) */
  incentiveRoles: string[];
  /** Per-role default: true = visible, false = hidden */
  roles: Record<string, boolean>;
  /** Per-employee override (beats role default) */
  employees: Record<string, boolean>;
  updatedAt: string;
  updatedBy: string;
}

const STORAGE_KEY = "cc360_incentive_visibility";

/** All roles defined in the system (must match roleConfig.ts Role type) */
export const ALL_SYSTEM_ROLES: string[] = [
  "Super Admin",
  "Admin",
  "City Manager",
  "Cluster Manager",
  "Sr Operations Manager",
  "Operations Manager",
  "Manager",
  "Supervisor",
  "Car Washer",
  "TSM",
  "TSE",
  "CCE",
  "Store Manager",
  "Procurement Manager",
  "Accounts",
  "HR",
  "Sales Head",
  "Sales Manager",
  "Marketing Agency",
];

/** Roles that have incentive tabs by default (first-run default) */
const DEFAULT_INCENTIVE_ROLES: string[] = [
  "Sales Manager",
  "Sales Head",
  "TSM",
  "TSE",
  "Supervisor",
  "Car Washer",
  "CCE",
];

function buildDefaultConfig(): IncentiveVisibilityConfig {
  return {
    incentiveRoles: [...DEFAULT_INCENTIVE_ROLES],
    roles: Object.fromEntries(DEFAULT_INCENTIVE_ROLES.map(r => [r, true])),
    employees: {},
    updatedAt: new Date().toISOString(),
    updatedBy: "System",
  };
}

class IncentiveVisibilityService {
  private read(): IncentiveVisibilityConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return buildDefaultConfig();
      const parsed = JSON.parse(raw);

      // Migrate legacy configs that don't have incentiveRoles
      const incentiveRoles: string[] = parsed.incentiveRoles ?? DEFAULT_INCENTIVE_ROLES;

      // Ensure every incentive role has a default
      const roles: Record<string, boolean> = {};
      for (const r of incentiveRoles) {
        roles[r] = parsed.roles?.[r] ?? true;
      }

      return {
        incentiveRoles,
        roles,
        employees: parsed.employees || {},
        updatedAt: parsed.updatedAt || new Date().toISOString(),
        updatedBy: parsed.updatedBy || "System",
      };
    } catch {
      return buildDefaultConfig();
    }
  }

  private write(config: IncentiveVisibilityConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  getConfig(): IncentiveVisibilityConfig {
    return this.read();
  }

  /** Roles currently in the incentive-eligible list */
  getAllRoles(): string[] {
    return this.read().incentiveRoles;
  }

  /** All roles in the system (for the "add role" dropdown) */
  getAllSystemRoles(): string[] {
    return ALL_SYSTEM_ROLES;
  }

  /** Is the incentive screen visible for this role + optional employee? */
  isVisible(role: string, employeeId?: string): boolean {
    const config = this.read();
    if (!config.incentiveRoles.includes(role)) return false;
    if (employeeId && employeeId in config.employees) {
      return config.employees[employeeId];
    }
    return config.roles[role] ?? true;
  }

  /** Add a role to the incentive-eligible list */
  addRole(role: string, updatedBy: string): void {
    const config = this.read();
    if (!config.incentiveRoles.includes(role)) {
      config.incentiveRoles.push(role);
      config.roles[role] = true; // default visible when added
    }
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Remove a role from the incentive-eligible list entirely */
  removeRole(role: string, updatedBy: string): void {
    const config = this.read();
    config.incentiveRoles = config.incentiveRoles.filter(r => r !== role);
    delete config.roles[role];
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Set visibility (show/hide) for all employees in a role */
  setRoleVisibility(role: string, visible: boolean, updatedBy: string): void {
    const config = this.read();
    config.roles[role] = visible;
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Set visibility override for a specific employee */
  setEmployeeVisibility(employeeId: string, visible: boolean, updatedBy: string): void {
    const config = this.read();
    config.employees[employeeId] = visible;
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Remove employee override (falls back to role default) */
  clearEmployeeOverride(employeeId: string, updatedBy: string): void {
    const config = this.read();
    delete config.employees[employeeId];
    config.updatedAt = new Date().toISOString();
    config.updatedBy = updatedBy;
    this.write(config);
  }

  /** Reset everything to factory defaults */
  reset(updatedBy: string): void {
    this.write({
      ...buildDefaultConfig(),
      updatedAt: new Date().toISOString(),
      updatedBy,
    });
  }
}

export const incentiveVisibilityService = new IncentiveVisibilityService();
