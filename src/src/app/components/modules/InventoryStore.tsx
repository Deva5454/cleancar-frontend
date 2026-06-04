import { Plus, Download, Package, AlertTriangle, TrendingUp, Users, FileText, Truck } from "lucide-react";
import { useInventory } from "../../contexts/InventoryContext";
import { useEventListener } from "../../contexts/EventSystem";
import { BackButton } from "../ui/back-button";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { useEffect, useState } from "react";
import { logger } from "../../services/logger";

export function InventoryStore() {
  const { inventory, getLowStockItems } = useInventory();
  const [isLoading, setIsLoading] = useState(true);

  // Listen for inventory updates
  useEventListener("INVENTORY_ISSUED", () => {
    logger.log("[InventoryStore] Inventory issued - UI auto-updating from context");
  });

  useEventListener("INVENTORY_LOW_STOCK", () => {
    logger.log("[InventoryStore] Low stock alert - UI auto-updating from context");
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);

  const totalValue = inventory.reduce((sum, item) => {
    const currentStock = item.centralStock +
      Object.values(item.supervisorStock).reduce((s, qty) => s + qty, 0) +
      Object.values(item.washerStock).reduce((s, qty) => s + qty, 0);
    return sum + (currentStock * (item.unitCost || 0));
  }, 0);
  const lowStockItems = getLowStockItems();

  // Real data from contexts (vendors, POs, GRN will come from their respective contexts when implemented)
  const vendors: any[] = [];
  const purchaseOrders: any[] = [];
  const grn: any[] = [];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory & Store</h1>
          <p className="text-sm text-gray-500 mt-1">Manage stock, vendors, and procurement</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create PO
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Inventory</p>
                <p className="text-2xl font-bold mt-1">₹{(totalValue / 100000).toFixed(1)}L</p>
                <p className="text-xs text-gray-500 mt-1">{inventory.length} items</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Alert</p>
                <p className="text-2xl font-bold mt-1">{lowStockItems.length}</p>
                <p className="text-xs text-orange-600 mt-1">Needs restock</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Vendors</p>
                <p className="text-2xl font-bold mt-1">{vendors.length}</p>
                <p className="text-xs text-gray-500 mt-1">Verified partners</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Spend</p>
                <p className="text-2xl font-bold mt-1">₹1.2L</p>
                <p className="text-xs text-green-600 mt-1">-8% vs last month</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link to="/inventory/requisition">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                <FileText className="w-5 h-5 mb-2" />
                <span className="font-medium">Material Requisition</span>
                <span className="text-xs text-gray-500 mt-1">Request materials from inventory</span>
              </Button>
            </Link>
            <Link to="/inventory/washer-issuances">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                <Users className="w-5 h-5 mb-2" />
                <span className="font-medium">Washer Issuances</span>
                <span className="text-xs text-gray-500 mt-1">Issue materials to field washers</span>
              </Button>
            </Link>
            <Link to="/inventory/month-end-verification">
              <Button variant="outline" className="w-full h-auto flex-col items-start p-4">
                <Package className="w-5 h-5 mb-2" />
                <span className="font-medium">Month-End Verification</span>
                <span className="text-xs text-gray-500 mt-1">Physical stock count & carry-forward</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Stock Ledger</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="po">Purchase Orders</TabsTrigger>
          <TabsTrigger value="grn">GRN</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Stock Levels</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mb-4 animate-pulse" />
                  <p className="text-gray-500 text-lg">Loading inventory...</p>
                </div>
              ) : inventory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No inventory items available</p>
                  <p className="text-gray-400 text-sm mt-1">Add items to get started</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Min Stock</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Last Restocked</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventory.map((item) => {
                    const currentStock = item.centralStock +
                      Object.values(item.supervisorStock).reduce((sum, qty) => sum + qty, 0) +
                      Object.values(item.washerStock).reduce((sum, qty) => sum + qty, 0);
                    const isLowStock = currentStock < item.reorderLevel;
                    const totalValue = currentStock * item.unitCost;
                    return (
                      <TableRow key={item.itemId}>
                        <TableCell className="font-medium">{item.itemName}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{currentStock} {item.unit}</Badge>
                        </TableCell>
                        <TableCell>{item.reorderLevel} {item.unit}</TableCell>
                        <TableCell>₹{totalValue.toLocaleString()}</TableCell>
                        <TableCell>{item.lastProcurementDate ? new Date(item.lastProcurementDate).toLocaleDateString() : "—"}</TableCell>
                        <TableCell>{item.supplierId || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={isLowStock ? "destructive" : "secondary"}>
                            {isLowStock ? "Low Stock" : "Adequate"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor Master</CardTitle>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No vendors registered</p>
                  <p className="text-gray-400 text-sm mt-1">Vendor management will be available here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {vendors.map((vendor) => (
                  <div key={vendor.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold">
                          {vendor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-lg">{vendor.name}</p>
                          <div className="flex gap-4 mt-1 text-sm text-gray-600">
                            <span>GST: {vendor.gst}</span>
                            <span>Contact: {vendor.contact}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{vendor.status}</Badge>
                        <p className="text-sm text-gray-600 mt-2">{vendor.totalPOs} POs</p>
                        <Button size="sm" variant="outline" className="mt-2">View Details</Button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="po" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No purchase orders</p>
                  <p className="text-gray-400 text-sm mt-1">Purchase order management will be available here</p>
                </div>
              ) : (
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO ID</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Approver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.id}</TableCell>
                      <TableCell>{po.vendor}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{po.items} items</Badge>
                      </TableCell>
                      <TableCell>₹{(po?.amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{po.date}</TableCell>
                      <TableCell>{po.approver}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            po.status === "Delivered" ? "secondary" : 
                            po.status === "Pending Approval" ? "default" : 
                            "outline"
                          }
                        >
                          {po.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Goods Receipt Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {grn.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Truck className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-lg">No goods receipt notes</p>
                  <p className="text-gray-400 text-sm mt-1">GRN management will be available here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grn.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium">{record.id} • PO: {record.po}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Received: {record.receivedQty} / Expected: {record.expectedQty} units
                          </p>
                          <p className="text-xs text-gray-500">Date: {record.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={record.status === "Accepted" ? "secondary" : "outline"}
                        >
                          {record.status}
                        </Badge>
                        {record.status === "Partial" && (
                          <p className="text-xs text-orange-600 mt-1">
                            Shortage: {record.expectedQty - record.receivedQty} units
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}