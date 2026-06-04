// Audit Trail System - Immutable logging of all cost inputs and recommendation actions

export type AuditEventType =
  | "Material Price Revision"
  | "Salary Adjustment"
  | "Overhead Event"
  | "Custom Cost Element Created"
  | "Custom Cost Element Updated"
  | "Consumable Actual Input"
  | "Equipment Actual Input"
  | "Salary Actual Input"
  | "Overhead Actual Input"
  | "Recommendation Created"
  | "Recommendation Assigned"
  | "Recommendation Status Changed"
  | "Recommendation Progress Note Added"
  | "Recommendation Resolved"
  | "Recommendation Resolution Confirmed"
  | "Recommendation Reopened"
  | "Verification Completed";

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  timestamp: string; // ISO datetime - immutable
  performedBy: string; // User name
  performedByRole: string; // User role
  
  // Entity references
  entityType?: "Company" | "Zone" | "Washer" | "Supervisor" | "Material" | "Equipment";
  entityId?: string;
  entityName?: string;
  
  // Event details
  description: string;
  reason?: string; // Why this change was made
  
  // Data changes
  beforeValue?: any;
  afterValue?: any;
  
  // For cost inputs
  effectiveDate?: string; // When this cost change takes effect
  amount?: number;
  
  // For recommendations
  recommendationId?: string;
  
  // Metadata
  ipAddress?: string;
  userAgent?: string;
  approvedBy?: string; // For Super Admin approvals
  approvalTimestamp?: string;
  
  // Immutability flag
  isImmutable: true; // Always true - cannot be modified
}

