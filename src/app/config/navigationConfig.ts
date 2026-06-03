/**
 * Navigation Configuration - Master Navigation Tree
 *
 * Single source of truth for all navigation items in the application.
 * Sidebar is built dynamically by filtering this config based on user permissions.
 *
 * IMPORTANT: This config defines what COULD appear in navigation.
 * Actual visibility is controlled by the permission system (MC-11).
 */

import type { Module } from "../types/permissions";
import {
  Home, Users, BarChart3, Target, Package, DollarSign, Settings,
  UserPlus, Calculator, TrendingUp, Eye, Database, AlertCircle,
  MapPin, Clock, BookUser, UserCheck, Calendar, FileText, Banknote,
  CheckSquare, ListTree, Receipt, CreditCard, Building, Landmark,
  Wallet, PieChart, Activity, Crown, Mail, Warehouse, ShoppingCart,
  Scan, ClipboardList, Bell, IdCard,
  CalendarDays, Search, MessageSquare, BarChart, Shield, Briefcase, Phone,
  Play, SlidersHorizontal, MousePointerClick, ArrowUpRight,
  FileSearch, BarChart2, Layers, Coins,
  PlusCircle, MinusCircle, FileBarChart, Brain, ShieldCheck, LayoutDashboard,
  Building2, CheckCircle2, ClipboardCheck, GitCompare, FileOutput, ReceiptText,
  Upload, BookOpen, List, Scale, Zap, Car, Percent, User, Eye
} from "lucide-react";

export interface NavItem {
  label: string;
  path: string;
  icon: any;
  module: Module;
  match?: "exact" | "prefix"; // How to match active state: exact = path must match exactly, prefix = path.startsWith()
  children?: NavItem[];
  badge?: number;
  description?: string;
}

/**
 * MASTER NAVIGATION CONFIGURATION
 *
 * This is the complete navigation tree for the entire application.
 * All navigation items are defined here with their associated permissions.
 *
 * Structure:
 * - label: Display name in sidebar
 * - path: Route path
 * - icon: Lucide icon component
 * - module: Permission module (from permissions.ts)
 * - children: Nested navigation items (optional)
 */
