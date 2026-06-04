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
} as const;

type EntityType = keyof typeof STORAGE_KEYS;

/**
 * Generic DataService interface
 * Each entity type can be stored/retrieved using these methods
 */
class DataServiceClass {
  // In-memory read cache to reduce repeated JSON.parse() calls on every context render
  private readCache = new Map<string, { data: unknown; timestamp: number }>();
  private readonly CACHE_TTL = 2000; // 2 seconds — freshness vs performance balance
  
  private getCacheKey(entityType: string, cityId?: string): string {
    return cityId ? `${entityType}:${cityId}` : entityType;
  }
  
  clearCache(entityType?: string): void {
    if (!entityType) { this.readCache.clear(); return; }
    for (const key of this.readCache.keys()) {
      if (key.startsWith(entityType)) this.readCache.delete(key);
    }
  }
  /**
   * Get all records for an entity type
   * @param entityType - Type of entity to retrieve
   * @param cityId - Optional city identifier for multi-city isolation
   */
  get<T>(entityType: EntityType, cityId?: string): T[] {
    // Check in-memory cache first to avoid repeated JSON.parse() on every render
    const cacheKey = this.getCacheKey(entityType, cityId);
    const cached = this.readCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.data as T[];
    }
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

      this.readCache.set(cacheKey, { data: [], timestamp: Date.now() });
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
    this.clearCache(entityType); // invalidate cache on write
    try {
      const baseKey = STORAGE_KEYS[entityType];
      const key = buildKey(baseKey, cityId);
      const existing = this.get<T>(entityType, cityId);
      const newRecords = Array.isArray(record) ? record : [record];
      const updated = [...existing, ...newRecords];
      localStorage.setItem(key, JSON.stringify(updated));
      import.meta.env.DEV && console.log(`[DataService] Inserted ${newRecords.length} record(s) to ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      // Quota exceeded is non-fatal — log and continue (app reads from memory)
      const isQuota = error instanceof DOMException && error.name === 'QuotaExceededError';
      if (isQuota) {
        console.warn(`[DataService] Quota exceeded inserting to ${entityType} — skipped`);
      } else {
        console.error(`[DataService] Error inserting to ${entityType}:`, error);
      }
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
      const isQuota = error instanceof DOMException && error.name === 'QuotaExceededError';
      if (isQuota) {
        console.warn(`[DataService] Quota exceeded updating ${entityType} — skipped`);
      } else {
        console.error(`[DataService] Error updating ${entityType}:`, error);
      }
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
      const isQuota = error instanceof DOMException && error.name === 'QuotaExceededError';
      if (isQuota) {
        console.warn(`[DataService] Quota exceeded deleting from ${entityType} — skipped`);
      } else {
        console.error(`[DataService] Error deleting from ${entityType}:`, error);
      }
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
      // Proactively purge low-priority data if storage is near limit
      if (records.length > 50) this.purgeIfNearQuota();
      // Skip writing large tables that exceed localStorage quota
      const LARGE_TABLES = ["attendance_records", "jobs", "payroll_runs"];
      if (LARGE_TABLES.includes(baseKey) && records.length > 500) {
        import.meta.env.DEV && console.log(`[DataService] Skipping large table ${entityType} (${records.length} records) to avoid quota`);
        return;
      }
      try {
        localStorage.setItem(key, JSON.stringify(records));
      } catch (e) {
        // Quota exceeded — try writing smaller slice
        try {
          localStorage.setItem(key, JSON.stringify((records as any[]).slice(0, 200)));
          console.warn(`[DataService] Quota exceeded for ${entityType} — stored 200 of ${records.length}`);
        } catch (_) {
          console.warn(`[DataService] Could not store ${entityType} — localStorage full`);
        }
      }
      import.meta.env.DEV && console.log(`[DataService] Set ${records.length} record(s) for ${entityType} (${cityId || DEFAULT_CITY})`);
    } catch (error) {
      const isQuota = error instanceof DOMException && error.name === 'QuotaExceededError';
      if (isQuota) {
        console.warn(`[DataService] Quota exceeded setting ${entityType} — data only in memory`);
      } else {
        console.error(`[DataService] Error setting ${entityType}:`, error);
      }
    }
  }

  /**
   * Check storage usage and purge low-priority data if near limit.
   * Called automatically before large writes.
   */
  private purgeIfNearQuota(): void {
    try {
      let used = 0;
      for (const key of Object.keys(localStorage)) {
        used += (localStorage.getItem(key) || '').length * 2;
      }
      const pct = used / (5 * 1024 * 1024) * 100;
      if (pct < 70) return; // below 70% — no action needed

      console.warn(`[DataService] Storage at ${pct.toFixed(0)}% — purging low-priority data`);

      // Purge in order: error logs first (debug data), then retry queue, then audit logs
      const purgeable = [
        'cc360_error_log',
        'SYNC_RETRY_QUEUE',
        'cc360_retry_queue',
        'cc360_audit_trail',
      ];
      for (const key of purgeable) {
        try { localStorage.removeItem(key); } catch { /* ignore */ }
        used = 0;
        for (const k of Object.keys(localStorage)) used += (localStorage.getItem(k) || '').length * 2;
        if (used / (5 * 1024 * 1024) * 100 < 60) break; // stop once below 60%
      }
    } catch { /* ignore */ }
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
      throw error;
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
      throw error;
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
