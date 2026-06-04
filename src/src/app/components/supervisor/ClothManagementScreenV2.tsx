/**
 * CLOTH & INVENTORY MANAGEMENT V2
 * Aligned with real operational flow
 *
 * DUAL SYSTEM:
 * 1. RETURNABLE ITEMS (Cloths): Individual tracking, mandatory return, lifecycle management
 * 2. CONSUMABLES: Buffer stock, one-way flow, consumption tracking
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertTriangle,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { clothLifecycleService, type IndividualCloth, type ClothStatus } from "../../services/clothLifecycleService";
import { supervisorBufferStockService, type BufferStockItem } from "../../services/supervisorBufferStockService";
import { toast } from "sonner";

export function ClothManagementScreenV2() {
  const supervisorId = "SUP-001";

  // Tab State
  const [activeTab, setActiveTab] = useState<"cloths" | "consumables" | "history">("cloths");

  // RETURNABLE ITEMS State
  const [supervisorCloths, setSupervisorCloths] = useState<IndividualCloth[]>([]);
  const [clothInventory, setClothInventory] = useState<any>(null);

  // CONSUMABLES State
  const [bufferStock, setBufferStock] = useState<BufferStockItem[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  // Load data
  useEffect(() => {
    setSupervisorCloths(clothLifecycleService.getSupervisorBufferCloths(supervisorId));
    setClothInventory(clothLifecycleService.getInventorySummary());
    setBufferStock(supervisorBufferStockService.getBufferStock(supervisorId));
    setLowStockAlerts(supervisorBufferStockService.getLowStockAlerts(supervisorId));
  }, [supervisorId]);

  const statusColors: Record<ClothStatus, string> = {
    IN_STORE: "bg-gray-100 text-gray-700 border-gray-300",
    WITH_SUPERVISOR: "bg-blue-100 text-blue-700 border-blue-300",
    WITH_WASHER: "bg-green-100 text-green-700 border-green-300",
    IN_LAUNDRY: "bg-purple-100 text-purple-700 border-purple-300",
    READY: "bg-teal-100 text-teal-700 border-teal-300",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-teal-600 to-teal-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Inventory Management</h1>
          <p className="text-sm text-teal-100">Returnable Items + Consumables</p>
        </div>

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

        {(clothInventory?.damaged || 0) > 0 && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🔴 {clothInventory.damaged} DAMAGED/LOST</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cloths">
              Cloths
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

          {/* TAB 1: RETURNABLE ITEMS (CLOTHS) */}
          <TabsContent value="cloths" className="space-y-3">
            {/* Info Banner */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900 font-semibold mb-1">
                  Individual Cloth Tracking (Store Owned)
                </p>
                <p className="text-xs text-blue-700">
                  • Return mandatory before new issue • 90-wash lifecycle • Laundry flow enabled
                </p>
              </CardContent>
            </Card>

            {/* Individual Cloths */}
            <div className="space-y-2">
              {supervisorCloths.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No cloths in buffer</p>
                    <p className="text-xs mt-1">Request from Store</p>
                  </CardContent>
                </Card>
              ) : (
                supervisorCloths.map((cloth) => (
                  <Card
                    key={cloth.clothId}
                    className={`border-2 ${
                      cloth.condition === "DAMAGED"
                        ? "border-red-300 bg-red-50"
                        : cloth.currentWashCount > 80
                        ? "border-amber-200 bg-amber-50"
                        : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{cloth.clothId}</p>
                          <p className="text-xs text-gray-600">Batch {cloth.batchId}</p>
                        </div>
                        <Badge variant="outline" className={statusColors[cloth.status]}>
                          {cloth.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs mb-2 bg-gray-50 rounded p-2">
                        <div>
                          <p className="text-gray-600">Wash Count</p>
                          <p
                            className={`font-bold ${
                              cloth.currentWashCount > 80
                                ? "text-red-600"
                                : cloth.currentWashCount > 60
                                ? "text-amber-600"
                                : "text-gray-900"
                            }`}
                          >
                            {cloth.currentWashCount} / {cloth.maxWashCount}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Condition</p>
                          <p className="font-bold text-gray-900">{cloth.condition}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Remaining</p>
                          <p className="font-bold text-gray-900">
                            {cloth.maxWashCount - cloth.currentWashCount}
                          </p>
                        </div>
                      </div>

                      {cloth.currentWashCount > 80 && (
                        <div className="mb-2">
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                            ⚠️ Near End-of-Life
                          </Badge>
                        </div>
                      )}

                      {cloth.status === "READY" && (
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => toast.info("Issue to Washer modal - coming next")}
                        >
                          <ArrowUpCircle className="h-4 w-4 mr-1" />
                          Issue to Washer
                        </Button>
                      )}

                      {cloth.status === "WITH_SUPERVISOR" && cloth.condition === "NORMAL" && (
                        <Button
                          size="sm"
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          onClick={() => toast.info("Send to Laundry modal - coming next")}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Send to Laundry
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* TAB 2: CONSUMABLES */}
          <TabsContent value="consumables" className="space-y-3">
            {/* Info Banner */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <p className="text-sm text-green-900 font-semibold mb-1">
                  Consumable Materials (One-Way Flow)
                </p>
                <p className="text-xs text-green-700">
                  • Tracked by consumption • Linked to service packages • Limited stock to washers
                </p>
              </CardContent>
            </Card>

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

            {/* Buffer Stock */}
            <div className="space-y-2">
              {bufferStock.map((item) => (
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

          {/* TAB 3: HISTORY */}
          <TabsContent value="history" className="space-y-3">
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                <p className="text-sm">Transaction history will appear here</p>
                <p className="text-xs mt-1">Cloth transfers + Consumable issues</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
