/**
 * Financial Reports Module - Ledger-driven reporting system
 *
 * All reports derive data from ledger_entries table (single source of truth)
 * No direct dependency on operational tables
 *
 * Reports:
 * 1. Profit & Loss - Revenue vs Expenses
 * 2. Cash Flow - Inflow vs Outflow
 * 3. Unit Economics - Per-wash metrics
 * 4. Multi-City Comparison - Cross-city analysis
 *
 * @component
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  MapPin,
  Download,
  RefreshCw,
  Info,
} from "lucide-react";
import { ProfitLossReport } from "./reports/ProfitLossReport";
import { CashFlowReport } from "./reports/CashFlowReport";
import { UnitEconomicsReport } from "./reports/UnitEconomicsReport";
import { MultiCityComparisonReport } from "./reports/MultiCityComparisonReport";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ReportFilters {
  city: string;
  startDate: string;
  endDate: string;
  serviceType: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinancialReportsModule() {
  const [activeTab, setActiveTab] = useState("profit-loss");
  const [isLoading, setIsLoading] = useState(false);

  const [filters, setFilters] = useState<ReportFilters>({
    city: "ALL",
    startDate: "2026-04-01",
    endDate: "2026-04-30",
    serviceType: "ALL",
  });

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // In production: Trigger data refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting) return; // prevent double-click
    setIsExporting(true);
    // Yield to browser so UI updates before heavy computation
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      const city = cityInfo?.id || "CITY-SURAT";
      const revs = getRevenueByCity ? getRevenueByCity(city) : [];
      const pays = getPayablesByCity ? getPayablesByCity(city) : [];
      const rows = [
        ["Date","Type","Description","Amount","Status"],
        ...revs.map((r: any) => [r.receivedDate, "Revenue", r.type, r.amount, r.status]),
        ...pays.map((p: any) => [p.dueDate, "Expense", p.description, p.amount, p.status]),
      ];
      const csv = rows.map(r => r.join(",")).join("\n");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const a = document.createElement("a");
      a.href = "data:text/csv," + encodeURIComponent(csv);
      a.download = `finance_report_${city}_${timestamp}.csv`;
      a.click();
      toast?.success?.("Report exported successfully");
    } catch(e) {
      console.error("Export failed:", e);
      toast?.error?.("Export failed — please try again");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance" />

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Financial Reports</h1>
          <p className="text-gray-600">
            Ledger-driven financial analysis and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className={`w-4 h-4 mr-2 ${isExporting ? "animate-bounce" : ""}`} />
            Export
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* City Filter */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                City
              </Label>
              <Select
                value={filters.city}
                onValueChange={(value) => handleFilterChange("city", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Cities</SelectItem>
                  <SelectItem value="SUR">Surat</SelectItem>
                  <SelectItem value="MUM">Mumbai</SelectItem>
                  <SelectItem value="AHD">Ahmedabad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select
                value={filters.serviceType}
                onValueChange={(value) => handleFilterChange("serviceType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Services</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="ON_DEMAND">On-Demand</SelectItem>
                  <SelectItem value="DEEP_CLEAN">Deep Clean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters Indicator */}
          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Info className="w-3 h-3" />
              Filters Applied
            </Badge>
            <span className="text-sm text-gray-600">
              {filters.city !== "ALL" && `City: ${filters.city} • `}
              {filters.startDate} to {filters.endDate}
              {filters.serviceType !== "ALL" && ` • ${filters.serviceType}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Ledger-Driven Info Banner */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Ledger-Driven Reporting</p>
              <p className="mt-1">
                All financial reports derive data from the <code className="bg-blue-100 px-1 rounded">ledger_entries</code> table.
                This ensures consistency across all reports and provides a single source of truth for all financial data.
                No direct queries to operational tables (invoices, expenses, payroll) are used.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profit-loss" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="cash-flow" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Cash Flow
          </TabsTrigger>
          <TabsTrigger value="unit-economics" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Unit Economics
          </TabsTrigger>
          <TabsTrigger value="multi-city" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Multi-City
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profit-loss">
          <ProfitLossReport filters={filters} />
        </TabsContent>

        <TabsContent value="cash-flow">
          <CashFlowReport filters={filters} />
        </TabsContent>

        <TabsContent value="unit-economics">
          <UnitEconomicsReport filters={filters} />
        </TabsContent>

        <TabsContent value="multi-city">
          <MultiCityComparisonReport filters={filters} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
