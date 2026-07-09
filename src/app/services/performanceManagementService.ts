/**
 * Performance Management Service
 *
 * Real goal-setting -> self-appraisal -> manager-review -> calibration cycle,
 * replacing the operational KPI dashboard (PerformanceTracking.tsx, which
 * stays as-is for daily/monthly targets) with an actual appraisal workflow
 * that produces a locked Final Rating per employee per cycle, plus a
 * suggested increment % that Payroll/HR can read when doing salary revisions.
 */

export type CyclePhase =
  | "Goal Setting"
  | "Self Appraisal"
  | "Manager Review"
  | "Calibration"
  | "Finalized";

export type CycleStatus = "Active" | "Closed";

export interface PhaseWindow {
  start: string; // ISO date
  end: string;   // ISO date
}

export interface PerformanceCycle {
  id: string;
  name: string;           // e.g. "FY 2026-27 Annual Review"
  financialYear: string;  // e.g. "2026-27"
  currentPhase: CyclePhase;
  status: CycleStatus;
  phaseWindows: Record<CyclePhase, PhaseWindow>;
  createdBy: string;
  createdAt: string;
}

export type GoalCategory = "KPI" | "Competency" | "Development";
export type GoalStatus = "Draft" | "Pending Approval" | "Approved" | "Rejected";

export interface Goal {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  category: GoalCategory;
  weight: number; // % of overall rating, goals in a cycle should sum to ~100
  status: GoalStatus;
  managerComments?: string;
  createdAt: string;
  updatedAt: string;
}

/** 1-5 rating scale used consistently across self-appraisal, manager review, and calibration. */
export type RatingValue = 1 | 2 | 3 | 4 | 5;

export const RATING_LABELS: Record<RatingValue, string> = {
  1: "Needs Improvement",
  2: "Below Expectations",
  3: "Meets Expectations",
  4: "Exceeds Expectations",
  5: "Outstanding",
};

export interface GoalRating {
  goalId: string;
  rating: RatingValue;
  comments: string;
}

export type AppraisalStatus = "Draft" | "Submitted";

