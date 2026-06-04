/**
 * TELE SALES EXECUTIVE (TSE) SERVICE
 * Central data service for TSE operations
 *
 * ✅ INTEGRATED: Now uses subscriptionPlansService for real plan data
 * ⚠️ DEPRECATED: Lead queue (getLeadQueue) replaced by pincode-based routing
 *
 * IMPORTANT:
 * - Leads are now assigned via organizationHierarchyService.assignLeadByPincode()
 * - TSE queues are populated from MASTER_LEADS filtered by assignedTo
 * - DO NOT use getLeadQueue() for new implementations
 * - All new leads auto-assigned to TSE by territory (pincode)
 *
 * Migration path:
 * - Old: teleSalesExecutiveService.getLeadQueue() → TSELead[]
 * - New: MASTER_LEADS.filter(lead => lead.assignedTo === tseId)
 */

import type {
  TSELead,
  TSEDailyStats,
  TSEIncentives,
  CallHistory,
  PricingCalculation,
  AddOnOption,
  BundleOption,
  RenewalLead,
  TSEAlert,
} from "../types/teleSalesExecutive.types";
import {
  ADD_ON_OPTIONS,
  BUNDLE_DISCOUNT_TIERS,
  EBITDA_FLOOR,
  INCENTIVE_MULTIPLIERS,
  FIXED_SALARY,
  COMMISSION_TIERS,
  RENEWAL_BONUS,
} from "../constants/teleSalesExecutive.constants";
import { subscriptionPlansService } from "./subscriptionPlansService";
import type { VehicleCategoryName, PlanTier } from "../types/subscriptionPlans.types";

class TeleSalesExecutiveService {
  // In-memory lead cache so updates persist within a session
  private _leadsCache: TSELead[] | null = null;

  // ============================================
  // SUBSCRIPTION PLAN INTEGRATION
  // ============================================

  /**
   * Map TSE vehicle category to subscription plan category name
   */
  private mapToSubscriptionCategory(
    vehicleType: "4W" | "2W",
    tseCategory?: string
  ): VehicleCategoryName {
    // 4-Wheeler mappings
    if (vehicleType === "4W") {
      if (tseCategory === "HATCHBACK" || tseCategory === "SEDAN") {
        return "HATCHBACK_COMPACT_SEDAN";
      }
      if (tseCategory === "SUV") {
        return "SUV_MUV_SEDAN";
      }
      if (tseCategory === "LUXURY") {
        return "LUXURY_LARGE_SUV";
      }
      // Default for 4W
      return "SUV_MUV_SEDAN";
    }

    // 2-Wheeler mappings
    if (vehicleType === "2W") {
      if (tseCategory === "SCOOTER") {
        return "SCOOTER";
      }
      if (tseCategory === "BIKE") {
        return "STANDARD_COMMUTER_BIKE"; // Default to standard
      }
      // Default for 2W
      return "STANDARD_COMMUTER_BIKE";
    }

    // Fallback
    return "SUV_MUV_SEDAN";
  }

  /**
   * Get available plans for a lead based on their vehicle
   */
  getAvailablePlansForLead(lead: TSELead): PlanTier[] {
    const subscriptionCategory = this.mapToSubscriptionCategory(
      lead.vehicleType,
      lead.vehicleCategory
    );

    // Get all vehicle categories and find the matching one
    const allCategories = subscriptionPlansService.getVehicleCategories();
    const matchedCategory = allCategories.find(
      (cat) => cat.name === subscriptionCategory
    );

    if (!matchedCategory) {
      console.warn(`No subscription category found for ${subscriptionCategory}`);
      return [];
    }

    // Get plan tiers for this category
    const plans = subscriptionPlansService.getPlanTiersByCategory(matchedCategory.id);
    return plans || [];
  }

  /**
   * Get recommended plan for a lead (highest value tier available)
   */
  getRecommendedPlanForLead(lead: TSELead): PlanTier | null {
    const availablePlans = this.getAvailablePlansForLead(lead);
    if (availablePlans.length === 0) return null;

    // Return the highest-priced plan (usually SHAMPOO_WAX or SHAMPOO_POLISH)
    const sortedByPrice = [...availablePlans].sort(
      (a, b) => b.baseMonthlyPrice - a.baseMonthlyPrice
    );

    return sortedByPrice[0];
  }

