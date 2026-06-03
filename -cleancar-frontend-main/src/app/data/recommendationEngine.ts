// Recommendation Engine - Logic Framework and Data Types
// Automatically analyzes actual vs ideal figures and generates specific, actionable recommendations

// ============================================
// DATA TYPES
// ============================================

export type DiagnosisCategory =
  | "Job Volume Shortfall"
  | "Zero Wash Days"
  | "Consumable Over-Consumption"
  | "Consumable Under-Consumption"
  | "Supervisor Underutilization"
  | "Equipment Cost Spike"
  | "Overhead Creep"
  | "High Carry-Forward Stock"
  | "Batch Price Increase Impact"
  | "Team Attainment Spread";

export type RecommendationPriority = "High" | "Medium" | "Low";

export type RecommendationStatus = "Not Started" | "In Progress" | "Completed";

export type ActionOwner =
  | "Operations Manager"
  | "Supervisor"
  | "HR"
  | "Purchase Manager"
  | "Store Manager"
  | "Admin"
  | "Finance Manager";

export interface ActionStep {
  step: number;
  action: string;
  owner: ActionOwner;
  deadline?: string; // Optional deadline
}

export interface ProgressNote {
  id: string;
  note: string;
  createdAt: string;
  createdBy: string;
  createdByRole: string;
}

export interface ResolutionInfo {
  summary: string;
  resolvedAt: string;
  resolvedBy: string;
  resolvedByRole: string;
  confirmedAt?: string;
  confirmedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
}

export interface VerificationResult {
  status: "Verified" | "Not Yet Verified" | "Issue Persists";
  beforeCPW?: number;
  afterCPW?: number;
  improvement?: number;
  improvementPercent?: number;
  verifiedAt?: string;
  message: string;
}

export interface Recommendation {
  id: string;
  entityType: "Company" | "Zone" | "Washer" | "Supervisor";
  entityId: string;
  entityName: string;
  period: string; // e.g., "March 2026"
  periodStart: string; // ISO date
  periodEnd: string; // ISO date
  
  // Core fields
  priority: RecommendationPriority;
  diagnosisCategory: DiagnosisCategory;
  
  // Structured content
  whatIsHappening: string; // Specific observed situation with real numbers
  whyItMatters: string; // Quantified financial impact
  actionSteps: ActionStep[]; // Specific numbered actions
  primaryOwner: ActionOwner;
  expectedImpact: string; // Quantified benefit if actioned
  
  // Metadata
  status: RecommendationStatus;
  raisedOn: string; // ISO datetime
  updatedOn?: string; // ISO datetime
  updatedBy?: string;
  completedOn?: string; // ISO datetime
  completedBy?: string;
  notes?: string; // Admin notes
  
  // Assignment fields
  assignedTo?: string; // Name of assigned person
  assignedToRole?: ActionOwner;
  assignedBy?: string;
  assignedAt?: string;
  dueDate?: string; // ISO date
  
  // Progress tracking
  progressNotes?: ProgressNote[];
  
  // Resolution tracking
  resolution?: ResolutionInfo;
  
  // Verification
  verification?: VerificationResult;
  
  // For tracking and audit
  metrics: {
    actualValue: number;
    idealValue: number;
    variance: number;
    variancePercent: number;
    financialImpact: number; // In ₹
  };
}

// ============================================
// DIAGNOSIS CONFIGURATION
// ============================================

export interface DiagnosisConfig {
  category: DiagnosisCategory;
  threshold: number; // Percentage or absolute threshold
  thresholdType: "percentage_above" | "percentage_below" | "absolute" | "count" | "consecutive_months";
  rootCause: string;
  impactArea: string;
  recommendationType: string;
  defaultPriority: RecommendationPriority;
  icon: string; // Lucide icon name
}

