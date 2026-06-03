/**
 * TELE SALES EXECUTIVE (TSE) - TYPE DEFINITIONS
 * Sales Execution + Value-Stacking System
 *
 * Role: TSE converts inbound leads into active subscriptions
 * Philosophy: Value Communicator → Not a Discount Giver
 * Platform: Web Application Only (Desktop/Laptop)
 */

// ============================================
// LEAD & CALL MANAGEMENT
// ============================================

export type LeadStatus = "NEW" | "ATTEMPTED" | "CALLBACK" | "INTERESTED" | "NOT_ANSWERED" | "CONVERTED" | "LOST";
export type LeadSource = "DIGITAL" | "BTL_REFERRAL" | "WALK_IN" | "SOCIAL_MEDIA" | "PARTNER";
export type SLAStatus = "MET" | "AT_RISK" | "BREACHED";

export interface TSELead {
  id: string;
  customerName: string;
  phone: string;
  vehicleType: "4W" | "2W";
  vehicleCategory?: "HATCHBACK" | "SEDAN" | "SUV" | "LUXURY" | "BIKE" | "SCOOTER";
  source: LeadSource;
  status: LeadStatus;
  assignedAt: Date;
  attemptCount: number;
  slaStatus: SLAStatus;
  slaMinutesRemaining: number;
  nextFollowUpAt?: Date;
  estimatedValue: number;
  priority: "URGENT" | "HIGH" | "NORMAL";
  tags: string[];
}

export interface CallHistory {
  id: string;
  leadId: string;
  calledAt: Date;
  duration: number; // seconds
  outcome: LeadStatus;
  notes: string;
  addOnOffered?: string;
  bundleTierOffered?: "HIGH" | "MID" | "LOW";
  paymentLinkSent: boolean;
}

// ============================================
// PRICING ENGINE
// ============================================

export type PricingTier = "BASE" | "ADD_ON" | "BUNDLE_HIGH" | "BUNDLE_MID" | "BUNDLE_LOW";

export interface AddOnOption {
  id: string;
  name: string;
  internalCost: number;
  perceivedValue: number;
  description: string;
  marginPercent: number;
}

export interface BundleOption {
  tier: "HIGH" | "MID" | "LOW";
  label: string;
  price: number;
  normalPrice: number;
  savings: number;
  savingsPercent: number;
  ebitda: number;
  ebitdaStatus: "SAFE" | "WARNING" | "BLOCKED";
  incentiveMultiplier: number; // 100% for MID, 60% for LOW
  description: string;
}

export interface PricingCalculation {
  basePlan: {
    name: string;
    monthlyPrice: number;
    costPerWash: number;
    washesPerMonth: number;
  };
  selectedAddOn?: AddOnOption;
  selectedBundle?: BundleOption;
  finalPrice: number;
  finalEBITDA: number;
  ebitdaStatus: "SAFE" | "WARNING" | "BLOCKED";
  paymentLinkEnabled: boolean;
  dealType: PricingTier;
  incentiveMultiplier: number;
}

// ============================================
// CRM UPDATE
// ============================================

export type CallOutcome = "INTERESTED" | "NOT_INTERESTED" | "CALLBACK" | "NO_ANSWER" | "CONVERTED" | "LOST";
export type LostReason = "PRICE" | "COMPETITOR" | "NOT_INTERESTED" | "UNREACHABLE" | "OTHER";

export interface CRMUpdate {
  leadId: string;
  outcome: CallOutcome;
  followUpDate?: Date;
  followUpTime?: string;
  conversionStatus?: "CONVERTED" | "LOST" | "PENDING";
  lostReason?: LostReason;
  notes: string;
  tags: string[];
  addOnOffered?: string;
  bundleTierOffered?: "HIGH" | "MID" | "LOW";
  paymentLinkSent: boolean;
  updatedAt: Date;
}

// ============================================
// INCENTIVE & PERFORMANCE
// ============================================

export type CommissionTier = "TIER_1" | "TIER_2" | "TIER_3"; // 3%, 5%, 7%

export interface TSEIncentives {
  fixedSalary: number;
  mtdPerformance: {
    revenueGenerated: number;
    conversionRate: number;
    callsMade: number;
    callsTarget: number;
  };
  commissionBreakdown: {
    revenueTier: CommissionTier;
    tierThreshold: { min: number; max: number };
    commissionRate: number;
    commissionEarned: number;
  };
  dealTypeMix: {
    baseDeals: { count: number; multiplier: number };
    addOnDeals: { count: number; multiplier: number };
    bundleMIDDeals: { count: number; multiplier: number };
    bundleLOWDeals: { count: number; multiplier: number };
  };
  renewalBonus: {
    count: number;
    bonusPerRenewal: number;
    totalBonus: number;
  };
  totalVariable: number;
  maxVariablePotential: number;
  eligibilityStatus: {
    crmCompliance: number; // percentage
    ebitdaCompliant: boolean;
    penaltyApplied: boolean;
    penaltyReason?: string;
  };
}

// ============================================
// ACTIVE CALL SCREEN
// ============================================

export interface ActiveCallSession {
  lead: TSELead;
  callStartTime: Date;
  currentStep: 1 | 2 | 3 | 4 | 5; // 5-step sales process
  callHistory: CallHistory[];
  pricingCalculation: PricingCalculation;
  notes: string;
  quickTags: string[];
}

// ============================================
// DAILY STATS
// ============================================

