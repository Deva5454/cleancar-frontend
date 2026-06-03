/**
 * Job Cost Details Component
 * Displays cost breakdown for a completed job
 * Shows when viewing submitted job report
 * Last Updated: 2026-03-17
 */
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { DollarSign, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { JobCostRecord } from "../finance/JobCostTracking";

interface JobCostDetailsProps {
  jobCost: JobCostRecord;
  userRole: string; // Only show to Admin, Super Admin, Operations Manager
}

export function JobCostDetails({ jobCost, userRole }: JobCostDetailsProps) {
  // Only visible to authorized roles
  const canViewCost = ["Super Admin", "Admin", "Operations Manager"].includes(userRole);
  
  if (!canViewCost) {
    return null;
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Job Cost Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-3">
              <div className="text-xs text-orange-600 mb-1">Total Actual Cost</div>
              <div className="text-lg font-bold text-orange-900">
                ₹{jobCost.totalActualCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="p-3">
              <div className="text-xs text-gray-600 mb-1">Standard Cost</div>
              <div className="text-lg font-bold text-gray-900">
                ₹{jobCost.totalStandardCost.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card
            className={
              jobCost.totalVariance > 0
                ? "border-red-200 bg-red-50"
                : "border-green-200 bg-green-50"
            }
          >
            <CardContent className="p-3">
              <div className="text-xs text-gray-600 mb-1">Variance</div>
              <div
                className={`text-lg font-bold ${
                  jobCost.totalVariance > 0 ? "text-red-900" : "text-green-900"
                }`}
              >
                {jobCost.totalVariance > 0 ? "+" : ""}₹
                {jobCost.totalVariance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          
          <Card
            className={
              jobCost.jobLevelEBITDAPercent >= 60
                ? "border-green-200 bg-green-50"
                : "border-amber-200 bg-amber-50"
            }
          >
            <CardContent className="p-3">
              <div className="text-xs text-gray-600 mb-1">Job EBITDA</div>
              <div
                className={`text-lg font-bold ${
                  jobCost.jobLevelEBITDAPercent >= 60
                    ? "text-green-900"
                    : "text-amber-900"
                }`}
              >
                {jobCost.jobLevelEBITDAPercent.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Breakdown Table */}
        <div>
          <h4 className="font-medium text-sm mb-2">Cost Component Breakdown</h4>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[600px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead className="text-right">Standard</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {/* Material Cost */}
              <TableRow>
                <TableCell className="font-medium">Material Cost</TableCell>
                <TableCell className="text-right">
                  ₹{jobCost.standardMaterialCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium text-blue-600">
                  ₹{jobCost.actualMaterialCost.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    jobCost.materialVariance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {jobCost.materialVariance > 0 ? "+" : ""}₹
                  {jobCost.materialVariance.toFixed(2)}
                </TableCell>
              </TableRow>

              {/* Consumable Cost */}
              <TableRow>
                <TableCell className="font-medium">Consumable Cost</TableCell>
                <TableCell className="text-right">
                  ₹{jobCost.standardConsumableCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium text-purple-600">
                  ₹{jobCost.actualConsumableCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-gray-600">—</TableCell>
              </TableRow>

              {/* Manpower Cost */}
              <TableRow>
                <TableCell className="font-medium">
                  Manpower Cost
                  {jobCost.durationFlag && (
                    <Badge
                      className={`ml-2 ${
                        jobCost.durationFlag === "red"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {jobCost.durationFlag === "red"
                        ? "Significantly Over"
                        : "Over Standard"}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  ₹{jobCost.standardManpowerCost.toFixed(2)}
                  <div className="text-xs text-gray-500">
                    ({jobCost.standardJobDuration} min)
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium text-green-600">
                  ₹{jobCost.actualManpowerCost.toFixed(2)}
                  <div className="text-xs text-gray-500">
                    ({jobCost.actualJobDuration} min)
                  </div>
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    jobCost.manpowerVariance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {jobCost.manpowerVariance > 0 ? "+" : ""}₹
                  {jobCost.manpowerVariance.toFixed(2)}
                  <div
                    className={`text-xs ${
                      jobCost.durationVariance > 0 ? "text-red-500" : "text-green-500"
                    }`}
                  >
                    ({jobCost.durationVariance > 0 ? "+" : ""}
                    {jobCost.durationVariance} min)
                  </div>
                </TableCell>
              </TableRow>

              {/* Overhead Cost */}
              <TableRow>
                <TableCell className="font-medium">Overhead Cost</TableCell>
                <TableCell className="text-right">
                  ₹{jobCost.standardOverheadCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium text-amber-600">
                  ₹{jobCost.actualOverheadCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-gray-600">—</TableCell>
              </TableRow>

              {/* Total */}
              <TableRow className="font-bold bg-gray-50">
                <TableCell>TOTAL</TableCell>
                <TableCell className="text-right">
                  ₹{jobCost.totalStandardCost.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  ₹{jobCost.totalActualCost.toFixed(2)}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    jobCost.totalVariance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {jobCost.totalVariance > 0 ? "+" : ""}₹
                  {jobCost.totalVariance.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
            </div>
          </div>
        </div>

        {/* Products Used Details */}
        <div>
          <h4 className="font-medium text-sm mb-2">Products Used (Material Tracking)</h4>
          <div className="space-y-2">
            {jobCost.productsUsed.map((product, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded border ${
                  product.used
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {product.used ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium">{product.productName}</span>
                  {!product.used && product.reasonNotUsed && (
                    <Badge variant="outline" className="text-xs">
                      {product.reasonNotUsed}
                    </Badge>
                  )}
                </div>
                <div className="text-sm font-medium">
                  {product.used ? (
                    <span className="text-green-600">₹{product.cost.toFixed(2)}</span>
                  ) : (
                    <span className="text-gray-400">₹0.00</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Duration Details */}
        {jobCost.durationFlag && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-amber-900">
                    Duration Variance Alert:
                  </span>
                  <span className="text-amber-700 ml-1">
                    This job took {jobCost.durationVariance} minutes longer than the
                    standard {jobCost.standardJobDuration} minutes for{" "}
                    {jobCost.packageType} package. This increased manpower cost by ₹
                    {jobCost.manpowerVariance.toFixed(2)}.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* EBITDA Analysis */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Customer Price/Wash:</span>
              <span className="ml-2 font-medium text-green-600">
                ₹{jobCost.pricePerWash.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Actual Cost/Wash:</span>
              <span className="ml-2 font-medium text-orange-600">
                ₹{jobCost.totalActualCost.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Margin/Wash:</span>
              <span className="ml-2 font-medium text-blue-600">
                ₹{jobCost.jobLevelEBITDA.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">EBITDA %:</span>
              <span
                className={`ml-2 font-medium ${
                  jobCost.jobLevelEBITDAPercent >= 60
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {jobCost.jobLevelEBITDAPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
