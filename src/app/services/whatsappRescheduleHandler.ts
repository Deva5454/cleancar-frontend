/**
 * whatsappRescheduleHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles incoming WhatsApp replies from customers requesting reschedule.
 *
 * In production: Interakt/Wati webhook calls POST /api/whatsapp/webhook
 *   with the customer's reply text.
 *
 * Currently: simulated as a client-side handler that processes
 *   the intent (RESCHEDULE / CANCEL) and creates a reschedule record.
 *
 * Trigger words recognised (case-insensitive):
 *   RESCHEDULE, CHANGE, POSTPONE, SHIFT, DELAY — intent: reschedule
 *   CANCEL, STOP, NO                           — intent: cancel
 *
 * Reschedule flow:
 *   1. Customer replies "RESCHEDULE" to booking confirmation WA
 *   2. System finds their active upcoming job
 *   3. Creates a RescheduleRequest record in DataService
 *   4. Notifies Supervisor + TSM: "Customer requested reschedule — action needed"
 *   5. Customer receives: "Got it! Our team will contact you within 1 hr to confirm your new slot"
 *   6. Supervisor assigns new slot → marks reschedule as resolved
 *
 * IVR reschedule: same RescheduleRequest record created via the IVR API.
 * Parameters already set by Admin in the IVR system.
 */

import { DataService } from "./DataService";
import { railwaySync } from "./railwaySyncService";

export interface RescheduleRequest {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  jobId?: string;
  subscriptionId?: string;
  source: "WHATSAPP_REPLY" | "IVR" | "APP";
  requestedAt: string;    // ISO
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  resolvedAt?: string;
  resolvedBy?: string;    // supervisorId who assigned new slot
  newDate?: string;
  newSlot?: string;
  notes?: string;
  rescheduleCount?: number; // total reschedules for this subscription (max 3)
}

const KEY = "RESCHEDULE_REQUESTS";

function readRequests(): RescheduleRequest[] {
  return DataService.get<RescheduleRequest>(KEY) || [];
}
function writeRequests(r: RescheduleRequest[]): void {
  DataService.setAll(KEY, r);
}
function genId() { return "RSC-" + Date.now().toString(36).toUpperCase(); }

export const RESCHEDULE_TRIGGERS = ["RESCHEDULE","CHANGE","POSTPONE","SHIFT","DELAY","REBOOK"];
export const CANCEL_TRIGGERS     = ["CANCEL","STOP","NO"];

/**
 * Process incoming WhatsApp message from a customer.
 * Called by webhook handler or IVR bridge.
 */
export function processIncomingMessage(
  phone: string,
  messageText: string,
  source: RescheduleRequest["source"] = "WHATSAPP_REPLY"
): { intent: "reschedule" | "cancel" | "unknown"; replyText: string } {
  const text = messageText.trim().toUpperCase();

  if (RESCHEDULE_TRIGGERS.some(t => text.includes(t))) {
    createRescheduleRequest(phone, source);
    return {
      intent: "reschedule",
      replyText:
        "Got it! ✅ Your reschedule request has been received.\n" +
        "Our team will contact you within 1 hour to confirm your new slot.\n" +
        "If urgent, call: 91-XXXXXXXXXX",
    };
  }

  if (CANCEL_TRIGGERS.some(t => text.includes(t))) {
    return {
      intent: "cancel",
      replyText:
        "To cancel your booking, please call us at 91-XXXXXXXXXX or\n" +
        "reply with your booking ID and CANCEL to confirm.\n" +
        "Cancellations within 2 hours of the slot may not be refunded.",
    };
  }

  return {
    intent: "unknown",
    replyText:
      "Hi! To reschedule your wash, reply RESCHEDULE.\n" +
      "To cancel, reply CANCEL.\n" +
      "For other queries, call: 91-XXXXXXXXXX",
  };
}

function isWithinRescheduleWindow(jobId?: string): boolean {
  if (!jobId) return true;
  try {
    const jobs = DataService.get<any>("JOBS");
    const job = jobs.find((j: any) => j.jobId === jobId);
    if (!job?.scheduledDate || !job?.timeSlot) return true;
    const slotTime = new Date(`${job.scheduledDate}T${job.timeSlot}`);
    const cutoff = new Date(slotTime.getTime() - 3 * 60 * 60 * 1000); // 3 hrs before
    return new Date() < cutoff;
  } catch { return true; }
}

const MAX_RESCHEDULES_PER_BOOKING = 3;

