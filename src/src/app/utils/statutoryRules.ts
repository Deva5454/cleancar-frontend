/**
 * State-Based Statutory Rules Utility
 *
 * Provides state-specific compliance rules for payroll calculations
 * Supports: PT (Professional Tax), PF (Provident Fund), ESIC, LWF
 *
 * Usage:
 * const rules = getStatutoryRules("GJ");
 * console.log(rules.pt); // "Gujarat PT Rules"
 */

export interface StatutoryRules {
  stateCode: string;
  stateName: string;
  pt: string; // Professional Tax rules
  pf: string; // Provident Fund rules
  esic: string; // ESIC rules
  lwf?: string; // Labour Welfare Fund (optional)
  notes?: string; // Additional compliance notes
}

// State code to name mapping
const STATE_NAMES: Record<string, string> = {
  GJ: "Gujarat",
  MH: "Maharashtra",
  KA: "Karnataka",
  DL: "Delhi",
  TN: "Tamil Nadu",
  RJ: "Rajasthan",
  UP: "Uttar Pradesh",
  WB: "West Bengal",
};

/**
 * Get statutory compliance rules for a given state
 *
 * @param stateCode - Two-letter state code (GJ, MH, KA, etc.)
 * @returns StatutoryRules object with state-specific rules
 */
export const getStatutoryRules = (stateCode?: string): StatutoryRules => {
  if (!stateCode) {
    return {
      stateCode: "DEFAULT",
      stateName: "Default",
      pt: "Standard PT Rules",
      pf: "Standard PF (12% Employee + 12% Employer)",
      esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
      notes: "Using default statutory rules",
    };
  }

  const upperStateCode = stateCode.toUpperCase();

  switch (upperStateCode) {
    case "GJ": // Gujarat
      return {
        stateCode: "GJ",
        stateName: "Gujarat",
        pt: "Gujarat PT (Slab-based: ₹0-₹300/month based on gross)",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        lwf: "Gujarat LWF (₹6 Employee + ₹12 Employer per year)",
        notes: "Gujarat has slab-based PT with max ₹300/month",
      };

    case "MH": // Maharashtra
      return {
        stateCode: "MH",
        stateName: "Maharashtra",
        pt: "Maharashtra PT (Slab-based: ₹0-₹300/month based on gross)",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        lwf: "Maharashtra LWF (₹6 Employee + ₹12 Employer per year)",
        notes: "Maharashtra PT February surcharge: ₹300 extra in Feb",
      };

    case "KA": // Karnataka
      return {
        stateCode: "KA",
        stateName: "Karnataka",
        pt: "Karnataka PT (Slab-based: ₹0-₹200/month based on gross)",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        lwf: "Karnataka LWF (₹20 Employee + ₹40 Employer per year)",
        notes: "Karnataka PT max ₹200/month",
      };

    case "DL": // Delhi
      return {
        stateCode: "DL",
        stateName: "Delhi",
        pt: "No PT in Delhi",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        notes: "Delhi does not have Professional Tax",
      };

    case "TN": // Tamil Nadu
      return {
        stateCode: "TN",
        stateName: "Tamil Nadu",
        pt: "Tamil Nadu PT (Flat: ₹0-₹2500/year based on annual income)",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        notes: "Tamil Nadu PT is annual, not monthly",
      };

    default:
      return {
        stateCode: upperStateCode,
        stateName: STATE_NAMES[upperStateCode] || "Unknown",
        pt: "Standard PT Rules (check local regulations)",
        pf: "Standard PF (12% Employee + 12% Employer)",
        esic: "Standard ESIC (0.75% Employee + 3.25% Employer)",
        notes: `State-specific rules for ${upperStateCode} not configured yet`,
      };
  }
};

/**
 * Calculate Professional Tax for a given state and gross salary
 *
 * @param stateCode - Two-letter state code
 * @param grossSalary - Monthly gross salary
 * @returns PT amount to deduct
 */
export const calculatePT = (stateCode: string | undefined, grossSalary: number): number => {
  if (!stateCode) return 0;

  const upperStateCode = stateCode.toUpperCase();

  switch (upperStateCode) {
    case "GJ": // Gujarat PT Slabs
      if (grossSalary <= 5999) return 0;
      if (grossSalary <= 8999) return 80;
      if (grossSalary <= 11999) return 150;
      return 200;

    case "MH": // Maharashtra PT Slabs (Feb has extra ₹300)
      if (grossSalary <= 7500) return 0;
      if (grossSalary <= 10000) return 175;
      return 200;

    case "KA": // Karnataka PT Slabs
      if (grossSalary <= 15000) return 0;
      return 200;

    case "DL": // Delhi - No PT
      return 0;

    case "TN": // Tamil Nadu - Annual PT (not calculated monthly)
      return 0;

    default:
      return 0; // Default: No PT if state not configured
  }
};

/**
 * Get all supported state codes
 */
export const getSupportedStates = (): string[] => {
  return Object.keys(STATE_NAMES);
};

/**
 * Get state name from code
 */
export const getStateName = (stateCode?: string): string => {
  if (!stateCode) return "Unknown";
  return STATE_NAMES[stateCode.toUpperCase()] || stateCode;
};
