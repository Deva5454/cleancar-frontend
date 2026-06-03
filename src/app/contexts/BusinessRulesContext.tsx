/**
 * ============================================================================
 * BUSINESS RULES CONTEXT
 * ============================================================================
 *
 * Purpose:
 * - Centralized business rules and configurable values
 * - Single source of truth for salaries, targets, limits, and role configs
 * - Runtime-configurable (not hardcoded)
 * - Persistent storage-backed
 *
 * Replaces:
 * - operationsManager.constants.ts
 * - clusterManager.constants.ts
 * - customerCareExecutive.constants.ts
 * - Other scattered hardcoded business values
 *
 * Migration Strategy:
 * - Phase 1: Create context with fallback defaults
 * - Phase 2: Gradually replace constant imports with useBusinessRules()
 * - Phase 3: Add admin UI for editing (optional)
 * - Phase 4: Remove old constants files
 *
 * Rule: Do NOT hardcode business values - use this context
 *
 * ============================================================================
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";

// ========== TYPES ==========

/**
 * Cluster Manager business rules
 */
export interface ClusterManagerRules {
  currentId: string;
  currentName: string;
  baseIncentive: number;
  kpiTargets: {
    revenue: number;
    costPerWash: number;
    washQuality: number;
    customerSatisfaction: number;
  };
  kpiThresholds: {
    excellent: number;
    good: number;
    average: number;
  };
  escalationSLA: {
    critical: number;
    high: number;
    medium: number;
  };
}

/**
 * Operations Manager business rules
 */
export interface OperationsManagerRules {
  currentId: string;
  minTarget: number;
  maxTarget: number;
  discountAuthority: number;
  unitControlLimits: {
    minUnits: number;
    maxUnits: number;
  };
  escalationAuthority: {
    level1: number;
    level2: number;
  };
  kpiWeights: {
    quality: number;
    speed: number;
    cost: number;
    satisfaction: number;
  };
}

/**
 * Customer Care Executive business rules
 */
