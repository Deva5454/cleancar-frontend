/**
 * Chart 4 - Cost Components Split Over Time
 * Stacked area chart showing cost mix changes
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, Layers } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";

interface CostComponentsChartProps {
  period: string;
}

export function CostComponentsChart({ period }: CostComponentsChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const componentsData = [
    {
      month: "Oct",
      Material: 45.2,
      Consumable: 12.1,
      Manpower: 35.0,
      Overhead: 8.5,
    },
    {
      month: "Nov",
      Material: 46.1,
      Consumable: 12.3,
      Manpower: 35.0,
      Overhead: 8.5,
    },
    {
      month: "Dec",
      Material: 47.5,
      Consumable: 12.5,
      Manpower: 35.0,
      Overhead: 8.5,
    },
    {
      month: "Jan",
      Material: 48.2,
      Consumable: 12.8,
      Manpower: 35.0,
      Overhead: 8.5,
    },
    {
      month: "Feb",
      Material: 49.1,
      Consumable: 13.0,
      Manpower: 35.0,
      Overhead: 8.5,
    },
    {
      month: "Mar",
      Material: 49.8,
      Consumable: 13.2,
      Manpower: 35.0,
      Overhead: 8.5,
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
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-green-600" />
              Chart 4 — Cost Components Split Over Time
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
          <p className="text-sm text-gray-600">
            Stacked view showing how cost composition changes month over month
          </p>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={componentsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis label={{ value: "₹ per wash", angle: -90, position: "insideLeft" }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="Material"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
              />
              <Area
                type="monotone"
                dataKey="Consumable"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
              />
              <Area
                type="monotone"
                dataKey="Manpower"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
              />
              <Area
                type="monotone"
                dataKey="Overhead"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Data Table */}
          {showDataTable && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3">Underlying Data</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Material</TableHead>
                      <TableHead className="text-right">Consumable</TableHead>
                      <TableHead className="text-right">Manpower</TableHead>
                      <TableHead className="text-right">Overhead</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentsData.map((row, idx) => {
                      const total =
                        row.Material + row.Consumable + row.Manpower + row.Overhead;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell className="text-right text-blue-600">
                            ₹{row.Material.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-purple-600">
                            ₹{row.Consumable.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            ₹{row.Manpower.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600">
                            ₹{row.Overhead.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{total.toFixed(2)}
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
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cost Components Split Over Time - Data Export</DialogTitle>
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
                  <TableHead className="text-right">Material</TableHead>
                  <TableHead className="text-right">Consumable</TableHead>
                  <TableHead className="text-right">Manpower</TableHead>
                  <TableHead className="text-right">Overhead</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {componentsData.map((row, idx) => {
                  const total =
                    row.Material + row.Consumable + row.Manpower + row.Overhead;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{row.month}</TableCell>
                      <TableCell className="text-right">
                        ₹{row.Material.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{row.Consumable.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{row.Manpower.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{row.Overhead.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        ₹{total.toFixed(2)}
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
