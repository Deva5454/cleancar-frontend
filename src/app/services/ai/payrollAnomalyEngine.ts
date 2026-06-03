/**
 * Payroll Anomaly Detection Engine (AI-based)
 *
 * Automatically detects and flags:
 * - Sudden salary spikes or drops
 * - Abnormal deductions or net pay
 * - Duplicate entries
 * - Cross-city anomalies
 * - Historical outliers
 *
 * Rules:
 * - Does NOT block payroll processing (only flags)
 * - Fully explainable (shows reasons)
 * - Works per employee + payroll run
 * - Lightweight (no UI slowdown)
 * - Extensible for future AI models
 */

import { logger } from "../logger";

// ========== TYPES ==========

export interface AnomalyResult {
  isAnomaly: boolean; // true if flagged as anomaly
  score: number; // 0-1 scale (0 = normal, 1 = severe anomaly)
  reasons: string[]; // Human-readable reasons
  severity: "low" | "medium" | "high"; // Risk level
  metadata?: {
    historicalAverage?: number;
    deviation?: number;
    deductionRatio?: number;
    similarEntries?: number;
  };
}

export interface PayrollEntryForDetection {
  payrollId?: string;
  employeeId: string;
  grossSalary: number;
  netSalary: number;
  deductions: number;
  cityId?: string;
  month?: string;
  createdAt?: string;
}

export interface PayrollRunAnomalyResult {
  isAnomaly: boolean;
  score: number;
  reasons: string[];
  severity: "low" | "medium" | "high";
  metadata?: {
    totalPayout: number;
    historicalAverage?: number;
    deviation?: number;
    employeeCount?: number;
    highRiskEmployees?: number;
  };
}

// ========== CONFIGURATION ==========

const ANOMALY_CONFIG = {
  // Salary deviation thresholds
  SALARY_SPIKE_THRESHOLD: 0.3, // 30% increase
  SALARY_DROP_THRESHOLD: 0.3, // 30% decrease
  EXTREME_SPIKE_THRESHOLD: 0.5, // 50% increase (high severity)
  EXTREME_DROP_THRESHOLD: 0.5, // 50% decrease (high severity)

  // Deduction thresholds
  HIGH_DEDUCTION_RATIO: 0.5, // Deductions > 50% of gross
  EXTREME_DEDUCTION_RATIO: 0.7, // Deductions > 70% of gross

  // Negative pay threshold
  NEGATIVE_PAY_THRESHOLD: 0, // Net salary < 0

  // History requirements
  MIN_HISTORY_FOR_COMPARISON: 2, // Need at least 2 months
  MAX_HISTORY_MONTHS: 6, // Look back 6 months max

  // High salary thresholds (without history)
  NEW_EMPLOYEE_HIGH_SALARY: 50000, // ₹50K+ for new employees
  VERY_HIGH_SALARY: 100000, // ₹100K+ is very high

  // Scoring weights
  WEIGHTS: {
    EXTREME_SPIKE: 0.5,
    SALARY_SPIKE: 0.4,
    SALARY_DROP: 0.3,
    HIGH_DEDUCTION: 0.2,
    EXTREME_DEDUCTION: 0.4,
    NEGATIVE_PAY: 0.5,
    NEW_HIGH_SALARY: 0.2,
    DUPLICATE: 0.6,
    CITY_MISMATCH: 0.3,
  },

  // Severity thresholds
  HIGH_SEVERITY_SCORE: 0.6, // >= 0.6 is high severity
  MEDIUM_SEVERITY_SCORE: 0.3, // >= 0.3 is medium severity
};

// ========== CORE DETECTION ENGINE ==========

/**
 * Calculate average salary from historical payroll
 */
const calculateHistoricalAverage = (history: PayrollEntryForDetection[]): number => {
  if (history.length === 0) return 0;
  const total = history.reduce((sum, entry) => sum + entry.grossSalary, 0);
  return total / history.length;
};

/**
 * Calculate standard deviation for outlier detection
 */
const calculateStandardDeviation = (history: PayrollEntryForDetection[]): number => {
  if (history.length === 0) return 0;
  const avg = calculateHistoricalAverage(history);
  const squaredDiffs = history.map((entry) => Math.pow(entry.grossSalary - avg, 2));
  const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / history.length;
  return Math.sqrt(variance);
};

