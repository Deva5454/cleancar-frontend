/**
 * PageHeader Component
 * 
 * Standardized page header with title, description, and actions.
 * Ensures consistent page headers across all modules.
 * 
 * @component
 */

import { ReactNode } from "react";
import { Button } from "../../components/ui/button";
import { ChevronLeft } from "lucide-react";

export interface PageHeaderProps {
  /** Page title */
  title: string;
  
  /** Page description */
  description?: string;
  
  /** Show back button */
  showBack?: boolean;
  
  /** Back button handler */
  onBack?: () => void;
  
  /** Primary action button */
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  
  /** Additional actions */
  actions?: ReactNode;
  
  /** Breadcrumbs */
  breadcrumbs?: Array<{ label: string; onClick?: () => void }>;
  
  /** Custom className */
  className?: string;
}

/**
 * PageHeader component for consistent page headers
 * 
 * @example
 * ```tsx
 * <PageHeader
 *   title="User Management"
 *   description="Manage users and their permissions"
 *   primaryAction={{
 *     label: "Add User",
 *     onClick: () => openAddUserForm(),
 *     icon: <Plus />
 *   }}
 * />
 * 
 * <PageHeader
 *   title="Leave Details"
 *   showBack
 *   onBack={() => navigate('/leaves')}
 *   breadcrumbs={[
 *     { label: "Leave Management", onClick: () => navigate('/leaves') },
 *     { label: "Leave Details" }
 *   ]}
 * />
 * ```
 */
export function PageHeader({
  title,
  description,
  showBack = false,
  onBack,
  primaryAction,
  secondaryAction,
  actions,
  breadcrumbs,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-6 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-3">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <span>/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="hover:text-gray-900 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-gray-900">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Back button */}
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-2 -ml-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
          
          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900">
            {title}
          </h1>
          
          {/* Description */}
          {description && (
            <p className="text-gray-600 mt-2 max-w-2xl">
              {description}
            </p>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-3">
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          
          {primaryAction && (
            <Button onClick={primaryAction.onClick}>
              {primaryAction.icon}
              {primaryAction.label}
            </Button>
          )}
          
          {actions}
        </div>
      </div>
    </div>
  );
}

export default PageHeader;
