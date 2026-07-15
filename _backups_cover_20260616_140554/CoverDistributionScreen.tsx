/**
 * MODULE 1: Cover Car Redistribution
 * Review → Adjust → Confirm system-generated allocation
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle, Plus, Minus, Users, MapPin, Phone } from "lucide-react";
import type { CoverAssignmentPlan } from "../../services/coverRedistributionService";
import { ReassignCoverModal } from "./ReassignCoverModal";

export interface CoverDistributionScreenProps {
  plan: CoverAssignmentPlan | null;
  currentTime: Date;
  onAdjustCover: (washerId: string, newUnits: number) => void;
  onConfirmAndNotify: () => void;
  onReassign: (fromWasherId: string, toWasherId: string, units: number) => void;
  onEscalate: (reason?: string) => void;
  onContactCustomers: () => void; // UI Label: "Adjust Allocation" - Internal reallocation, not customer contact
}

export function CoverDistributionScreen({
  plan,
  currentTime,
  onAdjustCover,
  onConfirmAndNotify,
  onReassign,
  onEscalate,
  onContactCustomers,
}: CoverDistributionScreenProps) {
  // Handle null plan - show loading state
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Initializing Cover Plan
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we load team data and generate the cover assignment plan...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [localPlan, setLocalPlan] = useState(plan);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, { exceededBy: number }>>({});
  const [omNotified, setOmNotified] = useState(false);
  const [omAcknowledged, setOmAcknowledged] = useState(false);

  // Check for pending alert (7:45 AM)
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  const isPendingAlert = hour === 7 && minute >= 45;
  const pendingUnits = localPlan.coverWashers.reduce(
    (sum, w) => sum + (w.isAcknowledged ? 0 : w.coverAssigned),
    0
  );
  const showPendingAlert = isPendingAlert && pendingUnits >= 3;

  const handleAdjust = (washerId: string, delta: number) => {
    const washer = localPlan.coverWashers.find((w) => w.id === washerId);
    if (!washer) return;

    // Remove hard limit - allow override beyond 5
    const newUnits = Math.max(0, washer.coverAssigned + delta);
    onAdjustCover(washerId, newUnits);

    // Track override if exceeding recommended max (5 units)
    const RECOMMENDED_MAX = 5;
    if (newUnits > RECOMMENDED_MAX) {
      const exceededBy = newUnits - RECOMMENDED_MAX;
      setOverrides((prev) => ({
        ...prev,
        [washerId]: { exceededBy },
      }));

      // Trigger OM notification on first override
      if (!omNotified) {
        onEscalate("COVER_OVERRIDE");
        setOmNotified(true);
      }
    } else {
      // Remove override if back within limit
      setOverrides((prev) => {
        const updated = { ...prev };
        delete updated[washerId];
        return updated;
      });
    }

    // Update local state
    setLocalPlan({
      ...localPlan,
      coverWashers: localPlan.coverWashers.map((w) =>
        w.id === washerId
          ? { ...w, coverAssigned: newUnits, totalUnits: w.baseUnits + newUnits }
          : w
      ),
    });
  };

  const handleReassignFromModal = (fromWasherId: string, toWasherId: string, units: number) => {
    // Call parent handler
    onReassign(fromWasherId, toWasherId, units);

    const toWasher = localPlan.coverWashers.find((w) => w.id === toWasherId);
    const RECOMMENDED_MAX = 5;

    // Update local state
    const updatedCoverWashers = localPlan.coverWashers.map((w) => {
      if (w.id === fromWasherId) {
        const newCoverAssigned = Math.max(0, w.coverAssigned - units);
        return { ...w, coverAssigned: newCoverAssigned, totalUnits: w.baseUnits + newCoverAssigned };
      }
      if (w.id === toWasherId) {
        const newCoverAssigned = w.coverAssigned + units;
        return { ...w, coverAssigned: newCoverAssigned, totalUnits: w.baseUnits + newCoverAssigned };
      }
      return w;
    });

    setLocalPlan({
      ...localPlan,
      coverWashers: updatedCoverWashers,
    });

    // Track override if applicable
    if (toWasher) {
      const newCoverAssigned = toWasher.coverAssigned + units;
      if (newCoverAssigned > RECOMMENDED_MAX) {
        const exceededBy = newCoverAssigned - RECOMMENDED_MAX;
        setOverrides((prev) => ({
          ...prev,
          [toWasherId]: { exceededBy },
        }));

        // Trigger OM notification on first override
        if (!omNotified) {
          onEscalate("COVER_OVERRIDE");
          setOmNotified(true);
        }
      }
    }

    // Close modal
    setIsReassignModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER - SUMMARY BAR */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Cover Redistribution</h1>
          <p className="text-sm text-teal-100">System Auto-Assignment</p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Absent Washer:</span>
            <span className="font-bold">{localPlan.absentWasher.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Units to Redistribute:</span>
            <span className="font-bold text-xl">{localPlan.totalRequired.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Total Cover Capacity:</span>
            <span className="font-semibold">
              {localPlan.coverWashers.length} washers × 5 = {localPlan.totalCapacity.toFixed(1)} units
            </span>
          </div>
          {localPlan.unassignedUnits > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Remaining Unassigned:</span>
              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                {localPlan.unassignedUnits.toFixed(1)} units
              </Badge>
            </div>
          )}
        </div>

        {/* Capacity Alert */}
        {!localPlan.isCapacitySufficient && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🔴 INSUFFICIENT COVER CAPACITY</span>
            </div>
            <p className="text-sm mb-2">
              Short by {localPlan.unassignedUnits.toFixed(1)} units. Action required.
            </p>
            <p className="text-xs text-white/90 mb-3 font-medium">
              ⚠️ Requires Ops Manager intervention
            </p>
            <div className="grid grid-cols-2 gap-2 relative z-10">
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 text-white border-white/40 hover:bg-white/30 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onContactCustomers();
                }}
                type="button"
              >
                Adjust Allocation
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="bg-white/20 text-white border-white/40 hover:bg-white/30 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEscalate();
                }}
                type="button"
              >
                Escalate to Ops Manager
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* OM NOTIFICATION BANNER */}
        {omNotified && (
          <Card className="border-2 border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-bold text-blue-700">
                  Override applied. Ops Manager notified for acknowledgment.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* COVER SHORTAGE ALERT */}
        {!localPlan.isCapacitySufficient && !omNotified && (
          <Card className="border-2 border-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <span className="font-bold text-amber-700">
                  ⚠️ Cover shortage detected — action required
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* PENDING ALERT (7:45 AM) */}
        {showPendingAlert && (
          <Card className="border-2 border-red-500 bg-red-50 animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-bold text-red-700">
                    🔴 {pendingUnits} Cover Units Pending — Action Required
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 relative z-10">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsReassignModalOpen(true);
                  }}
                  type="button"
                >
                  Reassign
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEscalate();
                  }}
                  type="button"
                >
                  Escalate to Ops
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AUTO-ASSIGNMENT VIEW */}
        <Card className="border-2 border-teal-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Auto-Assignment (System Generated)</CardTitle>
              <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300">
                Auto Assigned
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {localPlan.coverWashers.map((washer) => (
              <Card key={washer.id} className="border border-gray-300">
                <CardContent className="p-3">
                  {/* Row 1: Washer Info */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <div>
                        <p className="font-bold text-gray-900">{washer.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin className="h-3 w-3" />
                          <span>{washer.distanceKm.toFixed(1)} km away</span>
                        </div>
                      </div>
                    </div>
                    {washer.isAcknowledged ? (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Acknowledged
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                        ⏳ Pending
                      </Badge>
                    )}
                  </div>

                  {/* Row 2: Units Breakdown */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-2 py-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-xs text-gray-600">Base Units</p>
                      <p className="font-bold text-gray-900">{washer.baseUnits.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Cover Assigned</p>
                      <p className="font-bold text-teal-600">+{washer.coverAssigned.toFixed(1)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Units</p>
                      <p className="font-bold text-gray-900">{washer.totalUnits.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Row 3: Manual Adjustment */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Adjust Cover:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleAdjust(washer.id, -1)}
                        disabled={washer.coverAssigned <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-base font-bold text-gray-900 w-10 text-center">
                        {washer.coverAssigned.toFixed(1)}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => handleAdjust(washer.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Capacity Messages */}
                  {overrides[washer.id] ? (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded">
                      <p className="text-xs text-amber-800 font-medium text-center">
                        ⚠️ Override applied (+{overrides[washer.id].exceededBy.toFixed(1)} units above limit)
                      </p>
                    </div>
                  ) : washer.coverAssigned >= 5 ? (
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      💡 Recommended max: 5 units. You may override if required.
                    </p>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* CONFIRM AND NOTIFY */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-4">
            <Button
              className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
              onClick={onConfirmAndNotify}
              disabled={localPlan.status === "NOTIFIED"}
            >
              {localPlan.status === "NOTIFIED" ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Notification Sent
                </>
              ) : (
                "Confirm & Notify Cover Washers"
              )}
            </Button>
            {localPlan.status === "NOTIFIED" && (
              <p className="text-xs text-center text-gray-600 mt-2">
                Washers will acknowledge via app
              </p>
            )}
            {Object.keys(overrides).length > 0 && localPlan.status !== "NOTIFIED" && (
              <p className="text-xs text-center text-amber-700 mt-2 font-medium">
                ℹ️ Override applied. Ops Manager will acknowledge separately.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cover Status Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Assigned:</span>
              <span className="font-bold">
                {localPlan.coverWashers.reduce((sum, w) => sum + w.coverAssigned, 0).toFixed(1)} /{" "}
                {localPlan.totalRequired.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Acknowledged:</span>
              <span className="font-bold text-green-600">
                {localPlan.coverWashers.filter((w) => w.isAcknowledged).length} /{" "}
                {localPlan.coverWashers.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status:</span>
              {localPlan.isCapacitySufficient ? (
                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                  ✓ Fully Covered
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  ✗ Short by {localPlan.unassignedUnits.toFixed(1)}
                </Badge>
              )}
            </div>
            {Object.keys(overrides).length > 0 && (
              <>
                <div className="border-t pt-2 mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overrides Applied:</span>
                    <span className="font-bold text-amber-600">{Object.keys(overrides).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">OM Notification:</span>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                      {omAcknowledged ? "✓ Acknowledged" : "⏳ Pending"}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reassign Modal */}
      <ReassignCoverModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        coverWashers={localPlan.coverWashers}
        onReassign={handleReassignFromModal}
      />
    </div>
  );
}