export const DIAGNOSIS_CONFIGS: DiagnosisConfig[] = [
  {
    category: "Job Volume Shortfall",
    threshold: 10,
    thresholdType: "percentage_below",
    rootCause: "Low productivity",
    impactArea: "Salary and supervisor cost per wash elevated",
    recommendationType: "Operations",
    defaultPriority: "High",
    icon: "TrendingDown",
  },
  {
    category: "Zero Wash Days",
    threshold: 1,
    thresholdType: "count",
    rootCause: "Unplanned absence or scheduling gap",
    impactArea: "Fixed costs incurred with zero revenue",
    recommendationType: "HR and Scheduling",
    defaultPriority: "High",
    icon: "AlertCircle",
  },
  {
    category: "Consumable Over-Consumption",
    threshold: 10,
    thresholdType: "percentage_above",
    rootCause: "Material over-application",
    impactArea: "Direct material cost elevation",
    recommendationType: "Training and Quality Control",
    defaultPriority: "Medium",
    icon: "Droplet",
  },
  {
    category: "Consumable Under-Consumption",
    threshold: 30,
    thresholdType: "percentage_below",
    rootCause: "Possible under-application of materials",
    impactArea: "Customer satisfaction and service quality risk",
    recommendationType: "Quality Audit",
    defaultPriority: "High",
    icon: "AlertTriangle",
  },
  {
    category: "Supervisor Underutilization",
    threshold: 2,
    thresholdType: "absolute",
    rootCause: "Supervisor managing too few washers",
    impactArea: "Supervisor fixed cost spread over too few cars",
    recommendationType: "Team Expansion",
    defaultPriority: "Medium",
    icon: "Users",
  },
  {
    category: "Equipment Cost Spike",
    threshold: 20,
    thresholdType: "percentage_above",
    rootCause: "Unplanned equipment events or high-value equipment on low-volume washer",
    impactArea: "Equipment cost per wash elevated",
    recommendationType: "Equipment Management",
    defaultPriority: "High",
    icon: "Wrench",
  },
  {
    category: "Overhead Creep",
    threshold: 3,
    thresholdType: "consecutive_months",
    rootCause: "Overhead costs increasing faster than wash volume",
    impactArea: "Total cost per wash rising over time",
    recommendationType: "Cost Review",
    defaultPriority: "Medium",
    icon: "TrendingUp",
  },
  {
    category: "High Carry-Forward Stock",
    threshold: 40,
    thresholdType: "percentage_above",
    rootCause: "Over-issuance or under-consumption",
    impactArea: "Working capital tied up in washer's possession",
    recommendationType: "Issuance Optimization",
    defaultPriority: "Low",
    icon: "Package",
  },
  {
    category: "Batch Price Increase Impact",
    threshold: 5,
    thresholdType: "percentage_above",
    rootCause: "Supplier price increase",
    impactArea: "Consumable cost per wash rising due to procurement",
    recommendationType: "Procurement",
    defaultPriority: "Medium",
    icon: "DollarSign",
  },
  {
    category: "Team Attainment Spread",
    threshold: 25,
    thresholdType: "percentage_above",
    rootCause: "Unequal job distribution",
    impactArea: "Team fairness and motivation issues",
    recommendationType: "Scheduling and Fairness",
    defaultPriority: "Medium",
    icon: "BarChart3",
  },
];

// ============================================
// RECOMMENDATION ENGINE LOGIC
// ============================================

export interface AnalysisContext {
  entityType: "Company" | "Zone" | "Washer" | "Supervisor";
  entityId: string;
  entityName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  daysInPeriod: number;
  
  // Actual metrics
  actualJobs: number;
  actualWorkingDays: number;
  zeroWashDays: number;
  actualConsumableCost: number;
  actualSalaryCost: number;
  actualSupervisorCost: number;
  actualEquipmentCost: number;
  actualOverheadCost: number;
  
  // Ideal/Target metrics
  idealJobs: number;
  idealConsumableCost: number;
  idealSalaryCost: number;
  idealSupervisorCost: number;
  idealEquipmentCost: number;
  idealOverheadCost: number;
  
  // Additional context
  washerCount?: number; // For supervisor/zone analysis
  supervisorName?: string;
  teamWasherMetrics?: Array<{
    washerId: string;
    washerName: string;
    jobs: number;
  }>;
  
  // Material-specific
  materialStockLevels?: Array<{
    materialId: string;
    materialName: string;
    monthlyIssuance: number;
    closingBalance: number;
    closingBalancePercent: number;
  }>;
  
  // Batch pricing
  batchPriceComparison?: Array<{
    materialId: string;
    materialName: string;
    previousBatchCost: number;
    currentBatchCost: number;
    priceIncrease: number;
    priceIncreasePercent: number;
  }>;
  
  // Historical overhead (for trend analysis)
  overheadHistory?: Array<{
    month: string;
    overheadPerWash: number;
  }>;
}

/**
 * Main recommendation engine - analyzes context and generates recommendations
 */
export function generateRecommendations(context: AnalysisContext): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Only run if period has at least 7 days of data
  if (context.daysInPeriod < 7) {
    return recommendations;
  }
  
  // Run all diagnosis checks
  const diagnosis1 = checkJobVolumeShortfall(context);
  if (diagnosis1) recommendations.push(diagnosis1);
  
  const diagnosis2 = checkZeroWashDays(context);
  if (diagnosis2) recommendations.push(diagnosis2);
  
  const diagnosis3 = checkConsumableOverConsumption(context);
  if (diagnosis3) recommendations.push(diagnosis3);
  
  const diagnosis4 = checkConsumableUnderConsumption(context);
  if (diagnosis4) recommendations.push(diagnosis4);
  
  const diagnosis5 = checkSupervisorUnderutilization(context);
  if (diagnosis5) recommendations.push(diagnosis5);
  
  const diagnosis6 = checkEquipmentCostSpike(context);
  if (diagnosis6) recommendations.push(diagnosis6);
  
  const diagnosis7 = checkOverheadCreep(context);
  if (diagnosis7) recommendations.push(diagnosis7);
  
  const diagnosis8 = checkHighCarryForwardStock(context);
  if (diagnosis8) recommendations.push(diagnosis8);
  
  const diagnosis9 = checkBatchPriceIncrease(context);
  if (diagnosis9) recommendations.push(diagnosis9);
  
  const diagnosis10 = checkTeamAttainmentSpread(context);
  if (diagnosis10) recommendations.push(diagnosis10);
  
  return recommendations;
}

