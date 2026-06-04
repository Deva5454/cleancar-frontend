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
import { Search, Save, AlertTriangle, Package, Edit2, Check, X } from "lucide-react";
import { Link } from "react-router-dom";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Car Shampoo Premium",
      category: "Cleaning Chemicals",
      currentStock: 45,
      moq: 50,
      unit: "Liters",
      status: "below-moq",
      lastUpdated: "2026-03-08"
    },
    {
      id: "2",
      name: "Microfiber Cloth",
      category: "Consumables",
      currentStock: 120,
      moq: 100,
      unit: "Pieces",
      status: "normal",
      lastUpdated: "2026-03-07"
    },
    {
      id: "3",
      name: "Wax Polish",
      category: "Polishing Products",
      currentStock: 15,
      moq: 30,
      unit: "Bottles",
      status: "critical",
      lastUpdated: "2026-03-09"
    },
    {
      id: "4",
      name: "Tire Shine Spray",
      category: "Finishing Products",
      currentStock: 25,
      moq: 40,
      unit: "Bottles",
      status: "below-moq",
      lastUpdated: "2026-03-08"
    },
    {
      id: "5",
      name: "Glass Cleaner",
      category: "Cleaning Chemicals",
      currentStock: 80,
      moq: 60,
      unit: "Liters",
      status: "normal",
      lastUpdated: "2026-03-06"
    },
    {
      id: "6",
      name: "Foam Gun Nozzle",
      category: "Equipment Parts",
      currentStock: 5,
      moq: 15,
      unit: "Pieces",
      status: "critical",
      lastUpdated: "2026-03-09"
    },
    {
      id: "7",
      name: "Vacuum Bags",
      category: "Consumables",
      currentStock: 35,
      moq: 50,
      unit: "Pieces",
      status: "below-moq",
      lastUpdated: "2026-03-07"
    },
    {
      id: "8",
      name: "Air Freshener",
      category: "Finishing Products",
      currentStock: 150,
      moq: 100,
      unit: "Pieces",
      status: "normal",
      lastUpdated: "2026-03-05"
    }
  ]);

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
    setProducts(products.map(p => 
      p.id === productId 
        ? { ...p, moq: editValue, lastUpdated: new Date().toISOString().split('T')[0] }
        : p
    ));
    setEditingId(null);
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
