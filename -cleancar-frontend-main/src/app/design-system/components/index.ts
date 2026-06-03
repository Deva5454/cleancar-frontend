/**
 * Design System Components
 * 
 * Centralized export for all design system components.
 * Import from here to use design system components.
 * 
 * @module DesignSystemComponents
 */

// Core components
export { StatusBadge } from "./StatusBadge";
export type { StatusBadgeProps } from "./StatusBadge";

export { DataCard } from "./DataCard";
export type { DataCardProps } from "./DataCard";

export { ApprovalCard } from "./ApprovalCard";
export type { ApprovalCardProps } from "./ApprovalCard";

export { EmptyState } from "./EmptyState";
export type { EmptyStateProps } from "./EmptyState";

export { 
  LoadingState, 
  Skeleton, 
  TableSkeleton, 
  CardSkeleton 
} from "./LoadingState";
export type { LoadingStateProps, SkeletonProps } from "./LoadingState";

export { DataTable } from "./DataTable";
export type { DataTableProps, Column } from "./DataTable";

// Additional components
export { ErrorState } from "./ErrorState";
export type { ErrorStateProps } from "./ErrorState";

export { SuccessState } from "./SuccessState";
export type { SuccessStateProps } from "./SuccessState";

export { PageHeader } from "./PageHeader";
export type { PageHeaderProps } from "./PageHeader";

export { StatCard } from "./StatCard";
export type { StatCardProps } from "./StatCard";

export { InfoCard } from "./InfoCard";
export type { InfoCardProps } from "./InfoCard";

export { FormField } from "./FormField";
export type { FormFieldProps } from "./FormField";

// Re-export design tokens
export { tokens, colors, spacing, fontSize, fontWeight } from "../tokens";