import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { BackButton } from "../ui/back-button";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { DollarSign, Receipt, Lock, TrendingUp, AlertCircle, CheckCircle, FileText, BarChart3, Upload } from "lucide-react";

export function AccountsModule() {
  const [revenueAccessGranted, setRevenueAccessGranted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

  const monthlyExpenseData = [
    { month: "Oct", amount: 450000, id: "exp-oct" },
    { month: "Nov", amount: 520000, id: "exp-nov" },
    { month: "Dec", amount: 480000, id: "exp-dec" },
    { month: "Jan", amount: 610000, id: "exp-jan" },
    { month: "Feb", amount: 580000, id: "exp-feb" },
    { month: "Mar", amount: 650000, id: "exp-mar" }
  ];

  const expenseCategoryData = [
    { name: "Marketing", value: 250000, color: "#3b82f6", id: "cat-marketing" },
    { name: "Operations", value: 180000, color: "#10b981", id: "cat-operations" },
    { name: "Vendor Payments", value: 150000, color: "#f59e0b", id: "cat-vendor" },
    { name: "Miscellaneous", value: 70000, color: "#8b5cf6", id: "cat-misc" }
  ];

  const vendorPaymentData = [
    { vendor: "ABC Supplies", amount: 45000, id: "ven-abc" },
    { vendor: "XYZ Services", amount: 38000, id: "ven-xyz" },
    { vendor: "PQR Solutions", amount: 32000, id: "ven-pqr" },
    { vendor: "LMN Trading", amount: 25000, id: "ven-lmn" },
    { vendor: "Others", amount: 10000, id: "ven-others" }
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Module</h1>
          <p className="text-sm text-gray-500 mt-1">Expense management and financial operations</p>
        </div>
        <div className="flex gap-2">
          <Link to="/accounts/expense-entry">
            <Button size="sm" variant="outline">
              <Receipt className="w-4 h-4 mr-2" />
              Record Expense
            </Button>
          </Link>
          <Link to="/accounts/vendor-payment">
            <Button size="sm">
              <DollarSign className="w-4 h-4 mr-2" />
              Vendor Payment
            </Button>
          </Link>
        </div>
      </div>

      {/* Revenue Access Timer - Only shown when access is granted */}
      {revenueAccessGranted && (
        <Card className="bg-yellow-50 border-yellow-300">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Lock className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Temporary Revenue Access Granted</p>
                  <p className="text-sm text-yellow-700">Historical revenue data is now visible</p>
                </div>
              </div>
              <Badge variant="destructive" className="text-lg px-4 py-2">
                {formatTime(timeRemaining)} remaining
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <DollarSign className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-2xl font-bold">₹6.5L</p>
              <p className="text-xs text-gray-500">This Month</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Vendor Payments</p>
                <AlertCircle className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-2xl font-bold">₹1.5L</p>
              <p className="text-xs text-orange-600">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">GST Payable</p>
                <FileText className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold">₹78K</p>
              <p className="text-xs text-gray-500">Due: Mar 20</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">GST Input Credit</p>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">₹42K</p>
              <p className="text-xs text-green-600">Available</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Marketing Expense</p>
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">₹2.5L</p>
              <p className="text-xs text-gray-500">Inc. discounts</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Pending Approvals</p>
                <AlertCircle className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-purple-600">Payments</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expenses">Expense Analytics</TabsTrigger>
          <TabsTrigger value="gst">GST Module</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Expense Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Expense Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300} key="expense-trend-chart">
                  <AreaChart data={monthlyExpenseData} key="areachart-expense-trend">
                    <CartesianGrid strokeDasharray="3 3" key="grid-expense-trend" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} key="xaxis-expense-trend" />
                    <YAxis key="yaxis-expense-trend" />
                    <Tooltip key="tooltip-expense-trend" />
                    <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} key="area-amount" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Expense by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Expense by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300} key="expense-category-chart">
                  <RPieChart key="piechart-expense-category">
                    <Pie
                      key="pie-expense-category"
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {expenseCategoryData.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip key="tooltip-expense-category" />
                  </RPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Payment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vendor Payment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} key="vendor-payment-chart">
                <BarChart data={vendorPaymentData} key="barchart-vendor-payment">
                  <CartesianGrid strokeDasharray="3 3" key="grid-vendor-payment" />
                  <XAxis dataKey="vendor" tick={{ fontSize: 11 }} key="xaxis-vendor-payment" />
                  <YAxis key="yaxis-vendor-payment" />
                  <Tooltip key="tooltip-vendor-payment" />
                  <Bar dataKey="amount" fill="#10b981" key="bar-vendor-amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Link to="/accounts/expense-entry">
                  <Button variant="outline" className="w-full">
                    <Receipt className="w-4 h-4 mr-2" />
                    Record Expense
                  </Button>
                </Link>
                <Link to="/accounts/expense-entry">
                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Receipt
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setRevenueAccessGranted(true);
                    setTimeRemaining(300);
                    // Start countdown timer
                    const interval = setInterval(() => {
                      setTimeRemaining(prev => {
                        if (prev <= 1) {
                          clearInterval(interval);
                          setRevenueAccessGranted(false);
                          return 0;
                        }
                        return prev - 1;
                      });
                    }, 1000);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Request Revenue Access
                </Button>
                <Link to="/accounts/vendor-payment">
                  <Button variant="outline" className="w-full">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Vendor Payment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Expense Analytics</CardTitle>
                <Link to="/accounts/expense-analytics">
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Detailed Analytics
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">Access comprehensive expense analytics with filters, charts, and export options.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gst" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">GST Management</CardTitle>
                <Link to="/accounts/gst-dashboard">
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Open GST Module
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div className="p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">GST Payable</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">₹78,000</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Input Credit</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">₹42,000</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600">Net Liability</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">₹36,000</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Vendor Payment Processing</CardTitle>
                <Link to="/accounts/vendor-payment">
                  <Button size="sm">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Process Payment
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">All payment disbursements require Super Admin approval before execution.</p>
              <Badge variant="destructive">8 Payments Pending Approval</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}