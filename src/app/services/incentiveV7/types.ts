/**
 * Incentive V7 — types
 * The 7 Oct incentive plan (washers FT/PT, TSE, TSM). Runs ALONGSIDE the legacy
 * engines (incentiveEngineService.ts, incentiveStructureV6.ts, teleSalesExecutiveService.ts,
 * teleSalesManagerService.ts), which are intentionally left untouched as a fallback.
 * See incentive-handover/ for the rulebook and developer notes.
 */

export type Family = "PACK2" | "PACK4" | "DAILY_SUB";
export type Term = 1 | 3 | 6;
export type SaleClass = "NEW_ONE_TIME" | "REPEAT_CONVERSION" | "RENEWAL" | "UPGRADE" | "PACKAGE_NO_INCENTIVE";
export type InstalmentStatus = "PENDING" | "ELIGIBLE" | "RELEASED" | "FORFEITED";
export type SaleStatus = "PENDING" | "PARTIALLY_RELEASED" | "RELEASED" | "CANCELLED";
export type WashType = "EXPRESS_WASH" | "SMART_WASH" | "ELITE_WASH";
export type WeightType = "default" | "interior_deep_clean_chemical";
export type IncentiveRole = "FT_WASHER" | "PT_WASHER" | "TSE" | "TSM";
export type IncentiveMode = "legacy" | "shadow" | "v7";

export interface IncentiveConfig {
  version: number;
  effective_from: string;
  currency: "INR";
  gst_divisor: number;
  calendar: { weekly_offs_per_month: number; working_days_rule: string };
  washer: {
    unit_weights: Record<string, number>;
    sla_minutes: number;
    sla_unknown_counts_as_met: boolean;
    holiday_units_count_toward_slab: boolean;
    full_time: {
      slab: { start_unit: number; rate_per_unit: number; bonus_unit: number; bonus_amount: number };
      guard: { enabled: boolean; pct_of_ex_gst_revenue: number; monthly_cap_per_washer: number | null };
    };
    part_time: { threshold_cars: number; rate_per_car: number; cap_cars: number; pay_on: string; shift: string };
  };
  tse: {
    counted_one_time_wash_types: WashType[];
    daily_slab: { per_car_start: number; per_car_rate: number; milestones: { at: number; bonus: number }[] };
    conversion: {
      window_days: number;
      window_start: string;
      matrix: Record<Family, Record<string, number>>;
      renewals: number[];
      wash_milestones: Record<string, number>;
      upgrades: Record<string, number>;
    };
    instalments: {
      checkpoint_months: number[];
      first_share_by_term: Record<string, number>;
      remainder: string;
      rounding: string;
      due_date_rule: string;
      payroll_cutoff: string;
      clawback_enabled: boolean;
    };
    exit_rule: { pay_instalments_with_payroll_month_up_to: string; forfeit_rest: boolean };
  };
  tsm: {
    volume_tiers: { washes: number; bonus: number }[];
    volume_counts_all_one_time_washes_including_water: boolean;
    conversion_tiers: { rate_pct: number; bonus: number }[];
    conversion_rate_definition: string | null;
  };
  accounting: { book_provision_at_sale: boolean; washer_and_one_time_booked: string; payout: string };
}

export interface ConfigVersionRow {
  id: string;
  version: number;
  effective_from: string;
  config: IncentiveConfig;
  created_by: string;
  created_at: string;
  reason: string;
}

export interface ConversionSale {
  id: string;                 // SALE-<source>-<sourceId>
  sale_txn_id: string;
  source: "BUNDLE" | "SUBSCRIPTION";
  customer_id: string;
  vehicle_id: string;
  city_id: string;
  tse_id: string;
  classification: SaleClass;
  family: Family;
  term_months: number;
  renewal_number?: number;
  upgrade_key?: string;
  sale_date: string;
  plan_start: string;
  total_incentive: number;
  status: SaleStatus;
  config_version: number;
  cancelled_on?: string | null;
  refunded_on?: string | null;
  payment_received: boolean;
  created_at: string;
}

export interface Instalment {
  id: string;                 // INST-<saleId>-<seq>
  sale_id: string;
  tse_id: string;
  city_id: string;
  seq: number;
  checkpoint_month: number;
  due_date: string;
  payroll_month: string;      // YYYY-MM
  amount: number;
  status: InstalmentStatus;
  forfeit_reason?: "CANCEL_BEFORE_DUE" | "REFUND_BEFORE_DUE" | "TSE_EXIT";
  ledger_id?: string;
  updated_at: string;
}

export interface Ownership {
  id: string;
  customer_id: string;
  vehicle_id: string;
  city_id: string;
  primary_tse_id: string;
  first_paid_one_time_wash_date: string;
  first_paid_job_id: string;
  conversion_window_end: string;
  owner_changed_by?: string;
  owner_changed_at?: string;
  created_at: string;
}

export interface WasherDay {
  id: string;                 // <washerId>|<date>
  washer_id: string;
  city_id: string;
  work_date: string;
  employment_type: "FULL_TIME" | "PART_TIME";
  is_holiday: boolean;
  units: number;
  cars: number;
  ex_gst_revenue: number;
  slab_amount: number;
  guard_limit: number | null;
  amount: number;
  guard_limited: boolean;
  config_version: number;
  calculated_at: string;
}

export interface TseDay {
  id: string;                 // <tseId>|<date>
  tse_id: string;
  city_id: string;
  work_date: string;
  counted_washes: number;
  all_one_time: number;
  amount: number;
  config_version: number;
  calculated_at: string;
}

export interface MonthSummary {
  id: string;                 // <role>|<employeeId>|<month>
  employee_id: string;
  employee_name: string;
  city_id: string;
  role: IncentiveRole;
  month: string;
  days_counted?: number;
  cars_counted?: number;
  team_washes?: number;
  conversion_rate?: number | null;
  volume_bonus?: number;
  conversion_bonus?: number;
  gross_amount: number;
  capped_amount: number;
  status: "OPEN" | "ELIGIBLE" | "RELEASED";
  updated_at: string;
}

export interface LedgerRow {
  id: string;
  city_id: string;
  employee_id: string;
  employee_name: string;
  role: IncentiveRole;
  component: "WASHER_MONTH" | "TSE_ONE_TIME_MONTH" | "TSE_INSTALMENT" | "TSM_VOLUME" | "TSM_CONVERSION";
  payroll_month: string;      // YYYY-MM
  amount: number;
  source_id: string;
  status: "ELIGIBLE" | "RELEASED" | "REVERSED";
  payroll_run_id?: string;
  adjustment_id?: string;
  idempotency_key: string;
  created_at: string;
  released_at?: string;
}

export interface ProvisionEntry {
  id: string;
  city_id: string;
  event: "SALE" | "RELEASE" | "FORFEIT";
  sale_id: string;
  instalment_id?: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  posting_date: string;
  created_at: string;
}

export interface AuditRow {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  entity_id?: string;
  detail?: string;
}

export interface MonthLock { id: string; month: string; locked_by: string; locked_at: string }

export interface V7Settings {
  id: "settings";
  mode: IncentiveMode;
  last_run_at?: string;
  last_run_summary?: string;
}

export interface CalendarOverride { id: string; month: string; working_days: number | null }
