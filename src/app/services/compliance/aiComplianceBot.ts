/**
 * AI Compliance Bot Service
 *
 * Detects regulatory changes, analyzes impact, and suggests actions
 * Monitors: Tax rates, PF thresholds, ESI limits, state-specific rules
 *
 * NON-DISRUPTIVE: Detection layer only - requires user approval to apply
 */

import type { IndianState } from "../payroll/complianceRules";

// ========== CHANGE DETECTION ==========

export type ChangeType = "tax_rate" | "threshold" | "slab" | "new_rule" | "exemption";
export type ChangeSeverity = "critical" | "high" | "medium" | "low";
export type ChangeStatus = "detected" | "analyzed" | "applied" | "dismissed";

export interface ComplianceChange {
  id: string;
  type: ChangeType;
  severity: ChangeSeverity;
  status: ChangeStatus;
  detectedAt: Date;
  effectiveFrom: Date;
  title: string;
  description: string;
  affectedStates: IndianState[];
  affectedEmployees: number;
  source: string; // e.g., "Ministry of Labour", "EPFO Notification"
  referenceUrl?: string;
  impact: {
    summary: string;
    financialImpact: number; // Monthly impact in rupees
    affectedComponents: string[]; // e.g., ["PF", "ESI"]
    actionRequired: string;
  };
  suggestedAction: {
    title: string;
    steps: string[];
    automated: boolean; // Can be auto-applied?
  };
}

// ========== MOCK CHANGES (In production, fetch from government APIs) ==========

const DETECTED_CHANGES: ComplianceChange[] = [
  {
    id: "CHG-2026-001",
    type: "threshold",
    severity: "high",
    status: "detected",
    detectedAt: new Date("2026-04-20"),
    effectiveFrom: new Date("2026-05-01"),
    title: "ESI Wage Ceiling Increased to ₹25,000",
    description:
      "ESIC has increased the wage ceiling from ₹21,000 to ₹25,000 per month effective May 1, 2026.",
    affectedStates: ["GJ", "MH", "KA", "DL", "TN", "UP", "RJ", "WB", "AP", "TG"],
    affectedEmployees: 45,
    source: "ESIC Notification No. 03/2026",
    referenceUrl: "https://esic.gov.in/notifications/2026/03",
    impact: {
      summary:
        "45 employees earning between ₹21,000-₹25,000 will now be covered under ESI",
      financialImpact: 12500,
      affectedComponents: ["ESI"],
      actionRequired: "Update ESI threshold and recalculate contributions",
    },
    suggestedAction: {
      title: "Update ESI Configuration",
      steps: [
        "Update ESI threshold to ₹25,000 in compliance rules",
        "Recalculate ESI contributions for affected employees",
        "Update payroll processing for May 2026 onwards",
        "Notify affected employees about ESI coverage",
      ],
      automated: true,
    },
  },
  {
    id: "CHG-2026-002",
    type: "tax_rate",
    severity: "critical",
    status: "detected",
    detectedAt: new Date("2026-04-15"),
    effectiveFrom: new Date("2026-04-01"),
    title: "New Tax Regime Default Changed",
    description:
      "Finance Ministry has made New Tax Regime default for FY 2026-27. Employees must opt-in for Old Regime.",
    affectedStates: ["GJ", "MH", "KA", "DL", "TN", "UP", "RJ", "WB", "AP", "TG"],
    affectedEmployees: 230,
    source: "Income Tax Circular 05/2026",
    referenceUrl: "https://incometaxindia.gov.in/circulars/2026/05",
    impact: {
      summary:
        "All employees will default to New Tax Regime unless they opt for Old Regime",
      financialImpact: -35000,
      affectedComponents: ["TDS"],
      actionRequired: "Collect regime preference from all employees",
    },
    suggestedAction: {
      title: "Collect Tax Regime Preferences",
      steps: [
        "Send notification to all employees",
        "Create regime selection form",
        "Set deadline for preference submission",
        "Default to New Regime for non-respondents",
        "Update TDS calculations based on preferences",
      ],
      automated: false,
    },
  },
  {
    id: "CHG-2026-003",
    type: "slab",
    severity: "medium",
    status: "detected",
    detectedAt: new Date("2026-04-10"),
    effectiveFrom: new Date("2026-06-01"),
    title: "Gujarat PT Slab Revision",
    description:
      "Gujarat Government has revised Professional Tax slabs, increasing the top slab amount from ₹200 to ₹250.",
    affectedStates: ["GJ"],
    affectedEmployees: 87,
    source: "Gujarat State Tax Department Notification",
    impact: {
      summary: "Employees earning above ₹12,000 will pay ₹50 more per month",
      financialImpact: 4350,
      affectedComponents: ["PT"],
      actionRequired: "Update Gujarat PT slabs",
    },
    suggestedAction: {
      title: "Update Gujarat PT Slabs",
      steps: [
        "Update PT slab configuration for Gujarat",
        "Apply new rates from June 2026 payroll",
        "Notify Gujarat employees about PT increase",
      ],
      automated: true,
    },
  },
  {
    id: "CHG-2026-004",
    type: "new_rule",
    severity: "low",
    status: "detected",
    detectedAt: new Date("2026-04-05"),
    effectiveFrom: new Date("2026-07-01"),
    title: "Quarterly PF Filing Introduced",
    description:
      "EPFO now allows quarterly consolidated filing for organizations with <100 employees.",
    affectedStates: ["GJ", "MH", "KA", "DL", "TN", "UP", "RJ", "WB", "AP", "TG"],
    affectedEmployees: 230,
    source: "EPFO Circular 12/2026",
    impact: {
      summary: "Option to file PF returns quarterly instead of monthly",
      financialImpact: 0,
      affectedComponents: ["PF"],
      actionRequired: "Decide whether to switch to quarterly filing",
    },
    suggestedAction: {
      title: "Evaluate Quarterly PF Filing",
      steps: [
        "Review organizational preference",
        "Assess impact on compliance timeline",
        "Enable quarterly filing if beneficial",
      ],
      automated: false,
    },
  },
];