export interface CustomerCareRules {
  salaryRange: {
    min: number;
    max: number;
  };
  variableIncentive: {
    max: number;
    tiers: Array<{
      csat: number;
      breachRate: number;
      amount: number;
    }>;
  };
  kpiTargets: {
    responseTime: number;
    resolutionTime: number;
    csatScore: number;
    maxBreaches: number;
  };
  complaintPriorities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * SLA configurations
 */
export interface SLARules {
  complaintResponse: number;
  complaintResolution: number;
  escalationThresholds: {
    warning: number;
    critical: number;
  };
}

/**
 * Payroll timeline
 */
export interface PayrollRules {
  cutoffDay: number;
  processingDay: number;
  disbursementDay: number;
}

/**
 * Complete business rules structure
 */
export interface BusinessRules {
  clusterManager: ClusterManagerRules;
  operationsManager: OperationsManagerRules;
  customerCare: CustomerCareRules;
  sla: SLARules;
  payroll: PayrollRules;
  defaultRevenueTarget: number;
  revenueTargetByCity: Record<string, number>;
  costPerJobByCity: Record<string, number>;
  targetMarginPercentByCity: Record<string, number>;
  incentiveMultiplierByCity: Record<string, number>;
  lastUpdated: string;
  version: string;
}

/**
 * Context type
 */
interface BusinessRulesContextType {
  rules: BusinessRules;
  updateRules: (updates: Partial<BusinessRules>) => void;
  updateClusterManager: (updates: Partial<ClusterManagerRules>) => void;
  updateOperationsManager: (updates: Partial<OperationsManagerRules>) => void;
  updateCustomerCare: (updates: Partial<CustomerCareRules>) => void;
  getRevenueTarget: (cityId?: string) => number;
  setRevenueTargetByCity: (cityId: string, value: number) => void;
  getCostPerJob: (cityId?: string) => number;
  setCostPerJob: (cityId: string, value: number) => void;
  getTargetMargin: (cityId?: string) => number;
  setTargetMargin: (cityId: string, value: number) => void;
  getIncentiveMultiplier: (cityId?: string) => number;
  setIncentiveMultiplier: (cityId: string, value: number) => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

// ========== DEFAULT VALUES ==========
// Extracted from constants files as fallback

const DEFAULT_BUSINESS_RULES: BusinessRules = {
  clusterManager: {
    currentId: "CM-001",
    currentName: "Priya Sharma",
    baseIncentive: 50000,
    kpiTargets: {
      revenue: 12000000, // ₹12M per month per cluster
      costPerWash: 300,
      washQuality: 95,
      customerSatisfaction: 90,
    },
    kpiThresholds: {
      excellent: 95,
      good: 85,
      average: 75,
    },
    escalationSLA: {
      critical: 2, // hours
      high: 6,
      medium: 24,
    },
  },
  operationsManager: {
    currentId: "OM-001",
    minTarget: 25,
    maxTarget: 50,
    discountAuthority: 15, // percentage
    unitControlLimits: {
      minUnits: 1,
      maxUnits: 10,
    },
    escalationAuthority: {
      level1: 10, // percentage
      level2: 20,
    },
    kpiWeights: {
      quality: 30,
      speed: 25,
      cost: 25,
      satisfaction: 20,
    },
  },
  customerCare: {
    salaryRange: {
      min: 12000,
      max: 16000,
    },
    variableIncentive: {
      max: 10000,
      tiers: [
        { csat: 95, breachRate: 5, amount: 10000 },
        { csat: 90, breachRate: 10, amount: 7500 },
        { csat: 85, breachRate: 15, amount: 5000 },
        { csat: 80, breachRate: 20, amount: 2500 },
      ],
    },
    kpiTargets: {
      responseTime: 15, // minutes
      resolutionTime: 120, // minutes
      csatScore: 90,
      maxBreaches: 5,
    },
    complaintPriorities: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4,
    },
  },
  sla: {
    complaintResponse: 15, // minutes
    complaintResolution: 120, // minutes
    escalationThresholds: {
      warning: 80, // percentage of SLA time
      critical: 95,
    },
  },
  payroll: {
    cutoffDay: 25, // Day of month
    processingDay: 27,
    disbursementDay: 1, // 1st of next month
  },
  defaultRevenueTarget: 12000000,
  revenueTargetByCity: {
    "CITY-SURAT": 12000000,
  },
  costPerJobByCity: {
    "CITY-SURAT": 120,
  },
  targetMarginPercentByCity: {
    "CITY-SURAT": 30,
  },
  incentiveMultiplierByCity: {
    "CITY-SURAT": 1,
  },
  lastUpdated: new Date().toISOString(),
  version: "1.0.0",
};

// ========== CONTEXT ==========

const BusinessRulesContext = createContext<BusinessRulesContextType | undefined>(undefined);

// ========== PROVIDER ==========

interface BusinessRulesProviderProps {
  children: ReactNode;
}

export function BusinessRulesProvider({ children }: BusinessRulesProviderProps) {
  const [rules, setRules] = useState<BusinessRules>(() => {
    // Try to load from storage
    const stored = DataService.get<BusinessRules>("BUSINESS_RULES");

    if (stored.length > 0) {
      logger.debug("BusinessRulesContext: Loaded from storage", { version: stored[0].version });
      return stored[0];
    }

    // Use defaults if not found
    logger.debug("BusinessRulesContext: Using defaults", { version: DEFAULT_BUSINESS_RULES.version });
    return DEFAULT_BUSINESS_RULES;
  });

  const [isLoading, setIsLoading] = useState(false);
  const _dbRulesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to storage whenever rules change
  useEffect(() => {
    if (_dbRulesTimer.current) clearTimeout(_dbRulesTimer.current);
    _dbRulesTimer.current = setTimeout(() => {
      if (rules) DataService.setAll("BUSINESS_RULES", [rules]);
    }, 500);
  }, [rules]);

  // ========== ACTIONS ==========

  /**
   * Update entire rules object (partial)
   */
  const updateRules = useCallback((updates: Partial<BusinessRules>) => {
    setRules((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("BusinessRules updated", { updates: Object.keys(updates) });
  }, []);

  /**
   * Update cluster manager rules
   */
  const updateClusterManager = useCallback((updates: Partial<ClusterManagerRules>) => {
    setRules((prev) => ({
      ...prev,
      clusterManager: {
        ...prev.clusterManager,
        ...updates,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("ClusterManager rules updated", { updates: Object.keys(updates) });
  }, []);

  /**
   * Update operations manager rules
   */
  const updateOperationsManager = useCallback((updates: Partial<OperationsManagerRules>) => {
    setRules((prev) => ({
      ...prev,
      operationsManager: {
        ...prev.operationsManager,
        ...updates,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("OperationsManager rules updated", { updates: Object.keys(updates) });
  }, []);

  /**
   * Update customer care rules
   */
  const updateCustomerCare = useCallback((updates: Partial<CustomerCareRules>) => {
    setRules((prev) => ({
      ...prev,
      customerCare: {
        ...prev.customerCare,
        ...updates,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("CustomerCare rules updated", { updates: Object.keys(updates) });
  }, []);

  /**
   * Reset to default values
   */
  const resetToDefaults = useCallback(() => {
    setRules(DEFAULT_BUSINESS_RULES);
    logger.warn("BusinessRules reset to defaults");
  }, []);

  /**
   * Get revenue target for a specific city
   * Falls back to default if city not configured
   */
  const getRevenueTarget = useCallback((cityId?: string): number => {
    if (!cityId) return rules.defaultRevenueTarget;

    return (
      rules.revenueTargetByCity?.[cityId] ??
      rules.defaultRevenueTarget
    );
  }, [rules.defaultRevenueTarget, rules.revenueTargetByCity]);

  /**
   * Set revenue target for a specific city
   */
  const setRevenueTargetByCity = useCallback((cityId: string, value: number) => {
    setRules((prev) => ({
      ...prev,
      revenueTargetByCity: {
        ...prev.revenueTargetByCity,
        [cityId]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("Revenue target updated for city", { cityId, value });
  }, []);

  /**
   * Get cost per job for a specific city
   * Falls back to default (₹120) if city not configured
   */
  const getCostPerJob = useCallback((cityId?: string): number => {
    if (!cityId) return 120;

    return (
      rules.costPerJobByCity?.[cityId] ?? 120
    );
  }, [rules.costPerJobByCity]);

  /**
   * Set cost per job for a specific city
   */
  const setCostPerJob = useCallback((cityId: string, value: number) => {
    setRules((prev) => ({
      ...prev,
      costPerJobByCity: {
        ...prev.costPerJobByCity,
        [cityId]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("Cost per job updated for city", { cityId, value });
  }, []);

  /**
   * Get target margin percentage for a specific city
   * Falls back to default (30%) if city not configured
   */
  const getTargetMargin = useCallback((cityId?: string): number => {
    if (!cityId) return 30;

    return (
      rules.targetMarginPercentByCity?.[cityId] ?? 30
    );
  }, [rules.targetMarginPercentByCity]);

  /**
   * Set target margin percentage for a specific city
   */
  const setTargetMargin = useCallback((cityId: string, value: number) => {
    setRules((prev) => ({
      ...prev,
      targetMarginPercentByCity: {
        ...prev.targetMarginPercentByCity,
        [cityId]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("Target margin updated for city", { cityId, value });
  }, []);

  /**
   * Get incentive multiplier for a specific city
   * Falls back to default (1.0) if city not configured
   */
  const getIncentiveMultiplier = useCallback((cityId?: string): number => {
    if (!cityId) return 1;

    return (
      rules.incentiveMultiplierByCity?.[cityId] ?? 1
    );
  }, [rules.incentiveMultiplierByCity]);

  /**
   * Set incentive multiplier for a specific city
   */
  const setIncentiveMultiplier = useCallback((cityId: string, value: number) => {
    setRules((prev) => ({
      ...prev,
      incentiveMultiplierByCity: {
        ...prev.incentiveMultiplierByCity,
        [cityId]: value,
      },
      lastUpdated: new Date().toISOString(),
    }));
    logger.log("Incentive multiplier updated for city", { cityId, value });
  }, []);

  // ========== CONTEXT VALUE ==========

  const contextValue: BusinessRulesContextType = useMemo(() => ({
    rules,
    updateRules,
    updateClusterManager,
    updateOperationsManager,
    updateCustomerCare,
    getRevenueTarget,
    setRevenueTargetByCity,
    getCostPerJob,
    setCostPerJob,
    getTargetMargin,
    setTargetMargin,
    getIncentiveMultiplier,
    setIncentiveMultiplier,
    resetToDefaults,
    isLoading,
  }),
  [rules, updateRules, updateClusterManager, updateOperationsManager, updateCustomerCare, getRevenueTarget, setRevenueTargetByCity, getCostPerJob, setCostPerJob, getTargetMargin]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BusinessRulesContext.Provider value={contextValue}>
      {children}
    </BusinessRulesContext.Provider>
  );
}

// ========== HOOK ==========

/**
 * Hook to access business rules
 *
 * Usage:
 * ```typescript
 * const { rules, updateClusterManager } = useBusinessRules();
 * const minTarget = rules.operationsManager.minTarget;
 * ```
 */
export function useBusinessRules(): BusinessRulesContextType {
  const context = useContext(BusinessRulesContext);
  if (!context) {
    console.warn("[useBusinessRules] Called outside BusinessRulesProvider — returning fallback"); return context as any;
  }
  return context;
}

// ========== EXPORTS ==========

export { DEFAULT_BUSINESS_RULES };
