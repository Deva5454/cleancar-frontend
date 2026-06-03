/**
 * AI Decision Engine (Rule-Based)
 * Analyzes city performance and generates actionable suggestions
 *
 * Note: This is a RULE-BASED system, not ML/AI (yet)
 * Future: Can be replaced with actual ML models
 */

import { logger } from "./logger";

// ========== TYPES ==========

export interface CityPerformanceInput {
  cityId: string;
  cityName: string;
  revenue: number;
  revenueTarget: number;
  cost: number;
  margin: number; // percentage
  targetMargin: number; // percentage
  totalJobs: number;
  incentiveMultiplier: number;
}

export type SuggestionPriority = "CRITICAL" | "WARNING" | "OPPORTUNITY" | "INFO";

export interface BusinessSuggestion {
  id: string;
  priority: SuggestionPriority;
  category: "REVENUE" | "COST" | "MARGIN" | "GROWTH" | "EFFICIENCY" | "INCENTIVE";
  message: string;
  action: string;
  impact: "HIGH" | "MEDIUM" | "LOW";
  reasoning: string;
}

export interface DecisionEngineResult {
  cityId: string;
  cityName: string;
  overallHealth: "EXCELLENT" | "HEALTHY" | "AT_RISK" | "CRITICAL";
  score: number; // 0-100
  suggestions: BusinessSuggestion[];
  generatedAt: string;
}

// ========== CONFIGURATION ==========

const THRESHOLDS = {
  REVENUE: {
    CRITICAL: 0.7,   // < 70% of target
    WARNING: 0.85,   // < 85% of target
    GOOD: 0.95,      // >= 95% of target
    EXCELLENT: 1.1,  // >= 110% of target
  },
  MARGIN: {
    CRITICAL: 15,    // < 15%
    WARNING: 20,     // < 20%
    GOOD: 25,        // >= 25%
    EXCELLENT: 35,   // >= 35%
  },
  COST_RATIO: {
    CRITICAL: 0.8,   // > 80% of revenue
    WARNING: 0.75,   // > 75% of revenue
    GOOD: 0.7,       // <= 70% of revenue
    EXCELLENT: 0.6,  // <= 60% of revenue
  },
};

// ========== CORE DECISION ENGINE ==========

/**
 * Generate smart business suggestions for a city
 * Based on performance metrics and city-specific targets
 */
