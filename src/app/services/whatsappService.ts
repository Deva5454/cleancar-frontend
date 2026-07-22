/**
 * whatsappService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Outbound WhatsApp API dispatcher.
 * Provider: Interakt (recommended for India D2C)
 * Fallback: opens wa.me tab if VITE_INTERAKT_API_KEY is not set.
 *
 * Usage:
 *   sendWhatsApp("+919876543210", "Your wash is confirmed!", "booking_confirmation");
 *
 * Environment variable:
 *   VITE_INTERAKT_API_KEY = base64 API key from Interakt dashboard
 *
 * Template names registered in Meta Business Manager:
 *   booking_confirmation  — sent to customer after supervisor+washer accept
 *   booking_pending       — sent to customer immediately after payment
 *   team_booking_alert    — sent to supervisor/TSM/admin on new booking
 *   pack_visit_reminder   — sent to customer when 1 pack visit remains
 *   subscription_renewal  — sent to customer before monthly renewal
 *   sla_breach_internal   — sent to TSM/admin when TAT is breached
 */

const INTERAKT_API = "https://api.interakt.ai/v1/public/message/";

export interface WAResult {
  sent: boolean;
  provider: "api" | "link_fallback";
  error?: string;
}

/**
 * Send a WhatsApp message to a recipient.
 *
 * @param phone        - Indian mobile number (any format, last 10 digits used)
 * @param message      - Plain text body (inserted as {{1}} in the template)
 * @param templateName - Meta-approved template name (default: "booking_confirmation")
 */
