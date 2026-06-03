import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { ADD_ON_SERVICES, COMBO_OFFERS } from "../../data/subscriptionPlans";
import { ADD_ON_EBITDA_DATA } from "../../data/addOnEBITDA";
import { Package, Percent, DollarSign, TrendingUp } from "lucide-react";

export function AddOnComboAnalysis() {
  // Get EBITDA data for add-ons
  const getAddOnEBITDA = (addonId: string) => {
    return ADD_ON_EBITDA_DATA.find((item) => item.id === addonId);
  };

  return (
    <div className="space-y-6">
      {/* Add-On Services Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                ADD-ON SERVICES — bookable with any monthly plan
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                High-margin services that enhance customer value and company profitability
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[900px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Add-on Service</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead className="text-right">Price (4W)</TableHead>
                    <TableHead className="text-right">Price (2W)</TableHead>
                    <TableHead>Best Paired With</TableHead>
                    <TableHead className="text-right">Margin %</TableHead>
                    <TableHead className="text-right">EBITDA ₹</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {ADD_ON_SERVICES.map((addon) => {
                const ebitdaData = getAddOnEBITDA(addon.id);
                const margin4W = ebitdaData?.ebitdaPercentage4W
                  ? (ebitdaData.ebitdaPercentage4W * 100).toFixed(0)
                  : (addon?.estimatedMargin ?? 0).toFixed(0);
                const ebitdaAmount4W = ebitdaData?.ebitdaAmount4W || 0;

                return (
                  <TableRow key={addon.id}>
                    <TableCell className="font-medium">{addon.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {addon.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {addon.billing}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {addon.pricing["4W"] === "NA" ? (
                        <span className="text-gray-400">NA</span>
                      ) : (
                        `₹${addon.pricing["4W"]}`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {addon.pricing["2W"] === "NA" ? (
                        <span className="text-gray-400">NA</span>
                      ) : (
                        `₹${addon.pricing["2W"]}`
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      {addon.bestPairedWith.join(", ")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-green-100 text-green-800 border-green-300">
                        ~{margin4W}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-700">
                      ₹{ebitdaAmount4W}
                    </TableCell>
                    <TableCell>
                      {addon.isActive ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Pending
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
            </div>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <div className="font-semibold text-green-900 text-sm">
                  High-Margin Revenue Opportunity
                </div>
                <p className="text-sm text-green-800 mt-1">
                  All add-on services carry 74-80% EBITDA margin, significantly higher than
                  subscription plans (30-60% target). Each add-on sold improves overall unit
                  economics and customer lifetime value.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combo Offers Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-purple-600" />
                COMBO OFFERS — bundled monthly subscriptions
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Multi-vehicle and premium care packages with attractive savings for customers
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[900px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Combo Name</TableHead>
                    <TableHead>What's Included</TableHead>
                    <TableHead className="text-right">Normal Price</TableHead>
                    <TableHead className="text-right">Combo Price</TableHead>
                    <TableHead className="text-right">Monthly Saving</TableHead>
                    <TableHead className="text-right">Discount %</TableHead>
                    <TableHead>Valid For</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {COMBO_OFFERS.map((combo) => {
                const vehicle1 = combo.planCombination.vehicle1;
                const vehicle2 = combo.planCombination.vehicle2;

                let description = "";
                if (combo.id === "combo-003" || combo.id === "combo-004") {
                  // Premium care packs include add-ons
                  description = combo.description;
                } else if (vehicle2) {
                  description = `${vehicle1.plan} — 1 ${vehicle1.category} + 1 ${vehicle2.category}`;
                } else {
                  description = combo.description;
                }

                return (
                  <TableRow key={combo.id}>
                    <TableCell className="font-medium">{combo.name}</TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-xs">
                      {description}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{combo.totalIndividualPrice.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      ₹{combo.comboPrice.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ₹{combo.savings.toLocaleString("en-IN")} saved
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                        {combo.savingsPercentage}% off
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {combo.id === "combo-001"
                        ? "Same address"
                        : combo.id === "combo-002"
                        ? "Same household"
                        : combo.id === "combo-003"
                        ? "Hatchback/Sedan"
                        : combo.id === "combo-004"
                        ? "SUV/MUV"
                        : combo.id === "combo-005"
                        ? "5+ vehicles, same society"
                        : "Corporate fleet"}
                    </TableCell>
                    <TableCell>
                      {combo.isActive ? (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Percent className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-purple-900 text-sm">
                    Customer Acquisition Strategy
                  </div>
                  <p className="text-sm text-purple-800 mt-1">
                    Combo offers drive multi-vehicle subscriptions and premium plan adoption.
                    Discounts range from 5-15% while maintaining healthy EBITDA margins.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-blue-900 text-sm">
                    Revenue Impact
                  </div>
                  <p className="text-sm text-blue-800 mt-1">
                    Each combo increases customer lifetime value significantly. Fleet packages
                    (10+ vehicles) can generate ₹15,000+ monthly recurring revenue per deal.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Active Add-On Services</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {ADD_ON_SERVICES.filter((a) => a.isActive).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {ADD_ON_SERVICES.filter((a) => !a.isActive).length} pending approval
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Active Combo Offers</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {COMBO_OFFERS.filter((c) => c.isActive).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Bundled subscription packages</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Avg Add-On EBITDA</div>
            <div className="text-3xl font-bold text-green-600 mt-1">
              {(
                ADD_ON_EBITDA_DATA.reduce(
                  (sum, item) => sum + item.ebitdaPercentage4W * 100,
                  0
                ) / ADD_ON_EBITDA_DATA.length
              ).toFixed(0)}
              %
            </div>
            <div className="text-xs text-gray-500 mt-1">74-80% margin range</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
