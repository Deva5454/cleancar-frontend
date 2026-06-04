/**
 * AI Role Suggestion Engine (MC-12)
 *
 * Intelligent role assignment based on employee performance metrics
 * Provides data-driven recommendations for promotions and role changes
 *
 * USAGE:
 * ```typescript
 * const suggestion = suggestRole(metrics);
 * if (suggestion.confidence > 80 && suggestion.readyForPromotion) {
 *   // Show promotion recommendation to HR
 * }
 * ```
 */

import type {
  EmployeeMetrics,
  RoleSuggestion,
  RoleRequirements,
  PerformanceAlert,
} from "../types/employeeMetrics";

// ========== ROLE REQUIREMENT PROFILES ==========

/**
 * Define minimum requirements for each role
 * These profiles determine promotion eligibility
 */
const ROLE_PROFILES: Record<string, RoleRequirements> = {
  "Car Washer": {
    role: "Car Washer",
    minJobsCompleted: 0,
    minCustomerRating: 0,
    minAttendanceRate: 60,
    maxErrorRate: 30,
  },

  Supervisor: {
    role: "Supervisor",
    minJobsCompleted: 100,          // Must have completed at least 100 jobs
    minCustomerRating: 4.0,         // Minimum 4.0/5.0 rating
    maxErrorRate: 10,               // Maximum 10% error rate
    minAttendanceRate: 85,          // Minimum 85% attendance
    minCompletionRate: 90,          // Minimum 90% completion rate
    minDaysWorked: 90,              // At least 3 months experience
    requiresLowComplaintRate: true,
    maxLateCount: 10,               // Maximum 10 late check-ins
  },

  "Operations Manager": {
    role: "Operations Manager",
    minJobsCompleted: 200,          // Significant field experience
    minCustomerRating: 4.3,         // High customer satisfaction
    maxErrorRate: 5,                // Very low error tolerance
    minAttendanceRate: 90,          // Excellent attendance
    minCompletionRate: 95,
    minDaysWorked: 180,             // At least 6 months experience
    requiresTeamExperience: true,
    minTeamSize: 5,                 // Must have managed at least 5 people
    requiresHighAccuracy: true,
  },

  "Sr Operations Manager": {
    role: "Sr Operations Manager",
    minJobsCompleted: 500,
    minCustomerRating: 4.5,
    maxErrorRate: 3,
    minAttendanceRate: 95,
    minCompletionRate: 95,
    minDaysWorked: 365,             // At least 1 year experience
    requiresTeamExperience: true,
    minTeamSize: 10,
    requiresHighAccuracy: true,
  },

  TSE: {
    role: "TSE",
    minJobsCompleted: 50,           // Sales calls/conversions
    minCustomerRating: 3.5,
    minAttendanceRate: 80,
    minDaysWorked: 30,
  },

  TSM: {
    role: "TSM",
    minJobsCompleted: 200,          // Sales conversions
    minCustomerRating: 4.0,
    minAttendanceRate: 85,
    minDaysWorked: 180,
    requiresTeamExperience: true,
    minTeamSize: 3,
  },

  CCE: {
    role: "CCE",
    minJobsCompleted: 50,           // Complaint resolutions
    minCustomerRating: 4.0,
    minAttendanceRate: 80,
    maxLateCount: 15,
  },

  "Store Manager": {
    role: "Store Manager",
    minDaysWorked: 90,
    minAttendanceRate: 85,
    requiresHighAccuracy: true,
    maxErrorRate: 5,
  },

  Accounts: {
    role: "Accounts",
    minDaysWorked: 180,
    minAttendanceRate: 90,
    requiresHighAccuracy: true,
    maxErrorRate: 1,                // Finance requires extreme accuracy
  },

  HR: {
    role: "HR",
    minDaysWorked: 180,
    minAttendanceRate: 85,
    requiresTeamExperience: true,
  },
};

// ========== SCORING FUNCTIONS ==========

