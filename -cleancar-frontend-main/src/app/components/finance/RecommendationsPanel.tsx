import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertCircle,
  TrendingDown,
  Droplet,
  AlertTriangle,
  Users,
  Wrench,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import {
  type Recommendation,
  type RecommendationPriority,
  type DiagnosisCategory,
  getPriorityColor,
  getStatusColor,
  countByPriority,
  countByStatus,
} from "../../data/recommendationEngine";
import {
  MOCK_RECOMMENDATIONS,
  getActiveRecommendations,
  getCompletedRecommendations,
} from "../../data/recommendationMockData";
import { RecommendationCard } from "./RecommendationCard";

interface RecommendationsPanelProps {
  entityType?: "Company" | "Zone" | "Washer" | "Supervisor";
  entityId?: string;
  entityName?: string;
  period?: string;
}

export function RecommendationsPanel({
  entityType,
  entityId,
  entityName,
  period = "March 2026",
}: RecommendationsPanelProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Filter recommendations based on props
  let recommendations = MOCK_RECOMMENDATIONS;
  
  if (entityType && entityId) {
    recommendations = recommendations.filter(
      (r) => r.entityType === entityType && r.entityId === entityId
    );
  }
  
  if (period) {
    recommendations = recommendations.filter((r) => r.period === period);
  }
  
  const activeRecommendations = recommendations.filter(r => r.status !== "Completed");
  const completedRecommendations = recommendations.filter(r => r.status === "Completed");
  
  const priorityCounts = countByPriority(activeRecommendations);
  const statusCounts = countByStatus(activeRecommendations);
  
  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const expandAll = () => {
    setExpandedCards(new Set(activeRecommendations.map(r => r.id)));
  };
  
  const collapseAll = () => {
    setExpandedCards(new Set());
  };
  
  if (activeRecommendations.length === 0 && completedRecommendations.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <div className="font-bold text-green-900">
                No Recommendations — All Metrics Healthy
              </div>
              <div className="text-sm text-green-700 mt-1">
                All cost components are within acceptable ranges for {entityName || "this entity"} in {period}.
                The recommendation engine will continue to monitor for any variances.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <AlertCircle className="w-6 h-6 text-blue-600" />
                Recommendations for {entityName || "Selected Entity"} — {period}
              </CardTitle>
              <div className="text-sm text-gray-500 mt-1">
                Auto-generated insights based on actual vs ideal cost analysis
              </div>
            </div>
            
            {/* Priority Breakdown */}
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-300 px-3 py-1"
              >
                {priorityCounts.high} High Priority
              </Badge>
              <Badge
                variant="outline"
                className="bg-amber-100 text-amber-800 border-amber-300 px-3 py-1"
              >
                {priorityCounts.medium} Medium
              </Badge>
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-300 px-3 py-1"
              >
                {priorityCounts.low} Low
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {/* Quick Stats */}
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Total Active</div>
              <div className="text-3xl font-bold text-blue-900">
                {activeRecommendations.length}
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-700 mb-1 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Not Started
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {statusCounts.notStarted}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                In Progress
              </div>
              <div className="text-3xl font-bold text-blue-900">
                {statusCounts.inProgress}
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Completed
              </div>
              <div className="text-3xl font-bold text-green-900">
                {completedRecommendations.length}
              </div>
            </div>
          </div>
          
          {/* Expand/Collapse Controls */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="text-xs"
            >
              <ChevronDown className="w-3 h-3 mr-1" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="text-xs"
            >
              <ChevronUp className="w-3 h-3 mr-1" />
              Collapse All
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs: Active and Resolved */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Active ({activeRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved ({completedRecommendations.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Active Recommendations */}
        <TabsContent value="active" className="space-y-4">
          {activeRecommendations.length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="font-medium text-green-900">
                    No active recommendations — all metrics healthy!
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* High Priority */}
              {activeRecommendations.filter(r => r.priority === "High").length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-red-500 rounded"></div>
                    <h3 className="font-bold text-red-900">
                      High Priority ({activeRecommendations.filter(r => r.priority === "High").length})
                    </h3>
                  </div>
                  {activeRecommendations
                    .filter(r => r.priority === "High")
                    .map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        isExpanded={expandedCards.has(rec.id)}
                        onToggle={() => toggleCard(rec.id)}
                      />
                    ))}
                </div>
              )}
              
              {/* Medium Priority */}
              {activeRecommendations.filter(r => r.priority === "Medium").length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-amber-500 rounded"></div>
                    <h3 className="font-bold text-amber-900">
                      Medium Priority ({activeRecommendations.filter(r => r.priority === "Medium").length})
                    </h3>
                  </div>
                  {activeRecommendations
                    .filter(r => r.priority === "Medium")
                    .map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        isExpanded={expandedCards.has(rec.id)}
                        onToggle={() => toggleCard(rec.id)}
                      />
                    ))}
                </div>
              )}
              
              {/* Low Priority */}
              {activeRecommendations.filter(r => r.priority === "Low").length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gray-400 rounded"></div>
                    <h3 className="font-bold text-gray-700">
                      Low Priority ({activeRecommendations.filter(r => r.priority === "Low").length})
                    </h3>
                  </div>
                  {activeRecommendations
                    .filter(r => r.priority === "Low")
                    .map((rec) => (
                      <RecommendationCard
                        key={rec.id}
                        recommendation={rec}
                        isExpanded={expandedCards.has(rec.id)}
                        onToggle={() => toggleCard(rec.id)}
                      />
                    ))}
                </div>
              )}
            </>
          )}
        </TabsContent>
        
        {/* Resolved Recommendations */}
        <TabsContent value="resolved" className="space-y-4">
          {completedRecommendations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  No resolved recommendations yet
                </div>
              </CardContent>
            </Card>
          ) : (
            completedRecommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                isExpanded={expandedCards.has(rec.id)}
                onToggle={() => toggleCard(rec.id)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
