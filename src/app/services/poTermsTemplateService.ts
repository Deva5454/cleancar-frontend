// poTermsTemplateService.ts
//
// Real, editable "Other Terms & Conditions" template used when generating a
// Purchase Order PDF. Stored once, globally, and edited via a real settings
// screen (add / delete / reorder / edit individual lines — not one freeform
// textbox, so numbering stays automatic and consistent).
//
// IMPORTANT design decision: when a PO is actually created, the CURRENT
// version of this template is copied ("snapshotted") into that PO record
// directly (see PurchaseOrders.tsx's handleSubmitPO). Editing the template
// here only affects POs created AFTER the edit — a real, already-issued PO
// is a historical document and must not silently reword itself later.

const STORAGE_KEY = "cleancar_po_terms_template";

export interface POTermTerm {
  id: string;
  text: string;
}

export interface POTermsTemplate {
  terms: POTermTerm[];
  updatedAt: string;
  updatedBy: string;
}

// Real, car-wash-specific defaults — not the construction-material wording
// this was originally patterned after.
const DEFAULT_TERMS: string[] = [
  "All cleaning chemicals and consumables must be supplied with a valid manufacturing date and a minimum remaining shelf life of 12 months from the date of delivery.",
  "A Material Safety Data Sheet (MSDS) must be provided for every chemical product at the time of first supply, and whenever the formulation changes.",
  "Goods will be inspected and quantity-verified by the Store Manager at the time of delivery; any shortage must be made good within 48 hours at the vendor's cost.",
  "If material is found unsuitable, damaged, or not as per the agreed specification, it will be returned to the vendor at the vendor's cost, with replacement arranged within 3 working days.",
  "Timely delivery is essential to daily wash operations; delivery beyond the schedule below may result in order cancellation without liability to the Company.",
  "DELIVERY SCHEDULE: within 2-3 days of receipt of this PO, unless a different date is agreed in writing.",
  "PAYMENT TERMS: as stated above, released only after quantity and quality verification at the receiving store.",
  "Our Purchase Order Number must be mentioned on all Invoices, Delivery Challans, and related communication.",
  "A valid GST Invoice must accompany every delivery; deliveries without a proper tax invoice will not be accepted at the store.",
  "Rejected or short-supplied material will be held at the vendor's own risk and cost for a maximum of 7 days; the vendor must collect it within this period, failing which the Company may dispose of it without further notice.",
  "Uniform and equipment supplied must match the sizes/specifications mentioned in this PO; incorrect sizing or specification will be replaced at the vendor's cost.",
  "Any dispute shall be subject to the jurisdiction of Surat and decided by a competent court at Surat.",
];

function genId(): string {
  return `term-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function readRaw(): POTermsTemplate | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function writeRaw(template: POTermsTemplate): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(template));
  } catch {
    // Storage can genuinely fail (quota, private browsing) — the caller's
    // toast/error handling covers this; this function only needs to not
    // throw somewhere unexpected.
  }
}

/** Real getter — seeds the real default terms on first-ever call, exactly once. */
export function getTermsTemplate(): POTermsTemplate {
  const existing = readRaw();
  if (existing && Array.isArray(existing.terms) && existing.terms.length > 0) {
    return existing;
  }
  const seeded: POTermsTemplate = {
    terms: DEFAULT_TERMS.map((text) => ({ id: genId(), text })),
    updatedAt: new Date().toISOString(),
    updatedBy: "System (default)",
  };
  writeRaw(seeded);
  return seeded;
}

/** Real save — used by the settings screen after add/delete/edit/reorder. */
export function saveTermsTemplate(terms: POTermTerm[], updatedBy: string): POTermsTemplate {
  const template: POTermsTemplate = {
    terms,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  writeRaw(template);
  return template;
}

/**
 * Real snapshot helper — call this at the moment a PO is created, not later.
 * Returns a plain array of term text, in order, ready to store directly on
 * the PurchaseOrder record (po.termsSnapshot).
 */
export function snapshotCurrentTerms(): string[] {
  return getTermsTemplate().terms.map((t) => t.text);
}
