/**
 * Chart 1 - Company Cost per Wash Trend
 * Line chart showing monthly cost per wash by package
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, TrendingUp, AlertCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";
import { PLAN_TYPES } from "../../../data/subscriptionPlans";

interface CostPerWashTrendChartProps {
  period: string;
}

export function CostPerWashTrendChart({ period }: CostPerWashTrendChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Mock data - 6 months of cost per wash by package
  const trendData = [
    {
      id: "oct-2025",
      month: "Oct 2025",
      Basic: 76.5,
      Premium: 89.2,
      Elite: 119.5,
      Interior: 137.8,
      "Elite Plus": 178.5,
    },
    {
      id: "nov-2025",
      month: "Nov 2025",
      Basic: 77.2,
      Premium: 90.1,
      Elite: 120.8,
      Interior: 139.2,
      "Elite Plus": 180.2,
    },
    {
      id: "dec-2025",
      month: "Dec 2025",
      Basic: 76.8,
      Premium: 91.5,
      Elite: 122.3,
      Interior: 140.5,
      "Elite Plus": 182.8,
    },
    {
      id: "jan-2026",
      month: "Jan 2026",
      Basic: 78.1,
      Premium: 92.8,
      Elite: 124.5,
      Interior: 142.1,
      "Elite Plus": 185.5,
    },
    {
      id: "feb-2026",
      month: "Feb 2026",
      Basic: 78.5,
      Premium: 93.5,
      Elite: 125.8,
      Interior: 143.8,
      "Elite Plus": 187.2,
    },
    {
      id: "mar-2026",
      month: "Mar 2026",
      Basic: 78.9,
      Premium: 94.2,
      Elite: 126.5,
      Interior: 144.5,
      "Elite Plus": 188.5,
    },
  ];

  // Check for upward trends (simplified - compare last month to 3 months ago)
  const hasUpwardTrend = (packageName: string) => {
    const data = trendData.map((d) => d[packageName as keyof typeof d] as number);
    const recent = data[data.length - 1];
    const threeMonthsAgo = data[data.length - 4];
    return recent > threeMonthsAgo;
  };

  // Use current plan types (filtered for subscription plans only)
  const packages = PLAN_TYPES.filter(plan => !plan.includes("One-Time"));
  const colors: Record<string, string> = {
    "Water Wash": "#3b82f6",
    "Shampoo Wash": "#8b5cf6",
    "Shampoo+Wax": "#ec4899",
    "Shampoo+Polish": "#f59e0b",
  };

  const handleDownload = () => {
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <>
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Chart 1 — Company Cost per Wash Trend
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDataTable(!showDataTable)}
              >
                <TableIcon className="w-4 h-4 mr-2" />
                {showDataTable ? "Hide" : "View"} Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trend Warnings */}
          {packages.some(hasUpwardTrend) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div className="text-sm">
                    <span className="font-medium text-amber-900">
                      Cost Increase Detected:
                    </span>
                    <span className="text-amber-700 ml-1">
                      {packages.filter(hasUpwardTrend).join(", ")} showing upward
                      trend over the last 3 months
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid key="grid" strokeDasharray="3 3" />
              <XAxis
                key="xaxis"
                dataKey="id"
                tickFormatter={(value) => {
                  const item = trendData.find((d) => d.id === value);
                  return item ? item.month : value;
                }}
              />
              <YAxis
                key="yaxis"
                label={{ value: "₹ per wash", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                key="tooltip"
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
                labelFormatter={(value) => {
                  const item = trendData.find((d) => d.id === value);
                  return item ? item.month : value;
                }}
              />
              <Legend key="legend" />
              {packages.map((pkg) => (
                <Line
                  key={pkg}
                  type="monotone"
                  dataKey={pkg}
                  stroke={colors[pkg as keyof typeof colors]}
                  strokeWidth={2}
                  dot={{ fill: colors[pkg as keyof typeof colors] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>

          {/* Package Badges */}
          <div className="flex flex-wrap gap-2">
            {packages.map((pkg) => (
              <Badge
                key={pkg}
                className={
                  hasUpwardTrend(pkg)
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }
              >
                {pkg}:{" "}
                {hasUpwardTrend(pkg) ? "↗ Increasing" : "→ Stable/Decreasing"}
              </Badge>
            ))}
          </div>

          {/* Data Table */}
          {showDataTable && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3">Underlying Data</h4>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        {packages.map((pkg) => (
                          <TableHead key={pkg} className="text-right">
                            {pkg}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trendData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          {packages.map((pkg) => (
                            <TableCell key={pkg} className="text-right">
                              ₹{row[pkg as keyof typeof row].toFixed(2)}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Company Cost per Wash Trend - Data Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div>
                <span className="font-medium">Period:</span> {period}
              </div>
              <div>
                <span className="font-medium">Generated:</span>{" "}
                {new Date().toLocaleString()}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  {packages.map((pkg) => (
                    <TableHead key={pkg} className="text-right">
                      {pkg}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {trendData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    {packages.map((pkg) => (
                      <TableCell key={pkg} className="text-right">
                        ₹{row[pkg as keyof typeof row].toFixed(2)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
              <Button
                onClick={handlePrint}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Print
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
