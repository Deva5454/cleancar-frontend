/**
 * Sync Status Badge
 * Shows sync status for individual jobs/actions
 * Used in job cards to indicate offline actions
 */

import { Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "../ui/badge";

export type SyncStatus = "PENDING" | "SYNCED" | "FAILED" | "SYNCING";

export interface SyncStatusBadgeProps {
  status: SyncStatus;
  compact?: boolean;
}

export function SyncStatusBadge({ status, compact = false }: SyncStatusBadgeProps) {
  if (status === "SYNCED") {
    return compact ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
        <CheckCircle className="h-3 w-3 mr-1" />
        Synced
      </Badge>
    );
  }

  if (status === "PENDING") {
    return compact ? (
      <Clock className="h-4 w-4 text-amber-600" />
    ) : (
      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
        <Clock className="h-3 w-3 mr-1" />
        Pending Sync
      </Badge>
    );
  }

  if (status === "SYNCING") {
    return compact ? (
      <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Syncing
      </Badge>
    );
  }

  if (status === "FAILED") {
    return compact ? (
      <AlertCircle className="h-4 w-4 text-red-600" />
    ) : (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        Sync Failed
      </Badge>
    );
  }

  return null;
}
