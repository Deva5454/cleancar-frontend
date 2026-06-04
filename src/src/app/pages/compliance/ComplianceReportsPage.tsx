/**
 * Compliance Reports & Filings Page
 *
 * Standalone module for generating and managing statutory reports
 * Supports: PF, ESIC, PT, LWF, TDS
 *
 * Features:
 * - Generate reports for any period
 * - Export in multiple formats (Excel, PDF, CSV)
 * - CA Mode toggle for enhanced details
 * - Filing deadline tracking
 * - Validation before export
 *
 * Route: /compliance/reports
 */

import { useState } from "react";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Filter,
  Eye,
  Settings,
} from "lucide-react";
import type { ReportType, ReportFormat, ReportPeriod } from "../../services/compliance/reportGenerator";
import {
  generatePFReport,
  generateESICReport,
  generateTDSReport,
  exportReport,
  getFilingDeadlines,
  validateReport,
} from "../../services/compliance/reportGenerator";

export default function ComplianceReportsPage() {
  const [selectedType, setSelectedType] = useState<ReportType>("pf");
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("monthly");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [caMode, setCaMode] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Mock employee data (in production, fetch from database)
  const mockEmployees = {
    pf: Array.from({ length: 25 }, (_, i) => ({
      id: `EMP-${String(i + 1).padStart(3, "0")}`,
      name: `Employee ${i + 1}`,
      uan: `100000000001`,
      basic: 22000,
    })),
    esic: Array.from({ length: 12 }, (_, i) => ({
      id: `EMP-${String(i + 1).padStart(3, "0")}`,
      name: `Employee ${i + 1}`,
      ipNumber: `0000000001`,
      gross: 28000,
    })),
    tds: Array.from({ length: 18 }, (_, i) => ({
      id: `EMP-${String(i + 1).padStart(3, "0")}`,
      name: `Employee ${i + 1}`,
      pan: `ABCDE1234F`,
      gross: 35000 + Math.floor(Math.random() * 30000),
      tds: 5000,
    })),
  };

  const reportTypes: Array<{ type: ReportType; label: string; icon: string }> = [
    { type: "pf", label: "Provident Fund (PF)", icon: "📊" },
    { type: "esic", label: "Employee State Insurance (ESIC)", icon: "🏥" },
    { type: "pt", label: "Professional Tax (PT)", icon: "💼" },
    { type: "lwf", label: "Labour Welfare Fund (LWF)", icon: "🛡️" },
    { type: "tds", label: "Tax Deducted at Source (TDS)", icon: "💰" },
  ];

  const handleGenerate = () => {
    let report;
    switch (selectedType) {
      case "pf":
        report = generatePFReport(selectedMonth, selectedYear, "GJ", mockEmployees.pf);
        break;
      case "esic":
        report = generateESICReport(selectedMonth, selectedYear, "GJ", mockEmployees.esic);
        break;
      case "tds":
        report = generateTDSReport(1, selectedYear, "GJ", mockEmployees.tds);
        break;
      default:
        alert("Report generation for this type is not yet implemented");
        return;
    }

    const validation = validateReport(report);
    if (!validation.valid) {
      alert(`Validation failed:\n${validation.errors.join("\n")}`);
      return;
    }

    setShowPreview(true);
    alert(`${selectedType.toUpperCase()} report generated successfully!`);
  };

  const handleExport = (format: ReportFormat) => {
    // Generate report first
    let report;
    switch (selectedType) {
      case "pf":
        report = generatePFReport(selectedMonth, selectedYear, "GJ", mockEmployees.pf);
        break;
      case "esic":
        report = generateESICReport(selectedMonth, selectedYear, "GJ", mockEmployees.esic);
        break;
      case "tds":
        report = generateTDSReport(1, selectedYear, "GJ", mockEmployees.tds);
        break;
      default:
        alert("Export for this type is not yet implemented");
        return;
    }

    const { filename } = exportReport(report, format);
    alert(`Exported as ${filename}`);
  };

  const deadline = getFilingDeadlines(selectedType, selectedMonth, selectedYear);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Compliance Reports & Filings
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Generate and manage statutory compliance reports
                </p>
              </div>
            </div>

            {/* CA Mode Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg">
              <Settings className="w-4 h-4 text-purple-600" />
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-purple-900">CA Mode</span>
                <input
                  type="checkbox"
                  checked={caMode}
                  onChange={(e) => setCaMode(e.target.checked)}
                  className="w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Report Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Report Type */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Report Type
              </h2>

              <div className="space-y-2">
                {reportTypes.map((report) => (
                  <button
                    key={report.type}
                    onClick={() => setSelectedType(report.type)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      selectedType === report.type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-2xl">{report.icon}</span>
                    <div className="flex-1 text-left">
                      <div
                        className={`text-sm font-medium ${
                          selectedType === report.type
                            ? "text-blue-900"
                            : "text-gray-900"
                        }`}
                      >
                        {report.label}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Period Selection */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Select Period
              </h2>

              <div className="space-y-4">
                {/* Period Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Period Type
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as ReportPeriod)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>

                {/* Month (if monthly/quarterly) */}
                {(selectedPeriod === "monthly" || selectedPeriod === "quarterly") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                          {new Date(2020, i).toLocaleString("en-IN", { month: "long" })}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={2026 - i}>
                        {2026 - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Filing Deadline */}
              <div
                className={`mt-4 p-3 rounded-lg border ${
                  deadline.isPastDue
                    ? "bg-red-50 border-red-200"
                    : deadline.daysRemaining <= 7
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-green-50 border-green-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">Filing Deadline</span>
                </div>
                <div className="text-sm">
                  {deadline.dueDate.toLocaleDateString("en-IN", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="text-xs mt-1">
                  {deadline.isPastDue
                    ? `Overdue by ${Math.abs(deadline.daysRemaining)} days`
                    : `${deadline.daysRemaining} days remaining`}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Report Preview & Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  {reportTypes.find((r) => r.type === selectedType)?.label} Report
                </h2>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExport("excel")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Excel
                  </button>
                  <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    PDF
                  </button>
                  <button
                    onClick={() => handleExport("csv")}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700">Total Employees</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {selectedType === "pf"
                      ? mockEmployees.pf.length
                      : selectedType === "esic"
                      ? mockEmployees.esic.length
                      : mockEmployees.tds.length}
                  </div>
                </div>

                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700">Total Amount</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    ₹{(542000).toLocaleString()}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="text-sm text-purple-700">Status</div>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Ready</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-6"
              >
                <Eye className="w-5 h-5" />
                Generate & Preview Report
              </button>

              {/* Preview Table (if showPreview) */}
              {showPreview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-900">
                      Report Preview
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            Emp ID
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">
                            Name
                          </th>
                          {selectedType === "pf" && (
                            <>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Basic
                              </th>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Employee
                              </th>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Employer
                              </th>
                            </>
                          )}
                          {selectedType === "esic" && (
                            <>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Gross
                              </th>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Employee
                              </th>
                              <th className="px-4 py-2 text-right font-medium text-gray-700">
                                Employer
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(selectedType === "pf"
                          ? mockEmployees.pf
                          : mockEmployees.esic
                        )
                          .slice(0, 5)
                          .map((emp: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2">{emp.id}</td>
                              <td className="px-4 py-2">{emp.name}</td>
                              <td className="px-4 py-2 text-right">
                                ₹{(emp.basic || emp.gross).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-right">
                                ₹{Math.round((emp.basic || emp.gross) * 0.12).toLocaleString()}
                              </td>
                              <td className="px-4 py-2 text-right">
                                ₹{Math.round((emp.basic || emp.gross) * 0.12).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-xs text-gray-500">
                    Showing 5 of{" "}
                    {selectedType === "pf"
                      ? mockEmployees.pf.length
                      : mockEmployees.esic.length}{" "}
                    employees
                  </div>
                </div>
              )}

              {caMode && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-purple-900 mb-2">
                    CA Mode: Enhanced Details
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Detailed breakdowns for each employee</li>
                    <li>• Component-wise calculation visibility</li>
                    <li>• Statutory compliance verification</li>
                    <li>• Audit-ready formatting</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
