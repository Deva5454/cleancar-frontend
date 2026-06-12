/**
 * multiMonthBundleService.ts
 * 
 * Handles all business logic for Multi-Month Visit Bundles:
 * - Pack of 2 or Pack of 4 across 3, 6, 9, or 12 consecutive 30-day windows
 * - Total pool model with 2× soft cap per window
 * - Windows start from first wash date (not payment date, not calendar month)
 * - Deferred revenue recognition per visit completed
 * - Visit-based cancellation refund formula
 * - Priority scheduling (1-hour TAT, higher priority than Urgent Wash)
 * - TSE incentive via existing tranche system (30% M1, 70% across check months)
 */

import { DataService } from "./DataService";

// ── Types ────────────────────────────────────────────────────────────────────

export type BundlePackSize = 2 | 4;
export type BundleMonths   = 3 | 6 | 9 | 12;

export interface BundleWindow {
  windowNumber:    number;      // 1, 2, 3, ...
  startDate:       string;      // ISO date — from first wash date for W1, +30 days each subsequent
  endDate:         string;      // ISO date — startDate + 29 days
  visitsAllotted:  number;      // Pack size (2 or 4)
  softCap:         number;      // 2 × visitsAllotted
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
  
  // Pricing
  baseMonthlyPrice:  number;           // single-month price without discount
  discountPct:       number;           // 5 / 8 / 10 / 12
  discountedMonthlyPrice: number;
  totalBundlePrice:  number;           // discountedMonthlyPrice × bundleMonths
  tsmAdditionalDisc: number;           // extra % given by TSM (default 0)
  finalTotalPrice:   number;           // after TSM discount
  
  // Deferred revenue
  costPerVisit:      number;           // finalTotalPrice ÷ totalVisits
  revenueRecognised: number;           // cumulative revenue recognised so far
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
}): MultiMonthBundle {
  const {
    subscriptionId, customerId, packSize, bundleMonths,
    baseMonthlyPrice, tsmAdditionalDiscPct = 0, source, soldByTseId,
  } = params;

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
    softCap:         packSize * 2,
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
    baseMonthlyPrice,
    discountPct:           Math.round(totalDscPct * 100),
    discountedMonthlyPrice: discountedMonthly,
    totalBundlePrice,
    tsmAdditionalDisc:     tsmAdditionalDiscPct,
    finalTotalPrice,
    costPerVisit,
    revenueRecognised:     0,
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
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
  all.push(bundle);
  DataService.setAll(STORAGE_KEY, all);

  return bundle;
}

/**
 * Record the first wash date. This activates Window 1 and sets all window dates.
 * Called by JobContext.completeJob() on the first job for this bundle.
 */
export function recordBundleFirstWash(bundleId: string, firstWashDate: string): MultiMonthBundle | null {
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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
  
  // Check soft cap
  if (window.visitsUsed >= window.softCap) {
    return { success: false, revenueRecognised: b.revenueRecognised, deferredRevenue: b.deferredRevenue, visitsRemaining: b.totalVisits - b.visitsUsed, windowVisitsRemaining: 0, softCapReached: true, message: `Soft cap reached: max ${window.softCap} visits in this window` };
  }

  // Record visit
  window.visitsUsed += 1;
  b.windows[wIdx] = window;
  b.visitsUsed += 1;

  // Recognise revenue (deferred revenue model)
  const recognised = b.costPerVisit;
  b.revenueRecognised = parseFloat((b.revenueRecognised + recognised).toFixed(2));
  b.deferredRevenue   = parseFloat((b.finalTotalPrice - b.revenueRecognised).toFixed(2));

  // Check if bundle complete
  if (b.visitsUsed >= b.totalVisits) b.status = "COMPLETED";

  all[idx] = b;
  DataService.setAll(STORAGE_KEY, all);

  return {
    success: true,
    revenueRecognised: recognised,
    deferredRevenue: b.deferredRevenue,
    visitsRemaining: b.totalVisits - b.visitsUsed,
    windowVisitsRemaining: window.softCap - window.visitsUsed,
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
    const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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
            
            // Fire event for finance module
            window.dispatchEvent(new CustomEvent("cc360:bundle_visits_forfeited", {
              detail: { bundleId: b.bundleId, customerId: b.customerId, visitsForfeited: forfeited, revenue: forfeitRevenue }
            }));
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
  const all  = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
  const b    = all.find(x => x.bundleId === bundleId);
  if (!b) return { canRequest: false, reason: "Bundle not found", visitsLeft: 0, windowEnd: "" };
  if (b.status !== "ACTIVE") return { canRequest: false, reason: `Bundle is ${b.status}`, visitsLeft: 0, windowEnd: "" };

  const todayStr = today();
  const activeWindow = b.windows.find(w => w.status === "ACTIVE" && todayStr >= w.startDate && todayStr <= w.endDate);
  if (!activeWindow) return { canRequest: false, reason: "No active window right now", visitsLeft: 0, windowEnd: "" };

  if (activeWindow.visitsUsed >= activeWindow.softCap) {
    return { canRequest: false, reason: `Monthly soft cap reached (${activeWindow.softCap} visits used). Next window opens ${addDays(activeWindow.endDate, 1)}.`, visitsLeft: 0, windowEnd: activeWindow.endDate };
  }

  const totalLeft = b.totalVisits - b.visitsUsed;
  return { canRequest: true, visitsLeft: Math.min(activeWindow.softCap - activeWindow.visitsUsed, totalLeft), windowEnd: activeWindow.endDate };
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
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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
  const all    = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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

  // Fire event for finance module to process journal entries
  window.dispatchEvent(new CustomEvent("cc360:bundle_cancelled", {
    detail: { bundleId, customerId: all[idx].customerId, refund, retainVisits: !refund.refundEligible }
  }));

  return { success: true, refund };
}

/**
 * Send low-visit WA reminder. Called by checkBundleWindows().
 * Fires when 1 visit remaining AND 5 or fewer days left in window.
 */
export function checkLowVisitReminders(): void {
  try {
    const all       = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
    const customers = DataService.get<any[]>("CUSTOMERS") || [];
    const reminded  = DataService.get<Record<string, boolean>>("BUNDLE_LOW_VISIT_REMINDERS") || {};
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
          DataService.setAll("BUNDLE_LOW_VISIT_REMINDERS", reminded);
        }
      }
    });
  } catch (e) {
    console.error("[BundleService] checkLowVisitReminders error:", e);
  }
}

// ── Read helpers ─────────────────────────────────────────────────────────────

export function getBundleBySubscriptionId(subscriptionId: string): MultiMonthBundle | null {
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
  return all.find(b => b.subscriptionId === subscriptionId) || null;
}

export function getBundlesByCustomerId(customerId: string): MultiMonthBundle[] {
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
  return all.filter(b => b.customerId === customerId);
}

export function getAllActiveBundles(): MultiMonthBundle[] {
  const all = DataService.get<MultiMonthBundle[]>(STORAGE_KEY) || [];
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
