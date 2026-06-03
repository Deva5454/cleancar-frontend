/**
 * INSIGHT LAYER (V8)
 * Smart suggestions based on data patterns
 * Helps CM understand what actions to take based on sales + ops data
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Lightbulb, AlertTriangle, Info, TrendingUp, ArrowRight } from "lucide-react";
import type { InsightSuggestion } from "../../types/clusterManager.types";

interface CMInsightLayerProps {
  insights: InsightSuggestion[];
}

export function CMInsightLayer({ insights }: CMInsightLayerProps) {
  const getSeverityConfig = (severity: InsightSuggestion["severity"]) => {
    if (severity === "ACTION_REQUIRED") {
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        badgeColor: "bg-red-600",
        badgeLabel: "Action Required",
      };
    }
    if (severity === "ATTENTION") {
      return {
        bgColor: "bg-amber-50",
        borderColor: "border-amber-300",
        icon: <Lightbulb className="w-5 h-5 text-amber-600" />,
        badgeColor: "bg-amber-600",
        badgeLabel: "Attention",
      };
    }
    return {
      bgColor: "bg-blue-50",
      borderColor: "border-blue-300",
      icon: <Info className="w-5 h-5 text-blue-600" />,
      badgeColor: "bg-blue-600",
      badgeLabel: "Info",
    };
  };

  const getTypeIcon = (type: InsightSuggestion["type"]) => {
    const iconMap = {
      CONVERSION: TrendingUp,
      RETENTION: AlertTriangle,
      REVENUE: TrendingUp,
      OPS: Info,
      CRM: Lightbulb,
    };
    const Icon = iconMap[type];
    return <Icon className="w-4 h-4" />;
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-slate-900">Smart Insights</h3>
        <Badge variant="outline" className="text-xs">
          AI-Driven Recommendations
        </Badge>
      </div>

      {insights.map((insight) => {
        const config = getSeverityConfig(insight.severity);
        return (
          <Card
            key={insight.id}
            className={`p-4 border-2 ${config.borderColor} ${config.bgColor}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-slate-900 text-sm">{insight.title}</h4>
                  <Badge className={`${config.badgeColor} text-white text-xs`}>
                    {config.badgeLabel}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {insight.dataSource}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-700">Insight: </span>
                    <span className="text-slate-900">{insight.insight}</span>
                  </div>

                  <div className="flex items-start gap-2 p-2 bg-white rounded border border-slate-200">
                    <ArrowRight className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-700">Recommendation: </span>
                      <span className="text-slate-900">{insight.recommendation}</span>
                    </div>
                  </div>

                  {insight.relatedOM && (
                    <div className="text-xs text-slate-600">
                      <strong>Related OM:</strong> {insight.relatedOM}
                    </div>
                  )}
                </div>

                {insight.severity === "ACTION_REQUIRED" && (
                  <div className="mt-3">
                    <Button size="sm" className="gap-2 bg-red-600 hover:bg-red-700 text-xs">
                      <AlertTriangle className="w-3 h-3" />
                      Create Intervention
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
