/**
 * CancellationRequestPage.tsx  — /cancel-service
 *
 * Flow:
 *   Step 1 — Customer identifies themselves (name + mobile ONLY; sub ID optional)
 *             System auto-fetches their subscription from CustomerContext
 *   Step 2 — Reason for cancellation
 *   Step 3 — Full policy-driven refund breakdown shown; customer accepts or declines
 *             • Accept  → cancellation request queued to TSM (stored in cleancar_tsm_refunds)
 *                         + complaint logged to CCE service as info ticket
 *             • Decline → escalated to CCE (stored in cleancar_complaints as P2 ticket)
 *                         CCE will call the customer to discuss and resolve
 *   Step 4 — Confirmation screen
 *
 * Policy: 24/9 Carwashing Pvt. Ltd. — Cancellation Policy effective 1 June 2025
 */

import { useState, useEffect } from "react";
import { loadConfig, type PlanPageConfig } from "./CustomerPlanPage";

// ─── Types ───────────────────────────────────────────────────────────────────
interface FoundSubscription {
  subscriptionId: string;
  invoiceNumber: string;
  customerName: string;
  customerId: string;
  packageName: string;
  vehicleReg: string;
  vehicleCategory: string;
  startDate: string;
  totalDays: number;
  totalAmount: number;
  paymentMethod: string;
  cityId: string;
}

const CANCEL_REASONS = [
  "Relocating / Moving out of service area",
  "Selling the vehicle",
  "Not satisfied with service quality",
  "Purchased a new vehicle (vehicle change required)",
  "Financial reasons",
  "Extended travel / vehicle not available for long period",
  "Service no longer required",
  "Other (please specify)",
];

const INR = (n: number) => "₹" + Math.max(0, Math.round(n)).toLocaleString("en-IN");

