import { sendBookingConfirmed, sendTeamAlert } from "./whatsappService";

/**
 * tatTrackingService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * TAT (Turnaround Time) Tracking Service
 * Tracks every new booking from purchase → first wash completion
 * Enforces 2-working-day SLA for subscriptions, same/next-day for one-time
 *
 * Storage key: cleancar_tat_records
 */

export type BookingType = "SUBSCRIPTION" | "ONE_TIME" | "PACK_2" | "PACK_4";
export type TATStatus =
  | "PENDING_ASSIGN"     // purchased, no washer assigned yet
  | "ASSIGNED"           // washer assigned, waiting first wash
  | "FIRST_WASH_DONE"    // completed within TAT
  | "BREACHED"           // TAT exceeded
  | "ESCALATED_L1"       // OM notified
  | "ESCALATED_L2"       // CM notified
  | "ESCALATED_L3";      // Super Admin notified

export type BookingWindow = "SAME_DAY" | "NEXT_MORNING" | "AFTER_HOURS_QUEUE";

export interface TATRecord {
  id:                   string;
  subscriptionId:       string;
  customerId:           string;
  customerName:         string;
  customerPhone:        string;
  planType:             string;
  bookingType:          BookingType;
  area:                 string;
  cityId:               string;
  grandTotal:           number;

  // People
  tseId?:               string;
  tseName?:             string;
  supervisorId?:        string;
  supervisorName?:      string;
  tsmId?:               string;
  tsmName?:             string;

  // Time tracking
  purchasedAt:          string;   // ISO timestamp
  tatDeadlineAt:        string;   // ISO timestamp — when TAT expires
  bookingWindow:        BookingWindow;
  scheduledDate?:       string;   // for one-time: specific date
  scheduledTime?:       string;   // for one-time: specific time

  // Progress
  supervisorNotifiedAt?: string;
  tsmNotifiedAt?:        string;
  superAdminNotifiedAt?: string;
  washerAssignedAt?:     string;
  washerAssignedBy?:     string;
  washerId?:             string;
  washerName?:           string;
  firstWashAt?:          string;

  status:               TATStatus;
  slaBreached:          boolean;
  escalationLevel:      0 | 1 | 2 | 3;
  notes?:               string;
  createdAt:            string;
}

export interface TATNotification {
  id:           string;
  tatRecordId:  string;
  recipientRole: "SUPERVISOR" | "TSM" | "OM" | "SUPER_ADMIN" | "CUSTOMER";
  recipientId?:  string;
  type:         "NEW_BOOKING" | "PENDING_ASSIGN" | "TAT_BREACH" | "ESCALATION" | "ASSIGNED" | "COMPLETED";
  severity:     "INFO" | "WARNING" | "CRITICAL";
  title:        string;
  message:      string;
  actionRequired: boolean;
  actionLabel?:  string;
  read:         boolean;
  acknowledged: boolean;        // Distinct from read — requires explicit tap of Acknowledge button
  acknowledgedAt?: string;      // ISO timestamp when acknowledged
  acknowledgedBy?: string;      // employeeId who acknowledged
  createdAt:    string;
}

// ── Working day / booking window helpers ─────────────────────────────────────

const WORK_HOURS_START = 10.5;  // 10:30 AM
const WORK_HOURS_END   = 18.5;  // 6:30 PM
const SAME_DAY_CUTOFF  = 16.0;  // 4:00 PM — after this, no same-day service

function isWorkingHour(date: Date): boolean {
  const h = date.getHours() + date.getMinutes() / 60;
  return h >= WORK_HOURS_START && h < WORK_HOURS_END;
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

function addWorkingDays(date: Date, days: number): Date {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) added++;
  }
  return result;
}

function getNextWorkingDay(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isWeekend(next)) next.setDate(next.getDate() + 1);
  return next;
}

