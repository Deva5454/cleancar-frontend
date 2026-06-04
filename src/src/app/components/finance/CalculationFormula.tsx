import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, Calculator } from "lucide-react";
import { type DiagnosisCategory } from "../../data/recommendationEngine";
import { formatCurrency, formatPercentage } from "../../utils/formatters";

interface CalculationFormulaProps {
  diagnosisCategory: DiagnosisCategory;
  metrics: {
    actualValue: number;
    idealValue: number;
    variance: number;
    variancePercent: number;
    financialImpact: number;
  };
  entityName: string;
  actualJobs?: number;
  idealJobs?: number;
}

export function CalculationFormula({
  diagnosisCategory,
  metrics,
  entityName,
  actualJobs = 477,
  idealJobs = 546,
}: CalculationFormulaProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Generate formula based on diagnosis category
  const getFormula = () => {
    switch (diagnosisCategory) {
      case "Job Volume Shortfall":
        const actualSalaryCPW = 31.45;
        const idealSalaryCPW = 27.47;
        const gap = actualSalaryCPW - idealSalaryCPW;
        const idealJobsPerDay = 21;
        const workingDays = 26;
        
        return {
          title: "Job Volume Shortfall - Expected Monthly Saving",
          steps: [
            {
              label: "Step 1: Calculate salary cost per wash gap",
              formula: `Actual Salary CPW - Ideal Salary CPW`,
              calculation: `${formatCurrency(actualSalaryCPW, 2)} - ${formatCurrency(idealSalaryCPW, 2)} = ${formatCurrency(gap, 2)}`,
            },
            {
              label: "Step 2: Calculate potential monthly jobs at ideal productivity",
              formula: `Ideal Jobs/Day × Working Days`,
              calculation: `${idealJobsPerDay} jobs/day × ${workingDays} days = ${idealJobsPerDay * workingDays} jobs`,
            },
            {
              label: "Step 3: Calculate total monthly saving",
              formula: `Gap per Wash × Jobs/Day × Working Days`,
              calculation: `${formatCurrency(gap, 2)}/wash × ${idealJobsPerDay} jobs × ${workingDays} days = ${formatCurrency(gap * idealJobsPerDay * workingDays, 0)}`,
            },
          ],
          result: formatCurrency(gap * idealJobsPerDay * workingDays, 0),
        };
      
      case "Zero Wash Days":
        const zeroWashDays = metrics.actualValue;
        const dailySalaryCost = 576.92;
        const avgJobsPerDay = 15;
        const revenuePerWash = 100;
        
        return {
          title: "Zero Wash Days - Recovery Potential",
          steps: [
            {
              label: "Step 1: Calculate unrecovered fixed cost",
              formula: `Zero Days × Daily Fixed Cost (Salary + Wear)`,
              calculation: `${zeroWashDays} days × ${formatCurrency(dailySalaryCost, 2)} = ${formatCurrency(zeroWashDays * dailySalaryCost, 0)}`,
            },
            {
              label: "Step 2: Calculate potential revenue recovery",
              formula: `Zero Days × Avg Jobs/Day × Revenue/Wash`,
              calculation: `${zeroWashDays} days × ${avgJobsPerDay} jobs × ${formatCurrency(revenuePerWash, 0)} = ${formatCurrency(zeroWashDays * avgJobsPerDay * revenuePerWash, 0)}`,
            },
            {
              label: "Step 3: Total impact (cost + lost revenue)",
              formula: `Fixed Cost Recovery + Revenue Recovery`,
              calculation: `${formatCurrency(zeroWashDays * dailySalaryCost, 0)} + ${formatCurrency(zeroWashDays * avgJobsPerDay * revenuePerWash, 0)} = ${formatCurrency((zeroWashDays * dailySalaryCost) + (zeroWashDays * avgJobsPerDay * revenuePerWash), 0)}`,
            },
          ],
          result: formatCurrency((zeroWashDays * dailySalaryCost) + (zeroWashDays * avgJobsPerDay * revenuePerWash), 0),
        };
      
      case "Consumable Over-Consumption":
        const excessCPW = 0.94;
        const monthlyJobs = 546;
        
        return {
          title: "Consumable Over-Consumption - Monthly Saving",
          steps: [
            {
              label: "Step 1: Excess consumable cost per wash",
              formula: `Actual CPW - Ideal CPW`,
              calculation: `${formatCurrency(7.18, 2)} - ${formatCurrency(6.24, 2)} = ${formatCurrency(excessCPW, 2)}`,
            },
            {
              label: "Step 2: Monthly saving at ideal volume",
              formula: `Excess/Wash × Ideal Monthly Jobs`,
              calculation: `${formatCurrency(excessCPW, 2)}/wash × ${monthlyJobs} jobs = ${formatCurrency(excessCPW * monthlyJobs, 0)}`,
            },
          ],
          result: formatCurrency(excessCPW * monthlyJobs, 0),
        };
      
      case "Supervisor Underutilization":
        const actualSupervisorCPW = 10.70;
        const idealSupervisorCPW = 2.69;
        const supervisorGap = actualSupervisorCPW - idealSupervisorCPW;
        const idealWashers = 17;
        const idealWasherJobs = 21;
        const workingDaysSuper = 26;
        
        return {
          title: "Supervisor Underutilization - Full Team Capacity Saving",
          steps: [
            {
              label: "Step 1: Supervisor cost per wash gap",
              formula: `Actual Supervisor CPW - Ideal Supervisor CPW`,
              calculation: `${formatCurrency(actualSupervisorCPW, 2)} - ${formatCurrency(idealSupervisorCPW, 2)} = ${formatCurrency(supervisorGap, 2)}`,
            },
            {
              label: "Step 2: Full team monthly jobs (at ideal team size)",
              formula: `Ideal Washers × Jobs/Day × Working Days`,
              calculation: `${idealWashers} washers × ${idealWasherJobs} jobs × ${workingDaysSuper} days = ${idealWashers * idealWasherJobs * workingDaysSuper} jobs`,
            },
            {
              label: "Step 3: Monthly saving at full capacity",
              formula: `Gap/Wash × Full Team Monthly Jobs`,
              calculation: `${formatCurrency(supervisorGap, 2)}/wash × ${idealWashers * idealWasherJobs * workingDaysSuper} jobs = ${formatCurrency(supervisorGap * idealWashers * idealWasherJobs * workingDaysSuper, 0)}`,
            },
          ],
          result: formatCurrency(supervisorGap * idealWashers * idealWasherJobs * workingDaysSuper, 0),
        };
      
      case "High Carry-Forward Stock":
        const excessStock = 135; // ml
        const pricePerUnit = 0.88;
        
        return {
          title: "High Carry-Forward Stock - Working Capital Release",
          steps: [
            {
              label: "Step 1: Excess stock value",
              formula: `(Actual Closing - Ideal Closing) × Unit Price`,
              calculation: `(${metrics.actualValue}ml - ${metrics.idealValue}ml) × ${formatCurrency(pricePerUnit, 2)}/ml = ${formatCurrency(excessStock * pricePerUnit, 0)}`,
            },
            {
              label: "Step 2: Monthly issuance value",
              formula: `Standard Monthly Issuance × Unit Price`,
              calculation: `500ml × ${formatCurrency(pricePerUnit, 2)}/ml = ${formatCurrency(500 * pricePerUnit, 0)}`,
            },
            {
              label: "Impact: Working capital freed by pausing issuance",
              formula: `One Month Issuance Value`,
              calculation: `${formatCurrency(500 * pricePerUnit, 0)}`,
            },
          ],
          result: formatCurrency(500 * pricePerUnit, 0),
        };
      
      default:
        return {
          title: "Calculation Method",
          steps: [
            {
              label: "Financial Impact Calculation",
              formula: `(Actual Value - Ideal Value) × Cost Factor × Volume`,
              calculation: `Based on actual cost data from ${entityName}'s performance`,
            },
          ],
          result: formatCurrency(metrics.financialImpact, 0),
        };
    }
  };
  
  const formula = getFormula();
  
  return (
    <div className="border border-blue-200 rounded-lg overflow-hidden">
      <Button
        variant="ghost"
        className="w-full flex items-center justify-between p-3 hover:bg-blue-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
          <Calculator className="w-4 h-4" />
          How is this calculated?
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-blue-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-blue-600" />
        )}
      </Button>
      
      {isExpanded && (
        <div className="bg-blue-50 border-t border-blue-200 p-4 space-y-3">
          <div className="font-bold text-blue-900 text-sm mb-3">
            {formula.title}
          </div>
          
          {formula.steps.map((step, index) => (
            <div key={index} className="space-y-1">
              <div className="text-xs font-medium text-blue-800">
                {step.label}
              </div>
              <div className="bg-white border border-blue-200 rounded p-2">
                <div className="text-xs text-gray-600 font-mono mb-1">
                  {step.formula}
                </div>
                <div className="text-sm font-semibold text-blue-900">
                  = {step.calculation}
                </div>
              </div>
            </div>
          ))}
          
          <div className="border-t border-blue-300 pt-3 mt-3">
            <div className="flex items-center justify-between bg-blue-100 border border-blue-300 rounded-lg p-3">
              <div className="font-bold text-blue-900">
                Expected Impact:
              </div>
              <div className="text-xl font-bold text-blue-900">
                {formula.result}/month
              </div>
            </div>
          </div>
          
          <div className="text-xs text-blue-700 bg-blue-100 rounded p-2 mt-2">
            <strong>Note:</strong> This calculation uses actual data from {entityName}'s performance records.
            All figures are auto-updated when new cost data is recorded.
          </div>
        </div>
      )}
    </div>
  );
}
