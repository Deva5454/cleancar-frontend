import { BackButton } from "../ui/back-button";
// Performance Tracking Module
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { useRole } from "../../contexts/RoleContext";
import { getRoleTargets } from "../../lib/roleConfig";
import { Award, TrendingUp, Target, AlertCircle } from "lucide-react";

interface PerformanceMetric {
  metric: string;
  target: number;
  achieved: number;
  unit: string;
  period: "Daily" | "Monthly";
}

const performanceData: Record<string, PerformanceMetric[]> = {
  "Car Washer": [
    { metric: "Washes Completed", target: 15, achieved: 12, unit: "washes", period: "Daily" },
    { metric: "Average Wash Time", target: 25, achieved: 24, unit: "minutes", period: "Daily" },
    { metric: "Quality Score", target: 8, achieved: 8.5, unit: "/10", period: "Monthly" },
    { metric: "Customer Ratings", target: 4, achieved: 4.2, unit: "/5", period: "Monthly" },
  ],
  "TSE": [
    { metric: "Calls Made", target: 80, achieved: 72, unit: "calls", period: "Daily" },
    { metric: "Conversions", target: 15, achieved: 14, unit: "leads", period: "Monthly" },
    { metric: "Call Duration", target: 5, achieved: 6.2, unit: "minutes", period: "Daily" },
    { metric: "Conversion Rate", target: 18, achieved: 19.4, unit: "%", period: "Monthly" },
  ],
  "TSM": [
    { metric: "Personal Calls", target: 80, achieved: 85, unit: "calls", period: "Daily" },
    { metric: "Personal Conversions", target: 20, achieved: 22, unit: "leads", period: "Monthly" },
    { metric: "Team Conversions", target: 100, achieved: 95, unit: "leads", period: "Monthly" },
    { metric: "Team Management", target: 90, achieved: 92, unit: "%", period: "Monthly" },
  ],
  "Operations Manager": [
    { metric: "BTL Activities", target: 5, achieved: 4, unit: "events", period: "Monthly" },
    { metric: "Society Tie-ups", target: 3, achieved: 3, unit: "societies", period: "Monthly" },
    { metric: "Team Quality Score", target: 8.5, achieved: 8.6, unit: "/10", period: "Monthly" },
    { metric: "Complaint Resolution", target: 95, achieved: 96, unit: "%", period: "Monthly" },
  ],
  "CCE": [
    { metric: "Complaints Resolved", target: 5, achieved: 6, unit: "tickets", period: "Daily" },
    { metric: "Avg Resolution Time", target: 6, achieved: 4.2, unit: "hours", period: "Daily" },
    { metric: "Customer Satisfaction", target: 85, achieved: 88, unit: "%", period: "Monthly" },
    { metric: "SLA Compliance", target: 95, achieved: 97, unit: "%", period: "Monthly" },
  ],
};

export function PerformanceTracking() {
  const { currentRole, currentUser } = useRole();
  
  const metrics = performanceData[currentRole] || [];
  const targets = getRoleTargets(currentRole);

  const calculatePerformanceScore = (metrics: PerformanceMetric[]): number => {
    if (metrics.length === 0) return 0;
    const totalScore = metrics.reduce((sum, m) => {
      const percentage = (m.achieved / m.target) * 100;
      return sum + Math.min(percentage, 120); // Cap at 120%
    }, 0);
    return Math.round(totalScore / metrics.length);
  };

  const performanceScore = calculatePerformanceScore(metrics);

  const getPerformanceGrade = (score: number): { grade: string; color: string; message: string } => {
    if (score >= 100) return { grade: "A+", color: "text-green-600", message: "Excellent" };
    if (score >= 90) return { grade: "A", color: "text-green-600", message: "Very Good" };
    if (score >= 80) return { grade: "B", color: "text-blue-600", message: "Good" };
    if (score >= 70) return { grade: "C", color: "text-orange-600", message: "Average" };
    return { grade: "D", color: "text-red-600", message: "Needs Improvement" };
  };

  const performanceGrade = getPerformanceGrade(performanceScore);

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h2 className="text-2xl font-bold">Performance Tracking</h2>
        <p className="text-sm text-gray-600 mt-1">Monitor your performance metrics and targets</p>
      </div>

      {/* Overall Performance Score */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <div className="bg-blue-600 text-white p-4 rounded-lg">
                <Award className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Overall Performance Score</p>
                <div className="flex items-baseline gap-3 mt-1">
                  <p className="text-4xl font-bold text-blue-600">{performanceScore}%</p>
                  <Badge className={`${performanceGrade.color} bg-white border-2 text-lg px-3 py-1`}>
                    Grade {performanceGrade.grade}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{performanceGrade.message} Performance</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentRole}</p>
              <p className="text-xs text-gray-500">{currentUser.city}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target vs Achievement */}
      {metrics.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Target vs Achievement
            </h3>
            <div className="space-y-4">
              {metrics.map((metric, idx) => {
                const achievement = (metric.achieved / metric.target) * 100;
                const isOnTarget = achievement >= 90;
                const isExceeding = achievement >= 100;

                return (
                  <div key={idx} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{metric.metric}</p>
                        <Badge variant="outline" className="text-xs">{metric.period}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Target: <span className="font-semibold">{metric.target} {metric.unit}</span>
                          </p>
                          <p className={`text-sm font-bold ${
                            isExceeding ? "text-green-600" : 
                            isOnTarget ? "text-blue-600" : 
                            "text-orange-600"
                          }`}>
                            Achieved: {metric.achieved} {metric.unit}
                          </p>
                        </div>
                        <Badge variant={
                          isExceeding ? "secondary" : 
                          isOnTarget ? "default" : 
                          "destructive"
                        }>
                          {Math.round(achievement)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          isExceeding ? "bg-green-600" : 
                          isOnTarget ? "bg-blue-600" : 
                          "bg-orange-600"
                        }`}
                        style={{ width: `${Math.min(achievement, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No performance metrics defined for your role</p>
          </CardContent>
        </Card>
      )}

      {/* Performance Trends */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Performance Trends
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-green-600">{performanceScore}%</p>
              <p className="text-xs text-gray-500 mt-1">+5% vs last month</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Quarter Average</p>
              <p className="text-2xl font-bold text-blue-600">{performanceScore - 2}%</p>
              <p className="text-xs text-gray-500 mt-1">Jan-Mar 2026</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Yearly Rank</p>
              <p className="text-2xl font-bold text-purple-600">#3</p>
              <p className="text-xs text-gray-500 mt-1">Out of 12 in role</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
