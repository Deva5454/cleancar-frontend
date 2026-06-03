/**
 * System State Indicators & Banners
 * Reusable UI components for system-level states
 */

import { Badge } from "../ui/badge";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  MapPin,
  Camera,
  QrCode,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

// ========== 1. OFFLINE MODE INDICATOR ==========

export interface OfflineBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export function OfflineBanner({ isVisible, onDismiss }: OfflineBannerProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-orange-500 text-white shadow-lg">
      <div className="px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          <span className="text-sm font-semibold">🟠 Offline Mode Active</span>
        </div>
        {onDismiss && (
          <button
            className="text-white hover:text-orange-200"
            onClick={onDismiss}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ========== 2. LOCAL SAVE CONFIRMATION ==========

export interface LocalSaveToastProps {
  isVisible: boolean;
  type: "AUDIT" | "LEAD";
  onDismiss: () => void;
}

export function LocalSaveToast({
  isVisible,
  type,
  onDismiss,
}: LocalSaveToastProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[60] bg-blue-50 border-2 border-blue-300 rounded-lg shadow-lg animate-slide-up">
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-sm text-blue-700">
            💾 Saved Locally — Sync Pending
          </h3>
          <button className="text-blue-700 hover:opacity-70" onClick={onDismiss}>
            ✕
          </button>
        </div>
        <p className="text-xs text-gray-700">
          {type === "AUDIT" ? "Audit" : "Lead"} will sync automatically when
          connection is restored
        </p>
      </div>
    </div>
  );
}

// ========== 3. SYNC STATUS INDICATOR ==========

export interface SyncStatusProps {
  status: "SYNCED" | "PENDING" | "FAILED";
  count?: number;
  onRetry?: () => void;
}

export function SyncStatus({ status, count, onRetry }: SyncStatusProps) {
  const configs = {
    SYNCED: {
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-300",
      label: "✅ Synced",
    },
    PENDING: {
      icon: RefreshCw,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      label: "🔄 Syncing...",
    },
    FAILED: {
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-300",
      label: "⚠️ Failed Sync",
    },
  }[status];

  const StatusIcon = configs.icon;

  return (
    <Card className={`border-2 ${configs.borderColor} ${configs.bgColor}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusIcon
              className={`h-4 w-4 ${configs.color} ${
                status === "PENDING" ? "animate-spin" : ""
              }`}
            />
            <div>
              <p className={`text-sm font-semibold ${configs.color}`}>
                {configs.label}
              </p>
              {count !== undefined && count > 0 && (
                <p className="text-xs text-gray-600">{count} items</p>
              )}
            </div>
          </div>
          {status === "FAILED" && onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onRetry}
            >
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ========== 4. OFFLINE ENTRY TAG ==========

export function OfflineEntryTag() {
  return (
    <Badge
      variant="outline"
      className="bg-orange-100 text-orange-700 border-orange-300 text-xs"
    >
      🟠 Offline Entry
    </Badge>
  );
}

// ========== 5. GPS EXCEPTION INDICATOR ==========

export interface GPSExceptionModalProps {
  isVisible: boolean;
  distance: number;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export function GPSExceptionModal({
  isVisible,
  distance,
  onSubmit,
  onCancel,
}: GPSExceptionModalProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-yellow-300 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-yellow-700" />
            <h3 className="font-bold text-sm text-gray-900">
              GPS Outside Ideal Range
            </h3>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Distance: {distance.toFixed(1)}m (Ideal: ≤10m)
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Please provide a reason to proceed with submission
          </p>
          <textarea
            id="gps-reason"
            className="w-full border-2 border-gray-300 rounded p-2 text-sm mb-3"
            rows={3}
            placeholder="Enter reason..."
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-yellow-600 hover:bg-yellow-700"
              onClick={() => {
                const textarea = document.getElementById(
                  "gps-reason"
                ) as HTMLTextAreaElement;
                if (textarea && textarea.value.trim()) {
                  onSubmit(textarea.value.trim());
                } else {
                  toast.error("Reason is required");
                }
              }}
            >
              Submit with Reason
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function GPSExceptionTag() {
  return (
    <Badge
      variant="outline"
      className="bg-yellow-100 text-yellow-700 border-yellow-300 text-xs"
    >
      🟠 GPS Exception
    </Badge>
  );
}

// ========== 6. DUPLICATE LEAD ALERT ==========

export interface DuplicateLeadAlertProps {
  isVisible: boolean;
  leadId: string;
  submittedDate: Date;
}

export function DuplicateLeadAlert({
  isVisible,
  leadId,
  submittedDate,
}: DuplicateLeadAlertProps) {
  if (!isVisible) return null;

  return (
    <Card className="border-2 border-red-300 bg-red-50 mt-3">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-700" />
          <h3 className="font-bold text-sm text-red-700">
            ❌ Lead Already Exists in System
          </h3>
        </div>
        <p className="text-xs text-red-600 mb-1">
          First submission retained: {leadId}
        </p>
        <p className="text-xs text-red-600">
          Submitted: {submittedDate.toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

// ========== 7. QR SCAN BUTTON ==========

export interface QRScanButtonProps {
  onScan: () => void;
  isScanning?: boolean;
}

export function QRScanButton({ onScan, isScanning }: QRScanButtonProps) {
  return (
    <Button
      variant="outline"
      className="border-2 border-blue-300 text-blue-700 hover:bg-blue-50"
      onClick={onScan}
      disabled={isScanning}
    >
      <QrCode className="h-4 w-4 mr-2" />
      {isScanning ? "Scanning..." : "Scan QR Code"}
    </Button>
  );
}

export function QRVerifiedBadge() {
  return (
    <Badge
      variant="outline"
      className="bg-green-100 text-green-700 border-green-300"
    >
      ✅ Batch Verified
    </Badge>
  );
}

// ========== 8. PHOTO AUTHENTICITY WARNING ==========

export interface PhotoAuthenticityWarningProps {
  isVisible: boolean;
  timestampMismatch?: boolean;
  gpsMismatch?: boolean;
  onProceed: () => void;
  onCancel: () => void;
}

export function PhotoAuthenticityWarning({
  isVisible,
  timestampMismatch,
  gpsMismatch,
  onProceed,
  onCancel,
}: PhotoAuthenticityWarningProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-amber-300 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Camera className="h-5 w-5 text-amber-700" />
            <h3 className="font-bold text-sm text-gray-900">
              ⚠️ Photo Metadata Mismatch
            </h3>
          </div>
          <div className="space-y-2 mb-3">
            {timestampMismatch && (
              <p className="text-sm text-amber-700">
                • Photo timestamp differs by more than 5 minutes
              </p>
            )}
            {gpsMismatch && (
              <p className="text-sm text-amber-700">
                • Photo location differs from submission location
              </p>
            )}
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Photo will be flagged for review. Do you want to proceed?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={onProceed}
            >
              Proceed (Flagged)
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PhotoFlaggedTag() {
  return (
    <Badge
      variant="outline"
      className="bg-amber-100 text-amber-700 border-amber-300 text-xs"
    >
      🚩 Photo Flagged
    </Badge>
  );
}

// ========== 9. LIVE KPI INDICATOR ==========

export interface LiveKPIIndicatorProps {
  label: string;
  value: number;
  trend: "UP" | "DOWN" | "STABLE";
  isLive?: boolean;
}

export function LiveKPIIndicator({
  label,
  value,
  trend,
  isLive = true,
}: LiveKPIIndicatorProps) {
  const TrendIcon = {
    UP: TrendingUp,
    DOWN: TrendingDown,
    STABLE: Minus,
  }[trend];

  const trendColor = {
    UP: "text-green-600",
    DOWN: "text-red-600",
    STABLE: "text-gray-600",
  }[trend];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{label}</span>
        {isLive && (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-700 border-blue-300 text-xs animate-pulse"
          >
            Live
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-gray-900">{value}</span>
        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
      </div>
    </div>
  );
}

// ========== 10. SLA TIMER ==========

export interface SLATimerProps {
  elapsedMinutes: number;
  slaBreached: boolean;
  escalationLevel: "SUPERVISOR" | "OPS_MANAGER" | "CITY_MANAGER";
}

export function SLATimer({
  elapsedMinutes,
  slaBreached,
  escalationLevel,
}: SLATimerProps) {
  const urgencyConfig = {
    SUPERVISOR: { color: "text-green-600", label: "On Track" },
    OPS_MANAGER: { color: "text-yellow-600", label: "Escalated to Ops" },
    CITY_MANAGER: { color: "text-red-600", label: "🔴 SLA Breach" },
  }[escalationLevel];

  const hours = Math.floor(elapsedMinutes / 60);
  const minutes = elapsedMinutes % 60;
  const timeDisplay =
    hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Clock className={`h-4 w-4 ${urgencyConfig.color}`} />
        <span className="text-xs text-gray-600">Response Time</span>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${urgencyConfig.color}`}>
          {timeDisplay}
        </p>
        <p className="text-xs text-gray-600">{urgencyConfig.label}</p>
      </div>
    </div>
  );
}

export function SLABreachTag() {
  return (
    <Badge
      variant="outline"
      className="bg-red-100 text-red-700 border-red-300 text-xs animate-pulse"
    >
      🔴 SLA Breach
    </Badge>
  );
}
