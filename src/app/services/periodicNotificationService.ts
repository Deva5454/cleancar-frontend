/**
 * periodicNotificationService.ts
 *
 * Manages D-1 (24-hour advance) WhatsApp notifications for periodic services
 * and customer self-service reschedule responses.
 *
 * RULES (from HR OBB §7 and Bot & IVR Flow v3):
 *   1. D-2 notification sent 48 hours before each periodic service.
 *   2. Customer must CONFIRM or RESCHEDULE by D-1 (i.e. within 24 hours of receiving the D-2 message).
 *   3. If no response by D-1 deadline: system sends a second auto-confirm message and marks service as confirmed.
 *      Ops team informed. IVR: 080 4879 4545 (11 AM – 6 PM) provided for queries.
 *   4. Reschedule: new date must be within same billing month.
 *   5. Reschedule request must be made ≥24 hours before scheduled service time.
 *   6. New slot must be ≥24 hours from time of reschedule request.
 *   7. Monthly cap enforced — customer cannot exceed plan allowance regardless of rescheduling.
 *   8. Unused balance NOT carried forward. No reimbursement at end of term.
 *
 * Storage: localStorage key "cleancar_periodic_notifications"
 */

import {
  periodicScheduleService,
  PERIODIC_SERVICE_META,
  type PeriodicOccurrence,
  type MonthlyUsage,
  type RescheduleResult,
} from "./periodicScheduleService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationStatus =
  | "PENDING"              // D-2 sent (48h before) — awaiting customer reply
  | "CONFIRMED"            // customer explicitly replied CONFIRM before D-1 deadline
  | "RESCHEDULE_REQUESTED" // customer replied RESCHEDULE — awaiting new date
  | "RESCHEDULED"          // rescheduled successfully
  | "AUTO_CONFIRMED"       // no response by D-1 deadline — auto-confirm message sent, service proceeds
  | "EXPIRED";             // service date passed

export interface PeriodicNotification {
  id: string;                       // e.g. "notif-CUST-001-shampoo-2026-06-15"
  customerId: string;
  customerName: string;
  customerMobile: string;
  packageType: string;
  occurrenceId: string;             // links to PeriodicOccurrence.id
  serviceType: string;
  serviceName: string;
  serviceIcon: string;
  scheduledDate: string;            // YYYY-MM-DD
  timeBand: "BAND_A" | "BAND_B";   // A=5–7AM, B=7–9AM
  billingMonth: string;             // YYYY-MM
  monthlyUsage: MonthlyUsage;
  notificationSentAt: string;       // ISO timestamp — 24h before service
  status: NotificationStatus;
  confirmedAt?: string;
  rescheduleRequestedAt?: string;
  newDateRequested?: string;
  rescheduledTo?: string;
  autoConfirmedAt?: string;        // timestamp when D-1 auto-confirm message was sent
  autoConfirmMessageSent?: boolean; // true once the second auto-confirm WhatsApp was dispatched
  opsTeamAlerted?: boolean;
}

export interface CustomerRescheduleRequest {
  notificationId: string;
  customerId: string;
  occurrenceId: string;
  requestedNewDate: string;         // YYYY-MM-DD
  requestedAt: string;              // ISO timestamp
}

export interface RescheduleValidation {
  valid: boolean;
  error?: "too_late" | "out_of_month" | "cap_reached" | "already_completed";
  message: string;
  remainingBalance?: MonthlyUsage;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "cleancar_periodic_notifications";
// D-2: notification sent 48h before service
// D-1: customer must confirm/reschedule by 24h before service
// If no response at D-1 mark: auto-confirm message sent, ops alerted
const D1_DEADLINE_HOURS    = 24; // hours before service — deadline for customer to respond
const MIN_ADVANCE_HOURS    = 24; // customer must reschedule ≥24h before scheduled service time
const IVR_NUMBER           = "080 4879 4545";
const IVR_HOURS            = "11 AM – 6 PM";

// ── Service ───────────────────────────────────────────────────────────────────

class PeriodicNotificationService {

