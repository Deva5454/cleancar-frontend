/**
 * planSyncService.ts — SINGLE SOURCE OF TRUTH for all plan prices
 *
 * Every role reads plan prices from here:
 *   - Customer buy page   (CustomerPlanPage.tsx)
 *   - TSE / TSM apps      (teleSalesExecutiveService → this)
 *   - Car Washer screen   (washer service data → this)
 *   - Admin editor        (SuperAdminPlanEditor writes here)
 *
 * Storage: localStorage "cleancar_plan_page_config"
 * Fallback: DEFAULT_CONFIG from CustomerPlanPage.tsx
 *
 * Plan name mapping (buy page id → subscriptionPlans tier name):
 *   water   → SHINE
 *   shampoo → PROTECT
 *   wax     → ELITE
 */

import { DEFAULT_CONFIG, type PlanPageConfig } from "../components/subscription/CustomerPlanPage";

const STORAGE_KEY = "cleancar_plan_page_config";
const PROMO_KEY   = "cleancar_promotions";
const COUPON_KEY  = "cleancar_coupons";
const REFERRAL_KEY= "cleancar_referrals";

// ─── Plan name bridge ────────────────────────────────────────────────────────
export const BUY_ID_TO_TIER: Record<string, string> = {
  water:   "SHINE",
  shampoo: "PROTECT",
  wax:     "ELITE",
};
export const TIER_TO_BUY_ID: Record<string, string> = {
  SHINE:   "water",
  PROTECT: "shampoo",
  ELITE:   "wax",
};

