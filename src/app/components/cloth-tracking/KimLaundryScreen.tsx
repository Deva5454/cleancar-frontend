/**
 * KimLaundryScreen.tsx — the real, previously-missing piece of the
 * cloth lifecycle: marking a cloth's wash cycle complete at Kim. This
 * is where the real wash count increments and the confirmed 90-wash
 * retirement rule is enforced automatically.
 */

import { useState, useMemo } from "react";
import { clothTrackingService } from "../../services/clothTrackingService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Sparkles, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function KimLaundryScreen() {
  const [refreshTick, setRefreshTick] = useState(0);
  const inLaundry = useMemo(
    () => clothTrackingService.getClothsByStatus("IN_LAUNDRY_PROCESS"),
    [refreshTick]
  );

  const handleMarkComplete = (clothId: string) => {
    const { cloth, retired } = clothTrackingService.markLaundryComplete(clothId);
    if (!cloth) {
      toast.error("Could not complete this cloth's wash cycle");
      return;
    }
    if (retired) {
      toast.warning(`${cloth.shortId} has reached 90 washes — automatically retired`);
    } else {
      toast.success(`${cloth.shortId} washed — ${clothTrackingService.getWashesRemaining(cloth)} washes remaining, back in clean stock`);
    }
    setRefreshTick((t) => t + 1);
  };

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" /> Laundry
        </h1>
        <p className="text-sm text-gray-500">Mark each real cloth's wash cycle complete — real wash count updates automatically, retiring it at 90 washes</p>
      </div>

      <Card>
        <CardContent className="p-4">
          {inLaundry.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Nothing currently in the laundry.</p>
          ) : (
            <div className="space-y-2">
              {inLaundry.map((cloth) => {
                const washesRemaining = clothTrackingService.getWashesRemaining(cloth);
                const nearRetirement = washesRemaining <= 5;
                return (
                  <div key={cloth.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{cloth.shortId} {cloth.color && `· ${cloth.color}`}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={(cloth.washCount / 90) * 100} className="w-32 h-2" />
                        <span className="text-xs text-gray-500">{cloth.washCount} / 90 washes</span>
                        {nearRetirement && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> {washesRemaining} left
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleMarkComplete(cloth.id)}>Mark Washed</Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default KimLaundryScreen;
