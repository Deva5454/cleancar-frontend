import React, { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
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
  Target,
  Lightbulb,
  UserCheck,
  TrendingUpIcon,
  Calendar,
  Edit,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  type Recommendation,
  type RecommendationStatus,
  getPriorityColor,
  getStatusColor,
} from "../../data/recommendationEngine";

interface RecommendationCardProps {
  recommendation: Recommendation;
  isExpanded: boolean;
  onToggle: () => void;
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

export function RecommendationCard({
  recommendation,
  isExpanded,
  onToggle,
}: RecommendationCardProps) {
  const [status, setStatus] = useState<RecommendationStatus>(recommendation.status);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  
  const DiagnosisIcon = DIAGNOSIS_ICONS[recommendation.diagnosisCategory] || AlertCircle;
  
  const handleStatusChange = (newStatus: RecommendationStatus) => {
    setStatus(newStatus);
    setIsEditingStatus(false);
    toast.success(`Recommendation status updated to "${newStatus}"`);
  };
  
  const isCompleted = status === "Completed";
  
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
      } ${isCompleted ? "opacity-75" : ""}`}
    >
      <CardContent className="p-0">
        {/* Header - Always Visible */}
        <div
          className="p-4 cursor-pointer hover:bg-gray-50/50"
          onClick={onToggle}
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
                  {/* Priority Badge */}
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(recommendation.priority)} font-semibold`}
                  >
                    {recommendation.priority} Priority
                  </Badge>
                  
                  {/* Diagnosis Category */}
                  <Badge variant="outline" className="bg-white">
                    {recommendation.diagnosisCategory}
                  </Badge>
                  
                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={getStatusColor(status)}
                  >
                    {status}
                  </Badge>
                  
                  {isCompleted && (
                    <Badge className="bg-green-600 text-white">
                      ✓ Resolved
                    </Badge>
                  )}
                </div>
                
                {/* What is happening */}
                <div className="font-semibold text-gray-900 mb-1">
                  {recommendation.whatIsHappening}
                </div>
                
                {/* Financial Impact Badge */}
                {recommendation.metrics.financialImpact > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-red-600 text-white font-bold">
                      Financial Impact: ₹{(recommendation?.metrics?.financialImpact ?? 0).toLocaleString()}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            
            {/* Expand/Collapse Button */}
            <Button
              variant="ghost"
              size="sm"
              className="flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
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
              
              {/* What to do - Action Steps */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 font-bold text-gray-900">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  What to Do
                </div>
                <div className="space-y-3">
                  {recommendation.actionSteps.map((step) => (
                    <div
                      key={step.step}
                      className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 mb-2">
                          {step.action}
                        </div>
                        <Badge
                          variant="outline"
                          className={OWNER_COLORS[step.owner] || "bg-gray-100"}
                        >
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
                  <div className="text-xs text-purple-700 font-medium">
                    Primary Owner
                  </div>
                  <div className="font-bold text-purple-900">
                    {recommendation.primaryOwner}
                  </div>
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
              
              {/* Metrics Variance */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">Actual Value</div>
                  <div className="font-bold text-lg text-gray-900">
                    {(recommendation?.metrics?.actualValue ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">Ideal/Target Value</div>
                  <div className="font-bold text-lg text-blue-900">
                    {(recommendation?.metrics?.idealValue ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-600 mb-1">Variance</div>
                  <div className="font-bold text-lg text-red-900">
                    {recommendation.metrics.variance >= 0 ? "+" : ""}
                    {(recommendation?.metrics?.variance ?? 0).toLocaleString()}
                    {recommendation.metrics.variancePercent !== 0 && (
                      <span className="text-sm ml-1">
                        ({recommendation.metrics.variancePercent >= 0 ? "+" : ""}
                        {(recommendation?.metrics?.variancePercent ?? 0).toFixed(1)}%)
                      </span>
                    )}
                  </div>
                </div>
                {recommendation.metrics.financialImpact > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="text-xs text-orange-600 mb-1">Financial Impact</div>
                    <div className="font-bold text-lg text-orange-900">
                      ₹{(recommendation?.metrics?.financialImpact ?? 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Status Update and Metadata */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  {/* Status Update */}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      Status:
                    </span>
                    {isEditingStatus ? (
                      <Select
                        value={status}
                        onValueChange={(value) =>
                          handleStatusChange(value as RecommendationStatus)
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Not Started">Not Started</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <>
                        <Badge
                          variant="outline"
                          className={getStatusColor(status)}
                        >
                          {status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingStatus(true)}
                          className="text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Update
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Raised: {format(new Date(recommendation.raisedOn), "dd MMM yyyy")}
                    </div>
                    {recommendation.completedOn && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Completed: {format(new Date(recommendation.completedOn), "dd MMM yyyy")}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Admin Notes */}
                {recommendation.notes && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="text-xs font-medium text-yellow-800 mb-1">
                      Admin Notes:
                    </div>
                    <div className="text-sm text-yellow-900">
                      {recommendation.notes}
                    </div>
                    {recommendation.updatedBy && (
                      <div className="text-xs text-yellow-700 mt-1">
                        — {recommendation.updatedBy},{" "}
                        {recommendation.updatedOn &&
                          format(new Date(recommendation.updatedOn), "dd MMM yyyy")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