export function determineBookingWindow(
  bookingType: BookingType,
  purchasedAt: Date
): { window: BookingWindow; tatDeadline: Date; scheduledSlot?: string } {
  if (bookingType === "SUBSCRIPTION" || bookingType === "PACK_2" || bookingType === "PACK_4") {
    // Subscriptions: 2 working days
    return {
      window: "SAME_DAY",
      tatDeadline: addWorkingDays(purchasedAt, 2),
    };
  }

  // ONE_TIME — depends on booking window
  const hour = purchasedAt.getHours() + purchasedAt.getMinutes() / 60;
  const isWeekendDay = isWeekend(purchasedAt);

  if (isWeekendDay) {
    // Weekend → next working day morning
    const nextWorkDay = getNextWorkingDay(purchasedAt);
    nextWorkDay.setHours(7, 0, 0, 0);
    const deadline = new Date(nextWorkDay);
    deadline.setHours(12, 0, 0, 0); // must complete by noon
    return { window: "AFTER_HOURS_QUEUE", tatDeadline: deadline, scheduledSlot: "07:00 AM" };
  }

  if (hour >= WORK_HOURS_START && hour < SAME_DAY_CUTOFF) {
    // 10:30 AM – 4:00 PM → same day, afternoon slot
    const sameDay = new Date(purchasedAt);
    sameDay.setHours(18, 0, 0, 0); // must complete by 6 PM
    return { window: "SAME_DAY", tatDeadline: sameDay, scheduledSlot: "04:00 PM" };
  }

  if (hour >= SAME_DAY_CUTOFF && hour < WORK_HOURS_END) {
    // 4:00 PM – 6:30 PM → next morning
    const nextDay = getNextWorkingDay(purchasedAt);
    nextDay.setHours(9, 0, 0, 0);
    const deadline = new Date(nextDay);
    deadline.setHours(12, 0, 0, 0);
    return { window: "NEXT_MORNING", tatDeadline: deadline, scheduledSlot: "07:00 AM" };
  }

  // 6:30 PM – 10:30 AM (after hours/night) → next working day afternoon
  const nextDay = hour < WORK_HOURS_START ? new Date(purchasedAt) : getNextWorkingDay(purchasedAt);
  if (hour < WORK_HOURS_START) {
    // early morning same calendar day is still "after hours"
    while (isWeekend(nextDay)) nextDay.setDate(nextDay.getDate() + 1);
  } else {
    // after 6:30 PM
    nextDay.setDate(nextDay.getDate() + 1);
    while (isWeekend(nextDay)) nextDay.setDate(nextDay.getDate() + 1);
  }
  nextDay.setHours(17, 0, 0, 0); // must complete by 5 PM next day
  return { window: "AFTER_HOURS_QUEUE", tatDeadline: nextDay, scheduledSlot: "02:00 PM" };
}

// ── Storage ───────────────────────────────────────────────────────────────────

const TAT_KEY  = "cleancar_tat_records";
const NOTIF_KEY = "cleancar_tat_notifications";