  // ============================================
  // LEAD QUEUE MANAGEMENT
  // ============================================

  /**
   * Get all leads assigned to TSE, sorted by priority
   */
  getLeadQueue(): TSELead[] {
    // Return cached leads if already loaded (persists updates within session)
    if (this._leadsCache !== null) return this._leadsCache;

    const now = new Date();

    const mockLeads: TSELead[] = [
      {
        id: "lead-001",
        customerName: "Rajesh Kumar",
        phone: "+91 98765 43210",
        vehicleType: "4W",
        vehicleCategory: "SUV",
        source: "DIGITAL",
        status: "NEW",
        assignedAt: new Date(now.getTime() - 8 * 60 * 1000), // 8 minutes ago
        attemptCount: 0,
        slaStatus: "AT_RISK",
        slaMinutesRemaining: 2,
        estimatedValue: 1999,
        priority: "URGENT",
        tags: [],
      },
      {
        id: "lead-002",
        customerName: "Priya Sharma",
        phone: "+91 98765 43211",
        vehicleType: "4W",
        vehicleCategory: "HATCHBACK",
        source: "BTL_REFERRAL",
        status: "CALLBACK",
        assignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        attemptCount: 3,
        slaStatus: "MET",
        slaMinutesRemaining: 0,
        nextFollowUpAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
        estimatedValue: 1299,
        priority: "HIGH",
        tags: ["Price Concern", "Interested"],
      },
      {
        id: "lead-003",
        customerName: "Amit Verma",
        phone: "+91 98765 43212",
        vehicleType: "2W",
        vehicleCategory: "BIKE",
        source: "DIGITAL",
        status: "INTERESTED",
        assignedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Yesterday
        attemptCount: 5,
        slaStatus: "MET",
        slaMinutesRemaining: 0,
        nextFollowUpAt: now, // Due now
        estimatedValue: 699,  // B5 FIX: was 499 (one-time visit price) — should be monthly plan price
        priority: "HIGH",
        tags: ["Quality Question"],
      },
      {
        id: "lead-004",
        customerName: "Sneha Patel",
        phone: "+91 98765 43213",
        vehicleType: "4W",
        vehicleCategory: "SEDAN",
        source: "SOCIAL_MEDIA",
        status: "NEW",
        assignedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        attemptCount: 0,
        slaStatus: "MET",
        slaMinutesRemaining: 5,
        estimatedValue: 1699,
        priority: "NORMAL",
        tags: [],
      },
      {
        id: "lead-005",
        customerName: "Vikram Singh",
        phone: "+91 98765 43214",
        vehicleType: "4W",
        vehicleCategory: "LUXURY",
        source: "PARTNER",
        status: "NOT_ANSWERED",
        assignedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
        attemptCount: 8,
        slaStatus: "MET",
        slaMinutesRemaining: 0,
        nextFollowUpAt: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
        estimatedValue: 2999,
        priority: "NORMAL",
        tags: ["Decision Maker Not Available"],
      },
    ];

    // Sort by priority: URGENT > HIGH > NORMAL, then by SLA time
    return mockLeads.sort((a, b) => {
      const priorityOrder = { URGENT: 0, HIGH: 1, NORMAL: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.slaMinutesRemaining - b.slaMinutesRemaining;
    });
  }

  /**
   * Get lead details by ID
   */
  getLeadById(leadId: string): TSELead | null {
    const leads = this.getLeadQueue();
    return leads.find((lead) => lead.id === leadId) || null;
  }

  // ============================================
  // CALL HISTORY
  // ============================================

  /**
   * Get call history for a lead
   */
  getCallHistory(leadId: string): CallHistory[] {
    const mockHistory: CallHistory[] = [
      {
        id: "call-001",
        leadId,
        calledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        duration: 180, // 3 minutes
        outcome: "NOT_ANSWERED",
        notes: "No answer, will try again",
        paymentLinkSent: false,
      },
      {
        id: "call-002",
        leadId,
        calledAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        duration: 420, // 7 minutes
        outcome: "INTERESTED",
        notes: "Customer interested, asked about pricing for SUV",
        paymentLinkSent: false,
      },
      {
        id: "call-003",
        leadId,
        calledAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        duration: 240, // 4 minutes
        outcome: "CALLBACK",
        notes: "Requested callback tomorrow at 11 AM",
        addOnOffered: "Interior Deep Vacuum",
        paymentLinkSent: false,
      },
    ];

    return mockHistory;
  }

  // ============================================
  // PRICING ENGINE
  // ============================================

  /**
   * Get available add-on options
   */
  getAddOnOptions(): AddOnOption[] {
    return ADD_ON_OPTIONS as any;
  }

  /**
   * Calculate bundle options dynamically from the actual plan base price.
   * Uses BUNDLE_DISCOUNT_TIERS (% discounts) applied to the real plan price.
   * No more hardcoded SUV_COMBO prices.
   *
   * @param vehicleCategory - e.g. "HATCHBACK" | "SUV" | "LUXURY"
   * @param basePrice - actual monthly plan price for this lead (from getPlanTiersByCategory)
   */
  calculateBundleOptions(vehicleCategory: string, basePrice: number): BundleOption[] {
    // Ensure we have a real price — if basePrice is 0 or very low something is wrong upstream
    const safeBasePrice = basePrice > 0 ? basePrice : 1599; // fallback to Smart Wash Hatchback

    const calculateEBITDA = (price: number) => {
      const assumedCost = price * 0.65; // 65% assumed cost ratio
      const ebitda = ((price - assumedCost) / price) * 100;
      return Math.round(ebitda);
    };

    const tiers = (["HIGH", "MID", "LOW"] as const);

    return tiers.map((tier) => {
      const config = BUNDLE_DISCOUNT_TIERS[tier];
      const price = Math.round(safeBasePrice * (1 - config.discountPercent / 100));
      const savings = safeBasePrice - price;
      const savingsPercent = config.discountPercent;
      const ebitda = calculateEBITDA(price);

      let ebitdaStatus: "SAFE" | "WARNING" | "BLOCKED" = "SAFE";
      if (ebitda < EBITDA_FLOOR.MINIMUM_PERCENT) {
        ebitdaStatus = "BLOCKED";
      } else if (ebitda < EBITDA_FLOOR.WARNING_PERCENT) {
        ebitdaStatus = "WARNING";
      }

      const multiplier = tier === "MID"  ? INCENTIVE_MULTIPLIERS.BUNDLE_MID  :
                         tier === "LOW"  ? INCENTIVE_MULTIPLIERS.BUNDLE_LOW  :
                                          INCENTIVE_MULTIPLIERS.BUNDLE_HIGH;

      return {
        tier,
        label:           config.label,
        price,
        normalPrice:     safeBasePrice,
        savings,
        savingsPercent,
        ebitda,
        ebitdaStatus,
        incentiveMultiplier: multiplier,
        description:     config.description,
      };
    });
  }

  /**
   * Calculate final pricing with selected options
   * Now accepts optional plan parameter to use actual plan data
   */
  calculateFinalPricing(
    basePlanPrice: number,
    addOn?: AddOnOption,
    bundle?: BundleOption,
    plan?: PlanTier
  ): PricingCalculation {
    const finalPrice = bundle ? bundle.price : basePlanPrice;
    const assumedCost = finalPrice * 0.65;
    const finalEBITDA = ((finalPrice - assumedCost) / finalPrice) * 100;

    let ebitdaStatus: "SAFE" | "WARNING" | "BLOCKED" = "SAFE";
    if (finalEBITDA < EBITDA_FLOOR.MINIMUM_PERCENT) {
      ebitdaStatus = "BLOCKED";
    } else if (finalEBITDA < EBITDA_FLOOR.WARNING_PERCENT) {
      ebitdaStatus = "WARNING";
    }

    let dealType: "BASE" | "ADD_ON" | "BUNDLE_HIGH" | "BUNDLE_MID" | "BUNDLE_LOW" = "BASE";
    let incentiveMultiplier = INCENTIVE_MULTIPLIERS.BASE_PRICE;

    if (bundle) {
      dealType = `BUNDLE_${bundle.tier}` as any;
      incentiveMultiplier = bundle.incentiveMultiplier;
    } else if (addOn) {
      dealType = "ADD_ON";
      incentiveMultiplier = INCENTIVE_MULTIPLIERS.ADD_ON;
    }

    // Use actual plan name if provided, otherwise fallback to generic name
    const planName = plan ? plan.displayName : "Smart Wash";  // Smart Wash is the default pitch
    const planPrice = plan ? plan.baseMonthlyPrice : basePlanPrice;

    return {
      basePlan: {
        name: planName,
        monthlyPrice: planPrice,
        costPerWash: Math.round(planPrice / 30),
        washesPerMonth: 30,
      },
      selectedAddOn: addOn,
      selectedBundle: bundle,
      finalPrice,
      finalEBITDA: Math.round(finalEBITDA),
      ebitdaStatus,
      paymentLinkEnabled: ebitdaStatus !== "BLOCKED",
      dealType,
      incentiveMultiplier,
    };
  }

  /**
   * Calculate pricing for a specific lead with actual plan data
   */
  calculatePricingForLead(
    lead: TSELead,
    addOn?: AddOnOption,
    bundle?: BundleOption
  ): PricingCalculation {
    const recommendedPlan = this.getRecommendedPlanForLead(lead);

    if (!recommendedPlan) {
      // Fallback to lead's estimated value if no plan found
      return this.calculateFinalPricing(lead.estimatedValue, addOn, bundle);
    }

    return this.calculateFinalPricing(
      recommendedPlan.baseMonthlyPrice,
      addOn,
      bundle,
      recommendedPlan
    );
  }

  // ============================================
  // DAILY STATS
  // ============================================

  /**
   * Get today's performance stats
   */
  getTodayStats(): TSEDailyStats {
    // I-08 FIX: derive from live session data where possible
    const leads = this._leadsCache ?? [];
    const today = new Date().toISOString().split("T")[0];

    // Count calls made today: leads where attemptCount > 0 and assigned today
    // (Best proxy without a call log — exact count available once backend is wired)
    const callsMadeToday = leads.reduce((s, l) => s + (l.attemptCount ?? 0), 0);

    // Count conversions and revenue today (leads marked CONVERTED)
    const convertedToday = leads.filter(l => l.status === "CONVERTED");
    const conversionsToday = convertedToday.length;
    const revenueToday = convertedToday.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);

    const callsMade = callsMadeToday > 0 ? callsMadeToday : 0;
    const callsTarget = 100;
    const conversionRate = callsMade > 0 ? (conversionsToday / callsMade) * 100 : 0;

    // SLA breaches: URGENT leads where slaStatus is "BREACHED"
    const slaBreaches = leads.filter(l => l.priority === "URGENT" && l.slaStatus === "BREACHED").length;

    // CRM compliance: leads with outcome logged vs total attempted
    const attempted = leads.filter(l => (l.attemptCount ?? 0) > 0).length;
    const logged = leads.filter(l => l.status !== "NEW" && l.status !== "NOT_ANSWERED").length;
    const crmComplianceRate = attempted > 0 ? Math.round((logged / attempted) * 100) : 100;

    return {
      todayDate: new Date(),
      callsMade,
      callsTarget,
      conversions: conversionsToday,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      conversionTarget: 18,
      slaBreaches,
      crmComplianceRate,
      revenueGenerated: revenueToday,
      avgCallDuration: 285,
      leadsInQueue: leads.filter(l => l.status === "NEW" || l.status === "CALLBACK").length,
      urgentLeads: leads.filter(l => l.priority === "URGENT").length,
    };
  }

