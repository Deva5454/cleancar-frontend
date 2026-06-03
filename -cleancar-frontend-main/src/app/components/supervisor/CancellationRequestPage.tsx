/**
 * CancellationRequestPage.tsx
 * Public page at /cancel-service
 *
 * Allows an existing customer to:
 *  1. Enter their subscription details
 *  2. See live refund calculation (per 24/9 Cancellation Policy)
 *  3. Accept T&C for the cancellation
 *  4. Submit a formal cancellation request (stored in localStorage + WhatsApp)
 *
 * Policy: 24/9 Carwashing Pvt. Ltd. Cancellation Policy effective 1 June 2025
 *   - Before service starts (>5 days): nil fee, full refund less gateway (max 2%)
 *   - Day 1 – 70% elapsed: prorata + 10% of total contract value
 *   - After 70% elapsed: 100% forfeited, no refund
 */

import { useState, useEffect } from "react";
import { loadConfig, DEFAULT_CONFIG, type PlanPageConfig } from "./CustomerPlanPage";

// ── types ──────────────────────────────────────────────────────────────────
interface CancelRequest {
  id: string;
  submittedAt: string;
  customerName: string;
  customerMobile: string;
  customerEmail: string;
  subscriptionId: string;
  invoiceNumber: string;
  vehicleReg: string;
  reason: string;
  otherReason?: string;
  totalAmount: number;
  startDate: string;
  totalDays: number;
  daysElapsed: number;
  percentElapsed: number;
  prorata: number;
  cancellationFee: number;
  gatewayFee: number;
  refundAmount: number;
  refundZone: "full" | "partial" | "none";
  status: "Submitted" | "Under Review" | "Approved" | "Rejected" | "Processed";
}

const CANCEL_REASONS = [
  "Relocating / Moving out of service area",
  "Selling the vehicle",
  "Not satisfied with service quality",
  "Purchased a new vehicle (vehicle change)",
  "Financial reasons",
  "Extended travel / vehicle not available",
  "Service no longer required",
  "Other (please specify)",
];

const INR = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function computeRefund(total: number, days: number, elapsed: number) {
  const pct = days > 0 ? (elapsed / days) * 100 : 0;
  const dailyRate = days > 0 ? total / days : 0;
  const prorata = Math.round(dailyRate * elapsed);
  const cancelFee = Math.round(total * 0.10);
  const gatewayFee = Math.round(total * 0.02);

  if (elapsed === 0) {
    // Pre-commencement (>5 days before start)
    return { pct: 0, prorata: 0, cancelFee: 0, gatewayFee, refund: total - gatewayFee, zone: "full" as const };
  }
  if (pct >= 70) {
    return { pct, prorata: total, cancelFee: 0, gatewayFee: 0, refund: 0, zone: "none" as const };
  }
  const refund = Math.max(0, total - prorata - cancelFee - gatewayFee);
  return { pct, prorata, cancelFee, gatewayFee, refund, zone: "partial" as const };
}

