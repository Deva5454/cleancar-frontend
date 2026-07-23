import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Search, Save, AlertTriangle, Package, Edit2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

interface Product {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  moq: number;
  unit: string;
  status: "normal" | "below-moq" | "critical";
  lastUpdated: string;
}

export function MOQManagement() {
  const { inventory } = useInventory();
  const { city } = useCity();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Real fix: previously this whole list was hardcoded mock data,
  // completely disconnected from the actual inventory system - "Car
  // Shampoo Premium: 45 units" had no relationship to the real stock
  // level shown everywhere else in the app. Now derives real current
  // stock from useInventory(), with any real, previously-saved MOQ
  // override applied on top of the item's real default reorder level.
  const savedMoqOverrides: Record<string, number> = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem("cleancar_moq_settings") || "{}");
      // Support both the old array-shaped save and a real id->moq map
      if (Array.isArray(raw)) {
        return raw.reduce((acc: Record<string, number>, r: any) => { acc[r.id] = r.moq; return acc; }, {});
      }
      return raw;
    } catch { return {}; }
  })();

  const getStatus = (stock: number, moq: number): Product["status"] => {
    if (stock <= 0) return "critical";
    if (stock < moq) return "below-moq";
    return "normal";
  };

  const [products, setProducts] = useState<Product[]>(() =>
    inventory
      .filter((i: any) => i.cityId === city)
      .map((i: any) => {
        const moq = savedMoqOverrides[i.itemId] ?? i.reorderLevel ?? 0;
        return {
          id: i.itemId, name: i.itemName, category: i.category,
          currentStock: i.centralStock, moq, unit: i.unit,
          status: getStatus(i.centralStock, moq),
          lastUpdated: i.updatedAt ? i.updatedAt.split("T")[0] : new Date().toISOString().split("T")[0],
        };
      })
  );

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const belowMOQCount = products.filter(p => p.status === "below-moq").length;
  const criticalCount = products.filter(p => p.status === "critical").length;

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditValue(product.moq);
  };

  const handleSave = (productId: string) => {
    const updated = products.map(p =>
      p.id === productId
        ? { ...p, moq: editValue, status: getStatus(p.currentStock, editValue), lastUpdated: new Date().toISOString().split('T')[0] }
        : p
    );
    setProducts(updated);
    setEditingId(null);
    // Real fix: persist as a real itemId -> moq map, so this stays
    // correctly linked to real inventory items even as stock changes.
    try {
      const existing = JSON.parse(localStorage.getItem("cleancar_moq_settings") || "{}");
      const asMap = Array.isArray(existing) ? {} : existing;
      localStorage.setItem("cleancar_moq_settings", JSON.stringify({ ...asMap, [productId]: editValue }));
    } catch {}
    toast.success("MOQ updated successfully");
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "critical":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </Badge>;
      case "below-moq":
        return <Badge variant="outline" className="border-orange-500 text-orange-700">
          Below MOQ
        </Badge>;
      default:
        return <Badge variant="outline" className="border-green-500 text-green-700">
          Normal
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minimum Order Quantity Management</h1>
          <p className="text-sm text-gray-500 mt-1">Edit and manage MOQ levels for all inventory items</p>
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
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold mt-1">{products.length}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Below MOQ</p>
                <p className="text-2xl font-bold mt-1 text-orange-600">{belowMOQCount}</p>
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
                <p className="text-2xl font-bold mt-1 text-red-600">{criticalCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product MOQ Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by product name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>MOQ</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <span className={
                        product.currentStock < product.moq 
                          ? "text-orange-600 font-semibold" 
                          : ""
                      }>
                        {product.currentStock}
                      </span>
                    </TableCell>
                    <TableCell>
                      {editingId === product.id ? (
                        <Input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          className="w-20"
                          min="1"
                        />
                      ) : (
                        <span className="font-semibold">{product.moq}</span>
                      )}
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell>{getStatusBadge(product.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">{product.lastUpdated}</TableCell>
                    <TableCell className="text-right">
                      {editingId === product.id ? (
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSave(product.id)}
                            className="h-8"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancel}
                            className="h-8"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(product)}
                          className="h-8"
                        >
                          <Edit2 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No products found matching your search.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">About MOQ Settings</p>
              <p className="text-sm text-blue-700 mt-1">
                Minimum Order Quantity (MOQ) is the lowest inventory level before a reorder is triggered. 
                Initial MOQ is set by Admin, but Store Managers can modify these values based on consumption patterns and operational needs.
                When stock falls below MOQ, the system will alert you to create a purchase order.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MOQManagement;