  // ============================================
  // INCENTIVE TRACKER
  // ============================================

  /**
   * Get month-to-date incentive breakdown.
   *
   * I-02 FIX: uses V6 pool-based system as canonical calculation.
   *           COMMISSION_TIERS model removed — was a parallel system producing different numbers.
   * I-03 FIX: reads from _leadsCache (session) instead of hardcoded ₹1.875L revenue.
   * I-04 FIX: enforces GATE_CLOSURES (≥10) — variable pay locked if gate not met.
   * I-05 FIX: computes PLAN_MIX_BONUS (₹500 when ≥60% deals are PROTECT/ELITE).
   * I-06 FIX: computes SLA_BONUS (₹500 when all URGENT leads handled within SLA).
   * I-07 FIX: applies CRM_PENALTY_PCT (-20%) when CRM compliance < 100%.
   */
  getIncentiveBreakdown(): TSEIncentives {
    const leads = this._leadsCache ?? [];

    // ── Derive live MTD metrics from session leads ─────────────────────────
    const converted = leads.filter(l => l.status === "CONVERTED");
    const mtdRevenue = converted.reduce((s, l) => s + (l.estimatedValue ?? 0), 0);
    const totalConversions = converted.length;

    const attempted = leads.filter(l => (l.attemptCount ?? 0) > 0).length;
    const callsMtd = leads.reduce((s, l) => s + (l.attemptCount ?? 0), 0);
    const conversionRate = attempted > 0 ? (totalConversions / attempted) * 100 : 0;

    // CRM compliance: leads updated vs attempted (I-07)
    const crmLogged = leads.filter(l => l.status !== "NEW" && l.status !== "NOT_ANSWERED").length;
    const crmComplianceRate = attempted > 0 ? Math.round((crmLogged / attempted) * 100) : 100;

    // ── Canonical V6 pool commission (I-02) ───────────────────────────────
    // Each conversion earns based on plan + term pool split, tracked in incentiveV6.
    // Until backend wires real pool records, estimate from POOL_TSE_SOURCED_3M per conversion.
    // TSE earns TSE.POOL_TSE_SOURCED_3M = ₹79.50 per MONTHLY conversion (TSE-sourced, 3M split).
    const TSE_POOL_PER_CONV = 79.50; // M1 tranche from TSE-sourced MONTHLY plan
    const basePoolEarnings = Math.round(totalConversions * TSE_POOL_PER_CONV);

    // ── Gate check (I-04) ─────────────────────────────────────────────────
    const GATE_CLOSURES = 10; // TSE.GATE_CLOSURES
    const gateMet = totalConversions >= GATE_CLOSURES;

    // Variable pay is ₹0 if gate not met
    let totalVariable = gateMet ? basePoolEarnings : 0;

    // ── Plan mix bonus (I-05) ─────────────────────────────────────────────
    // Proxy: deals with add-ons or bundles are more likely PROTECT/ELITE
    const addOnAndBundleDeals = converted.filter(l =>
      l.tags?.some(t => t.includes("Add-On") || t.includes("Bundle"))
    ).length;
    const planMixRate = totalConversions > 0 ? addOnAndBundleDeals / totalConversions : 0;
    const PLAN_MIX_BONUS = 500; // TSE.PLAN_MIX_BONUS
    const planMixBonusEarned = gateMet && planMixRate >= 0.60 ? PLAN_MIX_BONUS : 0;
    if (planMixBonusEarned > 0) totalVariable += planMixBonusEarned;

    // ── SLA bonus (I-06) ──────────────────────────────────────────────────
    const urgentLeads = leads.filter(l => l.priority === "URGENT");
    const urgentSlaBreaches = urgentLeads.filter(l => l.slaStatus === "BREACHED").length;
    const SLA_BONUS = 500; // TSE.SLA_BONUS
    const slaBonusEarned = gateMet && urgentLeads.length > 0 && urgentSlaBreaches === 0 ? SLA_BONUS : 0;
    if (slaBonusEarned > 0) totalVariable += slaBonusEarned;

    // ── CRM penalty (I-07) ────────────────────────────────────────────────
    const CRM_PENALTY_PCT = 0.20; // TSE.CRM_PENALTY_PCT
    const penaltyApplied = crmComplianceRate < 100;
    if (penaltyApplied) totalVariable = Math.round(totalVariable * (1 - CRM_PENALTY_PCT));

    // ── SHINE Hatchback token (I-09) ──────────────────────────────────────
    // Count from leads tagged with SHINE+Hatchback+AddOn in session
    const shineTokens = converted.filter(l =>
      l.vehicleCategory?.toUpperCase().includes("HATCH") &&
      (l.estimatedValue ?? 0) <= 1299 &&
      l.tags?.some(t => t.toLowerCase().includes("add"))
    ).length;
    const SHINE_TOKEN = 10; // TSE.SHINE_H_TOKEN
    const shineTokenEarned = shineTokens * SHINE_TOKEN;
    if (shineTokenEarned > 0) totalVariable += shineTokenEarned;

    // ── Deal type mix (kept for UI display) ───────────────────────────────
    const baseDealsCount    = converted.filter(l => !l.tags?.length).length;
    const addOnDealsCount   = converted.filter(l => l.tags?.some(t => t.includes("Add-On"))).length;
    const bundleMidCount    = converted.filter(l => l.tags?.some(t => t.includes("Bundle MID"))).length;
    const bundleLowCount    = converted.filter(l => l.tags?.some(t => t.includes("Bundle LOW"))).length;

    // ── Renewal bonus ─────────────────────────────────────────────────────
    const renewalCount = converted.filter(l => l.tags?.includes("Renewal")).length;
    const RENEWAL_PER = RENEWAL_BONUS?.PER_RENEWAL ?? 50;
    const renewalTotal = renewalCount * RENEWAL_PER;
    if (renewalTotal > 0) totalVariable += renewalTotal;

    return {
      fixedSalary: FIXED_SALARY.TYPICAL,
      mtdPerformance: {
        revenueGenerated: mtdRevenue,
        conversionRate: parseFloat(conversionRate.toFixed(1)),
        callsMade: callsMtd,
        callsTarget: 2000,
      },
      commissionBreakdown: {
        // I-02: V6 pool-based — not COMMISSION_TIERS revenue-% model
        revenueTier: "POOL_V6" as any,
        tierThreshold: { min: GATE_CLOSURES, max: 999 },
        commissionRate: TSE_POOL_PER_CONV, // ₹79.50 per conversion (M1 tranche)
        commissionEarned: gateMet ? basePoolEarnings : 0,
      },
      dealTypeMix: {
        baseDeals:      { count: baseDealsCount,  multiplier: INCENTIVE_MULTIPLIERS.BASE_PRICE  },
        addOnDeals:     { count: addOnDealsCount,  multiplier: INCENTIVE_MULTIPLIERS.ADD_ON      },
        bundleMIDDeals: { count: bundleMidCount,   multiplier: INCENTIVE_MULTIPLIERS.BUNDLE_MID  },
        bundleLOWDeals: { count: bundleLowCount,   multiplier: INCENTIVE_MULTIPLIERS.BUNDLE_LOW  },
      },
      renewalBonus: {
        count: renewalCount,
        bonusPerRenewal: RENEWAL_PER,
        totalBonus: renewalTotal,
      },
      totalVariable,
      maxVariablePotential: 25000,
      eligibilityStatus: {
        crmCompliance: crmComplianceRate,
        ebitdaCompliant: true, // EBITDA check done per-deal in ActiveCall, not here
        penaltyApplied,
        penaltyReason: penaltyApplied ? `CRM compliance ${crmComplianceRate}% < 100% — 20% variable penalty applied` : undefined,
      },
      // Extended fields (surfaced in tracker UI)
      _bonusBreakdown: {
        gateMet,
        gateRequired: GATE_CLOSURES,
        totalConversions,
        planMixBonusEarned,
        planMixRate: parseFloat((planMixRate * 100).toFixed(1)),
        slaBonusEarned,
        urgentSlaBreaches,
        shineTokenEarned,
        shineTokenCount: shineTokens,
      } as any,
    };
  }

