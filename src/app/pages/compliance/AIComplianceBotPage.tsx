/**
 * AI Compliance Bot Dashboard
 *
 * Intelligent monitoring and auto-update system for compliance rules
 *
 * Features:
 * - Detected regulatory changes
 * - Impact analysis with employee/financial breakdown
 * - One-click apply for automated updates
 * - Compliance health monitoring
 *
 * Route: /compliance/ai-bot
 */

import { useState } from "react";
import {
  Bot,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  getDetectedChanges,
  analyzeChangeImpact,
  applyComplianceChange,
  dismissComplianceChange,
  getComplianceHealthScore,
} from "../../services/compliance/aiComplianceBot";
import type { ComplianceChange } from "../../services/compliance/aiComplianceBot";

export default function AIComplianceBotPage() {
  const [selectedChange, setSelectedChange] = useState<string | null>(null);
  const [expandedChange, setExpandedChange] = useState<string | null>(null);

  const changes = getDetectedChanges();
  const healthScore = getComplianceHealthScore();

  const handleApply = (changeId: string) => {
    const result = applyComplianceChange(changeId);
    if (result.success) {
      alert(`✅ ${result.message}\n\nUpdated: ${result.updatedRules.join(", ")}`);
      window.location.reload();
    } else {
      alert(`❌ ${result.message}`);
    }
  };

  const handleDismiss = (changeId: string) => {
    const reason = prompt("Reason for dismissing this change:");
    if (reason) {
      const result = dismissComplianceChange(changeId, reason);
      alert(result.message);
      window.location.reload();
    }
  };

  const getChangeAnalysis = (changeId: string) => {
    return analyzeChangeImpact(changeId);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <Bot className="w-8 h-8" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">AI Compliance Bot</h1>
              <p className="text-purple-100 mt-1">
                Intelligent monitoring and auto-update system for compliance rules
              </p>
            </div>
          </div>
        </div>

        {/* Health Score Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Overall Health */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-600">Compliance Health</h3>
              <div
                className={`px-3 py-1 rounded-full text-sm font-bold ${
                  healthScore.grade === "A"
                    ? "bg-green-500 text-white"
                    : healthScore.grade === "B"
                    ? "bg-blue-500 text-white"
                    : healthScore.grade === "C"
                    ? "bg-yellow-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {healthScore.grade}
              </div>
            </div>
            <div className="text-4xl font-bold text-gray-900">{healthScore.score}%</div>
            <p className="text-xs text-gray-600 mt-2">{healthScore.recommendation}</p>
          </div>

          {/* Issue Breakdown */}
          {healthScore.issues.map((issue) => (
            <div
              key={issue.severity}
              className={`p-6 rounded-lg border shadow-sm ${
                issue.severity === "critical"
                  ? "bg-red-50 border-red-200"
                  : issue.severity === "high"
                  ? "bg-orange-50 border-orange-200"
                  : issue.severity === "medium"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <div
                className={`text-xs font-medium uppercase mb-2 ${
                  issue.severity === "critical"
                    ? "text-red-700"
                    : issue.severity === "high"
                    ? "text-orange-700"
                    : issue.severity === "medium"
                    ? "text-yellow-700"
                    : "text-blue-700"
                }`}
              >
                {issue.severity}
              </div>
              <div
                className={`text-3xl font-bold ${
                  issue.severity === "critical"
                    ? "text-red-900"
                    : issue.severity === "high"
                    ? "text-orange-900"
                    : issue.severity === "medium"
                    ? "text-yellow-900"
                    : "text-blue-900"
                }`}
              >
                {issue.count}
              </div>
              <p
                className={`text-xs mt-1 ${
                  issue.severity === "critical"
                    ? "text-red-600"
                    : issue.severity === "high"
                    ? "text-orange-600"
                    : issue.severity === "medium"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              >
                {issue.count === 1 ? "Issue" : "Issues"} detected
              </p>
            </div>
          ))}
        </div>

        {/* Detected Changes */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Detected Compliance Changes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {changes.length} regulatory update{changes.length !== 1 ? "s" : ""} pending review
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {changes.map((change) => {
              const isExpanded = expandedChange === change.id;
              const analysis = isExpanded ? getChangeAnalysis(change.id) : null;

              return (
                <div key={change.id} className="p-6">
                  {/* Change Header */}
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-lg flex-shrink-0 ${
                        change.severity === "critical"
                          ? "bg-red-100"
                          : change.severity === "high"
                          ? "bg-orange-100"
                          : change.severity === "medium"
                          ? "bg-yellow-100"
                          : "bg-blue-100"
                      }`}
                    >
                      <AlertTriangle
                        className={`w-6 h-6 ${
                          change.severity === "critical"
                            ? "text-red-600"
                            : change.severity === "high"
                            ? "text-orange-600"
                            : change.severity === "medium"
                            ? "text-yellow-600"
                            : "text-blue-600"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {change.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{change.description}</p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex-shrink-0 ${
                            change.severity === "critical"
                              ? "bg-red-600 text-white"
                              : change.severity === "high"
                              ? "bg-orange-600 text-white"
                              : change.severity === "medium"
                              ? "bg-yellow-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {change.severity}
                        </span>
                      </div>

                      {/* Quick Stats */}
                      <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{change.affectedEmployees} employees</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span
                            className={
                              change.impact.financialImpact > 0
                                ? "text-red-600"
                                : "text-green-600"
                            }
                          >
                            {change.impact.financialImpact > 0 ? "+" : ""}₹
                            {Math.abs(change.impact.financialImpact).toLocaleString()} /month
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>
                            Effective{" "}
                            {change.effectiveFrom.toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Impact Summary */}
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Impact Summary
                        </div>
                        <p className="text-sm text-gray-900">{change.impact.summary}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {change.impact.affectedComponents.map((component) => (
                            <span
                              key={component}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded"
                            >
                              {component}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4">
                        {change.suggestedAction.automated ? (
                          <button
                            onClick={() => handleApply(change.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Apply Update
                          </button>
                        ) : (
                          <button
                            onClick={() => setExpandedChange(isExpanded ? null : change.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-4 h-4" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-4 h-4" />
                                View Action Plan
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => handleDismiss(change.id)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>

                        {change.referenceUrl && (
                          <a
                            href={change.referenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Official Notice
                          </a>
                        )}
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && analysis && (
                        <div className="mt-6 space-y-4">
                          {/* Action Steps */}
                          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-blue-900 mb-3">
                              {change.suggestedAction.title}
                            </h4>
                            <ol className="space-y-2">
                              {change.suggestedAction.steps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                  <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  <span className="text-blue-900">{step}</span>
                                </li>
                              ))}
                            </ol>
                          </div>

                          {/* Timeline */}
                          <div className="p-4 border border-gray-200 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">
                              Implementation Timeline
                            </h4>
                            <div className="space-y-3">
                              {analysis.detailedImpact.timeline.map((item, index) => (
                                <div key={index} className="flex items-start gap-3">
                                  <div
                                    className={`w-2 h-2 rounded-full mt-1.5 ${
                                      item.status === "completed"
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                    }`}
                                  />
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {item.action}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {item.date.toLocaleDateString("en-IN", {
                                        month: "long",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </div>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                                      item.status === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
