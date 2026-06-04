/**
 * Washer Job Report - Integrated with Cost Tracking
 * Products Used checklist feeds into cost calculation
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { CheckSquare, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { calculateJobCost, JobCostRecord } from "../finance/JobCostTracking";
import { useInventory } from "../../contexts/InventoryContext";
import { useCity } from "../../contexts/CityContext";

interface Product {
  id: string;
  name: string;
  cost: number;
  requiresReasonIfNotUsed: boolean;
}

interface WasherJobReportProps {
  jobId: string;
  customerId: string;
  washerId: string;
  packageType: string;
  vehicleCategory: string;
  pinCode: string;
  customerMonthlyPrice: number;
  monthlyWashCount: number;
  jobStartTime: Date;
  onSubmit: (jobCost: JobCostRecord) => void;
}

export function WasherJobReport({
  jobId,
  customerId,
  washerId,
  packageType,
  vehicleCategory,
  pinCode,
  customerMonthlyPrice,
  monthlyWashCount,
  jobStartTime,
  onSubmit,
}: WasherJobReportProps) {
  const { inventory, issueToWasher } = useInventory();
  const { city } = useCity();

  // Get consumable products from inventory for this city
  const inventoryProducts = inventory
    .filter(item => item.cityId === city && item.category === "Chemical" && item.centralStock > 0)
    .map(item => ({
      id:   item.itemId,
      name: item.name,
      cost: item.costPerUnit,
      requiresReasonIfNotUsed: item.reorderLevel > 0,
    }));

  // Fallback to default products if inventory is empty
  const products = inventoryProducts.length > 0 ? inventoryProducts : [
    { id: "PROD-001", name: "Car Shampoo",    cost: 8.5,  requiresReasonIfNotUsed: true },
    { id: "PROD-002", name: "Wheel Cleaner",  cost: 5.2,  requiresReasonIfNotUsed: false },
    { id: "PROD-003", name: "Dashboard Polish",cost: 3.8, requiresReasonIfNotUsed: false },
  ];

  const [productsUsed, setProductsUsed] = useState<
    Map<string, { used: boolean; reasonNotUsed: string }>
  >(
    new Map(
      products.map((p) => [p.id, { used: true, reasonNotUsed: "" }])
    )
  );

  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProductToggle = (productId: string, used: boolean) => {
    const updated = new Map(productsUsed);
    updated.set(productId, { used, reasonNotUsed: "" });
    setProductsUsed(updated);
  };

  const handleReasonChange = (productId: string, reason: string) => {
    const updated = new Map(productsUsed);
    const current = updated.get(productId)!;
    updated.set(productId, { ...current, reasonNotUsed: reason });
    setProductsUsed(updated);
  };

  const canSubmit = () => {
    // Check if all unchecked products that require reason have a reason
    for (const product of products) {
      const status = productsUsed.get(product.id);
      if (
        !status?.used &&
        product.requiresReasonIfNotUsed &&
        !status?.reasonNotUsed?.trim()
      ) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = () => {
    if (!canSubmit()) {
      toast.error("Please provide reasons for all required unchecked products");
      return;
    }

    setIsSubmitting(true);

    // Prepare products data
    const productsData = products.map((product) => {
      const status = productsUsed.get(product.id)!;
      return {
        productId: product.id,
        productName: product.name,
        used: status.used,
        reasonNotUsed: status.reasonNotUsed,
      };
    });

    // Decrement inventory for used products
    products.forEach(p => {
      const usage = productsUsed.get(p.id);
      if (usage?.used) {
        issueToWasher?.({
          itemId: p.id,
          washerId,
          quantity: 1,
          jobId,
          cityId: city,
          issuedAt: new Date().toISOString(),
        });
      }
    });

    // Calculate job cost
    const costConfig = {
      materialCosts: products.map((p) => ({
        productId: p.id,
        cost: p.cost,
      })),
      consumableCost: 12.5, // Mock fixed consumable cost
      manpowerCostPerMinute: 1.17, // ₹35 per 30 minutes = ₹1.17 per minute
      standardDuration: 30, // Mock standard duration for this package
      overheadCost: 8.5, // Mock overhead
    };

    const jobCost = calculateJobCost(
      {
        jobId,
        customerId,
        washerId,
        packageType,
        vehicleCategory,
        pinCode,
        productsUsed: productsData,
        jobStartTime,
        jobSubmitTime: new Date(),
        customerMonthlyPrice,
        monthlyWashCount,
      },
      costConfig
    );

    // Submit job cost
    setTimeout(() => {
      onSubmit(jobCost);
      toast.success("Job report submitted successfully!");
      setIsSubmitting(false);
    }, 1000);
  };

  const usedCount = Array.from(productsUsed.values()).filter((p) => p.used).length;
  const totalMaterialCost = products
    .filter((p) => productsUsed.get(p.id)?.used)
    .reduce((sum, p) => sum + p.cost, 0);

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-blue-600" />
          Job Report Submission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job Info */}
        <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded">
          <div className="text-sm">
            <span className="text-gray-600">Job ID:</span>
            <span className="ml-2 font-medium">{jobId}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Package:</span>
            <span className="ml-2 font-medium">{packageType}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Vehicle:</span>
            <span className="ml-2 font-medium">{vehicleCategory}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Started:</span>
            <span className="ml-2 font-medium">
              {jobStartTime.toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Products Used Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-base font-medium">Products Used</Label>
            <Badge variant="outline">
              {usedCount} of {products.length} used
            </Badge>
          </div>

          <div className="space-y-3">
            {products.map((product) => {
              const status = productsUsed.get(product.id)!;
              return (
                <Card
                  key={product.id}
                  className={
                    status.used
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200"
                  }
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={status.used}
                        onCheckedChange={(checked) =>
                          handleProductToggle(product.id, checked as boolean)
                        }
                        id={product.id}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={product.id}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {product.name}
                          {product.requiresReasonIfNotUsed && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Required
                            </Badge>
                          )}
                        </label>
                        <div className="text-xs text-gray-500 mt-1">
                          Cost: ₹{product.cost.toFixed(2)}
                        </div>

                        {/* Reason textarea if not used and required */}
                        {!status.used && product.requiresReasonIfNotUsed && (
                          <div className="mt-2">
                            <Label className="text-xs text-red-600">
                              Reason for not using (required)
                            </Label>
                            <Textarea
                              value={status.reasonNotUsed}
                              onChange={(e) =>
                                handleReasonChange(product.id, e.target.value)
                              }
                              placeholder="Explain why this product was not used..."
                              className="mt-1 text-sm"
                              rows={2}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Material Cost Summary */}
          <Card className="border-blue-200 bg-blue-50 mt-3">
            <CardContent className="p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">
                  Total Material Cost (Products Used):
                </span>
                <span className="font-bold text-blue-600">
                  ₹{totalMaterialCost.toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Notes */}
        <div>
          <Label>Additional Notes (Optional)</Label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional observations or notes about this job..."
            rows={3}
            className="mt-2"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>
              Duration:{" "}
              {Math.round(
                (new Date().getTime() - jobStartTime.getTime()) / (1000 * 60)
              )}{" "}
              minutes
            </span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? "Submitting..." : "Submit Job Report"}
          </Button>
        </div>

        {!canSubmit() && (
          <p className="text-sm text-red-600">
            ⚠️ Please provide reasons for all required unchecked products before
            submitting
          </p>
        )}
      </CardContent>
    </Card>
  );
}
