/**
 * Chart 6 - Revenue vs Cost vs EBITDA
 * Combo chart - executive summary
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Label } from "../../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, DollarSign } from "lucide-react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";

interface RevenueVsCostChartProps {
  period: string;
}

export function RevenueVsCostChart({ period }: RevenueVsCostChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [vehicleCategory, setVehicleCategory] = useState<string>("Hatchback");

  const vehicleCategories = [
    "Hatchback",
    "Compact Sedan (<4m)",
    "Mid-Size Sedan (>4m)",
    "Compact SUV (<4m)",
    "Mid/Large SUV",
  ];

  // Mock data - revenue, cost, and EBITDA by package for selected vehicle category
  const revenueData = [
    {
      package: "Basic",
      revenue: 81.8,
      cost: 76.5,
      ebitda: 58.5,
    },
    {
      package: "Premium",
      revenue: 108.3,
      cost: 89.2,
      ebitda: 61.8,
    },
    {
      package: "Elite",
      revenue: 153.8,
      cost: 119.5,
      ebitda: 62.5,
    },
    {
      package: "Interior",
      revenue: 168.5,
      cost: 137.8,
      ebitda: 59.5,
    },
    {
      package: "Elite Plus",
      revenue: 245.2,
      cost: 178.5,
      ebitda: 63.8,
    },
  ];

  const handleDownload = () => {
    setShowPreview(true);
  };

  const handlePrint = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  return (
    <>
      <Card className="border-pink-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-pink-600" />
              Chart 6 — Revenue vs Cost vs EBITDA
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
          {/* Vehicle Category Filter */}
          <div className="w-64">
            <Label className="mb-2 block">Filter by Vehicle Category</Label>
            <Select value={vehicleCategory} onValueChange={setVehicleCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {vehicleCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-sm text-gray-600">
            Executive summary showing financial performance across all packages for{" "}
            {vehicleCategory}
          </p>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="package" tick={{ fontSize: 11 }} />
              <YAxis
                yAxisId="left"
                label={{ value: "₹ per wash", angle: -90, position: "insideLeft" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{ value: "EBITDA %", angle: 90, position: "insideRight" }}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === "EBITDA %") return `${value.toFixed(1)}%`;
                  return `₹${value.toFixed(2)}`;
                }}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                fill="#10b981"
                name="Revenue/Wash"
              />
              <Bar yAxisId="left" dataKey="cost" fill="#f59e0b" name="Cost/Wash" />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="ebitda"
                stroke="#3b82f6"
                strokeWidth={3}
                name="EBITDA %"
                dot={{ fill: "#3b82f6", r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Avg Revenue/Wash</div>
                <div className="text-lg font-bold text-green-900">
                  ₹
                  {(
                    revenueData.reduce((sum, d) => sum + d.revenue, 0) /
                    revenueData.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">Avg Cost/Wash</div>
                <div className="text-lg font-bold text-orange-900">
                  ₹
                  {(
                    revenueData.reduce((sum, d) => sum + d.cost, 0) /
                    revenueData.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 mb-1">Avg EBITDA %</div>
                <div className="text-lg font-bold text-blue-900">
                  {(
                    revenueData.reduce((sum, d) => sum + d.ebitda, 0) /
                    revenueData.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table */}
          {showDataTable && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3">Underlying Data</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Package</TableHead>
                      <TableHead className="text-right">Revenue/Wash</TableHead>
                      <TableHead className="text-right">Cost/Wash</TableHead>
                      <TableHead className="text-right">Margin/Wash</TableHead>
                      <TableHead className="text-right">EBITDA %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {revenueData.map((row, idx) => {
                      const margin = row.revenue - row.cost;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {row.package}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ₹{row.revenue.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-orange-600 font-medium">
                            ₹{row.cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{margin.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-medium ${
                                row.ebitda >= 60
                                  ? "text-green-600"
                                  : row.ebitda >= 55
                                  ? "text-amber-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row.ebitda.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="w-[95vw] sm:w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revenue vs Cost vs EBITDA - Data Export</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded text-sm">
              <div>
                <span className="font-medium">Period:</span> {period}
              </div>
              <div>
                <span className="font-medium">Vehicle Category:</span>{" "}
                {vehicleCategory}
              </div>
              <div>
                <span className="font-medium">Generated:</span>{" "}
                {new Date().toLocaleString()}
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead className="text-right">Revenue/Wash</TableHead>
                  <TableHead className="text-right">Cost/Wash</TableHead>
                  <TableHead className="text-right">Margin/Wash</TableHead>
                  <TableHead className="text-right">EBITDA %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenueData.map((row, idx) => {
                  const margin = row.revenue - row.cost;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.package}</TableCell>
                      <TableCell className="text-right">
                        ₹{row.revenue.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{row.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{margin.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.ebitda.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  );
                })}
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