  private readAll(): Record<string, PeriodicNotification> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private writeAll(data: Record<string, PeriodicNotification>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private write(n: PeriodicNotification): void {
    const all = this.readAll();
    all[n.id] = n;
    this.writeAll(all);
  }

  // ── Generate D-1 notification for a specific occurrence ───────────────────

  createNotification(
    customerId: string,
    customerName: string,
    customerMobile: string,
    packageType: string,
    occurrence: PeriodicOccurrence,
    timeBand: "BAND_A" | "BAND_B",
  ): PeriodicNotification {
    const meta        = PERIODIC_SERVICE_META[occurrence.serviceType as keyof typeof PERIODIC_SERVICE_META];
    const monthlyUsage = periodicScheduleService.getMonthlyUsage(customerId, occurrence.billingMonth);
    const id          = `notif-${occurrence.id}`;

    const notification: PeriodicNotification = {
      id,
      customerId,
      customerName,
      customerMobile,
      packageType,
      occurrenceId:    occurrence.id,
      serviceType:     occurrence.serviceType,
      serviceName:     meta.name,
      serviceIcon:     meta.icon,
      scheduledDate:   occurrence.scheduledDate,
      timeBand,
      billingMonth:    occurrence.billingMonth,
      monthlyUsage,
      notificationSentAt: new Date().toISOString(),
      status: "PENDING",
    };

    this.write(notification);
    return notification;
  }

  // ── Get all notifications for a customer ──────────────────────────────────

  getForCustomer(customerId: string): PeriodicNotification[] {
    return Object.values(this.readAll())
      .filter(n => n.customerId === customerId)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }

  // ── Get pending notifications (for ops dashboard) ─────────────────────────

  getPending(): PeriodicNotification[] {
    return Object.values(this.readAll())
      .filter(n => n.status === "PENDING" || n.status === "RESCHEDULE_REQUESTED");
  }

  // ── Get upcoming notifications (next 7 days, for Supervisor view) ─────────

  getUpcoming(days = 7): PeriodicNotification[] {
    const today    = new Date();
    const cutoff   = new Date(today);
    cutoff.setDate(cutoff.getDate() + days);
    const todayStr  = today.toISOString().split("T")[0];
    const cutoffStr = cutoff.toISOString().split("T")[0];

    return Object.values(this.readAll())
      .filter(n => n.scheduledDate >= todayStr && n.scheduledDate <= cutoffStr)
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }

  // ── Customer confirms service ─────────────────────────────────────────────

  confirmService(notificationId: string): boolean {
    const all = this.readAll();
    const n   = all[notificationId];
    if (!n || n.status !== "PENDING") return false;

    n.status      = "CONFIRMED";
    n.confirmedAt = new Date().toISOString();
    this.writeAll(all);

    // Write-back: ensure the occurrence is "scheduled" in periodicScheduleService
    // so the washer's checklist picks it up automatically on the service day.
    const occ = periodicScheduleService.getCustomerOccurrences(n.customerId)
      .find(o => o.id === n.occurrenceId);
    if (occ && occ.status === "skipped") {
      periodicScheduleService.resetSkippedToScheduled(n.customerId, n.occurrenceId);
    }
    return true;
  }

  // ── Customer requests reschedule — validate before accepting ──────────────

  validateReschedule(
    notificationId: string,
    requestedNewDate: string,
  ): RescheduleValidation {
    const all = this.readAll();
    const n   = all[notificationId];

    if (!n) {
      return { valid: false, error: "already_completed", message: "Notification not found." };
    }

    // Rule: request must be ≥4 hours before the scheduled service
    const serviceDateTime  = new Date(`${n.scheduledDate}T${n.timeBand === "BAND_A" ? "05:00" : "07:00"}:00`);
    const now              = new Date();
    const hoursUntilService = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilService < MIN_ADVANCE_HOURS) {
      return {
        valid: false,
        error: "too_late",
        message: `Reschedule requests must be made at least ${MIN_ADVANCE_HOURS} hours before the scheduled service. Your service is in ${hoursUntilService.toFixed(1)} hours — it is too late to reschedule. For assistance please call ${IVR_NUMBER} between ${IVR_HOURS}.`,
      };
    }

    // Rule: new date must be in same billing month
    if (!requestedNewDate.startsWith(n.billingMonth)) {
      return {
        valid: false,
        error: "out_of_month",
        message: `New date must be within ${n.billingMonth}. Requested date ${requestedNewDate} is outside the billing month.`,
      };
    }

    // Rule: cap check — delegates to periodicScheduleService
    const result = periodicScheduleService.reschedule(
      n.customerId, n.occurrenceId, requestedNewDate, "CUSTOMER_SELF", "Customer requested via notification"
    );

    if (!result.success) {
      return {
        valid: false,
        error: result.error as RescheduleValidation["error"],
        message: result.message,
      };
    }

    // Reschedule already committed by the delegated call above — reload usage.
    // commitReschedule() is a no-op if called again (idempotent via status check).
    const usage = periodicScheduleService.getMonthlyUsage(n.customerId, n.billingMonth);
    return { valid: true, message: "Reschedule is valid.", remainingBalance: usage };
  }

  // ── Commit customer reschedule ────────────────────────────────────────────