function readRecords(): TATRecord[] {
  try { return JSON.parse(localStorage.getItem(TAT_KEY) || "[]"); } catch { return []; }
}
function writeRecords(r: TATRecord[]) {
  localStorage.setItem(TAT_KEY, JSON.stringify(r));
}
function readNotifs(): TATNotification[] {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]"); } catch { return []; }
}
function writeNotifs(n: TATNotification[]) {
  localStorage.setItem(NOTIF_KEY, JSON.stringify(n.slice(0, 500)));
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// ── Service ───────────────────────────────────────────────────────────────────

class TATTrackingService {

  // ── Create TAT record on new booking ───────────────────────────────────────
  createRecord(params: {
    subscriptionId: string;
    customerId:     string;
    customerName:   string;
    customerPhone:  string;
    planType:       string;
    bookingType:    BookingType;
    area:           string;
    cityId:         string;
    grandTotal:     number;
    scheduledDate?: string;
    scheduledTime?: string;
    tseId?:         string;
    tseName?:       string;
    supervisorId?:  string;
    supervisorName?:string;
    tsmId?:         string;
    tsmName?:       string;
  }): TATRecord {
    const now = new Date();
    const { window, tatDeadline, scheduledSlot } = determineBookingWindow(params.bookingType, now);

    const record: TATRecord = {
      id:              "TAT-" + genId(),
      subscriptionId:  params.subscriptionId,
      customerId:      params.customerId,
      customerName:    params.customerName,
      customerPhone:   params.customerPhone,
      planType:        params.planType,
      bookingType:     params.bookingType,
      area:            params.area,
      cityId:          params.cityId,
      grandTotal:      params.grandTotal,
      tseId:           params.tseId,
      tseName:         params.tseName,
      supervisorId:    params.supervisorId,
      supervisorName:  params.supervisorName,
      tsmId:           params.tsmId,
      tsmName:         params.tsmName,
      purchasedAt:     now.toISOString(),
      tatDeadlineAt:   tatDeadline.toISOString(),
      bookingWindow:   window,
      scheduledDate:   params.scheduledDate,
      scheduledTime:   params.scheduledTime || scheduledSlot,
      status:          "PENDING_ASSIGN",
      slaBreached:     false,
      escalationLevel: 0,
      createdAt:       now.toISOString(),
    };

    const records = readRecords();
    records.push(record);
    writeRecords(records);

    // Fire all notifications immediately
    this.notifyAll(record);

    // Dispatch DOM event for real-time UI updates
    try {
      window.dispatchEvent(new CustomEvent("cc360:new_booking", { detail: record }));
    } catch {}

    return record;
  }

  // ── Notify all 5 recipients ────────────────────────────────────────────────
  private notifyAll(record: TATRecord) {
    const notifs = readNotifs();
    const now = new Date().toISOString();
    const planLabel = this.planLabel(record.planType);
    const typeLabel = record.bookingType === "ONE_TIME" ? "One-Time Wash"
      : record.bookingType === "PACK_2" ? "Pack of 2"
      : record.bookingType === "PACK_4" ? "Pack of 4"
      : "Subscription";
    const windowMsg = record.bookingWindow === "SAME_DAY"
      ? "Same-day service expected"
      : record.bookingWindow === "NEXT_MORNING"
      ? "Service expected next morning"
      : "Service queued — assign by 12 PM";
    const deadline = new Date(record.tatDeadlineAt).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });

    // 1. Supervisor
    notifs.push({
      id: "N-" + genId(), tatRecordId: record.id,
      recipientRole: "SUPERVISOR", recipientId: record.supervisorId,
      type: "NEW_BOOKING", severity: record.bookingWindow === "SAME_DAY" ? "WARNING" : "INFO",
      title: `New ${typeLabel} — Assign Washer`,
      message: `${record.customerName} · ${planLabel} · ${record.area} · ₹${record.grandTotal.toLocaleString("en-IN")}\n${windowMsg}. TAT deadline: ${deadline}`,
      actionRequired: true, actionLabel: "Assign Washer",
      read: false, createdAt: now,
    });

    // 2. TSM — notified always; actionable only during working hours
    const bookingHour = new Date(record.purchasedAt || now).getHours() + new Date(record.purchasedAt || now).getMinutes() / 60;
    const bookingDay = new Date(record.purchasedAt || now).getDay();
    const isSunday = bookingDay === 0;
    const isAfterHours = isSunday || bookingHour < 10.5 || bookingHour >= 18.5;
    const isTsmWorkingHoursNow = !isAfterHours;

    notifs.push({
      id: "N-" + genId(), tatRecordId: record.id,
      recipientRole: "TSM", recipientId: record.tsmId,
      type: "NEW_BOOKING", severity: "INFO",
      title: `New Booking — ₹${record.grandTotal.toLocaleString("en-IN")}`,
      message: `${record.customerName} · ${typeLabel} · ${planLabel} · ${record.area}\nTSE: ${record.tseName || "Unknown"}. Follow up in 7 days for subscription upsell if one-time.`,
      actionRequired: record.bookingType === "ONE_TIME",
      actionLabel: record.bookingType === "ONE_TIME" ? "Schedule 7-day follow-up" : undefined,
      read: false, createdAt: now,
    });

    // 3. OM
    notifs.push({
      id: "N-" + genId(), tatRecordId: record.id,
      recipientRole: "OM",
      type: "NEW_BOOKING", severity: "INFO",
      title: `New ${typeLabel} — Pending Assignment`,
      message: `${record.customerName} · ${planLabel} · ${record.area}\nTAT deadline: ${deadline}. Supervisor must assign washer.`,
      actionRequired: false, read: false, acknowledged: false, createdAt: now,
    });

    // 4. Super Admin
    notifs.push({
      id: "N-" + genId(), tatRecordId: record.id,
      recipientRole: "SUPER_ADMIN",
      type: "NEW_BOOKING", severity: "INFO",
      title: `New ${typeLabel} — ${record.customerName}`,
      message: `${planLabel} · ${record.area} · ₹${record.grandTotal.toLocaleString("en-IN")}\nBooking window: ${record.bookingWindow}. TAT: ${deadline}.`,
      actionRequired: false, read: false, acknowledged: false, createdAt: now,
    });

    // 5. Customer (WhatsApp simulation)
    const customerMsg = record.bookingType === "ONE_TIME"
      ? `Your one-time ${planLabel} is confirmed for ${record.scheduledDate || "today"} at ${record.scheduledTime}. Your washer will be assigned shortly. Queries: 9100000000`
      : `Welcome to 24/9 Carwashing! Your ${planLabel} starts within 2 working days. Your dedicated washer will be assigned by ${deadline}. Queries: 9100000000`;
    notifs.push({
      id: "N-" + genId(), tatRecordId: record.id,
      recipientRole: "CUSTOMER",
      type: "NEW_BOOKING", severity: "INFO",
      title: "Booking Confirmed — 24/9 Carwashing",
      message: customerMsg,
      actionRequired: false, read: false, acknowledged: false, createdAt: now,
    });

    writeNotifs(notifs);
  }

  // ── Mark washer assigned ───────────────────────────────────────────────────
  markAssigned(tatId: string, washerId: string, washerName: string, assignedBy: string, supervisorName?: string, supervisorPhone?: string) {
    const records = readRecords();
    const idx = records.findIndex(r => r.id === tatId);
    if (idx < 0) return;
    const record = records[idx];
    const now = new Date().toISOString();
    records[idx] = {
      ...record,
      washerId, washerName,
      washerAssignedAt: now,
      washerAssignedBy: assignedBy,
      status: "ASSIGNED",
      supervisorName: supervisorName || record.supervisorName,
      supervisorPhone: supervisorPhone || record.supervisorPhone,
    };
    writeRecords(records);

    // Notify customer + super admin
    const notifs = readNotifs();
    const deadline = new Date(record.tatDeadlineAt).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
    });
    notifs.push({
      id: "N-" + genId(), tatRecordId: tatId,
      recipientRole: "CUSTOMER",
      type: "ASSIGNED", severity: "INFO",
      title: "Booking Confirmed — 24/9 Carwashing",
      message: `Your ${this.planLabel(record.planType)} is confirmed! Supervisor: ${supervisorName || record.supervisorName || washerName} | Contact: ${supervisorPhone || record.supervisorPhone || "9100000000"}. First wash by ${deadline}.`,
      actionRequired: false, read: false, acknowledged: false, createdAt: now,
    });
    notifs.push({
      id: "N-" + genId(), tatRecordId: tatId,
      recipientRole: "SUPER_ADMIN",
      type: "ASSIGNED", severity: "INFO",
      title: `Washer Assigned — ${record.customerName}`,
      message: `${washerName} assigned to ${record.customerName}. TAT deadline: ${deadline}.`,
      actionRequired: false, read: false, acknowledged: false, createdAt: now,
    });
    writeNotifs(notifs);

    // Send full WhatsApp confirmation to customer (non-blocking)
    // This is Stage 2 of the 2-stage WA flow — triggered by supervisor+washer acceptance
    if (record.customerPhone) {
      sendBookingConfirmed(
        record.customerPhone,
        record.customerName,
        this.planLabel(record.planType),
        deadline,
        record.supervisorName || washerName,
        record.supervisorPhone
      ).catch(() => {/* non-blocking */});
    }
  }

  // ── Mark first wash done ───────────────────────────────────────────────────
  markFirstWashDone(tatId: string) {
    const records = readRecords();
    const idx = records.findIndex(r => r.id === tatId);
    if (idx < 0) return;
    const now = new Date();
    const record = records[idx];
    const breached = now > new Date(record.tatDeadlineAt);
    records[idx] = {
      ...record,
      firstWashAt: now.toISOString(),
      status: "FIRST_WASH_DONE",
      slaBreached: breached,
    };
    writeRecords(records);

    // Notify all
    const notifs = readNotifs();
    const nowStr = now.toISOString();
    const msg = breached
      ? `First wash completed AFTER TAT deadline. SLA breached for ${record.customerName}.`
      : `First wash completed ON TIME for ${record.customerName}. TAT met ✅`;
    ["SUPERVISOR","TSM","OM","SUPER_ADMIN"].forEach(role => {
      notifs.push({
        id: "N-" + genId(), tatRecordId: tatId,
        recipientRole: role as any,
        type: "COMPLETED", severity: breached ? "WARNING" : "INFO",
        title: breached ? `TAT Breached — ${record.customerName}` : `TAT Met — ${record.customerName}`,
        message: msg, actionRequired: breached, read: false, acknowledged: false, createdAt: nowStr,
      });
    });
    // Customer
    notifs.push({
      id: "N-" + genId(), tatRecordId: tatId,
      recipientRole: "CUSTOMER",
      type: "COMPLETED", severity: "INFO",
      title: "First Wash Complete — 24/9 Carwashing",
      message: `Your first ${this.planLabel(record.planType)} is done! Check your WhatsApp for before/after photos. See you tomorrow! ☀️`,
      actionRequired: false, read: false, acknowledged: false, createdAt: nowStr,
    });
    writeNotifs(notifs);
  }

  // ── Auto-check for TAT breaches (run every hour) ───────────────────────────
  checkBreaches() {
    const records = readRecords();
    const now = new Date();
    const notifs = readNotifs();
    let updated = false;

    records.forEach((record, idx) => {
      if (record.status === "FIRST_WASH_DONE" || record.status === "BREACHED") return;
      const deadline = new Date(record.tatDeadlineAt);
      const hoursElapsed = (now.getTime() - new Date(record.purchasedAt).getTime()) / 3600000;

      // Subscription escalation ladder
      if (record.bookingType === "SUBSCRIPTION") {
        if (hoursElapsed >= 48 && record.status !== "FIRST_WASH_DONE") {
          records[idx].status = "BREACHED";
          records[idx].slaBreached = true;
          this.pushEscalation(notifs, record, 3, "CRITICAL", "SLA BREACH — 48hrs passed. Super Admin + CM must review.");
          updated = true;
        } else if (hoursElapsed >= 24 && record.escalationLevel < 2) {
          records[idx].escalationLevel = 2;
          records[idx].status = "ESCALATED_L2";
          this.pushEscalation(notifs, record, 2, "CRITICAL", "No washer assigned after 24hrs. CM notified.");
          updated = true;
        } else if (hoursElapsed >= 8 && record.escalationLevel < 1) {
          records[idx].escalationLevel = 1;
          records[idx].status = "ESCALATED_L1";
          this.pushEscalation(notifs, record, 1, "WARNING", "No washer assigned after 8hrs. OM alerted.");
          updated = true;
        }
      }

      // One-time escalation ladder
      if (record.bookingType === "ONE_TIME") {
        if (now > deadline && record.status !== "FIRST_WASH_DONE") {
          records[idx].status = "BREACHED";
          records[idx].slaBreached = true;
          this.pushEscalation(notifs, record, 3, "CRITICAL", "One-time wash TAT breached. Customer apology required.");
          updated = true;
        } else if (hoursElapsed >= 4 && record.escalationLevel < 1 && !record.washerAssignedAt) {
          records[idx].escalationLevel = 1;
          records[idx].status = "ESCALATED_L1";
          this.pushEscalation(notifs, record, 1, "WARNING", "One-time wash: no washer assigned after 4hrs.");
          updated = true;
        }
      }
    });

    if (updated) {
      writeRecords(records);
      writeNotifs(notifs);
    }
  }

  private pushEscalation(
    notifs: TATNotification[],
    record: TATRecord,
    level: number,
    severity: "WARNING" | "CRITICAL",
    message: string
  ) {
    const now = new Date().toISOString();
    const roles: TATNotification["recipientRole"][] =
      level >= 3 ? ["SUPERVISOR","TSM","OM","SUPER_ADMIN"]
      : level >= 2 ? ["OM","SUPER_ADMIN","TSM"]
      : ["SUPERVISOR","OM"];
    roles.forEach(role => {
      notifs.push({
        id: "N-" + genId(), tatRecordId: record.id,
        recipientRole: role,
        type: "ESCALATION", severity,
        title: `TAT Escalation L${level} — ${record.customerName}`,
        message: `${message}\nCustomer: ${record.customerName} · ${record.area} · ${this.planLabel(record.planType)}`,
        actionRequired: true,
        actionLabel: level >= 3 ? "Resolve immediately" : "Assign washer now",
        read: false, createdAt: now,
      });
    });
  }

  // ── Getters ────────────────────────────────────────────────────────────────
  getAll():                    TATRecord[]      { return readRecords(); }
  getPending():                TATRecord[]      { return readRecords().filter(r => r.status === "PENDING_ASSIGN"); }
  getBreached():               TATRecord[]      { return readRecords().filter(r => r.slaBreached); }
  getBySubscription(id: string): TATRecord | undefined { return readRecords().find(r => r.subscriptionId === id); }

  getNotificationsForRole(role: TATNotification["recipientRole"], id?: string): TATNotification[] {
    return readNotifs().filter(n =>
      n.recipientRole === role && (!id || !n.recipientId || n.recipientId === id)
    );
  }

  getUnreadCount(role: TATNotification["recipientRole"], id?: string): number {
    return this.getNotificationsForRole(role, id).filter(n => !n.read).length;
  }

  markNotificationRead(notifId: string) {
    const notifs = readNotifs();
    const idx = notifs.findIndex(n => n.id === notifId);
    if (idx >= 0) { notifs[idx].read = true; writeNotifs(notifs); }
  }

  acknowledgeNotification(notifId: string, employeeId: string): void {
    const notifs = readNotifs();
    const idx = notifs.findIndex(n => n.id === notifId);
    if (idx < 0) return;
    notifs[idx] = { ...notifs[idx], acknowledged: true, acknowledgedAt: new Date().toISOString(), acknowledgedBy: employeeId, read: true };
    writeNotifs(notifs);
    window.dispatchEvent(new CustomEvent("cc360:notification_acknowledged", { detail: { notifId } }));
  }

  getUnacknowledgedActionCount(role: TATNotification["recipientRole"], employeeId?: string): number {
    return readNotifs().filter(n =>
      n.recipientRole === role &&
      (!employeeId || n.recipientId === employeeId || !n.recipientId) &&
      n.actionRequired && !n.acknowledged
    ).length;
  }

  markAllRead(role: TATNotification["recipientRole"]) {
    const notifs = readNotifs();
    notifs.forEach(n => { if (n.recipientRole === role) n.read = true; });
    writeNotifs(notifs);
  }

  getPendingCount(): number { return this.getPending().length; }
  getBreachedCount(): number { return this.getBreached().length; }

  private planLabel(planType: string): string {
    const map: Record<string,string> = {
      EXPRESS_WASH: "Express Wash", SMART_WASH: "Smart Wash", ELITE_WASH: "Elite Wash",
      water: "Express Wash", shampoo: "Smart Wash", wax: "Elite Wash",
    };
    return map[planType] || planType;
  }
}


