/**
 * Incentive V7 — data access layer.
 * Turns the app's raw records (jobs, subscriptions, bundles, employees, leads, holidays, exits) into the
 * normalised facts the engine needs. This is the ONLY file that knows how the app stores things, so when the
 * data moves to a server database only this file changes.
 *
 * Data gaps the handover lists (G1-G12) are handled here with documented fallbacks:
 *   - washType / weightType / bookedByTseId are read from the job if present, else inferred.
 *   - No cancelledAt on a subscription: its updatedAt date is used when status is "Cancelled".
 *   - Job history in localStorage is capped by DataService, so the engine keeps its own day summaries
 *     and never zeroes a day for which no jobs are currently visible.
 */
import { DataService } from "../DataService";
import { employeeDatabaseService } from "../employeeDatabaseService";
import { istDate, istMinutes } from "./engine";
import type { Family, IncentiveConfig, IncentiveRole, WashType, WeightType } from "./types";

// ── employees ────────────────────────────────────────────────────────────────
export interface EmployeeFact {
  id: string;
  aliases: string[];          // id and tempId, both may be referenced by jobs
  name: string;
  city_id: string;
  role: IncentiveRole | "OTHER";
  status: string;
  reportingManagerId?: string;
}

const CITY_FALLBACK = "CITY-SURAT";

function detectRole(designation: string, employeeType: string): IncentiveRole | "OTHER" {
  const d = (designation || "").toLowerCase();
  if (d.includes("washer")) return employeeType === "Part Time" ? "PT_WASHER" : "FT_WASHER";
  if (d === "tse" || d.includes("tele sales executive") || d.includes("telesales executive")) return "TSE";
  if (d === "tsm" || d.includes("tele sales manager") || d.includes("telesales manager")) return "TSM";
  return "OTHER";
}

export function loadEmployees(): EmployeeFact[] {
  return employeeDatabaseService.getAll().map((e) => {
    const id = e.id && e.id !== "PENDING" ? e.id : e.tempId;
    return {
      id,
      aliases: [e.id, e.tempId, e.employeeId].filter(Boolean) as string[],
      name: e.fullName || `${e.firstName} ${e.lastName}`.trim(),
      city_id: e.cityId || CITY_FALLBACK,
      role: detectRole(e.designation || e.role || "", e.employeeType),
      status: String(e.status),
      reportingManagerId: e.reportingManagerId,
    };
  });
}

export function employeeIndex(emps: EmployeeFact[]): Map<string, EmployeeFact> {
  const m = new Map<string, EmployeeFact>();
  for (const e of emps) for (const a of e.aliases) m.set(a, e);
  return m;
}

// ── holidays ─────────────────────────────────────────────────────────────────
export function loadHolidayDates(): Set<string> {
  try {
    const rows = DataService.get<{ date: string }>("PUBLIC_HOLIDAYS");
    return new Set(rows.map((r) => r.date).filter(Boolean));
  } catch {
    return new Set();
  }
}

// ── jobs ─────────────────────────────────────────────────────────────────────
interface RawJob {
  jobId: string;
  customerId: string;
  subscriptionId?: string;
  leadId?: string;
  washerId?: string;
  status: string;
  jobType: string;
  packageName?: string;
  timeSlot?: string;
  startedAt?: string;
  completedAt?: string;
  amount?: number;
  finalAmount?: number;
  paymentStatus?: string;
  isComplimentary?: boolean;
  cityId?: string;
  vehicleDetails?: { registration?: string };
  serviceDetails?: { addOns?: string[] };
  // V7 fields (optional; set by the booking screens going forward)
  bookedByTseId?: string;
  washType?: WashType;
  weightType?: WeightType;
}

export interface JobFact {
  job_id: string;
  customer_id: string;
  vehicle_id: string;
  city_id: string;
  washer_id?: string;
  tse_id?: string;
  kind: "SUB" | "ONE_TIME" | "EXCLUDED";
  work_date: string;           // IST date of completion
  amount_incl_gst: number;     // for a subscription wash = price per wash
  paid: boolean;
  wash_type: WashType;
  weight_type: WeightType;
  sla_ok: boolean | null;      // null = could not be determined
  subscription_id?: string;
  lead_id?: string;
}

const DOORSTEP_TYPES = ["One-Time Demo", "Add-on", "Walk-in", "One-Time"];

