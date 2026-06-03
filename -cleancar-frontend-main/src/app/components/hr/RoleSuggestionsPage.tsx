/**
 * Role Suggestions Page (MC-12)
 *
 * HR UI for viewing AI-powered role suggestions:
 * - Performance-based promotion recommendations
 * - Confidence scores and gaps analysis
 * - Performance alerts and anomaly detection
 *
 * ROLE PROTECTION: Super Admin, Admin, HR
 */

import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import {
  suggestRole,
  calculatePerformanceScore,
  calculateGrowthPotential,
  generatePerformanceAlerts,
} from "../../utils/roleSuggestionEngine";
import type { EmployeeMetrics } from "../../types/employeeMetrics";
import { BackButton } from "../ui/back-button";

// Mock function to calculate metrics from employee data
// In production, this would aggregate real attendance, jobs, ratings data
function calculateEmployeeMetrics(employeeId: string): EmployeeMetrics {
  // This is mock data - replace with real aggregation from attendance, jobs, ratings
  const mockMetrics: EmployeeMetrics = {
    employeeId,
    jobsCompleted: Math.floor((idx * 137 + 42) % 300),
    jobsAssigned: Math.floor((idx * 113 + 300) % 320) + 300,
    completionRate: 85 + ((idx * 7) % 15),
    customerRating: 3.5 + ((idx * 3) % 15) / 10,
    complaintCount: Math.floor((idx * 11) % 10),
    errorRate: (idx * 5) % 15,
    avgJobTime: 45 + ((idx * 9) % 30),
    overtimeHours: Math.floor((idx * 13) % 20),
    attendanceRate: 75 + Math.random() * 25,
    lateCount: Math.floor(Math.random() * 15),
    totalDaysWorked: 90 + Math.floor(Math.random() * 200),
    periodStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    periodEnd: new Date().toISOString(),
    calculatedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  return mockMetrics;
}

export function RoleSuggestionsPage() {
  const { currentUser } = useRole();
  const { employees } = useEmployee();

  const [filterType, setFilterType] = useState<string>("ALL");

  // Role protection
  if (!currentUser || !["Super Admin", "Admin", "HR"].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Only Super Admin, Admin, and HR can view role suggestions.
          </p>
        </div>
      </div>
    );
  }

  const cityEmployees = employees.filter((e) => e.cityId === currentUser.cityId);

  // Generate suggestions for all employees
  const suggestions = useMemo(() => {
    return cityEmployees.map((employee) => {
      const metrics = calculateEmployeeMetrics(employee.employeeId);
      const suggestion = suggestRole(employee.role as string, metrics);
      const performanceScore = calculatePerformanceScore(metrics);
      const growthPotential = calculateGrowthPotential(metrics);
      const alerts = generatePerformanceAlerts(
        `${employee.firstName} ${employee.lastName}`,
        employee.role as string,
        metrics,
        suggestion
      );

      return {
        employee,
        metrics,
        suggestion,
        performanceScore,
        growthPotential,
        alerts,
      };
    });
  }, [cityEmployees]);

  // Filter suggestions
  const filteredSuggestions = useMemo(() => {
    if (filterType === "PROMOTION_READY") {
      return suggestions.filter((s) => s.suggestion.readyForPromotion);
    }
    if (filterType === "UNDERPERFORMING") {
      return suggestions.filter((s) => s.performanceScore < 60);
    }
    if (filterType === "HIGH_POTENTIAL") {
      return suggestions.filter((s) => s.growthPotential >= 70);
    }
    return suggestions;
  }, [suggestions, filterType]);

  const stats = useMemo(() => {
    const promotionReady = suggestions.filter((s) => s.suggestion.readyForPromotion).length;
    const underperforming = suggestions.filter((s) => s.performanceScore < 60).length;
    const highPotential = suggestions.filter((s) => s.growthPotential >= 70).length;
    const avgPerformance =
      suggestions.reduce((sum, s) => sum + s.performanceScore, 0) / suggestions.length || 0;

    return {
      promotionReady,
      underperforming,
      highPotential,
      avgPerformance: avgPerformance.toFixed(1),
    };
  }, [suggestions]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-700 bg-green-100";
    if (confidence >= 70) return "text-blue-700 bg-blue-100";
    if (confidence >= 50) return "text-yellow-700 bg-yellow-100";
    return "text-gray-700 bg-gray-100";
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-700";
    return "text-red-700";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Role Suggestions</h1>
          <p className="text-sm text-gray-600">
            Performance-based role recommendations for {currentUser.cityId}
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.promotionReady}</div>
              <div className="text-xs text-green-600 mt-1">Ready for Promotion</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.underperforming}</div>
              <div className="text-xs text-red-600 mt-1">Underperforming</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{stats.highPotential}</div>
              <div className="text-xs text-blue-600 mt-1">High Potential</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-700">{stats.avgPerformance}</div>
              <div className="text-xs text-gray-600 mt-1">Avg Performance</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1 text-sm rounded ${
                filterType === "ALL" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
              }`}
            >
              All Employees
            </button>
            <button
              onClick={() => setFilterType("PROMOTION_READY")}
              className={`px-3 py-1 text-sm rounded ${
                filterType === "PROMOTION_READY"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Promotion Ready
            </button>
            <button
              onClick={() => setFilterType("UNDERPERFORMING")}
              className={`px-3 py-1 text-sm rounded ${
                filterType === "UNDERPERFORMING"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Underperforming
            </button>
            <button
              onClick={() => setFilterType("HIGH_POTENTIAL")}
              className={`px-3 py-1 text-sm rounded ${
                filterType === "HIGH_POTENTIAL"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              High Potential
            </button>
          </div>
        </div>

        {/* Suggestions List */}
        <div className="space-y-4">
          {filteredSuggestions.map(({ employee, metrics, suggestion, performanceScore, growthPotential, alerts }) => (
            <div
              key={employee.employeeId}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {suggestion.currentRole}
                    </span>
                    {suggestion.readyForPromotion && (
                      <>
                        <span className="text-gray-400">→</span>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">
                          {suggestion.suggestedRole}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <div className="text-xs text-gray-600">Performance</div>
                      <div className={`text-2xl font-bold ${getPerformanceColor(performanceScore)}`}>
                        {performanceScore}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Growth Potential</div>
                      <div className="text-2xl font-bold text-blue-700">{growthPotential}/100</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600">Confidence</div>
                      <div
                        className={`text-2xl font-bold px-2 py-1 rounded inline-block ${getConfidenceColor(suggestion.confidence)}`}
                      >
                        {suggestion.confidence}%
                      </div>
                    </div>
                  </div>

                  {suggestion.reasons.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-gray-700 mb-1">Strengths:</div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {suggestion.reasons.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {suggestion.gaps.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-medium text-gray-700 mb-1">Areas to Improve:</div>
                      <ul className="text-sm text-gray-600 list-disc list-inside">
                        {suggestion.gaps.map((gap, idx) => (
                          <li key={idx}>{gap}</li>
                        ))}
                      </ul>
                      {suggestion.estimatedReadinessDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          Est. ready by: {new Date(suggestion.estimatedReadinessDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {alerts.length > 0 && (
                    <div className="mt-4">
                      {alerts.map((alert, idx) => (
                        <div
                          key={idx}
                          className={`text-xs px-3 py-2 rounded mb-2 ${
                            alert.severity === "CRITICAL"
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : alert.severity === "HIGH"
                              ? "bg-orange-50 text-orange-700 border border-orange-200"
                              : alert.severity === "MEDIUM"
                              ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                              : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          <div className="font-medium">{alert.message}</div>
                          <div className="mt-1">{alert.recommendedAction}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ml-4">
                  {suggestion.readyForPromotion && (
                    <button className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                      Promote
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
