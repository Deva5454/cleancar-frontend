/**
 * STORE INVENTORY MANAGEMENT
 * Master Owner of all materials
 *
 * Functions:
 * - View complete inventory (Consumables, Reusable, Assets)
 * - Process refill requests from supervisors
 * - Manage broken items and repairs
 * - Transfer materials to supervisors
 * - Track all transactions
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Package,
  Wrench,
  TruckIcon,
  AlertCircle,
  CheckCircle,
  XCircle,
  Archive,
  ArrowUpCircle,
} from "lucide-react";
import {
  unifiedMaterialService,
  type MaterialMaster,
  type IndividualItem,
  type BulkInventory,
  type RefillRequest,
  type MaterialTransaction,
} from "../../services/unifiedMaterialService";
import { toast } from "sonner";

export function StoreInventoryManagement() {
  const storeId = "STORE-001";

  // Tab State
  const [activeTab, setActiveTab] = useState<"inventory" | "refills" | "repairs" | "transactions">("inventory");

  // Inventory State
  const [materialMaster, setMaterialMaster] = useState<MaterialMaster[]>([]);
  const [bulkInventory, setBulkInventory] = useState<BulkInventory[]>([]);
  const [individualItems, setIndividualItems] = useState<IndividualItem[]>([]);

  // Requests State
  const [refillRequests, setRefillRequests] = useState<RefillRequest[]>([]);
  const [brokenItems, setBrokenItems] = useState<IndividualItem[]>([]);

  // Transactions
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);

  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<IndividualItem | null>(null);

  // Load data
  useEffect(() => {
    setMaterialMaster(unifiedMaterialService.getMaterialMaster());
    setBulkInventory(unifiedMaterialService.getBulkInventory("STORE", storeId));
    setIndividualItems(unifiedMaterialService.getItemsByLocation(storeId));
    setRefillRequests(unifiedMaterialService.getPendingRefillRequests());
    setBrokenItems(unifiedMaterialService.getBrokenItems());
    setTransactions(unifiedMaterialService.getTransactionsByEntity(storeId));
  }, [storeId]);

  const pendingRefills = refillRequests.filter(r => r.status === "PENDING");
  const urgentRefills = pendingRefills.filter(r => r.urgency === "URGENT" || r.urgency === "CRITICAL");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Store Inventory Management</h1>
          <p className="text-sm text-indigo-100">Master Owner - Complete Material Control</p>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-indigo-100">Total Materials</p>
              <p className="text-2xl font-bold">{materialMaster.length}</p>
            </div>
            <div>
              <p className="text-indigo-100">Individual Items</p>
              <p className="text-2xl font-bold">{individualItems.length}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-indigo-100">Pending Refills</p>
              <p className={`text-lg font-bold ${urgentRefills.length > 0 ? "text-red-300" : ""}`}>
                {pendingRefills.length}
                {urgentRefills.length > 0 && ` (${urgentRefills.length} urgent)`}
              </p>
            </div>
            <div>
              <p className="text-indigo-100">Broken Items</p>
              <p className={`text-lg font-bold ${brokenItems.length > 0 ? "text-red-300" : ""}`}>
                {brokenItems.length}
              </p>
            </div>
          </div>
        </div>

        {urgentRefills.length > 0 && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-bold">🔴 {urgentRefills.length} URGENT REFILL REQUESTS</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="inventory">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="refills">
              Refills
              {pendingRefills.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {pendingRefills.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="repairs">
              Repairs
              {brokenItems.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">
                  {brokenItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="transactions">History</TabsTrigger>
          </TabsList>

          {/* TAB 1: INVENTORY */}
          <TabsContent value="inventory" className="space-y-3">
            {/* Info Banner */}
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="p-3">
                <p className="text-sm text-indigo-900 font-semibold mb-1">
                  Store = Master Owner of All Materials
                </p>
                <p className="text-xs text-indigo-700">
                  • Consumables (bulk tracking) • Reusable (lifecycle) • Assets (individual ID)
                </p>
              </CardContent>
            </Card>

            {/* Consumables */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">
                Consumables (Bulk Inventory)
              </h3>
              {bulkInventory.filter(i => i.location === "STORE").map((item) => (
                <Card key={item.id} className={`border-2 ${item.isLowStock ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.materialName}</p>
                        <p className="text-xs text-gray-600">{item.materialType}</p>
                      </div>
                      {item.isLowStock && <Badge variant="outline" className="bg-amber-100 text-amber-700">Low Stock</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-gray-600">Current</p>
                        <p className={`text-lg font-bold ${item.isLowStock ? "text-amber-600" : "text-gray-900"}`}>
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

            {/* Individual Items (Assets & Reusable) */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 px-1">
                Assets & Reusable Items ({individualItems.length} items)
              </h3>
              {individualItems.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items in store</p>
                  </CardContent>
                </Card>
              ) : (
                individualItems.map((item) => (
                  <Card
                    key={item.itemId}
                    className={`border-2 ${
                      item.status === "BROKEN"
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{item.itemId}</p>
                          <p className="text-xs text-gray-600">{item.name}</p>
                        </div>
                        <Badge variant="outline" className={
                          item.status === "BROKEN"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : "bg-green-100 text-green-700 border-green-300"
                        }>
                          {item.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-gray-50 rounded p-2">
                        <div>
                          <p className="text-gray-600">Category</p>
                          <p className="font-bold text-gray-900">{item.category}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Condition</p>
                          <p className="font-bold text-gray-900">
                            {item.assetCondition || item.reusableCondition || "N/A"}
                          </p>
                        </div>
                      </div>

                      {item.status !== "BROKEN" && (
                        <Button
                          size="sm"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                          onClick={() => toast.info("Transfer to Supervisor modal - coming")}
                        >
                          <TruckIcon className="h-4 w-4 mr-1" />
                          Transfer to Supervisor
                        </Button>
                      )}

                      {item.status === "BROKEN" && (
                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          onClick={() => {
                            setSelectedItem(item);
                            setShowRepairModal(true);
                          }}
                        >
                          <Wrench className="h-4 w-4 mr-1" />
                          Send for Repair
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: REFILL REQUESTS */}
          <TabsContent value="refills" className="space-y-3">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900 font-semibold">
                  Process refill requests from supervisors
                </p>
              </CardContent>
            </Card>

            {refillRequests.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No pending refill requests</p>
                </CardContent>
              </Card>
            ) : (
              refillRequests.map((request) => (
                <Card
                  key={request.id}
                  className={`border-2 ${
                    request.urgency === "CRITICAL"
                      ? "border-red-300 bg-red-50"
                      : request.urgency === "URGENT"
                      ? "border-amber-300 bg-amber-50"
                      : "border-gray-200"
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{request.materialName}</p>
                        <p className="text-xs text-gray-600">
                          From: {request.requestedByName}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          request.urgency === "CRITICAL"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : request.urgency === "URGENT"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        }
                      >
                        {request.urgency}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mb-2 bg-gray-50 rounded p-2">
                      <div>
                        <p className="text-gray-600">Requested Qty</p>
                        <p className="font-bold text-gray-900">
                          {request.requestedQuantity} {request.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Date</p>
                        <p className="font-bold text-gray-900">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 mb-3">
                      <span className="font-semibold">Reason:</span> {request.reason}
                    </p>

                    {request.status === "PENDING" && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => toast.info("Reject request")}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => toast.success("Request approved & dispatched")}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve & Dispatch
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 3: REPAIRS */}
          <TabsContent value="repairs" className="space-y-3">
            <Card className="border-2 border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <p className="text-sm text-orange-900 font-semibold">
                  Manage broken items and repair workflow
                </p>
              </CardContent>
            </Card>

            {brokenItems.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="p-6 text-center text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No broken items</p>
                </CardContent>
              </Card>
            ) : (
              brokenItems.map((item) => (
                <Card key={item.itemId} className="border-2 border-red-300 bg-red-50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{item.itemId}</p>
                        <p className="text-xs text-gray-600">{item.name}</p>
                      </div>
                      <Badge variant="destructive">BROKEN</Badge>
                    </div>

                    {item.repairHistory && item.repairHistory.length > 0 && (
                      <div className="bg-white rounded p-2 mb-2 text-xs">
                        <p className="font-semibold text-gray-900 mb-1">Last Report:</p>
                        <p className="text-gray-700">
                          <span className="font-semibold">Issue:</span>{" "}
                          {item.repairHistory[item.repairHistory.length - 1].issue}
                        </p>
                        <p className="text-gray-600">
                          Reported by: {item.repairHistory[item.repairHistory.length - 1].reportedBy} on{" "}
                          {new Date(item.repairHistory[item.repairHistory.length - 1].reportedDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <Button
                      size="sm"
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      onClick={() => toast.info("Send to repair vendor")}
                    >
                      <Wrench className="h-4 w-4 mr-1" />
                      Send to Repair Vendor
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* TAB 4: TRANSACTIONS */}
          <TabsContent value="transactions" className="space-y-3">
            <Card className="border-2 border-gray-200">
              <CardContent className="p-3">
                <p className="text-sm text-gray-700">
                  Complete transaction history ({transactions.length} records)
                </p>
              </CardContent>
            </Card>

            {transactions.slice(0, 10).map((txn) => (
              <Card key={txn.id} className="border-2 border-gray-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{txn.materialName}</p>
                    <Badge variant="outline">{txn.transactionType.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <p>From: <span className="font-semibold">{txn.fromName}</span></p>
                    <p>To: <span className="font-semibold">{txn.toName}</span></p>
                    <p>Date: <span className="font-semibold">{new Date(txn.transactionDate).toLocaleDateString()}</span></p>
                    <p>Qty: <span className="font-semibold">{txn.quantity || "1"} {txn.unit || "item"}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
