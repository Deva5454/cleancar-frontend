// Executive Dashboard for Super Admin
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { RoleInfo } from "../RoleInfo";
import { PlanChangeImpactDashboard } from "../subscription/PlanChangeImpactDashboard";
import { Link } from "react-router-dom";
import {
  Users, TrendingUp, Car, AlertTriangle,
  DollarSign, Package, CheckCircle, Crown,
  Activity, Wallet, Target, ArrowRight, Lightbulb,
  Calculator
} from "lucide-react";
import { useLiveKPI } from "../../hooks/useLiveKPI";
import { useRole } from "../../contexts/RoleContext";
import { BackButton } from "../ui/back-button";
import { useCustomers } from "../../contexts/AppProvider";
import { useEmployee } from "../../contexts/EmployeeContext";

// kpiCards moved inside component — see below

export function ExecutiveDashboard() {
  const { currentRole } = useRole();
  const { customers } = useCustomers();
  const kpi = useLiveKPI();

  // KPI cards — live data from contexts (replaces MASTER_KPI_DATA)
  const kpiCards = [
    { title: "Total Customers",    value: kpi.totalCustomers,                               change: "+12%", icon: Users,         color: "text-blue-600",    bgColor: "bg-blue-50" },
    { title: "Conversion Rate",    value: `${kpi.conversionRate}%`,                         change: "+5%",  icon: TrendingUp,    color: "text-green-600",   bgColor: "bg-green-50" },
    { title: "Active Customers",   value: kpi.totalCustomers,                               change: "+8%",  icon: Users,         color: "text-purple-600",  bgColor: "bg-purple-50" },
    { title: "Monthly Revenue",    value: `₹${(kpi.monthlyRevenue / 1000).toFixed(0)}K`,    change: "+10%", icon: DollarSign,    color: "text-emerald-600", bgColor: "bg-emerald-50" },
    { title: "Active Washers",     value: kpi.activeWashers,                                change: "+6%",  icon: Car,           color: "text-orange-600",  bgColor: "bg-orange-50" },
    { title: "Active Subs",        value: kpi.activeSubscriptions,                          change: "+9%",  icon: CheckCircle,   color: "text-teal-600",    bgColor: "bg-teal-50" },
    { title: "EBITDA Margin",      value: `${kpi.ebitdaMargin.toFixed(1)}%`,                change: "+2%",  icon: AlertTriangle, color: "text-red-600",     bgColor: "bg-red-50" },
    { title: "MRR",                value: `₹${(kpi.mrrRevenue / 1000).toFixed(0)}K`,        change: "+7%",  icon: Package,       color: "text-indigo-600",  bgColor: "bg-indigo-50" },
  ];
  const { employees } = useEmployee();

  // Calculate metrics from real data
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.status === "Active").length;
  const totalEmployees = employees.length;
  const activeWashers = employees.filter(e => e.role === "Car Washer" && e.status === "Active").length;

  // TODO: Replace with real context data when available
  const leads: any[] = [];
  const approvals: any[] = [];

  return (
    <div className="space-y-6">
      <BackButton />
      <RoleInfo />

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
        <p className="text-sm text-gray-500 mt-1">Complete business intelligence across all modules</p>
      </div>

      {/* Founder Control Tower Quick Access - Only for Super Admin */}
      {(currentRole === "Super Admin" || currentRole === "Admin") && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Founder Control Tower</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    360° business intelligence • Financial health • Cash flow • Unit economics • Marketing ROI
                  </p>
                </div>
              </div>
              <Link to="/founder/control-tower">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Open Control Tower
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-4">
              <Link to="/founder/control-tower" className="group">
                <div className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                  <Crown className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Control Tower</div>
                  <div className="text-xs text-gray-500">Main Dashboard</div>
                </div>
              </Link>
              <Link to="/founder/financial-view" className="group">
                <div className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 transition-colors cursor-pointer">
                  <Activity className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Financial View</div>
                  <div className="text-xs text-gray-500">P&L Analysis</div>
                </div>
              </Link>
              <Link to="/founder/cash-flow" className="group">
                <div className="p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-colors cursor-pointer">
                  <Wallet className="w-5 h-5 text-green-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Cash Flow</div>
                  <div className="text-xs text-gray-500">Runway Tracking</div>
                </div>
              </Link>
              <Link to="/founder/marketing-roi" className="group">
                <div className="p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 transition-colors cursor-pointer">
                  <Target className="w-5 h-5 text-orange-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Marketing ROI</div>
                  <div className="text-xs text-gray-500">Channel Analysis</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Per Wash Intelligence - Prominent Quick Access */}
      {(currentRole === "Super Admin" || currentRole === "Admin" || currentRole === "Operations Manager" || currentRole === "Accounts") && (
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg shadow-lg">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Cost Per Wash Intelligence</h3>
                    <Badge className="bg-emerald-600 text-white">NEW</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Real-time cost analysis • Profitability tracking • AI-powered recommendations • EBITDA optimization
                  </p>
                </div>
              </div>
              <Link to="/finance/cost-per-wash">
                <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg">
                  Open Cost Intelligence
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            {/* Quick Access Grid */}
            <div className="grid grid-cols-5 gap-3 mt-4">
              <Link to="/finance/cost-per-wash" className="group">
                <div className="p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer">
                  <Calculator className="w-5 h-5 text-emerald-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Company Cost</div>
                  <div className="text-xs text-gray-500">Actual CPW</div>
                </div>
              </Link>
              <Link to="/finance/cost-per-wash" className="group">
                <div className="p-3 bg-white rounded-lg border border-teal-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer">
                  <DollarSign className="w-5 h-5 text-teal-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Customer Price</div>
                  <div className="text-xs text-gray-500">Pricing & EBITDA</div>
                </div>
              </Link>
              <Link to="/finance/cost-per-wash" className="group">
                <div className="p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer">
                  <Package className="w-5 h-5 text-blue-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Tracking Reports</div>
                  <div className="text-xs text-gray-500">Multi-dimensional</div>
                </div>
              </Link>
              <Link to="/finance/cost-per-wash" className="group">
                <div className="p-3 bg-white rounded-lg border border-purple-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
                  <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Trends Dashboard</div>
                  <div className="text-xs text-gray-500">Historical Analysis</div>
                </div>
              </Link>
              <Link to="/finance/cost-per-wash" className="group">
                <div className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg border-2 border-amber-300 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer">
                  <Lightbulb className="w-5 h-5 text-amber-600 mb-2" />
                  <div className="text-xs font-semibold text-gray-900">Recommendations</div>
                  <div className="text-xs text-amber-600 font-bold">⭐ AI Insights</div>
                </div>
              </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-emerald-200">
              <div className="text-center">
                <div className="text-xs text-gray-600">Avg Cost/Wash</div>
                <div className="text-lg font-bold text-emerald-700">₹{kpi.ebitdaMargin.toFixed(1) + "%"}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">EBITDA Margin</div>
                <div className="text-lg font-bold text-teal-700">{kpi.ebitdaMargin.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Total Washes</div>
                <div className="text-lg font-bold text-amber-700">{kpi.totalCustomers.toLocaleString("en-IN")}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-600">Monthly Revenue</div>
                <div className="text-lg font-bold text-green-700">₹{(kpi.monthlyRevenue / 1000).toFixed(0)}K</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{kpi.title}</p>
                    <p className="text-2xl font-bold mt-2">{kpi.value}</p>
                    <Badge variant="outline" className="mt-2">
                      {kpi.change} vs last month
                    </Badge>
                  </div>
                  <div className={`${kpi.bgColor} ${kpi.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Change Impact Dashboard - Only for Admin & Super Admin */}
      {(currentRole === "Super Admin" || currentRole === "Admin") && (
        <PlanChangeImpactDashboard />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent Leads</h3>
            <div className="space-y-3">
              {leads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <p className="text-xs text-gray-500">{lead.source} • {lead.carType}</p>
                  </div>
                  <Badge variant={lead.status === "New" ? "default" : "secondary"}>
                    {lead.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Pending Approvals</h3>
            <div className="space-y-3">
              {approvals.filter(a => a.status === "Pending").map((approval) => (
                <div key={approval.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{approval.type}</p>
                    <p className="text-xs text-gray-500">{approval.requester}</p>
                  </div>
                  <Badge variant="default">{approval.priority}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}