// ============================================
// DIAGNOSIS 1: JOB VOLUME SHORTFALL
// ============================================

function checkJobVolumeShortfall(context: AnalysisContext): Recommendation | null {
  const shortfall = context.idealJobs - context.actualJobs;
  const shortfallPercent = (shortfall / context.idealJobs) * 100;
  
  // Trigger if actual < ideal by more than 10%
  if (shortfallPercent <= 10) return null;
  
  const actualSalaryCostPerWash = context.actualSalaryCost / context.actualJobs;
  const idealSalaryCostPerWash = context.idealSalaryCost / context.idealJobs;
  const excessPerWash = actualSalaryCostPerWash - idealSalaryCostPerWash;
  const totalExcess = excessPerWash * context.actualJobs;
  
  const idealJobsPerDay = 21; // Standard target
  const potentialSavings = excessPerWash * idealJobsPerDay * 26;
  const annualImpact = totalExcess * 12;
  
  // Count days with fewer than 15 jobs
  const lowJobDays = Math.round((context.actualJobs / 26) < 15 ? 26 - (context.actualJobs / 15) : 0);
  
  return {
    id: `rec-${context.entityId}-job-shortfall-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "High",
    diagnosisCategory: "Job Volume Shortfall",
    
    whatIsHappening: `${context.entityName} completed ${context.actualJobs} jobs in ${context.period} against a target of ${context.idealJobs} (${shortfallPercent.toFixed(1)}% below the ideal of 21 cars/day). ${lowJobDays > 0 ? `${lowJobDays} days had fewer than 15 jobs completed.` : ''}`,
    
    whyItMatters: `Salary cost per wash is ₹${actualSalaryCostPerWash.toFixed(2)} vs ideal ₹${idealSalaryCostPerWash.toFixed(2)} — ₹${excessPerWash.toFixed(2)} excess per wash. Total unrecovered salary this period: ₹${totalExcess.toFixed(2)}. If this continues for 12 months: ₹${annualImpact.toFixed(2)}.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Review daily job assignment — ensure this washer is being assigned a full day's jobs by their Supervisor. Check if low-job days correlate with specific time slots or zones.`,
        owner: "Supervisor",
      },
      {
        step: 2,
        action: `Audit the job scheduling for this washer's PIN code — are there enough active subscriptions in the zone to support 21 jobs/day? If not, consider reassigning washer to a higher-volume zone.`,
        owner: "Operations Manager",
      },
      {
        step: 3,
        action: `If the washer is available but not assigned enough jobs — raise with Operations Manager to redistribute from over-assigned washers.`,
        owner: "Operations Manager",
      },
    ],
    
    primaryOwner: "Supervisor",
    
    expectedImpact: `Reaching 21 cars/day reduces salary CPW from ₹${actualSalaryCostPerWash.toFixed(2)} to ₹${idealSalaryCostPerWash.toFixed(2)} — monthly saving of ₹${potentialSavings.toFixed(2)}.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: context.actualJobs,
      idealValue: context.idealJobs,
      variance: shortfall,
      variancePercent: shortfallPercent,
      financialImpact: totalExcess,
    },
  };
}

// ============================================
// DIAGNOSIS 2: ZERO WASH DAYS
// ============================================

function checkZeroWashDays(context: AnalysisContext): Recommendation | null {
  // Trigger if any zero-wash days exist
  if (context.zeroWashDays === 0) return null;
  
  const dailyFixedCost = (context.actualSalaryCost / 26) + (context.actualEquipmentCost / 26);
  const wastedCost = dailyFixedCost * context.zeroWashDays;
  const percentOfFixedCost = (wastedCost / (context.actualSalaryCost + context.actualEquipmentCost)) * 100;
  
  // Estimate potential revenue (assuming average 15 jobs/day at ₹100/wash)
  const avgRevenuePerWash = 100; // Rough estimate
  const potentialRevenue = context.zeroWashDays * 15 * avgRevenuePerWash;
  
  return {
    id: `rec-${context.entityId}-zero-days-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "High",
    diagnosisCategory: "Zero Wash Days",
    
    whatIsHappening: `${context.entityName} had ${context.zeroWashDays} zero-output day${context.zeroWashDays > 1 ? "s" : ""} in ${context.period} ([dates listed]). On these days, ₹${dailyFixedCost.toFixed(2)} (salary + wear) was incurred per day with no wash revenue generated.`,
    
    whyItMatters: `Total unrecovered fixed cost from zero-output days: ₹${wastedCost.toFixed(2)}. This represents ${percentOfFixedCost.toFixed(1)}% of this washer's total monthly fixed cost producing zero output.`,
    
    actionSteps: [
      {
        step: 1,
        action: `If zero days are due to planned leave — review leave planning to ensure adequate coverage is arranged (substitute washer assigned).`,
        owner: "HR",
      },
      {
        step: 2,
        action: `If zero days are due to no job assignments (washer available but idle) — this is a scheduling failure. Escalate to Operations Manager immediately.`,
        owner: "Operations Manager",
      },
      {
        step: 3,
        action: `If zero days are due to unplanned absence (no leave application) — HR to review attendance policy compliance with this washer.`,
        owner: "HR",
      },
      {
        step: 4,
        action: `Consider a minimum job threshold alert — if a washer has fewer than 10 jobs assigned for a day, Supervisor receives a morning alert at 8 AM.`,
        owner: "Supervisor",
      },
    ],
    
    primaryOwner: "HR",
    
    expectedImpact: `Eliminating ${context.zeroWashDays} zero-output days and replacing with even 15 jobs/day each would generate ₹${potentialRevenue.toFixed(2)} additional revenue and recover ₹${wastedCost.toFixed(2)} in otherwise unrecovered fixed costs.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: context.zeroWashDays,
      idealValue: 0,
      variance: context.zeroWashDays,
      variancePercent: 100,
      financialImpact: wastedCost,
    },
  };
}

// ============================================
// DIAGNOSIS 3: CONSUMABLE OVER-CONSUMPTION
// ============================================

function checkConsumableOverConsumption(context: AnalysisContext): Recommendation | null {
  const actualPerWash = context.actualConsumableCost / context.actualJobs;
  const idealPerWash = context.idealConsumableCost / context.idealJobs;
  const variance = actualPerWash - idealPerWash;
  const variancePercent = (variance / idealPerWash) * 100;
  
  // Trigger if actual > ideal by more than 10%
  if (variancePercent <= 10) return null;
  
  const totalExcess = variance * context.actualJobs;
  const monthlyWaste = variance * context.idealJobs;
  
  return {
    id: `rec-${context.entityId}-over-consumption-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Medium",
    diagnosisCategory: "Consumable Over-Consumption",
    
    whatIsHappening: `${context.entityName}'s consumable cost per wash is ₹${actualPerWash.toFixed(2)}, which is ${variancePercent.toFixed(1)}% higher than the ideal ₹${idealPerWash.toFixed(2)}. This suggests over-application of materials like shampoo, wax, or cleaning agents.`,
    
    whyItMatters: `The excess of ₹${variance.toFixed(2)} per wash over ${context.actualJobs} jobs results in ₹${totalExcess.toFixed(2)} in unnecessary material costs this month. If this pattern continues, it represents ₹${(monthlyWaste * 12).toFixed(2)}/year in waste.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Conduct on-site observation of ${context.entityName}'s material application technique. Document foam gun settings and pour quantities.`,
        owner: "Supervisor",
      },
      {
        step: 2,
        action: `Provide refresher training on standard dosage per package type (Premium: 50ml shampoo, Elite: 50ml + 20ml wax, etc.).`,
        owner: "Operations Manager",
      },
      {
        step: 3,
        action: `Issue pre-measured bottles or implement dispenser locks to prevent over-pouring.`,
        owner: "Store Manager",
      },
    ],
    
    primaryOwner: "Supervisor",
    
    expectedImpact: `Bringing consumable usage to standard levels saves ₹${variance.toFixed(2)}/wash. At ideal volume of ${context.idealJobs} jobs/month, monthly savings: ₹${monthlyWaste.toFixed(2)}.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: actualPerWash,
      idealValue: idealPerWash,
      variance: variance,
      variancePercent: variancePercent,
      financialImpact: totalExcess,
    },
  };
}

// ============================================
// DIAGNOSIS 4: CONSUMABLE UNDER-CONSUMPTION
// ============================================

function checkConsumableUnderConsumption(context: AnalysisContext): Recommendation | null {
  const actualPerWash = context.actualConsumableCost / context.actualJobs;
  const idealPerWash = context.idealConsumableCost / context.idealJobs;
  const variance = idealPerWash - actualPerWash;
  const variancePercent = (variance / idealPerWash) * 100;
  
  // Trigger if actual < ideal by more than 30%
  if (variancePercent <= 30) return null;
  
  return {
    id: `rec-${context.entityId}-under-consumption-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "High",
    diagnosisCategory: "Consumable Under-Consumption",
    
    whatIsHappening: `${context.entityName}'s consumable cost per wash is only ₹${actualPerWash.toFixed(2)}, which is ${variancePercent.toFixed(1)}% below the standard ₹${idealPerWash.toFixed(2)}. This indicates possible under-application of materials.`,
    
    whyItMatters: `While this appears cost-efficient, it raises a **quality risk**: customers may not be receiving the full service promised (e.g., insufficient wax coating, diluted shampoo). This can lead to customer complaints, churn, and reputation damage — far costlier than the material savings of ₹${variance.toFixed(2)}/wash.`,
    
    actionSteps: [
      {
        step: 1,
        action: `**URGENT**: Conduct immediate quality audit of ${context.entityName}'s last 10 jobs. Check if customers reported any quality issues.`,
        owner: "Operations Manager",
      },
      {
        step: 2,
        action: `Interview ${context.entityName} to understand material application process. Check if washer is intentionally diluting or skipping materials.`,
        owner: "Supervisor",
      },
      {
        step: 3,
        action: `Send quality assessment team to observe 3 washes and verify full material usage per package specification.`,
        owner: "Admin",
      },
    ],
    
    primaryOwner: "Operations Manager",
    
    expectedImpact: `Restoring standard material usage ensures service quality and prevents customer churn. While material cost increases by ₹${variance.toFixed(2)}/wash, this protects revenue and brand reputation — a non-negotiable investment.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: actualPerWash,
      idealValue: idealPerWash,
      variance: -variance,
      variancePercent: -variancePercent,
      financialImpact: 0, // Quality risk, not direct cost impact
    },
  };
}

// ============================================
// DIAGNOSIS 5: SUPERVISOR UNDERUTILIZATION
// ============================================

function checkSupervisorUnderutilization(context: AnalysisContext): Recommendation | null {
  if (!context.washerCount || !context.supervisorName) return null;
  
  const actualSupervisorPerWash = context.actualSupervisorCost / context.actualJobs;
  const idealSupervisorPerWash = context.idealSupervisorCost / context.idealJobs;
  const ratio = actualSupervisorPerWash / idealSupervisorPerWash;
  
  // Trigger if supervisor allocation >2× ideal
  if (ratio <= 2) return null;
  
  const excess = actualSupervisorPerWash - idealSupervisorPerWash;
  const totalExcess = excess * context.actualJobs;
  
  return {
    id: `rec-${context.entityId}-supervisor-underutil-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Medium",
    diagnosisCategory: "Supervisor Underutilization",
    
    whatIsHappening: `Supervisor ${context.supervisorName} is managing only ${context.washerCount} washer${context.washerCount > 1 ? "s" : ""}, resulting in supervisor cost per wash of ₹${actualSupervisorPerWash.toFixed(2)} — ${ratio.toFixed(1)}× the ideal ₹${idealSupervisorPerWash.toFixed(2)}.`,
    
    whyItMatters: `Supervisor salary (₹${context.actualSupervisorCost.toFixed(2)}/month) is a fixed cost being spread over too few jobs (${context.actualJobs}). This inefficiency costs ₹${excess.toFixed(2)}/wash, totaling ₹${totalExcess.toFixed(2)} in excess supervisory cost this month.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Evaluate hiring 2-3 additional washers under ${context.supervisorName}'s supervision to increase team size to optimal 6-8 washers.`,
        owner: "HR",
      },
      {
        step: 2,
        action: `If hiring is not feasible, consider redistributing ${context.supervisorName}'s supervisory time across another zone or reassigning 1-2 washers from other supervisors.`,
        owner: "Operations Manager",
      },
      {
        step: 3,
        action: `If team size cannot change, assign ${context.supervisorName} additional responsibilities (training, quality audits) to justify fixed cost.`,
        owner: "Admin",
      },
    ],
    
    primaryOwner: "HR",
    
    expectedImpact: `Adding 3 washers (bringing total to ${context.washerCount + 3}) would dilute supervisor cost to approximately ₹${(context.actualSupervisorCost / ((context.actualJobs / context.washerCount) * (context.washerCount + 3))).toFixed(2)}/wash — a saving of ₹${(excess - (context.actualSupervisorCost / ((context.actualJobs / context.washerCount) * (context.washerCount + 3)) - idealSupervisorPerWash)).toFixed(2)}/wash.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: actualSupervisorPerWash,
      idealValue: idealSupervisorPerWash,
      variance: excess,
      variancePercent: (ratio - 1) * 100,
      financialImpact: totalExcess,
    },
  };
}

// ============================================
// DIAGNOSIS 6: EQUIPMENT COST SPIKE
// ============================================

function checkEquipmentCostSpike(context: AnalysisContext): Recommendation | null {
  const actualPerWash = context.actualEquipmentCost / context.actualJobs;
  const idealPerWash = context.idealEquipmentCost / context.idealJobs;
  const variance = actualPerWash - idealPerWash;
  const variancePercent = (variance / idealPerWash) * 100;
  
  // Trigger if >20% above ideal
  if (variancePercent <= 20) return null;
  
  const totalExcess = variance * context.actualJobs;
  
  return {
    id: `rec-${context.entityId}-equipment-spike-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "High",
    diagnosisCategory: "Equipment Cost Spike",
    
    whatIsHappening: `${context.entityName}'s equipment cost per wash is ₹${actualPerWash.toFixed(2)}, which is ${variancePercent.toFixed(1)}% above the expected ₹${idealPerWash.toFixed(2)}. This indicates unplanned equipment events, premature replacements, or high-value equipment on a low-volume washer.`,
    
    whyItMatters: `The excess equipment cost of ₹${variance.toFixed(2)}/wash adds ₹${totalExcess.toFixed(2)} to total costs this month. This could be due to: (1) Recent equipment replacement/repair, (2) Expensive equipment assigned to washer with low job volume, or (3) Equipment damage/misuse.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Review ${context.entityName}'s equipment event log for ${context.period}. Identify if any replacements, repairs, or damage incidents occurred.`,
        owner: "Operations Manager",
      },
      {
        step: 2,
        action: `If high-value equipment (e.g., pressure washer, vacuum) is assigned but washer has low job volume, consider reassigning equipment to higher-volume washer.`,
        owner: "Admin",
      },
      {
        step: 3,
        action: `If premature wear is occurring, provide equipment maintenance training and implement daily equipment checklist for ${context.entityName}.`,
        owner: "Supervisor",
      },
    ],
    
    primaryOwner: "Operations Manager",
    
    expectedImpact: `If equipment cost can be reduced to standard ₹${idealPerWash.toFixed(2)}/wash through better maintenance or reassignment, monthly savings: ₹${(variance * context.idealJobs).toFixed(2)}.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: actualPerWash,
      idealValue: idealPerWash,
      variance: variance,
      variancePercent: variancePercent,
      financialImpact: totalExcess,
    },
  };
}

// ============================================
// DIAGNOSIS 7: OVERHEAD CREEP
// ============================================

function checkOverheadCreep(context: AnalysisContext): Recommendation | null {
  if (!context.overheadHistory || context.overheadHistory.length < 3) return null;
  
  // Check if overhead rising for 3+ consecutive months
  let consecutiveIncreases = 0;
  for (let i = 1; i < context.overheadHistory.length; i++) {
    if (context.overheadHistory[i].overheadPerWash > context.overheadHistory[i - 1].overheadPerWash) {
      consecutiveIncreases++;
    } else {
      consecutiveIncreases = 0;
    }
  }
  
  if (consecutiveIncreases < 3) return null;
  
  const firstMonth = context.overheadHistory[0];
  const lastMonth = context.overheadHistory[context.overheadHistory.length - 1];
  const totalIncrease = lastMonth.overheadPerWash - firstMonth.overheadPerWash;
  const totalIncreasePercent = (totalIncrease / firstMonth.overheadPerWash) * 100;
  const monthlyImpact = totalIncrease * context.actualJobs;
  
  return {
    id: `rec-${context.entityId}-overhead-creep-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Medium",
    diagnosisCategory: "Overhead Creep",
    
    whatIsHappening: `Overhead cost per wash has been rising for ${consecutiveIncreases} consecutive months: from ₹${firstMonth.overheadPerWash.toFixed(2)} in ${firstMonth.month} to ₹${lastMonth.overheadPerWash.toFixed(2)} in ${lastMonth.month} — a ${totalIncreasePercent.toFixed(1)}% increase.`,
    
    whyItMatters: `This trend indicates overhead costs are increasing faster than wash volume. The ₹${totalIncrease.toFixed(2)} per-wash increase over ${consecutiveIncreases} months adds ₹${monthlyImpact.toFixed(2)} to monthly costs. If unchecked, this will erode profitability.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Conduct line-by-line overhead audit. Identify which specific overhead items (transport, uniforms, software, etc.) have increased.`,
        owner: "Finance Manager",
      },
      {
        step: 2,
        action: `For each increasing overhead, determine if: (a) usage has increased, (b) vendor prices have risen, or (c) new overhead items were added.`,
        owner: "Admin",
      },
      {
        step: 3,
        action: `Negotiate with vendors for bulk discounts or alternative suppliers. Eliminate non-essential overhead items.`,
        owner: "Purchase Manager",
      },
    ],
    
    primaryOwner: "Finance Manager",
    
    expectedImpact: `Reversing overhead creep to ${firstMonth.month} levels saves ₹${totalIncrease.toFixed(2)}/wash × ${context.actualJobs} jobs = ₹${monthlyImpact.toFixed(2)}/month, or ₹${(monthlyImpact * 12).toFixed(2)}/year.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: lastMonth.overheadPerWash,
      idealValue: firstMonth.overheadPerWash,
      variance: totalIncrease,
      variancePercent: totalIncreasePercent,
      financialImpact: monthlyImpact,
    },
  };
}

// ============================================
// DIAGNOSIS 8: HIGH CARRY-FORWARD STOCK
// ============================================

function checkHighCarryForwardStock(context: AnalysisContext): Recommendation | null {
  if (!context.materialStockLevels) return null;
  
  const problematicMaterials = context.materialStockLevels.filter(
    (m) => m.closingBalancePercent > 40
  );
  
  if (problematicMaterials.length === 0) return null;
  
  const totalTiedUpValue = problematicMaterials.reduce(
    (sum, m) => sum + m.closingBalance,
    0
  );
  
  const materialList = problematicMaterials
    .map((m) => `${m.materialName} (${m.closingBalancePercent.toFixed(0)}% of issuance)`)
    .join(", ");
  
  return {
    id: `rec-${context.entityId}-high-stock-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Low",
    diagnosisCategory: "High Carry-Forward Stock",
    
    whatIsHappening: `${context.entityName}'s month-end verified closing balance exceeds 40% of monthly issuance for ${problematicMaterials.length} material${problematicMaterials.length > 1 ? "s" : ""}: ${materialList}. This suggests over-issuance or under-consumption.`,
    
    whyItMatters: `Approximately ₹${totalTiedUpValue.toFixed(2)} worth of materials is sitting idle with ${context.entityName}, representing working capital unnecessarily tied up. While not directly wasteful, this reduces cash flow efficiency and increases risk of expiry/damage.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Review ${context.entityName}'s monthly issuance quantities. Compare with actual consumption patterns over last 3 months.`,
        owner: "Store Manager",
      },
      {
        step: 2,
        action: `Reduce next month's issuance by 20-30% for the over-stocked materials. Monitor if washer requests additional issuance.`,
        owner: "Store Manager",
      },
      {
        step: 3,
        action: `Implement dynamic issuance: issue based on (Previous Month Consumption × 1.1) rather than fixed quantities.`,
        owner: "Operations Manager",
      },
    ],
    
    primaryOwner: "Store Manager",
    
    expectedImpact: `Optimizing issuance to match actual usage frees up ₹${totalTiedUpValue.toFixed(2)} in working capital and reduces storage/handling burden. No direct cost savings, but improves operational efficiency.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: problematicMaterials.reduce((sum, m) => sum + m.closingBalancePercent, 0) / problematicMaterials.length,
      idealValue: 40,
      variance: 0,
      variancePercent: 0,
      financialImpact: 0,
    },
  };
}

// ============================================
// DIAGNOSIS 9: BATCH PRICE INCREASE IMPACT
// ============================================

function checkBatchPriceIncrease(context: AnalysisContext): Recommendation | null {
  if (!context.batchPriceComparison) return null;
  
  const significantIncreases = context.batchPriceComparison.filter(
    (b) => b.priceIncreasePercent > 5
  );
  
  if (significantIncreases.length === 0) return null;
  
  const totalImpact = significantIncreases.reduce(
    (sum, b) => sum + b.priceIncrease * (context.actualJobs * 0.05), // Rough estimate
    0
  );
  
  const materialList = significantIncreases
    .map((b) => `${b.materialName} (+${b.priceIncreasePercent.toFixed(1)}%)`)
    .join(", ");
  
  return {
    id: `rec-${context.entityId}-price-increase-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Medium",
    diagnosisCategory: "Batch Price Increase Impact",
    
    whatIsHappening: `The FIFO batch consumed this month has higher cost per unit than previous month for ${significantIncreases.length} material${significantIncreases.length > 1 ? "s" : ""}: ${materialList}. This is causing consumable cost per wash to rise.`,
    
    whyItMatters: `Supplier price increases are driving up costs by approximately ₹${totalImpact.toFixed(2)} this month. This is not a consumption efficiency issue — it's a procurement issue. If prices remain elevated, annual impact: ₹${(totalImpact * 12).toFixed(2)}.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Contact suppliers of ${significantIncreases.map(b => b.materialName).join(", ")} to understand reason for price increase and negotiate rollback or discount.`,
        owner: "Purchase Manager",
      },
      {
        step: 2,
        action: `Evaluate alternative suppliers for these materials. Request quotes from at least 2 competitors.`,
        owner: "Purchase Manager",
      },
      {
        step: 3,
        action: `If price increase is unavoidable, update Cost Per Wash calculators and customer pricing to reflect new cost baseline.`,
        owner: "Finance Manager",
      },
    ],
    
    primaryOwner: "Purchase Manager",
    
    expectedImpact: `If procurement can negotiate a 50% rollback or find cheaper supplier, monthly savings: ₹${(totalImpact / 2).toFixed(2)}. If unavoidable, flagging allows proactive pricing adjustments.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: significantIncreases[0]?.currentBatchCost || 0,
      idealValue: significantIncreases[0]?.previousBatchCost || 0,
      variance: significantIncreases[0]?.priceIncrease || 0,
      variancePercent: significantIncreases[0]?.priceIncreasePercent || 0,
      financialImpact: totalImpact,
    },
  };
}

// ============================================
// DIAGNOSIS 10: TEAM ATTAINMENT SPREAD
// ============================================

function checkTeamAttainmentSpread(context: AnalysisContext): Recommendation | null {
  if (!context.teamWasherMetrics || context.teamWasherMetrics.length < 2) return null;
  
  const jobs = context.teamWasherMetrics.map(w => w.jobs);
  const highestJobs = Math.max(...jobs);
  const lowestJobs = Math.min(...jobs);
  const spread = highestJobs - lowestJobs;
  const spreadPercent = (spread / highestJobs) * 100;
  
  // Trigger if spread >25%
  if (spreadPercent <= 25) return null;
  
  const highestWasher = context.teamWasherMetrics.find(w => w.jobs === highestJobs);
  const lowestWasher = context.teamWasherMetrics.find(w => w.jobs === lowestJobs);
  
  if (!highestWasher || !lowestWasher) return null;
  
  return {
    id: `rec-${context.entityId}-team-spread-${Date.now()}`,
    entityType: context.entityType,
    entityId: context.entityId,
    entityName: context.entityName,
    period: context.period,
    periodStart: context.periodStart,
    periodEnd: context.periodEnd,
    
    priority: "Medium",
    diagnosisCategory: "Team Attainment Spread",
    
    whatIsHappening: `Within ${context.supervisorName}'s team, job distribution varies significantly: ${highestWasher.washerName} completed ${highestJobs} jobs while ${lowestWasher.washerName} completed only ${lowestJobs} jobs — a spread of ${spread} jobs (${spreadPercent.toFixed(1)}%).`,
    
    whyItMatters: `This unequal distribution creates team fairness and motivation issues. ${lowestWasher.washerName} may feel underutilized while ${highestWasher.washerName} may feel overburdened. It also suggests inefficient job allocation rather than productivity differences.`,
    
    actionSteps: [
      {
        step: 1,
        action: `Analyze route assignments for both washers. Check if ${lowestWasher.washerName} has a geographically disadvantaged route with fewer customers.`,
        owner: "Operations Manager",
      },
      {
        step: 2,
        action: `Review if ${lowestWasher.washerName} had more leave days, equipment issues, or customer cancellations than ${highestWasher.washerName}.`,
        owner: "Supervisor",
      },
      {
        step: 3,
        action: `Rebalance job allocation next month: aim for all washers in team to be within ±15% of team average (${Math.round(context.actualJobs / context.teamWasherMetrics.length)} jobs/washer).`,
        owner: "Operations Manager",
      },
    ],
    
    primaryOwner: "Operations Manager",
    
    expectedImpact: `Balancing job distribution improves team morale and ensures all washers contribute equally to revenue. Target: bring ${lowestWasher.washerName} up to ${Math.round(context.actualJobs / context.teamWasherMetrics.length)} jobs/month.`,
    
    status: "Not Started",
    raisedOn: new Date().toISOString(),
    
    metrics: {
      actualValue: spreadPercent,
      idealValue: 15, // ±15% spread is acceptable
      variance: spreadPercent - 15,
      variancePercent: spreadPercent,
      financialImpact: 0,
    },
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: RecommendationPriority): string {
  switch (priority) {
    case "High":
      return "bg-red-100 text-red-800 border-red-300";
    case "Medium":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "Low":
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

/**
 * Get status badge color
 */
export function getStatusColor(status: RecommendationStatus): string {
  switch (status) {
    case "Not Started":
      return "bg-gray-100 text-gray-700 border-gray-300";
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-300";
    case "Completed":
      return "bg-green-100 text-green-700 border-green-300";
  }
}

/**
 * Get icon name for diagnosis category
 */
export function getDiagnosisIcon(category: DiagnosisCategory): string {
  const config = DIAGNOSIS_CONFIGS.find(c => c.category === category);
  return config?.icon || "AlertCircle";
}

/**
 * Count recommendations by priority
 */
export function countByPriority(recommendations: Recommendation[]): {
  high: number;
  medium: number;
  low: number;
} {
  return {
    high: recommendations.filter(r => r.priority === "High").length,
    medium: recommendations.filter(r => r.priority === "Medium").length,
    low: recommendations.filter(r => r.priority === "Low").length,
  };
}

/**
 * Count recommendations by status
 */
export function countByStatus(recommendations: Recommendation[]): {
  notStarted: number;
  inProgress: number;
  completed: number;
} {
  return {
    notStarted: recommendations.filter(r => r.status === "Not Started").length,
    inProgress: recommendations.filter(r => r.status === "In Progress").length,
    completed: recommendations.filter(r => r.status === "Completed").length,
  };
}