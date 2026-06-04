/**
 * Cost Trends Dashboard
 * 6 comprehensive charts tracking cost performance over time
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
import { TrendingUp, Calendar, Table as TableIcon, Download } from "lucide-react";
import { CostPerWashTrendChart } from "./charts/CostPerWashTrendChart";
import { EBITDAMarginChart } from "./charts/EBITDAMarginChart";
import { ZoneCostChart } from "./charts/ZoneCostChart";
import { CostComponentsChart } from "./charts/CostComponentsChart";
import { WasherEfficiencyChart } from "./charts/WasherEfficiencyChart";
import { RevenueVsCostChart } from "./charts/RevenueVsCostChart";

export function TrendsDashboard() {
  const [period, setPeriod] = useState<string>("Last 6 Months");

  const periods = [
    "Last 3 Months",
    "Last 6 Months",
    "Last 12 Months",
    "This Year",
    "Last Year",
  ];

  return (
    <div className="space-y-6">
      {/* Header with Global Period Filter */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Cost Trends Dashboard
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2 whitespace-nowrap">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  Period:
                </Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="w-48">
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
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Comprehensive cost trend analysis across packages, zones, washers, and
            cost components. All charts update automatically based on the selected
            period.
          </p>
        </CardContent>
      </Card>

      {/* Charts Grid - 2×3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 - Company Cost per Wash Trend */}
        <CostPerWashTrendChart period={period} />

        {/* Chart 2 - EBITDA Margin % by Package */}
        <EBITDAMarginChart period={period} />

        {/* Chart 3 - Cost per Wash by PIN Code Zone */}
        <ZoneCostChart period={period} />

        {/* Chart 4 - Cost Components Split Over Time */}
        <CostComponentsChart period={period} />

        {/* Chart 5 - Washer Cost Efficiency Ranking */}
        <WasherEfficiencyChart period={period} />

        {/* Chart 6 - Revenue vs Cost vs EBITDA */}
        <RevenueVsCostChart period={period} />
      </div>
    </div>
  );
}
