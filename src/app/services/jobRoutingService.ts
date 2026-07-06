/**
 * JobRoutingService
 *
 * Smart job routing for incoming jobs:
 * 1. Find the supervisor ON DUTY at the job's time slot
 * 2. From that supervisor's active washers, find available washers
 *    whose shift doesn't end within 30 min of the job time
 * 3. Route the job to the on-duty supervisor's queue
 * 4. Supervisor assigns a washer from the eligible list
 *
 * Also handles:
 * - New washer onboarding (added to roster immediately)
 * - Washer/supervisor replacement (deactivate old, activate new)
 * - Roster-aware availability checks
 */

import { DataService } from "./DataService";
import { shiftRosterService, SHIFT_RULES } from "./shiftRosterService";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DutyStatus {
  employeeId:   string;
  employeeName: string;
  role:         string;
  isOnDuty:     boolean;
  shiftStart?:  string;
  shiftEnd?:    string;
  shiftType?:   string;
  minutesIntoShift?: number;
  minutesUntilShiftEnd?: number;
  isWeekOff:    boolean;
  isAbsent:     boolean;
  absenceType?: string;
  coverBy?:     string;
}

export interface EligibleWasher {
  employeeId:       string;
  employeeName:     string;
  shiftEnd:         string;
  minutesRemaining: number;
  currentJobCount:  number;
  zone?:            string;
  isAvailable:      boolean;
  unavailableReason?: string;
}