/**
 * Detect salary spike or drop anomalies
 */
const detectSalaryDeviation = (
  current: PayrollEntryForDetection,
  history: PayrollEntryForDetection[]
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  if (history.length < ANOMALY_CONFIG.MIN_HISTORY_FOR_COMPARISON) {
    // Not enough history for comparison
    return { score: 0, reasons: [], metadata };
  }

  const avgSalary = calculateHistoricalAverage(history);
  const deviation = (current.grossSalary - avgSalary) / avgSalary;

  metadata.historicalAverage = Math.round(avgSalary);
  metadata.deviation = Math.round(deviation * 100); // As percentage

  // Check for salary spike
  if (deviation > ANOMALY_CONFIG.EXTREME_SPIKE_THRESHOLD) {
    reasons.push(
      `Salary increased ${Math.round(deviation * 100)}% from average ₹${Math.round(avgSalary)} (EXTREME)`
    );
    score += ANOMALY_CONFIG.WEIGHTS.EXTREME_SPIKE;
  } else if (deviation > ANOMALY_CONFIG.SALARY_SPIKE_THRESHOLD) {
    reasons.push(
      `Salary increased ${Math.round(deviation * 100)}% from average ₹${Math.round(avgSalary)}`
    );
    score += ANOMALY_CONFIG.WEIGHTS.SALARY_SPIKE;
  }

  // Check for salary drop
  if (deviation < -ANOMALY_CONFIG.EXTREME_DROP_THRESHOLD) {
    reasons.push(
      `Salary dropped ${Math.round(Math.abs(deviation) * 100)}% from average ₹${Math.round(avgSalary)} (EXTREME)`
    );
    score += ANOMALY_CONFIG.WEIGHTS.EXTREME_SPIKE; // Same weight as extreme spike
  } else if (deviation < -ANOMALY_CONFIG.SALARY_DROP_THRESHOLD) {
    reasons.push(
      `Salary dropped ${Math.round(Math.abs(deviation) * 100)}% from average ₹${Math.round(avgSalary)}`
    );
    score += ANOMALY_CONFIG.WEIGHTS.SALARY_DROP;
  }

  return { score, reasons, metadata };
};

/**
 * Detect abnormal deductions
 */
const detectAbnormalDeductions = (
  current: PayrollEntryForDetection
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  const deductionRatio = current.deductions / current.grossSalary;
  metadata.deductionRatio = Math.round(deductionRatio * 100); // As percentage

  // Extreme deduction ratio
  if (deductionRatio > ANOMALY_CONFIG.EXTREME_DEDUCTION_RATIO) {
    reasons.push(
      `Deductions (₹${current.deductions}) are ${Math.round(deductionRatio * 100)}% of gross salary (EXTREME)`
    );
    score += ANOMALY_CONFIG.WEIGHTS.EXTREME_DEDUCTION;
  } else if (deductionRatio > ANOMALY_CONFIG.HIGH_DEDUCTION_RATIO) {
    reasons.push(
      `Deductions (₹${current.deductions}) are ${Math.round(deductionRatio * 100)}% of gross salary`
    );
    score += ANOMALY_CONFIG.WEIGHTS.HIGH_DEDUCTION;
  }

  return { score, reasons, metadata };
};

/**
 * Detect negative net pay
 */
const detectNegativePay = (
  current: PayrollEntryForDetection
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  if (current.netSalary < ANOMALY_CONFIG.NEGATIVE_PAY_THRESHOLD) {
    reasons.push(`Negative net salary: ₹${current.netSalary} (deductions exceed gross)`);
    score += ANOMALY_CONFIG.WEIGHTS.NEGATIVE_PAY;
  }

  return { score, reasons, metadata };
};

/**
 * Detect new employee with high salary (insufficient history)
 */
const detectNewEmployeeHighSalary = (
  current: PayrollEntryForDetection,
  history: PayrollEntryForDetection[]
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  if (
    history.length < ANOMALY_CONFIG.MIN_HISTORY_FOR_COMPARISON &&
    current.grossSalary >= ANOMALY_CONFIG.NEW_EMPLOYEE_HIGH_SALARY
  ) {
    reasons.push(
      `High salary (₹${current.grossSalary}) with insufficient history (${history.length} months)`
    );
    score += ANOMALY_CONFIG.WEIGHTS.NEW_HIGH_SALARY;
  }

  return { score, reasons, metadata };
};

