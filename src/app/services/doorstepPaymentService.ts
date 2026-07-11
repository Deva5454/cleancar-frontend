/**
 * DoorstepPaymentService
 *
 * Handles payment collection at the customer's location:
 *   - UPI QR (static QR for business UPI ID, customer scans)
 *   - Cash collection with daily shift reconciliation
 *   - Self-serve WhatsApp payment link (no TSE needed)
 *
 * Payment rules per job type:
 *   Subscription / Regular → payment already made (pre-paid); collect only if
 *     subscription.paymentStatus === "Pending" or job.paymentStatus === "Pending"
 *   One-Time / Add-on / Walk-in → payment REQUIRED before job can be completed
 */

import { DataService } from "./DataService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentMode   = "UPI" | "Cash" | "Link" | "PrePaid" | "Waived";
export type PaymentStatus = "Pending" | "Collected" | "LinkSent" | "LinkPaid" | "Waived" | "Failed";

export interface DoorstepPayment {
  paymentId:       string;
  jobId:           string;
  customerId:      string;
  customerName:    string;
  customerPhone:   string;
  amount:          number;
  mode:            PaymentMode;
  status:          PaymentStatus;
  // UPI proof
  utrLast4?:       string;      // last 4 chars of UTR customer shows
  upiRef?:         string;      // full reference if available
  // Cash proof
  cashAmount?:     number;      // actual cash handed over
  changeGiven?:    number;      // change returned
  // Link
  linkId?:         string;
  linkSentAt?:     string;
  linkPaidAt?:     string;
  // Collected by
  collectedBy:     string;      // washerId
  collectedByName: string;
  supervisorId?:   string;
  // Reconciliation
  reconciledAt?:   string;
  reconciledBy?:   string;
  depositRef?:     string;
  // Timestamps
  cityId:          string;
  shiftDate:       string;      // "2026-07-15"
  collectedAt?:    string;
  createdAt:       string;
}

export interface ShiftCashRegister {
  registerId:    string;
  cityId:        string;
  supervisorId:  string;
  supervisorName:string;
  shiftDate:     string;
  shiftType:     "Morning" | "Evening";
  collections:   DoorstepPayment[];
  totalCash:     number;
  totalUPI:      number;
  totalLink:     number;
  grandTotal:    number;
  status:        "Open" | "Submitted" | "Reconciled";
  submittedAt?:  string;
  depositRef?:   string;
  reconciledBy?: string;
  createdAt:     string;
  updatedAt:     string;
}

// ── Business UPI config (replace with real values) ───────────────────────────
// ⚠️⚠️⚠️ PLACEHOLDER — NOT A REAL BUSINESS UPI ACCOUNT ⚠️⚠️⚠️
// This ID is shown directly to real customers on the doorstep-payment QR
// code and copy-to-clipboard field. Now that the doorstep payment screen
// is actually wired into the washer's job-completion flow, this WILL be
// shown to real customers unless replaced with your real, monitored
// business UPI ID before this goes live.
export const BUSINESS_UPI = {
  id:   "249carwash@upi", // ← REPLACE with real UPI ID before deploying
  name: "249 Car Wash Services",
  // For QR code generation in the UI, use:
  // `upi://pay?pa=${BUSINESS_UPI.id}&pn=${encodeURIComponent(BUSINESS_UPI.name)}&am=${amount}&cu=INR`
} as const;

// ── Payment necessity by job type ─────────────────────────────────────────────
export function isPaymentRequired(job: {
  jobType: string;
  paymentStatus?: string;
  subscriptionId?: string;
  isComplimentary?: boolean;
}): boolean {
  if (job.isComplimentary) return false;
  // Subscription/Regular = pre-paid; only collect if explicitly pending
  if (job.subscriptionId && job.paymentStatus !== "Pending") return false;
  // One-Time, Add-on, Walk-in, Demo = collect at door
  const doorstepTypes = ["One-Time Demo", "Add-on", "Walk-in", "One-Time"];
  if (doorstepTypes.some(t => job.jobType?.includes(t))) return true;
  // Regular subscription but payment pending
  if (job.paymentStatus === "Pending") return true;
  return false;
}

