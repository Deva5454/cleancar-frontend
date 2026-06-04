/**
 * MODULE 3: Cloth & Inventory Management
 * DUAL SYSTEM:
 * 1. RETURNABLE ITEMS (Cloths): Individual tracking, full lifecycle, mandatory return
 * 2. CONSUMABLES (Shampoo, Wax, etc.): Buffer stock, one-way flow, consumption tracking
 *
 * Flow Models:
 * - Cloths: Store → Supervisor → Washer → Return → Laundry → Cycle (90 washes)
 * - Consumables: Store → Supervisor → Washer → Consumed (tracked per service)
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AlertTriangle, CheckCircle, Package, TrendingDown, Truck, X, Camera, ArrowDownCircle, ArrowUpCircle, History, AlertCircle, RefreshCw, RotateCcw } from "lucide-react";
import type { ClothBatch, BatchCondition, BatchID, InventorySummary } from "../../services/clothManagementService";
import { supervisorBufferStockService, type BufferStockItem, type InwardTransaction, type OutwardTransaction, type MaterialType } from "../../services/supervisorBufferStockService";
import { clothLifecycleService, type IndividualCloth, type ClothStatus, type ClothCondition, type WasherClothAssignment, type LaundryBatch } from "../../services/clothLifecycleService";
import { toast } from "sonner";

export interface ClothManagementScreenProps {
  batches: ClothBatch[];
  inventory: InventorySummary;
  onCollectBatch: (washerId: string, batchId: BatchID, condition: BatchCondition) => void;
  onIssueBatch: (washerId: string, batchId: BatchID, isSanitized: boolean) => void;
  onDispatchToHO: (clothCount: number, transportMode: string, courierDetails?: string) => void;
  onReportLossDamage: (washerId: string, clothCount: number, reason: string, photoUrl?: string) => void;
  onRequestStock: (batchesNeeded: number, urgency: "NORMAL" | "URGENT") => void;
}

export function ClothManagementScreen({
  batches,
  inventory,
  onCollectBatch,
  onIssueBatch,
  onDispatchToHO,
  onReportLossDamage,
  onRequestStock,
}: ClothManagementScreenProps) {
  const supervisorId = "SUP-001"; // Would come from context

  // Tab State
  const [activeTab, setActiveTab] = useState<"cloths" | "consumables" | "history">("cloths");

  // RETURNABLE ITEMS (Cloths) State
  const [individualCloths, setIndividualCloths] = useState<IndividualCloth[]>([]);
  const [supervisorCloths, setSupervisorCloths] = useState<IndividualCloth[]>([]);
  const [washerAssignments, setWasherAssignments] = useState<WasherClothAssignment[]>([]);
  const [laundryBatches, setLaundryBatches] = useState<LaundryBatch[]>([]);
  const [clothInventory, setClothInventory] = useState<any>(null);
  const [showIssueClothModal, setShowIssueClothModal] = useState(false);
  const [showReturnClothModal, setShowReturnClothModal] = useState(false);
  const [showLaundryModal, setShowLaundryModal] = useState(false);
  const [selectedCloth, setSelectedCloth] = useState<IndividualCloth | null>(null);

  // CONSUMABLES (Buffer Stock) State
  const [bufferStock, setBufferStock] = useState<BufferStockItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [consumableInwardTxns, setConsumableInwardTxns] = useState<InwardTransaction[]>([]);
  const [consumableOutwardTxns, setConsumableOutwardTxns] = useState<OutwardTransaction[]>([]);
  const [showConsumableInwardModal, setShowConsumableInwardModal] = useState(false);
  const [showConsumableOutwardModal, setShowConsumableOutwardModal] = useState(false);

  // Legacy Batch State (for backward compatibility)
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<ClothBatch | null>(null);

  // Load all data
  useEffect(() => {
    // Load cloth lifecycle data
    setIndividualCloths(clothLifecycleService.getAllCloths());
    setSupervisorCloths(clothLifecycleService.getSupervisorBufferCloths(supervisorId));
    setWasherAssignments(clothLifecycleService.getAllWasherAssignments());
    setLaundryBatches(clothLifecycleService.getLaundryBatches(supervisorId));
    setClothInventory(clothLifecycleService.getInventorySummary());

    // Load consumable buffer stock data
    setBufferStock(supervisorBufferStockService.getBufferStock(supervisorId));
    setLowStockAlerts(supervisorBufferStockService.getLowStockAlerts(supervisorId));
    setConsumableInwardTxns(supervisorBufferStockService.getInwardTransactions(supervisorId));
    setConsumableOutwardTxns(supervisorBufferStockService.getOutwardTransactions(supervisorId));
  }, [supervisorId]);

  const statusConfig = {
    FRESH: { label: "Fresh", color: "bg-green-100 text-green-700 border-green-300" },
    IN_USE: { label: "In Use", color: "bg-blue-100 text-blue-700 border-blue-300" },
    DUE: { label: "Due", color: "bg-amber-100 text-amber-700 border-amber-300" },
    OVERDUE: { label: "Overdue", color: "bg-red-100 text-red-700 border-red-300" },
    COLLECTED: { label: "Collected", color: "bg-gray-100 text-gray-700 border-gray-300" },
    IN_TRANSIT: { label: "In Transit", color: "bg-purple-100 text-purple-700 border-purple-300" },
  };

  const missingBatches = inventory.totalWashers - inventory.validBatches;

  const missingBatches = inventory.totalWashers - inventory.validBatches;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Inventory Management</h1>
          <p className="text-sm text-teal-100">Returnable Items + Consumables</p>
        </div>

        {/* Summary Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">Cloths (Buffer)</p>
              <p className="text-2xl font-bold">{supervisorCloths.length}</p>
            </div>
            <div>
              <p className="text-teal-100">With Washers</p>
              <p className="text-2xl font-bold">{clothInventory?.withWashers || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-teal-100">In Laundry</p>
              <p className="text-lg font-bold">{clothInventory?.inLaundry || 0}</p>
            </div>
            <div>
              <p className="text-teal-100">Low Stock Alerts</p>
              <p className={`text-lg font-bold ${lowStockAlerts.length > 0 ? "text-red-300" : ""}`}>
                {lowStockAlerts.length}
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(clothInventory?.damaged || 0) > 0 && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🔴 {clothInventory.damaged} DAMAGED/LOST CLOTHS</span>
            </div>
            <p className="text-sm">Review and process damaged items</p>
          </div>
        )}

        {(clothInventory?.nearingLifecycleEnd || 0) > 0 && (
          <div className="mt-3 bg-amber-600 border-2 border-amber-400 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold">🟠 {clothInventory.nearingLifecycleEnd} CLOTHS NEAR END-OF-LIFE</span>
            </div>
            <p className="text-sm">Over 80 washes - plan replacements</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cloths">
              Returnable Items
              {(clothInventory?.damaged || 0) > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {clothInventory.damaged}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="consumables">
              Consumables
              {lowStockAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {lowStockAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* TAB 1: RETURNABLE ITEMS (Individual Cloths) */}
          <TabsContent value="cloths" className="space-y-3">
            {/* Quick Actions */}
            <Card className="border-2 border-teal-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cloth Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowIssueClothModal(true)}
                >
                  <ArrowUpCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Issue to Washer</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowLaundryModal(true)}
                >
                  <RefreshCw className="h-5 w-5 mb-1" />
                  <span className="text-xs">Send to Laundry</span>
                </Button>
              </CardContent>
            </Card>

            {/* Laundry Batches Alert */}
            {laundryBatches.filter(b => b.status === "SENT").length > 0 && (
              <Card className="border-2 border-purple-300 bg-purple-50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-purple-900">
                        {laundryBatches.filter(b => b.status === "SENT").length} Batch(es) in Laundry
                      </p>
                      <p className="text-xs text-purple-700">Track and receive cleaned cloths</p>
                    </div>
                    <RefreshCw className="h-5 w-5 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Cloth List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">
                Buffer Stock ({supervisorCloths.length} cloths)
              </h3>
              {supervisorCloths.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No cloths in buffer stock</p>
                    <p className="text-xs mt-1">Request from Store</p>
                  </CardContent>
                </Card>
              ) : (
                <>{supervisorCloths.map((batch) => {
                  const config = statusConfig[batch.status];
                  const isBlocked = !batch.issuedDate;

                return (
                  <Card
                key={batch.id}
                className={`border-2 ${
                  batch.status === "OVERDUE"
                    ? "border-red-300 bg-red-50"
                    : isBlocked
                    ? "border-red-300 bg-red-50"
                    : batch.status === "DUE"
                    ? "border-amber-200 bg-amber-50"
                    : "border-gray-200"
                }`}
              >
                <CardContent className="p-3">
                  {/* Row 1: Washer Info + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{batch.washerName}</p>
                      <p className="text-xs text-gray-600">{batch.washerId}</p>
                    </div>
                    <Badge variant="outline" className={config.color}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Row 2: Batch Details */}
                  {batch.issuedDate ? (
                    <div className="grid grid-cols-3 gap-2 text-xs mb-2 py-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-gray-600">Batch ID</p>
                        <p className="font-bold text-gray-900">{batch.batchId}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Days in Use</p>
                        <p className={`font-bold ${batch.daysInUse >= 3 ? "text-red-600" : "text-gray-900"}`}>
                          {batch.daysInUse}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cloths</p>
                        <p className="font-bold text-gray-900">{batch.clothCount}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-100 border border-red-300 rounded p-2 mb-2">
                      <p className="text-sm font-semibold text-red-700">
                        🔴 NO VALID BATCH — OPERATION NOT ALLOWED
                      </p>
                    </div>
                  )}

                  {/* Row 3: Flags */}
                  <div className="flex items-center gap-2 mb-2">
                    {batch.isSanitized && (
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                        ✓ Sanitized
                      </Badge>
                    )}
                    {batch.isReservedForAbsent && (
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 text-xs">
                        Reserved (Absent)
                      </Badge>
                    )}
                    {batch.condition === "DAMAGED" && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        ⚠️ Damaged
                      </Badge>
                    )}
                  </div>

                  {/* Row 4: Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {batch.status === "DUE" || batch.status === "OVERDUE" ? (
                      <Button
                        size="sm"
                        className={`h-9 ${
                          batch.status === "OVERDUE"
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        } text-white`}
                        onClick={() => {
                          setSelectedBatch(batch);
                          setShowCollectModal(true);
                        }}
                      >
                        Collect Batch
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="h-9" disabled>
                        {batch.status === "FRESH" ? "Just Issued" : "In Use"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        const reason = prompt("Enter loss/damage reason:");
                        if (reason) {
                          onReportLossDamage(batch.washerId, 2, reason);
                        }
                      }}
                    >
                      Report Loss
                    </Button>
                  </div>
                </CardContent>
              </Card>
                );
              })}</>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: BUFFER STOCK */}
          <TabsContent value="buffer" className="space-y-3">
            {/* Low Stock Alerts */}
            {lowStockAlerts.length > 0 && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Low Stock Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockAlerts.map((alert, idx) => (
                      <div key={idx} className="bg-white rounded p-2 border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm">{alert.materialName}</p>
                            <p className="text-xs text-gray-600">
                              Current: {alert.currentQuantity} | Min: {alert.minThreshold}
                            </p>
                          </div>
                          <Badge variant="destructive">{alert.priority}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Buffer Stock Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-green-300 text-green-700 hover:bg-green-50"
                  onClick={() => setShowInwardModal(true)}
                >
                  <ArrowDownCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Receive Stock</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-12 flex flex-col items-center justify-center border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={() => setShowOutwardModal(true)}
                >
                  <ArrowUpCircle className="h-5 w-5 mb-1" />
                  <span className="text-xs">Issue to Washer</span>
                </Button>
              </CardContent>
            </Card>

            {/* Buffer Stock List */}
            <div className="space-y-2">
              {bufferStock.map((item) => (
                <Card key={item.id} className={`border-2 ${item.isLowStock ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.materialName}</p>
                        <p className="text-xs text-gray-600">{item.materialType}</p>
                      </div>
                      {item.isLowStock && (
                        <Badge variant="destructive">Low Stock</Badge>
                      )}
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

          {/* TAB 3: TRANSACTION HISTORY */}
          <TabsContent value="history" className="space-y-3">
            {/* Inward Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownCircle className="h-4 w-4 text-green-600" />
                  Inward (Received from HO/Store)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {inwardTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No inward transactions</p>
                ) : (
                  inwardTransactions.map((txn) => (
                    <div key={txn.id} className="bg-green-50 border border-green-200 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{txn.materialName}</p>
                        <Badge variant="outline" className="bg-white">{txn.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>Qty: <span className="font-semibold">{txn.quantity} {txn.unit}</span></p>
                        <p>From: <span className="font-semibold">{txn.receivedFrom}</span></p>
                        <p>DN: <span className="font-semibold">{txn.deliveryNote}</span></p>
                        <p>Date: <span className="font-semibold">{new Date(txn.transactionDate).toLocaleDateString()}</span></p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Outward Transactions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                  Outward (Issued to Washers)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {outwardTransactions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No outward transactions</p>
                ) : (
                  outwardTransactions.map((txn) => (
                    <div key={txn.id} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-sm">{txn.materialName}</p>
                        <Badge variant="outline" className="bg-white">{txn.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <p>Qty: <span className="font-semibold">{txn.quantity} {txn.unit}</span></p>
                        <p>To: <span className="font-semibold">{txn.issuedToName}</span></p>
                        <p>Purpose: <span className="font-semibold">{txn.purpose}</span></p>
                        <p>Date: <span className="font-semibold">{new Date(txn.transactionDate).toLocaleDateString()}</span></p>
                      </div>
                      {txn.acknowledgement && (
                        <div className="mt-2 pt-2 border-t border-blue-300">
                          <p className="text-xs">
                            {txn.acknowledgement.acknowledged ? (
                              <span className="text-green-600 font-semibold">✓ Acknowledged</span>
                            ) : (
                              <span className="text-amber-600 font-semibold">⏳ Pending Acknowledgement</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Collect Modal */}
      {showCollectModal && selectedBatch && (
        <CollectBatchModal
          batch={selectedBatch}
          onConfirm={(condition) => {
            onCollectBatch(selectedBatch.washerId, selectedBatch.batchId, condition);
            setShowCollectModal(false);
            setSelectedBatch(null);
          }}
          onCancel={() => {
            setShowCollectModal(false);
            setSelectedBatch(null);
          }}
        />
      )}

      {/* Issue Modal */}
      {showIssueModal && (
        <IssueBatchModal
          onConfirm={(washerId, batchId, isSanitized) => {
            onIssueBatch(washerId, batchId, isSanitized);
            setShowIssueModal(false);
          }}
          onCancel={() => setShowIssueModal(false)}
        />
      )}

      {/* Inward Transaction Modal */}
      {showInwardModal && (
        <InwardTransactionModal
          onConfirm={(data) => {
            const result = supervisorBufferStockService.recordInwardStock(
              "SUP-001",
              data.materialType,
              data.materialName,
              data.quantity,
              data.unit,
              data.receivedFrom,
              data.deliveryNote
            );
            if (result.success) {
              toast.success("Inward stock recorded successfully");
              // Refresh data
              setBufferStock(supervisorBufferStockService.getBufferStock("SUP-001"));
              setInwardTransactions(supervisorBufferStockService.getInwardTransactions("SUP-001"));
              setLowStockAlerts(supervisorBufferStockService.getLowStockAlerts("SUP-001"));
            } else {
              toast.error(result.error || "Failed to record inward stock");
            }
            setShowInwardModal(false);
          }}
          onCancel={() => setShowInwardModal(false)}
        />
      )}

      {/* Outward Transaction Modal */}
      {showOutwardModal && (
        <OutwardTransactionModal
          bufferStock={bufferStock}
          onConfirm={(data) => {
            const result = supervisorBufferStockService.issueStockToWasher(
              "SUP-001",
              data.washerId,
              data.washerName,
              data.materialType,
              data.materialName,
              data.quantity,
              data.unit,
              data.purpose
            );
            if (result.success) {
              toast.success("Stock issued to washer successfully");
              // Refresh data
              setBufferStock(supervisorBufferStockService.getBufferStock("SUP-001"));
              setOutwardTransactions(supervisorBufferStockService.getOutwardTransactions("SUP-001"));
              setLowStockAlerts(supervisorBufferStockService.getLowStockAlerts("SUP-001"));
            } else {
              toast.error(result.error || "Failed to issue stock");
            }
            setShowOutwardModal(false);
          }}
          onCancel={() => setShowOutwardModal(false)}
        />
      )}
    </div>
  );
}

// ========== COLLECT BATCH MODAL ==========

interface CollectBatchModalProps {
  batch: ClothBatch;
  onConfirm: (condition: BatchCondition) => void;
  onCancel: () => void;
}

function CollectBatchModal({ batch, onConfirm, onCancel }: CollectBatchModalProps) {
  const [condition, setCondition] = useState<BatchCondition>("NORMAL");

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Collect Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Washer:</p>
            <p className="font-bold">{batch.washerName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Batch ID:</p>
            <p className="font-bold">{batch.batchId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Condition:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`h-12 rounded-lg border-2 font-semibold ${
                  condition === "NORMAL"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setCondition("NORMAL")}
              >
                Normal
              </button>
              <button
                className={`h-12 rounded-lg border-2 font-semibold ${
                  condition === "DAMAGED"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setCondition("DAMAGED")}
              >
                Damaged
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => onConfirm(condition)}>
              Confirm Collection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== ISSUE BATCH MODAL ==========

interface IssueBatchModalProps {
  onConfirm: (washerId: string, batchId: BatchID, isSanitized: boolean) => void;
  onCancel: () => void;
}

function IssueBatchModal({ onConfirm, onCancel }: IssueBatchModalProps) {
  const [washerId, setWasherId] = useState("");
  const [batchId, setBatchId] = useState<BatchID>("BATCH_A");
  const [isSanitized, setIsSanitized] = useState(false);

  const batchOptions: BatchID[] = ["BATCH_A", "BATCH_B", "BATCH_C", "BATCH_D"];

  const canSubmit = washerId.trim() !== "" && isSanitized;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Issue Fresh Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Washer ID:</label>
            <input
              type="text"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="Enter washer ID"
              value={washerId}
              onChange={(e) => setWasherId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Batch ID:</label>
            <div className="grid grid-cols-2 gap-2">
              {batchOptions.map((batch) => (
                <button
                  key={batch}
                  className={`h-10 rounded-lg border-2 font-semibold ${
                    batchId === batch
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setBatchId(batch)}
                >
                  {batch}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="h-5 w-5 mt-0.5 rounded border-gray-300"
                checked={isSanitized}
                onChange={(e) => setIsSanitized(e.target.checked)}
              />
              <div className="flex-1">
                <p className="font-bold text-gray-900">Sanitized Bag Verified ✓</p>
                <p className="text-xs text-gray-600 mt-1">
                  Confirm sealed sanitized bag before issuance
                </p>
              </div>
            </label>
          </div>
          {!isSanitized && (
            <p className="text-xs text-red-600 text-center">
              ⚠️ Cannot issue batch without sanitization verification
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => onConfirm(washerId, batchId, isSanitized)}
              disabled={!canSubmit}
            >
              Issue Batch
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== INWARD TRANSACTION MODAL ==========

interface InwardTransactionModalProps {
  onConfirm: (data: {
    materialType: MaterialType;
    materialName: string;
    quantity: number;
    unit: string;
    receivedFrom: "HO" | "STORE";
    deliveryNote: string;
  }) => void;
  onCancel: () => void;
}

function InwardTransactionModal({ onConfirm, onCancel }: InwardTransactionModalProps) {
  const [materialType, setMaterialType] = useState<MaterialType>("CLOTH_BATCH");
  const [materialName, setMaterialName] = useState("Cloth Batches (A/B/C/D)");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("batches");
  const [receivedFrom, setReceivedFrom] = useState<"HO" | "STORE">("HO");
  const [deliveryNote, setDeliveryNote] = useState("");

  const materialOptions: { type: MaterialType; name: string; defaultUnit: string }[] = [
    { type: "CLOTH_BATCH", name: "Cloth Batches (A/B/C/D)", defaultUnit: "batches" },
    { type: "SHAMPOO", name: "Car Shampoo (5L)", defaultUnit: "liters" },
    { type: "WAX", name: "Car Wax Polish", defaultUnit: "bottles" },
    { type: "VACUUM_BAG", name: "Vacuum Cleaner Bags", defaultUnit: "pieces" },
    { type: "OTHER", name: "Other Material", defaultUnit: "units" },
  ];

  const canSubmit = materialName.trim() !== "" && Number(quantity) > 0 && deliveryNote.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownCircle className="h-5 w-5 text-green-600" />
            Receive Stock from HO/Store
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Material Type:</label>
            <select
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              value={materialType}
              onChange={(e) => {
                const selected = materialOptions.find((m) => m.type === e.target.value);
                if (selected) {
                  setMaterialType(selected.type);
                  setMaterialName(selected.name);
                  setUnit(selected.defaultUnit);
                }
              }}
            >
              {materialOptions.map((option) => (
                <option key={option.type} value={option.type}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Quantity:</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 h-10 px-3 border border-gray-300 rounded-lg"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <input
                type="text"
                className="w-24 h-10 px-3 border border-gray-300 rounded-lg"
                placeholder="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Received From:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`h-10 rounded-lg border-2 font-semibold ${
                  receivedFrom === "HO"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setReceivedFrom("HO")}
              >
                Head Office
              </button>
              <button
                className={`h-10 rounded-lg border-2 font-semibold ${
                  receivedFrom === "STORE"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-300 bg-white text-gray-700"
                }`}
                onClick={() => setReceivedFrom("STORE")}
              >
                Store
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Delivery Note #:</label>
            <input
              type="text"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="e.g., DN-2024-001"
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                onConfirm({
                  materialType,
                  materialName,
                  quantity: Number(quantity),
                  unit,
                  receivedFrom,
                  deliveryNote,
                })
              }
              disabled={!canSubmit}
            >
              Record Inward
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ========== OUTWARD TRANSACTION MODAL ==========

interface OutwardTransactionModalProps {
  bufferStock: BufferStockItem[];
  onConfirm: (data: {
    washerId: string;
    washerName: string;
    materialType: MaterialType;
    materialName: string;
    quantity: number;
    unit: string;
    purpose: string;
  }) => void;
  onCancel: () => void;
}

function OutwardTransactionModal({ bufferStock, onConfirm, onCancel }: OutwardTransactionModalProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<BufferStockItem | null>(
    bufferStock[0] || null
  );
  const [washerId, setWasherId] = useState("");
  const [washerName, setWasherName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purpose, setPurpose] = useState("");

  const canSubmit =
    selectedMaterial &&
    washerId.trim() !== "" &&
    washerName.trim() !== "" &&
    Number(quantity) > 0 &&
    purpose.trim() !== "";

  const quantityExceedsStock = selectedMaterial && Number(quantity) > selectedMaterial.currentQuantity;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpCircle className="h-5 w-5 text-blue-600" />
            Issue Stock to Washer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Material:</label>
            <select
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              value={selectedMaterial?.id || ""}
              onChange={(e) => {
                const material = bufferStock.find((m) => m.id === e.target.value);
                setSelectedMaterial(material || null);
              }}
            >
              {bufferStock.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.materialName} (Available: {item.currentQuantity} {item.unit})
                </option>
              ))}
            </select>
          </div>
          {selectedMaterial && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs">
              <p className="text-gray-600">
                Available: <span className="font-bold text-gray-900">{selectedMaterial.currentQuantity} {selectedMaterial.unit}</span>
              </p>
            </div>
          )}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Washer ID:</label>
            <input
              type="text"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="e.g., W001"
              value={washerId}
              onChange={(e) => setWasherId(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Washer Name:</label>
            <input
              type="text"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="e.g., Suresh Kumar"
              value={washerName}
              onChange={(e) => setWasherName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Quantity:</label>
            <div className="flex gap-2">
              <input
                type="number"
                className={`flex-1 h-10 px-3 border rounded-lg ${
                  quantityExceedsStock ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <div className="w-24 h-10 px-3 border border-gray-300 rounded-lg flex items-center bg-gray-50 text-gray-600">
                {selectedMaterial?.unit || "units"}
              </div>
            </div>
            {quantityExceedsStock && (
              <p className="text-xs text-red-600 mt-1">⚠️ Insufficient stock</p>
            )}
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Purpose:</label>
            <input
              type="text"
              className="w-full h-10 px-3 border border-gray-300 rounded-lg"
              placeholder="e.g., Daily shift requirement"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (selectedMaterial) {
                  onConfirm({
                    washerId,
                    washerName,
                    materialType: selectedMaterial.materialType,
                    materialName: selectedMaterial.materialName,
                    quantity: Number(quantity),
                    unit: selectedMaterial.unit,
                    purpose,
                  });
                }
              }}
              disabled={!canSubmit || quantityExceedsStock}
            >
              Issue Stock
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
