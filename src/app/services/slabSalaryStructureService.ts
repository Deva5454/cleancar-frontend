/**
 * Slab Salary Structure Service
 *
 * Persists the full, granular result of a gross-to-structure slab lookup
 * (including fields like Interim Bonus, LWF, Gratuity, Leave provision that
 * the shared salaryStructureService's generic SalaryComponents shape has no
 * slot for), plus an audit log of every manual override HR/Super Admin makes
 * after the auto-fill.
 *
 * On save, also pushes a mapped summary into the real salaryStructureService
 * (the one Payroll actually reads) so this isn't a disconnected new store —
 * continuing the single-source-of-truth pattern from earlier in this project.
 */

import { salaryStructureService, type SalaryComponents } from "./salaryStructureService";
import type { SlabScheme, SlabStructureResult } from "./salarySlabService";

export interface SlabOverrideEntry {
  field: string;
  fromValue: number;
  toValue: number;
  changedBy: string;
  changedByRole: string;
  changedAt: string;
}

export interface SlabSalaryStructureRecord {
  id: string;
  roleId: string;
  roleName: string;
  structureName: string;
  scheme: SlabScheme;
  enteredGross: number; // what HR originally typed in, before any override drift
  result: SlabStructureResult; // the (possibly overridden) final values
  overrides: SlabOverrideEntry[];
  linkedSalaryStructureId: string; // id in salaryStructureService, for Payroll
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "SLAB_SALARY_STRUCTURES";

function readAll(): SlabSalaryStructureRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function writeAll(records: SlabSalaryStructureRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

/** Maps the granular slab result into the shared SalaryComponents shape
 *  that salaryStructureService (and Payroll) actually consumes. Interim
 *  Bonus / Mobile / Supplementary / Education / Washing / LTA don't have
 *  dedicated slots there, so they're bundled into specialAllowance — the
 *  full breakdown is preserved separately in this service's own record. */
function toSharedComponents(result: SlabStructureResult): SalaryComponents {
  const bundledSpecial = result.interimBonus + result.mobileAllowance + result.supAllowance + result.eduAllowance + result.washingAllowance + result.lta;
  return {
    monthlyGross: result.gross,
    annualCTC: result.ctcYearly,
    basic: result.basicDA,
    hra: result.hra,
    conveyance: result.convyAllowance,
    medical: 0,
    specialAllowance: bundledSpecial,
    employeePF: result.pfEmployee,
    employerPF: result.pfEmployer,
    employeeESIC: result.esicEmployee,
    employerESIC: result.esicEmployer,
    professionalTax: result.pt,
    totalDeductions: result.deductionTotal,
    netTakeHome: result.netPay,
    totalEmployerCost: result.totalEmployerCost,
    totalCTC: result.ctcMonthly,
    gross: result.gross,
    pf: result.pfEmployee,
    esic: result.esicEmployee,
  };
}

class SlabSalaryStructureService {
  private subscribers: Set<() => void> = new Set();
  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }
  private notify() { this.subscribers.forEach((cb) => cb()); }

  getAll(): SlabSalaryStructureRecord[] {
    return readAll();
  }

  getById(id: string): SlabSalaryStructureRecord | undefined {
    return readAll().find((r) => r.id === id);
  }

  /** Creates the record AND pushes a linked entry into salaryStructureService. */
  create(input: {
    roleId: string; roleName: string; structureName: string;
    scheme: SlabScheme; enteredGross: number; result: SlabStructureResult;
    createdBy: string;
  }): SlabSalaryStructureRecord {
    const now = new Date().toISOString();

    const linked = salaryStructureService.add({
      roleId: input.roleId,
      roleName: input.roleName,
      structureName: input.structureName,
      monthlyGross: input.result.gross,
      components: toSharedComponents(input.result),
      isMetro: false,
      applyPFCap: true,
      createdBy: input.createdBy,
      validFrom: now.split("T")[0],
      validTill: "",
      isActive: true,
      lastUpdated: now.split("T")[0],
    });

    const record: SlabSalaryStructureRecord = {
      id: `SLAB-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      roleId: input.roleId, roleName: input.roleName, structureName: input.structureName,
      scheme: input.scheme, enteredGross: input.enteredGross, result: input.result,
      overrides: [],
      linkedSalaryStructureId: linked.id,
      createdBy: input.createdBy, createdAt: now, updatedAt: now,
    };

    writeAll([...readAll(), record]);
    this.notify();
    return record;
  }

  /** Applies a manual override to one field of an existing record, logs it,
   *  recomputes the derived totals (Gross/Net Pay/CTC are never directly
   *  editable — they're always the sum of the components), and re-syncs the
   *  linked salaryStructureService entry. */
  override(
    id: string,
    field: keyof SlabStructureResult,
    newValue: number,
    changedBy: string,
    changedByRole: string
  ): SlabSalaryStructureRecord | null {
    const all = readAll();
    const record = all.find((r) => r.id === id);
    if (!record) return null;

    const oldValue = record.result[field] as unknown as number;
    if (oldValue === newValue) return record;

    const updatedResult: SlabStructureResult = { ...record.result, [field]: newValue };

    // Recompute derived totals from components — never editable directly.
    const earningsSum =
      updatedResult.basicDA + updatedResult.hra + updatedResult.interimBonus +
      updatedResult.convyAllowance + updatedResult.mobileAllowance + updatedResult.supAllowance +
      updatedResult.eduAllowance + updatedResult.washingAllowance + updatedResult.lta;
    updatedResult.gross = earningsSum;
    updatedResult.deductionTotal = updatedResult.pfEmployee + updatedResult.esicEmployee + updatedResult.pt + updatedResult.lwfEmployee;
    updatedResult.netPay = updatedResult.gross - updatedResult.deductionTotal;
    updatedResult.totalEmployerCost = updatedResult.pfEmployer + updatedResult.esicEmployer + updatedResult.gratuity + updatedResult.lwfEmployer + updatedResult.leave;
    updatedResult.ctcMonthly = updatedResult.gross + updatedResult.totalEmployerCost;
    updatedResult.ctcYearly = updatedResult.ctcMonthly * 12;

    const overrideEntry: SlabOverrideEntry = {
      field: field as string, fromValue: oldValue, toValue: newValue,
      changedBy, changedByRole, changedAt: new Date().toISOString(),
    };

    const updatedRecord: SlabSalaryStructureRecord = {
      ...record,
      result: updatedResult,
      overrides: [...record.overrides, overrideEntry],
      updatedAt: new Date().toISOString(),
    };

    writeAll(all.map((r) => (r.id === id ? updatedRecord : r)));

    // Keep the linked, Payroll-facing structure in sync.
    salaryStructureService.update(record.linkedSalaryStructureId, {
      monthlyGross: updatedResult.gross,
      components: toSharedComponents(updatedResult),
    });

    this.notify();
    return updatedRecord;
  }
}

export const slabSalaryStructureService = new SlabSalaryStructureService();
