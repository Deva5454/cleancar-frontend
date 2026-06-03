/**
 * Export Button Component - Trigger data exports
 *
 * Features:
 * - Multiple formats (Excel, CSV, JSON)
 * - Date range filter
 * - City filter
 * - Role filter
 * - Custom filename
 */

import React, { useState } from "react";
import { toast } from "sonner";
import { dataExportService, type ExportFormat, type ExportFilters } from "../../services/DataExportService";

interface ExportButtonProps {
  dataType: "employees" | "attendance" | "payroll";
  label?: string;
  filters?: ExportFilters;
  className?: string;
  variant?: "primary" | "secondary" | "text";
}

export function ExportButton({
  dataType,
  label = "Export",
  filters,
  className = "",
  variant = "secondary",
}: ExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    setShowMenu(false);

    try {
      let result;

      switch (dataType) {
        case "employees":
          result = dataExportService.exportEmployees({ format, filters });
          break;
        case "attendance":
          result = dataExportService.exportAttendance({ format, filters });
          break;
        case "payroll":
          result = dataExportService.exportPayroll({ format, filters });
          break;
      }

      if (result.success && result.blob && result.filename) {
        dataExportService.downloadFile(result.blob, result.filename);
      } else {
        console.error("Export failed:", result.errors);
        toast.error("Export failed: " + (result.errors?.join(", ") || "Unknown error"));
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    text: "bg-transparent text-blue-600 hover:bg-blue-50",
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setShowMenu(!showMenu)}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${variantStyles[variant]} ${
          isExporting ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{isExporting ? "Exporting..." : label}</span>
        {!isExporting && (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {showMenu && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <button
              type="button"
              onClick={() => handleExport("excel")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export as Excel</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport("csv")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export as CSV</span>
            </button>

            <button
              type="button"
              onClick={() => handleExport("json")}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Export as JSON</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ExportWithFiltersProps {
  dataType: "employees" | "attendance" | "payroll";
  defaultFilters?: ExportFilters;
  onClose?: () => void;
}

export function ExportWithFilters({
  dataType,
  defaultFilters,
  onClose,
}: ExportWithFiltersProps) {
  const [filters, setFilters] = useState<ExportFilters>(defaultFilters || {});
  const [showFilters, setShowFilters] = useState(false);

  const handleFilterChange = (key: keyof ExportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Export {dataType.charAt(0).toUpperCase() + dataType.slice(1)}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Toggle Filters */}
      <button
        type="button"
        onClick={() => setShowFilters(!showFilters)}
        className="text-sm text-blue-600 hover:text-blue-700 mb-4"
      >
        {showFilters ? "Hide" : "Show"} Filters
      </button>

      {/* Filters */}
      {showFilters && (
        <div className="space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
          {/* Date Range */}
          {dataType === "attendance" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateRange?.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      startDate: e.target.value,
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.dateRange?.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("dateRange", {
                      ...filters.dateRange,
                      endDate: e.target.value,
                    })
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="End Date"
                />
              </div>
            </div>
          )}

          {/* City Filter */}
          {dataType === "employees" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <select
                value={filters.cityId || ""}
                onChange={(e) => handleFilterChange("cityId", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Cities</option>
                <option value="CITY-SURAT">Surat</option>
                <option value="CITY-MUMBAI">Mumbai</option>
                <option value="CITY-AHMEDABAD">Ahmedabad</option>
              </select>
            </div>
          )}

          {/* Role Filter */}
          {dataType === "employees" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={filters.roleId || ""}
                onChange={(e) => handleFilterChange("roleId", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Roles</option>
                <option value="ROLE-001">Car Washer</option>
                <option value="ROLE-002">Supervisor</option>
                <option value="ROLE-003">Manager</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {dataType === "employees" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Exit">Exit</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Export Button */}
      <ExportButton
        dataType={dataType}
        filters={filters}
        label={`Export ${dataType}`}
        className="w-full"
        variant="primary"
      />

      {/* Active Filters Summary */}
      {Object.keys(filters).length > 0 && (
        <div className="mt-4 text-xs text-gray-500">
          <p className="font-medium mb-1">Active Filters:</p>
          <ul className="list-disc list-inside space-y-1">
            {filters.dateRange && (
              <li>
                Date: {filters.dateRange.startDate} to {filters.dateRange.endDate}
              </li>
            )}
            {filters.cityId && <li>City: {filters.cityId}</li>}
            {filters.roleId && <li>Role: {filters.roleId}</li>}
            {filters.status && <li>Status: {filters.status}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
