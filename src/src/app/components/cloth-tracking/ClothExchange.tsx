/**
 * Cloth Exchange Screen
 * Main screen with dirty/clean panels and real-time matching
 */

import { useState, useEffect } from "react";
import { useRole } from "../../contexts/RoleContext";
import { clothTrackingService } from "../../services/clothTrackingService";
import { BarcodeScanner, ScanFeedbackToast } from "./BarcodeScanner";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { CheckCircle, XCircle, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";
import type { ClothItem, ScanFeedback, MatchStatus } from "../../types/clothTracking";

export function ClothExchange() {
  const { currentUser, currentRole } = useRole();

  // Scanned cloths
  const [dirtyClothIds, setDirtyClothIds] = useState<string[]>([]);
  const [cleanClothIds, setCleanClothIds] = useState<string[]>([]);

  // UI State
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>({
    exterior: { dirty: 0, clean: 0, matched: true },
    interior: { dirty: 0, clean: 0, matched: true },
    allMatched: true,
  });

  // Calculate match status whenever cloths change
  useEffect(() => {
    if (clothTrackingService && clothTrackingService.calculateMatch) {
      const match = clothTrackingService.calculateMatch(
        dirtyClothIds,
        cleanClothIds
      );
      setMatchStatus(match);
    }
  }, [dirtyClothIds, cleanClothIds]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => setScanFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // === SCAN HANDLERS ===

  const handleDirtyScan = (barcode: string) => {
    // Check for duplicate
    if (dirtyClothIds.includes(barcode)) {
      showError("DUPLICATE", "Already scanned");
      return;
    }

    if (!clothTrackingService || !clothTrackingService.scanCloth) {
      showError("NOT_FOUND", "Service unavailable");
      return;
    }

    const result = clothTrackingService.scanCloth(barcode, "DIRTY");

    if (result.success && result.cloth) {
      // Add to dirty list
      setDirtyClothIds([...dirtyClothIds, barcode]);

      // Show success feedback
      setScanFeedback({
        type: "success",
        cloth: {
          shortId: result.cloth.shortId,
          type: result.cloth.type,
          status: "DIRTY",
        },
        timestamp: Date.now(),
      });
    } else if (result.error) {
      showError(result.error.type, result.error.message);
    }
  };

  const handleCleanScan = (barcode: string) => {
    // Check for duplicate
    if (cleanClothIds.includes(barcode)) {
      showError("DUPLICATE", "Already scanned");
      return;
    }

    if (!clothTrackingService || !clothTrackingService.scanCloth) {
      showError("NOT_FOUND", "Service unavailable");
      return;
    }

    const result = clothTrackingService.scanCloth(barcode, "CLEAN");

    if (result.success && result.cloth) {
      // Add to clean list
      setCleanClothIds([...cleanClothIds, barcode]);

      // Show success feedback
      setScanFeedback({
        type: "success",
        cloth: {
          shortId: result.cloth.shortId,
          type: result.cloth.type,
          status: "CLEAN",
        },
        timestamp: Date.now(),
      });
    } else if (result.error) {
      showError(result.error.type, result.error.message);
    }
  };

  const showError = (type: string, message: string) => {
    setErrorMessage(message);

    // Trigger error vibration
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  // === CONFIRM EXCHANGE ===

  const handleConfirm = () => {
    if (!matchStatus.allMatched) return;

    if (!clothTrackingService || !clothTrackingService.createExchange) {
      toast.error("Service unavailable. Please try again.");
      return;
    }

    // Create exchange record
    clothTrackingService.createExchange(
      currentUser.name,
      currentUser.name,
      currentRole,
      dirtyClothIds,
      cleanClothIds
    );

    // Show success dialog
    setSuccessDialogOpen(true);
    toast.success("Exchange confirmed!");

    // Auto-advance: dismiss dialog and reset after 2 seconds
    setTimeout(() => {
      setSuccessDialogOpen(false);
      setDirtyClothIds([]);
      setCleanClothIds([]);
    }, 2000);
  };

  // === RENDER ===

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Cloth Exchange</h1>
          <p className="text-sm text-gray-600 mt-1">
            Scan → Match → Confirm •{" "}
            <span className="font-medium">{currentRole}</span>
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 animate-shake">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT: DIRTY PANEL */}
          <Card className="bg-amber-50 border-2 border-amber-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-amber-900">Dirty</h2>
                  <p className="text-sm text-amber-700">Received</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-amber-900">
                    {dirtyClothIds.length}
                  </div>
                  <p className="text-xs text-amber-600">Total Scanned</p>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Exterior</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {matchStatus.exterior.dirty}
                  </p>
                </div>
                <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Interior</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {matchStatus.interior.dirty}
                  </p>
                </div>
              </div>

              {/* Scanner */}
              <div className="bg-white rounded-lg p-4 border-2 border-amber-400">
                <BarcodeScanner
                  onScan={handleDirtyScan}
                  placeholder="Scan dirty cloth"
                />
              </div>

              {/* Scanned Items Preview */}
              {dirtyClothIds.length > 0 && (
                <div className="mt-4 bg-white rounded-lg p-4 border">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Scanned Items
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {dirtyClothIds.slice(-5).map((id) => {
                      const cloth = clothTrackingService.getCloth(id);
                      return (
                        <Badge
                          key={id}
                          className={
                            cloth?.type === "EXTERIOR"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }
                        >
                          {cloth?.shortId}
                        </Badge>
                      );
                    })}
                    {dirtyClothIds.length > 5 && (
                      <Badge variant="outline">
                        +{dirtyClothIds.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* RIGHT: CLEAN PANEL */}
          <Card className="bg-green-50 border-2 border-green-300">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-green-900">Clean</h2>
                  <p className="text-sm text-green-700">Issued</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold text-green-900">
                    {cleanClothIds.length}
                  </div>
                  <p className="text-xs text-green-600">Total Scanned</p>
                </div>
              </div>

              {/* Counters */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Exterior</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {matchStatus.exterior.clean}
                  </p>
                </div>
                <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Interior</p>
                  <p className="text-4xl font-bold text-purple-600">
                    {matchStatus.interior.clean}
                  </p>
                </div>
              </div>

              {/* Scanner */}
              <div className="bg-white rounded-lg p-4 border-2 border-green-400">
                <BarcodeScanner
                  onScan={handleCleanScan}
                  placeholder="Scan clean cloth"
                />
              </div>

              {/* Scanned Items Preview */}
              {cleanClothIds.length > 0 && (
                <div className="mt-4 bg-white rounded-lg p-4 border">
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Scanned Items
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {cleanClothIds.slice(-5).map((id) => {
                      const cloth = clothTrackingService.getCloth(id);
                      return (
                        <Badge
                          key={id}
                          className={
                            cloth?.type === "EXTERIOR"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }
                        >
                          {cloth?.shortId}
                        </Badge>
                      );
                    })}
                    {cleanClothIds.length > 5 && (
                      <Badge variant="outline">
                        +{cleanClothIds.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Match Bar */}
        <Card className="mb-6 border-2">
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-600 mb-4 text-center">
              LIVE MATCH STATUS
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Exterior Match */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  matchStatus.exterior.matched
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">Exterior:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {matchStatus.exterior.dirty} / {matchStatus.exterior.clean}
                    </span>
                    {matchStatus.exterior.matched ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Interior Match */}
              <div
                className={`p-4 rounded-lg border-2 ${
                  matchStatus.interior.matched
                    ? "bg-green-50 border-green-300"
                    : "bg-red-50 border-red-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900">Interior:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {matchStatus.interior.dirty} / {matchStatus.interior.clean}
                    </span>
                    {matchStatus.interior.matched ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Confirm Button */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-4 rounded-lg shadow-lg">
          <Button
            onClick={handleConfirm}
            disabled={!matchStatus.allMatched || dirtyClothIds.length === 0}
            className={`w-full h-16 text-xl font-bold ${
              matchStatus.allMatched && dirtyClothIds.length > 0
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-300"
            }`}
          >
            {matchStatus.allMatched && dirtyClothIds.length > 0
              ? "✓ Confirm Exchange"
              : "⏳ Match Required"}
          </Button>
        </div>
      </div>

      {/* Scan Feedback Toast */}
      {scanFeedback && scanFeedback.type === "success" && scanFeedback.cloth && (
        <ScanFeedbackToast
          shortId={scanFeedback.cloth.shortId}
          type={scanFeedback.cloth.type}
          category={scanFeedback.cloth.status}
          success={true}
        />
      )}

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Exchange Confirmed!
            </DialogTitle>
            <DialogDescription className="text-base">
              Cloth exchange has been recorded successfully
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="text-center py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Exchange Complete
              </h3>
              <p className="text-gray-600">Ready for next exchange</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-600">Dirty Collected</p>
                <p className="text-3xl font-bold text-amber-900">{dirtyClothIds.length}</p>
              </div>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">Clean Issued</p>
                <p className="text-3xl font-bold text-green-900">{cleanClothIds.length}</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Auto-resetting for next exchange...
                </span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
