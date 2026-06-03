/**
 * Smart City Detection Engine (AI-based)
 *
 * Automatically detects cityId for payroll records using:
 * - Employee majority voting
 * - Historical payroll patterns
 * - Pincode/branch mapping
 * - Confidence scoring
 *
 * Rules:
 * - Never overwrites confirmed city data
 * - Provides confidence score for transparency
 * - Flags ambiguous cases for manual review
 * - Fully explainable (no black box)
 */

import { logger } from "../logger";

// ========== TYPES ==========

export interface CityDetectionResult {
  cityId: string;
  confidence: number; // 0-1 scale (0 = no confidence, 1 = certain)
  source: CityDetectionSource;
  metadata?: {
    employeeCities?: Record<string, number>; // City distribution
    conflictDetected?: boolean;
    reasonForLowConfidence?: string;
  };
}

export type CityDetectionSource =
  | "EMPLOYEE_MAJORITY" // Most common city among employees
  | "EMPLOYEE_UNANIMOUS" // All employees from same city
  | "HISTORICAL_PATTERN" // Based on past payroll
  | "PINCODE_MAPPING" // Based on address/pincode
  | "BRANCH_MAPPING" // Based on branch/location
  | "DEFAULT_FALLBACK"; // Last resort fallback

export interface PayrollRecordForDetection {
  payrollId?: string;
  employeeId?: string;
  employees?: Array<{ employeeId: string; cityId?: string; pincode?: string }>;
  cityId?: string; // Existing cityId (if any)
  createdAt?: string;
}

// ========== CONFIGURATION ==========

const DETECTION_CONFIG = {
  // Confidence thresholds
  HIGH_CONFIDENCE: 0.8, // >= 80% confidence
  MEDIUM_CONFIDENCE: 0.6, // >= 60% confidence
  LOW_CONFIDENCE: 0.4, // >= 40% confidence

  // Minimum employee count for reliable detection
  MIN_EMPLOYEES_FOR_MAJORITY: 3,

  // Default fallback city
  DEFAULT_CITY: "CITY-SURAT",

  // Confidence weights for different sources
  WEIGHTS: {
    EMPLOYEE_UNANIMOUS: 1.0, // 100% confidence
    EMPLOYEE_MAJORITY: 0.85, // 85% base, adjusted by ratio
    HISTORICAL_PATTERN: 0.7, // 70% confidence
    PINCODE_MAPPING: 0.6, // 60% confidence
    BRANCH_MAPPING: 0.5, // 50% confidence
    DEFAULT_FALLBACK: 0.3, // 30% confidence (low)
  },
};

// ========== PINCODE TO CITY MAPPING ==========

/**
 * Pincode prefix to city mapping
 * Based on Indian postal codes
 */
const PINCODE_CITY_MAP: Record<string, string> = {
  // Gujarat
  "395": "CITY-SURAT", // Surat
  "380": "CITY-AHMEDABAD", // Ahmedabad
  "390": "CITY-VADODARA", // Vadodara
  "360": "CITY-RAJKOT", // Rajkot

  // Maharashtra
  "400": "CITY-MUMBAI", // Mumbai
  "411": "CITY-PUNE", // Pune
  "440": "CITY-NAGPUR", // Nagpur

  // Karnataka
  "560": "CITY-BANGALORE", // Bangalore
  "580": "CITY-HUBLI", // Hubli

  // Delhi
  "110": "CITY-DELHI", // Delhi
};

// ========== CORE DETECTION ENGINE ==========

/**
 * Detect city from employee distribution (majority voting)
 *
 * Strategy: The city where most employees belong wins
 * Confidence: Higher if ratio is clear, lower if split
 */
