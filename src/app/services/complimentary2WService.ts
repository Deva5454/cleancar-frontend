/**
 * complimentary2WService.ts
 *
 * Handles complimentary 2-wheeler wash offers:
 * - TSE offers at new subscription OR during retention call
 * - TSM sets monthly cap per TSE (resets 1st of month)
 * - TSM approval required before job is created
 * - Journal entry: Debit Marketing Expenses / Credit Service Rendered
 * - TSE gets ZERO incentive for 2W complimentary wash
 * - Washer gets 0.4 incentive units (paid from marketing expense)
 * - 2W vehicle added to customer's vehicles[] array
 */

// Storage helpers using localStorage directly
const lsGet = <T>(key: string): T[] => { try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; } };
const lsSet = (key: string, data: any) => { try { localStorage.setItem(key, JSON.stringify(data)); } catch {} };

// ── Types ─────────────────────────────────────────────────────────────────────

export type ComplimentaryReason = "NEW_CONVERSION_INCENTIVE" | "RETENTION_INCENTIVE";
export type OfferStatus = "PENDING_TSM_APPROVAL" | "APPROVED" | "REJECTED" | "JOB_CREATED" | "COMPLETED" | "EXPIRED";
export type TwoWheelerType = "SCOOTER" | "COMMUTER_BIKE" | "SPORTS_BIKE";

export interface Complimentary2WOffer {
  offerId:             string;
  customerId:          string;
  customerName:        string;
  customerPhone:       string;
  vehicle4WReg:        string;      // 4-wheeler subscription vehicle
  vehicle2WReg:        string;      // 2-wheeler to be washed (mandatory)
  vehicle2WType:       TwoWheelerType;
  vehicle2WBrand?:     string;
  vehicle2WModel?:     string;
  reasonCode:          ComplimentaryReason;
  offeredByTseId:      string;
  offeredByTseName:    string;
  approvedByTsmId?:    string;
  approvedByTsmName?:  string;
  rejectionReason?:    string;
  status:              OfferStatus;
  jobId?:              string;       // set when job is created on approval
  linkedSubscriptionId: string;      // the 4W subscription this is linked to
  estimatedCost:       number;       // washer labour + consumables (default Rs 85)
  validUntil:          string;       // 30 days from approval
  cityId:              string;
  createdAt:           string;
  approvedAt?:         string;
  completedAt?:        string;
}

export interface TseCapConfig {
  tseId:       string;
  tseName:     string;
  monthlyCapSet: number;   // TSM sets this (default 5)
  month:       string;     // YYYY-MM
  usedCount:   number;     // how many offers made this month
}

// ── Storage Keys ─────────────────────────────────────────────────────────────

const OFFERS_KEY   = "COMPLIMENTARY_2W_OFFERS";
const TSE_CAPS_KEY = "TSE_COMPLIMENTARY_CAPS";
const COST_PER_2W_WASH = 85; // Rs washer labour + consumables

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
}

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Cap Management ────────────────────────────────────────────────────────────

/**
 * TSM sets monthly cap for a TSE.
 */
export function setTseCap(tseId: string, tseName: string, cap: number): void {
  const all  = DataService.get<TseCapConfig[]>(TSE_CAPS_KEY) || [];
  const mon  = currentMonth();
  const idx  = all.findIndex(c => c.tseId === tseId && c.month === mon);
  if (idx >= 0) {
    all[idx].monthlyCapSet = cap;
  } else {
    all.push({ tseId, tseName, monthlyCapSet: cap, month: mon, usedCount: 0 });
  }
  DataService.setAll(TSE_CAPS_KEY, all);
}

/**
 * Get TSE cap status for current month.
 */
export function getTseCapStatus(tseId: string): {
  cap:        number;
  used:       number;
  remaining:  number;
  canOffer:   boolean;
} {
  const all = DataService.get<TseCapConfig[]>(TSE_CAPS_KEY) || [];
  const mon = currentMonth();
  const rec = all.find(c => c.tseId === tseId && c.month === mon);
  const cap  = rec?.monthlyCapSet ?? 5;  // default 5 if TSM hasn't set
  const used = rec?.usedCount ?? 0;
  return { cap, used, remaining: Math.max(0, cap - used), canOffer: used < cap };
}

/**
 * Get all TSE cap statuses for TSM dashboard.
 */
export function getAllTseCapStatuses(cityId?: string): TseCapConfig[] {
  const all = DataService.get<TseCapConfig[]>(TSE_CAPS_KEY) || [];
  return all.filter(c => c.month === currentMonth());
}

// ── Offer Lifecycle ───────────────────────────────────────────────────────────

/**
 * TSE creates a complimentary offer (pending TSM approval).
 */
