import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { 
  Package, 
  DollarSign, 
  Calendar, 
  Truck, 
  ChevronLeft,
  Plus,
  Edit,
  TrendingUp,
} from "lucide-react";
import { type Material } from "../../data/costData";
import { MaterialPriceHistory } from "./MaterialPriceHistory";
import { StandardUsageRateHistory } from "./StandardUsageRateHistory";
import { ManualPriceEntryDialog } from "./ManualPriceEntryDialog";
import { UpdateStandardUsageDialog } from "./UpdateStandardUsageDialog";
import { toast } from "sonner";
import { logger } from "../../services/logger";

interface MaterialDetailViewProps {
  material: Material;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialDetailView({
  material,
  open,
  onOpenChange,
}: MaterialDetailViewProps) {
  const [showPriceEntry, setShowPriceEntry] = useState(false);
  const [showUsageUpdate, setShowUsageUpdate] = useState(false);

  const handlePriceSave = (entry: any) => {
    logger.log("New price entry:", entry);
    // In production, this would save to the backend
  };

  const handleUsageSave = (update: any) => {
    logger.log("Usage update:", update);
    // In production, this would save to the backend
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-xl font-bold">{material.name}</div>
                  <div className="text-sm font-normal text-gray-500 mt-1">
                    Complete cost tracking history and configuration
                  </div>
                </div>
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to List
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Material Overview Card */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-5 h-5 text-blue-600" />
                  Material Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Current Cost</div>
                    <div className="text-xl font-bold text-blue-600">
                      ₹{material.costPerUnit.toFixed(2)}
                      <span className="text-sm font-normal text-gray-600 ml-1">
                        / {material.unitOfMeasure}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Shelf Life</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {material.shelfLife} days
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Supplier</div>
                    <div className="text-sm font-medium text-gray-900">
                      {material.supplier}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Status</div>
                    <Badge
                      className={
                        material.status === "Active"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-gray-100 text-gray-800 border-gray-200"
                      }
                    >
                      {material.status}
                    </Badge>
                  </div>
                </div>

                {/* Package Usage Mapping */}
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">
                    Package Usage Mapping
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {material.usageMapping.map((mapping, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="bg-white border-blue-300 text-blue-700"
                      >
                        {mapping.package}: {mapping.quantityPerWash} {material.unitOfMeasure}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={() => setShowPriceEntry(true)}
                className="bg-blue-600 hover:bg-blue-700 flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Manual Price Entry
              </Button>
              <Button
                onClick={() => setShowUsageUpdate(true)}
                className="bg-purple-600 hover:bg-purple-700 flex-1"
              >
                <Edit className="w-4 h-4 mr-2" />
                Update Standard Usage
              </Button>
            </div>

            {/* Price History Section */}
            <MaterialPriceHistory
              materialId={material.id}
              materialName={material.name}
              unitOfMeasure={material.unitOfMeasure}
            />

            {/* Standard Usage Rate History Section */}
            <StandardUsageRateHistory
              materialId={material.id}
              materialName={material.name}
              unitOfMeasure={material.unitOfMeasure}
              usageMapping={material.usageMapping}
            />

            {/* Info Footer */}
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2 text-xs text-gray-600">
                  <DollarSign className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <strong>Cost Calculation Engine:</strong> The system automatically
                    uses the price and standard usage rates that were active on the date
                    of each transaction. This ensures historical accuracy while allowing
                    you to track and manage cost changes over time. No calculation is
                    ever retroactively changed when you update prices or usage rates.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual Price Entry Dialog */}
      <ManualPriceEntryDialog
        open={showPriceEntry}
        onOpenChange={setShowPriceEntry}
        materialId={material.id}
        materialName={material.name}
        currentPrice={material.costPerUnit}
        unitOfMeasure={material.unitOfMeasure}
        onSave={handlePriceSave}
      />

      {/* Update Standard Usage Dialog */}
      <UpdateStandardUsageDialog
        open={showUsageUpdate}
        onOpenChange={setShowUsageUpdate}
        materialId={material.id}
        materialName={material.name}
        unitOfMeasure={material.unitOfMeasure}
        usageMapping={material.usageMapping}
        onSave={handleUsageSave}
      />
    </>
  );
}
