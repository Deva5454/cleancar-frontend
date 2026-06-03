/**
 * Customer Care Executive (CCE) - Constants
 *
 * All KPIs, thresholds, priorities, and incentive structures
 * based on cee-workflow-guide.md (source uses CEE, implementation standardized to CCE)
 */

// ============================================================================
// COMPLAINT PRIORITIES & SLA
// ============================================================================

export const COMPLAINT_PRIORITIES = {
  P1: {
    id: 'P1',
    label: 'Critical',
    description: 'Service failure, safety concern, vehicle damage',
    slaHours: 4,
    escalationThresholdHours: 2,
    color: 'red',
  },
  P2: {
    id: 'P2',
    label: 'High',
    description: 'Quality failure, wrong service delivered',
    slaHours: 24,
    escalationThresholdHours: 4,
    color: 'orange',
  },
  P3: {
    id: 'P3',
    label: 'Medium',
    description: 'Delay, scheduling issue, staff behaviour',
    slaHours: 48,
    escalationThresholdHours: 48,
    color: 'yellow',
  },
  P4: {
    id: 'P4',
    label: 'Low',
    description: 'General feedback, billing query, app issue',
    slaHours: 72,
    escalationThresholdHours: 0, // No auto-escalation for P4
    color: 'gray',
  },
} as const;

export const COMPLAINT_TYPES = [
  { id: 'vehicle_damage', label: 'Vehicle Damaged During Wash', priority: 'P1' },
  { id: 'chemical_burn', label: 'Chemical Burn or Stain', priority: 'P1' },
  { id: 'safety_concern', label: 'Safety Concern (brake fluid, etc.)', priority: 'P1' },
  { id: 'wrong_service', label: 'Wrong Service Delivered', priority: 'P2' },
  { id: 'quality_failure', label: 'Quality Issue (incomplete work)', priority: 'P2' },
  { id: 'service_delay', label: 'Service Delay or Late Arrival', priority: 'P3' },
  { id: 'staff_behaviour', label: 'Rude or Unprofessional Behaviour', priority: 'P3' },
  { id: 'no_show', label: 'Technician No-Show', priority: 'P3' },
  { id: 'billing_query', label: 'Billing or Payment Query', priority: 'P4' },
  { id: 'app_issue', label: 'App Crash or Technical Issue', priority: 'P4' },
  { id: 'feature_request', label: 'Feature Request or Feedback', priority: 'P4' },
] as const;

export const COMPLAINT_CHANNELS = [
  { id: 'phone', label: 'Phone Call', icon: 'Phone' },
  { id: 'email', label: 'Email', icon: 'Mail' },
  { id: 'app', label: 'Mobile App', icon: 'Smartphone' },
  { id: 'walk_in', label: 'Walk-in', icon: 'MapPin' },
  { id: 'field', label: 'Field Visit', icon: 'MapPin' },
  { id: 'social', label: 'Social Media', icon: 'Share2' },
] as const;

export const COMPLAINT_STATUS = {
  NEW: { id: 'new', label: 'New', color: 'blue', description: 'Complaint just logged' },
  ASSIGNED: { id: 'assigned', label: 'Assigned', color: 'purple', description: 'Assigned to supervisor' },
  IN_PROGRESS: { id: 'in_progress', label: 'In Progress', color: 'yellow', description: 'Supervisor working on it' },
  PENDING_CUSTOMER: { id: 'pending_customer', label: 'Pending Customer Response', color: 'amber', description: 'Waiting for customer' },
  RESOLVED: { id: 'resolved', label: 'Resolved', color: 'green', description: 'Supervisor marked resolved' },
  CLOSED: { id: 'closed', label: 'Closed', color: 'gray', description: 'Verified and closed' },
  ESCALATED: { id: 'escalated', label: 'Escalated', color: 'red', description: 'Escalated to TSM' },
} as const;

// ============================================================================
// SLA THRESHOLDS & ALERTS
// ============================================================================

export const SLA_ALERT_THRESHOLDS = {
  PRE_BREACH_PERCENT: 80, // Alert at 80% of SLA time
  FOLLOW_UP_PERCENT: 50,  // Proactive update at 50% of SLA time
} as const;

export const TIME_LIMITS = {
  FIRST_RESPONSE_MINUTES: 30,        // Acknowledge customer within 30 min
  ASSIGNMENT_MINUTES: 30,            // Assign to supervisor within 30 min
  SUPERVISOR_ACK_MINUTES: 30,        // Supervisor must acknowledge within 30 min
  CRM_UPDATE_MINUTES: 5,             // Log in CRM within 5 min of receipt
  PRIORITY_CLASSIFICATION_MINUTES: 5, // Classify priority within 5 min
  SUPERVISOR_UNRESPONSIVE_HOURS: 2,  // Escalate if no response for 2 hours
  CSAT_SURVEY_HOURS: 4,              // Follow-up call if survey not completed in 4 hours
} as const;

