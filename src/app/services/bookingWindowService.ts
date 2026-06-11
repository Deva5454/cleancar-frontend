/**
 * bookingWindowService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Determines service slot and messaging based on booking time
 *
 * Rules:
 * - Subscription: always 2 working days TAT
 * - One-time 10:30AM-4:00PM: same day, 4:00-6:00 PM slot
 * - One-time 4:00PM-6:30PM:  next morning, 7:00-9:00 AM slot
 * - One-time 6:30PM-10:30AM: next working day, 2:00-5:00 PM slot
 * - Weekend: next working day morning
 */

export interface BookingSlot {
  window:          "SAME_DAY" | "NEXT_MORNING" | "AFTER_HOURS_QUEUE" | "TWO_WORKING_DAYS";
  slotLabel:       string;        // e.g. "Today, 4:00–6:00 PM"
  slotDate:        string;        // ISO date
  slotTime:        string;        // e.g. "04:00 PM"
  tatDeadline:     string;        // ISO datetime
  customerMessage: string;        // WhatsApp message to send
  supervisorAlert: string;        // Alert text for supervisor
  tsmAlert:        string;        // Alert text for TSM
  omAlert:         string;        // Alert text for OM
  superAdminAlert: string;        // Alert text for Super Admin
  requiresSameDay: boolean;
  isAfterHours:    boolean;
}

