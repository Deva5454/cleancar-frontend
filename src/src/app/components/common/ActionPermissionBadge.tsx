/**
 * Action Permission Badge - Shows user's permission level for an action
 *
 * Displays badges: Primary (green), Request (yellow), View Only (gray)
 */

import React from "react";
import type { ActionPermission } from "../../services/ActionOwnershipModel";

interface ActionPermissionBadgeProps {
  permission: ActionPermission;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ActionPermissionBadge({
  permission,
  size = "md",
  className = "",
}: ActionPermissionBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const permissionConfig = {
    Primary: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: "✓",
      label: "Primary",
    },
    Request: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: "↑",
      label: "Request",
    },
    "View Only": {
      bg: "bg-gray-100",
      text: "text-gray-600",
      border: "border-gray-200",
      icon: "👁",
      label: "View Only",
    },
  };

  const config = permissionConfig[permission];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} ${className}`}
    >
      <span className="leading-none">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

interface ActionPermissionInfoProps {
  action: string;
  permission: ActionPermission;
  primaryOwner: string;
  showDetails?: boolean;
  className?: string;
}

export function ActionPermissionInfo({
  action,
  permission,
  primaryOwner,
  showDetails = true,
  className = "",
}: ActionPermissionInfoProps) {
  const descriptions = {
    Primary: `You can directly ${action.toLowerCase().replace(/_/g, " ")}`,
    Request: `You can request ${action.toLowerCase().replace(/_/g, " ")} (approval required by ${primaryOwner})`,
    "View Only": `You can only view ${action.toLowerCase().replace(/_/g, " ")} (contact ${primaryOwner} to modify)`,
  };

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <ActionPermissionBadge permission={permission} />
      {showDetails && (
        <div className="flex-1 text-sm text-gray-600">
          <p>{descriptions[permission]}</p>
          {permission !== "Primary" && (
            <p className="mt-1 text-xs text-gray-500">
              Primary owner: <span className="font-medium">{primaryOwner}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

interface ActionPermissionButtonProps {
  permission: ActionPermission;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

export function ActionPermissionButton({
  permission,
  onClick,
  label,
  disabled = false,
  className = "",
}: ActionPermissionButtonProps) {
  const buttonConfig = {
    Primary: {
      base: "bg-green-600 hover:bg-green-700 text-white",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    Request: {
      base: "bg-yellow-600 hover:bg-yellow-700 text-white",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
    "View Only": {
      base: "bg-gray-400 text-gray-700 cursor-not-allowed",
      disabled: "bg-gray-300 text-gray-500 cursor-not-allowed",
    },
  };

  const config = buttonConfig[permission];
  const isDisabled = disabled || permission === "View Only";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        isDisabled ? config.disabled : config.base
      } ${className}`}
    >
      {permission === "Request" && <span>↑</span>}
      {permission === "Primary" && <span>✓</span>}
      {permission === "View Only" && <span>👁</span>}
      <span>
        {permission === "Request" ? `Request ${label}` : label}
      </span>
    </button>
  );
}
