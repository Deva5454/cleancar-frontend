/**
 * Supervisor Override Notice
 * Shows when supervisor has overridden attendance, incentive, etc.
 * Design Principle: Transparent but read-only
 */

import { Shield, Clock, DollarSign, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

export type OverrideType = "ATTENDANCE" | "INCENTIVE" | "LEAVE" | "PENALTY";
export type OverrideStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface SupervisorOverrideNoticeProps {
  type: OverrideType;
  status: OverrideStatus;
  reason?: string;
  supervisorName?: string;
  appliedDate?: Date;
  details?: string;
}

export function SupervisorOverrideNotice({
  type,
  status,
  reason,
  supervisorName = "Supervisor",
  appliedDate,
  details
}: SupervisorOverrideNoticeProps) {
  const getIcon = () => {
    switch (type) {
      case "ATTENDANCE":
        return Clock;
      case "INCENTIVE":
        return DollarSign;
      case "LEAVE":
        return Calendar;
      case "PENALTY":
        return AlertCircle;
    }
  };

  const getTitle = () => {
    switch (type) {
      case "ATTENDANCE":
        return "Attendance Override";
      case "INCENTIVE":
        return "Incentive Override";
      case "LEAVE":
        return "Leave Override";
      case "PENALTY":
        return "Penalty Override";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "PENDING":
        return { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100 text-amber-700 border-amber-300" };
      case "APPROVED":
        return { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", badge: "bg-green-100 text-green-700 border-green-300" };
      case "REJECTED":
        return { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", badge: "bg-red-100 text-red-700 border-red-300" };
    }
  };

  const Icon = getIcon();
  const colors = getStatusColor();

  return (
    <Card className={`border-2 ${colors.border} ${colors.bg}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className={`h-10 w-10 rounded-full ${colors.bg} flex items-center justify-center`}>
              <Shield className={`h-5 w-5 ${colors.text}`} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-base font-semibold text-gray-900">
                {getTitle()}
              </h3>
              <Badge variant="outline" className={colors.badge}>
                {status === "PENDING" && "Under Review"}
                {status === "APPROVED" && "Approved"}
                {status === "REJECTED" && "Rejected"}
              </Badge>
            </div>

            {/* Status-specific message */}
            <p className="text-sm text-gray-700 mb-2">
              {status === "PENDING" && (
                <>
                  {type === "ATTENDANCE" && "Attendance marked by supervisor (pending approval)"}
                  {type === "INCENTIVE" && "Incentive under review"}
                  {type === "LEAVE" && "Leave request under review"}
                  {type === "PENALTY" && "Penalty under review"}
                </>
              )}
              {status === "APPROVED" && (
                <>Approved by {supervisorName}</>
              )}
              {status === "REJECTED" && (
                <>Request not approved</>
              )}
            </p>

            {/* Reason */}
            {reason && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                <p className="text-xs font-medium text-gray-900 mb-1">Reason:</p>
                <p className="text-xs text-gray-700">{reason}</p>
              </div>
            )}

            {/* Details */}
            {details && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 mb-2">
                <p className="text-xs text-gray-700">{details}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
              {appliedDate && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{appliedDate.toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>{supervisorName}</span>
              </div>
            </div>

            {/* Important notice */}
            <div className="mt-3 bg-gray-50 p-2 rounded border border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-medium">Note:</span> This action was taken by your supervisor. 
                {status === "PENDING" && " You will be notified once reviewed."}
                {status === "APPROVED" && " No further action needed."}
                {status === "REJECTED" && " Contact your supervisor if you have questions."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Calendar icon (missing from import)
function Calendar({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
      />
    </svg>
  );
}
