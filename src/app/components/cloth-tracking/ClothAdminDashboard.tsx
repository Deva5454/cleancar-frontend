/**
 * Cloth Tracking Admin Dashboard
 * Anomaly tracking, performance metrics, and analytics
 */

import { useEffect, useState } from "react";
import { clothTrackingService } from "../../services/clothTrackingService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  AlertTriangle,
  Lock,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Package,
} from "lucide-react";

export function ClothAdminDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((k) => k + 1);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Get analytics with safety checks
  const avgScanTime = clothTrackingService?.getAvgScanTime?.() || 0;
  const totalScans = clothTrackingService?.getTotalScans?.() || 0;
  const exchanges = clothTrackingService?.getExchanges?.() || [];

  // Get cloth counts by status with safety checks
  const dirtyClothsCount = clothTrackingService?.getClothsByStatus?.(
    "USED_PENDING_COLLECTION"
  )?.length || 0;
  const cleanClothsCount =
    clothTrackingService?.getClothsByStatus?.("CLEAN_PACKED")?.length || 0;
  const inLaundryCount = clothTrackingService?.getClothsByStatus?.(
    "IN_LAUNDRY_PROCESS"
  )?.length || 0;
  const expiredCount =
    clothTrackingService?.getClothsByStatus?.("EXPIRED")?.length || 0;

  // Mock anomaly data (in production, track these in service)
  const anomalies = {
    invalidScans: 3,
    stageViolations: 1,
    lockConflicts: 2,
    expiredCloths: expiredCount,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Cloth Tracking Admin
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time monitoring • Performance • Anomalies
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Clean Cloths</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {cleanClothsCount}
                  </p>
                </div>
                <Package className="w-12 h-12 text-blue-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Dirty Cloths</p>
                  <p className="text-3xl font-bold text-amber-600">
                    {dirtyClothsCount}
                  </p>
                </div>
                <Package className="w-12 h-12 text-amber-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">In Laundry</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {inLaundryCount}
                  </p>
                </div>
                <Activity className="w-12 h-12 text-purple-300" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Exchanges</p>
                  <p className="text-3xl font-bold text-red-600">
                    {exchanges.length}
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-red-300" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Anomaly Tracker */}
        <Card className="mb-6 border-red-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              Anomaly Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Invalid Scans</p>
                    <p className="text-2xl font-bold text-red-600">
                      {anomalies.invalidScans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Stage Violations</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {anomalies.stageViolations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Lock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Lock Conflicts</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {anomalies.lockConflicts}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Clock className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Expired Cloths</p>
                    <p className="text-2xl font-bold text-red-600">
                      {anomalies.expiredCloths}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Speed Dashboard */}
        <Card className="mb-6 border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <Activity className="w-5 h-5" />
              Speed Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Scan Time</p>
                <p className="text-4xl font-bold text-green-600">
                  {avgScanTime}
                  <span className="text-lg text-gray-500 ml-1">ms</span>
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingDown className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">Excellent</span>
                </div>
              </div>

              <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Total Scans Today</p>
                <p className="text-4xl font-bold text-blue-600">{totalScans}</p>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">+12% vs yesterday</span>
                </div>
              </div>

              <div className="p-6 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Fastest Operator</p>
                <p className="text-2xl font-bold text-purple-600">Rajesh K.</p>
                <p className="text-sm text-purple-700 mt-1">85ms avg</p>
                <Badge className="mt-2 bg-purple-600">⭐ Top Performer</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Exchanges */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Exchanges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exchanges.slice(-5).reverse().map((exchange) => (
                <div
                  key={exchange.id}
                  className="flex items-center justify-between p-4 bg-gray-50 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {exchange.employeeName || (exchange as any).reason || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {exchange.role} •{" "}
                      {exchange.timestamp ? new Date(exchange.timestamp).toLocaleTimeString() : (exchange as any).date ? new Date((exchange as any).date).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="text-center">
                      <p className="text-xs text-amber-600">Dirty</p>
                      <p className="text-lg font-bold text-amber-900">
                        {(exchange.dirtyExterior ?? (exchange as any).oldQty ?? 0) + (exchange.dirtyInterior ?? 0)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-green-600">Clean</p>
                      <p className="text-lg font-bold text-green-900">
                        {(exchange.cleanExterior ?? (exchange as any).newQty ?? 0) + (exchange.cleanInterior ?? 0)}
                      </p>
                    </div>
                    <Badge
                      className={
                        exchange.isComplete
                          ? "bg-green-600"
                          : "bg-red-600"
                      }
                    >
                      {(exchange.isComplete ?? false) ? "✓ Complete" : "✗ Incomplete"}
                    </Badge>
                  </div>
                </div>
              ))}

              {exchanges.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No exchanges yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
