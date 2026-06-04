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
  Wrench,
  Plus,
  Edit,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import {
  EQUIPMENT_CATEGORIES,
  EQUIPMENT_USEFUL_LIFE_HISTORY,
  getCurrentUsefulLife,
} from "../../data/equipmentSalaryHistoryData";
import { UpdateUsefulLifeDialog } from "./UpdateUsefulLifeDialog";
import { AddEquipmentCategoryDialog } from "./AddEquipmentCategoryDialog";
import { format } from "date-fns";
import { logger } from "../../services/logger";

export function EquipmentCostParameters() {
  const [showUpdateUsefulLife, setShowUpdateUsefulLife] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleUpdateUsefulLife = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowUpdateUsefulLife(true);
  };

  const handleUsefulLifeSave = (data: any) => {
    logger.log("Useful life update:", data);
    toast.success("Equipment useful life updated successfully");
  };

  const handleAddCategory = (data: any) => {
    logger.log("New equipment category:", data);
    toast.success("Equipment category added successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            Equipment Cost Parameters
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage equipment categories, useful life, and depreciation settings
          </p>
        </div>
        <Button
          onClick={() => setShowAddCategory(true)}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Equipment Category
        </Button>
      </div>

      {/* Equipment Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Equipment Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Sub-Category</TableHead>
                  <TableHead className="font-semibold">
                    Current Useful Life
                  </TableHead>
                  <TableHead className="font-semibold">Residual Value</TableHead>
                  <TableHead className="font-semibold">Avg Purchase Cost</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {EQUIPMENT_CATEGORIES.map((category) => {
                  const currentUsefulLife = getCurrentUsefulLife(category.id);
                  const hasChanged = currentUsefulLife !== category.defaultUsefulLifeMonths;
                  const history = EQUIPMENT_USEFUL_LIFE_HISTORY.filter(
                    (h) => h.categoryId === category.id
                  );
                  const latestChange = history.sort(
                    (a, b) =>
                      new Date(b.effectiveDate).getTime() -
                      new Date(a.effectiveDate).getTime()
                  )[0];

                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        {category.categoryName}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {category.subCategory}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">
                            {currentUsefulLife} months
                          </span>
                          {hasChanged && (
                            <div className="flex items-center gap-1">
                              {currentUsefulLife > category.defaultUsefulLifeMonths ? (
                                <TrendingUp className="w-3 h-3 text-green-600" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-red-600" />
                              )}
                              <span
                                className={`text-xs ${
                                  currentUsefulLife > category.defaultUsefulLifeMonths
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {currentUsefulLife > category.defaultUsefulLifeMonths
                                  ? "+"
                                  : ""}
                                {currentUsefulLife - category.defaultUsefulLifeMonths}
                              </span>
                            </div>
                          )}
                        </div>
                        {latestChange && (
                          <div className="text-xs text-gray-500 mt-1">
                            Last updated: {format(new Date(latestChange.effectiveDate), "dd MMM yyyy")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-gray-700">
                        {category.defaultResidualValuePercent}%
                      </TableCell>
                      <TableCell className="font-semibold text-blue-600">
                        ₹{category.averagePurchaseCost.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            category.status === "Active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {category.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateUsefulLife(category.id)}
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
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
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Total Categories</div>
              <div className="text-2xl font-bold text-gray-900">
                {EQUIPMENT_CATEGORIES.length}
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-xs text-blue-700 mb-1">Active Categories</div>
              <div className="text-2xl font-bold text-blue-600">
                {EQUIPMENT_CATEGORIES.filter((c) => c.status === "Active").length}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-xs text-green-700 mb-1">
                Useful Life Revisions
              </div>
              <div className="text-2xl font-bold text-green-600">
                {EQUIPMENT_USEFUL_LIFE_HISTORY.filter((h) => h.reason !== "Initial Setup").length}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="text-xs text-purple-700 mb-1">
                Avg Equipment Value
              </div>
              <div className="text-2xl font-bold text-purple-600">
                ₹
                {Math.round(
                  EQUIPMENT_CATEGORIES.reduce(
                    (sum, cat) => sum + cat.averagePurchaseCost,
                    0
                  ) / EQUIPMENT_CATEGORIES.length
                ).toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Notes */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-orange-800 space-y-2">
              <div>
                <strong>Useful Life Revision Rules:</strong>
              </div>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>
                  <strong>New Equipment Only:</strong> Changes apply only to equipment
                  purchased after the effective date
                </li>
                <li>
                  <strong>All Active Equipment:</strong> Existing equipment recalculates
                  remaining depreciation from effective date — sunk depreciation is not
                  reversed
                </li>
                <li>
                  <strong>Mid-Month Assignment:</strong> Depreciation is prorated from
                  assignment date based on remaining working days
                </li>
                <li>
                  <strong>Equipment Retirement:</strong> Remaining book value posted as
                  one-time write-off cost, shown separately in cost breakdown
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedCategory && (
        <UpdateUsefulLifeDialog
          open={showUpdateUsefulLife}
          onOpenChange={setShowUpdateUsefulLife}
          categoryId={selectedCategory}
          onSave={handleUsefulLifeSave}
        />
      )}

      <AddEquipmentCategoryDialog
        open={showAddCategory}
        onOpenChange={setShowAddCategory}
        onSave={handleAddCategory}
      />
    </div>
  );
}