function createRescheduleRequest(phone: string, source: RescheduleRequest["source"]): void {
  // Find customer by phone
  const customers = DataService.get<any>("CUSTOMERS") || [];
  const customer = customers.find((c: any) =>
    (c.phone || c.mobile || "").replace(/\D/g, "").slice(-10) === phone.replace(/\D/g, "").slice(-10)
  );

  // Check max reschedules (limit: 3 per customer per active subscription)
  const existing = readRequests();
  const recentCount = existing.filter(r =>
    r.customerPhone.replace(/\D/g, "").slice(-10) === phone.replace(/\D/g, "").slice(-10) &&
    r.status !== "CANCELLED" &&
    r.status !== "RESOLVED" &&
    new Date(r.requestedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;

  if (recentCount >= MAX_RESCHEDULES_PER_BOOKING) {
    // Notify but don't create — customer hit limit
    window.dispatchEvent(new CustomEvent("cc360:reschedule_limit_reached", {
      detail: { phone, limit: MAX_RESCHEDULES_PER_BOOKING }
    }));
    return;
  }

  const req: RescheduleRequest = {
    id: genId(),
    customerId: customer?.customerId || "UNKNOWN",
    customerName: customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "Unknown",
    customerPhone: phone,
    source,
    requestedAt: new Date().toISOString(),
    status: "PENDING",
  };

  const requests = readRequests();
  requests.push(req);
  writeRequests(requests);
  railwaySync.reschedule(req); // non-blocking background sync to Railway

  // Fire DOM event for real-time UI update
  window.dispatchEvent(new CustomEvent("cc360:reschedule_requested", { detail: req }));
}

export const rescheduleService = {
  getPendingRequests(): RescheduleRequest[] {
    return readRequests().filter(r => r.status === "PENDING");
  },

  getAllRequests(): RescheduleRequest[] {
    return readRequests();
  },

  resolveRequest(id: string, supervisorId: string, newDate: string, newSlot: string): void {
    const reqs = readRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx < 0) return;

    // Count total reschedules for this subscription
    const subId = reqs[idx].subscriptionId;
    const totalReschedules = reqs.filter(r =>
      r.subscriptionId === subId && r.status === "CONFIRMED"
    ).length + 1; // +1 for this one being confirmed now

    reqs[idx] = {
      ...reqs[idx],
      status: "CONFIRMED",
      resolvedAt: new Date().toISOString(),
      resolvedBy: supervisorId,
      newDate,
      newSlot,
      rescheduleCount: totalReschedules,
    };
    writeRequests(reqs);
    window.dispatchEvent(new CustomEvent("cc360:reschedule_resolved", { detail: { id, newDate, newSlot } }));

    // WA: Reschedule confirmed to customer
    const req = reqs[idx];
    if (req.customerPhone) {
      import("./whatsappService").then(({ sendRescheduleConfirmed, sendRescheduleLimitReached }) => {
        sendRescheduleConfirmed(req.customerPhone, req.customerName || "Customer", newDate, newSlot, totalReschedules).catch(()=>{});
        // If this was the 3rd reschedule, also send the limit-reached warning
        if (totalReschedules >= 3) {
          setTimeout(() => {
            sendRescheduleLimitReached(req.customerPhone, req.customerName || "Customer", "your pack").catch(()=>{});
          }, 2000);
        }
      }).catch(()=>{});
    }
  },

  getPendingCount(): number {
    return readRequests().filter(r => r.status === "PENDING").length;
  },
};

/**
 * Check all active pack subscriptions and fire PACK_EXPIRY_WARNING
 * when expiry is within 7 days. Call daily (e.g. on app load or midnight cron).
 */
export function checkPackExpiries(): void {
  try {
    const subs = DataService.get<any>("SUBSCRIPTIONS");
    const now = new Date();

    subs.forEach((sub: any) => {
      if (!sub.visitsExpiry || sub.status === "Exhausted" || sub.status === "Cancelled") return;
      const expiry = new Date(sub.visitsExpiry);
      if (expiry <= now) return;

      const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
      // Fire reminders at 7, 3, and 1 day remaining
      if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
        const detail = {
          subscriptionId: sub.subscriptionId,
          customerId: sub.customerId,
          packageName: sub.packageName,
          visitsRemaining: (sub.visitsTotal || 0) - (sub.visitsUsed || 0),
          expiryDate: sub.visitsExpiry,
          daysLeft,
          reminderType: daysLeft === 7 ? "FIRST_WARNING" : daysLeft === 3 ? "SECOND_WARNING" : "LAST_DAY",
        };
        window.dispatchEvent(new CustomEvent("cc360:pack_expiry_warning", { detail }));
        // Store for TSM follow-up
        try {
          const reminders = DataService.get<any>("PACK_EXPIRY_REMINDERS") || [];
          const key = `${sub.subscriptionId}-day${daysLeft}`;
          if (!reminders.find((r: any) => r.key === key)) {
            reminders.push({ key, subscriptionId: sub.subscriptionId, customerId: sub.customerId, daysLeft, sentAt: now.toISOString() });
            DataService.setAll("PACK_EXPIRY_REMINDERS", reminders);
          }
        } catch {}
      }
    });
  } catch {}
}