export function generateCitySuggestions(input: CityPerformanceInput): DecisionEngineResult {
  const suggestions: BusinessSuggestion[] = [];
  let suggestionCounter = 0;

  const revenueRatio = input.revenue / input.revenueTarget;
  const costRatio = input.cost / input.revenue;
  const marginGap = input.margin - input.targetMargin;

  logger.debug("Decision engine analyzing city", {
    cityId: input.cityId,
    revenueRatio,
    costRatio,
    marginGap,
  });

  // ========== REVENUE ANALYSIS ==========

  if (revenueRatio < THRESHOLDS.REVENUE.CRITICAL) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "CRITICAL",
      category: "REVENUE",
      message: `Revenue at ${(revenueRatio * 100).toFixed(0)}% of target`,
      action: "Urgent: Increase daily job volume by 20-30% or raise prices 10-15%",
      impact: "HIGH",
      reasoning: `Current revenue ₹${(input.revenue / 100000).toFixed(1)}L vs target ₹${(input.revenueTarget / 100000).toFixed(1)}L. Gap of ₹${((input.revenueTarget - input.revenue) / 100000).toFixed(1)}L threatens profitability.`,
    });
  } else if (revenueRatio < THRESHOLDS.REVENUE.WARNING) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "WARNING",
      category: "REVENUE",
      message: `Revenue at ${(revenueRatio * 100).toFixed(0)}% of target`,
      action: "Increase marketing spend or launch promotional campaigns",
      impact: "MEDIUM",
      reasoning: `Need ₹${((input.revenueTarget - input.revenue) / 100000).toFixed(1)}L more to hit target. Focus on customer acquisition.`,
    });
  } else if (revenueRatio >= THRESHOLDS.REVENUE.EXCELLENT) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "OPPORTUNITY",
      category: "GROWTH",
      message: `Revenue at ${(revenueRatio * 100).toFixed(0)}% of target - Exceeding expectations!`,
      action: "Scale operations: Add teams, expand coverage, or increase prices",
      impact: "HIGH",
      reasoning: `Overperformance of ₹${((input.revenue - input.revenueTarget) / 100000).toFixed(1)}L indicates strong market demand. Time to grow.`,
    });
  }

  // ========== MARGIN ANALYSIS ==========

  if (input.margin < THRESHOLDS.MARGIN.CRITICAL) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "CRITICAL",
      category: "MARGIN",
      message: `Margin critically low at ${input.margin.toFixed(1)}%`,
      action: "Emergency cost audit: Review labor, materials, and operational waste",
      impact: "HIGH",
      reasoning: `Margin ${(input.targetMargin - input.margin).toFixed(1)}% below target. Business sustainability at risk.`,
    });
  } else if (input.margin < THRESHOLDS.MARGIN.WARNING) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "WARNING",
      category: "MARGIN",
      message: `Margin at ${input.margin.toFixed(1)}% (target: ${input.targetMargin}%)`,
      action: "Optimize vendor contracts or reduce material waste by 10-15%",
      impact: "MEDIUM",
      reasoning: `Margin gap of ${(input.targetMargin - input.margin).toFixed(1)}% reducing profitability. Focus on cost efficiency.`,
    });
  } else if (input.margin >= THRESHOLDS.MARGIN.EXCELLENT) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "OPPORTUNITY",
      category: "EFFICIENCY",
      message: `Excellent margin at ${input.margin.toFixed(1)}%`,
      action: "Consider strategic pricing adjustments to capture more market share",
      impact: "MEDIUM",
      reasoning: `Margin ${(input.margin - input.targetMargin).toFixed(1)}% above target. Room for competitive pricing or growth investment.`,
    });
  }

  // ========== COST RATIO ANALYSIS ==========

  if (costRatio > THRESHOLDS.COST_RATIO.CRITICAL) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "CRITICAL",
      category: "COST",
      message: `Costs consuming ${(costRatio * 100).toFixed(0)}% of revenue`,
      action: "Immediate intervention: Audit inventory usage, labor efficiency, and vendor pricing",
      impact: "HIGH",
      reasoning: `Cost of ₹${(input.cost / 100000).toFixed(1)}L on revenue ₹${(input.revenue / 100000).toFixed(1)}L is unsustainable. Target <70%.`,
    });
  } else if (costRatio > THRESHOLDS.COST_RATIO.WARNING) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "WARNING",
      category: "COST",
      message: `Cost ratio at ${(costRatio * 100).toFixed(0)}% of revenue`,
      action: "Negotiate better vendor terms or improve operational efficiency",
      impact: "MEDIUM",
      reasoning: `Costs slightly high. Reducing by 5-10% would significantly improve margins.`,
    });
  } else if (costRatio <= THRESHOLDS.COST_RATIO.EXCELLENT) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "INFO",
      category: "EFFICIENCY",
      message: `Excellent cost control at ${(costRatio * 100).toFixed(0)}% of revenue`,
      action: "Maintain current efficiency standards and share best practices",
      impact: "LOW",
      reasoning: `Cost management is excellent. Document and replicate processes across other cities.`,
    });
  }

  // ========== COMBINED PERFORMANCE (REVENUE + MARGIN) ==========

  if (revenueRatio >= THRESHOLDS.REVENUE.GOOD && input.margin >= THRESHOLDS.MARGIN.GOOD) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "OPPORTUNITY",
      category: "GROWTH",
      message: "Strong overall performance - revenue and margin both healthy",
      action: "Increase team incentives to sustain momentum and attract top talent",
      impact: "MEDIUM",
      reasoning: `Both metrics above target. Rewarding teams will maintain high performance culture.`,
    });
  }

  // ========== INCENTIVE MULTIPLIER ANALYSIS ==========

  if (input.incentiveMultiplier > 1.0 && input.margin < input.targetMargin) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "WARNING",
      category: "INCENTIVE",
      message: `City has ${input.incentiveMultiplier}x incentive multiplier but margin below target`,
      action: "Review incentive structure or provide additional operational support",
      impact: "MEDIUM",
      reasoning: `Higher multiplier intended to compensate for tough economics, but results not meeting expectations. Team may need training or resources.`,
    });
  }

  if (input.incentiveMultiplier < 1.0 && input.margin >= THRESHOLDS.MARGIN.EXCELLENT) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "OPPORTUNITY",
      category: "INCENTIVE",
      message: `Exceptional performance despite ${input.incentiveMultiplier}x multiplier`,
      action: "Consider normalizing incentives to 1.0x as market conditions are favorable",
      impact: "LOW",
      reasoning: `Team outperforming with reduced incentives. May indicate market opportunity allows standard compensation.`,
    });
  }

  // ========== JOB VOLUME ANALYSIS ==========

  const avgJobValue = input.totalJobs > 0 ? input.revenue / input.totalJobs : 0;
  const costPerJob = input.totalJobs > 0 ? input.cost / input.totalJobs : 0;

  if (avgJobValue < 150) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "WARNING",
      category: "REVENUE",
      message: `Average job value low at ₹${avgJobValue.toFixed(0)}`,
      action: "Upsell add-on services or target higher-value customer segments",
      impact: "MEDIUM",
      reasoning: `Low transaction value limits revenue potential. Focus on premium packages or additional services.`,
    });
  }

  if (costPerJob > avgJobValue * 0.7) {
    suggestions.push({
      id: `suggestion-${suggestionCounter++}`,
      priority: "CRITICAL",
      category: "COST",
      message: `Cost per job (₹${costPerJob.toFixed(0)}) too high relative to job value (₹${avgJobValue.toFixed(0)})`,
      action: "Standardize job processes or reduce material waste per job",
      impact: "HIGH",
      reasoning: `Jobs barely profitable. Need to reduce cost per job by at least 15-20%.`,
    });
  }

  // ========== CALCULATE OVERALL HEALTH SCORE ==========

  let healthScore = 50; // Base score

  // Revenue contribution (max 30 points)
  if (revenueRatio >= 1.1) healthScore += 30;
  else if (revenueRatio >= 0.95) healthScore += 25;
  else if (revenueRatio >= 0.85) healthScore += 15;
  else if (revenueRatio >= 0.7) healthScore += 5;

  // Margin contribution (max 30 points)
  if (input.margin >= 35) healthScore += 30;
  else if (input.margin >= 25) healthScore += 25;
  else if (input.margin >= 20) healthScore += 15;
  else if (input.margin >= 15) healthScore += 5;

  // Cost efficiency contribution (max 20 points)
  if (costRatio <= 0.6) healthScore += 20;
  else if (costRatio <= 0.7) healthScore += 15;
  else if (costRatio <= 0.75) healthScore += 10;
  else if (costRatio <= 0.8) healthScore += 5;

  // Determine overall health status
  let overallHealth: "EXCELLENT" | "HEALTHY" | "AT_RISK" | "CRITICAL";
  if (healthScore >= 90) overallHealth = "EXCELLENT";
  else if (healthScore >= 70) overallHealth = "HEALTHY";
  else if (healthScore >= 50) overallHealth = "AT_RISK";
  else overallHealth = "CRITICAL";

  logger.log("Decision engine completed", {
    cityId: input.cityId,
    healthScore,
    overallHealth,
    suggestionsCount: suggestions.length,
  });

  return {
    cityId: input.cityId,
    cityName: input.cityName,
    overallHealth,
    score: healthScore,
    suggestions,
    generatedAt: new Date().toISOString(),
  };
}

