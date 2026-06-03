/**
 * Customer Care Executive (CCE) - Type Definitions
 *
 * All interfaces and types for complaint handling, supervisor assignment,
 * CSAT tracking, and performance metrics
 */

// ============================================================================
// COMPLAINT TYPES
// ============================================================================

export type ComplaintPriority = 'P1' | 'P2' | 'P3' | 'P4';

export type ComplaintStatus =
  | 'new'
  | 'assigned'
  | 'in_progress'
  | 'pending_customer'
  | 'resolved'
  | 'closed'
  | 'escalated';

export type ComplaintChannel = 'phone' | 'email' | 'app' | 'walk_in' | 'field' | 'social';

export interface Complaint {
  ticketId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerCity?: string;
  customerState?: string;
  vehicle: string;
  vehicleNumber?: string;

  // Complaint details
  complaintType: string;
  complaintTypeId: string;
  description: string;
  channel: ComplaintChannel;
  priority: ComplaintPriority;
  status: ComplaintStatus;

  // Assignment & ownership
  assignedSupervisorId?: string;
  assignedSupervisorName?: string;
  zone?: string;
  cceId: string;
  cceName: string;

  // Timestamps
  createdAt: Date;
  loggedAt: Date;
  acknowledgedAt?: Date;
  assignedAt?: Date;
  supervisorAcknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // SLA tracking
  slaDeadline: Date;
  slaHours: number;
  slaBreached: boolean;
  slaBreachTime?: Date;

  // Resolution
  resolutionDetails?: string;
  supervisorConfirmationId?: string;
  customerVerified: boolean;
  verificationAttempts: number;

  // CSAT
  csatScore?: number;
  csatCollectedAt?: Date;
  csatSurveyDelivered: boolean;
  csatNotes?: string;

  // Escalation
  escalated: boolean;
  escalatedAt?: Date;
  escalationReason?: string;
  escalatedToTsmId?: string;
  escalatedToTsmName?: string;

  // Tracking
  reopenCount: number;
  reopenHistory: ComplaintReopenRecord[];
  followUpScheduled?: Date;
  nextFollowUpAction?: string;

  // CRM & audit
  crmUpdateCompliant: boolean;
  lastCrmUpdateAt: Date;
  communicationLog: CommunicationRecord[];
  notes: string;
  tags: string[];
}

export interface ComplaintReopenRecord {
  reopenedAt: Date;
  reason: string;
  reopenedBy: string;
  previousStatus: ComplaintStatus;
}

export interface CommunicationRecord {
  timestamp: Date;
  direction: 'outbound' | 'inbound';
  channel: ComplaintChannel;
  summary: string;
  sentBy: string;
  customerResponse?: string;
}

// ============================================================================
// SUPERVISOR TYPES
// ============================================================================

export interface Supervisor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  zone: string;
  zoneName: string;

  // Workload
  activeComplaintsCount: number;
  activeP1P2Count: number;
  maxCapacity: number;
  availability: 'available' | 'busy' | 'absent' | 'on_leave';

  // Specialization
  specializations: string[]; // e.g., 'vehicle_damage', 'chemical_complaints'

  // Performance
  avgResolutionTimeHours: number;
  completionRate: number;
  csatScore: number;

  // Status
  lastActive?: Date;
  currentLocation?: { lat: number; lng: number };
}

export interface SupervisorAssignment {
  complaintId: string;
  supervisorId: string;
  assignedAt: Date;
  assignedBy: string;
  reason: string; // e.g., 'Zone match', 'Specialization', 'TSM override'
  acknowledgedAt?: Date;
  crossZoneApproval?: {
    approvedBy: string;
    approvedAt: Date;
    reason: string;
  };
}

// ============================================================================
// CRM UPDATE TYPES
// ============================================================================

export interface CRMUpdate {
  complaintId: string;
  ticketId: string;
  updatedAt: Date;
  updatedBy: string;

  // Mandatory fields
  status: ComplaintStatus;
  supervisorUpdate?: string;
  customerCommunicationLog: string;
  nextFollowUpDate?: Date;
  nextFollowUpTime?: string;

  // Optional
  notes?: string;
  tags?: string[];
  internalNotes?: string;

  // Validation
  complete: boolean;
  missingFields: string[];
}

// ============================================================================
// CSAT (Customer Satisfaction) TYPES
// ============================================================================

export interface CSATRecord {
  complaintId: string;
  ticketId: string;
  score: number; // 1-5
  collectedAt: Date;
  collectedBy: string;
  collectionMethod: 'call' | 'sms' | 'email' | 'app';

  // Customer feedback
  feedback?: string;
  wouldRecommend?: boolean;
  specificPraise?: string;
  specificComplaint?: string;

  // Survey delivery
  surveyDeliveredAt?: Date;
  surveyCompletedAt?: Date;
  remindersSent: number;

  // Categorization
  category: 'very_dissatisfied' | 'dissatisfied' | 'neutral' | 'satisfied' | 'very_satisfied';
  requiresEscalation: boolean;
}

