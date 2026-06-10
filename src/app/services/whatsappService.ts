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
  templateName: string = "booking_confirmation"
): Promise<WAResult> {
  const apiKey = import.meta.env.VITE_INTERAKT_API_KEY;
  const mobile = phone.replace(/\D/g, "").slice(-10);

  // No API key → fall back to wa.me tab-open (current behaviour, zero disruption)
  if (!apiKey || !mobile) {
    if (mobile) {
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
To reschedule, reply RESCHEDULE or call our IVR. — 249 Carwashing`;
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
    `Your 249 Carwashing washer has arrived! 🚿

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
    `✅ Your 249 Carwashing service is complete!

` +
    `🚗 *${params.planLabel}* — done!
` +
    `${visitInfo}` +
    `${rescheduleInfo}` +
    `${ratingLine}

` +
    `Thank you for choosing 249 Carwashing! 🙏`;
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
    `You've had *${params.washCount} wash(es)* this week from 249 Carwashing.

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


