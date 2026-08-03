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

// All real cities — used to merge-read/split-write entity types whose
// records each carry their own .cityId (Finance + accounting buckets)
const ALL_CITY_IDS = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"] as const;

/**
 * One-time migration: LEAVE_REQUESTS was used as a DataService entityType
 * before it was registered in STORAGE_KEYS below, so every read/write
 * silently built keys like "cleancar_CITY-SURAT_undefined" (baseKey
 * resolved to JS's literal `undefined`). Once LEAVE_REQUESTS gets a proper
 * "leave_requests" key, any data already saved under the broken key
 * (including anything submitted on the live site before this fix) would
 * become invisible. This runs once, copies that data to the correct key,
 * and removes the broken one — safe to run repeatedly, it's a no-op once
 * the broken keys are gone.
 */
function migrateLeaveRequestsFromBrokenKey() {
  const MIGRATION_FLAG = "cleancar_migration_leave_requests_v1_done";
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    const cityIds = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];
    for (const cityId of cityIds) {
      const brokenKey = `cleancar_${cityId}_undefined`;
      const properKey = `cleancar_${cityId}_leave_requests`;
      const broken = localStorage.getItem(brokenKey);
      if (broken) {
        const existing = localStorage.getItem(properKey);
        if (existing) {
          // Merge rather than overwrite, in case both somehow have data
          try {
            const merged = [...JSON.parse(existing), ...JSON.parse(broken)];
            localStorage.setItem(properKey, JSON.stringify(merged));
          } catch { /* corrupt data on either side — keep the proper key as-is */ }
        } else {
          localStorage.setItem(properKey, broken);
        }
        localStorage.removeItem(brokenKey);
      }
    }

    // Legacy (non-city-namespaced) broken key
    const legacyBroken = localStorage.getItem("cleancar_undefined");
    if (legacyBroken) {
      const legacyProper = localStorage.getItem("cleancar_leave_requests");
      if (legacyProper) {
        try {
          const merged = [...JSON.parse(legacyProper), ...JSON.parse(legacyBroken)];
          localStorage.setItem("cleancar_leave_requests", JSON.stringify(merged));
        } catch { /* keep proper key as-is */ }
      } else {
        localStorage.setItem("cleancar_leave_requests", legacyBroken);
      }
      localStorage.removeItem("cleancar_undefined");
    }

    localStorage.setItem(MIGRATION_FLAG, "true");
  } catch (e) {
    console.warn("[DataService] LEAVE_REQUESTS migration skipped:", e);
  }
}
migrateLeaveRequestsFromBrokenKey();

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
  STOCK_BATCHES:           "stock_batches",           // InventoryContext — real, per-batch FIFO cost tracking
  EQUIPMENT_UNITS:         "equipment_units",         // InventoryContext — real, per-serial equipment tracking
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
  EXIT_SETTLEMENTS:         "exit_settlements",  // Exit & F&F Settlement module
  EXIT_WORKFLOWS:           "exit_workflows",    // Exit workflow service (employee lock/status)
  LEAVE_REQUESTS:           "leave_requests",    // Leave request submit/approve/reject workflow
  WASHER_GPS_VIOLATIONS:    "washer_gps_violations", // Auto-checkout on GPS off + City Manager re-check-in approval
  RECURRING_TEMPLATES:      "recurring_templates",   // Saved monthly-recurring transaction templates
  REFUND_REQUESTS:          "refund_requests",       // Customer refund requests, real approval workflow
  GIFT_SUBSCRIPTIONS:       "gift_subscriptions",     // Gift-a-wash requests, real staff payment confirmation + redemption
  CALLBACK_REQUESTS:        "callback_requests",       // Real customer callback requests, real office-hours validation
  DILUTION_RECIPES:         "dilution_recipes",         // Real concentrate-to-bottled-product recipes, real yield/cost
  BOTTLE_RETURN_TRANSACTIONS: "bottle_return_transactions", // Real empty-bottle reverse-logistics transactions
  ACCOUNTING_ITEM_MASTER:  "accounting_item_master", // Real accounting expense items - previously, incorrectly shared the INVENTORY_ITEMS key with the physical inventory system
  // ── Fix: these 3 were referenced via DataService.get("ACCOUNTING_ENTRIES"/
  // "JOURNAL_ENTRIES"/"LEDGER_MASTERS") throughout accountingEntryService.ts
  // but were never registered here. Since EntityType is a plain string key
  // lookup with no runtime validation, every read/write silently resolved
  // to the literal key "cleancar_{cityId}_undefined" instead of erroring —
  // colliding with anything else that made the same mistake (confirmed:
  // real Payroll payslip records were also landing at that exact key) and
  // never reaching the real accounting data sitting under its own,
  // correctly-named legacy key.
  ACCOUNTING_ENTRIES:      "accounting_entries",
  JOURNAL_ENTRIES:         "journal_entries",
  LEDGER_MASTERS:          "ledger_masters",
  // ── Same class of bug, found later: payrollMaster.ts and VendorPayment.tsx
  // also called DataService.get()/setAll() with entity-type strings never
  // registered here, colliding at the same broken "undefined" key above.
  PAYROLL_MASTER:          "payroll_master",
  VENDOR_PAYMENT_STATUS:   "vendor_payment_status",
  // ── Same class of bug, found later still: CorporateB2BPortal.tsx called
  // DataService.get()/setAll() with the raw literal key string
  // "cleancar_corporate_accounts" instead of a registered EntityType,
  // colliding at the same broken "cleancar_{cityId}_undefined" key —
  // real corporate accounts were never reliably saved, and whatever
  // foreign data from another broken call site ended up there was read
  // back as if it were CorporateAccount[], crashing on missing fields.
  CORPORATE_ACCOUNTS:      "corporate_accounts",
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
          // Real fix: was .slice(0, 200) — kept the OLDEST 200 records and
          // silently discarded the newest ones (the opposite of every other
          // capping path in this file, which keeps the most recent). A user
          // who just entered new real data could have it dropped while
          // stale data was preserved.
          localStorage.setItem(key, JSON.stringify((records as any[]).slice(-200)));
          console.warn(`[DataService] Quota exceeded for ${entityType} — stored most recent 200 of ${records.length}`);
          notifyQuotaError(entityType);
        } catch (_) {
          console.warn(`[DataService] Could not store ${entityType} — localStorage full`);
          notifyQuotaError(entityType);
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
   * Merge-read a real per-record-cityId collection across all 3 real
   * cities' own physical keys. Use for entity types where every record
   * already carries its own real .cityId (Finance buckets, accounting
   * entries/journals/ledgers) — calling get() without a cityId always
   * resolves to CITY-SURAT's key alone, which would silently drop the
   * other two cities' data instead of merging it in.
   *
   * Real fix: reads each city's own physical key DIRECTLY, deliberately
   * bypassing get()'s normal per-city legacy-key fallback. That fallback
   * is correct for a single-city read (an empty city key legitimately
   * falls back to the one shared legacy key), but here it back-fires:
   * seed data writes the FULL, all-cities dataset to that same bare
   * legacy key (for other unrelated legacy readers), so any city whose
   * own key is still empty would silently inherit — and double-count —
   * every other city's records too.
   * @param entityType - Type of entity
   */
  getAllCities<T>(entityType: EntityType): T[] {
    const baseKey = STORAGE_KEYS[entityType];
    return ALL_CITY_IDS.flatMap((cid) => {
      try {
        const raw = localStorage.getItem(buildKey(baseKey, cid));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
      } catch {
        return [];
      }
    });
  }

  /**
   * Split-write a real per-record-cityId collection: groups records by
   * their own .cityId field and writes each group to that city's own
   * physical key via setAll (so each city gets its own MAX_RECORDS cap
   * instead of all 3 cities competing for one shared cap/key). Pass the
   * FULL, all-cities array every time — a city with zero records still
   * gets its key rewritten to empty, so deletions persist correctly.
   * @param entityType - Type of entity
   * @param records - Complete, all-cities dataset to store
   */
  setAllByRecordCity<T extends { cityId?: string }>(entityType: EntityType, records: T[]): void {
    const groups: Record<string, T[]> = {};
    for (const cid of ALL_CITY_IDS) groups[cid] = [];
    for (const r of records) {
      const cid = (r && r.cityId) || DEFAULT_CITY;
      (groups[cid] || groups[DEFAULT_CITY]).push(r);
    }
    for (const cid of ALL_CITY_IDS) {
      this.setAll(entityType, groups[cid], cid);
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

/**
 * One-time migration: FinanceContext's 7 buckets (payables, revenues, mrr,
 * ledger, finance_budgets, finance_alerts, finance_recommendations) and
 * accountingEntryService's 3 buckets (accounting_entries, journal_entries,
 * ledger_masters) were all read/written via DataService.get/setAll with no
 * cityId argument — every call silently resolved to the single
 * CITY-SURAT-keyed entry, even though every record in these buckets
 * carries its own real .cityId. All 3 cities' data has been living in that
 * one shared key the whole time, isolated only by in-memory
 * .filter(r => r.cityId === X) calls made by consumers elsewhere. This
 * splits whatever's sitting there today out to each record's own real
 * city-namespaced key — safe to run repeatedly, a no-op once split.
 */
const FINANCE_ACCOUNTING_SHARED_BASE_KEYS = [
  "payables", "revenues", "mrr", "ledger",
  "finance_budgets", "finance_alerts", "finance_recommendations",
  "accounting_entries", "journal_entries", "ledger_masters",
];
function migrateFinanceAccountingSharedKeysToPerCity() {
  const MIGRATION_FLAG = "cleancar_migration_finance_accounting_per_city_v1_done";
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;

    for (const baseKey of FINANCE_ACCOUNTING_SHARED_BASE_KEYS) {
      const suratKey = `cleancar_CITY-SURAT_${baseKey}`;
      const raw = localStorage.getItem(suratKey);
      if (!raw) continue;

      let records: any[];
      try {
        records = JSON.parse(raw);
      } catch {
        continue; // corrupt — leave untouched, DataService.get()'s own corrupt-key handling will clean it up
      }
      if (!Array.isArray(records) || records.length === 0) continue;

      const byCity: Record<string, any[]> = { "CITY-SURAT": [], "CITY-MUMBAI": [], "CITY-AHMEDABAD": [] };
      for (const r of records) {
        const cid = (r && r.cityId) || "CITY-SURAT";
        (byCity[cid] || byCity["CITY-SURAT"]).push(r);
      }

      // Only drop a city's records out of the Surat key once they're
      // confirmed written to their own key — a failed write (e.g. quota)
      // must not silently lose data, so those records stay put on Surat.
      const suratRecords = [...byCity["CITY-SURAT"]];
      for (const cid of ["CITY-MUMBAI", "CITY-AHMEDABAD"]) {
        if (byCity[cid].length === 0) continue;
        const destKey = `cleancar_${cid}_${baseKey}`;
        try {
          const existingRaw = JSON.parse(localStorage.getItem(destKey) || "[]");
          const existing = Array.isArray(existingRaw) ? existingRaw : [];
          const existingIds = new Set(existing.map((e: any) => e?.id));
          const merged = [...existing, ...byCity[cid].filter((r: any) => !existingIds.has(r?.id))];
          localStorage.setItem(destKey, JSON.stringify(merged));
        } catch {
          suratRecords.push(...byCity[cid]); // write failed — keep these records safe on the Surat key instead
        }
      }

      // Rewrite the Surat key to hold only its own real records (plus any
      // other city's records that failed to migrate above)
      localStorage.setItem(suratKey, JSON.stringify(suratRecords));
    }

    localStorage.setItem(MIGRATION_FLAG, "true");
  } catch (e) {
    console.warn("[DataService] Finance/accounting per-city migration skipped:", e);
  }
}
migrateFinanceAccountingSharedKeysToPerCity();

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