export function createOffer(params: {
  customerId:        string;
  customerName:      string;
  customerPhone:     string;
  vehicle4WReg:      string;
  vehicle2WReg:      string;
  vehicle2WType:     TwoWheelerType;
  vehicle2WBrand?:   string;
  vehicle2WModel?:   string;
  reasonCode:        ComplimentaryReason;
  tseId:             string;
  tseName:           string;
  subscriptionId:    string;
  cityId:            string;
}): { success: boolean; offer?: Complimentary2WOffer; error?: string } {
  // Check cap
  const capStatus = getTseCapStatus(params.tseId);
  if (!capStatus.canOffer) {
    return { success: false, error: `Monthly cap reached (${capStatus.used}/${capStatus.cap}). Contact your TSM to increase the cap.` };
  }

  // Validate 2W registration
  if (!params.vehicle2WReg || params.vehicle2WReg.trim().length < 5) {
    return { success: false, error: "2-Wheeler registration number is required and must be at least 5 characters." };
  }

  const offer: Complimentary2WOffer = {
    offerId:              generateId("COMP"),
    customerId:           params.customerId,
    customerName:         params.customerName,
    customerPhone:        params.customerPhone,
    vehicle4WReg:         params.vehicle4WReg.toUpperCase().replace(/\s/g, ""),
    vehicle2WReg:         params.vehicle2WReg.toUpperCase().replace(/\s/g, ""),
    vehicle2WType:        params.vehicle2WType,
    vehicle2WBrand:       params.vehicle2WBrand,
    vehicle2WModel:       params.vehicle2WModel,
    reasonCode:           params.reasonCode,
    offeredByTseId:       params.tseId,
    offeredByTseName:     params.tseName,
    status:               "PENDING_TSM_APPROVAL",
    linkedSubscriptionId: params.subscriptionId,
    estimatedCost:        COST_PER_2W_WASH,
    validUntil:           addDays(30),
    cityId:               params.cityId,
    createdAt:            new Date().toISOString(),
  };

  // Save offer
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  all.push(offer);
  DataService.setAll(OFFERS_KEY, all);

  // Increment TSE used count
  const caps = DataService.get<TseCapConfig[]>(TSE_CAPS_KEY) || [];
  const mon  = currentMonth();
  const capIdx = caps.findIndex(c => c.tseId === params.tseId && c.month === mon);
  if (capIdx >= 0) {
    caps[capIdx].usedCount += 1;
  } else {
    caps.push({ tseId: params.tseId, tseName: params.tseName, monthlyCapSet: 5, month: mon, usedCount: 1 });
  }
  DataService.setAll(TSE_CAPS_KEY, caps);

  // Notify TSM
  window.dispatchEvent(new CustomEvent("cc360:complimentary_offer_pending", {
    detail: { offerId: offer.offerId, tseId: params.tseId, tseName: params.tseName, customerName: params.customerName, vehicle4WReg: params.vehicle4WReg, vehicle2WReg: params.vehicle2WReg, reason: params.reasonCode, cityId: params.cityId }
  }));

  return { success: true, offer };
}

/**
 * TSM approves an offer. Creates the job record and journal entry.
 */