/**
 * Detect duplicate payroll entries (same employee, same month)
 */
const detectDuplicate = (
  current: PayrollEntryForDetection,
  allPayrolls: PayrollEntryForDetection[]
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  if (!current.month) {
    return { score: 0, reasons: [], metadata };
  }

  // Find similar entries (same employee, same month, different payrollId)
  const similarEntries = allPayrolls.filter(
    (entry) =>
      entry.employeeId === current.employeeId &&
      entry.month === current.month &&
      entry.payrollId !== current.payrollId
  );

  if (similarEntries.length > 0) {
    metadata.similarEntries = similarEntries.length;
    reasons.push(
      `Potential duplicate: ${similarEntries.length} other payroll entry(ies) found for same month`
    );
    score += ANOMALY_CONFIG.WEIGHTS.DUPLICATE;
  }

  return { score, reasons, metadata };
};

/**
 * Detect city mismatch (employee's city != payroll city)
 */
const detectCityMismatch = (
  current: PayrollEntryForDetection,
  employeeCity?: string
): { score: number; reasons: string[]; metadata: any } => {
  const reasons: string[] = [];
  let score = 0;
  let metadata: any = {};

  if (current.cityId && employeeCity && current.cityId !== employeeCity) {
    reasons.push(`City mismatch: Payroll city ${current.cityId} != Employee city ${employeeCity}`);
    score += ANOMALY_CONFIG.WEIGHTS.CITY_MISMATCH;
  }

  return { score, reasons, metadata };
};

/**
 * Calculate severity level based on anomaly score
 */
const calculateSeverity = (score: number): "low" | "medium" | "high" => {
  if (score >= ANOMALY_CONFIG.HIGH_SEVERITY_SCORE) return "high";
  if (score >= ANOMALY_CONFIG.MEDIUM_SEVERITY_SCORE) return "medium";
  return "low";
};

// ========== MAIN DETECTION FUNCTION ==========

/**
 * Detect payroll anomalies for a single employee entry
 *
 * @param current - Current payroll entry to check
 * @param history - Historical payroll entries for this employee
 * @param allPayrolls - All payroll entries (for duplicate detection)
 * @param employeeCity - Employee's assigned city (for city mismatch detection)
 * @returns Anomaly detection result
 */
export const detectPayrollAnomaly = (
  current: PayrollEntryForDetection,
  history: PayrollEntryForDetection[] = [],
  allPayrolls: PayrollEntryForDetection[] = [],
  employeeCity?: string
): AnomalyResult => {
  const allReasons: string[] = [];
  let totalScore = 0;
  const allMetadata: any = {};

  // Run all detection checks
  const deviationCheck = detectSalaryDeviation(current, history);
  totalScore += deviationCheck.score;
  allReasons.push(...deviationCheck.reasons);
  Object.assign(allMetadata, deviationCheck.metadata);

  const deductionCheck = detectAbnormalDeductions(current);
  totalScore += deductionCheck.score;
  allReasons.push(...deductionCheck.reasons);
  Object.assign(allMetadata, deductionCheck.metadata);

  const negativePayCheck = detectNegativePay(current);
  totalScore += negativePayCheck.score;
  allReasons.push(...negativePayCheck.reasons);

  const newHighSalaryCheck = detectNewEmployeeHighSalary(current, history);
  totalScore += newHighSalaryCheck.score;
  allReasons.push(...newHighSalaryCheck.reasons);

  const duplicateCheck = detectDuplicate(current, allPayrolls);
  totalScore += duplicateCheck.score;
  allReasons.push(...duplicateCheck.reasons);
  Object.assign(allMetadata, duplicateCheck.metadata);

  const cityMismatchCheck = detectCityMismatch(current, employeeCity);
  totalScore += cityMismatchCheck.score;
  allReasons.push(...cityMismatchCheck.reasons);

  // Cap score at 1.0
  totalScore = Math.min(totalScore, 1.0);

  const severity = calculateSeverity(totalScore);
  const isAnomaly = totalScore >= ANOMALY_CONFIG.MEDIUM_SEVERITY_SCORE;

  // Log high severity anomalies
  if (severity === "high") {
    logger.warn("High severity payroll anomaly detected", {
      employeeId: current.employeeId,
      score: totalScore,
      reasons: allReasons,
    });
  }

  return {
    isAnomaly,
    score: totalScore,
    reasons: allReasons,
    severity,
    metadata: allMetadata,
  };
};

