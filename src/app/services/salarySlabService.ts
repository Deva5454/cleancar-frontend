/**
 * Salary Slab Service
 *
 * Given a Gross monthly salary and a statutory scheme (state + bonus type),
 * looks up the matching band from HR/Finance's validated slab tables and
 * returns the full component breakdown — Basic, HRA, allowances, statutory
 * deductions, employer contributions, and CTC.
 *
 * Data source: Structure_Working_Piyush.xlsx, sheets "8.33 % Bonus - MH",
 * "8.33 % Bonus - Gujarat", and "20% Bonus" (the fourth sheet, "8.33 % Bonus
 * Maharashtra", was dropped — it had 20 formula errors and duplicated the
 * clean "MH" sheet).
 *
 * The "20% Bonus" (Maharashtra) source sheet only contains earnings
 * components (Basic/HRA/Interim Bonus/Allowances/LTA) — it has no ESIC, PT,
 * LWF, Gratuity, Net Pay, or CTC columns. For that scheme, those fields are
 * computed using the app's existing statutory compliance engine
 * (complianceEngine.ts) and standard formulas (Gratuity ≈ 4.81% of Basic,
 * Leave provision = 5% of Basic — both verified against the ratios actually
 * used in the MH/Gujarat 8.33% tables), not fabricated. Each computed field
 * is flagged so the UI can show HR it was derived, not sourced directly.
 *
 * There is no Gujarat + 20% Bonus table at all — that combination, and any
 * Gross outside a scheme's covered range, returns null so the caller can
 * fall back to fully manual entry.
 */

import mh833Data from "../data/salarySlabs/mh_833_bonus.json";
import gujarat833Data from "../data/salarySlabs/gujarat_833_bonus.json";
import mh20Data from "../data/salarySlabs/maharashtra_20_bonus.json";
import { calculateStatutoryDeductions } from "./payroll/complianceEngine";
import type { IndianState } from "./payroll/complianceRules";

export type SlabScheme = "MH_8_33_BONUS" | "GUJARAT_8_33_BONUS" | "MH_20_BONUS";

export const SLAB_SCHEME_LABELS: Record<SlabScheme, string> = {
  MH_8_33_BONUS: "Maharashtra — 8.33% Bonus",
  GUJARAT_8_33_BONUS: "Gujarat — 8.33% Bonus",
  MH_20_BONUS: "Maharashtra — 20% Bonus",
};

export const SLAB_SCHEME_STATE: Record<SlabScheme, IndianState> = {
  MH_8_33_BONUS: "MH",
  GUJARAT_8_33_BONUS: "GJ",
  MH_20_BONUS: "MH",
};

interface RawFullBand {
  fromGross: number; toGross: number;
  basicDA: number; hra: number; interimBonus: number;
  convyAllowance: number; mobileAllowance: number; supAllowance: number;
  eduAllowance: number; washingAllowance: number; lta: number; grossCalc: number;
  pfEmployee: number; esicEmployee: number; pt: number; lwfEmployee: number;
  deductionTotal: number; netPay: number;
  pfEmployer: number; esicEmployer: number; gratuity: number; lwfEmployer: number;
  leave: number; totalEmployerCost: number; ctcMonthly: number; ctcYearly: number;
}

interface RawEarningsOnlyBand {
  fromGross: number; toGross: number;
  basicDA: number; hra: number; interimBonus: number;
  convyAllowance: number; mobileAllowance: number; supAllowance: number;
  eduAllowance: number; washingAllowance: number; lta: number; grossCalc: number;
}

const TABLES: Record<SlabScheme, RawFullBand[] | RawEarningsOnlyBand[]> = {
  MH_8_33_BONUS: mh833Data as RawFullBand[],
  GUJARAT_8_33_BONUS: gujarat833Data as RawFullBand[],
  MH_20_BONUS: mh20Data as RawEarningsOnlyBand[],
};

/** Which fields are computed (not sourced directly from the table) per scheme. */
const COMPUTED_FIELDS: Record<SlabScheme, string[]> = {
  MH_8_33_BONUS: [],
  GUJARAT_8_33_BONUS: [],
  MH_20_BONUS: ["esicEmployee", "esicEmployer", "pt", "lwfEmployee", "lwfEmployer", "gratuity", "leave", "netPay", "deductionTotal", "totalEmployerCost", "ctcMonthly", "ctcYearly"],
};

export interface SlabStructureResult {
  scheme: SlabScheme;
  band: { fromGross: number; toGross: number };
  gross: number;

  // Earnings
  basicDA: number;
  hra: number;
  interimBonus: number;
  convyAllowance: number;
  mobileAllowance: number;
  supAllowance: number;
  eduAllowance: number;
  washingAllowance: number;
  lta: number;

  // Employee deductions
  pfEmployee: number;
  esicEmployee: number;
  pt: number;
  lwfEmployee: number;
  deductionTotal: number;
  netPay: number;

