/**
 * Advance Settings Configuration
 * Stores configurable advance percentage limits by role
 */

export interface AdvanceSettings {
  washerSupervisorLimit: number; // Percentage limit for Car Washer and Supervisor
  otherRolesLimit: number; // Percentage limit for all other roles
  longTermAdvanceEnabled: boolean; // Super Admin toggle — employees can only see long-term if true
  longTermEnabledRoles: string[]; // Which roles can see long-term advance
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

const STORAGE_KEY = "ADVANCE_SETTINGS";

// Default settings
const DEFAULT_SETTINGS: AdvanceSettings = {
  washerSupervisorLimit: 50,
  otherRolesLimit: 20,
  longTermAdvanceEnabled: false, // OFF by default — Super Admin must enable
  longTermEnabledRoles: [],      // No roles enabled by default
  lastUpdatedBy: "System",
  lastUpdatedOn: new Date().toISOString(),
};

/**
 * Get current advance settings
 */
export function getAdvanceSettings(): AdvanceSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading advance settings:", error);
  }
  return { ...DEFAULT_SETTINGS };
}

/**
 * Update advance settings (Super Admin only)
 */
export function updateAdvanceSettings(
  washerSupervisorLimit: number,
  otherRolesLimit: number,
  updatedBy: string,
  longTermAdvanceEnabled?: boolean,
  longTermEnabledRoles?: string[]
): void {
  const current = getAdvanceSettings();
  const settings: AdvanceSettings = {
    washerSupervisorLimit,
    otherRolesLimit,
    longTermAdvanceEnabled: longTermAdvanceEnabled ?? current.longTermAdvanceEnabled,
    longTermEnabledRoles: longTermEnabledRoles ?? current.longTermEnabledRoles,
    lastUpdatedBy: updatedBy,
    lastUpdatedOn: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving advance settings:", error);
    throw new Error("Failed to save advance settings");
  }
}

/**
 * Get advance limit percentage for a specific role
 */
export function getAdvanceLimitForRole(role: string): number {
  const settings = getAdvanceSettings();

  // Car Washer and Supervisor get washerSupervisorLimit
  if (role === "Car Washer" || role === "Supervisor") {
    return settings.washerSupervisorLimit;
  }

  // All other roles get otherRolesLimit
  return settings.otherRolesLimit;
}

/**
 * Calculate maximum advance amount based on role and gross salary
 */
export function calculateMaxAdvanceAmount(
  grossSalary: number,
  role: string
): { maxAmount: number; limitPercentage: number } {
  const limitPercentage = getAdvanceLimitForRole(role);
  const maxAmount = Math.round((grossSalary * limitPercentage) / 100);

  return {
    maxAmount,
    limitPercentage,
  };
}

/**
 * Check if a specific role can access long-term advance
 */
export function canAccessLongTermAdvance(role: string): boolean {
  const settings = getAdvanceSettings();
  if (!settings.longTermAdvanceEnabled) return false;
  if (settings.longTermEnabledRoles.length === 0) return false;
  return settings.longTermEnabledRoles.includes(role);
}

/**
 * Toggle long-term advance for a specific role (Super Admin only)
 */
export function setLongTermAdvanceForRole(
  role: string,
  enabled: boolean,
  updatedBy: string
): void {
  const settings = getAdvanceSettings();
  let roles = [...(settings.longTermEnabledRoles || [])];
  if (enabled && !roles.includes(role)) {
    roles.push(role);
  } else if (!enabled) {
    roles = roles.filter(r => r !== role);
  }
  updateAdvanceSettings(
    settings.washerSupervisorLimit,
    settings.otherRolesLimit,
    updatedBy,
    roles.length > 0,
    roles
  );
}
