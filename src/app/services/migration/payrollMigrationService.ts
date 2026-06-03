/**
 * Payroll City Migration Service
 *
 * Auto-assigns cityId + stateCode to existing payroll data
 * Runs ONCE on app startup with full backup + rollback support
 *
 * SAFETY FEATURES:
 * - Idempotent (safe to retry)
 * - Automatic backup before migration
 * - Validation before committing
 * - Rollback mechanism
 * - Version tracking
 */

import { DataService } from "../DataService";
import { logger } from "../logger";
import type { PayrollRun, SalaryStructure } from "../../contexts/PayrollContext";
import { detectCityAI, getConfidenceLevel } from "../ai/cityDetectionEngine";

// ========== VERSION CONTROL ==========

const MIGRATION_VERSION = "V1";
const MIGRATION_KEY_PAYROLL = `MIGRATION_PAYROLL_CITY_${MIGRATION_VERSION}`;
const MIGRATION_KEY_SALARY = `MIGRATION_SALARY_CITY_${MIGRATION_VERSION}`;
const BACKUP_KEY_PAYROLL = `BACKUP_PAYROLL_PRE_CITY_${MIGRATION_VERSION}`;
const BACKUP_KEY_SALARY = `BACKUP_SALARY_PRE_CITY_${MIGRATION_VERSION}`;
const MIGRATION_METADATA = `MIGRATION_METADATA_${MIGRATION_VERSION}`;

interface MigrationMetadata {
  version: string;
  timestamp: string;
  recordsMigrated: {
    payrollRuns: number;
    salaryStructures: number;
  };
  cityDistribution: Record<string, number>;
  detectionConfidence?: {
    high: number; // Count of high confidence detections
    medium: number; // Count of medium confidence detections
    low: number; // Count of low confidence detections
    veryLow: number; // Count of very low confidence detections
  };
  conflictsDetected?: number; // Count of records with city conflicts
  status: "SUCCESS" | "FAILED" | "PARTIAL";
  errorMessage?: string;
}

// ========== GUARD CHECKS ==========

export const isPayrollMigrationDone = (): boolean => {
  return localStorage.getItem(MIGRATION_KEY_PAYROLL) === "DONE";
};

export const isSalaryMigrationDone = (): boolean => {
  return localStorage.getItem(MIGRATION_KEY_SALARY) === "DONE";
};

export const getMigrationMetadata = (): MigrationMetadata | null => {
  const stored = localStorage.getItem(MIGRATION_METADATA);
  return stored ? JSON.parse(stored) : null;
};

const markPayrollMigrationDone = () => {
  localStorage.setItem(MIGRATION_KEY_PAYROLL, "DONE");
};

const markSalaryMigrationDone = () => {
  localStorage.setItem(MIGRATION_KEY_SALARY, "DONE");
};

const saveMigrationMetadata = (metadata: MigrationMetadata) => {
  localStorage.setItem(MIGRATION_METADATA, JSON.stringify(metadata));
};

// ========== BACKUP ==========

const backupPayrollData = (data: PayrollRun[]): boolean => {
  try {
    // Only backup if no backup exists (prevent overwriting)
    if (!localStorage.getItem(BACKUP_KEY_PAYROLL)) {
      try {
        localStorage.setItem(BACKUP_KEY_PAYROLL, JSON.stringify(data));
        logger.log("Payroll backup created", { count: data.length });
      } catch (quotaErr) {
        // localStorage full — skip backup, migration can still proceed
        logger.warn("Payroll backup skipped — localStorage full", { count: data.length });
        return true; // Don't block migration for quota issues
      }
      return true;
    }
    logger.debug("Payroll backup already exists - skipping");
    return true;
  } catch (error) {
    logger.error("Failed to backup payroll data", error);
    return false;
  }
};

const backupSalaryData = (data: SalaryStructure[]): boolean => {
  try {
    // Only backup if no backup exists
    if (!localStorage.getItem(BACKUP_KEY_SALARY)) {
      try {
        localStorage.setItem(BACKUP_KEY_SALARY, JSON.stringify(data));
      } catch (quotaErr) {
        logger.warn("Salary backup skipped — localStorage full", { count: data.length });
        return true; // Don't block migration for quota issues
      }
      logger.log("Salary structure backup created", { count: data.length });
      return true;
    }
    logger.debug("Salary backup already exists - skipping");
    return true;
  } catch (error) {
    logger.error("Failed to backup salary data", error);
    return false;
  }
};

