import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Input } from "../ui/input";
import {
  AlertCircle,
  Filter,
  Search,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  UserPlus,
  Play,
  Check,
  AlertTriangle,
} from "lucide-react";
import { MOCK_RECOMMENDATIONS } from "../../data/recommendationMockData";
import { type Recommendation, type ActionOwner, type DiagnosisCategory } from "../../data/recommendationEngine";
import { ManageableRecommendationCard } from "./ManageableRecommendationCard";

export function RecommendationManagement() {
  const [levelFilter, setLevelFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [ownerFilter, setOwnerFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("All Time");
  
  // Filter recommendations
  const filterRecommendations = (recs: Recommendation[]) => {
    return recs.filter((rec) => {
      // Level filter
      if (levelFilter !== "All" && rec.entityType !== levelFilter) return false;
      
      // Category filter
      if (categoryFilter !== "All" && rec.diagnosisCategory !== categoryFilter) return false;
      
      // Owner filter
      if (ownerFilter !== "All" && rec.primaryOwner !== ownerFilter) return false;
      
      // Search query
      if (searchQuery && !rec.entityName.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !rec.whatIsHappening.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Date range filter (simplified for demo)
      if (dateRangeFilter === "This Month" && rec.period !== "March 2026") return false;
      if (dateRangeFilter === "Last Month" && rec.period !== "February 2026") return false;
      
      return true;
    });
  };
  
  // Sort recommendations by priority then financial impact
  const sortRecommendations = (recs: Recommendation[]) => {
    return [...recs].sort((a, b) => {
      // Priority order: High > Medium > Low
      const priorityOrder = { High: 3, Medium: 2, Low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Financial impact (highest first)
      return b.metrics.financialImpact - a.metrics.financialImpact;
    });
  };
  
  // Categorize recommendations
  const allRecommendations = MOCK_RECOMMENDATIONS;
  const activeRecs = sortRecommendations(filterRecommendations(allRecommendations.filter(r => r.status === "Not Started")));
  const inProgressRecs = sortRecommendations(filterRecommendations(allRecommendations.filter(r => r.status === "In Progress")));
  const resolvedRecs = filterRecommendations(allRecommendations.filter(r => r.status === "Completed"));
  
  // Calculate summary metrics
  const totalActive = activeRecs.length + inProgressRecs.length;
  const highPriorityCount = [...activeRecs, ...inProgressRecs].filter(r => r.priority === "High").length;
  const estimatedMonthlySaving = [...activeRecs, ...inProgressRecs]
    .reduce((sum, r) => sum + r.metrics.financialImpact, 0);
  const resolvedThisMonth = resolvedRecs.filter(r => r.period === "March 2026").length;
  
  // Mock verified savings (would be calculated from actual improvement data)
  const verifiedSavings = resolvedRecs
    .filter(r => r.verification?.status === "Verified")
    .reduce((sum, r) => sum + (r.verification?.improvement || 0) * 500, 0); // Rough estimate
  
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recommendation Management</h1>
        <p className="text-gray-600 mt-2">
          Track and manage cost improvement recommendations across all levels
        </p>
      </div>
      
      {/* Summary Impact Panel */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-5 gap-6">
            {/* Total Active */}
            <div className="text-center">
              <div className="text-sm font-medium text-blue-700 mb-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Total Active
              </div>
              <div className="text-4xl font-bold text-blue-900">{totalActive}</div>
              <div className="text-xs text-blue-600 mt-1">Recommendations</div>
            </div>
            
            {/* High Priority Count */}
            <div className="text-center">
              <div className="text-sm font-medium text-red-700 mb-2 flex items-center justify-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                High Priority
              </div>
              <div className="text-4xl font-bold text-red-900">{highPriorityCount}</div>
              <div className="text-xs text-red-600 mt-1">Urgent Actions</div>
            </div>
            
            {/* Estimated Monthly Saving */}
            <div className="text-center">
              <div className="text-sm font-medium text-green-700 mb-2 flex items-center justify-center gap-1">
                <DollarSign className="w-4 h-4" />
                Potential Savings
              </div>
              <div className="text-3xl font-bold text-green-900">
                ₹{estimatedMonthlySaving.toLocaleString()}
              </div>
              <div className="text-xs text-green-600 mt-1">If All Actioned</div>
            </div>
            
            {/* Resolved This Month */}
            <div className="text-center">
              <div className="text-sm font-medium text-purple-700 mb-2 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Resolved This Month
              </div>
              <div className="text-4xl font-bold text-purple-900">{resolvedThisMonth}</div>
              <div className="text-xs text-purple-600 mt-1">Completed Actions</div>
            </div>
            
            {/* Verified Savings */}
            <div className="text-center">
              <div className="text-sm font-medium text-teal-700 mb-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-4 h-4" />
                Verified Savings
              </div>
              <div className="text-3xl font-bold text-teal-900">
                ₹{verifiedSavings.toLocaleString()}
              </div>
              <div className="text-xs text-teal-600 mt-1">This Month</div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Filters Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Filter className="w-4 h-4" />
              Filters:
            </div>
            
            {/* Level Filter */}
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Levels</SelectItem>
                <SelectItem value="Washer">Washer</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="Zone">Zone</SelectItem>
                <SelectItem value="Company">Company</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                <SelectItem value="Job Volume Shortfall">Job Volume Shortfall</SelectItem>
                <SelectItem value="Zero Wash Days">Zero Wash Days</SelectItem>
                <SelectItem value="Consumable Over-Consumption">Consumable Over-Consumption</SelectItem>
                <SelectItem value="Consumable Under-Consumption">Consumable Under-Consumption</SelectItem>
                <SelectItem value="Supervisor Underutilization">Supervisor Underutilization</SelectItem>
                <SelectItem value="Equipment Cost Spike">Equipment Cost Spike</SelectItem>
                <SelectItem value="Overhead Creep">Overhead Creep</SelectItem>
                <SelectItem value="High Carry-Forward Stock">High Carry-Forward Stock</SelectItem>
                <SelectItem value="Batch Price Increase Impact">Batch Price Increase Impact</SelectItem>
                <SelectItem value="Team Attainment Spread">Team Attainment Spread</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Owner Filter */}
            <Select value={ownerFilter} onValueChange={setOwnerFilter}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Who Should Act" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Owners</SelectItem>
                <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                <SelectItem value="Supervisor">Supervisor</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Purchase Manager">Purchase Manager</SelectItem>
                <SelectItem value="Store Manager">Store Manager</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Finance Manager">Finance Manager</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Time">All Time</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Last 3 Months">Last 3 Months</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by entity name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Clear Filters */}
            {(levelFilter !== "All" || categoryFilter !== "All" || ownerFilter !== "All" || searchQuery || dateRangeFilter !== "All Time") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLevelFilter("All");
                  setCategoryFilter("All");
                  setOwnerFilter("All");
                  setSearchQuery("");
                  setDateRangeFilter("All Time");
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs: Active, In Progress, Resolved */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Active ({activeRecs.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            In Progress ({inProgressRecs.length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Resolved ({resolvedRecs.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Active Tab */}
        <TabsContent value="active" className="space-y-4">
          {activeRecs.length === 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div className="font-medium text-green-900">
                    No active recommendations — all metrics healthy!
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">
                Sorted by Priority (High → Medium → Low), then Financial Impact (Highest ₹ first)
              </div>
              {activeRecs.map((rec) => (
                <ManageableRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  showActions={true}
                />
              ))}
            </>
          )}
        </TabsContent>
        
        {/* In Progress Tab */}
        <TabsContent value="in-progress" className="space-y-4">
          {inProgressRecs.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  No recommendations currently in progress
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">
                Sorted by Priority, then Financial Impact
              </div>
              {inProgressRecs.map((rec) => (
                <ManageableRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  showActions={true}
                />
              ))}
            </>
          )}
        </TabsContent>
        
        {/* Resolved Tab */}
        <TabsContent value="resolved" className="space-y-4">
          {resolvedRecs.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-gray-500">
                  No resolved recommendations yet
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="text-sm text-gray-600 mb-2">
                Showing resolved recommendations with verification status
              </div>
              {resolvedRecs.map((rec) => (
                <ManageableRecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  showActions={false}
                  showVerification={true}
                />
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
