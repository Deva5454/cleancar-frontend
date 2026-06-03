/**
 * Business Flow Demo Component
 * Demonstrates and tests the complete Lead → Customer → Subscription → Jobs flow
 *
 * Use this component to:
 * 1. Verify the business flows work end-to-end
 * 2. See dashboard statistics in real-time
 * 3. Test lead conversion and demo completion
 */

import { useState } from "react";
import { useBusinessFlows } from "../hooks/useBusinessFlows";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import type { Lead, SubscriptionPlan } from "../services/leadConversionService";
import type { DemoOutcome } from "../services/demoCompletionService";

export function BusinessFlowDemo() {
  const flows = useBusinessFlows();
  const stats = flows.getDashboardStats();
  const pipeline = flows.getJobPipeline();

  const [leadForm, setLeadForm] = useState<Partial<Lead>>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "9876543210",
    address: {
      line1: "123 Main Street",
      area: "Adajan",
      city: "Surat",
      pinCode: "395001",
    },
    vehicleDetails: {
      category: "Sedan",
      brand: "Honda",
      color: "Silver",
      registrationNumber: "KA01AB1234",
    },
    leadSource: "Google Ads",
    status: "Demo Completed",
  });

  const [planForm, setPlanForm] = useState<Partial<SubscriptionPlan>>({
    packageType: "Premium",
    packageName: "Premium Wash + Interior",
    frequency: "Daily",
    pricing: {
      basePrice: 5000,
      discount: 500,
      finalPrice: 4500,
      currency: "INR",
    },
    billingCycle: "Monthly",
    startDate: new Date().toISOString().split("T")[0],
    addOns: ["Interior Cleaning", "Polish"],
  });

  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>("Converted");
  const [result, setResult] = useState<any>(null);

  const handleConvertLead = () => {
    const lead: Lead = {
      leadId: `LEAD-${Date.now()}`,
      firstName: leadForm.firstName!,
      lastName: leadForm.lastName!,
      email: leadForm.email!,
      phone: leadForm.phone!,
      address: leadForm.address!,
      vehicleDetails: leadForm.vehicleDetails,
      leadSource: leadForm.leadSource!,
      status: "Converted",
    };

    const plan: SubscriptionPlan = {
      packageType: planForm.packageType!,
      packageName: planForm.packageName!,
      frequency: planForm.frequency!,
      pricing: planForm.pricing!,
      billingCycle: planForm.billingCycle!,
      startDate: planForm.startDate!,
      addOns: planForm.addOns,
    };

    const conversionResult = flows.convertLead(lead, plan);
    setResult(conversionResult);
  };

  const handleCompleteDemo = () => {
    const lead: Lead = {
      leadId: `LEAD-${Date.now()}`,
      firstName: leadForm.firstName!,
      lastName: leadForm.lastName!,
      email: leadForm.email!,
      phone: leadForm.phone!,
      address: leadForm.address!,
      vehicleDetails: leadForm.vehicleDetails,
      leadSource: leadForm.leadSource!,
      status: "Demo Completed",
    };

    const plan: SubscriptionPlan = {
      packageType: planForm.packageType!,
      packageName: planForm.packageName!,
      frequency: planForm.frequency!,
      pricing: planForm.pricing!,
      billingCycle: planForm.billingCycle!,
      startDate: planForm.startDate!,
      addOns: planForm.addOns,
    };

    const demoResult = flows.completeDemo({
      demoId: `DEMO-${Date.now()}`,
      leadId: lead.leadId,
      lead,
      outcome: demoOutcome,
      plan,
      notes: "Test demo completion",
      rejectionReason: demoOutcome === "Rejected" ? "Customer not interested" : undefined,
    });

    setResult(demoResult);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Dashboard Stats */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Business Flow Dashboard</h1>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-600" />
                Total Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-600" />
                Monthly MRR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.monthlyMRR.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Pipeline Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Job Pipeline (3-State Model)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-900">Unassigned</span>
              </div>
              <div className="text-3xl font-bold text-amber-600">{stats.unassignedJobs}</div>
              <p className="text-xs text-amber-700 mt-1">Awaiting supervisor assignment</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Assigned</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{stats.assignedJobs}</div>
              <p className="text-xs text-blue-700 mt-1">Assigned to washers</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-900">Completed</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.completedJobs}</div>
              <p className="text-xs text-green-700 mt-1">Finished jobs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flow Testing */}
      <Tabs defaultValue="convert">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="convert">Lead Conversion (Flow 1)</TabsTrigger>
          <TabsTrigger value="demo">Demo Completion (Flow 2)</TabsTrigger>
        </TabsList>

        <TabsContent value="convert" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Lead Conversion Flow</CardTitle>
              <p className="text-sm text-gray-600">
                Convert lead → Create customer → Create subscription → Generate jobs → Update MRR
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>First Name</Label>
                  <Input
                    value={leadForm.firstName}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    value={leadForm.lastName}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, lastName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={leadForm.email}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={leadForm.phone}
                    onChange={(e) =>
                      setLeadForm({ ...leadForm, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Subscription Plan</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label>Package Type</Label>
                    <Select
                      value={planForm.packageType}
                      onValueChange={(value) =>
                        setPlanForm({ ...planForm, packageType: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Basic">Basic</SelectItem>
                        <SelectItem value="Standard">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="Deluxe">Deluxe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Frequency</Label>
                    <Select
                      value={planForm.frequency}
                      onValueChange={(value) =>
                        setPlanForm({ ...planForm, frequency: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Alternate Days">Alternate Days</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Final Price (₹)</Label>
                    <Input
                      type="number"
                      value={planForm.pricing?.finalPrice}
                      onChange={(e) =>
                        setPlanForm({
                          ...planForm,
                          pricing: {
                            ...planForm.pricing!,
                            finalPrice: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label>Billing Cycle</Label>
                    <Select
                      value={planForm.billingCycle}
                      onValueChange={(value) =>
                        setPlanForm({ ...planForm, billingCycle: value as any })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Button onClick={handleConvertLead} className="w-full">
                Convert Lead to Customer
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Demo Completion Flow</CardTitle>
              <p className="text-sm text-gray-600">
                Complete demo with different outcomes: Converted, Trial, Pending, Rejected
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Demo Outcome</Label>
                <Select
                  value={demoOutcome}
                  onValueChange={(value) => setDemoOutcome(value as DemoOutcome)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Converted">Converted (Full Flow)</SelectItem>
                    <SelectItem value="Trial">Trial (No Jobs Yet)</SelectItem>
                    <SelectItem value="Pending">Pending (Follow-up)</SelectItem>
                    <SelectItem value="Rejected">Rejected (Close)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertTitle>Outcome Behavior</AlertTitle>
                <AlertDescription>
                  {demoOutcome === "Converted" &&
                    "Will create customer, subscription, and generate jobs"}
                  {demoOutcome === "Trial" &&
                    "Will create customer and trial subscription (NO jobs)"}
                  {demoOutcome === "Pending" && "Will mark for follow-up in 3 days"}
                  {demoOutcome === "Rejected" && "Will close demo with no further action"}
                </AlertDescription>
              </Alert>

              <Button onClick={handleCompleteDemo} className="w-full">
                Complete Demo
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Result Display */}
      {result && (
        <Card className={result.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              {result.success ? "Flow Executed Successfully" : "Flow Failed"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium">{result.message || "Operation completed"}</p>
              {result.customer && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Customer ID: {result.customer.customerId}</Badge>
                </div>
              )}
              {result.subscription && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Subscription ID: {result.subscription.subscriptionId}</Badge>
                  <Badge variant="outline">Status: {result.subscription.status}</Badge>
                </div>
              )}
              {result.jobsGenerated && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Jobs Generated: {result.jobsGenerated.length}</Badge>
                  <Badge className="bg-amber-100 text-amber-700">All Unassigned</Badge>
                </div>
              )}
              {result.mrrUpdated && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-700">MRR Updated</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Pipeline View */}
      <Card>
        <CardHeader>
          <CardTitle>Current Job Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unassigned">
            <TabsList>
              <TabsTrigger value="unassigned">
                Unassigned ({pipeline.unassigned.length})
              </TabsTrigger>
              <TabsTrigger value="assigned">
                Assigned ({pipeline.assigned.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({pipeline.completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unassigned">
              {pipeline.unassigned.length === 0 ? (
                <p className="text-gray-500 text-sm">No unassigned jobs</p>
              ) : (
                <div className="space-y-2">
                  {pipeline.unassigned.slice(0, 5).map((job) => (
                    <div
                      key={job.jobId}
                      className="border rounded p-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{job.jobId}</p>
                        <p className="text-sm text-gray-600">
                          {job.scheduledDate} • {job.timeSlot}
                        </p>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700">Unassigned</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assigned">
              {pipeline.assigned.length === 0 ? (
                <p className="text-gray-500 text-sm">No assigned jobs</p>
              ) : (
                <div className="space-y-2">
                  {pipeline.assigned.slice(0, 5).map((job) => (
                    <div
                      key={job.jobId}
                      className="border rounded p-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{job.jobId}</p>
                        <p className="text-sm text-gray-600">
                          Washer: {job.washerId}
                        </p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">{job.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="completed">
              {pipeline.completed.length === 0 ? (
                <p className="text-gray-500 text-sm">No completed jobs</p>
              ) : (
                <div className="space-y-2">
                  {pipeline.completed.slice(0, 5).map((job) => (
                    <div
                      key={job.jobId}
                      className="border rounded p-2 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium">{job.jobId}</p>
                        <p className="text-sm text-gray-600">
                          Completed: {job.completedAt?.split("T")[0]}
                        </p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">{job.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
