import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import {
  AlertCircle,
  TrendingDown,
  Droplet,
  AlertTriangle,
  Users,
  Wrench,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Info,
  Lightbulb,
  UserCheck,
  TrendingUpIcon,
  Calendar,
  UserPlus,
  Play,
  Check,
  CheckCircle,
  XCircle,
  MessageSquare,
  RotateCcw,
  Bell,
  Zap,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  type Recommendation,
  type ActionOwner,
  type ProgressNote,
  getPriorityColor,
  getStatusColor,
} from "../../data/recommendationEngine";
import { formatCurrency, formatIndianDate } from "../../utils/formatters";
import { CalculationFormula } from "./CalculationFormula";
import { getAuditTrailForRecommendation } from "../../data/auditTrail";

interface ManageableRecommendationCardProps {
  recommendation: Recommendation;
  showActions: boolean;
  showVerification?: boolean;
}

const DIAGNOSIS_ICONS: Record<string, any> = {
  "Job Volume Shortfall": TrendingDown,
  "Zero Wash Days": AlertCircle,
  "Consumable Over-Consumption": Droplet,
  "Consumable Under-Consumption": AlertTriangle,
  "Supervisor Underutilization": Users,
  "Equipment Cost Spike": Wrench,
  "Overhead Creep": TrendingUp,
  "High Carry-Forward Stock": Package,
  "Batch Price Increase Impact": DollarSign,
  "Team Attainment Spread": BarChart3,
};

const OWNER_COLORS: Record<string, string> = {
  "Operations Manager": "bg-blue-100 text-blue-800 border-blue-200",
  "Supervisor": "bg-purple-100 text-purple-800 border-purple-200",
  "HR": "bg-green-100 text-green-800 border-green-200",
  "Purchase Manager": "bg-orange-100 text-orange-800 border-orange-200",
  "Store Manager": "bg-pink-100 text-pink-800 border-pink-200",
  "Admin": "bg-gray-100 text-gray-800 border-gray-200",
  "Finance Manager": "bg-indigo-100 text-indigo-800 border-indigo-200",
};

