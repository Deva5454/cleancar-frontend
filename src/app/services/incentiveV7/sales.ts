/**
 * Incentive V7 — TSE conversion sales, instalments, forfeiture and provision entries.
 * Sales are created once (config version frozen at sale), then only their instalment status moves.
 */
import { getActiveRow } from "./configService";
import { classifySale, evaluateInstalment, exitForfeits, incentiveTotal, instalmentSchedule, monthOf, provisionEntries, saleStatus } from "./engine";
import { loadBundles, loadCustomerVehicles, loadExits, loadSubscriptions, type EmployeeFact, type JobFact } from "./facts";
import { readAll, upsertMany, writeAll } from "./store";
import type { ConversionSale, Family, Instalment, ProvisionEntry, SaleClass } from "./types";

interface Candidate {
  source: "BUNDLE" | "SUBSCRIPTION";
  source_id: string;
  customer_id: string;
  city_id: string;
  family: Family;
  term: number;
  plan_start: string;
  cancelled_on: string | null;
  refunded_on: string | null;
  payment_received: boolean;
}

const RANK: Record<Family, number> = { PACK2: 1, PACK4: 2, DAILY_SUB: 3 };
const bucketTerm = (t: number): 1 | 3 | 6 => (t <= 1 ? 1 : t <= 3 ? 3 : 6);

function candidates(): Candidate[] {
  const bundles = loadBundles();
  const inBundle = new Set(bundles.map((b) => b.subscription_id));
  const out: Candidate[] = bundles.filter((b) => b.plan_start).map((b) => ({
    source: "BUNDLE", source_id: b.bundle_id, customer_id: b.customer_id, city_id: b.city_id, family: b.family,
    term: b.term_months, plan_start: b.plan_start, cancelled_on: b.cancelled_on, refunded_on: b.refunded_on, payment_received: true,
  }));
  for (const s of loadSubscriptions()) {
    if (inBundle.has(s.subscription_id) || s.term_months <= 0 || !s.start_date) continue;
    out.push({
      source: "SUBSCRIPTION", source_id: s.subscription_id, customer_id: s.customer_id, city_id: s.city_id, family: s.family,
      term: s.term_months, plan_start: s.start_date, cancelled_on: s.cancelled_on, refunded_on: null, payment_received: s.payment_received,
    });
  }
  return out;
}

function prov(event: ProvisionEntry["event"], sale: ConversionSale, amount: number, date: string, instId?: string): ProvisionEntry {
  const p = provisionEntries(event, amount);
  return {
    id: `PROV-${event}-${instId ?? sale.id}`, city_id: sale.city_id, event, sale_id: sale.id, instalment_id: instId,
    debit_account: p.debit_account, credit_account: p.credit_account, amount, posting_date: date, created_at: new Date().toISOString(),
  };
}

