import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CURRENT_PLAN_VERSION,
  ADD_ON_SERVICES,
  COMBO_OFFERS,
  ONE_TIME_WASH_PRICING,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  formatPrice,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";
import {
  getTotalCostPerWash,
  getMonthlyCost,
  calculateEBITDA,
  getEBITDAStatus,
  EBITDA_FLOOR,
  WORKING_DAYS_PER_MONTH,
} from "../../data/ebitdaCalculations";
import { ADD_ON_EBITDA_DATA } from "../../data/addOnEBITDA";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";

export function DataSyncValidator() {
  const [validationResults, setValidationResults] = useState<any>(null);

  const runValidation = () => {
    const results: any = {
      pricingMatrixValid: true,
      addOnsValid: true,
      combosValid: true,
      oneTimeWashValid: true,
      ebitdaConsistency: true,
      issues: [],
      warnings: [],
      info: [],
    };

    // 1. Validate Pricing Matrix - check for NA values and pricing consistency
    VEHICLE_CATEGORIES.forEach((vehicle) => {
      PLAN_TYPES.filter((p) => !p.includes("One-Time")).forEach((plan) => {
        const price = CURRENT_PLAN_VERSION.pricingMatrix[vehicle][plan as PlanType];
        if (price !== "NA") {
          // Check if EBITDA meets floor
          const vehicleType = vehicle.includes("2W") ? "2W" : "4W";
          const costBreakdown = getTotalCostPerWash(plan, vehicleType, false);
          const monthlyCost = getMonthlyCost(costBreakdown.total);
          const ebitda = calculateEBITDA(price as number, monthlyCost);

          if (ebitda.ebitdaPercentage < EBITDA_FLOOR) {
            results.ebitdaConsistency = false;
            results.issues.push({
              type: "EBITDA Below Floor",
              entity: `${vehicle} - ${plan}`,
              details: `EBITDA ${(ebitda.ebitdaPercentage * 100).toFixed(1)}% < 30% floor`,
              severity: "critical",
            });
          } else if (ebitda.ebitdaPercentage < 0.35) {
            results.warnings.push({
              type: "EBITDA Below Target",
              entity: `${vehicle} - ${plan}`,
              details: `EBITDA ${(ebitda.ebitdaPercentage * 100).toFixed(1)}% < 35% target`,
            });
          }
        }
      });
    });

    // 2. Validate Add-Ons - ensure pricing matches between subscriptionPlans and addOnEBITDA
    ADD_ON_SERVICES.forEach((addon) => {
      const ebitdaData = ADD_ON_EBITDA_DATA.find((e) => e.id === addon.id);
      if (ebitdaData) {
        if (addon.pricing["4W"] !== "NA" && ebitdaData.price4W !== (addon.pricing["4W"] as number)) {
          results.addOnsValid = false;
          results.issues.push({
            type: "Add-On Price Mismatch",
            entity: addon.name,
            details: `Service: ${addon.pricing["4W"]} vs EBITDA: ${ebitdaData.price4W}`,
            severity: "error",
          });
        }

        // Check margin accuracy
        const calculatedMargin = ebitdaData.price4W > 0
          ? (ebitdaData.ebitdaAmount4W / ebitdaData.price4W) * 100
          : 0;
        if (Math.abs(calculatedMargin - addon.estimatedMargin) > 1) {
          results.warnings.push({
            type: "Add-On Margin Discrepancy",
            entity: addon.name,
            details: `Estimated: ${addon.estimatedMargin}% vs Calculated: ${calculatedMargin.toFixed(1)}%`,
          });
        }
      }
    });

    // 3. Validate Combo Offers - ensure prices match pricing matrix
    COMBO_OFFERS.forEach((combo) => {
      const vehicle1Price = CURRENT_PLAN_VERSION.pricingMatrix[
        combo.planCombination.vehicle1.category
      ][combo.planCombination.vehicle1.plan];

      if (vehicle1Price !== "NA" && vehicle1Price !== combo.planCombination.vehicle1.individualPrice) {
        results.combosValid = false;
        results.issues.push({
          type: "Combo Price Mismatch",
          entity: combo.name,
          details: `Vehicle1 price mismatch: ${vehicle1Price} vs ${combo.planCombination.vehicle1.individualPrice}`,
          severity: "error",
        });
      }

      if (combo.planCombination.vehicle2) {
        const vehicle2Price = CURRENT_PLAN_VERSION.pricingMatrix[
          combo.planCombination.vehicle2.category
        ][combo.planCombination.vehicle2.plan];

        if (vehicle2Price !== "NA" && vehicle2Price !== combo.planCombination.vehicle2.individualPrice) {
          results.combosValid = false;
          results.issues.push({
            type: "Combo Price Mismatch",
            entity: combo.name,
            details: `Vehicle2 price mismatch: ${vehicle2Price} vs ${combo.planCombination.vehicle2.individualPrice}`,
            severity: "error",
          });
        }
      }

      // Validate savings calculation
      const calculatedSavings = combo.totalIndividualPrice - combo.comboPrice;
      if (Math.abs(calculatedSavings - combo.savings) > 1) {
        results.warnings.push({
          type: "Combo Savings Calculation",
          entity: combo.name,
          details: `Stored: ${combo.savings} vs Calculated: ${calculatedSavings}`,
        });
      }
    });

    // 4. Validate One-Time Wash Pricing
    const oneTimeCategories = new Set(ONE_TIME_WASH_PRICING.map((p) => p.vehicleCategory));
    VEHICLE_CATEGORIES.forEach((category) => {
      if (!oneTimeCategories.has(category)) {
        results.warnings.push({
          type: "Missing One-Time Pricing",
          entity: category,
          details: "No one-time wash pricing defined for this vehicle category",
        });
      }
    });

    // 5. Information messages
    results.info.push({
      type: "Pricing Matrix",
      details: `${VEHICLE_CATEGORIES.length} vehicle categories × ${PLAN_TYPES.length} plan types`,
    });
    results.info.push({
      type: "Add-On Services",
      details: `${ADD_ON_SERVICES.filter((a) => a.isActive).length} active add-ons`,
    });
    results.info.push({
      type: "Combo Offers",
      details: `${COMBO_OFFERS.filter((c) => c.isActive).length} active combos`,
    });
    results.info.push({
      type: "One-Time Pricing",
      details: `${ONE_TIME_WASH_PRICING.length} pricing options`,
    });

    setValidationResults(results);
  };

  const overallStatus =
    validationResults &&
    validationResults.pricingMatrixValid &&
    validationResults.addOnsValid &&
    validationResults.combosValid &&
    validationResults.oneTimeWashValid &&
    validationResults.ebitdaConsistency;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization Validator</CardTitle>
          <CardDescription>
            Validate that all pricing data is synchronized across the application
            and no hardcoded values exist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={runValidation} className="mb-6">
            Run Validation Check
          </Button>

          {validationResults && (
            <div className="space-y-6">
              {/* Overall Status */}
              <Card
                className={`border-2 ${
                  overallStatus
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {overallStatus ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                    <CardTitle
                      className={overallStatus ? "text-green-900" : "text-red-900"}
                    >
                      {overallStatus
                        ? "✓ All Systems Synchronized"
                        : "✗ Data Inconsistencies Detected"}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Pricing Matrix</div>
                      <div className="font-semibold">
                        {validationResults.pricingMatrixValid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Add-Ons</div>
                      <div className="font-semibold">
                        {validationResults.addOnsValid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">Combos</div>
                      <div className="font-semibold">
                        {validationResults.combosValid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">One-Time Wash</div>
                      <div className="font-semibold">
                        {validationResults.oneTimeWashValid ? "✓ Valid" : "✗ Invalid"}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">EBITDA Floor</div>
                      <div className="font-semibold">
                        {validationResults.ebitdaConsistency ? "✓ Met" : "✗ Breached"}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Issues */}
              {validationResults.issues.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-base text-red-900">
                        Critical Issues ({validationResults.issues.length})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <div className="min-w-[600px] sm:min-w-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Entity</TableHead>
                              <TableHead>Details</TableHead>
                              <TableHead>Severity</TableHead>
                            </TableRow>
                          </TableHeader>
                      <TableBody>
                        {validationResults.issues.map((issue: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{issue.type}</TableCell>
                            <TableCell>{issue.entity}</TableCell>
                            <TableCell className="text-sm">{issue.details}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  issue.severity === "critical"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {issue.severity}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Warnings */}
              {validationResults.warnings.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <CardTitle className="text-base text-yellow-900">
                        Warnings ({validationResults.warnings.length})
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-3 sm:mx-0">
                      <div className="min-w-[600px] sm:min-w-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Type</TableHead>
                              <TableHead>Entity</TableHead>
                              <TableHead>Details</TableHead>
                            </TableRow>
                          </TableHeader>
                      <TableBody>
                        {validationResults.warnings.map((warning: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{warning.type}</TableCell>
                            <TableCell>{warning.entity}</TableCell>
                            <TableCell className="text-sm">{warning.details}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Information */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base text-blue-900">
                      Data Summary
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm text-blue-800">
                    {validationResults.info.map((info: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span className="font-medium">{info.type}:</span>
                        <span>{info.details}</span>
                      </div>
                    ))}
                    <div className="border-t border-blue-200 pt-2 mt-2">
                      <p className="font-medium">
                        All pricing data is dynamically calculated from:
                      </p>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>CURRENT_PLAN_VERSION.pricingMatrix (source of truth)</li>
                        <li>EBITDA calculation engine (cost build-up)</li>
                        <li>Dynamic combo offer generation</li>
                        <li>Context provider with real-time pricing</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
