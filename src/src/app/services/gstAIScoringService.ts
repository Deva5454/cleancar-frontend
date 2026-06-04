export interface RiskFactors {
  taxLogicRisk: number;
  gstinRisk: number;
  patternDeviation: number;
  duplicateRisk: number;
  vendorRisk: number;
  itcRisk: number;
  complianceViolations: number;
}

export interface AICorrection {
  issueType: string;
  originalValue: string;
  suggestedValue: string;
  explanation: string;
  confidence: number;
  autoApplicable: boolean;
  applied: boolean;
  appliedBy?: string;
  appliedAt?: string;
}

export interface ScoringResult {
  totalScore: number;
  riskLevel: "Clean" | "Medium" | "High" | "Critical";
  factors: RiskFactors;
  corrections: AICorrection[];
  requiresManagerReview: boolean;
}

const HIGH_VALUE_THRESHOLD = 100000;
import { COMPANY_GST_CONFIG } from "./gstComplianceService";
const COMPANY_STATE = COMPANY_GST_CONFIG.stateName;

export function calculateRiskScore(factors: RiskFactors): number {
  return Math.round(
    factors.taxLogicRisk        * 0.20 +
    factors.gstinRisk           * 0.15 +
    factors.patternDeviation    * 0.15 +
    factors.duplicateRisk       * 0.10 +
    factors.vendorRisk          * 0.15 +
    factors.itcRisk             * 0.15 +
    factors.complianceViolations* 0.10
  );
}

export function getRiskLevel(score: number): ScoringResult["riskLevel"] {
  if (score < 30) return "Clean";
  if (score < 60) return "Medium";
  if (score < 80) return "High";
  return "Critical";
}

export function generateCorrections(
  transaction: any,
  invoiceTotal: number
): AICorrection[] {
  const corrections: AICorrection[] = [];
  const isHighValue = invoiceTotal > HIGH_VALUE_THRESHOLD;

  if (transaction.gstRate !== 18 && transaction.hsnSacCode?.startsWith("9985")) {
    corrections.push({
      issueType: "Wrong GST rate",
      originalValue: `${transaction.gstRate}%`,
      suggestedValue: "18%",
      explanation: "HSN 9985 (Car wash services) attracts 18% GST as per CGST notification.",
      confidence: 96,
      autoApplicable: !isHighValue,
      applied: false,
    });
  }

  if (transaction.placeOfSupply === COMPANY_STATE && transaction.igst > 0) {
    corrections.push({
      issueType: "Wrong tax type — should be CGST/SGST",
      originalValue: `IGST ₹${transaction.igst}`,
      suggestedValue: `CGST ₹${transaction.igst / 2} + SGST ₹${transaction.igst / 2}`,
      explanation: "Supply within same state must use CGST + SGST, not IGST.",
      confidence: 99,
      autoApplicable: !isHighValue,
      applied: false,
    });
  }

  const expectedTax = transaction.taxableValue * (transaction.gstRate / 100);
  if (Math.abs(transaction.totalTax - expectedTax) > 1) {
    corrections.push({
      issueType: "Tax calculation mismatch",
      originalValue: `₹${transaction.totalTax}`,
      suggestedValue: `₹${expectedTax.toFixed(2)}`,
      explanation: "Total tax does not match Taxable Value × GST Rate.",
      confidence: 99,
      autoApplicable: !isHighValue,
      applied: false,
    });
  }

  return corrections;
}

export function scoreAfterCorrection(currentScore: number, correction: AICorrection): number {
  const reductionMap: Record<string, number> = {
    "Wrong GST rate": 25,
    "Wrong tax type — should be CGST/SGST": 20,
    "Tax calculation mismatch": 15,
  };
  const reduction = reductionMap[correction.issueType] || 10;
  return Math.max(0, currentScore - reduction);
}

export function analyzeTransaction(transaction: any): ScoringResult {
  const factors: RiskFactors = {
    taxLogicRisk: 0,
    gstinRisk: 0,
    patternDeviation: 0,
    duplicateRisk: 0,
    vendorRisk: transaction.riskScore || 0,
    itcRisk: 0,
    complianceViolations: 0
  };

  if (!transaction.partyGstin || transaction.partyGstin.length !== 15) {
    factors.gstinRisk = 40;
  }

  const corrections = generateCorrections(transaction, transaction.invoiceTotal);
  if (corrections.length > 0) {
    factors.taxLogicRisk = corrections.length * 20;
    factors.complianceViolations = corrections.filter(c => c.confidence > 90).length * 15;
  }

  if (transaction.itcEligible && !transaction.partyGstin) {
    factors.itcRisk = 50;
  }

  const totalScore = calculateRiskScore(factors);
  const riskLevel = getRiskLevel(totalScore);
  const requiresManagerReview = riskLevel === "Critical" ||
    corrections.some(c => !c.autoApplicable) ||
    transaction.invoiceTotal > HIGH_VALUE_THRESHOLD;

  return {
    totalScore,
    riskLevel,
    factors,
    corrections,
    requiresManagerReview
  };
}
