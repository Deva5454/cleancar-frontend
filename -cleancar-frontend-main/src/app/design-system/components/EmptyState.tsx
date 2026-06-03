/**
 * EmptyState Component
 * 
 * Standardized empty state component for when there's no data.
 * Provides consistent UX across the application.
 * 
 * @component
 */

import { LucideIcon, Inbox, Search, AlertCircle, FileX } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

export interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon;
  
  /** Title message */
  title: string;
  
  /** Description message */
  description?: string;
  
  /** Action button text */
  actionText?: string;
  
  /** Action button handler */
  onAction?: () => void;
  
  /** Type of empty state */
  type?: "default" | "search" | "error" | "no-access";
  
  /** Custom className */
  className?: string;
}

/**
 * Get default icon based on type
 */
function getDefaultIcon(type: EmptyStateProps["type"]): LucideIcon {
  switch (type) {
    case "search":
      return Search;
    case "error":
      return AlertCircle;
    case "no-access":
      return FileX;
    default:
      return Inbox;
  }
}

/**
 * EmptyState component for displaying when there's no data
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   title="No leaves found"
 *   description="You haven't applied for any leaves yet"
 *   actionText="Apply for Leave"
 *   onAction={() => openLeaveForm()}
 * />
 * 
 * <EmptyState
 *   type="search"
 *   title="No results found"
 *   description="Try adjusting your search filters"
 * />
 * ```
 */
export function EmptyState({
  icon,
  title,
  description,
  actionText,
  onAction,
  type = "default",
  className = "",
}: EmptyStateProps) {
  const Icon = icon || getDefaultIcon(type);
  
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-gray-100 rounded-full p-4 mb-4">
          <Icon className="w-12 h-12 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-gray-500 mb-6 max-w-md">
            {description}
          </p>
        )}
        
        {actionText && onAction && (
          <Button onClick={onAction}>
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default EmptyState;
