/**
 * incentiveStructureV6.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH for all incentive calculations.
 * Source: Incentive Structure v6 Final · 28 May 2026
 *
 * REPLACES: incentiveEngine.ts, salesIncentiveEngine.ts, incentiveLedger.ts,
 *           incentiveEngineService.ts, supervisorIncentiveService.ts
 *
 * GOVERNING RULES (§1):
 *  1. Pool = ₹150 × (months÷3). Scales with term.
 *  2. 30% at M1, 70% across check-months. Each tranche = ₹105 always.
 *  3. Washer NOT in subscription pool — delivery only.
 *  4. Express Wash Hatchback = ₹0 pool for ALL roles.
 *  5. Gates: TSE ≥10 closures, SM 3-condition, SH ≥10 personal.
 *  6. SM = ₹15/3M territory share from pool.
 *  7. SH = 1% of monthly plan value rolling — separate from pool.
 *  8. Ops roles: quarterly payout. CCE merged under TSM.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type IncentiveSource    = "DIGITAL" | "BTL" | "BULK_DEAL";
export type IncentiveTerm      = 1 | 2 | 3 | 6 | 9 | 12;
export type CheckMonth         = "M1" | "M2" | "M3" | "M6" | "M9" | "M12";
export type TrancheStatus      = "PENDING" | "PAID" | "FORFEITED";
export type IncentiveRole      = "TSE" | "SM" | "SH" | "TSM" | "SUPERVISOR";
export type AddonPath          = "PATH_A" | "PATH_B";
export type VehicleTier        = "hatchback" | "suv" | "luxury";

export interface SubscriptionIncentiveRecord {
  id:               string;
  subscriptionId:   string;
  customerId:       string;
  customerName:     string;
  planType:         string;
  vehicleCategory:  string;
  monthlyAmount:    number;
  term:             IncentiveTerm;
  source:           IncentiveSource;
  activationDate:   string;
  status:           "ACTIVE" | "CANCELLED" | "COMPLETED";
  cancelledDate?:   string;
  cityId:           string;
  tseId?:    string; tseName?:         string;
  smId?:     string; smName?:          string;
  shId?:     string; shName?:          string;
  tsmId?:    string; tsmName?:         string;
  supervisorId?:    string; supervisorName?: string;
  poolTotal:        number;
  isZeroPool:       boolean;
  tranches:         IncentiveTranche[];
  createdAt:        string;
}

export interface IncentiveTranche {
  id:               string;
  subscriptionId:   string;
  checkMonth:       CheckMonth;
  dueDate:          string;
  poolAmount:       number;
  rolePayouts:      RolePayout[];
  status:           TrancheStatus;
  paidDate?:        string;
  forfeitedReason?: "CANCELLATION" | "GATE_NOT_MET" | "INACTIVE";
}

export interface RolePayout {
  role:         IncentiveRole;
  employeeId:   string;
  employeeName: string;
  amount:       number;
  pct:          number;
  status:       TrancheStatus;
}

export interface AddonIncentiveRecord {
  id:           string;
  subscriptionId: string;
  customerId:   string;
  addonId:      string;
  addonName:    string;
  addonPrice:   number;
  vehicleTier:  VehicleTier;
  path:         AddonPath;
  isTopUp:      boolean;   // false = already in plan → washer ₹20 only, no chain
  rolePayouts:  RolePayout[];
  washerAmount: number;    // always ₹20 when performed
  createdAt:    string;
}

export interface WasherIncentiveSummary {
  washerId:         string;
  date:             string;
  fixedSalaryProRate: number;
  unitsInBand:      number;
  baseQuota:        number;
  unitsAboveQuota:  number;
  unitIncentive:    number;    // ₹25 × unitsAboveQuota
  addOnCount:       number;
  addOnIncentive:   number;    // ₹20 × addOnCount
  packBonus:        number;    // ₹5 or ₹10 on final pack visit
  attendanceBonus:  number;
  totalIncentive:   number;
}

export interface ExitPayoutSummary {
  subscriptionId:  string;
  exitDate:        string;
  dueToBePaid:     IncentiveTranche[];
  toBeForfeited:   IncentiveTranche[];
  totalDue:        number;
  totalForfeited:  number;
  byRole: { role: IncentiveRole; employeeId: string; due: number; forfeited: number }[];
}

export interface RoleIncentiveSummary {
  employeeId:    string;
  role:          IncentiveRole;
  totalEarned:   number;
  totalPending:  number;
  totalForfeited:number;
  shRollingMonthly?: number;  // SH only
  tranches: { record: SubscriptionIncentiveRecord; tranche: IncentiveTranche; myPayout: RolePayout }[];
}

// ── §2: Pool calculation constants ────────────────────────────────────────────

export const POOL_BY_TERM: Record<IncentiveTerm, number> = {
  1: 50, 2: 100, 3: 150, 6: 300, 9: 450, 12: 600,
};

export const CHECK_MONTHS_BY_TERM: Record<IncentiveTerm, CheckMonth[]> = {
  1:  ["M1", "M2"],
  2:  ["M1", "M2"],
  3:  ["M1", "M3"],
  6:  ["M1", "M3", "M6"],
  9:  ["M1", "M3", "M6", "M9"],
  12: ["M1", "M3", "M6", "M9", "M12"],
};

// §2: 30% M1, 70% split equally across remaining months. Each later tranche = ₹105.
export function calcTrancheAmounts(term: IncentiveTerm): Record<CheckMonth, number> {
  const pool     = POOL_BY_TERM[term];
  const months   = CHECK_MONTHS_BY_TERM[term];
  const m1Amount = Math.round(pool * 0.30 * 100) / 100;
  const later    = months.slice(1);
  const laterAmt = later.length > 0
    ? Math.round(((pool - m1Amount) / later.length) * 100) / 100
    : 0;
  const result: Partial<Record<CheckMonth, number>> = {};
  months.forEach((m, i) => { result[m] = i === 0 ? m1Amount : laterAmt; });
  return result as Record<CheckMonth, number>;
}

// §2 example check: 3M pool ₹150 → M1 ₹45, M3 ₹105 ✓
// §2 example check: 12M pool ₹600 → M1 ₹180, M3/M6/M9/M12 ₹105 each ✓

// ── §2.1/2.2: Pool split by source ────────────────────────────────────────────

export const POOL_SPLIT_PCT: Record<IncentiveSource, Partial<Record<IncentiveRole, number>>> = {
  // §2.1 TSE-Sourced
  DIGITAL: { TSE: 20, SM: 10, SH: 5, TSM: 7.5 },
  // §2.2 BTL / Supervisor-Sourced
  BTL:     { SUPERVISOR: 15, TSE: 20, SH: 5, TSM: 7.5, SM: 10 },
  // §4 Path C: SM only. SH gets 1% rolling (Rule 7), not pool share.
  BULK_DEAL: { SM: 100 },
};

// §2.3: Express Wash Hatchback = ₹0 for ALL roles
export function isZeroPool(planType: string, vehicleCategory: string): boolean {
  const isExpressWash = ["EXPRESS_WASH", "Express Wash", "SHINE", "Express Wash Hatchback"].includes(planType);
  const isHatchback   = vehicleCategory.toLowerCase().includes("hatchback") ||
                        vehicleCategory.toLowerCase().includes("compact sedan");
  return isExpressWash && isHatchback;
}

// ── §3: Washer incentive constants ────────────────────────────────────────────

export const WASHER = {
  FIXED_SALARY_MIN:    12000,
  FIXED_SALARY_MAX:    18000,
  BASE_QUOTA:          25,          // units/day
  PER_UNIT_ABOVE:      25,          // ₹25 per unit above 25 quota (in time band)
  ADDON_EXECUTION:     20,          // ₹20 per add-on (not in plan)
  PACK_BONUS_2X:       5,           // ₹5 on Pack×2 final visit
  PACK_BONUS_4X:       10,          // ₹10 on Pack×4 final visit
  DAILY_CAP:           58,          // max units/day (must come from backend API)
  UNIT_4W:             1.0,         // 4W vehicle = 1.0 unit
  UNIT_2W:             0.4,         // 2W vehicle = 0.4 unit
  UNIT_ADDON:          0.5,         // add-on = 0.5 unit toward quota
  ATTENDANCE_BONUS_OWN: 500,        // ₹500 own zero-absence
  ATTENDANCE_BONUS_TEAM: 1000,      // ₹1,000 full team present
};

export function calcWasherIncentive(params: {
  unitsInBand: number;
  addOnCount:  number;
  packBonus:   number;
  attendanceBonus: number;
}): WasherIncentiveSummary {
  const above   = Math.max(0, params.unitsInBand - WASHER.BASE_QUOTA);
  const unit    = above * WASHER.PER_UNIT_ABOVE;
  const addon   = params.addOnCount * WASHER.ADDON_EXECUTION;
  return {
    washerId: "", date: "",
    fixedSalaryProRate: 0,
    unitsInBand:    params.unitsInBand,
    baseQuota:      WASHER.BASE_QUOTA,
    unitsAboveQuota: above,
    unitIncentive:  unit,
    addOnCount:     params.addOnCount,
    addOnIncentive: addon,
    packBonus:      params.packBonus,
    attendanceBonus:params.attendanceBonus,
    totalIncentive: unit + addon + params.packBonus + params.attendanceBonus,
  };
}

// ── §4: Add-on incentive chain ────────────────────────────────────────────────

export const ADDON_CHAIN_BUDGET_PCT = 0.10; // 10% of add-on price

// §4.1 Path A: TSE 45% + SM 10% + Supervisor 15% + SH 15% + TSM 15%
export const ADDON_SPLIT_PATH_A: Partial<Record<IncentiveRole, number>> = {
  TSE: 45, SM: 10, SUPERVISOR: 15, SH: 15, TSM: 15,
};

// §4.2 Path B: SM 30% + Supervisor 55% + TSM 15%
export const ADDON_SPLIT_PATH_B: Partial<Record<IncentiveRole, number>> = {
  SM: 30, SUPERVISOR: 55, TSM: 15,
};

// Add-on prices by vehicle tier — §4.1 table
export const ADDON_PRICES: Record<string, Record<VehicleTier, number>> = {
  vacuum:    { hatchback: 199, suv: 249, luxury: 349 },
  dashboard: { hatchback: 149, suv: 199, luxury: 249 },
  tyre:      { hatchback:  99, suv: 149, luxury: 199 },
  waxpolish: { hatchback: 199, suv: 249, luxury: 399 },
  engine:    { hatchback:  99, suv: 149, luxury: 199 },
  underbody: { hatchback: 199, suv: 249, luxury: 349 },
  fragrance: { hatchback:  49, suv:  49, luxury:  49 },  // no chain
};

// Services included per plan — if included → washer ₹20 only, no chain
const PLAN_INCLUDED_ADDONS: Record<string, string[]> = {
  EXPRESS_WASH: [],   // no addons included
  SMART_WASH:   ["vacuum"],           // vacuum 2×/month included
  ELITE_WASH:   ["vacuum","dashboard","tyre","waxpolish","engine"], // all included
  ELITE:        ["vacuum","dashboard","tyre","waxpolish","engine"], // legacy alias
};

export function isAddonTopUp(addonId: string, planType: string): boolean {
  const included = PLAN_INCLUDED_ADDONS[planType] || [];
  if (addonId === "fragrance") return false; // no chain ever
  return !included.includes(addonId);
}

export function calcAddonChain(
  addonId:    string,
  addonPrice: number,
  path:       AddonPath,
  employeeIds: Partial<Record<IncentiveRole, { id: string; name: string }>>,
): RolePayout[] {
  if (addonId === "fragrance") return []; // no chain
  const split = path === "PATH_A" ? ADDON_SPLIT_PATH_A : ADDON_SPLIT_PATH_B;
  const budget = addonPrice * ADDON_CHAIN_BUDGET_PCT;
  const payouts: RolePayout[] = [];
  Object.entries(split).forEach(([role, pct]) => {
    const emp = employeeIds[role as IncentiveRole];
    if (!emp?.id) return;
    payouts.push({
      role: role as IncentiveRole,
      employeeId:   emp.id,
      employeeName: emp.name,
      pct: pct ?? 0,
      amount: Math.round(budget * ((pct ?? 0) / 100) * 100) / 100,
      status: "PENDING",
    });
  });
  return payouts;
}

// ── §5.2: Repeat pack incentive ───────────────────────────────────────────────

export const REPEAT_PACK_INCENTIVE: Record<string, { sm: number; supervisor: number; total: number }> = {
  "pack2_water_h":    { sm: 5,  supervisor: 15, total: 20 },
  "pack4_water_h":    { sm: 10, supervisor: 25, total: 35 },
  "pack2_shampoo_h":  { sm: 5,  supervisor: 20, total: 25 },
  "pack4_shampoo_h":  { sm: 15, supervisor: 35, total: 50 },
  "pack2_wax_h":      { sm: 10, supervisor: 30, total: 40 },
  "pack4_wax_h":      { sm: 20, supervisor: 45, total: 65 },
};

// ── §6.1: SM gates ────────────────────────────────────────────────────────────

export const SM_GATE = { min_locations: 5, min_leads_mtd: 30, min_conversions_mtd: 5 };
export function smGateMet(locations: number, leadsMTD: number, conversionsMTD: number): boolean {
  return locations >= SM_GATE.min_locations &&
    leadsMTD >= SM_GATE.min_leads_mtd &&
    conversionsMTD >= SM_GATE.min_conversions_mtd;
}

// ── §6.2: SH constants ────────────────────────────────────────────────────────

export const SH = {
  ROLLING_PCT:       0.01,   // 1% of monthly plan value
  POOL_PER_3M:       35,     // ₹35 per 3M sub (23% of pool)
  GATE_CLOSURES:     10,
  COACHING_BONUS: { ge100: 12500, ge75: 7500, ge25: 1500, lt25: 0 },
  SLA_BONUS:         2000,
  ZERO_CHURN_BONUS:  1500,
  PLAN_MIX_BONUS:    1000,   // ≥60% PROTECT/ELITE
};

export function calcSHCoachingBonus(lowestTSEClosures: number): number {
  if (lowestTSEClosures >= 100) return SH.COACHING_BONUS.ge100;
  if (lowestTSEClosures >= 75)  return SH.COACHING_BONUS.ge75;
  if (lowestTSEClosures >= 25)  return SH.COACHING_BONUS.ge25;
  return SH.COACHING_BONUS.lt25;
}

// ── §6.3: TSE constants ───────────────────────────────────────────────────────

export const TSE = {
  POOL_TSE_SOURCED_3M: 79.50,  // 53% of ₹150
  POOL_BTL_3M:         30,     // 20% of ₹150
  GATE_CLOSURES:       10,
  SHINE_H_TOKEN:       10,     // ₹10 one-time when SHINE H + add-on
  SLA_BONUS:           500,
  PLAN_MIX_BONUS:      500,    // ≥60% PROTECT/ELITE
  CRM_PENALTY_PCT:     0.20,   // -20% all variable if <100% CRM
};

// ── §6.4: TSM constants ───────────────────────────────────────────────────────

export const TSM_PERSONAL_3M = 19.50; // 13% of pool, personal conversions only

export const TSM_CONVERSION_BONUS: { min: number; max: number | null; amount: number }[] = [
  { min: 0,   max: 100,  amount: 5000  },
  { min: 101, max: 125,  amount: 10000 },
  { min: 126, max: 150,  amount: 15000 },
  { min: 151, max: null, amount: 20000 },
];
export const TSM_RENEWAL_BONUS: { min: number; max: number; amount: number }[] = [
  { min: 70, max: 75,  amount: 3000  },
  { min: 76, max: 85,  amount: 7000  },
  { min: 86, max: 95,  amount: 8500  },
  { min: 96, max: 100, amount: 10000 },
];
export const TSM_TEAM_REVENUE_BONUS = [
  { threshold: 1000000, amount: 10000 },
  { threshold: 1500000, amount: 20000 },
  { threshold: 2000000, amount: 40000 },
];
export const TSM_CSAT_BONUS = [
  { min: 4.5, amount: 15000 }, { min: 4.0, amount: 10000 },
  { min: 3.5, amount: 5000  }, { min: 0,   amount: 0     },
];

// ── §6.5 / 6.6: OM/CM/City Manager quarterly KPI ─────────────────────────────

export const OM_QUARTERLY_BASE = 22500;
export const OM_KPI = {
  revenue_wt: 0.40, retention_wt: 0.20, conversion_wt: 0.20, compliance_wt: 0.10, cx_wt: 0.10,
  gate_revenue_pct: 0.70,
};
export const CM_QUARTERLY_BASE  = 150000;
export const CITY_QUARTERLY_BASE = 300000;

// ── Storage key ───────────────────────────────────────────────────────────────

const STORAGE_KEY     = "cleancar_incentive_v6_records";
const ADDON_STORE_KEY = "cleancar_incentive_v6_addons";

// ── Service class ─────────────────────────────────────────────────────────────

class IncentiveStructureV6Service {

  // ── Read/write ──────────────────────────────────────────────────────────────
  private readSubs(): SubscriptionIncentiveRecord[] {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  }
  private writeSubs(r: SubscriptionIncentiveRecord[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(r));
  }
  private readAddons(): AddonIncentiveRecord[] {
    try { return JSON.parse(localStorage.getItem(ADDON_STORE_KEY) || "[]"); } catch { return []; }
  }
  private writeAddons(r: AddonIncentiveRecord[]) {
    localStorage.setItem(ADDON_STORE_KEY, JSON.stringify(r));
  }

  // ── Create subscription incentive record ────────────────────────────────────
  createSubscriptionRecord(params: {
    subscriptionId: string; customerId: string; customerName: string;
    planType: string; vehicleCategory: string; monthlyAmount: number;
    term: IncentiveTerm; source: IncentiveSource; activationDate: string;
    cityId: string;
    tseId?: string;        tseName?: string;
    smId?: string;         smName?: string;
    shId?: string;         shName?: string;
    tsmId?: string;        tsmName?: string;
    supervisorId?: string; supervisorName?: string;
  }): SubscriptionIncentiveRecord {
    const zero      = isZeroPool(params.planType, params.vehicleCategory);
    const pool      = zero ? 0 : POOL_BY_TERM[params.term];
    const split     = POOL_SPLIT_PCT[params.source];
    const amounts   = zero ? {} as Record<CheckMonth,number> : calcTrancheAmounts(params.term);
    const checkMos  = CHECK_MONTHS_BY_TERM[params.term];
    const actDate   = new Date(params.activationDate);

    const tranches: IncentiveTranche[] = checkMos.map(cm => {
      const mOffset: Record<CheckMonth,number> = { M1:0, M2:1, M3:2, M6:5, M9:8, M12:11 };
      const due = new Date(actDate);
      due.setMonth(due.getMonth() + mOffset[cm]);

      const poolAmt = zero ? 0 : (amounts[cm] ?? 0);

      const rolePayouts: RolePayout[] = [];
      if (!zero) {
        Object.entries(split).forEach(([role, pct]) => {
          const r = role as IncentiveRole;
          let empId = "", empName = "";
          if (r==="TSE")        { empId=params.tseId||"";        empName=params.tseName||""; }
          if (r==="SM")         { empId=params.smId||"";         empName=params.smName||""; }
          if (r==="SH")         { empId=params.shId||"";         empName=params.shName||""; }
          if (r==="TSM")        { empId=params.tsmId||"";        empName=params.tsmName||""; }
          if (r==="SUPERVISOR") { empId=params.supervisorId||""; empName=params.supervisorName||""; }
          if (!empId) return;
          rolePayouts.push({
            role: r, employeeId: empId, employeeName: empName,
            pct: pct ?? 0,
            amount: Math.round(poolAmt * ((pct??0)/100) * 100) / 100,
            status: "PENDING",
          });
        });
      }

      return {
        id: `TRN-${params.subscriptionId}-${cm}`,
        subscriptionId: params.subscriptionId,
        checkMonth: cm, dueDate: due.toISOString().split("T")[0],
        poolAmount: poolAmt, rolePayouts, status: "PENDING",
      };
    });

    const rec: SubscriptionIncentiveRecord = {
      id: `INC-${params.subscriptionId}`,
      ...params, poolTotal: pool, isZeroPool: zero, tranches,
      status: "ACTIVE", createdAt: new Date().toISOString(),
    };
    const all = this.readSubs();
    all.push(rec);
    this.writeSubs(all);
    return rec;
  }

  // ── Record an add-on sale and compute chain ─────────────────────────────────
  recordAddonSale(params: {
    subscriptionId: string; customerId: string; addonId: string;
    addonPrice: number; vehicleTier: VehicleTier; planType: string;
    path: AddonPath;
    employees: Partial<Record<IncentiveRole, { id: string; name: string }>>;
  }): AddonIncentiveRecord {
    const topUp = isAddonTopUp(params.addonId, params.planType);
    const chain = topUp
      ? calcAddonChain(params.addonId, params.addonPrice, params.path, params.employees)
      : [];

    const rec: AddonIncentiveRecord = {
      id:             `ADDON-${Date.now()}`,
      subscriptionId: params.subscriptionId,
      customerId:     params.customerId,
      addonId:        params.addonId,
      addonName:      params.addonId,
      addonPrice:     params.addonPrice,
      vehicleTier:    params.vehicleTier,
      path:           params.path,
      isTopUp:        topUp,
      rolePayouts:    chain,
      washerAmount:   WASHER.ADDON_EXECUTION,  // always ₹20
      createdAt:      new Date().toISOString(),
    };
    const all = this.readAddons();
    all.push(rec);
    this.writeAddons(all);
    return rec;
  }

  // ── Mark tranche paid ───────────────────────────────────────────────────────
  markTranchePaid(subscriptionId: string, checkMonth: CheckMonth): boolean {
    const all = this.readSubs();
    const rec = all.find(r => r.subscriptionId === subscriptionId);
    if (!rec) return false;
    const t = rec.tranches.find(t => t.checkMonth === checkMonth);
    if (!t || t.status !== "PENDING") return false;
    t.status = "PAID"; t.paidDate = new Date().toISOString().split("T")[0];
    t.rolePayouts.forEach(rp => rp.status = "PAID");
    this.writeSubs(all);
    return true;
  }

  // ── Process cancellation — compute due vs forfeited ─────────────────────────
  processCancellation(subscriptionId: string, cancelDate: string): ExitPayoutSummary | null {
    const all = this.readSubs();
    const rec = all.find(r => r.subscriptionId === subscriptionId);
    if (!rec) return null;
    rec.status = "CANCELLED"; rec.cancelledDate = cancelDate;
    const cancelDt = new Date(cancelDate);
    const due: IncentiveTranche[] = [], forfeited: IncentiveTranche[] = [];
    rec.tranches.forEach(t => {
      if (t.status === "PAID") return;
      if (new Date(t.dueDate) <= cancelDt) {
        due.push(t); t.status = "PAID"; t.paidDate = cancelDate;
        t.rolePayouts.forEach(rp => rp.status = "PAID");
      } else {
        forfeited.push(t); t.status = "FORFEITED"; t.forfeitedReason = "CANCELLATION";
        t.rolePayouts.forEach(rp => rp.status = "FORFEITED");
      }
    });
    this.writeSubs(all);
    const byRoleMap: Record<string, { role:IncentiveRole; employeeId:string; due:number; forfeited:number }> = {};
    const add = (rp: RolePayout, type: "due"|"forfeited") => {
      if (!byRoleMap[rp.employeeId]) byRoleMap[rp.employeeId] = { role:rp.role, employeeId:rp.employeeId, due:0, forfeited:0 };
      byRoleMap[rp.employeeId][type] += rp.amount;
    };
    due.forEach(t => t.rolePayouts.forEach(rp => add(rp,"due")));
    forfeited.forEach(t => t.rolePayouts.forEach(rp => add(rp,"forfeited")));
    return {
      subscriptionId, exitDate: cancelDate, dueToBePaid: due, toBeForfeited: forfeited,
      totalDue:      due.reduce((s,t) => s+t.poolAmount, 0),
      totalForfeited:forfeited.reduce((s,t) => s+t.poolAmount, 0),
      byRole: Object.values(byRoleMap),
    };
  }

  // ── Auto-process tranches past due date ─────────────────────────────────────
  autoProcessDueTranches(today: string): IncentiveTranche[] {
    const all = this.readSubs(), processed: IncentiveTranche[] = [];
    const todayDt = new Date(today);
    all.forEach(rec => {
      if (rec.status !== "ACTIVE") return;
      rec.tranches.forEach(t => {
        if (t.status === "PENDING" && new Date(t.dueDate) <= todayDt) {
          t.status = "PAID"; t.paidDate = today;
          t.rolePayouts.forEach(rp => rp.status = "PAID");
          processed.push(t);
        }
      });
    });
    if (processed.length) this.writeSubs(all);
    return processed;
  }

  // ── Get summary for one employee ────────────────────────────────────────────
  getForEmployee(employeeId: string, role: IncentiveRole): RoleIncentiveSummary {
    const all = this.readSubs();
    const result: RoleIncentiveSummary = {
      employeeId, role, totalEarned:0, totalPending:0, totalForfeited:0, tranches:[],
    };
    all.forEach(rec => {
      const mine = (role==="TSE"&&rec.tseId===employeeId) ||
                   (role==="SM"&&rec.smId===employeeId)   ||
                   (role==="SH"&&rec.shId===employeeId)   ||
                   (role==="TSM"&&rec.tsmId===employeeId) ||
                   (role==="SUPERVISOR"&&rec.supervisorId===employeeId);
      if (!mine) return;
      rec.tranches.forEach(t => {
        const myPayout = t.rolePayouts.find(rp => rp.employeeId===employeeId);
        if (!myPayout) return;
        result.tranches.push({ record:rec, tranche:t, myPayout });
        if (myPayout.status==="PAID")      result.totalEarned    += myPayout.amount;
        if (myPayout.status==="PENDING")   result.totalPending   += myPayout.amount;
        if (myPayout.status==="FORFEITED") result.totalForfeited += myPayout.amount;
      });
    });
    // SH 1% rolling
    if (role === "SH") {
      result.shRollingMonthly = all
        .filter(r => r.shId===employeeId && r.status==="ACTIVE")
        .reduce((s,r) => s + r.monthlyAmount*SH.ROLLING_PCT, 0);
    }
    return result;
  }

  // ── SH 1% rolling reward ────────────────────────────────────────────────────
  getSHRolling(shId: string): { total: number; breakdown: { subscriptionId:string; customerName:string; planAmount:number; reward:number }[] } {
    const subs = this.readSubs().filter(r => r.shId===shId && r.status==="ACTIVE");
    const bd   = subs.map(r => ({ subscriptionId:r.subscriptionId, customerName:r.customerName, planAmount:r.monthlyAmount, reward:Math.round(r.monthlyAmount*SH.ROLLING_PCT*100)/100 }));
    return { total: bd.reduce((s,b)=>s+b.reward,0), breakdown: bd };
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  getStats(cityId?: string) {
    const all = cityId ? this.readSubs().filter(r=>r.cityId===cityId) : this.readSubs();
    let paid=0, pending=0, forfeited=0;
    all.forEach(r => r.tranches.forEach(t => {
      if (t.status==="PAID")      paid+=t.poolAmount;
      if (t.status==="PENDING")   pending+=t.poolAmount;
      if (t.status==="FORFEITED") forfeited+=t.poolAmount;
    }));
    return { totalRecords:all.length, active:all.filter(r=>r.status==="ACTIVE").length, cancelled:all.filter(r=>r.status==="CANCELLED").length, totalPoolValue:all.reduce((s,r)=>s+r.poolTotal,0), paidToDate:paid, pendingPayouts:pending, forfeitedAmount:forfeited };
  }

  getAll(): SubscriptionIncentiveRecord[] { return this.readSubs(); }
  getById(id: string): SubscriptionIncentiveRecord|null { return this.readSubs().find(r=>r.subscriptionId===id)??null; }
  getAllAddons(): AddonIncentiveRecord[] { return this.readAddons(); }
}

export const incentiveV6 = new IncentiveStructureV6Service();

// Re-export under old name so existing imports don't break
export { incentiveV6 as incentiveStructureService };