// ============================================================================
// KPI TARGETS
// ============================================================================

export const CCE_KPI_TARGETS = {
  FIRST_RESPONSE_TIME_MINUTES: 30,
  ASSIGNMENT_TIME_MINUTES: 30,
  SLA_BREACH_RATE_PERCENT: 5,        // < 5% breach rate
  COMPLAINTS_PER_DAY_MIN: 40,
  COMPLAINTS_PER_DAY_MAX: 60,
  CRM_UPDATE_COMPLIANCE_PERCENT: 100, // Non-negotiable
  CSAT_TARGET: 4.0,                   // Out of 5.0
  COMPLAINT_REOPENED_RATE_PERCENT: 10, // < 10% reopened
  ESCALATION_RATE_PERCENT: 15,        // < 15% escalated to TSM
  CSAT_SURVEY_COLLECTION_RATE: 80,    // ≥ 80% of closed complaints
} as const;

// ============================================================================
// INCENTIVE STRUCTURE
// ============================================================================

export const CCE_SALARY = {
  MIN: 12000,
  MAX: 16000,
  TYPICAL: 14000,
} as const;

export const CCE_VARIABLE_INCENTIVE = {
  MAX_MONTHLY: 10000,

  // Tier 1: 100% variable (₹10,000)
  TIER_1: {
    csat_min: 4.5,
    breach_rate_max: 2,
    payout: 10000,
    label: 'Excellent Performance',
  },

  // Tier 2: 75% variable (₹7,500)
  TIER_2: {
    csat_min: 4.0,
    csat_max: 4.4,
    breach_rate_max: 5,
    payout: 7500,
    label: 'Good Performance',
  },

  // Tier 3: 50% variable (₹5,000)
  TIER_3: {
    csat_min: 3.5,
    csat_max: 3.9,
    breach_rate_max: 10,
    payout: 5000,
    label: 'Meets Expectations',
  },

  // No payout if below thresholds
  NO_PAYOUT: {
    csat_below: 3.5,
    breach_rate_above: 10,
    label: 'Below Expectations',
  },
} as const;

export const INCENTIVE_DISQUALIFIERS = {
  CRM_COMPLIANCE_PENALTY: 0.20,       // 20% reduction if < 100% compliance
  MIN_SURVEY_ATTEMPT_RATE: 80,        // Must attempt surveys on 80%+ of complaints
  INVALID_CLOSURE_FORFEITS_VARIABLE: true, // Any invalid closure = no variable
} as const;

// ============================================================================
// ESCALATION TRIGGERS
// ============================================================================

export const ESCALATION_REASONS = [
  { id: 'sla_breach', label: 'SLA Breach', auto: true },
  { id: 'supervisor_unresponsive', label: 'Supervisor Unresponsive > 2 hrs', auto: false },
  { id: 'customer_dissatisfied', label: 'Customer Dissatisfied with Resolution', auto: true },
  { id: 'p1_auto_trigger', label: 'P1 Critical - Auto Notify TSM', auto: true },
  { id: 'low_csat', label: 'CSAT < 3.0', auto: true },
  { id: 'customer_requested_manager', label: 'Customer Requested Manager', auto: false },
  { id: 'reopened_3_times', label: 'Complaint Reopened 3 Times', auto: true },
  { id: 'other', label: 'Other (specify in notes)', auto: false },
] as const;

// ============================================================================
// SUPERVISOR ASSIGNMENT RULES
// ============================================================================

export const SUPERVISOR_ASSIGNMENT_RULES = {
  MAX_P1_P2_COMPLAINTS: 5,           // Flag if supervisor has 5+ active P1/P2 complaints
  DEFAULT_MAX_ACTIVE_COMPLAINTS: 8,  // Configurable by TSM
  CROSS_ZONE_REQUIRES_TSM_APPROVAL: true,
  AUTO_REASSIGN_IF_ABSENT_HOURS: 1,  // Reassign if supervisor absent and no ack after 1 hour
} as const;

// ============================================================================
// CSAT (Customer Satisfaction) SCORING
// ============================================================================

export const CSAT_SCALE = {
  MIN: 1,
  MAX: 5,
  LABELS: {
    1: 'Very Dissatisfied',
    2: 'Dissatisfied',
    3: 'Neutral',
    4: 'Satisfied',
    5: 'Very Satisfied',
  },
  AUTO_ESCALATE_THRESHOLD: 3.0,      // CSAT < 3.0 auto-escalates to TSM
  MAX_VERIFICATION_ATTEMPTS: 3,      // Try 3 times before marking "Survey Not Collected"
} as const;

// ============================================================================
// SYSTEM SAFEGUARDS
// ============================================================================

