import { Button } from "../ui/button";
/**
 * Protected Content Component
 *
 * Conditional rendering based on permissions
 * NO HARDCODING - all rules from accessControl.ts
 */

import { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { type EngineType, type Permission, type DataScope } from "../../lib/accessControl";
import { Badge } from "../ui/badge";
import { Lock, Eye, EyeOff } from "lucide-react";

// ==================== PROTECTED CONTENT ====================

interface ProtectedContentProps {
  children: ReactNode;
  engine: EngineType;
  permission: Permission;
  fallback?: ReactNode;
  showFallback?: boolean;
}

/**
 * Show content only if user has permission
 */
export function ProtectedContent({
  children,
  engine,
  permission,
  fallback,
  showFallback = false,
}: ProtectedContentProps) {
  const { can } = usePermissions();

  const hasPermission = can(engine, permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  if (showFallback && fallback) {
    return <>{fallback}</>;
  }

  if (showFallback) {
    return (
      <div className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <Lock className="w-4 h-4 text-gray-400" />
        <p className="text-sm text-gray-600">
          You don't have permission to {permission} {engine} data
        </p>
      </div>
    );
  }

  return null;
}

// ==================== VIEW ONLY ====================

interface ViewOnlyProps {
  children: ReactNode;
  engine: EngineType;
  fallback?: ReactNode;
}

/**
 * Show content only if user can VIEW engine data
 */
export function ViewOnly({ children, engine, fallback }: ViewOnlyProps) {
  return (
    <ProtectedContent engine={engine} permission="view" fallback={fallback}>
      {children}
    </ProtectedContent>
  );
}

// ==================== EDIT ONLY ====================

interface EditOnlyProps {
  children: ReactNode;
  engine: EngineType;
  fallback?: ReactNode;
}

/**
 * Show content only if user can EDIT engine data
 */
export function EditOnly({ children, engine, fallback }: EditOnlyProps) {
  return (
    <ProtectedContent engine={engine} permission="edit" fallback={fallback}>
      {children}
    </ProtectedContent>
  );
}

// ==================== SCOPE-BASED ====================

interface ScopeProtectedProps {
  children: ReactNode;
  engine: EngineType;
  requiredScope: DataScope;
  mode?: "exact" | "minimum";
  fallback?: ReactNode;
}

/**
 * Show content only if user has required data scope
 */
export function ScopeProtected({
  children,
  engine,
  requiredScope,
  mode = "minimum",
  fallback,
}: ScopeProtectedProps) {
  const { hasScope, hasScopeOrBetter } = usePermissions();

  const hasRequiredScope =
    mode === "exact"
      ? hasScope(engine, requiredScope)
      : hasScopeOrBetter(engine, requiredScope);

  if (hasRequiredScope) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ==================== PERMISSION BADGE ====================

interface PermissionBadgeProps {
  engine: EngineType;
  showScope?: boolean;
}

/**
 * Display user's permission level for engine
 */
export function PermissionBadge({ engine, showScope = true }: PermissionBadgeProps) {
  const { canView, canEdit, canCreate, canDelete, canApprove, canExport, getScope } =
    usePermissions();

  const permissions = {
    view: canView(engine),
    edit: canEdit(engine),
    create: canCreate(engine),
    delete: canDelete(engine),
    approve: canApprove(engine),
    export: canExport(engine),
  };

  const scope = getScope(engine);

  // Determine permission level
  let level = "No Access";
  let color = "bg-red-100 text-red-700";

  if (permissions.delete && permissions.approve) {
    level = "Full Control";
    color = "bg-purple-100 text-purple-700";
  } else if (permissions.edit || permissions.create) {
    level = "Edit";
    color = "bg-green-100 text-green-700";
  } else if (permissions.view) {
    level = "View Only";
    color = "bg-blue-100 text-blue-700";
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${color} hover:${color}`}>
        {permissions.view ? (
          <Eye className="w-3 h-3 mr-1" />
        ) : (
          <EyeOff className="w-3 h-3 mr-1" />
        )}
        {level}
      </Badge>
      {showScope && permissions.view && (
        <Badge variant="outline" className="text-xs">
          Scope: {scope}
        </Badge>
      )}
    </div>
  );
}

// ==================== CONDITIONAL BUTTON ====================

interface ConditionalButtonProps {
  engine: EngineType;
  permission: Permission;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Button that's only enabled if user has permission
 */
export function ConditionalButton({
  engine,
  permission,
  children,
  onClick,
  className = "",
  disabled = false,
  variant = "default",
  size = "default",
}: ConditionalButtonProps) {
  const { can } = usePermissions();
  const hasPermission = can(engine, permission);

  // Import Button component
  return (
    <Button
      onClick={onClick}
      disabled={disabled || !hasPermission}
      variant={variant}
      size={size}
      className={className}
    >
      {children}
    </Button>
  );
}

// ==================== ADMIN ONLY ====================

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Show content only for admin roles
 */
export function AdminOnly({ children, fallback }: AdminOnlyProps) {
  const { isAdmin } = usePermissions();

  if (isAdmin) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ==================== MANAGER ONLY ====================

interface ManagerOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Show content only for manager roles
 */
export function ManagerOnly({ children, fallback }: ManagerOnlyProps) {
  const { isManager } = usePermissions();

  if (isManager) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

// ==================== FIELD WORKER ONLY ====================

interface FieldWorkerOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Show content only for field worker roles (Washer, Supervisor)
 */
export function FieldWorkerOnly({ children, fallback }: FieldWorkerOnlyProps) {
  const { isFieldWorker } = usePermissions();

  if (isFieldWorker) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}
