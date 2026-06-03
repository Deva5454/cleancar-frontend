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
  BUNDLE_TEMPLATES,
  EBITDA_FLOOR,
  INCENTIVE_MULTIPLIERS,
  FIXED_SALARY,
  COMMISSION_TIERS,
  RENEWAL_BONUS,
} from "../constants/teleSalesExecutive.constants";
import { subscriptionPlansService } from "./subscriptionPlansService";
import type { VehicleCategoryName, PlanTier } from "../types/subscriptionPlans.types";

class TeleSalesExecutiveService {
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

    // Return the highest-priced plan (usually WATER_SHAMPOO_WAX or WATER_SHAMPOO)
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
        estimatedValue: 499,
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
   * Calculate bundle options for a vehicle type
   */
  calculateBundleOptions(vehicleCategory: string, basePrice: number): BundleOption[] {
    const templates = BUNDLE_TEMPLATES.SUV_COMBO; // Simplified for demo

    const calculateEBITDA = (price: number) => {
      const assumedCost = price * 0.65; // 65% assumed cost
      const ebitda = ((price - assumedCost) / price) * 100;
      return Math.round(ebitda);
    };

    const getBundleOption = (tier: "HIGH" | "MID" | "LOW", price: number): BundleOption => {
      const normalPrice = tier === "HIGH" ? price : templates.HIGH;
      const savings = normalPrice - price;
      const savingsPercent = Math.round((savings / normalPrice) * 100);
      const ebitda = calculateEBITDA(price);

      let ebitdaStatus: "SAFE" | "WARNING" | "BLOCKED" = "SAFE";
      if (ebitda < EBITDA_FLOOR.MINIMUM_PERCENT) {
        ebitdaStatus = "BLOCKED";
      } else if (ebitda < EBITDA_FLOOR.WARNING_PERCENT) {
        ebitdaStatus = "WARNING";
      }

      const multiplier = tier === "MID" ? INCENTIVE_MULTIPLIERS.BUNDLE_MID :
                        tier === "LOW" ? INCENTIVE_MULTIPLIERS.BUNDLE_LOW :
                        INCENTIVE_MULTIPLIERS.BUNDLE_HIGH;

      return {
        tier,
        label: tier === "HIGH" ? "Full Price" : tier === "MID" ? "Best Value" : "Lowest Price",
        price,
        normalPrice,
        savings,
        savingsPercent,
        ebitda,
        ebitdaStatus,
        incentiveMultiplier: multiplier,
        description: tier === "HIGH"
          ? "Complete package at full price"
          : tier === "MID"
          ? "Recommended bundle with great value"
          : "Absolute lowest price - margin floor",
      };
    };

    return [
      getBundleOption("HIGH", templates.HIGH),
      getBundleOption("MID", templates.MID),
      getBundleOption("LOW", templates.LOW),
    ];
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
    const planName = plan ? plan.displayName : "Water + Shampoo + Wax";
    const planPrice = plan ? plan.baseMonthlyPrice : basePlanPrice;

    return {
      basePlan: {
        name: planName,
        monthlyPrice: planPrice,
        costPerWash: Math.round(planPrice / 26),
        washesPerMonth: 26,
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
    return {
      todayDate: new Date(),
      callsMade: 47,
      callsTarget: 100,
      conversions: 8,
      conversionRate: 17.0, // 8/47 ≈ 17%
      conversionTarget: 18,
      slaBreaches: 2,
      crmComplianceRate: 100,
      revenueGenerated: 15992, // 8 conversions × avg ₹1999
      avgCallDuration: 285, // 4 minutes 45 seconds
      leadsInQueue: 23,
      urgentLeads: 1,
    };
  }

  // ============================================
  // INCENTIVE TRACKER
  // ============================================

  /**
   * Get month-to-date incentive breakdown
   */
  getIncentiveBreakdown(): TSEIncentives {
    const mtdRevenue = 187500; // ₹1.875 lakh

    // Determine commission tier
    const tier = COMMISSION_TIERS.find(
      (t) => mtdRevenue >= t.min && mtdRevenue < t.max
    ) || COMMISSION_TIERS[0];

    const commissionEarned = Math.round((mtdRevenue * tier.rate) / 100);

    return {
      fixedSalary: FIXED_SALARY.TYPICAL,
      mtdPerformance: {
        revenueGenerated: mtdRevenue,
        conversionRate: 17.2,
        callsMade: 940,
        callsTarget: 2000, // 100/day × 20 working days
      },
      commissionBreakdown: {
        revenueTier: tier.tier,
        tierThreshold: { min: tier.min, max: tier.max },
        commissionRate: tier.rate,
        commissionEarned,
      },
      dealTypeMix: {
        baseDeals: { count: 28, multiplier: INCENTIVE_MULTIPLIERS.BASE_PRICE },
        addOnDeals: { count: 42, multiplier: INCENTIVE_MULTIPLIERS.ADD_ON },
        bundleMIDDeals: { count: 35, multiplier: INCENTIVE_MULTIPLIERS.BUNDLE_MID },
        bundleLOWDeals: { count: 12, multiplier: INCENTIVE_MULTIPLIERS.BUNDLE_LOW },
      },
      renewalBonus: {
        count: 18,
        bonusPerRenewal: RENEWAL_BONUS.PER_RENEWAL,
        totalBonus: 18 * RENEWAL_BONUS.PER_RENEWAL,
      },
      totalVariable: commissionEarned + (18 * RENEWAL_BONUS.PER_RENEWAL),
      maxVariablePotential: 25000,
      eligibilityStatus: {
        crmCompliance: 100,
        ebitdaCompliant: true,
        penaltyApplied: false,
      },
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
        currentPlan: "Water Wash - Hatchback",
        monthlyPrice: 699,
        expiryDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        daysUntilExpiry: 5,
        renewalStage: "FIRST_CALL",
        upgradeRecommended: "Water + Shampoo",
      },
      {
        id: "renewal-002",
        customerId: "cust-002",
        customerName: "Kavya Reddy",
        phone: "+91 98765 12346",
        currentPlan: "Water + Shampoo - SUV",
        monthlyPrice: 1699,
        expiryDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        daysUntilExpiry: 2,
        renewalStage: "SECOND_CALL",
        upgradeRecommended: "Water + Shampoo + Wax",
        lastContactedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: "renewal-003",
        customerId: "cust-003",
        customerName: "Rohan Gupta",
        phone: "+91 98765 12347",
        currentPlan: "Bike Wash - Standard",
        monthlyPrice: 499,
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
    // In production: POST /api/tse/leads/:id/update
    console.log("Updating lead CRM:", leadId, updates);
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
    // In production: POST /api/tse/leads/:id/convert
    console.log("Converting lead:", leadId, finalPrice, dealType);
    return true;
  }

  /**
   * Mark lead as lost
   */
  markLeadLost(leadId: string, reason: string): boolean {
    // In production: POST /api/tse/leads/:id/lost
    console.log("Marking lead lost:", leadId, reason);
    return true;
  }
}

// Export singleton instance
export const teleSalesExecutiveService = new TeleSalesExecutiveService();

// Export class for testing
export { TeleSalesExecutiveService };
