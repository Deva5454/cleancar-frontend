/**
 * multiMonthBundleService.ts
 * 
 * Handles all business logic for Multi-Month Visit Bundles:
 * - Pack of 2 or Pack of 4 across 3, 6, 9, or 12 consecutive 30-day windows
 * - Total pool model — visits can be used freely across any window (no cap)
 * - Windows start from first wash date (not payment date, not calendar month)
 * - Deferred revenue recognition per visit completed
 * - Visit-based cancellation refund formula
 * - Priority scheduling (1-hour TAT, higher priority than Urgent Wash)
 * - TSE incentive via existing tranche system (30% M1, 70% across check months)
 */

// ✅ NEW: real accounting integration — Collection at sale, Recognition
// per visit, and reversal on cancel/forfeit, matching the Accounting
// Module handover's Part B1 deferred-revenue pattern (Contract Liability
// → Package Revenue). Previously this whole file had zero connection to
// the real ledger — real customer payments for packages never touched
// the books at all.
import { accountingEntryService } from "./accountingEntryService";

/**
 * ✅ Splits a real, known GST-INCLUSIVE total into its taxable value and
 * CGST/SGST (or IGST) components, guaranteed to sum back to the exact
 * original total — no compounding rounding error, by construction.
 * calculateGST() is designed for the opposite direction (computing tax on
 * top of an already-known taxable value); using it here by independently
 * back-calculating taxable = total/1.18 and re-deriving tax from THAT
 * rounded value produced a real, provable 1-paisa mismatch in ~15% of
 * realistic bundle prices tested. This avoids that by deriving taxable as
 * the REMAINDER after tax, not an independent division.
 */
function splitGstInclusiveTotal(inclusiveTotal: number, gstRatePercent: number, split: "INTRA_STATE" | "INTER_STATE" | null) {
  if (!split || gstRatePercent === 0) {
    return { taxable: inclusiveTotal, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
  }
  const totalTax = Math.round((inclusiveTotal * gstRatePercent / (100 + gstRatePercent)) * 100) / 100;
  const taxable = Math.round((inclusiveTotal - totalTax) * 100) / 100; // remainder — exact by construction
  if (split === "INTRA_STATE") {
    const cgst = Math.round(totalTax * 50) / 100;
    const sgst = Math.round((totalTax - cgst) * 100) / 100; // remainder — exact, same pattern as ACC-DEF-01
    return { taxable, cgst, sgst, igst: 0, totalTax };
  }
  return { taxable, cgst: 0, sgst: 0, igst: totalTax, totalTax };
}
import { COMPANY_GST_CONFIG } from "./gstComplianceService";

// Storage helpers using localStorage directly
const lsGet = <T>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const lsSet = (key: string, data: any) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };

// DataService compatibility shim — multiMonthBundleService uses DataService.get/setAll pattern
const DataService = {
  get: <T>(key: string, _cityId?: string): T[] => lsGet<T>(key),
  setAll: (key: string, data: any, _cityId?: string) => lsSet(key, data),
};

// ── Types ────────────────────────────────────────────────────────────────────

export type BundlePackSize = 2 | 4;
export type BundleMonths   = 3 | 6 | 9 | 12;

export interface BundleWindow {
  windowNumber:    number;      // 1, 2, 3, ...
  startDate:       string;      // ISO date — from first wash date for W1, +30 days each subsequent
  endDate:         string;      // ISO date — startDate + 29 days
  visitsAllotted:  number;      // Pack size (2 or 4)
  softCap:         number;      // DEPRECATED — no cap. Field kept for backward compat.
  visitsUsed:      number;      // incremented on each completed job
  visitsForfeited: number;      // set on window expiry if unused
  status:          "UPCOMING" | "ACTIVE" | "COMPLETED" | "EXPIRED";
}

export interface MultiMonthBundle {
  bundleId:          string;
  subscriptionId:    string;
  customerId:        string;
  packSize:          BundlePackSize;   // 2 or 4
  bundleMonths:      BundleMonths;     // 3 / 6 / 9 / 12
  totalVisits:       number;           // packSize × bundleMonths
  visitsUsed:        number;           // total across all windows
  windows:           BundleWindow[];
  // ✅ NEW: real city context, set once at creation — needed so later
  // real accounting postings (recognition, cancellation, forfeiture) know
  // which city's ledgers to post against without new params threading
  // through every one of their own real callers.
  cityId:            string;
  cityName:          string;
  
