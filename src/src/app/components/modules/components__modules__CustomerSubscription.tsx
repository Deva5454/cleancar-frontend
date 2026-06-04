import { BackButton } from "../ui/back-button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Users, DollarSign, Car, TrendingUp, Settings, MapPin } from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useEventListener } from "../../contexts/EventSystem";
import { useMemo } from "react";

// Import Design System Components
import { logger } from "../../services/logger";
import {
  PageHeader,
  StatusBadge,
  StatCard,
  DataTable,
  EmptyState,
  InfoCard,
} from "../../design-system/components";

export function CustomerSubscription() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const { subscriptions } = useCustomerSubscriptions();
  const { customers } = useCustomers();

  // Listen for real-time updates
  useEventListener("LEAD_CONVERTED", () => {
    logger.log("[CustomerSubscription] Lead converted - UI auto-updating");
  });

  useEventListener("SUBSCRIPTION_CREATED", () => {
    logger.log("[CustomerSubscription] Subscription created - UI auto-updating");
  });

  // Map subscriptions with customer data
  const customerSubscriptions = useMemo(() => {
    return (subscriptions || []).map(sub => {
      const customer = (customers || []).find(c => c.customerId === sub.customerId);

      return {
        customerId: sub.customerId,
        customerName: customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Customer",
        planType: sub.packageType,
        billingCycle: sub.billingCycle,
        carDetails: {
          registrationNumber: customer?.vehicleDetails?.registrationNumber || "N/A",
          make: customer?.vehicleDetails?.brand || "Unknown",
          model: customer?.vehicleDetails?.category || "Unknown",
        },
        vehicleCategory: customer?.address?.area || "Unknown Location",
        monthlyPrice: sub.pricing.finalPrice,
        nextBillingDate: sub.renewalDate || "N/A",
        status: sub.status,
        subscriptionId: sub.subscriptionId,
      };
    });
  }, [subscriptions, customers]);

  const totalMRR = customerSubscriptions.reduce((sum, c) => sum + c.monthlyPrice, 0);
  const activeCars = customerSubscriptions.filter(c => c.status === "Active").length;
  const avgPlanValue = customerSubscriptions.length > 0 ? Math.round(totalMRR / customerSubscriptions.length) : 0;

  return (
    <div className="space-y-6">
      <BackButton />
      {/* Page Header - Using Design System */}
      <PageHeader
        title="Customer & Subscription"
        description="Manage subscriptions, plans, and payments"
        primaryAction={{
          label: "Plan Management",
          onClick: () => navigate("/subscription/plan-management"),
          icon: <Settings className="w-4 h-4 mr-2" />,
        }}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => navigate("/") },
          { label: "Customers" },
        ]}
      />

      {/* Stats Cards - Using Design System */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Active Customers"
          value={activeCars.toString()}
          icon={Users}
          variant="default"
          change={{ value: "+8%", type: "increase" }}
        />
        <StatCard
          label="Monthly Revenue"
          value={`₹${(totalMRR / 1000).toFixed(0)}K`}
          icon={DollarSign}
          variant="success"
          change={{ value: "+15%", type: "increase" }}
        />
        <StatCard
          label="Total Cars"
          value={customerSubscriptions.length.toString()}
          icon={Car}
          variant="info"
        />
        <StatCard
          label="Avg Plan Value"
          value={`₹${avgPlanValue}`}
          icon={TrendingUp}
          variant="warning"
          change={{ value: "+3%", type: "increase" }}
        />
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Subscriptions</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Customer Table - Using Design System DataTable */}
          {customerSubscriptions.length === 0 ? (
            <EmptyState
              title="No subscriptions found"
              description="Start by adding your first customer subscription"
              actionText="Add Subscription"
              onAction={() => navigate("/subscription/plan-management")}
            />
          ) : (
            <DataTable
              data={customerSubscriptions}
              columns={[
                { key: "customerId", label: "Customer ID", sortable: true },
                { key: "customerName", label: "Name", sortable: true },
                {
                  key: "planType",
                  label: "Plan",
                  render: (planType) => <StatusBadge status={planType} showIcon={false} />,
                },
                {
                  key: "carDetails",
                  label: "Car Details",
                  render: (carDetails) => (
                    <div>
                      <p className="font-medium text-sm">{carDetails.registrationNumber}</p>
                      <p className="text-xs text-gray-500">{carDetails.make} {carDetails.model}</p>
                    </div>
                  ),
                },
                {
                  key: "vehicleCategory",
                  label: "Address",
                  render: (category) => (
                    <div className="flex items-start gap-1">
                      <span className="text-sm">{category}</span>
                    </div>
                  ),
                },
                {
                  key: "monthlyPrice",
                  label: "MRR",
                  align: "right",
                  render: (price) => `₹${price.toLocaleString()}`,
                },
                { key: "nextBillingDate", label: "Next Wash" },
                {
                  key: "status",
                  label: "Status",
                  align: "center",
                  render: (status) => <StatusBadge status={status} />,
                },
              ]}
              searchable
              searchPlaceholder="Search customers..."
              paginated
              pageSize={10}
            />
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {customerSubscriptions.filter(c => c.status === "Active").length === 0 ? (
                <EmptyState
                  title="No active subscriptions"
                  description="All subscriptions are currently inactive or pending"
                  type="default"
                />
              ) : (
                <div className="space-y-3">
                  {customerSubscriptions.filter(c => c.status === "Active").map((customer) => (
                    <div key={customer.customerId} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <div className="w-12 h-12 bg-green-500 text-white rounded-lg flex items-center justify-center">
                            <Car className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <p className="text-sm text-gray-600">{customer.carDetails.registrationNumber} • {customer.carDetails.make} {customer.carDetails.model}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {customer.vehicleCategory}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={customer.planType} showIcon={false} />
                          <p className="text-sm font-medium mt-2">₹{customer.monthlyPrice}/mo</p>
                          <p className="text-xs text-gray-500">Next: {customer.nextBillingDate}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <EmptyState
            title="Payment Ledger"
            description="Payment tracking and history will be available soon"
            type="default"
          />
        </TabsContent>

        <TabsContent value="plans" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard
              title="Monthly Billing"
              subtitle="Most Popular"
              icon={Car}
              items={[
                { label: "Subscriptions", value: customerSubscriptions.filter(c => c.billingCycle === "Monthly").length.toString() },
                { label: "Water Wash", value: customerSubscriptions.filter(c => c.billingCycle === "Monthly" && c.planType === "Water Wash").length.toString() },
                { label: "Water + Shampoo", value: customerSubscriptions.filter(c => c.billingCycle === "Monthly" && c.planType === "Water + Shampoo").length.toString() },
                { label: "Water + Shampoo + Wax", value: customerSubscriptions.filter(c => c.billingCycle === "Monthly" && c.planType === "Water + Shampoo + Wax").length.toString() },
              ]}
              actions={
                <Button size="sm" variant="outline" onClick={() => navigate("/subscription/plan-management")}>
                  Manage
                </Button>
              }
            />
            <InfoCard
              title="Quarterly Billing"
              subtitle="Best Value"
              icon={Car}
              items={[
                { label: "Subscriptions", value: customerSubscriptions.filter(c => c.billingCycle === "Quarterly").length.toString() },
                { label: "Water Wash", value: customerSubscriptions.filter(c => c.billingCycle === "Quarterly" && c.planType === "Water Wash").length.toString() },
                { label: "Water + Shampoo", value: customerSubscriptions.filter(c => c.billingCycle === "Quarterly" && c.planType === "Water + Shampoo").length.toString() },
                { label: "Water + Shampoo + Wax", value: customerSubscriptions.filter(c => c.billingCycle === "Quarterly" && c.planType === "Water + Shampoo + Wax").length.toString() },
              ]}
              actions={
                <Button size="sm" variant="outline" onClick={() => navigate("/subscription/plan-management")}>
                  Manage
                </Button>
              }
            />
            <InfoCard
              title="Annual Billing"
              subtitle="Maximum Savings"
              icon={Car}
              items={[
                { label: "Subscriptions", value: customerSubscriptions.filter(c => c.billingCycle === "Annual").length.toString() },
                { label: "Water Wash", value: customerSubscriptions.filter(c => c.billingCycle === "Annual" && c.planType === "Water Wash").length.toString() },
                { label: "Water + Shampoo", value: customerSubscriptions.filter(c => c.billingCycle === "Annual" && c.planType === "Water + Shampoo").length.toString() },
                { label: "Water + Shampoo + Wax", value: customerSubscriptions.filter(c => c.billingCycle === "Annual" && c.planType === "Water + Shampoo + Wax").length.toString() },
              ]}
              actions={
                <Button size="sm" variant="outline" onClick={() => navigate("/subscription/plan-management")}>
                  Manage
                </Button>
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