export interface JobRoutingResult {
  supervisorId:   string;
  supervisorName: string;
  supervisorOnDuty: boolean;
  eligibleWashers:  EligibleWasher[];
  ineligibleWashers: Array<{ employeeId: string; employeeName: string; reason: string }>;
  routingNote:    string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function nowMins(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function getEmployees(cityId: string) {
  try {
    const all = DataService.get<any>("EMPLOYEES");
    return all.filter((e: any) =>
      (e.cityId === cityId || e.workLocation === cityId || !e.cityId)
      && e.status !== "Terminated"
    );
  } catch { return []; }
}

// ── Service ────────────────────────────────────────────────────────────────────

class JobRoutingService {

  /**
   * Get duty status for any employee right now.
   * Checks shift roster → validates check-in window → checks absences.
   */
  getDutyStatus(employeeId: string, cityId: string, atTimeHHMM?: string): DutyStatus {
    const employees   = getEmployees(cityId);
    const emp         = employees.find((e: any) => (e.id ?? e.employeeId) === employeeId);
    const empName     = emp ? (emp.fullName ?? `${emp.firstName} ${emp.lastName}`) : employeeId;
    const role        = emp?.role ?? "Car Washer";
    const atMins      = atTimeHHMM ? timeToMins(atTimeHHMM) : nowMins();

    // Check today's slot
    const slot = shiftRosterService.getTodaySlot(employeeId, cityId);

    if (!slot || slot.isWeekOff) {
      return { employeeId, employeeName: empName, role, isOnDuty: false,
        isWeekOff: true, isAbsent: false };
    }

    if (slot.isHoliday) {
      return { employeeId, employeeName: empName, role, isOnDuty: false,
        isWeekOff: false, isAbsent: false, shiftStart: slot.startTime, shiftEnd: slot.endTime };
    }

    // Check if absent
    const today = new Date().toISOString().slice(0, 10);
    const absence = shiftRosterService.getAbsences(cityId)
      .find(a => a.employeeId === employeeId && a.date === today &&
        (a.status === "Approved" || a.status === "Escalated" || a.absenceType === "No Show"));

    if (absence) {
      return { employeeId, employeeName: empName, role, isOnDuty: false,
        isWeekOff: false, isAbsent: true, absenceType: absence.absenceType,
        coverBy: absence.coverEmployeeName,
        shiftStart: slot.startTime, shiftEnd: slot.endTime };
    }

    const startMins = timeToMins(slot.startTime);
    const endMins   = timeToMins(slot.endTime);
    const checkInWindowStart = startMins - SHIFT_RULES.CHECK_IN_WINDOW_BEFORE_MINS;

    const isOnDuty = atMins >= checkInWindowStart && atMins < endMins;

    return {
      employeeId,
      employeeName:         empName,
      role,
      isOnDuty,
      shiftStart:           slot.startTime,
      shiftEnd:             slot.endTime,
      shiftType:            slot.shiftType,
      minutesIntoShift:     Math.max(0, atMins - startMins),
      minutesUntilShiftEnd: Math.max(0, endMins - atMins),
      isWeekOff:            false,
      isAbsent:             false,
    };
  }

  /**
   * Find which supervisor is on duty right now (or at a given time).
   * If multiple supervisors are on duty, returns the one with fewest active jobs.
   */
  getOnDutySupervisor(cityId: string, atTimeHHMM?: string): DutyStatus | null {
    const employees  = getEmployees(cityId);
    const supervisors = employees.filter((e: any) => e.role === "Supervisor");

    const onDuty = supervisors
      .map((s: any) => this.getDutyStatus(s.id ?? s.employeeId, cityId, atTimeHHMM))
      .filter(d => d.isOnDuty);

    if (onDuty.length === 0) return null;
    if (onDuty.length === 1) return onDuty[0];

    // Tie-break: supervisor with fewest unassigned jobs in their queue
    const jobs = this._getJobsToday(cityId);
    const withLoad = onDuty.map(s => ({
      ...s,
      load: jobs.filter((j: any) => j.supervisorId === s.employeeId &&
        ["Unassigned", "Assigned"].includes(j.status)).length,
    }));
    withLoad.sort((a, b) => a.load - b.load);
    return withLoad[0];
  }

  /**
   * Get all supervisors on duty right now with their status.
   */
  getAllSupervisorsOnDuty(cityId: string, atTimeHHMM?: string): DutyStatus[] {
    const employees  = getEmployees(cityId);
    return employees
      .filter((e: any) => e.role === "Supervisor")
      .map((s: any) => this.getDutyStatus(s.id ?? s.employeeId, cityId, atTimeHHMM))
      .filter(d => d.isOnDuty);
  }

  /**
   * Core routing function.
   * Given a job's time slot, find the on-duty supervisor and eligible washers.
   * A washer is eligible if:
   *   - Their shift doesn't end within 30 min of the job's time slot
   *   - They are not absent
   *   - Their shift covers the entire job (assumes ~45 min per wash)
   */
  routeJob(cityId: string, jobTimeSlot: string, jobArea?: string): JobRoutingResult {
    // 1. Find on-duty supervisor
    const supervisor = this.getOnDutySupervisor(cityId, jobTimeSlot);

    if (!supervisor) {
      return {
        supervisorId:    "",
        supervisorName:  "",
        supervisorOnDuty: false,
        eligibleWashers:   [],
        ineligibleWashers: [],
        routingNote: `No supervisor is on duty at ${jobTimeSlot}. Job will be queued for next available supervisor.`,
      };
    }

    // 2. Get all washers in the city
    const employees = getEmployees(cityId);
    const washers   = employees.filter((e: any) =>
      ["Car Washer", "Car Washer Full Time", "Car Washer Part Time"].includes(e.role)
    );

    const jobMins     = timeToMins(jobTimeSlot);
    const jobs        = this._getJobsToday(cityId);
    const eligible:    EligibleWasher[] = [];
    const ineligible:  Array<{ employeeId: string; employeeName: string; reason: string }> = [];

    washers.forEach((washer: any) => {
      const wId   = washer.id ?? washer.employeeId;
      const wName = washer.fullName ?? `${washer.firstName} ${washer.lastName}`;
      const duty  = this.getDutyStatus(wId, cityId, jobTimeSlot);
      const currentJobCount = jobs.filter((j: any) => j.washerId === wId &&
        j.scheduledDate === new Date().toISOString().slice(0, 10) &&
        ["Assigned", "Acknowledged", "In Progress"].includes(j.status)).length;

      if (duty.isWeekOff) {
        ineligible.push({ employeeId: wId, employeeName: wName, reason: "Week off today" });
        return;
      }
      if (duty.isAbsent) {
        ineligible.push({ employeeId: wId, employeeName: wName,
          reason: `Absent (${duty.absenceType})${duty.coverBy ? ` — covered by ${duty.coverBy}` : ""}` });
        return;
      }
      if (!duty.isOnDuty || !duty.shiftEnd) {
        ineligible.push({ employeeId: wId, employeeName: wName,
          reason: duty.shiftStart ? `Not on duty at ${jobTimeSlot}` : "No shift scheduled" });
        return;
      }

      const shiftEndMins    = timeToMins(duty.shiftEnd);
      const minsUntilEnd    = shiftEndMins - jobMins;

      if (minsUntilEnd < SHIFT_RULES.JOB_CUTOFF_BEFORE_END_MINS) {
        ineligible.push({ employeeId: wId, employeeName: wName,
          reason: `Shift ends in ${minsUntilEnd} min — needs ${SHIFT_RULES.JOB_CUTOFF_BEFORE_END_MINS} min minimum` });
        return;
      }

      eligible.push({
        employeeId:       wId,
        employeeName:     wName,
        shiftEnd:         duty.shiftEnd,
        minutesRemaining: minsUntilEnd,
        currentJobCount,
        zone:             washer.zone ?? washer.area,
        isAvailable:      true,
      });
    });

    // Sort eligible: fewest current jobs first, then by zone match
    eligible.sort((a, b) => {
      const zoneMatch = (w: EligibleWasher) =>
        jobArea && w.zone?.toLowerCase().includes(jobArea.toLowerCase()) ? 0 : 1;
      return a.currentJobCount - b.currentJobCount || zoneMatch(a) - zoneMatch(b);
    });

    return {
      supervisorId:    supervisor.employeeId,
      supervisorName:  supervisor.employeeName,
      supervisorOnDuty: true,
      eligibleWashers:  eligible,
      ineligibleWashers: ineligible,
      routingNote: eligible.length > 0
        ? `Routed to ${supervisor.employeeName}. ${eligible.length} washer(s) available. Top pick: ${eligible[0].employeeName}.`
        : `Routed to ${supervisor.employeeName} but NO washers available at ${jobTimeSlot}. Manual assignment needed.`,
    };
  }

  /**
   * Onboard a new washer or supervisor.
   * Adds to the current week's roster immediately with a default Morning shift.
   */
  onboardEmployee(params: {
    cityId:      string;
    employeeId:  string;
    employeeName:string;
    role:        "Car Washer" | "Supervisor";
    supervisorId?:string;
    zone?:        string;
    joiningDate:  string;
    defaultShift: "Morning" | "Split" | "Evening";
    weekOffDay:   "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  }) {
    const cityId = params.cityId;

    // Ensure current week roster exists
    const today    = new Date();
    const monday   = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const weekStart = monday.toISOString().slice(0, 10);

    let roster = shiftRosterService.getRosterForWeek(cityId, weekStart);
    if (!roster) {
      roster = shiftRosterService.createBlankRoster(cityId, weekStart, []);
    }

    // Add 7 slots for this employee (one per day)
    const DOW: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"> =
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const SHIFT_TEMPLATES_MAP = {
      Morning: { start: "05:00", end: "14:00" },
      Split:   { start: "09:00", end: "18:00" },
      Evening: { start: "13:00", end: "22:00" },
    };
    const tpl = SHIFT_TEMPLATES_MAP[params.defaultShift];

    DOW.forEach((dow, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      // Don't add if joining date is after this date
      if (dateStr < params.joiningDate) return;

      roster!.slots.push({
        slotId:        `${roster!.rosterId}-${params.employeeId}-${dow}`,
        rosterId:      roster!.rosterId,
        employeeId:    params.employeeId,
        employeeName:  params.employeeName,
        role:          params.role,
        cityId,
        date:          dateStr,
        dayOfWeek:     dow,
        shiftType:     params.defaultShift,
        startTime:     tpl.start,
        endTime:       tpl.end,
        breakMinutes:  60,
        isWeekOff:     dow === params.weekOffDay,
        isHoliday:     false,
        supervisorId:  params.supervisorId ?? "",
        zone:          params.zone,
      });
    });

    shiftRosterService.saveRoster(roster);

    // Push notification to HR
    const notifications = DataService.get<any>("SHIFT_NOTIFICATIONS");
    notifications.unshift({
      notifId:    `SN-ONBOARD-${Date.now()}`,
      targetRole: "HR",
      targetId:   "HR",
      type:       "roster_published",
      message:    `New ${params.role} ${params.employeeName} added to roster from ${params.joiningDate}. ${params.defaultShift} shift, ${params.weekOffDay} off.`,
      read:       false,
      createdAt:  new Date().toISOString(),
    });
    DataService.setAll("SHIFT_NOTIFICATIONS", notifications);

    console.log(`[JobRouting] Onboarded ${params.employeeName} (${params.role}) to ${weekStart} roster`);
  }

  /**
   * Replace an employee (old leaves / new joins on same day).
   * Keeps old employee's historical records, transfers their
   * remaining slots to the new employee.
   */
  replaceEmployee(params: {
    cityId:          string;
    outgoingId:      string;
    incomingId:      string;
    incomingName:    string;
    incomingRole:    "Car Washer" | "Supervisor";
    effectiveDate:   string;
    supervisorId?:   string;
    zone?:           string;
    defaultShift:    "Morning" | "Split" | "Evening";
    weekOffDay:      "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  }) {
    const rosters = shiftRosterService.getRosters(params.cityId);
    rosters.forEach(roster => {
      roster.slots.forEach(slot => {
        if (slot.employeeId === params.outgoingId && slot.date >= params.effectiveDate) {
          slot.employeeId    = params.incomingId;
          slot.employeeName  = params.incomingName;
          slot.supervisorId  = params.supervisorId ?? slot.supervisorId;
          slot.zone          = params.zone ?? slot.zone;
          slot.shiftType     = params.defaultShift;
          const TPLS = { Morning:{start:"05:00",end:"14:00"}, Split:{start:"09:00",end:"18:00"}, Evening:{start:"13:00",end:"22:00"} };
          const tpl  = TPLS[params.defaultShift];
          slot.startTime     = tpl.start;
          slot.endTime       = tpl.end;
          slot.isWeekOff     = slot.dayOfWeek === params.weekOffDay;
        }
      });
      shiftRosterService.saveRoster(roster);
    });

    console.log(`[JobRouting] Replaced ${params.outgoingId} with ${params.incomingName} from ${params.effectiveDate}`);
  }

  /**
   * Check if a specific washer is eligible for a new job right now.
   * Used by supervisor assign panel before confirming assignment.
   */
  isWasherEligibleForJob(washerId: string, cityId: string, jobTimeHHMM: string): {
    eligible: boolean;
    reason: string;
    minutesRemaining: number;
  } {
    const duty = this.getDutyStatus(washerId, cityId, jobTimeHHMM);

    if (duty.isWeekOff)     return { eligible: false, reason: "Week off today", minutesRemaining: 0 };
    if (duty.isAbsent)      return { eligible: false, reason: `Absent: ${duty.absenceType}`, minutesRemaining: 0 };
    if (!duty.isOnDuty)     return { eligible: false, reason: `Not on duty at ${jobTimeHHMM}`, minutesRemaining: 0 };
    if (!duty.shiftEnd)     return { eligible: false, reason: "No shift end time", minutesRemaining: 0 };

    const minsRemaining = duty.minutesUntilShiftEnd ?? 0;
    if (minsRemaining < SHIFT_RULES.JOB_CUTOFF_BEFORE_END_MINS) {
      return {
        eligible: false,
        reason:   `Shift ends in ${minsRemaining} min. Need ${SHIFT_RULES.JOB_CUTOFF_BEFORE_END_MINS} min minimum.`,
        minutesRemaining: minsRemaining,
      };
    }

    return { eligible: true, reason: `On duty until ${duty.shiftEnd} (${minsRemaining} min remaining)`, minutesRemaining: minsRemaining };
  }

  private _getJobsToday(cityId: string): any[] {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const jobs  = JSON.parse(localStorage.getItem(`cleancar_${cityId}_jobs`) || "[]");
      return jobs.filter((j: any) => j.scheduledDate === today);
    } catch { return []; }
  }
}

// ── Add missing constant ───────────────────────────────────────────────────────
// Extend SHIFT_RULES with job cutoff
(SHIFT_RULES as any).JOB_CUTOFF_BEFORE_END_MINS = 30;

export const jobRoutingService = new JobRoutingService();
