import { BackButton } from "../ui/back-button";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Filter, Download, FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { useCity } from "../../contexts/CityContext";
import { gstComplianceService } from "../../services/gstComplianceService";
import { useGlobalFilters } from "../navigation/GlobalFilterBar";
import { StableChartContainer, createFilterKey } from "../charts/StableChartContainer";

export function ExpenseAnalytics() {
  const { city, cityInfo } = useCity();
  const { filters } = useGlobalFilters();
  const savedVendors = gstComplianceService.getVendors() || [];

  // Use global filters if set, otherwise use local state
  const [dateFrom, setDateFrom] = useState(filters.startDate || "2026-01-01");
  const [dateTo, setDateTo] = useState(filters.endDate || "2026-03-09");

  // Create stable filter key for chart rendering
  const filterKey = useMemo(() => createFilterKey({ ...filters, dateFrom, dateTo }), [filters, dateFrom, dateTo]);

  const savedTransactions = (gstComplianceService.getTransactions() || [])
    .filter(t => t.transactionType === "Purchase" || t.transactionType === "Expense")
    .filter(t => {
      const txDate = t.invoiceDate;
      if (dateFrom && txDate < dateFrom) return false;
      if (dateTo && txDate > dateTo) return false;
      return true;
    });

  // Memoize static chart data to prevent re-renders
  const expenseTrendData = useMemo(() => [
    { month: "Oct", amount: 450000, id: "trend-oct" },
    { month: "Nov", amount: 520000, id: "trend-nov" },
    { month: "Dec", amount: 480000, id: "trend-dec" },
    { month: "Jan", amount: 610000, id: "trend-jan" },
    { month: "Feb", amount: 580000, id: "trend-feb" },
    { month: "Mar", amount: 650000, id: "trend-mar" }
  ], []);

  const categoryDistribution = useMemo(() => [
    { name: "Marketing", value: 250000, color: "#3b82f6", id: "dist-marketing" },
    { name: "Operations", value: 180000, color: "#10b981", id: "dist-operations" },
    { name: "Vendor Payments", value: 150000, color: "#f59e0b", id: "dist-vendor" },
    { name: "Rent & Utilities", value: 120000, color: "#8b5cf6", id: "dist-rent" },
    { name: "Salaries", value: 80000, color: "#ec4899", id: "dist-salaries" },
    { name: "Miscellaneous", value: 70000, color: "#6b7280", id: "dist-misc" }
  ], []);

  const vendorExpenses = useMemo(() => savedVendors.length > 0
    ? savedVendors.map(v => ({
        id: v.id,
        vendor: v.legalName,
        amount: savedTransactions
          .filter(t => t.partyId === v.id)
          .reduce((sum, t) => sum + (t.invoiceTotal || 0), 0),
      })).filter(v => v.amount > 0).sort((a,b) => b.amount - a.amount).slice(0, 5)
    : [
        { vendor: "ABC Supplies", amount: 85000, id: "vend-abc" },
        { vendor: "XYZ Services", amount: 72000, id: "vend-xyz" },
        { vendor: "PQR Solutions", amount: 68000, id: "vend-pqr" },
        { vendor: "LMN Trading", amount: 55000, id: "vend-lmn" },
        { vendor: "DEF Logistics", amount: 48000, id: "vend-def" }
      ], [savedVendors, savedTransactions]);

  const marketingVsOperations = useMemo(() => [
    { month: "Oct", marketing: 120000, operations: 80000, id: "mo-oct" },
    { month: "Nov", marketing: 140000, operations: 95000, id: "mo-nov" },
    { month: "Dec", marketing: 130000, operations: 88000, id: "mo-dec" },
    { month: "Jan", marketing: 165000, operations: 110000, id: "mo-jan" },
    { month: "Feb", marketing: 155000, operations: 105000, id: "mo-feb" },
    { month: "Mar", marketing: 175000, operations: 120000, id: "mo-mar" }
  ], []);

  const mockExpenses = [
    { id: 1, date: "2026-03-08", vendor: "ABC Supplies", category: "Operations", amount: 15000, region: cityInfo.displayName, pinCode: "395005", areaName: "Adajan", document: "invoice_001.pdf", status: "Approved" },
    { id: 2, date: "2026-03-07", vendor: "XYZ Marketing", category: "Marketing", amount: 25000, region: cityInfo.displayName, pinCode: "395006", areaName: "Vesu", document: "receipt_045.pdf", status: "Approved" },
    { id: 3, date: "2026-03-06", vendor: "PQR Utilities", category: "Utilities", amount: 8000, region: "All Regions", pinCode: "All Zones", areaName: "All Service Zones", document: "bill_022.pdf", status: "Approved" },
    { id: 4, date: "2026-03-05", vendor: "LMN Services", category: "Maintenance", amount: 12000, region: cityInfo.displayName, pinCode: "395009", areaName: "Jahangirpura", document: "invoice_078.pdf", status: "Pending Approval" },
    { id: 5, date: "2026-03-04", vendor: "DEF Solutions", category: "Operations", amount: 18000, region: cityInfo.displayName, pinCode: "395007", areaName: "Althan", document: "payment_proof.jpg", status: "Approved" }
  ];

  const expenseData = savedTransactions.length > 0
    ? savedTransactions.map(t => ({
        id: t.id,
        date: t.invoiceDate,
        vendor: t.partyName || "Unknown Vendor",
        category: t.transactionSubType || "Operations",
        amount: t.invoiceTotal,
        region: t.placeOfSupply || cityInfo.displayName,
        pinCode: t.pinCode || "",
        areaName: t.area || "",
        document: t.invoiceNumber,
        status: t.status === "Validated" ? "Approved" : "Pending",
      }))
    : mockExpenses;

  const exportToExcel = () => {
    // Export logic here
    toast.info("Exporting to Excel...");
  };

  const downloadDocuments = () => {
    // Download documents logic
    toast.info("Downloading documents...");
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Bird's eye view of all expenses with comprehensive filters</p>
        </div>
        <Link to="/accounts">
          <Button variant="outline" size="sm">Back to Dashboard</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date From</Label>
              <Input 
                id="date-from" 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date To</Label>
              <Input 
                id="date-to" 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="mumbai-central">Mumbai Central</SelectItem>
                  <SelectItem value="mumbai-western">Mumbai Western</SelectItem>
                  <SelectItem value="mumbai-eastern">Mumbai Eastern</SelectItem>
                  <SelectItem value="thane">Thane</SelectItem>
                  <SelectItem value="navi-mumbai">Navi Mumbai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="store">Store</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Stores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stores</SelectItem>
                  <SelectItem value="store-a">Store A</SelectItem>
                  <SelectItem value="store-b">Store B</SelectItem>
                  <SelectItem value="store-c">Store C</SelectItem>
                  <SelectItem value="store-d">Store D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone">Service Zone (PIN)</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Service Zones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Service Zones</SelectItem>
                  <SelectItem value="395005">395005 — Adajan</SelectItem>
                  <SelectItem value="395006">395006 — Vesu</SelectItem>
                  <SelectItem value="395009">395009 — Jahangirpura</SelectItem>
                  <SelectItem value="395007">395007 — Althan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Vendors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Vendors</SelectItem>
                  {savedVendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Expense Category</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="utilities">Utilities</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-mode">Payment Mode</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">Apply Filters</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Expense Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="expense-trend"
              filterKey={filterKey}
              data={expenseTrendData}
              height={250}
            >
              <LineChart data={expenseTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="category-distribution"
              filterKey={filterKey}
              data={categoryDistribution}
              height={250}
            >
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  isAnimationActive={false}
                >
                  {categoryDistribution.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Vendor-wise Expenses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vendor-wise Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="vendor-expenses"
              filterKey={filterKey}
              data={vendorExpenses}
              height={250}
            >
              <BarChart data={vendorExpenses}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip />
                <Bar
                  dataKey="amount"
                  fill="#10b981"
                  isAnimationActive={false}
                />
              </BarChart>
            </StableChartContainer>
          </CardContent>
        </Card>

        {/* Marketing vs Operations Cost */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketing vs Operations Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <StableChartContainer
              chartName="marketing-vs-operations"
              filterKey={filterKey}
              data={marketingVsOperations}
              height={250}
            >
              <LineChart data={marketingVsOperations}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="marketing"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="operations"
                  stroke="#10b981"
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </StableChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table View */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Expense Records</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Export to Excel
              </Button>
              <Button size="sm" variant="outline" onClick={downloadDocuments}>
                <FileText className="w-4 h-4 mr-2" />
                Download Documents
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Service Zone</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.date}</TableCell>
                  <TableCell className="font-medium">{expense.vendor}</TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>₹{(expense?.amount ?? 0).toLocaleString()}</TableCell>
                  <TableCell>{expense.region}</TableCell>
                  <TableCell>
                    <span className="text-sm">{expense.pinCode} — {expense.areaName}</span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-blue-600">
                      <Eye className="w-3 h-3 mr-1" />
                      {expense.document}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={expense.status === "Approved" ? "secondary" : "default"}>
                      {expense.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}