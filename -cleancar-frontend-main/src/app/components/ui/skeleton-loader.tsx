/**
 * ✅ Skeleton loader for async data states
 * Use instead of showing empty screens while data loads
 */
import { cn } from "../../lib/utils";

interface SkeletonProps { className?: string; }

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-gray-200", className)} />;
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="border rounded-lg p-6 space-y-4">
        <Skeleton className="h-6 w-48" />
        <TableSkeleton rows={6} />
      </div>
    </div>
  );
}
