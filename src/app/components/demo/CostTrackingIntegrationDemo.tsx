/**
 * Cost Tracking Integration Demo
 * Shows complete flow: Job Report → Cost Tracking → Dashboard
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { FileText, DollarSign, TrendingUp } from "lucide-react";
import { WasherJobReport } from "../operations/WasherJobReport";
import { JobCostDetails } from "../operations/JobCostDetails";
import { CostIntelligencePanel } from "../dashboard/CostIntelligencePanel";
import { JobCostRecord } from "../finance/JobCostTracking";
import { logger } from "../../services/logger";

export function CostTrackingIntegrationDemo() {
  const [submittedJobCost, setSubmittedJobCost] = useState<JobCostRecord | null>(
    null
  );

  const handleJobSubmit = (jobCost: JobCostRecord) => {
    setSubmittedJobCost(jobCost);
    logger.log("Job Cost Record:", jobCost);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          Cost Tracking Integration Demo
        </h1>
        <p className="text-gray-600 mt-2">
          Complete flow from Job Report submission to Cost Analysis
        </p>
      </div>

      <Tabs defaultValue="job-report" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="job-report" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            1. Job Report
          </TabsTrigger>
          <TabsTrigger
            value="cost-details"
            disabled={!submittedJobCost}
            className="flex items-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            2. Cost Details
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            3. Dashboard
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Job Report Submission */}
        <TabsContent value="job-report" className="space-y-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Step 1: Washer Submits Job Report</h3>
              <p className="text-sm text-gray-700">
                When a washer completes a job and submits the report, they check off
                which products were used. The system automatically calculates the job
                cost based on:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>
                  <strong>Material Cost:</strong> Sum of all products checked as "used"
                </li>
                <li>
                  <strong>Consumable Cost:</strong> Fixed cost from configuration
                </li>
                <li>
                  <strong>Manpower Cost:</strong> Based on actual job duration vs
                  standard
                </li>
                <li>
                  <strong>Overhead:</strong> Pro-rated overhead costs
                </li>
              </ul>
            </CardContent>
          </Card>

          <WasherJobReport
            jobId="JOB-2026-03-17-001"
            customerId="CUST-045"
            washerId="WR-001"
            packageType="Premium"
            vehicleCategory="Hatchback"
            pinCode="560034"
            customerMonthlyPrice={2600}
            monthlyWashCount={24}
            jobStartTime={new Date(Date.now() - 32 * 60 * 1000)} // 32 minutes ago
            onSubmit={handleJobSubmit}
          />
        </TabsContent>

        {/* Tab 2: Cost Details */}
        <TabsContent value="cost-details" className="space-y-4">
          {submittedJobCost ? (
            <>
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">
                    Step 2: Job Cost Analysis Generated
                  </h3>
                  <p className="text-sm text-gray-700">
                    The system has automatically calculated the complete cost breakdown
                    for this job. This data now feeds into all tracking reports and
                    dashboards.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge className="bg-green-600">
                      ✓ Cost Tracking Complete
                    </Badge>
                    <Badge variant="outline">
                      Job Duration: {submittedJobCost.actualJobDuration} min
                    </Badge>
                    <Badge
                      className={
                        submittedJobCost.totalVariance > 0
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      }
                    >
                      Variance: ₹{submittedJobCost.totalVariance.toFixed(2)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <JobCostDetails
                jobCost={submittedJobCost}
                userRole="Super Admin"
              />
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-gray-500">
                Submit a job report first to see cost analysis
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab 3: Dashboard Integration */}
        <TabsContent value="dashboard" className="space-y-4">
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">
                Step 3: Cost Intelligence on Founder Dashboard
              </h3>
              <p className="text-sm text-gray-700">
                Job-level cost data automatically aggregates to the Founder Dashboard,
                showing real-time cost intelligence across all dimensions. Click any KPI
                card to drill down into detailed reports.
              </p>
              <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>Overall cost and EBITDA metrics</li>
                <li>Most/least profitable packages</li>
                <li>Most/least cost-efficient zones</li>
                <li>EBITDA margin trends by package</li>
              </ul>
            </CardContent>
          </Card>

          <CostIntelligencePanel />
        </TabsContent>
      </Tabs>

      {/* Integration Flow Diagram */}
      <Card className="border-indigo-200">
        <CardHeader>
          <CardTitle>Data Flow: Job Report → Cost Tracking → Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <div className="flex-1 text-center p-4 bg-blue-50 rounded">
              <div className="font-medium text-blue-900 mb-1">
                1. Washer Job Report
              </div>
              <div className="text-xs text-blue-700">Products Used Checklist</div>
            </div>
            <div className="px-4 text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-green-50 rounded">
              <div className="font-medium text-green-900 mb-1">
                2. Cost Calculation
              </div>
              <div className="text-xs text-green-700">
                Actual vs Standard Costs
              </div>
            </div>
            <div className="px-4 text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-purple-50 rounded">
              <div className="font-medium text-purple-900 mb-1">3. Aggregation</div>
              <div className="text-xs text-purple-700">
                By Washer/Zone/Package/etc
              </div>
            </div>
            <div className="px-4 text-gray-400">→</div>
            <div className="flex-1 text-center p-4 bg-orange-50 rounded">
              <div className="font-medium text-orange-900 mb-1">
                4. Dashboard KPIs
              </div>
              <div className="text-xs text-orange-700">Real-time Intelligence</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
