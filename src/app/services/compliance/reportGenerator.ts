/**
 * Compliance Report Generator
 *
 * Generates statutory compliance reports for filing
 * Supports: PF, ESIC, PT, LWF, TDS
 *
 * Export formats: Excel, PDF, CSV
 */

import type { IndianState } from "../payroll/complianceRules";

// ========== REPORT TYPES ==========

export type ReportType = "pf" | "esic" | "pt" | "lwf" | "tds";
export type ReportFormat = "excel" | "pdf" | "csv";
export type ReportPeriod = "monthly" | "quarterly" | "yearly";

export interface ReportMetadata {
  type: ReportType;
  period: ReportPeriod;
  month?: number;
  year: number;
  state: IndianState;
  generatedAt: Date;
  totalEmployees: number;
  totalAmount: number;
}

export interface PFReport {
  metadata: ReportMetadata;
  employees: Array<{
    employeeId: string;
    name: string;
    uan: string; // Universal Account Number
    basic: number;
    employeeContribution: number;
    employerContribution: number;
    eps: number; // Employee Pension Scheme
    epf: number; // Employee Provident Fund
  }>;
  summary: {
    totalBasic: number;
    totalEmployeeContribution: number;
    totalEmployerContribution: number;
    totalEPS: number;
    totalEPF: number;
  };
}

export interface ESICReport {
  metadata: ReportMetadata;
  employees: Array<{
    employeeId: string;
    name: string;
    ipNumber: string; // Insurance Person Number
    gross: number;
    employeeContribution: number;
    employerContribution: number;
  }>;
  summary: {
    totalGross: number;
    totalEmployeeContribution: number;
    totalEmployerContribution: number;
  };
}

export interface PTReport {
  metadata: ReportMetadata;
  employees: Array<{
    employeeId: string;
    name: string;
    gross: number;
    ptAmount: number;
  }>;
  summary: {
    totalGross: number;
    totalPT: number;
  };
}

export interface LWFReport {
  metadata: ReportMetadata;
  employees: Array<{
    employeeId: string;
    name: string;
    employeeContribution: number;
    employerContribution: number;
  }>;
  summary: {
    totalEmployeeContribution: number;
    totalEmployerContribution: number;
  };
}

export interface TDSReport {
  metadata: ReportMetadata;
  employees: Array<{
    employeeId: string;
    name: string;
    pan: string; // PAN number
    gross: number;
    taxableIncome: number;
    tdsDeducted: number;
  }>;
  summary: {
    totalGross: number;
    totalTaxableIncome: number;
    totalTDS: number;
  };
  quarters?: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
}

// ========== REPORT GENERATION ==========

/**
 * Generate PF Report (Form 12A / ECR)
 */
export function generatePFReport(
  month: number,
  year: number,
  state: IndianState,
  employees: Array<{
    id: string;
    name: string;
    uan: string;
    basic: number;
  }>
): PFReport {
  const reportEmployees = employees.map((emp) => {
    const basic = Math.min(emp.basic, 15000); // PF capped at 15k
    const employeeContribution = Math.round(basic * 0.12);
    const employerContribution = Math.round(basic * 0.12);
    const eps = Math.round(basic * 0.0833); // 8.33% to EPS
    const epf = Math.round(basic * 0.0367); // 3.67% to EPF

    return {
      employeeId: emp.id,
      name: emp.name,
      uan: emp.uan,
      basic,
      employeeContribution,
      employerContribution,
      eps,
      epf,
    };
  });

  const summary = reportEmployees.reduce(
    (acc, emp) => ({
      totalBasic: acc.totalBasic + emp.basic,
      totalEmployeeContribution: acc.totalEmployeeContribution + emp.employeeContribution,
      totalEmployerContribution: acc.totalEmployerContribution + emp.employerContribution,
      totalEPS: acc.totalEPS + emp.eps,
      totalEPF: acc.totalEPF + emp.epf,
    }),
    {
      totalBasic: 0,
      totalEmployeeContribution: 0,
      totalEmployerContribution: 0,
      totalEPS: 0,
      totalEPF: 0,
    }
  );

  return {
    metadata: {
      type: "pf",
      period: "monthly",
      month,
      year,
      state,
      generatedAt: new Date(),
      totalEmployees: employees.length,
      totalAmount: summary.totalEmployeeContribution + summary.totalEmployerContribution,
    },
    employees: reportEmployees,
    summary,
  };
}

/**
 * Generate ESIC Report (Monthly Contribution)
 */
