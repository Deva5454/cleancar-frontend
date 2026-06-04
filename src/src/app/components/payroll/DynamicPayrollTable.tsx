import React from "react";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import type { CalculatedComponent } from "../../services/payrollCalculationEngine";

interface DynamicPayrollTableProps {
  earningsFixed: CalculatedComponent[];
  earningsVariable: CalculatedComponent[];
  deductions: CalculatedComponent[];
  companyContribution: CalculatedComponent[];
  showFullSalary: boolean;
  onManualInputChange?: (componentId: string, value: number) => void;
}

export function DynamicPayrollTable({
  earningsFixed,
  earningsVariable,
  deductions,
  companyContribution,
  showFullSalary,
  onManualInputChange,
}: DynamicPayrollTableProps) {
  // Find the maximum number of rows needed
  const maxRows = Math.max(
    earningsFixed.length,
    earningsVariable.length,
    deductions.length,
    companyContribution.length
  );

  const getAmountDisplay = (component: CalculatedComponent | undefined) => {
    if (!component) return "-";

    const amount = showFullSalary ? component.actualFixAmount : component.finalAmount;

    if (amount === 0 && component.type === "manual" && component.isEditable) {
      return <span className="text-gray-400 text-sm">Not entered</span>;
    }

    return `₹${amount.toFixed(2)}`;
  };

  const renderCell = (
    component: CalculatedComponent | undefined,
    isAmount: boolean = false
  ) => {
    if (!component) {
      return <TableCell className="text-gray-300">-</TableCell>;
    }

    if (!isAmount) {
      // Pay head name with tooltip
      return (
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            <span>{component.name}</span>
            {component.tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-blue-500 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-sm font-semibold mb-1">{component.name}</p>
                    <p className="text-xs text-gray-600 mb-2">{component.tooltip}</p>
                    <p className="text-xs font-mono bg-gray-100 p-1 rounded">
                      {component.formula}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {component.isEditable && (
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                Editable
              </Badge>
            )}
          </div>
        </TableCell>
      );
    } else {
      // Amount cell
      const amount = showFullSalary ? component.actualFixAmount : component.finalAmount;
      const isZero = amount === 0;

      return (
        <TableCell className={`text-right font-semibold ${isZero ? "text-gray-400" : ""}`}>
          {component.isEditable && onManualInputChange ? (
            <input
              type="number"
              value={amount || 0}
              onChange={(e) =>
                onManualInputChange(component.componentId, parseFloat(e.target.value) || 0)
              }
              className="w-full text-right border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          ) : (
            getAmountDisplay(component)
          )}
        </TableCell>
      );
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-green-50 via-purple-50 via-red-50 to-blue-50">
            {/* Fixed Earnings */}
            <TableHead className="border-r-2 border-gray-300 font-bold text-green-900">
              Earnings (Fixed)
            </TableHead>
            <TableHead className="border-r-4 border-gray-400 font-bold text-right text-green-900">
              Amount
            </TableHead>

            {/* Variable Earnings */}
            <TableHead className="border-r-2 border-gray-300 font-bold text-purple-900">
              Earnings (Variable)
            </TableHead>
            <TableHead className="border-r-4 border-gray-400 font-bold text-right text-purple-900">
              Amount
            </TableHead>

            {/* Deductions */}
            <TableHead className="border-r-2 border-gray-300 font-bold text-red-900">
              Deductions
            </TableHead>
            <TableHead className="border-r-4 border-gray-400 font-bold text-right text-red-900">
              Amount
            </TableHead>

            {/* Company Contribution */}
            <TableHead className="border-r-2 border-gray-300 font-bold text-blue-900">
              Company Contribution
            </TableHead>
            <TableHead className="font-bold text-right text-blue-900">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: maxRows }).map((_, rowIndex) => (
            <TableRow
              key={rowIndex}
              className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              {/* Fixed Earnings */}
              {renderCell(earningsFixed[rowIndex])}
              {renderCell(earningsFixed[rowIndex], true)}

              {/* Variable Earnings */}
              {renderCell(earningsVariable[rowIndex])}
              {renderCell(earningsVariable[rowIndex], true)}

              {/* Deductions */}
              {renderCell(deductions[rowIndex])}
              {renderCell(deductions[rowIndex], true)}

              {/* Company Contribution */}
              {renderCell(companyContribution[rowIndex])}
              {renderCell(companyContribution[rowIndex], true)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
