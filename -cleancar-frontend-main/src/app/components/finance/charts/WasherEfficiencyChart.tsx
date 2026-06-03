/**
 * Chart 5 - Washer Cost Efficiency Ranking
 * Horizontal bar chart showing washer performance vs standard
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";

interface WasherEfficiencyChartProps {
  period: string;
}

export function WasherEfficiencyChart({ period }: WasherEfficiencyChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const washerData = [
    { name: "Ramesh", actual: 96.3, standard: 89.5, variance: 6.8 },
    { name: "Kumar", actual: 93.8, standard: 89.5, variance: 4.3 },
    { name: "Rajesh", actual: 93.1, standard: 89.5, variance: 3.6 },
    { name: "Dinesh", actual: 92.5, standard: 89.5, variance: 3.0 },
    { name: "Prakash", actual: 92.3, standard: 89.5, variance: 2.8 },
    { name: "Mohan", actual: 94.1, standard: 89.5, variance: 4.6 },
    { name: "Vijay", actual: 91.1, standard: 89.5, variance: 1.6 },
    { name: "Anil", actual: 90.1, standard: 89.5, variance: 0.6 },
    { name: "Suresh", actual: 89.3, standard: 89.5, variance: -0.2 },
    { name: "Santosh", actual: 87.5, standard: 89.5, variance: -2.0 },
  ].sort((a, b) => b.variance - a.variance); // Sort by variance descending

  const getBarColor = (variance: number) => {
    return variance > 0 ? "#ef4444" : "#10b981"; // Red if above standard, green if at/below
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
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Chart 5 — Washer Cost Efficiency Ranking
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
            Sorted by variance - washers with highest cost above standard at top
          </p>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={washerData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: "₹ per wash", position: "bottom" }} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <ReferenceLine
                x={89.5}
                stroke="#6b7280"
                strokeDasharray="3 3"
                label={{ value: "Standard", position: "top" }}
              />
              <Bar dataKey="actual" name="Actual Cost" isAnimationActive={false}>
                {washerData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.variance)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>At or Below Standard (Efficient)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Above Standard (Needs Review)</span>
            </div>
          </div>

          {/* Data Table */}
          {showDataTable && (
            <Card className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <h4 className="font-medium text-sm mb-3">Underlying Data</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Washer</TableHead>
                      <TableHead className="text-right">Actual Cost</TableHead>
                      <TableHead className="text-right">Standard</TableHead>
                      <TableHead className="text-right">Variance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {washerData.map((washer, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{washer.name}</TableCell>
                        <TableCell className="text-right">
                          ₹{washer.actual.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{washer.standard.toFixed(2)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-medium ${
                            washer.variance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {washer.variance > 0 ? "+" : ""}₹
                          {washer.variance.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              washer.variance > 0
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {washer.variance > 0 ? "Needs Review" : "Efficient"}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
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
            <DialogTitle>Washer Cost Efficiency Ranking - Data Export</DialogTitle>
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
                <span className="font-medium">Standard Cost:</span> ₹89.50 per wash
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Washer</TableHead>
                  <TableHead className="text-right">Actual Cost</TableHead>
                  <TableHead className="text-right">Standard</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {washerData.map((washer, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{washer.name}</TableCell>
                    <TableCell className="text-right">
                      ₹{washer.actual.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ₹{washer.standard.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {washer.variance > 0 ? "+" : ""}₹
                      {washer.variance.toFixed(2)}
                    </TableCell>
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