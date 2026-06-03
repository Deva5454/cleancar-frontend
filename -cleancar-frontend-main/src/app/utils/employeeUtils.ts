/**
 * Employee Utilities
 * Shared utilities for employee-related operations
 */

import type { Role } from "../lib/roleConfig";

/**
 * Generate consistent employee ID from name and role
 * In production, this would come from database/authentication system
 */
export function generateEmployeeId(name: string, role: Role): string {
  // Role-based prefixes for employee IDs
  const rolePrefixes: Record<Role, string> = {
    "Super Admin": "SA",
    "Admin": "AD",
    "City Manager": "CM",
    "Sr Operations Manager": "SOM",
    "Operations Manager": "OM",
    "Supervisor": "SUP",
    "Car Washer": "CW",
    "TSM": "TSM",
    "TSE": "TSE",
    "CCE": "CCE",
    "Store Manager": "SM",
    "Procurement Manager": "PM",
    "Accounts": "ACC",
    "HR": "HR",
  };

  const prefix = rolePrefixes[role] || "EMP";

  // Generate consistent hash from name for ID uniqueness
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000;

  return `${prefix}-${String(hash).padStart(3, "0")}`;
}

/**
 * Determine employee status based on role
 * Lower level roles might be on probation, senior roles are confirmed
 */
export function getEmployeeStatusFromRole(role: Role): "Probation" | "Confirmed" {
  const probationRoles: Role[] = ["Car Washer", "TSE", "CCE"];
  return probationRoles.includes(role) ? "Probation" : "Confirmed";
}

/**
 * Generate employee code (shorter version for display)
 */
export function generateEmployeeCode(name: string, role: Role): string {
  // Get initials from name
  const parts = name.split(" ");
  const initials = parts.map(p => p.charAt(0).toUpperCase()).join("");

  // Get numeric part from employee ID
  const employeeId = generateEmployeeId(name, role);
  const numericPart = employeeId.split("-")[1];

  return `${initials}${numericPart}`;
}
