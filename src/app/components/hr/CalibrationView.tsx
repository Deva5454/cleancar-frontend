import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  performanceManagementService,
  RATING_LABELS,
  type RatingValue,
} from "../../services/performanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { BarChart3, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export function CalibrationView() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const [notesByEmployee, setNotesByEmployee] = useState<Record<string, string>>({});
  const [ratingByEmployee, setRatingByEmployee] = useState<Record<string, RatingValue>>({});

  const cycle = useMemo(() => performanceManagementService.getActiveCycle(), [refresh]);

  const pending = useMemo(
    () => (cycle ? performanceManagementService.getPendingCalibration(cycle.id) : []),
    [refresh, cycle]
  );
  const distribution = useMemo(
    () => (cycle ? performanceManagementService.getRatingDistribution(cycle.id) : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
    [refresh, cycle]
  );
  const calibrated = useMemo(
    () => (cycle ? performanceManagementService.getCalibrationRecords(cycle.id) : []),
    [refresh, cycle]
  );

  const handleCalibrate = (employeeId: string, employeeName: string, defaultRating: RatingValue) => {
    if (!cycle) return;
    const finalRating = ratingByEmployee[employeeId] ?? defaultRating;
    const notes = notesByEmployee[employeeId] || "";
    const record = performanceManagementService.calibrate(
      cycle.id, employeeId, employeeName, finalRating, notes, currentUser?.name || "HR"
    );
    const increment = performanceManagementService.getSuggestedIncrement(cycle.id, employeeId);
    toast.success(
      `Final rating locked: ${finalRating} — ${RATING_LABELS[finalRating]}` +
      (increment !== undefined ? `. Suggested increment: ${increment}%` : "")
    );
    setRefresh((r) => r + 1);
  };

  if (!cycle) {
    return (
      <Card><CardContent className="p-8 text-center text-sm text-gray-500">
        No active performance cycle right now.
      </CardContent></Card>
    );
  }

  const totalReviewed = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-100 text-blue-700">{cycle.name}</Badge>
        <Badge variant="outline">{cycle.currentPhase}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Rating Distribution ({totalReviewed} reviewed)</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {([5, 4, 3, 2, 1] as RatingValue[]).map((r) => {
            const count = distribution[r];
            const pct = totalReviewed > 0 ? Math.round((count / totalReviewed) * 100) : 0;
            return (
              <div key={r} className="flex items-center gap-2 text-sm">
                <span className="w-40 text-gray-600">{r} — {RATING_LABELS[r]}</span>
                <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                  <div className="bg-purple-500 h-3" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-16 text-right text-gray-500">{count} ({pct}%)</span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pending Calibration ({pending.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 && <p className="text-sm text-gray-500">Nothing pending calibration.</p>}
          {pending.map((review) => {
            const selected = ratingByEmployee[review.employeeId] ?? review.overallRating;
            return (
              <div key={review.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{review.employeeName}</p>
                    <p className="text-xs text-gray-400">Manager-rated: {review.overallRating} — {RATING_LABELS[review.overallRating]} (by {review.managerName})</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.overallComments}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Final Rating:</span>
                  <Select
                    value={String(selected)}
                    onValueChange={(v) => setRatingByEmployee((prev) => ({ ...prev, [review.employeeId]: Number(v) as RatingValue }))}
                  >
                    <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3, 4, 5] as RatingValue[]).map((r) => (
                        <SelectItem key={r} value={String(r)}>{r} — {RATING_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  placeholder="Calibration notes (why adjusted, if at all)"
                  value={notesByEmployee[review.employeeId] || ""}
                  onChange={(e) => setNotesByEmployee((prev) => ({ ...prev, [review.employeeId]: e.target.value }))}
                />
                <Button size="sm" onClick={() => handleCalibrate(review.employeeId, review.employeeName, review.overallRating)}>
                  Lock Final Rating
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {calibrated.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Calibrated ({calibrated.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {calibrated.map((c) => {
              const increment = performanceManagementService.getSuggestedIncrement(cycle.id, c.employeeId);
              return (
                <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="font-medium">{c.employeeName}</p>
                      <p className="text-xs text-gray-400">
                        Final: {c.finalRating} — {RATING_LABELS[c.finalRating]}
                        {c.preCalibrationRating !== c.finalRating && ` (adjusted from ${c.preCalibrationRating})`}
                      </p>
                    </div>
                  </div>
                  {increment !== undefined && (
                    <Badge className="bg-purple-100 text-purple-700">Suggested increment: {increment}%</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default CalibrationView;
