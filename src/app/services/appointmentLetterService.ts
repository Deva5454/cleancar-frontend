/**
 * Appointment Letter Service
 * Shared, real, persisted storage for appointment letters across HR modules —
 * mirrors offerLetterService.ts's exact pattern.
 *
 * ✅ FIX: AppointmentLetterGenerator.tsx previously held its appointments list
 * in local component state only, seeded from a hardcoded array, with zero
 * real persistence — an appointment letter created there was invisible to
 * every other screen (including the main HR dashboard's
 * pendingAppointmentApprovals count) the moment you navigated away. This
 * service gives it the same real, cross-screen persistence offer letters
 * already have.
 */

const STORAGE_KEY = "APPOINTMENT_LETTERS";

class AppointmentLetterService {
  private subscribers: Set<(appointments: any[]) => void> = new Set();

  /** Get every real, persisted appointment letter. */
  getAll(): any[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error("Error loading appointment letters from storage:", error);
      return [];
    }
  }

  /** Replace the entire real, persisted list — used for bulk saves from the screen's own state. */
  setAll(appointments: any[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
      this.notifySubscribers(appointments);
    } catch (error) {
      console.error("Error saving appointment letters to storage:", error);
    }
  }

  /** Real count of appointment letters awaiting approval — for dashboards. */
  getPendingApprovalCount(): number {
    return this.getAll().filter((a: any) => a.status === "Pending Approval").length;
  }

  subscribe(callback: (appointments: any[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(appointments: any[]): void {
    this.subscribers.forEach(callback => callback(appointments));
  }
}

export const appointmentLetterService = new AppointmentLetterService();
