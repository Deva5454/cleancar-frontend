import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Users,
  MapPin,
  Package,
  Building2,
  CreditCard,
  UserCheck,
  Download,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { WASHER_PERFORMANCE_DATA, getSupervisorPerformance } from "../../data/washerPerformanceData";
import { formatCurrency } from "../../utils/formatters";

const reportTypes = [
  { value: "washer", label: "By Washer", icon: Users },
  { value: "supervisor", label: "By Supervisor", icon: UserCheck },
  { value: "pincode", label: "By PIN Code Zone", icon: MapPin },
  { value: "city", label: "By City", icon: Building2 },
  { value: "subscription", label: "By Subscription", icon: CreditCard },
  { value: "package", label: "By Package", icon: Package },
];

export function CostTrackingReports() {
  const [selectedReport, setSelectedReport] = useState("washer");
  const [period, setPeriod] = useState("This Month");

  const downloadReport = () => {
    toast.success("Report preview opened", {
      description: "Formatted report ready to print",
    });
  };

  const renderWasherReport = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Cost Tracking by Washer
          </CardTitle>
          <Button onClick={downloadReport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Washer Name</TableHead>
              <TableHead>PIN Code(s)</TableHead>
              <TableHead className="text-right">Total Washes</TableHead>
              <TableHead className="text-right">Actual Material Cost</TableHead>
              <TableHead className="text-right">Total Actual Cost</TableHead>
              <TableHead className="text-right">Standard Cost</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead>Top Packages</TableHead>
              <TableHead className="text-right">Avg Duration</TableHead>
              <TableHead className="text-right">Quality Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {WASHER_PERFORMANCE_DATA.map((washer) => (
              <TableRow key={washer.id}>
                <TableCell className="font-medium">{washer.washerName}</TableCell>
                <TableCell>{(washer.pinCodes ?? []).join(", ")}</TableCell>
                <TableCell className="text-right">{washer.totalWashes}</TableCell>
                <TableCell className="text-right">{formatCurrency(washer.actualMaterialCost)}</TableCell>
                <TableCell className="text-right">{formatCurrency(washer.actualCostPerWash)}</TableCell>
                <TableCell className="text-right">{formatCurrency(washer.standardCostPerWash)}</TableCell>
                <TableCell className="text-right">
                  <span className={`${washer.variancePerWash > 0 ? 'text-red-600' : 'text-green-600'} font-semibold flex items-center justify-end gap-1`}>
                    {washer.variancePerWash > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {washer.variancePerWash > 0 ? '+' : ''}{formatCurrency(Math.abs(washer.variancePerWash))}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {washer.topPackages.map((pkg) => (
                      <Badge key={pkg} variant="outline" className="text-xs">{pkg}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-right">{washer.avgDurationMinutes} min</TableCell>
                <TableCell className="text-right">
                  <Badge className="bg-green-100 text-green-800">{(washer?.qualityScore ?? 0).toFixed(1)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-gray-700">
          <strong>Note:</strong> Variance shows difference between actual and standard cost. Red = higher cost (review material usage), Green = cost efficient.
        </div>
      </CardContent>
    </Card>
  );

  const renderPackageReport = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-600" />
            Cost Tracking by Package
          </CardTitle>
          <Button onClick={downloadReport} size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Package Name</TableHead>
              <TableHead className="text-right">Active Subscriptions</TableHead>
              <TableHead className="text-right">Total Washes</TableHead>
              <TableHead className="text-right">Actual Cost/Wash</TableHead>
              <TableHead className="text-right">Standard Cost/Wash</TableHead>
              <TableHead className="text-right">Variance</TableHead>
              <TableHead className="text-right">Avg Customer Price</TableHead>
              <TableHead className="text-right">Avg EBITDA %</TableHead>
              <TableHead>Margin Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-bold">Basic</TableCell>
              <TableCell className="text-right">89</TableCell>
              <TableCell className="text-right">2,314</TableCell>
              <TableCell className="text-right">₹76.25</TableCell>
              <TableCell className="text-right">₹74.25</TableCell>
              <TableCell className="text-right text-red-600">+₹2.00</TableCell>
              <TableCell className="text-right">₹38.42</TableCell>
              <TableCell className="text-right font-bold text-red-600">49.6%</TableCell>
              <TableCell>
                <Badge className="bg-red-100 text-red-800 border-red-300">Below Target</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">Premium</TableCell>
              <TableCell className="text-right">142</TableCell>
              <TableCell className="text-right">3,692</TableCell>
              <TableCell className="text-right">₹108.76</TableCell>
              <TableCell className="text-right">₹105.00</TableCell>
              <TableCell className="text-right text-red-600">+₹3.76</TableCell>
              <TableCell className="text-right">₹57.65</TableCell>
              <TableCell className="text-right font-bold text-yellow-600">47.0%</TableCell>
              <TableCell>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Below Target</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">Elite</TableCell>
              <TableCell className="text-right">67</TableCell>
              <TableCell className="text-right">1,742</TableCell>
              <TableCell className="text-right">₹168.90</TableCell>
              <TableCell className="text-right">₹166.38</TableCell>
              <TableCell className="text-right text-red-600">+₹2.52</TableCell>
              <TableCell className="text-right">₹96.11</TableCell>
              <TableCell className="text-right font-bold text-green-600">57.3%</TableCell>
              <TableCell>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Near Target</Badge>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-bold">Elite Plus</TableCell>
              <TableCell className="text-right">34</TableCell>
              <TableCell className="text-right">884</TableCell>
              <TableCell className="text-right">₹213.45</TableCell>
              <TableCell className="text-right">₹210.31</TableCell>
              <TableCell className="text-right text-red-600">+₹3.14</TableCell>
              <TableCell className="text-right">₹134.57</TableCell>
              <TableCell className="text-right font-bold text-green-600">63.2%</TableCell>
              <TableCell>
                <Badge className="bg-green-100 text-green-800 border-green-300">Above Target</Badge>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const renderPlaceholderReport = (reportType: string) => {
    const reportTypeData = reportTypes.find((r) => r.value === reportType);
    const IconComponent = reportTypeData?.icon;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {IconComponent && <IconComponent className="w-5 h-5 text-blue-600" />}
            {reportTypeData?.label}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-16 text-center">
          <div className="text-gray-400 mb-4">
            {IconComponent && <IconComponent className="w-16 h-16 mx-auto" />}
          </div>
          <p className="text-gray-600 font-medium mb-2">Report Coming Soon</p>
          <p className="text-sm text-gray-500">
            This report will show detailed cost tracking by {reportTypeData?.label.toLowerCase()}
          </p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Report Type Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="col-span-2">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <type.icon className="w-4 h-4" />
                    {type.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="This Month">This Month</SelectItem>
            <SelectItem value="Last Month">Last Month</SelectItem>
            <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
            <SelectItem value="Last 6 Months">Last 6 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Report Content */}
      {selectedReport === "washer" && renderWasherReport()}
      {selectedReport === "package" && renderPackageReport()}
      {selectedReport === "supervisor" && renderPlaceholderReport("supervisor")}
      {selectedReport === "pincode" && renderPlaceholderReport("pincode")}
      {selectedReport === "city" && renderPlaceholderReport("city")}
      {selectedReport === "subscription" && renderPlaceholderReport("subscription")}
    </div>
  );
}