/**
 * Calculate overall performance score (0-100)
 */
export function calculatePerformanceScore(metrics: EmployeeMetrics): number {
  const weights = {
    completionRate: 0.25,
    customerRating: 0.25,
    attendanceRate: 0.20,
    errorRate: 0.15,          // Inverted (lower is better)
    productivity: 0.15,        // Jobs per day
  };

  // Normalize customer rating to 0-100 scale
  const ratingScore = (metrics.customerRating / 5) * 100;

  // Calculate error score (inverted - lower error = higher score)
  const errorScore = Math.max(0, 100 - metrics.errorRate);

  // Calculate productivity score
  const avgJobsPerDay = metrics.totalDaysWorked > 0
    ? metrics.jobsCompleted / metrics.totalDaysWorked
    : 0;
  const productivityScore = Math.min(100, avgJobsPerDay * 10); // 10 jobs/day = 100%

  const score =
    weights.completionRate * metrics.completionRate +
    weights.customerRating * ratingScore +
    weights.attendanceRate * metrics.attendanceRate +
    weights.errorRate * errorScore +
    weights.productivity * productivityScore;

  return Math.round(Math.min(100, Math.max(0, score)));
}

/**
 * Calculate growth potential (0-100)
 * Measures trajectory and improvement potential
 */
export function calculateGrowthPotential(metrics: EmployeeMetrics): number {
  const factors = [];

  // High customer rating indicates strong growth potential
  if (metrics.customerRating >= 4.5) factors.push(30);
  else if (metrics.customerRating >= 4.0) factors.push(20);
  else if (metrics.customerRating >= 3.5) factors.push(10);

  // Low error rate indicates reliability
  if (metrics.errorRate <= 5) factors.push(25);
  else if (metrics.errorRate <= 10) factors.push(15);
  else if (metrics.errorRate <= 15) factors.push(5);

  // Excellent attendance shows commitment
  if (metrics.attendanceRate >= 95) factors.push(25);
  else if (metrics.attendanceRate >= 90) factors.push(15);
  else if (metrics.attendanceRate >= 80) factors.push(5);

  // High completion rate shows efficiency
  if (metrics.completionRate >= 95) factors.push(20);
  else if (metrics.completionRate >= 90) factors.push(10);

  const potential = factors.reduce((sum, val) => sum + val, 0);
  return Math.min(100, potential);
}

/**
 * Check if employee meets requirements for a role
 */
function meetsRoleRequirements(
  metrics: EmployeeMetrics,
  requirements: RoleRequirements
): { meets: boolean; gaps: string[] } {
  const gaps: string[] = [];

  if (requirements.minJobsCompleted && metrics.jobsCompleted < requirements.minJobsCompleted) {
    gaps.push(`Need ${requirements.minJobsCompleted - metrics.jobsCompleted} more jobs completed`);
  }

  if (requirements.minCustomerRating && metrics.customerRating < requirements.minCustomerRating) {
    gaps.push(`Need ${(requirements.minCustomerRating - metrics.customerRating).toFixed(1)} higher rating`);
  }

  if (requirements.maxErrorRate && metrics.errorRate > requirements.maxErrorRate) {
    gaps.push(`Error rate too high (${metrics.errorRate}% vs ${requirements.maxErrorRate}% max)`);
  }

  if (requirements.minAttendanceRate && metrics.attendanceRate < requirements.minAttendanceRate) {
    gaps.push(`Need ${requirements.minAttendanceRate - metrics.attendanceRate}% better attendance`);
  }

  if (requirements.minCompletionRate && metrics.completionRate < requirements.minCompletionRate) {
    gaps.push(`Need ${requirements.minCompletionRate - metrics.completionRate}% better completion rate`);
  }

  if (requirements.minDaysWorked && metrics.totalDaysWorked < requirements.minDaysWorked) {
    gaps.push(`Need ${requirements.minDaysWorked - metrics.totalDaysWorked} more days experience`);
  }

  if (requirements.maxLateCount && metrics.lateCount > requirements.maxLateCount) {
    gaps.push(`Too many late arrivals (${metrics.lateCount} vs ${requirements.maxLateCount} max)`);
  }

  if (requirements.requiresTeamExperience && (!metrics.teamSize || metrics.teamSize < (requirements.minTeamSize || 1))) {
    gaps.push(`Needs team management experience (min ${requirements.minTeamSize || 1} reports)`);
  }

  return {
    meets: gaps.length === 0,
    gaps,
  };
}

