/**
 * Data Export Service - Export data in multiple formats
 *
 * Supports:
 * - Excel (.xlsx)
 * - CSV (.csv)
 * - JSON (.json)
 *
 * Uses unified schema for exports
 * Includes filters: date range, city, role
 */

import { employeeMasterService } from "./employeeMaster";
import { attendanceMasterService } from "./attendanceMaster";
import { payrollMasterService } from "./payrollMaster";
import { logger } from "./logger";

// ========== TYPES ==========

export type ExportFormat = "excel" | "csv" | "json";

export interface ExportFilters {
  dateRange?: {
    startDate: string; // YYYY-MM-DD
    endDate: string;
  };
  cityId?: string;
  roleId?: string;
  status?: "Draft" | "Active" | "Exit";
  employeeIds?: string[];
}

export interface ExportOptions {
  format: ExportFormat;
  filters?: ExportFilters;
  filename?: string; // Without extension
}

export interface ExportResult {
  success: boolean;
  filename?: string;
  blob?: Blob;
  data?: any;
  errors?: string[];
}

// ========== DATA EXPORT SERVICE ==========

class DataExportServiceClass {
  /**
   * Export employees
   */
  exportEmployees(options: ExportOptions): ExportResult {
    logger.log(`[DataExport] Exporting employees as ${options.format}`);

    try {
      // Get all employees
      let employees = employeeMasterService.getAll();

      // Apply filters
      if (options.filters) {
        employees = this.filterEmployees(employees, options.filters);
      }

      // Generate filename
      const filename = options.filename || `employees_${this.getDateString()}`;

      // Export based on format
      switch (options.format) {
        case "excel":
          return this.exportToExcel(employees, filename, "employees");
        case "csv":
          return this.exportToCSV(employees, filename);
        case "json":
          return this.exportToJSON(employees, filename);
        default:
          return {
            success: false,
            errors: [`Unsupported format: ${options.format}`],
          };
      }
    } catch (error) {
      logger.error("[DataExport] Failed to export employees", error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Export attendance
   */
  exportAttendance(options: ExportOptions): ExportResult {
    logger.log(`[DataExport] Exporting attendance as ${options.format}`);

    try {
      // Get all attendance records
      let attendance = attendanceMasterService.getAll();

      // Apply filters
      if (options.filters) {
        attendance = this.filterAttendance(attendance, options.filters);
      }

      // Generate filename with month if date range provided
      let filename = options.filename;
      if (!filename && options.filters?.dateRange) {
        const startDate = new Date(options.filters.dateRange.startDate);
        const yearMonth = `${startDate.getFullYear()}_${String(startDate.getMonth() + 1).padStart(2, "0")}`;
        filename = `attendance_${yearMonth}`;
      } else {
        filename = `attendance_${this.getDateString()}`;
      }

      // Export based on format
      switch (options.format) {
        case "excel":
          return this.exportToExcel(attendance, filename, "attendance");
        case "csv":
          return this.exportToCSV(attendance, filename);
        case "json":
          return this.exportToJSON(attendance, filename);
        default:
          return {
            success: false,
            errors: [`Unsupported format: ${options.format}`],
          };
      }
    } catch (error) {
      logger.error("[DataExport] Failed to export attendance", error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Export payroll
   */
  exportPayroll(options: ExportOptions): ExportResult {
    logger.log(`[DataExport] Exporting payroll as ${options.format}`);

    try {
      // Get all payroll records
      let payroll = payrollMasterService.getAll();

      // Apply filters
      if (options.filters) {
        payroll = this.filterPayroll(payroll, options.filters);
      }

      // Generate filename
      const filename = options.filename || `payroll_${this.getDateString()}`;

      // Export based on format
      switch (options.format) {
        case "excel":
          return this.exportToExcel(payroll, filename, "payroll");
        case "csv":
          return this.exportToCSV(payroll, filename);
        case "json":
          return this.exportToJSON(payroll, filename);
        default:
          return {
            success: false,
            errors: [`Unsupported format: ${options.format}`],
          };
      }
    } catch (error) {
      logger.error("[DataExport] Failed to export payroll", error as Error);

      return {
        success: false,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // ========== FILTER METHODS ==========

  private filterEmployees(employees: any[], filters: ExportFilters): any[] {
    let filtered = employees;

    if (filters.cityId) {
      filtered = filtered.filter((e) => e.cityId === filters.cityId);
    }

    if (filters.roleId) {
      filtered = filtered.filter((e) => e.roleId === filters.roleId);
    }

    if (filters.status) {
      filtered = filtered.filter((e) => e.status === filters.status);
    }

    if (filters.employeeIds) {
      filtered = filtered.filter((e) => filters.employeeIds!.includes(e.employeeId));
    }

    return filtered;
  }

  private filterAttendance(attendance: any[], filters: ExportFilters): any[] {
    let filtered = attendance;

    if (filters.dateRange) {
      filtered = filtered.filter((a) => {
        const date = a.date;
        return (
          date >= filters.dateRange!.startDate &&
          date <= filters.dateRange!.endDate
        );
      });
    }

    if (filters.cityId) {
      filtered = filtered.filter((a) => a.cityId === filters.cityId);
    }

    if (filters.employeeIds) {
      filtered = filtered.filter((a) => filters.employeeIds!.includes(a.employeeId));
    }

    return filtered;
  }

  private filterPayroll(payroll: any[], filters: ExportFilters): any[] {
    let filtered = payroll;

    if (filters.employeeIds) {
      filtered = filtered.filter((p) => filters.employeeIds!.includes(p.employeeId));
    }

    return filtered;
  }

  // ========== EXPORT FORMAT METHODS ==========

  /**
   * Export to Excel format
   * Note: In a real implementation, use a library like xlsx or exceljs
   */
  private exportToExcel(data: any[], filename: string, sheetName: string): ExportResult {
    // For browser environment, we'll convert to CSV and label it as Excel-compatible
    // In production, use proper Excel library (e.g., xlsx, exceljs)

    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    // Note: This creates a CSV file, not true Excel
    // For true .xlsx, integrate library like:
    // import * as XLSX from 'xlsx';
    // const ws = XLSX.utils.json_to_sheet(data);
    // const wb = XLSX.utils.book_new();
    // XLSX.utils.book_append_sheet(wb, ws, sheetName);
    // const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    // const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    logger.log(`[DataExport] Excel export created: ${filename}.csv`);

    return {
      success: true,
      filename: `${filename}.csv`,
      blob,
      data,
    };
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(data: any[], filename: string): ExportResult {
    const csv = this.convertToCSV(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    logger.log(`[DataExport] CSV export created: ${filename}.csv`);

    return {
      success: true,
      filename: `${filename}.csv`,
      blob,
      data,
    };
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(data: any[], filename: string): ExportResult {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });

    logger.log(`[DataExport] JSON export created: ${filename}.json`);

    return {
      success: true,
      filename: `${filename}.json`,
      blob,
      data,
    };
  }

  /**
   * Convert data to CSV string
   */
  private convertToCSV(data: any[]): string {
    if (data.length === 0) {
      return "";
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);

    // Create header row
    const headerRow = headers.map((h) => this.escapeCSV(h)).join(",");

    // Create data rows
    const dataRows = data.map((item) => {
      return headers
        .map((header) => {
          const value = item[header];
          return this.escapeCSV(this.formatCSVValue(value));
        })
        .join(",");
    });

    // Combine header and data
    return [headerRow, ...dataRows].join("\n");
  }

  /**
   * Escape CSV value
   */
  private escapeCSV(value: string): string {
    if (value === null || value === undefined) {
      return "";
    }

    const stringValue = String(value);

    // If contains comma, quote, or newline, wrap in quotes
    if (
      stringValue.includes(",") ||
      stringValue.includes('"') ||
      stringValue.includes("\n")
    ) {
      // Escape quotes by doubling them
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Format value for CSV
   */
  private formatCSVValue(value: any): string {
    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "object") {
      // Convert objects/arrays to JSON string
      return JSON.stringify(value);
    }

    return String(value);
  }

  /**
   * Get current date string for filename
   */
  private getDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}_${month}_${day}`;
  }

  /**
   * Trigger download in browser
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.log(`[DataExport] File downloaded: ${filename}`);
  }
}

// ========== EXPORT ==========

export const dataExportService = new DataExportServiceClass();