  // Pricing
  baseMonthlyPrice:  number;           // single-month price without discount
  discountPct:       number;           // 5 / 8 / 10 / 12
  discountedMonthlyPrice: number;
  totalBundlePrice:  number;           // discountedMonthlyPrice × bundleMonths
  tsmAdditionalDisc: number;           // extra % given by TSM (default 0)
  finalTotalPrice:   number;           // after TSM discount
  
  // Deferred revenue
  costPerVisit:      number;           // finalTotalPrice ÷ totalVisits
  revenueRecognised: number;           // cumulative revenue recognised so far (GST-inclusive, operational)
  // ✅ NEW: the exact GST-exclusive taxable amount actually posted to the
  // real ledger so far — tracked separately from revenueRecognised (which
  // is GST-inclusive) so the final recognition/forfeiture event can true
  // up to the exact remaining Contract Liability balance instead of
  // accumulating rounding drift from many repeated per-visit divisions.
  taxableRecognisedSoFar: number;
  deferredRevenue:   number;           // finalTotalPrice − revenueRecognised
  
  // Dates
  paymentDate:       string;           // date customer paid
  firstWashDeadline: string;           // paymentDate + 15 days
  firstWashDate?:    string;           // set when first job completed
  bundleEndDate?:    string;           // firstWashDate + (bundleMonths × 30) days
  
  // Status
  status:            "PENDING_FIRST_WASH" | "ACTIVE" | "CANCELLED" | "COMPLETED" | "EXPIRED";
  cancellationDate?: string;
  refundAmount?:     number;
  
  // Flags
  isPriorityScheduling: true;           // always true for bundles
  source:            "BUY_PAGE" | "TSE_CALL";
  soldByTseId?:      string;
  createdAt:         string;
}

// ── Discount Table ───────────────────────────────────────────────────────────

export const BUNDLE_DISCOUNTS: Record<BundleMonths, number> = {
  3:  0.05,   // 5%
  6:  0.08,   // 8%
  9:  0.10,   // 10%
  12: 0.12,   // 12%
};

export const BUNDLE_EBITDA_FLOOR = 0.45; // 45% — TSM cannot discount below this

// ── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "MULTI_MONTH_BUNDLES";

