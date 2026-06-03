/**
 * ApprovalCard Component
 * 
 * Reusable card for approval workflows.
 * Standardizes approval UI across all modules.
 * 
 * @component
 */

import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { CheckCircle, XCircle, Clock, User } from "lucide-react";
import { ReactNode } from "react";

export interface ApprovalCardProps {
  /** Card title */
  title: string;
  
  /** Description or subtitle */
  description?: string;
  
  /** Current status */
  status: string;
  
  /** Metadata key-value pairs */
  metadata?: Record<string, any>;
  
  /** Approve button handler */
  onApprove?: () => void;
  
  /** Reject button handler */
  onReject?: () => void;
  
  /** Whether user can approve */
  canApprove?: boolean;
  
  /** Whether approval is loading */
  isLoading?: boolean;
  
  /** Approve button text */
  approveText?: string;
  
  /** Reject button text */
  rejectText?: string;
  
  /** Show submitter info */
  submittedBy?: string;
  submittedOn?: string;
  
  /** Additional content */
  children?: ReactNode;
  
  /** Custom className */
  className?: string;
}

/**
 * ApprovalCard component for workflow approvals
 * 
 * @example
 * ```tsx
 * <ApprovalCard
 *   title="Leave Request - John Doe"
 *   description="Casual Leave"
 *   status="Pending L1 Approval"
 *   metadata={{
 *     "From": "Mar 10, 2026",
 *     "To": "Mar 12, 2026",
 *     "Days": "2 days",
 *     "Reason": "Family function"
 *   }}
 *   submittedBy="John Doe"
 *   submittedOn="Mar 8, 2026"
 *   onApprove={() => handleApprove()}
 *   onReject={() => handleReject()}
 *   canApprove={true}
 * />
 * ```
 */
export function ApprovalCard({
  title,
  description,
  status,
  metadata,
  onApprove,
  onReject,
  canApprove = true,
  isLoading = false,
  approveText = "Approve",
  rejectText = "Reject",
  submittedBy,
  submittedOn,
  children,
  className = "",
}: ApprovalCardProps) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold text-gray-900">
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <StatusBadge status={status} />
        </div>
        
        {(submittedBy || submittedOn) && (
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            {submittedBy && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{submittedBy}</span>
              </div>
            )}
            {submittedOn && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{submittedOn}</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Metadata */}
        {metadata && Object.keys(metadata).length > 0 && (
          <div className="space-y-2 mb-4">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-gray-500">{key}:</span>
                <span className="font-medium text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Additional content */}
        {children}
        
        {/* Action buttons */}
        {canApprove && (onApprove || onReject) && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            {onApprove && (
              <Button
                size="sm"
                onClick={onApprove}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {approveText}
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                disabled={isLoading}
                className="flex-1"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {rejectText}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ApprovalCard;