function fmt(date: Date): string {
  return date.toLocaleString("en-IN", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function nextWorkingDay(from: Date): Date {
  const d = addDays(from, 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return d;
}

function addWorkingDays(from: Date, n: number): Date {
  let d = new Date(from);
  let added = 0;
  while (added < n) {
    d = addDays(d, 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d;
}

export function getBookingSlot(
  bookingType: "SUBSCRIPTION" | "ONE_TIME" | "PACK_2" | "PACK_4",
  purchasedAt: Date,
  planLabel: string,
  customerName: string,
  area: string,
  amount: number,
): BookingSlot {
  const h = purchasedAt.getHours() + purchasedAt.getMinutes() / 60;
  const isWeekend = purchasedAt.getDay() === 0 || purchasedAt.getDay() === 6;
  const amtStr = `₹${amount.toLocaleString("en-IN")}`;

  if (bookingType !== "ONE_TIME") {
    // Subscription / Pack: 2 working days
    const deadline = addWorkingDays(purchasedAt, 2);
    deadline.setHours(18, 0, 0, 0);
    const slotDate = addWorkingDays(purchasedAt, 1);
    return {
      window: "TWO_WORKING_DAYS",
      slotLabel: `By ${fmt(deadline)}`,
      slotDate: fmtDate(slotDate),
      slotTime: "07:00 AM",
      tatDeadline: deadline.toISOString(),
      requiresSameDay: false,
      isAfterHours: !isWeekend && (h < 10.5 || h >= 18.5),
      customerMessage:
        `🚗 Welcome to 24/9 Carwashing!\n\nYour *${planLabel}* subscription is confirmed.\n\n` +
        `✅ Your dedicated washer will be assigned within 2 working days.\n` +
        `📅 First wash by: *${fmt(deadline)}*\n\n` +
        `Questions? Call/WhatsApp: 91-00000000`,
      supervisorAlert:
        `🆕 New Subscription: ${customerName} · ${planLabel} · ${area}\n${amtStr} · Assign washer by ${fmt(deadline)}`,
      tsmAlert:
        `💰 New Subscription: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
      omAlert:
        `📋 Pending Assignment: ${customerName} · ${planLabel} · ${area} · TAT by ${fmt(deadline)}`,
      superAdminAlert:
        `🔔 New Subscription: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
    };
  }

  // ONE_TIME logic
  if (isWeekend) {
    const nextWork = nextWorkingDay(purchasedAt);
    nextWork.setHours(7, 0, 0, 0);
    const deadline = new Date(nextWork);
    deadline.setHours(12, 0, 0, 0);
    return {
      window: "AFTER_HOURS_QUEUE",
      slotLabel: `${nextWork.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}, 7:00–9:00 AM`,
      slotDate: fmtDate(nextWork),
      slotTime: "07:00 AM",
      tatDeadline: deadline.toISOString(),
      requiresSameDay: false,
      isAfterHours: true,
      customerMessage:
        `🚗 One-Time Wash Confirmed — 24/9 Carwashing!\n\n` +
        `📅 Scheduled: *${nextWork.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} at 7:00–9:00 AM*\n` +
        `🔧 Service: *${planLabel}*\n\n` +
        `Your washer will be assigned by tonight. Questions? Call: 91-00000000`,
      supervisorAlert:
        `📅 Weekend Booking: ${customerName} · ${planLabel} · ${area}\nScheduled: ${fmtDate(nextWork)} 7AM · Assign washer tonight`,
      tsmAlert:
        `💰 Weekend One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}\nFollow up in 7 days for subscription upsell`,
      omAlert:
        `📋 Weekend Booking: ${customerName} queued for ${fmtDate(nextWork)} morning`,
      superAdminAlert:
        `🔔 Weekend One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
    };
  }

  if (h >= 10.5 && h < 16) {
    // 10:30 AM – 4:00 PM → same day 4-6 PM
    const slotDate = new Date(purchasedAt);
    const deadline = new Date(purchasedAt);
    deadline.setHours(18, 0, 0, 0);
    return {
      window: "SAME_DAY",
      slotLabel: `Today, 4:00–6:00 PM`,
      slotDate: fmtDate(slotDate),
      slotTime: "04:00 PM",
      tatDeadline: deadline.toISOString(),
      requiresSameDay: true,
      isAfterHours: false,
      customerMessage:
        `✅ One-Time Wash Confirmed — 24/9 Carwashing!\n\n` +
        `📅 *Today, 4:00–6:00 PM*\n` +
        `🔧 Service: *${planLabel}*\n\n` +
        `Your washer will arrive between 4–6 PM today. We'll send a reminder at 3:30 PM.\n` +
        `Questions? Call: 91-00000000`,
      supervisorAlert:
        `🚨 SAME-DAY Booking: ${customerName} · ${planLabel} · ${area}\nMust assign washer NOW · Slot: Today 4–6 PM`,
      tsmAlert:
        `💰 Same-Day One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
      omAlert:
        `⚠️ Same-Day Booking: ${customerName} · ${planLabel} · ${area} · Supervisor must assign immediately`,
      superAdminAlert:
        `🔔 Same-Day One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
    };
  }

  if (h >= 16 && h < 18.5) {
    // 4:00 PM – 6:30 PM → next morning 7-9 AM
    const nextDay = nextWorkingDay(purchasedAt);
    nextDay.setHours(7, 0, 0, 0);
    const deadline = new Date(nextDay);
    deadline.setHours(12, 0, 0, 0);
    return {
      window: "NEXT_MORNING",
      slotLabel: `Tomorrow, 7:00–9:00 AM`,
      slotDate: fmtDate(nextDay),
      slotTime: "07:00 AM",
      tatDeadline: deadline.toISOString(),
      requiresSameDay: false,
      isAfterHours: false,
      customerMessage:
        `✅ One-Time Wash Confirmed — 24/9 Carwashing!\n\n` +
        `📅 *Tomorrow, 7:00–9:00 AM*\n` +
        `🔧 Service: *${planLabel}*\n\n` +
        `Your washer will arrive tomorrow morning. We'll remind you at 6:30 AM.\n` +
        `Questions? Call: 91-00000000`,
      supervisorAlert:
        `📅 Next-Morning Booking: ${customerName} · ${planLabel} · ${area}\nAssign washer tonight · Slot: Tomorrow 7–9 AM`,
      tsmAlert:
        `💰 Next-Morning One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
      omAlert:
        `📋 Next-Morning Booking: ${customerName} · ${planLabel} · ${area} · Assign by 9 PM today`,
      superAdminAlert:
        `🔔 Next-Morning One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
    };
  }

  // 6:30 PM – 10:30 AM → after hours queue → next working day 2-5 PM
  const nextDay = h >= 18.5 ? nextWorkingDay(purchasedAt) : new Date(purchasedAt);
  if (h < 10.5) {
    // Early morning same calendar day still treated as after-hours
    while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
  }
  nextDay.setHours(14, 0, 0, 0);
  const deadline = new Date(nextDay);
  deadline.setHours(17, 0, 0, 0);
  return {
    window: "AFTER_HOURS_QUEUE",
    slotLabel: `${nextDay.getDay() === new Date().getDay() + 1 ? "Tomorrow" : nextDay.toLocaleDateString("en-IN", { weekday: "long" })}, 2:00–5:00 PM`,
    slotDate: fmtDate(nextDay),
    slotTime: "02:00 PM",
    tatDeadline: deadline.toISOString(),
    requiresSameDay: false,
    isAfterHours: true,
    customerMessage:
      `✅ One-Time Wash Confirmed — 24/9 Carwashing!\n\n` +
      `📅 *${nextDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}, 2:00–5:00 PM*\n` +
      `🔧 Service: *${planLabel}*\n\n` +
      `Your booking is confirmed. We'll assign your washer by 10:30 AM and send a reminder.\n` +
      `Questions? Call: 91-00000000`,
    supervisorAlert:
      `🌙 After-Hours Booking: ${customerName} · ${planLabel} · ${area}\nQueued for ${fmtDate(nextDay)} 2–5 PM · Assign by 12 PM`,
    tsmAlert:
      `💰 After-Hours One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}\nFollow up in 7 days for subscription upsell`,
    omAlert:
      `📋 After-Hours Booking: ${customerName} queued for ${fmtDate(nextDay)} afternoon`,
    superAdminAlert:
      `🔔 After-Hours One-Time: ${customerName} · ${planLabel} · ${area} · ${amtStr}`,
  };
}

/**
 * Fix 6: Check if all slots are booked for the entire day in a pincode.
 * If true, notifies TSM + Admin + Super Admin.
 */
export function checkAllDaySlotsBooked(
  customerPincode: string,
  date: string,
  employees: any[],
  jobs: any[],
): boolean {
  const washersInPincode = employees.filter(e =>
    (e.designation?.toLowerCase().includes("washer") || e.role?.toLowerCase().includes("washer")) &&
    (e.pincode === customerPincode || !customerPincode) &&
    e.accountStatus === "active"
  );

  if (washersInPincode.length === 0) return false;

  // Check all 1-hr slots from 5am to 9pm
  const allSlotsFull = Array.from({ length: 17 }, (_, i) => i + 5).every(hour => {
    const busyCount = jobs.filter(j => {
      const jobDate = j.scheduledDate || j.date || "";
      const jobHour = j.scheduledHour || new Date(j.scheduledDate || "").getHours() || 0;
      return (j.status === "In Progress" || j.status === "Assigned") &&
             jobDate === date && jobHour === hour;
    }).map(j => j.washerId).filter(Boolean).length;

    return busyCount >= washersInPincode.length;
  });

  if (allSlotsFull) {
    // Fire event — tatTrackingService will pick this up and notify TSM/Admin/SA
    try {
      window.dispatchEvent(new CustomEvent("cc360:all_slots_booked", {
        detail: {
          pincode: customerPincode,
          date,
          washersCount: washersInPincode.length,
          message: `⚠️ All washers in pincode ${customerPincode} are fully booked for ${date}. Customer cannot book a slot.`,
        }
      }));
    } catch {}
  }

  return allSlotsFull;
}


const IVR_NUMBER = "080 48 79 45 45";
const SLOT_START_HOUR = 5;
const SLOT_END_HOUR = 21.5; // 9:30 PM

export function isWeekendOrHoliday(d: Date): boolean {
  // Only Sunday (0) is non-working. Saturday (6) is a working day.
  return d.getDay() === 0;
}

export function isTsmWorkingHours(d: Date): boolean {
  // IVR handover window: Mon-Sat, 10:30 AM - 6:30 PM
  // (TSM HR attendance hours are 10:00-19:00 but IVR takeover is 10:30-18:30)
  const h = d.getHours() + d.getMinutes() / 60;
  const day = d.getDay();
  const isWorkingDay = day !== 0; // Sunday only is non-working
  return isWorkingDay && h >= 10.5 && h < 18.5;
}

export function getAvailableSlots(date: Date, tatHoursFromNow = 0): string[] {
  const slots: string[] = [];
  const now = new Date();
  for (let h = SLOT_START_HOUR; h <= 21; h++) {
    const slot = new Date(date);
    slot.setHours(h, 0, 0, 0);
    if (slot.getTime() < now.getTime() + tatHoursFromNow * 60 * 60 * 1000) continue;
    slots.push(slot.toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }));
  }
  return slots;
}

export function canReschedule(slotISO: string, rescheduleWindowHours = 2): boolean {
  const slot = new Date(slotISO);
  const cutoff = new Date(slot.getTime() - rescheduleWindowHours * 60 * 60 * 1000);
  return new Date() < cutoff;
}

export function checkAllDaySlotsBooked(
  customerPincode: string, date: string, employees: any[], jobs: any[]
): boolean {
  const washers = employees.filter(e =>
    (e.designation?.toLowerCase().includes("washer") || e.role?.toLowerCase().includes("washer")) &&
    (e.pincode === customerPincode || !customerPincode) && e.accountStatus === "active"
  );
  if (washers.length === 0) return false;
  const allFull = Array.from({ length: 17 }, (_, i) => i + 5).every(hour => {
    const busy = jobs.filter(j => {
      const jDate = j.scheduledDate || j.date || "";
      const jHour = new Date(j.scheduledDate || "").getHours() || 0;
      return (j.status === "In Progress" || j.status === "Assigned") && jDate === date && jHour === hour;
    }).length;
    return busy >= washers.length;
  });
  if (allFull) {
    try { window.dispatchEvent(new CustomEvent("cc360:all_slots_booked", { detail: { pincode: customerPincode, date } })); } catch {}
  }
  return allFull;
}
