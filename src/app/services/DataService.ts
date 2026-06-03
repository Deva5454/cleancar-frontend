/**
 * DataService - Unified Persistence Layer
 * Single source of truth for ALL data storage across the application
 *
 * CRITICAL: All contexts MUST use this service for persistence
 * No direct localStorage or in-memory state allowed for persistent data
 *
 * Data Flow: UI → Context → DataService → Storage (localStorage)
 *
 * MULTI-CITY ARCHITECTURE:
 * - All storage keys are namespaced by city (e.g., cleancar_CITY-SURAT_employees)
 * - Complete data isolation between cities
 * - Backward compatible with legacy Surat-only keys
 * - Auto-migration from old keys to new namespaced keys
 *
 * Future: Can be upgraded to Supabase without changing context APIs
 */

// Default city for backward compatibility
const DEFAULT_CITY = "CITY-SURAT";

/**
 * Build city-namespaced storage key
 * @param baseKey - Base key name (e.g., "employees")
 * @param cityId - City identifier (e.g., "CITY-SURAT", "CITY-MUMBAI")
 * @returns Namespaced key (e.g., "cleancar_CITY-SURAT_employees")
 */
export const buildKey = (baseKey: string, cityId?: string): string => {
  const city = cityId || DEFAULT_CITY;
  return `cleancar_${city}_${baseKey}`;
};

/**
 * Legacy key builder for backward compatibility
 * @param baseKey - Base key name
 * @returns Old-style key (e.g., "cleancar_employees")
 */
const buildLegacyKey = (baseKey: string): string => {
  return `cleancar_${baseKey}`;
};

// Storage base keys (WITHOUT cleancar_ prefix)
const STORAGE_KEYS = {
  EMPLOYEES: "employees",
  CUSTOMERS: "customers",
  LEADS: "leads",
  SUBSCRIPTIONS: "subscriptions",
  JOBS: "jobs",
  ATTENDANCE_RECORDS: "attendance_records", // Unified attendance system
  PAYROLL: "payroll",
  PAYROLL_RUNS: "payroll_runs", // PHASE 4: PayrollContext
  SALARY_STRUCTURES: "salary_structures", // PHASE 4: PayrollContext
  INCENTIVE_PLANS: "incentive_plans", // PHASE 4: IncentiveContext
  EMPLOYEE_INCENTIVES: "employee_incentives", // PHASE 4: IncentiveContext
  DEPARTMENTS: "departments", // PHASE 4: OrgContext
  DESIGNATIONS: "designations", // PHASE 4: OrgContext
  PUBLIC_HOLIDAYS: "public_holidays", // PHASE 4: OrgContext
  CITY_CONFIG: "city_config", // Dynamic city/zone/cluster/pincode configuration
  INVENTORY: "inventory",
  FINANCE_PAYABLES: "payables",
  FINANCE_REVENUES: "revenues",
  FINANCE_MRR: "mrr",
  FINANCE_LEDGER: "ledger",
  CUSTOM_ROLES: "custom_roles",
  ROLE_PERMISSION_OVERRIDES: "role_permission_overrides",
  CUSTOM_TRANSACTION_SUB_TYPES: "custom_transaction_sub_types", // GST transaction categorization
  MOBILE_CHANGE_REQUESTS: "mobile_change_requests",
  // ── Added: keys used by contexts but previously missing from this map ──
  INVENTORY_ITEMS:         "inventory_items",         // InventoryContext
  STOCK_TRANSACTIONS:      "stock_transactions",      // InventoryContext
  FINANCE_BUDGETS:         "finance_budgets",         // FinanceContext
  FINANCE_ALERTS:          "finance_alerts",          // FinanceContext
  FINANCE_RECOMMENDATIONS: "finance_recommendations", // FinanceContext
  BUSINESS_RULES:          "business_rules",          // BusinessRulesContext
  DEMOS:                   "demos",                   // DemoContext
  // ── Keys for seed data that was previously unreachable ──
  COMPLAINTS:               "complaints",
  ADVANCE_MANAGEMENT:       "advance_management",
  CLOTH_TRACKING:           "cloth_tracking",
  CLOTH_ITEMS:              "cloth_items",
  CLOTH_EXCHANGES:          "cloth_exchanges",
  // ── Plan Management persistence ──
  PLAN_TIERS:               "plan_tiers",
  PLAN_ADDONS:              "plan_addons",
  PLAN_COMBOS:              "plan_combos",
  PLAN_DISCOUNTS:           "plan_discounts",
  PLAN_AUDIT_LOG:           "plan_audit_log",
  TDS_PAYMENTS:             "tds_payments",
} as const;

