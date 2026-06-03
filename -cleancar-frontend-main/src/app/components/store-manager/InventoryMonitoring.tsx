import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, Package, AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  moq: number;
  unit: string;
  weeklyConsumption: number;
  trend: "up" | "down" | "stable";
  status: "normal" | "low" | "critical";
  lastRestocked: string;
}

export function InventoryMonitoring() {
  const [searchTerm, setSearchTerm] = useState("");

  const inventory: InventoryItem[] = [
    {
      id: "1",
      name: "Car Shampoo Premium",
      category: "Cleaning Chemicals",
      currentStock: 45,
      moq: 50,
      unit: "Liters",
      weeklyConsumption: 12,
      trend: "up",
      status: "low",
      lastRestocked: "2026-02-28"
    },
    {
      id: "2",
      name: "Microfiber Cloth",
      category: "Consumables",
      currentStock: 120,
      moq: 100,
      unit: "Pieces",
      weeklyConsumption: 25,
      trend: "stable",
      status: "normal",
      lastRestocked: "2026-03-05"
    },
    {
      id: "3",
      name: "Wax Polish",
      category: "Polishing Products",
      currentStock: 15,
      moq: 30,
      unit: "Bottles",
      weeklyConsumption: 8,
      trend: "up",
      status: "critical",
      lastRestocked: "2026-02-20"
    },
    {
      id: "4",
      name: "Tire Shine Spray",
      category: "Finishing Products",
      currentStock: 25,
      moq: 40,
      unit: "Bottles",
      weeklyConsumption: 10,
      trend: "down",
      status: "low",
      lastRestocked: "2026-03-01"
    },
    {
      id: "5",
      name: "Glass Cleaner",
      category: "Cleaning Chemicals",
      currentStock: 80,
      moq: 60,
      unit: "Liters",
      weeklyConsumption: 15,
      trend: "stable",
      status: "normal",
      lastRestocked: "2026-03-07"
    },
    {
      id: "6",
      name: "Foam Gun Nozzle",
      category: "Equipment Parts",
      currentStock: 5,
      moq: 15,
      unit: "Pieces",
      weeklyConsumption: 2,
      trend: "stable",
      status: "critical",
      lastRestocked: "2026-01-15"
    },
    {
      id: "7",
      name: "Vacuum Bags",
      category: "Consumables",
      currentStock: 35,
      moq: 50,
      unit: "Pieces",
      weeklyConsumption: 18,
      trend: "up",
      status: "low",
      lastRestocked: "2026-03-02"
    },
    {
      id: "8",
      name: "Air Freshener",
      category: "Finishing Products",
      currentStock: 150,
      moq: 100,
      unit: "Pieces",
      weeklyConsumption: 20,
      trend: "stable",
      status: "normal",
      lastRestocked: "2026-03-08"
    }
  ];

  const filteredInventory = inventory.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.length;
  const lowStockItems = inventory.filter(i => i.status === "low").length;
  const criticalItems = inventory.filter(i => i.status === "critical").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "low":
        return <Badge variant="outline" className="border-orange-500 text-orange-700">Low Stock</Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-700">Normal</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      default:
        return <span className="text-gray-400">—</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time inventory stock status and consumption tracking</p>
        </div>
        <Link to="/store-manager">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Back to Store Manager
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Items</p>
                <p className="text-2xl font-bold mt-1">{totalItems}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">{lowStockItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Critical Stock</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{criticalItems}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Stock Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>MOQ</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Weekly Usage</TableHead>
                    <TableHead>Trend</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Restocked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>
                        <span className={
                          item.status === "critical"
                            ? "text-red-600 font-bold"
                            : item.status === "low"
                            ? "text-orange-600 font-semibold"
                            : ""
                        }>
                          {item.currentStock}
                        </span>
                      </TableCell>
                      <TableCell>{item.moq}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.weeklyConsumption}</TableCell>
                      <TableCell>{getTrendIcon(item.trend)}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{item.lastRestocked}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No inventory items found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alert Info */}
      {(lowStockItems > 0 || criticalItems > 0) && (
        <Card className="bg-orange-50 border-orange-300">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-orange-600 mt-0.5" />
              <div>
                <p className="font-bold text-orange-900">⚠ Stock Alert</p>
                <p className="text-sm text-orange-700 mt-1">
                  {criticalItems > 0 && `${criticalItems} items are at critical stock levels. `}
                  {lowStockItems > 0 && `${lowStockItems} items are below MOQ. `}
                  Please create purchase orders to replenish inventory.
                </p>
                <Link to="/store-manager/purchase-order">
                  <Button size="sm" variant="outline" className="mt-3 border-orange-600 text-orange-800">
                    Create Purchase Order
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