export function approveOffer(offerId: string, tsmId: string, tsmName: string): {
  success: boolean;
  jobId?:  string;
  error?:  string;
} {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  const idx = all.findIndex(o => o.offerId === offerId);
  if (idx < 0) return { success: false, error: "Offer not found" };
  if (all[idx].status !== "PENDING_TSM_APPROVAL") return { success: false, error: `Offer is already ${all[idx].status}` };

  const offer = all[idx];
  const jobId = generateId("JOB-COMP");

  // Update offer
  all[idx] = {
    ...offer,
    status:           "APPROVED",
    approvedByTsmId:  tsmId,
    approvedByTsmName: tsmName,
    jobId,
    approvedAt:       new Date().toISOString(),
  };
  DataService.setAll(OFFERS_KEY, all);

  // Create job record
  const jobs = lsGet<any[]>("JOBS");
  jobs.push({
    jobId,
    customerId:       offer.customerId,
    customerName:     offer.customerName,
    customerPhone:    offer.customerPhone,
    vehicleReg:       offer.vehicle2WReg,
    vehicleType:      "2W",
    vehicleCategory:  offer.vehicle2WType,
    serviceType:      "2W_WASH",
    packageType:      "COMPLIMENTARY_2W",
    packageName:      "Complimentary 2-Wheeler Wash",
    isComplimentary:  true,
    isPaid:           false,
    expenseType:      "MARKETING",
    reasonCode:       offer.reasonCode,
    offerId:          offer.offerId,
    offeredByTseId:   offer.offeredByTseId,
    tseIncentive:     0,             // EXPLICITLY ZERO
    washerIncentiveUnits: 0.4,       // washer gets 0.4 units from marketing expense
    estimatedCost:    offer.estimatedCost,
    status:           "Unassigned",
    cityId:           offer.cityId,
    validUntil:       offer.validUntil,
    createdAt:        new Date().toISOString(),
  });
  lsSet("JOBS", jobs);

  // Journal entry: Debit Marketing Expenses / Credit Service Rendered
  const journalEntries = lsGet<any[]>("JOURNAL_ENTRIES");
  const entryRef = generateId("JNL");
  journalEntries.push({
    entryId:       entryRef,
    entryDate:     new Date().toISOString().split("T")[0],
    narration:     `Complimentary 2W wash — ${offer.customerName} (${offer.vehicle2WReg}) — ${offer.reasonCode} — Offered by: ${offer.offeredByTseName} — Approved by: ${tsmName}`,
    lines: [
      { accountHead: "EXPENSE_MARKETING",  accountLabel: "Marketing Expenses",             debit: offer.estimatedCost, credit: 0 },
      { accountHead: "SERVICE_RENDERED",    accountLabel: "Service Rendered — Complimentary", debit: 0, credit: offer.estimatedCost },
    ],
    referenceType: "Complimentary2W",
    referenceId:   offerId,
    cityId:        offer.cityId,
    createdAt:     new Date().toISOString(),
  });
  lsSet("JOURNAL_ENTRIES", journalEntries);

  // Add 2W vehicle to customer's vehicles array
  const customers = lsGet<any[]>("CUSTOMERS");
  const custIdx   = customers.findIndex(c => c.customerId === offer.customerId);
  if (custIdx >= 0) {
    const vehicles = customers[custIdx].vehicles || [];
    const already  = vehicles.some((v: any) => v.registrationNumber?.toUpperCase() === offer.vehicle2WReg);
    if (!already) {
      vehicles.push({
        vehicleId:          generateId("VEH-2W"),
        category:           "2-Wheeler",
        type:               offer.vehicle2WType,
        brand:              offer.vehicle2WBrand || "",
        model:              offer.vehicle2WModel || "",
        registrationNumber: offer.vehicle2WReg,
        isPrimary:          false,
        addedAt:            new Date().toISOString(),
        addedReason:        "COMPLIMENTARY_OFFER",
      });
      customers[custIdx].vehicles = vehicles;
      lsSet("CUSTOMERS", customers);
    }
  }

  // Alert supervisor and TSE
  window.dispatchEvent(new CustomEvent("cc360:complimentary_offer_approved", {
    detail: { offerId, jobId, customerId: offer.customerId, vehicle2WReg: offer.vehicle2WReg, cityId: offer.cityId }
  }));

  return { success: true, jobId };
}

/**
 * TSM rejects an offer.
 */
export function rejectOffer(offerId: string, tsmId: string, reason: string): boolean {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  const idx = all.findIndex(o => o.offerId === offerId);
  if (idx < 0) return false;

  // Decrement TSE used count on rejection
  const offer = all[idx];
  const caps  = DataService.get<TseCapConfig[]>(TSE_CAPS_KEY) || [];
  const mon   = currentMonth();
  const capIdx = caps.findIndex(c => c.tseId === offer.offeredByTseId && c.month === mon);
  if (capIdx >= 0 && caps[capIdx].usedCount > 0) {
    caps[capIdx].usedCount -= 1;
    DataService.setAll(TSE_CAPS_KEY, caps);
  }

  all[idx] = { ...all[idx], status: "REJECTED", approvedByTsmId: tsmId, rejectionReason: reason };
  DataService.setAll(OFFERS_KEY, all);
  return true;
}

/**
 * Mark offer / job as completed.
 */
export function markOfferCompleted(offerId: string): void {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  const idx = all.findIndex(o => o.offerId === offerId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], status: "COMPLETED", completedAt: new Date().toISOString() };
    DataService.setAll(OFFERS_KEY, all);
  }
}

// ── Read helpers ──────────────────────────────────────────────────────────────

export function getPendingOffersForTSM(cityId: string): Complimentary2WOffer[] {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  return all.filter(o => o.cityId === cityId && o.status === "PENDING_TSM_APPROVAL");
}

export function getOffersByTSE(tseId: string): Complimentary2WOffer[] {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  const mon = currentMonth();
  return all.filter(o => o.offeredByTseId === tseId && o.createdAt.startsWith(mon));
}

export function getMarketingExpenseSummary(month: string, cityId?: string): {
  totalOffers:     number;
  totalCost:       number;
  newConversions:  number;
  retentions:      number;
  completed:       number;
  pending:         number;
} {
  const all = DataService.get<Complimentary2WOffer[]>(OFFERS_KEY) || [];
  const filtered = all.filter(o => o.cityId === cityId && o.createdAt.startsWith(month));
  return {
    totalOffers:    filtered.length,
    totalCost:      filtered.reduce((s, o) => s + o.estimatedCost, 0),
    newConversions: filtered.filter(o => o.reasonCode === "NEW_CONVERSION_INCENTIVE").length,
    retentions:     filtered.filter(o => o.reasonCode === "RETENTION_INCENTIVE").length,
    completed:      filtered.filter(o => o.status === "COMPLETED").length,
    pending:        filtered.filter(o => o.status === "PENDING_TSM_APPROVAL").length,
  };
}
