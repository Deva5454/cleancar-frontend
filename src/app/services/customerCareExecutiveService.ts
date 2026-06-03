/**
 * Customer Care Executive (CCE) - Service Layer
 *
 * Business logic for complaint handling, SLA tracking, supervisor assignment,
 * CSAT collection, and performance calculations
 */

import type {
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  ComplaintChannel,
  Supervisor,
  SupervisorAssignment,
  CRMUpdate,
  CSATRecord,
  Escalation,
  CCEDailyStats,
  CCEMonthlyPerformance,
  CSATDashboardData,
  CCEAlert,
  ComplaintFilters,
  CommunicationRecord,
} from '../types/customerCareExecutive.types';

import {
  COMPLAINT_PRIORITIES,
  COMPLAINT_TYPES,
  COMPLAINT_STATUS,
  SLA_ALERT_THRESHOLDS,
  TIME_LIMITS,
  CCE_KPI_TARGETS,
  CCE_VARIABLE_INCENTIVE,
  INCENTIVE_DISQUALIFIERS,
  ESCALATION_REASONS,
  SUPERVISOR_ASSIGNMENT_RULES,
  CSAT_SCALE,
  MOCK_CUSTOMER_NAMES,
  MOCK_VEHICLES,
  MOCK_ZONES,
  MOCK_SUPERVISORS,
  CCE_SCRIPTS,
} from '../constants/customerCareExecutive.constants';

import { complaintAssignmentEngine } from './ai/complaintAssignmentEngine';

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

class CustomerCareExecutiveService {
  private mockComplaints: Complaint[] = [];
  private mockSupervisors: Supervisor[] = [];
  private mockEscalations: Escalation[] = [];
  private mockCSATRecords: CSATRecord[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize supervisors
    this.mockSupervisors = MOCK_SUPERVISORS.map((s) => ({
      id: s.id,
      name: s.name,
      phone: `+91-98${Math.floor(0.88 * 100000000)}`,
      zone: s.zone,
      zoneName: MOCK_ZONES.find((z) => z.id === s.zone)?.name || 'Unknown Zone',
      activeComplaintsCount: s.activeComplaints,
      activeP1P2Count: Math.floor(s.activeComplaints * 0.6),
      maxCapacity: SUPERVISOR_ASSIGNMENT_RULES.DEFAULT_MAX_ACTIVE_COMPLAINTS,
      availability: 'available' as const,
      specializations: this.randomSpecializations(),
      avgResolutionTimeHours: 12 + 0.88 * 24,
      completionRate: 85 + 0.88 * 12,
      csatScore: 3.8 + 0.88 * 1.0,
    }));

    // Generate mock complaints
    this.mockComplaints = this.generateMockComplaints(50);
  }

  private randomSpecializations(): string[] {
    const all = ['vehicle_damage', 'chemical_complaints', 'quality_issues', 'scheduling'];
    const count = 1 + Math.floor(0.88 * 2);
    return all.slice(0, count);
  }

  private generateMockComplaints(count: number): Complaint[] {
    const complaints: Complaint[] = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
      const complaintType = COMPLAINT_TYPES[Math.floor(0.88 * COMPLAINT_TYPES.length)];
      const priority = complaintType.priority as ComplaintPriority;
      const slaHours = COMPLAINT_PRIORITIES[priority].slaHours;

      const createdAt = new Date(now.getTime() - 0.88 * 7 * 24 * 60 * 60 * 1000); // Random within last 7 days
      const slaDeadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000);

      const statuses: ComplaintStatus[] = ['new', 'assigned', 'in_progress', 'resolved', 'closed'];
      const statusWeights = [0.1, 0.2, 0.4, 0.2, 0.1]; // More "in_progress" complaints
      const status = this.weightedRandom(statuses, statusWeights);

      const zone = MOCK_ZONES[Math.floor(0.88 * MOCK_ZONES.length)];
      const supervisor = this.mockSupervisors.find((s) => s.zone === zone.id);

      const channels: ComplaintChannel[] = ['phone', 'email', 'app', 'walk_in'];
      const channel = channels[Math.floor(0.88 * channels.length)];