// ─── Policy Calculation ───────────────────────────────────────────────────────
function computeRefund(total: number, totalDays: number, startDate: string) {
  const start   = new Date(startDate);
  const today   = new Date();
  const elapsed = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const pct     = totalDays > 0 ? Math.min(100, (elapsed / totalDays) * 100) : 0;
  const daily   = totalDays > 0 ? total / totalDays : 0;
  const prorata = Math.round(daily * Math.min(elapsed, totalDays));
  const cancelFee = Math.round(total * 0.10);
  const gatewayFee = Math.round(total * 0.02);

  // Pre-commencement (not started yet)
  if (elapsed <= 0) {
    return { elapsed: 0, pct: 0, prorata: 0, cancelFee: 0, gatewayFee, refund: total - gatewayFee, zone: "full" as const, daily };
  }
  // No-refund zone ≥ 70%
  if (pct >= 70) {
    return { elapsed, pct, prorata: total, cancelFee: 0, gatewayFee: 0, refund: 0, zone: "none" as const, daily };
  }
  // Partial refund
  const refund = Math.max(0, total - prorata - cancelFee - gatewayFee);
  return { elapsed, pct, prorata, cancelFee, gatewayFee, refund, zone: "partial" as const, daily };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CancellationRequestPage() {
  const [cfg] = useState<PlanPageConfig>(loadConfig);

  // Step management
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [outcome, setOutcome] = useState<"accepted" | "declined" | null>(null);

  // Step 1 — identification
  const [custMobile, setCustMobile] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [subIdHint, setSubIdHint]   = useState(""); // optional
  const [isLooking, setIsLooking]   = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [found, setFound] = useState<FoundSubscription | null>(null);

  // Step 2 — reason
  const [reason, setReason]         = useState("");
  const [otherReason, setOtherReason] = useState("");

  // Step 3 — consent
  const [consentPolicy, setConsentPolicy] = useState(false);
  const [consentCalc, setConsentCalc]     = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [refId, setRefId]                 = useState("");

  const step1Ok = custMobile.length >= 10 && vehicleReg.trim().length >= 4;
  const step2Ok = reason && (reason !== "Other (please specify)" || otherReason.trim());

  const calc = found ? computeRefund(found.totalAmount, found.totalDays, found.startDate) : null;

  // ── Lookup subscription from localStorage stores ─────────────────────────
  const handleLookup = () => {
    setIsLooking(true);
    setLookupError("");
    setFound(null);

    try {
      const mobile = custMobile.replace(/\D/g, "").slice(-10);
      const reg    = vehicleReg.trim().toUpperCase().replace(/\s/g, "");

      // Search web invoices first
      const webInvoices: any[] = JSON.parse(localStorage.getItem("cleancar_web_invoices") || "[]");
      let match = webInvoices.find((inv: any) => {
        const invMobile = (inv.customerPhone || "").replace(/\D/g, "").slice(-10);
        const invReg    = (inv.vehicleReg || "").toUpperCase().replace(/\s/g, "");
        const invSub    = (inv.subscriptionId || "").toLowerCase();
        const mobileMatch = invMobile === mobile;
        const regMatch    = reg ? invReg === reg : true;
        const subMatch    = subIdHint ? invSub.includes(subIdHint.toLowerCase()) : true;
        return mobileMatch && (regMatch || !reg) && subMatch;
      });

      if (match) {
        setFound({
          subscriptionId: match.subscriptionId || match.invoiceNumber,
          invoiceNumber:  match.invoiceNumber,
          customerName:   match.customerName,
          customerId:     match.customerId || "",
          packageName:    match.items?.[0]?.name || "Subscription",
          vehicleReg:     match.vehicleReg || reg,
          vehicleCategory: match.vehicleCategory || "",
          startDate:      match.createdAt?.split("T")[0] || new Date().toISOString().split("T")[0],
          totalDays:      30,
          totalAmount:    match.subtotal || 0,
          paymentMethod:  match.paymentMethod || "Online",
          cityId:         "CITY-SURAT",
        });
        setIsLooking(false);
        return;
      }

      // Search CustomerSubscriptionContext store
      const subs: any[] = JSON.parse(localStorage.getItem("cc360_subscriptions") || "[]");
      const customers: any[] = JSON.parse(localStorage.getItem("cc360_customers") || "[]");
      const revenues: any[] = JSON.parse(localStorage.getItem("FINANCE_REVENUES") || "[]");

      // Find customer by mobile
      const customer = customers.find((c: any) => {
        const ph = (c.phone || c.mobile || "").replace(/\D/g, "").slice(-10);
        return ph === mobile;
      });

      if (customer) {
        // Find their active subscription
        const sub = subs.find((s: any) =>
          s.customerId === customer.customerId &&
          s.status === "Active" &&
          (!subIdHint || s.subscriptionId?.toLowerCase().includes(subIdHint.toLowerCase()))
        );

        if (sub) {
          // Find revenue record for invoice number
          const rev = revenues.find((r: any) => r.customerId === customer.customerId && r.subscriptionId === sub.subscriptionId);
          setFound({
            subscriptionId: sub.subscriptionId,
            invoiceNumber:  rev?.invoiceNumber || sub.subscriptionId,
            customerName:   `${customer.firstName} ${customer.lastName}`.trim(),
            customerId:     customer.customerId,
            packageName:    sub.packageName || sub.packageType,
            vehicleReg:     customer.vehicleDetails?.registrationNumber || reg,
            vehicleCategory: customer.vehicleDetails?.category || "",
            startDate:      sub.startDate,
            totalDays:      sub.billingCycle === "Annual" ? 365 : sub.billingCycle === "Quarterly" ? 90 : 30,
            totalAmount:    sub.priceLocked || sub.pricing?.finalPrice || 0,
            paymentMethod:  rev?.paymentMethod || "Online",
            cityId:         sub.cityId || customer.cityId || "CITY-SURAT",
          });
          setIsLooking(false);
          return;
        }
      }

      // Not found
      setLookupError(
        "We couldn't find an active subscription for this mobile number" +
        (reg ? ` and vehicle ${reg}` : "") +
        ". Please check the details or contact us on WhatsApp."
      );
    } catch (e) {
      setLookupError("Something went wrong. Please try again or contact support.");
    }
    setIsLooking(false);
  };

  // ── Submit with acceptance ────────────────────────────────────────────────
  const handleAccept = () => {
    if (!found || !calc) return;
    setIsSubmitting(true);
    const id = `CANC-${Date.now()}`;
    setRefId(id);

    const req = {
      id,
      type: "cancellation_request",
      status: "Pending TSM Review",
      submittedAt: new Date().toISOString(),
      // Customer
      customerName: found.customerName,
      customerId:   found.customerId,
      customerMobile: custMobile,
      vehicleReg: found.vehicleReg,
      // Subscription
      subscriptionId: found.subscriptionId,
      invoiceNumber:  found.invoiceNumber,
      packageName:    found.packageName,
      startDate:      found.startDate,
      totalDays:      found.totalDays,
      cityId:         found.cityId,
      // Financials
      totalAmount:    found.totalAmount,
      daysElapsed:    calc.elapsed,
      percentElapsed: calc.pct,
      prorata:        calc.prorata,
      cancellationFee: calc.cancelFee,
      gatewayFee:     calc.gatewayFee,
      refundAmount:   calc.refund,
      refundZone:     calc.zone,
      paymentMethod:  found.paymentMethod,
      // Reason
      reason,
      otherReason: reason === "Other (please specify)" ? otherReason : "",
      // Workflow
      customerConsent: true,
      assignedTo: "TSM",
      action: "Process Refund",
    };

    // Save to TSM refund queue
    try {
      const key = "cleancar_tsm_refunds";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift(req);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}

    // Also save to cancellation requests
    try {
      const key = "cleancar_cancellation_requests";
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.unshift(req);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}

    // Log info ticket to CCE (for visibility)
    try {
      const cceTicket = {
        id: `TKT-${Date.now()}`,
        ticketId: `TKT-${Date.now()}`,
        customerId: found.customerId,
        customerName: found.customerName,
        customerPhone: custMobile,
        vehicle: found.vehicleCategory,
        vehicleNumber: found.vehicleReg,
        complaintType: "Cancellation Request — Customer Accepted",
        complaintTypeId: "CANCELLATION",
        description: `Customer accepted cancellation terms. Refund of ${INR(calc.refund)} to be processed by TSM. Ref: ${id}`,
        channel: "web",
        priority: "Low",
        status: "open",
        cceId: "CCE-AUTO",
        cceName: "System",
        createdAt: new Date().toISOString(),
        loggedAt: new Date().toISOString(),
        cancellationRef: id,
        assignedTo: "TSM",
      };
      const complaints = JSON.parse(localStorage.getItem("cleancar_complaints") || "[]");
      complaints.unshift(cceTicket);
      localStorage.setItem("cleancar_complaints", JSON.stringify(complaints));
    } catch (_) {}

    setOutcome("accepted");
    setIsSubmitting(false);
    setStep(4);
  };

  // ── Submit with decline — escalate to CCE ────────────────────────────────
  const handleDecline = () => {
    if (!found || !calc) return;
    setIsSubmitting(true);
    const id = `CANC-${Date.now()}`;
    setRefId(id);

    // Escalate to CCE as P2 complaint
    try {
      const cceTicket = {
        id: `TKT-CANC-${Date.now()}`,
        ticketId: `TKT-CANC-${Date.now()}`,
        customerId: found.customerId,
        customerName: found.customerName,
        customerPhone: custMobile,
        vehicle: found.vehicleCategory,
        vehicleNumber: found.vehicleReg,
        complaintType: "Cancellation — Customer Declined Refund Terms",
        complaintTypeId: "CANCELLATION_DISPUTE",
        description: `Customer declined the computed refund of ${INR(calc.refund)} for subscription ${found.subscriptionId}. Reason: ${reason}${otherReason ? " — " + otherReason : ""}. Please call customer to discuss and resolve. Cancellation Ref: ${id}.`,
        channel: "web",
        priority: "High",
        status: "open",
        cceId: "CCE-AUTO",
        cceName: "Unassigned — Needs CCE",
        createdAt: new Date().toISOString(),
        loggedAt: new Date().toISOString(),
        cancellationRef: id,
        assignedTo: "CCE",
        slaHours: 4,
        escalated: true,
      };
      const complaints = JSON.parse(localStorage.getItem("cleancar_complaints") || "[]");
      complaints.unshift(cceTicket);
      localStorage.setItem("cleancar_complaints", JSON.stringify(complaints));
    } catch (_) {}

    // Save to cancellation requests with declined status
    try {
      const req = {
        id,
        type: "cancellation_dispute",
        status: "Escalated to CCE",
        submittedAt: new Date().toISOString(),
        customerName: found.customerName,
        customerId: found.customerId,
        customerMobile: custMobile,
        vehicleReg: found.vehicleReg,
        subscriptionId: found.subscriptionId,
        invoiceNumber: found.invoiceNumber,
        packageName: found.packageName,
        totalAmount: found.totalAmount,
        refundAmount: calc.refund,
        refundZone: calc.zone,
        reason,
        otherReason: reason === "Other (please specify)" ? otherReason : "",
        customerConsent: false,
        assignedTo: "CCE",
        action: "Call Customer — Dispute Resolution",
      };
      const existing = JSON.parse(localStorage.getItem("cleancar_cancellation_requests") || "[]");
      existing.unshift(req);
      localStorage.setItem("cleancar_cancellation_requests", JSON.stringify(existing));
    } catch (_) {}

    setOutcome("declined");
    setIsSubmitting(false);
    setStep(4);
  };

  // ─── Styles ───────────────────────────────────────────────────────────────
  const S = {
    page: { minHeight: "100vh", background: "#F8FBFF", fontFamily: "'DM Sans',sans-serif", color: "#0D1B2A" } as const,
    card: { background: "#fff", border: "1.5px solid #E3EEF7", borderRadius: 14, overflow: "hidden", marginBottom: 20 } as const,
    input: { width: "100%", padding: "11px 14px", border: "1.5px solid #E3EEF7", borderRadius: 10, fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box" } as const,
    label: { display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6, color: "#374151" } as const,
    btn:   (active: boolean, color = "#546E7A") => ({ padding: "12px 28px", background: active ? color : "#CFD8DC", color: "#fff", border: "none", borderRadius: 50, fontWeight: 700, fontSize: 15, cursor: active ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 0.15s" }) as const,
    back:  { padding: "11px 22px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 50, fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit" } as const,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E3EEF7", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/buy" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#2196F3", textDecoration: "none" }}>🚿 {cfg.brand.name}</a>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6B7280" }}>📞 {cfg.brand.phone}</span>
          <a href={`https://wa.me/${cfg.brand.whatsappNumber}`} target="_blank" rel="noreferrer"
            style={{ background: "#25D366", color: "#fff", padding: "7px 14px", borderRadius: 50, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>💬 WhatsApp</a>
        </div>
      </nav>

      {/* HEADER */}
      <div style={{ background: "linear-gradient(135deg,#37474F,#546E7A)", padding: "36px 28px", textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: "clamp(20px,4vw,32px)", fontWeight: 800, color: "#fff", marginBottom: 8 }}>
          Request Service Cancellation
        </h1>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
          We're sorry to see you go. Your refund will be calculated as per our Cancellation Policy.
        </p>
      </div>

      {/* STEP INDICATOR */}
      <div style={{ background: "#fff", borderBottom: "1px solid #E3EEF7", display: "flex", justifyContent: "center" }}>
        {[
          { n: 1, label: "Find Subscription" },
          { n: 2, label: "Reason" },
          { n: 3, label: "Refund & Confirm" },
          { n: 4, label: "Done" },
        ].map(s => (
          <div key={s.n} style={{ flex: 1, maxWidth: 180, padding: "13px 8px", display: "flex", alignItems: "center", gap: 8, borderBottom: step === s.n ? "3px solid #546E7A" : "3px solid transparent" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.n < step ? "#00C853" : step === s.n ? "#546E7A" : "#CFD8DC", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {s.n < step ? "✓" : s.n}
            </div>
            <span style={{ fontSize: 12, fontWeight: step === s.n ? 700 : 400, color: step === s.n ? "#37474F" : "#90A4AE" }}>{s.label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "36px 24px 80px" }}>

        {/* ═══ STEP 1: FIND SUBSCRIPTION ════════════════════════════════════ */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Find your subscription</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24 }}>Enter your registered mobile number and vehicle registration. The system will find your subscription automatically.</p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={S.label}>Mobile Number *</label>
                <input value={custMobile} onChange={e => setCustMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210" style={S.input} maxLength={10} />
              </div>
              <div>
                <label style={S.label}>Vehicle Registration *</label>
                <input value={vehicleReg} onChange={e => setVehicleReg(e.target.value.toUpperCase())}
                  placeholder="GJ05MJ2345" style={S.input} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ ...S.label, fontWeight: 400, color: "#9CA3AF" }}>
                  Subscription / Invoice ID <span style={{ fontSize: 11 }}>(optional — helps if you have multiple)</span>
                </label>
                <input value={subIdHint} onChange={e => setSubIdHint(e.target.value)}
                  placeholder="SUB-... or INV-... (leave blank to auto-detect)" style={S.input} />
              </div>
            </div>

            {lookupError && (
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#DC2626" }}>
                ⚠️ {lookupError}
                <div style={{ marginTop: 8 }}>
                  <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${encodeURIComponent("Hi, I want to cancel my subscription but the system couldn't find it. My mobile is " + custMobile)}`}
                    target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 600, textDecoration: "none" }}>
                    💬 Contact us on WhatsApp instead →
                  </a>
                </div>
              </div>
            )}

            {/* Found subscription preview */}
            {found && (
              <div style={{ background: "#E8F5E9", border: "1.5px solid #A5D6A7", borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1B5E20", marginBottom: 10 }}>✅ Subscription Found</div>
                {[
                  ["Customer", found.customerName],
                  ["Package", found.packageName],
                  ["Vehicle", found.vehicleReg],
                  ["Subscription ID", found.subscriptionId],
                  ["Start Date", found.startDate],
                  ["Amount Paid", INR(found.totalAmount)],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: "#2E7D32" }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {!found && (
                <button onClick={handleLookup} disabled={!step1Ok || isLooking}
                  style={S.btn(step1Ok && !isLooking, "#546E7A")}>
                  {isLooking ? "🔍 Searching…" : "🔍 Find My Subscription"}
                </button>
              )}
              {found && (
                <>
                  <button onClick={() => { setFound(null); setLookupError(""); }} style={S.back}>← Try Again</button>
                  <button onClick={() => setStep(2)} style={S.btn(true, "#546E7A")}>Continue with This Subscription →</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ═══ STEP 2: REASON ═══════════════════════════════════════════════ */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Reason for cancellation</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 24 }}>This helps us improve. Please choose the closest option.</p>

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
              <div style={{ marginBottom: 20 }}>
                <label style={S.label}>Please describe *</label>
                <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} rows={3}
                  placeholder="Please provide details..."
                  style={{ ...S.input, resize: "vertical" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setStep(1)} style={S.back}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!step2Ok} style={S.btn(!!step2Ok, "#546E7A")}>View Refund Calculation →</button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: REFUND BREAKDOWN + ACCEPT / DECLINE ═════════════════ */}
        {step === 3 && found && calc && (
          <div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Your Refund Calculation</h2>
            <p style={{ fontSize: 14, color: "#4A5568", marginBottom: 20 }}>
              Computed as per 24/9 Carwashing Pvt. Ltd. Cancellation Policy (effective 1 June 2025).
            </p>

            {/* Subscription Summary */}
            <div style={S.card}>
              <div style={{ padding: "12px 18px", background: "#F8FBFF", borderBottom: "1px solid #E3EEF7", fontWeight: 700, fontSize: 14, color: "#374151" }}>
                📋 Subscription Details
              </div>
              <div style={{ padding: "14px 18px" }}>
                {[
                  ["Customer",       found.customerName],
                  ["Package",        found.packageName],
                  ["Vehicle",        found.vehicleReg],
                  ["Service Started",found.startDate],
                  ["Term",           `${found.totalDays} days`],
                  ["Days Used",      `${calc.elapsed} of ${found.totalDays} days`],
                  ["Reason",         reason + (otherReason ? " — " + otherReason : "")],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "5px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ color: "#4A5568" }}>{k}</span>
                    <span style={{ fontWeight: 600, maxWidth: "55%", textAlign: "right" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Refund Calculation */}
            <div style={{ border: `2px solid ${calc.zone === "none" ? "#FCA5A5" : calc.zone === "full" ? "#86EFAC" : "#93C5FD"}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
              <div style={{ background: calc.zone === "none" ? "#FEF2F2" : calc.zone === "full" ? "#F0FDF4" : "#EFF6FF", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>
                  {calc.zone === "none" ? "⚠️ No Refund Zone" : calc.zone === "full" ? "✅ Full Refund Applicable" : "💰 Partial Refund Applicable"}
                </span>
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: calc.zone === "none" ? "#DC2626" : "#1565C0" }}>
                  {calc.zone === "none" ? "₹0" : INR(calc.refund)}
                </span>
              </div>

              <div style={{ padding: "16px 20px" }}>
                {/* Progress bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
                    <span>Day 0</span>
                    <span style={{ color: "#F59E0B", fontWeight: 600 }}>70% = Day {Math.round(found.totalDays * 0.7)} (No Refund Zone starts)</span>
                    <span>Day {found.totalDays}</span>
                  </div>
                  <div style={{ height: 10, background: "#E5E7EB", borderRadius: 5, position: "relative", overflow: "visible" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, calc.pct)}%`, background: calc.zone === "none" ? "#EF4444" : calc.zone === "full" ? "#22C55E" : "#3B82F6", borderRadius: 5, transition: "width 0.4s" }} />
                    {/* 70% marker */}
                    <div style={{ position: "absolute", left: "70%", top: -3, width: 3, height: 16, background: "#F59E0B", borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280", marginTop: 4 }}>
                    You are at <strong>{Math.round(calc.pct)}% ({calc.elapsed} days used)</strong> of your {found.totalDays}-day term.
                  </div>
                </div>

                {/* Calculation table */}
                <div style={{ background: "#F9FAFB", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Refund Computation
                  </div>
                  {[
                    { label: "Total Amount Paid",                                val: INR(found.totalAmount),  color: "#374151" },
                    { label: `Prorata Used (${INR(Math.round(calc.daily))}/day × ${calc.elapsed} days)`, val: `− ${INR(calc.prorata)}`, color: "#DC2626" },
                    ...(calc.zone === "partial" ? [
                      { label: "Cancellation Fee (10% of ₹" + found.totalAmount.toLocaleString("en-IN") + ")", val: `− ${INR(calc.cancelFee)}`, color: "#DC2626" },
                    ] : []),
                    ...(calc.zone !== "none" ? [
                      { label: "Payment Gateway Charges (max 2%)", val: `− ${INR(calc.gatewayFee)}`, color: "#DC2626" },
                    ] : []),
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid #E5E7EB", color: row.color }}>
                      <span>{row.label}</span>
                      <span style={{ fontWeight: 600 }}>{row.val}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 10, marginTop: 4, fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>
                    <span>Net Refund to You</span>
                    <span style={{ color: calc.zone === "none" ? "#DC2626" : "#1565C0" }}>
                      {calc.zone === "none" ? "₹0 (No Refund)" : INR(calc.refund)}
                    </span>
                  </div>
                </div>

                {/* Refund timeline */}
                {calc.zone !== "none" && (
                  <div style={{ marginTop: 12, fontSize: 12, color: "#6B7280", background: "#EFF6FF", borderRadius: 8, padding: "10px 14px" }}>
                    💳 Refund timeline: UPI/Net Banking 5–7 days · Debit Card 7–10 days · Credit Card 7–14 days · Cash 10 days (NEFT/Cheque). Credited to original payment source.
                  </div>
                )}

                {calc.zone === "none" && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "#DC2626", background: "#FEF2F2", borderRadius: 8, padding: "10px 14px" }}>
                    ⚠️ More than 70% of your service term ({Math.round(calc.pct)}%) has elapsed. As per our policy, no refund is applicable at this stage. However, you may continue using the service for the remaining {found.totalDays - calc.elapsed} days.
                  </div>
                )}
              </div>
            </div>

            {/* Policy consent */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={consentPolicy} onChange={e => setConsentPolicy(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#546E7A", flexShrink: 0 }} />
                <span>I have read and understood the <button onClick={() => setShowPolicyModal(true)}
                  style={{ background: "none", border: "none", color: "#2196F3", fontWeight: 600, cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" }}>
                  Cancellation Policy
                </button> and accept the terms.</span>
              </label>
              <label style={{ display: "flex", gap: 12, alignItems: "flex-start", cursor: "pointer", fontSize: 13 }}>
                <input type="checkbox" checked={consentCalc} onChange={e => setConsentCalc(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 1, cursor: "pointer", accentColor: "#546E7A", flexShrink: 0 }} />
                <span>I confirm the above calculation is correct and agree to proceed accordingly.</span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={() => setStep(2)} style={S.back}>← Back</button>
            </div>

            {/* Accept / Decline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 20 }}>
              <div style={{ border: "2px solid #E3EEF7", borderRadius: 14, padding: "20px", textAlign: "center", background: "#F8FBFF" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Accept & Proceed</div>
                <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 14, lineHeight: 1.5 }}>
                  {calc.zone === "none"
                    ? "Accept the no-refund outcome and close the subscription."
                    : `Accept the refund of ${INR(calc.refund)} and proceed with cancellation.`}
                  <br />Sent to <strong>TSM</strong> for refund processing.
                </div>
                <button
                  onClick={handleAccept}
                  disabled={!consentPolicy || !consentCalc || isSubmitting}
                  style={{ ...S.btn(consentPolicy && consentCalc && !isSubmitting, "#00C853"), width: "100%", padding: "12px" }}>
                  {isSubmitting ? "Submitting…" : "✅ Accept"}
                </button>
                {(!consentPolicy || !consentCalc) && (
                  <p style={{ fontSize: 11, color: "#F59E0B", marginTop: 6 }}>Please accept both checkboxes above first.</p>
                )}
              </div>

              <div style={{ border: "2px solid #FECACA", borderRadius: 14, padding: "20px", textAlign: "center", background: "#FFF5F5" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💬</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Decline & Discuss</div>
                <div style={{ fontSize: 12, color: "#4A5568", marginBottom: 14, lineHeight: 1.5 }}>
                  Not satisfied with the calculation? A <strong>Customer Care Executive</strong> will call you within 4 hours to discuss and resolve.
                </div>
                <button
                  onClick={handleDecline}
                  disabled={isSubmitting}
                  style={{ ...S.btn(!isSubmitting, "#EF4444"), width: "100%", padding: "12px" }}>
                  {isSubmitting ? "Submitting…" : "❌ Decline — Escalate to CCE"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ STEP 4: CONFIRMATION ══════════════════════════════════════════ */}
        {step === 4 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>{outcome === "accepted" ? "✅" : "📞"}</div>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8 }}>
              {outcome === "accepted" ? "Cancellation Submitted" : "Escalated to Customer Care"}
            </h2>
            <p style={{ color: "#4A5568", fontSize: 14, marginBottom: 4 }}>
              Reference: <strong style={{ color: "#1565C0", fontFamily: "monospace" }}>{refId}</strong>
            </p>

            {outcome === "accepted" && calc && found ? (
              <>
                <div style={{ background: "#E8F5E9", border: "1px solid #A5D6A7", borderRadius: 14, padding: "20px 24px", maxWidth: 480, margin: "20px auto 24px", textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#1B5E20", marginBottom: 12, fontSize: 14 }}>📋 What happens next:</div>
                  {[
                    "Your request is queued for TSM (Territory Sales Manager) review",
                    "TSM will verify subscription and approve refund within 1 business day",
                    "Finance / Accounts will process the refund",
                    calc.refund > 0
                      ? `₹${calc.refund.toLocaleString("en-IN")} will be credited to your original payment source`
                      : "Subscription will be marked closed (no refund — ≥70% term elapsed)",
                    "Confirmation SMS/WhatsApp sent when refund is processed",
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: "#2E7D32" }}>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}
                    </div>
                  ))}
                </div>
                <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${encodeURIComponent("Cancellation Reference: " + refId + "\nSubscription: " + found.subscriptionId + "\nI have accepted the cancellation terms. Please process my refund of " + INR(calc.refund) + ".")}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", padding: "12px 24px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
                  💬 Send Reference on WhatsApp
                </a>
              </>
            ) : (
              <>
                <div style={{ background: "#FFF3E0", border: "1px solid #FFB74D", borderRadius: 14, padding: "20px 24px", maxWidth: 480, margin: "20px auto 24px", textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#E65100", marginBottom: 12, fontSize: 14 }}>📞 What happens next:</div>
                  {[
                    "Your case is escalated to a Customer Care Executive (CCE)",
                    "A CCE will call you within 4 working hours on " + custMobile,
                    "They will review your case and offer a resolution",
                    "If resolved, the refund will be processed per final agreed amount",
                    "If unresolved, it will be escalated to the Operations Manager",
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, fontSize: 13, color: "#E65100" }}>
                      <span style={{ fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>{s}
                    </div>
                  ))}
                </div>
                <a href={`https://wa.me/${cfg.brand.whatsappNumber}?text=${encodeURIComponent("Cancellation Reference: " + refId + ". I have declined the refund calculation and would like to discuss. Please have a CCE call me.")}`}
                  target="_blank" rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#25D366", color: "#fff", padding: "12px 24px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", marginBottom: 12 }}>
                  💬 Chat on WhatsApp
                </a>
              </>
            )}

            <div style={{ marginTop: 8 }}>
              <button onClick={() => window.print()}
                style={{ padding: "10px 20px", background: "#F3F4F6", color: "#374151", border: "1.5px solid #E5E7EB", borderRadius: 50, fontWeight: 600, fontSize: 13, cursor: "pointer", marginRight: 10 }}>
                🖨️ Print / Save PDF
              </button>
              <a href="/buy" style={{ fontSize: 13, color: "#546E7A", fontWeight: 600, textDecoration: "underline" }}>Back to Home</a>
            </div>
          </div>
        )}

        {/* Policy Modal */}
        {showPolicyModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowPolicyModal(false)}>
            <div style={{ background: "#fff", borderRadius: 18, maxWidth: 560, width: "100%", maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ fontSize: 16 }}>🚫 Cancellation Policy — 24/9 Carwashing</strong>
                <button onClick={() => setShowPolicyModal(false)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#6B7280" }}>✕</button>
              </div>
              <div style={{ padding: "18px 22px", overflowY: "auto", fontSize: 13, lineHeight: 1.8, color: "#374151" }}>
                <p style={{ fontSize: 11, color: "#9CA3AF" }}>Effective Date: 1 June 2025 · 24/9 Carwashing Pvt. Ltd.</p>
                <p><strong>1. How to Request</strong><br />Written request via email support@249carwashing.com or in person. Include name, subscription/invoice, vehicle reg, and reason. WhatsApp to field staff is NOT valid.</p>
                <p><strong>2. Fee Schedule</strong></p>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 12 }}>
                  <thead><tr style={{ background: "#F9FAFB" }}><th style={{ padding: "6px 8px", textAlign: "left", borderBottom: "1px solid #E5E7EB" }}>Window</th><th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E7EB" }}>Fee</th><th style={{ padding: "6px 8px", borderBottom: "1px solid #E5E7EB" }}>Refund</th></tr></thead>
                  <tbody>
                    <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6" }}>Before service ({">"} 5 days)</td><td style={{ padding: "6px 8px", textAlign: "center" }}>Nil</td><td style={{ padding: "6px 8px" }}>Full less gateway (max 2%)</td></tr>
                    <tr><td style={{ padding: "6px 8px", borderBottom: "1px solid #F3F4F6" }}>Day 1 – 70% of term</td><td style={{ padding: "6px 8px", textAlign: "center" }}>Prorata + 10%</td><td style={{ padding: "6px 8px" }}>Balance after deductions</td></tr>
                    <tr style={{ background: "#FEF2F2" }}><td style={{ padding: "6px 8px", fontWeight: 700 }}>After 70% elapsed</td><td style={{ padding: "6px 8px", color: "#DC2626", fontWeight: 700, textAlign: "center" }}>100% forfeited</td><td style={{ padding: "6px 8px", color: "#DC2626", fontWeight: 700 }}>No refund</td></tr>
                  </tbody>
                </table>
                <p><strong>Example:</strong> ₹3,000 package / 30 days. Cancel at Day 12 (40%). Prorata ₹1,200 + Fee ₹300 + Gateway ₹60 = Refund ₹1,440.</p>
                <p><strong>3. No Pause Rule</strong><br />Customer travel, vehicle unavailability, or choice not to use service does not qualify for fee waiver or term extension.</p>
                <p><strong>4. Non-Transferability</strong><br />Subscriptions are not transferable to another person or vehicle.</p>
                <p><strong>Contact:</strong> support@249carwashing.com · 080 4879 4545 (Mon–Sat 10am–7pm)</p>
              </div>
              <div style={{ padding: "14px 22px", borderTop: "1px solid #E5E7EB", display: "flex", gap: 10 }}>
                <button onClick={() => { setConsentPolicy(true); setShowPolicyModal(false); }}
                  style={{ flex: 1, padding: "11px", background: "#546E7A", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                  ✓ I Understand & Accept
                </button>
                <button onClick={() => setShowPolicyModal(false)}
                  style={{ padding: "11px 18px", background: "#F3F4F6", color: "#374151", border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ background: "#37474F", padding: "12px 28px", display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        {["📧 support@249carwashing.com", "📞 080 4879 4545", "Mon–Sat · 10am–7pm"].map((t, i) => (
          <span key={i} style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{t}</span>
        ))}
      </div>
    </div>
  );
}