  // ============================================
  // RENEWAL MANAGEMENT
  // ============================================

  /**
   * Get renewal leads due soon
   */
  getRenewalLeads(): RenewalLead[] {
    const now = new Date();

    return [
      {
        id: "renewal-001",
        customerId: "cust-001",
        customerName: "Arjun Mehta",
        phone: "+91 98765 12345",
        currentPlan: "Express Wash - Hatchback",  // F4 FIX
        monthlyPrice: 1249,
        expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        daysUntilExpiry: 5,
        renewalStage: "FIRST_CALL",
        upgradeRecommended: "Smart Wash",
      },
      {
        id: "renewal-002",
        customerId: "cust-002",
        customerName: "Kavya Reddy",
        phone: "+91 98765 12346",
        currentPlan: "Smart Wash - SUV",  // F4 FIX
        monthlyPrice: 1999,
        expiryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        daysUntilExpiry: 2,
        renewalStage: "SECOND_CALL",
        upgradeRecommended: "Elite Wash",
        lastContactedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "renewal-003",
        customerId: "cust-003",
        customerName: "Rohan Gupta",
        phone: "+91 98765 12347",
        currentPlan: "Express Wash - Standard Bike",  // F4 FIX
        monthlyPrice: 699,
        expiryDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        daysUntilExpiry: 1,
        renewalStage: "FINAL_NUDGE",
        lastContactedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  // ============================================
  // ALERTS & NOTIFICATIONS
  // ============================================

  /**
   * Get active alerts for TSE
   */
  getActiveAlerts(): TSEAlert[] {
    const now = new Date();

    return [
      {
        id: "alert-001",
        type: "SLA_BREACH",
        severity: "CRITICAL",
        title: "SLA Breach Alert",
        message: "Lead 'Rajesh Kumar' approaching 10-minute SLA. 2 minutes remaining.",
        leadId: "lead-001",
        actionRequired: "Call immediately",
        createdAt: now,
        dismissed: false,
      },
      {
        id: "alert-002",
        type: "RENEWAL_DUE",
        severity: "WARNING",
        title: "Renewal Due Tomorrow",
        message: "Customer 'Rohan Gupta' subscription expires tomorrow. Final nudge required.",
        actionRequired: "Make renewal call",
        createdAt: new Date(now.getTime() - 30 * 60 * 1000),
        dismissed: false,
      },
      {
        id: "alert-003",
        type: "PAYMENT_UNPAID",
        severity: "INFO",
        title: "Payment Link Unpaid",
        message: "Payment link sent to 'Priya Sharma' 12 hours ago - still unpaid.",
        leadId: "lead-002",
        actionRequired: "Follow-up call",
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        dismissed: false,
      },
    ];
  }

  // ============================================
  // CRM OPERATIONS
  // ============================================

  /**
   * Update lead CRM status
   */
  updateLeadCRM(leadId: string, updates: Partial<TSELead>): boolean {
    // Update in-memory cache so lead queue reflects the change immediately
    const leads = this.getLeadQueue();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], ...updates };
      this._leadsCache = leads;
    }
    console.log("Lead CRM updated:", leadId, updates);
    return true;
  }