// Vehicle category bridge
export const BUY_CAT_TO_SUB: Record<string, string> = {
  hatchback: "Hatchback / Compact Sedan",
  suv:       "SUV / MUV / Sedan",
  luxury:    "Luxury / Large SUV",
};
export const SUB_CAT_TO_BUY: Record<string, string> = {
  "Hatchback / Compact Sedan": "hatchback",
  "SUV / MUV / Sedan":         "suv",
  "Luxury / Large SUV":        "luxury",
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlanPrice {
  id: string;            // "water" | "shampoo" | "wax"
  tierId: string;        // "SHINE" | "PROTECT" | "ELITE"
  name: string;          // "Express Wash"
  icon: string;
  hatchback: number;
  suv: number;
  luxury: number;
}

export interface CouponCode {
  id: string;
  code: string;          // uppercase, e.g. "SAVE20"
  type: "percent" | "flat";
  value: number;         // 20 = 20% off or ₹200 flat
  minOrderValue: number;
  maxUses: number;
  usedCount: number;
  validFrom: string;     // YYYY-MM-DD
  validTo: string;
  applicablePlans: string[]; // plan ids, [] = all
  active: boolean;
  description: string;
  createdBy: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  type: "percent" | "flat" | "free_addon" | "bogo";
  value: number;
  freeAddonId?: string;
  applicablePlans: string[];
  startDate: string;
  endDate: string;
  active: boolean;
  autoApply: boolean;    // apply without code
  badge: string;         // e.g. "🎄 Diwali Offer"
  createdBy: string;
  createdAt: string;
}

export interface ReferralProgram {
  enabled: boolean;
  referrerReward: number;        // ₹ credit for referrer
  referrerRewardType: "flat" | "percent";
  refereeDiscount: number;       // ₹ or % off first order for referee
  refereeDiscountType: "flat" | "percent";
  minRefereeOrderValue: number;
  maxRewardsPerReferrer: number; // 0 = unlimited
  rewardValidity: number;        // days before credit expires
  termsText: string;
}

export interface ReferralRecord {
  id: string;
  referrerCustomerId: string;
  referrerName: string;
  referralCode: string;
  refereeCustomerId?: string;
  refereeName?: string;
  refereePhone?: string;
  status: "pending" | "converted" | "rewarded" | "expired";
  createdAt: string;
  convertedAt?: string;
  referrerRewardAmount: number;
  refereeDiscountAmount: number;
  orderAmount?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────
class PlanSyncService {

  // ── Config ─────────────────────────────────────────────────────────────────
  getConfig(): PlanPageConfig {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {}
    return DEFAULT_CONFIG;
  }

  saveConfig(cfg: PlanPageConfig) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event("planConfigUpdated"));
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
  }

  // ── Unified plan prices ────────────────────────────────────────────────────
  getAllPlanPrices(): PlanPrice[] {
    const cfg = this.getConfig();
    return cfg.monthlyPlans.map(p => ({
      id:        p.id,
      tierId:    BUY_ID_TO_TIER[p.id] || p.id.toUpperCase(),
      name:      p.name,
      icon:      p.icon,
      hatchback: p.prices["hatchback"] || p.prices["Hatchback / Compact Sedan"] || 0,
      suv:       p.prices["suv"] || p.prices["SUV / MUV / Sedan"] || 0,
      luxury:    p.prices["luxury"] || p.prices["Luxury / Large SUV"] || 0,
    }));
  }

  getPlanPrice(planId: string, vehicleCategory: string): number {
    const cfg = this.getConfig();
    const plan = cfg.monthlyPlans.find(p => p.id === planId || BUY_ID_TO_TIER[p.id] === planId);
    if (!plan) return 0;
    // Normalise category key
    const cat = SUB_CAT_TO_BUY[vehicleCategory] || vehicleCategory;
    return plan.prices[cat] || plan.prices[vehicleCategory] || 0;
  }

  // Used by subscriptionPlansService to get live prices
  getPlanBasePrices(): Record<string, Record<string, number>> {
    const plans = this.getAllPlanPrices();
    const matrix: Record<string, Record<string, number>> = {
      "Hatchback / Compact Sedan": {},
      "SUV / MUV / Sedan": {},
      "Luxury / Large SUV": {},
    };
    for (const p of plans) {
      const tier = p.tierId;
      matrix["Hatchback / Compact Sedan"][tier] = p.hatchback;
      matrix["SUV / MUV / Sedan"][tier]         = p.suv;
      matrix["Luxury / Large SUV"][tier]        = p.luxury;
    }
    return matrix;
  }

  // ── Coupons ────────────────────────────────────────────────────────────────
  getCoupons(): CouponCode[] {
    try { return JSON.parse(localStorage.getItem(COUPON_KEY) || "[]"); } catch { return []; }
  }
  saveCoupons(coupons: CouponCode[]) {
    localStorage.setItem(COUPON_KEY, JSON.stringify(coupons));
  }
  addCoupon(c: Omit<CouponCode, "id" | "usedCount" | "createdAt">): CouponCode {
    const coupons = this.getCoupons();
    const newC: CouponCode = { ...c, id: `cpn_${Date.now()}`, usedCount: 0, createdAt: new Date().toISOString() };
    coupons.unshift(newC);
    this.saveCoupons(coupons);
    return newC;
  }
  updateCoupon(id: string, updates: Partial<CouponCode>) {
    const coupons = this.getCoupons().map(c => c.id === id ? { ...c, ...updates } : c);
    this.saveCoupons(coupons);
  }
  deleteCoupon(id: string) {
    this.saveCoupons(this.getCoupons().filter(c => c.id !== id));
  }

  validateCoupon(code: string, orderTotal: number, planId?: string): {
    valid: boolean; discount: number; error?: string; coupon?: CouponCode;
  } {
    const coupons = this.getCoupons();
    const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
    if (!coupon) return { valid: false, discount: 0, error: "Invalid coupon code" };

    const now = new Date().toISOString().slice(0, 10);
    if (coupon.validTo && now > coupon.validTo)
      return { valid: false, discount: 0, error: "Coupon has expired" };
    if (coupon.validFrom && now < coupon.validFrom)
      return { valid: false, discount: 0, error: "Coupon is not yet active" };
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses)
      return { valid: false, discount: 0, error: "Coupon usage limit reached" };
    if (orderTotal < coupon.minOrderValue)
      return { valid: false, discount: 0, error: `Minimum order ₹${coupon.minOrderValue} required` };
    if (coupon.applicablePlans.length > 0 && planId && !coupon.applicablePlans.includes(planId))
      return { valid: false, discount: 0, error: "Coupon not valid for this plan" };

    const discount = coupon.type === "percent"
      ? Math.round(orderTotal * coupon.value / 100)
      : coupon.value;
    return { valid: true, discount, coupon };
  }

  redeemCoupon(code: string) {
    const coupons = this.getCoupons().map(c =>
      c.code.toUpperCase() === code.toUpperCase() ? { ...c, usedCount: c.usedCount + 1 } : c
    );
    this.saveCoupons(coupons);
  }

  // ── Promotions ─────────────────────────────────────────────────────────────
  getPromotions(): Promotion[] {
    try { return JSON.parse(localStorage.getItem(PROMO_KEY) || "[]"); } catch { return []; }
  }
  savePromotions(promos: Promotion[]) {
    localStorage.setItem(PROMO_KEY, JSON.stringify(promos));
  }
  addPromotion(p: Omit<Promotion, "id" | "createdAt">): Promotion {
    const promos = this.getPromotions();
    const newP: Promotion = { ...p, id: `promo_${Date.now()}`, createdAt: new Date().toISOString() };
    promos.unshift(newP);
    this.savePromotions(promos);
    return newP;
  }
  updatePromotion(id: string, updates: Partial<Promotion>) {
    this.savePromotions(this.getPromotions().map(p => p.id === id ? { ...p, ...updates } : p));
  }
  deletePromotion(id: string) {
    this.savePromotions(this.getPromotions().filter(p => p.id !== id));
  }

  getActiveAutoPromotions(): Promotion[] {
    const now = new Date().toISOString().slice(0, 10);
    return this.getPromotions().filter(p =>
      p.active && p.autoApply && now >= p.startDate && now <= p.endDate
    );
  }

  // ── Referral Program ───────────────────────────────────────────────────────
  getReferralProgram(): ReferralProgram {
    try {
      const raw = localStorage.getItem("cleancar_referral_program");
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      enabled: false,
      referrerReward: 200, referrerRewardType: "flat",
      refereeDiscount: 150, refereeDiscountType: "flat",
      minRefereeOrderValue: 500, maxRewardsPerReferrer: 10,
      rewardValidity: 90,
      termsText: "Both referrer and referee benefit! Referrer earns ₹200 credit on their next renewal. Referee gets ₹150 off their first subscription.",
    };
  }
  saveReferralProgram(prog: ReferralProgram) {
    localStorage.setItem("cleancar_referral_program", JSON.stringify(prog));
  }

  getReferralRecords(): ReferralRecord[] {
    try { return JSON.parse(localStorage.getItem(REFERRAL_KEY) || "[]"); } catch { return []; }
  }
  saveReferralRecords(records: ReferralRecord[]) {
    localStorage.setItem(REFERRAL_KEY, JSON.stringify(records));
  }

  generateReferralCode(customerId: string, name: string): string {
    const base = name.split(" ")[0].toUpperCase().slice(0, 5).replace(/[^A-Z]/g, "");
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${base}${suffix}`;
  }

  createReferral(referrerCustomerId: string, referrerName: string): ReferralRecord {
    const prog = this.getReferralProgram();
    const code = this.generateReferralCode(referrerCustomerId, referrerName);
    const record: ReferralRecord = {
      id: `ref_${Date.now()}`,
      referrerCustomerId, referrerName, referralCode: code,
      status: "pending",
      createdAt: new Date().toISOString(),
      referrerRewardAmount: prog.referrerReward,
      refereeDiscountAmount: prog.refereeDiscount,
    };
    const records = this.getReferralRecords();
    records.unshift(record);
    this.saveReferralRecords(records);
    return record;
  }

  validateReferralCode(code: string, orderTotal: number): {
    valid: boolean; discount: number; error?: string; record?: ReferralRecord;
  } {
    const prog = this.getReferralProgram();
    if (!prog.enabled) return { valid: false, discount: 0, error: "Referral program not active" };

    const records = this.getReferralRecords();
    const record = records.find(r => r.referralCode.toUpperCase() === code.toUpperCase());
    if (!record) return { valid: false, discount: 0, error: "Invalid referral code" };
    if (record.status !== "pending") return { valid: false, discount: 0, error: "Referral code already used" };
    if (orderTotal < prog.minRefereeOrderValue)
      return { valid: false, discount: 0, error: `Minimum order ₹${prog.minRefereeOrderValue} required` };

    const discount = prog.refereeDiscountType === "percent"
      ? Math.round(orderTotal * prog.refereeDiscount / 100)
      : prog.refereeDiscount;
    return { valid: true, discount, record };
  }

  convertReferral(code: string, refereeCustomerId: string, refereeName: string, orderAmount: number) {
    const records = this.getReferralRecords().map(r =>
      r.referralCode.toUpperCase() === code.toUpperCase()
        ? { ...r, status: "converted" as const, refereeCustomerId, refereeName, orderAmount, convertedAt: new Date().toISOString() }
        : r
    );
    this.saveReferralRecords(records);
  }
}

export const planSyncService = new PlanSyncService();
export default planSyncService;
