/**
 * MigrationInitializer - Runs data migrations on app startup
 *
 * Automatically migrates legacy data to new schema versions
 * Runs ONCE per migration version with full backup + rollback support
 *
 * Current migrations:
 * - Payroll City Isolation (V1): Adds cityId + stateCode to payroll data
 */

import { useEffect, useState } from "react";
import { runPayrollMigration, getMigrationMetadata } from "../services/migration/payrollMigrationService";
import { logger } from "../services/logger";

export function MigrationInitializer() {
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    // Run migrations only once per session
    if (hasRun) return;

    const runMigrations = async () => {
      try {
        logger.log("Starting migration initializer");

        // Run payroll city migration
        const payrollMetadata = runPayrollMigration();

        if (payrollMetadata.status === "SUCCESS") {
          logger.log("All migrations completed successfully", {
            payrollRuns: payrollMetadata.recordsMigrated.payrollRuns,
            salaryStructures: payrollMetadata.recordsMigrated.salaryStructures,
            cityDistribution: payrollMetadata.cityDistribution
          });
        } else if (payrollMetadata.status === "PARTIAL") {
          logger.warn("Migrations completed with warnings", {
            error: payrollMetadata.errorMessage
          });
        } else {
          logger.error("Migrations failed", {
            error: payrollMetadata.errorMessage
          });
        }

        setHasRun(true);

      } catch (error) {
        logger.error("Migration initializer failed", error);
        setHasRun(true); // Don't retry on error
      }
    };

    runMigrations();
  }, [hasRun]);

  // This component doesn't render anything
  return null;
}

/**
 * Debug component to display migration status (Admin only)
 * Usage: Add to admin panel or debug tools
 */
export function MigrationDebugPanel() {
  const metadata = getMigrationMetadata();

  if (!metadata) {
    return (
      <div className="p-4 bg-gray-100 rounded">
        <h3 className="font-bold">Migration Status</h3>
        <p className="text-gray-600">No migrations have run yet</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 rounded space-y-3">
      <h3 className="font-bold">Migration Status</h3>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="font-medium">Version:</div>
        <div>{metadata.version}</div>

        <div className="font-medium">Status:</div>
        <div>
          <span
            className={`px-2 py-1 rounded text-xs ${
              metadata.status === "SUCCESS"
                ? "bg-green-100 text-green-800"
                : metadata.status === "PARTIAL"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {metadata.status}
          </span>
        </div>

        <div className="font-medium">Timestamp:</div>
        <div>{new Date(metadata.timestamp).toLocaleString()}</div>

        <div className="font-medium">Payroll Runs:</div>
        <div>{metadata.recordsMigrated.payrollRuns}</div>

        <div className="font-medium">Salary Structures:</div>
        <div>{metadata.recordsMigrated.salaryStructures}</div>
      </div>

      {metadata.detectionConfidence && (
        <div className="mt-3">
          <h4 className="font-medium text-sm mb-2">AI Detection Confidence:</h4>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-green-700">High Confidence:</span>
              <span className="font-medium">{metadata.detectionConfidence.high}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-blue-700">Medium Confidence:</span>
              <span className="font-medium">{metadata.detectionConfidence.medium}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-orange-700">Low Confidence:</span>
              <span className="font-medium">{metadata.detectionConfidence.low}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-red-700">Very Low Confidence:</span>
              <span className="font-medium">{metadata.detectionConfidence.veryLow}</span>
            </div>
          </div>
        </div>
      )}

      {metadata.cityDistribution && Object.keys(metadata.cityDistribution).length > 0 && (
        <div className="mt-3">
          <h4 className="font-medium text-sm mb-2">City Distribution:</h4>
          <div className="space-y-1">
            {Object.entries(metadata.cityDistribution).map(([city, count]) => (
              <div key={city} className="flex justify-between text-sm">
                <span>{city}:</span>
                <span className="font-medium">{count} records</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {metadata.errorMessage && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
          <p className="text-xs text-red-800">{metadata.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