// ── Helpers ──────────────────────────────────────────────────────────────────

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function generateId(): string {
  return "BNDL-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// ── Core Functions ───────────────────────────────────────────────────────────

/**
 * Calculate bundle pricing. Returns null if EBITDA would go below 45%.
 */
export function calculateBundlePrice(
  baseMonthlyPrice: number,
  months: BundleMonths,
  tsmAdditionalDiscPct: number = 0,
  estimatedMonthlyCost: number = 0  // washer + consumables cost per month
): {
  discountPct: number;
  totalDisc: number;
  discountedMonthly: number;
  totalPrice: number;
  savingsVsSingleMonth: number;
  ebitdaPct: number;
  belowFloor: boolean;
} | null {
  const baseDsc = BUNDLE_DISCOUNTS[months];
  const totalDsc = baseDsc + (tsmAdditionalDiscPct / 100);
  const discountedMonthly = Math.round(baseMonthlyPrice * (1 - totalDsc));
  const totalPrice = discountedMonthly * months;
  const savings = (baseMonthlyPrice * months) - totalPrice;
  
  // EBITDA check on total bundle
  const totalCost = estimatedMonthlyCost > 0 ? estimatedMonthlyCost * months : totalPrice * 0.55;
  const ebitda = (totalPrice - totalCost) / totalPrice;
  
  return {
    discountPct: Math.round(totalDsc * 100),
    totalDisc: tsmAdditionalDiscPct,
    discountedMonthly,
    totalPrice,
    savingsVsSingleMonth: savings,
    ebitdaPct: ebitda,
    belowFloor: ebitda < BUNDLE_EBITDA_FLOOR,
  };
}

/**
 * Create a new Multi-Month Bundle on purchase.
 * Windows are UPCOMING until first wash date is recorded.
 */
export function createBundle(params: {
  subscriptionId: string;
  customerId:     string;
  packSize:       BundlePackSize;
  bundleMonths:   BundleMonths;
  baseMonthlyPrice: number;
  tsmAdditionalDiscPct?: number;
  source:         "BUY_PAGE" | "TSE_CALL";
  soldByTseId?:   string;
  paymentDate?:   string;
  // ✅ NEW: real city context — needed to post a real Collection voucher.
  // Defaults to Surat, matching the same convention used throughout
  // accountingEntryService.ts, if a caller doesn't yet pass it through.
  cityId?:        string;
  cityName?:      string;
}): MultiMonthBundle {
  const {
    subscriptionId, customerId, packSize, bundleMonths,
    baseMonthlyPrice, tsmAdditionalDiscPct = 0, source, soldByTseId,
  } = params;
  const cityId   = params.cityId || "CITY-SURAT";
  const cityName = params.cityName || "Surat";

  const paymentDate    = params.paymentDate || today();
  const baseDsc        = BUNDLE_DISCOUNTS[bundleMonths];
  const totalDscPct    = baseDsc + (tsmAdditionalDiscPct / 100);
  const discountedMonthly = Math.round(baseMonthlyPrice * (1 - totalDscPct));
  const totalBundlePrice  = discountedMonthly * bundleMonths;
  const finalTotalPrice   = totalBundlePrice; // same until TSM additional applied
  const totalVisits       = packSize * bundleMonths;
  const costPerVisit      = parseFloat((finalTotalPrice / totalVisits).toFixed(2));

  // Windows are placeholder until first wash date is known
  const windows: BundleWindow[] = Array.from({ length: bundleMonths }, (_, i) => ({
    windowNumber:    i + 1,
    startDate:       "",             // set when first wash date confirmed
    endDate:         "",
    visitsAllotted:  packSize,
    softCap:         packSize * bundleMonths, // cap removed — set to total so never reached
    visitsUsed:      0,
    visitsForfeited: 0,
    status:          "UPCOMING" as const,
  }));

  const bundle: MultiMonthBundle = {
    bundleId:              generateId(),
    subscriptionId,
    customerId,
    packSize,
    bundleMonths,
    totalVisits,
    visitsUsed:            0,
    windows,
    cityId,
    cityName,
    baseMonthlyPrice,
    discountPct:           Math.round(totalDscPct * 100),
    discountedMonthlyPrice: discountedMonthly,
    totalBundlePrice,
    tsmAdditionalDisc:     tsmAdditionalDiscPct,
    finalTotalPrice,
    costPerVisit,
    revenueRecognised:     0,
    taxableRecognisedSoFar: 0,
    deferredRevenue:       finalTotalPrice,
    paymentDate,
    firstWashDeadline:     addDays(paymentDate, 15),
    status:                "PENDING_FIRST_WASH",
    isPriorityScheduling:  true,
    source,
    soldByTseId,
    createdAt:             new Date().toISOString(),
  };

  // Persist
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  all.push(bundle);
  DataService.setAll(STORAGE_KEY, all);

  // ✅ FIX: real Collection voucher (Accounting Module Part B1) — the
  // customer's real payment now genuinely reaches the books. finalTotalPrice
  // is GST-inclusive (same real convention already used by
  // autoPostSalesEntry's real callers — taxable = price / 1.18), so the
  // taxable value is backed out the same way, then split into Contract
  // Liability (unearned, sits on the Balance Sheet until each visit is
  // delivered) + Output GST (charged in full now, per how GST actually
  // works on service advances in India).
  try {
    const split = splitGstInclusiveTotal(finalTotalPrice, COMPANY_GST_CONFIG.defaultServiceGstRate, "INTRA_STATE");
    const lines = [
      { accountHead: "bank", accountLabel: "Bank Account", debit: finalTotalPrice, credit: 0 },
      { accountHead: "contract_liability", accountLabel: "Contract Liability", debit: 0, credit: split.taxable },
      ...(split.cgst > 0 ? [{ accountHead: "gst_output_cgst", accountLabel: "Output CGST", debit: 0, credit: split.cgst }] : []),
      ...(split.sgst > 0 ? [{ accountHead: "gst_output_sgst", accountLabel: "Output SGST", debit: 0, credit: split.sgst }] : []),
      ...(split.igst > 0 ? [{ accountHead: "gst_output_igst", accountLabel: "Output IGST", debit: 0, credit: split.igst }] : []),
    ];
    accountingEntryService.createJournal({
      date: paymentDate,
      narration: `Multi-month bundle sale — ${bundle.bundleId} — Customer ${customerId} — ${packSize}×${bundleMonths}mo`,
      lines, city: cityName, cityId, createdBy: soldByTseId || "System",
    }, cityName);
  } catch (e) {
    console.error("[multiMonthBundleService] Collection voucher post failed — bundle created but not reflected in the real ledger:", e);
  }

  return bundle;
}

/**
 * Record the first wash date. This activates Window 1 and sets all window dates.
 * Called by JobContext.completeJob() on the first job for this bundle.
 */
export function recordBundleFirstWash(bundleId: string, firstWashDate: string): MultiMonthBundle | null {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  const idx = all.findIndex(b => b.bundleId === bundleId);
  if (idx < 0) return null;

  const b = { ...all[idx] };
  b.firstWashDate = firstWashDate;
  b.bundleEndDate = addDays(firstWashDate, b.bundleMonths * 30);
  b.status = "ACTIVE";

  // Set all window dates from first wash date
  b.windows = b.windows.map((w, i) => ({
    ...w,
    startDate: addDays(firstWashDate, i * 30),
    endDate:   addDays(firstWashDate, (i * 30) + 29),
    status:    i === 0 ? "ACTIVE" : "UPCOMING",
  }));

  all[idx] = b;
  DataService.setAll(STORAGE_KEY, all);
  return b;
}

/**
 * Record a completed visit. Increments window visits and recognises revenue.
 * Returns false if soft cap reached (shouldn't happen — caller should check first).
 */
export function recordBundleVisit(bundleId: string, jobId: string): {
  success:           boolean;
  revenueRecognised: number;
  deferredRevenue:   number;
  visitsRemaining:   number;
  windowVisitsRemaining: number;
  softCapReached:    boolean;
  message:           string;
} {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  const idx = all.findIndex(b => b.bundleId === bundleId);
  if (idx < 0) return { success: false, revenueRecognised: 0, deferredRevenue: 0, visitsRemaining: 0, windowVisitsRemaining: 0, softCapReached: false, message: "Bundle not found" };

  const b = { ...all[idx], windows: [...all[idx].windows] };
  const todayStr = today();
  
  // Find active window
  const wIdx = b.windows.findIndex(w =>
    w.status === "ACTIVE" && todayStr >= w.startDate && todayStr <= w.endDate
  );
  if (wIdx < 0) return { success: false, revenueRecognised: 0, deferredRevenue: 0, visitsRemaining: 0, windowVisitsRemaining: 0, softCapReached: false, message: "No active window found" };

  const window = { ...b.windows[wIdx] };
  
  // Soft cap removed (Slide 9) — customers can use visits freely across windows

  // Record visit
  window.visitsUsed += 1;
  b.windows[wIdx] = window;
  b.visitsUsed += 1;

  // Recognise revenue (deferred revenue model — operational, GST-inclusive figures)
  const recognised = b.costPerVisit;
  b.revenueRecognised = parseFloat((b.revenueRecognised + recognised).toFixed(2));
  b.deferredRevenue   = parseFloat((b.finalTotalPrice - b.revenueRecognised).toFixed(2));

  // Check if bundle complete
  const isFinalVisit = b.visitsUsed >= b.totalVisits;
  if (isFinalVisit) b.status = "COMPLETED";

  // ✅ FIX: real Recognition voucher (Accounting Module Part B1) —
  // previously this operational tracking (revenueRecognised/deferredRevenue)
  // never touched the real ledger at all. Moves the GST-EXCLUSIVE taxable
  // slice from Contract Liability to Package Revenue — GST itself was
  // already fully charged and recorded at Collection time, so recognition
  // never touches GST again, only the taxable portion.
  //
  // On the FINAL visit, uses the true remaining balance (total taxable
  // collected minus what's actually been posted so far) instead of the
  // standard formulaic slice — this is what makes Contract Liability land
  // on exactly zero once every visit is used, rather than a real,
  // accumulating rounding residual (confirmed up to 6 paise on a 48-visit
  // bundle without this true-up).
  const totalTaxableCollected = splitGstInclusiveTotal(b.finalTotalPrice, COMPANY_GST_CONFIG.defaultServiceGstRate, "INTRA_STATE").taxable;
  const standardSlice = parseFloat((b.costPerVisit / (1 + COMPANY_GST_CONFIG.defaultServiceGstRate / 100)).toFixed(2));
  const amountToRecognise = isFinalVisit
    ? parseFloat((totalTaxableCollected - b.taxableRecognisedSoFar).toFixed(2))
    : standardSlice;
  b.taxableRecognisedSoFar = parseFloat((b.taxableRecognisedSoFar + amountToRecognise).toFixed(2));

  all[idx] = b;
  DataService.setAll(STORAGE_KEY, all);

  try {
    accountingEntryService.createJournal({
      date: todayStr,
      narration: `Bundle visit recognised — ${bundleId} — Job ${jobId} — visit ${b.visitsUsed}/${b.totalVisits}`,
      lines: [
        { accountHead: "contract_liability", accountLabel: "Contract Liability", debit: amountToRecognise, credit: 0 },
        { accountHead: "sales_package_bundle", accountLabel: "Package Revenue - Multi-Month Bundle", debit: 0, credit: amountToRecognise },
      ],
      city: b.cityName || "Surat", cityId: b.cityId || "CITY-SURAT", createdBy: "System",
    }, b.cityName || "Surat");
  } catch (e) {
    console.error("[multiMonthBundleService] Recognition voucher post failed:", e);
  }

  return {
    success: true,
    revenueRecognised: recognised,
    deferredRevenue: b.deferredRevenue,
    visitsRemaining: b.totalVisits - b.visitsUsed,
    windowVisitsRemaining: b.totalVisits - b.visitsUsed,
    softCapReached: false,
    message: `Visit recorded. Revenue recognised: Rs ${recognised}`,
  };
}

/**
 * Advance to next window. Called daily by checkBundleWindows().
 * Forfeits unused visits from expired windows.
 */
export function advanceBundleWindows(): void {
  try {
    const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
    const todayStr = today();
    let changed = false;

    all.forEach((b, bIdx) => {
      if (b.status !== "ACTIVE") return;
      
      b.windows.forEach((w, wIdx) => {
        // Expire past windows
        if (w.status === "ACTIVE" && todayStr > w.endDate) {
          const forfeited = w.visitsAllotted - w.visitsUsed > 0 
            ? w.visitsAllotted - w.visitsUsed : 0;
          all[bIdx].windows[wIdx] = { ...w, status: "EXPIRED", visitsForfeited: forfeited };
          
          // Recognise forfeited visits as revenue
          if (forfeited > 0) {
            const forfeitRevenue = forfeited * b.costPerVisit;
            all[bIdx].revenueRecognised += forfeitRevenue;
            all[bIdx].deferredRevenue   -= forfeitRevenue;

            // ✅ FIX: real forfeiture voucher — previously only this
            // operational tracking updated; the "fire an event for finance
            // module" comment was aspirational, no real listener ever
            // existed. Money the customer already paid for unused,
            // expired visits is real business income — booked to
            // Bundle Forfeiture Income specifically (not Package Revenue,
            // since no service was actually delivered for these visits).
            //
            // True-up when this is the bundle's LAST window expiring —
            // same exact-remainder principle as recordBundleVisit's final
            // visit, so Contract Liability reaches exactly zero instead of
            // a small accumulated rounding residual.
            try {
              const isLastWindow = w.windowNumber >= b.bundleMonths;
              const totalTaxableCollected = splitGstInclusiveTotal(b.finalTotalPrice, COMPANY_GST_CONFIG.defaultServiceGstRate, "INTRA_STATE").taxable;
              const standardSlice = parseFloat((forfeitRevenue / (1 + COMPANY_GST_CONFIG.defaultServiceGstRate / 100)).toFixed(2));
              const forfeitTaxable = isLastWindow
                ? parseFloat((totalTaxableCollected - b.taxableRecognisedSoFar).toFixed(2))
                : standardSlice;
              all[bIdx].taxableRecognisedSoFar = parseFloat((b.taxableRecognisedSoFar + forfeitTaxable).toFixed(2));

              accountingEntryService.createJournal({
                date: todayStr,
                narration: `Bundle window expired — ${forfeited} visit(s) forfeited — ${b.bundleId} — Customer ${b.customerId}`,
                lines: [
                  { accountHead: "contract_liability", accountLabel: "Contract Liability", debit: forfeitTaxable, credit: 0 },
                  { accountHead: "sales_bundle_forfeiture", accountLabel: "Bundle Forfeiture & Cancellation Income", debit: 0, credit: forfeitTaxable },
                ],
                city: b.cityName || "Surat", cityId: b.cityId || "CITY-SURAT", createdBy: "System",
              }, b.cityName || "Surat");
            } catch (e) {
              console.error("[multiMonthBundleService] Forfeiture voucher post failed:", e);
            }
          }
          changed = true;
        }
        
        // Activate next window
        if (w.status === "UPCOMING" && todayStr >= w.startDate) {
          all[bIdx].windows[wIdx] = { ...w, status: "ACTIVE" };
          changed = true;
          
          // Notify customer via WA
          window.dispatchEvent(new CustomEvent("cc360:bundle_window_activated", {
            detail: { bundleId: b.bundleId, customerId: b.customerId, windowNumber: w.windowNumber, visitsAllotted: w.visitsAllotted, endDate: w.endDate }
          }));
        }
      });

      // Expire entire bundle
      if (b.bundleEndDate && todayStr > b.bundleEndDate && b.status === "ACTIVE") {
        all[bIdx].status = "EXPIRED";
        changed = true;
      }
    });

    if (changed) DataService.setAll(STORAGE_KEY, all);
  } catch (e) {
    console.error("[BundleService] advanceBundleWindows error:", e);
  }
}

/**
 * Check if customer can request a wash (soft cap + active window check).
 */
export function canRequestWash(bundleId: string): {
  canRequest:  boolean;
  reason?:     string;
  visitsLeft:  number;
  windowEnd:   string;
} {
  const all  = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  const b    = all.find(x => x.bundleId === bundleId);
  if (!b) return { canRequest: false, reason: "Bundle not found", visitsLeft: 0, windowEnd: "" };
  if (b.status !== "ACTIVE") return { canRequest: false, reason: `Bundle is ${b.status}`, visitsLeft: 0, windowEnd: "" };

  const todayStr = today();
  const activeWindow = b.windows.find(w => w.status === "ACTIVE" && todayStr >= w.startDate && todayStr <= w.endDate);
  if (!activeWindow) return { canRequest: false, reason: "No active window right now", visitsLeft: 0, windowEnd: "" };

  // Soft cap check removed — no advance usage restriction

  const totalLeft = b.totalVisits - b.visitsUsed;
  return { canRequest: true, visitsLeft: totalLeft, windowEnd: activeWindow.endDate };
}

/**
 * Calculate cancellation refund for a bundle.
 * Based on visits consumed (not time elapsed).
 */
export function calculateCancellationRefund(bundleId: string): {
  totalPaid:         number;
  visitsUsed:        number;
  totalVisits:       number;
  pctConsumed:       number;
  refundEligible:    boolean;
  revenueForVisitsUsed: number;
  cancellationFee:   number;
  gatewayCharges:    number;
  netRefund:         number;
  message:           string;
} {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  const b   = all.find(x => x.bundleId === bundleId);
  
  if (!b) return { totalPaid: 0, visitsUsed: 0, totalVisits: 0, pctConsumed: 0, refundEligible: false, revenueForVisitsUsed: 0, cancellationFee: 0, gatewayCharges: 0, netRefund: 0, message: "Bundle not found" };

  const pctConsumed = (b.visitsUsed / b.totalVisits) * 100;
  const refundEligible = pctConsumed < 50;

  if (!refundEligible) {
    return {
      totalPaid: b.finalTotalPrice, visitsUsed: b.visitsUsed, totalVisits: b.totalVisits,
      pctConsumed, refundEligible: false, revenueForVisitsUsed: 0, cancellationFee: 0,
      gatewayCharges: 0, netRefund: 0,
      message: `${pctConsumed.toFixed(0)}% consumed — no refund eligible. Customer retains remaining ${b.totalVisits - b.visitsUsed} visits until ${b.bundleEndDate}.`,
    };
  }

  const revenueForVisitsUsed = parseFloat((b.visitsUsed * b.costPerVisit).toFixed(2));
  const cancellationFee = parseFloat((b.finalTotalPrice * 0.10).toFixed(2));
  const gatewayCharges  = parseFloat((b.finalTotalPrice * 0.02).toFixed(2));
  const netRefund       = Math.max(0, parseFloat((b.finalTotalPrice - revenueForVisitsUsed - cancellationFee - gatewayCharges).toFixed(2)));

  return {
    totalPaid: b.finalTotalPrice, visitsUsed: b.visitsUsed, totalVisits: b.totalVisits,
    pctConsumed, refundEligible: true,
    revenueForVisitsUsed, cancellationFee, gatewayCharges, netRefund,
    message: `Net refund: Rs ${netRefund} (Rs ${b.finalTotalPrice} - Rs ${revenueForVisitsUsed} used - Rs ${cancellationFee} fee - Rs ${gatewayCharges} gateway)`,
  };
}

/**
 * Process cancellation. Updates bundle status and triggers refund.
 */
export function cancelBundle(bundleId: string): { success: boolean; refund: ReturnType<typeof calculateCancellationRefund> } {
  const refund = calculateCancellationRefund(bundleId);
  const all    = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  const idx    = all.findIndex(b => b.bundleId === bundleId);
  if (idx < 0) return { success: false, refund };

  all[idx] = {
    ...all[idx],
    status: "CANCELLED",
    cancellationDate: today(),
    refundAmount: refund.netRefund,
  };

  // If past 50%: customer retains remaining visits (status stays ACTIVE for visits, CANCELLED for billing)
  if (!refund.refundEligible) {
    all[idx].status = "CANCELLED"; // billing stopped, visits continue until bundleEndDate
  }

  DataService.setAll(STORAGE_KEY, all);

  // ✅ FIX: real reversal voucher (Accounting Module Part B1 pattern,
  // applied to cancellation) — previously "Fire event for finance module
  // to process journal entries" was aspirational; no listener for
  // cc360:bundle_cancelled ever existed anywhere in the app, so a real
  // customer refund never touched the books at all.
  //
  // Only posts when a refund is actually due. When NOT refund-eligible
  // (≥50% consumed — customer retains remaining visits, billing just
  // stops), nothing needs to change in the real ledger: the remaining
  // Contract Liability is still real and will keep recognizing normally
  // as those visits get used, exactly as before.
  if (refund.refundEligible) {
    try {
      const b = all[idx];
      const remainingGstInclusive = parseFloat((refund.totalPaid - refund.revenueForVisitsUsed).toFixed(2));
      const split = splitGstInclusiveTotal(remainingGstInclusive, COMPANY_GST_CONFIG.defaultServiceGstRate, "INTRA_STATE");
      const feeIncome = parseFloat((refund.cancellationFee + refund.gatewayCharges).toFixed(2));

      const lines = [
        { accountHead: "contract_liability", accountLabel: "Contract Liability", debit: split.taxable, credit: 0 },
        ...(split.cgst > 0 ? [{ accountHead: "gst_output_cgst", accountLabel: "Output CGST", debit: split.cgst, credit: 0 }] : []),
        ...(split.sgst > 0 ? [{ accountHead: "gst_output_sgst", accountLabel: "Output SGST", debit: split.sgst, credit: 0 }] : []),
        ...(split.igst > 0 ? [{ accountHead: "gst_output_igst", accountLabel: "Output IGST", debit: split.igst, credit: 0 }] : []),
        { accountHead: "bank", accountLabel: "Bank Account", debit: 0, credit: refund.netRefund },
        { accountHead: "sales_bundle_forfeiture", accountLabel: "Bundle Forfeiture & Cancellation Income", debit: 0, credit: feeIncome },
      ];
      accountingEntryService.createJournal({
        date: today(),
        narration: `Bundle cancellation refund — ${bundleId} — Customer ${b.customerId} — net refund ₹${refund.netRefund}`,
        lines, city: b.cityName || "Surat", cityId: b.cityId || "CITY-SURAT", createdBy: "System",
      }, b.cityName || "Surat");
    } catch (e) {
      console.error("[multiMonthBundleService] Cancellation reversal voucher post failed:", e);
    }
  }

  return { success: true, refund };
}

/**
 * Send low-visit WA reminder. Called by checkBundleWindows().
 * Fires when 1 visit remaining AND 5 or fewer days left in window.
 */
export function checkLowVisitReminders(): void {
  try {
    const all       = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
    const customers = lsGet<any>("CUSTOMERS");
    let reminded: Record<string, boolean> = {};
    try { reminded = JSON.parse(localStorage.getItem("BUNDLE_LOW_VISIT_REMINDERS") || "{}"); } catch { /* ignore */ }
    const todayStr  = today();
    const todayDate = new Date(todayStr);

    all.filter(b => b.status === "ACTIVE").forEach(b => {
      const activeWindow = b.windows.find(w => w.status === "ACTIVE");
      if (!activeWindow) return;

      const daysLeft = Math.ceil((new Date(activeWindow.endDate).getTime() - todayDate.getTime()) / 86400000);
      const visitsLeft = activeWindow.visitsAllotted - activeWindow.visitsUsed;
      const key = `${b.bundleId}-w${activeWindow.windowNumber}`;

      if (visitsLeft === 1 && daysLeft <= 5 && !reminded[key]) {
        const cust = customers.find(c => c.customerId === b.customerId);
        if (cust?.phone) {
          import("./whatsappService").then(ws => {
            ws.sendWhatsApp(cust.phone,
              `⏰ Reminder: You have 1 wash remaining in your bundle for this period.\n\n` +
              `📅 Your window closes on ${activeWindow.endDate} (${daysLeft} day${daysLeft !== 1 ? "s" : ""} left).\n\n` +
              `Book your wash now — reply WASH to this number.\n\n` +
              `⚠️ Unused visits lapse and are NOT carried forward.\n\n` +
              `24/9 Carwashing | 080 48 79 45 45`
            ).catch(() => {});
          });
          reminded[key] = true;
          lsSet("BUNDLE_LOW_VISIT_REMINDERS", reminded);
        }
      }
    });
  } catch (e) {
    console.error("[BundleService] checkLowVisitReminders error:", e);
  }
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export function getBundleBySubscriptionId(subscriptionId: string): MultiMonthBundle | null {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  return all.find(b => b.subscriptionId === subscriptionId) || null;
}

export function getBundlesByCustomerId(customerId: string): MultiMonthBundle[] {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  return all.filter(b => b.customerId === customerId);
}

export function getAllActiveBundles(): MultiMonthBundle[] {
  const all = DataService.get<MultiMonthBundle>(STORAGE_KEY) || [];
  return all.filter(b => b.status === "ACTIVE" || b.status === "PENDING_FIRST_WASH");
}

export function getBundleSummaryForCustomer(customerId: string): {
  hasBundle:        boolean;
  activeBundle?:    MultiMonthBundle;
  currentWindow?:   BundleWindow;
  visitsRemaining:  number;
  windowEnd?:       string;
  nextWindowStart?: string;
} {
  const bundles = getBundlesByCustomerId(customerId);
  const active  = bundles.find(b => b.status === "ACTIVE");
  if (!active) return { hasBundle: false, visitsRemaining: 0 };

  const todayStr = today();
  const currentWindow = active.windows.find(w => w.status === "ACTIVE" && todayStr >= w.startDate && todayStr <= w.endDate);
  const nextWindow    = active.windows.find(w => w.status === "UPCOMING");

  return {
    hasBundle:        true,
    activeBundle:     active,
    currentWindow,
    visitsRemaining:  active.totalVisits - active.visitsUsed,
    windowEnd:        currentWindow?.endDate,
    nextWindowStart:  nextWindow?.startDate,
  };
}
