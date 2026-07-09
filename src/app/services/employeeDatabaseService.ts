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
  reportingManager: string; // Display label only (e.g. "Ramesh Vora (Supervisor)" in seed data,
                             // or plain "Ramesh Vora" from the live Add Employee form) — NOT a
                             // reliable foreign key. Use reportingManagerId for actual lookups.
  reportingManagerId?: string; // Resolved employee id/tempId of the reporting manager, when known.
  cityId?: string;
  role?: string; // Free-text role/designation code used by some legacy consumers
  employeeId?: string; // Legacy alias, historically duplicated `id` in some records
  workLocation: string;
  pinCodes: string[];
  bankAccountNumber?: string;
  bankIFSC?: string;
  bankName?: string;
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
    let records: EmployeeDatabaseRecord[];

    // Prefer in-memory Supabase cache
    if (supabaseCache && supabaseCache.length > 0) {
      records = supabaseCache.map((emp: any) => ({ ...defaults, ...emp }));
    } else {
      // Try localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (parsed.length > 0) {
          records = parsed.map((emp: any) => ({ ...defaults, ...emp }));
        } else {
          // Fallback: use seeded demo data (includes Super Admin, all roles)
          // This ensures login always works even with empty localStorage
          records = HISTORIC_EMPLOYEE_DB.map((emp: any) => ({ ...defaults, ...emp }));
        }
      } catch (error) {
        console.error("Error loading employees from storage:", error);
        records = HISTORIC_EMPLOYEE_DB.map((emp: any) => ({ ...defaults, ...emp }));
      }
    }

    return this.withResolvedManagerIds(records);
  }

  /**
   * reportingManager is only ever a display label — never a foreign key —
   * so it can't be trusted for lookups (seed data uses "Name (Designation)",
   * the live Add Employee form only stores plain "Name"). This resolves it
   * against the same batch of records by matching either format, so
   * consumers get a real reportingManagerId without needing a data
   * migration on existing records.
   */
  private withResolvedManagerIds(records: EmployeeDatabaseRecord[]): EmployeeDatabaseRecord[] {
    return records.map((emp) => {
      if (emp.reportingManagerId || !emp.reportingManager) return emp;
      const manager = records.find((m) => {
        if (m.id === emp.id) return false;
        if (!m.fullName) return false;
        return emp.reportingManager === m.fullName || emp.reportingManager.startsWith(`${m.fullName} (`);
      });
      return manager ? { ...emp, reportingManagerId: manager.id } : emp;
    });
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
      // Persist full records. Previously this only kept a hardcoded 20-field
      // "slim" whitelist and silently dropped the other fields — including
      // employmentStage (Temporary/Permanent), reportingManager, and the
      // bank detail fields — from every employee on every single save()
      // call, since the whole array is re-serialized through the same
      // filter each time. That meant one HR action (approving a task,
      // editing any field) could silently erase onboarding/reporting-line/
      // banking data for the entire company. Full-record persistence trades
      // a small amount of localStorage space for actually keeping the data.
      localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
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
