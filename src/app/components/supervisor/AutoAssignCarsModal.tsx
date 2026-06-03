/**
 * Auto-Assign Cars Modal
 * Automatically assigns cars from absent washer to available washers
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Users, Car, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

interface CarAssignment {
  carId: string;
  carName: string;
  location: string;
  assignedTo: string;
  assignedToName: string;
}

interface AvailableWasher {
  id: string;
  name: string;
  currentCars: number;
  maxCapacity: number;
  distanceKm: number;
}

interface AutoAssignCarsModalProps {
  isOpen: boolean;
  onClose: () => void;
  absentWasherId: string;
  absentWasherName: string;
  assignedCars: Array<{ carId: string; carName: string; location: string }>;
  availableWashers: AvailableWasher[];
  onConfirmAssignment: (assignments: CarAssignment[]) => void;
}

export function AutoAssignCarsModal({
  isOpen,
  onClose,
  absentWasherId,
  absentWasherName,
  assignedCars,
  availableWashers,
  onConfirmAssignment,
}: AutoAssignCarsModalProps) {
  const [autoAssignments, setAutoAssignments] = useState<CarAssignment[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);

  // Generate auto-assignments
  const handleGenerateAssignments = () => {
    const assignments: CarAssignment[] = [];
    const sortedWashers = [...availableWashers].sort((a, b) => {
      // Sort by current load (lowest first), then by distance
      if (a.currentCars !== b.currentCars) {
        return a.currentCars - b.currentCars;
      }
      return a.distanceKm - b.distanceKm;
    });

    let washerIndex = 0;
    for (const car of assignedCars) {
      // Find next available washer
      while (washerIndex < sortedWashers.length) {
        const washer = sortedWashers[washerIndex];
        const currentAssignedCount = assignments.filter((a) => a.assignedTo === washer.id).length;

        if (washer.currentCars + currentAssignedCount < washer.maxCapacity) {
          assignments.push({
            carId: car.carId,
            carName: car.carName,
            location: car.location,
            assignedTo: washer.id,
            assignedToName: washer.name,
          });
          break;
        }
        washerIndex++;
      }

      // If all washers are at capacity, wrap around
      if (washerIndex >= sortedWashers.length) {
        washerIndex = 0;
      }
    }

    setAutoAssignments(assignments);
    setIsGenerated(true);
  };

  const handleConfirm = () => {
    onConfirmAssignment(autoAssignments);
    handleCloseModal();
  };

  const handleCloseModal = () => {
    setAutoAssignments([]);
    setIsGenerated(false);
    onClose();
  };

  // Group assignments by washer
  const groupedAssignments = autoAssignments.reduce((acc, assignment) => {
    if (!acc[assignment.assignedTo]) {
      acc[assignment.assignedTo] = {
        washerId: assignment.assignedTo,
        washerName: assignment.assignedToName,
        cars: [],
      };
    }
    acc[assignment.assignedTo].cars.push(assignment);
    return acc;
  }, {} as Record<string, { washerId: string; washerName: string; cars: CarAssignment[] }>);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Auto-Assign Cars</DialogTitle>
          <p className="text-sm text-gray-600">
            Automatically redistribute cars from absent washer to available team members
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {/* Absent Washer Info */}
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-600">Absent Washer</p>
                  <p className="text-lg font-bold text-red-700">{absentWasherName}</p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  NOT CHECKED IN
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-bold">{assignedCars.length}</span> car{assignedCars.length !== 1 ? "s" : ""} assigned
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Cars to Reassign */}
          {!isGenerated && (
            <div>
              <h3 className="font-bold text-sm text-gray-900 mb-2">Cars to Reassign:</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignedCars.map((car) => (
                  <Card key={car.carId} className="border border-gray-300">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-gray-600" />
                          <div>
                            <p className="font-bold text-gray-900">{car.carName}</p>
                            <p className="text-xs text-gray-600">{car.location}</p>
                          </div>
                        </div>
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-4">
                <Button
                  onClick={handleGenerateAssignments}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Generate Auto-Assignments
                </Button>
              </div>
            </div>
          )}

          {/* Auto-Generated Assignments */}
          {isGenerated && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-900">Proposed Assignments:</h3>
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  Auto-Generated
                </Badge>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.values(groupedAssignments).map((group) => {
                  const washer = availableWashers.find((w) => w.id === group.washerId);
                  const newTotal = (washer?.currentCars || 0) + group.cars.length;

                  return (
                    <Card key={group.washerId} className="border-2 border-green-200 bg-green-50">
                      <CardContent className="p-3">
                        {/* Washer Header */}
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-200">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-700" />
                            <div>
                              <p className="font-bold text-gray-900">{group.washerName}</p>
                              <p className="text-xs text-gray-600">
                                Current: {washer?.currentCars || 0} cars • New Total: {newTotal}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            +{group.cars.length}
                          </Badge>
                        </div>

                        {/* Assigned Cars */}
                        <div className="space-y-1">
                          {group.cars.map((car) => (
                            <div key={car.carId} className="flex items-center gap-2 text-sm">
                              <ArrowRight className="h-3 w-3 text-green-600" />
                              <Car className="h-3 w-3 text-gray-600" />
                              <span className="font-medium text-gray-900">{car.carName}</span>
                              <span className="text-xs text-gray-500">• {car.location}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Summary */}
              <Card className="bg-blue-50 border-blue-200 mt-3">
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-600">Total Cars</p>
                      <p className="text-xl font-bold text-blue-700">{assignedCars.length}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Washers Assigned</p>
                      <p className="text-xl font-bold text-blue-700">
                        {Object.keys(groupedAssignments).length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCloseModal} className="flex-1">
              Cancel
            </Button>
            {isGenerated && (
              <Button onClick={handleConfirm} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Assignment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