export function canCompleteWithoutPayment(job: {
  jobType: string;
  subscriptionId?: string;
}): boolean {
  // Subscription jobs: wash happens regardless; payment is account-level
  if (job.subscriptionId) return true;
  // Regular subscription
  if (job.jobType === "Regular") return true;
  return false;
}

const SK = "DOORSTEP_PAYMENTS";
const SR = "SHIFT_CASH_REGISTERS";

class DoorstepPaymentService {

  getPayments(cityId?: string): DoorstepPayment[] {
    try {
      const all = DataService.get<DoorstepPayment>(SK);
      return cityId ? all.filter(p => p.cityId === cityId) : all;
    } catch { return []; }
  }

  getForJob(jobId: string): DoorstepPayment | null {
    return this.getPayments().find(p => p.jobId === jobId) ?? null;
  }

  private save(payment: DoorstepPayment) {
    const all = this.getPayments();
    const idx = all.findIndex(p => p.paymentId === payment.paymentId);
    idx >= 0 ? (all[idx] = payment) : all.unshift(payment);
    DataService.setAll(SK, all);
  }

  // ── UPI Collection ──────────────────────────────────────────────────────────

  /** Call when washer taps "Payment Received" after customer scans QR */
  recordUPI(params: {
    jobId: string; customerId: string; customerName: string; customerPhone: string;
    amount: number; utrLast4: string; upiRef?: string;
    collectedBy: string; collectedByName: string; supervisorId?: string;
    cityId: string; shiftDate: string;
  }): DoorstepPayment {
    const payment: DoorstepPayment = {
      paymentId:     `PAY-UPI-${Date.now()}`,
      jobId:         params.jobId,
      customerId:    params.customerId,
      customerName:  params.customerName,
      customerPhone: params.customerPhone,
      amount:        params.amount,
      mode:          "UPI",
      status:        "Collected",
      utrLast4:      params.utrLast4,
      upiRef:        params.upiRef,
      collectedBy:   params.collectedBy,
      collectedByName: params.collectedByName,
      supervisorId:  params.supervisorId,
      cityId:        params.cityId,
      shiftDate:     params.shiftDate,
      collectedAt:   new Date().toISOString(),
      createdAt:     new Date().toISOString(),
    };
    this.save(payment);
    this._addToRegister(payment);
    this._updateJobPaymentStatus(params.jobId, "Collected", "UPI", payment.paymentId, params.cityId);
    console.log(`[DoorstepPayment] UPI collected ₹${params.amount} for job ${params.jobId} UTR:****${params.utrLast4}`);
    return payment;
  }

  // ── Cash Collection ─────────────────────────────────────────────────────────

  recordCash(params: {
    jobId: string; customerId: string; customerName: string; customerPhone: string;
    amount: number; cashAmount: number; changeGiven?: number;
    collectedBy: string; collectedByName: string; supervisorId?: string;
    cityId: string; shiftDate: string;
  }): DoorstepPayment {
    const payment: DoorstepPayment = {
      paymentId:     `PAY-CASH-${Date.now()}`,
      jobId:         params.jobId,
      customerId:    params.customerId,
      customerName:  params.customerName,
      customerPhone: params.customerPhone,
      amount:        params.amount,
      mode:          "Cash",
      status:        "Collected",
      cashAmount:    params.cashAmount,
      changeGiven:   params.changeGiven ?? 0,
      collectedBy:   params.collectedBy,
      collectedByName: params.collectedByName,
      supervisorId:  params.supervisorId,
      cityId:        params.cityId,
      shiftDate:     params.shiftDate,
      collectedAt:   new Date().toISOString(),
      createdAt:     new Date().toISOString(),
    };
    this.save(payment);
    this._addToRegister(payment);
    this._updateJobPaymentStatus(params.jobId, "Collected", "Cash", payment.paymentId, params.cityId);
    console.log(`[DoorstepPayment] Cash collected ₹${params.cashAmount} for job ${params.jobId}`);
    return payment;
  }