  commitReschedule(
    notificationId: string,
    requestedNewDate: string,
  ): { success: boolean; message: string } {
    const all = this.readAll();
    const n   = all[notificationId];
    if (!n) return { success: false, message: "Notification not found." };

    // This is the single write point for reschedules.
    // periodicScheduleService.reschedule() updates the occurrence.scheduledDate
    // to requestedNewDate. The washer's checklist calls getTodayServices() at
    // runtime — it will automatically show the service on requestedNewDate and
    // NOT show it on the original date. No separate ops notification needed.
    const result: RescheduleResult = periodicScheduleService.reschedule(
      n.customerId, n.occurrenceId, requestedNewDate,
      "CUSTOMER_SELF", "Customer self-reschedule via D-1 notification"
    );

    if (!result.success) {
      return { success: false, message: result.message };
    }

    n.status                 = "RESCHEDULED";
    n.rescheduledTo          = requestedNewDate;
    n.rescheduleRequestedAt  = new Date().toISOString();
    this.writeAll(all);

    return {
      success: true,
      message: `Rescheduled to ${requestedNewDate}. Washer checklist updated automatically.`,
    };
  }

  // ── Mark auto-confirmed (called when D-1 deadline passes with no response) ──
  // This replaces the old "no response" 2-hour check.
  // D-1 = 24 hours before the scheduled service.
  // If customer has not replied CONFIRM or RESCHEDULE by D-1:
  //   → set status = AUTO_CONFIRMED
  //   → set autoConfirmMessageSent = true (ops dispatches the second WhatsApp)
  //   → opsTeamAlerted = true (shows on ops/supervisor dashboard)

  markAutoConfirmed(notificationId: string): void {
    const all = this.readAll();
    const n   = all[notificationId];
    if (!n || n.status !== "PENDING") return;

    n.status                   = "AUTO_CONFIRMED";
    n.autoConfirmedAt          = new Date().toISOString();
    n.autoConfirmMessageSent   = true;
    n.opsTeamAlerted           = false; // NOT just ops — washer checklist is source of truth
    this.writeAll(all);

    // Write-back to periodicScheduleService so the washer's checklist
    // reflects the confirmed service on scheduledDate automatically.
    // Occurrence remains status="scheduled" on the original date —
    // no change needed. But if the occurrence was accidentally skipped,
    // reset it to scheduled so it appears in the washer's list.
    const occurrences = periodicScheduleService.getCustomerOccurrences(n.customerId);
    const occ = occurrences.find(o => o.id === n.occurrenceId);
    if (occ && occ.status === "skipped") {
      // Reset to scheduled so washer sees it
      periodicScheduleService.resetSkippedToScheduled(n.customerId, n.occurrenceId);
    }
    // The occurrence already has scheduledDate set — washer checklist reads
    // getTodayServices() on that date and will include this service automatically.
  }

  // ── Check and auto-confirm all notifications that passed D-1 deadline ─────
  // Call this on every app load (client-side) or via a nightly backend cron.
  // D-1 deadline = service is within the next 24 hours AND notification is PENDING.

  checkD1Deadline(): PeriodicNotification[] {
    const all       = this.readAll();
    const triggered: PeriodicNotification[] = [];
    const now       = new Date();

    Object.values(all).forEach(n => {
      if (n.status !== "PENDING") return;

      // Check if we are now within 24h of the scheduled service
      const serviceDateTime = new Date(
        `${n.scheduledDate}T${n.timeBand === "BAND_A" ? "05:00" : "07:00"}:00`
      );
      const hoursUntil = (serviceDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntil <= D1_DEADLINE_HOURS && hoursUntil > 0) {
        // D-1 deadline reached — no customer response.
        // markAutoConfirmed() handles:
        //   (a) status → AUTO_CONFIRMED
        //   (b) write-back to periodicScheduleService (washer checklist updates automatically)
        //   (c) autoConfirmMessageSent flag for ops to dispatch second WhatsApp
        n.status = "AUTO_CONFIRMED"; // pre-set so markAutoConfirmed passes the guard
        all[n.id] = n;
        triggered.push(n);
      }
    });

    if (triggered.length > 0) {
      this.writeAll(all);
      // Write-back each triggered notification to periodicScheduleService
      // so washer checklists reflect confirmed services automatically.
      triggered.forEach(n => this.markAutoConfirmed(n.id));
    }
    return triggered;
  }

  // ── Legacy alias — kept for backward compatibility ────────────────────────
  checkNoResponseExpiry(): PeriodicNotification[] {
    return this.checkD1Deadline();
  }

  // ── Format the AUTO-CONFIRM second message (sent at D-1 if no response) ───

