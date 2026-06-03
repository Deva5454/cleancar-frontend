import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  Users,
  Calendar,
  DollarSign,
  Download,
  Filter,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { usePlanDefinitions } from "../../contexts/PlanDefinitionContext";
import { useCustomerSubscriptions, useCustomers } from "../../contexts/AppProvider";
import { BackButton } from "../ui/back-button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { CHART_COLORS } from "../../lib/constants";
import {
  calculateSubscriptionLTV,
  calculateEffectiveMonthlyPrice,
  PACKAGE_RETENTION_MONTHS,
  classifyLTVValue,
  formatINR,
} from "../../lib/analytics-utils";
import { MetricCard } from "./MetricCard";
import { AnalyticsEmpty } from "./AnalyticsState";

// NOTE: LTV Trend and Cohort Retention data require historical tracking over time
// These remain as representative data until historical tracking is implemented
const ltvTrend = [
  { id: "q1", quarter: "Q1 2025", ltv: 16500 },
  { id: "q2", quarter: "Q2 2025", ltv: 17200 },
  { id: "q3", quarter: "Q3 2025", ltv: 18100 },
  { id: "q4", quarter: "Q4 2025", ltv: 18500 },
  { id: "q5", quarter: "Q1 2026", ltv: 19500 },
];

const cohortRetention = [
  { id: "m0", month: "Month 0", retention: 100 },
  { id: "m1", month: "Month 1", retention: 92 },
  { id: "m2", month: "Month 2", retention: 88 },
  { id: "m3", month: "Month 3", retention: 85 },
  { id: "m6", month: "Month 6", retention: 78 },
  { id: "m12", month: "Month 12", retention: 68 },
  { id: "m18", month: "Month 18", retention: 58 },
  { id: "m24", month: "Month 24", retention: 45 },
];