export function inferWashType(packageName: string | undefined): WashType {
  const n = (packageName || "").toLowerCase();
  if (n.includes("elite") || n.includes("wax")) return "ELITE_WASH";
  if (n.includes("smart") || n.includes("shampoo")) return "SMART_WASH";
  return "EXPRESS_WASH"; // plain water wash, the entry product
}

export function inferWeightType(j: { packageName?: string; serviceDetails?: { addOns?: string[] } }): WeightType {
  const text = `${j.packageName || ""} ${(j.serviceDetails?.addOns || []).join(" ")}`.toLowerCase();
  return /deep\s*clean|chemical/.test(text) && /interior/.test(text) ? "interior_deep_clean_chemical" : "default";
}

/** "10:00 AM - 12:00 PM" -> 600 (minutes from midnight of the slot start), or null. */
export function slotStartMinutes(slot: string | undefined): number | null {
  if (!slot) return null;
  const m = slot.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  // AM/PM on the first time, else the one at the end of the range, else treat as 24-hour
  const ap = (m[3] || slot.match(/(AM|PM)\s*$/i)?.[1] || "").toUpperCase();
  if (ap === "PM" && h < 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return h * 60 + min;
}

export function slaOk(j: { timeSlot?: string; startedAt?: string }, cfg: IncentiveConfig): boolean | null {
  const slot = slotStartMinutes(j.timeSlot);
  if (slot == null || !j.startedAt) return null;
  const started = istMinutes(j.startedAt);
  return Math.abs(started - slot) <= cfg.washer.sla_minutes;
}

export function loadJobs(cfg: IncentiveConfig, emps: EmployeeFact[]): JobFact[] {
  const idx = employeeIndex(emps);
  const leads = new Map(
    DataService.getAllCities<{ leadId: string; assignedTo?: string; assignedTSE?: string }>("LEADS").map((l) => [l.leadId, l] as const),
  );
  const subs = new Map(loadSubscriptions().map((s) => [s.subscription_id, s] as const));
  const raw = DataService.getAllCities<RawJob>("JOBS");

  const out: JobFact[] = [];
  for (const j of raw) {
    if (!j.completedAt || !(j.status === "Completed" || j.status === "Verified")) continue;
    if (j.jobType === "Subscription Demo") continue; // no free or demo washes
    const sub = j.subscriptionId ? subs.get(j.subscriptionId) : undefined;
    const doorstep = !j.subscriptionId && DOORSTEP_TYPES.some((t) => (j.jobType || "").includes(t));
    const amount = j.finalAmount ?? j.amount ?? 0;

    let kind: JobFact["kind"] = "EXCLUDED";
    let paid = false;
    let amountInclGst = 0;
    if (j.subscriptionId) {
      kind = "SUB";
      paid = sub ? sub.payment_received : j.paymentStatus !== "Pending";
      amountInclGst = sub ? sub.per_wash_price : 0;
    } else if (doorstep && !j.isComplimentary && amount > 0) {
      kind = "ONE_TIME";
      // doorstep jobs are collected at the door: only Paid counts; a missing flag is treated as not paid
      paid = j.paymentStatus === "Paid";
      amountInclGst = amount;
    }

    // TSE who booked the wash: explicit field first, then the lead it came from
    let tse = j.bookedByTseId;
    if (!tse && j.leadId) {
      const lead = leads.get(j.leadId);
      const ref = lead?.assignedTo || lead?.assignedTSE;
      if (ref) tse = idx.get(ref)?.id ?? (emps.find((e) => e.name === ref)?.id) ?? ref;
    }

    out.push({
      job_id: j.jobId,
      customer_id: j.customerId,
      vehicle_id: j.vehicleDetails?.registration && j.vehicleDetails.registration !== "Unknown" ? j.vehicleDetails.registration : "VEH-1",
      city_id: j.cityId || CITY_FALLBACK,
      washer_id: j.washerId ? idx.get(j.washerId)?.id ?? j.washerId : undefined,
      tse_id: tse,
      kind, work_date: istDate(j.completedAt), amount_incl_gst: amountInclGst, paid,
      wash_type: j.washType ?? inferWashType(j.packageName),
      weight_type: j.weightType ?? inferWeightType(j),
      sla_ok: slaOk(j, cfg),
      subscription_id: j.subscriptionId, lead_id: j.leadId,
    });
  }
  return out;
}

// ── subscriptions and bundles (conversion sale candidates) ───────────────────
interface RawSub {
  subscriptionId: string;
  customerId: string;
  packageName?: string;
  status: string;
  startDate: string;
  priceLocked?: number;
  pricing?: { finalPrice?: number };
  billingCycle?: "Monthly" | "Quarterly" | "Annual";
  paymentStatus?: string;
  updatedAt?: string;
  cityId?: string;
  soldByTseId?: string;
  commitmentTermMonths?: number;
  incentiveFamily?: Family;
}

export interface SubscriptionFact {
  subscription_id: string;
  customer_id: string;
  city_id: string;
  family: Family;
  term_months: number;          // 0 = not a term the plan pays on (e.g. annual)
  start_date: string;
  payment_received: boolean;
  cancelled_on: string | null;
  per_wash_price: number;
  sold_by_tse_id?: string;
}

export function loadSubscriptions(): SubscriptionFact[] {
  const raw = DataService.getAllCities<RawSub>("SUBSCRIPTIONS");
  return raw.map((s) => {
    const price = s.priceLocked ?? s.pricing?.finalPrice ?? 0;
    const term = s.commitmentTermMonths ?? (s.billingCycle === "Quarterly" ? 3 : s.billingCycle === "Annual" ? 0 : 1);
    return {
      subscription_id: s.subscriptionId,
      customer_id: s.customerId,
      city_id: s.cityId || CITY_FALLBACK,
      family: s.incentiveFamily ?? "DAILY_SUB",
      term_months: term,
      start_date: (s.startDate || "").slice(0, 10),
      payment_received: s.paymentStatus === "Paid",
      cancelled_on: s.status === "Cancelled" && s.updatedAt ? istDate(s.updatedAt) : null,
      per_wash_price: price / 30,
      sold_by_tse_id: s.soldByTseId,
    };
  });
}

interface RawBundle {
  bundleId: string;
  subscriptionId: string;
  customerId: string;
  packSize: 2 | 4;
  bundleMonths: number;
  cityId: string;
  paymentDate: string;
  firstWashDate?: string;
  status: string;
  cancellationDate?: string;
  refundAmount?: number;
  soldByTseId?: string;
  source: string;
}

export interface BundleFact {
  bundle_id: string;
  subscription_id: string;
  customer_id: string;
  city_id: string;
  family: Family;
  term_months: number;
  plan_start: string;
  cancelled_on: string | null;
  refunded_on: string | null;
  sold_by_tse_id?: string;
}

export function loadBundles(): BundleFact[] {
  // The bundle service stores under its own key name; read the same way it does.
  const raw = (DataService.get<RawBundle>("MULTI_MONTH_BUNDLES" as never) as RawBundle[]) || [];
  return raw.map((b) => ({
    bundle_id: b.bundleId,
    subscription_id: b.subscriptionId,
    customer_id: b.customerId,
    city_id: b.cityId || CITY_FALLBACK,
    family: b.packSize === 2 ? "PACK2" : "PACK4",
    term_months: b.bundleMonths,
    plan_start: (b.paymentDate || "").slice(0, 10),
    cancelled_on: b.cancellationDate ? b.cancellationDate.slice(0, 10) : null,
    refunded_on: b.cancellationDate && (b.refundAmount ?? 0) > 0 ? b.cancellationDate.slice(0, 10) : null,
    sold_by_tse_id: b.soldByTseId,
  }));
}

// ── exits ────────────────────────────────────────────────────────────────────
export function loadExits(): { employee_id: string; last_working_day: string }[] {
  try {
    const rows = DataService.getAllCities<{ employeeId: string; lastWorkingDate?: string; rejectedAt?: string }>("EXIT_WORKFLOWS");
    return rows.filter((r) => r.employeeId && r.lastWorkingDate && !r.rejectedAt).map((r) => ({ employee_id: r.employeeId, last_working_day: r.lastWorkingDate!.slice(0, 10) }));
  } catch {
    return [];
  }
}

// ── customer-vehicle for subscriptions (they carry no registration) ──────────
export function loadCustomerVehicles(): Map<string, string> {
  const m = new Map<string, string>();
  try {
    const custs = DataService.getAllCities<{ customerId: string; vehicleDetails?: { registrationNumber?: string } }>("CUSTOMERS");
    for (const c of custs) {
      const reg = c.vehicleDetails?.registrationNumber;
      if (reg && reg !== "Unknown") m.set(c.customerId, reg);
    }
  } catch { /* ignore */ }
  return m;
}