export const SYSTEM_SAFEGUARDS = {
  CLOSE_REQUIRES_SUPERVISOR_RESOLUTION: true,
  CLOSE_REQUIRES_CUSTOMER_VERIFICATION: true,
  CLOSE_REQUIRES_CSAT: true,
  CLOSE_BLOCKED_IF_CSAT_BELOW: 3.0,
  AUTO_ALERT_TSM_ON_BREACH: true,
  AUTO_ALERT_TSM_ON_LOW_CSAT: true,
  AUDIT_LOG_ALL_ACTIONS: true,
  CRM_COMPLETION_GATE: true,         // Can't open next complaint until current CRM updated
} as const;

// ============================================================================
// AUTOMATED ALERTS
// ============================================================================

export const AUTO_ALERTS = [
  { trigger: 'unassigned_30_min', description: 'Complaint not assigned within 30 min', notify: 'TSM' },
  { trigger: 'supervisor_no_ack_30_min', description: 'Supervisor acknowledgement not logged', notify: 'CCE' },
  { trigger: 'sla_80_percent', description: 'SLA at 80% - complaint still open', notify: 'CCE+TSM' },
  { trigger: 'sla_breach_100', description: 'SLA breached', notify: 'TSM' },
  { trigger: 'csat_below_3', description: 'CSAT < 3.0 at closure attempt', notify: 'TSM' },
  { trigger: 'reopened_3_times', description: 'Complaint reopened 3 times', notify: 'TSM' },
  { trigger: 'crm_not_updated_30_min', description: 'CRM not updated after 30 minutes', notify: 'CCE' },
  { trigger: 'customer_wants_manager', description: 'Customer requests manager', notify: 'TSM' },
] as const;

// ============================================================================
// QUICK SCRIPTS & TEMPLATES
// ============================================================================

export const CCE_SCRIPTS = {
  ASSIGNMENT_CONFIRMATION: "I've assigned Ticket #{{ticketId}} to you — customer expects resolution by {{tat}}. Please acknowledge.",
  ACKNOWLEDGEMENT_TO_CUSTOMER: "Thank you for contacting us. Your complaint has been logged as Ticket #{{ticketId}}. We will resolve this by {{tat}}.",
  PROGRESS_UPDATE_50_PERCENT: "Your complaint {{ticketId}} is being worked on — expected resolution by {{tat}}.",
  RESOLUTION_VERIFICATION: "We've resolved your complaint {{ticketId}} — has the issue been addressed to your satisfaction?",
  ESCALATION_TO_TSM: "Ticket #{{ticketId}} is at {{slaPercent}}% of SLA and not yet resolved — flagging for your review.",
  CSAT_REQUEST: "On a scale of 1-5, how satisfied are you with the resolution? 1 = Very Dissatisfied, 5 = Very Satisfied.",
} as const;

// ============================================================================
// MOCK DATA GENERATION HELPERS
// ============================================================================

export const MOCK_CUSTOMER_NAMES = [
  'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Reddy', 'Vikram Singh',
  'Anjali Gupta', 'Rohit Verma', 'Kavya Iyer', 'Arjun Nair', 'Meera Joshi',
  'Suresh Rao', 'Divya Menon', 'Karan Malhotra', 'Pooja Desai', 'Manoj Kumar',
];

export const MOCK_VEHICLES = [
  'Maruti Swift', 'Hyundai Creta', 'Honda City', 'Tata Nexon', 'Mahindra Scorpio',
  'Maruti Baleno', 'Kia Seltos', 'Toyota Innova', 'Volkswagen Polo', 'Skoda Rapid',
];

// ✅ UPDATED: Changed from zones to clusters (City → Cluster → Pincode hierarchy)
export const MOCK_CLUSTERS = [
  { id: 'CLUSTER-SOUTH', name: 'South Surat', color: 'blue' },
  { id: 'CLUSTER-NORTH', name: 'North Surat', color: 'green' },
  { id: 'CLUSTER-CENTRAL', name: 'Central Surat', color: 'purple' },
] as const;

// For backward compatibility (deprecated - use MOCK_CLUSTERS)
export const MOCK_ZONES = MOCK_CLUSTERS;

export const MOCK_SUPERVISORS = [
  { id: 'sup_001', name: 'Ramesh Iyer', zone: 'zone_north', activeComplaints: 3 },
  { id: 'sup_002', name: 'Lakshmi Patel', zone: 'zone_south', activeComplaints: 5 },
  { id: 'sup_003', name: 'Vijay Kumar', zone: 'zone_east', activeComplaints: 2 },
  { id: 'sup_004', name: 'Anita Desai', zone: 'zone_west', activeComplaints: 4 },
  { id: 'sup_005', name: 'Sunil Reddy', zone: 'zone_central', activeComplaints: 1 },
] as const;