export async function sendWhatsApp(
  phone: string,
  message: string,
  templateName: string = "booking_confirmation",
  opts?: { background?: boolean }  // background=true suppresses browser tab fallback
): Promise<WAResult> {
  const apiKey = import.meta.env.VITE_INTERAKT_API_KEY;
  const mobile = phone.replace(/\D/g, "").slice(-10);

  // No API key → fall back to wa.me tab-open ONLY for user-initiated calls
  // Background/scheduled calls log to console instead of opening browser tabs
  if (!apiKey || !mobile) {
    if (mobile && !opts?.background && !(window as any).__cc360_background_run) {
      window.open(
        `https://wa.me/91${mobile}?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
    return { sent: true, provider: "link_fallback" };
  }

  try {
    const res = await fetch(INTERAKT_API, {
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        countryCode: "+91",
        phoneNumber: mobile,
        callbackData: `cleancar_${templateName}`,
        type: "Template",
        template: {
          name: templateName,
          languageCode: "en",
          bodyValues: [message],
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => `HTTP ${res.status}`);
      console.warn("[WhatsApp] Interakt error:", err);
      // Graceful fallback — never block the booking flow
      return { sent: false, provider: "api", error: err };
    }

    return { sent: true, provider: "api" };
  } catch (err: any) {
    console.warn("[WhatsApp] API unreachable:", err.message);
    return { sent: false, provider: "api", error: err.message };
  }
}

/**
 * Send the pending confirmation immediately after payment.
 * Full confirmation is sent separately after supervisor+washer accept.
 */
export async function sendBookingPending(
  phone: string,
  customerName: string,
  serviceName: string
): Promise<WAResult> {
  const message =
    `Hi ${customerName}! Your booking for ${serviceName} has been received. ` +
    `We are confirming your washer — full details follow once accepted. ` +
    `To reschedule any wash, reply RESCHEDULE or call our IVR.`;
  return sendWhatsApp(phone, message, "booking_pending");
}

/**
 * Send full confirmation after supervisor and washer both accept.
 */
export async function sendBookingConfirmed(
  phone: string,
  customerName: string,
  serviceName: string,
  slotLabel: string,
  supervisorName?: string,
  supervisorPhone?: string,
  trackingUrl?: string
): Promise<WAResult> {
  const message =
    `Hi ${customerName}! Your ${serviceName} is confirmed. ✅` +
    `
Slot: ${slotLabel}.` +
    (supervisorName ? `
Supervisor: ${supervisorName}` : "") +
    (supervisorPhone ? ` | Contact: ${supervisorPhone}` : "") +
    (trackingUrl ? `
📍 Track your washer: ${trackingUrl}` : "") +
    `
To reschedule, reply RESCHEDULE or call our IVR. — 24/9 Carwashing`;
  return sendWhatsApp(phone, message, "booking_confirmation");
}

/**
 * Send team alert to supervisor/TSM/admin on new booking.
 */
export async function sendTeamAlert(
  phone: string,
  alertText: string
): Promise<WAResult> {
  return sendWhatsApp(phone, alertText, "team_booking_alert");
}

/**
 * Send pack visit low warning to customer.
 */
export async function sendPackVisitLow(
  phone: string,
  customerName: string,
  packageName: string,
  remaining: number,
  expiry?: string
): Promise<WAResult> {
  const message =
    `Hi ${customerName}! You have ${remaining} wash${remaining > 1 ? "es" : ""} remaining in your ${packageName}.` +
    (expiry ? ` Valid until ${expiry}.` : "") +
    ` To book your next wash or upgrade to monthly, reply or call us.`;
  return sendWhatsApp(phone, message, "pack_visit_reminder");
}
/**
 * Fix 3: WA when washer arrives (check-in at customer location)
 */
export async function sendWasherArrived(params: {
  customerPhone: string;
  customerName: string;
  washerName: string;
  supervisorName: string;
  supervisorPhone: string;
  trackingUrl: string;
  planLabel: string;
}): Promise<void> {
  const message =
    `👋 Hi ${params.customerName}!

` +
    `Your 24/9 Carwashing washer has arrived! 🚿

` +
    `🔧 Service: *${params.planLabel}*
` +
    `👷 Washer: *${params.washerName}*
` +
    `📍 Supervisor: *${params.supervisorName}* | *${params.supervisorPhone}*

` +
    `Track your washer live: ${params.trackingUrl}

` +
    `Questions? Call/WhatsApp: *+91-08048794545*`;
  await sendWhatsApp(params.customerPhone, message);
}

/**
 * Fix 4: WA when wash is completed + rating request
 */
export async function sendWashCompleted(params: {
  customerPhone: string;
  customerName: string;
  planLabel: string;
  serviceType: "ONE_TIME" | "PACK" | "SUBSCRIPTION";
  visitsRemaining?: number;
  ratingUrl?: string;
}): Promise<void> {
  const visitInfo = params.serviceType === "PACK" && params.visitsRemaining !== undefined
    ? `
📊 Pack balance: *${params.visitsRemaining} wash(es) remaining*`
    : "";

  const ratingLine = params.ratingUrl
    ? `
⭐ Rate your wash: ${params.ratingUrl}`
    : `
⭐ How was your wash? Reply 1-5 (1=Poor, 5=Excellent)`;

  const rescheduleInfo = params.serviceType !== "ONE_TIME"
    ? `
To book your next wash, call *080 48 79 45 45* or reply RESCHEDULE.`
    : "";

  const message =
    `✅ Your 24/9 Carwashing service is complete!

` +
    `🚗 *${params.planLabel}* — done!
` +
    `${visitInfo}` +
    `${rescheduleInfo}` +
    `${ratingLine}

` +
    `Thank you for choosing 24/9 Carwashing! 🙏`;
  await sendWhatsApp(params.customerPhone, message);
}

/**
 * Fix 5a: Rating request for Pack/One-Time (sent at end of each wash)
 */
export async function sendRatingRequest(params: {
  customerPhone: string;
  customerName: string;
  jobId: string;
  planLabel: string;
}): Promise<void> {
  const message =
    `⭐ How was your wash today?

` +
    `Reply with a number:
` +
    `*5* — Excellent 🌟
` +
    `*4* — Good 👍
` +
    `*3* — Average 😐
` +
    `*2* — Poor 👎
` +
    `*1* — Very Poor 😞

` +
    `Your feedback helps us serve you better!
` +
    `Job ref: ${params.jobId}`;
  await sendWhatsApp(params.customerPhone, message);
}

/**
 * Fix 6: Before/After photos sent to customer on job completion.
 *
 * IMPORTANT — interim implementation note:
 * Photos are currently captured and stored as local base64 data URLs
 * (washerDataService.JobPhoto.url) — there is no cloud upload pipeline yet.
 * A real WhatsApp Business "media" template requires either a public HTTPS
 * image URL or a pre-uploaded Meta media ID, neither of which a base64
 * string satisfies. Until cloud storage (S3/Cloudinary/similar) is wired up:
 *   - With an Interakt API key configured: this call will currently FAIL
 *     to attach the photo (Interakt also requires a public URL), so it
 *     degrades to a text-only message describing that photos were taken.
 *   - Without an API key (current default state): falls back to a wa.me
 *     tab with text only — same degraded text-only behaviour.
 * Replace `beforePhotoUrl`/`afterPhotoUrl` with real uploaded URLs once
 * the upload pipeline exists, and this will start sending real images
 * with no other code changes needed here.
 */
export async function sendBeforeAfterPhotos(params: {
  customerPhone: string;
  customerName: string;
  planLabel: string;
  washerName: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
}): Promise<WAResult> {
  const hasRealUrls =
    !!params.beforePhotoUrl && !params.beforePhotoUrl.startsWith("data:") &&
    !!params.afterPhotoUrl && !params.afterPhotoUrl.startsWith("data:");

  const message =
    `Your wash is done — here's the before and after! ` +
    `${params.planLabel}. Washed by: ${params.washerName}. ` +
    (hasRealUrls
      ? `Before: ${params.beforePhotoUrl} After: ${params.afterPhotoUrl} `
      : `(Photos were taken during your wash — ask your washer or supervisor to share them if you'd like to see them now.) `) +
    `Loving the results? Reply with your rating (1-5) or book your next wash!`;

  return sendWhatsApp(params.customerPhone, message, "before_after_photos");
}
/**
 * Fix 5b: Weekly rating for monthly subscription (sent every Sunday at 11 AM)
 */
export async function sendWeeklyRatingRequest(params: {
  customerPhone: string;
  customerName: string;
  subscriptionId: string;
  washCount: number;
}): Promise<void> {
  const message =
    `⭐ Good morning ${params.customerName}!

` +
    `You've had *${params.washCount} wash(es)* this week from 24/9 Carwashing.

` +
    `How would you rate your experience?
` +
    `Reply: *5* Excellent | *4* Good | *3* Average | *2* Poor | *1* Very Poor

` +
    `Your feedback helps us improve! 🙏
` +
    `Questions? Call/WhatsApp: *+91-08048794545*`;
  await sendWhatsApp(params.customerPhone, message);
}
// ── Cancellation & Refund Notifications ─────────────────────────────────────

export function sendCancellationReceived(params: {
  customerPhone: string;
  customerName: string;
  refId: string;
  refundAmount: number;
  refundZone: "full" | "partial" | "none";
  packageName: string;
}) {
  const refundLine = params.refundZone === "none"
    ? "No refund applicable (service > 70% elapsed)"
    : `Estimated refund: ₹${params.refundAmount.toLocaleString("en-IN")}`;

  return sendWhatsApp(params.customerPhone, [
    `🔔 *Cancellation Request Received — 24/9 Carwashing*`,
    ``,
    `Hi ${params.customerName},`,
    `Your cancellation request has been received and is under review.`,
    ``,
    `*Reference:* ${params.refId}`,
    `*Service:* ${params.packageName}`,
    `*Status:* ${refundLine}`,
    ``,
    `Our TSM will review and process within 2–3 working days.`,
    `Queries: 080 48 79 45 45`,
  ].join("\n"));
}

export function sendRefundProcessed(params: {
  customerPhone: string;
  customerName: string;
  refId: string;
  refundAmount: number;
  bankRef: string;
  paymentMethod: string;
}) {
  return sendWhatsApp(params.customerPhone, [
    `✅ *Refund Processed — 24/9 Carwashing*`,
    ``,
    `Hi ${params.customerName},`,
    `Your refund of *₹${params.refundAmount.toLocaleString("en-IN")}* has been processed.`,
    ``,
    `*Cancellation Ref:* ${params.refId}`,
    `*Bank Reference:* ${params.bankRef}`,
    `*Method:* ${params.paymentMethod}`,
    ``,
    `Please allow 5–7 working days for the amount to reflect.`,
    `Queries: 080 48 79 45 45`,
  ].join("\n"));
}

export function sendCancellationRejected(params: {
  customerPhone: string;
  customerName: string;
  refId: string;
  reason: string;
}) {
  return sendWhatsApp(params.customerPhone, [
    `ℹ️ *Cancellation Update — 24/9 Carwashing*`,
    ``,
    `Hi ${params.customerName},`,
    `Regarding your cancellation request *${params.refId}*:`,
    ``,
    `*Decision:* Not processed`,
    `*Reason:* ${params.reason}`,
    ``,
    `For queries, call us at *080 48 79 45 45* or WhatsApp this number.`,
    `We'd love to resolve any concerns you have.`,
  ].join("\n"));
}

// ── Pack Expiry Reminders ─────────────────────────────────────────────────────

export async function sendPackExpiry7Days(
  phone: string,
  customerName: string,
  packageName: string,
  expiryDate: string,
  visitsRemaining: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName}! ⏰`,
    ``,
    `Your *${packageName}* expires in *7 days* (on ${expiryDate}).`,
    `You have *${visitsRemaining} wash${visitsRemaining !== 1 ? "es" : ""}* remaining.`,
    ``,
    `📲 Reply WASH to book your next slot or call *080 48 79 45 45*.`,
    ``,
    `Unused visits lapse after expiry and are not refundable.`,
    `— 24/9 Carwashing`,
  ].join("\n"));
}

export async function sendPackExpiry3Days(
  phone: string,
  customerName: string,
  packageName: string,
  expiryDate: string,
  visitsRemaining: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName}! ⚠️ Reminder`,
    ``,
    `Your *${packageName}* expires in *3 days* (on ${expiryDate}).`,
    `You have *${visitsRemaining} wash${visitsRemaining !== 1 ? "es" : ""}* remaining.`,
    ``,
    `📲 Reply WASH to book now or call *080 48 79 45 45*.`,
    ``,
    `Don't let your washes lapse!`,
    `— 24/9 Carwashing`,
  ].join("\n"));
}

