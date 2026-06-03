/**
 * Report By Package
 * Package-wise cost and revenue tracking
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Package,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportPreviewModal } from "../ReportPreviewModal";

interface PackageData {
  id: string;
  packageName: string;
  activeSubscriptions: number;
  totalWashes: number;
  avgActualCost: number;
  standardCost: number;
  variance: number;
  avgCustomerPrice: number;
  avgEBITDA: number;
  revenueContribution: number;
  marginStatus: "Above Target" | "Near Target" | "Below Target";
  vehicleBreakdown: {
    vehicleCategory: string;
    subscriptions: number;
    avgCost: number;
    avgPrice: number;
    ebitda: number;
  }[];
}

interface ReportByPackageProps {
  period: string;
}

export function ReportByPackage({ period }: ReportByPackageProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const packageData: PackageData[] = [
    {
      id: "1",
      packageName: "Water + Shampoo + Wax",
      activeSubscriptions: 542,
      totalWashes: 14092,
      avgActualCost: 91.5,
      standardCost: 89.5,
      variance: 2.0,
      avgCustomerPrice: 112.3,
      avgEBITDA: 61.8,
      revenueContribution: 35.2,
      marginStatus: "Above Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "Hatchback",
          subscriptions: 145,
          avgCost: 89.2,
          avgPrice: 108.3,
          ebitda: 62.5,
        },
        {
          vehicleCategory: "Compact Sedan (<4m)",
          subscriptions: 128,
          avgCost: 91.5,
          avgPrice: 112.5,
          ebitda: 61.8,
        },
        {
          vehicleCategory: "Mid-Size Sedan (>4m)",
          subscriptions: 98,
          avgCost: 93.8,
          avgPrice: 115.4,
          ebitda: 60.9,
        },
        {
          vehicleCategory: "Compact SUV (<4m)",
          subscriptions: 112,
          avgCost: 92.3,
          avgPrice: 113.8,
          ebitda: 61.5,
        },
        {
          vehicleCategory: "Mid/Large SUV",
          subscriptions: 59,
          avgCost: 95.2,
          avgPrice: 118.2,
          ebitda: 60.2,
        },
      ],
    },
    {
      id: "2",
      packageName: "Water + Shampoo + Wax",
      activeSubscriptions: 385,
      totalWashes: 10010,
      avgActualCost: 122.8,
      standardCost: 120.0,
      variance: 2.8,
      avgCustomerPrice: 156.9,
      avgEBITDA: 62.3,
      revenueContribution: 28.5,
      marginStatus: "Above Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "Compact Sedan (<4m)",
          subscriptions: 98,
          avgCost: 119.5,
          avgPrice: 153.8,
          ebitda: 62.8,
        },
        {
          vehicleCategory: "Mid-Size Sedan (>4m)",
          subscriptions: 142,
          avgCost: 123.2,
          avgPrice: 157.5,
          ebitda: 62.1,
        },
        {
          vehicleCategory: "Compact SUV (<4m)",
          subscriptions: 85,
          avgCost: 121.5,
          avgPrice: 155.4,
          ebitda: 62.5,
        },
        {
          vehicleCategory: "Mid/Large SUV",
          subscriptions: 60,
          avgCost: 126.8,
          avgPrice: 161.2,
          ebitda: 61.8,
        },
      ],
    },
    {
      id: "3",
      packageName: "Water Wash",
      activeSubscriptions: 298,
      totalWashes: 7744,
      avgActualCost: 78.2,
      standardCost: 76.0,
      variance: 2.2,
      avgCustomerPrice: 85.4,
      avgEBITDA: 58.5,
      revenueContribution: 12.8,
      marginStatus: "Near Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "2W - Scooter",
          subscriptions: 45,
          avgCost: 68.5,
          avgPrice: 75.2,
          ebitda: 59.2,
        },
        {
          vehicleCategory: "2W - Standard Bike",
          subscriptions: 38,
          avgCost: 70.2,
          avgPrice: 77.8,
          ebitda: 58.9,
        },
        {
          vehicleCategory: "Hatchback",
          subscriptions: 125,
          avgCost: 79.5,
          avgPrice: 86.5,
          ebitda: 58.1,
        },
        {
          vehicleCategory: "Compact Sedan (<4m)",
          subscriptions: 90,
          avgCost: 82.3,
          avgPrice: 89.2,
          ebitda: 57.8,
        },
      ],
    },
    {
      id: "4",
      packageName: "Elite Plus",
      activeSubscriptions: 156,
      totalWashes: 4056,
      avgActualCost: 185.5,
      standardCost: 180.0,
      variance: 5.5,
      avgCustomerPrice: 252.3,
      avgEBITDA: 63.5,
      revenueContribution: 18.2,
      marginStatus: "Above Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "Mid-Size Sedan (>4m)",
          subscriptions: 42,
          avgCost: 178.5,
          avgPrice: 245.2,
          ebitda: 64.2,
        },
        {
          vehicleCategory: "Mid/Large SUV",
          subscriptions: 68,
          avgCost: 188.2,
          avgPrice: 255.8,
          ebitda: 63.2,
        },
        {
          vehicleCategory: "MPV (6-7 Seater)",
          subscriptions: 28,
          avgCost: 192.5,
          avgPrice: 258.5,
          ebitda: 62.8,
        },
        {
          vehicleCategory: "Coupes / Convertibles (Luxury)",
          subscriptions: 18,
          avgCost: 195.8,
          avgPrice: 265.2,
          ebitda: 63.8,
        },
      ],
    },
    {
      id: "5",
      packageName: "Interior",
      activeSubscriptions: 124,
      totalWashes: 3224,
      avgActualCost: 142.5,
      standardCost: 138.0,
      variance: 4.5,
      avgCustomerPrice: 175.8,
      avgEBITDA: 59.2,
      revenueContribution: 10.5,
      marginStatus: "Near Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "Hatchback",
          subscriptions: 35,
          avgCost: 135.2,
          avgPrice: 168.5,
          ebitda: 59.8,
        },
        {
          vehicleCategory: "Compact Sedan (<4m)",
          subscriptions: 42,
          avgCost: 142.8,
          avgPrice: 176.2,
          ebitda: 59.1,
        },
        {
          vehicleCategory: "Mid-Size Sedan (>4m)",
          subscriptions: 28,
          avgCost: 145.5,
          avgPrice: 179.8,
          ebitda: 58.9,
        },
        {
          vehicleCategory: "Compact SUV (<4m)",
          subscriptions: 19,
          avgCost: 148.2,
          avgPrice: 182.5,
          ebitda: 58.5,
        },
      ],
    },
    {
      id: "6",
      packageName: "One-Time Non-Member",
      activeSubscriptions: 0,
      totalWashes: 892,
      avgActualCost: 95.8,
      standardCost: 92.0,
      variance: 3.8,
      avgCustomerPrice: 185.5,
      avgEBITDA: 65.2,
      revenueContribution: 4.8,
      marginStatus: "Above Target",
      vehicleBreakdown: [
        {
          vehicleCategory: "Hatchback",
          subscriptions: 0,
          avgCost: 92.5,
          avgPrice: 180.0,
          ebitda: 65.8,
        },
        {
          vehicleCategory: "Mid-Size Sedan (>4m)",
          subscriptions: 0,
          avgCost: 98.2,
          avgPrice: 190.0,
          ebitda: 64.9,
        },
        {
          vehicleCategory: "Mid/Large SUV",
          subscriptions: 0,
          avgCost: 102.5,
          avgPrice: 195.0,
          ebitda: 64.5,
        },
      ],
    },
  ];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const userRole = "Admin"; // Mock

  return (
    <>
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-pink-600" />
              Report by Package
            </div>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Package Name</TableHead>
                  <TableHead className="text-right">Active Subscriptions</TableHead>
                  <TableHead className="text-right">Total Washes</TableHead>
                  <TableHead className="text-right">Avg Actual Cost</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="text-right">Avg Customer Price</TableHead>
                  <TableHead className="text-right">Avg EBITDA %</TableHead>
                  {(userRole === "Admin" || userRole === "Super Admin") && (
                    <TableHead className="text-right">Revenue %</TableHead>
                  )}
                  <TableHead>Margin Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageData.map((pkg) => (
                  <>
                    <TableRow key={pkg.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(pkg.id)}
                        >
                          {expandedRows.has(pkg.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-bold text-pink-600">
                        {pkg.packageName}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {pkg.activeSubscriptions}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {pkg.totalWashes.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        ₹{pkg.avgActualCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ₹{pkg.standardCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            pkg.variance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {pkg.variance > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {pkg.variance > 0 ? "+" : ""}₹{pkg.variance.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ₹{pkg.avgCustomerPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            pkg.avgEBITDA >= 60
                              ? "bg-green-100 text-green-800"
                              : pkg.avgEBITDA >= 55
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {pkg.avgEBITDA.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      {(userRole === "Admin" || userRole === "Super Admin") && (
                        <TableCell className="text-right font-medium text-purple-600">
                          {pkg.revenueContribution.toFixed(1)}%
                        </TableCell>
                      )}
                      <TableCell>
                        {pkg.marginStatus === "Above Target" && (
                          <Badge className="bg-green-100 text-green-800">
                            Above Target
                          </Badge>
                        )}
                        {pkg.marginStatus === "Near Target" && (
                          <Badge className="bg-amber-100 text-amber-800">
                            Near Target
                          </Badge>
                        )}
                        {pkg.marginStatus === "Below Target" && (
                          <Badge className="bg-red-100 text-red-800">
                            Below Target
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded Vehicle Category Breakdown */}
                    {expandedRows.has(pkg.id) && (
                      <TableRow>
                        <TableCell
                          colSpan={userRole === "Admin" || userRole === "Super Admin" ? 12 : 11}
                          className="bg-pink-50"
                        >
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-3">
                              Vehicle Category Breakdown for {pkg.packageName}
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Vehicle Category</TableHead>
                                  <TableHead className="text-right">
                                    Subscriptions
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Avg Cost/Wash
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Avg Price/Wash
                                  </TableHead>
                                  <TableHead className="text-right">EBITDA %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {pkg.vehicleBreakdown.map((vehicle, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      {vehicle.vehicleCategory}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {vehicle.subscriptions}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-orange-600">
                                      ₹{vehicle.avgCost.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-green-600">
                                      ₹{vehicle.avgPrice.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Badge
                                        className={
                                          vehicle.ebitda >= 60
                                            ? "bg-green-100 text-green-800"
                                            : vehicle.ebitda >= 55
                                            ? "bg-amber-100 text-amber-800"
                                            : "bg-red-100 text-red-800"
                                        }
                                      >
                                        {vehicle.ebitda.toFixed(1)}%
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 mb-1">Total Packages</div>
                <div className="text-xl font-bold text-blue-900">
                  {packageData.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">
                  Total Subscriptions
                </div>
                <div className="text-xl font-bold text-green-900">
                  {packageData
                    .reduce((sum, p) => sum + p.activeSubscriptions, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">Total Washes</div>
                <div className="text-xl font-bold text-orange-900">
                  {packageData
                    .reduce((sum, p) => sum + p.totalWashes, 0)
                    .toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <div className="text-xs text-purple-600 mb-1">Avg EBITDA</div>
                <div className="text-xl font-bold text-purple-900">
                  {(
                    packageData.reduce((sum, p) => sum + p.avgEBITDA, 0) /
                    packageData.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by Package"
        period={period}
        filters={{}}
        data={packageData}
        columns={[
          { key: "packageName", label: "Package Name" },
          { key: "activeSubscriptions", label: "Active Subscriptions" },
          { key: "totalWashes", label: "Total Washes" },
          { key: "avgActualCost", label: "Avg Actual Cost", format: "currency" },
          { key: "avgCustomerPrice", label: "Avg Customer Price", format: "currency" },
          { key: "avgEBITDA", label: "Avg EBITDA %" },
          { key: "marginStatus", label: "Margin Status" },
        ]}
      />
    </>
  );
}
