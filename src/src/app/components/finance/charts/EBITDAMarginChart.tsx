/**
 * Chart 2 - EBITDA Margin % by Package
 * Grouped bar chart with 60% target line
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, Target } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";
import { PLAN_TYPES } from "../../../data/subscriptionPlans";

interface EBITDAMarginChartProps {
  period: string;
}

export function EBITDAMarginChart({ period }: EBITDAMarginChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const ebitdaData = [
    {
      month: "Oct",
      Basic: 58.2,
      Premium: 61.5,
      Elite: 62.8,
      Interior: 59.5,
      "Elite Plus": 63.2,
    },
    {
      month: "Nov",
      Basic: 58.5,
      Premium: 61.8,
      Elite: 62.5,
      Interior: 59.8,
      "Elite Plus": 63.5,
    },
    {
      month: "Dec",
      Basic: 59.1,
      Premium: 62.2,
      Elite: 63.1,
      Interior: 60.2,
      "Elite Plus": 64.1,
    },
    {
      month: "Jan",
      Basic: 57.8,
      Premium: 61.5,
      Elite: 62.8,
      Interior: 59.2,
      "Elite Plus": 63.8,
    },
    {
      month: "Feb",
      Basic: 58.2,
      Premium: 61.9,
      Elite: 63.2,
      Interior: 59.8,
      "Elite Plus": 64.2,
    },
    {
      month: "Mar",
      Basic: 58.5,
      Premium: 62.1,
      Elite: 63.5,
      Interior: 60.1,
      "Elite Plus": 64.5,
    },
  ];

  // Use current plan types (filtered for subscription plans only)
  const packages = PLAN_TYPES.filter(plan => !plan.includes("One-Time"));

  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, value } = props;
    const barFill = value >= 60 ? "#10b981" : "#ef4444"; // Green if >= 60%, red otherwise
    return <rect x={x} y={y} width={width} height={height} fill={barFill} />;
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
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Chart 2 — EBITDA Margin % by Package
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
          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={ebitdaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis
                label={{ value: "EBITDA %", angle: -90, position: "insideLeft" }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <Legend />
              <ReferenceLine
                y={60}
                stroke="#ef4444"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: "60% Target", position: "right", fill: "#ef4444" }}
              />
              {packages.map((pkg, idx) => (
                <Bar
                  key={pkg}
                  dataKey={pkg}
                  shape={<CustomBar />}
                  name={pkg}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Above 60% Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Below 60% Target</span>
            </div>
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
                      {ebitdaData.map((row, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          {packages.map((pkg) => (
                            <TableCell
                              key={pkg}
                              className={`text-right font-medium ${
                                row[pkg as keyof typeof row] >= 60
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {row[pkg as keyof typeof row].toFixed(1)}%
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
            <DialogTitle>EBITDA Margin % by Package - Data Export</DialogTitle>
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
              <div>
                <span className="font-medium">Target EBITDA:</span> 60%
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
                {ebitdaData.map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{row.month}</TableCell>
                    {packages.map((pkg) => (
                      <TableCell
                        key={pkg}
                        className={`text-right ${
                          row[pkg as keyof typeof row] >= 60
                            ? "text-green-600 font-medium"
                            : "text-red-600 font-medium"
                        }`}
                      >
                        {row[pkg as keyof typeof row].toFixed(1)}%
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