/**
 * Fix 5b: Weekly rating for monthly subscriptions — run every Sunday at 11 AM.
 * Call from app-level useEffect with a daily timer check.
 */
export function isTsmWorkingHours(d: Date): boolean {
  const h = d.getHours() + d.getMinutes() / 60;
  const isWeekend = d.getDay() === 0; // Only Sunday is non-working
  return !isWeekend && h >= 10.5 && h < 18.5;
}

export function getRankedSupervisors(customerPincode: string, employees: any[], jobs: any[], slotISO?: string) {
  const supervisors = employees.filter(e =>
    (e.designation?.toLowerCase().includes("supervisor") || e.role?.toLowerCase().includes("supervisor")) &&
    e.accountStatus === "active" && (!customerPincode || e.pincode === customerPincode || !e.pincode)
  );
  return supervisors.map(sup => {
    const washers = employees.filter(e =>
      (e.designation?.toLowerCase().includes("washer") || e.role?.toLowerCase().includes("washer")) &&
      e.supervisorId === sup.id && e.accountStatus === "active"
    );
    const busyIds = new Set(jobs.filter(j =>
      (j.status === "In Progress" || j.status === "Assigned") &&
      (!slotISO || (j.scheduledDate || "").startsWith(slotISO.split("T")[0]))
    ).map((j: any) => j.washerId).filter(Boolean));
    return {
      supervisorId: sup.id,
      supervisorName: `${sup.firstName || ""} ${sup.lastName || ""}`.trim(),
      supervisorPhone: sup.loginMobile || sup.mobile || "",
      pincode: sup.pincode || "",
      idleWashers: washers.filter(w => !busyIds.has(w.id)).length,
      activeJobs: jobs.filter(j => j.supervisorId === sup.id && (j.status === "In Progress" || j.status === "Assigned")).length,
    };
  }).sort((a, b) => b.idleWashers !== a.idleWashers ? b.idleWashers - a.idleWashers : a.activeJobs - b.activeJobs);
}

