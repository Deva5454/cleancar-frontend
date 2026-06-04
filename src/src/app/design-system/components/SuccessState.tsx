/**
 * SuccessState Component
 * 
 * Success feedback component for completed actions.
 * Provides consistent success messaging across the application.
 * 
 * @component
 */

import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export interface SuccessStateProps {
  /** Success title */
  title: string;
  
  /** Success message */
  message?: string;
  
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  
  /** Show checkmark animation */
  showAnimation?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * SuccessState component for displaying success messages
 * 
 * @example
 * ```tsx
 * <SuccessState
 *   title="Leave request submitted"
 *   message="Your leave request has been sent for approval"
 *   primaryAction={{
 *     label: "View Request",
 *     onClick: () => navigate('/leaves/123')
 *   }}
 *   secondaryAction={{
 *     label: "Submit Another",
 *     onClick: () => reset()
 *   }}
 * />
 * ```
 */
export function SuccessState({
  title,
  message,
  primaryAction,
  secondaryAction,
  showAnimation = true,
  className = "",
}: SuccessStateProps) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div
          className={`bg-green-100 rounded-full p-4 mb-4 ${
            showAnimation ? "animate-in zoom-in duration-300" : ""
          }`}
        >
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {message && (
          <p className="text-sm text-gray-600 mb-6 max-w-md">
            {message}
          </p>
        )}
        
        {(primaryAction || secondaryAction) && (
          <div className="flex gap-3">
            {primaryAction && (
              <Button onClick={primaryAction.onClick}>
                {primaryAction.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            {secondaryAction && (
              <Button variant="outline" onClick={secondaryAction.onClick}>
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SuccessState;
