/**
 * ShiftRosterService
 *
 * Manages weekly shift rosters for Car Washers and Supervisors.
 * Rules:
 *   - 9-hour shift within 05:00–22:00 time band
 *   - HR uploads the weekly roster (CSV or manual)
 *   - Employees can request shift swaps (mutual agreement)
 *   - Absences are recorded with reason and escalate to supervisor/HR
 *   - All state persisted via DataService (city-namespaced)
 */

import { DataService } from "./DataService";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ShiftType = "Morning" | "Split" | "Evening";
export type SwapStatus = "Pending" | "Accepted" | "Rejected" | "Cancelled" | "Approved by Supervisor";
export type AbsenceType = "Sick" | "Personal" | "Emergency" | "No Show" | "Approved Leave";
export type AbsenceStatus = "Pending" | "Approved" | "Rejected" | "Escalated";
export type RosterStatus = "Draft" | "Published" | "Locked";

/** A single shift slot on the weekly roster */
export interface ShiftSlot {
  slotId:      string;         // "SLOT-YYYY-WW-EMP-DOW"
  rosterId:    string;         // FK to WeeklyRoster
  employeeId:  string;
  employeeName:string;
  role:        "Car Washer" | "Supervisor";
  cityId:      string;
  date:        string;         // YYYY-MM-DD
  dayOfWeek:   "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  shiftType:   ShiftType;
  startTime:   string;         // "05:00" — HH:MM 24h
  endTime:     string;         // "14:00" — 9 hours later
  breakMinutes:number;         // included in the 9h window, e.g. 60
  isWeekOff:   boolean;        // this day is their weekly off
  isHoliday:   boolean;        // public holiday
  supervisorId:string;         // which supervisor manages this washer on this day
  zone?:       string;         // e.g. "Adajan"
  // Runtime state (updated by swap/absence actions)
  effectiveEmployeeId?:   string;  // if swapped, shows the replacement
  effectiveEmployeeName?: string;
  swapId?:     string;         // FK to ShiftSwap if a swap applies
  absenceId?:  string;         // FK to ShiftAbsence if absent
}

/** The full week's roster for a city */
export interface WeeklyRoster {
  rosterId:    string;         // "ROSTER-CITY-YYYYWW"
  cityId:      string;
  weekStart:   string;         // ISO Monday date "2026-06-29"
  weekEnd:     string;         // ISO Sunday date "2026-07-05"
  weekLabel:   string;         // "29 Jun – 5 Jul 2026"
  status:      RosterStatus;
  publishedAt?: string;
  publishedBy?: string;
  lockedAt?:   string;
  slots:       ShiftSlot[];
  createdAt:   string;
  updatedAt:   string;
}

/** Shift swap request between two employees */
export interface ShiftSwap {
  swapId:          string;
  cityId:          string;
  // Requester
  requesterId:     string;
  requesterName:   string;
  requesterSlotId: string;
  requesterDate:   string;
  requesterShift:  string;     // display e.g. "05:00–14:00"
  // Target (the person they want to swap with)
  targetId:        string;
  targetName:      string;
  targetSlotId:    string;
  targetDate:      string;
  targetShift:     string;
  // Optional: coverage-only (requester takes a day off, target covers)
  swapType:        "Mutual Swap" | "Coverage Request" | "One-way Shift Handover";
  reason:          string;
  status:          SwapStatus;
  // Approvals
  targetAcceptedAt?: string;
  supervisorApprovedBy?: string;
  supervisorApprovedAt?: string;
  supervisorRejectionReason?: string;
  hrOverride?: boolean;        // HR can override supervisor rejection
  hrOverrideBy?: string;
  createdAt:       string;
  updatedAt:       string;
}

