/**
 * Initialize HR Master System
 *
 * Run this once to set up the unified HR data structure
 * and sync existing legacy data
 */

import { hrDataSync } from "../services/hrDataSync";
import { logger } from "../services/logger";

/**
 * Initialize HR Master system
 */
export function initHRMaster(): void {
  logger.log("=== HR Master Initialization Started ===");

  try {
    // Run full sync
    const results = hrDataSync.syncAll();

    // Log results
    logger.log("HR Master Sync Results:", {
      employees: `${results.employees.synced} synced, ${results.employees.skipped} skipped, ${results.employees.failed} failed`,
      attendance: `${results.attendance.synced} synced, ${results.attendance.skipped} skipped, ${results.attendance.failed} failed`,
      payroll: `${results.payroll.synced} synced, ${results.payroll.skipped} skipped, ${results.payroll.failed} failed`,
      incentives: `${results.incentives.synced} synced, ${results.incentives.skipped} skipped, ${results.incentives.failed} failed`,
    });

    // Check for errors
    const hasErrors =
      results.employees.failed > 0 ||
      results.attendance.failed > 0 ||
      results.payroll.failed > 0 ||
      results.incentives.failed > 0;

    if (hasErrors) {
      logger.warn("HR Master initialization completed with errors");
      if (results.employees.errors.length > 0) {
        logger.error("Employee sync errors:", results.employees.errors);
      }
      if (results.attendance.errors.length > 0) {
        logger.error("Attendance sync errors:", results.attendance.errors);
      }
      if (results.payroll.errors.length > 0) {
        logger.error("Payroll sync errors:", results.payroll.errors);
      }
      if (results.incentives.errors.length > 0) {
        logger.error("Incentive sync errors:", results.incentives.errors);
      }
    } else {
      logger.log("✅ HR Master initialization completed successfully");
    }

    // Get final status
    const status = hrDataSync.getSyncStatus();
    logger.log("HR Master Status:", {
      employees: status.employeesInMaster,
      attendance: status.attendanceInMaster,
      payroll: status.payrollInMaster,
      incentives: status.incentivesInMaster,
      lastSync: status.lastSyncTime,
    });

    logger.log("=== HR Master Initialization Complete ===");
  } catch (error) {
    logger.error("HR Master initialization failed:", error);
    throw error;
  }
}

/**
 * Check if HR Master needs initialization
 */
export function needsInitialization(): boolean {
  const status = hrDataSync.getSyncStatus();

  // If no master records exist, needs initialization
  return (
    status.employeesInMaster === 0 &&
    status.attendanceInMaster === 0 &&
    status.payrollInMaster === 0 &&
    status.incentivesInMaster === 0
  );
}

/**
 * Auto-initialize on first run
 */
export function autoInitHRMaster(): void {
  // Check if already initialized
  const hasRun = localStorage.getItem("HR_MASTER_INITIALIZED");

  if (!hasRun) {
    logger.log("First run detected - initializing HR Master system");
    initHRMaster();
    try { localStorage.setItem("HR_MASTER_INITIALIZED", "true"); } catch(e) { /* quota full — ok */ }
  } else {
    logger.log("HR Master system already initialized");
  }
}
