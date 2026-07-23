/**
 * KimFleetDashboard.tsx — real, fleet-wide view of every cloth's wash
 * count, sorted by how close each one is to the confirmed 90-wash
 * retirement limit, so retirement can be planned for ahead of time
 * rather than discovered one cloth at a time.
 */

import { useState, useMemo } from "react";
import { clothTrackingService } from "../../services/clothTrackingService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { AlertTriangle, Layers } from "lucide-react";

const COLOR_SWATCH: Record<string, string> = {
  Yellow: "#facc15", Blue: "#3b82f6", Black: "#1f2937", Green: "#22c55e",
};

export function KimFleetDashboard() {
  const [filter, setFilter] = useState<"all" | "critical" | "warning">("all");

  const fleet = useMemo(() => clothTrackingService.getFleetByWashesRemaining(), []);

  const critical = fleet.filter((c) => c.washesRemaining <= 5);
  const warning = fleet.filter((c) => c.washesRemaining > 5 && c.washesRemaining <= 15);
  const healthy = fleet.filter((c) => c.washesRemaining > 15);

  const displayed = filter === "critical" ? critical : filter === "warning" ? warning : fleet;

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" /> Cloth Fleet — Wash Life
        </h1>
        <p className="text-sm text-gray-500">Every real, active cloth's wash count, closest to retirement first</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className={`cursor-pointer ${filter === "critical" ? "ring-2 ring-red-500" : ""}`} onClick={() => setFilter(filter === "critical" ? "all" : "critical")}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500 flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-500" /> 5 washes or fewer left</p>
            <p className="text-2xl font-bold text-red-600">{critical.length}</p>
          </CardContent>
        </Card>
        <Card className={`cursor-pointer ${filter === "warning" ? "ring-2 ring-amber-500" : ""}`} onClick={() => setFilter(filter === "warning" ? "all" : "warning")}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">6–15 washes left</p>
            <p className="text-2xl font-bold text-amber-600">{warning.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Healthy (16+ left)</p>
            <p className="text-2xl font-bold text-green-600">{healthy.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{filter === "all" ? "Full Fleet" : filter === "critical" ? "Critical — Near Retirement" : "Warning"} ({displayed.length})</CardTitle></CardHeader>
        <CardContent>
          {displayed.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No cloths in this group.</p>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {displayed.map((c) => (
                <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {c.color && <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLOR_SWATCH[c.color] }} />}
                    <div>
                      <p className="font-medium text-gray-900">{c.shortId}</p>
                      <p className="text-xs text-gray-500">{c.currentLocation}{c.currentLocationId ? ` · ${c.currentLocationId}` : ""} · {c.status.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-40">
                    <Progress value={(c.washCount / 90) * 100} className="flex-1 h-2" />
                    <span className="text-xs text-gray-500 whitespace-nowrap">{c.washCount}/90</span>
                    {c.washesRemaining <= 5 && <Badge variant="destructive" className="text-xs">{c.washesRemaining}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KimFleetDashboard;
