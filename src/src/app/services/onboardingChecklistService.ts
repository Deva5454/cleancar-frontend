/**
 * Onboarding Checklist Service
 * Manages employee-specific onboarding checklists
 */

export interface OnboardingTask {
  task: string;
  status: "Completed" | "In Progress" | "Pending" | "Not Started";
  completedOn?: string;
  dueDate?: string;
  uploadedOn?: string;
  verified?: boolean;
  verifiedBy?: string;
  verifiedOn?: string;
  contradictionFlagged?: boolean;
}

export interface EmployeeOnboardingChecklist {
  employeeId: string;
  tasks: OnboardingTask[];
  lastUpdated: string;
}

const STORAGE_KEY = "EMPLOYEE_ONBOARDING_CHECKLISTS";

// Default checklist template for new employees
const DEFAULT_TASKS: OnboardingTask[] = [
  { task: "Upload KYC Documents", status: "Not Started", dueDate: "" },
  { task: "PF Form 11 (Statutory)", status: "Not Started", dueDate: "" },
  { task: "ESIC Form 1 (Statutory)", status: "Not Started", dueDate: "" },
  { task: "Bank Account Details", status: "Not Started", dueDate: "" },
  { task: "PAN Card", status: "Not Started", dueDate: "" },
  { task: "Aadhaar Card", status: "Not Started", dueDate: "" },
  { task: "Current Address Proof", status: "Not Started", dueDate: "" },
  { task: "Education Certificates", status: "Not Started", dueDate: "" },
  { task: "Experience Letters", status: "Not Started", dueDate: "" },
  { task: "Medical Fitness Certificate", status: "Not Started", dueDate: "" },
  { task: "Police Verification", status: "Not Started", dueDate: "" },
];

class OnboardingChecklistService {
  private subscribers: Set<(checklists: EmployeeOnboardingChecklist[]) => void> = new Set();

  /**
   * Get all onboarding checklists
   */
  getAll(): EmployeeOnboardingChecklist[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading onboarding checklists from storage:", error);
      return [];
    }
  }

  /**
   * Get checklist for a specific employee
   */
  getByEmployeeId(employeeId: string): OnboardingTask[] {
    const checklists = this.getAll();
    const checklist = checklists.find(c => c.employeeId === employeeId);

    if (checklist) {
      return checklist.tasks;
    }

    // Return default template if no checklist exists for this employee
    return [...DEFAULT_TASKS];
  }

  /**
   * Update checklist for a specific employee
   */
  update(employeeId: string, tasks: OnboardingTask[]): void {
    const checklists = this.getAll();
    const index = checklists.findIndex(c => c.employeeId === employeeId);

    const updatedChecklist: EmployeeOnboardingChecklist = {
      employeeId,
      tasks,
      lastUpdated: new Date().toISOString(),
    };

    if (index !== -1) {
      checklists[index] = updatedChecklist;
    } else {
      checklists.push(updatedChecklist);
    }

    this.save(checklists);
  }

  /**
   * Delete checklist for a specific employee
   */
  delete(employeeId: string): void {
    const checklists = this.getAll();
    const filtered = checklists.filter(c => c.employeeId !== employeeId);
    this.save(filtered);
  }

  /**
   * Save checklists to localStorage and notify subscribers
   */
  private save(checklists: EmployeeOnboardingChecklist[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(checklists));
      this.notifySubscribers(checklists);
    } catch (error) {
      console.error("Error saving onboarding checklists to storage:", error);
    }
  }

  /**
   * Subscribe to checklist changes
   */
  subscribe(callback: (checklists: EmployeeOnboardingChecklist[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of data changes
   */
  private notifySubscribers(checklists: EmployeeOnboardingChecklist[]): void {
    this.subscribers.forEach(callback => callback(checklists));
  }

  /**
   * Clear all checklists (for testing/reset)
   */
  clear(): void {
    this.save([]);
  }
}

export const onboardingChecklistService = new OnboardingChecklistService();
