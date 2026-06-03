/**
 * DATA STATE BADGE (V7)
 * Shows current data state: LIVE, ESTIMATED, or LOCKED
 * Critical for CM understanding data reliability
 */

import { Badge } from "../ui/badge";
import { Activity, TrendingUp, Lock } from "lucide-react";
import type { DataState } from "../../types/clusterManager.types";
import { DATA_STATE_CONFIG } from "../../constants/clusterManager.constants";

interface CMDataStateBadgeProps {
  state: DataState;
  className?: string;
}

export function CMDataStateBadge({ state, className = "" }: CMDataStateBadgeProps) {
  const config = DATA_STATE_CONFIG[state];

  const getIcon = () => {
    if (state === "LIVE") return <Activity className="w-3 h-3" />;
    if (state === "ESTIMATED") return <TrendingUp className="w-3 h-3" />;
    return <Lock className="w-3 h-3" />;
  };

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 ${config.borderColor} ${config.textColor} ${className}`}
    >
      {getIcon()}
      {config.label}
    </Badge>
  );
}
