/**
 * FINAL ORGANIZATIONAL HIERARCHY SYSTEM
 * City → Cluster Manager → Pincode → Team → Supervisor → Washers
 *
 * RULES:
 * - Each pincode has exactly ONE Cluster Manager
 * - One pincode can have MULTIPLE teams
 * - One team has exactly ONE supervisor
 * - City Manager has full city visibility
 * - Cluster Manager sees only assigned pincodes
 * - Head Office departments NOT mapped to pincodes
 * - All leads, campaigns, materials tracked at pincode/team level
 */

// ==================== CORE HIERARCHY ====================

export type DepartmentType =
  | 'HR'
  | 'Store'
  | 'Procurement'
  | 'Marketing'
  | 'Accounts'
  | 'Telecalling';

export type OperationalRole =
  | 'City Manager'
  | 'Cluster Manager'
  | 'Supervisor'
  | 'Car Washer'
  | 'TSE'
  | 'TSM';

export type HeadOfficeRole =
  | 'Super Admin'
  | 'Admin'
  | 'HR'
  | 'Store Manager'
  | 'Procurement Manager'
  | 'Accounts'
  | 'CCE';

export type UserRole = OperationalRole | HeadOfficeRole;

// ==================== GEOGRAPHIC ENTITIES ====================

export interface City {
  id: string;
  name: string;
  state: string;
  regionalOfficeAddress: string;
  cityManagerId: string | null;
  isActive: boolean;
  activationDate: Date;
  metadata: {
    population?: number;
    targetMarket?: string;
  };
}

export interface Cluster {
  id: string;
  name: string;
  cityId: string;
  clusterManagerId: string | null; // Null if unassigned → City Manager controls
  pincodes: string[]; // Array of pincode IDs
  isActive: boolean;
  createdDate: Date;
  lastReassignedDate?: Date;
}

export interface Pincode {
  id: string;
  pincode: string; // Actual pincode number (e.g., "395009")
  areaName: string; // Human-readable name (e.g., "Adajan")
  cityId: string;
  clusterId: string;
  clusterManagerId: string | null; // Denormalized for quick lookup
  isActive: boolean;
  activationDate: Date;
  metadata: {
    estimatedHouseholds?: number;
    marketPotential?: 'HIGH' | 'MEDIUM' | 'LOW';
  };
}

// ==================== TEAM (OPERATIONAL UNIT) ====================

// Shift Structure:
// PART_TIME: 5 AM - 9 AM (4 hours)
// FULL_TIME: 9 AM - 9 PM (12 hours)
export type TeamShift = 'PART_TIME' | 'FULL_TIME';
export type TeamStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'SUSPENDED';

export interface Team {
  id: string;
  name: string; // e.g., "Adajan Morning Team A"
  pincodeId: string;
  pincode: string; // Denormalized for display
  areaName: string; // Denormalized for display

  // Team Structure
  supervisorId: string; // One supervisor per team
  washerIds: string[]; // Array of washer IDs in this team

  // Operational Details
  shift: TeamShift;
  status: TeamStatus;

  // Hierarchy Context (denormalized)
  cityId: string;
  clusterId: string;
  clusterManagerId: string | null;

  // Metadata
  createdDate: Date;
  lastModifiedDate?: Date;
  targetCustomersPerDay?: number;
  metadata?: {
    serviceAreas?: string[]; // Specific localities within pincode
    vehicleTypes?: ('2W' | '4W' | 'SUV')[]; // Specialization
  };
}

// ==================== PINCODE ASSIGNMENT HISTORY ====================

export interface PincodeAssignmentHistory {
  id: string;
  pincodeId: string;
  pincode: string;
  previousClusterManagerId: string | null;
  newClusterManagerId: string | null;
  reassignedBy: string; // City Manager or Admin ID
  reassignmentDate: Date;
  reason: string;
  // Historical data remains linked to previous manager
  preserveHistoricalMetrics: boolean;
}

// ==================== USER WITH HIERARCHY ====================

export interface UserWithHierarchy {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;

  // Operational Roles - Geographic Assignment
  cityId?: string; // City Manager, Cluster Manager, Supervisor, Washer
  clusterId?: string; // Cluster Manager only
  assignedPincodes?: string[]; // Cluster Manager, Supervisor

  // Head Office - Department Assignment
  department?: DepartmentType;

  // Status
  isActive: boolean;
  joiningDate: Date;
  reportingTo?: string; // Manager ID
}

