/**
 * Cost Per Wash Recommendations Engine
 * Analyzes actual vs ideal cost per wash and generates specific, actionable recommendations
 * Last Updated: 2026-03-18
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Users,
  Package,
  Wrench,
  DollarSign,
  Archive,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { BackButton } from "../ui/back-button";

export type RecommendationPriority = "High" | "Medium" | "Low";
export type RecommendationStatus = "Not Started" | "In Progress" | "Completed";
export type DiagnosisCategory =
  | "Job Volume Shortfall"
  | "Zero Wash Days"
  | "Consumable Over-Consumption"
  | "Consumable Under-Consumption"
  | "Supervisor Underutilization"
  | "Equipment Cost Spike"
  | "Overhead Creep"
  | "High Carry-Forward Stock"
  | "Batch Price Increase"
  | "Team Attainment Spread";

export interface Recommendation {
  id: string;
  priority: RecommendationPriority;
  category: DiagnosisCategory;
  entityName: string; // Washer name, Supervisor name, Zone, etc.
  entityType: "Washer" | "Supervisor" | "Zone" | "City" | "Company";
  period: string;
  whatIsHappening: string;
  whyItMatters: string;
  whatToDo: string[];
  whoShouldAct: string[];
  expectedImpact: string;
  financialImpact: number; // Monthly ₹ impact
  status: RecommendationStatus;
  raisedOn: Date;
  assignedTo?: string;
  dueDate?: Date;
  progressNotes?: { note: string; timestamp: Date; by: string }[];
  resolutionSummary?: string;
  resolvedOn?: Date;
  resolvedBy?: string;
  verifiedImprovement?: "Verified" | "Not Yet Verified" | "Issue Persists";
}

const DUMMY_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "REC-001",
    priority: "High",
    category: "Job Volume Shortfall",
    entityName: "Suresh Kumar",
    entityType: "Washer",
    period: "March 2026",
    whatIsHappening:
      "Suresh Kumar completed 477 jobs in March against a target of 546 — a shortfall of 69 jobs (12.6% below ideal). 1 zero-output day recorded (16 Mar — sick leave).",
    whyItMatters:
      "Salary CPW is ₹31.45 vs ideal ₹27.47 — ₹3.98 excess per wash. Total unrecovered salary excess: ₹3.98 × 477 = ₹1,898.46 this month. Annualised if pattern continues: ₹22,781.",
    whatToDo: [
      "Supervisor Ramesh to review Suresh's daily assignment schedule — confirm 21 jobs are assigned each working day.",
      "Review sick leave pattern — this is Suresh's first CL in 2026. Monitor next month.",
      "If zone has insufficient subscription density for 21 daily jobs — expand CRM activity in PIN 395005.",
    ],
    whoShouldAct: ["Supervisor", "Operations Manager"],
    expectedImpact:
      "Reaching 21 cars/day saves ₹3.98/wash × 21 × 26 = ₹2,174.28/month.",
    financialImpact: 2174,
    status: "Not Started",
    raisedOn: new Date("2026-04-01"),
  },
  {
    id: "REC-002",
    priority: "High",
    category: "Consumable Under-Consumption",
    entityName: "Suresh Kumar",
    entityType: "Washer",
    period: "March 2026",
    whatIsHappening:
      "Suresh used 1,035ml of Foam Shampoo in March against the standard ideal of 17,000ml for his package mix — only 6.1% of the standard quantity. This is extreme under-consumption and requires investigation.",
    whyItMatters:
      "While Suresh's consumable CPW appears efficient at ₹6.24, the 93.9% reduction in shampoo use strongly suggests either under-application (service quality risk for 180 Premium and 120 Elite customers who expect shampoo service) or the standard usage rates are significantly overestimated for actual field conditions.",
    whatToDo: [
      "Supervisor Ramesh to urgently conduct a quality audit — accompany Suresh on 3 jobs across Basic, Premium, and Elite packages. Measure actual shampoo applied.",
      "If under-application confirmed — immediate retraining on correct dosage.",
      "If application is correct but standard rates are set too high — Admin to review standard usage rates across all washers for calibration. Compare Suresh's consumption against all other washers.",
      "Check customer feedback for Suresh's jobs — are quality scores lower than team average?",
    ],
    whoShouldAct: ["Supervisor", "Admin"],
    expectedImpact:
      "Correcting under-application brings service quality to contracted standard — reducing churn risk for 300 affected customers this month.",
    financialImpact: 0, // Quality risk, not immediate cost
    status: "Not Started",
    raisedOn: new Date("2026-04-01"),
  },
  {
    id: "REC-003",
    priority: "High",
    category: "Supervisor Underutilization",
    entityName: "Ramesh Patel",
    entityType: "Supervisor",
    period: "March 2026",
    whatIsHappening:
      "Ramesh manages 5 washers against the ideal team size of 17. Supervisor salary allocation per wash: ₹10.70 actual vs ₹2.69 ideal — 3.98× the ideal.",
    whyItMatters:
      "The ₹8.01/wash supervisor excess × 2,336 team jobs = ₹18,711 in excess supervisor cost in March alone. Annualised: ₹2,24,532.",
    whatToDo: [
      "Recruit 12 additional washers for PIN 395005 (Adajan) over the next 3 months. At current TSE activity level, 12 new subscriptions needed per washer per month to support 12 new washers.",
      "Operations Manager to review if adjacent PIN codes (395004 Udhna, 395007 Althan) can be folded under Ramesh's supervisory area during expansion — allowing washer headcount to grow without adding a new supervisor prematurely.",
      "HR to initiate washer recruitment drive for Adajan zone immediately.",
    ],
    whoShouldAct: ["Operations Manager", "HR", "TSE"],
    expectedImpact:
      "Growing to 17 washers under Ramesh reduces supervisor CPW from ₹10.70 to ₹2.69 — saving ₹8.01/wash × (17 × 21 × 26) = ₹72,441/month at full team capacity.",
    financialImpact: 72441,
    status: "Not Started",
    raisedOn: new Date("2026-04-01"),
  },
  {
    id: "REC-004",
    priority: "Low",
    category: "High Carry-Forward Stock",
    entityName: "Suresh Kumar",
    entityType: "Washer",
    period: "March 2026",
    whatIsHappening:
      "Suresh's verified closing balance for Foam Shampoo is 185ml. Combined with his two issuances of 500ml each in March plus the 220ml carry-forward, his total available was 1,220ml. He consumed only 1,035ml — leaving 185ml carry-forward into April.",
    whyItMatters:
      "If the standard monthly issuance (500ml) is issued again in April, Suresh will start April with 185 + 500 = 685ml — more than half a month's supply already in hand before month starts. At his actual consumption rate of 1,035ml/month, this means he is adequately stocked for most of April already.",
    whatToDo: [
      "Store Manager to pause April shampoo issuance for Suresh until his balance drops below 200ml. Flag as 'Do Not Issue — Shampoo' in bulk issuance grid for Suresh for April.",
      "Confirm Batch 001 (185ml carry-forward) will be consumed before Batch 002 — FIFO system enforces this automatically.",
    ],
    whoShouldAct: ["Store Manager"],
    expectedImpact:
      "Pausing one month's issuance of 500ml × ₹0.88 = ₹440 in working capital freed. No expiry risk as Batch 001 expires well in future.",
    financialImpact: 440,
    status: "Not Started",
    raisedOn: new Date("2026-04-01"),
  },
];

export function RecommendationsEngine() {
  const [activeTab, setActiveTab] = useState<"active" | "in-progress" | "resolved">("active");
  const [recommendations, setRecommendations] = useState<Recommendation[]>(DUMMY_RECOMMENDATIONS);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<RecommendationPriority | "All">("All");
  const [filterLevel, setFilterLevel] = useState<string>("All");

  const toggleCardExpansion = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const updateRecommendationStatus = (id: string, status: RecommendationStatus) => {
    setRecommendations((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, status } : rec))
    );
  };

  const activeRecommendations = recommendations.filter((r) => r.status === "Not Started");
  const inProgressRecommendations = recommendations.filter((r) => r.status === "In Progress");
  const resolvedRecommendations = recommendations.filter((r) => r.status === "Completed");

  const highPriorityCount = activeRecommendations.filter((r) => r.priority === "High").length;
  const mediumPriorityCount = activeRecommendations.filter((r) => r.priority === "Medium").length;
  const lowPriorityCount = activeRecommendations.filter((r) => r.priority === "Low").length;

  const totalMonthlySaving = activeRecommendations.reduce(
    (sum, rec) => sum + rec.financialImpact,
    0
  );

  const getCategoryIcon = (category: DiagnosisCategory) => {
    switch (category) {
      case "Job Volume Shortfall":
      case "Zero Wash Days":
        return <TrendingDown className="w-4 h-4" />;
      case "Consumable Over-Consumption":
      case "Consumable Under-Consumption":
        return <Package className="w-4 h-4" />;
      case "Supervisor Underutilization":
      case "Team Attainment Spread":
        return <Users className="w-4 h-4" />;
      case "Equipment Cost Spike":
        return <Wrench className="w-4 h-4" />;
      case "Overhead Creep":
      case "High Carry-Forward Stock":
      case "Batch Price Increase":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-700 border-red-300";
      case "Medium":
        return "bg-amber-100 text-amber-700 border-amber-300";
      case "Low":
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const renderRecommendationCard = (rec: Recommendation) => {
    const isExpanded = expandedCards.has(rec.id);

    return (
      <Card
        key={rec.id}
        className={`border-l-4 ${
          rec.priority === "High"
            ? "border-l-red-500"
            : rec.priority === "Medium"
            ? "border-l-amber-500"
            : "border-l-gray-400"
        }`}
      >
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    rec.priority === "High"
                      ? "bg-red-50 text-red-600"
                      : rec.priority === "Medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-gray-50 text-gray-600"
                  }`}
                >
                  {getCategoryIcon(rec.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPriorityColor(rec.priority)}>{rec.priority} Priority</Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {rec.entityName} • {rec.period}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleCardExpansion(rec.id)}
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {/* What is Happening */}
            <div>
              <div className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                <AlertTriangle className="w-3 h-3" />
                What is happening
              </div>
              <p className="text-sm text-gray-700">{rec.whatIsHappening}</p>
            </div>

            {/* Why it Matters */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-sm font-semibold text-red-900 mb-1 flex items-center gap-2">
                <DollarSign className="w-3 h-3" />
                Why it matters
              </div>
              <p className="text-sm text-red-800">{rec.whyItMatters}</p>
            </div>

            {/* What to Do - Expanded */}
            {isExpanded && (
              <>
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    What to do
                  </div>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    {rec.whatToDo.map((step, idx) => (
                      <li key={idx} className="pl-2">
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Who Should Act */}
                <div>
                  <div className="text-sm font-semibold text-gray-900 mb-2">Who should act</div>
                  <div className="flex flex-wrap gap-2">
                    {rec.whoShouldAct.map((role, idx) => (
                      <Badge key={idx} variant="outline" className="bg-blue-50 text-blue-700">
                        <Users className="w-3 h-3 mr-1" />
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Expected Impact */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-semibold text-green-900 mb-1 flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    Expected impact if actioned
                  </div>
                  <p className="text-sm text-green-800 font-medium">{rec.expectedImpact}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {rec.status === "Not Started" && (
                    <Button
                      size="sm"
                      onClick={() => updateRecommendationStatus(rec.id, "In Progress")}
                    >
                      Mark In Progress
                    </Button>
                  )}
                  {rec.status === "In Progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-300"
                      onClick={() => updateRecommendationStatus(rec.id, "Completed")}
                    >
                      Mark Resolved
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Assign to User
                  </Button>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Raised on {rec.raisedOn.toLocaleDateString("en-IN")}
              </div>
              <div className="font-medium">ID: {rec.id}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton to="/finance/cost-per-wash" />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Cost Improvement Recommendations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Intelligent analysis of actual vs ideal cost per wash with specific, actionable recommendations
        </p>
      </div>

      {/* Summary Impact Panel */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Active Recommendations</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {activeRecommendations.length}
            </div>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-red-100 text-red-700">{highPriorityCount} High</Badge>
              <Badge className="bg-amber-100 text-amber-700">{mediumPriorityCount} Med</Badge>
              <Badge className="bg-gray-100 text-gray-700">{lowPriorityCount} Low</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Estimated Monthly Saving</div>
            <div className="text-3xl font-bold text-green-600 mt-1">
              ₹{totalMonthlySaving.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-gray-500 mt-1">If all recommendations actioned</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">In Progress</div>
            <div className="text-3xl font-bold text-blue-600 mt-1">
              {inProgressRecommendations.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Actions being taken</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Resolved This Month</div>
            <div className="text-3xl font-bold text-gray-900 mt-1">
              {resolvedRecommendations.length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Verified improvements</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({inProgressRecommendations.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved ({resolvedRecommendations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeRecommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600">No active recommendations at this time.</p>
                <p className="text-sm text-gray-500 mt-1">
                  All cost metrics are within acceptable ranges.
                </p>
              </CardContent>
            </Card>
          ) : (
            activeRecommendations.map((rec) => renderRecommendationCard(rec))
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-4">
          {inProgressRecommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recommendations in progress.</p>
              </CardContent>
            </Card>
          ) : (
            inProgressRecommendations.map((rec) => renderRecommendationCard(rec))
          )}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {resolvedRecommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No resolved recommendations yet.</p>
              </CardContent>
            </Card>
          ) : (
            resolvedRecommendations.map((rec) => renderRecommendationCard(rec))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
