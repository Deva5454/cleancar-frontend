/**
 * salesIncentiveEngine.ts
 * Legacy wrapper — all new calculations delegated to incentiveStructureV6.ts
 * Source of truth: Incentive Structure v6 Final · 28 May 2026
 */
import { incentiveV6, POOL_SPLIT_PCT, POOL_BY_TERM, isZeroPool,
         TSE, SH, SM_GATE, WASHER, ADDON_PRICES } from "./incentiveStructureV6";

// Re-export v6 constants with legacy names for backward compatibility
export const POOL_SPLIT = POOL_SPLIT_PCT;
export const POOL_BASE_3M = POOL_BY_TERM[3]; // 150
export { isZeroPool, TSE as TSE_CONSTANTS, SH as SH_CONSTANTS, WASHER as WASHER_CONSTANTS };
export { incentiveV6 };

/**
 * salesIncentiveEngine.ts
 *
 * Authoritative incentive + payroll calculation engine for:
 *   - Sales Head (SH)  — coaching bonus + quality bonuses + personal conversion
 *   - Sales Manager (SM) — gate-based per-conversion + alliance activation + block bonus
 *
 * Spec references:
 *   Sales Head Module v1.1 — Sections 7, 10
 *   SM Module v2.0 — Sections 10.1–10.4
 *
 * All calculations are deterministic and test-friendly (no side effects).
 */

// ── Shared types ──────────────────────────────────────────────────────────────

export type CommitmentTerm = 1 | 3 | 6 | 12;

export interface Tranche {
  id: string;
  closureId: string;
  role: "SH" | "SM";
  personId: string;
  term: CommitmentTerm;
  checkMonth: 1 | 3 | 6 | 12;        // M1 / M3 / M6 / M12
  dueDate: string;                    // ISO date of payroll cycle
  amount: number;
  status: "Pending" | "Released" | "Forfeited";
  subscriptionActive?: boolean;
}

// ══════════════════════════════════════════════════════════════════════════════
// SALES HEAD INCENTIVE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export interface SHTeamInput {
  tceClosures: number[];       // Array of each TCE's individual closure count (length = 3)
  teamSLAPct: number;          // Team average SLA %
  teamPlanMixPct: number;      // Team % of Shampoo+Wax or 3-month+ closures
  teamChurnCount: number;      // # of closures churned within 30 days this month
}

export interface SHPersonalInput {
  personalClosures: number;
  // Term breakdown of personal closures
  byTerm: { "1": number; "3": number; "6": number; "12": number };
}

export interface SHCoachingBonusResult {
  lowestTCECount: number;
  allAboveGate: boolean;
  level: 0 | 1 | 2 | 3;
  bonus: number;
  // What the next level requires
  nextLevelAt: number | null;
  nextLevelBonus: number | null;
}

export interface SHQualityBonusResult {
  slaBonus: { earned: boolean; amount: number; currentPct: number; targetPct: 90 };
  zeroChurnBonus: { earned: boolean; amount: number; churnCount: number };
  planMixBonus: { earned: boolean; amount: number; currentPct: number; targetPct: 60 };
  totalQuality: number;
}

export interface SHPersonalIncentiveResult {
  closures: number;
  slab: 1 | 2 | 3 | 4;
  baseRate: number;
  byTerm: { term: CommitmentTerm; count: number; ratePerSub: number; m1Amount: number }[];
  totalM1: number;
  futureTransches: Tranche[];
  cappedM1Items: string[];   // IDs where M1 was capped at ₹100
}

export interface SHPayrollBreakdown {
  fixedSalary: number;         // ₹0 — Sales Head is fully variable per spec (no fixed stated)
  coachingBonus: SHCoachingBonusResult;
  qualityBonuses: SHQualityBonusResult;
  personalIncentive: SHPersonalIncentiveResult;
  totalVariableM1: number;     // All variable components payable this payroll cycle
  totalForecastFull: number;   // Including pending future tranches
  payrollLineItems: Array<{ label: string; amount: number; type: "fixed" | "variable" | "deduction" }>;
}

// Personal slab lookup (Section 10.3)
const SH_PERSONAL_SLABS: Array<{ min: number; max: number; rate: number; slab: 1 | 2 | 3 | 4 }> = [
  { min: 10, max: 25,  rate: 15, slab: 1 },
  { min: 26, max: 50,  rate: 20, slab: 2 },
  { min: 51, max: 80,  rate: 25, slab: 3 },
  { min: 81, max: 9999,rate: 35, slab: 4 },
];