// ==================== VISIBILITY RULES ====================

export interface VisibilityScope {
  role: UserRole;
  userId: string;

  // Geographic visibility
  cities: string[]; // City Manager sees their city, Admin sees all
  clusters: string[]; // Cluster Manager sees their cluster
  pincodes: string[]; // Cluster Manager/Supervisor see assigned pincodes

  // Data visibility rules
  canViewAllLeads: boolean;
  canViewAllOperations: boolean;
  canViewAllFinancials: boolean;
  canReassignPincodes: boolean;
}

// ==================== LEAD WITH PINCODE ====================

export interface LeadWithPincode {
  id: string;
  customerName: string;
  phone: string;
  email?: string;

  // MANDATORY: All leads must have pincode
  pincodeId: string;
  pincode: string; // Denormalized for display
  areaName: string;

  // Hierarchy context
  cityId: string;
  clusterId: string;
  clusterManagerId: string | null;

  // Lead source
  source: 'TELECALLING' | 'BTL_SUPERVISOR' | 'MARKETING' | 'REFERRAL' | 'WALK_IN';
  createdBy: string;
  assignedTo?: string; // TSE or Supervisor

  // Status
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  createdDate: Date;
  lastActivityDate?: Date;
}

// ==================== MARKETING CAMPAIGN WITH PINCODE ====================

export interface MarketingCampaign {
  id: string;
  name: string;
  campaignType: 'DIGITAL' | 'BTL' | 'REFERRAL' | 'BILLBOARD' | 'PRINT';

  // MANDATORY: Pincode tagging
  targetPincodes: string[]; // Can target multiple pincodes
  cityId: string;

  // Budget & Tracking
  budgetAllocated: number;
  actualSpent: number;

  // Performance (pincode-level)
  leadsByPincode: Record<string, number>;
  conversionsByPincode: Record<string, number>;

  // Dates
  startDate: Date;
  endDate: Date;
  createdBy: string;
}

// ==================== MATERIAL TRACKING WITH PINCODE ====================

export interface MaterialUsageTracking {
  id: string;

  // Supervisor-level tracking
  supervisorId: string;
  pincodeId: string;
  pincode: string;

  // Material details
  materialId: string;
  materialName: string;
  materialType: 'CONSUMABLE' | 'REUSABLE' | 'ASSET';

  // Usage
  quantityUsed: number;
  unit: string;
  usageDate: Date;

  // Context
  washerId?: string; // If issued to specific washer
  jobId?: string; // If tied to specific job

  // Hierarchy context
  cityId: string;
  clusterId: string;
  clusterManagerId: string | null;
}

export interface MaterialInventoryByPincode {
  pincodeId: string;
  pincode: string;
  areaName: string;
  supervisorId: string;

  // Inventory levels
  materials: {
    materialId: string;
    materialName: string;
    currentStock: number;
    unit: string;
    minThreshold: number;
    status: 'ADEQUATE' | 'LOW' | 'CRITICAL';
  }[];

  lastUpdated: Date;
}

// ==================== FINANCIAL TRACKING WITH HIERARCHY ====================

export interface IncomeByPincode {
  id: string;

  // Always mapped to pincode
  pincodeId: string;
  pincode: string;
  cityId: string;
  clusterId: string;

  // Revenue details
  subscriptionId: string;
  customerId: string;
  packageType: string;
  amount: number;
  date: Date;

  // Attribution - Full hierarchy tracking
  clusterManagerId: string | null;
  teamId?: string; // Team assignment
  supervisorId?: string; // Supervisor who manages the customer
  washerId?: string; // Washer assigned to this customer
}

export interface ExpenseByLevel {
  id: string;
  expenseType: 'OFFICE_RENT' | 'MARKETING' | 'OPERATIONS' | 'MATERIAL' | 'SALARY' | 'UTILITIES';

  // Level-based tracking
  level: 'CITY' | 'PINCODE';

  // City-level expenses (office rent)
  cityId?: string;

  // Pincode-level expenses (marketing, operations, material)
  pincodeId?: string;
  pincode?: string;
  clusterId?: string;

  // Amount
  amount: number;
  date: Date;
  description: string;

  // Approval
  approvedBy?: string;
  approvalDate?: Date;
}

// ==================== DASHBOARD METRICS BY HIERARCHY ====================

