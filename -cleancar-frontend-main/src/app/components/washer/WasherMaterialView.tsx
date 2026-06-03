/**
 * WASHER MATERIAL VIEW
 * Shows all assigned materials and consumables
 *
 * Functions:
 * - View assigned items (Assets & Reusable)
 * - View consumable stock
 * - Return items to supervisor
 * - Report breakdowns
 * - Track return due dates
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Package,
  RotateCcw,
  AlertTriangle,
  XCircle,
  CheckCircle,
  Wrench,
} from "lucide-react";
import {
  unifiedMaterialService,
  type WasherMaterialAssignment,
  type IndividualItem,
  type AssetCondition,
  type ReusableCondition,
} from "../../services/unifiedMaterialService";
import { toast } from "sonner";

interface WasherMaterialViewProps {
  washerId: string;
  washerName: string;
}

export function WasherMaterialView({ washerId, washerName }: WasherMaterialViewProps) {
  // State
  const [assignment, setAssignment] = useState<WasherMaterialAssignment | null>(null);
  const [assignedItems, setAssignedItems] = useState<IndividualItem[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IndividualItem | null>(null);

  // Load data
  useEffect(() => {
    const washerAssignment = unifiedMaterialService.getWasherAssignment(washerId);
    setAssignment(washerAssignment);

    if (washerAssignment) {
      const items: IndividualItem[] = [];
      washerAssignment.assignedItems.forEach((assignedItem) => {
        const item = unifiedMaterialService.getItemById(assignedItem.itemId);
        if (item) {
          items.push(item);
        }
      });
      setAssignedItems(items);
    }
  }, [washerId]);

  const overdueItems = assignment?.assignedItems.filter(i => i.isOverdue) || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 shadow-lg">
        <div className="mb-2">
          <h1 className="text-xl font-bold">My Materials</h1>
          <p className="text-sm text-blue-100">{washerName}</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-blue-100">Assigned Items</p>
              <p className="text-2xl font-bold">{assignment?.assignedItems.length || 0}</p>
            </div>
            <div>
              <p className="text-blue-100">Consumables</p>
              <p className="text-2xl font-bold">{assignment?.consumablesStock.length || 0}</p>
            </div>
          </div>
          {overdueItems.length > 0 && (
            <div className="mt-2 bg-red-500/20 border border-red-400 rounded p-2">
              <p className="text-xs font-semibold">
                ⚠️ {overdueItems.length} item(s) overdue for return
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Can/Cannot Receive Status */}
        {assignment && (
          <Card
            className={`border-2 ${
              assignment.canReceiveNewItems
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                {assignment.canReceiveNewItems ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-900">Ready for New Materials</p>
                      <p className="text-xs text-green-700">
                        All items returned - can receive new assignments
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-900">Return Required</p>
                      <p className="text-xs text-red-700">
                        Must return {assignment.unreturned.length} item(s) before receiving new ones
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assigned Items */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 px-1">
            Assigned Items ({assignedItems.length})
          </h3>

          {assignedItems.length === 0 ? (
            <Card className="border-2 border-gray-200">
              <CardContent className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="font-semibold text-gray-700 mb-1">No Items Assigned</p>
                <p className="text-sm text-gray-600">Contact supervisor to receive materials</p>
              </CardContent>
            </Card>
          ) : (
            assignedItems.map((item) => {
              const assignmentInfo = assignment?.assignedItems.find(a => a.itemId === item.itemId);
              const isOverdue = assignmentInfo?.isOverdue || false;

              return (
                <Card
                  key={item.itemId}
                  className={`border-2 ${
                    isOverdue ? "border-red-300 bg-red-50" : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-3">
                    {isOverdue && (
                      <div className="mb-2 bg-red-100 border border-red-300 rounded p-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <p className="text-xs font-semibold text-red-900">
                            OVERDUE - Return immediately
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.itemId}</p>
                        <p className="text-xs text-gray-600">{item.name}</p>
                      </div>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                        {item.category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-gray-50 rounded p-2">
                      <div>
                        <p className="text-gray-600">Assigned</p>
                        <p className="font-bold text-gray-900">
                          {assignmentInfo?.assignedDate
                            ? new Date(assignmentInfo.assignedDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Return Due</p>
                        <p className={`font-bold ${isOverdue ? "text-red-600" : "text-gray-900"}`}>
                          {assignmentInfo?.returnDueDate
                            ? new Date(assignmentInfo.returnDueDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                      {item.category === "REUSABLE" && (
                        <>
                          <div>
                            <p className="text-gray-600">Usage Count</p>
                            <p className="font-bold text-gray-900">
                              {item.usageCount} / {item.maxUsageCount}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Condition</p>
                            <p className="font-bold text-gray-900">
                              {item.reusableCondition || "N/A"}
                            </p>
                          </div>
                        </>
                      )}
                      {item.category === "ASSET" && (
                        <div>
                          <p className="text-gray-600">Condition</p>
                          <p className="font-bold text-gray-900">
                            {item.assetCondition || "N/A"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowReturnModal(true);
                        }}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Return
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setSelectedItem(item);
                          setShowBreakdownModal(true);
                        }}
                      >
                        <Wrench className="h-4 w-4 mr-1" />
                        Report Issue
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Consumables Stock */}
        {assignment && assignment.consumablesStock.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 px-1">
              Consumables Stock
            </h3>
            {assignment.consumablesStock.map((consumable) => (
              <Card key={consumable.materialId} className="border-2 border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{consumable.materialName}</p>
                      <p className="text-xs text-gray-600">{consumable.materialType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {consumable.currentQuantity}
                      </p>
                      <p className="text-xs text-gray-600">{consumable.unit}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Return Instructions */}
        <Card className="border-2 border-amber-200 bg-amber-50">
          <CardContent className="p-3">
            <p className="text-sm font-semibold text-amber-900 mb-2">
              Material Handling Instructions:
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>• Return items to supervisor before requesting new ones</li>
              <li>• Inspect for damage before returning</li>
              <li>• Report breakdowns immediately to avoid delays</li>
              <li>• Track consumable usage per service package</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Return Modal */}
      {showReturnModal && selectedItem && (
        <ReturnItemModal
          item={selectedItem}
          washerId={washerId}
          onConfirm={(condition, notes) => {
            const result = unifiedMaterialService.returnToSupervisor(
              washerId,
              selectedItem.itemId,
              "SUP-001", // Should come from context
              condition,
              notes
            );
            if (result.success) {
              toast.success("Item returned successfully");
              // Refresh data
              const updatedAssignment = unifiedMaterialService.getWasherAssignment(washerId);
              setAssignment(updatedAssignment);
              setAssignedItems(assignedItems.filter(i => i.itemId !== selectedItem.itemId));
            } else {
              toast.error(result.error || "Failed to return item");
            }
            setShowReturnModal(false);
            setSelectedItem(null);
          }}
          onCancel={() => {
            setShowReturnModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && selectedItem && (
        <BreakdownReportModal
          item={selectedItem}
          washerId={washerId}
          onConfirm={(issue, photoUrl) => {
            const result = unifiedMaterialService.reportBreakdown(
              selectedItem.itemId,
              washerId,
              issue,
              photoUrl
            );
            if (result.success) {
              toast.success("Breakdown reported - supervisor will replace");
              // Refresh data
              const updatedAssignment = unifiedMaterialService.getWasherAssignment(washerId);
              setAssignment(updatedAssignment);
            } else {
              toast.error(result.error || "Failed to report breakdown");
            }
            setShowBreakdownModal(false);
            setSelectedItem(null);
          }}
          onCancel={() => {
            setShowBreakdownModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </div>
  );
}

// ========== RETURN ITEM MODAL ==========

interface ReturnItemModalProps {
  item: IndividualItem;
  washerId: string;
  onConfirm: (condition: AssetCondition | ReusableCondition, notes?: string) => void;
  onCancel: () => void;
}

function ReturnItemModal({ item, washerId, onConfirm, onCancel }: ReturnItemModalProps) {
  const [condition, setCondition] = useState<AssetCondition | ReusableCondition>(
    item.category === "ASSET" ? "GOOD" : "NORMAL"
  );
  const [notes, setNotes] = useState("");

  const conditionOptions = item.category === "ASSET"
    ? [
        { value: "EXCELLENT", label: "Excellent", color: "green" },
        { value: "GOOD", label: "Good", color: "green" },
        { value: "FAIR", label: "Fair", color: "amber" },
        { value: "POOR", label: "Poor", color: "amber" },
        { value: "BROKEN", label: "Broken", color: "red" },
      ]
    : [
        { value: "NORMAL", label: "Normal", color: "green" },
        { value: "WORN", label: "Worn", color: "amber" },
        { value: "DAMAGED", label: "Damaged", color: "red" },
        { value: "LOST", label: "Lost", color: "red" },
      ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Return Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Item ID:</p>
            <p className="font-bold">{item.itemId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Condition:</p>
            <div className="grid grid-cols-2 gap-2">
              {conditionOptions.map((option) => (
                <button
                  key={option.value}
                  className={`h-10 rounded-lg border-2 font-semibold text-sm ${
                    condition === option.value
                      ? option.color === "green"
                        ? "border-green-500 bg-green-50 text-green-700"
                        : option.color === "amber"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-red-500 bg-red-50 text-red-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setCondition(option.value as any)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Notes (Optional):</label>
            <textarea
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onConfirm(condition, notes || undefined)}
            >
              Confirm Return
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== BREAKDOWN REPORT MODAL ==========

interface BreakdownReportModalProps {
  item: IndividualItem;
  washerId: string;
  onConfirm: (issue: string, photoUrl?: string) => void;
  onCancel: () => void;
}

function BreakdownReportModal({ item, onConfirm, onCancel }: BreakdownReportModalProps) {
  const [issue, setIssue] = useState("");

  const canSubmit = issue.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wrench className="h-5 w-5 text-red-600" />
            Report Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Item ID:</p>
            <p className="font-bold">{item.itemId}</p>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Describe the Issue (Required):</label>
            <textarea
              className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Describe what's broken or not working..."
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
            <p className="font-semibold text-blue-900 mb-1">What happens next:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Supervisor will be notified immediately</li>
              <li>• Replacement item will be issued if available</li>
              <li>• Broken item will be sent to Store for repair</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => onConfirm(issue)}
              disabled={!canSubmit}
            >
              Report Breakdown
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