function CustomerLTVAnalysis() {
  const { currentRole } = useRole();
  const { planTypes } = usePlanDefinitions();
  const { subscriptions: customerSubscriptions } = useCustomerSubscriptions();
  const { customers } = useCustomers();

  const hasAccess = currentRole === "Super Admin" || currentRole === "Admin" || currentRole === "Accounts";

  // Calculate real retention from subscription history
  const realRetentionByPackage = useMemo(() => {
    const churnedSubs = customerSubscriptions.filter(s => s.status === "Cancelled" || s.status === "Churned");
    const packageMap: Record<string, number[]> = {};
    churnedSubs.forEach(sub => {
      if (!sub.startDate || !sub.endDate) return;
      const months = Math.max(1, Math.round(
        ((sub.endDate ? new Date(sub.endDate).getTime() : Date.now()) - new Date(sub.startDate).getTime()) / (30 * 86400000)
      ));
      const pkg = sub.packageType || "Unknown";
      if (!packageMap[pkg]) packageMap[pkg] = [];
      packageMap[pkg].push(months);
    });
    const retention: Record<string, number> = {};
    Object.entries(packageMap).forEach(([pkg, months]) => {
      retention[pkg] = Math.round(months.reduce((s, m) => s + m, 0) / months.length);
    });
    return retention;
  }, [customerSubscriptions]);

  const getRetentionMonths = (packageType: string): number =>
    realRetentionByPackage[packageType] ||
    PACKAGE_RETENTION_MONTHS[packageType] ||  // fallback to assumed values
    12;

  if (!hasAccess) {
    return (
      <div className="p-6">
        <BackButton />
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-lg font-semibold">Access Denied</div>
            <p className="text-gray-500 mt-2">
              You don't have permission to access Customer LTV Analysis.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate LTV by Plan from real customer subscriptions
  const ltvByPlan = useMemo(() => {
    const packageTypes = Array.from(new Set(customerSubscriptions.map(sub => sub.packageType)));

    return packageTypes.map((packageType, index) => {
      const customersInPlan = customerSubscriptions.filter(sub => sub.packageType === packageType);
      const customerCount = customersInPlan.length;

      if (customerCount === 0) return null;

      const retentionMonths = getRetentionMonths(packageType);
      const ltvValues = customersInPlan.map(calculateSubscriptionLTV);
      const avgLTV = Math.round(ltvValues.reduce((sum, ltv) => sum + ltv, 0) / customerCount);
      const totalValue = ltvValues.reduce((sum, ltv) => sum + ltv, 0);

      return {
        id: `ltv-${index + 1}`,
        plan: packageType,
        avgLTV,
        customers: customerCount,
        totalValue,
        retention: retentionMonths,
      };
    }).filter(Boolean);
  }, [customerSubscriptions]);

  // Calculate LTV by City from real customer data
  const ltvByCity = useMemo(() => {
    const cityMap = new Map<string, { subscriptions: typeof customerSubscriptions, customerCount: number }>();

    customerSubscriptions.forEach(sub => {
      const customer = customers.find(c => c.customerId === sub.customerId);
      if (!customer) return;

      const city = customer?.address?.city ?? (customer as any)?.city ?? (customer as any)?.cityId?.replace("CITY-","") ?? "Unknown";
      if (!cityMap.has(city)) {
        cityMap.set(city, { subscriptions: [], customerCount: 0 });
      }
      const cityData = cityMap.get(city)!;
      cityData.subscriptions.push(sub);
      cityData.customerCount++;
    });

    return Array.from(cityMap.entries()).map(([city, data], index) => {
      const ltvValues = data.subscriptions.map(calculateSubscriptionLTV);
      const avgLTV = Math.round(ltvValues.reduce((sum, ltv) => sum + ltv, 0) / data.customerCount);
      const totalValue = ltvValues.reduce((sum, ltv) => sum + ltv, 0);

      return {
        id: `city-${index + 1}`,
        city,
        avgLTV,
        customers: data.customerCount,
        totalValue,
      };
    }).sort((a, b) => b.totalValue - a.totalValue);
  }, [customerSubscriptions, customers]);

  const validPlans = ltvByPlan.filter((p): p is NonNullable<typeof p> => p != null);
  const totalCustomers = validPlans.reduce((sum, p) => sum + p.customers, 0);
  const avgLTV = totalCustomers > 0
    ? Math.round(validPlans.reduce((sum, p) => sum + (p.avgLTV * p.customers), 0) / totalCustomers)
    : 0;
  const totalLTVValue = validPlans.reduce((sum, p) => sum + p.totalValue, 0);

  // Show empty state if no data
  if (customerSubscriptions.length === 0) {
    return (
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        <BackButton />
        <header>
          <h1 className="text-2xl font-bold">Customer Lifetime Value (LTV) Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer value over their complete lifecycle
          </p>
        </header>
        <AnalyticsEmpty
          title="No Customer Data"
          message="Customer LTV analysis will be available once you have active subscriptions."
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <BackButton />
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Customer Lifetime Value (LTV) Analysis</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer value over their complete lifecycle
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" aria-label="Filter time period">
            <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
            All Time
          </Button>
          <Button variant="outline" size="sm" aria-label="Export report">
            <Download className="w-4 h-4 mr-2" aria-hidden="true" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Summary Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" aria-label="Key metrics">
        <MetricCard
          label="Average LTV"
          value={formatINR(avgLTV)}
          subtitle="Per customer"
          icon={DollarSign}
          iconColor="blue"
        />
        <MetricCard
          label="Total LTV Value"
          value={formatINR(totalLTVValue, { compact: true })}
          subtitle="Across all customers"
          icon={TrendingUp}
          iconColor="green"
        />
        <MetricCard
          label="Total Customers"
          value={totalCustomers.toLocaleString("en-IN")}
          subtitle="Active subscribers"
          icon={Users}
          iconColor="purple"
        />
        <MetricCard
          label="Avg. Retention"
          value="16.8 months"
          subtitle="Customer lifespan"
          icon={Calendar}
          iconColor="orange"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4" aria-label="LTV analytics charts">
        {/* LTV by Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average LTV by Subscription Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ltvByPlan} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="plan" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Bar dataKey="avgLTV" fill={CHART_COLORS[0]} name="Average LTV" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* LTV by City */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average LTV by City</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ltvByCity} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="city" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Bar dataKey="avgLTV" fill={CHART_COLORS[1]} name="Average LTV" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* LTV Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">LTV Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ltvTrend} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="ltv" stroke={CHART_COLORS[4]} strokeWidth={3} name="LTV" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cohort Retention */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Retention Curve</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cohortRetention} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={50} />
                <RechartsTooltip />
                <Line type="monotone" dataKey="retention" stroke={CHART_COLORS[2]} strokeWidth={3} name="Retention %" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      {/* LTV by Plan Table */}
      <Card>
        <CardHeader>
          <CardTitle>LTV Breakdown by Subscription Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="LTV breakdown by subscription plan">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    Plan Name
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Customers
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Avg. LTV
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Total LTV Value
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Avg. Retention (Months)
                  </th>
                  <th scope="col" className="text-center p-3 text-sm font-semibold text-muted-foreground">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {validPlans.map((plan) => {
                  const classification = classifyLTVValue(plan.avgLTV);
                  return (
                    <tr key={plan.id} className="border-b hover:bg-muted/50">
                      <th scope="row" className="p-3 font-medium text-left">
                        {plan.plan}
                      </th>
                      <td className="p-3 text-right">{(plan?.customers ?? 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold" style={{ color: CHART_COLORS[0] }}>
                        {formatINR(plan.avgLTV)}
                      </td>
                      <td className="p-3 text-right font-medium">{formatINR(plan.totalValue)}</td>
                      <td className="p-3 text-right">{plan.retention} months</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            classification === "high"
                              ? "default"
                              : classification === "good"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {classification === "high"
                            ? "High Value"
                            : classification === "good"
                            ? "Good"
                            : "Average"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* LTV by City Table */}
      <Card>
        <CardHeader>
          <CardTitle>LTV Breakdown by City</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" role="table" aria-label="LTV breakdown by city">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="text-left p-3 text-sm font-semibold text-muted-foreground">
                    City
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Customers
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Avg. LTV
                  </th>
                  <th scope="col" className="text-right p-3 text-sm font-semibold text-muted-foreground">
                    Total LTV Value
                  </th>
                  <th scope="col" className="text-center p-3 text-sm font-semibold text-muted-foreground">
                    Market Potential
                  </th>
                </tr>
              </thead>
              <tbody>
                {ltvByCity.map((city) => {
                  const classification = classifyLTVValue(city.avgLTV);
                  return (
                    <tr key={city.id} className="border-b hover:bg-muted/50">
                      <th scope="row" className="p-3 font-medium text-left">
                        {city.city}
                      </th>
                      <td className="p-3 text-right">{(city?.customers ?? 0).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right font-semibold" style={{ color: CHART_COLORS[1] }}>
                        {formatINR(city.avgLTV)}
                      </td>
                      <td className="p-3 text-right font-medium">{formatINR(city.totalValue)}</td>
                      <td className="p-3 text-center">
                        <Badge variant={classification === "high" ? "default" : "secondary"}>
                          {classification === "high" ? "Premium Market" : "Growing Market"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CustomerLTVAnalysis;