// ============================================================================
// ESCALATION TYPES
// ============================================================================

export interface Escalation {
  id: string;
  complaintId: string;
  ticketId: string;

  escalatedBy: string;
  escalatedAt: Date;
  reason: string;
  reasonId: string;
  autoTriggered: boolean;

  // Context
  complaintHistory: string;
  actionsTakenSoFar: string[];
  supervisorResponsiveness: string;
  slaStatus: {
    percentComplete: number;
    timeRemaining: string;
    breached: boolean;
  };

  // TSM response
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  tsmAction?: string;
  tsmNotes?: string;
  resolvedAt?: Date;
}

// ============================================================================
// PERFORMANCE & ANALYTICS TYPES
// ============================================================================

export interface CCEDailyStats {
  date: string;
  cceId: string;
  cceName: string;

  // Volume
  complaintsReceived: number;
  complaintsAssigned: number;
  complaintsResolved: number;
  complaintsClosed: number;

  // By priority
  p1Count: number;
  p2Count: number;
  p3Count: number;
  p4Count: number;

  // Performance
  firstResponseAvgMinutes: number;
  assignmentAvgMinutes: number;
  slaBreachCount: number;
  slaBreachRate: number;

  // Quality
  csatAverage: number;
  csatCount: number;
  csatSurveyCollectionRate: number;
  reopenedCount: number;
  reopenedRate: number;

  // CRM
  crmUpdateCompliance: number;
  crmLateUpdates: number;

  // Escalations
  escalatedCount: number;
  escalationRate: number;

  // Progress toward targets
  dailyTarget: number;
  percentOfTarget: number;

  // Incentive calculation
  qualifiesForIncentive: boolean;
  estimatedVariablePayout: number;
  incentiveTier: string;
}

export interface CCEMonthlyPerformance {
  month: string;
  year: number;
  cceId: string;
  cceName: string;

  totalComplaints: number;
  totalClosed: number;

  // KPIs
  avgFirstResponseMinutes: number;
  avgAssignmentMinutes: number;
  slaBreachRate: number;
  csatAverage: number;
  csatSurveyCollectionRate: number;
  reopenedRate: number;
  escalationRate: number;
  crmComplianceRate: number;

  // Targets vs actuals
  targets: {
    firstResponseMinutes: number;
    assignmentMinutes: number;
    slaBreachRate: number;
    complaintsPerDay: { min: number; max: number };
    csatTarget: number;
    crmCompliance: number;
  };

  // Incentive
  fixedSalary: number;
  variablePayout: number;
  incentiveTier: string;
  disqualifications: string[];
  totalCompensation: number;
}

export interface CSATDashboardData {
  // Current
  todayAverage: number;
  mtdAverage: number;
  rolling30DayAverage: number;

  // Distribution
  veryDissatisfiedCount: number;
  dissatisfiedCount: number;
  neutralCount: number;
  satisfiedCount: number;
  verySatisfiedCount: number;

  // Trends
  trend: 'improving' | 'stable' | 'declining';
  trendPercent: number;

  // Breakdown by category
  byComplaintType: { type: string; avgCsat: number; count: number }[];
  byPriority: { priority: ComplaintPriority; avgCsat: number; count: number }[];
  bySupervisor: { supervisorId: string; name: string; avgCsat: number; count: number }[];
}

// ============================================================================
// ALERT TYPES
// ============================================================================

export interface CCEAlert {
  id: string;
  type: 'sla_warning' | 'sla_breach' | 'supervisor_unresponsive' | 'low_csat' | 'crm_overdue' | 'system';
  severity: 'critical' | 'high' | 'medium' | 'low';

  complaintId?: string;
  ticketId?: string;

  title: string;
  message: string;
  createdAt: Date;

  actionRequired: boolean;
  actionType?: 'escalate' | 'follow_up' | 'crm_update' | 'verify_resolution';
  actionDeadline?: Date;

  dismissed: boolean;
  dismissedAt?: Date;
  dismissedBy?: string;
}

// ============================================================================
// FILTERS & SEARCH
// ============================================================================

export interface ComplaintFilters {
  priority?: ComplaintPriority[];
  status?: ComplaintStatus[];
  channel?: ComplaintChannel[];
  zone?: string[];
  supervisorId?: string[];
  slaBreached?: boolean;
  csatBelow?: number;
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

export interface ComplaintSortOptions {
  field: 'slaDeadline' | 'createdAt' | 'priority' | 'status' | 'csatScore';
  direction: 'asc' | 'desc';
}

// ============================================================================
// WORKFLOW STATE
// ============================================================================

export interface CCEWorkflowState {
  currentScreen: 'queue' | 'active_complaint' | 'crm_update' | 'dashboard';
  activeComplaintId?: string;
  filters: ComplaintFilters;
  sort: ComplaintSortOptions;
  viewMode: 'all' | 'my_active' | 'overdue' | 'high_priority';
}
