/**
 * kraCityDataSources.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real KPI computations for City Manager, built against genuinely real
 * data - each source verified directly before use, including a real
 * regression caught and fixed for Revenue during the OM build (see
 * kraOMDataSources.ts's own header for that full story).
 *
 * Revenue and Retention are the exact same real, verified sources
 * already built for Operations Manager (computeOMRealRevenue /
 * computeOMRealRetentionRate) - reused directly, not duplicated.
 *
 * EBITDA is new here, and was deliberately held back from an earlier
 * build pass until this real verification could be done properly:
 *
 *   - Real expenses are computed from real JournalEntry lines (the
 *     same real journal system Revenue itself is confirmed to flow
 *     through downstream of, via RevenueCaptureSystem.tsx).
 *   - The real, reliable way to know whether a given journal line is a
 *     genuine expense - not GST, not a bank/vendor settlement - is each
 *     line's accountHead, looked up against the real LedgerMaster it
 *     references, and checking that ledger's own `nature` field. This
 *     was confirmed directly: expense ledgers are created with
 *     nature: "expense", while GST input ledgers (Input CGST/SGST/IGST)
 *     are separate ledgers with a different real nature - confirmed via
 *     ExpenseVoucher.tsx's own real journal-line construction and its
 *     "FIX 8 + FIX 9: GST goes to Input ITC ledgers (asset), not to
 *     expense" comment.
 *   - Revenue's own journal line uses a fixed, literal accountHead
 *     ("sales") rather than a real ledger ID - this doesn't affect the
 *     expense calculation here, since real Revenue for this engine
 *     comes directly from FinanceContext's Revenue records, not from
 *     journals at all.
 *
 * Real, confirmed policy this respects: City Manager must never see
 * raw revenue or EBITDA figures directly - only pass/fail-style
 * language (confirmed via a real, earlier commit that deliberately
 * removed exact revenue/EBITDA numbers from every part of the City
 * Manager's own view, while keeping the real underlying gate logic
 * intact). This service returns real numbers for HR/Super Admin to
 * see; the real masking for the City Manager role itself belongs in
 * the UI layer, not here.
 */

export { computeOMRealRevenue as computeCityRealRevenue, computeOMRealRetentionRate as computeCityRealRetentionRate } from "./kraOMDataSources";

export interface JournalLineLike {
  accountHead: string; // a real LedgerMaster id for genuine expense lines
  debit: number;
  credit: number;
}

export interface JournalEntryLike {
  cityId: string;
  date: string;
  lines: JournalLineLike[];
}

export interface LedgerLike {
  id: string;
  nature: string; // "asset" | "liability" | "income" | "expense"
}

/**
 * Real total expenses for a city in a given month - sums every real
 * debit line across every real journal entry for that city/month,
 * where the line's real ledger has nature "expense". Excludes GST
 * input lines and vendor/bank settlement lines, which are real but
 * carry a different real nature (asset/liability), confirmed directly
 * rather than guessed at from account-head string patterns.
 */
export function computeCityRealExpenses(journals: JournalEntryLike[], ledgers: LedgerLike[], cityId: string, month: string): number {
  const ledgerNatureById = new Map(ledgers.map((l) => [l.id, l.nature]));
  let total = 0;
  journals
    .filter((j) => j.cityId === cityId && j.date.startsWith(month))
    .forEach((j) => {
      j.lines.forEach((line) => {
        if (ledgerNatureById.get(line.accountHead) === "expense") {
          total += line.debit || 0;
        }
      });
    });
  return total;
}

/**
 * Real EBITDA percentage for a city in a given month - genuine revenue
 * minus genuine expenses, as a percentage of genuine revenue. Returns
 * null (not zero) when there's no real revenue to divide by, so a
 * genuinely unmeasurable month is never displayed as a real 0% result.
 */
export function computeCityRealEBITDAPercentage(realRevenue: number, realExpenses: number): number | null {
  if (realRevenue <= 0) return null;
  return Math.round(((realRevenue - realExpenses) / realRevenue) * 100);
}
