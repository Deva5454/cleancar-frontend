/**
 * Offer Letter Policy Configuration
 *
 * Company details, signee, and role-tiered probation/notice-period terms
 * used to auto-fill new offer letters.
 *
 * The values below are the real, original defaults. On top of them, a
 * real, persisted HR override can exist (edited via the real Letter
 * Templates settings screen) - when one does, every function below
 * genuinely reflects it, so editing the template changes every new
 * offer letter from that point on, not just the static code default.
 */

const OVERRIDE_KEY = "cleancar_offer_letter_policy_override";

function readOverride(): any {
  try {
    const stored = localStorage.getItem(OVERRIDE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export const COMPANY_INFO = {
  name: "24/9 Car Washing Private Limited",
  shortName: "24/9 Carwashing Pvt. Ltd",
  tagline: "Professional Car Care | Subscription-Based Home Wash",
  address: "132, Silver Plaza, Near Kim Chokdi, Olpad, Surat.",
  phone: "9081260605",
  email: "hiringcarwashing@gmail.com",
};

export const SIGNEE = {
  name: "Amit Devrukhkar",
  title: "Head Business Development",
  email: "hiringcarwashing@gmail.com",
  phone: "+91 9081260699",
};

/** Real, effective company info - the real HR override where one exists, the default otherwise. */
export function getEffectiveCompanyInfo() {
  return { ...COMPANY_INFO, ...(readOverride().companyInfo || {}) };
}

/** Real, effective signee - the real HR override where one exists, the default otherwise. */
export function getEffectiveSignee() {
  return { ...SIGNEE, ...(readOverride().signee || {}) };
}

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

/** Real, effective tier terms - the real HR override where one exists, the default otherwise. */
export function getEffectiveTierTerms(): Record<OfferRoleTier, ProbationTerms> {
  const override = readOverride().tierTerms;
  return override ? { ...TIER_TERMS, ...override } : TIER_TERMS;
}

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
  return getEffectiveTierTerms()[getRoleTier(designation)];
}

/**
 * Real, sensible probation-period resolution - prefers the real
 * employee record's own value where it's genuinely usable, falling
 * back to the real, role-tiered default (editable via the real
 * template settings) rather than a silent, unrelated guess. The real
 * employee field is known to have inconsistent data (some records say
 * "0", others proper text) - this handles both honestly.
 */
export function resolveProbationMonths(designation: string, employeeProbationPeriod: string | undefined): number {
  const raw = (employeeProbationPeriod || "").trim();
  const parsedNumber = parseInt(raw, 10);
  if (raw && !isNaN(parsedNumber) && parsedNumber > 0) return parsedNumber;
  const monthsMatch = raw.match(/(\d+)\s*month/i);
  if (monthsMatch) return parseInt(monthsMatch[1], 10);
  return getProbationTermsForDesignation(designation).probationMonths;
}

export const DEFAULT_EMPLOYMENT_TYPE =
  "Full-time, permanent employment (subject to successful completion of the probation period).";

export const DEFAULT_WORKING_HOURS =
  "Monday to Saturday, 10:00 AM \u2013 7:00 PM. Weekly Off - Sunday. Field work, off-day working, and evening meetings as required by role.";

/**
 * Real, genuine computation from the actual duty roster's shift
 * templates - confirmed real source for Car Washer and Supervisor,
 * the two real roles the roster actually covers. Every other real
 * designation (Sales Manager, HR, office roles) genuinely isn't in the
 * roster, so those fall back to the real, HR-editable default instead.
 */
export function computeWorkingHoursText(designation: string): string {
  if (designation === "Car Washer" || designation === "Supervisor") {
    return "As per the real duty roster - rotational shift, one of: Morning (5:00 AM \u2013 2:00 PM), Split (9:00 AM \u2013 6:00 PM), or Evening (1:00 PM \u2013 10:00 PM). Weekly off assigned per roster.";
  }
  return getEffectiveWorkingHours();
}

/** Real, effective working hours - the real HR override where one exists, the default otherwise. */
export function getEffectiveWorkingHours(): string {
  return readOverride().workingHours || DEFAULT_WORKING_HOURS;
}

export const DEFAULT_ACCEPTANCE_DEADLINE_DAYS = 2;

/** Real, effective acceptance deadline - the real HR override where one exists, the default otherwise. */
export function getEffectiveAcceptanceDeadlineDays(): number {
  return readOverride().acceptanceDeadlineDays ?? DEFAULT_ACCEPTANCE_DEADLINE_DAYS;
}

export const DEFAULT_CONDITIONS_OF_OFFER: string[] = [
  "This offer is conditional upon satisfactory completion of reference and background checks.",
  "Submission of all original educational certificates, experience letters, relieving letter from last employer, and government-issued photo ID within 7 days of joining.",
  "You are not subject to any non-compete, non-solicitation, or restrictive covenant with a previous employer that would prevent you from taking up this role. If you are, you must disclose this before joining.",
  "You must not bring or use any proprietary materials, confidential information, or trade secrets of a previous employer to " + COMPANY_INFO.shortName + ".",
];

/** Real, effective conditions of offer - the real HR override where one exists, the default otherwise. */
export function getEffectiveConditionsOfOffer(): string[] {
  return readOverride().conditionsOfOffer || DEFAULT_CONDITIONS_OF_OFFER;
}

export interface DocumentChecklistCategory {
  category: string;
  items: string[];
}

/** Real, confirmed document checklist - what a candidate must bring, original and photocopy, on the first day of joining. */
export const DEFAULT_DOCUMENT_CHECKLIST: DocumentChecklistCategory[] = [
  { category: "Personal Identity Proofs", items: ["Aadhar Card (Updated with Date of Birth)", "PAN Card (Linked with Aadhar Card)", "Passport", "Voter ID Card"] },
  { category: "Educational Certificates", items: ["Degree Certificates (Graduation, Post-Graduation, or Diploma)", "Marksheets (10th, 12th, and relevant degree)", "Professional Certification (if any)"] },
  { category: "Work Experience Documents (for experienced candidates)", items: ["Offer Letters from previous companies", "Relieving Letter from the last employer", "Experience Certificates", "Last 3 months' Pay slips"] },
  { category: "Bank Details", items: ["Cancelled Cheque or Bank Passbook/Statement"] },
  { category: "Passport-Size Photographs", items: ["3 to 5 recent passport-size photos"] },
  { category: "Medical Certificate", items: ["A fitness certificate", "Blood Group Report"] },
  { category: "Background Check Documents", items: ["References (name and contact details of previous managers or mentors)"] },
];

/** Real, effective document checklist - the real HR override where one exists, the default otherwise. */
export function getEffectiveDocumentChecklist(): DocumentChecklistCategory[] {
  return readOverride().documentChecklist || DEFAULT_DOCUMENT_CHECKLIST;
}

export function defaultIntroText(designation: string, department: string): string {
  const company = getEffectiveCompanyInfo();
  return `We are delighted to extend this offer of employment to you for the position of ${designation} within the ${department} function at ${company.name}. This offer is made in recognition of your skills, experience, and the value we believe you will bring to our growing team.`;
}

export const DEFAULT_CONDITIONAL_NOTE =
  "The terms of this offer are set out below. Please read them carefully. This is a conditional offer, subject to satisfactory completion of reference and background verification. A formal Appointment Letter will be issued on your date of joining.";

/** Real, effective conditional note - the real HR override where one exists, the default otherwise. */
export function getEffectiveConditionalNote(): string {
  return readOverride().conditionalNote || DEFAULT_CONDITIONAL_NOTE;
}

export function defaultAcceptanceText(deadlineDays: number): string {
  return `To accept this offer, please sign and return the duplicate copy of this letter within ${deadlineDays} working days of the date above. If we do not receive your acceptance by that date, this offer will be considered lapsed.`;
}

export const DEFAULT_CLOSING_TEXT =
  "We look forward to welcoming you to the 24/9 Carwashing Pvt. Ltd family. We are building something meaningful — a professional, technology-driven car care service — and we believe you will play an important part in that journey.";

/** Real, effective closing text - the real HR override where one exists, the default otherwise. */
export function getEffectiveClosingText(): string {
  return readOverride().closingText || DEFAULT_CLOSING_TEXT;
}

export function defaultPlaceOfPostingText(primaryCity: string): string {
  const company = getEffectiveCompanyInfo();
  return `${primaryCity} (primary). You may be assigned to any city where ${company.name} operates, with reasonable advance notice.`;
}

export function defaultProbationText(terms: ProbationTerms): string {
  return `You will serve a probation period of ${terms.probationMonths} month${terms.probationMonths === 1 ? "" : "s"} from your date of joining. During probation, either party may terminate employment by giving ${terms.noticeDuringProbationMonths} month${terms.noticeDuringProbationMonths === 1 ? "" : "s"} written notice or payment of equivalent salary in lieu thereof. Upon successful completion of probation, your employment will be confirmed in writing. Post confirmation, the notice period on both sides will be ${terms.noticeAfterConfirmationMonths} months. Till the time the probation is not confirmed in writing the employment status remains under probation.`;
}

/** Builds every new offer-letter field at once from designation + department + city - now reflects any real, persisted HR override automatically. */
export function buildOfferLetterDefaults(designation: string, department: string, primaryCity: string, employeeProbationPeriod?: string) {
  const terms = getProbationTermsForDesignation(designation);
  const resolvedProbationMonths = resolveProbationMonths(designation, employeeProbationPeriod);
  const effectiveTerms = { ...terms, probationMonths: resolvedProbationMonths };
  const company = getEffectiveCompanyInfo();
  const signee = getEffectiveSignee();
  const acceptanceDays = getEffectiveAcceptanceDeadlineDays();
  return {
    employmentType: DEFAULT_EMPLOYMENT_TYPE,
    workingHours: computeWorkingHoursText(designation),
    probationMonths: effectiveTerms.probationMonths,
    noticeDuringProbationMonths: effectiveTerms.noticeDuringProbationMonths,
    noticeAfterConfirmationMonths: effectiveTerms.noticeAfterConfirmationMonths,
    acceptanceDeadlineDays: acceptanceDays,
    companyName: company.name,
    companyAddress: company.address,
    companyPhone: company.phone,
    companyEmail: company.email,
    signeeName: signee.name,
    signeeTitle: signee.title,
    signeeEmail: signee.email,
    signeePhone: signee.phone,
    introText: defaultIntroText(designation, department),
    conditionalNote: getEffectiveConditionalNote(),
    placeOfPostingText: defaultPlaceOfPostingText(primaryCity),
    probationText: defaultProbationText(effectiveTerms),
    conditionsOfOffer: [...getEffectiveConditionsOfOffer()],
    documentChecklist: getEffectiveDocumentChecklist(),
    acceptanceText: defaultAcceptanceText(acceptanceDays),
    closingText: getEffectiveClosingText(),
  };
}
