import React, { useState } from "react";
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
  Building,
  Plus,
  Edit,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Eye,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  OVERHEAD_ITEMS_DYNAMIC,
  OVERHEAD_REVISION_HISTORY,
  getCurrentOverheadAmount,
  getOverheadRevisionHistory,
  getOverheadCostTypeBadgeColor,
  getOverheadAllocationDescription,
} from "../../data/overheadDynamicData";
import { AddOverheadItemDialog } from "./AddOverheadItemDialog";
import { ReviseOverheadDialog } from "./ReviseOverheadDialog";
import { OverheadHistoryDialog } from "./OverheadHistoryDialog";
import { logger } from "../../services/logger";

export function OverheadManagement() {
  const [showAddOverhead, setShowAddOverhead] = useState(false);
  const [showReviseOverhead, setShowReviseOverhead] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedOverheadId, setSelectedOverheadId] = useState<string | null>(null);

  const handleAddOverhead = (data: any) => {
    logger.log("New overhead item:", data);
    toast.success("Overhead item added successfully");
  };

  const handleReviseOverhead = (data: any) => {
    logger.log("Overhead revision:", data);
    toast.success("Overhead amount revised successfully");
  };

  const handleReviseClick = (overheadId: string) => {
    setSelectedOverheadId(overheadId);
    setShowReviseOverhead(true);
  };

  const handleHistoryClick = (overheadId: string) => {
    setSelectedOverheadId(overheadId);
    setShowHistory(true);
  };

  // Calculate summary stats
  const activeOverheads = OVERHEAD_ITEMS_DYNAMIC.filter(
    (oh) => oh.status === "Active"
  );
  
  const totalFixedMonthlyCost = activeOverheads
    .filter((oh) => oh.costType === "Fixed Monthly Amount")
    .reduce((sum, oh) => sum + (oh.fixedMonthlyAmount || 0), 0);

  const totalPerWasherCost = activeOverheads
    .filter((oh) => oh.costType === "Per Washer Per Month")
    .reduce((sum, oh) => sum + (oh.perWasherAmount || 0), 0);

  const avgWashesPerMonth = 520; // From cost data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Overhead Cost Management
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage all overhead costs with dynamic allocation and revision tracking
          </p>
        </div>
        <Button
          onClick={() => setShowAddOverhead(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Overhead Item
        </Button>
      </div>

      {/* Overhead Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overhead Cost Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Cost Type</TableHead>
                  <TableHead className="font-semibold">Current Amount</TableHead>
                  <TableHead className="font-semibold">Allocation Method</TableHead>
                  <TableHead className="font-semibold">Applicability</TableHead>
                  <TableHead className="font-semibold">Effective Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {OVERHEAD_ITEMS_DYNAMIC.map((overhead) => {
                  const currentAmount = getCurrentOverheadAmount(overhead.id);
                  const history = getOverheadRevisionHistory(overhead.id);
                  const hasRevisions = history.length > 0;
                  
                  // Determine amount display
                  let amountDisplay = "";
                  let amountValue = currentAmount;
                  
                  if (overhead.costType === "Fixed Monthly Amount") {
                    amountDisplay = `₹${currentAmount.toLocaleString()}/month`;
                  } else if (overhead.costType === "Per Washer Per Month") {
                    amountDisplay = `₹${currentAmount.toLocaleString()}/washer/month`;
                  } else if (overhead.costType === "Per Zone Per Month") {
                    amountDisplay = `₹${currentAmount.toLocaleString()}/zone/month`;
                  } else if (overhead.costType === "Per Wash Direct") {
                    amountDisplay = `₹${currentAmount.toFixed(2)}/wash`;
                  }

                  // Get latest revision if exists
                  const latestRevision = history[0];
                  const hasIncrease =
                    latestRevision && latestRevision.newAmount > latestRevision.previousAmount;
                  const hasDecrease =
                    latestRevision && latestRevision.newAmount < latestRevision.previousAmount;

                  return (
                    <TableRow key={overhead.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {overhead.itemName}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {overhead.description}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getOverheadCostTypeBadgeColor(overhead.costType)}
                        >
                          {overhead.costType}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-blue-600">
                            {amountDisplay}
                          </span>
                          {hasIncrease && (
                            <TrendingUp className="w-3 h-3 text-red-600" />
                          )}
                          {hasDecrease && (
                            <TrendingDown className="w-3 h-3 text-green-600" />
                          )}
                        </div>
                        {hasRevisions && (
                          <div className="text-xs text-gray-500 mt-1">
                            {history.length} revision{history.length > 1 ? "s" : ""}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-700">
                          {getOverheadAllocationDescription(
                            overhead.costType,
                            overhead.allocationMethod
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm">
                          {overhead.applicability === "All Washers" && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              All Washers
                            </Badge>
                          )}
                          {overhead.applicability === "Specific Zone" && (
                            <Badge variant="outline" className="bg-purple-50 text-purple-700">
                              {overhead.specificZone}
                            </Badge>
                          )}
                          {overhead.applicability === "Specific Washers" && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {overhead.specificWashers?.length} Washers
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-600">
                          {format(new Date(overhead.effectiveDate), "dd MMM yyyy")}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            overhead.status === "Active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {overhead.status}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReviseClick(overhead.id)}
                            title="Revise Amount"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleHistoryClick(overhead.id)}
                            title="View History"
                          >
                            <History className="w-4 h-4 text-purple-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Items</div>
              <div className="text-2xl font-bold text-gray-900">
                {OVERHEAD_ITEMS_DYNAMIC.length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 mb-1">Active Items</div>
              <div className="text-2xl font-bold text-green-600">
                {activeOverheads.length}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">Fixed Monthly</div>
              <div className="text-lg font-bold text-blue-600">
                ₹{totalFixedMonthlyCost.toLocaleString()}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-xs text-purple-700 mb-1">Per Washer/Month</div>
              <div className="text-lg font-bold text-purple-600">
                ₹{totalPerWasherCost.toLocaleString()}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="text-xs text-orange-700 mb-1">Total Revisions</div>
              <div className="text-2xl font-bold text-orange-600">
                {OVERHEAD_REVISION_HISTORY.length}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <strong>Overhead Allocation Logic:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>Fixed Monthly Amount:</strong> Company-wide costs divided by
                  total company washes
                </li>
                <li>
                  <strong>Per Washer Per Month:</strong> Washer-specific costs divided
                  by that washer's monthly washes
                </li>
                <li>
                  <strong>Per Zone Per Month:</strong> Zone-level costs divided by zone
                  washes
                </li>
                <li>
                  <strong>Per Wash Direct:</strong> Usage-based costs charged directly
                  per wash (no allocation)
                </li>
              </ul>
              <div className="mt-2 pt-2 border-t border-blue-300">
                <strong>Cost Per Wash Formula:</strong> Actual Cost Per Wash =
                Consumables + Equipment Wear + Washer Salary + Supervisor Salary +{" "}
                <span className="font-bold text-blue-900">Overhead Allocation</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddOverheadItemDialog
        open={showAddOverhead}
        onOpenChange={setShowAddOverhead}
        onSave={handleAddOverhead}
      />

      {selectedOverheadId && (
        <>
          <ReviseOverheadDialog
            open={showReviseOverhead}
            onOpenChange={setShowReviseOverhead}
            overheadId={selectedOverheadId}
            onSave={handleReviseOverhead}
          />

          <OverheadHistoryDialog
            open={showHistory}
            onOpenChange={setShowHistory}
            overheadId={selectedOverheadId}
          />
        </>
      )}
    </div>
  );
}
