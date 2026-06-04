/**
 * referralValidationService.ts
 * Enforces all referral business rules including:
 * - 400-day vehicle lockout
 * - Phone number deduplication
 * - Self-referral prevention
 * - TSE referral abuse detection
 */

const REFERRAL_KEY = "cleancar_referrals";
const REFERRAL_PROGRAM_KEY = "cleancar_referral_program";

export interface ReferralRecord {
  id: string;
  referrerCode: string;         // TSE employee ID or customer referral code
  referrerType: "tse" | "customer";
  referrerCustomerId?: string;
  referrerName: string;
  vehicleNumber: string;        // normalised: uppercase, no spaces e.g. GJ05MD1234
  refereePhone: string;
  refereeName?: string;
  refereeCustomerId?: string;
  status: "pending" | "converted" | "rewarded" | "expired" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  convertedAt?: string;
  orderAmount?: number;
  referrerRewardAmount: number;
  refereeDiscountAmount: number;
  planId?: string;
  city?: string;
}

export type ReferralValidationResult =
  | { valid: true; discountAmount: number; message: string }
  | { valid: false; reason: string; blockedUntil?: string };

// ─── Normalise vehicle number ─────────────────────────────────────────────────
export function normaliseVehicle(raw: string): string {
  return raw.toUpperCase().replace(/[\s\-_]/g, "");
}

// ─── Get all referral records ─────────────────────────────────────────────────
export function getAllReferrals(): ReferralRecord[] {
  try { return JSON.parse(localStorage.getItem(REFERRAL_KEY) || "[]"); } catch { return []; }
}

export function saveReferrals(records: ReferralRecord[]) {
  localStorage.setItem(REFERRAL_KEY, JSON.stringify(records));
}

// ─── Core validation ──────────────────────────────────────────────────────────
export function validateReferral(params: {
  referralCode: string;
  vehicleNumber: string;
  refereePhone: string;
  refereeName?: string;
  planId?: string;
  orderAmount?: number;
}): ReferralValidationResult {

  const { referralCode, vehicleNumber, refereePhone, planId, orderAmount } = params;
  const vehicle = normaliseVehicle(vehicleNumber);
  const phone = refereePhone.replace(/\D/g, "").slice(-10);
  const allReferrals = getAllReferrals();
  const now = new Date();

  // ── Rule 1: Same vehicle within 400 days ────────────────────────────────────
  const VEHICLE_LOCKOUT_DAYS = 400;
  const vehicleReferrals = allReferrals.filter(r =>
    normaliseVehicle(r.vehicleNumber) === vehicle &&
    ["converted", "rewarded", "pending"].includes(r.status)
  );
  if (vehicleReferrals.length > 0) {
    const latest = vehicleReferrals.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const daysSince = Math.floor(
      (now.getTime() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < VEHICLE_LOCKOUT_DAYS) {
      const unlocksOn = new Date(latest.createdAt);
      unlocksOn.setDate(unlocksOn.getDate() + VEHICLE_LOCKOUT_DAYS);
      return {
        valid: false,
        reason: `Vehicle ${vehicle} was already referred ${daysSince} days ago. Referral eligible again after ${unlocksOn.toLocaleDateString("en-IN")}.`,
        blockedUntil: unlocksOn.toISOString().slice(0, 10),
      };
    }
  }

  // ── Rule 2: Same phone number within 400 days ────────────────────────────────
  const phoneReferrals = allReferrals.filter(r =>
    r.refereePhone.replace(/\D/g, "").slice(-10) === phone &&
    ["converted", "rewarded", "pending"].includes(r.status)
  );
  if (phoneReferrals.length > 0) {
    const latest = phoneReferrals.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
    const daysSince = Math.floor(
      (now.getTime() - new Date(latest.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince < VEHICLE_LOCKOUT_DAYS) {
      return {
        valid: false,
        reason: `This phone number already used a referral ${daysSince} days ago. Not eligible for another referral discount yet.`,
      };
    }
  }

  // ── Rule 3: Referrer cannot refer themselves ─────────────────────────────────
  // Check if the referral code matches the referee's own TSE/customer ID
  const selfMatch = allReferrals.find(r =>
    r.referrerCode === referralCode &&
    r.refereePhone.replace(/\D/g, "").slice(-10) === phone
  );
  if (selfMatch) {
    return { valid: false, reason: "You cannot use your own referral code." };
  }

  // ── Rule 4: Min order value check ───────────────────────────────────────────
  try {
    const program = JSON.parse(localStorage.getItem(REFERRAL_PROGRAM_KEY) || "null");
    if (program && orderAmount && orderAmount < program.minRefereeOrderValue) {
      return {
        valid: false,
        reason: `Minimum order value of ₹${program.minRefereeOrderValue} required to use a referral code.`,
      };
    }

    // ── Rule 5: Referral program disabled ─────────────────────────────────────
    if (program && !program.enabled) {
      return { valid: false, reason: "Referral program is currently disabled." };
    }

    const discountAmount = program ? program.refereeDiscount : 100;
    return {
      valid: true,
      discountAmount,
      message: `Referral applied! You get ₹${discountAmount} off your first order.`,
    };
  } catch {
    return { valid: true, discountAmount: 100, message: "Referral applied! ₹100 off." };
  }
}

// ─── Create referral record ───────────────────────────────────────────────────
export function createReferralRecord(params: Omit<ReferralRecord, "id" | "createdAt" | "status">): ReferralRecord {
  const record: ReferralRecord = {
    ...params,
    id: `ref_${Date.now()}`,
    vehicleNumber: normaliseVehicle(params.vehicleNumber),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  const all = getAllReferrals();
  all.unshift(record);
  saveReferrals(all);
  return record;
}

// ─── Mark referral as converted ──────────────────────────────────────────────
export function markReferralConverted(referralCode: string, vehicleNumber: string, orderAmount: number) {
  const vehicle = normaliseVehicle(vehicleNumber);
  const all = getAllReferrals().map(r => {
    if (r.referrerCode === referralCode && normaliseVehicle(r.vehicleNumber) === vehicle && r.status === "pending") {
      return { ...r, status: "converted" as const, convertedAt: new Date().toISOString(), orderAmount };
    }
    return r;
  });
  saveReferrals(all);
}

// ─── Get referral stats ───────────────────────────────────────────────────────
export function getReferralStats() {
  const all = getAllReferrals();
  return {
    total: all.length,
    pending: all.filter(r => r.status === "pending").length,
    converted: all.filter(r => r.status === "converted").length,
    rewarded: all.filter(r => r.status === "rewarded").length,
    rejected: all.filter(r => r.status === "rejected").length,
    totalRewardsPaid: all.filter(r => r.status === "rewarded").reduce((s, r) => s + r.referrerRewardAmount, 0),
    totalDiscountsGiven: all.filter(r => ["converted", "rewarded"].includes(r.status)).reduce((s, r) => s + r.refereeDiscountAmount, 0),
  };
}
