/**
 * Employee Database Service
 * Reads from Supabase when configured, falls back to localStorage
 */

// Supabase removed — localStorage only
import { HISTORIC_EMPLOYEE_DB } from "../utils/demoEmployees";

export type SkillLevel = "Skilled" | "Semi-Skilled" | "Unskilled";
export type EmploymentStage = "Temporary" | "Permanent" | "Not Converted";
export type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Exited";
export type EmployeeType = "Full Time" | "Contract" | "Part Time";

export interface EmployeeDatabaseRecord {
  id: string;
  tempId: string;
  tempIdAssignedDate: string;
  permanentIdAssignedDate?: string;
  conversionDueDate: string;
  daysInTempStatus: number;
  isOverdue: boolean;
  employmentStage: EmploymentStage;
  nonConversionReason?: string;
  skillLevel: SkillLevel;
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  permanentAddress: string;
  currentAddress: string;
  emergencyContact: string;
  designation: string;
  department: string;
  reportingManager: string;
  workLocation: string;
  pinCodes: string[];
  employeeType: EmployeeType;
  dateOfJoining: string;
  probationPeriod: string;
  status: EmployeeStatus;
  confirmationDate?: string;
  journeyStage?: number;
  journeyStageName?: string;
  loginMobile?: string;
  passwordHash?: string;
  tempPin?: string;
  onboardingPasswordSet: boolean;
  accountStatus: "pending_onboarding" | "pending_password" | "active" | "locked" | "suspended";
  failedLoginAttempts: number;
  lockedUntil?: string;
  lastLogin?: string;
  passwordChangedAt?: string;
  passwordResetRequestedAt?: string;
  passwordResetOTP?: string;
  passwordResetOTPExpiry?: string;
}

const STORAGE_KEY = "EMPLOYEE_DATABASE_RECORDS";
const SUPABASE_TABLE = "cleancar_employee_db";

// In-memory cache to avoid repeated Supabase fetches
let supabaseCache: EmployeeDatabaseRecord[] | null = null;
let cacheLoaded = false;

class EmployeeDatabaseService {
  private subscribers: Set<(employees: EmployeeDatabaseRecord[]) => void> = new Set();

  /**
   * Load all employees from Supabase into localStorage cache (called once on app start)
   */
  async loadFromSupabase(): Promise<void> {
    // No-op: Supabase removed. Data comes from localStorage seed.
    return Promise.resolve();
  }

  
  getAll(): EmployeeDatabaseRecord[] {
    const defaults = { onboardingPasswordSet: false, accountStatus: "pending_onboarding" as const, failedLoginAttempts: 0 };
    // Prefer in-memory Supabase cache
    if (supabaseCache && supabaseCache.length > 0) {
      return supabaseCache.map((emp: any) => ({ ...defaults, ...emp }));
    }
    // Try localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      if (parsed.length > 0) {
        return parsed.map((emp: any) => ({ ...defaults, ...emp }));
      }
    } catch (error) {
      console.error("Error loading employees from storage:", error);
    }
    // Fallback: use seeded demo data (includes Super Admin, all roles)
    // This ensures login always works even with empty localStorage
    return HISTORIC_EMPLOYEE_DB.map((emp: any) => ({ ...defaults, ...emp }));
  }

  getById(id: string): EmployeeDatabaseRecord | undefined {
    return this.getAll().find(emp => emp.id === id || emp.tempId === id);
  }

  add(employee: EmployeeDatabaseRecord): void {
    const employees = this.getAll();
    employees.unshift(employee);
    this.save(employees);
  }

  update(id: string, updates: Partial<EmployeeDatabaseRecord>): void {
    const employees = this.getAll();
    const index = employees.findIndex(emp => emp.id === id || emp.tempId === id);
    if (index !== -1) {
      employees[index] = { ...employees[index], ...updates };
      this.save(employees);
    }
  }

  delete(id: string): void {
    const employees = this.getAll();
    const filtered = employees.filter(emp => emp.id !== id && emp.tempId !== id);
    this.save(filtered);
  }

  private save(employees: EmployeeDatabaseRecord[]): void {
    try {
      // Slim records before writing — saves ~70% space vs full employee objects
      const slim = employees.map((e: any) => ({
        id: e.id, tempId: e.tempId, fullName: e.fullName,
        mobile: e.mobile, loginMobile: e.loginMobile, email: e.email,
        designation: e.designation, department: e.department,
        status: e.status, accountStatus: e.accountStatus,
        passwordHash: e.passwordHash, tempPin: e.tempPin,
        failedLoginAttempts: e.failedLoginAttempts || 0,
        lockedUntil: e.lockedUntil, dateOfJoining: e.dateOfJoining,
        cityId: e.cityId, role: e.role, employeeId: e.employeeId,
        firstName: e.firstName, lastName: e.lastName,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
      this.notifySubscribers(employees);
    } catch (error) {
      console.error("Error saving employees to storage:", error);
    }
  }

  subscribe(callback: (employees: EmployeeDatabaseRecord[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(employees: EmployeeDatabaseRecord[]): void {
    this.subscribers.forEach(callback => callback(employees));
  }

  clear(): void {
    this.save([]);
  }
}

export const employeeDatabaseService = new EmployeeDatabaseService();
