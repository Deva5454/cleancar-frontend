import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import {
  performanceManagementService,
  RATING_LABELS,
  type RatingValue, type GoalRating,
} from "../../services/performanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { CheckCircle, XCircle, Users, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ManagerReviewView() {
  const { currentUser } = useRole();
  const { employees } = useEmployee();
  const [refresh, setRefresh] = useState(0);
  const [rejectingGoalId, setRejectingGoalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const cycle = useMemo(() => performanceManagementService.getActiveCycle(), [refresh]);

  const directReports = useMemo(
    () => employees.filter((e: any) =>
      e.reportingManager === currentUser?.name || e.reportingManager === currentUser?.employeeId
    ),
    [employees, currentUser]
  );
  const teamIds = directReports.map((e: any) => e.id);

  const pendingGoals = useMemo(
    () => (cycle ? performanceManagementService.listGoalsPendingApproval(cycle.id, teamIds) : []),
    [refresh, cycle, teamIds]
  );

  const handleApproveGoal = (goalId: string) => {
    performanceManagementService.approveGoal(goalId);
    toast.success("Goal approved");
    setRefresh((r) => r + 1);
  };
  const confirmRejectGoal = (goalId: string) => {
    if (!rejectReason.trim()) { toast.error("Add a reason"); return; }
    performanceManagementService.rejectGoal(goalId, rejectReason);
    toast.success("Goal rejected");
    setRejectingGoalId(null); setRejectReason("");
    setRefresh((r) => r + 1);
  };

  // ── Team reviews ──
  const [reviewingEmployeeId, setReviewingEmployeeId] = useState<string | null>(null);
  const [goalRatings, setGoalRatings] = useState<GoalRating[]>([]);
  const [overallRating, setOverallRating] = useState<RatingValue>(3);
  const [overallComments, setOverallComments] = useState("");

  const openReview = (employeeId: string) => {
    if (!cycle) return;
    const goals = performanceManagementService.listGoalsForEmployee(cycle.id, employeeId).filter((g) => g.status === "Approved");
    const existing = performanceManagementService.getManagerReview(cycle.id, employeeId);
    setGoalRatings(existing?.goalRatings || goals.map((g) => ({ goalId: g.id, rating: 3 as RatingValue, comments: "" })));
    setOverallRating(existing?.overallRating || 3);
    setOverallComments(existing?.overallComments || "");
    setReviewingEmployeeId(employeeId);
  };

  const updateGoalRating = (goalId: string, patch: Partial<GoalRating>) => {
    setGoalRatings((prev) => prev.map((r) => (r.goalId === goalId ? { ...r, ...patch } : r)));
  };

  const reviewingEmployee = directReports.find((e: any) => e.id === reviewingEmployeeId);
  const reviewingGoals = cycle && reviewingEmployeeId
    ? performanceManagementService.listGoalsForEmployee(cycle.id, reviewingEmployeeId).filter((g) => g.status === "Approved")
    : [];
  const existingReview = cycle && reviewingEmployeeId
    ? performanceManagementService.getManagerReview(cycle.id, reviewingEmployeeId)
    : undefined;
  const reviewLocked = existingReview?.status === "Submitted";

  const handleSaveReviewDraft = () => {
    if (!cycle || !reviewingEmployeeId || !reviewingEmployee) return;
    performanceManagementService.saveManagerReview({
      cycleId: cycle.id,
      employeeId: reviewingEmployeeId,
      employeeName: reviewingEmployee.fullName,
      managerId: currentUser?.employeeId || "",
      managerName: currentUser?.name || "",
      goalRatings, overallRating, overallComments,
    });
    toast.success("Review draft saved");
    setRefresh((r) => r + 1);
  };

  const handleSubmitReview = () => {
    if (!cycle || !reviewingEmployeeId || !reviewingEmployee) return;
    const record = performanceManagementService.saveManagerReview({
      cycleId: cycle.id,
      employeeId: reviewingEmployeeId,
      employeeName: reviewingEmployee.fullName,
      managerId: currentUser?.employeeId || "",
      managerName: currentUser?.name || "",
      goalRatings, overallRating, overallComments,
    });
    performanceManagementService.submitManagerReview(record.id);
    toast.success("Review submitted — moves to HR calibration");
    setReviewingEmployeeId(null);
    setRefresh((r) => r + 1);
  };

  if (!cycle) {
    return (
      <Card><CardContent className="p-8 text-center text-sm text-gray-500">
        No active performance cycle right now.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-100 text-blue-700">{cycle.name}</Badge>
        <Badge variant="outline">{cycle.currentPhase}</Badge>
      </div>

      {pendingGoals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Goals Pending Your Approval ({pendingGoals.length})</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pendingGoals.map((g) => (
              <div key={g.id} className="border rounded-lg p-3 space-y-2">
                <p className="font-medium">{g.employeeName} — {g.title} <span className="text-xs text-gray-400">({g.weight}%)</span></p>
                <p className="text-sm text-gray-500">{g.description}</p>
                {rejectingGoalId === g.id ? (
                  <div className="space-y-2">
                    <Textarea placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={() => confirmRejectGoal(g.id)}>Confirm Reject</Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectingGoalId(null)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleApproveGoal(g.id)}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => setRejectingGoalId(g.id)}><XCircle className="w-4 h-4 mr-1" /> Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" /> My Team ({directReports.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {directReports.map((emp: any) => {
            const review = performanceManagementService.getManagerReview(cycle.id, emp.id);
            return (
              <div key={emp.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p className="font-medium">{emp.fullName}</p>
                  <p className="text-xs text-gray-400">{emp.designation}</p>
                </div>
                <div className="flex items-center gap-2">
                  {review?.status === "Submitted" && <Badge className="bg-green-100 text-green-700">Reviewed</Badge>}
                  <Button size="sm" variant="outline" onClick={() => openReview(emp.id)}>
                    {review ? "Edit Review" : "Start Review"}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {reviewingEmployeeId && reviewingEmployee && (
        <Card className="border-blue-300">
          <CardHeader><CardTitle className="text-base">Reviewing: {reviewingEmployee.fullName}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {reviewingGoals.length === 0 && <p className="text-sm text-gray-500">No approved goals for this employee yet.</p>}
            {reviewingGoals.map((g) => {
              const gr = goalRatings.find((r) => r.goalId === g.id) || { goalId: g.id, rating: 3 as RatingValue, comments: "" };
              return (
                <div key={g.id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium">{g.title}</p>
                  <Select value={String(gr.rating)} disabled={reviewLocked} onValueChange={(v) => updateGoalRating(g.id, { rating: Number(v) as RatingValue })}>
                    <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3, 4, 5] as RatingValue[]).map((r) => (
                        <SelectItem key={r} value={String(r)}>{r} — {RATING_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="Manager comments" disabled={reviewLocked} value={gr.comments} onChange={(e) => updateGoalRating(g.id, { comments: e.target.value })} />
                </div>
              );
            })}

            <div>
              <p className="font-medium mb-1">Overall Rating</p>
              <Select value={String(overallRating)} disabled={reviewLocked} onValueChange={(v) => setOverallRating(Number(v) as RatingValue)}>
                <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {([1, 2, 3, 4, 5] as RatingValue[]).map((r) => (
                    <SelectItem key={r} value={String(r)}>{r} — {RATING_LABELS[r]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Textarea placeholder="Overall comments" disabled={reviewLocked} value={overallComments} onChange={(e) => setOverallComments(e.target.value)} />

            {!reviewLocked ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveReviewDraft}>Save Draft</Button>
                <Button onClick={handleSubmitReview}>Submit Review</Button>
                <Button variant="ghost" onClick={() => setReviewingEmployeeId(null)}>Close</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Submitted — awaiting HR calibration.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ManagerReviewView;
