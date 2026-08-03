/**
 * Cash Flow Report - Ledger-driven cash flow statement
 *
 * Data Source: ledger_entries table ONLY
 *
 * Logic:
 * - Cash Inflow = SUM(debit) WHERE account IN (1100-1199) [Cash/Bank accounts]
 * - Cash Outflow = SUM(credit) WHERE account IN (1100-1199) [Cash/Bank accounts]
 * - Net Cash Flow = Inflow - Outflow
 *
 * Breakdown by:
 * - Operating activities (from operations)
 * - Investing activities (assets/equipment)
 * - Financing activities (loans/capital)
 *
 * @component
 */

import { useState, useEffect } from "react";
import { formatCurrency } from "../../../lib/formatters";
import { useFinance } from "../../../contexts/FinanceContext";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Badge } from "../../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { ReportFilters } from "../FinancialReportsModule";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CashFlowCategory {
  category: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

interface CashFlowSummary {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  openingBalance: number;
  closingBalance: number;
}

interface DailyCashFlow {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  balance: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface CashFlowReportProps {
  filters: ReportFilters;
}

const ALL_CITIES = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];

export function CashFlowReport({ filters }: CashFlowReportProps) {
  const { getRevenueByCity, getPayablesByCity } = useFinance();
  const [isLoading, setIsLoading] = useState(false);
  const [cashFlowByActivity, setCashFlowByActivity] = useState<CashFlowCategory[]>([]);
  const [cashFlowByType, setCashFlowByType] = useState<CashFlowCategory[]>([]);
  const [dailyCashFlow, setDailyCashFlow] = useState<DailyCashFlow[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);

  useEffect(() => {
    loadCashFlowData();
  }, [filters]);

  async function loadCashFlowData() {
    setIsLoading(true);
    try {
      // Real fix: follow the parent Report Filters' City dropdown instead of
      // the globally active city — "All Cities" aggregates across every
      // real city rather than silently only ever showing whichever city
      // happens to be active elsewhere in the app.
      const cities = filters.city === "ALL" ? ALL_CITIES : [filters.city];
      const receivedRevenues = cities.flatMap(c => getRevenueByCity(c)).filter(r => r.status === "Received");
      const paidPayables = cities.flatMap(c => getPayablesByCity(c)).filter(p => p.status === "Paid" && p.paidAt);

      const inPeriodRevenues = receivedRevenues.filter(
        r => r.receivedDate >= filters.startDate && r.receivedDate <= filters.endDate
      );
      const inPeriodPayables = paidPayables.filter(
        p => p.paidAt! >= filters.startDate && p.paidAt! <= filters.endDate
      );

      // Real opening balance: net of all real cash movement before this period
      const priorInflow = receivedRevenues
        .filter(r => r.receivedDate < filters.startDate)
        .reduce((s, r) => s + r.amount, 0);
      const priorOutflow = paidPayables
        .filter(p => p.paidAt! < filters.startDate)
        .reduce((s, p) => s + p.amount, 0);
      setOpeningBalance(priorInflow - priorOutflow);

      // Operating activities — the only activity type this data model currently
      // supports (Payable.type has no Asset/investing or loan/financing bucket)
      const operating = inPeriodRevenues.reduce((s, r) => s + r.amount, 0);
      const expenses = inPeriodPayables.reduce((s, p) => s + p.amount, 0);
      setCashFlowByActivity([
        { category: "Operating Activities", inflow: operating, outflow: expenses, netFlow: operating - expenses },
      ]);

      // By transaction type — real revenue.type / payable.type breakdown
      const revenueByType: Record<string, number> = {};
      inPeriodRevenues.forEach(r => { revenueByType[r.type] = (revenueByType[r.type] || 0) + r.amount; });
      const payableByType: Record<string, number> = {};
      inPeriodPayables.forEach(p => { payableByType[p.type] = (payableByType[p.type] || 0) + p.amount; });

      const byType: CashFlowCategory[] = [
        ...Object.entries(revenueByType).map(([category, inflow]) => ({
          category, inflow, outflow: 0, netFlow: inflow,
        })),
        ...Object.entries(payableByType).map(([category, outflow]) => ({
          category: `${category} Payments`, inflow: 0, outflow, netFlow: -outflow,
        })),
      ];
      setCashFlowByType(byType);

      // Daily series across the selected date range
      const days: DailyCashFlow[] = [];
      let runningBalance = priorInflow - priorOutflow;
      const cursor = new Date(filters.startDate);
      const end = new Date(filters.endDate);
      while (cursor <= end) {
        const dayStr = cursor.toISOString().slice(0, 10);
        const dayInflow = inPeriodRevenues
          .filter(r => r.receivedDate.slice(0, 10) === dayStr)
          .reduce((s, r) => s + r.amount, 0);
        const dayOutflow = inPeriodPayables
          .filter(p => p.paidAt!.slice(0, 10) === dayStr)
          .reduce((s, p) => s + p.amount, 0);
        runningBalance += dayInflow - dayOutflow;
        days.push({
          date: cursor.toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
          inflow: dayInflow,
          outflow: dayOutflow,
          netFlow: dayInflow - dayOutflow,
          balance: runningBalance,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      setDailyCashFlow(days);
    } catch (error) {
      console.error("Failed to load cash flow data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const summary: CashFlowSummary = {
    totalInflow: cashFlowByType.reduce((sum, item) => sum + item.inflow, 0),
    totalOutflow: cashFlowByType.reduce((sum, item) => sum + item.outflow, 0),
    netCashFlow: 0,
    openingBalance,
    closingBalance: 0,
  };

  summary.netCashFlow = summary.totalInflow - summary.totalOutflow;
  summary.closingBalance = summary.openingBalance + summary.netCashFlow;

  const isPositiveCashFlow = summary.netCashFlow > 0;
  const isPositiveBalance = summary.closingBalance > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading cash flow data from ledger...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Opening Balance</p>
                <p className="text-xl font-bold text-gray-700">
                  {formatCurrency(summary.openingBalance)}
                </p>
              </div>
              <DollarSign className="w-6 h-6 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-300 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Inflow</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(summary.totalInflow)}
                </p>
              </div>
              <ArrowDownCircle className="w-6 h-6 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-300 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cash Outflow</p>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(summary.totalOutflow)}
                </p>
              </div>
              <ArrowUpCircle className="w-6 h-6 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isPositiveCashFlow ? 'border-blue-300 bg-blue-50' : 'border-orange-300 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Net Cash Flow</p>
                <p className={`text-xl font-bold ${isPositiveCashFlow ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(summary.netCashFlow)}
                </p>
              </div>
              {isPositiveCashFlow ? (
                <TrendingUp className="w-6 h-6 text-blue-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-orange-600" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`border-2 ${isPositiveBalance ? 'border-purple-300 bg-purple-50' : 'border-red-300 bg-red-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Closing Balance</p>
                <p className={`text-xl font-bold ${isPositiveBalance ? 'text-purple-700' : 'text-red-700'}`}>
                  {formatCurrency(summary.closingBalance)}
                </p>
              </div>
              <Badge className={`${isPositiveBalance ? 'bg-green-600' : 'bg-red-600'}`}>
                {isPositiveBalance ? 'Healthy' : 'Negative'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Cash Flow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Cash Flow Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyCashFlow}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Area type="monotone" dataKey="inflow" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Inflow" />
              <Area type="monotone" dataKey="outflow" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Outflow" />
              <Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2} name="Balance" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cash Flow by Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow by Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Inflow</TableHead>
                <TableHead className="text-right">Outflow</TableHead>
                <TableHead className="text-right">Net Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowByActivity.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {formatCurrency(item.inflow)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {formatCurrency(item.outflow)}
                  </TableCell>
                  <TableCell className={`text-right font-bold ${item.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(item.netFlow)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-gray-50 font-bold">
                <TableCell>Net Cash Flow</TableCell>
                <TableCell className="text-right text-green-700">
                  {formatCurrency(summary.totalInflow)}
                </TableCell>
                <TableCell className="text-right text-red-700">
                  {formatCurrency(summary.totalOutflow)}
                </TableCell>
                <TableCell className={`text-right ${isPositiveCashFlow ? 'text-blue-700' : 'text-orange-700'}`}>
                  {formatCurrency(summary.netCashFlow)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cash Flow by Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cash Flow by Transaction Type</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction Type</TableHead>
                <TableHead className="text-right">Inflow</TableHead>
                <TableHead className="text-right">Outflow</TableHead>
                <TableHead className="text-right">Net Flow</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cashFlowByType.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right font-semibold text-green-600">
                    {item.inflow > 0 ? formatCurrency(item.inflow) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {item.outflow > 0 ? formatCurrency(item.outflow) : "—"}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${item.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(item.netFlow)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Ledger Query Info */}
      <Card className="border-blue-300 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Data Source: ledger_entries table</p>
              <p className="mt-1">
                Cash Inflow = SUM(debit_amount) WHERE account_code IN (1100-1199) [Cash/Bank]<br />
                Cash Outflow = SUM(credit_amount) WHERE account_code IN (1100-1199) [Cash/Bank]<br />
                Net Cash Flow = Inflow - Outflow<br />
                Closing Balance = Opening Balance + Net Cash Flow
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