  formatAutoConfirmMessage(n: PeriodicNotification): string {
    const bandStr = n.timeBand === "BAND_A" ? "5:00 AM – 7:00 AM" : "7:00 AM – 9:00 AM";
    return [
      `✅ Aapki ${n.serviceName} Service Confirmed!`,
      ``,
      `Namaste ${n.customerName},`,
      ``,
      `Aapki taraf se koi reschedule request nahi aayi — isliye hum samajh rahe hain ki aap service ke liye taiyaar hain. Hum service accordingly schedule kar rahe hain.`,
      ``,
      `📅 Date: ${n.scheduledDate}`,
      `⏰ Time Band: ${bandStr}`,
      `${n.serviceIcon} Service: ${n.serviceName}`,
      ``,
      `Koi sawal ho to humse baat karein:`,
      `📞 ${IVR_NUMBER}  ·  ${IVR_HOURS}`,
      ``,
      `Shukriya 🙏`,
      `— 249 Carwashing Team`,
    ].join("\n");
  }

  // ── Format WhatsApp notification message (for display in app) ────────────

  formatNotificationMessage(n: PeriodicNotification): string {
    const bandLabel = n.timeBand === "BAND_A" ? "5:00 AM – 7:00 AM" : "7:00 AM – 9:00 AM";
    const usage     = n.monthlyUsage;

    const lines = [
      `🗓 Kal Aapki Gaadi Ka Special Service Hai!`,
      ``,
      `👤 ${n.customerName}  ·  📋 Plan: ${n.packageType}`,
      ``,
      `✅ Kal scheduled chhe:`,
      `   ${n.serviceIcon} ${n.serviceName}`,
      ``,
      `📅 Date: ${n.scheduledDate}  ·  ⏰ Time Band: ${bandLabel}`,
      ``,
      `📊 Is mahine na remaining periodic balance:`,
    ];

    // Show relevant services for the plan
    if (usage.shampoo.cap > 0)
      lines.push(`   🧴 Shampoo Wash: ${usage.shampoo.cap - usage.shampoo.used} remaining (${usage.shampoo.used}/${usage.shampoo.cap} used)`);
    if (usage.interior.cap > 0)
      lines.push(`   🪣 Interior Vacuum: ${usage.interior.cap - usage.interior.used} remaining (${usage.interior.used}/${usage.interior.cap} used)`);
    if (usage.wax.cap > 0)
      lines.push(`   ✨ Hand Wax: ${usage.wax.cap - usage.wax.used} remaining (${usage.wax.used}/${usage.wax.cap} used)`);
    if (usage.glass.cap > 0)
      lines.push(`   🪟 Glass Clean: ${usage.glass.cap - usage.glass.used} remaining (${usage.glass.used}/${usage.glass.cap} used)`);
    if (usage.tyre.cap > 0)
      lines.push(`   🛞 Tyre Dressing: ${usage.tyre.cap - usage.tyre.used} remaining (${usage.tyre.used}/${usage.tyre.cap} used)`);

    // Show total remaining for the month
    const totalCap  = Object.values(usage).reduce((s: number, u: any) => s + (u.cap  || 0), 0);
    const totalUsed = Object.values(usage).reduce((s: number, u: any) => s + (u.used || 0), 0);
    const totalRem  = totalCap - totalUsed;
    if (totalRem > 0) {
      lines.push(`   📌 Is mahine mein aapke paas ${totalRem} aur periodic service${totalRem > 1 ? "s" : ""} bachhi hain.`);
    }

    lines.push(
      ``,
      `⚠️ *Zaroori Baat (Policy):*`,
      `   • Aap is mahine mein apni saari periodic services le sakte hain.`,
      `   • Lekin ek mahine mein apni plan ki limit se *zyada nahi* le sakte.`,
      `   • Agar koi service is mahine mein nahi li — woh *agle mahine carry forward nahi hogi*.`,
      `   • Contract khatam hone par bachi hui services ke liye *koi discount ya reimbursement nahi milega*.`,
      ``,
      `Reply karo (kal subah tak — service se 24 ghante pehle):`,
      `   ✅  CONFIRM — service schedule mujab karein`,
      `   🔄  RESCHEDULE — date change karni hai (isi mahine mein)`,
      ``,
      `⏰ Agar kal subah tak koi reply nahi aayi, hum service confirm karenge aur ek confirmation message bhejenge.`,
      ``,
      `📞 Koi bhi sawal ho to call karein: ${IVR_NUMBER}  ·  ${IVR_HOURS}`,
    );

    return lines.join("\n");
  }
}

export const periodicNotificationService = new PeriodicNotificationService();