export function isSlotAvailable(customerPincode: string, employees: any[], jobs: any[], slotISO: string): boolean {
  const washers = employees.filter(e =>
    (e.designation?.toLowerCase().includes("washer") || e.role?.toLowerCase().includes("washer")) &&
    e.pincode === customerPincode && e.accountStatus === "active"
  );
  if (!washers.length) return true;
  const slotDate = slotISO.split("T")[0];
  const slotHour = new Date(slotISO).getHours();
  const busy = new Set(jobs.filter(j => {
    const jDate = j.scheduledDate || j.date || "";
    const jHour = new Date(j.scheduledDate || "").getHours();
    return (j.status === "In Progress" || j.status === "Assigned") && jDate === slotDate && jHour === slotHour;
  }).map((j: any) => j.washerId).filter(Boolean));
  return washers.some(w => !busy.has(w.id));
}

export function createUpsellTask(params: { customerId: string; customerName: string; customerPhone: string; jobId: string; planLabel: string; cityId: string; completedAt: string; }): void {
  try {
    const followUpDate = new Date(params.completedAt);
    followUpDate.setDate(followUpDate.getDate() + 3); // Retention follow-up: 3 days after wash
    const task = { taskId: "UPSELL-" + Date.now().toString(36).toUpperCase(), type: "UPSELL_ONETIME_TO_MONTHLY", ...params, followUpDate: followUpDate.toISOString().split("T")[0], status: "PENDING", createdAt: new Date().toISOString(), notes: `One-time ${params.planLabel} completed. Call to convert to monthly.` };
    const tasks = DataService.get<any>("TSM_UPSELL_TASKS") || [];
    if (!tasks.find((t: any) => t.jobId === params.jobId)) {
      tasks.push(task);
      DataService.setAll("TSM_UPSELL_TASKS", tasks);
      try { window.dispatchEvent(new CustomEvent("cc360:upsell_task_created", { detail: task })); } catch {}
    }
  } catch {}
}

