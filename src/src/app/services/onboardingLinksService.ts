/**
 * Onboarding Links Service
 * Manages onboarding links sent to employees
 */

export interface OnboardingLink {
  id: string;
  employeeId: string;
  employeeName: string;
  email: string;
  mobile: string;
  linkType: "Full Onboarding" | "Statutory Forms" | "Documents Only";
  linkUrl: string;
  sentVia: "Email" | "WhatsApp" | "Both";
  sentOn: string;
  expiresOn: string;
  status: "Pending" | "Opened" | "Partially Complete" | "Completed" | "Expired";
  completionPercentage: number;
  lastAccessed?: string;
  resumeAttached?: boolean;
  resumeFilename?: string;
}

const STORAGE_KEY = "ONBOARDING_LINKS";

class OnboardingLinksService {
  private subscribers: Set<(links: OnboardingLink[]) => void> = new Set();

  /**
   * Get all onboarding links
   */
  getAll(): OnboardingLink[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading onboarding links from storage:", error);
      return [];
    }
  }

  /**
   * Get link by employee ID
   */
  getByEmployeeId(employeeId: string): OnboardingLink | undefined {
    return this.getAll().find(link => link.employeeId === employeeId);
  }

  /**
   * Check if employee has an active (non-completed) link
   */
  hasActiveLink(employeeId: string): boolean {
    const link = this.getByEmployeeId(employeeId);
    return !!link && link.status !== "Completed";
  }

  /**
   * Add a new onboarding link
   */
  add(link: OnboardingLink): void {
    const links = this.getAll();
    links.unshift(link); // Add at the beginning
    this.save(links);
  }

  /**
   * Update an existing onboarding link
   */
  update(id: string, updates: Partial<OnboardingLink>): void {
    const links = this.getAll();
    const index = links.findIndex(link => link.id === id);

    if (index !== -1) {
      links[index] = { ...links[index], ...updates };
      this.save(links);
    }
  }

  /**
   * Delete an onboarding link
   */
  delete(id: string): void {
    const links = this.getAll();
    const filtered = links.filter(link => link.id !== id);
    this.save(filtered);
  }

  /**
   * Save links to localStorage and notify subscribers
   */
  private save(links: OnboardingLink[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
      this.notifySubscribers(links);
    } catch (error) {
      console.error("Error saving onboarding links to storage:", error);
    }
  }

  /**
   * Subscribe to link changes
   */
  subscribe(callback: (links: OnboardingLink[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(links: OnboardingLink[]): void {
    this.subscribers.forEach(callback => callback(links));
  }

  /**
   * Clear all links (for testing/reset)
   */
  clear(): void {
    this.save([]);
  }
}

export const onboardingLinksService = new OnboardingLinksService();
