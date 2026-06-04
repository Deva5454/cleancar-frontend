/**
 * Supervisor Data Service - Centralized Data Management
 * Single source of truth for supervisor operations
 * Integrates with washer services for team management
 */

import { washerDataService } from "./washerDataService";
import { mockWasherDataService, type CustomerJob } from "./mockWasherDataService";
import { weekOffCoverService } from "./weekOffCoverService";

// ========== TYPES ==========

export type WasherStatus = "CHECKED_IN" | "LATE" | "NOT_YET" | "LEAVE" | "ABSENT" | "WEEK_OFF";
export type AuditStatus = "DUE" | "COMPLETED" | "OVERDUE" | "NOT_DUE";
export type ClothBatchStatus = "FRESH" | "IN_USE" | "DUE" | "OVERDUE";
export type LeadInterest = "HIGH" | "MEDIUM" | "LOW";
export type LeadStatus = "PENDING" | "IN_TELESALES" | "CONVERTED" | "DISQUALIFIED";
export type IssueStatus = "OPEN" | "IN_PROGRESS" | "ESCALATED" | "RESOLVED";
export type IssuePriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface WasherTeamMember {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  status: WasherStatus;
  checkInTime?: Date;
  gpsLocation?: { lat: number; lng: number };
  selfieUrl?: string;
  unitsCompleted: number;
  unitsTarget: number;
  lastAuditDate?: Date;
  auditStatus: AuditStatus;
  clothBatchId?: string;
  clothBatchStatus: ClothBatchStatus;
  clothIssueDate?: Date;
  clothCollectionDue?: Date;
  isOnLeave: boolean;
  leaveType?: string;
}

export interface SupervisorAlert {
  id: string;
  type: "LATE_CHECKIN" | "LOW_PROGRESS" | "PENDING_COVER" | "AUDIT_OVERDUE" | "CLOTH_OVERDUE" | "ISSUE_CRITICAL";
  priority: IssuePriority;
  washerId?: string;
  washerName?: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

export interface TeamSummary {
  totalWashers: number;
  checkedIn: number;
  late: number;
  notYet: number;
  onLeave: number;
  totalUnitsCompleted: number;
  totalUnitsTarget: number;
  auditsPending: number;
  auditsCompleted: number;
  activeAlerts: number;
  leadsToday: number;
}

export interface AuditTask {
  id: string;
  washerId: string;
  washerName: string;
  lastAuditDate?: Date;
  isDue: boolean;
  isOverdue: boolean;
  currentLocation?: { lat: number; lng: number };
}

export interface AuditSubmission {
  auditId: string;
  washerId: string;
  supervisorId: string;
  timestamp: Date;
  gpsLocation: { lat: number; lng: number };
  checklist: AuditChecklistItem[];
  photos: string[];
  nonCompliance: string[];
  notes?: string;
}

export interface AuditChecklistItem {
  id: string;
  item: string;
  isCompliant: boolean;
  notes?: string;
}

export interface ClothBatch {
  id: string;
  washerId: string;
  washerName: string;
  batchNumber: string;
  issueDate: Date;
  collectionDueDate: Date;
  status: ClothBatchStatus;
  isOverdue: boolean;
}

export interface BTLLead {
  id: string;
  capturedBy: string; // Supervisor ID
  name: string;
  mobile: string;
  vehicleType: string;
  location: string;
  area: string;
  interestLevel: LeadInterest;
  status: LeadStatus;
  captureDate: Date;
  notes?: string;
  assignedTo?: string; // Telesales person
}

export interface SupervisorIncentive {
  conversionCount: number;
  earningsTotal: number;
  earningsReleased: number; // 70%
  earningsPending: number; // 30% (90-day hold)
  kpiBreakdown: {
    conversion: { weight: number; score: number; earnings: number };
    retention: { weight: number; score: number; earnings: number };
    audit: { weight: number; score: number; earnings: number };
    complaints: { weight: number; score: number; earnings: number };
  };
}

export interface IssueTicket {
  id: string;
  reportedBy: string; // Supervisor ID
  type: "WASHER_ISSUE" | "CUSTOMER_COMPLAINT" | "QUALITY" | "EQUIPMENT" | "OTHER";
  priority: IssuePriority;
  status: IssueStatus;
  title: string;
  description: string;
  washerId?: string;
  washerName?: string;
  reportedAt: Date;
  respondedAt?: Date;
  resolvedAt?: Date;
  escalatedAt?: Date;
  responseTimeMinutes?: number;
  assignedTo?: string;
  resolution?: string;
}

export interface ScheduleEntry {
  washerId: string;
  washerName: string;
  jobs: CustomerJob[];
  coverJobs: CustomerJob[];
  totalUnits: number;
  completedUnits: number;
  area: string;
}

// ========== SERVICE CLASS ==========

class SupervisorDataService {
  private currentSupervisorId: string = "SUP-001";
  private teamSize: number = 17;