export interface SelfAppraisal {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  goalRatings: GoalRating[];
  overallComments: string;
  status: AppraisalStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManagerReview {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  managerId: string;
  managerName: string;
  goalRatings: GoalRating[];
  overallRating: RatingValue;
  overallComments: string;
  status: AppraisalStatus;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationRecord {
  id: string;
  cycleId: string;
  employeeId: string;
  employeeName: string;
  preCalibrationRating: RatingValue; // manager's overallRating, for reference
  finalRating: RatingValue;
  calibrationNotes: string;
  calibratedBy: string;
  calibratedAt: string;
}

export interface IncrementBand {
  rating: RatingValue;
  suggestedIncrementPercent: number;
}

// Default increment bands — HR-configurable in principle, sensible defaults for now.
export const DEFAULT_INCREMENT_BANDS: IncrementBand[] = [
  { rating: 1, suggestedIncrementPercent: 0 },
  { rating: 2, suggestedIncrementPercent: 2 },
  { rating: 3, suggestedIncrementPercent: 5 },
  { rating: 4, suggestedIncrementPercent: 8 },
  { rating: 5, suggestedIncrementPercent: 12 },
];

const KEYS = {
  CYCLES: "PMS_CYCLES",
  GOALS: "PMS_GOALS",
  SELF_APPRAISALS: "PMS_SELF_APPRAISALS",
  MANAGER_REVIEWS: "PMS_MANAGER_REVIEWS",
  CALIBRATIONS: "PMS_CALIBRATIONS",
  INCREMENT_BANDS: "PMS_INCREMENT_BANDS",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

class PerformanceManagementService {
  private subscribers: Set<() => void> = new Set();

  subscribe(cb: () => void): () => void {
    this.subscribers.add(cb);
    return () => this.subscribers.delete(cb);
  }
  private notify() {
    this.subscribers.forEach((cb) => cb());
  }

  // ── Cycles ────────────────────────────────────────────────────────────

  listCycles(): PerformanceCycle[] {
    return readJSON<PerformanceCycle[]>(KEYS.CYCLES, []);
  }

  getActiveCycle(): PerformanceCycle | undefined {
    return this.listCycles().find((c) => c.status === "Active");
  }

  getCycle(cycleId: string): PerformanceCycle | undefined {
    return this.listCycles().find((c) => c.id === cycleId);
  }

  createCycle(input: {
    name: string;
    financialYear: string;
    phaseWindows: Record<CyclePhase, PhaseWindow>;
    createdBy: string;
  }): PerformanceCycle {
    const cycle: PerformanceCycle = {
      id: `CYCLE_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: input.name,
      financialYear: input.financialYear,
      currentPhase: "Goal Setting",
      status: "Active",
      phaseWindows: input.phaseWindows,
      createdBy: input.createdBy,
      createdAt: new Date().toISOString(),
    };
    writeJSON(KEYS.CYCLES, [...this.listCycles(), cycle]);
    this.notify();
    return cycle;
  }

  advancePhase(cycleId: string): PerformanceCycle | null {
    const order: CyclePhase[] = ["Goal Setting", "Self Appraisal", "Manager Review", "Calibration", "Finalized"];
    const cycles = this.listCycles();
    const cycle = cycles.find((c) => c.id === cycleId);
    if (!cycle) return null;
    const idx = order.indexOf(cycle.currentPhase);
    if (idx < order.length - 1) {
      cycle.currentPhase = order[idx + 1];
      if (cycle.currentPhase === "Finalized") cycle.status = "Closed";
      writeJSON(KEYS.CYCLES, cycles);
      this.notify();
    }
    return cycle;
  }

  // ── Goals ─────────────────────────────────────────────────────────────

  listGoals(cycleId: string): Goal[] {
    return readJSON<Goal[]>(KEYS.GOALS, []).filter((g) => g.cycleId === cycleId);
  }

  listGoalsForEmployee(cycleId: string, employeeId: string): Goal[] {
    return this.listGoals(cycleId).filter((g) => g.employeeId === employeeId);
  }

  listGoalsPendingApproval(cycleId: string, employeeIds: string[]): Goal[] {
    return this.listGoals(cycleId).filter(
      (g) => g.status === "Pending Approval" && employeeIds.includes(g.employeeId)
    );
  }

  addGoal(input: Omit<Goal, "id" | "status" | "createdAt" | "updatedAt">): Goal {
    const all = readJSON<Goal[]>(KEYS.GOALS, []);
    const now = new Date().toISOString();
    const goal: Goal = {
      ...input,
      id: `GOAL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: "Pending Approval",
      createdAt: now,
      updatedAt: now,
    };
    writeJSON(KEYS.GOALS, [...all, goal]);
    this.notify();
    return goal;
  }

  approveGoal(goalId: string): void {
    const all = readJSON<Goal[]>(KEYS.GOALS, []);
    const goal = all.find((g) => g.id === goalId);
    if (!goal) return;
    goal.status = "Approved";
    goal.updatedAt = new Date().toISOString();
    writeJSON(KEYS.GOALS, all);
    this.notify();
  }

  rejectGoal(goalId: string, comments: string): void {
    const all = readJSON<Goal[]>(KEYS.GOALS, []);
    const goal = all.find((g) => g.id === goalId);
    if (!goal) return;
    goal.status = "Rejected";
    goal.managerComments = comments;
    goal.updatedAt = new Date().toISOString();
    writeJSON(KEYS.GOALS, all);
    this.notify();
  }

  // ── Self Appraisal ───────────────────────────────────────────────────

  getSelfAppraisal(cycleId: string, employeeId: string): SelfAppraisal | undefined {
    return readJSON<SelfAppraisal[]>(KEYS.SELF_APPRAISALS, []).find(
      (a) => a.cycleId === cycleId && a.employeeId === employeeId
    );
  }

  saveSelfAppraisal(
    input: Omit<SelfAppraisal, "id" | "status" | "createdAt" | "updatedAt">
  ): SelfAppraisal {
    const all = readJSON<SelfAppraisal[]>(KEYS.SELF_APPRAISALS, []);
    const existing = all.find((a) => a.cycleId === input.cycleId && a.employeeId === input.employeeId);
    const now = new Date().toISOString();
    if (existing && existing.status === "Draft") {
      Object.assign(existing, input, { updatedAt: now });
      writeJSON(KEYS.SELF_APPRAISALS, all);
      this.notify();
      return existing;
    }
    const record: SelfAppraisal = {
      ...input,
      id: `SELF_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };
    writeJSON(KEYS.SELF_APPRAISALS, [...all, record]);
    this.notify();
    return record;
  }

  submitSelfAppraisal(id: string): void {
    const all = readJSON<SelfAppraisal[]>(KEYS.SELF_APPRAISALS, []);
    const record = all.find((a) => a.id === id);
    if (!record) return;
    record.status = "Submitted";
    record.submittedAt = new Date().toISOString();
    record.updatedAt = record.submittedAt;
    writeJSON(KEYS.SELF_APPRAISALS, all);
    this.notify();
  }

  // ── Manager Review ───────────────────────────────────────────────────

  getManagerReview(cycleId: string, employeeId: string): ManagerReview | undefined {
    return readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []).find(
      (r) => r.cycleId === cycleId && r.employeeId === employeeId
    );
  }

  listManagerReviewsForTeam(cycleId: string, employeeIds: string[]): ManagerReview[] {
    return readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []).filter(
      (r) => r.cycleId === cycleId && employeeIds.includes(r.employeeId)
    );
  }

  saveManagerReview(
    input: Omit<ManagerReview, "id" | "status" | "createdAt" | "updatedAt">
  ): ManagerReview {
    const all = readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []);
    const existing = all.find((r) => r.cycleId === input.cycleId && r.employeeId === input.employeeId);
    const now = new Date().toISOString();
    if (existing && existing.status === "Draft") {
      Object.assign(existing, input, { updatedAt: now });
      writeJSON(KEYS.MANAGER_REVIEWS, all);
      this.notify();
      return existing;
    }
    const record: ManagerReview = {
      ...input,
      id: `MGR_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: "Draft",
      createdAt: now,
      updatedAt: now,
    };
    writeJSON(KEYS.MANAGER_REVIEWS, [...all, record]);
    this.notify();
    return record;
  }

  submitManagerReview(id: string): void {
    const all = readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []);
    const record = all.find((r) => r.id === id);
    if (!record) return;
    record.status = "Submitted";
    record.submittedAt = new Date().toISOString();
    record.updatedAt = record.submittedAt;
    writeJSON(KEYS.MANAGER_REVIEWS, all);
    this.notify();
  }

  // ── Calibration ──────────────────────────────────────────────────────

  /** Manager reviews submitted for a cycle that have not yet been calibrated. */
  getPendingCalibration(cycleId: string): ManagerReview[] {
    const reviews = readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []).filter(
      (r) => r.cycleId === cycleId && r.status === "Submitted"
    );
    const calibrated = new Set(
      readJSON<CalibrationRecord[]>(KEYS.CALIBRATIONS, [])
        .filter((c) => c.cycleId === cycleId)
        .map((c) => c.employeeId)
    );
    return reviews.filter((r) => !calibrated.has(r.employeeId));
  }

  getRatingDistribution(cycleId: string): Record<RatingValue, number> {
    const reviews = readJSON<ManagerReview[]>(KEYS.MANAGER_REVIEWS, []).filter(
      (r) => r.cycleId === cycleId && r.status === "Submitted"
    );
    const dist: Record<RatingValue, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => (dist[r.overallRating] += 1));
    return dist;
  }

