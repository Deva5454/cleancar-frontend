// Dashboard for Procurement Manager role
import { useRole } from "../../contexts/RoleContext";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  ShoppingCart,
  FileText,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Package,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { MASTER_KPI_DATA, MASTER_INVENTORY, MASTER_APPROVALS } from "../../data/masterData";
import { toast } from "sonner";

export function ProcurementDashboard() {
  const { currentUser } = useRole();

  // Calculate procurement metrics from centralized data
  const pendingRequisitions = MASTER_APPROVALS.filter(a => a.type === "Material Purchase" && a.status === "Pending").length;
  const totalInventoryValue = MASTER_INVENTORY.reduce((sum, item) => sum + item.totalValue, 0);
  const lowStockCount = MASTER_INVENTORY.filter(item => item.currentStock < item.reorderPoint).length;

  // Procurement Manager sees ALL procurement data + FINANCIAL VALUES (costs, budgets)
  const stats = {
    pendingRequisitions: pendingRequisitions,
    pendingPOApprovals: 3,
    activeSuppliers: 24,
    monthlySpend: totalInventoryValue,
    pendingGRNs: 5,
    pendingInvoices: 12,
    savingsThisMonth: 42000,
    onTimeDelivery: 94,
  };

  // Derive urgent actions from centralized approvals
  const urgentActions = MASTER_APPROVALS
    .filter(approval => approval.type === "Material Purchase" && approval.status === "Pending")
    .map(approval => ({
      id: approval.id,
      type: "PO Approval",
      title: `${approval.description}`,
      amount: approval.amount || 0,
      supplier: "Pending Supplier Assignment",
      dueDate: "Today",
      priority: approval.priority,
    }))
    .concat([
      {
        id: "SUPP-001",
        type: "Supplier Review",
        title: "Quarterly Performance Review",
        amount: 0,
        supplier: "5 Suppliers Pending",
        dueDate: "2 days",
        priority: "Low" as const,
      }
    ]);

  // Top suppliers based on inventory vendors
  const vendorStats = MASTER_INVENTORY.reduce((acc, item) => {
    if (!acc[item.vendor]) {
      acc[item.vendor] = { spend: 0, orders: 0 };
    }
    acc[item.vendor].spend += item.totalValue;
    acc[item.vendor].orders += 1;
    return acc;
  }, {} as Record<string, { spend: number; orders: number }>);

  const topSuppliers = Object.entries(vendorStats)
    .map(([name, stats]) => ({
      name,
      spend: stats.spend,
      orders: stats.orders,
      onTime: 92 + Math.floor(Math.random() * 7), // 92-98%
    }))
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 3);

  const recentPOs = [
    {
      poNumber: "PO-2026-0245",
      supplier: "ChemClean Industries",
      amount: 125000,
      status: "Pending Approval",
      date: "Mar 17, 2026",
    },
    {
      poNumber: "PO-2026-0244",
      supplier: "AutoCare Solutions",
      amount: 68500,
      status: "Approved",
      date: "Mar 16, 2026",
    },
    {
      poNumber: "PO-2026-0243",
      supplier: "ProWash Equipment",
      amount: 52000,
      status: "Delivered",
      date: "Mar 15, 2026",
    },
  ];

  const handleTakeAction = (actionTitle: string) => {
    toast.info(`Taking action on: ${actionTitle}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Procurement Manager Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            Welcome, {currentUser.name} • {currentUser.city} Procurement Center
          </p>
          {/* Financial Access Indicator */}
          <p className="text-xs text-green-600 mt-1 font-medium">
            ✅ Full Procurement Financial Access (Costs, Budgets, Savings)
          </p>
        </div>
        <Link to="/procurement">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Full Procurement Module
          </Button>
        </Link>
      </div>

      {/* KPI Stats Grid - WITH FINANCIAL VALUES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Requisitions</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingRequisitions}</p>
                <p className="text-xs text-orange-600 mt-1">Requires review</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">PO Approvals Pending</p>
                <p className="text-3xl font-bold mt-1">{stats.pendingPOApprovals}</p>
                <p className="text-xs text-red-600 mt-1">Action required</p>
              </div>
              <div className="bg-red-50 text-red-600 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Spend</p>
                <p className="text-3xl font-bold mt-1">₹{(stats.monthlySpend / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">Current month</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Cost Savings</p>
                <p className="text-3xl font-bold mt-1 text-green-600">₹{(stats.savingsThisMonth / 1000).toFixed(0)}K</p>
                <p className="text-xs text-green-600 mt-1">This month</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-purple-50 text-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.activeSuppliers}</p>
              <p className="text-xs text-gray-500">Active Suppliers</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-teal-50 text-teal-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Package className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingGRNs}</p>
              <p className="text-xs text-gray-500">Pending GRNs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-orange-50 text-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.pendingInvoices}</p>
              <p className="text-xs text-gray-500">Pending Invoices</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="bg-green-50 text-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold">{stats.onTimeDelivery}%</p>
              <p className="text-xs text-gray-500">On-Time Delivery</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Actions */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Urgent Actions Required</h3>
            <Badge variant="destructive">{urgentActions.length}</Badge>
          </div>
          <div className="space-y-3">
            {urgentActions.map((action) => (
              <div
                key={action.id}
                className="p-4 bg-white border border-red-200 rounded-lg flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        action.priority === "High"
                          ? "destructive"
                          : action.priority === "Medium"
                          ? "default"
                          : "outline"
                      }
                    >
                      {action.priority}
                    </Badge>
                    <span className="text-xs text-gray-500">{action.type}</span>
                  </div>
                  <p className="font-medium">{action.title}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span>Supplier: {action.supplier}</span>
                    {action.amount > 0 && <span className="font-medium text-blue-600">₹{action.amount.toLocaleString()}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Due: {action.dueDate}
                    </span>
                  </div>
                </div>
                <Button size="sm" variant="default" onClick={() => handleTakeAction(action.title)}>
                  Take Action
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Suppliers - WITH SPEND DATA */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                Top Suppliers This Month
              </h3>
              <Link to="/procurement?tab=suppliers">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {topSuppliers.map((supplier, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{supplier.name}</p>
                    <Badge variant="secondary">{supplier.onTime}% On-Time</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Spend: <strong className="text-blue-600">₹{supplier.spend.toLocaleString()}</strong></span>
                    <span className="text-gray-600">{supplier.orders} Orders</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent POs - WITH AMOUNTS */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Recent Purchase Orders
              </h3>
              <Link to="/procurement?tab=purchase-orders">
                <Button size="sm" variant="outline">
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentPOs.map((po) => (
                <div key={po.poNumber} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{po.poNumber}</p>
                    <Badge
                      variant={
                        po.status === "Pending Approval"
                          ? "destructive"
                          : po.status === "Approved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {po.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{po.supplier}</span>
                    <span className="font-medium text-green-600">₹{po.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{po.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link to="/procurement?tab=requisitions">
              <Button variant="outline" className="w-full h-16">
                <FileText className="w-5 h-5 mr-2" />
                Review Requisitions
              </Button>
            </Link>
            <Link to="/procurement?tab=purchase-orders">
              <Button variant="outline" className="w-full h-16">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Create PO
              </Button>
            </Link>
            <Link to="/procurement?tab=suppliers">
              <Button variant="outline" className="w-full h-16">
                <Users className="w-5 h-5 mr-2" />
                Manage Suppliers
              </Button>
            </Link>
            <Link to="/procurement?tab=analytics">
              <Button variant="outline" className="w-full h-16">
                <BarChart3 className="w-5 h-5 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