  // ========== TEAM MANAGEMENT ==========

  getTeamMembers(supervisorId: string = this.currentSupervisorId): WasherTeamMember[] {
    // In production: GET /api/supervisor/:id/team
    const members: WasherTeamMember[] = [];
    const now = new Date();
    const currentHour = now.getHours();

    const names = [
      "Rajesh Kumar", "Amit Patel", "Suresh Shah", "Vikram Singh", "Manoj Joshi",
      "Rahul Mehta", "Karan Desai", "Arjun Rao", "Rohan Gupta", "Nikhil Sharma",
      "Sanjay Trivedi", "Deepak Verma", "Anil Kumar", "Pradeep Singh", "Ravi Patel",
      "Ajay Shah", "Vishal Desai"
    ];

    for (let i = 0; i < this.teamSize; i++) {
      const status: WasherStatus = 
        i === 0 ? "LEAVE" :
        i === 1 ? "WEEK_OFF" :
        i < 12 ? (i < 2 ? "LATE" : "CHECKED_IN") :
        "NOT_YET";

      const checkInTime = status === "CHECKED_IN" ? new Date(now.setHours(currentHour - 2, 8)) :
                          status === "LATE" ? new Date(now.setHours(9, 15 + 8)) :
                          undefined;

      const unitsCompleted = status === "CHECKED_IN" ? Math.floor(0.42 * 15) + 5 :
                            status === "LATE" ? Math.floor(0.42 * 8) + 2 :
                            0;

      const lastAuditDaysAgo = Math.floor(0.42 * 10);
      const lastAuditDate = lastAuditDaysAgo < 8 ? new Date(Date.now() - lastAuditDaysAgo * 24 * 60 * 60 * 1000) : undefined;
      
      const clothIssueDaysAgo = Math.floor(0.42 * 25) + 1;
      const clothIssueDate = new Date(Date.now() - clothIssueDaysAgo * 24 * 60 * 60 * 1000);
      const clothCollectionDue = new Date(clothIssueDate.getTime() + 21 * 24 * 60 * 60 * 1000);
      const clothBatchStatus: ClothBatchStatus = 
        clothIssueDaysAgo > 21 ? "OVERDUE" :
        clothIssueDaysAgo > 18 ? "DUE" :
        clothIssueDaysAgo > 7 ? "IN_USE" :
        "FRESH";

      members.push({
        id: `WASHER-${String(i + 1).padStart(3, "0")}`,
        name: names[i],
        phone: `+91 ${Math.floor(90000 + 0.42 * 10000)} ${Math.floor(10000 + 0.42 * 90000)}`,
        status,
        checkInTime,
        gpsLocation: status === "CHECKED_IN" || status === "LATE" ?
          { lat: 21.1702 + (0.42 - 0.5) * 0.1, lng: 72.8311 + (0.42 - 0.5) * 0.1 } :
          undefined,
        selfieUrl: (status === "CHECKED_IN" || status === "LATE") ? 
          `https://via.placeholder.com/100x100?text=${names[i].split(" ")[0]}` : undefined,
        unitsCompleted,
        unitsTarget: 25,
        lastAuditDate,
        auditStatus: !lastAuditDate ? "OVERDUE" : lastAuditDaysAgo > 7 ? "DUE" : "COMPLETED",
        clothBatchId: `CLT-${String(i + 1).padStart(3, "0")}`,
        clothBatchStatus,
        clothIssueDate,
        clothCollectionDue,
        isOnLeave: status === "LEAVE",
        leaveType: status === "LEAVE" ? "Casual Leave" : undefined,
      });
    }

    return members;
  }