// ========== AI ANALYSIS ==========

/**
 * Get all detected compliance changes
 */
export function getDetectedChanges(
  status?: ChangeStatus,
  severity?: ChangeSeverity
): ComplianceChange[] {
  let changes = [...DETECTED_CHANGES];

  if (status) {
    changes = changes.filter((c) => c.status === status);
  }

  if (severity) {
    changes = changes.filter((c) => c.severity === severity);
  }

  return changes.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
}

/**
 * Analyze impact of a compliance change
 */
export function analyzeChangeImpact(changeId: string): {
  change: ComplianceChange;
  detailedImpact: {
    byState: Record<IndianState, { employees: number; monthlyImpact: number }>;
    byComponent: Record<string, { employees: number; monthlyImpact: number }>;
    timeline: Array<{ date: Date; action: string; status: "pending" | "completed" }>;
  };
} {
  const change = DETECTED_CHANGES.find((c) => c.id === changeId);
  if (!change) {
    throw new Error(`Change ${changeId} not found`);
  }

  // Mock detailed analysis
  const detailedImpact = {
    byState: change.affectedStates.reduce(
      (acc, state) => ({
        ...acc,
        [state]: {
          employees: Math.floor(change.affectedEmployees / change.affectedStates.length),
          monthlyImpact: Math.floor(
            change.impact.financialImpact / change.affectedStates.length
          ),
        },
      }),
      {} as Record<IndianState, { employees: number; monthlyImpact: number }>
    ),
    byComponent: change.impact.affectedComponents.reduce(
      (acc, component) => ({
        ...acc,
        [component]: {
          employees: change.affectedEmployees,
          monthlyImpact: change.impact.financialImpact,
        },
      }),
      {} as Record<string, { employees: number; monthlyImpact: number }>
    ),
    timeline: [
      {
        date: change.detectedAt,
        action: "Change detected",
        status: "completed" as const,
      },
      {
        date: new Date(change.detectedAt.getTime() + 86400000),
        action: "Impact analysis completed",
        status: "completed" as const,
      },
      {
        date: change.effectiveFrom,
        action: "Apply changes to system",
        status: "pending" as const,
      },
    ],
  };

  return {
    change,
    detailedImpact,
  };
}

/**
 * Apply a compliance change (update system configuration)
 */
export function applyComplianceChange(changeId: string): {
  success: boolean;
  message: string;
  updatedRules: string[];
} {
  const change = DETECTED_CHANGES.find((c) => c.id === changeId);
  if (!change) {
    return {
      success: false,
      message: "Change not found",
      updatedRules: [],
    };
  }

  if (!change.suggestedAction.automated) {
    return {
      success: false,
      message: "This change requires manual intervention",
      updatedRules: [],
    };
  }

  // In production, this would update the actual compliance rules
  change.status = "applied";

  return {
    success: true,
    message: `Successfully applied ${change.title}`,
    updatedRules: change.impact.affectedComponents,
  };
}

/**
 * Dismiss a compliance change (mark as not applicable)
 */
export function dismissComplianceChange(changeId: string, reason: string): {
  success: boolean;
  message: string;
} {
  const change = DETECTED_CHANGES.find((c) => c.id === changeId);
  if (!change) {
    return {
      success: false,
      message: "Change not found",
    };
  }

  change.status = "dismissed";

  return {
    success: true,
    message: `Dismissed ${change.title}: ${reason}`,
  };
}

/**
 * Get compliance health score
 */
export function getComplianceHealthScore(): {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  issues: Array<{
    severity: ChangeSeverity;
    count: number;
  }>;
  recommendation: string;
} {
  const pendingChanges = DETECTED_CHANGES.filter((c) => c.status === "detected");

  const criticalCount = pendingChanges.filter((c) => c.severity === "critical").length;
  const highCount = pendingChanges.filter((c) => c.severity === "high").length;
  const mediumCount = pendingChanges.filter((c) => c.severity === "medium").length;
  const lowCount = pendingChanges.filter((c) => c.severity === "low").length;

  // Calculate score
  let score = 100;
  score -= criticalCount * 25;
  score -= highCount * 15;
  score -= mediumCount * 10;
  score -= lowCount * 5;
  score = Math.max(0, score);

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 50) grade = "D";
  else grade = "F";

  // Recommendation
  let recommendation = "";
  if (criticalCount > 0) {
    recommendation = `${criticalCount} critical issue(s) require immediate attention`;
  } else if (highCount > 0) {
    recommendation = `${highCount} high-priority update(s) pending`;
  } else if (mediumCount > 0) {
    recommendation = `${mediumCount} medium-priority update(s) recommended`;
  } else {
    recommendation = "All compliance rules up to date";
  }

  return {
    score,
    grade,
    issues: [
      { severity: "critical", count: criticalCount },
      { severity: "high", count: highCount },
      { severity: "medium", count: mediumCount },
      { severity: "low", count: lowCount },
    ],
    recommendation,
  };
}