export interface ClusterManagerMetrics {
  clusterManagerId: string;
  clusterId: string;
  assignedPincodes: {
    pincodeId: string;
    pincode: string;
    areaName: string;
    supervisors: number;
    activeWashers: number;
    activeCustomers: number;
    monthlyRevenue: number;
  }[];

  // Aggregated metrics (only from assigned pincodes)
  totalRevenue: number;
  totalExpenses: number;
  totalLeads: number;
  totalConversions: number;
  totalActiveCustomers: number;

  // Performance
  conversionRate: number;
  revenuePerPincode: number;

  period: { startDate: Date; endDate: Date };
}

export interface CityManagerMetrics {
  cityManagerId: string;
  cityId: string;

  // Full city visibility
  clusters: {
    clusterId: string;
    clusterName: string;
    clusterManagerId: string | null;
    clusterManagerName: string | null;
    pincodeCount: number;
    revenue: number;
    expenses: number;
    activeCustomers: number;
  }[];

  // City-wide aggregation
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalActiveCustomers: number;
  totalLeads: number;
  totalConversions: number;

  // City-level expenses
  officeRent: number;
  utilities: number;

  period: { startDate: Date; endDate: Date };
}

// ==================== HELPER TYPES ====================

export interface PincodeReassignmentRequest {
  pincodeId: string;
  currentClusterManagerId: string | null;
  newClusterManagerId: string | null;
  reassignedBy: string;
  reason: string;
}

export interface MultiPincodeSupervisor {
  supervisorId: string;
  assignedPincodes: {
    pincodeId: string;
    pincode: string;
    areaName: string;
    assignedDate: Date;
    isActive: boolean;
  }[];
}

// ==================== ACCESS CONTROL ====================

export function getVisibilityScope(user: UserWithHierarchy): VisibilityScope {
  const scope: VisibilityScope = {
    role: user.role,
    userId: user.id,
    cities: [],
    clusters: [],
    pincodes: [],
    canViewAllLeads: false,
    canViewAllOperations: false,
    canViewAllFinancials: false,
    canReassignPincodes: false,
  };

  switch (user.role) {
    case 'Super Admin':
    case 'Admin':
      // Full system access
      scope.canViewAllLeads = true;
      scope.canViewAllOperations = true;
      scope.canViewAllFinancials = true;
      scope.canReassignPincodes = true;
      break;

    case 'City Manager':
      // Full city visibility
      if (user.cityId) {
        scope.cities = [user.cityId];
        scope.canViewAllLeads = true; // Within city
        scope.canViewAllOperations = true; // Within city
        scope.canViewAllFinancials = true; // Within city
        scope.canReassignPincodes = true; // Can reassign pincodes in city
      }
      break;

    case 'Cluster Manager':
      // Only assigned pincodes
      if (user.cityId && user.clusterId && user.assignedPincodes) {
        scope.cities = [user.cityId];
        scope.clusters = [user.clusterId];
        scope.pincodes = user.assignedPincodes;
        scope.canViewAllLeads = false; // Only pincode leads
        scope.canViewAllOperations = false; // Only pincode operations
        scope.canViewAllFinancials = false; // Only pincode financials
      }
      break;

    case 'Supervisor':
      // Only assigned pincodes
      if (user.assignedPincodes) {
        scope.pincodes = user.assignedPincodes;
      }
      break;

    case 'Car Washer':
      // No geographic scope, job-based access
      break;

    // Head Office Roles
    case 'HR':
    case 'Accounts':
      // Full financial visibility but no geographic restriction
      scope.canViewAllFinancials = true;
      break;

    case 'Store Manager':
    case 'Procurement Manager':
      // Inventory visibility across all locations
      scope.canViewAllOperations = true;
      break;

    case 'TSM':
    case 'TSE':
      // Lead visibility based on assignment
      scope.canViewAllLeads = true;
      break;

    default:
      break;
  }

  return scope;
}

export function canAccessPincode(user: UserWithHierarchy, pincodeId: string): boolean {
  const scope = getVisibilityScope(user);

  // Admin has universal access
  if (user.role === 'Super Admin' || user.role === 'Admin') {
    return true;
  }

  // City Manager has access to all pincodes in their city
  if (user.role === 'City Manager') {
    return true; // Will be filtered by cityId in queries
  }

  // Cluster Manager and Supervisor have access only to assigned pincodes
  return scope.pincodes.includes(pincodeId);
}

export function canReassignPincode(user: UserWithHierarchy): boolean {
  return user.role === 'Super Admin' || user.role === 'Admin' || user.role === 'City Manager';
}
