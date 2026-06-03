/**
 * Subscription Plans - Type Definitions
 *
 * Complete type system for dynamic subscription plan management.
 * Based on vehicle washing packages with multi-duration billing.
 *
 * Architecture: 100% dynamic - all data from database, no hardcoded values
 *
 * @module subscriptionPlans.types
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

/** Vehicle type categories */
export type VehicleType = "4W" | "2W";

/** Vehicle category names */
export type VehicleCategoryName =
  | "HATCHBACK_COMPACT_SEDAN"
  | "SUV_MUV_SEDAN"
  | "LUXURY_LARGE_SUV"
  | "STANDARD_COMMUTER_BIKE"
  | "SPORTS_PREMIUM_BIKE"
  | "SCOOTER";

/** Plan tier names */
export type PlanTierName =
  | "WATER_WASH"
  | "WATER_SHAMPOO"
  | "WATER_SHAMPOO_WAX"

/** Service frequency types */
export type ServiceFrequency = "EVERY_WASH" | "WEEKLY" | "MONTHLY";

/** Billing duration types */
export type BillingDurationType =
  | "MONTHLY"
  | "QUARTERLY"
  | "HALF_YEARLY"
  | "NINE_MONTHS"
  | "ANNUAL";

/** Add-on billing types */
export type AddonBillingType = "PER_VISIT" | "PER_MONTH";

// ============================================
// VEHICLE CATEGORIES
// ============================================

/**
 * Vehicle Category
 * Master list of vehicle types (hatchback, SUV, scooter, etc.)
 */
export interface VehicleCategory {
  id: string;
  name: VehicleCategoryName;
  displayName: string;
  examples: string[];
  type: VehicleType;
  isActive: boolean;
}

// ============================================
// PLAN TIERS & PRICING
// ============================================

/**
 * Plan Tier
 * Individual plan level per vehicle category (Water Wash, Shampoo Wash, etc.)
 */
export interface PlanTier {
  id: string;
  name: PlanTierName;
  displayName: string;
  vehicleCategoryId: string;
  baseMonthlyPrice: number;
  costPerWash: number;
  washesPerMonth: number;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Plan Price
 * Base monthly pricing - source of truth for all billing calculations
 */
export interface PlanPrice {
  id: string;
  planTierId: string;
  baseMonthlyPrice: number;
  currency: "INR";
  effectiveFrom: Date;
  effectiveTo?: Date;
}

// ============================================
// PLAN FEATURES
// ============================================

/**
 * Plan Feature
 * Individual service feature with frequency per plan tier
 */
export interface PlanFeature {
  id: string;
  planTierId: string;
  featureName: string;
  description?: string;
  frequency: ServiceFrequency;
  isIncluded: boolean;
  sortOrder: number;
}

// ============================================
// BILLING DURATIONS
// ============================================

/**
 * Billing Duration
 * Multi-duration options with admin-editable discount rates
 */
export interface BillingDuration {
  id: string;
  type: BillingDurationType;
  label: string;
  months: number;
  discountPercent: number;
  isActive: boolean;
  isBestValue?: boolean;
  sortOrder: number;
}

/**
 * Calculated Price for Duration
 * Dynamically computed price breakdown for a specific billing duration
 */
export interface DurationPrice {
  duration: BillingDurationType;
  label: string;
  months: number;
  baseMonthlyPrice: number;
  discountPercent: number;
  totalAmount: number;
  effectiveMonthlyPrice: number;
  amountSaved: number;
  isBestValue: boolean;
}

// ============================================
// ADD-ONS
// ============================================

/**
 * Add-On Service
 * Separately configurable additional services
 */
export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  billingType: AddonBillingType;
  bestPairedWith: string[];
  marginPercent: number;
  isActive: boolean;
  isOperationallyConfirmed: boolean;
  sortOrder: number;
}

// ============================================
// COMBO OFFERS
// ============================================

/**
 * Combo Offer
 * Bundle deals with multiple plans
 */
