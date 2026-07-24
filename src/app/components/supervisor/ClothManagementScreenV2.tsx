/**
 * ClothManagementScreenV2.tsx — Cloths (returnable, individually
 * tracked) and Consumables (bulk buffer stock), for the logged-in
 * Supervisor.
 *
 * ✅ MIGRATED off two disconnected, in-memory-only systems:
 * - The Consumables tab used to read supervisorBufferStockService.ts.
 *   It now reads real InventoryContext, the same source every other
 *   stock screen (My Stock, Stock Receipt, Material Management) uses.
 * - The Cloths tab used to read clothLifecycleService.ts — a THIRD,
 *   separate, disconnected cloth model that was never the same one
 *   actually used by the real cloth chain elsewhere in this app
 *   (ClothChainMovement.tsx, ClothReturnJourney.tsx, KimLaundryScreen.tsx
 *   all use the real clothTrackingService.ts). It now reads that same
 *   real service, so a cloth shown here is the same real, barcoded
 *   cloth those other screens already move around correctly.
 *
 * One honest, deliberate scope note: the real cloth chain moves cloths
 * through a barcode-scan exchange, not a simple button click (see
 * clothTrackingService.ts's scanCloth()). The "Issue to Washer" and
 * "Send to Laundry" actions on this screen were already non-functional
 * placeholders before this migration — rather than invent new button-
 * click logic that would bypass the real scan/match validation those
 * dedicated screens enforce, they now point to the real screens that
 * actually do this, instead of a fake toast.
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertTriangle, Package, AlertCircle,
} from "lucide-react";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { clothTrackingService } from "../../services/clothTrackingService";
import type { ClothItem } from "../../types/clothTracking";

const STATUS_COLORS: Record<string, string> = {
  CLEAN_PACKED: "bg-teal-100 text-teal-700 border-teal-300",
  ISSUED: "bg-green-100 text-green-700 border-green-300",
  USED_PENDING_COLLECTION: "bg-amber-100 text-amber-700 border-amber-300",
  IN_LAUNDRY_PROCESS: "bg-purple-100 text-purple-700 border-purple-300",
  EXPIRED: "bg-gray-100 text-gray-700 border-gray-300",
};

export function ClothManagementScreenV2() {
  const { getSupervisorStock } = useInventory();
  const { city } = useCity();
  const { currentUser } = useRole();

  // Real, currently-logged-in supervisor — not a hardcoded ID.
  const supervisorId = currentUser?.employeeId || "";

  const [activeTab, setActiveTab] = useState<"cloths" | "consumables" | "history">("cloths");
  const [supervisorCloths, setSupervisorCloths] = useState<Array<ClothItem & { washesRemaining: number }>>([]);

  useEffect(() => {
    if (supervisorId) {
      setSupervisorCloths(clothTrackingService.getClothsForSupervisor(supervisorId));
    }
  }, [supervisorId]);

  // Real consumables buffer stock — same real function every other
  // migrated supervisor screen now uses.
  const bufferStock = supervisorId ? getSupervisorStock(supervisorId, city) : [];
  const consumableItems = bufferStock.filter((i: any) => i.category !== "Equipment");
  const lowStockAlerts = consumableItems.filter((i: any) => (i.supervisorStock[supervisorId] || 0) <= i.reorderLevel);

  const damagedCount = supervisorCloths.filter((c) => c.status === "EXPIRED").length;
  const nearEndOfLife = (c: ClothItem) => c.washCount > 80;

  if (!supervisorId) {
    return (
      <div className="p-6 text-center text-sm text-gray-500">
        Could not identify the logged-in supervisor — please log in again.
      </div>
    );
  }

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
              <p className="text-teal-100">Low Stock Alerts</p>
              <p className={`text-lg font-bold ${lowStockAlerts.length > 0 ? "text-red-300" : ""}`}>{lowStockAlerts.length}</p>
            </div>
          </div>
        </div>

        {damagedCount > 0 && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">🔴 {damagedCount} RETIRED/EXPIRED</span>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="cloths">
              Cloths
              {damagedCount > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{damagedCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="consumables">
              Consumables
              {lowStockAlerts.length > 0 && <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{lowStockAlerts.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* TAB 1: CLOTHS */}
          <TabsContent value="cloths" className="space-y-3">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <p className="text-sm text-blue-900 font-semibold mb-1">Individual Cloth Tracking (Store Owned)</p>
                <p className="text-xs text-blue-700">• 90-wash lifecycle • Real barcode, real wash count</p>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {supervisorCloths.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No cloths in your buffer</p>
                    <p className="text-xs mt-1">Received via the Kim → Branch → Supervisor cloth chain</p>
                  </CardContent>
                </Card>
              ) : (
                supervisorCloths.map((cloth) => (
                  <Card
                    key={cloth.id}
                    className={`border-2 ${cloth.status === "EXPIRED" ? "border-red-300 bg-red-50" : nearEndOfLife(cloth) ? "border-amber-200 bg-amber-50" : "border-gray-200"}`}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">#{cloth.shortId}</p>
                          <p className="text-xs text-gray-600">{cloth.type}{cloth.color ? ` — ${cloth.color}` : ""}</p>
                        </div>
                        <Badge variant="outline" className={STATUS_COLORS[cloth.status] || ""}>
                          {cloth.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded p-2">
                        <div>
                          <p className="text-gray-600">Wash Count</p>
                          <p className={`font-bold ${cloth.washCount > 80 ? "text-red-600" : cloth.washCount > 60 ? "text-amber-600" : "text-gray-900"}`}>
                            {cloth.washCount} / 90
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Washes Remaining</p>
                          <p className="font-bold text-gray-900">{cloth.washesRemaining}</p>
                        </div>
                      </div>

                      {nearEndOfLife(cloth) && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-xs mt-2">
                          ⚠️ Near End-of-Life
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {supervisorCloths.length > 0 && (
              <Card className="border border-gray-200 bg-gray-50">
                <CardContent className="p-3 text-xs text-gray-600">
                  Issuing to a washer or sending to laundry happens through a real barcode scan, which validates
                  matching dirty/clean counts by color — use the dedicated Cloth Chain Movement / Laundry screens
                  for that real action, rather than a plain button here.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: CONSUMABLES */}
          <TabsContent value="consumables" className="space-y-3">
            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="p-3">
                <p className="text-sm text-green-900 font-semibold mb-1">Consumable Materials (One-Way Flow)</p>
                <p className="text-xs text-green-700">Real quantities currently in your buffer</p>
              </CardContent>
            </Card>

            {lowStockAlerts.length > 0 && (
              <Card className="border-2 border-red-300 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-bold text-red-900">Low Stock Alerts</h3>
                  </div>
                  <div className="space-y-2">
                    {lowStockAlerts.map((item: any) => (
                      <div key={item.itemId} className="bg-white rounded p-2 border border-red-200">
                        <p className="font-semibold text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">
                          Current: {item.supervisorStock[supervisorId] || 0} {item.unit} | Reorder at: {item.reorderLevel} {item.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {consumableItems.length === 0 ? (
                <Card className="border-2 border-gray-200">
                  <CardContent className="p-6 text-center text-gray-500">
                    <p className="text-sm">No consumables in your buffer</p>
                  </CardContent>
                </Card>
              ) : (
                consumableItems.map((item: any) => {
                  const qty = item.supervisorStock[supervisorId] || 0;
                  const isLow = qty <= item.reorderLevel;
                  return (
                    <Card key={item.itemId} className={`border-2 ${isLow ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-900">{item.itemName}</p>
                          {isLow && <Badge variant="destructive">Low Stock</Badge>}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-600">Current</p>
                            <p className={`text-lg font-bold ${isLow ? "text-red-600" : "text-gray-900"}`}>{qty}</p>
                            <p className="text-gray-500">{item.unit}</p>
                          </div>
                          <div className="bg-gray-50 rounded p-2">
                            <p className="text-gray-600">Reorder Level</p>
                            <p className="text-lg font-bold text-gray-900">{item.reorderLevel}</p>
                            <p className="text-gray-500">{item.unit}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
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

export default ClothManagementScreenV2;