export function generateESICReport(
  month: number,
  year: number,
  state: IndianState,
  employees: Array<{
    id: string;
    name: string;
    ipNumber: string;
    gross: number;
  }>
): ESICReport {
  const reportEmployees = employees
    .filter((emp) => emp.gross <= 21000) // ESIC only for gross <= 21k
    .map((emp) => ({
      employeeId: emp.id,
      name: emp.name,
      ipNumber: emp.ipNumber,
      gross: emp.gross,
      employeeContribution: Math.round(emp.gross * 0.0075),
      employerContribution: Math.round(emp.gross * 0.0325),
    }));

  const summary = reportEmployees.reduce(
    (acc, emp) => ({
      totalGross: acc.totalGross + emp.gross,
      totalEmployeeContribution: acc.totalEmployeeContribution + emp.employeeContribution,
      totalEmployerContribution: acc.totalEmployerContribution + emp.employerContribution,
    }),
    {
      totalGross: 0,
      totalEmployeeContribution: 0,
      totalEmployerContribution: 0,
    }
  );

  return {
    metadata: {
      type: "esic",
      period: "monthly",
      month,
      year,
      state,
      generatedAt: new Date(),
      totalEmployees: reportEmployees.length,
      totalAmount: summary.totalEmployeeContribution + summary.totalEmployerContribution,
    },
    employees: reportEmployees,
    summary,
  };
}

/**
 * Generate TDS Report (Form 24Q / 26Q)
 */
export function generateTDSReport(
  quarter: number,
  year: number,
  state: IndianState,
  employees: Array<{
    id: string;
    name: string;
    pan: string;
    gross: number;
    tds: number;
  }>
): TDSReport {
  const reportEmployees = employees
    .filter((emp) => emp.tds > 0)
    .map((emp) => ({
      employeeId: emp.id,
      name: emp.name,
      pan: emp.pan,
      gross: emp.gross,
      taxableIncome: emp.gross - 50000, // Standard deduction
      tdsDeducted: emp.tds,
    }));

  const summary = reportEmployees.reduce(
    (acc, emp) => ({
      totalGross: acc.totalGross + emp.gross,
      totalTaxableIncome: acc.totalTaxableIncome + emp.taxableIncome,
      totalTDS: acc.totalTDS + emp.tdsDeducted,
    }),
    {
      totalGross: 0,
      totalTaxableIncome: 0,
      totalTDS: 0,
    }
  );

  return {
    metadata: {
      type: "tds",
      period: "quarterly",
      year,
      state,
      generatedAt: new Date(),
      totalEmployees: reportEmployees.length,
      totalAmount: summary.totalTDS,
    },
    employees: reportEmployees,
    summary,
  };
}

/**
 * Export report to file
 */
export function exportReport(
  report: PFReport | ESICReport | TDSReport | PTReport | LWFReport,
  format: ReportFormat
): { filename: string; data: string } {
  const { type, period, month, year } = report.metadata;
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `${type.toUpperCase()}_${period}_${month || ""}_${year}_${timestamp}.${format}`;

  // In production, this would generate actual file data
  // For now, return mock data
  const data = JSON.stringify(report, null, 2);

  return { filename, data };
}

/**
 * Get filing deadlines for each report type
 */
export function getFilingDeadlines(type: ReportType, month: number, year: number): {
  dueDate: Date;
  isPastDue: boolean;
  daysRemaining: number;
} {
  const deadlines: Record<ReportType, number> = {
    pf: 15, // 15th of next month
    esic: 15, // 15th of next month
    pt: 20, // 20th of next month (varies by state)
    lwf: 15, // 15th of next month
    tds: 7, // 7th of next month for TDS deduction
  };

  const deadline = deadlines[type];
  const dueDate = new Date(year, month, deadline); // Next month

  const today = new Date();
  const isPastDue = today > dueDate;
  const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    dueDate,
    isPastDue,
    daysRemaining,
  };
}

/**
 * Validate report data before submission
 */
export function validateReport(
  report: PFReport | ESICReport | TDSReport | PTReport | LWFReport
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Common validations
  if (report.metadata.totalEmployees === 0) {
    errors.push("No employees included in report");
  }

  if (report.metadata.totalAmount === 0) {
    errors.push("Total amount is zero");
  }

  // Type-specific validations
  if (report.metadata.type === "pf") {
    const pfReport = report as PFReport;
    const invalidUANs = pfReport.employees.filter((emp) => !emp.uan || emp.uan.length !== 12);
    if (invalidUANs.length > 0) {
      errors.push(`${invalidUANs.length} employees have invalid UAN numbers`);
    }
  }

  if (report.metadata.type === "tds") {
    const tdsReport = report as TDSReport;
    const invalidPANs = tdsReport.employees.filter((emp) => !emp.pan || emp.pan.length !== 10);
    if (invalidPANs.length > 0) {
      errors.push(`${invalidPANs.length} employees have invalid PAN numbers`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
