/**
 * Reassign Cover Modal
 * Allows supervisor to reassign pending/unacknowledged cover units to different washers
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Users, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface CoverWasher {
  id: string;
  name: string;
  baseUnits: number;
  coverAssigned: number;
  totalUnits: number;
  isAcknowledged: boolean;
  distanceKm: number;
}

interface ReassignCoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  coverWashers: CoverWasher[];
  onReassign: (fromWasherId: string, toWasherId: string, units: number) => void;
}

export function ReassignCoverModal({
  isOpen,
  onClose,
  coverWashers,
  onReassign,
}: ReassignCoverModalProps) {
  const [selectedFromWasher, setSelectedFromWasher] = useState<string | null>(null);
  const [selectedToWasher, setSelectedToWasher] = useState<string | null>(null);
  const [unitsToReassign, setUnitsToReassign] = useState<number>(0);

  // Get pending washers (not acknowledged)
  const pendingWashers = coverWashers.filter((w) => !w.isAcknowledged && w.coverAssigned > 0);

  // Get available washers (can take more units)
  const availableWashers = coverWashers.filter((w) => w.totalUnits < 20); // Max 20 total units

  const fromWasher = coverWashers.find((w) => w.id === selectedFromWasher);
  const toWasher = coverWashers.find((w) => w.id === selectedToWasher);

  const maxReassignable = fromWasher ? fromWasher.coverAssigned : 0;
  // Allow override beyond recommended max (5), cap at total capacity (20)
  const maxAcceptable = toWasher ? 20 - toWasher.totalUnits : 0;

  const handleReassignClick = () => {
    if (!selectedFromWasher || !selectedToWasher || unitsToReassign <= 0) {
      return;
    }

    onReassign(selectedFromWasher, selectedToWasher, unitsToReassign);

    // Reset selection
    setSelectedFromWasher(null);
    setSelectedToWasher(null);
    setUnitsToReassign(0);
  };

  const handleClose = () => {
    setSelectedFromWasher(null);
    setSelectedToWasher(null);
    setUnitsToReassign(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Reassign Cover Units</DialogTitle>
          <p className="text-sm text-gray-600">
            Reassign pending cover units from unacknowledged washers to other available washers
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pending Washers</p>
                  <p className="text-2xl font-bold text-amber-700">{pendingWashers.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total Pending Units</p>
                  <p className="text-2xl font-bold text-amber-700">
                    {pendingWashers.reduce((sum, w) => sum + w.coverAssigned, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step 1: Select FROM washer */}
          <div>
            <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                1
              </span>
              Select washer to remove cover from:
            </h3>
            <div className="space-y-2">
              {pendingWashers.length === 0 ? (
                <Card className="bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">All cover assignments acknowledged!</p>
                  </CardContent>
                </Card>
              ) : (
                pendingWashers.map((washer) => (
                  <Card
                    key={washer.id}
                    className={`cursor-pointer transition-all ${
                      selectedFromWasher === washer.id
                        ? "border-2 border-red-500 bg-red-50"
                        : "border border-gray-300 hover:border-red-300"
                    }`}
                    onClick={() => {
                      setSelectedFromWasher(washer.id);
                      setUnitsToReassign(washer.coverAssigned);
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-bold text-gray-900">{washer.name}</p>
                            <p className="text-xs text-gray-600">
                              {washer.distanceKm.toFixed(1)} km away
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                            ⏳ Pending
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">
                            Cover: <span className="font-bold text-red-600">{washer.coverAssigned.toFixed(1)}</span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Arrow indicator */}
          {selectedFromWasher && (
            <div className="flex items-center justify-center">
              <ArrowRight className="h-6 w-6 text-gray-400" />
            </div>
          )}

          {/* Step 2: Select TO washer */}
          {selectedFromWasher && (
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  2
                </span>
                Select washer to reassign to:
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableWashers
                  .filter((w) => w.id !== selectedFromWasher)
                  .map((washer) => {
                    const capacityLeft = 20 - washer.totalUnits;
                    const canAccept = capacityLeft;
                    const isOverRecommended = washer.coverAssigned >= 5;

                    return (
                      <Card
                        key={washer.id}
                        className={`cursor-pointer transition-all ${
                          selectedToWasher === washer.id
                            ? "border-2 border-green-500 bg-green-50"
                            : "border border-gray-300 hover:border-green-300"
                        } ${canAccept <= 0 ? "opacity-50" : ""}`}
                        onClick={() => {
                          if (canAccept > 0) {
                            setSelectedToWasher(washer.id);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-600" />
                              <div>
                                <p className="font-bold text-gray-900">{washer.name}</p>
                                <p className="text-xs text-gray-600">
                                  Current: {washer.totalUnits.toFixed(1)} / 20 units
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {washer.isAcknowledged ? (
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 mb-1">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mb-1">
                                  ⏳ Pending
                                </Badge>
                              )}
                              {isOverRecommended && (
                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 mb-1 ml-1">
                                  Override
                                </Badge>
                              )}
                              <p className="text-xs text-gray-600">
                                Can take: <span className="font-bold text-green-600">{canAccept.toFixed(1)}</span>
                                {canAccept > 5 && <span className="text-xs text-gray-500"> (override)</span>}
                              </p>
                            </div>
                          </div>

                          {/* Capacity bar */}
                          <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-teal-500 h-full transition-all"
                              style={{ width: `${(washer.totalUnits / 20) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Step 3: Adjust units */}
          {selectedFromWasher && selectedToWasher && (
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2 flex items-center gap-2">
                <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                  3
                </span>
                How many units to reassign?
              </h3>
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Units to reassign:</span>
                    <span className="text-2xl font-bold text-blue-700">{unitsToReassign.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.min(maxReassignable, maxAcceptable)}
                    step="0.5"
                    value={unitsToReassign}
                    onChange={(e) => setUnitsToReassign(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span>Max: {Math.min(maxReassignable, maxAcceptable).toFixed(1)}</span>
                  </div>
                  {toWasher && (toWasher.coverAssigned + unitsToReassign) > 5 && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded">
                      <p className="text-xs text-amber-800">
                        ⚠️ This will exceed recommended max (5 units). Override will trigger OM notification.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReassignClick}
              disabled={!selectedFromWasher || !selectedToWasher || unitsToReassign <= 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm Reassignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
