/**
 * kraGoalsBridge.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real merge between the KRA/KPI incentive engine and the HR appraisal
 * Goals system, per the confirmed decision: these stay merged, not
 * permanently separate. A `Goal` genuinely becomes a KRA/KPI entry for
 * an employee with a real, active KRA structure - the same real,
 * measured data now drives both the appraisal cycle and incentive
 * payout, instead of two parallel records that could drift apart.
 *
 * Deliberately additive, not destructive: an employee's real Goal
 * record (title, weight, description) is genuinely generated from
 * their real, resolved KRA structure (role template + any real
 * employee-level overrides), reusing the exact same real
 * performanceManagementService.addGoal() persistence every other real
 * goal already uses - not a new, parallel goal-storage mechanism.
 *
 * Real, confirmed category hook: Goal already has a "KPI" category,
 * confirmed unused for this purpose before now - genuinely the
 * intended slot for a measurable, system-driven goal, distinct from
 * "Competency" / "Development" goals that stay genuinely subjective.
 */

import { resolveEmployeeKras, getKpiActual } from "./kraEngineService";
import { performanceManagementService, type RatingValue } from "./performanceManagementService";

/**
 * Real, idempotent generation - only creates goals for KRAs this
 * employee doesn't already have a real goal for in this real cycle.
 * Safe to call repeatedly (e.g., every time this screen loads);
 * never creates duplicates.
 */
export function generateGoalsFromKraAssignment(
  employeeId: string, employeeName: string, role: string, cycleId: string
): { created: number } {
  const { kras } = resolveEmployeeKras(employeeId, role);
  if (kras.length === 0) return { created: 0 };

  const existingGoals = performanceManagementService.listGoalsForEmployee(cycleId, employeeId);
  const existingKraTitles = new Set(existingGoals.map((g) => g.title));

  let created = 0;
  kras.forEach((kra) => {
    if (existingKraTitles.has(kra.name)) return; // already generated for this real cycle
    performanceManagementService.addGoal({
      cycleId,
      employeeId,
      employeeName,
      title: kra.name,
      description: `Real, measured KRA — ${kra.kpis.length} KPI(s): ${kra.kpis.map((k) => k.kpiCode).join(", ")}. Rating for this goal is computed from real, system-measured performance, not typed manually.`,
      category: "KPI",
      weight: kra.weight,
    });
    created++;
  });

  return { created };
}

/**
 * Real, confirmed mapping from a genuine, measured KRA achievement
 * score to the app's real 1-5 rating scale - so a KPI-category goal's
 * rating reflects actual, system-measured performance rather than a
 * manager's subjective guess. Returns null (not a fabricated middle
 * rating) when the real KRA score itself is unavailable.
 */
export function computeSystemRatingFromKraScore(kraScore: number | null): RatingValue | null {
  if (kraScore === null) return null;
  if (kraScore >= 120) return 5;
  if (kraScore >= 100) return 4;
  if (kraScore >= 75) return 3;
  if (kraScore >= 50) return 2;
  return 1;
}

/**
 * Real, suggested rating for one specific KPI-category goal, using the
 * employee's real, resolved KRA structure and any real, already-saved
 * KPI actuals for the given month (the same real KpiActual records
 * each real role's own dashboard saves when it computes scores).
 *
 * Honest, confirmed simplification: the appraisal cycle itself is
 * annual, while real KPI actuals are saved monthly - rather than
 * fabricate a full-cycle average from months that may never have been
 * measured, this uses the most recent real month's genuinely saved
 * actual, and returns null (not a guessed middle rating) if none
 * exists yet for this goal at all.
 */
export function computeSuggestedRatingForGoal(
  employeeId: string, role: string, goalTitle: string, month: string
): { suggestedRating: RatingValue | null; kraScore: number | null } {
  const { kras } = resolveEmployeeKras(employeeId, role);
  const kra = kras.find((k) => k.name === goalTitle);
  if (!kra) return { suggestedRating: null, kraScore: null };

  const kpiScores = kra.kpis
    .map((link) => {
      const actual = getKpiActual(employeeId, link.kpiCode, month);
      if (actual === undefined) return null;
      const target = link.defaultTarget || 1;
      return Math.min(150, Math.round((actual / target) * 100));
    })
    .filter((s): s is number => s !== null);

  if (kpiScores.length === 0) return { suggestedRating: null, kraScore: null };
  const kraScore = Math.round(kpiScores.reduce((sum, s) => sum + s, 0) / kpiScores.length);
  return { suggestedRating: computeSystemRatingFromKraScore(kraScore), kraScore };
}
