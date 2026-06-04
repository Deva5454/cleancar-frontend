// Plan Editor - Edit Pricing and Deliverables with Go-Live Scheduling
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { BackButton } from "../ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertTriangle,
  Save,
  Calendar,
  TrendingUp,
  Plus,
  Trash2,
  Lock,
  CheckCircle,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import {
  getActivePlanVersion,
  VEHICLE_CATEGORIES,
  PLAN_TYPES,
  SUBSCRIPTION_PLANS,
  formatPrice,
  type PlanVersion,
  type VehicleCategory,
  type PlanType,
} from "../../data/subscriptionPlans";

export function PlanEditor() {
  const { currentRole, currentUser } = useRole();
  const navigate = useNavigate();
  const activePlan = getActivePlanVersion();

  // Editable pricing matrix
  const [pricingMatrix, setPricingMatrix] = useState(activePlan.pricingMatrix);

  // Editable deliverables
  const [deliverables, setDeliverables] = useState(activePlan.deliverables);

  // Go-Live Configuration
  const [goLiveDate, setGoLiveDate] = useState("");
  const [versionLabel, setVersionLabel] = useState(`V${parseInt(activePlan.version.slice(1)) + 1}`);

  // Bulk edit states
  const [bulkPlan, setBulkPlan] = useState<PlanType | "">("");
  const [bulkPercentage, setBulkPercentage] = useState("");
  const [bulkCategory, setBulkCategory] = useState<VehicleCategory | "">("");
  const [bulkCategoryPercentage, setBulkCategoryPercentage] = useState("");

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const canEdit = ["Admin", "Super Admin"].includes(currentRole);
  const isSuperAdmin = currentRole === "Super Admin";

  if (!canEdit) {
    return (
      <div className="p-6">
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900">Access Denied</h3>
            <p className="text-red-700 mt-2">Only Admin and Super Admin can edit plans</p>
            <Button className="mt-4" onClick={() => navigate("/subscription/plan-management")}>
              Back to Plan Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Update price in matrix
  const updatePrice = (category: VehicleCategory, plan: PlanType, value: string) => {
    const numValue = parseInt(value) || 0;
    setPricingMatrix((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [plan]: numValue > 0 ? numValue : 1,
      },
    }));
  };

  // Apply bulk percentage increase to plan
  const applyBulkPlanIncrease = () => {
    if (!bulkPlan || !bulkPercentage) {
      toast.error("Please select a plan and enter percentage");
      return;
    }

    const percentage = parseFloat(bulkPercentage);
    setPricingMatrix((prev) => {
      const updated = { ...prev };
      VEHICLE_CATEGORIES.forEach((category) => {
        const currentPrice = prev[category][bulkPlan];
        if (currentPrice !== "NA") {
          const newPrice = Math.round(currentPrice * (1 + percentage / 100));
          updated[category] = {
            ...updated[category],
            [bulkPlan]: newPrice,
          };
        }
      });
      return updated;
    });

    toast.success(`Applied ${percentage}% increase to ${bulkPlan} plan`);
    setBulkPercentage("");
  };

  // Apply bulk percentage increase to category
  const applyBulkCategoryIncrease = () => {
    if (!bulkCategory || !bulkCategoryPercentage) {
      toast.error("Please select a category and enter percentage");
      return;
    }

    const percentage = parseFloat(bulkCategoryPercentage);
    setPricingMatrix((prev) => {
      const updated = { ...prev };
      PLAN_TYPES.forEach((plan) => {
        const currentPrice = prev[bulkCategory][plan];
        if (currentPrice !== "NA") {
          const newPrice = Math.round(currentPrice * (1 + percentage / 100));
          updated[bulkCategory] = {
            ...updated[bulkCategory],
            [plan]: newPrice,
          };
        }
      });
      return updated;
    });

    toast.success(`Applied ${percentage}% increase to ${bulkCategory}`);
    setBulkCategoryPercentage("");
  };

  // Update deliverable
  const updateDeliverable = (
    plan: PlanType,
    field: string,
    value: string | string[]
  ) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        [field]: value,
      },
    }));
  };

  // Add included item
  const addIncludedItem = (plan: PlanType) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        included: [...prev[plan].included, ""],
      },
    }));
  };

  // Remove included item
  const removeIncludedItem = (plan: PlanType, index: number) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        included: prev[plan].included.filter((_, i) => i !== index),
      },
    }));
  };

  // Update included item
  const updateIncludedItem = (plan: PlanType, index: number, value: string) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        included: prev[plan].included.map((item, i) => (i === index ? value : item)),
      },
    }));
  };

  // Add not included item
  const addNotIncludedItem = (plan: PlanType) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        notIncluded: [...prev[plan].notIncluded, ""],
      },
    }));
  };

  // Remove not included item
  const removeNotIncludedItem = (plan: PlanType, index: number) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        notIncluded: prev[plan].notIncluded.filter((_, i) => i !== index),
      },
    }));
  };

  // Update not included item
  const updateNotIncludedItem = (plan: PlanType, index: number, value: string) => {
    setDeliverables((prev) => ({
      ...prev,
      [plan]: {
        ...prev[plan],
        notIncluded: prev[plan].notIncluded.map((item, i) => (i === index ? value : item)),
      },
    }));
  };

  // Save as draft
  const saveDraft = () => {
    toast.success("Plan saved as draft");
    // In real app, save to database with status "Draft"
  };

  // Schedule go-live
  const scheduleGoLive = () => {
    if (!goLiveDate) {
      toast.error("Please select a go-live date");
      return;
    }

    const selectedDate = new Date(goLiveDate);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDate < tomorrow) {
      toast.error("Go-live date must be tomorrow or later");
      return;
    }

    // Confirmation dialog
    setConfirmState({
      open: true,
      title: "Schedule Plan Go-Live",
      description: `You are scheduling Plan ${versionLabel} to go live on ${selectedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}.\n\nAll new bookings from this date onwards will use the new pricing and deliverables.\n\nExisting bookings will be unaffected.\n\n${
        isSuperAdmin
          ? "Confirm to schedule this plan?"
          : "This action requires Super Admin confirmation."
      }`,
      onConfirm: () => {
        if (isSuperAdmin) {
          toast.success(`Plan ${versionLabel} scheduled to go live on ${selectedDate.toLocaleDateString("en-IN")}`);
          setTimeout(() => {
            navigate("/subscription/plan-management");
          }, 1500);
        } else {
          toast.success("Plan schedule request sent to Super Admin for approval");
          setTimeout(() => {
            navigate("/subscription/plan-management");
          }, 1500);
        }
        setConfirmState(s => ({ ...s, open: false }));
      }
    });
  };

  // Calculate cutoff date
  const cutoffDate = goLiveDate
    ? new Date(new Date(goLiveDate).getTime() - 24 * 60 * 60 * 1000)
    : null;

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const minDate = tomorrowDate.toISOString().split("T")[0];

  return (
    <div className="space-y-6 pb-20">
      <BackButton to="/subscription/plan-management" label="Back to Plan Management" />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plan Editor</h1>
        <p className="text-sm text-gray-500 mt-1">
          Edit pricing matrix and service deliverables
        </p>
      </div>

      {/* Warning Banner */}
      <Card className="border-2 border-yellow-400 bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-yellow-900">
                You are editing the subscription plan
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                Changes will NOT take effect immediately. You must set a Go-Live date. All bookings
                made before that date will continue under the current plan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT PANEL - Pricing Matrix Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Pricing Matrix Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bulk Edit Tools */}
              <div className="space-y-4 pb-4 border-b">
                <h4 className="font-semibold text-sm">Bulk Edit Tools</h4>

                {/* Apply % to Plan */}
                <div className="flex gap-2">
                  <Select value={bulkPlan} onValueChange={(v) => setBulkPlan(v as PlanType)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAN_TYPES.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="% change"
                    value={bulkPercentage}
                    onChange={(e) => setBulkPercentage(e.target.value)}
                    className="w-24"
                  />
                  <Button onClick={applyBulkPlanIncrease} size="sm">
                    Apply
                  </Button>
                </div>

                {/* Apply % to Category */}
                <div className="flex gap-2">
                  <Select
                    value={bulkCategory}
                    onValueChange={(v) => setBulkCategory(v as VehicleCategory)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {VEHICLE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="% change"
                    value={bulkCategoryPercentage}
                    onChange={(e) => setBulkCategoryPercentage(e.target.value)}
                    className="w-24"
                  />
                  <Button onClick={applyBulkCategoryIncrease} size="sm">
                    Apply
                  </Button>
                </div>
              </div>

              {/* Editable Pricing Matrix */}
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="font-bold min-w-[180px]">Vehicle Category</TableHead>
                      {PLAN_TYPES.map((plan) => (
                        <TableHead key={plan} className="text-center min-w-[100px]">
                          {plan}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {VEHICLE_CATEGORIES.map((category) => (
                      <TableRow key={category}>
                        <TableCell className="font-medium text-xs">{category}</TableCell>
                        {PLAN_TYPES.map((plan) => {
                          const price = pricingMatrix[category][plan];
                          const isLocked = price === "NA";
                          return (
                            <TableCell key={plan} className="text-center p-1">
                              {isLocked ? (
                                <div className="flex items-center justify-center gap-1 text-gray-400">
                                  <Lock className="w-3 h-3" />
                                  <span className="text-xs">NA</span>
                                </div>
                              ) : (
                                <Input
                                  type="number"
                                  value={price}
                                  onChange={(e) => updatePrice(category, plan, e.target.value)}
                                  className="w-full text-center text-sm h-8"
                                  min="1"
                                />
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

        {/* RIGHT PANEL - Plan Deliverables Editor */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plan Deliverables Editor</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={SUBSCRIPTION_PLANS[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <TabsTrigger key={plan} value={plan} className="text-xs">
                      {plan}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {SUBSCRIPTION_PLANS.map((planType) => {
                  const plan = deliverables[planType];
                  return (
                    <TabsContent key={planType} value={planType} className="space-y-4">
                      <div>
                        <Label>Plan Name</Label>
                        <Input
                          value={plan.planName}
                          onChange={(e) =>
                            updateDeliverable(planType, "planName", e.target.value)
                          }
                        />
                      </div>

                      <div>
                        <Label>Tagline</Label>
                        <Textarea
                          value={plan.tagline}
                          onChange={(e) =>
                            updateDeliverable(planType, "tagline", e.target.value)
                          }
                          rows={2}
                        />
                      </div>

                      {/* Included Services */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Included Services</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addIncludedItem(planType)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {plan.included.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) =>
                                  updateIncludedItem(planType, idx, e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeIncludedItem(planType, idx)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Not Included Services */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Not Included</Label>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addNotIncludedItem(planType)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {plan.notIncluded.map((item, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input
                                value={item}
                                onChange={(e) =>
                                  updateNotIncludedItem(planType, idx, e.target.value)
                                }
                                className="flex-1"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeNotIncludedItem(planType, idx)}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Best For</Label>
                        <Textarea
                          value={plan.bestFor}
                          onChange={(e) =>
                            updateDeliverable(planType, "bestFor", e.target.value)
                          }
                          rows={2}
                        />
                      </div>

                      {plan.complimentaryBenefits !== undefined && (
                        <div>
                          <Label>Complimentary Benefits</Label>
                          <Textarea
                            value={plan.complimentaryBenefits}
                            onChange={(e) =>
                              updateDeliverable(planType, "complimentaryBenefits", e.target.value)
                            }
                            rows={2}
                          />
                        </div>
                      )}

                      {plan.discountStructure !== undefined && (
                        <div>
                          <Label>Discount Structure</Label>
                          <Textarea
                            value={plan.discountStructure}
                            onChange={(e) =>
                              updateDeliverable(planType, "discountStructure", e.target.value)
                            }
                            rows={2}
                          />
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Go-Live Configuration */}
      <Card className="border-2 border-teal-300">
        <CardHeader className="bg-teal-50">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Go-Live Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Go-Live Date *</Label>
              <Input
                type="date"
                value={goLiveDate}
                onChange={(e) => setGoLiveDate(e.target.value)}
                min={minDate}
              />
              {goLiveDate && cutoffDate && (
                <p className="text-sm text-gray-600 mt-2">
                  📌 Bookings made on or before{" "}
                  {cutoffDate.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  will continue under the current plan {activePlan.version}.
                  <br />
                  New bookings from{" "}
                  {new Date(goLiveDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  onwards will follow the new plan.
                </p>
              )}
            </div>

            <div>
              <Label>Plan Version Label</Label>
              <Input value={versionLabel} onChange={(e) => setVersionLabel(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">
                Auto-suggested as V{parseInt(activePlan.version.slice(1)) + 1} but editable
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 z-40">
        <div className="max-w-7xl mx-auto flex justify-end gap-3">
          <Button variant="outline" onClick={saveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={scheduleGoLive}
            disabled={!goLiveDate}
            className="bg-teal-600 hover:bg-teal-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Schedule Go-Live
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </div>
  );
}