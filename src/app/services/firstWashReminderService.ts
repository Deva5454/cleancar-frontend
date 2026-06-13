/**
 * firstWashReminderService.ts
 * Sends WA reminders on Day 10, 13, 15 if customer has not booked their first wash.
 * Validity period starts from date of FIRST WASH (not payment date).
 * First wash must happen within 15 days of payment for all service types.
 */

import { DataService } from "./DataService";

const REMINDED_KEY = "FIRST_WASH_REMINDERS_SENT";

export function checkFirstWashReminders(): void {
  try {
    const now = new Date();
    const subs = DataService.get<any>("SUBSCRIPTIONS") || [];
    const customers = DataService.get<any>("CUSTOMERS") || [];
    const jobs = DataService.get<any>("JOBS") || [];
    const reminded = DataService.get<any>(REMINDED_KEY) || {};

    subs
      .filter((s: any) =>
        s.status === "Active" &&
        !s.firstWashDate && // first wash not yet done
        s.createdAt
      )
      .forEach((sub: any) => {
        const paymentDate = new Date(sub.createdAt);
        const daysSincePayment = Math.floor((now.getTime() - paymentDate.getTime()) / 86400000);

        // Check if any job for this sub is completed (first wash happened)
        const hasFirstWash = jobs.some((j: any) =>
          j.subscriptionId === sub.subscriptionId && j.status === "Completed"
        );
        if (hasFirstWash) return;

        // Remind on Day 10, 13, 15
        const remindDays = [10, 13, 15];
        const dayToRemind = remindDays.find(d => daysSincePayment === d);
        if (!dayToRemind) return;

        const remindKey = `${sub.subscriptionId}-day${dayToRemind}`;
        if (reminded[remindKey]) return; // already sent

        const cust = customers.find((c: any) => c.customerId === sub.customerId);
        if (!cust?.phone) return;

        const daysLeft = 15 - daysSincePayment;
        const urgency = dayToRemind === 15 ? "🚨 LAST DAY!" : dayToRemind === 13 ? "⚠️ Urgent:" : "⏰ Reminder:";
        const msg =
          `${urgency} Hi ${cust.firstName || "there"}, you have not yet scheduled your first 24/9 Carwashing wash.\n\n` +
          `You have ${daysLeft} day${daysLeft !== 1 ? "s" : ""} left to book your first wash.\n\n` +
          `⚠️ Important: If your first wash is not booked within 15 days of payment, your remaining service will lapse and will NOT be carried forward.\n\n` +
          `Book now: 249carwashing.genxa.in/buy\n` +
          `Or call: 080 48 79 45 45`;

        import("./whatsappService").then(ws => {
          ws.sendWhatsApp(cust.phone, msg, "first_wash_reminder", { background: true }).catch(() => {});
        });

        // Mark as sent
        reminded[remindKey] = now.toISOString();
        DataService.setAll(REMINDED_KEY, reminded);

        // Store for TSM awareness
        const tasks = DataService.get<any>("TSM_UPSELL_TASKS") || [];
        tasks.push({
          taskId: `FIRSTWASH-${sub.subscriptionId}-day${dayToRemind}`,
          type: "FIRST_WASH_REMINDER",
          customerId: sub.customerId,
          customerName: `${cust.firstName || ""} ${cust.lastName || ""}`.trim(),
          customerPhone: cust.phone,
          subscriptionId: sub.subscriptionId,
          daysSincePayment: dayToRemind,
          daysLeft,
          followUpDate: now.toISOString().split("T")[0],
          status: "PENDING",
          createdAt: now.toISOString(),
          notes: `Customer has not booked first wash. Day ${dayToRemind} of 15. ${daysLeft} days left before service lapses.`,
        });
        DataService.setAll("TSM_UPSELL_TASKS", tasks);

        // C6: On Day 15 — lapse the subscription if still no first wash
        if (dayToRemind === 15) {
          try {
            const subs = DataService.get<any>("SUBSCRIPTIONS") || [];
            const subIdx = subs.findIndex((s: any) => s.subscriptionId === sub.subscriptionId);
            if (subIdx >= 0 && !subs[subIdx].firstWashDate) {
              // C6: Check if this is a second lapse (already lapsed before and was reactivated)
              const lapseCount = (subs[subIdx].lapseCount || 0) + 1;
              const isSecondLapse = lapseCount >= 2;

              subs[subIdx].status = "Expired";
              subs[subIdx].lapsedAt = now.toISOString();
              subs[subIdx].lapseReason = isSecondLapse ? "second_lapse_day15" : "first_wash_not_taken_day15";
              subs[subIdx].lapseCount = lapseCount;
              // C6: Second lapse — only Super Admin can reactivate (not TSM)
              subs[subIdx].requiresSuperAdminReactivation = isSecondLapse;
              DataService.setAll("SUBSCRIPTIONS", subs);

              // WA to customer
              sendWhatsApp(cust.phone,
                isSecondLapse
                  ? `⚠️ Hi ${cust.firstName || "Customer"}, your 24/9 Carwashing service has lapsed again. As this is a repeat lapse, reactivation requires approval from our management team. Please call 080 48 79 45 45 (10:30 AM – 6:30 PM, Mon–Sat).`
                  : `⚠️ Hi ${cust.firstName || "Customer"}, your 24/9 Carwashing service has lapsed as your first wash was not booked within 15 days of payment. Please call 080 48 79 45 45 (10:30 AM – 6:30 PM, Mon–Sat) to discuss reactivation options.`,
                "first_wash_lapse", { background: true }
              ).catch(() => {});

              // TSM task — but for second lapse, flag as Super Admin only
              const tsm_tasks = DataService.get<any>("TSM_UPSELL_TASKS") || [];
              tsm_tasks.push({
                taskId: `LAPSE-${sub.subscriptionId}-${lapseCount}`,
                type: isSecondLapse ? "SECOND_LAPSE_SUPER_ADMIN_REQUIRED" : "FIRST_WASH_LAPSED",
                customerId: sub.customerId,
                customerName: `${cust.firstName || ""} ${cust.lastName || ""}`.trim(),
                customerPhone: cust.phone,
                subscriptionId: sub.subscriptionId,
                lapseDate: now.toISOString().split("T")[0],
                lapseCount,
                reactivationDeadline: isSecondLapse ? null : new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0],
                status: isSecondLapse ? "PENDING_SUPER_ADMIN_ACTION" : "PENDING_TSM_ACTION",
                notes: isSecondLapse
                  ? "⛔ Second lapse — TSM CANNOT reactivate. Requires Super Admin approval only. Super Admin must set a mutually agreed validity period."
                  : "TSM can reactivate within 3 days if customer books first wash immediately. Second lapse requires Super Admin.",
                createdAt: now.toISOString(),
                tsmCanReactivate: !isSecondLapse,
                requiresSuperAdmin: isSecondLapse,
                reactivationWindowDays: isSecondLapse ? null : 3,
              });
              DataService.setAll("TSM_UPSELL_TASKS", tsm_tasks);
            }
          } catch {}
        }
      });
  } catch {}
}

