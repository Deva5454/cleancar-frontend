/**
 * BTLActivityVisibilityPanel.tsx
 *
 * Real-data BTL location/lead visibility, shared across City Manager and
 * Super Admin. Reuses the same real, live functions already built and
 * confirmed working for Sales Head's dashboard (salesManagerService's
 * getLocationsWithLiveMetrics() and generateLocationAlerts()), rather than
 * building a third, separate copy of the same aggregation logic.
 *
 * Unlike Sales Head's own dashboard (which is scoped to their own reports),
 * this panel shows all real BTL locations city-wide/company-wide - no
 * per-SM or per-supervisor filtering, since City Manager and Super Admin
 * are meant to see the complete picture.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import { salesManagerService, type SMLocation, type SMAlert } from "../../services/salesManagerService";

export function BTLActivityVisibilityPanel() {
  const [locations, setLocations] = useState<SMLocation[]>([]);
  const [alerts, setAlerts] = useState<SMAlert[]>([]);

  useEffect(() => {
    salesManagerService.generateLocationAlerts();
    setLocations(salesManagerService.getLocationsWithLiveMetrics());
    setAlerts(salesManagerService.getAlerts().filter(a => a.actionRequired));
  }, []);

  const activeLocations = locations.filter(l => l.status === "Active" || l.status === "Active Prospect");
  const totalLeadsMTD = activeLocations.reduce((sum, l) => sum + l.leadsMTD, 0);
  const totalConversionsMTD = activeLocations.reduce((sum, l) => sum + l.conversionsMTD, 0);
  const avgConversionRate = activeLocations.length > 0
    ? Math.round(activeLocations.reduce((sum, l) => sum + l.conversionRatePct, 0) / activeLocations.length)
    : 0;
  const atRiskCount = locations.filter(l => l.status === "At Risk").length;
  const inactiveCount = locations.filter(l => l.status === "Inactive").length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">BTL Activity — Complete Visibility</h2>
        <p className="text-sm text-gray-500 mt-1">
          Real, live data across every BTL location — from Sales Manager proposal through field execution.
        </p>
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-gray-900">{activeLocations.length}</div>
            <div className="text-xs text-gray-500 mt-1">Active Locations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-gray-900">{totalLeadsMTD}</div>
            <div className="text-xs text-gray-500 mt-1">Leads This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-gray-900">{totalConversionsMTD}</div>
            <div className="text-xs text-gray-500 mt-1">Conversions This Month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-gray-900">{avgConversionRate}%</div>
            <div className="text-xs text-gray-500 mt-1">Avg Conversion Rate</div>
          </CardContent>
        </Card>
        <Card className={atRiskCount + inactiveCount > 0 ? "border-orange-300" : ""}>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold text-orange-600">{atRiskCount + inactiveCount}</div>
            <div className="text-xs text-gray-500 mt-1">At Risk / Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Real alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Location Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 border border-orange-200">
                <Badge variant={alert.severity === "CRITICAL" ? "destructive" : "outline"} className="mt-0.5">
                  {alert.severity}
                </Badge>
                <span className="text-sm text-gray-700">{alert.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full location table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All BTL Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-3">Location</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Leads MTD</th>
                  <th className="py-2 pr-3">Conversions MTD</th>
                  <th className="py-2 pr-3">Conv. Rate</th>
                  <th className="py-2 pr-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc.id} className="border-b last:border-0">
                    <td className="py-2 pr-3 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      {loc.name}
                    </td>
                    <td className="py-2 pr-3 text-gray-500">{loc.type}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={
                        loc.status === "At Risk" || loc.status === "Inactive" ? "destructive" :
                        loc.status === "Active" ? "default" : "outline"
                      }>
                        {loc.status}
                      </Badge>
                    </td>
                    <td className="py-2 pr-3">{loc.leadsMTD}</td>
                    <td className="py-2 pr-3">{loc.conversionsMTD}</td>
                    <td className="py-2 pr-3">{loc.conversionRatePct}%</td>
                    <td className="py-2 pr-3">
                      {loc.leadsMTD >= loc.leadsMTDM1 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                    </td>
                  </tr>
                ))}
                {locations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400">No BTL locations yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
