/**
 * HR Data Initializer
 * Provides initial seed data for the HR system
 * Can be replaced with API calls in production
 *
 * ⚠️ CRITICAL - DATA SOURCE REQUIREMENTS:
 *
 * ALL HR data MUST use DataService with these exact keys:
 * - Departments → "DEPARTMENTS"
 * - Designations → "DESIGNATIONS"
 * - Public Holidays → "PUBLIC_HOLIDAYS"
 * - Salary Structures → "SALARY_STRUCTURES"
 *
 * ❌ DO NOT USE StorageService for HR data
 * ❌ DO NOT use custom localStorage keys
 * ❌ DO NOT change storage keys without updating OrgContext/PayrollContext
 *
 * WHY:
 * OrgContext and PayrollContext depend on DataService keys.
 * Using StorageService creates key mismatch (hrdata:departments ≠ cleancar_departments).
 * This causes silent data loading failures.
 *
 * 🔄 AUTOMATIC MIGRATION:
 * - Legacy data from "hrdata:*" keys is automatically migrated to DataService
 * - Migration runs on first load, only if DataService is empty
 * - Zero data loss guarantee for existing users
 * - Old data kept intact for rollback safety
 *
 * 🆕 HR MASTER SYSTEM:
 * - Unified schemas: EmployeeMaster, AttendanceMaster, PayrollMaster, IncentiveLedger
 * - Automatic sync from legacy data to master schemas
 * - All employee references validated via employeeId
 * - Adapter layer maintains backward compatibility
 *
 * VERIFIED: 2026-04-27
 */

import {
  Department,
  Designation,
  Role,
  PublicHoliday,
  LeavePolicy,
  SalaryStructure,
} from "../types/hr-types";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { autoInitHRMaster } from "./initHRMaster";

/**
 * Get initial departments seed data
 *
 * STRUCTURE REQUIREMENTS:
 * - Must match OrgContext Department interface: { id, name, description? }
 * - Will be stored in DataService with key "DEPARTMENTS"
 * - OrgContext will read from "DEPARTMENTS" key
 *
 * DO NOT add fields that don't exist in OrgContext interface
 */
export function getInitialDepartments(): any[] {
  return [
    {
      id: "dept-001",
      name: "Operations",
      description: "Car washing and cleaning operations",
    },
    {
      id: "dept-002",
      name: "Human Resources",
      description: "Employee management and administration",
    },
    {
      id: "dept-003",
      name: "Finance",
      description: "Financial management and accounting",
    },
    {
      id: "dept-004",
      name: "Administration",
      description: "Administrative and support functions",
    },
    {
      id: "dept-005",
      name: "Sales & Marketing",
      description: "Customer acquisition and retention",
    },
    {
      id: "dept-006",
      name: "Procurement & Inventory",
      description: "Supply chain and inventory management",
    },
  ];
}

/**
 * Get initial designations seed data
 *
 * STRUCTURE REQUIREMENTS:
 * - Must match OrgContext Designation interface: { id, title, level, department }
 * - Will be stored in DataService with key "DESIGNATIONS"
 * - OrgContext will read from "DESIGNATIONS" key
 *
 * NOTE: Field is 'title' not 'name' - this is important!
 */
export function getInitialDesignations(): any[] {
  return [
    {
      id: "DES-001",
      title: "Car Washer",
      level: 1,
      department: "Operations",
    },
    {
      id: "DES-002",
      title: "Supervisor",
      level: 2,
      department: "Operations",
    },
    {
      id: "DES-003",
      title: "Manager",
      level: 3,
      department: "Operations",
    },
    {
      id: "DES-004",
      title: "Operations Manager",
      level: 4,
      department: "Operations",
    },
    {
      id: "DES-005",
      title: "City Manager",
      level: 5,
      department: "Operations",
    },
  ];
}