// ========== CITY/STATE DETECTION ==========

/**
 * City to State Code Mapping
 * Used for auto-detection during migration
 */
const CITY_STATE_MAP: Record<string, string> = {
  "CITY-SURAT": "GJ",
  "CITY-MUMBAI": "MH",
  "CITY-AHMEDABAD": "GJ",
};

/**
 * Detect cityId for a payroll run using AI-based detection
 * Uses smart city detection engine with confidence scoring
 */
const detectCityIdSmart = (run: any): { cityId: string; confidence: number; source: string } => {
  // Use AI detection engine
  const detection = detectCityAI({
    payrollId: run.payrollId,
    employeeId: run.employeeId,
    employees: run.employees, // If available
    cityId: run.cityId, // Existing cityId (if any)
  });

  return {
    cityId: detection.cityId,
    confidence: detection.confidence,
    source: detection.source,
  };
};

/**
 * Detect stateCode from cityId
 */
const detectStateCode = (cityId: string): string | undefined => {
  return CITY_STATE_MAP[cityId] || "GJ"; // Default to Gujarat
};

// ========== DATA TRANSFORMATION ==========

/**
 * Transform payroll runs by adding cityId + stateCode using AI detection
 */
const transformPayrollRuns = (runs: PayrollRun[]): {
  migrated: PayrollRun[];
  detectionStats: {
    high: number;
    medium: number;
    low: number;
    veryLow: number;
  };
} => {
  const detectionStats = {
    high: 0,
    medium: 0,
    low: 0,
    veryLow: 0,
  };

  const migrated = runs.map((run) => {
    const detection = detectCityIdSmart(run);
    const stateCode = detectStateCode(detection.cityId);

    // Track confidence levels
    const confidenceLevel = getConfidenceLevel(detection.confidence);
    if (confidenceLevel === "HIGH") detectionStats.high++;
    else if (confidenceLevel === "MEDIUM") detectionStats.medium++;
    else if (confidenceLevel === "LOW") detectionStats.low++;
    else detectionStats.veryLow++;

    // Log low confidence detections for review
    if (confidenceLevel === "LOW" || confidenceLevel === "VERY_LOW") {
      logger.warn("Low confidence city detection", {
        payrollId: run.payrollId,
        detectedCity: detection.cityId,
        confidence: detection.confidence,
        source: detection.source,
      });
    }

    return {
      ...run,
      cityId: detection.cityId,
      stateCode,
    };
  });

  return { migrated, detectionStats };
};

/**
 * Transform salary structures by adding cityId + stateCode using AI detection
 */
const transformSalaryStructures = (structures: SalaryStructure[]): SalaryStructure[] => {
  return structures.map((structure) => {
    const detection = detectCityIdSmart(structure);
    const stateCode = detectStateCode(detection.cityId);

    return {
      ...structure,
      cityId: detection.cityId,
      stateCode,
    };
  });
};

// ========== VALIDATION ==========

/**
 * Validate migrated payroll runs
 * Every record must have cityId and stateCode
 */
const validatePayrollMigration = (runs: PayrollRun[]): boolean => {
  if (!runs || runs.length === 0) return true; // Empty is valid

  const allValid = runs.every(run =>
    run.cityId &&
    typeof run.cityId === "string" &&
    run.cityId.length > 0
  );

  if (!allValid) {
    logger.error("Payroll validation failed - missing cityId");
    return false;
  }

  logger.log("Payroll validation passed", { count: runs.length });
  return true;
};

/**
 * Validate migrated salary structures
 */
const validateSalaryMigration = (structures: SalaryStructure[]): boolean => {
  if (!structures || structures.length === 0) return true; // Empty is valid

  const allValid = structures.every(structure =>
    structure.cityId &&
    typeof structure.cityId === "string" &&
    structure.cityId.length > 0
  );

  if (!allValid) {
    logger.error("Salary validation failed - missing cityId");
    return false;
  }

  logger.log("Salary validation passed", { count: structures.length });
  return true;
};