/** Absence record — when an employee can't make their shift */
export interface ShiftAbsence {
  absenceId:    string;
  cityId:       string;
  employeeId:   string;
  employeeName: string;
  role:         string;
  slotId:       string;
  date:         string;
  shiftStart:   string;
  shiftEnd:     string;
  absenceType:  AbsenceType;
  reason:       string;
  // Documentation
  proofAttached:boolean;
  proofNote?:   string;
  // Cover arranged?
  coverArranged:   boolean;
  coverEmployeeId?: string;
  coverEmployeeName?: string;
  // Approval chain
  status:           AbsenceStatus;
  supervisorId:     string;
  supervisorReviewedBy?: string;
  supervisorReviewedAt?: string;
  hrReviewedBy?:    string;
  hrReviewedAt?:    string;
  hrNote?:          string;
  // Penalty applied?
  penaltyApplied:   boolean;
  penaltyMinutes?:  number;    // minutes deducted from pay
  escalatedAt?:     string;    // if no-show escalated after N minutes
  createdAt:        string;
  updatedAt:        string;
}

/** HR notification about shift events */
export interface ShiftNotification {
  notifId:     string;
  targetRole:  "HR" | "Supervisor" | "Employee";
  targetId:    string;  // employeeId or "HR" or supervisorId
  type:        "swap_request" | "swap_accepted" | "swap_rejected" | "absence_reported"
             | "no_show_alert" | "roster_published" | "supervisor_approval_needed"
             | "swap_approved" | "coverage_needed";
  message:     string;
  relatedId?:  string;  // swapId or absenceId or rosterId
  read:        boolean;
  createdAt:   string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

export const SHIFT_RULES = {
  EARLIEST_START:  "05:00",   // 5 AM — no check-in before this
  LATEST_END:      "22:00",   // 10 PM — all shifts must end by this
  REQUIRED_HOURS:  9,         // exactly 9 working hours
  BREAK_MINUTES:   60,        // 1hr break included in 9h window
  LATE_GRACE_MINS: 10,        // 10 min grace after shift start before marking Late
  NO_SHOW_MINS:    60,        // 60 min after shift start → no-show alert if not checked in
  CHECK_IN_WINDOW_BEFORE_MINS: 30,  // can check in 30 min before shift start
} as const;

/** Standard shift templates */
export const SHIFT_TEMPLATES: Record<ShiftType, { start: string; end: string; label: string }> = {
  Morning: { start: "05:00", end: "14:00", label: "Morning (5 AM – 2 PM)" },
  Split:   { start: "09:00", end: "18:00", label: "Split (9 AM – 6 PM)"   },
  Evening: { start: "13:00", end: "22:00", label: "Evening (1 PM – 10 PM)"},
};

// ── Storage Keys ──────────────────────────────────────────────────────────────
const SK = {
  ROSTERS:       "SHIFT_ROSTERS",
  SWAPS:         "SHIFT_SWAPS",
  ABSENCES:      "SHIFT_ABSENCES",
  NOTIFICATIONS: "SHIFT_NOTIFICATIONS",
} as const;

// ── Service ───────────────────────────────────────────────────────────────────

class ShiftRosterService {

  // ── Rosters ──────────────────────────────────────────────────────────────────

  getRosters(cityId?: string): WeeklyRoster[] {
    try {
      const all = DataService.get<WeeklyRoster>(SK.ROSTERS);
      return cityId ? all.filter(r => r.cityId === cityId) : all;
    } catch { return []; }
  }

  getRosterForWeek(cityId: string, weekStart: string): WeeklyRoster | null {
    return this.getRosters(cityId).find(r => r.weekStart === weekStart) ?? null;
  }

  getCurrentRoster(cityId: string): WeeklyRoster | null {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);
    return this.getRosterForWeek(cityId, weekStart);
  }

  saveRoster(roster: WeeklyRoster) {
    const all = this.getRosters();
    const idx = all.findIndex(r => r.rosterId === roster.rosterId);
    idx >= 0 ? (all[idx] = roster) : all.unshift(roster);
    DataService.setAll(SK.ROSTERS, all);
  }