// Mock audit trail data
export const MOCK_AUDIT_TRAIL: AuditEvent[] = [
  // Material price revision
  {
    id: "audit-001",
    eventType: "Material Price Revision",
    timestamp: "2026-02-15T10:30:00Z",
    performedBy: "Arun Gupta",
    performedByRole: "Purchase Manager",
    
    entityType: "Material",
    entityId: "mat-foam-shampoo",
    entityName: "Foam Shampoo",
    
    description: "Updated unit cost for Foam Shampoo from ₹0.82/ml to ₹0.88/ml due to supplier price increase",
    reason: "Supplier ABC Chemicals increased price by 7.3% effective Feb 2026. New purchase order PO-2026-0215 reflects new pricing.",
    
    beforeValue: 0.82,
    afterValue: 0.88,
    effectiveDate: "2026-02-15",
    
    isImmutable: true,
  },
  
  // Salary adjustment
  {
    id: "audit-002",
    eventType: "Salary Adjustment",
    timestamp: "2026-01-01T09:00:00Z",
    performedBy: "Priya Sharma",
    performedByRole: "HR Manager",
    
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    
    description: "Annual salary increment for Suresh Kumar from ₹14,500/month to ₹15,000/month",
    reason: "Annual performance appraisal 2025-26. Performance rating: Good (4/5). Increment: 3.4% as per company policy.",
    
    beforeValue: 14500,
    afterValue: 15000,
    effectiveDate: "2026-01-01",
    amount: 15000,
    
    isImmutable: true,
  },
  
  // Overhead event
  {
    id: "audit-003",
    eventType: "Overhead Event",
    timestamp: "2026-03-10T14:20:00Z",
    performedBy: "Vikram Reddy",
    performedByRole: "Admin",
    
    entityType: "Company",
    entityId: "company-001",
    entityName: "CleanCar India",
    
    description: "Added new overhead item: Fleet GPS tracking system subscription - ₹12,000/month",
    reason: "Implemented GPS tracking for all washer vehicles to optimize route planning and monitor real-time location. Vendor: TrackFleet Solutions. Contract: 12 months.",
    
    beforeValue: null,
    afterValue: 12000,
    effectiveDate: "2026-03-01",
    amount: 12000,
    
    isImmutable: true,
  },
  
  // Consumable actual input
  {
    id: "audit-004",
    eventType: "Consumable Actual Input",
    timestamp: "2026-04-01T16:45:00Z",
    performedBy: "Ramesh Patel",
    performedByRole: "Supervisor",
    
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    
    description: "Recorded actual Foam Shampoo consumption for March 2026: 1,035ml (verified by physical count)",
    reason: "Monthly consumable verification audit. Washer's closing balance verified: 185ml remaining from issued 1,220ml.",
    
    beforeValue: null,
    afterValue: 1035,
    effectiveDate: "2026-03-31",
    
    isImmutable: true,
  },
  
  // Recommendation created
  {
    id: "audit-005",
    eventType: "Recommendation Created",
    timestamp: "2026-04-01T10:30:00Z",
    performedBy: "System (Auto-generated)",
    performedByRole: "System",
    
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    
    description: "Auto-generated recommendation: Job Volume Shortfall - 477 jobs vs 546 target (12.6% shortfall)",
    reason: "Cost Per Wash analysis for March 2026 detected actual jobs below ideal threshold (>10% variance).",
    
    recommendationId: "rec-washer-001-job-shortfall-001",
    
    isImmutable: true,
  },
  
  // Recommendation assigned
  {
    id: "audit-006",
    eventType: "Recommendation Assigned",
    timestamp: "2026-04-02T09:15:00Z",
    performedBy: "Vikram Reddy",
    performedByRole: "Operations Manager",
    
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    
    description: "Assigned recommendation to Ramesh Patel (Supervisor) - Due: 15 Apr 2026",
    reason: "Primary owner for job volume management. Ramesh is Suresh's direct supervisor.",
    
    recommendationId: "rec-washer-001-job-shortfall-001",
    
    beforeValue: null,
    afterValue: "Ramesh Patel (Supervisor)",
    
    isImmutable: true,
  },
  
  // Recommendation status changed
  {
    id: "audit-007",
    eventType: "Recommendation Status Changed",
    timestamp: "2026-04-05T11:30:00Z",
    performedBy: "Ramesh Patel",
    performedByRole: "Supervisor",
    
    entityType: "Washer",
    entityId: "washer-001",
    entityName: "Suresh Kumar",
    
    description: "Status changed from 'Not Started' to 'In Progress'",
    reason: "Started daily job assignment review. Identified 3 low-volume days in March due to zone subscription gaps.",
    
    recommendationId: "rec-washer-001-job-shortfall-001",
    
    beforeValue: "Not Started",
    afterValue: "In Progress",
    
    isImmutable: true,
  },
  
  // Backdating attempt blocked
  {
    id: "audit-008",
    eventType: "Material Price Revision",
    timestamp: "2026-04-10T15:20:00Z",
    performedBy: "Rejected by System",
    performedByRole: "System Validation",
    
    entityType: "Material",
    entityId: "mat-wheel-cleaner",
    entityName: "Wheel Cleaner",
    
    description: "BLOCKED: Attempted to backdate price revision to Oct 2025 (6 months ago) without Super Admin approval",
    reason: "Validation failed: Cannot backdate more than 3 months. This prevents retroactive manipulation of historical cost figures.",
    
    beforeValue: null,
    afterValue: null,
    effectiveDate: "2025-10-01",
    
    isImmutable: true,
  },
  
  // Super Admin approved backdating
  {
    id: "audit-009",
    eventType: "Material Price Revision",
    timestamp: "2026-04-10T16:00:00Z",
    performedBy: "Arun Gupta",
    performedByRole: "Purchase Manager",
    
    entityType: "Material",
    entityId: "mat-wheel-cleaner",
    entityName: "Wheel Cleaner",
    
    description: "Updated unit cost for Wheel Cleaner from ₹1.20/ml to ₹1.10/ml (backdated to Oct 2025)",
    reason: "CORRECTION: Discovered accounting error in Oct 2025 batch pricing. Actual purchase price was ₹1.10/ml but was incorrectly entered as ₹1.20/ml. Affects 6 months of cost calculations.",
    
    beforeValue: 1.20,
    afterValue: 1.10,
    effectiveDate: "2025-10-01",
    
    approvedBy: "Rajesh Kumar (Super Admin)",
    approvalTimestamp: "2026-04-10T15:45:00Z",
    
    isImmutable: true,
  },
  
  // Recommendation resolved
  {
    id: "audit-010",
    eventType: "Recommendation Resolved",
    timestamp: "2026-03-25T16:45:00Z",
    performedBy: "Karthik Menon",
    performedByRole: "Supervisor",
    
    entityType: "Washer",
    entityId: "washer-003",
    entityName: "Dinesh Sharma",
    
    description: "Marked as Resolved: Job Volume Shortfall recommendation (Feb 2026)",
    reason: "Route redesigned with better customer clustering in Zone 2A. Reassigned 8 customers from low-density areas. March performance: 512 jobs (94% above target). Shortfall eliminated.",
    
    recommendationId: "rec-washer-003-job-shortfall-feb",
    
    beforeValue: "In Progress",
    afterValue: "Completed",
    
    isImmutable: true,
  },
  
  // Verification completed
  {
    id: "audit-011",
    eventType: "Verification Completed",
    timestamp: "2026-04-05T00:00:00Z",
    performedBy: "System (Auto-verification)",
    performedByRole: "System",
    
    entityType: "Washer",
    entityId: "washer-003",
    entityName: "Dinesh Sharma",
    
    description: "Auto-verified improvement: CPW improved from ₹33.70 to ₹29.25 (13.2% improvement)",
    reason: "April cost calculation completed. Recommendation impact verified against actual data.",
    
    recommendationId: "rec-washer-003-job-shortfall-feb",
    
    beforeValue: 33.70,
    afterValue: 29.25,
    
    isImmutable: true,
  },
];

/**
 * Get audit trail for a specific entity
 */
export function getAuditTrailForEntity(
  entityType: string,
  entityId: string
): AuditEvent[] {
  return MOCK_AUDIT_TRAIL.filter(
    (event) => event.entityType === entityType && event.entityId === entityId
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get audit trail for a specific recommendation
 */
export function getAuditTrailForRecommendation(
  recommendationId: string
): AuditEvent[] {
  return MOCK_AUDIT_TRAIL.filter(
    (event) => event.recommendationId === recommendationId
  ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get recent audit events
 */
export function getRecentAuditEvents(limit: number = 50): AuditEvent[] {
  return [...MOCK_AUDIT_TRAIL]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Filter audit trail by event type
 */
export function getAuditTrailByType(eventType: AuditEventType): AuditEvent[] {
  return MOCK_AUDIT_TRAIL.filter((event) => event.eventType === eventType)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Get audit events for a date range
 */
export function getAuditTrailByDateRange(
  startDate: string,
  endDate: string
): AuditEvent[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return MOCK_AUDIT_TRAIL.filter((event) => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= start && eventDate <= end;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
