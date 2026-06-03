/**
 * DATA VISIBILITY RULES - Role-Based Hierarchy Enforcement
 *
 * PHILOSOPHY:
 * - Higher roles see AGGREGATED data by default (strategic view)
 * - Lower roles see RAW/INDIVIDUAL data (operational view)
 * - Drill-down is preserved where already implemented
 * - No data/screens removed, only default visibility adjusted
 *
 * HIERARCHY: Supervisor → OM → Cluster Manager → City Manager
 *
 * @module DataVisibilityRules
 */

import { Role } from "./roleConfig";

// ==================== VISIBILITY LEVELS ====================

export type VisibilityLevel = "NONE" | "AGGREGATE" | "SUMMARY" | "FULL" | "DRILL_DOWN";

/**
 * Visibility Level Definitions:
 * - NONE: No access to this data point
 * - AGGREGATE: City/Region totals only (e.g., "45 total supervisors", "1,250 total washers")
 * - SUMMARY: Team/Group summaries (e.g., "12/15 washers present", "Team avg 4.2/5")
 * - FULL: Individual-level raw data (e.g., "Rajesh - 4.5 rating - Present")
 * - DRILL_DOWN: Can click through from aggregate → summary → full (preserves existing UI)
 */

export interface DataVisibilityRule {
  dataPoint: string;
  category: "ATTENDANCE" | "PERFORMANCE" | "LEADS" | "FINANCIAL" | "INVENTORY" | "COMPLAINTS" | "HR";
  carWasher: VisibilityLevel;
  supervisor: VisibilityLevel;
  operationsManager: VisibilityLevel;
  clusterManager: VisibilityLevel;
  cityManager: VisibilityLevel;
  description: string;
}

// ==================== HIERARCHY ENFORCEMENT RULES ====================

/**
 * Comprehensive data visibility matrix
 * Each row defines what each role should see for a specific data point
 */