  publishRoster(rosterId: string, publishedBy: string) {
    const all = this.getRosters();
    const roster = all.find(r => r.rosterId === rosterId);
    if (!roster) return;
    roster.status      = "Published";
    roster.publishedAt = new Date().toISOString();
    roster.publishedBy = publishedBy;
    DataService.setAll(SK.ROSTERS, all);
    // Notify all employees on this roster
    roster.slots.forEach(slot => {
      if (!slot.isWeekOff) {
        this._pushNotif("Employee", slot.employeeId, "roster_published",
          `Your roster for ${roster.weekLabel} has been published. Your ${slot.dayOfWeek} shift: ${slot.startTime}–${slot.endTime}.`,
          roster.rosterId);
      }
    });
  }

  /** Create a blank roster for a week — HR fills in the slots */
  createBlankRoster(cityId: string, weekStart: string, employees: Array<{ id: string; name: string; role: "Car Washer" | "Supervisor"; supervisorId?: string; zone?: string }>): WeeklyRoster {
    const monday = new Date(weekStart + "T00:00:00");
    const days: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"> =
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekEnd = new Date(monday);
    weekEnd.setDate(monday.getDate() + 6);
    const rosterId = `ROSTER-${cityId}-${weekStart.replace(/-/g, "")}`;

    const slots: ShiftSlot[] = [];
    employees.forEach(emp => {
      days.forEach((dow, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
        const tpl = SHIFT_TEMPLATES.Morning;
        slots.push({
          slotId:       `${rosterId}-${emp.id}-${dow}`,
          rosterId,
          employeeId:   emp.id,
          employeeName: emp.name,
          role:         emp.role,
          cityId,
          date:         dateStr,
          dayOfWeek:    dow,
          shiftType:    "Morning",
          startTime:    tpl.start,
          endTime:      tpl.end,
          breakMinutes: SHIFT_RULES.BREAK_MINUTES,
          isWeekOff:    dow === "Sun",  // default: Sunday off
          isHoliday:    false,
          supervisorId: emp.supervisorId ?? "",
          zone:         emp.zone,
        });
      });
    });

    const roster: WeeklyRoster = {
      rosterId,
      cityId,
      weekStart,
      weekEnd:    weekEnd.toISOString().slice(0, 10),
      weekLabel:  `${monday.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${weekEnd.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`,
      status:     "Draft",
      slots,
      createdAt:  new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    this.saveRoster(roster);
    return roster;
  }

  /** Update a slot (shift type, times, week off flag) */
  updateSlot(rosterId: string, slotId: string, updates: Partial<ShiftSlot>) {
    const all = this.getRosters();
    const roster = all.find(r => r.rosterId === rosterId);
    if (!roster || roster.status === "Locked") return;
    const slot = roster.slots.find(s => s.slotId === slotId);
    if (slot) {
      Object.assign(slot, updates);
      if (updates.shiftType) {
        const tpl = SHIFT_TEMPLATES[updates.shiftType];
        slot.startTime = tpl.start;
        slot.endTime   = tpl.end;
      }
      roster.updatedAt = new Date().toISOString();
    }
    DataService.setAll(SK.ROSTERS, all);
  }

  /** Get today's slot for an employee */
  getTodaySlot(employeeId: string, cityId: string): ShiftSlot | null {
    const today = new Date().toISOString().slice(0, 10);
    const roster = this.getCurrentRoster(cityId);
    if (!roster) return null;
    const slot = roster.slots.find(s => s.employeeId === employeeId && s.date === today && !s.isWeekOff);
    // Apply effective (post-swap) employee
    return slot ?? null;
  }

  /** Get a week's slots for a specific employee */
  getWeekSlots(employeeId: string, cityId: string, weekStart?: string): ShiftSlot[] {
    const roster = weekStart
      ? this.getRosterForWeek(cityId, weekStart)
      : this.getCurrentRoster(cityId);
    if (!roster) return [];
    return roster.slots.filter(s => s.employeeId === employeeId || s.effectiveEmployeeId === employeeId);
  }

  // ── Shift Swaps ───────────────────────────────────────────────────────────────

  getSwaps(cityId?: string): ShiftSwap[] {
    try {
      const all = DataService.get<ShiftSwap>(SK.SWAPS);
      return cityId ? all.filter(s => s.cityId === cityId) : all;
    } catch { return []; }
  }

  saveSwap(swap: ShiftSwap) {
    const all = this.getSwaps();
    const idx = all.findIndex(s => s.swapId === swap.swapId);
    idx >= 0 ? (all[idx] = swap) : all.unshift(swap);
    DataService.setAll(SK.SWAPS, all);
  }

  /** Requester initiates a swap request */
  requestSwap(params: {
    cityId: string;
    requesterId: string; requesterName: string; requesterSlotId: string; requesterDate: string; requesterShift: string;
    targetId: string;    targetName: string;    targetSlotId: string;    targetDate: string;    targetShift: string;
    swapType: ShiftSwap["swapType"];
    reason: string;
  }): ShiftSwap {
    const swap: ShiftSwap = {
      swapId:    `SWAP-${Date.now()}`,
      cityId:    params.cityId,
      requesterId: params.requesterId,   requesterName: params.requesterName,
      requesterSlotId: params.requesterSlotId, requesterDate: params.requesterDate, requesterShift: params.requesterShift,
      targetId: params.targetId,         targetName: params.targetName,
      targetSlotId: params.targetSlotId, targetDate: params.targetDate,  targetShift: params.targetShift,
      swapType: params.swapType,
      reason:   params.reason,
      status:   "Pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.saveSwap(swap);
    // Notify target employee
    this._pushNotif("Employee", params.targetId, "swap_request",
      `${params.requesterName} wants to swap shifts with you. Their ${params.swapType}: ${params.requesterDate} (${params.requesterShift}) ↔ your ${params.targetDate} (${params.targetShift}). Reason: "${params.reason}"`,
      swap.swapId);
    // Notify supervisor
    this._pushNotif("Supervisor", "", "supervisor_approval_needed",
      `Shift swap request pending supervisor approval: ${params.requesterName} ↔ ${params.targetName}`,
      swap.swapId);
    return swap;
  }

  /** Target employee accepts the swap — goes to supervisor for approval */
  acceptSwap(swapId: string, targetId: string) {
    const swap = this.getSwaps().find(s => s.swapId === swapId);
    if (!swap || swap.targetId !== targetId) return;
    swap.status           = "Accepted";
    swap.targetAcceptedAt = new Date().toISOString();
    swap.updatedAt        = new Date().toISOString();
    this.saveSwap(swap);
    // Notify requester
    this._pushNotif("Employee", swap.requesterId, "swap_accepted",
      `${swap.targetName} accepted your shift swap request for ${swap.requesterDate}. Waiting for supervisor approval.`,
      swapId);
    // Notify supervisor for final approval
    const rosterId = swap.requesterSlotId.split("-EDB")[0];
    const allRosters = this.getRosters(swap.cityId);
    const supervisorSlot = allRosters.flatMap(r => r.slots)
      .find(s => s.slotId === swap.requesterSlotId);
    if (supervisorSlot?.supervisorId) {
      this._pushNotif("Supervisor", supervisorSlot.supervisorId, "supervisor_approval_needed",
        `Both ${swap.requesterName} and ${swap.targetName} agreed to swap shifts. Please approve: ${swap.requesterDate} ↔ ${swap.targetDate}.`,
        swapId);
    }
  }

  /** Target employee rejects the swap */
  rejectSwap(swapId: string, targetId: string, reason: string) {
    const swap = this.getSwaps().find(s => s.swapId === swapId);
    if (!swap || swap.targetId !== targetId) return;
    swap.status               = "Rejected";
    swap.supervisorRejectionReason = reason;
    swap.updatedAt            = new Date().toISOString();
    this.saveSwap(swap);
    this._pushNotif("Employee", swap.requesterId, "swap_rejected",
      `${swap.targetName} declined your shift swap request for ${swap.requesterDate}. Reason: "${reason}"`,
      swapId);
  }

  /** Supervisor approves the swap — updates roster slots */
  supervisorApproveSwap(swapId: string, supervisorId: string, supervisorName: string) {
    const swap = this.getSwaps().find(s => s.swapId === swapId);
    if (!swap || swap.status !== "Accepted") return;
    swap.status                = "Approved by Supervisor";
    swap.supervisorApprovedBy  = supervisorName;
    swap.supervisorApprovedAt  = new Date().toISOString();
    swap.updatedAt             = new Date().toISOString();
    this.saveSwap(swap);

    // Update roster slots to reflect the swap
    const allRosters = this.getRosters(swap.cityId);
    for (const roster of allRosters) {
      const reqSlot = roster.slots.find(s => s.slotId === swap.requesterSlotId);
      const tgtSlot = roster.slots.find(s => s.slotId === swap.targetSlotId);
      if (reqSlot && tgtSlot) {
        if (swap.swapType === "Mutual Swap") {
          // Full swap: each does the other's shift
          reqSlot.effectiveEmployeeId   = swap.targetId;
          reqSlot.effectiveEmployeeName = swap.targetName;
          reqSlot.swapId                = swapId;
          tgtSlot.effectiveEmployeeId   = swap.requesterId;
          tgtSlot.effectiveEmployeeName = swap.requesterName;
          tgtSlot.swapId                = swapId;
        } else {
          // Coverage: target covers requester's slot only
          reqSlot.effectiveEmployeeId   = swap.targetId;
          reqSlot.effectiveEmployeeName = swap.targetName;
          reqSlot.swapId                = swapId;
        }
        DataService.setAll(SK.ROSTERS, allRosters);
        break;
      }
    }
    // Notify both employees
    this._pushNotif("Employee", swap.requesterId, "swap_approved",
      `Your shift swap with ${swap.targetName} has been approved by ${supervisorName}.`, swapId);
    this._pushNotif("Employee", swap.targetId, "swap_approved",
      `Shift swap with ${swap.requesterName} approved by ${supervisorName}. Check your updated schedule.`, swapId);
  }

  supervisorRejectSwap(swapId: string, supervisorId: string, supervisorName: string, reason: string) {
    const swap = this.getSwaps().find(s => s.swapId === swapId);
    if (!swap) return;
    swap.status                    = "Rejected";
    swap.supervisorApprovedBy      = supervisorName;
    swap.supervisorApprovedAt      = new Date().toISOString();
    swap.supervisorRejectionReason = reason;
    swap.updatedAt                 = new Date().toISOString();
    this.saveSwap(swap);
    this._pushNotif("Employee", swap.requesterId, "swap_rejected",
      `Supervisor ${supervisorName} rejected the shift swap. Reason: "${reason}"`, swapId);
    this._pushNotif("Employee", swap.targetId, "swap_rejected",
      `Supervisor ${supervisorName} rejected the shift swap with ${swap.requesterName}.`, swapId);
  }

  // ── Absences ──────────────────────────────────────────────────────────────────

  getAbsences(cityId?: string): ShiftAbsence[] {
    try {
      const all = DataService.get<ShiftAbsence>(SK.ABSENCES);
      return cityId ? all.filter(a => a.cityId === cityId) : all;
    } catch { return []; }
  }

  saveAbsence(absence: ShiftAbsence) {
    const all = this.getAbsences();
    const idx = all.findIndex(a => a.absenceId === absence.absenceId);
    idx >= 0 ? (all[idx] = absence) : all.unshift(absence);
    DataService.setAll(SK.ABSENCES, all);
  }

  /** Employee self-reports an absence */
  reportAbsence(params: {
    cityId: string; employeeId: string; employeeName: string; role: string;
    slotId: string; date: string; shiftStart: string; shiftEnd: string;
    absenceType: AbsenceType; reason: string; proofNote?: string;
    coverEmployeeId?: string; coverEmployeeName?: string;
    supervisorId: string;
  }): ShiftAbsence {
    const absence: ShiftAbsence = {
      absenceId:    `ABS-${Date.now()}`,
      cityId:       params.cityId,
      employeeId:   params.employeeId,
      employeeName: params.employeeName,
      role:         params.role,
      slotId:       params.slotId,
      date:         params.date,
      shiftStart:   params.shiftStart,
      shiftEnd:     params.shiftEnd,
      absenceType:  params.absenceType,
      reason:       params.reason,
      proofAttached:!!params.proofNote,
      proofNote:    params.proofNote,
      coverArranged:!!params.coverEmployeeId,
      coverEmployeeId:   params.coverEmployeeId,
      coverEmployeeName: params.coverEmployeeName,
      status:       params.absenceType === "Approved Leave" ? "Approved" : "Pending",
      supervisorId: params.supervisorId,
      penaltyApplied: false,
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };
    this.saveAbsence(absence);
    // Notify supervisor
    this._pushNotif("Supervisor", params.supervisorId, "absence_reported",
      `${params.employeeName} reported ${params.absenceType} absence for ${params.date} (${params.shiftStart}–${params.shiftEnd}). ${params.coverArranged ? `Cover: ${params.coverEmployeeName}` : "No cover arranged yet."}`,
      absence.absenceId);
    // Also notify HR for all non-approved-leave absences
    if (params.absenceType !== "Approved Leave") {
      this._pushNotif("HR", "HR", "absence_reported",
        `${params.employeeName} (${params.role}) — ${params.absenceType} on ${params.date}. Supervisor ${params.supervisorId} notified.`,
        absence.absenceId);
    }
    return absence;
  }

  /** No-show auto-alert: call this after NO_SHOW_MINS from shift start */
  raiseNoShowAlert(slotId: string, cityId: string) {
    const allRosters = this.getRosters(cityId);
    const slot = allRosters.flatMap(r => r.slots).find(s => s.slotId === slotId);
    if (!slot) return;
    // Auto-create an absence record
    const absence: ShiftAbsence = {
      absenceId:     `ABS-NOSHOW-${Date.now()}`,
      cityId,
      employeeId:    slot.employeeId,
      employeeName:  slot.employeeName,
      role:          slot.role,
      slotId,
      date:          slot.date,
      shiftStart:    slot.startTime,
      shiftEnd:      slot.endTime,
      absenceType:   "No Show",
      reason:        "Auto-flagged: no check-in 60 minutes after shift start",
      proofAttached: false,
      coverArranged: false,
      status:        "Escalated",
      supervisorId:  slot.supervisorId,
      penaltyApplied: true,
      penaltyMinutes: 60,
      escalatedAt:   new Date().toISOString(),
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
    };
    this.saveAbsence(absence);
    // Escalate to supervisor AND HR
    this._pushNotif("Supervisor", slot.supervisorId, "no_show_alert",
      `🚨 NO SHOW: ${slot.employeeName} has not checked in. Shift started at ${slot.startTime}. Immediate action needed.`,
      absence.absenceId);
    this._pushNotif("HR", "HR", "no_show_alert",
      `🚨 NO SHOW: ${slot.employeeName} (${slot.role}) at ${slot.zone ?? "unknown zone"} — ${slot.date} ${slot.startTime} shift. Auto-escalated.`,
      absence.absenceId);
  }

  supervisorApproveAbsence(absenceId: string, supervisorName: string, note?: string) {
    const all = this.getAbsences();
    const abs = all.find(a => a.absenceId === absenceId);
    if (!abs) return;
    abs.status               = "Approved";
    abs.supervisorReviewedBy = supervisorName;
    abs.supervisorReviewedAt = new Date().toISOString();
    if (note) abs.hrNote     = note;
    abs.updatedAt            = new Date().toISOString();
    DataService.setAll(SK.ABSENCES, all);
    this._pushNotif("Employee", abs.employeeId, "swap_approved",
      `Your absence for ${abs.date} has been approved by your supervisor.`, absenceId);
  }

  hrReviewAbsence(absenceId: string, hrName: string, decision: "Approved" | "Rejected", note: string, penaltyMins?: number) {
    const all = this.getAbsences();
    const abs = all.find(a => a.absenceId === absenceId);
    if (!abs) return;
    abs.status           = decision;
    abs.hrReviewedBy     = hrName;
    abs.hrReviewedAt     = new Date().toISOString();
    abs.hrNote           = note;
    if (penaltyMins !== undefined) {
      abs.penaltyApplied  = penaltyMins > 0;
      abs.penaltyMinutes  = penaltyMins;
    }
    abs.updatedAt        = new Date().toISOString();
    DataService.setAll(SK.ABSENCES, all);
    this._pushNotif("Employee", abs.employeeId, "swap_approved",
      decision === "Approved"
        ? `HR approved your ${abs.absenceType} absence for ${abs.date}. ${penaltyMins ? `Note: ${penaltyMins} mins deducted.` : "No deduction."}`
        : `HR rejected your ${abs.absenceType} absence for ${abs.date}. Reason: ${note}`,
      absenceId);
  }

  // ── Check-in validation ───────────────────────────────────────────────────────

  /** Call this when an employee tries to check in — returns validation result */
  validateCheckIn(employeeId: string, cityId: string): {
    allowed: boolean;
    slot: ShiftSlot | null;
    minutesEarly: number;
    minutesLate: number;
    isWeekOff: boolean;
    message: string;
  } {
    const slot = this.getTodaySlot(employeeId, cityId);
    if (!slot) return { allowed: true, slot: null, minutesEarly: 0, minutesLate: 0, isWeekOff: false, message: "No roster assigned — check in allowed" };
    if (slot.isWeekOff) return { allowed: false, slot, minutesEarly: 0, minutesLate: 0, isWeekOff: true, message: `Today is your week-off (${slot.dayOfWeek})` };

    const now    = new Date();
    const today  = now.toISOString().slice(0, 10);
    const [sh, sm] = slot.startTime.split(":").map(Number);
    const shiftStart = new Date(`${today}T${slot.startTime}:00`);
    const earliest   = new Date(shiftStart.getTime() - SHIFT_RULES.CHECK_IN_WINDOW_BEFORE_MINS * 60000);

    const minsDiff = Math.round((now.getTime() - shiftStart.getTime()) / 60000);

    if (now < earliest) {
      const minsEarly = Math.round((earliest.getTime() - now.getTime()) / 60000);
      return { allowed: false, slot, minutesEarly: minsEarly, minutesLate: 0, isWeekOff: false,
        message: `Check-in opens at ${slot.startTime} (30 min before shift). ${minsEarly} min to go.` };
    }

    return {
      allowed: true, slot, minutesEarly: 0,
      minutesLate: Math.max(0, minsDiff - SHIFT_RULES.LATE_GRACE_MINS),
      isWeekOff: false,
      message: minsDiff > SHIFT_RULES.LATE_GRACE_MINS ? `Late by ${Math.max(0, minsDiff - SHIFT_RULES.LATE_GRACE_MINS)} min` : "On time ✓",
    };
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  getNotifications(targetId: string): ShiftNotification[] {
    try {
      const all = DataService.get<ShiftNotification>(SK.NOTIFICATIONS);
      return all.filter(n => n.targetId === targetId || (n.targetRole === "HR" && targetId === "HR"))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 50);
    } catch { return []; }
  }

  markRead(notifId: string) {
    const all = DataService.get<ShiftNotification>(SK.NOTIFICATIONS);
    const n = all.find(n => n.notifId === notifId);
    if (n) { n.read = true; DataService.setAll(SK.NOTIFICATIONS, all); }
  }

  getUnreadCount(targetId: string): number {
    return this.getNotifications(targetId).filter(n => !n.read).length;
  }

  private _pushNotif(targetRole: ShiftNotification["targetRole"], targetId: string, type: ShiftNotification["type"], message: string, relatedId?: string) {
    try {
      const all = DataService.get<ShiftNotification>(SK.NOTIFICATIONS);
      all.unshift({ notifId: `SN-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, targetRole, targetId, type, message, relatedId, read: false, createdAt: new Date().toISOString() });
      DataService.setAll(SK.NOTIFICATIONS, all.slice(0, 200));
    } catch {}
  }
}

export const shiftRosterService = new ShiftRosterService();