export function ManageableRecommendationCard({
  recommendation,
  showActions,
  showVerification = false,
}: ManageableRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  
  // Assignment form state
  const [assignTo, setAssignTo] = useState("");
  const [assignToRole, setAssignToRole] = useState<ActionOwner | "">("");
  const [dueDate, setDueDate] = useState("");
  
  // Progress form state
  const [progressNote, setProgressNote] = useState("");
  
  // Resolution form state
  const [resolutionSummary, setResolutionSummary] = useState("");
  const [reopenReason, setReopenReason] = useState("");
  
  const DiagnosisIcon = DIAGNOSIS_ICONS[recommendation.diagnosisCategory] || AlertCircle;
  const isResolved = recommendation.status === "Completed";
  
  // Handlers
  const handleAssign = () => {
    if (!assignTo || !assignToRole || !dueDate) {
      toast.error("Please fill all fields");
      return;
    }
    
    // In a real app, this would update the database
    toast.success(
      `Recommendation assigned to ${assignTo}`,
      {
        description: `A notification has been sent: "A cost improvement recommendation has been assigned to you — ${recommendation.diagnosisCategory} — Due: ${format(new Date(dueDate), "dd MMM yyyy")}. View in Finance → Cost Per Wash → Recommendations."`,
      }
    );
    
    setShowAssignDialog(false);
    setAssignTo("");
    setAssignToRole("");
    setDueDate("");
  };
  
  const handleMarkInProgress = () => {
    if (!progressNote.trim()) {
      toast.error("Please add a progress note");
      return;
    }
    
    toast.success("Recommendation marked as In Progress");
    setShowProgressDialog(false);
    setProgressNote("");
  };
  
  const handleResolve = () => {
    if (!resolutionSummary.trim()) {
      toast.error("Resolution summary is required");
      return;
    }
    
    toast.success(
      "Recommendation marked as Resolved",
      {
        description: "Awaiting Operations Manager review for confirmation",
      }
    );
    
    setShowResolveDialog(false);
    setResolutionSummary("");
  };
  
  const handleConfirmResolution = () => {
    toast.success("Resolution confirmed — Recommendation archived");
  };
  
  const handleReopen = () => {
    if (!reopenReason.trim()) {
      toast.error("Please provide a reason for reopening");
      return;
    }
    
    toast.warning(
      "Recommendation reopened",
      {
        description: `Reason: ${reopenReason}`,
      }
    );
    
    setShowReopenDialog(false);
    setReopenReason("");
  };
  
  return (
    <Card
      className={`border-2 transition-all ${
        isExpanded ? "shadow-lg" : "shadow-sm hover:shadow-md"
      } ${
        recommendation.priority === "High"
          ? "border-red-200 bg-red-50/30"
          : recommendation.priority === "Medium"
          ? "border-amber-200 bg-amber-50/30"
          : "border-gray-200"
      } ${isResolved ? "opacity-75" : ""}`}
    >
      <CardContent className="p-0">
        {/* Header - Always Visible */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-50/50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              {/* Diagnosis Icon */}
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  recommendation.priority === "High"
                    ? "bg-red-100"
                    : recommendation.priority === "Medium"
                    ? "bg-amber-100"
                    : "bg-gray-100"
                }`}
              >
                <DiagnosisIcon
                  className={`w-5 h-5 ${
                    recommendation.priority === "High"
                      ? "text-red-600"
                      : recommendation.priority === "Medium"
                      ? "text-amber-600"
                      : "text-gray-600"
                  }`}
                />
              </div>
              
              {/* Title and Summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                    {recommendation.priority} Priority
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    {recommendation.diagnosisCategory}
                  </Badge>
                  <Badge variant="outline" className={getStatusColor(recommendation.status)}>
                    {recommendation.status}
                  </Badge>
                  <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                    {recommendation.entityType}: {recommendation.entityName}
                  </Badge>
                  {isResolved && (
                    <Badge className="bg-green-600 text-white">✓ Resolved</Badge>
                  )}
                  {recommendation.assignedTo && (
                    <Badge className="bg-blue-600 text-white">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Assigned to {recommendation.assignedTo}
                    </Badge>
                  )}
                </div>
                
                <div className="font-semibold text-gray-900 mb-1">
                  {recommendation.whatIsHappening}
                </div>
                
                {recommendation.metrics.financialImpact > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-red-600 text-white font-bold">
                      Financial Impact: {formatCurrency(recommendation.metrics.financialImpact)}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="sm" className="flex-shrink-0">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="border-t border-gray-200 bg-white">
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Why it matters */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Info className="w-4 h-4 text-blue-600" />
                  Why It Matters
                </div>
                <div className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  {recommendation.whyItMatters}
                </div>
              </div>
              
              {/* Action Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  What to Do
                </div>
                <div className="space-y-3">
                  {recommendation.actionSteps.map((step) => (
                    <div key={step.step} className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-2">{step.action}</div>
                        <Badge variant="outline" className={OWNER_COLORS[step.owner] || "bg-gray-100"}>
                          <UserCheck className="w-3 h-3 mr-1" />
                          {step.owner}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Primary Owner */}
              <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg p-3">
                <UserCheck className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-xs text-purple-700 font-medium">Primary Owner</div>
                  <div className="font-bold text-purple-900">{recommendation.primaryOwner}</div>
                </div>
              </div>
              
              {/* Expected Impact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <TrendingUpIcon className="w-4 h-4 text-green-600" />
                  Expected Impact if Actioned
                </div>
                <div className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-lg p-3">
                  {recommendation.expectedImpact}
                </div>
              </div>
              
              {/* Calculation Formula - How is this calculated? */}
              <CalculationFormula
                diagnosisCategory={recommendation.diagnosisCategory}
                metrics={recommendation.metrics}
                entityName={recommendation.entityName}
                actualJobs={recommendation.metrics.actualValue}
                idealJobs={recommendation.metrics.idealValue}
              />
              
              {/* Auto-Generation Indicator */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                <Zap className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <strong>Auto-generated recommendation:</strong> This recommendation was automatically created by the Cost Per Wash analysis engine on {formatIndianDate(recommendation.raisedOn)}. All figures are calculated from actual cost data and update automatically when new job data is recorded.
                </div>
              </div>
              
              {/* Progress Notes Thread */}
              {recommendation.progressNotes && recommendation.progressNotes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Progress Notes
                  </div>
                  <div className="space-y-2">
                    {recommendation.progressNotes.map((note) => (
                      <div key={note.id} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="text-sm text-gray-900 mb-2">{note.note}</div>
                        <div className="text-xs text-blue-700">
                          — {note.createdBy} ({note.createdByRole}), {format(new Date(note.createdAt), "dd MMM yyyy HH:mm")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Resolution Info */}
              {recommendation.resolution && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Resolution Summary
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="text-sm text-gray-900 mb-2">{recommendation.resolution.summary}</div>
                    <div className="text-xs text-green-700">
                      Resolved by {recommendation.resolution.resolvedBy} on{" "}
                      {format(new Date(recommendation.resolution.resolvedAt), "dd MMM yyyy")}
                    </div>
                    {recommendation.resolution.confirmedBy && (
                      <div className="text-xs text-green-700 mt-1">
                        ✓ Confirmed by {recommendation.resolution.confirmedBy} on{" "}
                        {recommendation.resolution.confirmedAt && format(new Date(recommendation.resolution.confirmedAt), "dd MMM yyyy")}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Verification Status */}
              {showVerification && recommendation.verification && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    Verification Status
                  </div>
                  <div
                    className={`border rounded-lg p-3 ${
                      recommendation.verification.status === "Verified"
                        ? "bg-green-50 border-green-200"
                        : recommendation.verification.status === "Issue Persists"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div
                      className={`font-bold mb-1 ${
                        recommendation.verification.status === "Verified"
                          ? "text-green-900"
                          : recommendation.verification.status === "Issue Persists"
                          ? "text-amber-900"
                          : "text-gray-700"
                      }`}
                    >
                      {recommendation.verification.status === "Verified" && "✓ Verified — "}
                      {recommendation.verification.status === "Issue Persists" && "⚠ Issue Persists — "}
                      {recommendation.verification.status === "Not Yet Verified" && "⏳ Not Yet Verified — "}
                      {recommendation.verification.message}
                    </div>
                    {recommendation.verification.beforeCPW && recommendation.verification.afterCPW && (
                      <div className="text-sm text-gray-700">
                        CPW improved from ₹{(recommendation?.verification?.beforeCPW ?? 0).toFixed(2)} to ₹
                        {(recommendation?.verification?.afterCPW ?? 0).toFixed(2)} (
                        {recommendation.verification.improvementPercent?.toFixed(1)}% improvement)
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              {showActions && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Assign Button */}
                    {!recommendation.assignedTo && recommendation.status === "Not Started" && (
                      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-blue-600 hover:bg-blue-700">
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Recommendation
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Recommendation</DialogTitle>
                            <DialogDescription>
                              Assign this cost improvement recommendation to a team member
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="assignTo">Assign To (Name)</Label>
                              <Input
                                id="assignTo"
                                placeholder="e.g., Rajesh Kumar"
                                value={assignTo}
                                onChange={(e) => setAssignTo(e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="role">Role</Label>
                              <Select value={assignToRole} onValueChange={(v) => setAssignToRole(v as ActionOwner)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                                  <SelectItem value="HR">HR</SelectItem>
                                  <SelectItem value="Purchase Manager">Purchase Manager</SelectItem>
                                  <SelectItem value="Store Manager">Store Manager</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                  <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="dueDate">Due Date</Label>
                              <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                              />
                            </div>
                          </div>
                          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAssign}>
                              <Bell className="w-4 h-4 mr-2" />
                              Assign & Notify
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Mark In Progress Button */}
                    {recommendation.status === "Not Started" && (
                      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <Play className="w-4 h-4 mr-2" />
                            Mark In Progress
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark as In Progress</DialogTitle>
                            <DialogDescription>
                              Add a progress note describing what action has been taken
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="Describe the action taken so far..."
                              value={progressNote}
                              onChange={(e) => setProgressNote(e.target.value)}
                              rows={4}
                            />
                          </div>
                          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleMarkInProgress}>
                              Update Status
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Mark Resolved Button */}
                    {(recommendation.status === "In Progress" || recommendation.status === "Not Started") && (
                      <Dialog open={showResolveDialog} onOpenChange={setShowResolveDialog}>
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700">
                            <Check className="w-4 h-4 mr-2" />
                            Mark Resolved
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark as Resolved</DialogTitle>
                            <DialogDescription>
                              Describe what was done and the outcome (required)
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="E.g., 'Rebalanced job allocation between washers. Suresh Kumar now receives 21 jobs/day consistently. Will monitor next month's CPW.'"
                              value={resolutionSummary}
                              onChange={(e) => setResolutionSummary(e.target.value)}
                              rows={5}
                            />
                          </div>
                          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowResolveDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
                              Submit for Review
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Confirm Resolution (Operations Manager only) */}
                    {isResolved && !recommendation.resolution?.confirmedBy && (
                      <Button onClick={handleConfirmResolution} className="bg-teal-600 hover:bg-teal-700">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Confirm Resolution
                      </Button>
                    )}
                    
                    {/* Reopen Button (Operations Manager only) */}
                    {isResolved && (
                      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Reopen
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Reopen Recommendation</DialogTitle>
                            <DialogDescription>
                              Provide a reason for reopening this recommendation
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Textarea
                              placeholder="E.g., 'Issue persists — salary CPW still elevated. Please take further action.'"
                              value={reopenReason}
                              onChange={(e) => setReopenReason(e.target.value)}
                              rows={3}
                            />
                          </div>
                          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowReopenDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleReopen} variant="destructive">
                              Reopen
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              )}
              
              {/* Metadata Footer */}
              <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-xs text-gray-500">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Raised: {format(new Date(recommendation.raisedOn), "dd MMM yyyy")}
                  </div>
                  {recommendation.dueDate && (
                    <div className="flex items-center gap-1 text-red-600 font-medium">
                      <Calendar className="w-3 h-3" />
                      Due: {format(new Date(recommendation.dueDate), "dd MMM yyyy")}
                    </div>
                  )}
                </div>
                <div className="text-gray-400">ID: {recommendation.id}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}