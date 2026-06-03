/**
 * OCR/AI Validation Fallback Component
 * Handles check-in and photo validation failures
 * Design Principle: Clear reason + next action
 */

import { useState } from "react";
import { Camera, AlertCircle, CheckCircle, RefreshCw, Shield } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

export type ValidationStatus = 
  | "VALIDATING"
  | "SUCCESS"
  | "FAILED"
  | "RETRY"
  | "PENDING_APPROVAL";

export interface OCRValidationFallbackProps {
  type: "CHECK_IN" | "VEHICLE_PHOTO" | "BEFORE_PHOTO" | "AFTER_PHOTO";
  status: ValidationStatus;
  attemptCount?: number;
  maxAttempts?: number;
  onRetry?: () => void;
  onContinue?: () => void;
  errorReason?: string;
}

export function OCRValidationFallback({
  type,
  status,
  attemptCount = 0,
  maxAttempts = 2,
  onRetry,
  onContinue,
  errorReason
}: OCRValidationFallbackProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const getTitle = () => {
    switch (type) {
      case "CHECK_IN":
        return "Check-In Verification";
      case "VEHICLE_PHOTO":
        return "Vehicle Verification";
      case "BEFORE_PHOTO":
        return "Before Photo Verification";
      case "AFTER_PHOTO":
        return "After Photo Verification";
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    onRetry?.();
    // Reset after animation
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Validating state
  if (status === "VALIDATING") {
    return (
      <Card className="border-2 border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Verifying {type === "CHECK_IN" ? "vehicle details" : "photo"}...
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Please wait
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Success state
  if (status === "SUCCESS") {
    return (
      <Card className="border-2 border-green-300 bg-green-50">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-medium text-green-900">
              Verification successful
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Failed - can retry
  if (status === "FAILED" || status === "RETRY") {
    const canRetry = attemptCount < maxAttempts;

    return (
      <Card className="border-2 border-amber-300 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                {type === "CHECK_IN" ? "Unable to verify vehicle details" : "Photo verification failed"}
              </h3>
              {errorReason && (
                <p className="text-sm text-gray-600 mt-1">
                  {errorReason}
                </p>
              )}
              <div className="mt-2">
                <Badge variant="outline" className="bg-white">
                  Attempt {attemptCount + 1} of {maxAttempts + 1}
                </Badge>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex flex-col gap-2">
                {canRetry && onRetry && (
                  <Button
                    onClick={handleRetry}
                    disabled={isRetrying}
                    className="w-full bg-amber-600 hover:bg-amber-700 h-12"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    {isRetrying ? 'Retrying...' : 'Retry Photo'}
                  </Button>
                )}
                {!canRetry && (
                  <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                    <p className="font-medium">Maximum attempts reached</p>
                    <p className="mt-1">Continuing with supervisor approval...</p>
                  </div>
                )}
              </div>

              {/* Help text */}
              <div className="mt-3 text-xs text-gray-500">
                <p className="font-medium mb-1">Tips for better verification:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Ensure good lighting</li>
                  <li>Keep camera steady</li>
                  <li>Capture full number plate</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending approval - max retries exhausted
  if (status === "PENDING_APPROVAL") {
    return (
      <Card className="border-2 border-purple-300 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-gray-900">
                Verification pending supervisor approval
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {type === "CHECK_IN" 
                  ? "Your check-in has been recorded and will be reviewed"
                  : "Your photo has been submitted for review"}
              </p>

              {/* Status indicator */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-purple-700 font-medium">Under review</span>
              </div>

              {/* What happens next */}
              <div className="mt-3 bg-white p-3 rounded-lg border border-purple-200">
                <p className="text-xs font-medium text-gray-900 mb-1">What happens next:</p>
                <p className="text-xs text-gray-600">
                  ✓ You can continue working normally<br />
                  ✓ Supervisor will review within 15 minutes<br />
                  ✓ You'll be notified of the outcome
                </p>
              </div>

              {onContinue && (
                <Button
                  onClick={onContinue}
                  className="w-full mt-3 h-12 bg-purple-600 hover:bg-purple-700"
                >
                  Continue Working
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
