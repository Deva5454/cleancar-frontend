/**
 * RoleContext - Global role/user state
 *
 * FIX: Reads cc360_session from localStorage set by authService on login.
 * Previously always defaulted to "Super Admin" regardless of who logged in.
 * This caused ProtectedRoute to fail for all non-Super Admin roles because:
 *   1. currentRole was always "Super Admin"
 *   2. currentUser.employeeId was a fake stub ID not matching any employee record
 *   3. ProtectedRoute looked up employees.find(e => e.employeeId === currentUser.employeeId) → null
 *   4. hasPermission(null, module, "view") → false → Access Denied shown
 *
 * FIXED:
 *   - Read role and employeeId from cc360_session on mount
 *   - currentUser uses real session data
 *   - ProtectedRoute finds real employee → permission check passes
 */

import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import { Role, getRoleConfig, RoleConfig } from "../lib/roleConfig";
import { logger } from "../services/logger";
import type { EmployeeRole } from "./OrgContext";

interface SessionData {
  employeeId?: string;
  employeeName?: string;
  role?: string;
  cityId?: string;
  loginTime?: string;
}

interface RoleContextType {
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  roleConfig: RoleConfig | undefined;
  currentUser: {
    employeeId?: string;
    name: string;
    email: string;
    city: string;
    role: Role;
    phone?: string;
    cityId?: string;
    clusterId?: string;
    assignedPincodes?: string[];
  };
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Map Role → EmployeeRole (for legacy compatibility)
const roleToEmployeeRole: Record<Role, EmployeeRole> = {
  "Super Admin": "Super Admin",
  "Admin": "Admin",
  "City Manager": "City Manager",
  "Sr Operations Manager": "Sr Operations Manager",
  "Operations Manager": "Operations Manager",
  "Cluster Manager": "Cluster Manager",
  "Manager": "Manager",
  "Supervisor": "Supervisor",
  "Car Washer": "Car Washer Full Time",
  "TSM": "TSM",
  "TSE": "TSE",
  "CCE": "CCE",
  "Store Manager": "Store Manager",
  "Procurement Manager": "Procurement Manager",
  "Accounts": "Accounts",
  "HR": "HR",
  "Sales Head": "Sales Head",
  "Sales Manager": "Sales Manager",
};

// City name from cityId
const cityNameFromId = (cityId?: string): string => {
  if (!cityId) return "Surat";
  if (cityId.includes("MUMBAI")) return "Mumbai";
  if (cityId.includes("AHMEDABAD")) return "Ahmedabad";
  return "Surat";
};

// Read session from localStorage (written by authService.login)
function readSession(): SessionData {
  try {
    const raw = localStorage.getItem("cc360_session");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {};
}

// Validate that a string is a known Role
const VALID_ROLES: Role[] = [
  "Super Admin", "Admin", "City Manager", "Cluster Manager",
  "Sr Operations Manager", "Operations Manager", "Manager",
  "Supervisor", "Car Washer", "TSM", "TSE", "CCE",
  "Store Manager", "Procurement Manager", "Accounts", "HR",
  "Sales Head", "Sales Manager",
];
function isValidRole(r: string): r is Role {
  return VALID_ROLES.includes(r as Role);
}

// Default stub IDs per role — used ONLY when no session exists (demo/dev)
const DEFAULT_EMPLOYEE_IDS: Record<Role, string> = {
  "Super Admin":          "EMP-001",
  "Admin":                "EMP-002",
  "City Manager":         "EMP-003",
  "Cluster Manager":      "EMP-004",
  "Sr Operations Manager":"EMP-005",
  "Operations Manager":   "EMP-006",
  "Manager":              "EMP-007",
  "Supervisor":           "EMP-008",
  "Car Washer":           "EMP-009",
  "TSM":                  "EMP-010",
  "TSE":                  "EMP-011",
  "CCE":                  "EMP-012",
  "Store Manager":        "EMP-013",
  "Procurement Manager":  "EMP-014",
  "Accounts":             "EMP-015",
  "HR":                   "EMP-016",
  "Sales Head":           "EMP-SH-001",
  "Sales Manager":        "EMP-SM-001",
};

const DEFAULT_NAMES: Record<Role, string> = {
  "Super Admin":          "Super Admin",
  "Admin":                "Admin",
  "City Manager":         "City Manager",
  "Cluster Manager":      "Cluster Manager",
  "Sr Operations Manager":"Sr Operations Manager",
  "Operations Manager":   "Operations Manager",
  "Manager":              "Manager",
  "Supervisor":           "Supervisor",
  "Car Washer":           "Car Washer",
  "TSM":                  "Telesales Manager",
  "TSE":                  "Telesales Executive",
  "CCE":                  "Customer Care Executive",
  "Store Manager":        "Store Manager",
  "Procurement Manager":  "Procurement Manager",
  "Accounts":             "Accounts",
  "HR":                   "HR",
  "Sales Head":           "Sales Head",
  "Sales Manager":        "Sales Manager",
};

export function RoleProvider({ children }: { children: ReactNode }) {
  // ── Read initial role from session ──────────────────────────────
  const initialSession = readSession();
  const initialRole: Role =
    initialSession.role && isValidRole(initialSession.role)
      ? initialSession.role
      : "Super Admin";

  const [currentRole, setCurrentRoleState] = useState<Role>(initialRole);
  const roleConfig = getRoleConfig(currentRole);

  // ── Keep role in sync if session changes (e.g. after login) ─────
  useEffect(() => {
    const session = readSession();
    if (session.role && isValidRole(session.role) && session.role !== currentRole) {
      setCurrentRoleState(session.role);
    }
  }, []);

  // ── Wrapper: update state + optionally persist ───────────────────
  // useCallback makes setCurrentRole a stable reference so:
  //   1. roleValue useMemo only re-runs when setCurrentRole actually changes (never)
  //   2. setSafeRole in RootLayout gets a stable dep and doesn't recreate on every render
  //   3. the hook's useEffect([currentRole]) fires reliably after state update
  const setCurrentRole = useCallback((role: Role) => {
    setCurrentRoleState(role);
    // Always persist role to session — even in demo mode where no session exists yet.
    // Previously only wrote back if cc360_session existed, so demo role switches
    // were lost on refresh (re-initialised to "Super Admin" default every time).
    try {
      const raw = localStorage.getItem("cc360_session");
      const session = raw ? JSON.parse(raw) : {};
      localStorage.setItem("cc360_session", JSON.stringify({ ...session, role }));
    } catch (e) {
      // ignore
    }
  }, []); // stable — setCurrentRoleState from useState is always stable

  // ── Build currentUser from session + role ───────────────────────
  const currentUser = useMemo(() => {
    const session = readSession();

    // If session has real data (from authService.login) — use it
    if (session.employeeId && session.employeeName) {
      return {
        employeeId: session.employeeId,
        name:       session.employeeName,
        email:      "",
        city:       cityNameFromId(session.cityId),
        cityId:     session.cityId || "CITY-SURAT",
        role:       currentRole,
      };
    }

    // Fallback: demo/dev stub based on role
    // Use seeded employee IDs that actually exist in EMPLOYEE_DATABASE_RECORDS
    // so ProtectedRoute's employees.find() succeeds
    const employeeRecords = (() => {
      try {
        const raw = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();

    // Find first active employee matching this role
    const matchingEmployee = employeeRecords.find(
      (e: any) =>
        (e.designation === currentRole || e.role === currentRole) &&
        e.accountStatus === "active"
    );

    if (matchingEmployee) {
      return {
        employeeId: matchingEmployee.id || matchingEmployee.employeeId,
        name:       matchingEmployee.fullName || DEFAULT_NAMES[currentRole],
        email:      matchingEmployee.email || "",
        city:       cityNameFromId(matchingEmployee.workLocation),
        cityId:     matchingEmployee.workLocation || "CITY-SURAT",
        role:       currentRole,
      };
    }

    // Last resort: use default stub IDs
    return {
      employeeId: DEFAULT_EMPLOYEE_IDS[currentRole],
      name:       DEFAULT_NAMES[currentRole],
      email:      "",
      city:       "Surat",
      cityId:     "CITY-SURAT",
      role:       currentRole,
    };
  }, [currentRole]);

  const roleValue = useMemo(() => ({
    currentRole, setCurrentRole, roleConfig, currentUser,
  }), [currentRole, roleConfig, currentUser, setCurrentRole]);

  return (
    <RoleContext.Provider value={roleValue}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);

  if (context === undefined) {
    // Safe fallback — never throw
    return {
      currentRole: "Super Admin" as Role,
      setCurrentRole: () => {},
      roleConfig: getRoleConfig("Super Admin"),
      currentUser: {
        name:   "Demo User",
        email:  "",
        city:   "Surat",
        cityId: "CITY-SURAT",
        role:   "Super Admin" as Role,
      },
    };
  }

  return context;
}
