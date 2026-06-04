/**
 * Payroll Compliance Rules Engine
 * State-specific statutory calculations for India
 *
 * Supports: PF, ESI, LWF, PT, TDS
 * Auto-detects state from employee data
 */

export type IndianState =
  | "GJ" // Gujarat
  | "MH" // Maharashtra
  | "KA" // Karnataka
  | "DL" // Delhi
  | "TN" // Tamil Nadu
  | "UP" // Uttar Pradesh
  | "RJ" // Rajasthan
  | "WB" // West Bengal
  | "AP" // Andhra Pradesh
  | "TG"; // Telangana

export interface ComplianceRules {
  state: IndianState;

  // EPF (Employee Provident Fund) - National
  pf: {
    enabled: boolean;
    threshold: number; // 15,000
    employeeRate: number; // 12%
    employerRate: number; // 12%
    mandatory: boolean;
  };

  // ESI (Employee State Insurance) - National
  esi: {
    enabled: boolean;
    threshold: number; // 21,000
    employeeRate: number; // 0.75%
    employerRate: number; // 3.25%
    mandatory: boolean;
  };

  // LWF (Labour Welfare Fund) - State-specific
  lwf: {
    enabled: boolean;
    employeeAmount: number; // Flat amount per year
    employerAmount: number;
    frequency: "monthly" | "yearly" | "half-yearly";
    mandatory: boolean;
  };

  // PT (Professional Tax) - State-specific
  pt: {
    enabled: boolean;
    slabs: Array<{
      min: number;
      max: number;
      amount: number;
    }>;
    maxPerYear: number;
    mandatory: boolean;
  };

  // TDS (Tax Deducted at Source) - National with exemptions
  tds: {
    enabled: boolean;
    threshold: number; // 2.5 lakh annual
    slabs: Array<{
      min: number;
      max: number;
      rate: number;
    }>;
    standardDeduction: number; // 50,000
  };
}

/**
 * State-specific compliance rules
 */
export const STATE_COMPLIANCE_RULES: Record<IndianState, ComplianceRules> = {
  GJ: {
    state: "GJ",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 6, // ₹6 per half-year
      employerAmount: 12, // ₹12 per half-year
      frequency: "half-yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 5999, amount: 0 },
        { min: 6000, max: 8999, amount: 80 },
        { min: 9000, max: 11999, amount: 150 },
        { min: 12000, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2400,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  MH: {
    state: "MH",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 6, // ₹6 per half-year
      employerAmount: 12,
      frequency: "half-yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 7499, amount: 0 },
        { min: 7500, max: 9999, amount: 175 },
        { min: 10000, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2400,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  KA: {
    state: "KA",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 10, // ₹10 per year
      employerAmount: 20,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 14999, amount: 0 },
        { min: 15000, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2400,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  // Default rules for other states (can be customized)
  DL: {
    state: "DL",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: false,
      employeeAmount: 0,
      employerAmount: 0,
      frequency: "yearly",
      mandatory: false,
    },
    pt: {
      enabled: false,
      slabs: [],
      maxPerYear: 0,
      mandatory: false,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  TN: {
    state: "TN",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 20,
      employerAmount: 40,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 21000, amount: 0 },
        { min: 21001, max: 30000, amount: 135 },
        { min: 30001, max: 45000, amount: 200 },
        { min: 45001, max: 60000, amount: 312 },
        { min: 60001, max: 75000, amount: 416 },
        { min: 75001, max: 999999999, amount: 520 },
      ],
      maxPerYear: 2500,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  UP: {
    state: "UP",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 10,
      employerAmount: 20,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: false,
      slabs: [],
      maxPerYear: 0,
      mandatory: false,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  RJ: {
    state: "RJ",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 15,
      employerAmount: 30,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: false,
      slabs: [],
      maxPerYear: 0,
      mandatory: false,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  WB: {
    state: "WB",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 5,
      employerAmount: 10,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 8500, amount: 0 },
        { min: 8501, max: 10000, amount: 110 },
        { min: 10001, max: 15000, amount: 130 },
        { min: 15001, max: 25000, amount: 150 },
        { min: 25001, max: 40000, amount: 160 },
        { min: 40001, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2500,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  AP: {
    state: "AP",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 10,
      employerAmount: 20,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 15000, amount: 0 },
        { min: 15001, max: 20000, amount: 150 },
        { min: 20001, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2400,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },

  TG: {
    state: "TG",
    pf: {
      enabled: true,
      threshold: 15000,
      employeeRate: 0.12,
      employerRate: 0.12,
      mandatory: true,
    },
    esi: {
      enabled: true,
      threshold: 21000,
      employeeRate: 0.0075,
      employerRate: 0.0325,
      mandatory: true,
    },
    lwf: {
      enabled: true,
      employeeAmount: 10,
      employerAmount: 20,
      frequency: "yearly",
      mandatory: true,
    },
    pt: {
      enabled: true,
      slabs: [
        { min: 0, max: 15000, amount: 0 },
        { min: 15001, max: 20000, amount: 150 },
        { min: 20001, max: 999999999, amount: 200 },
      ],
      maxPerYear: 2400,
      mandatory: true,
    },
    tds: {
      enabled: true,
      threshold: 250000,
      slabs: [
        { min: 0, max: 250000, rate: 0 },
        { min: 250001, max: 500000, rate: 0.05 },
        { min: 500001, max: 1000000, rate: 0.20 },
        { min: 1000001, max: 999999999, rate: 0.30 },
      ],
      standardDeduction: 50000,
    },
  },
};

/**
 * Get compliance rules for a state
 */
export function getStateRules(state: IndianState): ComplianceRules {
  return STATE_COMPLIANCE_RULES[state];
}

/**
 * Auto-detect state from city
 */
export function detectStateFromCity(city: string): IndianState {
  const cityStateMap: Record<string, IndianState> = {
    surat: "GJ",
    mumbai: "MH",
    ahmedabad: "GJ",
  };

  return cityStateMap[city.toLowerCase()] || "GJ"; // Default to Gujarat
}
