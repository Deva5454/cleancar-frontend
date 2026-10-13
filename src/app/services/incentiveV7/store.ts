/**
 * Incentive V7 — storage helpers over DataService.
 * All V7 entities are registered GLOBAL in DataService (each row carries city_id).
 */
import { DataService } from "../DataService";
import type {
  AuditRow, CalendarOverride, ConfigVersionRow, ConversionSale, Instalment, LedgerRow, MonthLock,
  MonthSummary, Ownership, ProvisionEntry, TseDay, V7Settings, WasherDay,
} from "./types";

type V7Entity =
  | "INC7_CONFIG_VERSIONS" | "INC7_SETTINGS" | "INC7_CALENDAR" | "INC7_MONTH_LOCKS" | "INC7_AUDIT"
  | "INC7_WASHER_DAYS" | "INC7_TSE_DAYS" | "INC7_MONTH_SUMMARIES" | "INC7_OWNERSHIP"
  | "INC7_SALES" | "INC7_INSTALMENTS" | "INC7_LEDGER" | "INC7_PROVISION";

interface EntityMap {
  INC7_CONFIG_VERSIONS: ConfigVersionRow;
  INC7_SETTINGS: V7Settings;
  INC7_CALENDAR: CalendarOverride;
  INC7_MONTH_LOCKS: MonthLock;
  INC7_AUDIT: AuditRow;
  INC7_WASHER_DAYS: WasherDay;
  INC7_TSE_DAYS: TseDay;
  INC7_MONTH_SUMMARIES: MonthSummary;
  INC7_OWNERSHIP: Ownership;
  INC7_SALES: ConversionSale;
  INC7_INSTALMENTS: Instalment;
  INC7_LEDGER: LedgerRow;
  INC7_PROVISION: ProvisionEntry;
}

export function readAll<K extends V7Entity>(entity: K): EntityMap[K][] {
  return DataService.get<EntityMap[K]>(entity);
}

export function writeAll<K extends V7Entity>(entity: K, rows: EntityMap[K][]): void {
  DataService.setAll<EntityMap[K]>(entity, rows);
}

/** Insert or replace rows by `id`. One read and one write per call. */
export function upsertMany<K extends V7Entity>(entity: K, rows: EntityMap[K][]): void {
  if (rows.length === 0) return;
  const existing = readAll(entity) as Array<{ id: string }>;
  const index = new Map(existing.map((r, i) => [r.id, i] as const));
  for (const r of rows as unknown as Array<{ id: string }>) {
    const at = index.get(r.id);
    if (at == null) { index.set(r.id, existing.length); existing.push(r); }
    else existing[at] = r;
  }
  writeAll(entity, existing as unknown as EntityMap[K][]);
}

export function audit(actor: string, action: string, entity: string, entityId?: string, detail?: string): void {
  const row: AuditRow = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(), actor, action, entity, entity_id: entityId, detail,
  };
  const all = readAll("INC7_AUDIT");
  all.push(row);
  // keep the log bounded so localStorage is never exhausted by auditing
  writeAll("INC7_AUDIT", all.slice(-1500));
}

export function isMonthLocked(month: string): boolean {
  return readAll("INC7_MONTH_LOCKS").some((l) => l.month === month);
}
