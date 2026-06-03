/**
 * Advance Settings Configuration
 * Stores configurable advance percentage limits by role
 */

export interface AdvanceSettings {
  washerSupervisorLimit: number; // Percentage limit for Car Washer and Supervisor
  otherRolesLimit: number; // Percentage limit for all other roles
  lastUpdatedBy: string;
  lastUpdatedOn: string;
}

const STORAGE_KEY = "ADVANCE_SETTINGS";

// Default settings
const DEFAULT_SETTINGS: AdvanceSettings = {
  washerSupervisorLimit: 50,
  otherRolesLimit: 20,
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
  updatedBy: string
): void {
  const settings: AdvanceSettings = {
    washerSupervisorLimit,
    otherRolesLimit,
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
