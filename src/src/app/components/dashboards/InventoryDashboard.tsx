// Dashboard for Inventory/Store Manager role
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Package, AlertTriangle, TrendingUp, FileText, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { MASTER_INVENTORY } from "../../data/masterData";

export function InventoryDashboard() {
  const { currentUser, currentRole, roleConfig } = useRole();

  const handleViewFullStore = () => {
    toast.info("Navigating to full store view...");
  };

  const handleRaiseMR = () => {
    toast.success("Material Requisition raised");
  };

  // Use centralized inventory data
  const lowStockItemsFromMaster = MASTER_INVENTORY
    .filter(item => item.currentStock < item.reorderPoint)
    .slice(0, 3);

  // Store Manager sees NO MONETARY VALUES - only quantities from centralized data
  const stats = {
    totalItems: MASTER_INVENTORY.length,
    lowStockItems: MASTER_INVENTORY.filter(item => item.currentStock < item.reorderPoint).length,
    pendingGRNs: 5,
    pendingIssuances: 8,
    monthlyConsumption: 342,
    // NO PRICES/VALUES shown to Store Manager
  };

  const lowStockItems = lowStockItemsFromMaster.map(item => ({
    name: item.itemName,
    currentStock: item.currentStock,
    reorderPoint: item.reorderPoint,
    unit: item.unit,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Store Manager Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {currentUser.name} • {currentUser.city} Central Store
          </p>
          {/* CRITICAL NOTICE */}
          <p className="text-xs text-orange-600 mt-1 font-medium">
            ⚠️ Store Manager View: NO MONETARY VALUES (Quantities Only)
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleViewFullStore}>
          <Warehouse className="w-4 h-4 mr-2" />
          View Full Store
        </Button>
      </div>

      {/* Stats Grid - NO MONETARY VALUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.totalItems}</p>
              <p className="text-xs text-gray-500">Total Items</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.lowStockItems}</p>
              <p className="text-xs text-gray-500">Low Stock</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingGRNs}</p>
              <p className="text-xs text-gray-500">Pending GRNs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingIssuances}</p>
              <p className="text-xs text-gray-500">Pending Issues</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-teal-50 text-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.monthlyConsumption}</p>
              <p className="text-xs text-gray-500">Monthly Issues</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRITICAL ALERT - NO MONETARY ACCESS */}
      <Card className="border-2 border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-orange-100 text-orange-600 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-orange-900">Store Manager Access Level</p>
              <p className="text-sm text-orange-700 mt-1">
                You have access to all inventory operations (GRN, Issuance, Stock) but <strong>NO MONETARY VALUES</strong> are visible in any module. 
                All pricing, costs, and financial data are hidden per your role permissions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Low Stock Alerts - QUANTITIES ONLY */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Low Stock Alerts - Action Required
          </h3>
          <div className="space-y-3">
            {lowStockItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Current Stock: <strong>{item.currentStock} {item.unit}</strong> | 
                    Reorder Point: <strong>{item.reorderPoint} {item.unit}</strong>
                  </p>
                  {/* NO UNIT PRICE OR VALUE SHOWN */}
                </div>
                <div className="flex gap-2">
                  <Badge variant="destructive">
                    Deficit: {item.reorderPoint - item.currentStock} {item.unit}
                  </Badge>
                  <Button size="sm" variant="default" onClick={handleRaiseMR}>
                    Raise MR
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Button variant="outline" className="h-16" onClick={handleRaiseMR}>
              <AlertTriangle className="w-5 h-5 mr-2" />
              Raise MR
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}