export const NAV_CONFIG: NavItem[] = [
  // DASHBOARD - Everyone has access
  {
    label: "Dashboard",
    path: "/",
    icon: Home,
    module: "dashboard",
    match: "exact", // Dashboard always exact match
    description: "Main dashboard view"
  },

  // ANALYTICS - Strategic insights and reports
  {
    label: "Analytics",
    path: "/analytics",
    icon: BarChart3,
    module: "analytics",
    match: "prefix", // Parent uses prefix match
    description: "Executive reports and insights",
    children: [
      { label: "Control Tower", path: "/founder/control-tower", icon: Crown, module: "analytics", match: "prefix" },
      { label: "Cash Flow", path: "/founder/cash-flow", icon: Wallet, module: "analytics", match: "prefix" },
      { label: "Unit Economics", path: "/analytics/unit-economics", icon: PieChart, module: "analytics", match: "prefix" },
      { label: "Customer LTV", path: "/analytics/customer-ltv", icon: Target, module: "analytics", match: "prefix" },
      { label: "CAC Analysis", path: "/analytics/cac", icon: MousePointerClick, module: "analytics", match: "prefix" },
      { label: "Break-Even", path: "/analytics/break-even", icon: TrendingUp, module: "analytics", match: "prefix" },
      { label: "Efficiency", path: "/analytics/employee-efficiency", icon: Activity, module: "analytics", match: "prefix" },
      { label: "City Comparison", path: "/analytics/city-comparison", icon: MapPin, module: "analytics", match: "prefix" },
    ]
  },

  // CRM - Customer relationship management
  {
    label: "CRM",
    path: "/crm",
    icon: Target,
    module: "crm",
    match: "exact", // Parent uses exact match
    description: "Leads, customers, and sales",
    children: [
      { label: "Leads", path: "/leads", icon: Target, module: "leads", match: "prefix" },
      { label: "Customers", path: "/customers", icon: Users, module: "customers", match: "prefix" },
      { label: "Activity Timeline", path: "/crm/activity-timeline", icon: FileText, module: "crm", match: "prefix" },
      { label: "Lead Conversion", path: "/crm/conversion-analytics", icon: BarChart3, module: "crm", match: "prefix" },
      { label: "Notifications", path: "/crm/notifications", icon: Bell, module: "crm", match: "prefix" },
    ]
  },

  // TSE - Tele Sales Executive App
  {
    label: "TSE App",
    path: "/tse-app",
    icon: Phone,
    module: "crm",
    match: "exact",
    description: "Tele Sales Executive workspace",
    children: [
      { label: "Lead Queue", path: "/tse-app?tab=leads", icon: Target, module: "crm", match: "exact" },
      { label: "My Incentives", path: "/tse-app?tab=incentives", icon: TrendingUp, module: "crm", match: "exact" },
    ]
  },

  // CCE - Customer Care Executive App
  {
    label: "CCE App",
    path: "/cce-app",
    icon: MessageSquare,
    module: "crm",
    match: "exact",
    description: "Customer Care Executive workspace",
    children: [
      { label: "Complaint Queue", path: "/cce-app?tab=complaints", icon: AlertCircle, module: "crm", match: "exact" },
      { label: "Performance", path: "/cce-app?tab=performance", icon: BarChart, module: "crm", match: "exact" },
    ]
  },

  // SALES HEAD APP
  {
    label: "Sales Head",
    path: "/sh-app",
    icon: Crown,
    module: "crm",
    match: "exact",
    description: "Sales Head workspace — team coaching, lead pipeline, incentives",
    children: [
      { label: "Command Dashboard", path: "/sh-app?tab=dashboard", icon: LayoutDashboard, module: "crm", match: "exact" },
      { label: "Lead Pipeline",     path: "/sh-app?tab=pipeline",  icon: ListTree,        module: "crm", match: "exact" },
      { label: "TCE Performance",   path: "/sh-app?tab=tce",       icon: Users,           module: "crm", match: "exact" },
      { label: "My Closures",       path: "/sh-app?tab=personal",  icon: Target,          module: "crm", match: "exact" },
      { label: "Team View",         path: "/sh-app?tab=team",      icon: BarChart,        module: "crm", match: "exact" },
      { label: "Incentives",        path: "/sh-app?tab=incentive", icon: TrendingUp,      module: "crm", match: "exact" },
      { label: "Field Day",         path: "/sh-app?tab=field",     icon: MapPin,          module: "crm", match: "exact" },
      { label: "Reports",           path: "/sh-app?tab=reports",   icon: BarChart3,       module: "crm", match: "exact" },
    ]
  },

  // SALES MANAGER APP
  {
    label: "Sales Manager",
    path: "/sm-app-alliance",
    icon: Building2,
    module: "crm",
    match: "exact",
    description: "Sales Manager workspace — alliance management, locations, BTL",
    children: [
      { label: "Alliance Dashboard", path: "/sm-app-alliance?tab=dashboard",  icon: MapPin,      module: "crm", match: "exact" },
      { label: "My Locations",       path: "/sm-app-alliance?tab=detail",     icon: Building2,   module: "crm", match: "exact" },
      { label: "Submit Location",    path: "/sm-app-alliance?tab=submit",     icon: PlusCircle,  module: "crm", match: "exact" },
      { label: "Block Deals",        path: "/sm-app-alliance?tab=block",      icon: Package,     module: "crm", match: "exact" },
      { label: "Incentives",         path: "/sm-app-alliance?tab=incentive",  icon: TrendingUp,  module: "crm", match: "exact" },
      { label: "Field Day",          path: "/sm-app-alliance?tab=field",      icon: MapPin,      module: "crm", match: "exact" },
      { label: "BTL Expenses",       path: "/sm-app-alliance?tab=expenses",   icon: Receipt,     module: "crm", match: "exact" },
    ]
  },

  // JOBS - Job management and execution
  {
    label: "Operations",
    path: "/operations",
    icon: Briefcase,
    module: "jobs",
    match: "prefix", // Parent uses prefix match
    description: "Job management and execution",
    children: [
      { label: "Data Capture", path: "/operations/data-capture", icon: Database, module: "jobs", match: "prefix" },
      { label: "Washer Jobs", path: "/washer-jobs", icon: Users, module: "jobs", match: "prefix" },
      { label: "Service Zones", path: "/service-zones", icon: MapPin, module: "jobs", match: "prefix" },
      { label: "Complaints", path: "/complaints", icon: AlertCircle, module: "complaints", match: "prefix" },
    ]
  },

  // OPERATIONS - Operations management
  {
    label: "Team & Settings",
    path: "/users",
    icon: SlidersHorizontal,
    module: "operations",
    match: "prefix", // Parent uses prefix match
    description: "Operations and team management",
    children: [
      { label: "Team Management", path: "/users", icon: Users, module: "users", match: "prefix" },
      { label: "Expansion", path: "/expansion-opportunities", icon: TrendingUp, module: "operations", match: "prefix" },
    ]
  },

  // HR & PEOPLE - People management
  {
    label: "HR & People",
    path: "/hr",
    icon: UserPlus,
    module: "hr",
    match: "prefix", // Parent uses prefix match
    description: "Human resources and people management",
    children: [
      { label: "Employees", path: "/hr/employee-ledger", icon: BookUser, module: "hr", match: "prefix" },
      { label: "Attendance", path: "/hr/attendance-data-manager", icon: Clock, module: "hr", match: "prefix" },
      { label: "Onboarding", path: "/hr/onboarding-automation", icon: UserCheck, module: "hr", match: "prefix" },
      { label: "Leave Management", path: "/hr/professional-leave", icon: Calendar, module: "leave", match: "prefix" },
      { label: "Documents", path: "/hr/letters-documents", icon: FileText, module: "hr", match: "prefix" },
      { label: "Advances", path: "/advance/hr-management", icon: Banknote, module: "hr", match: "prefix" },
      { label: "Travel Reimbursement", path: "/travel", icon: Car, module: "hr", match: "prefix" },
      { label: "Other Earnings", path: "/advance/other-earnings", icon: PlusCircle, module: "hr", match: "prefix" },
      { label: "Other Deductions", path: "/advance/other-deductions", icon: MinusCircle, module: "hr", match: "prefix" },
      { label: "Role Suggestions", path: "/hr/role-suggestions", icon: Target, module: "hr", match: "prefix" },
      { label: "HR Intelligence", path: "/hr/intelligence-dashboard", icon: Brain, module: "hr", match: "prefix" },
      { label: "Exit Settlement", path: "/hr/exit-settlement", icon: FileText, module: "hr", match: "prefix" },
      { label: "HR Reports", path: "/hr/lifecycle-reports", icon: BarChart2, module: "hr", match: "prefix" },
    ]
  },

  // PAYROLL - Payroll processing
  {
    label: "Payroll",
    path: "/payroll",
    icon: Coins,
    module: "payroll",
    match: "exact", // Parent uses exact match
    description: "Payroll processing and management",
    children: [
      { label: "Configuration", path: "/payroll/configuration", icon: Settings, module: "payroll", match: "prefix" },
      { label: "Salary Structures", path: "/payroll/create-salary-structure", icon: DollarSign, module: "payroll", match: "prefix" },
      { label: "Processing", path: "/payroll/run", icon: Play, module: "payroll", match: "prefix" },
      { label: "Review & Approval", path: "/payroll/review-approval", icon: CheckSquare, module: "payroll", match: "prefix" },
      { label: "Salary Payables", path: "/payroll/salary-payables", icon: Wallet, module: "payroll", match: "prefix" },
      { label: "Salary Payment", path: "/payroll/salary-payment", icon: CreditCard, module: "payroll", match: "prefix" },
      { label: "Statutory Payables", path: "/payroll/statutory-payables", icon: Landmark, module: "payroll", match: "prefix" },
      { label: "Incentives", path: "/incentives/configuration", icon: TrendingUp, module: "payroll", match: "prefix" },
      { label: "Adjustments Report", path: "/advance/adjustments-report", icon: FileBarChart, module: "payroll", match: "prefix" },
    ]
  },

  // FINANCE - Financial management
  {
    label: "Finance",
    path: "/finance",
    icon: DollarSign,
    module: "finance",
    match: "prefix", // Parent uses prefix match
    description: "Financial management and accounting",
    children: [
      { label: "Analytics", path: "/finance/analytics", icon: BarChart3, module: "finance", match: "prefix" },
      { label: "Transactions", path: "/finance/transactions", icon: Database, module: "finance", match: "prefix" },
      { label: "Ledger Entries", path: "/finance/ledger-entries", icon: BookUser, module: "finance", match: "prefix" },
      { label: "Chart of Accounts", path: "/finance/chart-of-accounts", icon: ListTree, module: "finance", match: "prefix" },
      { label: "Invoices", path: "/finance/invoices", icon: Receipt, module: "finance", match: "prefix" },
      { label: "Payments", path: "/finance/payments", icon: CreditCard, module: "finance", match: "prefix" },
      { label: "Revenue Capture", path: "/finance/revenue-capture", icon: DollarSign, module: "finance", match: "prefix" },
      { label: "Package Pricing", path: "/finance/package-cost-matrix", icon: Layers, module: "finance", match: "prefix" },
      { label: "Cost Per Wash", path: "/finance/cost-per-wash", icon: Calculator, module: "finance", match: "prefix" },
      { label: "Financial Reports", path: "/finance/reports", icon: FileBarChart, module: "finance", match: "prefix" },
    ]
  },

  // ACCOUNTS - Accounting entries, ledger, and reports
  {
    label: "Accounts",
    path: "/accounts",
    icon: BookOpen,
    module: "accounts",
    match: "prefix",
    description: "Accounting entries, ledger, and reports",
    children: [
      { label: "Dashboard",          path: "/accounts/dashboard",        icon: LayoutDashboard, module: "accounts", match: "exact" },
      { label: "Accounting Entry",   path: "/accounts/accounting-entry", icon: FileText,        module: "accounts", match: "prefix" },
      { label: "Expense Voucher",    path: "/accounts/expense-voucher",  icon: Receipt,         module: "accounts", match: "prefix" },
      { label: "Item Master",        path: "/accounts/item-master",      icon: Package,         module: "accounts", match: "prefix" },
      { label: "Journal Entry",      path: "/accounts/journal-entry",    icon: BookOpen,        module: "accounts", match: "prefix" },
      { label: "Transaction List",   path: "/accounts/transactions",     icon: List,            module: "accounts", match: "prefix" },
      { label: "Ledger",             path: "/accounts/ledger",           icon: BookUser,        module: "accounts", match: "prefix" },
      { label: "Party Ledger",       path: "/accounts/party-ledger",     icon: Users,           module: "accounts", match: "prefix" },
      { label: "Ledger Master",      path: "/accounts/ledger-master",    icon: Layers,          module: "accounts", match: "prefix" },
      { label: "Razorpay Flow",      path: "/accounts/razorpay-flow",    icon: Zap,             module: "accounts", match: "prefix" },
      { label: "Trial Balance",      path: "/accounts/trial-balance",    icon: Scale,           module: "accounts", match: "prefix" },
      { label: "Balance Sheet",      path: "/accounts/balance-sheet",    icon: BarChart2,       module: "accounts", match: "prefix" },
      { label: "GSTR-2A Report",     path: "/accounts/gstr2a",           icon: FileSearch,      module: "accounts", match: "prefix" },
      { label: "Purchase Summary",   path: "/accounts/reports/purchase", icon: ShoppingCart,    module: "accounts", match: "prefix" },
      { label: "Sales Summary",      path: "/accounts/reports/sales",    icon: TrendingUp,      module: "accounts", match: "prefix" },
      { label: "RCM Report",         path: "/accounts/reports/rcm",      icon: AlertCircle,     module: "accounts", match: "prefix" },
      { label: "Vendor Master",      path: "/gst/vendors",               icon: Building2,       module: "accounts", match: "prefix" },
      { label: "Vendor Payment",     path: "/accounts/vendor-payment",   icon: Building,        module: "accounts", match: "prefix" },
      { label: "Payroll Processing", path: "/accounts/payroll-processing",icon: Calculator,     module: "accounts", match: "prefix" },
      { label: "Payables",           path: "/accounts/payables",         icon: CreditCard,      module: "accounts", match: "prefix" },
      { label: "TDS Payable",        path: "/accounts/tds-payable",      icon: Percent,         module: "accounts", match: "prefix" },
      { label: "Advance Tax",        path: "/accounts/advance-tax",      icon: Calendar,        module: "accounts", match: "prefix" },
    ]
  },

  // GST COMPLIANCE - GST management and compliance
  {
    label: "GST Compliance",
    path: "/gst",
    icon: ShieldCheck,
    module: "accounts",
    match: "prefix",
    description: "GST compliance and tax management",
    children: [
      { label: "Vendor Master", path: "/gst/vendors", icon: Building2, module: "accounts", match: "prefix" },
      { label: "Customer Master", path: "/gst/customers", icon: Users, module: "accounts", match: "prefix" },
      { label: "Transaction Entry", path: "/gst/transactions", icon: FileText, module: "accounts", match: "prefix" },
      { label: "Validation Centre", path: "/gst/validation", icon: CheckCircle2, module: "accounts", match: "prefix" },
      { label: "Manager Review", path: "/gst/review", icon: ClipboardCheck, module: "accounts", match: "prefix" },
      { label: "Reconciliation", path: "/gst/reconciliation", icon: GitCompare, module: "accounts", match: "prefix" },
      { label: "Reports", path: "/gst/reports", icon: FileBarChart, module: "accounts", match: "prefix" },
      { label: "GSTR-1", path: "/gst/gstr1", icon: FileOutput, module: "accounts", match: "prefix" },
      { label: "GSTR-3B", path: "/gst/gstr3b", icon: ReceiptText, module: "accounts", match: "prefix" },
      { label: "Filing", path: "/gst/filing", icon: Upload, module: "accounts", match: "prefix" },
      { label: "AI Monitoring", path: "/gst/monitoring", icon: Activity, module: "accounts", match: "prefix" },
    ]
  },

  // INVENTORY - Stock and materials
  {
    label: "Inventory",
    path: "/inventory",
    icon: Package,
    module: "inventory",
    match: "prefix", // Parent uses prefix match
    description: "Inventory and stock management",
    children: [
      { label: "Requisitions", path: "/inventory/requisition", icon: ClipboardList, module: "inventory", match: "prefix" },
      { label: "Issuances", path: "/inventory/washer-issuances", icon: Users, module: "inventory", match: "prefix" },
      { label: "Stock Ledger", path: "/inventory/washer-stock-ledger", icon: BookUser, module: "inventory", match: "prefix" },
      { label: "Month-End", path: "/inventory/month-end-verification", icon: CheckSquare, module: "inventory", match: "prefix" },
      { label: "Store Management", path: "/store", icon: Warehouse, module: "store", match: "prefix" },
      { label: "Procurement", path: "/procurement", icon: ShoppingCart, module: "procurement", match: "prefix" },
      { label: "Store Manager", path: "/store-manager", icon: UserCheck, module: "store-manager", match: "prefix" },
      { label: "Cloth Tracking", path: "/cloth-tracking/admin", icon: Scan, module: "cloth-tracking", match: "prefix" },
    ]
  },

  // ADMIN - System administration
  {
    label: "Admin",
    path: "/admin",
    icon: Settings,
    module: "admin",
    match: "exact", // Parent uses exact match
    description: "System configuration and settings",
    children: [
      { label: "City Management", path: "/admin/city-management", icon: MapPin, module: "admin", match: "prefix" },
      { label: "Business Rules", path: "/admin/business-rules", icon: Settings, module: "admin", match: "prefix" },
      { label: "Shift Management", path: "/admin/shift-management", icon: Clock, module: "admin", match: "prefix" },
      { label: "Fraud Alerts", path: "/admin/fraud-alerts", icon: AlertCircle, module: "admin", match: "prefix" },
      { label: "Permissions", path: "/admin/permissions", icon: ShieldCheck, module: "admin", match: "prefix" },
      { label: "Role & Permissions", path: "/admin/role-permissions", icon: ShieldCheck, module: "admin", match: "prefix" },
      { label: "Incentive Visibility", path: "/admin/incentive-visibility", icon: Eye, module: "admin", match: "prefix" },
      { label: "Subscription Plans", path: "/subscription/plan-management", icon: Package, module: "admin", match: "prefix" },
      { label: "Plan Page Editor", path: "/admin/plan-page-editor", icon: MousePointerClick, module: "admin", match: "prefix" },
      { label: "Comm. Templates", path: "/settings/communication-templates", icon: Mail, module: "admin", match: "prefix" },
      { label: "Cost Configuration", path: "/settings/cost-configuration", icon: SlidersHorizontal, module: "admin", match: "prefix" },
      { label: "Working Hours", path: "/workforce/working-hours", icon: Clock, module: "admin", match: "prefix" },
      { label: "Audit Trail", path: "/audit-trail", icon: FileText, module: "audit-trail", match: "prefix" },
      { label: "Payroll Approval", path: "/admin/payroll-approval", icon: CheckSquare, module: "admin", match: "prefix" },
    ]
  },

];

/**
 * QUICK ACTIONS - Personal shortcuts
 * These appear in a separate section and are user-specific
 * All use prefix matching since they're simple links
 */
export const QUICK_ACTIONS: NavItem[] = [
  { label: "My Payslip", path: "/hr/self-service", icon: IdCard, module: "payroll-self-service", match: "prefix" },
  { label: "My Leaves", path: "/hr/professional-leave", icon: Calendar, module: "leave", match: "prefix" },
  { label: "My Advances", path: "/advance/my-advances", icon: Banknote, module: "advance", match: "prefix" },
  { label: "My Account", path: "/my-account", icon: Phone, module: "dashboard", match: "prefix" },
  { label: "Cloth Exchange", path: "/cloth-tracking/exchange", icon: Scan, module: "cloth-tracking", match: "prefix" },
  { label: "Approvals", path: "/approvals", icon: CheckSquare, module: "approvals", match: "prefix" },
  { label: "Performance", path: "/performance", icon: TrendingUp, module: "performance", match: "prefix" },
];
