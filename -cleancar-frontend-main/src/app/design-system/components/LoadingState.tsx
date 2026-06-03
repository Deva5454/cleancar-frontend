/**
 * LoadingState Component
 * 
 * Standardized loading state component.
 * Provides consistent loading UX across the application.
 * 
 * @component
 */

import { Loader2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

export interface LoadingStateProps {
  /** Loading message */
  message?: string;
  
  /** Size of the spinner */
  size?: "sm" | "md" | "lg";
  
  /** Full page loading (centered) */
  fullPage?: boolean;
  
  /** Show in card */
  inCard?: boolean;
  
  /** Custom className */
  className?: string;
}

/**
 * LoadingState component for displaying loading states
 * 
 * @example
 * ```tsx
 * <LoadingState message="Loading data..." />
 * <LoadingState size="lg" fullPage />
 * <LoadingState inCard message="Fetching approvals..." />
 * ```
 */
export function LoadingState({
  message = "Loading...",
  size = "md",
  fullPage = false,
  inCard = false,
  className = "",
}: LoadingStateProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };
  
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-600 animate-spin`} />
      {message && (
        <p className="text-sm text-gray-600">{message}</p>
      )}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }
  
  if (inCard) {
    return (
      <Card>
        <CardContent className="p-12">
          {content}
        </CardContent>
      </Card>
    );
  }
  
  return <div className="py-12">{content}</div>;
}

/**
 * Skeleton loading component
 */
export interface SkeletonProps {
  /** Width */
  width?: string;
  
  /** Height */
  height?: string;
  
  /** Shape */
  variant?: "text" | "circular" | "rectangular";
  
  /** Custom className */
  className?: string;
}

export function Skeleton({
  width = "100%",
  height = "1rem",
  variant = "rectangular",
  className = "",
}: SkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };
  
  return (
    <div
      className={`bg-gray-200 animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Table skeleton loading
 */
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="2rem" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="3rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card skeleton loading
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="p-6">
          <div className="space-y-3">
            <Skeleton height="1.5rem" width="60%" />
            <Skeleton height="4rem" />
            <div className="flex gap-2">
              <Skeleton height="2rem" width="5rem" />
              <Skeleton height="2rem" width="5rem" />
            </div>
          </div>
        </Card>
      ))}
    </>
  );
}

export default LoadingState;
