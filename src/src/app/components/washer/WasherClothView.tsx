/**
 * WASHER CLOTH VIEW
 * Shows washer their assigned cloth and return due status
 * Rule: Must return before receiving new cloth
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, Package, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import { clothLifecycleService, type WasherClothAssignment, type IndividualCloth, type ClothCondition } from "../../services/clothLifecycleService";
import { toast } from "sonner";

interface WasherClothViewProps {
  washerId: string;
  washerName: string;
}

export function WasherClothView({ washerId, washerName }: WasherClothViewProps) {
  const [assignment, setAssignment] = useState<WasherClothAssignment | null>(null);
  const [assignedCloth, setAssignedCloth] = useState<IndividualCloth | null>(null);
  const [showReturnModal, setShowReturnModal] = useState(false);

  useEffect(() => {
    const washerAssignment = clothLifecycleService.getWasherAssignment(washerId);
    setAssignment(washerAssignment);

    if (washerAssignment?.assignedClothId) {
      const cloth = clothLifecycleService.getClothById(washerAssignment.assignedClothId);
      setAssignedCloth(cloth);
    }
  }, [washerId]);

  const getDaysUntilDue = () => {
    if (!assignment?.returnDueDate) return null;
    const dueDate = new Date(assignment.returnDueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilDue = getDaysUntilDue();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="mb-2">
          <h1 className="text-xl font-bold">My Cloth</h1>
          <p className="text-sm text-blue-100">{washerName}</p>
        </div>

        {assignment?.assignedClothId ? (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-100">Assigned Cloth</p>
                <p className="text-2xl font-bold">{assignment.assignedClothId}</p>
              </div>
              {daysUntilDue !== null && (
                <div className="text-right">
                  <p className="text-sm text-blue-100">Return Due</p>
                  <p
                    className={`text-lg font-bold ${
                      daysUntilDue < 0
                        ? "text-red-300"
                        : daysUntilDue === 0
                        ? "text-amber-300"
                        : "text-white"
                    }`}
                  >
                    {daysUntilDue < 0
                      ? `${Math.abs(daysUntilDue)}d overdue`
                      : daysUntilDue === 0
                      ? "Today"
                      : `In ${daysUntilDue}d`}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 text-center">
            <p className="text-sm">No cloth currently assigned</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {assignment?.assignedClothId && assignedCloth ? (
          <>
            {/* Overdue Alert */}
            {assignment.isOverdue && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-bold text-red-900">🔴 RETURN OVERDUE</span>
                  </div>
                  <p className="text-sm text-red-700">Return cloth immediately to supervisor</p>
                </CardContent>
              </Card>
            )}

            {/* Cloth Details Card */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cloth Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Cloth ID</p>
                    <p className="font-bold text-gray-900">{assignedCloth.clothId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Batch</p>
                    <p className="font-bold text-gray-900">{assignedCloth.batchId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Assigned Date</p>
                    <p className="font-bold text-gray-900">
                      {assignment.assignedDate
                        ? new Date(assignment.assignedDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Return Due</p>
                    <p
                      className={`font-bold ${
                        assignment.isOverdue ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {assignment.returnDueDate
                        ? new Date(assignment.returnDueDate).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                  <p className="font-semibold text-blue-900 mb-1">Usage Lifecycle</p>
                  <div className="flex items-center justify-between">
                    <p className="text-blue-700">
                      {assignedCloth.currentWashCount} / {assignedCloth.maxWashCount} washes
                    </p>
                    <p className="text-blue-700 font-semibold">
                      {Math.round((assignedCloth.currentWashCount / assignedCloth.maxWashCount) * 100)}%
                    </p>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                    <div
                      className={`h-2 rounded-full ${
                        assignedCloth.currentWashCount > 80
                          ? "bg-red-500"
                          : assignedCloth.currentWashCount > 60
                          ? "bg-amber-500"
                          : "bg-blue-600"
                      }`}
                      style={{
                        width: `${(assignedCloth.currentWashCount / assignedCloth.maxWashCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                  onClick={() => setShowReturnModal(true)}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Return Cloth to Supervisor
                </Button>
              </CardContent>
            </Card>

            {/* Return Instructions */}
            <Card className="border-2 border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <p className="text-sm font-semibold text-amber-900 mb-2">Return Instructions:</p>
                <ul className="text-xs text-amber-800 space-y-1">
                  <li>• Return cloth to supervisor before requesting new one</li>
                  <li>• Inspect for damage before returning</li>
                  <li>• Report any tears, stains, or losses immediately</li>
                  <li>• Supervisor will send to laundry and issue fresh cloth</li>
                </ul>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold text-gray-700 mb-1">No Cloth Assigned</p>
              <p className="text-sm text-gray-600">Contact supervisor to receive cloth</p>
            </CardContent>
          </Card>
        )}

        {/* Can Issue New Cloth Banner */}
        {!assignment?.assignedClothId && assignment?.canIssueNew && (
          <Card className="border-2 border-green-300 bg-green-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Ready for New Cloth</p>
                  <p className="text-xs text-green-700">Ask supervisor to issue fresh cloth</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cannot Issue Banner */}
        {assignment?.assignedClothId && !assignment?.canIssueNew && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-semibold text-red-900">Return Required</p>
                  <p className="text-xs text-red-700">
                    Must return current cloth before receiving new one
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Return Modal */}
      {showReturnModal && assignedCloth && (
        <ReturnClothModal
          cloth={assignedCloth}
          onConfirm={(condition, damageReason) => {
            const result = clothLifecycleService.returnClothFromWasher(
              washerId,
              assignedCloth.clothId,
              condition,
              damageReason
            );
            if (result.success) {
              toast.success("Cloth returned successfully");
              // Refresh data
              const updatedAssignment = clothLifecycleService.getWasherAssignment(washerId);
              setAssignment(updatedAssignment);
              setAssignedCloth(null);
            } else {
              toast.error(result.error || "Failed to return cloth");
            }
            setShowReturnModal(false);
          }}
          onCancel={() => setShowReturnModal(false)}
        />
      )}
    </div>
  );
}

// ========== RETURN CLOTH MODAL ==========

interface ReturnClothModalProps {
  cloth: IndividualCloth;
  onConfirm: (condition: ClothCondition, damageReason?: string) => void;
  onCancel: () => void;
}

function ReturnClothModal({ cloth, onConfirm, onCancel }: ReturnClothModalProps) {
  const [condition, setCondition] = useState<ClothCondition>("NORMAL");
  const [damageReason, setDamageReason] = useState("");

  const canSubmit = condition === "NORMAL" || (condition !== "NORMAL" && damageReason.trim() !== "");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Return Cloth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Cloth ID:</p>
            <p className="font-bold">{cloth.clothId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Condition:</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                className={`h-12 rounded-lg border-2 font-semibold text-sm ${
                  condition === "NORMAL"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setCondition("NORMAL")}
              >
                Normal
              </button>
              <button
                className={`h-12 rounded-lg border-2 font-semibold text-sm ${
                  condition === "DAMAGED"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setCondition("DAMAGED")}
              >
                Damaged
              </button>
              <button
                className={`h-12 rounded-lg border-2 font-semibold text-sm ${
                  condition === "LOST"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setCondition("LOST")}
              >
                Lost
              </button>
            </div>
          </div>

          {condition !== "NORMAL" && (
            <div>
              <label className="text-sm text-gray-600 block mb-1">Reason (Required):</label>
              <textarea
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Describe the damage or loss..."
                value={damageReason}
                onChange={(e) => setDamageReason(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onConfirm(condition, damageReason || undefined)}
              disabled={!canSubmit}
            >
              Confirm Return
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
