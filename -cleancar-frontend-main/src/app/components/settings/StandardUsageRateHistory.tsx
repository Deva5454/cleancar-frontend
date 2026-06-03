import React from "react";
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
import { History, TrendingUp, TrendingDown, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { type StandardUsageRateHistory as UsageRateRecord } from "../../data/costData";
import { getUsageRateHistory } from "../../data/materialHistoryData";

interface StandardUsageRateHistoryProps {
  materialId: string;
  materialName: string;
  unitOfMeasure: string;
  usageMapping: { package: string; quantityPerWash: number }[];
}

export function StandardUsageRateHistory({
  materialId,
  materialName,
  unitOfMeasure,
  usageMapping,
}: StandardUsageRateHistoryProps) {
  const allHistory = getUsageRateHistory(materialId);

  // Group history by package
  const historyByPackage = usageMapping.map((mapping) => {
    const packageHistory = allHistory.filter(
      (h) => h.packageName === mapping.package
    );
    return {
      package: mapping.package,
      currentQuantity: mapping.quantityPerWash,
      history: packageHistory,
    };
  });

  // Filter to only show packages that have history
  const packagesWithHistory = historyByPackage.filter((p) => p.history.length > 0);

  if (packagesWithHistory.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-base">Standard Usage Rate History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No usage rate history available</p>
            <p className="text-xs text-gray-400 mt-1">
              Changes to standard quantities per wash will be tracked here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-purple-600" />
          <div>
            <CardTitle className="text-base">Standard Usage Rate History</CardTitle>
            <CardDescription className="text-xs">
              {materialName} — Historical standard quantity changes per package
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {packagesWithHistory.map(({ package: pkgName, currentQuantity, history }) => {
          const latestHistoryRecord = history[0];
          const oldestHistoryRecord = history[history.length - 1];
          const totalChange = latestHistoryRecord.standardQuantity - oldestHistoryRecord.standardQuantity;
          const totalChangePercent = oldestHistoryRecord.standardQuantity > 0
            ? (totalChange / oldestHistoryRecord.standardQuantity) * 100
            : 0;

          return (
            <div key={pkgName} className="space-y-2">
              {/* Package Header */}
              <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                <div>
                  <div className="font-semibold text-gray-900">{pkgName}</div>
                  <div className="text-xs text-gray-500">
                    Current: {currentQuantity} {unitOfMeasure} per wash
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Total Change</div>
                  <div
                    className={`text-sm font-bold flex items-center gap-1 justify-end ${
                      totalChange > 0 ? "text-red-600" : totalChange < 0 ? "text-green-600" : "text-gray-600"
                    }`}
                  >
                    {totalChange > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : totalChange < 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : null}
                    {totalChange > 0 ? "+" : ""}
                    {totalChangePercent.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Effective Date</TableHead>
                      <TableHead className="font-semibold">Quantity</TableHead>
                      <TableHead className="font-semibold">Change</TableHead>
                      <TableHead className="font-semibold">Reason</TableHead>
                      <TableHead className="font-semibold">Approved By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((record, index) => {
                      const isLatest = index === 0;
                      const previousQuantity = index < history.length - 1
                        ? history[index + 1].standardQuantity
                        : null;
                      const quantityChange = previousQuantity
                        ? record.standardQuantity - previousQuantity
                        : null;
                      const quantityChangePercent = previousQuantity && quantityChange !== null
                        ? (quantityChange / previousQuantity) * 100
                        : null;

                      return (
                        <TableRow
                          key={record.id}
                          className={isLatest ? "bg-purple-50 border-l-4 border-l-purple-500" : ""}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <div>
                                <div className="text-sm font-medium">
                                  {format(new Date(record.effectiveDate), "dd MMM yyyy")}
                                </div>
                                {isLatest && (
                                  <div className="text-xs text-purple-600 font-medium">
                                    Current Standard
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-base font-bold text-gray-900">
                              {record.standardQuantity} {unitOfMeasure}
                            </div>
                          </TableCell>

                          <TableCell>
                            {quantityChange !== null && quantityChangePercent !== null ? (
                              <div
                                className={`text-sm font-medium flex items-center gap-1 ${
                                  quantityChange > 0
                                    ? "text-red-600"
                                    : quantityChange < 0
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {quantityChange > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : quantityChange < 0 ? (
                                  <TrendingDown className="w-3 h-3" />
                                ) : null}
                                <div>
                                  {quantityChange > 0 ? "+" : ""}
                                  {quantityChangePercent.toFixed(1)}%
                                  <div className="text-xs text-gray-500">
                                    ({quantityChange > 0 ? "+" : ""}
                                    {quantityChange} {unitOfMeasure})
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                Initial
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            <div className="text-sm">
                              <Badge
                                variant="outline"
                                className={
                                  record.reason === "Optimized for Quality"
                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                    : record.reason === "Cost Reduction Initiative"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : record.reason === "Quality Complaint Investigation"
                                    ? "bg-orange-50 text-orange-700 border-orange-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                                }
                              >
                                {record.reason}
                              </Badge>
                              {record.notes && (
                                <div className="text-xs text-gray-600 mt-1 italic">
                                  {record.notes}
                                </div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="text-sm text-gray-700">
                              {record.approvedBy}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          );
        })}

        {/* Summary */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Packages Tracked</div>
              <div className="text-lg font-bold text-purple-600">
                {packagesWithHistory.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Total Changes</div>
              <div className="text-lg font-bold text-gray-900">
                {allHistory.length}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Latest Update</div>
              <div className="text-sm font-medium text-gray-700">
                {allHistory.length > 0
                  ? format(new Date(allHistory[0].effectiveDate), "dd MMM yyyy")
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
