// Plan Change Impact Dashboard - Shows impact of scheduled plan changes
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Users,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  ALL_PLAN_VERSIONS,
  getActivePlanVersion,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  formatPrice,
  type PlanVersion,
} from "../../data/subscriptionPlans";

export function PlanChangeImpactDashboard() {
  const [showComparison, setShowComparison] = useState(false);
  
  const scheduledPlan = ALL_PLAN_VERSIONS.find((v) => v.status === "Scheduled");
  const activePlan = getActivePlanVersion();

  if (!scheduledPlan) {
    return null;
  }

  const goLiveDate = new Date(scheduledPlan.goLiveDate!);
  const daysRemaining = Math.ceil(
    (goLiveDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  // Mock data for active subscriptions
  const activeSubscriptionsCount = 247;
  const newBookingsCount = 0;

  // Calculate price changes for Hatchback (default comparison category)
  const getPriceChange = (plan: string) => {
    // ✅ FIX: correct vehicle category key (was "Hatchback" — doesn't exist)
    const CAT = "Hatchback / Compact Sedan" as const;
    const oldPrice = (activePlan.pricingMatrix[CAT] as any)?.[plan];
    const newPrice = (scheduledPlan.pricingMatrix[CAT] as any)?.[plan];
    
    if (oldPrice === "NA" || newPrice === "NA") return null;
    
    const change = newPrice - oldPrice;
    const changePercent = ((change / oldPrice) * 100).toFixed(1);
    
    return { oldPrice, newPrice, change, changePercent };
  };

  return (
    <>
      <Card className="border-2 border-orange-300 bg-orange-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Plan Change Impact - {scheduledPlan.versionLabel}
            </CardTitle>
            <Badge className="bg-orange-600 text-white">
              Go-Live in {daysRemaining} days
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Go-Live Date</p>
                  <p className="font-bold text-lg">
                    {goLiveDate.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Active Subscriptions</p>
                  <p className="font-bold text-lg">{activeSubscriptionsCount}</p>
                  <p className="text-xs text-gray-500">Will continue under old plan</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">New Bookings</p>
                  <p className="font-bold text-lg">{newBookingsCount}</p>
                  <p className="text-xs text-gray-500">Will use new plan</p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Change Summary */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold mb-3">Price Change Summary (Hatchback)</h4>
            <div className="space-y-2">
              {["Basic", "Premium", "Elite", "Elite Plus"].map((plan) => {
                const change = getPriceChange(plan);
                if (!change) return null;

                return (
                  <div
                    key={plan}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-medium">{plan}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-sm text-gray-500">
                        {formatPrice(change.oldPrice)} → {formatPrice(change.newPrice)}
                      </span>
                      <div
                        className={`flex items-center gap-1 ${
                          change.change > 0
                            ? "text-red-600"
                            : change.change < 0
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        {change.change > 0 ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : change.change < 0 ? (
                          <ArrowDownRight className="w-4 h-4" />
                        ) : (
                          <Minus className="w-4 h-4" />
                        )}
                        <span className="font-semibold">
                          {change.change > 0 ? "+" : ""}
                          {formatPrice(Math.abs(change.change))}
                        </span>
                        <span className="text-xs">
                          ({change.changePercent > 0 ? "+" : ""}
                          {change.changePercent}%)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* View Full Comparison Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowComparison(true)}
          >
            View Full Comparison (All Categories & Plans)
          </Button>
        </CardContent>
      </Card>

      {/* Full Comparison Modal */}
      {showComparison && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Price Comparison: {activePlan.version} vs {scheduledPlan.version}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Old Plan vs New Plan - All Vehicle Categories
                </p>
              </div>
              <Button variant="ghost" onClick={() => setShowComparison(false)}>
                Close
              </Button>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold">Vehicle Category</TableHead>
                      {PLAN_TYPES.map((plan) => (
                        <TableHead key={plan} className="text-center">
                          {plan}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VEHICLE_CATEGORIES.map((category) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        {PLAN_TYPES.map((plan) => {
                          const oldPrice = activePlan.pricingMatrix[category][plan];
                          const newPrice = scheduledPlan.pricingMatrix[category][plan];

                          if (oldPrice === "NA" || newPrice === "NA") {
                            return (
                              <TableCell key={plan} className="text-center text-gray-400">
                                NA
                              </TableCell>
                            );
                          }

                          const change = newPrice - oldPrice;
                          const changePercent = ((change / oldPrice) * 100).toFixed(1);

                          return (
                            <TableCell key={plan} className="text-center">
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-gray-500 line-through">
                                    {formatPrice(oldPrice)}
                                  </span>
                                  {" → "}
                                  <span className="font-semibold">{formatPrice(newPrice)}</span>
                                </div>
                                <div
                                  className={`text-xs flex items-center justify-center gap-1 ${
                                    change > 0
                                      ? "text-red-600 bg-red-50"
                                      : change < 0
                                      ? "text-green-600 bg-green-50"
                                      : "text-gray-500 bg-gray-50"
                                  } px-2 py-0.5 rounded`}
                                >
                                  {change > 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : change < 0 ? (
                                    <TrendingDown className="w-3 h-3" />
                                  ) : (
                                    <Minus className="w-3 h-3" />
                                  )}
                                  <span>
                                    {change > 0 ? "+" : ""}
                                    {formatPrice(Math.abs(change))} ({changePercent}%)
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
