/**
 * Drill-Down Breadcrumb Component
 *
 * Hierarchical navigation: All Cities > City > Cluster
 * Used across analytics components for consistent navigation
 */

import { ChevronRight, Home } from "lucide-react";
import { Button } from "../ui/button";
import { CITY_LABELS, CLUSTER_LABELS, type City, type ClusterId } from "../../lib/constants";

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
  active?: boolean;
}

interface DrillDownBreadcrumbProps {
  level: "all" | "city" | "cluster";
  city?: City;
  cluster?: ClusterId;
  onNavigateToAll: () => void;
  onNavigateToCity: (city: City) => void;
  onNavigateToCluster?: (city: City, cluster: ClusterId) => void;
}

export function DrillDownBreadcrumb({
  level,
  city,
  cluster,
  onNavigateToAll,
  onNavigateToCity,
}: DrillDownBreadcrumbProps) {
  const breadcrumbs: BreadcrumbItem[] = [];

  // All Cities (root level)
  breadcrumbs.push({
    label: "All Cities",
    onClick: onNavigateToAll,
    active: level === "all",
  });

  // City level
  if (level === "city" || level === "cluster") {
    if (city) {
      breadcrumbs.push({
        label: CITY_LABELS[city],
        onClick: () => onNavigateToCity(city),
        active: level === "city",
      });
    }
  }

  // Cluster level
  if (level === "cluster" && cluster) {
    breadcrumbs.push({
      label: CLUSTER_LABELS[cluster as ClusterId],
      onClick: () => {},
      active: true,
    });
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
      <Home className="w-4 h-4 text-gray-500" />
      <div className="flex items-center gap-1">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
            <Button
              variant={crumb.active ? "default" : "ghost"}
              size="sm"
              onClick={crumb.onClick}
              disabled={crumb.active}
              className={crumb.active ? "pointer-events-none" : ""}
            >
              {crumb.label}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