export interface TSEDailyStats {
  todayDate: Date;
  callsMade: number;
  callsTarget: number;
  conversions: number;
  conversionRate: number;
  conversionTarget: number;
  slaBreaches: number;
  crmComplianceRate: number;
  revenueGenerated: number;
  avgCallDuration: number;
  leadsInQueue: number;
  urgentLeads: number;
}

// ============================================
// SALES PROCESS STEPS
// ============================================

export interface SalesProcessStep {
  stepNumber: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  scriptSuggestion: string;
  keyRule: string;
  completed: boolean;
}

export const SALES_PROCESS_STEPS: SalesProcessStep[] = [
  {
    stepNumber: 1,
    title: "Introduce the Service",
    description: "Confirm lead source and vehicle details before pitching",
    scriptSuggestion: "This is [Name] from [Company]. I'm calling about the car wash subscription you enquired about...",
    keyRule: "Confirm lead source before pitching",
    completed: false,
  },
  {
    stepNumber: 2,
    title: "Understand Vehicle Details",
    description: "Type, size, and usage frequency drive plan recommendation",
    scriptSuggestion: "To recommend the right plan, could you tell me about your vehicle? Is it a car or bike? What model?",
    keyRule: "Never skip this step - wrong plan = churn",
    completed: false,
  },
  {
    stepNumber: 3,
    title: "Suggest Appropriate Plan",
    description: "Use pricing engine - start at base price, never pre-discount",
    // F2 FIX: was wrong plan name, wrong price, wrong per-wash. Use dynamic values in component.
    scriptSuggestion: "For your [vehicle], our Smart Wash is ₹1,599/month (H) / ₹1,999 (SUV) — that's ₹53/wash (H) or ₹67/wash (SUV). Our Elite Wash is ₹1,999 (H) / ₹2,499 (SUV). Use the pricing panel on the right for the exact figure.",
    keyRule: "Start at base price - do not pre-discount",
    completed: false,
  },
  {
    stepNumber: 4,
    title: "Send Payment Link",
    description: "Link auto-expires in 24 hours - follow up if not paid",
    scriptSuggestion: "Perfect! I'm sending you the payment link on WhatsApp right now. It's valid for 24 hours.",
    keyRule: "Set follow-up if not immediately paid",
    completed: false,
  },
  {
    stepNumber: 5,
    title: "Confirm Payment",
    description: "Mark Converted in CRM immediately - subscription activates automatically",
    // C5+F2 FIX: activation is 2 working days, not 24 hours
    scriptSuggestion: "Thank you for subscribing! Your service activates within 2 working days. You'll receive a WhatsApp confirmation with your washer's details.",
    keyRule: "Mark Converted only after payment confirmed",
    completed: false,
  },
];

// ============================================
// OBJECTION HANDLING
// ============================================

export interface ObjectionResponse {
  objection: string;
  category: "PRICE" | "TIMING" | "COMPETITOR" | "QUALITY" | "TRUST";
  response: string;
  action: "OFFER_ADD_ON" | "OFFER_BUNDLE" | "PROVIDE_TESTIMONIAL" | "OFFER_TRIAL" | "ESCALATE";
}

export const OBJECTION_RESPONSES: ObjectionResponse[] = [
  {
    objection: "Too expensive / Can't afford",
    category: "PRICE",
    response: "I understand budget is important. Instead of reducing the price, let me add extra value for you.",
    action: "OFFER_ADD_ON",
  },
  {
    objection: "Competitor is cheaper",
    category: "COMPETITOR",
    // F3 FIX: was 26 washes (should be 30) and ₹77 wrong for all plans
    response: "I appreciate that. What we offer is daily doorstep service, premium products, and 30 washes per month — that's ₹53/wash on Smart Wash (Hatchback). Compare that to any washing centre at ₹500–800 per visit.",
    action: "OFFER_ADD_ON",
  },
  {
    objection: "Need to think about it",
    category: "TIMING",
    response: "Of course. Can I ask - is there anything specific you're unsure about? Price, service quality, or timing?",
    action: "OFFER_BUNDLE",
  },
];

// ============================================
// RENEWAL MANAGEMENT
// ============================================

export interface RenewalLead {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  currentPlan: string;
  monthlyPrice: number;
  expiryDate: Date;
  daysUntilExpiry: number;
  renewalStage: "FIRST_CALL" | "SECOND_CALL" | "FINAL_NUDGE" | "LAPSED";
  upgradeRecommended?: string;
  lastContactedAt?: Date;
}

// ============================================
// ALERTS & NOTIFICATIONS
// ============================================

export type AlertType = "SLA_BREACH" | "CRM_PENDING" | "PAYMENT_UNPAID" | "RENEWAL_DUE" | "ESCALATION_REQUEST";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface TSEAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  leadId?: string;
  actionRequired: string;
  createdAt: Date;
  dismissed: boolean;
}

// ============================================
// SYSTEM SAFEGUARDS
// ============================================

export interface SystemSafeguard {
  rule: string;
  status: "COMPLIANT" | "VIOLATED" | "WARNING";
  message: string;
}

export const PRICING_SAFEGUARDS = {
  NO_DISCOUNT_BUTTON: "System does not have a price reduction field. TSE cannot manually enter a lower price.",
  // F1 FIX: add-on limit enforced per deal
  ADD_ON_LIMIT: "Up to 3 add-ons per deal. Each must maintain EBITDA ≥ 30%.",
  BUNDLE_EBITDA_GATE: "System calculates EBITDA in real time. LOW price only available if EBITDA ≥ 30%.",
  AUDIT_LOG: "Every deal is logged: who gave add-on, who used LOW price, margin per deal.",
} as const;
