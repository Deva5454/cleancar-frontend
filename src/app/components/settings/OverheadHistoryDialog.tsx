import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { History, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  OVERHEAD_ITEMS_DYNAMIC,
  getOverheadRevisionHistory,
} from "../../data/overheadDynamicData";

interface OverheadHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overheadId: string;
}

export function OverheadHistoryDialog({
  open,
  onOpenChange,
  overheadId,
}: OverheadHistoryDialogProps) {
  const overhead = OVERHEAD_ITEMS_DYNAMIC.find((oh) => oh.id === overheadId);
  const history = getOverheadRevisionHistory(overheadId);

  if (!overhead) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Overhead Revision History
          </DialogTitle>
          <DialogDescription>
            Complete revision history for <strong>{overhead.itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Overhead Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Item Name</div>
                <div className="font-medium text-gray-900">
                  {overhead.itemName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Cost Type</div>
                <Badge variant="outline" className="text-xs">
                  {overhead.costType}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Revisions</div>
                <div className="text-xl font-bold text-purple-600">
                  {history.length}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="text-xs text-gray-600">{overhead.description}</div>
            </div>
          </div>

          {/* Revision History Table */}
          {history.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Effective Date</TableHead>
                    <TableHead className="font-semibold">Previous Amount</TableHead>
                    <TableHead className="font-semibold">New Amount</TableHead>
                    <TableHead className="font-semibold">Change</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                    <TableHead className="font-semibold">Approved By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((revision, index) => {
                    const isLatest = index === 0;
                    const amountChange =
                      revision.newAmount - revision.previousAmount;
                    const amountChangePercent =
                      revision.previousAmount > 0
                        ? (amountChange / revision.previousAmount) * 100
                        : 0;

                    return (
                      <TableRow
                        key={revision.id}
                        className={
                          isLatest
                            ? "bg-green-50 border-l-4 border-l-green-500"
                            : ""
                        }
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="text-sm font-medium">
                                {format(
                                  new Date(revision.effectiveDate),
                                  "dd MMM yyyy"
                                )}
                              </div>
                              {isLatest && (
                                <div className="text-xs text-green-600 font-medium">
                                  Current Active
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-600">
                            ₹{revision.previousAmount.toLocaleString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="text-base font-bold text-gray-900">
                            ₹{revision.newAmount.toLocaleString()}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div
                            className={`text-sm font-medium flex items-center gap-1 ${
                              amountChange > 0
                                ? "text-red-600"
                                : amountChange < 0
                                ? "text-green-600"
                                : "text-gray-600"
                            }`}
                          >
                            {amountChange > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : amountChange < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : null}
                            <div>
                              {amountChange > 0 ? "+" : ""}
                              {amountChangePercent.toFixed(1)}%
                              <div className="text-xs text-gray-500">
                                {amountChange > 0 ? "+" : ""}₹
                                {Math.abs(amountChange).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              revision.reason.includes("Increase")
                                ? "bg-red-50 text-red-700 border-red-200"
                                : revision.reason.includes("Decrease")
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }
                          >
                            {revision.reason}
                          </Badge>
                          {revision.notes && (
                            <div className="text-xs text-gray-500 mt-1 italic max-w-xs">
                              {revision.notes}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="text-sm text-gray-700">
                            {revision.approvedBy}
                          </div>
                          <div className="text-xs text-gray-500">
                            {format(
                              new Date(revision.createdAt),
                              "dd MMM yyyy HH:mm"
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <div className="text-sm">No revision history yet</div>
              <div className="text-xs mt-1">
                This overhead item has not been revised since creation
              </div>
            </div>
          )}

          {/* Summary Stats */}
          {history.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-500 mb-1">
                  Total Revisions
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {history.length}
                </div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="text-xs text-red-700 mb-1">Increases</div>
                <div className="text-xl font-bold text-red-600">
                  {
                    history.filter((h) => h.newAmount > h.previousAmount).length
                  }
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-xs text-green-700 mb-1">Decreases</div>
                <div className="text-xl font-bold text-green-600">
                  {
                    history.filter((h) => h.newAmount < h.previousAmount).length
                  }
                </div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-xs text-blue-700 mb-1">Current Amount</div>
                <div className="text-lg font-bold text-blue-600">
                  ₹{history[0]?.newAmount.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
