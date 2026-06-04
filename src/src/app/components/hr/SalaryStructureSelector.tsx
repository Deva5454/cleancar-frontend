import React, { useEffect, useState } from "react";
// Updated 2025 - Conditional Rendering Fix
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  DollarSign,
  CheckCircle,
  AlertCircle,
  X,
  Settings,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { calculateCTCFromBasic } from "../../config/salaryConfiguration";
import type { SalaryStructure } from "../../services/salaryStructureService";

interface Props {
  availableStructures: SalaryStructure[];
  selectedStructureId: string;
  onStructureSelect: (id: string) => void;
  customBasicSalary: number;
  onBasicSalaryChange: (value: number) => void;
  employeeDesignation: string;
}

export function SalaryStructureSelector({
  availableStructures,
  selectedStructureId,
  onStructureSelect,
  customBasicSalary,
  onBasicSalaryChange,
  employeeDesignation,
}: Props) {
  const [autoSuggestedStructure, setAutoSuggestedStructure] = useState<SalaryStructure | null>(null);
  const [hasAutoSuggested, setHasAutoSuggested] = useState(false);

  const selectedStructure = availableStructures.find(
    (s) => s.id === selectedStructureId
  );

  // Reset auto-suggestion state when employee designation changes
  useEffect(() => {
    setHasAutoSuggested(false);
    setAutoSuggestedStructure(null);
  }, [employeeDesignation]);

  // Auto-suggest salary structure based on employee designation
  useEffect(() => {
    if (availableStructures.length > 0 && employeeDesignation && !hasAutoSuggested) {
      // Find matching structure by role name (case-insensitive partial match)
      const matchingStructure = availableStructures.find(
        (structure) =>
          structure.roleName.toLowerCase() === employeeDesignation.toLowerCase() ||
          structure.roleName.toLowerCase().includes(employeeDesignation.toLowerCase()) ||
          employeeDesignation.toLowerCase().includes(structure.roleName.toLowerCase())
      );

      if (matchingStructure) {
        setAutoSuggestedStructure(matchingStructure);
        onStructureSelect(matchingStructure.id);
        setHasAutoSuggested(true);
      } else {
        setAutoSuggestedStructure(null);
        setHasAutoSuggested(true);
      }
    }
  }, [availableStructures, employeeDesignation, hasAutoSuggested, onStructureSelect]);

  const handleClearSelection = () => {
    onStructureSelect("");
    setAutoSuggestedStructure(null);
    toast.info("Structure cleared. Please select another structure.");
  };

  return (
    <div className="space-y-4">
      {/* Structure Selection Dropdown - MANDATORY */}
      <div className="space-y-3">
        <div>
          <Label className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Select Salary Structure *
          </Label>
          <Select value={selectedStructureId} onValueChange={onStructureSelect}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a salary structure..." />
            </SelectTrigger>
            <SelectContent>
              {availableStructures.length > 0 ? (
                availableStructures.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id}>
                    <div className="flex flex-col py-1">
                      <span className="font-medium">{structure.id}</span>
                      <span className="text-xs text-gray-500">
                        Role: {structure.roleName} | Gross: ₹{(structure?.monthlyGross ?? 0).toLocaleString()} | Net:
                        ₹{(structure?.components?.netTakeHome ?? 0).toLocaleString()} |{" "}
                        {structure.isMetro ? "Metro" : "Non-Metro"}
                        {structure.applyPFCap && " | PF Capped"}
                      </span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-structures" disabled>
                  No salary structures available
                </SelectItem>
              )}
            </SelectContent>
          </Select>

          {/* Helper text for auto-suggestion */}
          {hasAutoSuggested && employeeDesignation && (
            <div className="mt-2">
              {autoSuggestedStructure ? (
                <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                  <Sparkles className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700">
                    Auto-suggested based on <strong>{employeeDesignation}</strong> — you can change this
                  </p>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    No default structure for this role — please select manually
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {availableStructures.length > 0 ? (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700">
              <strong>{availableStructures.length}</strong> salary{" "}
              {availableStructures.length === 1 ? "structure" : "structures"}{" "}
              available. Please select one to continue.
            </p>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm flex-1">
                <p className="font-semibold text-yellow-800">
                  No Salary Structures Found
                </p>
                <p className="text-yellow-700 text-xs mt-1">
                  No salary structures are available in the system. Please create one in{" "}
                  <Link to="/hr/payroll-configuration" className="underline font-medium">
                    Payroll Configuration
                  </Link>{" "}
                  before creating offer letters.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Show full component breakdown when structure is selected */}
      {selectedStructure && (
        <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-blue-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Selected: {selectedStructure.id}
            </h4>
            <Button size="sm" variant="outline" onClick={handleClearSelection}>
              <X className="w-3 h-3 mr-1" />
              Clear Selection
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm bg-white p-3 rounded">
            <div className="col-span-2 border-b pb-2 mb-2">
              <span className="font-semibold text-gray-700">Role & Earnings</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Applicable Role:</span>
              <span className="font-medium text-blue-600">{selectedStructure.roleName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Basic Salary:</span>
              <span className="font-medium">
                ₹{(selectedStructure?.components?.basic ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">HRA:</span>
              <span className="font-medium">
                ₹{(selectedStructure?.components?.hra ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conveyance:</span>
              <span className="font-medium">
                ₹{(selectedStructure?.components?.conveyance ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Medical:</span>
              <span className="font-medium">
                ₹{(selectedStructure?.components?.medical ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Special Allowance:</span>
              <span className="font-medium">
                ₹{(selectedStructure?.components?.specialAllowance ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="col-span-2 border-t border-b py-2 my-2 bg-green-50">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-800">
                  Monthly Gross:
                </span>
                <span className="font-bold text-green-700">
                  ₹{(selectedStructure?.monthlyGross ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="col-span-2 border-b pb-2 mb-2">
              <span className="font-semibold text-gray-700">Deductions</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employee PF:</span>
              <span className="text-red-600">
                -₹{(selectedStructure?.components?.employeePF ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employee ESIC:</span>
              <span className="text-red-600">
                -₹{(selectedStructure?.components?.employeeESIC ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Professional Tax:</span>
              <span className="text-red-600">
                -₹{(selectedStructure?.components?.professionalTax ?? 0).toLocaleString()}
              </span>
            </div>

            <div className="col-span-2 border-t-2 border-blue-400 pt-3 bg-blue-100 p-2 rounded mt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-blue-900 text-base">
                  Net Take Home:
                </span>
                <span className="font-bold text-blue-900 text-lg">
                  ₹{(selectedStructure?.components?.netTakeHome ?? 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="col-span-2 mt-2 pt-2 border-t">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Location:</span>
                <span className="font-medium">
                  {selectedStructure.isMetro ? "Metro" : "Non-Metro"}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>PF Cap Applied:</span>
                <span className="font-medium">
                  {selectedStructure.applyPFCap ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Validation message when no structure selected */}
      {!selectedStructureId && availableStructures.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm flex-1">
              <p className="font-semibold text-red-800">
                Salary Structure Required
              </p>
              <p className="text-red-700 text-xs mt-1">
                Please select a salary structure from the dropdown above to proceed with offer letter creation.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}