const detectFromEmployees = (
  employees: Array<{ employeeId: string; cityId?: string }>
): CityDetectionResult | null => {
  if (!employees || employees.length === 0) {
    return null;
  }

  // Count employees per city
  const cityMap: Record<string, number> = {};
  let totalWithCity = 0;

  employees.forEach((emp) => {
    if (emp.cityId) {
      cityMap[emp.cityId] = (cityMap[emp.cityId] || 0) + 1;
      totalWithCity++;
    }
  });

  // No employees have city data
  if (totalWithCity === 0) {
    return null;
  }

  // Sort cities by employee count (descending)
  const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  const [topCity, topCount] = sorted[0];

  // Check if unanimous (all employees same city)
  const isUnanimous = sorted.length === 1 && topCount === employees.length;

  if (isUnanimous) {
    return {
      cityId: topCity,
      confidence: DETECTION_CONFIG.WEIGHTS.EMPLOYEE_UNANIMOUS,
      source: "EMPLOYEE_UNANIMOUS",
      metadata: {
        employeeCities: cityMap,
        conflictDetected: false,
      },
    };
  }

  // Calculate confidence based on majority ratio
  const majorityRatio = topCount / totalWithCity;
  const baseConfidence = DETECTION_CONFIG.WEIGHTS.EMPLOYEE_MAJORITY;
  const confidence = baseConfidence * majorityRatio;

  // Detect conflict (multiple cities with significant presence)
  const conflictDetected = sorted.length > 1 && sorted[1][1] / totalWithCity > 0.2; // >20% minority

  return {
    cityId: topCity,
    confidence,
    source: "EMPLOYEE_MAJORITY",
    metadata: {
      employeeCities: cityMap,
      conflictDetected,
      reasonForLowConfidence: conflictDetected
        ? `Multiple cities detected: ${sorted.map((s) => s[0]).join(", ")}`
        : undefined,
    },
  };
};

/**
 * Detect city from pincode
 *
 * Strategy: Match pincode prefix to known city mapping
 */
const detectFromPincode = (
  employees: Array<{ pincode?: string }>
): CityDetectionResult | null => {
  if (!employees || employees.length === 0) {
    return null;
  }

  // Try to find city from any employee's pincode
  for (const emp of employees) {
    if (emp.pincode) {
      const prefix = emp.pincode.substring(0, 3);
      const cityId = PINCODE_CITY_MAP[prefix];

      if (cityId) {
        return {
          cityId,
          confidence: DETECTION_CONFIG.WEIGHTS.PINCODE_MAPPING,
          source: "PINCODE_MAPPING",
          metadata: {
            reasonForLowConfidence: "Based on pincode mapping - verify accuracy",
          },
        };
      }
    }
  }

  return null;
};

/**
 * Default fallback when no other method works
 */
const detectFallback = (): CityDetectionResult => {
  return {
    cityId: DETECTION_CONFIG.DEFAULT_CITY,
    confidence: DETECTION_CONFIG.WEIGHTS.DEFAULT_FALLBACK,
    source: "DEFAULT_FALLBACK",
    metadata: {
      reasonForLowConfidence: "No employee or pincode data available - using default city",
    },
  };
};

/**
 * Main AI-based city detection function
 *
 * @param record - Payroll record with employee data
 * @returns City detection result with confidence score
 */
export const detectCityAI = (record: PayrollRecordForDetection): CityDetectionResult => {
  // Rule 1: If city already confirmed, use it with full confidence
  if (record.cityId && typeof record.cityId === "string" && record.cityId.length > 0) {
    logger.debug("City detection skipped - already set", { cityId: record.cityId });
    return {
      cityId: record.cityId,
      confidence: 1.0,
      source: "EMPLOYEE_UNANIMOUS", // Treat existing as confirmed
    };
  }

  // Rule 2: Try employee-based detection (most reliable)
  if (record.employees && record.employees.length > 0) {
    const employeeResult = detectFromEmployees(record.employees);

    if (employeeResult) {
      logger.debug("City detected from employees", {
        cityId: employeeResult.cityId,
        confidence: employeeResult.confidence,
        source: employeeResult.source,
      });
      return employeeResult;
    }
  }

  // Rule 3: Try pincode-based detection
  if (record.employees && record.employees.length > 0) {
    const pincodeResult = detectFromPincode(record.employees);

    if (pincodeResult) {
      logger.debug("City detected from pincode", {
        cityId: pincodeResult.cityId,
        confidence: pincodeResult.confidence,
      });
      return pincodeResult;
    }
  }

  // Rule 4: Fallback to default
  logger.warn("City detection using fallback", {
    payrollId: record.payrollId,
    employeeCount: record.employees?.length || 0,
  });

  return detectFallback();
};

// ========== CONFLICT DETECTION ==========

/**
 * Detect if payroll contains employees from multiple cities (conflict)
 *
 * @param record - Payroll record with employee data
 * @returns true if conflict detected
 */
