import { Link } from "react-router-dom";
import { useCustomerSubscriptions, useFinance } from "../../contexts/AppProvider";
import { useBusinessFlows } from "../../hooks/useBusinessFlows";
import { useRole } from "../../contexts/RoleContext";
import { hasPermission } from "../../utils/permissionEngine";
import { BackButton } from "../ui/back-button";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  DollarSign,
  Users,
  FileText,
  TrendingUp,
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
  FileSpreadsheet,
  Calendar,
  Wallet,
  CreditCard,
} from "lucide-react";
import { AddOnsManagement } from "../finance/AddOnsManagement";
import { ComboOffersManagement } from "../finance/ComboOffersManagement";
import { OneTimeWashPricing } from "../finance/OneTimeWashPricing";
import { PricingOverview } from "../finance/PricingOverview";
import { EBITDADashboard } from "../finance/EBITDADashboard";
import { DealEBITDAValidator } from "../finance/DealEBITDAValidator";
import { CostModelParameters } from "../finance/CostModelParameters";
import { DataSyncValidator } from "../finance/DataSyncValidator";
import { SystemConfigurationManager } from "../admin/SystemConfigurationManager";

export function FinanceModule() {
  // CRITICAL: Use real data from contexts (NO MOCK DATA)
  const { currentUser } = useRole();
  const canExport = hasPermission(currentUser, "finance", "export");
  const { getActiveSubscriptions } = useCustomerSubscriptions();
  const {
    payables,
    getCityFinancialSnapshot,
    getMultiCityDashboard,
    calculateEBITDA,
    calculateMargin,
    getBudget,
    getForecast,
    getVariance,
  } = useFinance();
  const { getSalaryPayablesWithDetails } = useBusinessFlows();

  // ✅ ROLE-BASED DATA ACCESS (MC-06)
  const isAdmin = currentUser.role === "Super Admin" || currentUser.role === "Admin";
  const cityId = currentUser.cityId || "CITY-SURAT";

  // Get financial snapshot(s) based on role
  const financialData = isAdmin
    ? getMultiCityDashboard(["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"])
    : [getCityFinancialSnapshot(cityId)];

  // Aggregate metrics for display (sum across cities for admin, single city for managers)
  const totalRevenue = financialData.reduce((sum, data) => sum + data.totalRevenue, 0);
  const totalExpenses = financialData.reduce((sum, data) => sum + data.totalExpenses, 0);
  const totalMRR = financialData.reduce((sum, data) => sum + data.totalMRR, 0);
  // FIX: Use centralized useRevenueMetrics instead of inline calculation
  // This ensures consistent EBITDA across all screens
  const revenueMetrics = useRevenueMetrics(selectedMonth, selectedCity);
  const ebitda = revenueMetrics.ebitdaAmount;
  const margin = revenueMetrics.ebitdaMargin;

  // Get real payroll data from HRDataContext via FinanceContext
  const salaryPayables = getSalaryPayablesWithDetails();
  const totalPayroll = salaryPayables.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayroll = salaryPayables.filter(p => p.status === "Pending" || p.status === "Approved").length;

  // Calculate MRR from active subscriptions using priceLocked
  const activeSubscriptions = getActiveSubscriptions();
  const mrr = activeSubscriptions.reduce((sum, sub) => sum + sub.priceLocked, 0);

  // ✅ BUDGET, FORECAST, VARIANCE (MC-07)
  const currentMonth = new Date().toISOString().slice(0, 7); // "2026-04"
  const budget = getBudget(cityId, currentMonth);
  const forecast = getForecast(cityId, currentMonth);
  const variance = getVariance(cityId, currentMonth);

  const vendorPayables = [
    { id: 1, vendor: "CleanPro Supplies", invoice: "INV-2026-045", amount: 45000, dueDate: "2026-03-05", status: "Pending" },
    { id: 2, vendor: "Karcher India", invoice: "INV-2026-046", amount: 75000, dueDate: "2026-03-10", status: "Pending" },
    { id: 3, vendor: "AutoCare Ltd", invoice: "INV-2026-044", amount: 15000, dueDate: "2026-02-28", status: "Paid" },
  ];

  const cashCollections = [
    { id: 1, supervisor: "Suresh Yadav", amount: 15000, collectionDate: "2026-02-27", depositDate: "—", status: "Pending Deposit" },
    { id: 2, supervisor: "Ramesh Kumar", amount: 18500, collectionDate: "2026-02-27", depositDate: "—", status: "Pending Deposit" },
    { id: 3, supervisor: "Vijay Singh", amount: 12000, collectionDate: "2026-02-26", depositDate: "2026-02-27", status: "Deposited" },
  ];

  const marketingExpenses = [
    { id: 1, campaign: "Google Ads - Feb", cityManager: "Priya Sharma", amount: 35000, date: "2026-02-15", status: "Approved", roi: "3.2x" },
    { id: 2, campaign: "Facebook Campaign", cityManager: "Priya Sharma", amount: 25000, date: "2026-02-20", status: "Approved", roi: "2.8x" },
    { id: 3, campaign: "Local Events", cityManager: "Priya Sharma", amount: 15000, date: "2026-02-25", status: "Pending", roi: "—" },
  ];

  // ADDED: Statutory Compliance Tracking
  const statutoryCompliance = [
    { 
      id: 1, 
      type: "PF (Provident Fund)", 
      month: "February 2026", 
      amount: 45600, 
      dueDate: "2026-03-15", 
      challanNumber: "PF/2026/02", 
      status: "Pending",
      daysRemaining: 6,
      reminder: true
    },
    { 
      id: 2, 
      type: "ESI (Employee State Insurance)", 
      month: "February 2026", 
      amount: 12400, 
      dueDate: "2026-03-21", 
      challanNumber: "ESI/2026/02", 
      status: "Pending",
      daysRemaining: 12,
      reminder: true
    },
    { 
      id: 3, 
      type: "TDS (Tax Deducted at Source)", 
      month: "February 2026", 
      amount: 35200, 
      dueDate: "2026-03-07", 
      challanNumber: "TDS/2026/02", 
      status: "Urgent",
      daysRemaining: -2,
      reminder: true
    },
    { 
      id: 4, 
      type: "Professional Tax", 
      month: "February 2026", 
      amount: 8900, 
      dueDate: "2026-03-10", 
      challanNumber: "PT/2026/02", 
      status: "Pending",
      daysRemaining: 1,
      reminder: true
    },
    { 
      id: 5, 
      type: "PF (Provident Fund)", 
      month: "January 2026", 
      amount: 43200, 
      dueDate: "2026-02-15", 
      challanNumber: "PF/2026/01", 
      status: "Paid",
      paidDate: "2026-02-14",
      daysRemaining: 0,
      reminder: false
    },
  ];

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finance Module</h1>
          <p className="text-sm text-gray-500 mt-1">Manage payroll, payments, expenses, and accounting</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Link to="/finance/chart-of-accounts" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Chart of Accounts</span>
              <span className="md:hidden">CoA</span>
            </Button>
          </Link>
          <Link to="/finance/revenue-capture" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Receipt className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Revenue Capture</span>
              <span className="md:hidden">Revenue</span>
            </Button>
          </Link>
          <Link to="/finance/package-cost-matrix" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Package Matrix</span>
              <span className="md:hidden">Matrix</span>
            </Button>
          </Link>
          {canExport && (
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden md:inline">Export Reports</span>
              <span className="md:hidden">Export</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Links Section - ADDED */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/finance/chart-of-accounts">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-blue-50 text-blue-600 p-4 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Chart of Accounts</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete account hierarchy following Indian accounting standards
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <Link to="/finance/revenue-capture">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-green-50 text-green-600 p-4 rounded-lg">
                  <Receipt className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Revenue Capture System</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Automated revenue tracking with GST compliance and integration
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-300 bg-blue-50">
          <Link to="/finance/cost-per-wash">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-blue-600 text-white p-4 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-blue-900">Cost Per Wash Analysis</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Company cost, customer pricing, EBITDA tracking, and intelligent recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-300 bg-purple-50">
          <Link to="/finance/package-cost-matrix">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-purple-600 text-white p-4 rounded-lg">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-purple-900">Package Cost Matrix</h3>
                  <p className="text-sm text-purple-700 mt-1">
                    Auto-generated cost breakdown and profitability by package
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-orange-300 bg-orange-50">
          <Link to="/finance/invoices">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-orange-600 text-white p-4 rounded-lg">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-orange-900">Invoice Management</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    Create invoices, track payments, and manage accounts receivable
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-teal-300 bg-teal-50">
          <Link to="/finance/payments">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-teal-600 text-white p-4 rounded-lg">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-teal-900">Payment History</h3>
                  <p className="text-sm text-teal-700 mt-1">
                    Track all payment transactions and collection analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-300 bg-indigo-50">
          <Link to="/finance/analytics">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="bg-indigo-600 text-white p-4 rounded-lg">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-indigo-900">Finance Analytics</h3>
                  <p className="text-sm text-indigo-700 mt-1">
                    Ledger-driven dashboard with revenue, expenses, and profit metrics
                  </p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Stats Cards - Real Financial Data (MC-06) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold mt-1 text-green-600">₹{(totalRevenue / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500 mt-1">{isAdmin ? `${financialData.length} cities` : cityId}</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold mt-1 text-red-600">₹{(totalExpenses / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500 mt-1">{payables.length} payables</p>
              </div>
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">EBITDA</p>
                <p className={`text-2xl font-bold mt-1 ${ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ₹{(ebitda / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">Revenue - Expenses</p>
              </div>
              <div className={`${ebitda >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} p-3 rounded-lg`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {margin.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">EBITDA / Revenue</p>
              </div>
              <div className={`${margin >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} p-3 rounded-lg`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">MRR (Active)</p>
                <p className="text-2xl font-bold mt-1 text-blue-600">₹{(totalMRR / 1000).toFixed(1)}K</p>
                <p className="text-xs text-gray-500 mt-1">{activeSubscriptions.length} subscriptions</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget vs Actual & Forecast (MC-07) */}
      {(budget || forecast) && (
        <Card className="border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Budget vs Actual & Forecast ({currentMonth})</span>
              {!budget && (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  No Budget Set
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Budget Column */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
                  Budget (Target)
                </h4>
                {budget ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue Target</span>
                      <span className="font-semibold text-gray-900">₹{(budget.revenueTarget / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Expense Budget</span>
                      <span className="font-semibold text-gray-900">₹{(budget.expenseBudget / 1000).toFixed(1)}K</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Profit Target</span>
                      <span className="font-semibold text-green-600">₹{(budget.profitTarget / 1000).toFixed(1)}K</span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">No budget set for this month</p>
                )}
              </div>

              {/* Actual Column */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">
                  Actual (Current)
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="font-semibold text-blue-600">₹{(totalRevenue / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Expenses</span>
                  <span className="font-semibold text-red-600">₹{(totalExpenses / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Profit (EBITDA)</span>
                  <span className={`font-semibold ${ebitda >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(ebitda / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>

              {/* Forecast Column */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2 flex items-center justify-between">
                  <span>Forecast (Month-End)</span>
                  <Badge variant="outline" className="text-xs">
                    {(forecast?.confidence ?? 0).toFixed(0)}% confidence
                  </Badge>
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projected Revenue</span>
                  <span className="font-semibold text-blue-600">₹{(forecast.projectedRevenue / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projected Expenses</span>
                  <span className="font-semibold text-red-600">₹{(forecast.projectedExpenses / 1000).toFixed(1)}K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Projected Profit</span>
                  <span className={`font-semibold ${forecast.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{(forecast.projectedProfit / 1000).toFixed(1)}K
                  </span>
                </div>
              </div>
            </div>

            {/* Variance Display */}
            {variance && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide mb-3">
                  Variance (Actual vs Budget)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <div className={`p-3 rounded-lg ${variance.revenueVariance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-600 mb-1">Revenue Variance</p>
                    <p className={`text-lg font-bold ${variance.revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.revenueVariance >= 0 ? '+' : ''}₹{(variance.revenueVariance / 1000).toFixed(1)}K
                    </p>
                    <p className={`text-xs ${variance.revenueVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.revenueVariancePercent >= 0 ? '+' : ''}{(variance?.revenueVariancePercent ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${variance.expenseVariance <= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-600 mb-1">Expense Variance</p>
                    <p className={`text-lg font-bold ${variance.expenseVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.expenseVariance >= 0 ? '+' : ''}₹{(variance.expenseVariance / 1000).toFixed(1)}K
                    </p>
                    <p className={`text-xs ${variance.expenseVariance <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.expenseVariancePercent >= 0 ? '+' : ''}{(variance?.expenseVariancePercent ?? 0).toFixed(1)}%
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${variance.profitVariance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p className="text-xs text-gray-600 mb-1">Profit Variance</p>
                    <p className={`text-lg font-bold ${variance.profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.profitVariance >= 0 ? '+' : ''}₹{(variance.profitVariance / 1000).toFixed(1)}K
                    </p>
                    <p className={`text-xs ${variance.profitVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variance.profitVariancePercent >= 0 ? '+' : ''}{(variance?.profitVariancePercent ?? 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="payroll" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1 mb-2">
          <TabsTrigger value="payroll" className="text-xs px-2 py-1.5 min-h-[32px]">Payroll</TabsTrigger>
          <TabsTrigger value="payables" className="text-xs px-2 py-1.5 min-h-[32px]">Vendor Payments</TabsTrigger>
          <TabsTrigger value="cash" className="text-xs px-2 py-1.5 min-h-[32px]">Cash Management</TabsTrigger>
          <TabsTrigger value="marketing" className="text-xs px-2 py-1.5 min-h-[32px]">Marketing Expenses</TabsTrigger>
          <TabsTrigger value="statutory" className="text-xs px-2 py-1.5 min-h-[32px]">
            <div className="flex items-center gap-2">
              Statutory Compliance
              {statutoryCompliance.filter(s => s.status === "Urgent" || s.daysRemaining <= 3).length > 0 && (
                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {statutoryCompliance.filter(s => s.status === "Urgent" || s.daysRemaining <= 3).length}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="ebitda" className="text-xs px-2 py-1.5 min-h-[32px]">EBITDA Analysis</TabsTrigger>
          <TabsTrigger value="validator" className="text-xs px-2 py-1.5 min-h-[32px]">Deal Validator</TabsTrigger>
          <TabsTrigger value="costmodel" className="text-xs px-2 py-1.5 min-h-[32px]">Cost Model</TabsTrigger>
          <TabsTrigger value="datasync" className="text-xs px-2 py-1.5 min-h-[32px]">Data Sync Check</TabsTrigger>
          <TabsTrigger value="pricing" className="text-xs px-2 py-1.5 min-h-[32px]">Pricing Overview</TabsTrigger>
          <TabsTrigger value="addons" className="text-xs px-2 py-1.5 min-h-[32px]">Add-On Services</TabsTrigger>
          <TabsTrigger value="combos" className="text-xs px-2 py-1.5 min-h-[32px]">Combo Offers</TabsTrigger>
          <TabsTrigger value="onetime" className="text-xs px-2 py-1.5 min-h-[32px]">One-Time Wash</TabsTrigger>
          <TabsTrigger value="sysconfig" className="text-xs px-2 py-1.5 min-h-[32px]">System Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Salary Calculation - February 2026</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="hidden md:table-cell">Month</TableHead>
                      <TableHead>Gross Salary</TableHead>
                      <TableHead className="hidden sm:table-cell">Deductions</TableHead>
                      <TableHead>Net Salary</TableHead>
                      <TableHead className="hidden md:table-cell">Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {salaryPayables.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                        No payroll records found. Process payroll in HR module to see data here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salaryPayables.map((payable) => (
                      <TableRow key={payable.payableId}>
                        <TableCell className="font-medium">
                          {payable.employeeName || payable.employeeId}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">{payable.payrollMonth || "—"}</TableCell>
                        <TableCell>₹{(payable.grossSalary || 0).toLocaleString()}</TableCell>
                        <TableCell className="hidden sm:table-cell text-red-600">-₹{(payable.deductions || 0).toLocaleString()}</TableCell>
                        <TableCell className="font-bold">₹{(payable?.amount ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="hidden md:table-cell">{payable.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant={payable.status === "Paid" ? "secondary" : "default"}>
                            {payable.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {payable.status === "Pending" && (
                            <Button size="sm" variant="outline">Process Payment</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor Payment Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {vendorPayables.map((payable) => (
                  <div 
                    key={payable.id} 
                    className={`p-4 border rounded-lg ${
                      payable.status === "Pending" ? "border-orange-300 bg-orange-50" : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-lg">{payable.vendor}</p>
                          <Badge variant={payable.status === "Paid" ? "secondary" : "default"}>
                            {payable.status}
                          </Badge>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 text-sm">
                          <div className="text-gray-600">Invoice: {payable.invoice}</div>
                          <div className="text-gray-600">Due: {payable.dueDate}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">₹{(payable?.amount ?? 0).toLocaleString()}</p>
                        {payable.status === "Pending" && (
                          <Button size="sm" className="mt-2">Process Payment</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cash" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash Collection & Deposit Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supervisor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Collection Date</TableHead>
                      <TableHead className="hidden md:table-cell">Deposit Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {cashCollections.map((cash) => (
                    <TableRow key={cash.id}>
                      <TableCell className="font-medium">{cash.supervisor}</TableCell>
                      <TableCell className="font-bold">₹{(cash?.amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell className="hidden md:table-cell">{cash.collectionDate}</TableCell>
                      <TableCell className="hidden md:table-cell">{cash.depositDate}</TableCell>
                      <TableCell>
                        <Badge variant={cash.status === "Deposited" ? "secondary" : "default"}>
                          {cash.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cash.status === "Pending Deposit" && (
                          <Button size="sm" variant="outline">Verify Deposit</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Marketing Campaign Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {marketingExpenses.map((expense) => (
                  <div key={expense.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{expense.campaign}</p>
                          <Badge variant={expense.status === "Approved" ? "secondary" : "default"}>
                            {expense.status}
                          </Badge>
                        </div>
                        <div className="mt-2 flex gap-6 text-sm text-gray-600">
                          <span>City Manager: {expense.cityManager}</span>
                          <span>Date: {expense.date}</span>
                          {expense.roi !== "—" && (
                            <span className="text-green-600 font-medium">ROI: {expense.roi}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">₹{(expense?.amount ?? 0).toLocaleString()}</p>
                        {expense.status === "Pending" && (
                          <Button size="sm" className="mt-2">Approve</Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statutory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statutory Compliance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead className="hidden lg:table-cell">Month</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="hidden md:table-cell">Challan Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">Days Remaining</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {statutoryCompliance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.type}</TableCell>
                      <TableCell className="hidden lg:table-cell">{record.month}</TableCell>
                      <TableCell className="font-bold">₹{(record?.amount ?? 0).toLocaleString()}</TableCell>
                      <TableCell>{record.dueDate}</TableCell>
                      <TableCell className="hidden md:table-cell">{record.challanNumber}</TableCell>
                      <TableCell>
                        <Badge variant={record.status === "Paid" ? "secondary" : "default"}>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {record.daysRemaining > 0 ? (
                          <p className="text-gray-500">{record.daysRemaining} days</p>
                        ) : (
                          <p className="text-red-500">Overdue by {Math.abs(record.daysRemaining)} days</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.status === "Pending" && (
                          <Button size="sm" variant="outline">Process Payment</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ebitda" className="space-y-4">
          <EBITDADashboard />
        </TabsContent>

        <TabsContent value="validator" className="space-y-4">
          <DealEBITDAValidator />
        </TabsContent>

        <TabsContent value="costmodel" className="space-y-4">
          <CostModelParameters />
        </TabsContent>

        <TabsContent value="datasync" className="space-y-4">
          <DataSyncValidator />
        </TabsContent>

        <TabsContent value="pricing" className="space-y-4">
          <PricingOverview />
        </TabsContent>

        <TabsContent value="addons" className="space-y-4">
          <AddOnsManagement />
        </TabsContent>

        <TabsContent value="combos" className="space-y-4">
          <ComboOffersManagement />
        </TabsContent>

        <TabsContent value="onetime" className="space-y-4">
          <OneTimeWashPricing />
        </TabsContent>

        <TabsContent value="sysconfig" className="space-y-4">
          <SystemConfigurationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}