/**
 * 🟪 COMP OFF MANAGEMENT SERVICE
 * 
 * Core Principle: "Comp Off is system-generated based on work done on non-working days,
 * calculated via work hours, and credited only after approval."
 * 
 * Features:
 * - System-generated Comp Off based on work hours
 * - Manager approval workflow
 * - 90-day validity tracking with FIFO consumption
 * - Expiry alerts and automatic removal
 */

export interface CompOffEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  workDate: string; // The off-day when work was done
  workDayType: "Weekly Off" | "Public Holiday" | "Approved Off";
  workHours: number;
  compOffDays: number; // 0.5 or 1.0
  earnedDate: string; // Date when approved
  expiryDate: string; // earnedDate + 90 days
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "EXPIRED" | "CONSUMED";
  requestedOn: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectedBy?: string;
  rejectedOn?: string;
  rejectionReason?: string;
  consumed: number; // How much has been used (0, 0.5, or 1.0)
  notes?: string;
}

export interface CompOffRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  empCode: string;
  workDate: string;
  workDayType: "Weekly Off" | "Public Holiday" | "Approved Off";
  workHours: number;
  suggestedCompOff: number; // 0.5 or 1.0
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedOn: string;
  workEvidence?: string; // Attendance logs, task completion, etc.
}

export interface CompOffBalance {
  total: number; // Total available
  breakdown: CompOffEntry[]; // Individual entries with expiry
  expiringWithin7Days: CompOffEntry[];
  pendingApproval: CompOffRequest[];
}

class CompOffService {
  private STORAGE_KEY = "compoff_entries";
  private REQUESTS_KEY = "compoff_requests";
  private VALIDITY_DAYS = 90;

  /**
   * 🎯 STEP 1: DETECT WORK ON OFF-DAY
   * System automatically generates Comp Off request when work detected on non-working day
   */
  detectAndGenerateCompOffRequest(
    employeeId: string,
    employeeName: string,
    empCode: string,
    workDate: string,
    workDayType: "Weekly Off" | "Public Holiday" | "Approved Off",
    loginTime: string,
    logoutTime: string,
    workEvidence?: string
  ): CompOffRequest | null {
    // Calculate work hours
    const workHours = this.calculateWorkHours(loginTime, logoutTime);
    
    // No work = No Comp Off
    if (workHours === 0) {
      return null;
    }

    // Calculate suggested Comp Off
    const suggestedCompOff = workHours >= 5 ? 1.0 : 0.5;

    const request: CompOffRequest = {
      id: `COMP_REQ_${Date.now()}_${(0.85).toString(36).substr(2, 9)}`,
      employeeId,
      employeeName,
      empCode,
      workDate,
      workDayType,
      workHours,
      suggestedCompOff,
      status: "PENDING",
      requestedOn: new Date().toISOString(),
      workEvidence,
    };

    // Save request
    this.saveCompOffRequest(request);

    return request;
  }

  /**
   * ⏱️ Calculate work hours from login/logout
   */
  private calculateWorkHours(loginTime: string, logoutTime: string): number {
    try {
      const login = new Date(`2000-01-01T${loginTime}`);
      const logout = new Date(`2000-01-01T${logoutTime}`);
      const diffMs = logout.getTime() - login.getTime();
      const hours = Math.max(0, diffMs / (1000 * 60 * 60));
      return Math.round(hours * 10) / 10; // Round to 1 decimal
    } catch {
      return 0;
    }
  }

  /**
   * 🟨 STEP 2: MANAGER APPROVAL
   * Manager approves/rejects the Comp Off request
   */
  approveCompOffRequest(
    requestId: string,
    approverName: string,
    notes?: string
  ): CompOffEntry | null {
    const requests = this.getCompOffRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request || request.status !== "PENDING") {
      return null;
    }

    // Mark request as approved
    request.status = "APPROVED";

    // Generate Comp Off entry
    const earnedDate = new Date().toISOString().split("T")[0];
    const expiryDate = this.calculateExpiryDate(earnedDate);

    const entry: CompOffEntry = {
      id: `COMP_OFF_${Date.now()}_${(0.85).toString(36).substr(2, 9)}`,
      employeeId: request.employeeId,
      employeeName: request.employeeName,
      workDate: request.workDate,
      workDayType: request.workDayType,
      workHours: request.workHours,
      compOffDays: request.suggestedCompOff,
      earnedDate,
      expiryDate,
      status: "APPROVED",
      requestedOn: request.requestedOn,
      approvedBy: approverName,
      approvedOn: new Date().toISOString(),
      consumed: 0,
      notes,
    };

    // Save entry
    this.saveCompOffEntry(entry);

    // Update request
    this.updateCompOffRequest(request);

