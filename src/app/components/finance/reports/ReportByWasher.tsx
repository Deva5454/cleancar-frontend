/**
 * Report By Washer
 * Individual washer cost performance tracking
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
  User,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { ReportPreviewModal } from "../ReportPreviewModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Label } from "../../ui/label";
import { usePlanDefinitions } from "../../../contexts/PlanDefinitionContext";

interface WasherData {
  id: string;
  name: string;
  assignedPINCodes: string[];
  totalWashes: number;
  actualMaterialCost: number;
  actualConsumableCost: number;
  manpowerCost: number;
  totalActualCost: number;
  standardCost: number;
  variance: number;
  topPackages: string[];
  avgJobDuration: number;
  qualityScore: number;
  packageBreakdown: {
    package: string;
    washes: number;
    costPerWash: number;
    standardCost: number;
  }[];
}

interface ReportByWasherProps {
  period: string;
}

export function ReportByWasher({ period }: ReportByWasherProps) {
  const { planTypes } = usePlanDefinitions();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPINCode, setSelectedPINCode] = useState<string>("All");
  const [selectedPackage, setSelectedPackage] = useState<string>("All");

  // Mock data
  const washerData: WasherData[] = [
    {
      id: "WR-001",
      name: "Rajesh Kumar",
      assignedPINCodes: ["560034", "560038"],
      totalWashes: 245,
      actualMaterialCost: 45.8,
      actualConsumableCost: 12.3,
      manpowerCost: 35.0,
      totalActualCost: 93.1,
      standardCost: 89.5,
      variance: 3.6,
      topPackages: ["Premium", "Elite"],
      avgJobDuration: 28,
      qualityScore: 4.6,
      packageBreakdown: [
        { package: "Premium", washes: 120, costPerWash: 91.2, standardCost: 89.5 },
        { package: "Elite", washes: 85, costPerWash: 95.4, standardCost: 92.0 },
        { package: "Basic", washes: 40, costPerWash: 92.1, standardCost: 88.0 },
      ],
    },
    {
      id: "WR-002",
      name: "Suresh Yadav",
      assignedPINCodes: ["560102"],
      totalWashes: 198,
      actualMaterialCost: 42.5,
      actualConsumableCost: 11.8,
      manpowerCost: 35.0,
      totalActualCost: 89.3,
      standardCost: 89.5,
      variance: -0.2,
      topPackages: ["Basic", "Premium"],
      avgJobDuration: 26,
      qualityScore: 4.8,
      packageBreakdown: [
        { package: "Basic", washes: 95, costPerWash: 87.5, standardCost: 88.0 },
        { package: "Premium", washes: 78, costPerWash: 90.8, standardCost: 89.5 },
        { package: "Elite", washes: 25, costPerWash: 91.2, standardCost: 92.0 },
      ],
    },
    {
      id: "WR-003",
      name: "Ramesh Singh",
      assignedPINCodes: ["560066", "560078"],
      totalWashes: 187,
      actualMaterialCost: 48.2,
      actualConsumableCost: 13.1,
      manpowerCost: 35.0,
      totalActualCost: 96.3,
      standardCost: 89.5,
      variance: 6.8,
      topPackages: ["Elite", "Elite Plus"],
      avgJobDuration: 32,
      qualityScore: 4.3,
      packageBreakdown: [
        { package: "Elite", washes: 90, costPerWash: 97.2, standardCost: 92.0 },
        { package: "Elite Plus", washes: 60, costPerWash: 98.5, standardCost: 95.0 },
        { package: "Premium", washes: 37, costPerWash: 92.1, standardCost: 89.5 },
      ],
    },
    {
      id: "WR-004",
      name: "Vijay Sharma",
      assignedPINCodes: ["560034"],
      totalWashes: 165,
      actualMaterialCost: 44.1,
      actualConsumableCost: 12.0,
      manpowerCost: 35.0,
      totalActualCost: 91.1,
      standardCost: 89.5,
      variance: 1.6,
      topPackages: ["Premium", "Basic"],
      avgJobDuration: 27,
      qualityScore: 4.7,
      packageBreakdown: [
        { package: "Premium", washes: 88, costPerWash: 90.5, standardCost: 89.5 },
        { package: "Basic", washes: 65, costPerWash: 89.2, standardCost: 88.0 },
        { package: "Elite", washes: 12, costPerWash: 93.8, standardCost: 92.0 },
      ],
    },
    {
      id: "WR-005",
      name: "Anil Verma",
      assignedPINCodes: ["560038", "560102"],
      totalWashes: 152,
      actualMaterialCost: 43.2,
      actualConsumableCost: 11.9,
      manpowerCost: 35.0,
      totalActualCost: 90.1,
      standardCost: 89.5,
      variance: 0.6,
      topPackages: ["Premium", "Interior"],
      avgJobDuration: 29,
      qualityScore: 4.5,
      packageBreakdown: [
        { package: "Premium", washes: 75, costPerWash: 89.8, standardCost: 89.5 },
        { package: "Interior", washes: 48, costPerWash: 91.5, standardCost: 90.0 },
        { package: "Basic", washes: 29, costPerWash: 88.7, standardCost: 88.0 },
      ],
    },
  ];

  const pinCodes = ["All", "560034", "560038", "560102", "560066", "560078"];
  const packages = ["All", ...planTypes.filter(plan => !plan.includes("One-Time"))];

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleDownload = () => {
    setShowPreview(true);
  };

  return (
    <>
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Report by Washer
            </div>
            <Button
              onClick={handleDownload}
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
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label className="mb-2 block">PIN Code</Label>
              <Select value={selectedPINCode} onValueChange={setSelectedPINCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pinCodes.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Package</Label>
              <Select value={selectedPackage} onValueChange={setSelectedPackage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg} value={pkg}>
                      {pkg}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Report Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead></TableHead>
                  <TableHead>Washer Name</TableHead>
                  <TableHead>Assigned PIN Codes</TableHead>
                  <TableHead className="text-right">Total Washes</TableHead>
                  <TableHead className="text-right">Material Cost/Wash</TableHead>
                  <TableHead className="text-right">Consumable Cost/Wash</TableHead>
                  <TableHead className="text-right">Manpower Cost/Wash</TableHead>
                  <TableHead className="text-right">Total Actual Cost</TableHead>
                  <TableHead className="text-right">Standard Cost</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead>Top Packages</TableHead>
                  <TableHead className="text-right">Avg Duration (min)</TableHead>
                  <TableHead className="text-right">Quality Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {washerData.map((washer) => (
                  <>
                    <TableRow key={washer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(washer.id)}
                        >
                          {expandedRows.has(washer.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">{washer.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {washer.assignedPINCodes.map((code) => (
                            <Badge
                              key={code}
                              variant="outline"
                              className="text-xs"
                            >
                              {code}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {washer.totalWashes}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        ₹{washer.actualMaterialCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-purple-600">
                        ₹{washer.actualConsumableCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₹{washer.manpowerCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-orange-600">
                        ₹{washer.totalActualCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        ₹{washer.standardCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-medium ${
                            washer.variance > 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {washer.variance > 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {washer.variance > 0 ? "+" : ""}₹
                          {washer.variance.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {washer.topPackages.map((pkg) => (
                            <Badge key={pkg} className="bg-blue-100 text-blue-800">
                              {pkg}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {washer.avgJobDuration}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            washer.qualityScore >= 4.5
                              ? "bg-green-100 text-green-800"
                              : washer.qualityScore >= 4.0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {washer.qualityScore.toFixed(1)} ⭐
                        </Badge>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Package Breakdown */}
                    {expandedRows.has(washer.id) && (
                      <TableRow>
                        <TableCell colSpan={13} className="bg-purple-50">
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-3">
                              Package Cost Breakdown for {washer.name}
                            </h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Package</TableHead>
                                  <TableHead className="text-right">
                                    Washes
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Actual Cost/Wash
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Standard Cost/Wash
                                  </TableHead>
                                  <TableHead className="text-right">
                                    Variance
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {washer.packageBreakdown.map((pkg) => {
                                  const variance = pkg.costPerWash - pkg.standardCost;
                                  return (
                                    <TableRow key={pkg.package}>
                                      <TableCell className="font-medium">
                                        {pkg.package}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {pkg.washes}
                                      </TableCell>
                                      <TableCell className="text-right font-medium text-orange-600">
                                        ₹{pkg.costPerWash.toFixed(2)}
                                      </TableCell>
                                      <TableCell className="text-right text-gray-600">
                                        ₹{pkg.standardCost.toFixed(2)}
                                      </TableCell>
                                      <TableCell
                                        className={`text-right font-medium ${
                                          variance > 0
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }`}
                                      >
                                        {variance > 0 ? "+" : ""}₹
                                        {variance.toFixed(2)}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
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
                <div className="text-xs text-blue-600 mb-1">Total Washers</div>
                <div className="text-xl font-bold text-blue-900">
                  {washerData.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Total Washes</div>
                <div className="text-xl font-bold text-green-900">
                  {washerData.reduce((sum, w) => sum + w.totalWashes, 0)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-3">
                <div className="text-xs text-orange-600 mb-1">
                  Avg Actual Cost
                </div>
                <div className="text-xl font-bold text-orange-900">
                  ₹
                  {(
                    washerData.reduce((sum, w) => sum + w.totalActualCost, 0) /
                    washerData.length
                  ).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <div className="text-xs text-purple-600 mb-1">Avg Quality</div>
                <div className="text-xl font-bold text-purple-900">
                  {(
                    washerData.reduce((sum, w) => sum + w.qualityScore, 0) /
                    washerData.length
                  ).toFixed(1)}{" "}
                  ⭐
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by Washer"
        period={period}
        filters={{
          "PIN Code": selectedPINCode,
          Package: selectedPackage,
        }}
        data={washerData}
        columns={[
          { key: "name", label: "Washer Name" },
          { key: "totalWashes", label: "Total Washes" },
          { key: "totalActualCost", label: "Actual Cost/Wash", format: "currency" },
          { key: "standardCost", label: "Standard Cost/Wash", format: "currency" },
          { key: "variance", label: "Variance", format: "currency" },
          { key: "qualityScore", label: "Quality Score" },
        ]}
      />
    </>
  );
}
