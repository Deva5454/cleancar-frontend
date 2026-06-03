// Plan Management Screen - Active Plans and Version History
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Calendar,
  TrendingUp,
  Shield,
  Lock,
  Clock,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import {
  ALL_PLAN_VERSIONS,
  getActivePlanVersion,
  getPreviousPlanVersion,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  SUBSCRIPTION_PLANS,
  formatPrice,
  type PlanVersion,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";

export function PlanManagement() {
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("active");
  const [selectedHistoricalVersion, setSelectedHistoricalVersion] = useState<PlanVersion | null>(null);

  const activePlan = getActivePlanVersion();
  const previousPlan = getPreviousPlanVersion();
  
  const canEdit = ["Admin", "Super Admin"].includes(currentRole);
  const canViewHistory = ![
    "Operations Manager",
    "Supervisor",
    "Car Washer",
    "HR Manager",
    "Accounts",
  ].includes(currentRole);
  
  // TSM and TSE see previous plan only
  const isTSMOrTSE = ["TSM", "TSE"].includes(currentRole);
  const displayPlan = isTSMOrTSE && previousPlan ? previousPlan : activePlan;

  // Calculate days until go-live for scheduled plans
  const scheduledPlan = ALL_PLAN_VERSIONS.find((v) => v.status === "Scheduled");
  const daysUntilGoLive = scheduledPlan?.goLiveDate
    ? Math.ceil(
        (new Date(scheduledPlan.goLiveDate).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-6">
      <BackButton to="/customers" label="Back to Customer & Subscription" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plan Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage subscription plans, pricing, and deliverables
          </p>
        </div>
        {canEdit && activeTab === "active" && (
          <Button onClick={() => navigate("/subscription/plan-editor")}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Plan
          </Button>
        )}
      </div>

      {/* Scheduled Plan Countdown */}
      {scheduledPlan && daysUntilGoLive !== null && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              <Clock className="w-8 h-8 text-orange-600" />
              <div className="flex-1">
                <p className="font-semibold text-orange-900">
                  New Plan {scheduledPlan.version} going live in {daysUntilGoLive} days
                </p>
                <p className="text-sm text-orange-700 mt-1">
                  Go-Live Date: {new Date(scheduledPlan.goLiveDate!).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              <Badge className="bg-orange-600 text-white">Scheduled</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Plans</TabsTrigger>
          {canViewHistory && <TabsTrigger value="history">Plan Version History</TabsTrigger>}
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {/* Plan Version Banner */}
          <Card className="border-2 border-teal-300 bg-teal-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-teal-700 font-medium">Current Active Plan Version</p>
                  <h3 className="text-xl font-bold text-teal-900 mt-1">
                    {displayPlan.versionLabel}
                  </h3>
                  <p className="text-sm text-teal-600 mt-1">
                    Effective from{" "}
                    {new Date(displayPlan.effectiveFrom).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <Badge className="bg-teal-600 text-white text-lg px-4 py-2">Live</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pricing Matrix - Monthly Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white z-10 font-bold min-w-[200px]">
                        Vehicle Category
                      </TableHead>
                      {PLAN_TYPES.map((plan) => (
                        <TableHead key={plan} className="text-center min-w-[120px]">
                          {plan}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VEHICLE_CATEGORIES.map((category) => (
                      <TableRow key={category}>
                        <TableCell className="sticky left-0 bg-white z-10 font-medium">
                          {category}
                        </TableCell>
                        {PLAN_TYPES.map((plan) => {
                          const price = displayPlan.pricingMatrix[category][plan];
                          return (
                            <TableCell key={plan} className="text-center">
                              {price === "NA" ? (
                                <span className="text-gray-400 flex items-center justify-center gap-1">
                                  <Lock className="w-3 h-3" />
                                  NA
                                </span>
                              ) : (
                                <span className="font-semibold">{formatPrice(price)}</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Plan Detail Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {SUBSCRIPTION_PLANS.map((planType) => {
              const plan = displayPlan.deliverables[planType];
              return (
                <Card key={planType} className="border-2">
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-blue-50">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{plan.planName}</CardTitle>
                        <p className="text-sm text-gray-600 mt-2">{plan.tagline}</p>
                      </div>
                      {planType === "Premium" && (
                        <Badge className="bg-orange-500 text-white">Most Popular</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
                    {/* Included Services */}
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        What's Included
                      </h4>
                      <ul className="space-y-1">
                        {plan.included.map((item, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Not Included */}
                    {plan.notIncluded.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          Not Included
                        </h4>
                        <ul className="space-y-1">
                          {plan.notIncluded.map((item, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Best For */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900">Best For:</p>
                      <p className="text-sm text-blue-700 mt-1">{plan.bestFor}</p>
                    </div>

                    {/* Complimentary Benefits */}
                    {plan.complimentaryBenefits && (
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-purple-900">
                          Complimentary Benefits:
                        </p>
                        <p className="text-sm text-purple-700 mt-1">{plan.complimentaryBenefits}</p>
                      </div>
                    )}

                    {/* Discount Structure */}
                    {plan.discountStructure && (
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Discount Structure:</p>
                        <p className="text-sm text-green-700 mt-1">{plan.discountStructure}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {canViewHistory && (
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Plan Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Effective To</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_PLAN_VERSIONS.map((version) => (
                      <TableRow key={version.version}>
                        <TableCell className="font-medium">{version.versionLabel}</TableCell>
                        <TableCell>
                          {new Date(version.effectiveFrom).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell>
                          {version.effectiveTo === "Current" ? (
                            <Badge className="bg-teal-600 text-white">Current</Badge>
                          ) : (
                            new Date(version.effectiveTo).toLocaleDateString("en-IN")
                          )}
                        </TableCell>
                        <TableCell>{version.createdBy}</TableCell>
                        <TableCell>
                          {new Date(version.createdOn).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              version.status === "Active"
                                ? "bg-green-600 text-white"
                                : version.status === "Scheduled"
                                ? "bg-orange-600 text-white"
                                : version.status === "Draft"
                                ? "bg-gray-500 text-white"
                                : "bg-gray-400 text-white"
                            }
                          >
                            {version.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedHistoricalVersion(version)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Historical Version Modal */}
      {selectedHistoricalVersion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">
                  Historical Plan - {selectedHistoricalVersion.versionLabel}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(selectedHistoricalVersion.effectiveFrom).toLocaleDateString("en-IN")} -{" "}
                  {selectedHistoricalVersion.effectiveTo === "Current"
                    ? "Current"
                    : new Date(selectedHistoricalVersion.effectiveTo).toLocaleDateString("en-IN")}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setSelectedHistoricalVersion(null)}>
                <XCircle className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Historical Pricing Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="font-bold">Vehicle Category</TableHead>
                          {PLAN_TYPES.map((plan) => (
                            <TableHead key={plan} className="text-center">
                              {plan}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {VEHICLE_CATEGORIES.map((category) => (
                          <TableRow key={category}>
                            <TableCell className="font-medium">{category}</TableCell>
                            {PLAN_TYPES.map((plan) => {
                              const price = selectedHistoricalVersion.pricingMatrix[category][plan];
                              return (
                                <TableCell key={plan} className="text-center">
                                  {price === "NA" ? (
                                    <span className="text-gray-400">NA</span>
                                  ) : (
                                    <span className="font-semibold">{formatPrice(price)}</span>
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}