export function createPackUpsellTask(params: { customerId: string; customerName: string; customerPhone: string; subscriptionId: string; packageName: string; trigger: "PACK_VISIT_LOW" | "PACK_EXHAUSTED"; cityId: string; }): void {
  try {
    const task = { taskId: "UPSELL-" + Date.now().toString(36).toUpperCase(), type: params.trigger === "PACK_VISIT_LOW" ? "UPSELL_PACK_LAST_VISIT" : "UPSELL_PACK_EXHAUSTED", ...params, followUpDate: new Date().toISOString().split("T")[0], status: "PENDING", createdAt: new Date().toISOString(), notes: params.trigger === "PACK_VISIT_LOW" ? `${params.customerName}: 1 visit left — convert to monthly.` : `${params.customerName}: pack exhausted — offer renewal.` };
    const tasks = DataService.get<any>("TSM_UPSELL_TASKS") || [];
    tasks.push(task);
    DataService.setAll("TSM_UPSELL_TASKS", tasks);
    try { window.dispatchEvent(new CustomEvent("cc360:upsell_task_created", { detail: task })); } catch {}
  } catch {}
}

export function checkSubscriptionRatings(): void {
  // Fires daily - handles Day 7 rating AND every Sunday rating for monthly subscriptions
  const now = new Date();
  const isSunday = now.getDay() === 0 && now.getHours() === 11;
  const isElevenAM = now.getHours() === 11 && now.getMinutes() < 5; // fire within 5min window
  try {
    const subs = DataService.get<any>("SUBSCRIPTIONS") || [];
    const customers = DataService.get<any>("CUSTOMERS") || [];
    const jobs = DataService.get<any>("JOBS") || [];

    subs.filter((s: any) => s.status === "Active").forEach((sub: any) => {
      const cust = customers.find((c: any) => c.customerId === sub.customerId);
      if (!cust?.phone) return;

      const startDate = new Date(sub.firstWashDate || sub.createdAt || sub.startDate || "");
      const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / 86400000);

      // Day 7 from subscription start - first rating request
      if (daysSinceStart === 7 && isElevenAM) {
        import("./whatsappService").then(ws => ws.sendRatingRequest({
          customerPhone: cust.phone,
          customerName: cust.firstName || "Customer",
          jobId: sub.subscriptionId,
          planLabel: sub.packageName || "Subscription",
        }));
        return;
      }

      // Every Sunday at 11 AM thereafter (day 8+)
      if (isSunday && daysSinceStart > 7) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);
        const washCount = jobs.filter((j: any) =>
          j.subscriptionId === sub.subscriptionId &&
          j.status === "Completed" &&
          new Date(j.completedAt || "") >= weekStart
        ).length;
        if (washCount > 0) {
          import("./whatsappService").then(ws => ws.sendWeeklyRatingRequest({
            customerPhone: cust.phone,
            customerName: cust.firstName || "Customer",
            subscriptionId: sub.subscriptionId,
            washCount,
          }));
        }
      }
    });
  } catch {}
}

