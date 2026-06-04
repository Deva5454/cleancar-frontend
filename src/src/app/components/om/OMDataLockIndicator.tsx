/**
 * OPERATIONS MANAGER: DATA LOCK INDICATOR
 * Shown after midnight when payroll processing is active
 * All historical data becomes read-only
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Lock, Database, Clock, AlertTriangle } from "lucide-react";
import type { DataLockInfo, DataLockReason } from "../../types/operationsManager.types";

export interface OMDataLockIndicatorProps {
  lockInfo: DataLockInfo;
}

export interface OMDataLockBannerProps {
  lockReason: DataLockReason;
}

const LOCK_REASON_CONFIG: Record<DataLockReason, { label: string; description: string; bannerText: string }> = {
  PAYROLL_PROCESSING: {
    label: "Payroll Processing Active",
    description: "Daily payroll calculations are running. Historical data is locked to ensure accuracy.",
    bannerText: "🔒 Data Locked — Payroll Processing Active"
  },
  MONTH_END_CLOSE: {
    label: "Month-End Close in Progress",
    description: "Month-end financial close is in progress. All historical data is locked for reconciliation.",
    bannerText: "🔒 Data Locked — Month-End Close in Progress"
  },
  AUDIT_FREEZE: {
    label: "Audit Freeze Active",
    description: "System is in audit mode. Historical data cannot be modified during this period.",
    bannerText: "🔒 Data Locked — Audit Freeze Active"
  }
};

export function OMDataLockIndicator({ lockInfo }: OMDataLockIndicatorProps) {
  const config = LOCK_REASON_CONFIG[lockInfo.lockReason];

  return (
    <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-yellow-500 shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="p-3 bg-yellow-500 rounded-lg">
            <Lock className="h-8 w-8 text-gray-900" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Data Locked</h2>
              <Badge className="bg-yellow-500 text-gray-900 px-3 py-1 text-sm font-bold">
                {config.label}
              </Badge>
            </div>

            <p className="text-gray-300 mb-4">
              {config.description}
            </p>

            {/* Lock Details Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Lock Time */}
              <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm font-semibold text-gray-300">Lock Time</p>
                </div>
                <p className="text-lg font-bold text-white">
                  {lockInfo.lockDate.toLocaleString()}
                </p>
              </div>

              {/* Estimated Unlock */}
              {lockInfo.estimatedUnlockTime && (
                <div className="p-3 bg-gray-800 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-green-500" />
                    <p className="text-sm font-semibold text-gray-300">Estimated Unlock</p>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {lockInfo.estimatedUnlockTime.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Affected Modules */}
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Database className="h-5 w-5 text-blue-500" />
                <p className="text-sm font-semibold text-gray-300">Affected Modules (Read-Only)</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lockInfo.affectedModules.map((module) => (
                  <Badge key={module} className="bg-gray-700 text-white border border-gray-600">
                    {module}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Warning Notice */}
            <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <p className="text-sm text-red-200">
                  <strong>Important:</strong> You can view all data, but no modifications can be made until the lock is released.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * COMPACT VERSION (for headers/banners)
 */
export function OMDataLockBanner({ lockReason }: OMDataLockBannerProps) {
  const config = LOCK_REASON_CONFIG[lockReason];

  return (
    <div className="bg-gray-900 border-b-2 border-yellow-500 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
        <Lock className="h-5 w-5 text-yellow-500" />
        <p className="text-white font-semibold text-sm">
          {config.bannerText}
        </p>
        <Badge className="bg-yellow-500 text-gray-900 text-xs">
          READ-ONLY MODE
        </Badge>
      </div>
    </div>
  );
}
