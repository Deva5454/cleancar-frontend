// Role-based data filtering utilities
import { Role } from "./roleConfig";

export interface FilterConfig {
  role: Role;
  userId?: string;
  teamId?: string;
  clusterId?: string;
  city?: string;
}

/**
 * Filters data based on role permissions
 * - Car Washer: Only their own data
 * - Supervisor: Only their team/cluster data
 * - Operations Manager: Only their region data
 * - Admin/Super Admin: All data
 */
export function filterDataByRole<T extends Record<string, any>>(
  data: T[],
  config: FilterConfig,
  dataOwnerField: keyof T
): T[] {
  const { role, userId, teamId, clusterId, city } = config;

  switch (role) {
    case "Car Washer":
      // Car washers can only see their own data
      return data.filter((item) => item[dataOwnerField] === userId);

    case "Supervisor":
      // Supervisors can see their team or cluster data
      if (teamId) {
        return data.filter((item) => item.teamId === teamId || item.supervisorId === userId);
      }
      if (clusterId) {
        return data.filter((item) => item.clusterId === clusterId);
      }
      return data.filter((item) => item.supervisorName === "Suresh Yadav"); // Mock filtering

    case "TSE":
      // TSE can only see their own leads
      return data.filter((item) => item[dataOwnerField] === userId || item.assignedTo === "Neha Singh");

    case "CCE":
      // CCE can only see their assigned complaints
      return data.filter((item) => item.assignedTo === "Anjali Reddy" || item.assignedTo === userId);

    case "Store Manager":
      // Store Manager sees all inventory but NO MONETARY VALUES (filtered in display)
      return data;

    case "Procurement Manager":
      // Procurement Manager sees all procurement data
      return data;

    case "Operations Manager":
      // Operations Manager sees their region/cluster
      if (city) {
        return data.filter((item) => item.city === city);
      }
      return data;

    case "Sr Operations Manager":
    case "City Manager":
      // City/Region level access
      if (city) {
        return data.filter((item) => item.city === city);
      }
      return data;

    case "TSM":
      // TSM sees team leads
      return data;

    case "Accounts":
    case "HR":
    case "Admin":
    case "Super Admin":
      // Full access
      return data;

    default:
      // Restricted access by default
      return [];
  }
}

/**
 * Checks if a role should see financial data
 */
export function shouldShowFinancials(role: Role): boolean {
  const financialRoles: Role[] = [
    "Super Admin",
    "Admin",
    "Accounts",
    "HR",
    "Procurement Manager", // Can see procurement costs
  ];
  return financialRoles.includes(role);
}

/**
 * Checks if Store Manager should NOT see a field
 * Store Manager should NEVER see monetary values
 */
export function shouldHideFieldForStoreManager(fieldName: string, role: Role): boolean {
  if (role !== "Store Manager") return false;

  const monetaryFields = [
    "price",
    "cost",
    "amount",
    "value",
    "total",
    "unitPrice",
    "unitCost",
    "rate",
    "mrp",
    "revenue",
    "expense",
    "payment",
    "salary",
    "wage",
  ];

  return monetaryFields.some((field) => fieldName.toLowerCase().includes(field.toLowerCase()));
}

/**
 * Filters financial data from object for Store Manager
 */
export function removeFinancialData<T extends Record<string, any>>(data: T, role: Role): Partial<T> {
  if (role !== "Store Manager") return data;

  const filtered: any = { ...data };

  Object.keys(filtered).forEach((key) => {
    if (shouldHideFieldForStoreManager(key, role)) {
      delete filtered[key];
    }
  });

  return filtered;
}

/**
 * Gets visible columns for table based on role
 */
export function getVisibleColumns(allColumns: string[], role: Role): string[] {
  if (role === "Store Manager") {
    return allColumns.filter((col) => !shouldHideFieldForStoreManager(col, role));
  }
  return allColumns;
}

/**
 * Filters team members visible to a role
 */
export function getVisibleTeamMembers(allMembers: any[], role: Role, currentUserId: string): any[] {
  switch (role) {
    case "Car Washer":
      // Car washer can only see themselves
      return allMembers.filter((member) => member.id === currentUserId);

    case "Supervisor":
      // Supervisor sees their direct reports
      return allMembers.filter((member) => member.supervisorId === currentUserId || member.id === currentUserId);

    case "TSM":
      // TSM sees their TSE team
      return allMembers.filter((member) => member.reportsTo === "TSM" || member.role === "TSE");

    case "Operations Manager":
    case "Sr Operations Manager":
      // Operations managers see supervisors and washers in their region
      return allMembers.filter(
        (member) => member.role === "Supervisor" || member.role === "Car Washer" || member.id === currentUserId
      );

    case "HR":
    case "Admin":
    case "Super Admin":
      // Full team visibility
      return allMembers;

    default:
      // Restricted by default
      return allMembers.filter((member) => member.id === currentUserId);
  }
}

/**
 * Determines if a user can view another user's details
 */
export function canViewUserDetails(viewerRole: Role, targetUserId: string, viewerId: string): boolean {
  // Self-view always allowed
  if (targetUserId === viewerId) return true;

  const fullAccessRoles: Role[] = ["Super Admin", "Admin", "HR", "City Manager"];
  if (fullAccessRoles.includes(viewerRole)) return true;

  const managerRoles: Role[] = ["Operations Manager", "Sr Operations Manager", "Supervisor", "TSM"];
  if (managerRoles.includes(viewerRole)) {
    // In production, check if target reports to viewer
    return true; // Simplified for demo
  }

  return false;
}

/**
 * Gets dashboard metrics filtered by role
 */
export function getDashboardMetrics(role: Role, allMetrics: any) {
  switch (role) {
    case "Car Washer":
      return {
        washesCompleted: allMetrics.myWashes || 0,
        earnings: allMetrics.myEarnings || 0,
        qualityScore: allMetrics.myQualityScore || 0,
        // Hide team metrics
      };

    case "Supervisor":
      return {
        teamWashes: allMetrics.teamWashes || 0,
        teamPresent: allMetrics.teamPresent || 0,
        cashCollected: allMetrics.cashCollected || 0,
        // Hide company-wide metrics
      };

    case "Store Manager":
      return {
        totalItems: allMetrics.totalItems || 0,
        lowStock: allMetrics.lowStock || 0,
        pendingGRNs: allMetrics.pendingGRNs || 0,
        // NO MONETARY VALUES
        // Hide: totalValue, inventoryValue, etc.
      };

    case "Procurement Manager":
      return {
        pendingPOs: allMetrics.pendingPOs || 0,
        supplierCount: allMetrics.supplierCount || 0,
        pendingApprovals: allMetrics.pendingApprovals || 0,
        totalSpend: allMetrics.totalSpend || 0, // Can see financials
      };

    case "Operations Manager":
      return {
        clusterCount: allMetrics.clusterCount || 0,
        totalWashes: allMetrics.totalWashes || 0,
        avgQuality: allMetrics.avgQuality || 0,
        activeComplaints: allMetrics.activeComplaints || 0,
        // Hide company financials
      };

    case "TSE":
      return {
        myLeads: allMetrics.myLeads || 0,
        myConversions: allMetrics.myConversions || 0,
        myTarget: allMetrics.myTarget || 0,
        // Hide team metrics
      };

    case "Admin":
    case "Super Admin":
      // Full metrics
      return allMetrics;

    default:
      return {};
  }
}
