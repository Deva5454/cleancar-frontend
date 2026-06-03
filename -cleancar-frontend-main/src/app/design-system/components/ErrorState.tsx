/**
 * ErrorState Component
 * 
 * Standardized error state component for error handling.
 * Provides consistent error UX across the application.
 * 
 * @component
 */

import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  
  /** Error message */
  message?: string;
  
  /** Error code (optional) */
  errorCode?: string;
  
  /** Retry button text */
  retryText?: string;
  
  /** Retry handler */
  onRetry?: () => void;
  
  /** Home button text */
  homeText?: string;
  
  /** Home handler */
  onHome?: () => void;
  
  /** Error type */
  type?: "error" | "404" | "403" | "500";
  
  /** Show technical details */
  showDetails?: boolean;
  
  /** Technical details */
  details?: string;
  
  /** Custom className */
  className?: string;
}

/**
 * Get default messages based on error type
 */
function getDefaultMessages(type: ErrorStateProps["type"]) {
  switch (type) {
    case "404":
      return {
        title: "Page Not Found",
        message: "The page you're looking for doesn't exist or has been moved.",
      };
    case "403":
      return {
        title: "Access Denied",
        message: "You don't have permission to access this resource.",
      };
    case "500":
      return {
        title: "Server Error",
        message: "Something went wrong on our end. Please try again later.",
      };
    default:
      return {
        title: "Something Went Wrong",
        message: "An unexpected error occurred. Please try again.",
      };
  }
}

/**
 * ErrorState component for displaying error states
 * 
 * @example
 * ```tsx
 * <ErrorState
 *   type="500"
 *   onRetry={() => refetch()}
 * />
 * 
 * <ErrorState
 *   title="Failed to load data"
 *   message="Unable to connect to the server"
 *   onRetry={() => refetch()}
 *   onHome={() => navigate('/')}
 * />
 * ```
 */
export function ErrorState({
  title,
  message,
  errorCode,
  retryText = "Try Again",
  onRetry,
  homeText = "Go Home",
  onHome,
  type = "error",
  showDetails = false,
  details,
  className = "",
}: ErrorStateProps) {
  const defaults = getDefaultMessages(type);
  const finalTitle = title || defaults.title;
  const finalMessage = message || defaults.message;
  
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-red-100 rounded-full p-4 mb-4">
          <AlertCircle className="w-12 h-12 text-red-600" />
        </div>
        
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {finalTitle}
        </h3>
        
        {errorCode && (
          <p className="text-sm text-gray-500 mb-2">
            Error Code: {errorCode}
          </p>
        )}
        
        <p className="text-sm text-gray-600 mb-6 max-w-md">
          {finalMessage}
        </p>
        
        {showDetails && details && (
          <div className="w-full max-w-md mb-6">
            <details className="text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                Technical Details
              </summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                {details}
              </pre>
            </details>
          </div>
        )}
        
        <div className="flex gap-3">
          {onRetry && (
            <Button onClick={onRetry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              {retryText}
            </Button>
          )}
          {onHome && (
            <Button variant="outline" onClick={onHome}>
              <Home className="w-4 h-4 mr-2" />
              {homeText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ErrorState;