  // ── Payment Link (no TSE needed) ────────────────────────────────────────────

  /**
   * Send a WhatsApp payment link directly from washer/supervisor.
   * Works outside TSE hours (5 AM – 10:30 AM and 6:30 PM – 10 PM).
   * Uses same teleSalesExecutiveService.sendPaymentLink() internally.
   */
  sendPaymentLink(params: {
    jobId: string; customerId: string; customerName: string; customerPhone: string;
    amount: number; packageName: string;
    sentBy: string; sentByName: string; sentByRole: "Washer" | "Supervisor";
    cityId: string; shiftDate: string;
  }): DoorstepPayment {
    const linkId = `LINK-${Date.now()}`;
    const upiLink = `upi://pay?pa=${BUSINESS_UPI.id}&pn=${encodeURIComponent(BUSINESS_UPI.name)}&am=${params.amount}&cu=INR&tn=${encodeURIComponent(`249 CarWash - ${params.packageName}`)}`;

    // WhatsApp message text (used by whatsappService)
    const waText = [
      `Hi ${params.customerName.split(" ")[0]}! 🚗`,
      `Your *249 Car Wash* is complete.`,
      `*Package:* ${params.packageName}`,
      `*Amount:* ₹${params.amount}`,
      ``,
      `Pay via UPI: ${BUSINESS_UPI.id}`,
      `Or tap: ${upiLink}`,
      ``,
      `For queries call your supervisor. Thank you! 🙏`,
    ].join("\n");

    // Log to whatsapp queue (whatsappService picks this up)
    try {
      const queue = JSON.parse(localStorage.getItem("WA_OUTBOX") || "[]");
      queue.unshift({ to: params.customerPhone, text: waText, type: "payment_link", jobId: params.jobId, sentAt: new Date().toISOString() });
      localStorage.setItem("WA_OUTBOX", JSON.stringify(queue.slice(0, 100)));
    } catch {}

    const payment: DoorstepPayment = {
      paymentId:     `PAY-LINK-${Date.now()}`,
      jobId:         params.jobId,
      customerId:    params.customerId,
      customerName:  params.customerName,
      customerPhone: params.customerPhone,
      amount:        params.amount,
      mode:          "Link",
      status:        "LinkSent",
      linkId,
      linkSentAt:    new Date().toISOString(),
      collectedBy:   params.sentBy,
      collectedByName: params.sentByName,
      cityId:        params.cityId,
      shiftDate:     params.shiftDate,
      createdAt:     new Date().toISOString(),
    };
    this.save(payment);
    this._updateJobPaymentStatus(params.jobId, "LinkSent", "Link", payment.paymentId, params.cityId);
    console.log(`[DoorstepPayment] Link sent for job ${params.jobId} by ${params.sentByName} (${params.sentByRole})`);
    return payment;
  }

  /** Mark link as paid (called when TSE or system confirms Razorpay callback) */
  markLinkPaid(paymentId: string, upiRef?: string) {
    const all = this.getPayments();
    const p = all.find(p => p.paymentId === paymentId);
    if (!p) return;
    p.status     = "LinkPaid";
    p.linkPaidAt = new Date().toISOString();
    if (upiRef) p.upiRef = upiRef;
    DataService.setAll(SK, all);
    this._updateJobPaymentStatus(p.jobId, "Collected", "Link", paymentId, p.cityId);
  }

  // ── Shift Cash Register ─────────────────────────────────────────────────────

  getRegisters(cityId?: string): ShiftCashRegister[] {
    try {
      const all = DataService.get<ShiftCashRegister>(SR);
      return cityId ? all.filter(r => r.cityId === cityId) : all;
    } catch { return []; }
  }

  getTodayRegister(cityId: string, supervisorId: string, shiftType: "Morning" | "Evening"): ShiftCashRegister | null {
    const today = new Date().toISOString().slice(0, 10);
    return this.getRegisters(cityId).find(r =>
      r.shiftDate === today && r.supervisorId === supervisorId && r.shiftType === shiftType
    ) ?? null;
  }

