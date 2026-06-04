/**
 * Smart Insights Panel
 * Displays AI-generated business suggestions
 */

import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Lightbulb,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Target,
  Zap,
  Award,
  Info,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import type { BusinessSuggestion, DecisionEngineResult } from "../../services/decisionEngine";
import { getPriorityColor, getHealthColor } from "../../services/decisionEngine";

interface SmartInsightsPanelProps {
  result: DecisionEngineResult;
  compact?: boolean;
}

export function SmartInsightsPanel({ result, compact = false }: SmartInsightsPanelProps) {
  const criticalCount = result.suggestions.filter(s => s.priority === "CRITICAL").length;
  const warningCount = result.suggestions.filter(s => s.priority === "WARNING").length;
  const opportunityCount = result.suggestions.filter(s => s.priority === "OPPORTUNITY").length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "REVENUE": return <DollarSign className="w-4 h-4" />;
      case "COST": return <TrendingDown className="w-4 h-4" />;
      case "MARGIN": return <Target className="w-4 h-4" />;
      case "GROWTH": return <TrendingUp className="w-4 h-4" />;
      case "EFFICIENCY": return <Zap className="w-4 h-4" />;
      case "INCENTIVE": return <Award className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "CRITICAL": return <AlertCircle className="w-5 h-5" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5" />;
      case "OPPORTUNITY": return <CheckCircle2 className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold">Smart Insights</h3>
          <Badge className={getHealthColor(result.overallHealth)}>
            {result.overallHealth}
          </Badge>
        </div>

        {result.suggestions.length === 0 ? (
          <p className="text-sm text-gray-600">No suggestions at this time. Performance is stable.</p>
        ) : (
          <div className="space-y-2">
            {result.suggestions.slice(0, 3).map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 rounded border ${getPriorityColor(suggestion.priority)}`}
              >
                <div className="flex items-start gap-2">
                  {getPriorityIcon(suggestion.priority)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{suggestion.message}</p>
                    <p className="text-xs mt-1">{suggestion.action}</p>
                  </div>
                </div>
              </div>
            ))}
            {result.suggestions.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{result.suggestions.length - 3} more suggestions
              </p>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Lightbulb className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold">Smart Business Insights</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getHealthColor(result.overallHealth)}>
            {result.overallHealth}
          </Badge>
          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
            Score: {result.score}/100
          </Badge>
        </div>
      </div>

      {/* Summary Stats */}
      {(criticalCount > 0 || warningCount > 0 || opportunityCount > 0) && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <div className="text-xs text-red-600 font-medium">Critical</div>
            <div className="text-2xl font-bold text-red-700">{criticalCount}</div>
          </div>
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="text-xs text-yellow-600 font-medium">Warnings</div>
            <div className="text-2xl font-bold text-yellow-700">{warningCount}</div>
          </div>
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <div className="text-xs text-green-600 font-medium">Opportunities</div>
            <div className="text-2xl font-bold text-green-700">{opportunityCount}</div>
          </div>
        </div>
      )}

      {/* Suggestions List */}
      {result.suggestions.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">All metrics within target ranges</p>
          <p className="text-sm text-gray-500 mt-1">No immediate action required</p>
        </div>
      ) : (
        <div className="space-y-3">
          {result.suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={`p-4 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-2">
                {getPriorityIcon(suggestion.priority)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-sm">{suggestion.message}</h4>
                    <div className="flex items-center gap-1 text-xs">
                      {getCategoryIcon(suggestion.category)}
                      <span className="font-medium">{suggestion.category}</span>
                    </div>
                  </div>
                </div>
                <Badge className={
                  suggestion.impact === "HIGH" ? "bg-red-100 text-red-700 border-red-200" :
                  suggestion.impact === "MEDIUM" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                  "bg-blue-100 text-blue-700 border-blue-200"
                }>
                  {suggestion.impact} Impact
                </Badge>
              </div>

              {/* Action */}
              <div className="ml-8 mb-2">
                <div className="text-xs font-medium text-gray-600 mb-1">Recommended Action:</div>
                <p className="text-sm font-medium">{suggestion.action}</p>
              </div>

              {/* Reasoning */}
              <div className="ml-8">
                <div className="text-xs font-medium text-gray-600 mb-1">Why This Matters:</div>
                <p className="text-xs text-gray-700">{suggestion.reasoning}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date(result.generatedAt).toLocaleString()}
        </p>
      </div>
    </Card>
  );
}