// ========== RUN-LEVEL ANOMALY DETECTION ==========

export interface PayrollRunForDetection {
  payrollRunId: string;
  month: string;
  totalPayout: number;
  employeeCount: number;
  entries: PayrollEntryForDetection[];
}

/**
 * Detect anomalies at payroll run level (entire month's payroll)
 *
 * @param currentRun - Current payroll run to check
 * @param historicalRuns - Previous payroll runs for comparison
 * @returns Run-level anomaly result
 */
export const detectRunAnomaly = (
  currentRun: PayrollRunForDetection,
  historicalRuns: PayrollRunForDetection[] = []
): PayrollRunAnomalyResult => {
  const reasons: string[] = [];
  let score = 0;
  const metadata: any = {
    totalPayout: currentRun.totalPayout,
    employeeCount: currentRun.employeeCount,
  };

  // Check if we have enough history
  if (historicalRuns.length < ANOMALY_CONFIG.MIN_HISTORY_FOR_COMPARISON) {
    return {
      isAnomaly: false,
      score: 0,
      reasons: ["Insufficient historical data for run-level comparison"],
      severity: "low",
      metadata,
    };
  }

  // Calculate average total payout from history
  const avgPayout =
    historicalRuns.reduce((sum, run) => sum + run.totalPayout, 0) / historicalRuns.length;

  const deviation = (currentRun.totalPayout - avgPayout) / avgPayout;

  metadata.historicalAverage = Math.round(avgPayout);
  metadata.deviation = Math.round(deviation * 100);

  // Check for total payout spike
  if (deviation > 0.4) {
    // 40% increase in total payout
    reasons.push(
      `Total payout (₹${Math.round(currentRun.totalPayout / 1000)}K) is ${Math.round(deviation * 100)}% higher than average (₹${Math.round(avgPayout / 1000)}K)`
    );
    score += 0.5;
  }

  // Check for total payout drop
  if (deviation < -0.4) {
    // 40% decrease in total payout
    reasons.push(
      `Total payout (₹${Math.round(currentRun.totalPayout / 1000)}K) is ${Math.round(Math.abs(deviation) * 100)}% lower than average (₹${Math.round(avgPayout / 1000)}K)`
    );
    score += 0.4;
  }

  // Count high-risk employees in current run
  const highRiskEmployees = currentRun.entries.filter((entry) => {
    const anomaly = detectPayrollAnomaly(entry, [], currentRun.entries);
    return anomaly.severity === "high";
  }).length;

  if (highRiskEmployees > 0) {
    metadata.highRiskEmployees = highRiskEmployees;
    reasons.push(`${highRiskEmployees} employee(s) flagged as high-risk in this run`);
    score += 0.3;
  }

  const severity = calculateSeverity(score);
  const isAnomaly = score >= ANOMALY_CONFIG.MEDIUM_SEVERITY_SCORE;

  return {
    isAnomaly,
    score,
    reasons,
    severity,
    metadata,
  };
};

// ========== HELPER FUNCTIONS ==========

/**
 * Get anomaly summary for reporting
 */
export const getAnomalySummary = (anomaly: AnomalyResult): string => {
  if (!anomaly.isAnomaly) {
    return "No anomalies detected";
  }

  const scorePercent = Math.round(anomaly.score * 100);
  return `${anomaly.severity.toUpperCase()} RISK (${scorePercent}%): ${anomaly.reasons.join("; ")}`;
};

/**
 * Check if anomaly requires manual review
 */
export const requiresManualReview = (anomaly: AnomalyResult): boolean => {
  return anomaly.severity === "high" || anomaly.score >= 0.6;
};

/**
 * Get anomaly color for UI display
 */
export const getAnomalyColor = (severity: "low" | "medium" | "high"): string => {
  const colors = {
    low: "blue",
    medium: "yellow",
    high: "red",
  };
  return colors[severity];
};

/**
 * Get anomaly configuration (for debugging/testing)
 */
export const getAnomalyConfig = () => ANOMALY_CONFIG;
