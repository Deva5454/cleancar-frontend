/**
 * Report By PIN Code Zone
 * Zone-wise cost and performance tracking
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
  MapPin,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { ReportPreviewModal } from "../ReportPreviewModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Label } from "../../ui/label";

interface PINCodeData {
  id: string;
  pinCode: string;
  areaName: string;
  city: string;
  activeCustomers: number;
  totalWashes: number;
  avgActualCost: number;
  avgStandardCost: number;
  zoneVariance: number;
  totalRevenue: number;
  avgEBITDA: number;
  complaintsRate: number;
  washerCount: number;
  supervisor: string;
  packageBreakdown: {
    package: string;
    washes: number;
    avgCost: number;
  }[];
}

interface ReportByPINCodeProps {
  period: string;
}

export function ReportByPINCode({ period }: ReportByPINCodeProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("All");

  const pinCodeData: PINCodeData[] = [
    {
      id: "1",
      pinCode: "395001",
      areaName: "Adajan",
      city: "Surat",
      activeCustomers: 248,
      totalWashes: 892,
      avgActualCost: 91.2,
      avgStandardCost: 89.5,
      zoneVariance: 1.7,
      totalRevenue: 485600,
      avgEBITDA: 62.5,
      complaintsRate: 1.2,
      washerCount: 4,
      supervisor: "Rajesh Patel",
      packageBreakdown: [
        { package: "Premium", washes: 385, avgCost: 90.5 },
        { package: "Elite", washes: 268, avgCost: 92.8 },
        { package: "Basic", washes: 239, avgCost: 89.2 },
      ],
    },
    {
      id: "2",
      pinCode: "395005",
      areaName: "Althan",
      city: "Surat",
      activeCustomers: 212,
      totalWashes: 756,
      avgActualCost: 89.5,
      avgStandardCost: 89.5,
      zoneVariance: 0.0,
      totalRevenue: 412800,
      avgEBITDA: 63.1,
      complaintsRate: 1.0,
      washerCount: 3,
      supervisor: "Rajesh Patel",
      packageBreakdown: [
        { package: "Premium", washes: 340, avgCost: 88.9 },
        { package: "Basic", washes: 280, avgCost: 87.5 },
        { package: "Elite", washes: 136, avgCost: 92.1 },
      ],
    },
    {
      id: "3",
      pinCode: "395007",
      areaName: "Vesu",
      city: "Surat",
      activeCustomers: 295,
      totalWashes: 1024,
      avgActualCost: 92.1,
      avgStandardCost: 89.5,
      zoneVariance: 2.6,
      totalRevenue: 558200,
      avgEBITDA: 62.2,
      complaintsRate: 1.3,
      washerCount: 4,
      supervisor: "Amit Shah",
      packageBreakdown: [
        { package: "Elite", washes: 445, avgCost: 93.2 },
        { package: "Premium", washes: 398, avgCost: 91.5 },
        { package: "Elite Plus", washes: 181, avgCost: 94.8 },
      ],
    },
    {
      id: "4",
      pinCode: "400001",
      areaName: "Bandra",
      city: "Mumbai",
      activeCustomers: 312,
      totalWashes: 1156,
      avgActualCost: 98.4,
      avgStandardCost: 89.5,
      zoneVariance: 8.9,
      totalRevenue: 695400,
      avgEBITDA: 59.5,
      complaintsRate: 1.8,
      washerCount: 5,
      supervisor: "Sanjay Mehta",
      packageBreakdown: [
        { package: "Elite Plus", washes: 485, avgCost: 99.8 },
        { package: "Elite", washes: 425, avgCost: 97.6 },
        { package: "Premium", washes: 246, avgCost: 95.2 },
      ],
    },
    {
      id: "5",
      pinCode: "400002",
      areaName: "Andheri",
      city: "Mumbai",
      activeCustomers: 268,
      totalWashes: 988,
      avgActualCost: 96.2,
      avgStandardCost: 89.5,
      zoneVariance: 6.7,
      totalRevenue: 568800,
      avgEBITDA: 60.2,
      complaintsRate: 1.5,
      washerCount: 4,
      supervisor: "Sanjay Mehta",
      packageBreakdown: [
        { package: "Elite", washes: 420, avgCost: 96.8 },
        { package: "Premium", washes: 368, avgCost: 95.1 },
        { package: "Basic", washes: 200, avgCost: 92.5 },
      ],
    },
    {
      id: "6",
      pinCode: "380001",
      areaName: "Navrangpura",
      city: "Ahmedabad",
      activeCustomers: 228,
      totalWashes: 820,
      avgActualCost: 88.6,
      avgStandardCost: 89.5,
      zoneVariance: -0.9,
      totalRevenue: 445200,
      avgEBITDA: 63.8,
      complaintsRate: 0.9,
      washerCount: 3,
      supervisor: "Kiran Desai",
      packageBreakdown: [
        { package: "Premium", washes: 385, avgCost: 88.2 },
        { package: "Basic", washes: 298, avgCost: 86.9 },
        { package: "Elite", washes: 137, avgCost: 91.8 },
      ],
    },
    {
      id: "7",
      pinCode: "380015",
      areaName: "Satellite",
      city: "Ahmedabad",
      activeCustomers: 205,
      totalWashes: 745,
      avgActualCost: 87.9,
      avgStandardCost: 89.5,
      zoneVariance: -1.6,
      totalRevenue: 402600,
      avgEBITDA: 64.2,
      complaintsRate: 0.8,
      washerCount: 3,
      supervisor: "Kiran Desai",
      packageBreakdown: [
        { package: "Premium", washes: 368, avgCost: 87.5 },
        { package: "Basic", washes: 285, avgCost: 86.2 },
        { package: "Elite", washes: 92, avgCost: 91.2 },
      ],
    },
  ];

  const cities = ["All", "Surat", "Mumbai", "Ahmedabad"];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const userRole = "Admin"; // Mock - would come from auth context

  return (
    <>
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              Report by PIN Code Zone
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
          {/* City Filter */}
          <div className="w-64">
            <Label className="mb-2 block">City</Label>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>PIN Code</TableHead>
                  <TableHead>Area Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead className="text-right">Active Customers</TableHead>
                  <TableHead className="text-right">Total Washes</TableHead>
                  <TableHead className="text-right">Avg Actual Cost</TableHead>
                  <TableHead className="text-right">Avg Standard Cost</TableHead>
                  <TableHead className="text-right">Zone Variance</TableHead>
                  {(userRole === "Admin" || userRole === "Super Admin") && (
                    <TableHead className="text-right">Total Revenue</TableHead>
                  )}
                  <TableHead className="text-right">Avg EBITDA %</TableHead>
                  <TableHead className="text-right">Complaints Rate</TableHead>
                  <TableHead className="text-right">Washers</TableHead>
                  <TableHead>Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pinCodeData.map((zone) => (
                  <>
                    <TableRow key={zone.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(zone.id)}
                        >
                          {expandedRows.has(zone.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-bold text-orange-600">
                        {zone.pinCode}
                      </TableCell>
                      <TableCell className="font-medium">{zone.areaName}</TableCell>
                      <TableCell>{zone.city}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {zone.activeCustomers}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {zone.totalWashes}
                      </TableCell>
                      <TableCell className="text-right font-medium text-orange-600">
                        ₹{zone.avgActualCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ₹{zone.avgStandardCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            zone.zoneVariance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {zone.zoneVariance > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {zone.zoneVariance > 0 ? "+" : ""}₹
                          {zone.zoneVariance.toFixed(2)}
                        </div>
                      </TableCell>
                      {(userRole === "Admin" || userRole === "Super Admin") && (
                        <TableCell className="text-right font-bold text-green-600">
                          ₹{zone.totalRevenue.toLocaleString()}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Badge
                          className={
                            zone.avgEBITDA >= 60
                              ? "bg-green-100 text-green-800"
                              : zone.avgEBITDA >= 55
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {zone.avgEBITDA.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            zone.complaintsRate < 1.5
                              ? "bg-green-100 text-green-800"
                              : zone.complaintsRate < 2.5
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {zone.complaintsRate.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {zone.washerCount}
                      </TableCell>
                      <TableCell className="text-sm">{zone.supervisor}</TableCell>
                    </TableRow>

                    {/* Expanded Package Breakdown */}
                    {expandedRows.has(zone.id) && (
                      <TableRow>
                        <TableCell
                          colSpan={userRole === "Admin" || userRole === "Super Admin" ? 15 : 14}
                          className="bg-orange-50"
                        >
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-3">
                              Package Breakdown for {zone.areaName} ({zone.pinCode})
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Package</TableHead>
                                  <TableHead className="text-right">Washes</TableHead>
                                  <TableHead className="text-right">
                                    Avg Cost/Wash
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {zone.packageBreakdown.map((pkg, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell className="font-medium">
                                      {pkg.package}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {pkg.washes}
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-orange-600">
                                      ₹{pkg.avgCost.toFixed(2)}
                                    </TableCell>
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
                <div className="text-xs text-blue-600 mb-1">Total Zones</div>
                <div className="text-xl font-bold text-blue-900">
                  {pinCodeData.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Total Customers</div>
                <div className="text-xl font-bold text-green-900">
                  {pinCodeData.reduce((sum, z) => sum + z.activeCustomers, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">Total Washes</div>
                <div className="text-xl font-bold text-orange-900">
                  {pinCodeData.reduce((sum, z) => sum + z.totalWashes, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <div className="text-xs text-purple-600 mb-1">Avg EBITDA</div>
                <div className="text-xl font-bold text-purple-900">
                  {(
                    pinCodeData.reduce((sum, z) => sum + z.avgEBITDA, 0) /
                    pinCodeData.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by PIN Code Zone"
        period={period}
        filters={{ City: selectedCity }}
        data={pinCodeData}
        columns={[
          { key: "pinCode", label: "PIN Code" },
          { key: "areaName", label: "Area Name" },
          { key: "city", label: "City" },
          { key: "activeCustomers", label: "Active Customers" },
          { key: "totalWashes", label: "Total Washes" },
          { key: "avgActualCost", label: "Avg Actual Cost", format: "currency" },
          { key: "avgEBITDA", label: "Avg EBITDA %" },
        ]}
      />
    </>
  );
}