export function computeSales(emps: EmployeeFact[], jobs: JobFact[], today: string): { created: number } {
  const tseIds = new Set(emps.filter((e) => e.role === "TSE").map((e) => e.id));
  const owners = readAll("INC7_OWNERSHIP");
  const vehicles = loadCustomerVehicles();
  const vehicleByCustomer = new Map<string, string>();
  for (const j of jobs) if (j.vehicle_id && !vehicleByCustomer.has(j.customer_id)) vehicleByCustomer.set(j.customer_id, j.vehicle_id);

  const sales = readAll("INC7_SALES");
  const known = new Map(sales.map((s) => [s.id, s] as const));
  const instalments = readAll("INC7_INSTALMENTS");
  const instBySale = new Map<string, Instalment[]>();
  for (const i of instalments) instBySale.set(i.sale_id, [...(instBySale.get(i.sale_id) ?? []), i]);

  const byCustomer = new Map<string, Candidate[]>();
  for (const c of candidates().sort((a, b) => a.plan_start.localeCompare(b.plan_start))) {
    byCustomer.set(c.customer_id, [...(byCustomer.get(c.customer_id) ?? []), c]);
  }

  const newSales: ConversionSale[] = [];
  const newInst: Instalment[] = [];
  const newProv: ProvisionEntry[] = [];
  const nowIso = new Date().toISOString();

  for (const [customerId, list] of byCustomer) {
    list.forEach((c, idx) => {
      const id = `SALE-${c.source}-${c.source_id}`;
      const existing = known.get(id);
      if (existing) {
        // keep cancellation/refund facts current; money fields stay frozen
        if (existing.cancelled_on !== c.cancelled_on || existing.refunded_on !== c.refunded_on || existing.payment_received !== c.payment_received) {
          newSales.push({ ...existing, cancelled_on: c.cancelled_on, refunded_on: c.refunded_on, payment_received: c.payment_received });
        }
        return;
      }
      const vehicle = vehicleByCustomer.get(customerId) ?? vehicles.get(customerId) ?? customerId;
      const own = owners.find((o) => o.customer_id === customerId && (o.vehicle_id === vehicle || !vehicleByCustomer.has(customerId)));
      if (!own || !tseIds.has(own.primary_tse_id)) return;       // no TSE owner, no incentive
      const cfg = getActiveRow(c.plan_start);
      const prior = list.slice(0, idx);
      const latest = prior[prior.length - 1];
      const activeFamily = latest ? latest.family : null;
      let klass: SaleClass = classifySale({
        saleDate: c.plan_start, family: c.family, firstPaidOneTimeWashDate: own.first_paid_one_time_wash_date,
        hasPriorConversion: prior.length > 0, activeFamily,
      }, cfg.config);
      const renewalNumber = prior.length > 0 ? prior.length : undefined;
      let upgradeKey: string | undefined;
      if (klass === "UPGRADE" && latest) upgradeKey = `${latest.family}_TO_${c.family}`;
      if (klass === "UPGRADE" && !(upgradeKey! in cfg.config.tse.conversion.upgrades)) klass = "RENEWAL";
      const term = bucketTerm(c.term);
      const total = klass === "PACKAGE_NO_INCENTIVE" ? 0 : incentiveTotal({ klass, family: c.family, termMonths: term, renewalNumber, upgradeKey }, cfg.config);
      const sale: ConversionSale = {
        id, sale_txn_id: c.source_id, source: c.source, customer_id: customerId, vehicle_id: vehicle, city_id: c.city_id,
        tse_id: own.primary_tse_id, classification: klass, family: c.family, term_months: klass === "RENEWAL" ? 1 : term,
        renewal_number: klass === "RENEWAL" ? renewalNumber : undefined, upgrade_key: upgradeKey,
        sale_date: c.plan_start, plan_start: c.plan_start, total_incentive: total, status: "PENDING", config_version: cfg.version,
        cancelled_on: c.cancelled_on, refunded_on: c.refunded_on, payment_received: c.payment_received, created_at: nowIso,
      };
      newSales.push(sale);
      if (total > 0) {
        const sched = instalmentSchedule({ total, termMonths: sale.term_months, planStart: sale.plan_start }, cfg.config);
        for (const r of sched) newInst.push({ id: `INST-${id}-${r.seq}`, sale_id: id, tse_id: sale.tse_id, city_id: sale.city_id, ...r, updated_at: nowIso });
        if (cfg.config.accounting.book_provision_at_sale) newProv.push(prov("SALE", sale, total, sale.sale_date));
      }
    });
  }
  upsertMany("INC7_SALES", newSales);
  upsertMany("INC7_INSTALMENTS", newInst);
  upsertMany("INC7_PROVISION", newProv);
  return { created: newSales.filter((s) => !known.has(s.id)).length };
}

/** Moves instalments PENDING → ELIGIBLE / FORFEITED and applies the TSE exit rule. Never touches RELEASED rows. */
export function evaluateInstalments(today: string): void {
  const sales = new Map(readAll("INC7_SALES").map((s) => [s.id, s] as const));
  const all = readAll("INC7_INSTALMENTS");
  const exits = new Map<string, string>();
  for (const e of loadExits()) exits.set(e.employee_id, e.last_working_day);
  const provNew: ProvisionEntry[] = [];
  const nowIso = new Date().toISOString();

  const byTse = new Map<string, Instalment[]>();
  for (const i of all) byTse.set(i.tse_id, [...(byTse.get(i.tse_id) ?? []), i]);
  const exitHit = new Set<string>();
  for (const [tse, list] of byTse) {
    const lwd = exits.get(tse);
    if (!lwd) continue;
    exitForfeits(list, lwd).forEach((f, k) => { if (f) exitHit.add(list[k].id); });
  }

  const next = all.map((i) => {
    const sale = sales.get(i.sale_id);
    if (!sale || i.status === "RELEASED" || i.status === "FORFEITED") return i;
    let status: Instalment["status"] = i.status;
    let reason: Instalment["forfeit_reason"];
    const ev = evaluateInstalment(i, { cancelledOn: sale.cancelled_on ?? null, refundedOn: sale.refunded_on ?? null, paymentReceived: sale.payment_received }, today);
    status = ev.status; reason = ev.reason;
    if (exitHit.has(i.id) && status !== "ELIGIBLE") { status = "FORFEITED"; reason = "TSE_EXIT"; }
    if (status === i.status) return i;
    if (status === "FORFEITED") provNew.push(prov("FORFEIT", sale, i.amount, today, i.id));
    return { ...i, status, forfeit_reason: reason, updated_at: nowIso };
  });
  writeAll("INC7_INSTALMENTS", next);
  upsertMany("INC7_PROVISION", provNew);

  const grouped = new Map<string, Instalment[]>();
  for (const i of next) grouped.set(i.sale_id, [...(grouped.get(i.sale_id) ?? []), i]);
  const changed = [];
  for (const [sid, list] of grouped) {
    const s = sales.get(sid);
    const st = saleStatus(list);
    if (s && s.status !== st) changed.push({ ...s, status: st });
  }
  upsertMany("INC7_SALES", changed);
}

export const instalmentPayrollMonth = (i: Instalment): string => monthOf(i.due_date);
