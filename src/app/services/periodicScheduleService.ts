/**
 * periodicScheduleService.ts
 *
 * Option B — Subscription-start-date anchored periodic scheduling.
 *
 * RULES:
 *   1. First periodic service date = subscriptionStartDate + interval days
 *      PROTECT: shampoo 2×/month + interior vacuum 2×/month + tyre dressing 1×/month + fragrance 1×/month
 *      ELITE:   shampoo 4×/month + dashboard 2×/month + interior vacuum 2×/month + tyre dressing 2×/month + wax 1×/month + engine bay 1×/month
 *      ELITE_2W: shampoo 2×/month
 *
 *   2. Supervisor can reschedule a periodic date within the billing month.
 *      The new date replaces only that occurrence — next is still calculated
 *      from the original anchor.
 *
 *   3. Monthly cap: customer cannot receive more periodic services than their
 *      plan allows in any calendar month, even after rescheduling.
 *      PROTECT: max 2 shampoo + 2 interior + 1 tyre + 1 fragrance per calendar month
 *      ELITE:   max 4 shampoo + 2 dashboard + 2 interior + 2 tyre + 1 wax + 1 engine per calendar month
 *
 *   4. If a periodic service was already completed this month, the cap is
 *      consumed and it cannot be rescheduled to occur again that month.
 *
 * Storage: localStorage key "cleancar_periodic_schedules"
 * Shape: Record<customerId, CustomerPeriodicSchedule>
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type PeriodicServiceType =
  | "shampoo"
  | "wax"
  | "interior"
  | "tyre"
  | "dashboard"
  | "engine"
  | "fragrance";

export interface PeriodicOccurrence {
  id: string;                    // e.g. "CUST-001-shampoo-2026-05"
  customerId: string;
  serviceType: PeriodicServiceType;
  scheduledDate: string;         // ISO date (YYYY-MM-DD) — default or rescheduled
  originalDate: string;          // ISO date — the anchor-computed date, never changes
  billingMonth: string;          // YYYY-MM — which month's allowance this consumes
  status: "scheduled" | "completed" | "skipped" | "rescheduled";
  completedDate?: string;        // set when status = completed
  rescheduledBy?: string;        // supervisorId who rescheduled
  rescheduledAt?: string;        // ISO timestamp
  rescheduleReason?: string;
}

export interface CustomerPeriodicSchedule {
  customerId: string;
  customerName: string;
  packageType: string;           // EXPRESS_WASH | SMART_WASH | ELITE_WASH | ELITE_2W
  subscriptionStartDate: string; // YYYY-MM-DD anchor date
  occurrences: PeriodicOccurrence[];
}

export interface MonthlyUsage {
  shampoo:   { used: number; cap: number };
  wax:       { used: number; cap: number };
  interior:  { used: number; cap: number };
  tyre:      { used: number; cap: number };
  dashboard:  { used: number; cap: number };
  engine:     { used: number; cap: number };
  fragrance:  { used: number; cap: number };
}

export interface RescheduleResult {
  success: boolean;
  error?: "cap_reached" | "already_completed" | "out_of_month" | "not_found";
  message: string;
}

// ── Plan config ───────────────────────────────────────────────────────────────

interface PlanPeriodicConfig {
  services: PeriodicServiceType[];
  intervalDays: number;           // days between occurrences of each service
  monthlyCaps: Record<PeriodicServiceType, number>;
}

const PLAN_CONFIG: Record<string, PlanPeriodicConfig> = {
  SHINE: {
    services: [],
    intervalDays: 0,
    monthlyCaps: { shampoo: 0, wax: 0, glass: 0, tyre: 0, interior: 0 },
  },
  PROTECT: {
    // fortnightly: shampoo 2×/month + interior vacuum 2×/month + tyre dressing 1×/month + fragrance 1×/month
    services: ["shampoo", "interior", "tyre", "fragrance"],
    intervalDays: 15,             // fortnightly = 2× per month
    monthlyCaps: { shampoo: 2, wax: 0, glass: 0, tyre: 1, interior: 2, dashboard: 0, engine: 0, fragrance: 1 },
  },
  ELITE: {
    // weekly shampoo 4×/month + fortnightly dashboard 2×/month + fortnightly interior 2×/month
    // + fortnightly tyre dressing 2×/month + monthly wax 1×/month + monthly engine bay 1×/month
    services: ["shampoo", "dashboard", "interior", "tyre", "wax", "engine", "fragrance"],
    intervalDays: 7,              // weekly shampoo (4×/month); others override per service
    monthlyCaps: { shampoo: 4, wax: 1, glass: 0, tyre: 2, interior: 2, dashboard: 2, engine: 1, fragrance: 1 },
  },
  ELITE_2W: {
    services: ["shampoo"],
    intervalDays: 15,
    monthlyCaps: { shampoo: 2, wax: 0, glass: 0, tyre: 0, interior: 0 },
  },
};

// Wax, engine bay: 1×/month for ELITE regardless of intervalDays (weekly for shampoo)
const WAX_INTERVAL_DAYS = 30;

// ── Service metadata (display) ────────────────────────────────────────────────

export const PERIODIC_SERVICE_META: Record<string, {
  name: string; nameHindi: string; icon: string;
}> = {
  shampoo:   { name: "SMART_WASH",              nameHindi: "Shampoo Wash — foam lagao, deep clean karo",      icon: "🧴" },
  wax:       { name: "Hand Wax Polish",            nameHindi: "Wax lagao — UV protection + showroom shine",      icon: "✨" },
  interior:  { name: "Interior Vacuum & Mat Clean",nameHindi: "Andar saaf karo — vacuum + mat clean",            icon: "🪣" },
  tyre:      { name: "Tyre Dressing",              nameHindi: "Tyre dressing lagao — shine coat protection",      icon: "🛞" },
  dashboard: { name: "Dashboard & Console Clean",  nameHindi: "Dashboard aur console saaf karo — deep polish",   icon: "🧹" },
  engine:    { name: "Engine Bay Dry Blow",         nameHindi: "Engine bay saaf karo — sirf dry blow, pani nahi", icon: "⚙️" },
  fragrance: { name: "Car Fragrance",                nameHindi: "Car fragrance spray — cabin ke liye",              icon: "🌸" },
};

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cleancar_periodic_schedules";

// ── Core service class ────────────────────────────────────────────────────────

class PeriodicScheduleService {

  // ── Read / write ───────────────────────────────────────────────────────────

  private readAll(): Record<string, CustomerPeriodicSchedule> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private writeAll(data: Record<string, CustomerPeriodicSchedule>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private readCustomer(customerId: string): CustomerPeriodicSchedule | null {
    return this.readAll()[customerId] ?? null;
  }

  private writeCustomer(schedule: CustomerPeriodicSchedule): void {
    const all = this.readAll();
    all[schedule.customerId] = schedule;
    this.writeAll(all);
  }

  // ── Date helpers ───────────────────────────────────────────────────────────

  private addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  }

  private toYM(dateStr: string): string {
    return dateStr.slice(0, 7); // YYYY-MM
  }

  private today(): string {
    return new Date().toISOString().split("T")[0];
  }

  private daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  private isInMonth(dateStr: string, billingMonth: string): boolean {
    return dateStr.startsWith(billingMonth);
  }

  // ── Occurrence ID ──────────────────────────────────────────────────────────

  private occId(customerId: string, serviceType: PeriodicServiceType,
                 billingMonth: string, index: number): string {
    return `${customerId}-${serviceType}-${billingMonth}-${index}`;
  }

  // ── Generate all occurrences for a customer from startDate → 12 months ahead

  private generateOccurrences(
    customerId: string,
    packageType: string,
    subscriptionStartDate: string,
  ): PeriodicOccurrence[] {
    const config = PLAN_CONFIG[packageType];
    if (!config || config.services.length === 0) return [];

    const occurrences: PeriodicOccurrence[] = [];
    const horizonMonths = 3; // generate 3 months ahead
    const today = this.today();
    const [sy, sm] = today.split("-").map(Number);

    for (let mOffset = 0; mOffset <= horizonMonths; mOffset++) {
      const year  = sm + mOffset > 12 ? sy + 1 : sy;
      const month = ((sm - 1 + mOffset) % 12) + 1;
      const billingMonth = `${year}-${String(month).padStart(2, "0")}`;

      // For each service in the plan, compute how many times it falls in this month
      for (const svc of config.services) {
        const interval = svc === "wax" ? WAX_INTERVAL_DAYS : config.intervalDays;
        const cap      = config.monthlyCaps[svc];
        if (cap === 0) continue;

        // Walk from subscriptionStartDate forward in interval steps until we pass this month
        let cursor = subscriptionStartDate;
        // Advance cursor to first occurrence after subscription start
        cursor = this.addDays(cursor, interval);

        // Collect all occurrences in this billing month
        const inMonth: string[] = [];
        // Max 366 iterations safety
        for (let iter = 0; iter < 366 && inMonth.length < cap; iter++) {
          if (cursor > `${billingMonth}-31`) break;
          if (this.toYM(cursor) === billingMonth) inMonth.push(cursor);
          cursor = this.addDays(cursor, interval);
        }

        inMonth.slice(0, cap).forEach((date, idx) => {
          occurrences.push({
            id:            this.occId(customerId, svc, billingMonth, idx),
            customerId,
            serviceType:   svc,
            scheduledDate: date,
            originalDate:  date,
            billingMonth,
            status:        "scheduled",
          });
        });
      }
    }

    return occurrences;
  }

  // ── Public: initialise a customer's schedule ───────────────────────────────

  initCustomer(
    customerId: string,
    customerName: string,
    packageType: string,
    subscriptionStartDate: string,
  ): void {
    const existing = this.readCustomer(customerId);
    // Don't overwrite existing schedule
    if (existing) return;

    const occurrences = this.generateOccurrences(customerId, packageType, subscriptionStartDate);
    this.writeCustomer({ customerId, customerName, packageType, subscriptionStartDate, occurrences });
  }

  // ── Public: get all occurrences for a customer ─────────────────────────────

  getCustomerOccurrences(customerId: string): PeriodicOccurrence[] {
    return this.readCustomer(customerId)?.occurrences ?? [];
  }

  // ── Public: get today's due services for a customer ───────────────────────
  // Used by computePeriodicFlagsB() — called for every job card the washer sees

  getTodayServices(customerId: string, today?: string): PeriodicOccurrence[] {
    const d = today ?? this.today();
    return this.getCustomerOccurrences(customerId)
      .filter(o => o.scheduledDate === d && o.status === "scheduled");
  }

  // ── Public: monthly usage summary ─────────────────────────────────────────

  getMonthlyUsage(customerId: string, billingMonth?: string): MonthlyUsage {
    const month = billingMonth ?? this.toYM(this.today());
    const occs  = this.getCustomerOccurrences(customerId)
      .filter(o => o.billingMonth === month);

    const pkg    = this.readCustomer(customerId)?.packageType ?? "EXPRESS_WASH";
    const config = PLAN_CONFIG[pkg] ?? PLAN_CONFIG.EXPRESS_WASH;

    const count = (svc: PeriodicServiceType, statuses: string[]) =>
      occs.filter(o => o.serviceType === svc && statuses.includes(o.status)).length;

    const used = (svc: PeriodicServiceType) =>
      count(svc, ["completed", "rescheduled", "scheduled"]);

    return {
      shampoo:  { used: used("shampoo"),  cap: config.monthlyCaps.shampoo  },
      wax:      { used: used("wax"),      cap: config.monthlyCaps.wax      },
      glass:    { used: used("dashboard"),    cap: config.monthlyCaps.glass    },
      tyre:     { used: used("tyre"),     cap: config.monthlyCaps.tyre     },
      interior: { used: used("interior"), cap: config.monthlyCaps.interior },
    };
  }

  // ── Public: supervisor reschedule ─────────────────────────────────────────
  //
  // Supervisor picks a new date for a specific occurrence.
  // Rules enforced:
  //   (a) New date must be in the SAME billing month as original
  //   (b) Occurrence must not already be completed
  //   (c) Cap for that service in that month must not be exceeded
  //       (i.e. another occurrence of the same type isn't already scheduled/completed on different day)

  reschedule(
    customerId: string,
    occurrenceId: string,
    newDate: string,
    supervisorId: string,
    reason: string,
  ): RescheduleResult {
    const schedule = this.readCustomer(customerId);
    if (!schedule) {
      return { success: false, error: "not_found", message: "Customer schedule not found." };
    }

    const idx = schedule.occurrences.findIndex(o => o.id === occurrenceId);
    if (idx === -1) {
      return { success: false, error: "not_found", message: "Occurrence not found." };
    }

    const occ = schedule.occurrences[idx];

    // Rule (b): already completed
    if (occ.status === "completed") {
      return { success: false, error: "already_completed",
        message: `${PERIODIC_SERVICE_META[occ.serviceType].name} on ${occ.scheduledDate} is already completed. Cannot reschedule.` };
    }

    // Rule (a): must stay in same billing month
    if (!this.isInMonth(newDate, occ.billingMonth)) {
      return { success: false, error: "out_of_month",
        message: `New date must be within billing month ${occ.billingMonth}. Requested: ${newDate}.` };
    }

    // Rule (c): cap — check if another occurrence of same type already exists in this month
    //  (other than the one being rescheduled itself)
    const config    = PLAN_CONFIG[schedule.packageType];
    const cap       = config?.monthlyCaps[occ.serviceType] ?? 0;
    const otherSame = schedule.occurrences.filter(o =>
      o.id !== occurrenceId &&
      o.serviceType === occ.serviceType &&
      o.billingMonth === occ.billingMonth &&
      ["completed", "scheduled", "rescheduled"].includes(o.status)
    ).length;

    if (otherSame >= cap) {
      return { success: false, error: "cap_reached",
        message: `Monthly cap reached for ${PERIODIC_SERVICE_META[occ.serviceType].name}. Max ${cap}×/month on this plan. Customer cannot receive an extra service.` };
    }

    // All checks passed — apply reschedule
    schedule.occurrences[idx] = {
      ...occ,
      scheduledDate:    newDate,
      status:           "rescheduled",
      rescheduledBy:    supervisorId,
      rescheduledAt:    new Date().toISOString(),
      rescheduleReason: reason,
    };

    this.writeCustomer(schedule);

    return {
      success: true,
      message: `${PERIODIC_SERVICE_META[occ.serviceType].name} rescheduled to ${newDate}.`,
    };
  }

  // ── Public: reset a skipped occurrence back to scheduled ─────────────────
  // Called by periodicNotificationService when a customer confirms (or
  // auto-confirms) a service that was previously marked skipped.
  // Ensures getTodayServices() picks it up for the washer's checklist.

  resetSkippedToScheduled(customerId: string, occurrenceId: string): void {
    const schedule = this.readCustomer(customerId);
    if (!schedule) return;
    const idx = schedule.occurrences.findIndex(o => o.id === occurrenceId);
    if (idx === -1) return;
    if (schedule.occurrences[idx].status !== "skipped") return;
    schedule.occurrences[idx].status = "scheduled";
    this.writeCustomer(schedule);
  }

  // ── Public: mark occurrence completed (called when washer finishes) ─────────

  markCompleted(customerId: string, occurrenceId: string): void {
    const schedule = this.readCustomer(customerId);
    if (!schedule) return;
    const idx = schedule.occurrences.findIndex(o => o.id === occurrenceId);
    if (idx === -1) return;
    schedule.occurrences[idx] = {
      ...schedule.occurrences[idx],
      status:        "completed",
      completedDate: this.today(),
    };
    this.writeCustomer(schedule);
  }

  // ── Public: full list for supervisor schedule view ─────────────────────────

  getAllCustomersUpcoming(days = 7): Array<{
    customerId: string;
    customerName: string;
    packageType: string;
    occurrences: PeriodicOccurrence[];
    monthlyUsage: MonthlyUsage;
  }> {
    const all  = this.readAll();
    const from = this.today();
    const to   = this.addDays(from, days - 1);

    return Object.values(all).map(cs => ({
      customerId:   cs.customerId,
      customerName: cs.customerName,
      packageType:  cs.packageType,
      occurrences:  cs.occurrences.filter(
        o => o.scheduledDate >= from && o.scheduledDate <= to
      ),
      monthlyUsage: this.getMonthlyUsage(cs.customerId),
    }));
  }

  // ── Public: seed helper — initialise from mockWasherDataService jobs ───────
  // Call once during app init to ensure all customers have schedule records.

  seedFromJobs(jobs: Array<{
    id: string;
    customerFirstName: string;
    packageType: string;
    subscriptionStartDate?: string;
  }>): void {
    jobs.forEach(job => {
      if (!job.subscriptionStartDate) return;
      this.initCustomer(
        job.id,
        job.customerFirstName,
        job.packageType,
        job.subscriptionStartDate,
      );
    });
  }
}

export const periodicScheduleService = new PeriodicScheduleService();

// ── Convenience: Option B computePeriodicFlags replacement ────────────────────
// Used by mockWasherDataService and WasherJobChecklist instead of the old
// Option A fixed-day function.

import type { PeriodicService } from "./mockWasherDataService";

export function computePeriodicFlagsB(
  customerId: string,
  packageType: string,
  subscriptionStartDate?: string,
  today?: string,
): {
  isShampooDay:    boolean;
  isWaxDay:        boolean;
  isTyreDay:       boolean;
  isInteriorDay:   boolean;
  isDashboardDay:  boolean;
  isEngineDay:     boolean;
  isFragranceDay:  boolean;
  periodicServices: PeriodicService[];
} {
  // Ensure schedule record exists for this customer
  if (subscriptionStartDate) {
    periodicScheduleService.initCustomer(
      customerId, customerId, packageType, subscriptionStartDate
    );
  }

  const due = periodicScheduleService.getTodayServices(customerId, today);

  const has = (svc: PeriodicServiceType) => due.some(o => o.serviceType === svc);

  const periodicServices: PeriodicService[] = due.map(o => {
    const meta = PERIODIC_SERVICE_META[o.serviceType];
    return {
      id:           o.serviceType,
      name:         meta.name,
      nameHindi:    meta.nameHindi,
      icon:         meta.icon,
      scheduledDay: new Date(o.scheduledDate).getDate(),
      frequency:    (() => {
        const cfg = PLAN_CONFIG[packageType];
        if (!cfg) return "monthly" as const;
        const interval = o.serviceType === "wax" ? WAX_INTERVAL_DAYS : cfg.intervalDays;
        return interval <= 15 ? "fortnightly" as const : "monthly" as const;
      })(),
      occurrenceId: o.id,   // extra field for marking complete from checklist
    };
  });

  return {
    isShampooDay:    has("shampoo"),
    isWaxDay:        has("wax"),
    isTyreDay:       has("tyre"),
    isInteriorDay:   has("interior"),
    isDashboardDay:  has("dashboard"),
    isEngineDay:     has("engine"),
    isFragranceDay:  has("fragrance"),
    periodicServices,
  };
}