  private _addToRegister(payment: DoorstepPayment) {
    if (!payment.supervisorId) return;
    const today = payment.shiftDate;
    // Determine shift type from collection time
    const hour = new Date().getHours();
    const shiftType: "Morning" | "Evening" = hour < 14 ? "Morning" : "Evening";

    let register = this.getRegisters(payment.cityId)
      .find(r => r.shiftDate === today && r.supervisorId === payment.supervisorId && r.shiftType === shiftType);

    if (!register) {
      register = {
        registerId:    `REG-${payment.cityId}-${today}-${shiftType}`,
        cityId:        payment.cityId,
        supervisorId:  payment.supervisorId,
        supervisorName:"",
        shiftDate:     today,
        shiftType,
        collections:   [],
        totalCash:     0,
        totalUPI:      0,
        totalLink:     0,
        grandTotal:    0,
        status:        "Open",
        createdAt:     new Date().toISOString(),
        updatedAt:     new Date().toISOString(),
      };
    }

    register.collections = [...register.collections.filter(c => c.paymentId !== payment.paymentId), payment];
    register.totalCash  = register.collections.filter(c => c.mode === "Cash").reduce((s, c) => s + c.amount, 0);
    register.totalUPI   = register.collections.filter(c => c.mode === "UPI").reduce((s, c) => s + c.amount, 0);
    register.totalLink  = register.collections.filter(c => c.mode === "Link" || c.mode === "LinkPaid" as any).reduce((s, c) => s + c.amount, 0);
    register.grandTotal = register.totalCash + register.totalUPI + register.totalLink;
    register.updatedAt  = new Date().toISOString();

    const all = this.getRegisters();
    const idx = all.findIndex(r => r.registerId === register!.registerId);
    idx >= 0 ? (all[idx] = register) : all.unshift(register);
    DataService.setAll(SR, all);
  }

  /** Supervisor submits end-of-shift register with cash deposit reference */
  submitRegister(registerId: string, depositRef: string, supervisorName: string) {
    const all = this.getRegisters();
    const r = all.find(r => r.registerId === registerId);
    if (!r) return;
    r.status        = "Submitted";
    r.depositRef    = depositRef;
    r.supervisorName = supervisorName;
    r.submittedAt   = new Date().toISOString();
    r.updatedAt     = new Date().toISOString();
    DataService.setAll(SR, all);
    console.log(`[DoorstepPayment] Register ${registerId} submitted. Cash: ₹${r.totalCash}, UPI: ₹${r.totalUPI}`);
  }

  reconcileRegister(registerId: string, reconciledBy: string) {
    const all = this.getRegisters();
    const r = all.find(r => r.registerId === registerId);
    if (!r) return;
    r.status        = "Reconciled";
    r.reconciledBy  = reconciledBy;
    r.reconciledAt  = new Date().toISOString();
    r.updatedAt     = new Date().toISOString();
    DataService.setAll(SR, all);
  }

  // ── TSE pending confirmation queue ─────────────────────────────────────────

  /** Jobs collected at door that TSE needs to confirm as lead won */
  getTSEPendingConfirmations(cityId: string): DoorstepPayment[] {
    return this.getPayments(cityId).filter(p =>
      (p.status === "Collected" || p.status === "LinkPaid") && !p.reconciledAt
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  private _updateJobPaymentStatus(jobId: string, status: PaymentStatus, mode: PaymentMode, paymentId: string, cityId: string) {
    try {
      // Previously hardcoded to Surat regardless of which city the payment
      // actually happened in — Mumbai/Ahmedabad payments were silently
      // updating the wrong city's job list.
      const jobsKey = `cleancar_${cityId}_jobs`;
      const jobs = JSON.parse(localStorage.getItem(jobsKey) || "[]");
      const updated = jobs.map((j: any) => j.jobId === jobId
        ? { ...j, paymentStatus: status, collectionMode: mode, paymentId, updatedAt: new Date().toISOString() }
        : j
      );
      localStorage.setItem(jobsKey, JSON.stringify(updated));
    } catch {}
  }
}

export const doorstepPaymentService = new DoorstepPaymentService();
