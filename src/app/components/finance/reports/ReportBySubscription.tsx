/**
 * Report By Subscription
 * Most granular view - individual subscription profitability
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
import { Download, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { ReportPreviewModal } from "../ReportPreviewModal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Label } from "../../ui/label";
import { Slider } from "../../ui/slider";
import { usePlanDefinitions } from "../../../contexts/PlanDefinitionContext";

interface SubscriptionData {
  id: string;
  customerName: string;
  pinCode: string;
  package: string;
  vehicleCategory: string;
  startDate: string;
  monthlyPrice: number;
  washesCompleted: number;
  avgActualCost: number;
  avgStandardCost: number;
  ebitdaPerWash: number;
  ebitdaPercent: number;
  status: "Active" | "Paused" | "Expired";
}

interface ReportBySubscriptionProps {
  period: string;
}

export function ReportBySubscription({ period }: ReportBySubscriptionProps) {
  const { planTypes } = usePlanDefinitions();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>("All");
  const [selectedPINCode, setSelectedPINCode] = useState<string>("All");
  const [ebitdaRange, setEbitdaRange] = useState<number[]>([0, 100]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const allSubscriptions: SubscriptionData[] = [
    {
      id: "SUB-001",
      customerName: "Aravind Kumar",
      pinCode: "560034",
      package: "Premium",
      vehicleCategory: "Hatchback",
      startDate: "2025-10-15",
      monthlyPrice: 2600,
      washesCompleted: 24,
      avgActualCost: 91.2,
      avgStandardCost: 89.5,
      ebitdaPerWash: 17.1,
      ebitdaPercent: 15.8,
      status: "Active",
    },
    {
      id: "SUB-002",
      customerName: "Priya Sharma",
      pinCode: "560038",
      package: "Elite",
      vehicleCategory: "Mid-Size Sedan (>4m)",
      startDate: "2025-09-20",
      monthlyPrice: 4200,
      washesCompleted: 26,
      avgActualCost: 125.3,
      avgStandardCost: 120.0,
      ebitdaPerWash: 36.4,
      ebitdaPercent: 22.5,
      status: "Active",
    },
    {
      id: "SUB-003",
      customerName: "Rajesh Nair",
      pinCode: "560102",
      package: "Basic",
      vehicleCategory: "Compact Sedan (<4m)",
      startDate: "2025-11-01",
      monthlyPrice: 1800,
      washesCompleted: 22,
      avgActualCost: 78.5,
      avgStandardCost: 76.0,
      ebitdaPerWash: 3.3,
      ebitdaPercent: 4.0,
      status: "Active",
    },
    {
      id: "SUB-004",
      customerName: "Sneha Reddy",
      pinCode: "560066",
      package: "Elite Plus",
      vehicleCategory: "Mid/Large SUV",
      startDate: "2025-08-10",
      monthlyPrice: 6800,
      washesCompleted: 25,
      avgActualCost: 198.2,
      avgStandardCost: 190.0,
      ebitdaPerWash: 74.0,
      ebitdaPercent: 27.2,
      status: "Active",
    },
    {
      id: "SUB-005",
      customerName: "Vikram Singh",
      pinCode: "560078",
      package: "Premium",
      vehicleCategory: "Compact SUV (<4m)",
      startDate: "2025-10-25",
      monthlyPrice: 3200,
      washesCompleted: 23,
      avgActualCost: 105.6,
      avgStandardCost: 102.0,
      ebitdaPerWash: 33.5,
      ebitdaPercent: 24.1,
      status: "Active",
    },
    // More mock data to demonstrate pagination
    ...Array.from({ length: 45 }, (_, i) => ({
      id: `SUB-${String(i + 6).padStart(3, "0")}`,
      customerName: `Customer ${i + 6}`,
      pinCode: ["560034", "560038", "560102", "560066", "560078"][i % 5],
      package: ["Basic", "Premium", "Elite", "Interior", "Elite Plus"][i % 5],
      vehicleCategory: "Hatchback",
      startDate: "2025-11-01",
      monthlyPrice: 2000 + i * 100,
      washesCompleted: 20 + (i % 8),
      avgActualCost: 85.0 + i * 2,
      avgStandardCost: 89.5,
      ebitdaPerWash: 10 + i,
      ebitdaPercent: 45 + (i % 30),
      status: ["Active", "Paused", "Expired"][i % 3] as "Active" | "Paused" | "Expired",
    })),
  ];

  const packages = ["All", ...planTypes.filter(plan => !plan.includes("One-Time"))];
  const pinCodes = ["All", "560034", "560038", "560102", "560066", "560078"];

  // Filter and sort subscriptions
  const filteredSubscriptions = allSubscriptions
    .filter((sub) => selectedPackage === "All" || sub.package === selectedPackage)
    .filter((sub) => selectedPINCode === "All" || sub.pinCode === selectedPINCode)
    .filter(
      (sub) =>
        sub.ebitdaPercent >= ebitdaRange[0] && sub.ebitdaPercent <= ebitdaRange[1]
    )
    .sort((a, b) => a.ebitdaPercent - b.ebitdaPercent); // Ascending to surface least profitable first

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <>
      <Card className="border-teal-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Report by Subscription
              <Badge variant="outline">{filteredSubscriptions.length} subscriptions</Badge>
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
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
              <Label className="mb-2 block">
                EBITDA % Range: {ebitdaRange[0]}% - {ebitdaRange[1]}%
              </Label>
              <Slider
                value={ebitdaRange}
                onValueChange={setEbitdaRange}
                min={0}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>PIN Code</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Vehicle Category</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead className="text-right">Monthly Price</TableHead>
                  <TableHead className="text-right">Washes This Month</TableHead>
                  <TableHead className="text-right">Avg Cost (Actual)</TableHead>
                  <TableHead className="text-right">Avg Cost (Standard)</TableHead>
                  <TableHead className="text-right">EBITDA/Wash</TableHead>
                  <TableHead className="text-right">EBITDA %</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{sub.customerName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{sub.pinCode}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-800">
                        {sub.package}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{sub.vehicleCategory}</TableCell>
                    <TableCell className="text-sm">{sub.startDate}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      ₹{sub.monthlyPrice}
                    </TableCell>
                    <TableCell className="text-right">{sub.washesCompleted}</TableCell>
                    <TableCell className="text-right text-orange-600">
                      ₹{sub.avgActualCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      ₹{sub.avgStandardCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium text-teal-600">
                      ₹{sub.ebitdaPerWash.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          sub.ebitdaPercent >= 60
                            ? "bg-green-100 text-green-800"
                            : sub.ebitdaPercent >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {sub.ebitdaPercent.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === "Active"
                            ? "default"
                            : sub.status === "Paused"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} -{" "}
              {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of{" "}
              {filteredSubscriptions.length} subscriptions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="text-xs text-blue-600 mb-1">Filtered Subscriptions</div>
                <div className="text-xl font-bold text-blue-900">
                  {filteredSubscriptions.length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-3">
                <div className="text-xs text-green-600 mb-1">Avg EBITDA %</div>
                <div className="text-xl font-bold text-green-900">
                  {(
                    filteredSubscriptions.reduce(
                      (sum, s) => sum + s.ebitdaPercent,
                      0
                    ) / filteredSubscriptions.length
                  ).toFixed(1)}
                  %
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-3">
                <div className="text-xs text-red-600 mb-1">Below 50% EBITDA</div>
                <div className="text-xl font-bold text-red-900">
                  {filteredSubscriptions.filter((s) => s.ebitdaPercent < 50).length}
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-3">
                <div className="text-xs text-purple-600 mb-1">Above 60% EBITDA</div>
                <div className="text-xl font-bold text-purple-900">
                  {filteredSubscriptions.filter((s) => s.ebitdaPercent >= 60).length}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <ReportPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        reportTitle="Cost Report by Subscription"
        period={period}
        filters={{
          Package: selectedPackage,
          "PIN Code": selectedPINCode,
          "EBITDA Range": `${ebitdaRange[0]}% - ${ebitdaRange[1]}%`,
        }}
        data={filteredSubscriptions}
        columns={[
          { key: "customerName", label: "Customer Name" },
          { key: "pinCode", label: "PIN Code" },
          { key: "package", label: "Package" },
          { key: "monthlyPrice", label: "Monthly Price", format: "currency" },
          { key: "washesCompleted", label: "Washes This Month" },
          { key: "avgActualCost", label: "Avg Actual Cost", format: "currency" },
          { key: "ebitdaPercent", label: "EBITDA %" },
          { key: "status", label: "Status" },
        ]}
      />
    </>
  );
}
