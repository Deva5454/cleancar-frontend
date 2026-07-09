/**
 * Offer Letter Policy Configuration
 *
 * Company details, signee, and role-tiered probation/notice-period terms
 * used to auto-fill new offer letters. Every value here is a starting
 * default only — HR/Super Admin can freely edit the generated letter's
 * content per offer before sending (see OfferLetterRecord's editable
 * content fields in offerLetterService.ts).
 *
 * ASSUMPTIONS FLAGGED FOR REVIEW:
 * - Signee contact (email/phone) reuses the general hiring contact from
 *   the reference letter, since a direct number/email for Manish Kothari
 *   wasn't provided. Update SIGNEE below if he has his own.
 * - The three role tiers and their exact designation lists are a
 *   reasonable first pass based on the reference letter (a Sales Manager
 *   got 6-month probation / 1-month / 2-month notice) — confirm the
 *   boundaries match actual company policy, especially which designations
 *   belong in "Management" vs "Supervisory".
 */

export const COMPANY_INFO = {
  name: "24/9 Car Washing Private Limited",
  shortName: "24/9 Carwashing Pvt. Ltd",
  tagline: "Professional Car Care | Subscription-Based Home Wash",
  address: "132, Silver Plaza, Near Kim Chokdi, Olpad, Surat.",
  phone: "9081260605",
  email: "hiringcarwashing@gmail.com",
};

export const SIGNEE = {
  name: "Manish Kothari",
  title: "Director",
  email: "hiringcarwashing@gmail.com",
  phone: "+91 9081260699",
};

export type OfferRoleTier = "Entry" | "Supervisory" | "Management";

export interface ProbationTerms {
  probationMonths: number;
  noticeDuringProbationMonths: number;
  noticeAfterConfirmationMonths: number;
}

export const TIER_TERMS: Record<OfferRoleTier, ProbationTerms> = {
  Entry: { probationMonths: 3, noticeDuringProbationMonths: 1, noticeAfterConfirmationMonths: 1 },
  Supervisory: { probationMonths: 3, noticeDuringProbationMonths: 1, noticeAfterConfirmationMonths: 1 },
  // Matches the reference letter exactly (Sales Manager: 6mo / 1mo / 2mo)
  Management: { probationMonths: 6, noticeDuringProbationMonths: 1, noticeAfterConfirmationMonths: 2 },
};

const DESIGNATION_TIER: Record<string, OfferRoleTier> = {
  "Car Washer": "Entry",
  "Tele Sales Executive": "Entry",
  "TSE": "Entry",
  "CCE": "Entry",
  "Supervisor": "Supervisory",
  "TSM": "Supervisory",
  "Store Manager": "Supervisory",
  "Cluster Manager": "Supervisory",
  "Operations Manager": "Management",
  "Sr Operations Manager": "Management",
  "City Manager": "Management",
  "Sales Manager": "Management",
  "Procurement Manager": "Management",
  "Accounts": "Management",
  "HR": "Management",
  "Admin": "Management",
  "Super Admin": "Management",
};

/** Unmapped designations default to the most conservative (Entry) tier. */
export function getRoleTier(designation: string): OfferRoleTier {
  return DESIGNATION_TIER[designation] || "Entry";
}

export function getProbationTermsForDesignation(designation: string): ProbationTerms {
  return TIER_TERMS[getRoleTier(designation)];
}

export const DEFAULT_EMPLOYMENT_TYPE =
  "Full-time, permanent employment (subject to successful completion of the probation period).";

export const DEFAULT_ACCEPTANCE_DEADLINE_DAYS = 2;

export const DEFAULT_CONDITIONS_OF_OFFER: string[] = [
  "This offer is conditional upon satisfactory completion of reference and background checks.",
  "Submission of all original educational certificates, experience letters, relieving letter from last employer, and government-issued photo ID within 7 days of joining.",
  "You are not subject to any non-compete, non-solicitation, or restrictive covenant with a previous employer that would prevent you from taking up this role. If you are, you must disclose this before joining.",
  "You must not bring or use any proprietary materials, confidential information, or trade secrets of a previous employer to " + COMPANY_INFO.shortName + ".",
];

export function defaultIntroText(designation: string, department: string): string {
  return `We are delighted to extend this offer of employment to you for the position of ${designation} within the ${department} function at ${COMPANY_INFO.name}. This offer is made in recognition of your skills, experience, and the value we believe you will bring to our growing team.`;
}

export const DEFAULT_CONDITIONAL_NOTE =
  "The terms of this offer are set out below. Please read them carefully. This is a conditional offer, subject to satisfactory completion of reference and background verification. A formal Appointment Letter will be issued on your date of joining.";

export function defaultAcceptanceText(deadlineDays: number): string {
  return `To accept this offer, please sign and return the duplicate copy of this letter within ${deadlineDays} working days of the date above. If we do not receive your acceptance by that date, this offer will be considered lapsed.`;
}

export const DEFAULT_CLOSING_TEXT =
  "We look forward to welcoming you to the 24/9 Carwashing Pvt. Ltd family. We are building something meaningful — a professional, technology-driven car care service — and we believe you will play an important part in that journey.";

export function defaultPlaceOfPostingText(primaryCity: string): string {
  return `${primaryCity} (primary). You may be assigned to any city where ${COMPANY_INFO.name} operates, with reasonable advance notice.`;
}

export function defaultProbationText(terms: ProbationTerms): string {
  return `You will serve a probation period of ${terms.probationMonths} month${terms.probationMonths === 1 ? "" : "s"} from your date of joining. During probation, either party may terminate employment by giving ${terms.noticeDuringProbationMonths} month${terms.noticeDuringProbationMonths === 1 ? "" : "s"} written notice or payment of equivalent salary in lieu thereof. Upon successful completion of probation, your employment will be confirmed in writing. Post confirmation, the notice period on both sides will be ${terms.noticeAfterConfirmationMonths} months. Till the time the probation is not confirmed in writing the employment status remains under probation.`;
}

/** Builds every new offer-letter field at once from designation + department + city. */
export function buildOfferLetterDefaults(designation: string, department: string, primaryCity: string) {
  const terms = getProbationTermsForDesignation(designation);
  return {
    employmentType: DEFAULT_EMPLOYMENT_TYPE,
    probationMonths: terms.probationMonths,
    noticeDuringProbationMonths: terms.noticeDuringProbationMonths,
    noticeAfterConfirmationMonths: terms.noticeAfterConfirmationMonths,
    acceptanceDeadlineDays: DEFAULT_ACCEPTANCE_DEADLINE_DAYS,
    companyName: COMPANY_INFO.name,
    companyAddress: COMPANY_INFO.address,
    companyPhone: COMPANY_INFO.phone,
    companyEmail: COMPANY_INFO.email,
    signeeName: SIGNEE.name,
    signeeTitle: SIGNEE.title,
    signeeEmail: SIGNEE.email,
    signeePhone: SIGNEE.phone,
    introText: defaultIntroText(designation, department),
    conditionalNote: DEFAULT_CONDITIONAL_NOTE,
    placeOfPostingText: defaultPlaceOfPostingText(primaryCity),
    probationText: defaultProbationText(terms),
    conditionsOfOffer: [...DEFAULT_CONDITIONS_OF_OFFER],
    acceptanceText: defaultAcceptanceText(DEFAULT_ACCEPTANCE_DEADLINE_DAYS),
    closingText: DEFAULT_CLOSING_TEXT,
  };
}