export const DATA_VISIBILITY_RULES: DataVisibilityRule[] = [
  // ===== ATTENDANCE DATA =====
  {
    dataPoint: "Individual Washer Attendance",
    category: "ATTENDANCE",
    carWasher: "FULL",        // See own attendance only
    supervisor: "FULL",       // See all team members' check-in/out, GPS, selfies
    operationsManager: "SUMMARY",  // See "12/15 present" per supervisor
    clusterManager: "AGGREGATE",   // See "85% attendance city-wide"
    cityManager: "AGGREGATE",      // See "85% attendance city-wide"
    description: "Raw attendance data should only be visible to Supervisors managing the team",
  },
  {
    dataPoint: "Team Attendance Summary",
    category: "ATTENDANCE",
    carWasher: "NONE",
    supervisor: "FULL",
    operationsManager: "FULL",
    clusterManager: "SUMMARY",
    cityManager: "AGGREGATE",
    description: "Team-level summaries visible to OMs and above",
  },

  // ===== PERFORMANCE & AUDIT DATA =====
  {
    dataPoint: "Individual Washer Performance Scores",
    category: "PERFORMANCE",
    carWasher: "FULL",        // See own scores
    supervisor: "FULL",       // See individual scores + audit photos
    operationsManager: "SUMMARY",  // See team averages only
    clusterManager: "SUMMARY",     // See supervisor averages
    cityManager: "AGGREGATE",      // See city-wide averages
    description: "Individual performance data stops at Supervisor level",
  },
  {
    dataPoint: "Field Audit Details",
    category: "PERFORMANCE",
    carWasher: "FULL",        // See own audits
    supervisor: "FULL",       // Conduct and view audits with photos
    operationsManager: "FULL", // Review all audits for quality control
    clusterManager: "SUMMARY", // Audit counts and average scores
    cityManager: "AGGREGATE",  // City-wide audit compliance %
    description: "OMs need full audit access for quality oversight",
  },
  {
    dataPoint: "Washer Units Completed",
    category: "PERFORMANCE",
    carWasher: "FULL",
    supervisor: "FULL",       // See individual washer unit counts
    operationsManager: "SUMMARY",  // See "Team: 145/180 units" per supervisor
    clusterManager: "AGGREGATE",   // See total units across all teams
    cityManager: "AGGREGATE",
    description: "Individual unit counts only for Supervisors",
  },

  // ===== LEAD & SALES DATA =====
  {
    dataPoint: "BTL Lead Details",
    category: "LEADS",
    carWasher: "NONE",
    supervisor: "FULL",       // See customer names, contacts, notes
    operationsManager: "FULL", // Review all leads for conversion tracking
    clusterManager: "SUMMARY", // Lead counts and conversion %
    cityManager: "SUMMARY",    // Lead pipeline health metrics
    description: "Lead contact details visible to Supervisor and OM only",
  },
  {
    dataPoint: "Conversion Metrics",
    category: "LEADS",
    carWasher: "NONE",
    supervisor: "FULL",       // Track own conversions
    operationsManager: "FULL", // Track team conversions
    clusterManager: "FULL",    // Strategic conversion tracking
    cityManager: "FULL",       // Overall conversion strategy
    description: "Conversion data visible at all management levels",
  },
  {
    dataPoint: "Revenue per Lead Source",
    category: "FINANCIAL",
    carWasher: "NONE",
    supervisor: "SUMMARY",     // Know which sources are working
    operationsManager: "FULL",
    clusterManager: "FULL",
    cityManager: "FULL",
    description: "Financial implications visible to OM and above",
  },

  // ===== FINANCIAL DATA =====
  {
    dataPoint: "Individual Washer Incentives",
    category: "FINANCIAL",
    carWasher: "FULL",        // See own incentive breakdown
    supervisor: "SUMMARY",     // See total paid per washer (not breakdown)
    operationsManager: "SUMMARY",  // See team totals
    clusterManager: "AGGREGATE",   // See budget vs actual
    cityManager: "AGGREGATE",      // See city-wide incentive spend
    description: "Individual incentive details private to washer",
  },
  {
    dataPoint: "Team Revenue & EBITDA",
    category: "FINANCIAL",
    carWasher: "NONE",
    supervisor: "SUMMARY",     // Know team contribution (motivational)
    operationsManager: "FULL",
    clusterManager: "FULL",
    cityManager: "FULL",
    description: "P&L data visible from OM upward",
  },
  {
    dataPoint: "Customer LTV & Churn",
    category: "FINANCIAL",
    carWasher: "NONE",
    supervisor: "NONE",
    operationsManager: "SUMMARY",
    clusterManager: "FULL",
    cityManager: "FULL",
    description: "Strategic retention metrics for senior management",
  },

  // ===== INVENTORY & MATERIALS =====
  {
    dataPoint: "Individual Material Requisitions",
    category: "INVENTORY",
    carWasher: "FULL",        // See own requisitions
    supervisor: "FULL",       // Approve team requisitions
    operationsManager: "SUMMARY",  // See approval queue, not individual items
    clusterManager: "AGGREGATE",   // Inventory budget tracking
    cityManager: "AGGREGATE",
    description: "Requisition details managed at Supervisor level",
  },
  {
    dataPoint: "Cloth Tracking (Batch-Level)",
    category: "INVENTORY",
    carWasher: "FULL",        // Exchange own cloths
    supervisor: "FULL",       // Track batches A/B/C/D per washer
    operationsManager: "SUMMARY",  // Overdue collections only
    clusterManager: "NONE",
    cityManager: "NONE",
    description: "Operational detail stops at OM level",
  },

  // ===== COMPLAINTS & ESCALATIONS =====
  {
    dataPoint: "Individual Complaint Details",
    category: "COMPLAINTS",
    carWasher: "FULL",        // See complaints about own service
    supervisor: "FULL",       // Resolve team complaints
    operationsManager: "FULL", // Oversee complaint resolution
    clusterManager: "SUMMARY", // Complaint counts and resolution time
    cityManager: "SUMMARY",    // Escalated complaints only (>1hr unresolved)
    description: "Complaint details handled at operational levels",
  },
  {
    dataPoint: "Escalation Feed",
    category: "COMPLAINTS",
    carWasher: "NONE",
    supervisor: "FULL",       // Own escalations
    operationsManager: "FULL", // Real-time escalation management
    clusterManager: "FULL",    // Strategic escalation oversight
    cityManager: "SUMMARY",    // Critical escalations only
    description: "City Manager sees only critical/delayed escalations",
  },

  // ===== HR & PAYROLL DATA =====
  {
    dataPoint: "Individual Salary Details",
    category: "HR",
    carWasher: "FULL",        // See own salary
    supervisor: "NONE",       // Cannot see team salaries
    operationsManager: "NONE",
    clusterManager: "NONE",
    cityManager: "NONE",
    description: "Salary details private (HR-only access via separate permission)",
  },
  {
    dataPoint: "Leave Applications",
    category: "HR",
    carWasher: "FULL",        // See own leaves
    supervisor: "FULL",       // Approve team leaves
    operationsManager: "SUMMARY",  // Leave counts affecting operations
    clusterManager: "SUMMARY",
    cityManager: "AGGREGATE",
    description: "Leave details managed by direct manager",
  },
  {
    dataPoint: "Team Headcount & Turnover",
    category: "HR",
    carWasher: "NONE",
    supervisor: "FULL",       // Know team composition
    operationsManager: "FULL",
    clusterManager: "FULL",
    cityManager: "FULL",
    description: "Workforce planning data for all management levels",
  },
];

