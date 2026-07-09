/**
 * Investment Declaration Service
 * Employee-submitted tax-saving investment declarations (Old Regime only),
 * with proof upload, a submission cutoff date, and HR verification.
 *
 * Once a declaration is Verified, its capped total is available via
 * getVerifiedDeductionTotal() for Payroll to pass into
 * complianceEngine.calculateStatutoryDeductions() so it actually reduces
 * TDS — this is the real integration point the earlier "Tax Regime
 * Optimizer" (OptimizeSalaryDrawer/SavingsInsightCard) did not provide.
 */

export type TaxRegime = "Old" | "New";

export type DeclarationStatus =
  | "Draft"
  | "Submitted"
  | "Verified"
  | "Rejected";

export type DeclarationSection =
  | "section80C"        // LIC, PPF, ELSS, EPF (employee), tuition fees, etc.
  | "section80D"         // Health insurance premium
  | "homeLoanInterest"   // Section 24(b)
  | "nps80CCD1B"         // National Pension Scheme, additional
  | "hraExemption"       // Rent receipts, if HRA is part of salary
  | "other";

export const SECTION_CAPS: Record<DeclarationSection, number> = {
  section80C: 150000,
  section80D: 25000,
  homeLoanInterest: 200000,
  nps80CCD1B: 50000,
  hraExemption: Infinity, // computed off actual rent/HRA, not a flat cap
  other: 0,               // informational only — not counted toward TDS deduction
};

export const SECTION_LABELS: Record<DeclarationSection, string> = {
  section80C: "Section 80C (LIC, PPF, ELSS, EPF, Tuition Fees)",
  section80D: "Section 80D (Health Insurance Premium)",
  homeLoanInterest: "Home Loan Interest (Section 24b)",
  nps80CCD1B: "NPS Additional Contribution (80CCD-1B)",
  hraExemption: "HRA Exemption (Rent Receipts)",
  other: "Other (Informational Only)",
};

export interface DeclarationLineItem {
  section: DeclarationSection;
  declaredAmount: number;
  proofDataUrl?: string;
  proofFileName?: string;
}

export interface InvestmentDeclaration {
  id: string;
  employeeId: string;
  employeeName: string;
  financialYear: string; // e.g. "2026-27"
  regime: TaxRegime;
  lineItems: DeclarationLineItem[];
  status: DeclarationStatus;

  submittedAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;

  createdAt: string;
  updatedAt: string;
}

export interface DeclarationWindow {
  financialYear: string;
  opensOn: string;   // ISO date
  cutoffDate: string; // ISO date — submissions blocked after this
}

const STORAGE_KEY = "INVESTMENT_DECLARATIONS";
const WINDOW_KEY = "INVESTMENT_DECLARATION_WINDOWS";

// Sensible default window if HR/Admin hasn't configured one for a given FY:
// opens at the start of the FY, cuts off mid-way through Q4 (a realistic
// payroll cutoff for the last TDS-adjustment cycle before Feb/March payroll).
function defaultWindow(financialYear: string): DeclarationWindow {
  const startYear = parseInt(financialYear.split("-")[0], 10);
  return {
    financialYear,
    opensOn: `${startYear}-04-01`,
    cutoffDate: `${startYear + 1}-01-15`,
  };
}

class InvestmentDeclarationService {
  private subscribers: Set<(records: InvestmentDeclaration[]) => void> = new Set();

