import type { IncentiveConfig } from "./types";

/** Default 7 Oct configuration. Seeds version 1. Every value is admin-editable. */
export const DEFAULT_INCENTIVE_CONFIG: IncentiveConfig = {
  version: 1,
  effective_from: "2026-11-01",
  currency: "INR",
  gst_divisor: 1.18,
  calendar: { weekly_offs_per_month: 4, working_days_rule: "days_in_month_minus_weekly_offs" },
  washer: {
    unit_weights: { default: 1, interior_deep_clean_chemical: 2 },
    sla_minutes: 30,
    sla_unknown_counts_as_met: true,
    holiday_units_count_toward_slab: true,
    full_time: {
      slab: { start_unit: 6, rate_per_unit: 50, bonus_unit: 11, bonus_amount: 300 },
      guard: { enabled: true, pct_of_ex_gst_revenue: 0.3, monthly_cap_per_washer: null },
    },
    part_time: { threshold_cars: 300, rate_per_car: 10, cap_cars: 500, pay_on: "all_cars_from_first", shift: "05:00-10:00" },
  },
  tse: {
    counted_one_time_wash_types: ["SMART_WASH", "ELITE_WASH"],
    daily_slab: {
      per_car_start: 5,
      per_car_rate: 20,
      milestones: [
        { at: 6, bonus: 200 },
        { at: 11, bonus: 250 },
        { at: 15, bonus: 250 },
        { at: 20, bonus: 500 },
      ],
    },
    conversion: {
      window_days: 30,
      window_start: "first_completed_paid_one_time_wash",
      matrix: {
        PACK2: { "1": 50, "3": 100, "6": 150 },
        PACK4: { "1": 100, "3": 200, "6": 300 },
        DAILY_SUB: { "1": 150, "3": 350, "6": 500 },
      },
      renewals: [50, 50, 25],
      wash_milestones: { "2": 0, "3": 0, "4": 0 },
      upgrades: { PACK2_TO_PACK4: 100, PACK2_TO_DAILY_SUB: 0, PACK4_TO_DAILY_SUB: 0 },
    },
    instalments: {
      checkpoint_months: [1, 3, 6],
      first_share_by_term: { "1": 1.0, "3": 0.5, "6": 0.4 },
      remainder: "split_equally_across_later_checkpoints",
      rounding: "nearest_rupee_remainder_on_last_instalment",
      due_date_rule: "plan_start + k months - 1 day",
      payroll_cutoff: "month_end",
      clawback_enabled: false,
    },
    exit_rule: { pay_instalments_with_payroll_month_up_to: "month_of_last_working_day", forfeit_rest: true },
  },
  tsm: {
    volume_tiers: [
      { washes: 150, bonus: 1000 },
      { washes: 200, bonus: 1500 },
      { washes: 250, bonus: 2500 },
      { washes: 300, bonus: 4000 },
      { washes: 350, bonus: 5000 },
    ],
    volume_counts_all_one_time_washes_including_water: true,
    conversion_tiers: [
      { rate_pct: 15, bonus: 1000 },
      { rate_pct: 20, bonus: 2000 },
      { rate_pct: 25, bonus: 3500 },
      { rate_pct: 30, bonus: 5000 },
      { rate_pct: 35, bonus: 7500 },
    ],
    conversion_rate_definition: null,
  },
  accounting: { book_provision_at_sale: true, washer_and_one_time_booked: "month_earned", payout: "next_payroll_after_month_end" },
};