/**
 * Calculate confidence score for role suggestion (0-100)
 */
function calculateConfidence(
  metrics: EmployeeMetrics,
  requirements: RoleRequirements,
  meetsRequirements: boolean
): number {
  if (!meetsRequirements) {
    // Partial confidence based on how close they are
    const performanceScore = calculatePerformanceScore(metrics);
    return Math.round(performanceScore * 0.5); // Cap at 50% if requirements not met
  }

  const performanceScore = calculatePerformanceScore(metrics);
  const growthPotential = calculateGrowthPotential(metrics);

  // High performers with growth potential = high confidence
  const confidence = (performanceScore * 0.7) + (growthPotential * 0.3);

  return Math.round(Math.min(100, confidence));
}

// ========== MAIN SUGGESTION ENGINE ==========

/**
 * Suggest best role for employee based on metrics
 */
export function suggestRole(
  currentRole: string,
  metrics: EmployeeMetrics
): RoleSuggestion {
  const performanceScore = calculatePerformanceScore(metrics);
  const growthPotential = calculateGrowthPotential(metrics);

  // Define promotion path
  const promotionPaths: Record<string, string[]> = {
    "Car Washer": ["Supervisor"],
    "Supervisor": ["Operations Manager"],
    "Operations Manager": ["Sr Operations Manager"],
    "TSE": ["TSM"],
    "CCE": ["Supervisor"], // Can cross over to operations
  };

  const possiblePromotions = promotionPaths[currentRole] || [];

  let bestRole = currentRole;
  let bestConfidence = 50; // Default confidence for current role
  let reasons: string[] = [];
  let gaps: string[] = [];

  // Check each possible promotion
  for (const targetRole of possiblePromotions) {
    const requirements = ROLE_PROFILES[targetRole];
    if (!requirements) continue;

    const { meets, gaps: roleGaps } = meetsRoleRequirements(metrics, requirements);
    const confidence = calculateConfidence(metrics, requirements, meets);

    if (meets && confidence > bestConfidence) {
      bestRole = targetRole;
      bestConfidence = confidence;
      gaps = [];

      // Generate reasons for promotion
      if (metrics.customerRating >= 4.5) {
        reasons.push(`Excellent customer satisfaction (${metrics.customerRating.toFixed(1)}/5.0)`);
      }
      if (metrics.errorRate <= 5) {
        reasons.push(`Very low error rate (${metrics.errorRate.toFixed(1)}%)`);
      }
      if (metrics.attendanceRate >= 90) {
        reasons.push(`Excellent attendance (${metrics.attendanceRate.toFixed(1)}%)`);
      }
      if (metrics.jobsCompleted >= requirements.minJobsCompleted!) {
        reasons.push(`Strong job completion record (${metrics.jobsCompleted} jobs)`);
      }
      if (performanceScore >= 80) {
        reasons.push(`High overall performance score (${performanceScore}/100)`);
      }
    } else if (!meets) {
      gaps = roleGaps;
    }
  }

  const readyForPromotion = bestRole !== currentRole && bestConfidence >= 75;

  // Estimate readiness date if not ready yet
  let estimatedReadinessDate: string | undefined;
  if (!readyForPromotion && gaps.length > 0) {
    // Rough estimate: 30 days per major gap
    const daysNeeded = gaps.length * 30;
    const readyDate = new Date();
    readyDate.setDate(readyDate.getDate() + daysNeeded);
    estimatedReadinessDate = readyDate.toISOString().split("T")[0];
  }

  return {
    employeeId: metrics.employeeId,
    currentRole,
    suggestedRole: bestRole,
    confidence: bestConfidence,
    reasons,
    gaps,
    readyForPromotion,
    estimatedReadinessDate,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate performance alerts for anomaly detection
 */
export function generatePerformanceAlerts(
  employeeName: string,
  currentRole: string,
  metrics: EmployeeMetrics,
  suggestion: RoleSuggestion
): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];
  const performanceScore = calculatePerformanceScore(metrics);

  // CRITICAL: Severe underperformance
  if (performanceScore < 40) {
    alerts.push({
      employeeId: metrics.employeeId,
      employeeName,
      type: "UNDERPERFORMING",
      severity: "CRITICAL",
      message: `${employeeName} has critical performance issues (score: ${performanceScore}/100)`,
      metrics: {
        performanceScore,
        customerRating: metrics.customerRating,
        errorRate: metrics.errorRate,
        attendanceRate: metrics.attendanceRate,
      },
      recommendedAction: "Immediate performance improvement plan required. Consider additional training or reassignment.",
      flaggedAt: new Date().toISOString(),
    });
  }

  // HIGH: Significant underperformance
  else if (performanceScore < 60) {
    alerts.push({
      employeeId: metrics.employeeId,
      employeeName,
      type: "UNDERPERFORMING",
      severity: "HIGH",
      message: `${employeeName} is underperforming (score: ${performanceScore}/100)`,
      metrics: { performanceScore },
      recommendedAction: "Performance review and coaching recommended within 2 weeks.",
      flaggedAt: new Date().toISOString(),
    });
  }

  // PROMOTION_READY: High potential for advancement
  if (suggestion.readyForPromotion && suggestion.confidence >= 85) {
    alerts.push({
      employeeId: metrics.employeeId,
      employeeName,
      type: "PROMOTION_READY",
      severity: "MEDIUM",
      message: `${employeeName} is ready for promotion to ${suggestion.suggestedRole}`,
      metrics: { performanceScore },
      recommendedAction: `Consider promoting to ${suggestion.suggestedRole}. Confidence: ${suggestion.confidence}%`,
      flaggedAt: new Date().toISOString(),
    });
  }

  // OVERPERFORMING: Exceptional performance (potential mismatched role)
  if (performanceScore >= 90 && suggestion.suggestedRole !== currentRole) {
    alerts.push({
      employeeId: metrics.employeeId,
      employeeName,
      type: "OVERPERFORMING",
      severity: "LOW",
      message: `${employeeName} is significantly exceeding expectations`,
      metrics: { performanceScore },
      recommendedAction: `High performer - consider fast-track promotion or special projects.`,
      flaggedAt: new Date().toISOString(),
    });
  }

  // MISMATCHED_ROLE: Performance suggests different role would be better fit
  if (suggestion.confidence >= 70 && suggestion.suggestedRole !== currentRole && !suggestion.readyForPromotion) {
    alerts.push({
      employeeId: metrics.employeeId,
      employeeName,
      type: "MISMATCHED_ROLE",
      severity: "MEDIUM",
      message: `${employeeName} may be better suited for ${suggestion.suggestedRole}`,
      metrics: { performanceScore },
      recommendedAction: `Review role fit. Consider lateral move to ${suggestion.suggestedRole}.`,
      flaggedAt: new Date().toISOString(),
    });
  }

  return alerts;
}

/**
 * Get role confidence score (for UI display)
 */
export function getRoleConfidence(metrics: EmployeeMetrics): number {
  const performanceScore = calculatePerformanceScore(metrics);
  const growthPotential = calculateGrowthPotential(metrics);

  return Math.round((performanceScore * 0.6) + (growthPotential * 0.4));
}
