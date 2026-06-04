/**
 * Cost Per Wash - Tracking Reports
 * Multi-dimensional cost tracking across 6 dimensions
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { BarChart3, Download, Calendar } from "lucide-react";
import { ReportByWasher } from "./reports/ReportByWasher";
import { ReportBySupervisor } from "./reports/ReportBySupervisor";
import { ReportByPINCode } from "./reports/ReportByPINCode";
import { ReportByCity } from "./reports/ReportByCity";
import { ReportBySubscription } from "./reports/ReportBySubscription";
import { ReportByPackage } from "./reports/ReportByPackage";

type ReportType =
  | "By Washer"
  | "By Supervisor"
  | "By PIN Code Zone"
  | "By City"
  | "By Subscription"
  | "By Package";

export function TrackingReports() {
  const [reportType, setReportType] = useState<ReportType>("By Washer");
  const [period, setPeriod] = useState<string>("This Month");

  const periods = [
    "This Month",
    "Last Month",
    "Last 3 Months",
    "Last 6 Months",
    "Custom Date Range",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Multi-Dimensional Cost Tracking Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Track and analyze cost performance across six dimensions: Washer,
            Supervisor, PIN Code Zone, City, Subscription, and Package.
          </p>

          {/* Standard Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="By Washer">By Washer</SelectItem>
                  <SelectItem value="By Supervisor">By Supervisor</SelectItem>
                  <SelectItem value="By PIN Code Zone">By PIN Code Zone</SelectItem>
                  <SelectItem value="By City">By City</SelectItem>
                  <SelectItem value="By Subscription">By Subscription</SelectItem>
                  <SelectItem value="By Package">By Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                Period
              </Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Report Based on Type */}
      {reportType === "By Washer" && <ReportByWasher period={period} />}
      {reportType === "By Supervisor" && <ReportBySupervisor period={period} />}
      {reportType === "By PIN Code Zone" && <ReportByPINCode period={period} />}
      {reportType === "By City" && <ReportByCity period={period} />}
      {reportType === "By Subscription" && <ReportBySubscription period={period} />}
      {reportType === "By Package" && <ReportByPackage period={period} />}
    </div>
  );
}
