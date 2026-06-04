/**
 * ============================================================================
 * COST PER WASH ANALYSIS - MAIN DASHBOARD
 * ============================================================================
 *
 * Comprehensive cost tracking and analysis with multiple views:
 * - Company Cost Calculator (uses central engine via CompanyCostCalculator)
 * - Customer Price Calculator
 * - Add-Ons & Combos Analysis
 * - Cost Tracking Reports
 * - Cost Trends Dashboard
 * - Recommendations Engine
 *
 * PHASE 3: Main entry point for cost analysis
 * - All cost calculations use central cost engine
 * - Located at: /finance/cost-per-wash
 * - Replaces duplicate analytics calculator
 *
 * Related Specialized Views:
 * - /analytics/unit-economics/cost-by-plan - Plan comparison
 * - /analytics/unit-economics/cost-by-consumption - Consumption analysis
 * - /analytics/unit-economics/labour-cost - Labour breakdown
 * - /analytics/unit-economics/cost-report - Comprehensive reporting
 *
 * ============================================================================
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Calculator, DollarSign, FileText, TrendingUp, Lightbulb, Edit3, Package, ArrowUpRight, ArrowDownRight, CheckCircle, AlertTriangle, AlertCircle, TrendingDown, Award, Target } from "lucide-react";
import { CompanyCostCalculator } from "./CompanyCostCalculator";
import { CustomerPriceCalculator } from "./CustomerPriceCalculator";
import { CostTrackingReports } from "./CostTrackingReports";
import { CostTrendsDashboard } from "./CostTrendsDashboard";
import { RecommendationsEngine } from "./RecommendationsEngine";
import { AddOnComboAnalysis } from "./AddOnComboAnalysis";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

export function CostPerWashModule() {
  const [activeTab, setActiveTab] = useState("company-cost");
  const [selectedMonth, setSelectedMonth] = useState("April 2026");
  const [packageType, setPackageType] = useState<"4W" | "2W">("4W");
  const [serviceType, setServiceType] = useState<"Subscription" | "One-Time">("Subscription");
  const [varianceLevel, setVarianceLevel] = useState<"Washer" | "Team" | "Supervisor" | "Pincode" | "Cluster">("Washer");

  // Mock data - will be replaced with actual data in future phases
  const actualCostPerWash = 245;
  const standardCostPerWash = 220;
  const variance = actualCostPerWash - standardCostPerWash;
  const variancePercentage = ((variance / standardCostPerWash) * 100);
  const totalVarianceImpact = variance * 1250; // Assuming 1250 washes per month

  // Determine variance state
  const getVarianceState = (variance: number): "efficient" | "moderate" | "high" => {
    if (variance <= 0) return "efficient";
    if (variance <= 20) return "moderate";
    return "high";
  };

  const varianceState = getVarianceState(variance);

  // Get colors based on variance state
  const getVarianceColors = () => {
    switch (varianceState) {
      case "efficient":
        return { bg: "bg-green-50", text: "text-green-600", border: "border-green-500" };
      case "moderate":
        return { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-500" };
      case "high":
        return { bg: "bg-red-50", text: "text-red-600", border: "border-red-500" };
    }
  };

  const varianceColors = getVarianceColors();

  // Service-wise cost data
  interface ServiceCostData {
    id: string;
    serviceType: string;
    totalUnits: number;
    standardCost: number;
    actualCost: number;
    variance: number;
    status: "efficient" | "moderate" | "high";
  }

  const serviceCostData: ServiceCostData[] = [
    {
      id: "service-1",
      serviceType: "Water",
      totalUnits: 1250,
      standardCost: 85,
      actualCost: 92,
      variance: 7,
      status: "moderate",
    },
    {
      id: "service-2",
      serviceType: "Shampoo",
      totalUnits: 1250,
      standardCost: 135,
      actualCost: 148,
      variance: 13,
      status: "moderate",
    },
    {
      id: "service-3",
      serviceType: "Shampoo + Wax",
      totalUnits: 850,
      standardCost: 220,
      actualCost: 245,
      variance: 25,
      status: "high",
    },
  ];

  const getStatusColor = (status: "efficient" | "moderate" | "high") => {
    switch (status) {
      case "efficient":
        return { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle };
      case "moderate":
        return { bg: "bg-yellow-50", text: "text-yellow-600", icon: AlertCircle };
      case "high":
        return { bg: "bg-red-50", text: "text-red-600", icon: AlertTriangle };
    }
  };

  const handleServiceClick = (service: ServiceCostData) => {
    toast.info(`Viewing details for ${service.serviceType}`);
  };

  // Cost breakdown data
  interface CostBreakdownData {
    name: string;
    value: number;
    percentage: number;
    color: string;
  }

  const costBreakdownData: CostBreakdownData[] = [
    { name: "Labour", value: 95, percentage: 38.8, color: "#3b82f6" }, // Blue
    { name: "Consumables", value: 72, percentage: 29.4, color: "#10b981" }, // Green
    { name: "Overhead", value: 45, percentage: 18.4, color: "#f59e0b" }, // Orange
    { name: "Equipment", value: 23, percentage: 9.4, color: "#8b5cf6" }, // Purple
    { name: "Laundry", value: 10, percentage: 4.0, color: "#ec4899" }, // Pink
  ];

  const totalCostBreakdown = costBreakdownData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for cost breakdown
  const CustomCostTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">Amount: ₹{data.value}</p>
          <p className="text-sm text-blue-600">{(data?.percentage ?? 0).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  // Custom label for pie chart
  const renderCustomLabel = (entry: any) => {
    return `${(entry?.percentage ?? 0).toFixed(1)}%`;
  };

  // Variance Analysis data
  interface VarianceAnalysisData {
    id: string;
    level: string;
    name: string;
    totalUnits: number;
    standardCost: number;
    actualCost: number;
    variance: number;
    status: "efficient" | "moderate" | "high";
  }

  const getVarianceDataByLevel = (): VarianceAnalysisData[] => {
    const data: Record<string, VarianceAnalysisData[]> = {
      Washer: [
        { id: "w1", level: "Washer", name: "Ramesh Kumar", totalUnits: 320, standardCost: 220, actualCost: 265, variance: 45, status: "high" },
        { id: "w2", level: "Washer", name: "Suresh Patel", totalUnits: 280, standardCost: 220, actualCost: 258, variance: 38, status: "high" },
        { id: "w3", level: "Washer", name: "Vijay Singh", totalUnits: 250, standardCost: 220, actualCost: 248, variance: 28, status: "high" },
        { id: "w4", level: "Washer", name: "Amit Shah", totalUnits: 220, standardCost: 220, actualCost: 242, variance: 22, status: "high" },
        { id: "w5", level: "Washer", name: "Rakesh Mehta", totalUnits: 180, standardCost: 220, actualCost: 238, variance: 18, status: "moderate" },
        { id: "w6", level: "Washer", name: "Kiran Desai", totalUnits: 160, standardCost: 220, actualCost: 232, variance: 12, status: "moderate" },
        { id: "w7", level: "Washer", name: "Pratik Joshi", totalUnits: 140, standardCost: 220, actualCost: 228, variance: 8, status: "moderate" },
        { id: "w8", level: "Washer", name: "Nilesh Rao", totalUnits: 120, standardCost: 220, actualCost: 218, variance: -2, status: "efficient" },
      ],
      Team: [
        { id: "t1", level: "Team", name: "Team Alpha", totalUnits: 580, standardCost: 220, actualCost: 262, variance: 42, status: "high" },
        { id: "t2", level: "Team", name: "Team Beta", totalUnits: 520, standardCost: 220, actualCost: 252, variance: 32, status: "high" },
        { id: "t3", level: "Team", name: "Team Gamma", totalUnits: 480, standardCost: 220, actualCost: 245, variance: 25, status: "high" },
        { id: "t4", level: "Team", name: "Team Delta", totalUnits: 420, standardCost: 220, actualCost: 238, variance: 18, status: "moderate" },
        { id: "t5", level: "Team", name: "Team Epsilon", totalUnits: 380, standardCost: 220, actualCost: 232, variance: 12, status: "moderate" },
      ],
      Supervisor: [
        { id: "s1", level: "Supervisor", name: "Priya Sharma", totalUnits: 680, standardCost: 220, actualCost: 268, variance: 48, status: "high" },
        { id: "s2", level: "Supervisor", name: "Rajesh Gupta", totalUnits: 620, standardCost: 220, actualCost: 258, variance: 38, status: "high" },
        { id: "s3", level: "Supervisor", name: "Anita Verma", totalUnits: 580, standardCost: 220, actualCost: 248, variance: 28, status: "high" },
        { id: "s4", level: "Supervisor", name: "Manish Kapoor", totalUnits: 520, standardCost: 220, actualCost: 242, variance: 22, status: "high" },
        { id: "s5", level: "Supervisor", name: "Sunita Nair", totalUnits: 480, standardCost: 220, actualCost: 235, variance: 15, status: "moderate" },
      ],
      Pincode: [
        { id: "p1", level: "Pincode", name: "395005", totalUnits: 820, standardCost: 220, actualCost: 272, variance: 52, status: "high" },
        { id: "p2", level: "Pincode", name: "395006", totalUnits: 720, standardCost: 220, actualCost: 262, variance: 42, status: "high" },
        { id: "p3", level: "Pincode", name: "380001", totalUnits: 680, standardCost: 220, actualCost: 252, variance: 32, status: "high" },
        { id: "p4", level: "Pincode", name: "390001", totalUnits: 620, standardCost: 220, actualCost: 245, variance: 25, status: "high" },
        { id: "p5", level: "Pincode", name: "395007", totalUnits: 580, standardCost: 220, actualCost: 238, variance: 18, status: "moderate" },
      ],
      Cluster: [
        { id: "c1", level: "Cluster", name: "Surat North", totalUnits: 1250, standardCost: 220, actualCost: 268, variance: 48, status: "high" },
        { id: "c2", level: "Cluster", name: "Surat South", totalUnits: 1120, standardCost: 220, actualCost: 258, variance: 38, status: "high" },
        { id: "c3", level: "Cluster", name: "Ahmedabad West", totalUnits: 980, standardCost: 220, actualCost: 248, variance: 28, status: "high" },
        { id: "c4", level: "Cluster", name: "Mumbai Central", totalUnits: 850, standardCost: 220, actualCost: 242, variance: 22, status: "high" },
        { id: "c5", level: "Cluster", name: "Ahmedabad East", totalUnits: 720, standardCost: 220, actualCost: 235, variance: 15, status: "moderate" },
      ],
    };

    return data[varianceLevel].sort((a, b) => b.variance - a.variance);
  };

  const varianceAnalysisData = getVarianceDataByLevel();

  const handleVarianceRowClick = (row: VarianceAnalysisData) => {
    toast.info(`Viewing variance details for ${row.name}`);
  };

  // Cost Insights data
  interface CostInsight {
    id: string;
    icon: any;
    type: "alert" | "success" | "warning" | "info";
    title: string;
    metric: string;
    description: string;
  }

  const costInsights: CostInsight[] = [
    {
      id: "insight-1",
      icon: TrendingUp,
      type: "alert",
      title: "Consumables Cost Spike",
      metric: "+18%",
      description: "Consumables cost increased by 18% in last 7 days",
    },
    {
      id: "insight-2",
      icon: Award,
      type: "success",
      title: "Best Performer",
      metric: "-6%",
      description: "Team Alpha is most efficient with -6% variance",
    },
    {
      id: "insight-3",
      icon: AlertTriangle,
      type: "warning",
      title: "High Cost Leakage",
      metric: "₹25",
      description: "Shampoo + Wax service has highest cost variance of ₹25",
    },
    {
      id: "insight-4",
      icon: Target,
      type: "info",
      title: "Optimization Opportunity",
      metric: "₹8,750",
      description: "Potential savings of ₹8,750/month by reducing labour variance",
    },
    {
      id: "insight-5",
      icon: TrendingDown,
      type: "success",
      title: "Equipment Efficiency",
      metric: "-12%",
      description: "Equipment costs decreased by 12% this month",
    },
  ];

  const getInsightColors = (type: CostInsight["type"]) => {
    switch (type) {
      case "alert":
        return { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", iconBg: "bg-red-100" };
      case "success":
        return { bg: "bg-green-50", border: "border-green-200", text: "text-green-600", iconBg: "bg-green-100" };
      case "warning":
        return { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600", iconBg: "bg-yellow-100" };
      case "info":
        return { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-600", iconBg: "bg-blue-100" };
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/finance" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="w-7 h-7 text-blue-600" />
            Cost Per Wash Analysis
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive cost tracking, profitability analysis, and reporting
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/finance/cost-per-wash/actual-inputs">
            <Button variant="outline" size="sm">
              <Edit3 className="w-4 h-4 mr-2" />
              Actual Cost Inputs
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="April 2026">April 2026</SelectItem>
                <SelectItem value="March 2026">March 2026</SelectItem>
                <SelectItem value="February 2026">February 2026</SelectItem>
                <SelectItem value="January 2026">January 2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center border rounded-lg p-1 bg-gray-50">
            <Button
              variant={packageType === "4W" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPackageType("4W")}
              className="h-8"
            >
              4W
            </Button>
            <Button
              variant={packageType === "2W" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPackageType("2W")}
              className="h-8"
            >
              2W
            </Button>
          </div>

          <div className="flex items-center border rounded-lg p-1 bg-gray-50">
            <Button
              variant={serviceType === "Subscription" ? "default" : "ghost"}
              size="sm"
              onClick={() => setServiceType("Subscription")}
              className="h-8"
            >
              Subscription
            </Button>
            <Button
              variant={serviceType === "One-Time" ? "default" : "ghost"}
              size="sm"
              onClick={() => setServiceType("One-Time")}
              className="h-8"
            >
              One-Time
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {packageType} • {serviceType} • {selectedMonth}
        </div>
      </div>

      {/* Cost Insights */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            Cost Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {costInsights.map((insight) => {
              const colors = getInsightColors(insight.type);
              const IconComponent = insight.icon;
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-lg border ${colors.bg} ${colors.border} transition-all hover:shadow-md cursor-pointer`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${colors.iconBg} flex-shrink-0`}>
                      <IconComponent className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 mb-1">{insight.title}</p>
                      <p className={`text-lg font-bold ${colors.text} mb-1`}>{insight.metric}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{insight.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Actual Cost per Wash */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Actual Cost per Wash</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">₹{actualCostPerWash}</h3>
                <div className="flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">+8.5%</span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Calculator className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Standard Cost per Wash */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Standard Cost per Wash</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">₹{standardCostPerWash}</h3>
                <div className="flex items-center gap-1">
                  <ArrowDownRight className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">-2.3%</span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Variance */}
        <Card className={`border-2 ${varianceColors.border}`}>
          <CardContent className={`p-6 ${varianceColors.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Variance (Actual - Standard)</p>
                <h3 className={`text-3xl font-bold mb-2 ${varianceColors.text}`}>
                  {variance > 0 ? '+' : ''}₹{variance}
                </h3>
                <div className="flex items-center gap-1">
                  {variance > 0 ? (
                    <ArrowUpRight className={`w-4 h-4 ${varianceColors.text}`} />
                  ) : (
                    <ArrowDownRight className={`w-4 h-4 ${varianceColors.text}`} />
                  )}
                  <span className={`text-sm font-medium ${varianceColors.text}`}>
                    {variancePercentage > 0 ? '+' : ''}{variancePercentage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600">
                    {varianceState === "efficient" && "Efficient"}
                    {varianceState === "moderate" && "Moderate"}
                    {varianceState === "high" && "High Cost"}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${varianceColors.bg} border ${varianceColors.border}`}>
                <TrendingUp className={`w-6 h-6 ${varianceColors.text}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Variance Impact (Monthly) */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-500 mb-1">Total Variance Impact (Monthly)</p>
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {totalVarianceImpact > 0 ? '+' : ''}₹{Math.abs(totalVarianceImpact).toLocaleString('en-IN')}
                </h3>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-500">Based on 1,250 washes/month</span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${totalVarianceImpact > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <DollarSign className={`w-6 h-6 ${totalVarianceImpact > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service-wise Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Service-wise Cost Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Type</TableHead>
                <TableHead className="text-right">Total Units</TableHead>
                <TableHead className="text-right">Standard Cost per Wash</TableHead>
                <TableHead className="text-right">Actual Cost per Wash</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Status Indicator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceCostData.map((service) => {
                const statusColors = getStatusColor(service.status);
                const StatusIcon = statusColors.icon;
                return (
                  <TableRow
                    key={service.id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleServiceClick(service)}
                  >
                    <TableCell className="font-medium">{service.serviceType}</TableCell>
                    <TableCell className="text-right">{service.totalUnits.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">₹{service.standardCost}</TableCell>
                    <TableCell className="text-right">₹{service.actualCost}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        service.variance > 0 ? 'text-red-600' :
                        service.variance < 0 ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {service.variance > 0 ? '+' : ''}₹{service.variance}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className={`${statusColors.bg} ${statusColors.text} border-transparent`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {service.status === "efficient" && "Efficient"}
                          {service.status === "moderate" && "Moderate"}
                          {service.status === "high" && "High Cost"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-8">
            {/* Donut Chart */}
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={costBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {costBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomCostTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend with values */}
            <div className="flex flex-col justify-center space-y-4">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Total Cost per Wash</p>
                <h3 className="text-3xl font-bold text-gray-900">₹{totalCostBreakdown}</h3>
              </div>

              <div className="space-y-3">
                {costBreakdownData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="text-sm font-semibold text-gray-900">₹{item.value}</span>
                      <span className="text-sm text-gray-500 w-16 text-right">
                        {(item?.percentage ?? 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Level Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 border-b">
              {(["Washer", "Team", "Supervisor", "Pincode", "Cluster"] as const).map((level) => (
                <Button
                  key={level}
                  variant={varianceLevel === level ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setVarianceLevel(level)}
                  className={`rounded-b-none ${varianceLevel === level ? 'border-b-2 border-blue-600' : ''}`}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Variance Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Total Units</TableHead>
                <TableHead className="text-right">Standard Cost</TableHead>
                <TableHead className="text-right">Actual Cost</TableHead>
                <TableHead className="text-right">Variance</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {varianceAnalysisData.map((row, index) => {
                const statusColors = getStatusColor(row.status);
                const StatusIcon = statusColors.icon;
                const isTopFive = index < 5;

                return (
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${
                      isTopFive ? 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500' : ''
                    }`}
                    onClick={() => handleVarianceRowClick(row)}
                  >
                    <TableCell className="font-medium">{row.level}</TableCell>
                    <TableCell className="font-semibold text-gray-900">{row.name}</TableCell>
                    <TableCell className="text-right">{row.totalUnits.toLocaleString('en-IN')}</TableCell>
                    <TableCell className="text-right">₹{row.standardCost}</TableCell>
                    <TableCell className="text-right">₹{row.actualCost}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-semibold ${
                        row.variance > 0 ? 'text-red-600' :
                        row.variance < 0 ? 'text-green-600' :
                        'text-gray-600'
                      }`}>
                        {row.variance > 0 ? '+' : ''}₹{row.variance}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <Badge variant="outline" className={`${statusColors.bg} ${statusColors.text} border-transparent`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {row.status === "efficient" && "Efficient"}
                          {row.status === "moderate" && "Moderate"}
                          {row.status === "high" && "High Cost"}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Legend for highlighted rows */}
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-red-50 border-l-4 border-l-red-500"></div>
            <span>Top 5 highest variance</span>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="company-cost" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Company Cost
          </TabsTrigger>
          <TabsTrigger value="customer-price" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Customer Price
          </TabsTrigger>
          <TabsTrigger value="addons-combos" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Add-Ons & Combos
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Tracking Reports
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Trends Dashboard
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company-cost">
          <CompanyCostCalculator />
        </TabsContent>

        <TabsContent value="customer-price">
          <CustomerPriceCalculator />
        </TabsContent>

        <TabsContent value="addons-combos">
          <AddOnComboAnalysis />
        </TabsContent>

        <TabsContent value="tracking">
          <CostTrackingReports />
        </TabsContent>

        <TabsContent value="trends">
          <CostTrendsDashboard />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
}