// ─────────────────────────────────────────────────────────────────────────────
export function CancellationRequestPage() {
  const [cfg] = useState<PlanPageConfig>(loadConfig);
  const [step, setStep]       = useState<1|2|3|4>(1);
  const [submitted, setSubmitted] = useState(false);
  const [submittedReq, setSubmittedReq] = useState<CancelRequest | null>(null);

  // Step 1 — lookup
  const [custName, setCustName]       = useState("");
  const [custMobile, setCustMobile]   = useState("");
  const [custEmail, setCustEmail]     = useState("");
  const [subId, setSubId]             = useState("");
  const [invoiceNo, setInvoiceNo]     = useState("");
  const [vehicleReg, setVehicleReg]   = useState("");

  // Step 2 — subscription details
  const [totalAmount, setTotalAmount] = useState("");
  const [startDate, setStartDate]     = useState("");
  const [totalDays, setTotalDays]     = useState("30");

  // Step 3 — reason
  const [reason, setReason]           = useState("");
  const [otherReason, setOtherReason] = useState("");

  // Step 4 — consent
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [consentFee, setConsentFee]       = useState(false);
  const [showPolicy, setShowPolicy]       = useState(false);

  const step1Ok = custName && custMobile && (subId || invoiceNo) && vehicleReg;
  const step2Ok = totalAmount && parseFloat(totalAmount) > 0 && startDate && parseInt(totalDays) > 0;
  const step3Ok = reason && (reason !== "Other (please specify)" || otherReason.trim());
  const step4Ok = consentPolicy && consentFee;

  // Live refund calc
  const calc = (() => {
    if (!step2Ok) return null;
    const total = parseFloat(totalAmount);
    const days  = parseInt(totalDays);
    const start = new Date(startDate);
    const today = new Date();
    const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return { elapsed, ...computeRefund(total, days, Math.min(elapsed, days)) };
  })();

  const handleSubmit = () => {
    if (!calc) return;
    const req: CancelRequest = {
      id: `CANC-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      customerName: custName,
      customerMobile: custMobile,
      customerEmail: custEmail,
      subscriptionId: subId,
      invoiceNumber: invoiceNo,
      vehicleReg: vehicleReg.toUpperCase(),
      reason,
      otherReason: reason === "Other (please specify)" ? otherReason : undefined,
      totalAmount: parseFloat(totalAmount),
      startDate,
      totalDays: parseInt(totalDays),
      daysElapsed: calc.elapsed,
      percentElapsed: calc.pct,
      prorata: calc.prorata,
      cancellationFee: calc.cancelFee,
      gatewayFee: calc.gatewayFee,
      refundAmount: calc.refund,
      refundZone: calc.zone,
      status: "Submitted",
    };

    // Persist to localStorage for admin review
    try {
      const key = "cleancar_cancellation_requests";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift(req);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}

    setSubmittedReq(req);
    setSubmitted(true);
  };

  // ── SUCCESS ─────────────────────────────────────────────────────────────
  if (submitted && submittedReq) {
    const r = submittedReq;
    const waBody = encodeURIComponent(
      `CANCELLATION REQUEST\n\nRef: ${r.id}\nCustomer: ${r.customerName}\nMobile: ${r.customerMobile}\nInvoice/Sub: ${r.invoiceNumber || r.subscriptionId}\nVehicle: ${r.vehicleReg}\nReason: ${r.reason}${r.otherReason ? " — " + r.otherReason : ""}\n\nService Start: ${r.startDate}\nDays Elapsed: ${r.daysElapsed} of ${r.totalDays}\n\nTotal Paid: ${INR(r.totalAmount)}\nProrata Used: ${INR(r.prorata)}\nCancellation Fee: ${INR(r.cancellationFee)}\nGateway: ${INR(r.gatewayFee)}\nExpected Refund: ${r.refundZone === "none" ? "No Refund" : INR(r.refundAmount)}\n\nPlease acknowledge this formal cancellation request.`
    );
    const emailBody = encodeURIComponent(
      `Dear 24/9 Car Wash,\n\nI hereby submit a formal cancellation request for my subscription.\n\nCancellation Reference: ${r.id}\nFull Name: ${r.customerName}\nContact: ${r.customerMobile}\nSubscription ID: ${r.subscriptionId || "N/A"}\nInvoice Number: ${r.invoiceNumber || "N/A"}\nRegistered Vehicle: ${r.vehicleReg}\nService Start Date: ${r.startDate}\nReason: ${r.reason}${r.otherReason ? " — " + r.otherReason : ""}\n\nExpected Refund (per Cancellation Policy):\n- Total Paid: ${INR(r.totalAmount)}\n- Prorata Used (${r.daysElapsed} days): ${INR(r.prorata)}\n- Cancellation Fee (10%): ${INR(r.cancellationFee)}\n- Gateway Charges: ${INR(r.gatewayFee)}\n- Net Refund: ${r.refundZone === "none" ? "Nil (>70% term elapsed)" : INR(r.refundAmount)}\n\nPlease acknowledge receipt within 2 business days.\n\nRegards,\n${r.customerName}`
    );

    return (
      <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans',sans-serif", padding: "40px 20px" }}>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📋</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Cancellation Request Submitted</h2>
            <p style={{ color: "#4A5568", fontSize: 14 }}>Reference: <strong style={{ color: "#1565C0" }}>{r.id}</strong></p>
            <p style={{ color: "#4A5568", fontSize: 13, marginTop: 4 }}>We will acknowledge your request within <strong>2 business days</strong>.</p>
          </div>

          {/* Summary card */}
          <div style={{ background: "#fff", border: "1.5px solid #E3EEF7", borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ background: r.refundZone === "none" ? "#FEF2F2" : r.refundZone === "full" ? "#E8F5E9" : "#E3F2FD", padding: "14px 20px", fontWeight: 700, fontSize: 15, display: "flex", justifyContent: "space-between" }}>
              <span>{r.refundZone === "none" ? "⚠️ No Refund Zone" : r.refundZone === "full" ? "✅ Full Refund Applicable" : "💰 Partial Refund Applicable"}</span>
              <span style={{ color: r.refundZone === "none" ? "#DC2626" : "#1565C0" }}>
                {r.refundZone === "none" ? "Nil" : INR(r.refundAmount)}
              </span>
            </div>
            <div style={{ padding: "16px 20px" }}>
              {[
                ["Reference ID", r.id],
                ["Customer", r.customerName],
                ["Vehicle", r.vehicleReg],
                ["Invoice / Sub ID", r.invoiceNumber || r.subscriptionId],
                ["Reason", r.reason + (r.otherReason ? " — " + r.otherReason : "")],
                ["Term", `${r.daysElapsed} of ${r.totalDays} days elapsed (${Math.round(r.percentElapsed)}%)`],
                ["Total Paid", INR(r.totalAmount)],
                ...(r.refundZone !== "none" ? [
                  ["Prorata Deducted", `− ${INR(r.prorata)}`],
                  ["Cancellation Fee (10%)", `− ${INR(r.cancellationFee)}`],
                  ["Gateway Charges", `− ${INR(r.gatewayFee)}`],
                ] : []),
                ["Expected Refund", r.refundZone === "none" ? "Nil — term ≥ 70% elapsed" : INR(r.refundAmount)],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                  <span style={{ color: "#4A5568" }}>{k}</span>
                  <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "55%" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* What happens next */}
          <div style={{ background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#1565C0", marginBottom: 10 }}>📋 What happens next:</div>
            {[
              "Company acknowledges receipt within 2 business days",
              "Finance team verifies subscription and refund computation",
              "Refund quantum communicated to you for confirmation",
              "Refund processed to original payment source",
              "Confirmation sent to your registered contact",
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 6, fontSize: 13, color: "#1565C0" }}>
                <span style={{ fontWeight: 700 }}>{i + 1}.</span>{s}
              </div>
            ))}
          </div>

          {/* Send via */}
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "#374151" }}>Send this request formally via:</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${waBody}`} target="_blank" rel="noreferrer"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#25D366", color: "#fff", padding: "13px 20px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              💬 Send via WhatsApp to 24/9 Car Wash
            </a>
            <a href={`mailto:support@249carwashing.com?subject=Cancellation Request — ${r.id}&body=${emailBody}`}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#2196F3", color: "#fff", padding: "13px 20px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              📧 Send via Email to support@249carwashing.com
            </a>
            <button onClick={() => window.print()}
              style={{ padding: "11px 20px", background: "#F3F4F6", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              🖨️ Print / Save as PDF
            </button>
          </div>

          <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 12, padding: "14px 18px", fontSize: 13, color: "#92400E" }}>
            ⚠️ <strong>Important:</strong> Verbal or WhatsApp messages to field staff are not valid. Your formal request must be submitted via email to <strong>support@249carwashing.com</strong> or in person at a service location. Use the buttons above to do this now.
          </div>
        </div>
      </div>
    );
  }

  // ── MAIN FORM ────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans',sans-serif", color: "#0D1B2A" }}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E3EEF7", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/buy" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#2196F3", textDecoration: "none" }}>
          🚿 {cfg.brand.name}
        </a>
        <span style={{ fontSize: 13, color: "#4A5568" }}>📞 {cfg.brand.phone}</span>
      </nav>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#37474F,#546E7A)", padding: "40px 32px", textAlign: "center" }}>
        <div style={{ display: "inline-block", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 50, marginBottom: 16 }}>
          Service Cancellation Request
        </div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(22px,4vw,36px)", fontWeight: 800, color: "#fff", marginBottom: 10 }}>
          Request Cancellation of Service
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, maxWidth: 520, margin: "0 auto" }}>
          We're sorry to see you go. Fill in the details below and we'll compute your refund entitlement as per our Cancellation Policy.
        </p>
      </div>

      {/* STEPS */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E3EEF7", padding: "0 32px", display: "flex", justifyContent: "center" }}>
        {[
          { n: 1, label: "Your Details" },
          { n: 2, label: "Subscription" },
          { n: 3, label: "Reason" },
          { n: 4, label: "Confirm" },
        ].map(s => (
          <div key={s.n} style={{ flex: 1, maxWidth: 180, padding: "14px 8px", display: "flex", alignItems: "center", gap: 8, borderBottom: step === s.n ? "3px solid #546E7A" : "3px solid transparent" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: s.n < step ? "#00C853" : step === s.n ? "#546E7A" : "#CFD8DC", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.n < step ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? "#37474F" : "#78909C" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── STEP 1: YOUR DETAILS ───────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your contact details</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 28 }}>These must match what you used when subscribing.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Full Name *", value: custName, set: setCustName, placeholder: "Amit Patel" },
                { label: "Mobile *", value: custMobile, set: setCustMobile, placeholder: "+91 98765 43210" },
                { label: "Email", value: custEmail, set: setCustEmail, placeholder: "amit@example.com" },
                { label: "Vehicle Registration *", value: vehicleReg, set: setVehicleReg, placeholder: "GJ05MJ2345" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.placeholder}
                    style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
                </div>
              ))}
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Subscription ID <span style={{ fontWeight: 400, color: "#9CA3AF" }}>or</span> Invoice Number *</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <input value={subId} onChange={e => setSubId(e.target.value)} placeholder="SUB-1234567"
                    style={{ padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "monospace", outline: "none" }} />
                  <input value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} placeholder="INV-2025-06-001234"
                    style={{ padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "monospace", outline: "none" }} />
                </div>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>Found in your payment confirmation or WhatsApp receipt</p>
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!step1Ok}
              style={{ padding: "13px 32px", background: step1Ok ? "#546E7A" : "#CFD8DC", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step1Ok ? "pointer" : "not-allowed" }}>
              Next →
            </button>
          </div>
        )}

        {/* ── STEP 2: SUBSCRIPTION DETAILS ──────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your subscription details</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 8 }}>We use these to compute your refund entitlement.</p>
            <div style={{ background: "#E3F2FD", border: "1px solid #BBDEFB", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#1565C0" }}>
              📄 These details are on your invoice/receipt sent to WhatsApp or email at the time of subscription.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Total Amount Paid (₹) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: 11, color: "#6B7280", fontWeight: 600 }}>₹</span>
                  <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} placeholder="1499"
                    style={{ width: "100%", padding: "11px 14px 11px 26px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 15, fontWeight: 700, fontFamily: "inherit", outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Service Start Date *</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Total Service Days *</label>
                <select value={totalDays} onChange={e => setTotalDays(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none" }}>
                  <option value="30">30 days (Monthly)</option>
                  <option value="90">90 days (3 Months)</option>
                  <option value="180">180 days (6 Months)</option>
                  <option value="365">365 days (Annual)</option>
                </select>
              </div>
            </div>

            {/* Live refund calculator */}
            {calc && (
              <div style={{ border: `2px solid ${calc.zone === "none" ? "#FCA5A5" : calc.zone === "full" ? "#86EFAC" : "#93C5FD"}`, borderRadius: 14, overflow: "hidden", marginBottom: 24 }}>
                <div style={{ background: calc.zone === "none" ? "#FEF2F2" : calc.zone === "full" ? "#F0FDF4" : "#EFF6FF", padding: "14px 18px", fontWeight: 700, fontSize: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>
                    {calc.zone === "none" ? "⚠️ No Refund Zone" : calc.zone === "full" ? "✅ Full Refund" : "💰 Partial Refund"}
                  </span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, color: calc.zone === "none" ? "#DC2626" : "#1565C0" }}>
                    {calc.zone === "none" ? "Nil" : `≈ ${INR(calc.refund)}`}
                  </span>
                </div>
                <div style={{ padding: "14px 18px", fontSize: 13 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "#4A5568" }}>Days elapsed</span>
                    <span style={{ fontWeight: 600 }}>{calc.elapsed} of {totalDays} days ({Math.round(calc.pct)}%)</span>
                  </div>
                  {/* Progress bar */}
                  <div style={{ height: 8, background: "#E5E7EB", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, calc.pct)}%`, background: calc.zone === "none" ? "#EF4444" : calc.zone === "full" ? "#22C55E" : "#3B82F6", borderRadius: 4, transition: "width 0.3s" }} />
                    {/* 70% marker */}
                    <div style={{ position: "relative" }}>
                      <div style={{ position: "absolute", left: "70%", top: -8, width: 2, height: 8, background: "#F59E0B" }} />
                    </div>
                  </div>
                  {[
                    ["Total Paid", INR(parseFloat(totalAmount))],
                    ...(calc.zone !== "none" && calc.zone !== "full" ? [
                      ["− Prorata Used", `− ${INR(calc.prorata)}`],
                      ["− Cancellation Fee (10%)", `− ${INR(calc.cancelFee)}`],
                    ] : []),
                    ["− Gateway Charges (max 2%)", `− ${INR(calc.gatewayFee)}`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                      <span style={{ color: "#4A5568" }}>{k}</span><span style={{ fontWeight: 600 }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, fontWeight: 800, fontSize: 15, fontFamily: "'Syne',sans-serif" }}>
                    <span>Expected Refund</span>
                    <span style={{ color: calc.zone === "none" ? "#DC2626" : "#1565C0" }}>
                      {calc.zone === "none" ? "Nil" : `≈ ${INR(calc.refund)}`}
                    </span>
                  </div>
                  {calc.zone === "none" && (
                    <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>
                      More than 70% of your service term has elapsed. As per the Cancellation Policy, no refund is applicable. You may continue availing service until the term ends.
                    </p>
                  )}
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 6 }}>* Indicative amount. Final refund subject to verification by finance team. Timelines: UPI/NB 5–7 days, Debit 7–10 days, Credit 7–14 days.</p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={{ padding: "12px 24px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!step2Ok}
                style={{ padding: "13px 32px", background: step2Ok ? "#546E7A" : "#CFD8DC", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step2Ok ? "pointer" : "not-allowed" }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: REASON ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Reason for cancellation</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24 }}>This helps us improve. Please select the closest reason.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              {CANCEL_REASONS.map(r => (
                <div key={r} onClick={() => setReason(r)}
                  style={{ border: `2px solid ${reason === r ? "#546E7A" : "#E3EEF7"}`, borderRadius: 12, padding: "13px 18px", cursor: "pointer", background: reason === r ? "#ECEFF1" : "#fff", display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: reason === r ? 600 : 400, transition: "all 0.15s" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${reason === r ? "#546E7A" : "#CBD5E1"}`, background: reason === r ? "#546E7A" : "#fff", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {reason === r && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                  {r}
                </div>
              ))}
            </div>

            {reason === "Other (please specify)" && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Please describe *</label>
                <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} rows={3}
                  placeholder="Please provide details..."
                  style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", resize: "vertical" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(2)} style={{ padding: "12px 24px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Back</button>
              <button onClick={() => setStep(4)} disabled={!step3Ok}
                style={{ padding: "13px 32px", background: step3Ok ? "#546E7A" : "#CFD8DC", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step3Ok ? "pointer" : "not-allowed" }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: CONFIRM ────────────────────────────────────────────── */}
        {step === 4 && calc && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Confirm cancellation</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 20 }}>Please read and accept the terms before submitting your formal request.</p>

            {/* Summary */}
            <div style={{ background: "#fff", border: "1.5px solid #E3EEF7", borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
              <div style={{ padding: "12px 18px", background: "#F8FBFF", fontWeight: 700, fontSize: 14, borderBottom: "1px solid #E3EEF7" }}>Cancellation Summary</div>
              {[
                ["Customer", custName],
                ["Vehicle", vehicleReg.toUpperCase()],
                ["Subscription / Invoice", subId || invoiceNo],
                ["Reason", reason + (otherReason ? " — " + otherReason : "")],
                ["Days elapsed", `${calc.elapsed} of ${totalDays} (${Math.round(calc.pct)}%)`],
                ["Expected Refund", calc.zone === "none" ? "Nil" : `≈ ${INR(calc.refund)}`],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 18px", borderBottom: "1px solid #F3F4F6", fontSize: 13 }}>
                  <span style={{ color: "#4A5568" }}>{k}</span>
                  <span style={{ fontWeight: 600, maxWidth: "60%", textAlign: "right" }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Consent checkboxes */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={consentPolicy} onChange={e => setConsentPolicy(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#546E7A", flexShrink: 0 }} />
                <span>I have read and understood the <button onClick={() => setShowPolicy(true)} style={{ background: "none", border: "none", color: "#2196F3", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13 }}>Cancellation Policy</button>. I understand the refund computation method and the no-refund zone after 70% term elapsed.</span>
              </label>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={consentFee} onChange={e => setConsentFee(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#546E7A", flexShrink: 0 }} />
                <span>I acknowledge that a <strong>10% cancellation fee</strong> on the total contract value applies (where within the first 70% of term), and that the refund will be credited to the <strong>original payment source</strong> within the timelines specified in the Refund Policy.</span>
              </label>
            </div>

            <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 13, color: "#92400E" }}>
              ⚠️ After submitting, use the WhatsApp or email button on the next screen to send a formal written request to 24/9 Car Wash. The cancellation is effective when the Company acknowledges receipt.
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(3)} style={{ padding: "12px 24px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>← Back</button>
              <button onClick={handleSubmit} disabled={!step4Ok}
                style={{ padding: "14px 36px", background: step4Ok ? "#546E7A" : "#CFD8DC", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: step4Ok ? "pointer" : "not-allowed" }}>
                Submit Cancellation Request
              </button>
            </div>
          </div>
        )}

        {/* Policy modal */}
        {showPolicy && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowPolicy(false)}>
            <div style={{ background: "#fff", borderRadius: 18, maxWidth: 580, width: "100%", maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: "18px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, margin: 0 }}>🚫 Cancellation Policy</h3>
                <button onClick={() => setShowPolicy(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>✕</button>
              </div>
              <div style={{ padding: "20px 24px", overflowY: "auto", fontSize: 13, lineHeight: 1.8, color: "#374151" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 12 }}>24/9 Carwashing Pvt. Ltd. · Effective Date: 1st June 2025</p>
                <p><strong>1. How to Request</strong><br />Submit a written request via email to support@249carwashing.com or in person. Include your name, subscription/invoice number, vehicle registration, and reason. Verbal or WhatsApp requests to field staff are not valid.</p>
                <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12 }}>
                  <strong>Fee Schedule</strong>
                  <table style={{ width: "100%", marginTop: 8, borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr><th style={{ textAlign: "left", padding: "4px 6px", borderBottom: "1px solid #FDE68A" }}>Window</th><th style={{ padding: "4px 6px", borderBottom: "1px solid #FDE68A" }}>Fee</th><th style={{ padding: "4px 6px", borderBottom: "1px solid #FDE68A" }}>Refund</th></tr></thead>
                    <tbody>
                      <tr><td style={{ padding: "4px 6px", borderBottom: "1px solid #FEF3C7" }}>Before service starts (&gt;5 days)</td><td style={{ padding: "4px 6px", textAlign: "center" }}>Nil</td><td style={{ padding: "4px 6px" }}>Full refund less gateway charges</td></tr>
                      <tr><td style={{ padding: "4px 6px", borderBottom: "1px solid #FEF3C7" }}>Day 1 – 70% of term</td><td style={{ padding: "4px 6px", textAlign: "center" }}>Prorata + 10% of contract</td><td style={{ padding: "4px 6px" }}>Balance after deductions</td></tr>
                      <tr style={{ background: "#FEF2F2" }}><td style={{ padding: "4px 6px", fontWeight: 700 }}>After 70% elapsed</td><td style={{ padding: "4px 6px", textAlign: "center", color: "#DC2626", fontWeight: 700 }}>100% forfeited</td><td style={{ padding: "4px 6px", color: "#DC2626", fontWeight: 700 }}>No refund</td></tr>
                    </tbody>
                  </table>
                </div>
                <p><strong>2. Example</strong><br />Total package ₹3,000 for 30 days. Customer cancels at Day 12 (40% elapsed). Prorata = ₹1,200. Cancellation fee = ₹300 (10%). Gateway = ₹60. Refund = ₹1,440.</p>
                <p><strong>3. No Pause Rule</strong><br />Customer travel, vehicle repair, or choice not to use service does not qualify for fee waiver or term extension.</p>
                <p><strong>4. Non-Transferability</strong><br />Subscriptions cannot be transferred to another person, vehicle, or entity.</p>
                <p><strong>5. Contact</strong><br />Email: support@249carwashing.com · Phone: 080 4879 4545 (Mon–Sat, 10am–7pm)</p>
              </div>
              <div style={{ padding: "14px 24px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10 }}>
                <button onClick={() => { setConsentPolicy(true); setShowPolicy(false); }}
                  style={{ flex: 1, padding: "11px", background: "#546E7A", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  ✓ I Understand & Accept
                </button>
                <button onClick={() => setShowPolicy(false)} style={{ padding: "11px 18px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom strip */}
      <div style={{ background: "#37474F", padding: "12px 32px", display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
        {["📧 support@249carwashing.com", "📞 080 4879 4545", "Mon–Sat · 10am–7pm"].map((t, i) => (
          <span key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
