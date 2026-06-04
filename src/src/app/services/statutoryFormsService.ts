/**
 * Statutory Forms Service
 * Manages PF Form 11 and ESIC Form 1 submissions
 */

export type StatutoryFormStatus =
  | "Pending Verification"
  | "Verified"
  | "Rejected";

export type StatutoryFormType = "PF Form 11" | "ESIC Form 1";

export interface StatutoryFormSubmission {
  id: string;
  employeeId: string;
  employeeName: string;
  formType: StatutoryFormType;
  formData: any; // Full form data
  submittedOn: string;
  status: StatutoryFormStatus;
  verifiedBy?: string;
  verifiedOn?: string;
  rejectedBy?: string;
  rejectedOn?: string;
  rejectionReason?: string;
}

const STORAGE_KEY = "STATUTORY_FORMS_SUBMISSIONS";

class StatutoryFormsService {
  private subscribers: Set<(submissions: StatutoryFormSubmission[]) => void> = new Set();

  /**
   * Get all form submissions
   */
  getAll(): StatutoryFormSubmission[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading statutory forms from storage:", error);
      return [];
    }
  }

  /**
   * Get submissions for a specific employee
   */
  getByEmployeeId(employeeId: string): StatutoryFormSubmission[] {
    return this.getAll().filter(sub => sub.employeeId === employeeId);
  }

  /**
   * Get pending submissions (for HR verification queue)
   */
  getPending(): StatutoryFormSubmission[] {
    return this.getAll().filter(sub => sub.status === "Pending Verification");
  }

  /**
   * Get a specific submission by ID
   */
  getById(id: string): StatutoryFormSubmission | undefined {
    return this.getAll().find(sub => sub.id === id);
  }

  /**
   * Check if employee has submitted a specific form type
   */
  hasSubmitted(employeeId: string, formType: StatutoryFormType): boolean {
    return this.getAll().some(
      sub => sub.employeeId === employeeId && sub.formType === formType
    );
  }

  /**
   * Get submission status for a specific employee and form type
   */
  getStatus(employeeId: string, formType: StatutoryFormType): StatutoryFormStatus | null {
    const submission = this.getAll().find(
      sub => sub.employeeId === employeeId && sub.formType === formType
    );
    return submission ? submission.status : null;
  }

  /**
   * Add a new form submission
   */
  submit(submission: StatutoryFormSubmission): void {
    const submissions = this.getAll();

    // Check if employee already has a submission for this form type
    const existingIndex = submissions.findIndex(
      sub => sub.employeeId === submission.employeeId && sub.formType === submission.formType
    );

    if (existingIndex !== -1) {
      // Replace existing submission
      submissions[existingIndex] = submission;
    } else {
      // Add new submission
      submissions.push(submission);
    }

    this.save(submissions);
  }

  /**
   * Verify a form submission
   */
  verify(id: string, verifiedBy: string): void {
    const submissions = this.getAll();
    const index = submissions.findIndex(sub => sub.id === id);

    if (index !== -1) {
      submissions[index] = {
        ...submissions[index],
        status: "Verified",
        verifiedBy,
        verifiedOn: new Date().toISOString(),
      };
      this.save(submissions);
    }
  }

  /**
   * Reject a form submission
   */
  reject(id: string, rejectedBy: string, rejectionReason: string): void {
    const submissions = this.getAll();
    const index = submissions.findIndex(sub => sub.id === id);

    if (index !== -1) {
      submissions[index] = {
        ...submissions[index],
        status: "Rejected",
        rejectedBy,
        rejectedOn: new Date().toISOString(),
        rejectionReason,
      };
      this.save(submissions);
    }
  }

  /**
   * Update a submission
   */
  update(id: string, updates: Partial<StatutoryFormSubmission>): void {
    const submissions = this.getAll();
    const index = submissions.findIndex(sub => sub.id === id);

    if (index !== -1) {
      submissions[index] = { ...submissions[index], ...updates };
      this.save(submissions);
    }
  }

  /**
   * Delete a submission
   */
  delete(id: string): void {
    const submissions = this.getAll();
    const filtered = submissions.filter(sub => sub.id !== id);
    this.save(filtered);
  }

  /**
   * Save submissions to localStorage and notify subscribers
   */
  private save(submissions: StatutoryFormSubmission[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
      this.notifySubscribers(submissions);
    } catch (error) {
      console.error("Error saving statutory forms to storage:", error);
    }
  }

  /**
   * Subscribe to submission changes
   */
  subscribe(callback: (submissions: StatutoryFormSubmission[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(submissions: StatutoryFormSubmission[]): void {
    this.subscribers.forEach(callback => callback(submissions));
  }

  /**
   * Clear all submissions (for testing/reset)
   */
  clear(): void {
    this.save([]);
  }
}

export const statutoryFormsService = new StatutoryFormsService();
