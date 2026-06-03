/**
 * Report By City
 * City-wise aggregated cost tracking
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Button } from "../../ui/button";
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
  ChevronDown,
  ChevronRight,
  Download,
  Building,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportPreviewModal } from "../ReportPreviewModal";

interface CityData {
  id: string;
  city: string;
  activeZones: number;
  activeCustomers: number;
  totalWashes: number;
  avgActualCost: number;
  avgStandardCost: number;
  cityVariance: number;
  totalRevenue: number;
  avgEBITDA: number;
  zoneBreakdown: {
    pinCode: string;
    areaName: string;
    washes: number;
    avgCost: number;
    revenue: number;
  }[];
}

interface ReportByCityProps {
  period: string;
}

export function ReportByCity({ period }: ReportByCityProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const cityData: CityData[] = [
    {
      id: "1",
      city: "Surat",
      activeZones: 12,
      activeCustomers: 1854,
      totalWashes: 6842,
      avgActualCost: 91.8,
      avgStandardCost: 89.5,
      cityVariance: 2.3,
      totalRevenue: 4285600,
      avgEBITDA: 61.9,
      zoneBreakdown: [
        { pinCode: "395001", areaName: "Adajan", washes: 892, avgCost: 91.2, revenue: 485600 },
        { pinCode: "395005", areaName: "Althan", washes: 756, avgCost: 89.5, revenue: 412800 },
        { pinCode: "395007", areaName: "Vesu", washes: 1024, avgCost: 92.1, revenue: 558200 },
        { pinCode: "395009", areaName: "Piplod", washes: 654, avgCost: 90.8, revenue: 398200 },
        { pinCode: "395010", areaName: "Athwa", washes: 723, avgCost: 90.3, revenue: 412800 },
      ],
    },
    {
      id: "2",
      city: "Mumbai",
      activeZones: 8,
      activeCustomers: 1245,
      totalWashes: 4523,
      avgActualCost: 95.2,
      avgStandardCost: 89.5,
      cityVariance: 5.7,
      totalRevenue: 3125400,
      avgEBITDA: 59.3,
      zoneBreakdown: [
        { pinCode: "400001", areaName: "Bandra", washes: 1156, avgCost: 98.4, revenue: 695400 },
        { pinCode: "400002", areaName: "Andheri", washes: 988, avgCost: 96.2, revenue: 568800 },
        { pinCode: "400003", areaName: "Thane", washes: 856, avgCost: 94.8, revenue: 598400 },
        { pinCode: "400004", areaName: "Dadar", washes: 768, avgCost: 95.5, revenue: 542100 },
      ],
    },
    {
      id: "3",
      city: "Ahmedabad",
      activeZones: 10,
      activeCustomers: 1568,
      totalWashes: 5234,
      avgActualCost: 92.5,
      avgStandardCost: 89.5,
      cityVariance: 3.0,
      totalRevenue: 3654800,
      avgEBITDA: 60.8,
      zoneBreakdown: [
        { pinCode: "380001", areaName: "Navrangpura", washes: 820, avgCost: 88.6, revenue: 445200 },
        { pinCode: "380015", areaName: "Satellite", washes: 745, avgCost: 87.9, revenue: 402600 },
        { pinCode: "380005", areaName: "Vastrapur", washes: 985, avgCost: 91.5, revenue: 685200 },
        { pinCode: "380009", areaName: "Jahangirpura", washes: 945, avgCost: 90.2, revenue: 658900 },
      ],
    },
  ];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const userRole = "Admin"; // Mock

  return (
    <>
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Report by City
            </div>
            <Button
              onClick={() => setShowPreview(true)}
              variant="outline"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Active Zones</TableHead>
                  <TableHead className="text-right">Active Customers</TableHead>
                  <TableHead className="text-right">Total Washes</TableHead>
                  <TableHead className="text-right">Avg Actual Cost</TableHead>
                  <TableHead className="text-right">Avg Standard Cost</TableHead>
                  <TableHead className="text-right">City Variance</TableHead>
                  {(userRole === "Admin" || userRole === "Super Admin") && (
                    <TableHead className="text-right">Total Revenue</TableHead>
                  )}
                  <TableHead className="text-right">Avg EBITDA %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cityData.map((city) => (
                  <>
                    <TableRow key={city.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(city.id)}
                        >
                          {expandedRows.has(city.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-bold text-indigo-600">
                        {city.city}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {city.activeZones}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {city.activeCustomers}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {city.totalWashes.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        ₹{city.avgActualCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ₹{city.avgStandardCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            city.cityVariance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {city.cityVariance > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {city.cityVariance > 0 ? "+" : ""}₹
                          {city.cityVariance.toFixed(2)}
                        </div>
                      </TableCell>
                      {(userRole === "Admin" || userRole === "Super Admin") && (
                        <TableCell className="text-right font-bold text-green-600">
                          ₹{city.totalRevenue.toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Badge
                          className={
                            city.avgEBITDA >= 60
                              ? "bg-green-100 text-green-800"
                              : city.avgEBITDA >= 55
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {city.avgEBITDA.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Zone Breakdown */}
                    {expandedRows.has(city.id) && (
                      <TableRow>
                        <TableCell
                          colSpan={userRole === "Admin" || userRole === "Super Admin" ? 11 : 10}
                          className="bg-indigo-50"
                        >
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-3">
                              Zone Breakdown for {city.city}
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>PIN Code</TableHead>
                                  <TableHead>Area Name</TableHead>
                                  <TableHead className="text-right">Washes</TableHead>
                                  <TableHead className="text-right">
                                    Avg Cost/Wash
                                  </TableHead>
                                  {(userRole === "Admin" || userRole === "Super Admin") && (
                                    <TableHead className="text-right">Revenue</TableHead>
                                  )}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {city.zoneBreakdown.map((zone, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      {zone.pinCode}
                                    </TableCell>
                                    <TableCell>{zone.areaName}</TableCell>
                                    <TableCell className="text-right">
                                      {zone.washes}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-orange-600">
                                      ₹{zone.avgCost.toFixed(2)}
                                    </TableCell>
                                    {(userRole === "Admin" || userRole === "Super Admin") && (
                                      <TableCell className="text-right font-medium text-green-600">
                                        ₹{zone.revenue.toLocaleString()}
                                      </TableCell>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 mb-1">Total Cities</div>
                <div className="text-xl font-bold text-blue-900">
                  {cityData.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Total Customers</div>
                <div className="text-xl font-bold text-green-900">
                  {cityData.reduce((sum, c) => sum + c.activeCustomers, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">Total Washes</div>
                <div className="text-xl font-bold text-orange-900">
                  {cityData.reduce((sum, c) => sum + c.totalWashes, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            {(userRole === "Admin" || userRole === "Super Admin") && (
              <Card className="border-purple-200 bg-purple-50">
                <CardContent className="p-3">
                  <div className="text-xs text-purple-600 mb-1">Total Revenue</div>
                  <div className="text-xl font-bold text-purple-900">
                    ₹{cityData.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by City"
        period={period}
        filters={{}}
        data={cityData}
        columns={[
          { key: "city", label: "City" },
          { key: "activeZones", label: "Active Zones" },
          { key: "activeCustomers", label: "Active Customers" },
          { key: "totalWashes", label: "Total Washes" },
          { key: "avgActualCost", label: "Avg Actual Cost", format: "currency" },
          { key: "avgEBITDA", label: "Avg EBITDA %" },
        ]}
      />
    </>
  );
}
