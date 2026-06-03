/**
 * Chart 3 - Cost per Wash by PIN Code Zone
 * Horizontal bar chart sorted by cost descending
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { Table as TableIcon, Download, MapPin } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { toast } from "sonner";

interface ZoneCostChartProps {
  period: string;
}

export function ZoneCostChart({ period }: ZoneCostChartProps) {
  const [showDataTable, setShowDataTable] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const zoneData = [
    { zone: "395001 (Adajan)", cost: 91.2, standard: 89.5 },
    { zone: "395005 (Althan)", cost: 88.4, standard: 89.5 },
    { zone: "395007 (Vesu)", cost: 92.8, standard: 89.5 },
    { zone: "400001 (Bandra)", cost: 97.6, standard: 89.5 },
    { zone: "380001 (Navrangpura)", cost: 87.9, standard: 89.5 },
  ].sort((a, b) => b.cost - a.cost); // Sort by cost descending

  const getBarColor = (cost: number, standard: number) => {
    const variance = ((cost - standard) / standard) * 100;
    if (variance > 10) return "#ef4444"; // Red - above standard + 10%
    if (variance > 0) return "#f59e0b"; // Amber - within 10%
    return "#10b981"; // Green - below standard
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
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Chart 3 — Cost per Wash by PIN Code Zone
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
            Sorted by cost descending - highest cost zones at top
          </p>

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" label={{ value: "₹ per wash", position: "bottom" }} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="zone" width={150} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number) => `₹${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #ccc" }}
              />
              <Bar dataKey="cost" name="Avg Cost per Wash" isAnimationActive={false}>
                {zoneData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.cost, entry.standard)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Above Standard + 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded"></div>
              <span>Within 10%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Below Standard</span>
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
                      <TableHead>Zone</TableHead>
                      <TableHead className="text-right">Avg Cost</TableHead>
                      <TableHead className="text-right">Standard</TableHead>
                      <TableHead className="text-right">Variance %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zoneData.map((zone, idx) => {
                      const variance = ((zone.cost - zone.standard) / zone.standard) * 100;
                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{zone.zone}</TableCell>
                          <TableCell className="text-right">
                            ₹{zone.cost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{zone.standard.toFixed(2)}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              variance > 10
                                ? "text-red-600"
                                : variance > 0
                                ? "text-amber-600"
                                : "text-green-600"
                            }`}
                          >
                            {variance > 0 ? "+" : ""}
                            {variance.toFixed(1)}%
                          </TableCell>
                          <TableCell>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                variance > 10
                                  ? "bg-red-100 text-red-800"
                                  : variance > 0
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {variance > 10
                                ? "Above +10%"
                                : variance > 0
                                ? "Within 10%"
                                : "Below Standard"}
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
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cost per Wash by PIN Code Zone - Data Export</DialogTitle>
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
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Avg Cost</TableHead>
                  <TableHead className="text-right">Standard</TableHead>
                  <TableHead className="text-right">Variance %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zoneData.map((zone, idx) => {
                  const variance = ((zone.cost - zone.standard) / zone.standard) * 100;
                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{zone.zone}</TableCell>
                      <TableCell className="text-right">
                        ₹{zone.cost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{zone.standard.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {variance > 0 ? "+" : ""}
                        {variance.toFixed(1)}%
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