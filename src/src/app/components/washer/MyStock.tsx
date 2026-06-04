import { BackButton } from "../ui/back-button";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Progress } from "../ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Package, AlertTriangle, TrendingDown, Calendar, Info } from "lucide-react";
import { toast } from "sonner";

// Mock washer stock data
const washerStockData = [
  {
    material: "Car Shampoo",
    unit: "ml",
    currentBalance: 285,
    maxCapacity: 500,
    dailyAvgConsumption: 135,
    daysRemaining: 2,
    status: "low"
  },
  {
    material: "Wax Polish",
    unit: "ml",
    currentBalance: 380,
    maxCapacity: 500,
    dailyAvgConsumption: 90,
    daysRemaining: 4,
    status: "adequate"
  },
  {
    material: "Tyre Dressing",
    unit: "ml",
    currentBalance: 200,
    maxCapacity: 250,
    dailyAvgConsumption: 45,
    daysRemaining: 4,
    status: "adequate"
  },
  {
    material: "Microfiber Cloth",
    unit: "pieces",
    currentBalance: 8,
    maxCapacity: 12,
    dailyAvgConsumption: 1.5,
    daysRemaining: 5,
    status: "adequate"
  },
  {
    material: "Dashboard Polish",
    unit: "ml",
    currentBalance: 50,
    maxCapacity: 250,
    dailyAvgConsumption: 30,
    daysRemaining: 1,
    status: "critical"
  },
];

export function MyStock() {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<typeof washerStockData[0] | null>(null);

  const handleRequestReplenishment = () => {
    toast.success(`Replenishment request sent to Supervisor for ${selectedMaterial?.material}`);
    setShowRequestDialog(false);
    setSelectedMaterial(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-50 border-red-300";
      case "low":
        return "bg-amber-50 border-amber-300";
      default:
        return "bg-white border-gray-200";
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-red-500";
      case "low":
        return "bg-amber-500";
      default:
        return "bg-green-500";
    }
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Stock in Hand</h1>
        <p className="text-sm text-gray-500 mt-1">
          View your current material stock and request replenishment when needed
        </p>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium">Stock Status Information</p>
              <p className="text-blue-800 mt-1">
                Your stock balances are estimated based on your completed jobs and standard usage rates. 
                Days remaining is calculated from your average daily consumption over the last 7 days.
                Request replenishment when stock is running low to avoid job delays.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {washerStockData.map((stock) => {
          const percentRemaining = (stock.currentBalance / stock.maxCapacity) * 100;
          
          return (
            <Card key={stock.material} className={getStatusColor(stock.status)}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    {stock.material}
                  </CardTitle>
                  {stock.status === "critical" && (
                    <Badge variant="destructive" className="animate-pulse">
                      Critical
                    </Badge>
                  )}
                  {stock.status === "low" && (
                    <Badge className="bg-amber-500">
                      Running Low
                    </Badge>
                  )}
                  {stock.status === "adequate" && (
                    <Badge variant="secondary">
                      Adequate
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Balance */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-sm text-gray-600">Current Estimated Balance</p>
                    <p className="text-2xl font-bold">
                      {stock.currentBalance} <span className="text-sm font-normal text-gray-500">{stock.unit}</span>
                    </p>
                  </div>
                  <Progress 
                    value={percentRemaining} 
                    className="h-2"
                    indicatorClassName={getProgressColor(stock.status)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {percentRemaining.toFixed(0)}% remaining of {stock.maxCapacity} {stock.unit} capacity
                  </p>
                </div>

                {/* Usage Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      Daily Avg Usage
                    </p>
                    <p className="font-semibold text-gray-900">
                      {stock.dailyAvgConsumption} {stock.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Approx. Days Left
                    </p>
                    <p className={`font-semibold ${stock.daysRemaining < 3 ? 'text-red-600' : 'text-gray-900'}`}>
                      ~{stock.daysRemaining} days
                    </p>
                  </div>
                </div>

                {/* Alert and Action */}
                {stock.daysRemaining < 3 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
                      <p className="text-sm text-amber-900 font-medium">
                        Running low — Request replenishment
                      </p>
                    </div>
                    <Button 
                      className="w-full"
                      variant={stock.status === "critical" ? "destructive" : "default"}
                      onClick={() => {
                        setSelectedMaterial(stock);
                        setShowRequestDialog(true);
                      }}
                    >
                      Request Replenishment
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Replenishment Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Material Replenishment</DialogTitle>
            <DialogDescription>
              Submit a request to your Supervisor for {selectedMaterial?.material} replenishment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Material Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Material</p>
              <p className="font-semibold text-gray-900">{selectedMaterial?.material}</p>
            </div>

            {/* System Estimate */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-600">System Estimated Remaining</p>
              <p className="font-semibold text-blue-900">
                {selectedMaterial?.currentBalance} {selectedMaterial?.unit}
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Approx. {selectedMaterial?.daysRemaining} days remaining at current usage
              </p>
            </div>

            {/* Washer's Estimate */}
            <div className="space-y-2">
              <Label htmlFor="washer-estimate">Your Estimated Remaining Quantity</Label>
              <Input
                id="washer-estimate"
                type="number"
                min="0"
                placeholder="Enter what you estimate is left"
              />
              <p className="text-xs text-gray-500">
                This helps the Supervisor verify stock accuracy
              </p>
            </div>

            {/* Reason for Early Request */}
            {selectedMaterial && selectedMaterial.daysRemaining >= 3 && (
              <div className="space-y-2">
                <Label htmlFor="early-reason">Reason for Early Replenishment</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high-volume">Higher Wash Volume Expected</SelectItem>
                    <SelectItem value="spillage">Spillage Occurred</SelectItem>
                    <SelectItem value="quality">Quality Issue with Material</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRequestDialog(false);
                setSelectedMaterial(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestReplenishment}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note: No Rupee Costs */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-4">
          <p className="text-xs text-gray-600">
            <strong>Note:</strong> Stock quantities and usage rates are shown for tracking purposes only. 
            Material costs and financial information are not displayed here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