  getTeamSummary(supervisorId: string = this.currentSupervisorId): TeamSummary {
    // In production: GET /api/supervisor/:id/summary
    const members = this.getTeamMembers(supervisorId);
    
    return {
      totalWashers: members.length,
      checkedIn: members.filter(m => m.status === "CHECKED_IN").length,
      late: members.filter(m => m.status === "LATE").length,
      notYet: members.filter(m => m.status === "NOT_YET").length,
      onLeave: members.filter(m => m.isOnLeave || m.status === "WEEK_OFF").length,
      totalUnitsCompleted: members.reduce((sum, m) => sum + m.unitsCompleted, 0),
      totalUnitsTarget: members.length * 25,
      auditsPending: members.filter(m => m.auditStatus === "DUE" || m.auditStatus === "OVERDUE").length,
      auditsCompleted: members.filter(m => m.auditStatus === "COMPLETED").length,
      activeAlerts: this.getAlerts(supervisorId).filter(a => !a.isRead).length,
      leadsToday: this.getBTLLeads(supervisorId).filter(l => {
        const today = new Date().toDateString();
        return l.captureDate.toDateString() === today;
      }).length,
    };
  }

  // ========== ALERTS ==========

  getAlerts(supervisorId: string = this.currentSupervisorId): SupervisorAlert[] {
    // In production: GET /api/supervisor/:id/alerts
    const alerts: SupervisorAlert[] = [];
    const members = this.getTeamMembers(supervisorId);

    // Late check-ins
    members.filter(m => m.status === "LATE").forEach(m => {
      alerts.push({
        id: `ALERT-LATE-${m.id}`,
        type: "LATE_CHECKIN",
        priority: "HIGH",
        washerId: m.id,
        washerName: m.name,
        message: `${m.name} checked in late at ${m.checkInTime?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
        timestamp: m.checkInTime!,
        isRead: false,
        actionUrl: `/supervisor/team`,
      });
    });

    // Low progress
    const now = new Date();
    if (now.getHours() >= 7) {
      members.filter(m => m.status === "CHECKED_IN" && m.unitsCompleted < 15).forEach(m => {
        alerts.push({
          id: `ALERT-PROGRESS-${m.id}`,
          type: "LOW_PROGRESS",
          priority: "HIGH",
          washerId: m.id,
          washerName: m.name,
          message: `${m.name} has only ${m.unitsCompleted} units (target: 25)`,
          timestamp: new Date(),
          isRead: false,
          actionUrl: `/supervisor/schedule`,
        });
      });
    }

    // Audit overdue
    members.filter(m => m.auditStatus === "OVERDUE").forEach(m => {
      alerts.push({
        id: `ALERT-AUDIT-${m.id}`,
        type: "AUDIT_OVERDUE",
        priority: "MEDIUM",
        washerId: m.id,
        washerName: m.name,
        message: `${m.name} audit is overdue`,
        timestamp: new Date(),
        isRead: false,
        actionUrl: `/supervisor/audit`,
      });
    });

    // Cloth overdue
    members.filter(m => m.clothBatchStatus === "OVERDUE").forEach(m => {
      alerts.push({
        id: `ALERT-CLOTH-${m.id}`,
        type: "CLOTH_OVERDUE",
        priority: "MEDIUM",
        washerId: m.id,
        washerName: m.name,
        message: `${m.name} cloth collection overdue`,
        timestamp: new Date(),
        isRead: false,
        actionUrl: `/supervisor/cloth`,
      });
    });

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  markAlertRead(alertId: string): void {
    // In production: PUT /api/supervisor/alert/:id/read
    console.log("Alert marked as read:", alertId);
  }

  // ========== FIELD AUDIT ==========

  getAuditTasks(supervisorId: string = this.currentSupervisorId): AuditTask[] {
    // In production: GET /api/supervisor/:id/audit-tasks
    const members = this.getTeamMembers(supervisorId);
    
    return members
      .filter(m => m.status === "CHECKED_IN" || m.status === "LATE")
      .map(m => ({
        id: `AUDIT-${m.id}`,
        washerId: m.id,
        washerName: m.name,
        lastAuditDate: m.lastAuditDate,
        isDue: m.auditStatus === "DUE",
        isOverdue: m.auditStatus === "OVERDUE",
        currentLocation: m.gpsLocation,
      }));
  }

  submitAudit(submission: AuditSubmission): { success: boolean; message?: string } {
    // Calculate audit score from checklist compliance
    const totalItems = submission.checklist.length;
    const compliantItems = submission.checklist.filter(c => c.isCompliant).length;
    const auditScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 75;

    // Fire event so IncentiveContext can update washer achievement
    try {
      window.dispatchEvent(new CustomEvent("cc360_audit_submitted", {
        detail: {
          washerId: submission.washerId,
          supervisorId: submission.supervisorId,
          auditScore,
          timestamp: submission.timestamp,
        }
      }));
    } catch { /* non-critical */ }

    console.log("Audit submitted — score:", auditScore, "washer:", submission.washerId);
    return { success: true };
  }

  // ========== CLOTH MANAGEMENT ==========

  getClothBatches(supervisorId: string = this.currentSupervisorId): ClothBatch[] {
    // In production: GET /api/supervisor/:id/cloth-batches
    const members = this.getTeamMembers(supervisorId);
    
    return members.map(m => ({
      id: m.clothBatchId!,
      washerId: m.id,
      washerName: m.name,
      batchNumber: m.clothBatchId!,
      issueDate: m.clothIssueDate!,
      collectionDueDate: m.clothCollectionDue!,
      status: m.clothBatchStatus,
      isOverdue: m.clothBatchStatus === "OVERDUE",
    }));
  }

  issueNewBatch(washerId: string): { success: boolean; batchId?: string } {
    // In production: POST /api/supervisor/cloth/issue
    const batchId = `CLT-${Date.now()}`;
    console.log("New batch issued:", batchId, "to", washerId);
    return { success: true, batchId };
  }

  collectBatch(batchId: string): { success: boolean } {
    // In production: POST /api/supervisor/cloth/collect
    console.log("Batch collected:", batchId);
    return { success: true };
  }

  // ========== TEAM SCHEDULE ==========

  getTeamSchedule(supervisorId: string = this.currentSupervisorId): ScheduleEntry[] {
    // In production: GET /api/supervisor/:id/schedule
    const members = this.getTeamMembers(supervisorId);
    
    return members.map(m => {
      const jobs = mockWasherDataService.getTodayJobs(m.id, 25);
      const coverJobs = weekOffCoverService.getCoverJobs(m.id);
      
      return {
        washerId: m.id,
        washerName: m.name,
        jobs,
        coverJobs,
        totalUnits: jobs.length + coverJobs.length,
        completedUnits: m.unitsCompleted,
        area: jobs[0]?.area || "Various",
      };
    });
  }

  reassignJob(jobId: string, fromWasherId: string, toWasherId: string): { success: boolean } {
    // In production: POST /api/supervisor/job/reassign
    console.log(`Job ${jobId} reassigned from ${fromWasherId} to ${toWasherId}`);
    return { success: true };
  }

  // ========== BTL LEAD CAPTURE ==========

  getBTLLeads(supervisorId: string = this.currentSupervisorId): BTLLead[] {
    // In production: GET /api/supervisor/:id/leads
    const leads: BTLLead[] = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      leads.push({
        id: `LEAD-${String(i + 1).padStart(4, "0")}`,
        capturedBy: supervisorId,
        name: ["Amit", "Priya", "Rohan", "Sneha", "Karan"][i],
        mobile: `+91 ${Math.floor(90000 + 0.42 * 10000)} ${Math.floor(10000 + 0.42 * 90000)}`,
        vehicleType: ["Sedan", "SUV", "Hatchback", "Sedan", "SUV"][i],
        location: "Adajan, Surat",
        area: "Adajan",
        interestLevel: ["HIGH", "MEDIUM", "HIGH", "LOW", "MEDIUM"][i] as LeadInterest,
        status: ["PENDING", "IN_TELESALES", "CONVERTED", "PENDING", "PENDING"][i] as LeadStatus,
        captureDate: new Date(today.getTime() - i * 2 * 60 * 60 * 1000),
      });
    }
    
    return leads;
  }

  submitLead(lead: Omit<BTLLead, "id" | "captureDate">): { success: boolean; leadId?: string } {
    // In production: POST /api/supervisor/lead
    const leadId = `LEAD-${Date.now()}`;
    console.log("Lead submitted:", leadId, lead);
    return { success: true, leadId };
  }

  // ========== INCENTIVE TRACKER ==========

  getIncentiveData(supervisorId: string = this.currentSupervisorId): SupervisorIncentive {
    // In production: GET /api/supervisor/:id/incentive
    const total = 25000;
    const released = total * 0.7;
    const pending = total * 0.3;

    return {
      conversionCount: 12,
      earningsTotal: total,
      earningsReleased: released,
      earningsPending: pending,
      kpiBreakdown: {
        conversion: { weight: 40, score: 85, earnings: total * 0.4 },
        retention: { weight: 30, score: 92, earnings: total * 0.3 },
        audit: { weight: 20, score: 78, earnings: total * 0.2 },
        complaints: { weight: 10, score: 95, earnings: total * 0.1 },
      },
    };
  }

  // ========== ISSUE MANAGEMENT ==========

  getIssues(supervisorId: string = this.currentSupervisorId): IssueTicket[] {
    // In production: GET /api/supervisor/:id/issues
    const issues: IssueTicket[] = [];
    
    for (let i = 0; i < 3; i++) {
      const reportedAt = new Date(Date.now() - i * 3 * 60 * 60 * 1000);
      const status: IssueStatus = ["OPEN", "IN_PROGRESS", "RESOLVED"][i] as IssueStatus;
      
      issues.push({
        id: `ISSUE-${String(i + 1).padStart(4, "0")}`,
        reportedBy: supervisorId,
        type: ["WASHER_ISSUE", "CUSTOMER_COMPLAINT", "QUALITY"][i] as any,
        priority: ["CRITICAL", "HIGH", "MEDIUM"][i] as IssuePriority,
        status,
        title: [
          "Washer equipment malfunction",
          "Customer complaint - incomplete wash",
          "Quality issue in Adajan area"
        ][i],
        description: "Issue details...",
        reportedAt,
        responseTimeMinutes: status !== "OPEN" ? 45 : undefined,
        resolvedAt: status === "RESOLVED" ? new Date(reportedAt.getTime() + 2 * 60 * 60 * 1000) : undefined,
      });
    }
    
    return issues;
  }

  submitIssue(issue: Omit<IssueTicket, "id" | "reportedAt">): { success: boolean; issueId?: string } {
    // In production: POST /api/supervisor/issue
    const issueId = `ISSUE-${Date.now()}`;
    console.log("Issue submitted:", issueId, issue);
    return { success: true, issueId };
  }

  resolveIssue(issueId: string, resolution: string): { success: boolean } {
    // In production: PUT /api/supervisor/issue/:id/resolve
    console.log("Issue resolved:", issueId, resolution);
    return { success: true };
  }

  escalateIssue(issueId: string, toManagerId: string): { success: boolean } {
    // In production: POST /api/supervisor/issue/:id/escalate
    console.log("Issue escalated:", issueId, "to", toManagerId);
    return { success: true };
  }

  // ========== UTILITY ==========

  getCurrentShift(): 1 | 2 | "GAP" {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return 1;
    if (hour >= 14 && hour < 22) return 2;
    return "GAP";
  }

  getShiftContext(): { shift: 1 | 2 | "GAP"; focusAreas: string[]; shiftLabel: string } {
    const shift = this.getCurrentShift();
    if (shift === 1) return { shift, shiftLabel: "Block 1 — Field Operations (05:00–09:00)", focusAreas: ["Attendance", "Live Audits", "Washer Alerts", "Real-time Monitoring"] };
    if (shift === 2) return { shift, shiftLabel: "Block 2 — Planning & Review (14:00–22:00)", focusAreas: ["BTL Lead Capture", "Cloth Management", "Next-day Planning", "Performance Review"] };
    return { shift, shiftLabel: "Admin Buffer (09:00–14:00)", focusAreas: ["Documentation", "BTL Leads", "Reports", "Coordination"] };
  }
}

// Singleton instance
export const supervisorDataService = new SupervisorDataService();
