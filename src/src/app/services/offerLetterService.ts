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