// Keep old name as alias for backwards compatibility
export const checkSundayRatings = checkSubscriptionRatings;


/**
 * Washer acknowledgement check — runs periodically.
 * Fires alert to Supervisor + TSM + Admin + Super Admin if washer
 * has not acknowledged a job within the alert window:
 * - Urgent Wash: 50 minutes before slot
 * - Same-day (One-Time/Pack): 120 minutes before slot
 * - Daily subscription: 12 hours before slot
 */
export function checkWasherAcknowledgements(): void {
  try {
    const now = new Date();
    const jobs = DataService.get<any>("JOBS") || [];
    const employees = DataService.get<any>("EMPLOYEE_DATABASE_RECORDS") || [];

    jobs.filter((j: any) => j.status === "Assigned" && !j.washerAcknowledgedAt).forEach((job: any) => {
      const slotTime = new Date(job.scheduledDate || job.slotTime || "");
      if (!slotTime || isNaN(slotTime.getTime())) return;

      const minsToSlot = (slotTime.getTime() - now.getTime()) / 60000;

      // Determine alert window by service type
      const isUrgent = job.serviceType === "URGENT_WASH" || job.isUrgent;
      const isSameDay = job.serviceType === "ONE_TIME" || job.serviceType?.startsWith("PACK");
      const alertWindow = isUrgent ? 50 : isSameDay ? 120 : 720; // 720 = 12 hours for subscription

      if (minsToSlot > 0 && minsToSlot <= alertWindow) {
        // Check if alert already sent
        const alertKey = `ACK_ALERT_${job.jobId}`;
        if (localStorage.getItem(alertKey)) return;
        localStorage.setItem(alertKey, "1");

        const washer = employees.find((e: any) => e.id === job.washerId);
        const washerName = washer ? `${washer.firstName || ""} ${washer.lastName || ""}`.trim() : job.washerId || "Unknown";

        window.dispatchEvent(new CustomEvent("cc360:washer_unacknowledged", {
          detail: {
            jobId: job.jobId,
            washerId: job.washerId,
            washerName,
            supervisorId: job.supervisorId,
            customerId: job.customerId,
            slotTime: slotTime.toISOString(),
            minsToSlot: Math.round(minsToSlot),
            alertWindow,
            message: `Washer ${washerName} has not acknowledged Job ${job.jobId}. Slot in ${Math.round(minsToSlot)} minutes.`,
          }
        }));
      }
    });
  } catch {}
}

export const tatTrackingService = new TATTrackingService();