// ==================== ROLE-BASED DEFAULT VIEWS ====================

export interface DefaultViewConfig {
  role: Role;
  defaultDataGranularity: "INDIVIDUAL" | "TEAM" | "CLUSTER" | "CITY";
  showIndividualNames: boolean;
  showContactInfo: boolean;
  showFinancialDetails: boolean;
  allowDrillDown: boolean;
  drillDownLimit?: "TEAM" | "CLUSTER" | "CITY";
}

/**
 * Default view configuration per role
 * Defines what granularity of data the role sees by default
 */
export const DEFAULT_VIEW_CONFIGS: Record<Role, DefaultViewConfig> = {
  "Car Washer": {
    role: "Car Washer",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: false,      // Only see own data
    showContactInfo: false,
    showFinancialDetails: true,      // Own incentives/salary
    allowDrillDown: false,
  },
  "Supervisor": {
    role: "Supervisor",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,       // See team member names
    showContactInfo: true,           // See team contacts
    showFinancialDetails: false,     // No salary access (only incentives)
    allowDrillDown: true,
    drillDownLimit: "TEAM",
  },
  "Operations Manager": {
    role: "Operations Manager",
    defaultDataGranularity: "TEAM",
    showIndividualNames: false,      // See "Supervisor A's team" not individual washers by default
    showContactInfo: false,
    showFinancialDetails: true,      // Can see team P&L
    allowDrillDown: true,
    drillDownLimit: "TEAM",         // Can drill into supervisor summaries
  },
  "Sr Operations Manager": {
    role: "Sr Operations Manager",
    defaultDataGranularity: "CLUSTER",
    showIndividualNames: false,
    showContactInfo: false,
    showFinancialDetails: true,
    allowDrillDown: true,
    drillDownLimit: "CLUSTER",
  },
  "Cluster Manager": {
    role: "Cluster Manager",
    defaultDataGranularity: "CLUSTER",
    showIndividualNames: false,      // See OM names, not individual supervisors/washers
    showContactInfo: false,
    showFinancialDetails: true,
    allowDrillDown: true,
    drillDownLimit: "CLUSTER",
  },
  "City Manager": {
    role: "City Manager",
    defaultDataGranularity: "CITY",
    showIndividualNames: false,      // See cluster summaries
    showContactInfo: false,
    showFinancialDetails: true,
    allowDrillDown: true,
    drillDownLimit: "CITY",         // Can drill to cluster level
  },
  "Super Admin": {
    role: "Super Admin",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: true,
    allowDrillDown: true,
  },
  "Admin": {
    role: "Admin",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: true,
    allowDrillDown: true,
  },
  "TSM": {
    role: "TSM",
    defaultDataGranularity: "TEAM",
    showIndividualNames: true,       // See TSE names
    showContactInfo: true,
    showFinancialDetails: false,
    allowDrillDown: true,
    drillDownLimit: "TEAM",
  },
  "TSE": {
    role: "TSE",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,       // See own lead names
    showContactInfo: true,
    showFinancialDetails: false,
    allowDrillDown: false,
  },
  "CCE": {
    role: "CCE",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,       // See customer names
    showContactInfo: true,
    showFinancialDetails: false,
    allowDrillDown: false,
  },
  "Store Manager": {
    role: "Store Manager",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: false,     // NEVER see monetary values
    allowDrillDown: true,
  },
  "Procurement Manager": {
    role: "Procurement Manager",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: true,      // Can see procurement costs
    allowDrillDown: true,
  },
  "Accounts": {
    role: "Accounts",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: true,
    allowDrillDown: true,
  },
  "HR": {
    role: "HR",
    defaultDataGranularity: "INDIVIDUAL",
    showIndividualNames: true,
    showContactInfo: true,
    showFinancialDetails: true,      // Full payroll access
    allowDrillDown: true,
  },
};

// ==================== VISIBILITY HELPER FUNCTIONS ====================

/**
 * Get visibility level for a specific data point and role
 */
