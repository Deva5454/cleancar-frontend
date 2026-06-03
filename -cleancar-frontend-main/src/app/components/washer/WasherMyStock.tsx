// My Stock Tab - Material Stock Management for Washers
// Quantities only, no costs
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Package, AlertTriangle, CheckCircle, TrendingDown, Plus } from "lucide-react";
import { Progress } from "../ui/progress";

interface StockItem {
  materialName: string;
  unit: string;
  currentBalance: number;
  daysRemaining: number;
  batchNumber: string;
  lastIssued: string;
  lastIssuedQty: number;
}

export function WasherMyStock() {
  const stockItems: StockItem[] = [
    {
      materialName: "Car Wash Shampoo 5L",
      unit: "Ltr",
      currentBalance: 2.5,
      daysRemaining: 3,
      batchNumber: "BATCH-2026-045",
      lastIssued: "Mar 14, 2026",
      lastIssuedQty: 5,
    },
    {
      materialName: "Wax Polish 1L",
      unit: "Ltr",
      currentBalance: 0.8,
      daysRemaining: 7,
      batchNumber: "BATCH-2026-038",
      lastIssued: "Mar 10, 2026",
      lastIssuedQty: 1,
    },
    {
      materialName: "Microfiber Cloth",
      unit: "Pcs",
      currentBalance: 12,
      daysRemaining: 15,
      batchNumber: "BATCH-2026-042",
      lastIssued: "Mar 12, 2026",
      lastIssuedQty: 10,
    },
    {
      materialName: "Interior Cleaner 500ml",
      unit: "ml",
      currentBalance: 300,
      daysRemaining: 5,
      batchNumber: "BATCH-2026-040",
      lastIssued: "Mar 15, 2026",
      lastIssuedQty: 500,
    },
  ];

  const getStockProgressColor = (daysRemaining: number) => {
    if (daysRemaining < 3) return "bg-red-500";
    if (daysRemaining < 7) return "bg-amber-500";
    return "bg-green-500";
  };

  const getStockPercentage = (daysRemaining: number) => {
    // Assuming 30 days is full stock
    return Math.min((daysRemaining / 30) * 100, 100);
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Stock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Your current material inventory
        </p>
      </div>

      {/* Stock Verification Due Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">
                Stock verification due tonight
              </p>
              <p className="text-sm text-red-700">Due by 9:00 PM • 6 hours remaining</p>
            </div>
          </div>
          <Button size="sm" className="bg-red-600 hover:bg-red-700">
            Start Verification
          </Button>
        </div>
      </div>

      {/* Stock Items */}
      <div className="space-y-3">
        {stockItems
          .sort((a, b) => a.daysRemaining - b.daysRemaining)
          .map((item, idx) => (
            <Card
              key={idx}
              className={`border-2 ${
                item.daysRemaining < 3
                  ? "border-red-200 bg-red-50"
                  : item.daysRemaining < 7
                  ? "border-amber-200 bg-amber-50"
                  : "border-gray-200"
              }`}
            >
              <CardContent className="p-4 space-y-3">
                {/* Material Name */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900">
                      {item.materialName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Batch: {item.batchNumber}
                    </p>
                  </div>
                  {item.daysRemaining < 5 && (
                    <Badge
                      variant="destructive"
                      className="bg-red-600 text-white"
                    >
                      Low Stock
                    </Badge>
                  )}
                </div>

                {/* Current Balance */}
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-sm text-gray-500">
                      Last issued: {item.lastIssued}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {item.currentBalance}
                    </p>
                    <p className="text-lg text-gray-600">{item.unit}</p>
                  </div>
                </div>

                {/* Days Remaining */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingDown
                        className={`w-4 h-4 ${
                          item.daysRemaining < 3
                            ? "text-red-600"
                            : item.daysRemaining < 7
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      />
                      <p
                        className={`text-sm font-semibold ${
                          item.daysRemaining < 3
                            ? "text-red-700"
                            : item.daysRemaining < 7
                            ? "text-amber-700"
                            : "text-green-700"
                        }`}
                      >
                        ~{item.daysRemaining} days remaining
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">At current usage</p>
                  </div>
                  <Progress
                    value={getStockPercentage(item.daysRemaining)}
                    className="h-2"
                  />
                </div>

                {/* Request Replenishment */}
                {item.daysRemaining < 5 && (
                  <Button
                    variant="outline"
                    className="w-full h-12 border-2 border-teal-300 text-teal-700 hover:bg-teal-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Request Replenishment
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Replenishment Status */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="font-semibold text-green-900">
              Replenishment Approved
            </p>
          </div>
          <p className="text-sm text-green-800">
            Your request for <strong>Car Wash Shampoo 5L</strong> has been approved.
          </p>
          <p className="text-sm text-green-700 mt-1">
            Collect from Supervisor Suresh Yadav at Vesu Cluster Office
          </p>
        </CardContent>
      </Card>

      {/* Stock History Button */}
      <Button variant="outline" className="w-full h-12">
        <Package className="w-4 h-4 mr-2" />
        View Stock History
      </Button>
    </div>
  );
}
