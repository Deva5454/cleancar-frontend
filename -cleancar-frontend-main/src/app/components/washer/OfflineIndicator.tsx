/**
 * Offline Mode Indicator
 * Shows offline state and sync status
 * Design Principle: Clear, minimal, actionable
 */

import { WifiOff, Wifi, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export type OfflineState = 
  | "ONLINE"
  | "OFFLINE" 
  | "SYNCING"
  | "SYNC_FAILED"
  | "SYNCED";

export interface OfflineIndicatorProps {
  state: OfflineState;
  pendingSyncCount?: number;
  lastSyncTime?: Date | null;
  onRetrySync?: () => void;
}

export function OfflineIndicator({ 
  state, 
  pendingSyncCount = 0, 
  lastSyncTime,
  onRetrySync 
}: OfflineIndicatorProps) {
  // Online - minimal indicator
  if (state === "ONLINE" && pendingSyncCount === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <Wifi className="h-4 w-4 text-green-600" />
        <span className="text-xs font-medium text-green-700">Online</span>
      </div>
    );
  }

  // Offline mode - prominent banner
  if (state === "OFFLINE") {
    return (
      <Card className="border-2 border-amber-300 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <WifiOff className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Offline Mode
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Data will sync when connected
              </p>
              {pendingSyncCount > 0 && (
                <div className="mt-2">
                  <Badge variant="outline" className="bg-white">
                    {pendingSyncCount} {pendingSyncCount === 1 ? 'action' : 'actions'} pending sync
                  </Badge>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                ✓ You can continue working normally
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Syncing state
  if (state === "SYNCING") {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Syncing data...
              </p>
              {pendingSyncCount > 0 && (
                <p className="text-xs text-blue-700 mt-0.5">
                  {pendingSyncCount} {pendingSyncCount === 1 ? 'item' : 'items'} remaining
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sync failed
  if (state === "SYNC_FAILED") {
    return (
      <Card className="border-2 border-red-300 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Sync Failed
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Retrying automatically...
              </p>
              {onRetrySync && (
                <button
                  onClick={onRetrySync}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
                >
                  Retry now
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Successfully synced
  if (state === "SYNCED") {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                Data synced successfully
              </p>
              {lastSyncTime && (
                <p className="text-xs text-green-700 mt-0.5">
                  {lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
