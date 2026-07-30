/**
 * letterTemplateService.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Real, dynamic letter template system for Offer Letters and Confirmation
 * Letters.
 *
 * 1. The real letterhead image - a real, swappable visual asset shared by
 *    both letter types. HR or Super Admin can replace it at any time from
 *    a real settings screen; every letter generated after that uses the
 *    new one automatically. No code change needed to update branding.
 *
 * 2. The real offer letter policy override storage and save function -
 *    the actual "effective value" merge logic lives directly in
 *    offerLetterPolicyConfig.ts (to avoid a circular import between that
 *    file and this one), and this re-exports its real getters so the
 *    settings screen has one place to import from.
 *
 * 3. A real, equivalent template for the Confirmation Letter, which
 *    didn't have any equivalent config before this.
 */

import { DEFAULT_LETTERHEAD_BASE64 } from "./_letterheadAsset";
import { CURRENT_LEAVE_POLICY } from "../config/leavePolicyConfiguration";
import {
  COMPANY_INFO as STATIC_COMPANY_INFO, SIGNEE as STATIC_SIGNEE, TIER_TERMS as STATIC_TIER_TERMS,
  DEFAULT_CONDITIONS_OF_OFFER, DEFAULT_CONDITIONAL_NOTE, DEFAULT_CLOSING_TEXT,
  DEFAULT_ACCEPTANCE_DEADLINE_DAYS, DEFAULT_WORKING_HOURS, type OfferRoleTier, type ProbationTerms,
  getEffectiveCompanyInfo, getEffectiveSignee, getEffectiveTierTerms,
  getEffectiveConditionsOfOffer, getEffectiveConditionalNote, getEffectiveClosingText,
  getEffectiveAcceptanceDeadlineDays, getEffectiveWorkingHours,
} from "../config/offerLetterPolicyConfig";

// Re-export the real, effective getters so the settings screen and any
// other real consumer has one place to import both the letterhead and
// the offer letter policy from.
export {
  getEffectiveCompanyInfo, getEffectiveSignee, getEffectiveTierTerms,
  getEffectiveConditionsOfOffer, getEffectiveConditionalNote, getEffectiveClosingText,
  getEffectiveAcceptanceDeadlineDays, getEffectiveWorkingHours,
};
export type { OfferRoleTier, ProbationTerms };

const LETTERHEAD_KEY = "cleancar_letter_letterhead_image";
const OFFER_POLICY_OVERRIDE_KEY = "cleancar_offer_letter_policy_override";
const CONFIRMATION_TEMPLATE_KEY = "cleancar_confirmation_letter_template";

export interface OfferLetterPolicyOverride {
  companyInfo?: typeof STATIC_COMPANY_INFO;
  signee?: typeof STATIC_SIGNEE;
  tierTerms?: Record<OfferRoleTier, ProbationTerms>;
  conditionsOfOffer?: string[];
  conditionalNote?: string;
  closingText?: string;
  acceptanceDeadlineDays?: number;
  workingHours?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ConfirmationLetterTemplate {
  introText: string;
  closingText: string;
  signatoryName: string;
  signatoryTitle: string;
  companyAddress: string;
  updatedAt?: string;
  updatedBy?: string;
}

const DEFAULT_CONFIRMATION_TEMPLATE: ConfirmationLetterTemplate = {
  introText:
    "We are pleased to inform you that, based on your performance during the probation period, your employment with 24/9 Car Washing Private Limited has been confirmed.",
  closingText: "We look forward to your continued contribution to our growing team.",
  signatoryName: STATIC_SIGNEE.name,
  signatoryTitle: STATIC_SIGNEE.title,
  companyAddress: STATIC_COMPANY_INFO.address,
};

// ─── Letterhead (shared by both letter types) ──────────────────────────────

export function getLetterheadImage(): string {
  return localStorage.getItem(LETTERHEAD_KEY) || DEFAULT_LETTERHEAD_BASE64;
}

/**
 * Real, previously-missing provision - HR or Super Admin can replace the
 * real letterhead image at any time. Every letter generated after this
 * uses the new one automatically; no code change required.
 */
export function setLetterheadImage(base64Image: string): void {
  localStorage.setItem(LETTERHEAD_KEY, base64Image);
}

export function resetLetterheadToDefault(): void {
  localStorage.removeItem(LETTERHEAD_KEY);
}

// ─── Offer Letter policy override storage ──────────────────────────────────

export function getOfferLetterPolicyOverride(): OfferLetterPolicyOverride {
  try {
    const stored = localStorage.getItem(OFFER_POLICY_OVERRIDE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Real, template-level save - genuinely different from editing one
 * specific letter. This changes the real default every NEW offer
 * letter starts from, from this point on - offerLetterPolicyConfig.ts's
 * own getEffective* functions read this same real storage key directly.
 */
export function saveOfferLetterPolicyOverride(override: Partial<OfferLetterPolicyOverride>, updatedBy: string): void {
  const current = getOfferLetterPolicyOverride();
  const updated = { ...current, ...override, updatedAt: new Date().toISOString(), updatedBy };
  localStorage.setItem(OFFER_POLICY_OVERRIDE_KEY, JSON.stringify(updated));
}

// ─── Confirmation Letter template ──────────────────────────────────────────

export function getConfirmationLetterTemplate(): ConfirmationLetterTemplate {
  try {
    const stored = localStorage.getItem(CONFIRMATION_TEMPLATE_KEY);
    return stored ? { ...DEFAULT_CONFIRMATION_TEMPLATE, ...JSON.parse(stored) } : DEFAULT_CONFIRMATION_TEMPLATE;
  } catch {
    return DEFAULT_CONFIRMATION_TEMPLATE;
  }
}

export function saveConfirmationLetterTemplate(template: Partial<ConfirmationLetterTemplate>, updatedBy: string): void {
  const current = getConfirmationLetterTemplate();
  const updated = { ...current, ...template, updatedAt: new Date().toISOString(), updatedBy };
  localStorage.setItem(CONFIRMATION_TEMPLATE_KEY, JSON.stringify(updated));
}

// ─── Real, system-sourced field computation ────────────────────────────────

/**
 * Real, genuine computation from the actual leave policy already
 * configured in the system - not a hardcoded string that could drift
 * out of sync with the real policy. If HR changes the real leave
 * policy, every offer letter generated afterward reflects the new
 * numbers automatically.
 */
export function computeLeaveEntitlementText(): string {
  const parts = CURRENT_LEAVE_POLICY
    .filter((p: any) => p.confirmed?.enabled && p.confirmed?.annualQuota > 0 && p.confirmed.annualQuota < 900)
    .map((p: any) => `${p.name}: ${p.confirmed.annualQuota}/year`);
  return parts.length > 0 ? parts.join(", ") + " (post-confirmation, as per Leave Policy)" : "As per Leave Policy";
}