export interface ComboOffer {
  id: string;
  name: string;
  description: string;
  includedPlanIds: string[];
  normalPrice: number;
  comboPrice: number;
  savingAmount: number;
  savingPercent: number;
  validityRule: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================
// COMPLETE PLAN (FOR DISPLAY)
// ============================================

/**
 * Complete Plan with Features
 * Full plan details for customer-facing display
 */
export interface CompletePlan {
  tier: PlanTier;
  vehicleCategory: VehicleCategory;
  features: PlanFeature[];
  prices: DurationPrice[];
  addons: Addon[];
}

// ============================================
// ADMIN AUDIT LOG
// ============================================

/**
 * Plan Change Log Entry
 * Immutable audit trail of all admin edits
 */
export interface PlanChangeLog {
  id: string;
  adminId: string;
  adminName: string;
  entityType:
    | "PLAN_TIER"
    | "PLAN_PRICE"
    | "PLAN_FEATURE"
    | "BILLING_DURATION"
    | "ADDON"
    | "COMBO_OFFER";
  entityId: string;
  field: string;
  oldValue: string | number | boolean;
  newValue: string | number | boolean;
  timestamp: Date;
  ipAddress?: string;
}

// ============================================
// SUBSCRIPTION (ACTIVE CUSTOMER PLANS)
// ============================================

/**
 * Active Subscription
 * Customer's current active plan
 */
export interface ActiveSubscription {
  id: string;
  customerId: string;
  customerName: string;
  vehicleNumber: string;
  planTierId: string;
  billingDuration: BillingDurationType;
  startDate: Date;
  endDate: Date;
  monthlyPrice: number;
  totalAmount: number;
  status: "ACTIVE" | "PAUSED" | "CANCELLED" | "EXPIRED";
  autoRenew: boolean;
  addonIds: string[];
  comboOfferId?: string;
}

// ============================================
// ADMIN PERMISSIONS
// ============================================

/**
 * Plan Management Permissions
 * Role-based access control for plan administration
 */
export interface PlanAdminPermissions {
  canCreatePlan: boolean;
  canEditPlan: boolean;
  canEditPricing: boolean;
  canEditFeatures: boolean;
  canEditDurationDiscounts: boolean;
  canDisablePlan: boolean;
  canDeletePlan: boolean;
  canManageAddons: boolean;
  canManageCombos: boolean;
  canViewAuditLog: boolean;
}

/**
 * User Role Types
 */
export type UserRole = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "VIEWER";

// ============================================
// MIGRATION & CONFLICT CHECK
// ============================================

/**
 * Plan Migration Conflict
 * Detected conflicts when replacing old plans
 */
export interface PlanMigrationConflict {
  id: string;
  conflictType:
    | "ACTIVE_SUBSCRIBERS_ON_OLD_PLAN"
    | "PRICE_MISMATCH"
    | "FEATURE_MISMATCH"
    | "DURATION_NOT_SUPPORTED";
  oldPlanId: string;
  oldPlanName: string;
  newPlanId?: string;
  affectedSubscriptionCount: number;
  affectedCustomers: string[];
  recommendedResolution:
    | "GRANDFATHER_UNTIL_CYCLE_END"
    | "MIGRATE_WITH_PRORATED_CREDIT"
    | "CONTACT_CUSTOMER_FIRST";
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  reviewedBy?: string;
  reviewedAt?: Date;
  resolutionNotes?: string;
}

// ============================================
// FILTERS & QUERIES
// ============================================

/**
 * Plan Filter Options
 * For customer plan selection screen
 */
export interface PlanFilterOptions {
  vehicleType?: VehicleType;
  vehicleCategoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  includeInactive?: boolean;
}

/**
 * Admin Plan Query
 * For admin management interface
 */
export interface AdminPlanQuery {
  vehicleType?: VehicleType;
  vehicleCategoryId?: string;
  isActive?: boolean;
  searchTerm?: string;
  sortBy?: "name" | "price" | "category" | "created_at";
  sortOrder?: "asc" | "desc";
}