// Term multipliers (total incentive = base × term)
const SH_TERM_MULT: Record<CommitmentTerm, number> = { 1: 1, 3: 3, 6: 6, 12: 12 };

// M1 tranche percentages per term (Section 7.1)
const SH_M1_PCT: Record<CommitmentTerm, number> = { 1: 1.0, 3: 0.5, 6: 0.4, 12: 0.25 };
const SH_M1_CAP = 100; // ₹100/sub cap on M1

export class SalesHeadIncentiveEngine {

  computeCoachingBonus(team: SHTeamInput): SHCoachingBonusResult {
    const lowest = Math.min(...team.tceClosures);
    let level: 0 | 1 | 2 | 3 = 0;
    let bonus = 0;
    let nextLevelAt: number | null = null;
    let nextLevelBonus: number | null = null;

    if (lowest >= 100) {
      level = 3; bonus = 12500;
    } else if (lowest >= 75) {
      level = 2; bonus = 7500;
      nextLevelAt = 100; nextLevelBonus = 12500;
    } else if (lowest >= 25) {
      level = 1; bonus = 1500;
      nextLevelAt = 75; nextLevelBonus = 7500;
    } else {
      nextLevelAt = 25; nextLevelBonus = 1500;
    }

    return {
      lowestTCECount: lowest,
      allAboveGate: lowest >= 25,
      level, bonus, nextLevelAt, nextLevelBonus,
    };
  }

  computeQualityBonuses(team: SHTeamInput): SHQualityBonusResult {
    const slaMet     = team.teamSLAPct >= 90;
    const noChurn    = team.teamChurnCount === 0;
    const planMixMet = team.teamPlanMixPct >= 60;

    return {
      slaBonus:      { earned: slaMet,     amount: slaMet     ? 2000 : 0, currentPct: team.teamSLAPct,     targetPct: 90 },
      zeroChurnBonus:{ earned: noChurn,    amount: noChurn    ? 1500 : 0, churnCount: team.teamChurnCount },
      planMixBonus:  { earned: planMixMet, amount: planMixMet ? 1000 : 0, currentPct: team.teamPlanMixPct, targetPct: 60 },
      totalQuality: (slaMet ? 2000 : 0) + (noChurn ? 1500 : 0) + (planMixMet ? 1000 : 0),
    };
  }

  computePersonalIncentive(personal: SHPersonalInput, month: string): SHPersonalIncentiveResult {
    const { personalClosures, byTerm } = personal;

    if (personalClosures < 10) {
      // Below personal gate — no personal incentive
      return {
        closures: personalClosures,
        slab: 1, baseRate: 0,
        byTerm: [], totalM1: 0,
        futureTransches: [], cappedM1Items: [],
      };
    }

    const slabEntry = SH_PERSONAL_SLABS.find(s => personalClosures >= s.min && personalClosures <= s.max)
      ?? SH_PERSONAL_SLABS[3];

    const cappedM1Items: string[] = [];
    const futureTransches: Tranche[] = [];
    let totalM1 = 0;

    const termBreakdown = ([1, 3, 6, 12] as CommitmentTerm[]).map(term => {
      const count = byTerm[String(term) as "1" | "3" | "6" | "12"] || 0;
      const totalPerSub = slabEntry.rate * SH_TERM_MULT[term];
      const rawM1PerSub = totalPerSub * SH_M1_PCT[term];
      const cappedM1PerSub = Math.min(rawM1PerSub, SH_M1_CAP);
      const wasCapped = rawM1PerSub > SH_M1_CAP;

      const m1Amount = count * cappedM1PerSub;
      totalM1 += m1Amount;

      if (wasCapped) cappedM1Items.push(`Slab ${slabEntry.slab} × ${term}M`);

      // Schedule future tranches
      if (term >= 3) {
        const checkMonths: Array<1 | 3 | 6 | 12> = term === 3 ? [3] : term === 6 ? [3, 6] : [3, 6, 12];
        checkMonths.forEach(cm => {
          const [yr, mo] = month.split("-").map(Number);
          const due = new Date(yr, mo - 1 + cm, 1).toISOString().slice(0, 7);
          const remainingPct = (1 - SH_M1_PCT[term]) / (checkMonths.length);
          for (let i = 0; i < count; i++) {
            futureTransches.push({
              id: `SH-${month}-${term}m-${cm}-${i}`,
              closureId: `CLOSURE-SH-${month}-${i}`,
              role: "SH",
              personId: "EMP-SH-001",
              term, checkMonth: cm, dueDate: due,
              amount: Math.round(totalPerSub * remainingPct),
              status: "Pending",
            });
          }
        });
      }

      return { term, count, ratePerSub: slabEntry.rate, m1Amount };
    });

    return {
      closures: personalClosures,
      slab: slabEntry.slab,
      baseRate: slabEntry.rate,
      byTerm: termBreakdown.filter(t => t.count > 0),
      totalM1, futureTransches, cappedM1Items,
    };
  }