  private read(): InvestmentDeclaration[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as InvestmentDeclaration[]) : [];
    } catch {
      return [];
    }
  }

  private write(records: InvestmentDeclaration[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    this.subscribers.forEach((cb) => cb(records));
  }

  subscribe(cb: (records: InvestmentDeclaration[]) => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }

  // ── Windows / cutoff dates ────────────────────────────────────────────

  getWindow(financialYear: string): DeclarationWindow {
    try {
      const raw = localStorage.getItem(WINDOW_KEY);
      const all: DeclarationWindow[] = raw ? JSON.parse(raw) : [];
      return all.find((w) => w.financialYear === financialYear) || defaultWindow(financialYear);
    } catch {
      return defaultWindow(financialYear);
    }
  }

  setWindow(window: DeclarationWindow): void {
    try {
      const raw = localStorage.getItem(WINDOW_KEY);
      const all: DeclarationWindow[] = raw ? JSON.parse(raw) : [];
      const next = [...all.filter((w) => w.financialYear !== window.financialYear), window];
      localStorage.setItem(WINDOW_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  isPastCutoff(financialYear: string): boolean {
    const w = this.getWindow(financialYear);
    return new Date() > new Date(w.cutoffDate);
  }

  daysUntilCutoff(financialYear: string): number {
    const w = this.getWindow(financialYear);
    const diffMs = new Date(w.cutoffDate).getTime() - Date.now();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  // ── CRUD ──────────────────────────────────────────────────────────────

  getAll(): InvestmentDeclaration[] {
    return this.read();
  }

  getByEmployee(employeeId: string, financialYear: string): InvestmentDeclaration | undefined {
    return this.read().find(
      (d) => d.employeeId === employeeId && d.financialYear === financialYear
    );
  }

  getPendingVerification(): InvestmentDeclaration[] {
    return this.read().filter((d) => d.status === "Submitted");
  }

  saveDraft(
    input: Omit<InvestmentDeclaration, "id" | "status" | "createdAt" | "updatedAt">
  ): InvestmentDeclaration {
    const records = this.read();
    const existing = records.find(
      (d) => d.employeeId === input.employeeId && d.financialYear === input.financialYear
    );
    const now = new Date().toISOString();

    if (existing && existing.status === "Draft") {
      const updated: InvestmentDeclaration = { ...existing, ...input, updatedAt: now };
      this.write(records.map((d) => (d.id === existing.id ? updated : d)));
      return updated;
    }

    const record: InvestmentDeclaration = {
      ...input,
      id: `DECL_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };
    this.write([...records, record]);
    return record;
  }

  submit(declarationId: string): { ok: boolean; error?: string } {
    const records = this.read();
    const record = records.find((d) => d.id === declarationId);
    if (!record) return { ok: false, error: "Declaration not found" };
    if (record.status !== "Draft") return { ok: false, error: "Only draft declarations can be submitted" };
    if (this.isPastCutoff(record.financialYear)) {
      return { ok: false, error: `Submission window closed on ${this.getWindow(record.financialYear).cutoffDate}` };
    }
    record.status = "Submitted";
    record.submittedAt = new Date().toISOString();
    record.updatedAt = record.submittedAt;
    this.write(records);
    return { ok: true };
  }

  verify(declarationId: string, verifiedBy: string): InvestmentDeclaration | null {
    const records = this.read();
    const record = records.find((d) => d.id === declarationId);
    if (!record || record.status !== "Submitted") return null;
    record.status = "Verified";
    record.verifiedBy = verifiedBy;
    record.verifiedAt = new Date().toISOString();
    record.updatedAt = record.verifiedAt;
    this.write(records);
    return record;
  }

  reject(declarationId: string, rejectedBy: string, reason: string): InvestmentDeclaration | null {
    const records = this.read();
    const record = records.find((d) => d.id === declarationId);
    if (!record || record.status !== "Submitted") return null;
    record.status = "Rejected";
    record.rejectedBy = rejectedBy;
    record.rejectedAt = new Date().toISOString();
    record.rejectionReason = reason;
    record.updatedAt = record.rejectedAt;
    this.write(records);
    return record;
  }

  // ── Totals ────────────────────────────────────────────────────────────

  /** Section-capped total for a single declaration (used for display + verification). */
  getCappedTotal(record: InvestmentDeclaration): number {
    if (record.regime !== "Old") return 0;
    return record.lineItems.reduce((sum, item) => {
      const cap = SECTION_CAPS[item.section];
      if (item.section === "other") return sum; // informational only
      const counted = Number.isFinite(cap) ? Math.min(item.declaredAmount, cap) : item.declaredAmount;
      return sum + Math.max(0, counted);
    }, 0);
  }

  /**
   * The number Payroll should actually use: only counts if the employee is
   * on the Old Regime AND HR has Verified the declaration. Everything else
   * (Draft/Submitted/Rejected, or New Regime) contributes 0 — matching how
   * TDS must not be reduced on unverified or inapplicable claims.
   */
  getVerifiedDeductionTotal(employeeId: string, financialYear: string): number {
    const record = this.getByEmployee(employeeId, financialYear);
    if (!record || record.status !== "Verified" || record.regime !== "Old") return 0;
    return this.getCappedTotal(record);
  }
}

export const investmentDeclarationService = new InvestmentDeclarationService();
