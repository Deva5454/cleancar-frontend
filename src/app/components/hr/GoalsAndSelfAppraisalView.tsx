import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  performanceManagementService,
  RATING_LABELS,
  type GoalCategory, type RatingValue, type GoalRating,
} from "../../services/performanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../ui/select";
import { Target, Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES: GoalCategory[] = ["KPI", "Competency", "Development"];

const STATUS_COLOR: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Approved: "bg-green-100 text-green-700",
  Rejected: "bg-red-100 text-red-700",
};

export function GoalsAndSelfAppraisalView() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);

  const cycle = useMemo(() => performanceManagementService.getActiveCycle(), [refresh]);

  // ── Goal form state ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GoalCategory>("KPI");
  const [weight, setWeight] = useState<number | "">("");

  const goals = useMemo(
    () => (cycle ? performanceManagementService.listGoalsForEmployee(cycle.id, currentUser?.employeeId || "") : []),
    [refresh, cycle, currentUser?.employeeId]
  );

  const approvedGoals = goals.filter((g) => g.status === "Approved");
  const totalWeight = goals.filter((g) => g.status !== "Rejected").reduce((s, g) => s + g.weight, 0);

  const handleAddGoal = () => {
    if (!cycle) return;
    if (!title.trim()) { toast.error("Enter a goal title"); return; }
    if (weight === "" || weight <= 0 || weight > 100) { toast.error("Enter a weight between 1 and 100"); return; }

    performanceManagementService.addGoal({
      cycleId: cycle.id,
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || "",
      title, description, category, weight: Number(weight),
    });
    toast.success("Goal submitted for manager approval");
    setTitle(""); setDescription(""); setWeight("");
    setRefresh((r) => r + 1);
  };

  // ── Self appraisal state ──
  const existingAppraisal = useMemo(
    () => (cycle ? performanceManagementService.getSelfAppraisal(cycle.id, currentUser?.employeeId || "") : undefined),
    [refresh, cycle, currentUser?.employeeId]
  );
  const [goalRatings, setGoalRatings] = useState<GoalRating[]>(
    existingAppraisal?.goalRatings || approvedGoals.map((g) => ({ goalId: g.id, rating: 3 as RatingValue, comments: "" }))
  );
  const [overallComments, setOverallComments] = useState(existingAppraisal?.overallComments || "");

  const updateGoalRating = (goalId: string, patch: Partial<GoalRating>) => {
    setGoalRatings((prev) => {
      const exists = prev.find((r) => r.goalId === goalId);
      if (exists) return prev.map((r) => (r.goalId === goalId ? { ...r, ...patch } : r));
      return [...prev, { goalId, rating: 3, comments: "", ...patch }];
    });
  };

  const appraisalLocked = existingAppraisal?.status === "Submitted";

  const handleSaveAppraisalDraft = () => {
    if (!cycle) return;
    performanceManagementService.saveSelfAppraisal({
      cycleId: cycle.id,
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || "",
      goalRatings, overallComments,
    });
    toast.success("Self-appraisal draft saved");
    setRefresh((r) => r + 1);
  };

  const handleSubmitAppraisal = () => {
    if (!cycle) return;
    const record = performanceManagementService.saveSelfAppraisal({
      cycleId: cycle.id,
      employeeId: currentUser?.employeeId || "",
      employeeName: currentUser?.name || "",
      goalRatings, overallComments,
    });
    performanceManagementService.submitSelfAppraisal(record.id);
    toast.success("Self-appraisal submitted");
    setRefresh((r) => r + 1);
  };

  if (!cycle) {
    return (
      <Card><CardContent className="p-8 text-center text-sm text-gray-500">
        No active performance cycle right now. Check back once HR starts one.
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge className="bg-blue-100 text-blue-700">{cycle.name}</Badge>
        <Badge variant="outline">{cycle.currentPhase}</Badge>
      </div>

      {cycle.currentPhase === "Goal Setting" && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="w-4 h-4" /> Add a Goal</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Goal title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Description / how it will be measured" value={description} onChange={(e) => setDescription(e.target.value)} />
            <div className="flex gap-3">
              <Select value={category} onValueChange={(v) => setCategory(v as GoalCategory)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input
                type="number" min={1} max={100} placeholder="Weight %"
                value={weight} onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-32"
              />
              <Button onClick={handleAddGoal}><Plus className="w-4 h-4 mr-1" /> Add Goal</Button>
            </div>
            <p className="text-xs text-gray-400">Total weight across active goals: {totalWeight}% (aim for ~100%)</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">My Goals ({goals.length})</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {goals.length === 0 && <p className="text-sm text-gray-500">No goals added yet.</p>}
          {goals.map((g) => (
            <div key={g.id} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{g.title} <span className="text-xs text-gray-400">({g.weight}%)</span></p>
                  <p className="text-sm text-gray-500">{g.description}</p>
                </div>
                <Badge className={STATUS_COLOR[g.status]}>{g.status}</Badge>
              </div>
              {g.status === "Rejected" && g.managerComments && (
                <p className="text-xs text-red-600 mt-1">Manager: {g.managerComments}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {(cycle.currentPhase === "Self Appraisal" || existingAppraisal) && approvedGoals.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Self Appraisal</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {approvedGoals.map((g) => {
              const gr = goalRatings.find((r) => r.goalId === g.id) || { goalId: g.id, rating: 3 as RatingValue, comments: "" };
              return (
                <div key={g.id} className="border rounded-lg p-3 space-y-2">
                  <p className="font-medium">{g.title}</p>
                  <Select
                    value={String(gr.rating)} disabled={appraisalLocked}
                    onValueChange={(v) => updateGoalRating(g.id, { rating: Number(v) as RatingValue })}
                  >
                    <SelectTrigger className="w-full sm:w-72"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3, 4, 5] as RatingValue[]).map((r) => (
                        <SelectItem key={r} value={String(r)}>{r} — {RATING_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Comments / evidence" disabled={appraisalLocked}
                    value={gr.comments} onChange={(e) => updateGoalRating(g.id, { comments: e.target.value })}
                  />
                </div>
              );
            })}
            <Textarea
              placeholder="Overall self-appraisal comments" disabled={appraisalLocked}
              value={overallComments} onChange={(e) => setOverallComments(e.target.value)}
            />
            {!appraisalLocked ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSaveAppraisalDraft}>Save Draft</Button>
                <Button onClick={handleSubmitAppraisal}>Submit Self-Appraisal</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="w-4 h-4" /> Submitted — awaiting manager review.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default GoalsAndSelfAppraisalView;