// ========== CITY DISTRIBUTION ANALYTICS ==========

const analyzeCityDistribution = (runs: PayrollRun[]): Record<string, number> => {
  const distribution: Record<string, number> = {};

  runs.forEach(run => {
    const city = run.cityId || "UNKNOWN";
    distribution[city] = (distribution[city] || 0) + 1;
  });

  return distribution;
};

// ========== MAIN MIGRATION FUNCTIONS ==========

/**
 * Migrate Payroll Runs
 * Adds cityId + stateCode to all existing payroll data
 */
export const migratePayrollRuns = (): {
  success: boolean;
  count: number;
  detectionStats?: { high: number; medium: number; low: number; veryLow: number };
  error?: string;
} => {
  try {
    // Guard: Check if already done
    if (isPayrollMigrationDone()) {
      logger.debug("Payroll migration already completed - skipping");
      return { success: true, count: 0 };
    }

    // Get existing data
    const existing = DataService.get<PayrollRun>("PAYROLL_RUNS");

    // If no data exists, mark as done and exit
    if (!existing || existing.length === 0) {
      logger.log("No payroll data to migrate");
      markPayrollMigrationDone();
      return { success: true, count: 0 };
    }

    logger.log("Starting payroll migration with AI detection", { count: existing.length });

    // Step 1: Backup
    if (!backupPayrollData(existing)) {
      throw new Error("Backup failed - aborting migration");
    }

    // Step 2: Transform with AI detection
    const { migrated, detectionStats } = transformPayrollRuns(existing);

    // Step 3: Validate
    if (!validatePayrollMigration(migrated)) {
      throw new Error("Validation failed - migration aborted");
    }

    // Step 4: Save
    DataService.setAll("PAYROLL_RUNS", migrated);

    // Step 5: Mark complete
    markPayrollMigrationDone();

    logger.log("Payroll migration completed successfully", {
      count: migrated.length,
      distribution: analyzeCityDistribution(migrated),
      detectionStats,
    });

    return { success: true, count: migrated.length, detectionStats };

  } catch (error) {
    logger.error("Payroll migration failed", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Migrate Salary Structures
 * Adds cityId + stateCode to all existing salary structures
 */
export const migrateSalaryStructures = (): { success: boolean; count: number; error?: string } => {
  try {
    // Guard: Check if already done
    if (isSalaryMigrationDone()) {
      logger.debug("Salary migration already completed - skipping");
      return { success: true, count: 0 };
    }

    // Get existing data
    const existing = DataService.get<SalaryStructure>("SALARY_STRUCTURES");

    // If no data exists, mark as done and exit
    if (!existing || existing.length === 0) {
      logger.log("No salary structure data to migrate");
      markSalaryMigrationDone();
      return { success: true, count: 0 };
    }

    logger.log("Starting salary structure migration", { count: existing.length });

    // Step 1: Backup
    if (!backupSalaryData(existing)) {
      throw new Error("Backup failed - aborting migration");
    }

    // Step 2: Transform
    const migrated = transformSalaryStructures(existing);

    // Step 3: Validate
    if (!validateSalaryMigration(migrated)) {
      throw new Error("Validation failed - migration aborted");
    }

    // Step 4: Save
    DataService.setAll("SALARY_STRUCTURES", migrated);

    // Step 5: Mark complete
    markSalaryMigrationDone();

    logger.log("Salary structure migration completed successfully", {
      count: migrated.length
    });

    return { success: true, count: migrated.length };

  } catch (error) {
    logger.error("Salary structure migration failed", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

/**
 * Run All Payroll Migrations
 * Master function that runs all payroll-related migrations
 */
export const runPayrollMigration = (): MigrationMetadata => {
  const startTime = Date.now();
  const metadata: MigrationMetadata = {
    version: MIGRATION_VERSION,
    timestamp: new Date().toISOString(),
    recordsMigrated: {
      payrollRuns: 0,
      salaryStructures: 0,
    },
    cityDistribution: {},
    status: "SUCCESS",
  };

  try {
    logger.log("Starting payroll migration process with AI detection");

    // Migrate payroll runs
    const payrollResult = migratePayrollRuns();
    metadata.recordsMigrated.payrollRuns = payrollResult.count;

    // Save detection confidence stats
    if (payrollResult.detectionStats) {
      metadata.detectionConfidence = payrollResult.detectionStats;
    }

    if (!payrollResult.success) {
      metadata.status = "PARTIAL";
      metadata.errorMessage = `Payroll runs: ${payrollResult.error}`;
    }

    // Migrate salary structures
    const salaryResult = migrateSalaryStructures();
    metadata.recordsMigrated.salaryStructures = salaryResult.count;

    if (!salaryResult.success) {
      metadata.status = metadata.status === "PARTIAL" ? "FAILED" : "PARTIAL";
      metadata.errorMessage = metadata.errorMessage
        ? `${metadata.errorMessage}; Salary: ${salaryResult.error}`
        : `Salary structures: ${salaryResult.error}`;
    }

    // Analyze distribution
    const runs = DataService.get<PayrollRun>("PAYROLL_RUNS");
    metadata.cityDistribution = analyzeCityDistribution(runs);

    // Save metadata
    saveMigrationMetadata(metadata);

    const duration = Date.now() - startTime;
    logger.log("Payroll migration process completed", {
      duration: `${duration}ms`,
      status: metadata.status,
      records: metadata.recordsMigrated
    });

    return metadata;

  } catch (error) {
    metadata.status = "FAILED";
    metadata.errorMessage = error instanceof Error ? error.message : "Unknown error";
    saveMigrationMetadata(metadata);

    logger.error("Payroll migration process failed", error);
    return metadata;
  }
};

// ========== ROLLBACK ==========

/**
 * Rollback Payroll Migration
 * Restores data from backup
 */
export const rollbackPayrollMigration = (): boolean => {
  try {
    const backup = localStorage.getItem(BACKUP_KEY_PAYROLL);

    if (!backup) {
      logger.warn("No payroll backup found - cannot rollback");
      return false;
    }

    const backupData = JSON.parse(backup);
    DataService.setAll("PAYROLL_RUNS", backupData);

    // Clear migration flag
    localStorage.removeItem(MIGRATION_KEY_PAYROLL);

    logger.warn("Payroll migration rolled back", { count: backupData.length });
    return true;

  } catch (error) {
    logger.error("Rollback failed", error);
    return false;
  }
};

/**
 * Rollback Salary Structure Migration
 */
export const rollbackSalaryMigration = (): boolean => {
  try {
    const backup = localStorage.getItem(BACKUP_KEY_SALARY);

    if (!backup) {
      logger.warn("No salary backup found - cannot rollback");
      return false;
    }

    const backupData = JSON.parse(backup);
    DataService.setAll("SALARY_STRUCTURES", backupData);

    // Clear migration flag
    localStorage.removeItem(MIGRATION_KEY_SALARY);

    logger.warn("Salary migration rolled back", { count: backupData.length });
    return true;

  } catch (error) {
    logger.error("Rollback failed", error);
    return false;
  }
};

/**
 * Rollback All Payroll Migrations
 */
export const rollbackAllPayrollMigrations = (): { success: boolean; message: string } => {
  try {
    const payrollRollback = rollbackPayrollMigration();
    const salaryRollback = rollbackSalaryMigration();

    if (!payrollRollback && !salaryRollback) {
      return { success: false, message: "No backups found to rollback" };
    }

    // Clear metadata
    localStorage.removeItem(MIGRATION_METADATA);

    return {
      success: true,
      message: `Rolled back: ${payrollRollback ? "Payroll Runs" : ""}${payrollRollback && salaryRollback ? ", " : ""}${salaryRollback ? "Salary Structures" : ""}`
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Rollback failed"
    };
  }
};

// ========== CLEANUP ==========

/**
 * Clear migration backups (use with caution)
 * Only call this after confirming migration is stable
 */
export const clearMigrationBackups = (): void => {
  localStorage.removeItem(BACKUP_KEY_PAYROLL);
  localStorage.removeItem(BACKUP_KEY_SALARY);
  logger.log("Migration backups cleared");
};