// ========== HELPER FUNCTIONS ==========

/**
 * Get priority color for UI display
 */
export function getPriorityColor(priority: SuggestionPriority): string {
  switch (priority) {
    case "CRITICAL":
      return "bg-red-100 text-red-800 border-red-300";
    case "WARNING":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "OPPORTUNITY":
      return "bg-green-100 text-green-800 border-green-300";
    case "INFO":
      return "bg-blue-100 text-blue-800 border-blue-300";
  }
}

/**
 * Get health status color
 */
export function getHealthColor(health: string): string {
  switch (health) {
    case "EXCELLENT":
      return "bg-green-600 text-white";
    case "HEALTHY":
      return "bg-blue-600 text-white";
    case "AT_RISK":
      return "bg-yellow-600 text-white";
    case "CRITICAL":
      return "bg-red-600 text-white";
    default:
      return "bg-gray-600 text-white";
  }
}

/**
 * Get category icon name (for lucide-react)
 */
export function getCategoryIcon(category: string): string {
  switch (category) {
    case "REVENUE":
      return "DollarSign";
    case "COST":
      return "TrendingDown";
    case "MARGIN":
      return "Target";
    case "GROWTH":
      return "TrendingUp";
    case "EFFICIENCY":
      return "Zap";
    case "INCENTIVE":
      return "Award";
    default:
      return "Info";
  }
}

/**
 * Batch analyze multiple cities
 */
export function analyzeMultipleCities(
  cities: CityPerformanceInput[]
): DecisionEngineResult[] {
  return cities.map(city => generateCitySuggestions(city));
}

/**
 * Get aggregated insights across all cities
 */
export function getAggregatedInsights(results: DecisionEngineResult[]): {
  totalCritical: number;
  totalWarnings: number;
  averageScore: number;
  topPerformers: string[];
  needsAttention: string[];
} {
  const totalCritical = results.reduce(
    (sum, r) => sum + r.suggestions.filter(s => s.priority === "CRITICAL").length,
    0
  );

  const totalWarnings = results.reduce(
    (sum, r) => sum + r.suggestions.filter(s => s.priority === "WARNING").length,
    0
  );

  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  const sorted = [...results].sort((a, b) => b.score - a.score);
  const topPerformers = sorted.slice(0, 3).map(r => r.cityName);
  const needsAttention = sorted.slice(-3).map(r => r.cityName);

  return {
    totalCritical,
    totalWarnings,
    averageScore,
    topPerformers,
    needsAttention,
  };
}
