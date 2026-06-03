/**
 * OrgContext - Organizational Structure
 * PHASE 4: Domain-specific context for organizational data
 *
 * Owns:
 * - Roles
 * - Departments
 * - Designations
 * - Public holidays
 *
 * Single source of truth for organizational structure
 */

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { DataService } from "../services/DataService";

// ========== TYPES ==========

export type EmployeeRole =
  | "Car Washer Full Time"
  | "Car Washer Part Time"
  | "Supervisor"
  | "Manager"
  | "HR"
  | "Admin"
  | "City Manager"
  | "Sr Operations Manager"
  | "Operations Manager"
  | "Cluster Manager"
  | "TSM"
  | "TSE"
  | "CCE"
  | "Store Manager"
  | "Procurement Manager"
  | "Accounts"
  | "Super Admin";

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Designation {
  id: string;
  title: string;
  level: number;
  department: string;
}

export interface PublicHoliday {
  date: string;
  name: string;
  type: "National" | "Regional";
}

// ========== CONTEXT TYPE ==========

interface OrgContextType {
  // Roles
  roles: EmployeeRole[];

  // Departments
  departments: Department[];
  addDepartment: (department: Omit<Department, "id">) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Designations
  designations: Designation[];
  addDesignation: (designation: Omit<Designation, "id">) => void;
  updateDesignation: (id: string, updates: Partial<Designation>) => void;
  deleteDesignation: (id: string) => void;

  // Public Holidays
  publicHolidays: PublicHoliday[];
  addPublicHoliday: (holiday: PublicHoliday) => void;
  removePublicHoliday: (date: string) => void;
}

const OrgContext = createContext<OrgContextType | undefined>(undefined);

// ========== DEFAULT DATA ==========

const DEFAULT_ROLES: EmployeeRole[] = [
  "Super Admin",
  "Admin",
  "City Manager",
  "Sr Operations Manager",
  "Operations Manager",
  "Cluster Manager",
  "Manager",
  "Supervisor",
  "Car Washer Full Time",
  "Car Washer Part Time",
  "TSM",
  "TSE",
  "CCE",
  "Store Manager",
  "Procurement Manager",
  "Accounts",
  "HR",
];

const DEFAULT_DEPARTMENTS: Department[] = [
  { id: "DEP-001", name: "Operations", description: "Field operations and service delivery" },
  { id: "DEP-002", name: "Sales & Marketing", description: "Customer acquisition and retention" },
  { id: "DEP-003", name: "Technology", description: "Product and engineering" },
  { id: "DEP-004", name: "Human Resources", description: "Talent management and employee relations" },
  { id: "DEP-005", name: "Finance & Accounts", description: "Financial planning and accounting" },
  { id: "DEP-006", name: "Procurement & Inventory", description: "Supply chain and inventory management" },
];

const DEFAULT_DESIGNATIONS: Designation[] = [
  { id: "DES-001", title: "Car Washer", level: 1, department: "Operations" },
  { id: "DES-002", title: "Supervisor", level: 2, department: "Operations" },
  { id: "DES-003", title: "Manager", level: 3, department: "Operations" },
  { id: "DES-004", title: "Operations Manager", level: 4, department: "Operations" },
  { id: "DES-005", title: "City Manager", level: 5, department: "Operations" },
];

const DEFAULT_HOLIDAYS: PublicHoliday[] = [
  { date: "2026-01-26", name: "Republic Day", type: "National" },
  { date: "2026-08-15", name: "Independence Day", type: "National" },
  { date: "2026-10-02", name: "Gandhi Jayanti", type: "National" },
];

// ========== PROVIDER ==========

export function OrgProvider({ children }: { children: ReactNode }) {
  const [roles] = useState<EmployeeRole[]>(DEFAULT_ROLES);
  const [departments, setDepartments] = useState<Department[]>(() => {
    const stored = DataService.get<Department>("DEPARTMENTS");
    return stored.length > 0 ? stored : DEFAULT_DEPARTMENTS;
  });
  const [designations, setDesignations] = useState<Designation[]>(() => {
    const stored = DataService.get<Designation>("DESIGNATIONS");
    return stored.length > 0 ? stored : DEFAULT_DESIGNATIONS;
  });
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>(() => {
    const stored = DataService.get<PublicHoliday>("PUBLIC_HOLIDAYS");
    return stored.length > 0 ? stored : DEFAULT_HOLIDAYS;
  });

  // Persist to storage
  useEffect(() => {
    if (departments.length > 0) DataService.setAll("DEPARTMENTS", departments);
  }, [departments]);

  useEffect(() => {
    if (designations.length > 0) DataService.setAll("DESIGNATIONS", designations);
  }, [designations]);

  useEffect(() => {
    if (publicHolidays.length > 0) DataService.setAll("PUBLIC_HOLIDAYS", publicHolidays);
  }, [publicHolidays]);

  // ========== ACTIONS ==========

  const addDepartment = (department: Omit<Department, "id">) => {
    const newDept: Department = {
      ...department,
      id: `DEP-${Date.now()}`,
    };
    setDepartments((prev) => [...prev, newDept]);
  };

  const updateDepartment = (id: string, updates: Partial<Department>) => {
    setDepartments((prev) =>
      prev.map((dept) => (dept.id === id ? { ...dept, ...updates } : dept))
    );
  };

  const deleteDepartment = (id: string) => {
    setDepartments((prev) => prev.filter((dept) => dept.id !== id));
  };

  const addDesignation = (designation: Omit<Designation, "id">) => {
    const newDesig: Designation = {
      ...designation,
      id: `DES-${Date.now()}`,
    };
    setDesignations((prev) => [...prev, newDesig]);
  };

  const updateDesignation = (id: string, updates: Partial<Designation>) => {
    setDesignations((prev) =>
      prev.map((desig) => (desig.id === id ? { ...desig, ...updates } : desig))
    );
  };

  const deleteDesignation = (id: string) => {
    setDesignations((prev) => prev.filter((desig) => desig.id !== id));
  };

  const addPublicHoliday = (holiday: PublicHoliday) => {
    setPublicHolidays((prev) => [...prev, holiday]);
  };

  const removePublicHoliday = (date: string) => {
    setPublicHolidays((prev) => prev.filter((h) => h.date !== date));
  };

  // ========== CONTEXT VALUE ==========

  const value: OrgContextType = {
    roles,
    departments,
    addDepartment,
    updateDepartment,
    deleteDepartment,
    designations,
    addDesignation,
    updateDesignation,
    deleteDesignation,
    publicHolidays,
    addPublicHoliday,
    removePublicHoliday,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

// ========== HOOK ==========

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used within OrgProvider");
  }
  return context;
}