  // Employer contributions
  pfEmployer: number;
  esicEmployer: number;
  gratuity: number;
  lwfEmployer: number;
  leave: number;
  totalEmployerCost: number;

  // CTC
  ctcMonthly: number;
  ctcYearly: number;

  /** Field names that were derived via the compliance engine / standard
   *  formulas rather than sourced directly from the slab table (only
   *  populated for MH_20_BONUS). Used by the UI to show a "computed" badge. */
  computedFields: string[];
}

function findBand<T extends { fromGross: number; toGross: number }>(table: T[], gross: number): T | null {
  // Bands are contiguous and sorted — binary search for efficiency across ~2,300 rows.
  let lo = 0, hi = table.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const band = table[mid];
    if (gross < band.fromGross) hi = mid - 1;
    else if (gross > band.toGross) lo = mid + 1;
    else return band;
  }
  return null;
}

/**
 * Look up the slab band for a given scheme + gross salary and return the
 * full computed structure. Returns null if the scheme/gross combination
 * isn't covered (out of range, or no table exists for that pairing) — the
 * caller should fall back to fully manual entry in that case, not guess.
 */
export function computeStructureFromGross(scheme: SlabScheme, gross: number): SlabStructureResult | null {
  const table = TABLES[scheme];
  const band = findBand(table as any[], gross);
  if (!band) return null;

  if (scheme !== "MH_20_BONUS") {
    const full = band as RawFullBand;
    return {
      scheme, band: { fromGross: full.fromGross, toGross: full.toGross }, gross: full.grossCalc,
      basicDA: full.basicDA, hra: full.hra, interimBonus: full.interimBonus,
      convyAllowance: full.convyAllowance, mobileAllowance: full.mobileAllowance,
      supAllowance: full.supAllowance, eduAllowance: full.eduAllowance,
      washingAllowance: full.washingAllowance, lta: full.lta,
      pfEmployee: full.pfEmployee, esicEmployee: full.esicEmployee, pt: full.pt, lwfEmployee: full.lwfEmployee,
      deductionTotal: full.deductionTotal, netPay: full.netPay,
      pfEmployer: full.pfEmployer, esicEmployer: full.esicEmployer, gratuity: full.gratuity,
      lwfEmployer: full.lwfEmployer, leave: full.leave, totalEmployerCost: full.totalEmployerCost,
      ctcMonthly: full.ctcMonthly, ctcYearly: full.ctcYearly,
      computedFields: [],
    };
  }

  // MH_20_BONUS: earnings come from the table; statutory deductions,
  // gratuity, leave, net pay, and CTC are computed.
  const earn = band as RawEarningsOnlyBand;
  const compliance = calculateStatutoryDeductions(
    SLAB_SCHEME_STATE[scheme],
    {
      basic: earn.basicDA,
      hra: earn.hra,
      conveyance: earn.convyAllowance,
      medicalAllowance: 0,
      specialAllowance: earn.interimBonus + earn.supAllowance + earn.eduAllowance + earn.washingAllowance + earn.mobileAllowance,
      otherAllowances: earn.lta,
    },
    earn.grossCalc * 12
  );

  const gratuity = Math.round(earn.basicDA * 0.0481);
  const leave = Math.round(earn.basicDA * 0.05);
  const deductionTotal = compliance.deductions.pf.employee + compliance.deductions.esi.employee + compliance.deductions.pt.amount + compliance.deductions.lwf.employee;
  const netPay = earn.grossCalc - deductionTotal;
  const totalEmployerCost = compliance.deductions.pf.employer + compliance.deductions.esi.employer + gratuity + compliance.deductions.lwf.employer + leave;
  const ctcMonthly = earn.grossCalc + totalEmployerCost;

  return {
    scheme, band: { fromGross: earn.fromGross, toGross: earn.toGross }, gross: earn.grossCalc,
    basicDA: earn.basicDA, hra: earn.hra, interimBonus: earn.interimBonus,
    convyAllowance: earn.convyAllowance, mobileAllowance: earn.mobileAllowance,
    supAllowance: earn.supAllowance, eduAllowance: earn.eduAllowance,
    washingAllowance: earn.washingAllowance, lta: earn.lta,
    pfEmployee: compliance.deductions.pf.employee, esicEmployee: compliance.deductions.esi.employee,
    pt: compliance.deductions.pt.amount, lwfEmployee: compliance.deductions.lwf.employee,
    deductionTotal, netPay,
    pfEmployer: compliance.deductions.pf.employer, esicEmployer: compliance.deductions.esi.employer,
    gratuity, lwfEmployer: compliance.deductions.lwf.employer, leave, totalEmployerCost,
    ctcMonthly, ctcYearly: ctcMonthly * 12,
    computedFields: COMPUTED_FIELDS[scheme],
  };
}

/** Min/max Gross covered by a scheme's table — used to show HR the valid range upfront. */
export function getSchemeRange(scheme: SlabScheme): { min: number; max: number } {
  const table = TABLES[scheme];
  return { min: table[0].fromGross, max: table[table.length - 1].toGross };
}