export async function sendPackExpiryLastDay(
  phone: string,
  customerName: string,
  packageName: string,
  visitsRemaining: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName}! 🚨 Last Day`,
    ``,
    `Your *${packageName}* expires *TODAY*.`,
    `You have *${visitsRemaining} wash${visitsRemaining !== 1 ? "es" : ""}* remaining.`,
    ``,
    `📲 Reply WASH urgently to book or call *080 48 79 45 45*.`,
    ``,
    `After today, unused visits cannot be used or refunded.`,
    `— 24/9 Carwashing`,
  ].join("\n"));
}

/**
 * Real plan/pack purchase confirmation - previously the only message a
 * customer got at purchase was a payment invoice, with no summary of
 * the actual plan: start date, end date, and how many washes it covers.
 */
export async function sendPackPurchaseConfirmed(
  phone: string,
  customerName: string,
  packageName: string,
  startDate: string,
  endDate: string,
  totalVisits?: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName}! 🎉`,
    ``,
    `Your *${packageName}* is now active.`,
    `Valid: *${startDate}* to *${endDate}*.`,
    totalVisits ? `Includes *${totalVisits} wash${totalVisits !== 1 ? "es" : ""}*.` : ``,
    ``,
    `We'll remind you before it expires — no action needed right now.`,
    `Questions? Call *080 48 79 45 45*.`,
    `— 24/9 Carwashing`,
  ].filter(Boolean).join("\n"), "pack_purchase_confirmed", { background: true });
}