/**
 * Set firstWashDate on subscription when first job is completed.
 * Validity period clock starts from this date.
 */
export function recordFirstWashDate(subscriptionId: string, washDate: string): void {
  try {
    const subs = DataService.get<any>("SUBSCRIPTIONS") || [];
    const idx = subs.findIndex((s: any) => s.subscriptionId === subscriptionId);
    if (idx >= 0 && !subs[idx].firstWashDate) {
      subs[idx].firstWashDate = washDate;

      // Set expiry based on service type and first wash date
      const sub = subs[idx];
      const firstWash = new Date(washDate);
      const validityDays =
        sub.packageType === "PACK_4" ? 30 :
        sub.packageType === "PACK_2" ? 20 :
        sub.frequency === "1 time in 10 days" ? 15 :
        sub.frequency === "2 times in 20 days" ? 20 :
        sub.frequency === "4 times in 30 days" ? 30 :
        sub.frequency === "One-Time" ? 10 : 30;

      const expiry = new Date(firstWash);
      expiry.setDate(expiry.getDate() + validityDays);
      subs[idx].visitsExpiry = expiry.toISOString().split("T")[0];
      subs[idx].renewalDate = expiry.toISOString().split("T")[0];

      DataService.setAll("SUBSCRIPTIONS", subs);
    }
  } catch {}
}
