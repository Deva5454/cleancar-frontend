// Part 11 - Additional Recommendations Based on Dummy Data Integration
// These recommendations are derived from specific washer performance data

import { type Recommendation } from "./recommendationEngine";

export const PART_11_RECOMMENDATIONS: Recommendation[] = [
  // Recommendation 2: Quality Risk - Consumable Under-Consumption - Suresh Kumar
  {
    id: "rec-washer-suresh-underconsumption-foam",
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    period: "March 2026",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    
    priority: "High",
    diagnosisCategory: "Consumable Under-Consumption",
    
    whatIsHappening: "Suresh used 1,035ml of Foam Shampoo in March against the standard ideal of 17,000ml for his package mix — only 6.1% of the standard quantity. This is extreme under-consumption and requires investigation.",
    
    whyItMatters: "While Suresh's consumable CPW appears efficient at ₹6.24, the 93.9% reduction in shampoo use strongly suggests either under-application (service quality risk for 180 Premium and 120 Elite customers who expect shampoo service) or the standard usage rates are significantly overestimated for actual field conditions.",
    
    actionSteps: [
      {
        step: 1,
        action: "Supervisor Ramesh to urgently conduct a quality audit — accompany Suresh on 3 jobs across Basic, Premium, and Elite packages. Measure actual shampoo applied.",
        owner: "Supervisor",
      },
      {
        step: 2,
        action: "If under-application confirmed — immediate retraining on correct dosage.",
        owner: "Supervisor",
      },
      {
        step: 3,
        action: "If application is correct but standard rates are set too high — Admin to review standard usage rates across all washers for calibration. Compare Suresh's consumption against all other washers.",
        owner: "Admin",
      },
      {
        step: 4,
        action: "Check customer feedback for Suresh's jobs — are quality scores lower than team average?",
        owner: "Operations Manager",
      },
    ],
    
    primaryOwner: "Supervisor",
    
    expectedImpact: "Correcting under-application brings service quality to contracted standard — reducing churn risk for 300 affected customers this month.",
    
    status: "Not Started",
    raisedOn: "2026-04-01T11:20:00Z",
    
    metrics: {
      actualValue: 1035,
      idealValue: 17000,
      variance: -15965,
      variancePercent: -93.9,
      financialImpact: 0, // Quality risk, not direct cost
    },
  },

  // Recommendation 3: Supervisor Underutilization - Ramesh Patel (from dummy data)
  {
    id: "rec-supervisor-ramesh-underutil",
    entityType: "Supervisor",
    entityId: "supervisor-ramesh",
    entityName: "Ramesh Patel",
    period: "March 2026",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    
    priority: "High",
    diagnosisCategory: "Supervisor Underutilization",
    
    whatIsHappening: "Ramesh manages 5 washers against the ideal team size of 17. Supervisor salary allocation per wash: ₹10.70 actual vs ₹2.69 ideal — 3.98× the ideal.",
    
    whyItMatters: "The ₹8.01/wash supervisor excess × 2,336 team jobs = ₹18,711 in excess supervisor cost in March alone. Annualised: ₹2,24,532. Same impact exists for Supervisor Priya Mehta in PIN 395006 (3 washers): ₹[calculated figure].",
    
    actionSteps: [
      {
        step: 1,
        action: "Recruit 12 additional washers for PIN 395005 (Adajan) over the next 3 months. At current TSE activity level, 12 new subscriptions needed per washer per month to support 12 new washers.",
        owner: "HR",
      },
      {
        step: 2,
        action: "Operations Manager to review if adjacent PIN codes (395004 Udhna, 395007 Althan) can be folded under Ramesh's supervisory area during expansion — allowing washer headcount to grow without adding a new supervisor prematurely.",
        owner: "Operations Manager",
      },
      {
        step: 3,
        action: "HR to initiate washer recruitment drive for Adajan zone immediately.",
        owner: "HR",
      },
    ],
    
    primaryOwner: "Operations Manager",
    
    expectedImpact: "Growing to 17 washers under Ramesh reduces supervisor CPW from ₹10.70 to ₹2.69 — saving ₹8.01/wash × (17 × 21 × 26) = ₹72,441/month at full team capacity.",
    
    status: "Not Started",
    raisedOn: "2026-04-01T11:25:00Z",
    
    metrics: {
      actualValue: 10.70,
      idealValue: 2.69,
      variance: 8.01,
      variancePercent: 297.8,
      financialImpact: 18711,
    },
  },

  // Recommendation 4: High Carry-Forward - Suresh Kumar Foam Shampoo
  {
    id: "rec-washer-suresh-carryforward-foam",
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    period: "March 2026",
    periodStart: "2026-03-01",
    periodEnd: "2026-03-31",
    
    priority: "Low",
    diagnosisCategory: "High Carry-Forward Stock",
    
    whatIsHappening: "Suresh's verified closing balance for Foam Shampoo is 185ml. Combined with his two issuances of 500ml each in March plus the 220ml carry-forward, his total available was 1,220ml. He consumed only 1,035ml — leaving 185ml carry-forward into April. Additionally, the April opening balance 185ml is from Batch BATCH-SHMP-20260101-001 at ₹0.82/ml while the newer batch BATCH-SHMP-20260201-001 at ₹0.88/ml was also partially issued.",
    
    whyItMatters: "If the standard monthly issuance (500ml) is issued again in April, Suresh will start April with 185 + 500 = 685ml — more than half a month's supply already in hand before month starts. At his actual consumption rate of 1,035ml/month, this means he is adequately stocked for most of April already.",
    
    actionSteps: [
      {
        step: 1,
        action: "Store Manager to pause April shampoo issuance for Suresh until his balance drops below 200ml. Flag as \"Do Not Issue — Shampoo\" in bulk issuance grid for Suresh for April.",
        owner: "Store Manager",
      },
      {
        step: 2,
        action: "Confirm Batch 001 (185ml carry-forward) will be consumed before Batch 002 — FIFO system enforces this automatically.",
        owner: "Store Manager",
      },
    ],
    
    primaryOwner: "Store Manager",
    
    expectedImpact: "Pausing one month's issuance of 500ml × ₹0.88 = ₹440 in working capital freed. No expiry risk as Batch 001 expires [date — well in future].",
    
    status: "Not Started",
    raisedOn: "2026-04-01T11:30:00Z",
    
    metrics: {
      actualValue: 185,
      idealValue: 50, // Ideal carry-forward
      variance: 135,
      variancePercent: 270,
      financialImpact: 0, // Working capital optimization
    },
  },
];

/**
 * Combine all recommendations (original + Part 11)
 */
export function getAllRecommendations(): Recommendation[] {
  // Import and combine with MOCK_RECOMMENDATIONS from recommendationMockData
  return PART_11_RECOMMENDATIONS;
}