type EntityType = keyof typeof STORAGE_KEYS;

/**
 * Generic DataService interface
 * Each entity type can be stored/retrieved using these methods
 */
// G1 FIX: Quota error notification — components can subscribe to this
// Usage: window.addEventListener("dataservice:quota", (e) => toast.error(e.detail))
function notifyQuotaError(entityType: string) {
  try {
    window.dispatchEvent(
      new CustomEvent("dataservice:quota", {
        detail: `Storage full — could not save ${entityType} data. Please contact support or clear old data.`,
      })
    );
  } catch (_) {}
}

class DataServiceClass {
  /**
   * Get all records for an entity type
   * @param entityType - Type of entity to retrieve
   * @param cityId - Optional city identifier for multi-city isolation
   */
  get<T>(entityType: EntityType, cityId?: string): T[] {
    try {
      const baseKey = STORAGE_KEYS[entityType];

      // CITY_CONFIG is global - don't namespace it
      if (entityType === "CITY_CONFIG") {
        const globalKey = buildLegacyKey(baseKey);
        const data = localStorage.getItem(globalKey);
        return data ? JSON.parse(data) : [];
      }

      const newKey = buildKey(baseKey, cityId);
      const legacyKey = buildLegacyKey(baseKey);

      // Try city-namespaced key first, with safe JSON parse
      const cityData = localStorage.getItem(newKey);
      if (cityData) {
        try {
          const parsed = JSON.parse(cityData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
          // Empty array or invalid — fall through to legacy key
        } catch (e) {
          // Corrupt/truncated JSON in city key — remove it and use legacy
          console.warn(`[DataService] Corrupt data in ${newKey}, falling back to legacy key`);
          try { localStorage.removeItem(newKey); } catch(_) {}
        }
      }

      // Fallback: try legacy key cleancar_{baseKey}
      const legacyData = localStorage.getItem(legacyKey);
      if (legacyData) {
        try {
          const parsed = JSON.parse(legacyData);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Migrate to city key for next time
            try { localStorage.setItem(newKey, legacyData); } catch(_) {}
            return parsed;
          }
        } catch (e) {
          console.warn(`[DataService] Corrupt data in ${legacyKey}`);
          try { localStorage.removeItem(legacyKey); } catch(_) {}
        }
      }

      return [];
    } catch (error) {
      console.error(`[DataService] Error reading ${entityType}:`, error);
      return [];
    }
  }

  /**
   * Get single record by ID
   * @param entityType - Type of entity
   * @param id - Record ID
   * @param idField - Field name to match (default: "id")
   * @param cityId - Optional city identifier
   */
  getById<T extends { [key: string]: any }>(
    entityType: EntityType,
    id: string,
    idField: string = "id",
    cityId?: string
  ): T | undefined {
    const records = this.get<T>(entityType, cityId);
    return records.find((record) => record[idField] === id);
  }

  /**
   * Insert new record(s)
   * @param entityType - Type of entity
   * @param record - Single record or array of records
   * @param cityId - Optional city identifier
   */
  insert<T>(entityType: EntityType, record: T | T[], cityId?: string): void {
    try {
      const baseKey = STORAGE_KEYS[entityType];
      const key = buildKey(baseKey, cityId);
      const existing = this.get<T>(entityType, cityId);
      const newRecords = Array.isArray(record) ? record : [record];
      const updated = [...existing, ...newRecords];
      localStorage.setItem(key, JSON.stringify(updated));
      import.meta.env.DEV && console.log(`[DataService] Inserted ${newRecords.length} record(s) to ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuota) {
        console.warn(`[DataService] Could not insert ${entityType} — localStorage full`);
        notifyQuotaError(String(entityType));  // G1 FIX: surface to UI
      } else { console.error(`[DataService] Error inserting to ${entityType}:`, error); }
    }
  }

  /**
   * Update existing record by ID
   * @param entityType - Type of entity
   * @param id - Record ID
   * @param updates - Partial record updates
   * @param idField - Field name to match (default: "id")
   * @param cityId - Optional city identifier
   */
  update<T extends { [key: string]: any }>(
    entityType: EntityType,
    id: string,
    updates: Partial<T>,
    idField: string = "id",
    cityId?: string
  ): void {
    try {
      const baseKey = STORAGE_KEYS[entityType];
      const key = buildKey(baseKey, cityId);
      const records = this.get<T>(entityType, cityId);
      const updated = records.map((record) =>
        record[idField] === id ? { ...record, ...updates } : record
      );
      localStorage.setItem(key, JSON.stringify(updated));
      import.meta.env.DEV && console.log(`[DataService] Updated record ${id} in ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuota) {
        console.warn(`[DataService] Could not update ${entityType} — localStorage full`);
        notifyQuotaError(String(entityType));  // G1 FIX: surface to UI
      } else { console.error(`[DataService] Error updating ${entityType}:`, error); }
    }
  }

