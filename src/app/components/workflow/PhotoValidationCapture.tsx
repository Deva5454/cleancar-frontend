/**
 * Photo Validation Capture Component
 * Captures photos with AI validation
 * Shows processing states and validation results
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import type { PhotoCaptureState, AIValidationResult } from "../../types/workflowControl";

interface PhotoValidationCaptureProps {
  photoNumber: number;
  totalPhotos: number;
  taskName: string;
  onPhotoValidated: (photoUrl: string) => void;
  onValidationFailed: (error: string) => void;
  validatePhoto: (photoUrl: string) => Promise<AIValidationResult>;
}

export function PhotoValidationCapture({
  photoNumber,
  totalPhotos,
  taskName,
  onPhotoValidated,
  onValidationFailed,
  validatePhoto,
}: PhotoValidationCaptureProps) {
  const [captureState, setCaptureState] = useState<PhotoCaptureState>("IDLE");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<AIValidationResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const handleCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPhotoPreview(dataUrl);
      processPhoto(dataUrl);
    };
    reader.readAsDataURL(file);

    setCaptureState("CAPTURING");
  };

  const processPhoto = async (photoUrl: string) => {
    setCaptureState("PROCESSING");

    try {
      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Validate photo
      const result = await validatePhoto(photoUrl);
      setValidationResult(result);

      if (result.success) {
        setCaptureState("SUCCESS");
        setTimeout(() => {
          onPhotoValidated(photoUrl);
        }, 1000);
      } else {
        setCaptureState("FAILED");
        onValidationFailed(result.errors.join(", "));
      }
    } catch (error) {
      setCaptureState("FAILED");
      setValidationResult({
        success: false,
        validationType: "PHOTO_QUALITY",
        confidence: 0,
        errors: ["Photo processing failed"],
        warnings: [],
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleRetake = () => {
    if (retryCount >= maxRetries) {
      onValidationFailed("Maximum retry attempts reached. Please contact supervisor.");
      return;
    }

    setRetryCount(retryCount + 1);
    setCaptureState("IDLE");
    setPhotoPreview(null);
    setValidationResult(null);
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-gray-900">{taskName}</h3>
            <p className="text-sm text-gray-600">
              Photo {photoNumber} of {totalPhotos}
            </p>
          </div>
          <Badge
            className={
              captureState === "SUCCESS"
                ? "bg-green-600"
                : captureState === "FAILED"
                ? "bg-red-600"
                : captureState === "PROCESSING"
                ? "bg-blue-600"
                : "bg-gray-600"
            }
          >
            {captureState}
          </Badge>
        </div>

        {/* Capture Interface */}
        {captureState === "IDLE" && (
          <div className="space-y-4">
            <div className="border-4 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Tap to capture photo</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCapture}
                className="hidden"
                id={`photo-input-${photoNumber}`}
              />
              <label htmlFor={`photo-input-${photoNumber}`}>
                <Button size="lg" className="cursor-pointer" asChild>
                  <span>
                    <Camera className="w-5 h-5 mr-2" />
                    Open Camera
                  </span>
                </Button>
              </label>
            </div>

            {retryCount > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  Retry {retryCount}/{maxRetries}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Processing State */}
        {captureState === "PROCESSING" && (
          <div className="space-y-4">
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-blue-900/60 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                    <p className="font-semibold text-lg">Validating Photo...</p>
                    <p className="text-sm opacity-90">AI processing in progress</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success State */}
        {captureState === "SUCCESS" && (
          <div className="space-y-4">
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Validated"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-green-900/60 rounded-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <CheckCircle className="w-16 h-16 mx-auto mb-3" />
                    <p className="font-bold text-xl">✓ Validated</p>
                    {validationResult && (
                      <p className="text-sm opacity-90">
                        Confidence: {Math.round(validationResult.confidence * 100)}%
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failed State */}
        {captureState === "FAILED" && (
          <div className="space-y-4">
            {photoPreview && (
              <div className="relative">
                <img
                  src={photoPreview}
                  alt="Failed"
                  className="w-full h-64 object-cover rounded-lg opacity-50"
                />
              </div>
            )}

            <div className="p-4 bg-red-50 border-2 border-red-300 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">Validation Failed</p>
                  {validationResult?.errors.map((error, idx) => (
                    <p key={idx} className="text-sm text-red-800">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleRetake}
                  variant="destructive"
                  className="w-full"
                  disabled={retryCount >= maxRetries}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={handleRetake} variant="outline" className="w-full">
                  Retry Validation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Validation Details */}
        {validationResult && captureState !== "PROCESSING" && (
          <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-xs font-semibold text-gray-700 mb-2">Validation Details:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-mono">{validationResult.validationType}</span>
              </div>
              <div>
                <span className="text-gray-600">Confidence:</span>
                <span className="ml-2 font-mono">
                  {Math.round(validationResult.confidence * 100)}%
                </span>
              </div>
            </div>
            {validationResult.warnings.length > 0 && (
              <div className="mt-2">
                <p className="text-amber-700 text-xs">
                  ⚠️ {validationResult.warnings.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