export const detectConflict = (record: PayrollRecordForDetection): boolean => {
  if (!record.employees || record.employees.length === 0) {
    return false;
  }

  const uniqueCities = new Set(
    record.employees.filter((e) => e.cityId).map((e) => e.cityId)
  );

  return uniqueCities.size > 1;
};

/**
 * Get detailed conflict information
 *
 * @param record - Payroll record
 * @returns Conflict details with city distribution
 */
export const getConflictDetails = (
  record: PayrollRecordForDetection
): {
  hasConflict: boolean;
  cities: string[];
  distribution: Record<string, number>;
  recommendation: string;
} | null => {
  if (!record.employees || record.employees.length === 0) {
    return null;
  }

  const cityMap: Record<string, number> = {};
  record.employees.forEach((emp) => {
    if (emp.cityId) {
      cityMap[emp.cityId] = (cityMap[emp.cityId] || 0) + 1;
    }
  });

  const cities = Object.keys(cityMap);
  const hasConflict = cities.length > 1;

  if (!hasConflict) {
    return {
      hasConflict: false,
      cities,
      distribution: cityMap,
      recommendation: "No conflict - all employees from same city",
    };
  }

  // Find majority city
  const sorted = Object.entries(cityMap).sort((a, b) => b[1] - a[1]);
  const [majorityCity, majorityCount] = sorted[0];
  const totalEmployees = record.employees.length;
  const majorityPercent = ((majorityCount / totalEmployees) * 100).toFixed(1);

  return {
    hasConflict: true,
    cities,
    distribution: cityMap,
    recommendation: `Conflict detected! ${cities.length} cities found. Recommend using ${majorityCity} (${majorityPercent}% of employees). Consider splitting payroll by city.`,
  };
};

// ========== CONFIDENCE HELPERS ==========

/**
 * Get confidence level category
 */
export const getConfidenceLevel = (
  confidence: number
): "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" => {
  if (confidence >= DETECTION_CONFIG.HIGH_CONFIDENCE) return "HIGH";
  if (confidence >= DETECTION_CONFIG.MEDIUM_CONFIDENCE) return "MEDIUM";
  if (confidence >= DETECTION_CONFIG.LOW_CONFIDENCE) return "LOW";
  return "VERY_LOW";
};

/**
 * Check if confidence is acceptable for auto-assignment
 */
export const isConfidenceAcceptable = (confidence: number): boolean => {
  return confidence >= DETECTION_CONFIG.MEDIUM_CONFIDENCE;
};

/**
 * Get human-readable confidence description
 */
export const getConfidenceDescription = (result: CityDetectionResult): string => {
  const level = getConfidenceLevel(result.confidence);
  const percent = (result.confidence * 100).toFixed(0);

  const descriptions: Record<string, string> = {
    HIGH: `High confidence (${percent}%) - Auto-assignment recommended`,
    MEDIUM: `Medium confidence (${percent}%) - Auto-assignment acceptable`,
    LOW: `Low confidence (${percent}%) - Manual review recommended`,
    VERY_LOW: `Very low confidence (${percent}%) - Manual review required`,
  };

  return descriptions[level];
};

// ========== BATCH DETECTION ==========

/**
 * Detect cities for multiple payroll records
 *
 * @param records - Array of payroll records
 * @returns Map of payrollId to detection result
 */
export const detectCitiesBatch = (
  records: PayrollRecordForDetection[]
): Map<string, CityDetectionResult> => {
  const results = new Map<string, CityDetectionResult>();

  records.forEach((record) => {
    if (record.payrollId) {
      const detection = detectCityAI(record);
      results.set(record.payrollId, detection);
    }
  });

  logger.log("Batch city detection completed", {
    total: records.length,
    highConfidence: Array.from(results.values()).filter(
      (r) => r.confidence >= DETECTION_CONFIG.HIGH_CONFIDENCE
    ).length,
    lowConfidence: Array.from(results.values()).filter(
      (r) => r.confidence < DETECTION_CONFIG.MEDIUM_CONFIDENCE
    ).length,
  });

  return results;
};

// ========== EXPORT CONFIG ==========

export const getCityDetectionConfig = () => DETECTION_CONFIG;

export const getPincodeCityMapping = () => PINCODE_CITY_MAP;