  /**
   * Send payment link
   */
  sendPaymentLink(leadId: string, amount: number): { success: boolean; linkId: string } {
    // In production: POST /api/tse/payment-links
    console.log("Sending payment link:", leadId, amount);
    return {
      success: true,
      linkId: `pl-${Date.now()}`,
    };
  }

  /**
   * Mark lead as converted
   */
  convertLead(leadId: string, finalPrice: number, dealType: string): boolean {
    // Mark lead as converted in cache — removed from active queue
    const leads = this.getLeadQueue();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], status: "CONVERTED" as any, finalPrice };
      this._leadsCache = leads;
    }
    console.log("Lead converted:", leadId, finalPrice, dealType);
    return true;
  }

  /**
   * Mark lead as lost
   */
  markLeadLost(leadId: string, reason: string): boolean {
    const leads = this.getLeadQueue();
    const idx = leads.findIndex(l => l.id === leadId);
    if (idx !== -1) {
      leads[idx] = { ...leads[idx], status: "LOST" as any, lostReason: reason as any };
      this._leadsCache = leads;
    }
    console.log("Lead lost:", leadId, reason);
    return true;
  }
}

// Export singleton instance
export const teleSalesExecutiveService = new TeleSalesExecutiveService();

// Export class for testing
export { TeleSalesExecutiveService };