  calibrate(
    cycleId: string,
    employeeId: string,
    employeeName: string,
    finalRating: RatingValue,
    calibrationNotes: string,
    calibratedBy: string
  ): CalibrationRecord {
    const review = this.getManagerReview(cycleId, employeeId);
    const all = readJSON<CalibrationRecord[]>(KEYS.CALIBRATIONS, []);
    const record: CalibrationRecord = {
      id: `CAL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      cycleId,
      employeeId,
      employeeName,
      preCalibrationRating: review?.overallRating || finalRating,
      finalRating,
      calibrationNotes,
      calibratedBy,
      calibratedAt: new Date().toISOString(),
    };
    writeJSON(KEYS.CALIBRATIONS, [...all.filter((c) => !(c.cycleId === cycleId && c.employeeId === employeeId)), record]);
    this.notify();
    return record;
  }

  getCalibrationRecords(cycleId: string): CalibrationRecord[] {
    return readJSON<CalibrationRecord[]>(KEYS.CALIBRATIONS, []).filter((c) => c.cycleId === cycleId);
  }

  // ── Final rating + increment linkage ────────────────────────────────

  /** The locked final rating for an employee in a cycle, or undefined if not yet calibrated. */
  getFinalRating(cycleId: string, employeeId: string): RatingValue | undefined {
    return this.getCalibrationRecords(cycleId).find((c) => c.employeeId === employeeId)?.finalRating;
  }

  getIncrementBands(): IncrementBand[] {
    return readJSON<IncrementBand[]>(KEYS.INCREMENT_BANDS, DEFAULT_INCREMENT_BANDS);
  }

  setIncrementBands(bands: IncrementBand[]): void {
    writeJSON(KEYS.INCREMENT_BANDS, bands);
    this.notify();
  }

  /**
   * The suggested increment % for an employee, derived from their locked
   * Final Rating for the given cycle. Returns undefined if the cycle hasn't
   * been calibrated for this employee yet — Payroll/HR should treat that as
   * "not ready for a revision decision" rather than defaulting to 0.
   */
  getSuggestedIncrement(cycleId: string, employeeId: string): number | undefined {
    const rating = this.getFinalRating(cycleId, employeeId);
    if (!rating) return undefined;
    const band = this.getIncrementBands().find((b) => b.rating === rating);
    return band?.suggestedIncrementPercent;
  }
}

export const performanceManagementService = new PerformanceManagementService();