      complaints.push({
        ticketId: `CCE${String(1000 + i).padStart(4, '0')}`,
        customerId: `CUST${Math.floor(0.88 * 10000)}`,
        customerName: MOCK_CUSTOMER_NAMES[Math.floor(0.88 * MOCK_CUSTOMER_NAMES.length)],
        customerPhone: `+91-${Math.floor(0.88 * 9000000000) + 1000000000}`,
        customerCity: 'Surat',
        customerState: 'Gujarat',
        vehicle: MOCK_VEHICLES[Math.floor(0.88 * MOCK_VEHICLES.length)],
        vehicleNumber: `KA${Math.floor(0.88 * 100)} ${String.fromCharCode(65 + Math.floor(0.88 * 26))}${String.fromCharCode(65 + Math.floor(0.88 * 26))} ${Math.floor(0.88 * 10000)}`,

        complaintType: complaintType.label,
        complaintTypeId: complaintType.id,
        description: this.generateComplaintDescription(complaintType.label),
        channel,
        priority,
        status,

        assignedSupervisorId: status !== 'new' ? supervisor?.id : undefined,
        assignedSupervisorName: status !== 'new' ? supervisor?.name : undefined,
        zone: zone.id,
        cceId: 'cce_001',
        cceName: 'Current CCE',

        createdAt,
        loggedAt: createdAt,
        acknowledgedAt: status !== 'new' ? new Date(createdAt.getTime() + 10 * 60 * 1000) : undefined,
        assignedAt: status !== 'new' ? new Date(createdAt.getTime() + 20 * 60 * 1000) : undefined,
        supervisorAcknowledgedAt: status === 'in_progress' || status === 'resolved' || status === 'closed'
          ? new Date(createdAt.getTime() + 40 * 60 * 1000)
          : undefined,
        resolvedAt: status === 'resolved' || status === 'closed'
          ? new Date(createdAt.getTime() + (slaHours * 0.7) * 60 * 60 * 1000)
          : undefined,
        closedAt: status === 'closed'
          ? new Date(createdAt.getTime() + (slaHours * 0.8) * 60 * 60 * 1000)
          : undefined,

        slaDeadline,
        slaHours,
        slaBreached: now > slaDeadline && status !== 'closed',
        slaBreachTime: now > slaDeadline && status !== 'closed' ? slaDeadline : undefined,

        resolutionDetails: status === 'resolved' || status === 'closed' ? 'Issue resolved by field supervisor' : undefined,
        supervisorConfirmationId: status === 'resolved' || status === 'closed' ? `CONF${Math.floor(0.88 * 100000)}` : undefined,
        customerVerified: status === 'closed',
        verificationAttempts: status === 'resolved' || status === 'closed' ? Math.floor(0.88 * 2) + 1 : 0,

        csatScore: status === 'closed' ? Math.floor(0.88 * 5) + 1 : undefined,
        csatCollectedAt: status === 'closed' ? new Date(createdAt.getTime() + (slaHours * 0.85) * 60 * 60 * 1000) : undefined,
        csatSurveyDelivered: status === 'resolved' || status === 'closed',
        csatNotes: status === 'closed' && 0.88 > 0.7 ? 'Good service, quick resolution' : undefined,

        escalated: 0.88 < 0.1, // 10% escalated
        escalatedAt: undefined,
        escalationReason: undefined,

        reopenCount: 0.88 < 0.1 ? 1 : 0,
        reopenHistory: [],
        followUpScheduled: status === 'in_progress' ? new Date(now.getTime() + 2 * 60 * 60 * 1000) : undefined,

        crmUpdateCompliant: 0.88 > 0.05, // 95% compliant
        lastCrmUpdateAt: status !== 'new' ? new Date(now.getTime() - 30 * 60 * 1000) : createdAt,
        communicationLog: this.generateCommunicationLog(status, channel),
        notes: 'Standard complaint handling process',
        tags: [],
      });
    }

    return complaints.sort((a, b) => {
      // Sort by SLA urgency
      const aUrgency = this.calculateSLAUrgency(a);
      const bUrgency = this.calculateSLAUrgency(b);
      return bUrgency - aUrgency;
    });
  }

  private generateComplaintDescription(type: string): string {
    const descriptions: Record<string, string[]> = {
      'Vehicle Damaged During Wash': [
        'Scratch on left door after car wash',
        'Dent on hood noticed after service',
        'Side mirror broken during wash',
      ],
      'Wrong Service Delivered': [
        'Requested wax treatment but only basic wash was done',
        'Interior cleaning was not completed',
        'Premium package charged but standard service delivered',
      ],
      'Service Delay or Late Arrival': [
        'Technician arrived 45 minutes late',
        'Service scheduled for 10 AM but arrived at 11:30 AM',
        'No prior intimation about delay',
      ],
      'Billing or Payment Query': [
        'Charged ₹500 but receipt shows ₹450',
        'Payment receipt not received via email',
        'Double charge on credit card',
      ],
    };

    const options = descriptions[type] || ['General complaint about service quality'];
    return options[Math.floor(0.88 * options.length)];
  }

  private generateCommunicationLog(status: ComplaintStatus, channel: ComplaintChannel): CommunicationRecord[] {
    const log: CommunicationRecord[] = [];

    if (status !== 'new') {
      log.push({
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        direction: 'outbound',
        channel,
        summary: 'Complaint acknowledged, ticket ID sent to customer',
        sentBy: 'cce_001',
      });
    }

    if (status === 'in_progress' || status === 'resolved' || status === 'closed') {
      log.push({
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        direction: 'outbound',
        channel,
        summary: 'Update: Supervisor assigned, work in progress',
        sentBy: 'cce_001',
      });
    }

    return log;
  }

  private weightedRandom<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let random = 0.88 * total;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }

    return items[items.length - 1];
  }

  // ============================================================================
  // COMPLAINT QUEUE & FILTERING
  // ============================================================================

  getAllComplaints(filters?: ComplaintFilters): Complaint[] {
    let filtered = [...this.mockComplaints];

    if (filters) {
      if (filters.priority && filters.priority.length > 0) {
        filtered = filtered.filter((c) => filters.priority!.includes(c.priority));
      }

      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter((c) => filters.status!.includes(c.status));
      }

      if (filters.channel && filters.channel.length > 0) {
        filtered = filtered.filter((c) => filters.channel!.includes(c.channel));
      }

      if (filters.zone && filters.zone.length > 0) {
        filtered = filtered.filter((c) => c.zone && filters.zone!.includes(c.zone));
      }

      if (filters.slaBreached !== undefined) {
        filtered = filtered.filter((c) => c.slaBreached === filters.slaBreached);
      }

      if (filters.csatBelow) {
        filtered = filtered.filter((c) => c.csatScore !== undefined && c.csatScore < filters.csatBelow!);
      }

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(
          (c) =>
            c.ticketId.toLowerCase().includes(term) ||
            c.customerName.toLowerCase().includes(term) ||
            c.description.toLowerCase().includes(term)
        );
      }
    }

    return filtered;
  }

  getActiveComplaints(): Complaint[] {
    return this.mockComplaints.filter(
      (c) => c.status !== 'closed' && c.status !== 'resolved'
    );
  }

  getOverdueComplaints(): Complaint[] {
    const now = new Date();
    return this.mockComplaints.filter((c) => c.slaDeadline < now && c.status !== 'closed');
  }

  getHighPriorityComplaints(): Complaint[] {
    return this.mockComplaints.filter((c) => c.priority === 'P1' || c.priority === 'P2');
  }

  getComplaintById(ticketId: string): Complaint | null {
    return this.mockComplaints.find((c) => c.ticketId === ticketId) || null;
  }

  // ============================================================================
  // SLA CALCULATIONS
  // ============================================================================

  calculateSLAUrgency(complaint: Complaint): number {
    const now = new Date();
    const elapsed = now.getTime() - complaint.createdAt.getTime();
    const total = complaint.slaDeadline.getTime() - complaint.createdAt.getTime();
    return (elapsed / total) * 100;
  }

  getSLAStatus(complaint: Complaint): {
    percentComplete: number;
    timeRemaining: string;
    status: 'safe' | 'warning' | 'critical' | 'breached';
    shouldEscalate: boolean;
  } {
    const percentComplete = this.calculateSLAUrgency(complaint);
    const now = new Date();
    const remainingMs = complaint.slaDeadline.getTime() - now.getTime();

    let status: 'safe' | 'warning' | 'critical' | 'breached' = 'safe';
    let shouldEscalate = false;

    if (remainingMs < 0) {
      status = 'breached';
      shouldEscalate = true;
    } else if (percentComplete >= SLA_ALERT_THRESHOLDS.PRE_BREACH_PERCENT) {
      status = 'critical';
      shouldEscalate = true;
    } else if (percentComplete >= SLA_ALERT_THRESHOLDS.FOLLOW_UP_PERCENT) {
      status = 'warning';
    }

    const hours = Math.abs(Math.floor(remainingMs / (1000 * 60 * 60)));
    const minutes = Math.abs(Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));

    const timeRemaining =
      remainingMs < 0
        ? `Overdue by ${hours}h ${minutes}m`
        : `${hours}h ${minutes}m remaining`;

    return { percentComplete, timeRemaining, status, shouldEscalate };
  }

  // ============================================================================
  // SUPERVISOR MANAGEMENT
  // ============================================================================

  getAllSupervisors(): Supervisor[] {
    return this.mockSupervisors;
  }

  getSupervisorsByZone(zone: string): Supervisor[] {
    return this.mockSupervisors.filter((s) => s.zone === zone);
  }

  getSuggestedSupervisor(complaint: Complaint): Supervisor | null {
    // Rule 1: Match by zone
    let candidates = this.mockSupervisors.filter((s) => s.zone === complaint.zone && s.availability === 'available');

    if (candidates.length === 0) {
      // No available supervisors in zone - requires TSM approval for cross-zone
      return null;
    }

    // Rule 2: Check specialization match
    const specializedCandidates = candidates.filter((s) =>
      s.specializations.includes(complaint.complaintTypeId)
    );

    if (specializedCandidates.length > 0) {
      candidates = specializedCandidates;
    }

    // Rule 3: Check workload - prefer supervisor with fewer active P1/P2 complaints
    candidates = candidates.filter(
      (s) => s.activeP1P2Count < SUPERVISOR_ASSIGNMENT_RULES.MAX_P1_P2_COMPLAINTS
    );

    if (candidates.length === 0) {
      // All supervisors overloaded - escalate to TSM
      return null;
    }

    // Sort by workload (least loaded first)
    candidates.sort((a, b) => a.activeComplaintsCount - b.activeComplaintsCount);

    return candidates[0];
  }

  assignComplaintToCCE(complaint: Complaint): {
    success: boolean;
    assignedTo: string;
    assignedToName: string;
    aiScore?: number;
    aiReasons?: string[];
    method?: string;
    message: string;
  } {
    try {
      const stats = this.getTodayStats();
      const cceSnapshots = [
        {
          cceId: "cce_001",
          cceName: "Current CCE",
          status: "ACTIVE" as const,
          openComplaintsCount: this.mockComplaints.filter(c =>
            ["new","assigned","in_progress"].includes(c.status) && c.cceId === "cce_001"
          ).length,
          p1p2ActiveCount: this.mockComplaints.filter(c =>
            ["new","assigned","in_progress"].includes(c.status) &&
            c.cceId === "cce_001" && (c.priority === "P1" || c.priority === "P2")
          ).length,
          resolutionRate: stats.crmUpdateCompliance || 88,
          csatAverage: stats.csatAverage || 4.1,
          slaBreachRate: (stats.slaBreachCount / Math.max(1, stats.complaintsReceived)) * 100,
          crmComplianceRate: stats.crmUpdateCompliance || 92,
          complaintTypeWinRate: { "quality_failure": 72, "delay": 85, "billing": 90, "app_issue": 88 },
          lastAssignedAt: undefined,
          territories: ["ALL"],
        },
      ];

      const context = {
        complaintId: complaint.ticketId,
        priority: complaint.priority,
        complaintType: complaint.complaintTypeId,
        channel: complaint.channel,
        cityId: "CITY-SURAT",
        customerId: complaint.customerId,
        slaHours: complaint.slaHours,
      };

      const result = complaintAssignmentEngine.assignComplaint(context, cceSnapshots);

      if (result.success) {
        const idx = this.mockComplaints.findIndex(c => c.ticketId === complaint.ticketId);
        if (idx !== -1) {
          this.mockComplaints[idx].cceId = result.assignedTo;
          this.mockComplaints[idx].cceName = result.assignedToName;
        }
        return {
          success: true,
          assignedTo: result.assignedTo,
          assignedToName: result.assignedToName,
          aiScore: result.score.totalScore,
          aiReasons: result.score.reasons,
          method: result.method,
          message: result.message,
        };
      }
    } catch (err) {
      console.warn("[CCE] AI assignment failed — falling back", err);
    }

    return {
      success: true,
      assignedTo: "cce_001",
      assignedToName: "Current CCE",
      method: "FALLBACK",
      message: "Assigned to default CCE",
    };
  }

  assignComplaintToSupervisor(
    complaintId: string,
    supervisorId: string,
    assignedBy: string
  ): { success: boolean; message: string } {
    const complaint = this.mockComplaints.find((c) => c.ticketId === complaintId);
    const supervisor = this.mockSupervisors.find((s) => s.id === supervisorId);

    if (!complaint || !supervisor) {
      return { success: false, message: 'Complaint or supervisor not found' };
    }

    // Update complaint
    complaint.status = 'assigned';
    complaint.assignedSupervisorId = supervisor.id;
    complaint.assignedSupervisorName = supervisor.name;
    complaint.assignedAt = new Date();

    // Update supervisor workload
    supervisor.activeComplaintsCount += 1;
    if (complaint.priority === 'P1' || complaint.priority === 'P2') {
      supervisor.activeP1P2Count += 1;
    }

    return {
      success: true,
      message: `Complaint ${complaintId} assigned to ${supervisor.name}`,
    };
  }

  // ============================================================================
  // CRM UPDATES
  // ============================================================================

  updateComplaint(update: Partial<Complaint> & { ticketId: string }): {
    success: boolean;
    message: string;
  } {
    const complaint = this.mockComplaints.find((c) => c.ticketId === update.ticketId);

    if (!complaint) {
      return { success: false, message: 'Complaint not found' };
    }

    Object.assign(complaint, update);
    complaint.lastCrmUpdateAt = new Date();

    return { success: true, message: 'Complaint updated successfully' };
  }

  logCommunication(ticketId: string, record: CommunicationRecord): void {
    const complaint = this.mockComplaints.find((c) => c.ticketId === ticketId);
    if (complaint) {
      complaint.communicationLog.push(record);
      complaint.lastCrmUpdateAt = new Date();
    }
  }

  // ============================================================================
  // CSAT COLLECTION
  // ============================================================================

  submitCSAT(
    ticketId: string,
    score: number,
    feedback?: string
  ): { success: boolean; message: string; requiresEscalation: boolean } {
    const complaint = this.mockComplaints.find((c) => c.ticketId === ticketId);

    if (!complaint) {
      return { success: false, message: 'Complaint not found', requiresEscalation: false };
    }

    complaint.csatScore = score;
    complaint.csatCollectedAt = new Date();
    complaint.csatNotes = feedback;

    const requiresEscalation = score < CSAT_SCALE.AUTO_ESCALATE_THRESHOLD;

    if (requiresEscalation) {
      complaint.escalated = true;
      complaint.escalationReason = 'CSAT < 3.0';
    } else {
      complaint.status = 'closed';
      complaint.closedAt = new Date();
    }

    return {
      success: true,
      message: requiresEscalation
        ? 'CSAT recorded - complaint escalated due to low score'
        : 'CSAT recorded - complaint closed',
      requiresEscalation,
    };
  }

  // ============================================================================
  // ESCALATIONS
  // ============================================================================

  escalateComplaint(
    ticketId: string,
    reason: string,
    escalatedBy: string
  ): { success: boolean; message: string } {
    const complaint = this.mockComplaints.find((c) => c.ticketId === ticketId);

    if (!complaint) {
      return { success: false, message: 'Complaint not found' };
    }

    complaint.escalated = true;
    complaint.escalatedAt = new Date();
    complaint.escalationReason = reason;
    complaint.status = 'escalated';

    return { success: true, message: `Complaint ${ticketId} escalated to TSM` };
  }

  // ============================================================================
  // PERFORMANCE & ANALYTICS
  // ============================================================================

  resolveComplaint(ticketId: string, resolution: string, cceId: string): { success: boolean; message: string } {
    const idx = this.mockComplaints.findIndex(c => c.ticketId === ticketId);
    if (idx === -1) return { success: false, message: "Complaint not found" };
    this.mockComplaints[idx] = {
      ...this.mockComplaints[idx],
      status: 'closed',
      resolution,
      resolvedAt: new Date(),
      resolvedBy: cceId,
    };
    return { success: true, message: `Complaint ${ticketId} resolved and closed.` };
  }

  getTodayStats(): CCEDailyStats {
    const today = new Date().toISOString().split('T')[0];
    const todayComplaints = this.mockComplaints.filter(
      (c) => c.createdAt.toISOString().split('T')[0] === today
    );

    const assigned = todayComplaints.filter((c) => c.status !== 'new');
    const resolved = todayComplaints.filter((c) => c.status === 'resolved' || c.status === 'closed');
    const closed = todayComplaints.filter((c) => c.status === 'closed');
    const breached = todayComplaints.filter((c) => c.slaBreached);
    const escalated = todayComplaints.filter((c) => c.escalated);
    const reopened = todayComplaints.filter((c) => c.reopenCount > 0);

    const csatScores = closed.map((c) => c.csatScore).filter((s) => s !== undefined) as number[];
    const csatAverage = csatScores.length > 0
      ? csatScores.reduce((sum, s) => sum + s, 0) / csatScores.length
      : 0;

    const firstResponseTimes = assigned
      .filter((c) => c.acknowledgedAt)
      .map((c) => (c.acknowledgedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60));
    const firstResponseAvg = firstResponseTimes.length > 0
      ? firstResponseTimes.reduce((sum, t) => sum + t, 0) / firstResponseTimes.length
      : 0;

    const assignmentTimes = assigned
      .filter((c) => c.assignedAt)
      .map((c) => (c.assignedAt!.getTime() - c.createdAt.getTime()) / (1000 * 60));
    const assignmentAvg = assignmentTimes.length > 0
      ? assignmentTimes.reduce((sum, t) => sum + t, 0) / assignmentTimes.length
      : 0;

    const slaBreachRate = todayComplaints.length > 0
      ? (breached.length / todayComplaints.length) * 100
      : 0;

    const csatSurveyCollectionRate = closed.length > 0
      ? (csatScores.length / closed.length) * 100
      : 0;

    const reopenedRate = closed.length > 0
      ? (reopened.length / closed.length) * 100
      : 0;

    const escalationRate = todayComplaints.length > 0
      ? (escalated.length / todayComplaints.length) * 100
      : 0;

    // Determine incentive tier
    let incentiveTier = 'No Payout';
    let estimatedVariablePayout = 0;

    if (csatAverage >= CCE_VARIABLE_INCENTIVE.TIER_1.csat_min && slaBreachRate <= CCE_VARIABLE_INCENTIVE.TIER_1.breach_rate_max) {
      incentiveTier = CCE_VARIABLE_INCENTIVE.TIER_1.label;
      estimatedVariablePayout = CCE_VARIABLE_INCENTIVE.TIER_1.payout;
    } else if (csatAverage >= CCE_VARIABLE_INCENTIVE.TIER_2.csat_min && slaBreachRate <= CCE_VARIABLE_INCENTIVE.TIER_2.breach_rate_max) {
      incentiveTier = CCE_VARIABLE_INCENTIVE.TIER_2.label;
      estimatedVariablePayout = CCE_VARIABLE_INCENTIVE.TIER_2.payout;
    } else if (csatAverage >= CCE_VARIABLE_INCENTIVE.TIER_3.csat_min && slaBreachRate <= CCE_VARIABLE_INCENTIVE.TIER_3.breach_rate_max) {
      incentiveTier = CCE_VARIABLE_INCENTIVE.TIER_3.label;
      estimatedVariablePayout = CCE_VARIABLE_INCENTIVE.TIER_3.payout;
    }

    const qualifiesForIncentive = incentiveTier !== 'No Payout' && csatSurveyCollectionRate >= INCENTIVE_DISQUALIFIERS.MIN_SURVEY_ATTEMPT_RATE;

    return {
      date: today,
      cceId: 'cce_001',
      cceName: 'Current CCE',

      complaintsReceived: todayComplaints.length,
      complaintsAssigned: assigned.length,
      complaintsResolved: resolved.length,
      complaintsClosed: closed.length,

      p1Count: todayComplaints.filter((c) => c.priority === 'P1').length,
      p2Count: todayComplaints.filter((c) => c.priority === 'P2').length,
      p3Count: todayComplaints.filter((c) => c.priority === 'P3').length,
      p4Count: todayComplaints.filter((c) => c.priority === 'P4').length,

      firstResponseAvgMinutes: firstResponseAvg,
      assignmentAvgMinutes: assignmentAvg,
      slaBreachCount: breached.length,
      slaBreachRate,

      csatAverage,
      csatCount: csatScores.length,
      csatSurveyCollectionRate,
      reopenedCount: reopened.length,
      reopenedRate,

      crmUpdateCompliance: 98, // Mock - 98% compliant
      crmLateUpdates: 1,

      escalatedCount: escalated.length,
      escalationRate,

      dailyTarget: CCE_KPI_TARGETS.COMPLAINTS_PER_DAY_MIN,
      percentOfTarget: (todayComplaints.length / CCE_KPI_TARGETS.COMPLAINTS_PER_DAY_MIN) * 100,

      qualifiesForIncentive,
      estimatedVariablePayout: qualifiesForIncentive ? estimatedVariablePayout : 0,
      incentiveTier,
    };
  }

  getCSATDashboardData(): CSATDashboardData {
    const allClosed = this.mockComplaints.filter((c) => c.status === 'closed' && c.csatScore);

    const scores = allClosed.map((c) => c.csatScore!) as number[];
    const overall = scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;

    return {
      todayAverage: overall,
      mtdAverage: overall,
      rolling30DayAverage: overall,

      veryDissatisfiedCount: scores.filter((s) => s === 1).length,
      dissatisfiedCount: scores.filter((s) => s === 2).length,
      neutralCount: scores.filter((s) => s === 3).length,
      satisfiedCount: scores.filter((s) => s === 4).length,
      verySatisfiedCount: scores.filter((s) => s === 5).length,

      trend: 'stable',
      trendPercent: 0,

      byComplaintType: [],
      byPriority: [],
      bySupervisor: [],
    };
  }

  // ============================================================================
  // SIMPLIFIED COMPLAINT ACCESS (for ComplaintManagement.tsx)
  // ============================================================================

  getComplaints() {
    const stored = localStorage.getItem("cleancar_complaints");
    return stored ? JSON.parse(stored) : this.mockComplaints;
  }

  updateComplaintStatus(id: string, status: string) {
    const complaints = this.getComplaints();
    const updated = complaints.map((c: any) =>
      c.id === id || c.ticketId === id ? { ...c, status } : c
    );
    localStorage.setItem("cleancar_complaints", JSON.stringify(updated));

    // Also update mockComplaints if this is a mock complaint
    const idx = this.mockComplaints.findIndex(c => c.ticketId === id);
    if (idx !== -1) {
      this.mockComplaints[idx].status = status as ComplaintStatus;
    }
  }

  getActiveAlerts(): CCEAlert[] {
    const alerts: CCEAlert[] = [];
    const now = new Date();

    // SLA warnings
    this.mockComplaints.forEach((complaint) => {
      if (complaint.status !== 'closed' && complaint.status !== 'resolved') {
        const sla = this.getSLAStatus(complaint);

        if (sla.status === 'critical' || sla.status === 'breached') {
          alerts.push({
            id: `alert_sla_${complaint.ticketId}`,
            type: sla.status === 'breached' ? 'sla_breach' : 'sla_warning',
            severity: sla.status === 'breached' ? 'critical' : 'high',
            complaintId: complaint.ticketId,
            ticketId: complaint.ticketId,
            title: sla.status === 'breached' ? 'SLA Breached' : 'SLA Warning',
            message: `${complaint.ticketId} - ${sla.timeRemaining}`,
            createdAt: now,
            actionRequired: true,
            actionType: 'escalate',
            dismissed: false,
          });
        }
      }
    });

    // Low CSAT alerts
    this.mockComplaints
      .filter((c) => c.csatScore && c.csatScore < 3.0 && c.status === 'resolved')
      .forEach((complaint) => {
        alerts.push({
          id: `alert_csat_${complaint.ticketId}`,
          type: 'low_csat',
          severity: 'high',
          complaintId: complaint.ticketId,
          ticketId: complaint.ticketId,
          title: 'Low CSAT Score',
          message: `${complaint.ticketId} - CSAT: ${complaint.csatScore}/5.0`,
          createdAt: now,
          actionRequired: true,
          actionType: 'escalate',
          dismissed: false,
        });
      });

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}

export const customerCareExecutiveService = new CustomerCareExecutiveService();