  /**
   * Delete record by ID
   * @param entityType - Type of entity
   * @param id - Record ID
   * @param idField - Field name to match (default: "id")
   * @param cityId - Optional city identifier
   */
  delete<T extends { [key: string]: any }>(
    entityType: EntityType,
    id: string,
    idField: string = "id",
    cityId?: string
  ): void {
    try {
      const baseKey = STORAGE_KEYS[entityType];
      const key = buildKey(baseKey, cityId);
      const records = this.get<T>(entityType, cityId);
      const filtered = records.filter((record) => record[idField] !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      import.meta.env.DEV && console.log(`[DataService] Deleted record ${id} from ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuota) {
        console.warn(`[DataService] Could not delete ${entityType} — localStorage full`);
        notifyQuotaError(String(entityType));
      } else { console.error(`[DataService] Error deleting from ${entityType}:`, error); }
    }
  }

  /**
   * Replace entire dataset for an entity type
   * WARNING: This overwrites all existing data
   *
   * SAFETY GUARD: EMPLOYEES key is protected - use HRDataContext write methods instead
   * @param entityType - Type of entity
   * @param records - Complete dataset to store
   * @param cityId - Optional city identifier
   */
  setAll<T>(entityType: EntityType, records: T[], cityId?: string): void {
    // CRITICAL: Prevent data corruption from multiple write sources
    if (entityType === "EMPLOYEES") {
      console.warn(
        "[DataService] ⚠️  Blocked setAll() on EMPLOYEES - use HRDataContext.addEmployee/updateEmployee/deleteEmployee instead. " +
        "This prevents data corruption from multiple writers. EmployeeContext is read-only."
      );
      return; // Block the write
    }

    try {
      const baseKey = STORAGE_KEYS[entityType];

      // CITY_CONFIG is global - don't namespace it
      if (entityType === "CITY_CONFIG") {
        const globalKey = buildLegacyKey(baseKey);
        localStorage.setItem(globalKey, JSON.stringify(records));
        import.meta.env.DEV && console.log(`[DataService] Set ${records.length} record(s) for ${entityType} (GLOBAL)`);
        return;
      }

      const key = buildKey(baseKey, cityId);
      // Skip writing large tables that exceed localStorage quota
      // Max record limits to prevent localStorage overflow
      const MAX_RECORDS: Record<string, number> = {
        jobs:               50,    // Jobs are real-time — minimal localStorage
        subscriptions:      200,   // Keep last 200 subscriptions
        customers:          200,   // Keep last 200 customers
        leads:              300,   // Keep last 300 leads
        attendance_records: 200,   // Keep last 200 attendance records
        payroll_runs:       100,   // Keep last 100 payroll runs
        finance_revenues:   100,
        finance_payables:   100,
        finance_ledger:     100,
        employee_incentives: 100,
      };
      const limit = MAX_RECORDS[baseKey];
      let recordsToStore = records as any[];
      if (limit && recordsToStore.length > limit) {
        recordsToStore = recordsToStore.slice(-limit); // Keep most recent
        import.meta.env.DEV && console.log(`[DataService] Capped ${entityType} at ${limit} records (had ${records.length})`);
      }
      try {
        localStorage.setItem(key, JSON.stringify(recordsToStore));
      } catch (e: any) {
        // Quota exceeded — free stale backups then retry with smaller slice
        const staleKeys = Object.keys(localStorage).filter(k =>
          k.startsWith("BACKUP_PAYROLL_PRE") || k.startsWith("BACKUP_SALARY_PRE")
        );
        staleKeys.forEach(k => { try { localStorage.removeItem(k); } catch(_) {} });
        try {
          localStorage.setItem(key, JSON.stringify((records as any[]).slice(0, 200)));
          console.warn(`[DataService] Quota exceeded for ${entityType} — stored 200 of ${records.length}`);
        } catch (_) {
          console.warn(`[DataService] Could not store ${entityType} — localStorage full`);
        }
      }
      import.meta.env.DEV && console.log(`[DataService] Set ${records.length} record(s) for ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      const isQuota = error instanceof DOMException && error.name === "QuotaExceededError";
      if (isQuota) { console.warn(`[DataService] Could not store ${entityType} — localStorage full`); }
      else { console.error(`[DataService] Error setting ${entityType}:`, error); }
    }
  }

  /**
   * Clear all data for an entity type
   * @param entityType - Type of entity
   * @param cityId - Optional city identifier
   */
  clear(entityType: EntityType, cityId?: string): void {
    try {
      const baseKey = STORAGE_KEYS[entityType];
      const key = buildKey(baseKey, cityId);
      localStorage.removeItem(key);
      import.meta.env.DEV && console.log(`[DataService] Cleared ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      console.error(`[DataService] Error clearing ${entityType}:`, error);
    }
  }

  /**
   * Clear ALL application data for a specific city
   * WARNING: This removes all stored data for the city
   * @param cityId - Optional city identifier (defaults to CITY-SURAT)
   */
  clearAll(cityId?: string): void {
    try {
      const city = cityId || DEFAULT_CITY;
      Object.values(STORAGE_KEYS).forEach((baseKey) => {
        const key = buildKey(baseKey, city);
        localStorage.removeItem(key);
      });
      import.meta.env.DEV && console.log(`[DataService] Cleared all data for ${city}`);
    } catch (error) {
      console.error("[DataService] Error clearing all data:", error);
    }
  }

  /**
   * Query records by filter function
   * @param entityType - Type of entity
   * @param filterFn - Filter function
   * @param cityId - Optional city identifier
   */
  query<T>(entityType: EntityType, filterFn: (record: T) => boolean, cityId?: string): T[] {
    const records = this.get<T>(entityType, cityId);
    return records.filter(filterFn);
  }

  /**
   * Count records
   * @param entityType - Type of entity
   * @param cityId - Optional city identifier
   */
  count(entityType: EntityType, cityId?: string): number {
    return this.get(entityType, cityId).length;
  }

  /**
   * Check if entity exists by ID
   * @param entityType - Type of entity
   * @param id - Record ID
   * @param idField - Field name to match (default: "id")
   * @param cityId - Optional city identifier
   */
  exists<T extends { [key: string]: any }>(
    entityType: EntityType,
    id: string,
    idField: string = "id",
    cityId?: string
  ): boolean {
    return this.getById<T>(entityType, id, idField, cityId) !== undefined;
  }
}

/**
 * Singleton instance
 * Import this in all contexts/services
 */
export const DataService = new DataServiceClass();

// ========== ONE-TIME MIGRATIONS ==========

/**
 * Migrate old attendance data to new unified system
 * Runs once on app startup
 */
function migrateAttendanceData() {
  const oldKey = "cleancar_attendance";
  const newKey = "cleancar_attendance_records";

  try {
    const oldData = localStorage.getItem(oldKey);
    const newData = localStorage.getItem(newKey);

    // Only migrate if old data exists and new doesn't
    if (oldData && !newData) {
      import.meta.env.DEV && console.log("[DataService] 🔄 Migrating attendance data from old key to unified system");
      localStorage.setItem(newKey, oldData);
      localStorage.removeItem(oldKey);
      import.meta.env.DEV && console.log("[DataService] ✅ Attendance migration complete");
    }
  } catch (error) {
    console.error("[DataService] ❌ Attendance migration failed:", error);
  }
}

// Run migration on module load
migrateAttendanceData();

/**
 * MIGRATION GUIDE
 *
 * Before:
 * ```typescript
 * const [data, setData] = useState<Employee[]>([]);
 *
 * useEffect(() => {
 *   const saved = localStorage.getItem("employees");
 *   if (saved) setData(JSON.parse(saved));
 * }, []);
 *
 * const addEmployee = (emp: Employee) => {
 *   const updated = [...data, emp];
 *   setData(updated);
 *   localStorage.setItem("employees", JSON.stringify(updated));
 * };
 * ```
 *
 * After:
 * ```typescript
 * import { DataService } from "../services/DataService";
 *
 * const [employees, setEmployees] = useState<Employee[]>([]);
 *
 * useEffect(() => {
 *   const loaded = DataService.get<Employee>("EMPLOYEES");
 *   setEmployees(loaded);
 * }, []);
 *
 * const addEmployee = (emp: Employee) => {
 *   DataService.insert("EMPLOYEES", emp);
 *   setEmployees(DataService.get<Employee>("EMPLOYEES"));
 * };
 * ```
 *
 * UPGRADE TO SUPABASE (Future)
 * Replace DataServiceClass with SupabaseDataService:
 * - Same API interface
 * - get() → supabase.from('employees').select()
 * - insert() → supabase.from('employees').insert()
 * - update() → supabase.from('employees').update()
 * - delete() → supabase.from('employees').delete()
 * - Contexts don't need to change
 */

// ── localStorage Cleanup Utility ─────────────────────────────────────────────
// Call window.__cleanStorage() in browser console to free space


// ── Startup Storage Cleanup ───────────────────────────────────────────────────
// Runs on every app start to prevent localStorage from filling up

export function startupStorageCleanup(): void {
  try {
    const usage = getStorageUsage();
    console.log(`[Storage] Usage: ${usage.usedKB}KB (${usage.pct}%)`);

    // If under 60% used, nothing to do
    if (usage.pct < 60) return;

    console.warn(`[Storage] High usage (${usage.pct}%) — running cleanup`);

    const allKeys = Object.keys(localStorage);
    let freed = 0;

    // 1. Remove backup keys (largest offenders)
    allKeys.forEach(k => {
      if (k.startsWith("BACKUP_") || k.startsWith("__temp_")) {
        try { localStorage.removeItem(k); freed++; } catch(_) {}
      }
    });

    // 2. Remove duplicate legacy keys when city-namespaced key exists
    // e.g. remove "cleancar_employees" if "cleancar_CITY-SURAT_employees" exists
    const legacyPrefixRe = /^cleancar_(?!CITY-)(.+)$/;
    allKeys.forEach(k => {
      const m = k.match(legacyPrefixRe);
      if (!m) return;
      const baseKey = m[1];
      // Check if any city-namespaced version exists
      const hasCityKey = allKeys.some(ck => ck.startsWith(`cleancar_CITY-`) && ck.endsWith(`_${baseKey}`));
      if (hasCityKey) {
        try { localStorage.removeItem(k); freed++; } catch(_) {}
      }
    });

    // 3. If still over 70%, remove non-Surat city data (Mumbai, Ahmedabad are secondary)
    if (getStorageUsage().pct > 70) {
      const selectedCity = localStorage.getItem("cleancar_selected_city") || "CITY-SURAT";
      allKeys.forEach(k => {
        if (k.startsWith("cleancar_CITY-") && !k.startsWith(`cleancar_${selectedCity}`)) {
          // Only remove large tables for other cities
          const largeTables = ["attendance_records", "jobs", "leads", "customers", "subscriptions", "revenues", "payables", "ledger"];
          if (largeTables.some(t => k.endsWith(`_${t}`))) {
            try { localStorage.removeItem(k); freed++; } catch(_) {}
          }
        }
      });
    }

    // 4. If still over 80%, remove attendance records (largest single table)
    if (getStorageUsage().pct > 80) {
      allKeys.forEach(k => {
        if (k.includes("attendance_records") || k.includes("_jobs")) {
          try { localStorage.removeItem(k); freed++; } catch(_) {}
        }
      });
    }

    if (freed > 0) {
      console.log(`[Storage] Cleanup freed ${freed} keys. New usage: ${getStorageUsage().usedKB}KB`);
    }
  } catch(e) {
    // Non-critical — never block app startup
  }
}

// Run immediately on module load
startupStorageCleanup();

export function cleanupStaleStorage(): { freed: string[], total: number } {
  const stalePatterns = [
    /^BACKUP_PAYROLL_PRE/,
    /^BACKUP_SALARY_PRE/,
    /^cleancar_.*_jobs$/,        // Jobs are re-generated from context
    /^__temp_/,
  ];

  const freed: string[] = [];
  const keys = Object.keys(localStorage);

  keys.forEach(key => {
    if (stalePatterns.some(p => p.test(key))) {
      try {
        localStorage.removeItem(key);
        freed.push(key);
      } catch (_) {}
    }
  });

  const total = keys.length;
  if (freed.length > 0) {
    console.log(`[Storage Cleanup] Freed ${freed.length} stale keys:`, freed);
  }
  return { freed, total };
}

export function getStorageUsage(): { usedKB: number, pct: number, keys: Record<string, number> } {
  const keys: Record<string, number> = {};
  let total = 0;
  Object.keys(localStorage).forEach(k => {
    const bytes = (localStorage.getItem(k) || "").length * 2;
    keys[k] = Math.round(bytes / 1024);
    total += bytes;
  });
  const sorted = Object.fromEntries(Object.entries(keys).sort(([,a],[,b]) => b - a));
  return { usedKB: Math.round(total / 1024), pct: Math.round(total / (5 * 1024 * 1024) * 100), keys: sorted };
}

// Expose to window for emergency console access
if (typeof window !== "undefined") {
  (window as any).__cleanStorage = cleanupStaleStorage;
  (window as any).__storageUsage = getStorageUsage;
}