  computeFullPayroll(
    team: SHTeamInput,
    personal: SHPersonalInput,
    month: string
  ): SHPayrollBreakdown {
    const coaching  = this.computeCoachingBonus(team);
    const quality   = this.computeQualityBonuses(team);
    const perso     = this.computePersonalIncentive(personal, month);

    const totalVariableM1 = coaching.bonus + quality.totalQuality + perso.totalM1;

    const futureTotal = perso.futureTransches
      .filter(t => t.status === "Pending")
      .reduce((s, t) => s + t.amount, 0);

    const lineItems: SHPayrollBreakdown["payrollLineItems"] = [
      { label: "Coaching Bonus",         amount: coaching.bonus,      type: "variable" },
      { label: "SLA Compliance Bonus",   amount: quality.slaBonus.amount,       type: "variable" },
      { label: "Zero-Churn Bonus",       amount: quality.zeroChurnBonus.amount, type: "variable" },
      { label: "Plan Mix Bonus",         amount: quality.planMixBonus.amount,   type: "variable" },
      { label: "Personal Conversion M1", amount: perso.totalM1,       type: "variable" },
    ].filter(l => l.amount > 0);

    // Statutory deductions on total (PF: 12% of basic — Sales Head has no fixed basic per spec,
    // but we apply PF on the incentive payout as per standard practice)
    const pf  = Math.round(totalVariableM1 * 0.12);
    const esi = totalVariableM1 <= 21000 ? Math.round(totalVariableM1 * 0.0075) : 0;
    if (pf > 0)  lineItems.push({ label: "PF Deduction (12%)",    amount: -pf,  type: "deduction" });
    if (esi > 0) lineItems.push({ label: "ESI Deduction (0.75%)", amount: -esi, type: "deduction" });

    return {
      fixedSalary: 0,
      coachingBonus: coaching,
      qualityBonuses: quality,
      personalIncentive: perso,
      totalVariableM1,
      totalForecastFull: totalVariableM1 + futureTotal,
      payrollLineItems: lineItems,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SALES MANAGER INCENTIVE ENGINE
// ══════════════════════════════════════════════════════════════════════════════

export interface SMGateInput {
  activeLocations: number;       // Active or Active Prospect
  leadsMTD: number;              // Sum of all 3 mechanisms
  conversionsMTD: number;        // Closed Won from SM-attributed leads
}

export interface SMConversionInput {
  byTerm: { "1": number; "3": number; "6": number; "12": number };
}

export interface SMBlockInput {
  deals: Array<{
    dealId: string;
    totalVehicles: number;
    activeVehicles: number;       // at M3 check
    additionalVehicles: number;   // beyond base 10
    phase1Paid: boolean;
  }>;
}

export interface SMActivationInput {
  locations: Array<{
    locationId: string;
    payingCustomers: number;
    previousMilestone: number;    // last milestone already paid (0, 5, 10, …)
  }>;
}

export interface SMGateResult {
  locationMet: boolean;
  leadMet: boolean;
  conversionMet: boolean;
  allMet: boolean;
  fixedSalary: number;           // ₹35,000 always
}

export interface SMPerConversionResult {
  gateCleared: boolean;
  m1Total: number;
  futureTransches: Tranche[];
  breakdown: Array<{ term: CommitmentTerm; count: number; feePerSub: number; m1Amount: number }>;
}

export interface SMActivationBonusResult {
  newTriggers: Array<{ locationId: string; milestone: number; amount: number }>;
  totalAmount: number;
}

export interface SMBlockBonusResult {
  phase1Total: number;
  phase2Total: number;
  additionalTotal: number;
  perDeal: Array<{
    dealId: string;
    phase1: number;
    phase2: number;
    additional: number;
  }>;
}

export interface SMPayrollBreakdown {
  fixedSalary: number;               // ₹35,000 always
  gateStatus: SMGateResult;
  perConversion: SMPerConversionResult;
  activationBonus: SMActivationBonusResult;
  blockBonus: SMBlockBonusResult;
  totalM1: number;                   // All M1 payable this cycle
  totalForecast: number;             // M1 + pending future tranches
  payrollLineItems: Array<{ label: string; amount: number; type: "fixed" | "variable" | "deduction" }>;
}

// SM per-conversion fee table (Section 10.2)
const SM_FEES: Record<CommitmentTerm, { total: number; m1Pct: number; m3Pct?: number; m6Pct?: number; m12Pct?: number }> = {
  1:  { total: 33,  m1Pct: 1.00 },
  3:  { total: 100, m1Pct: 0.50, m3Pct: 0.50 },
  6:  { total: 200, m1Pct: 0.40, m3Pct: 0.30, m6Pct: 0.30 },
  12: { total: 400, m1Pct: 0.25, m3Pct: 0.25, m6Pct: 0.25, m12Pct: 0.25 },
};

export class SalesManagerIncentiveEngine {

  computeGate(gate: SMGateInput): SMGateResult {
    const locationMet   = gate.activeLocations >= 5;
    const leadMet       = gate.leadsMTD >= 30;
    const conversionMet = gate.conversionsMTD >= 5;
    return {
      locationMet, leadMet, conversionMet,
      allMet: locationMet && leadMet && conversionMet,
      fixedSalary: 35000,
    };
  }

  computePerConversion(
    gate: SMGateInput,
    conversions: SMConversionInput,
    month: string
  ): SMPerConversionResult {
    const gateResult = this.computeGate(gate);

    if (!gateResult.allMet) {
      return { gateCleared: false, m1Total: 0, futureTransches: [], breakdown: [] };
    }

    let m1Total = 0;
    const futureTransches: Tranche[] = [];
    const breakdown: SMPerConversionResult["breakdown"] = [];

    ([1, 3, 6, 12] as CommitmentTerm[]).forEach(term => {
      const count = conversions.byTerm[String(term) as "1" | "3" | "6" | "12"] || 0;
      if (!count) return;

      const fee = SM_FEES[term];
      const m1Amount = Math.round(fee.total * fee.m1Pct) * count;
      m1Total += m1Amount;
      breakdown.push({ term, count, feePerSub: fee.total, m1Amount });

      // Future tranches
      if (term >= 3) {
        const checkPairs: Array<[1 | 3 | 6 | 12, number]> = [];
        if (fee.m3Pct)  checkPairs.push([3,  fee.m3Pct]);
        if (fee.m6Pct)  checkPairs.push([6,  fee.m6Pct]);
        if (fee.m12Pct) checkPairs.push([12, fee.m12Pct]);

        checkPairs.forEach(([cm, pct]) => {
          const [yr, mo] = month.split("-").map(Number);
          const due = new Date(yr, mo - 1 + cm, 1).toISOString().slice(0, 7);
          for (let i = 0; i < count; i++) {
            futureTransches.push({
              id: `SM-${month}-${term}m-${cm}-${i}`,
              closureId: `CLOSURE-SM-${month}-${i}`,
              role: "SM",
              personId: "EMP-SM-001",
              term, checkMonth: cm, dueDate: due,
              amount: Math.round(fee.total * pct),
              status: "Pending",
            });
          }
        });
      }
    });

    return { gateCleared: true, m1Total, futureTransches, breakdown };
  }

  computeActivationBonus(input: SMActivationInput): SMActivationBonusResult {
    const newTriggers: SMActivationBonusResult["newTriggers"] = [];
    let totalAmount = 0;

    input.locations.forEach(loc => {
      const prevMilestone = loc.previousMilestone;
      const current = loc.payingCustomers;

      // First milestone: 5th customer → ₹500
      if (prevMilestone < 5 && current >= 5) {
        newTriggers.push({ locationId: loc.locationId, milestone: 5, amount: 500 });
        totalAmount += 500;
      }

      // Recurring: every additional 5 (10th, 15th, 20th…) → ₹100
      const prevHigher = Math.floor(prevMilestone / 5) * 5;
      const currHigher = Math.floor(current / 5) * 5;
      const steps = (currHigher - Math.max(prevHigher, 5)) / 5;
      if (steps > 0) {
        for (let s = 1; s <= steps; s++) {
          const milestone = Math.max(prevHigher, 5) + s * 5;
          if (milestone > 5) {  // 10, 15, 20 etc
            newTriggers.push({ locationId: loc.locationId, milestone, amount: 100 });
            totalAmount += 100;
          }
        }
      }
    });

    return { newTriggers, totalAmount };
  }

  computeBlockBonus(input: SMBlockInput): SMBlockBonusResult {
    let phase1Total = 0, phase2Total = 0, additionalTotal = 0;
    const perDeal = input.deals.map(deal => {
      const phase1 = deal.phase1Paid ? 0 : 3750;                          // already paid or pending
      const phase2 = Math.round((deal.activeVehicles / Math.max(1, deal.totalVehicles)) * 3750);
      const additional = deal.additionalVehicles * 1500;
      phase1Total    += phase1;
      phase2Total    += phase2;
      additionalTotal += additional;
      return { dealId: deal.dealId, phase1, phase2, additional };
    });
    return { phase1Total, phase2Total, additionalTotal, perDeal };
  }

  computeFullPayroll(
    gate: SMGateInput,
    conversions: SMConversionInput,
    activation: SMActivationInput,
    blocks: SMBlockInput,
    month: string
  ): SMPayrollBreakdown {
    const gateStatus   = this.computeGate(gate);
    const perConv      = this.computePerConversion(gate, conversions, month);
    const activBonus   = this.computeActivationBonus(activation);
    const blockBonus   = this.computeBlockBonus(blocks);

    // M1 this cycle = fixed + all M1 variable items
    const m1Variable = perConv.m1Total + activBonus.totalAmount +
      blockBonus.phase1Total + blockBonus.phase2Total + blockBonus.additionalTotal;
    const totalM1 = gateStatus.fixedSalary + m1Variable;

    const futureTotal = perConv.futureTransches
      .filter(t => t.status === "Pending")
      .reduce((s, t) => s + t.amount, 0);

    const lineItems: SMPayrollBreakdown["payrollLineItems"] = [
      { label: "Fixed Salary",              amount: gateStatus.fixedSalary, type: "fixed" },
      { label: "Per-Conversion Fee M1",     amount: perConv.m1Total,        type: "variable" },
      { label: "Alliance Activation Bonus", amount: activBonus.totalAmount, type: "variable" },
      { label: "Block Bonus Phase 1",       amount: blockBonus.phase1Total, type: "variable" },
      { label: "Block Bonus Phase 2",       amount: blockBonus.phase2Total, type: "variable" },
      { label: "Block Additional Vehicles", amount: blockBonus.additionalTotal, type: "variable" },
    ].filter(l => l.amount > 0);

    // Statutory deductions on fixed salary
    const pfBase = Math.min(gateStatus.fixedSalary, 15000);  // PF capped at ₹15,000 basic
    const pf  = Math.round(pfBase * 0.12);
    const esi = gateStatus.fixedSalary <= 21000 ? Math.round(gateStatus.fixedSalary * 0.0075) : 0;
    if (pf  > 0) lineItems.push({ label: "PF Deduction (12%)",    amount: -pf,  type: "deduction" });
    if (esi > 0) lineItems.push({ label: "ESI Deduction (0.75%)", amount: -esi, type: "deduction" });

    return {
      fixedSalary: gateStatus.fixedSalary,
      gateStatus, perConversion: perConv,
      activationBonus: activBonus, blockBonus,
      totalM1, totalForecast: totalM1 + futureTotal,
      payrollLineItems: lineItems,
    };
  }
}

// ── Singleton exports ─────────────────────────────────────────────────────────
export const salesHeadIncentiveEngine = new SalesHeadIncentiveEngine();
export const salesManagerIncentiveEngine = new SalesManagerIncentiveEngine();
