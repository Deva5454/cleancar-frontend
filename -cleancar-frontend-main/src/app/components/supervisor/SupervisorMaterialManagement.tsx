/**
 * SUPERVISOR MATERIAL MANAGEMENT
 * Buffer stock holder + material distribution to washers
 *
 * Functions:
 * - View buffer stock (all materials)
 * - Issue materials to washers (with return enforcement)
 * - Process returns from washers
 * - Request refills from Store
 * - Report breakdowns
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  RefreshCw,
  Wrench,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  unifiedMaterialService,
  type IndividualItem,
  type BulkInventory,
  type WasherMaterialAssignment,
  type RefillRequest,
} from "../../services/unifiedMaterialService";
import { toast } from "sonner";

export function SupervisorMaterialManagement() {
  const supervisorId = "SUP-001";
  const supervisorName = "Rajesh Kumar";

  // Tab State
  const [activeTab, setActiveTab] = useState<"buffer" | "washers" | "refills">("buffer");

  // Buffer Stock State
  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([]);
  const [bulkInventory, setBulkInventory] = useState<BulkInventory[]>([]);
  const [lowStockItems, setLowStockItems] = useState<BulkInventory[]>([]);

  // Washer State
  const [washerAssignments, setWasherAssignments] = useState<WasherMaterialAssignment[]>([]);

  // Refill Requests
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);

  // Modals
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRefillModal, setShowRefillModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IndividualItem | null>(null);

  // Load data
  useEffect(() => {
    setIndividualItems(unifiedMaterialService.getItemsByLocation(supervisorId));
    setBulkInventory(unifiedMaterialService.getBulkInventory("SUPERVISOR", supervisorId));
    setLowStockItems(unifiedMaterialService.getLowStockItems(supervisorId));
    setRefillRequests(unifiedMaterialService.getRefillRequests(supervisorId));

    // Load washer assignments (mock for now)
    const assignment = unifiedMaterialService.getWasherAssignment("W001");
    if (assignment) {
      setWasherAssignments([assignment]);
    }
  }, [supervisorId]);

  const availableItems = individualItems.filter(i => i.status === "WITH_SUPERVISOR" && i.isActive);
  const pendingRefills = refillRequests.filter(r => r.status === "PENDING" || r.status === "APPROVED");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Material Management</h1>
          <p className="text-sm text-teal-100">Buffer Stock & Distribution</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">Available Items</p>
              <p className="text-2xl font-bold">{availableItems.length}</p>
            </div>
            <div>
              <p className="text-teal-100">Consumables</p>
              <p className="text-2xl font-bold">{bulkInventory.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">Low Stock Alerts</p>
              <p className={`text-lg font-bold ${lowStockItems.length > 0 ? "text-red-300" : ""}`}>
                {lowStockItems.length}
              </p>
            </div>
            <div>
              <p className="text-teal-100">Pending Refills</p>
              <p className="text-lg font-bold">{pendingRefills.length}</p>
            </div>
          </div>
        </div>

        {lowStockItems.length > 0 && (
          <div className="mt-3 bg-amber-600 border-2 border-amber-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🟠 {lowStockItems.length} MATERIALS LOW ON STOCK</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="buffer">
              Buffer Stock
              {lowStockItems.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {lowStockItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="washers">Washers</TabsTrigger>
            <TabsTrigger value="refills">
              Refills
              {pendingRefills.length > 0 && (
                <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs bg-blue-100">
                  {pendingRefills.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BUFFER STOCK */}
          <TabsContent value="buffer" className="space-y-3">
            {/* Info Banner */}
            <Card className="border-2 border-teal-200 bg-teal-50">
              <CardContent className="p-3">
                <p className="text-sm text-teal-900 font-semibold mb-1">
                  Supervisor Buffer Stock (Store → Supervisor → Washer)
                </p>
                <p className="text-xs text-teal-700">
                  • Individual items (Assets/Reusable) • Consumables (bulk tracking)
                </p>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowIssueModal(true)}
                >
                  <ArrowUpCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Issue to Washer</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowRefillModal(true)}
                >
                  <RefreshCw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Request Refill</span>
                </Button>
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Low Stock Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="bg-white rounded p-2 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{item.materialName}</p>
                            <p className="text-xs text-gray-600">
                              Current: {item.currentQuantity} {item.unit} | Min: {item.minThreshold} {item.unit}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setShowRefillModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Request
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Items */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">
                Individual Items ({availableItems.length} available)
              </h3>
              {availableItems.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items in buffer</p>
                    <p className="text-xs mt-1">Request from Store</p>
                  </CardContent>
                </Card>
              ) : (
                availableItems.map((item) => (
                  <Card key={item.itemId} className="border-2 border-gray-200">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{item.itemId}</p>
                          <p className="text-xs text-gray-600">{item.name}</p>
                        </div>
                        <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">
                          {item.category}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-gray-50 rounded p-2">
                        <div>
                          <p className="text-gray-600">Status</p>
                          <p className="font-bold text-gray-900">{item.status.replace(/_/g, " ")}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Condition</p>
                          <p className="font-bold text-gray-900">
                            {item.assetCondition || item.reusableCondition || "N/A"}
                          </p>
                        </div>
                        {item.category === "REUSABLE" && (
                          <>
                            <div>
                              <p className="text-gray-600">Usage</p>
                              <p className="font-bold text-gray-900">
                                {item.usageCount} / {item.maxUsageCount}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowIssueModal(true);
                          }}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Issue
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
                ))
              )}
            </div>

            {/* Consumables */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">
                Consumables (Bulk Stock)
              </h3>
              {bulkInventory.map((item) => (
                <Card
                  key={item.id}
                  className={`border-2 ${item.isLowStock ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.materialName}</p>
                        <p className="text-xs text-gray-600">{item.materialType}</p>
                      </div>
                      {item.isLowStock && <Badge variant="destructive">Low Stock</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Current</p>
                        <p className={`text-lg font-bold ${item.isLowStock ? "text-red-600" : "text-gray-900"}`}>
                          {item.currentQuantity}
                        </p>
                        <p className="text-gray-500">{item.unit}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Min</p>
                        <p className="text-lg font-bold text-gray-900">{item.minThreshold}</p>
                        <p className="text-gray-500">{item.unit}</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Max</p>
                        <p className="text-lg font-bold text-gray-900">{item.maxThreshold}</p>
                        <p className="text-gray-500">{item.unit}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: WASHERS */}
          <TabsContent value="washers" className="space-y-3">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <p className="text-sm text-green-900 font-semibold">
                  Monitor washer material assignments and returns
                </p>
              </CardContent>
            </Card>

            {washerAssignments.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <p className="text-sm">No washer assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              washerAssignments.map((assignment) => (
                <Card key={assignment.washerId} className="border-2 border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">{assignment.washerName}</p>
                        <p className="text-xs text-gray-600">{assignment.washerId}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          assignment.canReceiveNewItems
                            ? "bg-green-100 text-green-700 border-green-300"
                            : "bg-red-100 text-red-700 border-red-300"
                        }
                      >
                        {assignment.canReceiveNewItems ? "Can Receive" : "Has Unreturned"}
                      </Badge>
                    </div>

                    {assignment.assignedItems.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Assigned Items:</p>
                        {assignment.assignedItems.map((item) => (
                          <div key={item.itemId} className="bg-gray-50 rounded p-2 mb-1 text-xs">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{item.itemId}</p>
                                <p className="text-gray-600">{item.materialName}</p>
                              </div>
                              {item.isOverdue && (
                                <Badge variant="destructive" className="text-xs">Overdue</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {assignment.consumablesStock.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-700 mb-2">Consumables:</p>
                        {assignment.consumablesStock.map((consumable) => (
                          <div key={consumable.materialId} className="bg-blue-50 rounded p-2 mb-1 text-xs">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{consumable.materialName}</p>
                              <p className="text-gray-700">
                                {consumable.currentQuantity} {consumable.unit}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 3: REFILLS */}
          <TabsContent value="refills" className="space-y-3">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900 font-semibold">
                  Track refill requests sent to Store
                </p>
              </CardContent>
            </Card>

            {refillRequests.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <p className="text-sm">No refill requests</p>
                </CardContent>
              </Card>
            ) : (
              refillRequests.map((request) => (
                <Card key={request.id} className="border-2 border-gray-200">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{request.materialName}</p>
                        <p className="text-xs text-gray-600">
                          Requested: {request.requestedQuantity} {request.unit}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          request.status === "COMPLETED"
                            ? "bg-green-100 text-green-700 border-green-300"
                            : request.status === "PENDING"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        }
                      >
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
                      {new Date(request.requestDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Issue to Washer Modal */}
      {showIssueModal && selectedItem && (
        <IssueToWasherModal
          item={selectedItem}
          supervisorId={supervisorId}
          onConfirm={(washerId, washerName) => {
            const result = unifiedMaterialService.issueToWasher(
              supervisorId,
              washerId,
              washerName,
              [{
                materialId: selectedItem.materialId,
                itemId: selectedItem.itemId
              }]
            );
            if (result.success) {
              toast.success(`${selectedItem.itemId} issued to ${washerName}`);
              // Refresh data
              setIndividualItems(unifiedMaterialService.getItemsByLocation(supervisorId));
              const assignment = unifiedMaterialService.getWasherAssignment(washerId);
              if (assignment) {
                setWasherAssignments([assignment]);
              }
            } else {
              toast.error(result.error || "Failed to issue item");
            }
            setShowIssueModal(false);
            setSelectedItem(null);
          }}
          onCancel={() => {
            setShowIssueModal(false);
            setSelectedItem(null);
          }}
        />
      )}

      {/* Breakdown Modal */}
      {showBreakdownModal && selectedItem && (
        <BreakdownReportModal
          item={selectedItem}
          reportedBy={supervisorId}
          reportedByName={supervisorName}
          onConfirm={(issue, photoUrl) => {
            const result = unifiedMaterialService.reportBreakdown(
              selectedItem.itemId,
              supervisorId,
              issue,
              photoUrl
            );
            if (result.success) {
              toast.success("Breakdown reported - item marked as broken");
              // Refresh data
              setIndividualItems(unifiedMaterialService.getItemsByLocation(supervisorId));
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

      {/* Refill Request Modal */}
      {showRefillModal && (
        <RefillRequestModal
          supervisorId={supervisorId}
          supervisorName={supervisorName}
          bulkInventory={bulkInventory}
          onConfirm={(materialId, quantity, urgency, reason) => {
            const result = unifiedMaterialService.createRefillRequest(
              supervisorId,
              supervisorName,
              materialId,
              quantity,
              urgency,
              reason
            );
            if (result.success) {
              toast.success("Refill request submitted to Store");
              // Refresh data
              setRefillRequests(unifiedMaterialService.getRefillRequests(supervisorId));
            } else {
              toast.error(result.error || "Failed to create refill request");
            }
            setShowRefillModal(false);
          }}
          onCancel={() => setShowRefillModal(false)}
        />
      )}
    </div>
  );
}

// ========== BREAKDOWN REPORT MODAL ==========

interface BreakdownReportModalProps {
  item: IndividualItem;
  reportedBy: string;
  reportedByName: string;
  onConfirm: (issue: string, photoUrl?: string) => void;
  onCancel: () => void;
}

function BreakdownReportModal({ item, reportedByName, onConfirm, onCancel }: BreakdownReportModalProps) {
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
            <p className="text-xs text-gray-600 mt-1">{item.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Location:</p>
            <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300">
              Supervisor Buffer Stock
            </Badge>
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
              <li>• Item status will be marked as BROKEN</li>
              <li>• Item will be removed from available buffer stock</li>
              <li>• Breakdown will be logged in transaction history</li>
              <li>• Store will be notified to process repair</li>
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

// ========== ISSUE TO WASHER MODAL ==========

interface IssueToWasherModalProps {
  item: IndividualItem;
  supervisorId: string;
  onConfirm: (washerId: string, washerName: string) => void;
  onCancel: () => void;
}

function IssueToWasherModal({ item, onConfirm, onCancel }: IssueToWasherModalProps) {
  const [washerId, setWasherId] = useState("");
  const [washerName, setWasherName] = useState("");

  // Get washer assignment to check if they can receive
  const assignment = washerId ? unifiedMaterialService.getWasherAssignment(washerId) : null;
  const canReceive = !assignment || assignment.canReceiveNewItems;

  const canSubmit = washerId.trim() !== "" && washerName.trim() !== "" && canReceive;

  // Sample washer list (would come from service/context in production)
  const sampleWashers = [
    { id: "W001", name: "Suresh Kumar" },
    { id: "W002", name: "Ramesh Patil" },
    { id: "W003", name: "Amit Singh" },
    { id: "W004", name: "Vijay Kumar" },
    { id: "W005", name: "Rajesh Sharma" },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-green-600" />
            Issue Material to Washer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Details */}
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <p className="text-xs text-gray-600 mb-1">Item to Issue:</p>
            <p className="font-bold text-gray-900">{item.itemId}</p>
            <p className="text-sm text-gray-700">{item.name}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-teal-100 text-teal-700 border-teal-300 text-xs">
                {item.category}
              </Badge>
              <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                {item.assetCondition || item.reusableCondition || "N/A"}
              </Badge>
            </div>
          </div>

          {/* Washer Selection */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Select Washer:</label>
            <select
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              value={washerId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedWasher = sampleWashers.find(w => w.id === selectedId);
                setWasherId(selectedId);
                setWasherName(selectedWasher?.name || "");
              }}
            >
              <option value="">-- Select Washer --</option>
              {sampleWashers.map((washer) => (
                <option key={washer.id} value={washer.id}>
                  {washer.id} - {washer.name}
                </option>
              ))}
            </select>
          </div>

          {/* Washer Status */}
          {washerId && assignment && (
            <div className={`border-2 rounded p-3 ${
              assignment.canReceiveNewItems
                ? "border-green-300 bg-green-50"
                : "border-red-300 bg-red-50"
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {assignment.canReceiveNewItems ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-900 text-sm">Can Receive Materials</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-900 text-sm">Cannot Receive</p>
                  </>
                )}
              </div>
              {!assignment.canReceiveNewItems && (
                <div className="text-xs text-red-700">
                  <p className="font-semibold mb-1">Unreturned Items:</p>
                  <ul className="list-disc list-inside">
                    {assignment.unreturned.map((itemId) => (
                      <li key={itemId}>{itemId}</li>
                    ))}
                  </ul>
                  <p className="mt-2 font-semibold">Washer must return these items first</p>
                </div>
              )}
              {assignment.canReceiveNewItems && (
                <p className="text-xs text-green-700">
                  All items returned - ready to receive new materials
                </p>
              )}
            </div>
          )}

          {/* Return Due Info */}
          {canReceive && washerId && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
              <p className="font-semibold text-blue-900 mb-1">Return Policy:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• {item.category === "REUSABLE" ? "Return due in 3 days" : "Return due in 7 days"}</li>
                <li>• Washer must return before receiving new items</li>
                <li>• {item.category === "REUSABLE" && `Usage count will increment on return`}</li>
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onConfirm(washerId, washerName)}
              disabled={!canSubmit}
            >
              Issue to Washer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== REFILL REQUEST MODAL ==========

interface RefillRequestModalProps {
  supervisorId: string;
  supervisorName: string;
  bulkInventory: BulkInventory[];
  onConfirm: (materialId: string, quantity: number, urgency: "NORMAL" | "URGENT" | "CRITICAL", reason: string) => void;
  onCancel: () => void;
}

function RefillRequestModal({ bulkInventory, onConfirm, onCancel }: RefillRequestModalProps) {
  const [materialId, setMaterialId] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [urgency, setUrgency] = useState<"NORMAL" | "URGENT" | "CRITICAL">("NORMAL");
  const [reason, setReason] = useState("");

  const selectedMaterial = bulkInventory.find(m => m.materialId === materialId);
  const canSubmit = materialId !== "" && quantity > 0 && reason.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            Request Material Refill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Material Selection */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Select Material:</label>
            <select
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              value={materialId}
              onChange={(e) => {
                setMaterialId(e.target.value);
                // Auto-fill reason for low stock items
                const material = bulkInventory.find(m => m.materialId === e.target.value);
                if (material && material.isLowStock) {
                  setReason(`Low stock alert - current: ${material.currentQuantity}${material.unit}, min threshold: ${material.minThreshold}${material.unit}`);
                  setUrgency(material.currentQuantity < material.minThreshold * 0.5 ? "URGENT" : "NORMAL");
                }
              }}
            >
              <option value="">-- Select Material --</option>
              {bulkInventory.map((material) => (
                <option key={material.materialId} value={material.materialId}>
                  {material.materialName} ({material.currentQuantity}{material.unit})
                  {material.isLowStock ? " ⚠️ LOW" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Info */}
          {selectedMaterial && (
            <div className={`border-2 rounded p-3 ${
              selectedMaterial.isLowStock
                ? "border-red-300 bg-red-50"
                : "border-gray-200 bg-gray-50"
            }`}>
              <p className="text-xs text-gray-600 mb-1">Current Stock:</p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-gray-600 text-xs">Current</p>
                  <p className="font-bold">{selectedMaterial.currentQuantity}{selectedMaterial.unit}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Min</p>
                  <p className="font-bold">{selectedMaterial.minThreshold}{selectedMaterial.unit}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-xs">Max</p>
                  <p className="font-bold">{selectedMaterial.maxThreshold}{selectedMaterial.unit}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Quantity to Request ({selectedMaterial?.unit || "units"}):
            </label>
            <input
              type="number"
              min="1"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="Enter quantity"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
            />
            {selectedMaterial && quantity > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                After refill: {selectedMaterial.currentQuantity + quantity}{selectedMaterial.unit}
                {(selectedMaterial.currentQuantity + quantity) > selectedMaterial.maxThreshold && (
                  <span className="text-amber-600 font-semibold"> (exceeds max threshold)</span>
                )}
              </p>
            )}
          </div>

          {/* Urgency */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">Urgency Level:</label>
            <div className="grid grid-cols-3 gap-2">
              {(["NORMAL", "URGENT", "CRITICAL"] as const).map((level) => (
                <button
                  key={level}
                  className={`h-10 rounded-lg border-2 text-xs font-semibold ${
                    urgency === level
                      ? level === "CRITICAL"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : level === "URGENT"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setUrgency(level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Reason (Required):</label>
            <textarea
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Why do you need this refill?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs">
            <p className="font-semibold text-blue-900 mb-1">What happens next:</p>
            <ul className="text-blue-700 space-y-1">
              <li>• Request will be sent to Store for approval</li>
              <li>• Store will review and dispatch materials</li>
              <li>• You will be notified when dispatched</li>
              <li>• Track status in "Refills" tab</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => onConfirm(materialId, quantity, urgency, reason)}
              disabled={!canSubmit}
            >
              Submit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