export function getInitialRoles(): Role[] {
  return [
    {
      id: "role-001",
      code: "SUPER-ADMIN",
      name: "Super Admin",
      category: "Management",
      department: "Administration",
      baseValues: {
        basic: 80000,
        hra: 40000,
        allowances: 15000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-002",
      code: "ADMIN",
      name: "Admin",
      category: "Administration",
      department: "Administration",
      baseValues: {
        basic: 22000,
        hra: 11000,
        allowances: 3800,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-003",
      code: "CITY-MANAGER",
      name: "City Manager",
      category: "Management",
      department: "Operations",
      baseValues: {
        basic: 60000,
        hra: 30000,
        allowances: 12000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-004",
      code: "CLUSTER-MANAGER",
      name: "Cluster Manager",
      category: "Management",
      department: "Operations",
      baseValues: {
        basic: 50000,
        hra: 25000,
        allowances: 10000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-005",
      code: "SR-OPS-MANAGER",
      name: "Sr Ops Manager",
      category: "Management",
      department: "Operations",
      baseValues: {
        basic: 55000,
        hra: 27500,
        allowances: 11000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-006",
      code: "OPS-MANAGER",
      name: "Ops Manager",
      category: "Management",
      department: "Operations",
      baseValues: {
        basic: 45000,
        hra: 22500,
        allowances: 8500,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-007",
      code: "SUPERVISOR",
      name: "Supervisor",
      category: "Operations",
      department: "Operations",
      baseValues: {
        basic: 25000,
        hra: 12500,
        allowances: 4200,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-008",
      code: "CAR-WASHER",
      name: "Car Washer",
      category: "Operations",
      department: "Operations",
      baseValues: {
        basic: 13330,
        hra: 6665,
        allowances: 2133,
        pt: 208,
      },
      isActive: true,
    },
    {
      id: "role-009",
      code: "TSM",
      name: "TSM",
      category: "Sales",
      department: "Operations",
      baseValues: {
        basic: 35000,
        hra: 17500,
        allowances: 6500,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-010",
      code: "TSE",
      name: "TSE",
      category: "Sales",
      department: "Operations",
      baseValues: {
        basic: 20000,
        hra: 10000,
        allowances: 3500,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-011",
      code: "CCE",
      name: "CCE",
      category: "Customer Service",
      department: "Operations",
      baseValues: {
        basic: 18000,
        hra: 9000,
        allowances: 3000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-012",
      code: "STORE-MANAGER",
      name: "Store Manager",
      category: "Operations",
      department: "Operations",
      baseValues: {
        basic: 28000,
        hra: 14000,
        allowances: 5000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-013",
      code: "PROCUREMENT-MANAGER",
      name: "Procurement Manager",
      category: "Procurement",
      department: "Administration",
      baseValues: {
        basic: 32000,
        hra: 16000,
        allowances: 6000,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-014",
      code: "ACCOUNTS",
      name: "Accounts",
      category: "Finance",
      department: "Finance",
      baseValues: {
        basic: 26000,
        hra: 13000,
        allowances: 4500,
        pt: 200,
      },
      isActive: true,
    },
    {
      id: "role-015",
      code: "HR",
      name: "HR",
      category: "Human Resources",
      department: "Human Resources",
      baseValues: {
        basic: 30000,
        hra: 15000,
        allowances: 5500,
        pt: 200,
      },
      isActive: true,
    },
  ];
}

/**
 * Get initial public holidays seed data
 *
 * STRUCTURE REQUIREMENTS:
 * - Must match OrgContext PublicHoliday interface: { date, name, type }
 * - Will be stored in DataService with key "PUBLIC_HOLIDAYS"
 * - OrgContext will read from "PUBLIC_HOLIDAYS" key
 * - Date format MUST be ISO: YYYY-MM-DD (e.g., "2026-01-26")
 *
 * DO NOT use DD-MM-YYYY format - will cause date parsing issues
 */
export function getInitialPublicHolidays(year: number): any[] {
  return [
    {
      date: `${year}-01-26`,
      name: "Republic Day",
      type: "National",
    },
    {
      date: `${year}-03-14`,
      name: "Holi",
      type: "National",
    },
    {
      date: `${year}-04-18`,
      name: "Good Friday",
      type: "National",
    },
    {
      date: `${year}-05-01`,
      name: "May Day",
      type: "National",
    },
    {
      date: `${year}-08-15`,
      name: "Independence Day",
      type: "National",
    },
    {
      date: `${year}-10-02`,
      name: "Gandhi Jayanti",
      type: "National",
    },
    {
      date: `${year}-11-01`,
      name: "Diwali",
      type: "National",
    },
    {
      date: `${year}-12-25`,
      name: "Christmas",
      type: "National",
    },
  ];
}

export function getInitialLeavePolicies(): LeavePolicy[] {
  return [
    {
      id: "lp-001",
      policyName: "Standard Leave Policy",
      applicableFor: {
        employeeTypes: ["Full-Time"],
        departments: ["Operations", "Human Resources", "Finance", "Administration"],
      },
      leaveTypes: [
        {
          leaveType: "Casual Leave",
          leaveCode: "CL",
          annualQuota: 12,
          carryForward: false,
          encashment: false,
          isPaid: true,
          requiresApproval: true,
          minNoticeRequired: 1,
          maxConsecutiveDays: 3,
          applicableAfter: 0,
          accrualType: "Yearly",
        },
        {
          leaveType: "Sick Leave",
          leaveCode: "SL",
          annualQuota: 12,
          carryForward: false,
          encashment: false,
          isPaid: true,
          requiresApproval: true,
          minNoticeRequired: 0,
          applicableAfter: 0,
          accrualType: "Yearly",
        },
        {
          leaveType: "Privileged Leave",
          leaveCode: "PL",
          annualQuota: 15,
          carryForward: true,
          maxCarryForward: 30,
          encashment: true,
          maxEncashment: 15,
          isPaid: true,
          requiresApproval: true,
          minNoticeRequired: 7,
          applicableAfter: 6,
          accrualType: "Monthly",
        },
        {
          leaveType: "Earned Leave",
          leaveCode: "EL",
          annualQuota: 21,
          carryForward: true,
          maxCarryForward: 45,
          encashment: true,
          maxEncashment: 21,
          isPaid: true,
          requiresApproval: true,
          minNoticeRequired: 15,
          applicableAfter: 12,
          accrualType: "Monthly",
        },
        {
          leaveType: "Compensatory Off",
          leaveCode: "COFF",
          annualQuota: 0,
          carryForward: false,
          encashment: false,
          isPaid: true,
          requiresApproval: true,
          minNoticeRequired: 1,
          applicableAfter: 0,
          accrualType: "Custom",
        },
        {
          leaveType: "Leave Without Pay",
          leaveCode: "LWP",
          annualQuota: 0,
          carryForward: false,
          encashment: false,
          isPaid: false,
          requiresApproval: true,
          minNoticeRequired: 3,
          applicableAfter: 0,
          accrualType: "Custom",
        },
      ],
      rules: [
        {
          id: "rule-001",
          ruleType: "Carry Forward",
          condition: "End of Year",
          action: "Transfer unused PL and EL to next year subject to maximum limit",
          description: "Carry forward of privileged and earned leave",
        },
        {
          id: "rule-002",
          ruleType: "Encashment",
          condition: "On Resignation or Year End",
          action: "Encash unused PL and EL subject to maximum limit",
          description: "Leave encashment policy",
        },
      ],
      isActive: true,
      effectiveFrom: "2024-01-01",
      createdBy: "System",
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getInitialSalaryStructures(): SalaryStructure[] {
  return [
    {
      id: "ss-001",
      name: "Standard Full-Time Structure",
      description: "Standard salary structure for full-time employees",
      applicableFor: {
        employeeTypes: ["Full-Time"],
        departments: ["Operations", "Human Resources", "Finance", "Administration"],
        designations: ["Manager", "Supervisor", "Assistant"],
        roles: ["Car Washer", "Car Detailer", "Supervisor", "Manager"],
      },
      components: {
        earnings: [
          {
            id: 1,
            name: "Basic Salary",
            type: "Fixed",
            value: "0",
            baseOn: "Basic",
          },
          {
            id: 2,
            name: "HRA",
            type: "%",
            value: "50",
            baseOn: "Basic",
          },
          {
            id: 3,
            name: "Allowances",
            type: "%",
            value: "16",
            baseOn: "Basic",
          },
        ],
        deductions: [
          {
            id: 1,
            name: "Professional Tax",
            type: "Fixed",
            value: "208",
          },
          {
            id: 2,
            name: "Employee PF",
            type: "%",
            value: "12",
            baseOn: "Basic",
          },
          {
            id: 3,
            name: "Employee ESIC",
            type: "%",
            value: "0.75",
            baseOn: "Gross",
          },
        ],
        employerContributions: [
          {
            id: 1,
            name: "Employer PF",
            type: "%",
            value: "12",
            baseOn: "Basic",
          },
          {
            id: 2,
            name: "Employer ESIC",
            type: "%",
            value: "3.25",
            baseOn: "Gross",
          },
        ],
      },
      rules: [
        {
          id: "rule-001",
          ruleType: "Percentage",
          formula: "HRA = 50% of Basic",
          description: "HRA calculation based on basic salary",
        },
      ],
      isActive: true,
      createdBy: "System",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ss-002",
      name: "Part-Time Salary Structure",
      description: "Prorated salary structure for part-time employees",
      applicableFor: {
        employeeTypes: ["Part-Time"],
        departments: ["Operations"],
        designations: ["Assistant"],
        roles: ["Car Washer", "Car Detailer"],
      },
      components: {
        earnings: [
          {
            id: 1,
            name: "Basic Salary",
            type: "Fixed",
            value: "0",
            baseOn: "Basic",
          },
          {
            id: 2,
            name: "HRA",
            type: "%",
            value: "50",
            baseOn: "Basic",
          },
          {
            id: 3,
            name: "Allowances",
            type: "%",
            value: "16",
            baseOn: "Basic",
          },
        ],
        deductions: [
          {
            id: 1,
            name: "Professional Tax",
            type: "Fixed",
            value: "0",
          },
        ],
        employerContributions: [],
      },
      rules: [
        {
          id: "rule-001",
          ruleType: "Conditional",
          formula: "Basic Salary = (Working Hours / Standard Hours) × FT Reference Salary",
          description: "Prorated salary calculation for part-time employees",
        },
      ],
      isActive: true,
      createdBy: "System",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ss-003",
      name: "Contract Salary Structure",
      description: "Fixed salary structure for contract employees",
      applicableFor: {
        employeeTypes: ["Contract"],
        departments: ["Operations"],
        designations: ["Assistant"],
        roles: ["Car Washer", "Car Detailer"],
      },
      components: {
        earnings: [
          {
            id: 1,
            name: "Contract Amount",
            type: "Fixed",
            value: "0",
            baseOn: "Basic",
          },
        ],
        deductions: [
          {
            id: 1,
            name: "TDS",
            type: "%",
            value: "10",
            baseOn: "Gross",
          },
        ],
        employerContributions: [],
      },
      rules: [
        {
          id: "rule-001",
          ruleType: "Fixed",
          formula: "Contract Amount is fixed per month",
          description: "Fixed monthly contract amount",
        },
      ],
      isActive: true,
      createdBy: "System",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// ============================================
// MIGRATION VERSION CONTROL
// ============================================

const MIGRATION_VERSION_KEY = "HRDATA_MIGRATION_VERSION";

/**
 * Get current migration version
 * @returns Version number (0 if not set)
 */
function getCurrentMigrationVersion(): number {
  const version = localStorage.getItem(MIGRATION_VERSION_KEY);
  return version ? parseInt(version, 10) : 0;
}

/**
 * Set migration version
 */
function setMigrationVersion(version: number) {
  localStorage.setItem(MIGRATION_VERSION_KEY, String(version));
  logger.log(`[HR MIGRATION] Version set to ${version}`);
}

// ============================================
// ROLLBACK ENGINE
// ============================================

/**
 * Rollback migration from backup
 *
 * @param backupKey - localStorage key containing backup data
 */
function rollbackMigration(backupKey: string) {
  try {
    console.warn(`[HR MIGRATION] ⚠️  Rolling back from ${backupKey}...`);

    const backupRaw = localStorage.getItem(backupKey);
    if (!backupRaw) {
      console.warn("[HR MIGRATION] No backup found, cannot rollback");
      return;
    }

    const backup = JSON.parse(backupRaw);

    Object.keys(backup).forEach((key) => {
      localStorage.setItem(key, backup[key]);
      console.log(`[HR MIGRATION] 🔄 Restored: ${key}`);
    });

    console.log("[HR MIGRATION] ✅ Rollback completed successfully");
    logger.log("[HR MIGRATION] Rollback completed");
  } catch (error) {
    console.error("[HR MIGRATION] ❌ Rollback failed:", error);
    logger.error("[HR MIGRATION] Rollback failed", error as Error);
  }
}

// ============================================
// MIGRATION V1: Legacy → DataService
// ============================================

/**
 * Migration V1: Migrate legacy hrdata:* keys to DataService
 *
 * ROLLBACK-SAFE:
 * - Creates backup before migration
 * - Restores backup on error
 * - Cleans backup on success
 *
 * SAFETY GUARANTEES:
 * - Never overwrites existing DataService data
 * - Keeps legacy data intact
 * - Handles parse errors gracefully
 */
function migrateV1_LegacyToDataService() {
  const backupKey = "HRDATA_BACKUP_V1";

  try {
    console.log("[HR MIGRATION V1] Starting legacy → DataService migration...");

    // STEP 1: CREATE BACKUP
    const backup: Record<string, string> = {};
    const legacyKeys = [
      "hrdata:departments",
      "hrdata:designations",
      "hrdata:holidays",
      "hrdata:employees",
      "hrdata:roles",
    ];

    legacyKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        backup[key] = raw;
        logger.debug(`[HR MIGRATION V1] Backed up: ${key}`);
      }
    });

    // Save backup
    if (Object.keys(backup).length > 0) {
      localStorage.setItem(backupKey, JSON.stringify(backup));
      console.log(`[HR MIGRATION V1] ✅ Backup created (${Object.keys(backup).length} keys)`);
    } else {
      console.log("[HR MIGRATION V1] ℹ️  No legacy data found to backup");
    }

    // STEP 2: MIGRATE DATA
    const mappings = [
      { oldKey: "hrdata:departments", newKey: "DEPARTMENTS", transform: migrateDepartments },
      { oldKey: "hrdata:designations", newKey: "DESIGNATIONS", transform: migrateDesignations },
      { oldKey: "hrdata:holidays", newKey: "PUBLIC_HOLIDAYS", transform: migrateHolidays },
      { oldKey: "hrdata:employees", newKey: "EMPLOYEES", transform: null },
      { oldKey: "hrdata:roles", newKey: "ROLES", transform: null },
    ];

    let migratedCount = 0;
    let totalRecords = 0;

    mappings.forEach(({ oldKey, newKey, transform }) => {
      // Only migrate if new system is empty (never overwrite)
      const existingNew = DataService.count(newKey as any);

      if (existingNew === 0) {
        const oldData = localStorage.getItem(oldKey);

        if (oldData) {
          try {
            const parsed = JSON.parse(oldData);

            if (Array.isArray(parsed) && parsed.length > 0) {
              // Transform old structure to new structure if needed
              const transformed = transform ? transform(parsed) : parsed;

              // CRITICAL: Skip EMPLOYEES migration if using DataService
              // EmployeeContext is read-only and doesn't use setAll
              if (newKey === "EMPLOYEES") {
                logger.debug(`[HR MIGRATION V1] ⏭️  Skipping ${oldKey} - employees managed by HRDataContext`);
                return;
              }

              if (newKey === "ROLES") {
                logger.debug(`[HR MIGRATION V1] ⏭️  Skipping ${oldKey} - roles not currently persisted in DataService`);
                return;
              }

              DataService.setAll(newKey as any, transformed);
              migratedCount++;
              totalRecords += transformed.length;

              console.log(`[HR MIGRATION V1] ✅ Migrated ${transformed.length} items: ${oldKey} → ${newKey}`);
            } else {
              logger.debug(`[HR MIGRATION V1] ⏭️  ${oldKey} is empty or invalid, skipping`);
            }
          } catch (parseError) {
            console.error(`[HR MIGRATION V1] ❌ Failed parsing ${oldKey}:`, parseError);
            logger.error(`[HR MIGRATION V1] Failed parsing ${oldKey}`, parseError as Error);
            // Continue with next entity (partial migration allowed)
          }
        } else {
          logger.debug(`[HR MIGRATION V1] ⏭️  ${oldKey} not found in localStorage`);
        }
      } else {
        logger.debug(`[HR MIGRATION V1] ⏭️  ${newKey} already has ${existingNew} records, skipping migration`);
      }
    });

    // STEP 3: SUCCESS - CLEAN BACKUP
    localStorage.removeItem(backupKey);
    console.log("[HR MIGRATION V1] ✅ Backup cleaned (migration successful)");

    if (migratedCount > 0) {
      console.log(`[HR MIGRATION V1] ✅ Migration completed: ${migratedCount} entities (${totalRecords} records) migrated`);
      logger.log(`[HR MIGRATION V1] Migration complete: ${migratedCount} entities, ${totalRecords} records`);
    } else {
      console.log("[HR MIGRATION V1] ℹ️  No data migrated (already populated or no legacy data)");
      logger.debug("[HR MIGRATION V1] No migration needed");
    }
  } catch (error) {
    console.error("[HR MIGRATION V1] ❌ Migration failed, attempting rollback...", error);
    logger.error("[HR MIGRATION V1] Migration failed", error as Error);

    // STEP 4: ERROR - ROLLBACK
    rollbackMigration(backupKey);

    // Re-throw to prevent version increment
    throw error;
  }
}

// ============================================
// MIGRATION RUNNER (VERSION-CONTROLLED)
// ============================================

/**
 * Run all pending HR data migrations
 *
 * VERSIONING:
 * - Checks current migration version
 * - Runs only migrations that haven't been applied
 * - Increments version after each successful migration
 * - Auto-recovers from failures via rollback
 *
 * EXTENSIBILITY:
 * - Easy to add new migrations (just add new version check)
 * - Each migration is independent
 * - Can skip versions if needed
 */
export function runHRMigrations() {
  try {
    const currentVersion = getCurrentMigrationVersion();

    logger.debug(`[HR MIGRATION] Current version: ${currentVersion}`);
    console.log(`[HR MIGRATION] Checking migrations (current version: ${currentVersion})...`);

    // Migration V1: Legacy hrdata:* → DataService cleancar_*
    if (currentVersion < 1) {
      console.log("[HR MIGRATION] Running Migration V1: Legacy → DataService");
      migrateV1_LegacyToDataService();
      setMigrationVersion(1);
      console.log("[HR MIGRATION] ✅ Migration V1 complete");
    }

    // Future: Migration V2
    // if (currentVersion < 2) {
    //   migrateV2_AddNewFields();
    //   setMigrationVersion(2);
    // }

    // Future: Migration V3
    // if (currentVersion < 3) {
    //   migrateV3_UpdateStructure();
    //   setMigrationVersion(3);
    // }

    const finalVersion = getCurrentMigrationVersion();
    console.log(`[HR MIGRATION] ✅ All migrations completed (version: ${finalVersion})`);
    logger.log(`[HR MIGRATION] All migrations completed (version ${finalVersion})`);
  } catch (error) {
    console.error("[HR MIGRATION] ❌ Migration pipeline failed:", error);
    logger.error("[HR MIGRATION] Migration pipeline failed", error as Error);

    // Don't set version if migrations failed - will retry on next load
    console.warn("[HR MIGRATION] ⚠️  Migration will retry on next app load");
  }
}

// ============================================
// LEGACY MIGRATION FUNCTION (DEPRECATED)
// ============================================

/**
 * @deprecated Use runHRMigrations() instead
 * @internal
 *
 * Migrate legacy HR data from old StorageService keys to DataService
 *
 * MIGRATION STRATEGY:
 * - Reads from old "hrdata:*" localStorage keys
 * - Writes to new DataService keys ("DEPARTMENTS", etc.)
 * - Only migrates if DataService is empty (never overwrites)
 * - Keeps old data intact (safe rollback)
 * - Logs all migration operations
 * - Runs only once per browser (migration flag prevents duplicates)
 *
 * ZERO DATA LOSS GUARANTEE:
 * Existing users' HR data automatically migrates on first load
 *
 * NOTE: This function is now wrapped by runHRMigrations() for version control
 */
function migrateHRDataIfNeeded() {
  logger.debug("[HR MIGRATION] Checking for legacy data to migrate...");

  try {
    // Check migration flag - prevent duplicate migration
    const migrationFlag = localStorage.getItem("HRDATA_MIGRATED");

    if (migrationFlag === "true") {
      logger.debug("[HR MIGRATION] ⏭️  Migration already completed (flag set), skipping");
      return;
    }

    console.log("[HR MIGRATION] Starting HR data migration...");

    // Define all legacy → modern key mappings
    const mappings = [
      { oldKey: "hrdata:departments", newKey: "DEPARTMENTS", transform: migrateDepartments },
      { oldKey: "hrdata:designations", newKey: "DESIGNATIONS", transform: migrateDesignations },
      { oldKey: "hrdata:holidays", newKey: "PUBLIC_HOLIDAYS", transform: migrateHolidays },
      { oldKey: "hrdata:employees", newKey: "EMPLOYEES", transform: null }, // No transformation needed
      { oldKey: "hrdata:roles", newKey: "ROLES", transform: null }, // No transformation needed
    ];

    let migratedCount = 0;
    let totalRecords = 0;

    mappings.forEach(({ oldKey, newKey, transform }) => {
      // Only migrate if new system is empty (never overwrite)
      const existingNew = DataService.count(newKey as any);

      if (existingNew === 0) {
        const oldData = localStorage.getItem(oldKey);

        if (oldData) {
          try {
            const parsed = JSON.parse(oldData);

            if (Array.isArray(parsed) && parsed.length > 0) {
              // Transform old structure to new structure if needed
              const transformed = transform ? transform(parsed) : parsed;

              // CRITICAL: Skip EMPLOYEES migration if using DataService
              // EmployeeContext is read-only and doesn't use setAll
              if (newKey === "EMPLOYEES") {
                logger.debug(`[HR MIGRATION] ⏭️  Skipping ${oldKey} - employees managed by HRDataContext`);
                return;
              }

              if (newKey === "ROLES") {
                logger.debug(`[HR MIGRATION] ⏭️  Skipping ${oldKey} - roles not currently persisted in DataService`);
                return;
              }

              DataService.setAll(newKey as any, transformed);
              migratedCount++;
              totalRecords += transformed.length;

              console.log(`[HR MIGRATION] ✅ Migrated ${transformed.length} items: ${oldKey} → ${newKey}`);
            } else {
              logger.debug(`[HR MIGRATION] ⏭️  ${oldKey} is empty or invalid, skipping`);
            }
          } catch (parseError) {
            console.error(`[HR MIGRATION] ❌ Failed parsing ${oldKey}:`, parseError);
            logger.error(`[HR MIGRATION] ❌ Failed parsing ${oldKey}`, parseError as Error);
          }
        } else {
          logger.debug(`[HR MIGRATION] ⏭️  ${oldKey} not found in localStorage`);
        }
      } else {
        logger.debug(`[HR MIGRATION] ⏭️  ${newKey} already has ${existingNew} records, skipping migration`);
      }
    });

    // Mark migration complete (even if no data found - prevents repeated checks)
    localStorage.setItem("HRDATA_MIGRATED", "true");

    if (migratedCount > 0) {
      console.log(`[HR MIGRATION] ✅ Migration completed successfully: ${migratedCount} entities (${totalRecords} total records) migrated`);
      logger.log(`[HR MIGRATION] Migration complete: ${migratedCount} entities, ${totalRecords} records migrated`);
    } else {
      console.log("[HR MIGRATION] ℹ️  No legacy data found or all entities already populated");
      logger.debug("[HR MIGRATION] No legacy data found or migration not needed");
    }
  } catch (err) {
    console.error("[HR MIGRATION] ❌ Unexpected error during migration:", err);
    logger.error("[HR MIGRATION] Unexpected error during migration", err as Error);

    // Don't set migration flag if error occurred - allow retry on next load
  }
}

/**
 * Transform old department structure to new OrgContext structure
 */
function migrateDepartments(oldDepartments: any[]): any[] {
  return oldDepartments.map((dept) => ({
    id: dept.id || dept.departmentId || `dept-${Date.now()}`,
    name: dept.name,
    description: dept.description || "",
  }));
}

/**
 * Transform old designation structure to new OrgContext structure
 */
function migrateDesignations(oldDesignations: any[]): any[] {
  return oldDesignations.map((desig) => ({
    id: desig.id || desig.designationId || `desig-${Date.now()}`,
    title: desig.name || desig.title || "Unknown",
    level: desig.level || 1,
    department: desig.department || "Operations",
  }));
}

/**
 * Transform old holiday structure to new OrgContext structure
 */
function migrateHolidays(oldHolidays: any[]): any[] {
  return oldHolidays.map((holiday) => {
    // Convert DD-MM-YYYY to YYYY-MM-DD if needed
    let date = holiday.date;
    if (date && date.includes("-")) {
      const parts = date.split("-");
      if (parts[0].length === 2) {
        // DD-MM-YYYY format
        date = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }

    return {
      date: date || holiday.holidayDate || "",
      name: holiday.name || "Unknown Holiday",
      type: holiday.type || "National",
    };
  });
}

/**
 * Reset migration version (for testing purposes only)
 *
 * ⚠️ USE WITH CAUTION:
 * - Resets migration version to 0
 * - Forces all migrations to run again on next load
 * - Does NOT delete any data (just resets version)
 * - Should only be used for testing/debugging
 *
 * @param targetVersion - Version to reset to (default: 0)
 * @internal
 */
export function resetMigrationVersion(targetVersion: number = 0) {
  if (targetVersion === 0) {
    localStorage.removeItem(MIGRATION_VERSION_KEY);
    console.log("[HR MIGRATION] Migration version reset to 0 - all migrations will run on next app load");
  } else {
    setMigrationVersion(targetVersion);
    console.log(`[HR MIGRATION] Migration version reset to ${targetVersion} - migrations > ${targetVersion} will run on next app load`);
  }
}

/**
 * Get current migration version (for debugging)
 */
export function getMigrationVersion(): number {
  return getCurrentMigrationVersion();
}

/**
 * Reset migration flag (for testing purposes only)
 *
 * @deprecated Use resetMigrationVersion() instead
 * @internal
 *
 * ⚠️ USE WITH CAUTION:
 * - Allows migration to run again
 * - Should only be used for testing/debugging
 * - Does NOT delete any data (just resets flag)
 */
export function resetMigrationFlag() {
  localStorage.removeItem("HRDATA_MIGRATED");
  resetMigrationVersion(0);
  console.log("[HR MIGRATION] Legacy migration flag reset - use resetMigrationVersion() for version-controlled migrations");
}

/**
 * Check migration status
 *
 * @returns Migration status information including version
 */
export function getMigrationStatus() {
  const currentVersion = getCurrentMigrationVersion();
  const migrationFlag = localStorage.getItem("HRDATA_MIGRATED"); // Legacy flag
  const hasBackup = !!localStorage.getItem("HRDATA_BACKUP_V1");

  const hasLegacyDepartments = !!localStorage.getItem("hrdata:departments");
  const hasLegacyDesignations = !!localStorage.getItem("hrdata:designations");
  const hasLegacyHolidays = !!localStorage.getItem("hrdata:holidays");
  const hasLegacyEmployees = !!localStorage.getItem("hrdata:employees");

  const hasNewDepartments = DataService.count("DEPARTMENTS") > 0;
  const hasNewDesignations = DataService.count("DESIGNATIONS") > 0;
  const hasNewHolidays = DataService.count("PUBLIC_HOLIDAYS") > 0;

  return {
    version: currentVersion,
    migrationComplete: currentVersion >= 1, // V1 is current latest
    legacyMigrationFlag: migrationFlag === "true", // Old system flag
    hasBackup: hasBackup,
    legacyData: {
      departments: hasLegacyDepartments,
      designations: hasLegacyDesignations,
      holidays: hasLegacyHolidays,
      employees: hasLegacyEmployees,
    },
    modernData: {
      departments: hasNewDepartments,
      designations: hasNewDesignations,
      holidays: hasNewHolidays,
    },
  };
}

/**
 * Initialize all HR data if not already present
 *
 * SAFETY GUARANTEES:
 * - Auto-migrates legacy data first (zero data loss)
 * - Only seeds data if DataService storage is empty
 * - Uses DataService exclusively (no StorageService)
 * - Logs all seeding operations for visibility
 * - Skips entities already present (idempotent)
 */
export function initializeHRData() {
  const currentYear = new Date().getFullYear();

  logger.debug("[HR INIT] Starting HR data initialization check...");

  // STEP 1: Run version-controlled migrations first
  runHRMigrations();

  // STEP 2: Check if data exists (could be from migration or previous seed)
  const existingDepartments = DataService.count("DEPARTMENTS") > 0;
  const existingHolidays = DataService.count("PUBLIC_HOLIDAYS") > 0;
  const existingDesignations = DataService.count("DESIGNATIONS") > 0;

  // Initialize only if data doesn't exist
  if (!existingDepartments) {
    const departments = getInitialDepartments();
    DataService.setAll("DEPARTMENTS", departments);
    logger.log(`[HR INIT] ✅ Departments seeded via DataService (${departments.length} departments)`);
  } else {
    logger.debug(`[HR INIT] ⏭️  Departments already exist, skipping seed (${existingDepartments} found)`);
  }

  if (!existingHolidays) {
    const holidays = getInitialPublicHolidays(currentYear);
    DataService.setAll("PUBLIC_HOLIDAYS", holidays);
    logger.log(`[HR INIT] ✅ Public holidays seeded via DataService (${holidays.length} holidays for ${currentYear})`);
  } else {
    logger.debug(`[HR INIT] ⏭️  Public holidays already exist, skipping seed`);
  }

  if (!existingDesignations) {
    const designations = getInitialDesignations();
    DataService.setAll("DESIGNATIONS", designations);
    logger.log(`[HR INIT] ✅ Designations seeded via DataService (${designations.length} designations)`);
  } else {
    logger.debug(`[HR INIT] ⏭️  Designations already exist, skipping seed`);
  }

  logger.debug("[HR INIT] Initialization complete");

  // STEP 3: Initialize HR Master System (unified schemas)
  // This syncs legacy data to EmployeeMaster, AttendanceMaster, PayrollMaster, IncentiveLedger
  autoInitHRMaster();

  // NOTE: Old StorageService data (hrdata:*) is NOT deleted after migration
  // This provides rollback safety in case of issues
  // Future cleanup can be done manually or via admin tool if needed

  // NOTE: Salary structures from hr-types don't match PayrollContext interface
  // PayrollContext uses its own simpler SalaryStructure type
  // Salary structures should be initialized via PayrollContext if needed

  // NOTE: Roles and Leave Policies are not currently persisted via DataService
  // They use in-context defaults or are managed elsewhere
  // If persistence is needed, add appropriate keys to DataService.ts first
}