export function getDataVisibility(dataPoint: string, role: Role): VisibilityLevel {
  const rule = DATA_VISIBILITY_RULES.find((r) => r.dataPoint === dataPoint);
  if (!rule) return "NONE";

  switch (role) {
    case "Car Washer":
      return rule.carWasher;
    case "Supervisor":
      return rule.supervisor;
    case "Operations Manager":
    case "Sr Operations Manager":
      return rule.operationsManager;
    case "Cluster Manager":
      return rule.clusterManager;
    case "City Manager":
      return rule.cityManager;
    case "Super Admin":
    case "Admin":
      return "FULL"; // Admins have full access
    default:
      return "NONE";
  }
}

/**
 * Check if role should see individual-level data for a category
 */
export function shouldShowIndividualData(category: string, role: Role): boolean {
  const config = DEFAULT_VIEW_CONFIGS[role];
  if (!config) return false;

  // Admins always see everything
  if (role === "Super Admin" || role === "Admin") return true;

  // Check default granularity
  return config.defaultDataGranularity === "INDIVIDUAL";
}

/**
 * Check if role can drill down to more detailed view
 */
export function canDrillDown(role: Role): boolean {
  const config = DEFAULT_VIEW_CONFIGS[role];
  return config ? config.allowDrillDown : false;
}

/**
 * Get appropriate data aggregation level for role
 */
export function getAggregationLevel(role: Role): "INDIVIDUAL" | "TEAM" | "CLUSTER" | "CITY" {
  const config = DEFAULT_VIEW_CONFIGS[role];
  return config ? config.defaultDataGranularity : "INDIVIDUAL";
}

/**
 * Filter data based on role visibility rules
 * This is UI-level filtering only - does NOT delete data
 */
export function filterDataByVisibility<T>(
  data: T[],
  dataPoint: string,
  role: Role
): T[] {
  const visibility = getDataVisibility(dataPoint, role);

  // FULL visibility - return all data
  if (visibility === "FULL" || visibility === "DRILL_DOWN") {
    return data;
  }

  // AGGREGATE/SUMMARY - UI layer should handle aggregation
  // Return data with a flag for UI to aggregate
  if (visibility === "AGGREGATE" || visibility === "SUMMARY") {
    // Data is returned but UI should show aggregated view
    return data;
  }

  // NONE - return empty array
  return [];
}

/**
 * Check if role should see financial fields
 */
export function shouldShowFinancialFields(role: Role): boolean {
  const config = DEFAULT_VIEW_CONFIGS[role];
  if (!config) return false;

  // Store Manager NEVER sees financial data
  if (role === "Store Manager") return false;

  return config.showFinancialDetails;
}

/**
 * Check if role should see contact information
 */
export function shouldShowContactInfo(role: Role): boolean {
  const config = DEFAULT_VIEW_CONFIGS[role];
  return config ? config.showContactInfo : false;
}

/**
 * Get visibility rules summary for a role (for documentation/debugging)
 */
export function getRoleVisibilitySummary(role: Role): {
  dataPoint: string;
  visibility: VisibilityLevel;
  description: string;
}[] {
  return DATA_VISIBILITY_RULES.map((rule) => ({
    dataPoint: rule.dataPoint,
    visibility: getDataVisibility(rule.dataPoint, role),
    description: rule.description,
  }));
}

// ==================== HIERARCHY VALIDATION ====================

/**
 * Validates that higher roles don't see more granular data than lower roles
 * Returns warnings if hierarchy is violated
 */
export function validateHierarchy(): string[] {
  const warnings: string[] = [];
  const hierarchy: Role[] = ["Car Washer", "Supervisor", "Operations Manager", "Cluster Manager", "City Manager"];

  DATA_VISIBILITY_RULES.forEach((rule) => {
    for (let i = 0; i < hierarchy.length - 1; i++) {
      const lowerRole = hierarchy[i];
      const higherRole = hierarchy[i + 1];

      const lowerVis = getDataVisibility(rule.dataPoint, lowerRole);
      const higherVis = getDataVisibility(rule.dataPoint, higherRole);

      // Check if higher role has MORE detailed access than lower role
      const visibilityRank = { NONE: 0, AGGREGATE: 1, SUMMARY: 2, DRILL_DOWN: 3, FULL: 4 };

      if (visibilityRank[higherVis] > visibilityRank[lowerVis]) {
        warnings.push(
          `WARNING: ${higherRole} has more detailed access (${higherVis}) than ${lowerRole} (${lowerVis}) for "${rule.dataPoint}"`
        );
      }
    }
  });

  return warnings;
}
