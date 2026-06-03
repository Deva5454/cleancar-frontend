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
import { History, TrendingUp, TrendingDown, Package, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { type PriceHistoryRecord } from "../../data/costData";
import { getPriceHistory, getPriceVariance } from "../../data/materialHistoryData";

interface MaterialPriceHistoryProps {
  materialId: string;
  materialName: string;
  unitOfMeasure: string;
}

export function MaterialPriceHistory({
  materialId,
  materialName,
  unitOfMeasure,
}: MaterialPriceHistoryProps) {
  const history = getPriceHistory(materialId);
  const variance = getPriceVariance(materialId);

  if (history.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-400" />
            <CardTitle className="text-base">Price History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No price history available</p>
            <p className="text-xs text-gray-400 mt-1">
              Price changes will be tracked from GRN receipts and manual entries
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-base">Price History</CardTitle>
              <CardDescription className="text-xs">
                {materialName} — Historical cost tracking
              </CardDescription>
            </div>
          </div>
          
          {/* Price Variance Summary */}
          <div className="text-right">
            <div className="text-xs text-gray-500 mb-1">Price Change</div>
            <div className="flex items-center gap-2">
              {variance.variancePercent > 0 ? (
                <TrendingUp className="w-4 h-4 text-red-600" />
              ) : variance.variancePercent < 0 ? (
                <TrendingDown className="w-4 h-4 text-green-600" />
              ) : null}
              <div>
                <div className="text-sm font-bold">
                  {variance.variancePercent > 0 ? "+" : ""}
                  {variance.variancePercent.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-600">
                  ₹{variance.variance > 0 ? "+" : ""}
                  {variance.variance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Cost/Unit</TableHead>
                <TableHead className="font-semibold">Details</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((record, index) => {
                const isLatest = index === 0;
                const isFuture = new Date(record.effectiveDate) > new Date();
                const previousPrice = index < history.length - 1 ? history[index + 1].costPerUnit : null;
                const priceChange = previousPrice ? record.costPerUnit - previousPrice : null;
                const priceChangePercent = previousPrice && priceChange !== null
                  ? (priceChange / previousPrice) * 100
                  : null;

                return (
                  <TableRow
                    key={record.id}
                    className={`
                      ${isLatest && !isFuture ? "bg-blue-50 border-l-4 border-l-blue-500" : ""}
                      ${isFuture ? "bg-yellow-50 border-l-4 border-l-yellow-500" : ""}
                    `}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium">
                            {format(new Date(record.effectiveDate), "dd MMM yyyy")}
                          </div>
                          {isLatest && !isFuture && (
                            <div className="text-xs text-blue-600 font-medium">
                              Current Active
                            </div>
                          )}
                          {isFuture && (
                            <div className="text-xs text-yellow-600 font-medium">
                              Scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={record.source === "GRN" ? "default" : "outline"}
                        className={
                          record.source === "GRN"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }
                      >
                        {record.source === "GRN" ? (
                          <Package className="w-3 h-3 mr-1" />
                        ) : (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {record.source}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          ₹{record.costPerUnit.toFixed(2)}
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            / {unitOfMeasure}
                          </span>
                        </div>
                        {priceChange !== null && priceChangePercent !== null && (
                          <div
                            className={`text-xs font-medium flex items-center gap-1 mt-1 ${
                              priceChange > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {priceChange > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {priceChange > 0 ? "+" : ""}
                            {priceChangePercent.toFixed(1)}% ({priceChange > 0 ? "+" : ""}₹
                            {priceChange.toFixed(2)})
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {record.source === "GRN" ? (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            Batch: {record.batchNumber}
                          </div>
                          <div className="text-xs text-gray-600">
                            Qty: {record.quantityReceived?.toLocaleString()} {unitOfMeasure}
                          </div>
                          <div className="text-xs text-gray-500">
                            {record.supplier}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">
                            {record.reason}
                          </div>
                          {record.reference && (
                            <div className="text-xs text-gray-600">
                              Ref: {record.reference}
                            </div>
                          )}
                          <div className="text-xs text-gray-500">
                            By: {record.approvedBy}
                          </div>
                          {record.notes && (
                            <div className="text-xs text-gray-600 mt-1 italic">
                              {record.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {isLatest && !isFuture ? (
                        <Badge className="bg-blue-600 text-white">Active Now</Badge>
                      ) : isFuture ? (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Historical
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Latest Price</div>
            <div className="text-lg font-bold text-blue-600">
              ₹{variance.latestPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Oldest Price</div>
            <div className="text-lg font-bold text-gray-600">
              ₹{variance.oldestPrice.toFixed(2)}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-1">Total Records</div>
            <div className="text-lg font-bold text-gray-900">{history.length}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