    return entry;
  }

  /**
   * ❌ STEP 3: MANAGER REJECTION
   */
  rejectCompOffRequest(
    requestId: string,
    rejectorName: string,
    reason: string
  ): boolean {
    const requests = this.getCompOffRequests();
    const request = requests.find((r) => r.id === requestId);

    if (!request || request.status !== "PENDING") {
      return false;
    }

    request.status = "REJECTED";
    this.updateCompOffRequest(request);

    return true;
  }

  /**
   * 📅 Calculate expiry date (earned date + 90 days)
   */
  private calculateExpiryDate(earnedDate: string): string {
    const date = new Date(earnedDate);
    date.setDate(date.getDate() + this.VALIDITY_DAYS);
    return date.toISOString().split("T")[0];
  }

  /**
   * 🔥 FIFO CONSUMPTION - Deduct from oldest expiring Comp Off first
   */
  deductCompOff(employeeId: string, days: number): boolean {
    const entries = this.getEmployeeCompOffEntries(employeeId);
    
    // Get available entries (approved, not expired, not fully consumed)
    const available = entries
      .filter((e) => e.status === "APPROVED" && !this.isExpired(e) && e.consumed < e.compOffDays)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate)); // FIFO: Oldest expiry first

    let remaining = days;

    for (const entry of available) {
      if (remaining <= 0) break;

      const availableInEntry = entry.compOffDays - entry.consumed;
      const toDeduct = Math.min(remaining, availableInEntry);

      entry.consumed += toDeduct;
      remaining -= toDeduct;

      // Mark as consumed if fully used
      if (entry.consumed >= entry.compOffDays) {
        entry.status = "CONSUMED";
      }

      this.updateCompOffEntry(entry);
    }

    return remaining === 0; // True if fully deducted
  }

  /**
   * ➕ Credit back Comp Off (when leave application is rejected)
   */
  creditBackCompOff(employeeId: string, days: number): void {
    const entries = this.getEmployeeCompOffEntries(employeeId);
    
    // Get consumed/partially consumed entries sorted by expiry (reverse FIFO for credit back)
    const consumed = entries
      .filter((e) => e.consumed > 0 && !this.isExpired(e))
      .sort((a, b) => b.expiryDate.localeCompare(a.expiryDate)); // Latest first

    let remaining = days;

    for (const entry of consumed) {
      if (remaining <= 0) break;

      const toCredit = Math.min(remaining, entry.consumed);
      entry.consumed -= toCredit;
      remaining -= toCredit;

      // Restore status if no longer fully consumed
      if (entry.status === "CONSUMED" && entry.consumed < entry.compOffDays) {
        entry.status = "APPROVED";
      }

      this.updateCompOffEntry(entry);
    }
  }

  /**
   * 📊 Get employee Comp Off balance with breakdown
   */
  getEmployeeCompOffBalance(employeeId: string): CompOffBalance {
    const entries = this.getEmployeeCompOffEntries(employeeId);
    const requests = this.getCompOffRequests().filter((r) => r.employeeId === employeeId && r.status === "PENDING");

    // Mark expired entries
    this.markExpiredEntries(employeeId);

    // Get available entries
    const available = entries.filter(
      (e) => e.status === "APPROVED" && !this.isExpired(e)
    );

    // Calculate total
    const total = available.reduce((sum, e) => sum + (e.compOffDays - e.consumed), 0);

    // Get expiring within 7 days
    const today = new Date();
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

    const expiringWithin7Days = available.filter((e) => {
      const expiry = new Date(e.expiryDate);
      return expiry <= sevenDaysLater && e.consumed < e.compOffDays;
    });

    return {
      total,
      breakdown: available,
      expiringWithin7Days,
      pendingApproval: requests,
    };
  }

  /**
   * ⚠️ Check if Comp Off entry is expired
   */
  private isExpired(entry: CompOffEntry): boolean {
    const today = new Date().toISOString().split("T")[0];
    return entry.expiryDate < today;
  }

  /**
   * 🗑️ Mark expired entries
   */
  private markExpiredEntries(employeeId: string): void {
    const entries = this.getEmployeeCompOffEntries(employeeId);
    let updated = false;

    for (const entry of entries) {
      if (entry.status === "APPROVED" && this.isExpired(entry) && entry.consumed < entry.compOffDays) {
        entry.status = "EXPIRED";
        this.updateCompOffEntry(entry);
        updated = true;
      }
    }
  }

  /**
   * 📋 Get all Comp Off requests (for manager view)
   */
  getCompOffRequests(): CompOffRequest[] {
    const data = localStorage.getItem(this.REQUESTS_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * 📋 Get pending Comp Off requests for a manager
   */
  getPendingCompOffRequests(managerTeam?: string[]): CompOffRequest[] {
    const requests = this.getCompOffRequests();
    return requests.filter((r) => r.status === "PENDING");
  }

  /**
   * 💾 Storage operations
   */
  private getEmployeeCompOffEntries(employeeId: string): CompOffEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    const allEntries: CompOffEntry[] = data ? JSON.parse(data) : [];
    return allEntries.filter((e) => e.employeeId === employeeId);
  }

  private getAllCompOffEntries(): CompOffEntry[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveCompOffEntry(entry: CompOffEntry): void {
    const allEntries = this.getAllCompOffEntries();
    allEntries.push(entry);
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allEntries)); } catch(e) { console.warn("[Storage] Quota exceeded"); }
  }

  private updateCompOffEntry(updatedEntry: CompOffEntry): void {
    const allEntries = this.getAllCompOffEntries();
    const index = allEntries.findIndex((e) => e.id === updatedEntry.id);
    if (index !== -1) {
      allEntries[index] = updatedEntry;
      try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allEntries)); } catch(e) { console.warn("[Storage] Quota exceeded"); }
    }
  }

  private saveCompOffRequest(request: CompOffRequest): void {
    const requests = this.getCompOffRequests();
    requests.push(request);
    try { localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests)); } catch(e) { console.warn("[Storage] Quota exceeded"); }
  }

  private updateCompOffRequest(updatedRequest: CompOffRequest): void {
    const requests = this.getCompOffRequests();
    const index = requests.findIndex((r) => r.id === updatedRequest.id);
    if (index !== -1) {
      requests[index] = updatedRequest;
      try { localStorage.setItem(this.REQUESTS_KEY, JSON.stringify(requests)); } catch(e) { console.warn("[Storage] Quota exceeded"); }
    }
  }

  /**
   * 🧪 Seed sample data for testing
   */
  seedSampleCompOffData(employeeId: string, employeeName: string): void {
    // Sample approved Comp Off entries
    const today = new Date();
    
    // Entry 1: Expires in 5 days
    const entry1Earned = new Date(today);
    entry1Earned.setDate(entry1Earned.getDate() - 85); // 85 days ago, expires in 5 days
    const entry1: CompOffEntry = {
      id: `COMP_OFF_${Date.now()}_1`,
      employeeId,
      employeeName,
      workDate: entry1Earned.toISOString().split("T")[0],
      workDayType: "Weekly Off",
      workHours: 7,
      compOffDays: 1.0,
      earnedDate: entry1Earned.toISOString().split("T")[0],
      expiryDate: this.calculateExpiryDate(entry1Earned.toISOString().split("T")[0]),
      status: "APPROVED",
      requestedOn: entry1Earned.toISOString(),
      approvedBy: "Prakash Mehta",
      approvedOn: entry1Earned.toISOString(),
      consumed: 0,
      notes: "Worked on Sunday for urgent client requirement",
    };

    // Entry 2: Expires in 45 days
    const entry2Earned = new Date(today);
    entry2Earned.setDate(entry2Earned.getDate() - 45);
    const entry2: CompOffEntry = {
      id: `COMP_OFF_${Date.now()}_2`,
      employeeId,
      employeeName,
      workDate: entry2Earned.toISOString().split("T")[0],
      workDayType: "Public Holiday",
      workHours: 4,
      compOffDays: 0.5,
      earnedDate: entry2Earned.toISOString().split("T")[0],
      expiryDate: this.calculateExpiryDate(entry2Earned.toISOString().split("T")[0]),
      status: "APPROVED",
      requestedOn: entry2Earned.toISOString(),
      approvedBy: "Prakash Mehta",
      approvedOn: entry2Earned.toISOString(),
      consumed: 0,
      notes: "Partial work on Holi",
    };

    this.saveCompOffEntry(entry1);
    this.saveCompOffEntry(entry2);

    // Sample pending request
    const pendingRequest: CompOffRequest = {
      id: `COMP_REQ_${Date.now()}`,
      employeeId,
      employeeName,
      empCode: "CW0001",
      workDate: new Date(today.setDate(today.getDate() - 2)).toISOString().split("T")[0],
      workDayType: "Weekly Off",
      workHours: 6,
      suggestedCompOff: 1.0,
      status: "PENDING",
      requestedOn: new Date().toISOString(),
      workEvidence: "Biometric login: 09:00 AM, Logout: 03:00 PM",
    };

    this.saveCompOffRequest(pendingRequest);
  }

  /**
   * 🗑️ Clear all Comp Off data (for testing)
   */
  clearAllCompOffData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REQUESTS_KEY);
  }
}

export const compOffService = new CompOffService();
