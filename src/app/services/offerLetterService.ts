/**
 * Offer Letter Service
 * Shared service for storing and retrieving offer letters across HR modules
 */

export type OfferStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface OfferLetterRecord {
  id: string;
  employeeTempId: string;
  candidateName: string;
  email: string;
  address: string;
  mobile?: string;
  designation: string;
  department: string;
  reportingManager: string;
  workLocation: string;
  pinCodes: string[];
  skillLevel: string;
  salaryComponents: {
    basic: number;
    hra: number;
    conveyance: number;
    medical: number;
    specialAllowance: number;
    monthlyGross: number;
    employeePF: number;
    employeeESIC: number;
    professionalTax: number;
    netTakeHome: number;
    employerPF: number;
    employerESIC: number;
    totalCTC: number;
    annualCTC: number;
  };
  salaryStructureId?: string;
  dateOfJoining: string;
  probationPeriod: string;
  workingHours: string;
  leaveEntitlement: string;
  issueDate: string;
  acceptanceDeadline: string;
  status: OfferStatus;
  sentOn?: string;
  acceptedOn?: string;
  rejectedOn?: string;
  convertedToAppointment?: boolean; // Track if already converted
  appointmentId?: string; // Link to appointment letter

  // ── Fields matching the reference letter template ──────────────────
  employmentType: string;
  probationMonths: number;
  noticeDuringProbationMonths: number;
  noticeAfterConfirmationMonths: number;
  acceptanceDeadlineDays: number;

  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  signeeName: string;
  signeeTitle: string;
  signeeEmail: string;
  signeePhone: string;

  // ── Editable content — auto-generated from the above at creation
  // time, then freely editable by HR/Super Admin per offer before
  // sending. Editing these does not change the template for future
  // offers, only this one. ──────────────────────────────────────────
  introText: string;
  conditionalNote: string;
  placeOfPostingText: string;
  probationText: string;
  conditionsOfOffer: string[];
  acceptanceText: string;
  closingText: string;

  /** Audit trail of manual content edits (who/when/what changed). */
  contentEditLog?: Array<{
    field: string;
    editedBy: string;
    editedByRole: string;
    editedAt: string;
  }>;
}

const STORAGE_KEY = "OFFER_LETTERS";

class OfferLetterService {
  private subscribers: Set<(offers: OfferLetterRecord[]) => void> = new Set();

  /**
   * Get all offer letters
   */
  getAll(): OfferLetterRecord[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading offer letters from storage:", error);
      return [];
    }
  }

  /**
   * Get accepted offers only
   */
  getAccepted(): OfferLetterRecord[] {
    return this.getAll().filter(offer => offer.status === "Accepted");
  }

  /**
   * Get accepted offers that haven't been converted to appointment letters
   */
  getEligibleForAppointment(): OfferLetterRecord[] {
    return this.getAccepted().filter(offer => !offer.convertedToAppointment);
  }

  /**
   * Get a single offer by ID
   */
  getById(id: string): OfferLetterRecord | undefined {
    return this.getAll().find(offer => offer.id === id);
  }

  /**
   * Add a new offer letter
   */
  add(offer: OfferLetterRecord): void {
    const offers = this.getAll();
    offers.push(offer);
    this.save(offers);
  }

  /**
   * Update editable content fields on an offer letter, logging who
   * changed what. Used by the HR/Super Admin content-edit screen.
   */
  updateContent(
    id: string,
    updates: Partial<Pick<OfferLetterRecord,
      "introText" | "conditionalNote" | "placeOfPostingText" | "probationText" |
      "conditionsOfOffer" | "acceptanceText" | "closingText" |
      "employmentType" | "probationMonths" | "noticeDuringProbationMonths" |
      "noticeAfterConfirmationMonths" | "acceptanceDeadlineDays" |
      "signeeName" | "signeeTitle" | "signeeEmail" | "signeePhone"
    >>,
    editedBy: string,
    editedByRole: string
  ): void {
    const offers = this.getAll();
    const index = offers.findIndex(offer => offer.id === id);
    if (index === -1) return;

    const now = new Date().toISOString();
    const editLog = offers[index].contentEditLog || [];
    const newEntries = Object.keys(updates).map((field) => ({
      field, editedBy, editedByRole, editedAt: now,
    }));

    offers[index] = {
      ...offers[index],
      ...updates,
      contentEditLog: [...editLog, ...newEntries],
    };
    this.save(offers);
  }

  /**
   * Update an existing offer letter
   */
  update(id: string, updates: Partial<OfferLetterRecord>): void {
    const offers = this.getAll();
    const index = offers.findIndex(offer => offer.id === id);

    if (index !== -1) {
      offers[index] = { ...offers[index], ...updates };
      this.save(offers);
    }
  }

  /**
   * Mark an offer as converted to appointment letter
   */
  markAsConverted(offerId: string, appointmentId: string): void {
    this.update(offerId, {
      convertedToAppointment: true,
      appointmentId: appointmentId
    });
  }

  /**
   * Delete an offer letter
   */
  delete(id: string): void {
    const offers = this.getAll();
    const filtered = offers.filter(offer => offer.id !== id);
    this.save(filtered);
  }

  /**
   * Save offers to localStorage and notify subscribers
   */
  private save(offers: OfferLetterRecord[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
      this.notifySubscribers(offers);
    } catch (error) {
      console.error("Error saving offer letters to storage:", error);
    }
  }

  /**
   * Subscribe to offer letter changes
   */
  subscribe(callback: (offers: OfferLetterRecord[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(offers: OfferLetterRecord[]): void {
    this.subscribers.forEach(callback => callback(offers));
  }

  /**
   * Clear all offer letters (for testing/reset)
   */
  clear(): void {
    this.save([]);
  }
}

export const offerLetterService = new OfferLetterService();
