/**
 * Cost Intelligence Panel
 * Six KPI cards + mini EBITDA chart for Founder Dashboard
 * Last Updated: 2026-03-17
 */
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";
import { useMemo } from "react";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Package, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";

export function CostIntelligencePanel() {
  const navigate = useNavigate();

  const { allJobs } = useJobs();
  const { city } = useCity();

  // Compute zone efficiency dynamically from live job data
  const kpiData = useMemo(() => {
    const cityJobs = allJobs.filter((j: any) => j.cityId === city && j.status === "Completed" && j.pinCode);
    
    // Group by pinCode and calculate average cost
    const zoneCosts: Record<string, { total: number; count: number; areaName: string }> = {};
    cityJobs.forEach((j: any) => {
      const pin = j.pinCode || "unknown";
      const area = j.area || j.zone || pin;
      if (!zoneCosts[pin]) zoneCosts[pin] = { total: 0, count: 0, areaName: area };
      zoneCosts[pin].total += Number(j.actualCost || j.costPerWash || 90);
      zoneCosts[pin].count += 1;
    });

    const zones = Object.entries(zoneCosts)
      .filter(([, v]) => v.count >= 3) // min 3 jobs for reliable average
      .map(([pin, v]) => ({ pinCode: pin, areaName: v.areaName, cost: v.total / v.count }))
      .sort((a, b) => a.cost - b.cost);

    const overallAvgCost = cityJobs.length > 0
      ? cityJobs.reduce((s: number, j: any) => s + Number(j.actualCost || j.costPerWash || 90), 0) / cityJobs.length
      : 91.5;

    return {
      overallAvgCost: Math.round(overallAvgCost * 10) / 10,
      overallAvgEBITDA: 61.2,
      mostProfitable: { package: "Elite Plus", ebitda: 64.5 },
      leastProfitable: { package: "Basic", ebitda: 58.2, belowTarget: true },
      mostEfficient: zones.length > 0
        ? { pinCode: zones[0].pinCode, areaName: zones[0].areaName, cost: Math.round(zones[0].cost * 10) / 10 }
        : { pinCode: "—", areaName: "Insufficient data", cost: 0 },
      leastEfficient: zones.length > 1
        ? {
            pinCode: zones[zones.length - 1].pinCode,
            areaName: zones[zones.length - 1].areaName,
            cost: Math.round(zones[zones.length - 1].cost * 10) / 10,
            significantlyAbove: zones[zones.length - 1].cost > overallAvgCost * 1.05,
          }
        : { pinCode: "—", areaName: "Insufficient data", cost: 0, significantlyAbove: false },
    };
  }, [allJobs, city]);

  // Mini EBITDA chart data
  const ebitdaMiniData = [
    { id: "basic", package: "Basic", ebitda: 58.2, below: 58.2, above: 0 },
    { id: "premium", package: "Premium", ebitda: 61.8, below: 0, above: 61.8 },
    { id: "elite", package: "Elite", ebitda: 62.5, below: 0, above: 62.5 },
    { id: "interior", package: "Interior", ebitda: 59.8, below: 59.8, above: 0 },
    { id: "elite-plus", package: "Elite Plus", ebitda: 64.5, below: 0, above: 64.5 },
  ];

  const handleCardClick = (reportType: string, filters?: any) => {
    // Navigate to Finance → Cost Per Wash with filters
    navigate("/finance/cost-per-wash", { state: { reportType, filters } });
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          Cost Intelligence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* KPI Cards Grid - 2×3 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1 - Overall Avg Cost per Wash */}
          <Card
            className="border-orange-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCardClick("trends")}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    Avg Cost/Wash (This Month)
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{kpiData.overallAvgCost.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Click to view trends
                  </div>
                </div>
                <TrendingUp className="w-5 h-5 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2 - Overall Avg EBITDA % */}
          <Card
            className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleCardClick("trends")}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    Avg EBITDA % (This Month)
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {kpiData.overallAvgEBITDA.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <Badge
                      className={
                        kpiData.overallAvgEBITDA >= 60
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {kpiData.overallAvgEBITDA >= 60 ? "Above Target" : "Near Target"}
                    </Badge>
                  </div>
                </div>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3 - Most Profitable Package */}
          <Card
            className="border-blue-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() =>
              handleCardClick("byPackage", { package: kpiData.mostProfitable.package })
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Most Profitable Package</div>
                  <div className="text-lg font-bold text-blue-600">
                    {kpiData.mostProfitable.package}
                  </div>
                  <div className="text-sm text-green-600 font-medium mt-1">
                    {kpiData.mostProfitable.ebitda.toFixed(1)}% EBITDA
                  </div>
                </div>
                <Package className="w-5 h-5 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 4 - Least Profitable Package */}
          <Card
            className={`${
              kpiData.leastProfitable.belowTarget
                ? "border-red-200 bg-red-50"
                : "border-amber-200"
            } hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() =>
              handleCardClick("byPackage", { package: kpiData.leastProfitable.package })
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">
                    Least Profitable Package
                  </div>
                  <div className="text-lg font-bold text-red-600">
                    {kpiData.leastProfitable.package}
                  </div>
                  <div
                    className={`text-sm font-medium mt-1 ${
                      kpiData.leastProfitable.belowTarget
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {kpiData.leastProfitable.ebitda.toFixed(1)}% EBITDA
                    {kpiData.leastProfitable.belowTarget && " ⚠️"}
                  </div>
                </div>
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 5 - Most Cost-Efficient Zone */}
          <Card
            className="border-green-200 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() =>
              handleCardClick("byZone", { pinCode: kpiData.mostEfficient.pinCode })
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Most Efficient Zone</div>
                  <div className="text-sm font-bold text-green-600">
                    {kpiData.mostEfficient.pinCode} ({kpiData.mostEfficient.areaName})
                  </div>
                  <div className="text-sm text-gray-700 font-medium mt-1">
                    ₹{kpiData.mostEfficient.cost.toFixed(2)}/wash
                  </div>
                </div>
                <MapPin className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Card 6 - Least Cost-Efficient Zone */}
          <Card
            className={`${
              kpiData.leastEfficient.significantlyAbove
                ? "border-red-200 bg-red-50"
                : "border-amber-200"
            } hover:shadow-lg transition-shadow cursor-pointer`}
            onClick={() =>
              handleCardClick("byZone", { pinCode: kpiData.leastEfficient.pinCode })
            }
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs text-gray-600 mb-1">Least Efficient Zone</div>
                  <div className="text-sm font-bold text-red-600">
                    {kpiData.leastEfficient.pinCode} ({kpiData.leastEfficient.areaName})
                  </div>
                  <div className="text-sm text-gray-700 font-medium mt-1">
                    ₹{kpiData.leastEfficient.cost.toFixed(2)}/wash
                    {kpiData.leastEfficient.significantlyAbove && " ⚠️"}
                  </div>
                </div>
                <MapPin className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mini EBITDA Chart - Custom HTML/CSS Version */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            EBITDA Margin % by Package
          </h4>
          
          {/* Custom Bar Chart */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-end justify-between gap-4 h-48">
              {ebitdaMiniData.map((item) => (
                <div key={item.id} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bar */}
                  <div className="w-full flex flex-col justify-end h-40 relative">
                    <div
                      className={`w-full ${
                        item.ebitda >= 60 ? "bg-green-500" : "bg-red-500"
                      } rounded-t transition-all hover:opacity-80`}
                      style={{ height: `${item.ebitda}%` }}
                    >
                      {/* Value label */}
                      <div className="absolute -top-6 left-0 right-0 text-center text-xs font-medium text-gray-700">
                        {item.ebitda.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="text-xs text-center text-gray-600 font-medium w-full truncate">
                    {item.package}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-600">Above 60% (Target)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-600">Below 60%</span>
              </div>
            </div>
          </div>

          {/* View Full Analysis Link */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate("/finance/cost-per-wash", { state: { tab: "trends" } })}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              View Full Cost Analysis →
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}