/**
 * Real expiry-lapse message - previously nothing was sent once the
 * expiry date actually passed with visits still remaining; the last
 * real message was the "expires today" warning, then silence.
 */
export async function sendPackExpiredLapse(
  phone: string,
  customerName: string,
  packageName: string,
  visitsForfeited: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName},`,
    ``,
    `Your *${packageName}* has expired.`,
    visitsForfeited > 0
      ? `*${visitsForfeited} unused wash${visitsForfeited !== 1 ? "es were" : " was"}* forfeited, as per the pack's validity terms.`
      : `All washes were used — thank you!`,
    ``,
    `Ready for another pack? Call *080 48 79 45 45* or reply RENEW.`,
    `— 24/9 Carwashing`,
  ].join("\n"), "pack_expired_lapse", { background: true });
}

// ── Reschedule Notifications ──────────────────────────────────────────────────

export async function sendRescheduleConfirmed(
  phone: string,
  customerName: string,
  newDate: string,
  newSlot: string,
  rescheduleCount: number
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName}! Your wash has been rescheduled. ✅`,
    ``,
    `📅 New date: *${newDate}*`,
    `🕐 Time slot: *${newSlot}*`,
    ``,
    rescheduleCount >= 2
      ? `⚠️ Note: You have used ${rescheduleCount} of 3 allowed reschedules for this booking.`
      : ``,
    `For queries call *080 48 79 45 45* (10:30 AM – 6:30 PM, Mon–Sat).`,
    `— 24/9 Carwashing`,
  ].filter(Boolean).join("\n"));
}

export async function sendRescheduleLimitReached(
  phone: string,
  customerName: string,
  packageName: string
): Promise<WAResult> {
  return sendWhatsApp(phone, [
    `Hi ${customerName},`,
    ``,
    `You have reached the maximum of *3 reschedules* for your *${packageName}* booking.`,
    ``,
    `To make any further changes, please call us directly:`,
    `📞 *080 48 79 45 45* (10:30 AM – 6:30 PM, Mon–Sat)`,
    ``,
    `— 24/9 Carwashing`,
  ].join("\n"));
}
