import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Users, BarChart3, UserCircle, Car, ClipboardList,
  AlertCircle, Package, DollarSign, UserCog, Menu, X,
  CheckSquare, FileText, Bell, Settings, LogOut, Home,
  Calendar, TrendingUp, PieChart, Target, Calculator, Crown,
  Activity, Wallet, IdCard, CalendarDays, ListTree, BookUser, Banknote, Mail, Link as LinkIcon, ShoppingCart, Warehouse, Scan,
  UserCheck, MapPin, Search, TrendingUp as TrendingUpIcon, MessageSquare, Eye, Clock, BarChart, UserPlus, Database,
  CreditCard, Receipt, Building, Landmark, ChevronDown, ChevronRight
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useRole } from "../../contexts/RoleContext";
import { roleConfigurations, type Role } from "../../lib/roleConfig";
import { useRoleBasedRedirect } from "../../hooks/useRoleBasedRedirect";
import { GlobalFilterBar, GlobalFiltersProvider } from "../navigation/GlobalFilterBar";
import { NotificationDrawer } from "../shared/NotificationDrawer";
import { buildNavigation, buildQuickActions, type NavEmployee } from "../../utils/navigationBuilder";
import { isActiveRoute, hasActiveChild } from "../../utils/isActiveRoute";
import { RouteGuard } from "../guards/RouteGuard";
import { useCity, CITIES } from "../../contexts/CityContext";
import { useSidebar } from "../../contexts/SidebarContext";
import { isDenseRoute, shouldForceExpand, detectConflicts } from "../../config/layoutRules";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { toast } from "sonner";
import { checkStorageQuota } from "../../services/logger";
import { ConfirmDialog } from "../shared/ConfirmDialog";

// Navigation is now fully dynamic - built from navigationConfig.ts
// No hardcoded navigation modules needed here!

export function RootLayout() {
  const isPreview = import.meta.env.MODE === "development"
    || window.location.hostname === "localhost"
    || window.location.hostname.includes("figma")
    || new URLSearchParams(window.location.search).get("preview-route") !== null;

  if (!isPreview) {
    const session = localStorage.getItem("cc360_session");
    // FIX: use hash-router-compatible check (hash contains the route, not pathname)
    // window.location.replace("/login") was breaking hash router navigation
    const currentHash = window.location.hash.replace("#", "");
    const isOnLogin = currentHash.startsWith("/login") || window.location.pathname === "/login";
    if (!session && !isOnLogin) {
      // Use hash-compatible redirect instead of window.location.replace
      window.location.hash = "/login";
      return null;
    }
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "complaint" as const,
      title: "New Complaint Received",
      description: "Customer reported poor wash quality for booking #12345",
      timestamp: "5 mins ago",
      isRead: false,
    },
    {
      id: "2",
      type: "operations" as const,
      title: "Washer Check-in Delayed",
      description: "Ravi Verma requested late check-in approval",
      timestamp: "15 mins ago",
      isRead: false,
    },
    {
      id: "3",
      type: "payroll" as const,
      title: "Payroll Run Completed",
      description: "March 2026 payroll processed for 47 employees",
      timestamp: "1 hour ago",
      isRead: true,
    },
    {
      id: "4",
      type: "operations" as const,
      title: "New Team Member Added",
      description: "Suresh Yadav joined Adajan team",
      timestamp: "2 hours ago",
      isRead: false,
    },
  ]);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  const [sidebarSearch, setSidebarSearch] = useState("");

  const { currentRole, setCurrentRole, currentUser } = useRole();
  const { city } = useCity();
  const location = useLocation();
  const {
    collapsed,
    setCollapsed,
    toggleSidebar,
    userToggled,
    setUserToggled,
    openGroups,
    toggleGroup,
    openGroup,
  } = useSidebar();

  // Build NavEmployee directly from role + city — no ID lookup needed.
  // The previous find() always returned null because RoleContext stub IDs
  // ("CM-001", "EMP-SA-001") never matched real EmployeeContext IDs ("EMP-001").
  // buildNavigation(null) silently fell back to Dashboard-only for every role.
  const currentEmployee: NavEmployee = {
    role: currentRole,
    cityId: currentUser.cityId || "CITY-SURAT",
  };

  // Auto-redirect users to their role-specific landing page
  useRoleBasedRedirect(currentRole);

  // Safe role setter - prevents invalid roles from entering state
  const setSafeRole = (role: string) => {
    if (roleConfigurations[role as Role]) {
      setCurrentRole(role as Role);
    } else {
      console.error(`❌ Invalid role selected: "${role}". Falling back to Super Admin.`);
      setCurrentRole("Super Admin");
    }
  };

  // Get valid roles from roleConfigurations (single source of truth)
  const validRoles = Object.keys(roleConfigurations) as Role[];

  // Notification handlers
  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  // Build dynamic navigation based on user permissions with city context
  const userNavigation = buildNavigation(currentEmployee, city);
  const userQuickActions = buildQuickActions(currentEmployee, city);

  const filteredNavigation = sidebarSearch.trim()
    ? userNavigation.flatMap(section => {
        const q = sidebarSearch.toLowerCase();
        // Check if section label matches
        if (section.label.toLowerCase().includes(q)) return [section];
        // Check children
        const matchedChildren = (section.children ?? []).filter(c =>
          c.label.toLowerCase().includes(q)
        );
        if (matchedChildren.length > 0) {
          return [{ ...section, children: matchedChildren, _searchMatch: true }];
        }
        return [];
      })
    : userNavigation;

  // ✅ Smart Auto-Collapse Engine
  useEffect(() => {
    // Skip auto-collapse if user manually toggled
    if (userToggled) return;

    // Dev: detect conflicting rules
    detectConflicts(location.pathname);

    // Priority engine: EXPAND (1) beats COLLAPSE (2)
    // Pass currentRole for role-aware rules
    if (shouldForceExpand(location.pathname, currentRole)) {
      setCollapsed(false);
      return;
    }

    if (isDenseRoute(location.pathname, currentRole)) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [location.pathname, userToggled, setCollapsed]);

  // Reset user override on route change
  useEffect(() => {
    setUserToggled(false);
  }, [location.pathname, setUserToggled]);

  // Auto-open the group containing the active route
  useEffect(() => {
    userNavigation.forEach((item) => {
      if (item.children && hasActiveChild(location.pathname, location.search, item.children)) {
        openGroup(item.label);
      }
    });
  }, [location.pathname, location.search]);

  // Storage management — purge old data on every startup to prevent quota errors
  useEffect(() => {
    // Step 1: Always purge low-priority data first
    const purgeable = [
      'cc360_error_log', 'SYNC_RETRY_QUEUE', 'cc360_retry_queue',
      'cc360_audit_trail', 'cc360_monthly_snapshots',
      'cc360_payroll_approved_event', 'cc360_mrr_event', 'cc360_mrr_remove_event',
    ];
    purgeable.forEach(k => { try { localStorage.removeItem(k); } catch {} });

    // Step 2: Trim attendance records to last 90 (remove old bulk data)
    try {
      const attKey = 'attendance_records';
      const raw = localStorage.getItem(attKey);
      if (raw) {
        const records = JSON.parse(raw);
        if (records.length > 90) {
          // Keep most recent 90 records
          const trimmed = records.slice(-90);
          localStorage.setItem(attKey, JSON.stringify(trimmed));
          console.log(`[Storage] Trimmed attendance: ${records.length} → ${trimmed.length}`);
        }
      }
    } catch {}

    // Step 3: Check quota — only warn if genuinely over 90% after purge
    setTimeout(() => {
      const quota = checkStorageQuota();
      if (quota.percentUsed > 90) {
        toast.warning(
          `Storage ${quota.percentUsed.toFixed(0)}% full. Consider clearing browser cache.`,
          { duration: 5000 }
        );
      }
    }, 3000);
  }, []); // run once on mount


  return (
    <GlobalFiltersProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>

              {/* Desktop Sidebar Toggle - Always visible */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="hidden lg:flex"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
              </Button>
              <div>
                <h1 className="text-base sm:text-xl font-bold text-blue-600">CleanCar 360°</h1>
                <p className="hidden sm:block text-xs text-gray-500">Enterprise Resource Planning</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
              {import.meta.env.DEV && (
                <Badge variant="secondary" className="font-mono text-xs">
                  Active: {currentRole}
                </Badge>
              )}
              <Select value={currentRole} onValueChange={setSafeRole}>
                <SelectTrigger className="w-32 sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {validRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="sm"
                className="relative"
                onClick={() => setNotificationDrawerOpen(true)}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {notifications.filter(n => !n.isRead).length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmState({
                    open: true,
                    title: "Exit Demo Mode",
                    description: "Exit demo mode and return to role selection?",
                    onConfirm: () => {
                      toast.info("In production, this would log you out and redirect to the login page.");
                      setConfirmState(s => ({ ...s, open: false }));
                    }
                  });
                }}
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Global Filter Bar - Show for management and admin roles */}
        {[
          "Super Admin",
          "Admin",
          "Accounts",
          "City Manager",
          "Cluster Manager",
          "Sr Operations Manager",
          "Operations Manager",
          "HR"
        ].includes(currentRole) && (
          <GlobalFilterBar />
        )}

        <div className="flex">
        {/* Sidebar - Smart Collapsible */}
        <aside
          className={`
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
            fixed lg:sticky top-[57px] left-0 z-30 h-[calc(100vh-57px)]
            bg-white border-r border-gray-200
            transition-all duration-300 ease-in-out
            overflow-hidden flex flex-col
            lg:translate-x-0
            ${collapsed ? "lg:w-16 w-64" : "w-64"}
          `}
        >
          {/* City Context Header */}
          <div className={`p-4 border-b border-gray-200 bg-blue-50 ${collapsed ? "lg:p-2" : ""}`}>
            <div className="flex items-center gap-2">
              <MapPin className={`w-4 h-4 text-blue-600 ${collapsed ? "lg:mx-auto" : ""}`} />
              {!collapsed && (
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Viewing</div>
                  <div className="text-sm font-semibold text-blue-600">{CITIES[city].displayName}</div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar search — shown only when expanded */}
          {!collapsed && (
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search navigation..."
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  onKeyDown={e => e.key === "Escape" && setSidebarSearch("")}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
                />
                {sidebarSearch && (
                  <button
                    onClick={() => setSidebarSearch("")}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
          <nav className={`space-y-1 flex-1 overflow-y-auto ${collapsed ? "lg:p-2 p-4" : "p-4"}`}>
            {/* DYNAMIC NAVIGATION - Built from permissions */}
            {filteredNavigation.map((navItem) => {
              // In search mode: show parent label + matched children flat
              if (sidebarSearch.trim() && (navItem as any)._searchMatch) {
                return (
                  <div key={navItem.label} className="mb-2">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {navItem.label}
                    </div>
                    {navItem.children?.map(child => {
                      const CIcon = child.icon;
                      const active = isActiveRoute(location.pathname, location.search, child.path, child.match);
                      return (
                        <Link
                          key={child.path}
                          to={child.path}
                          onClick={() => setSidebarSearch("")}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                            active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <CIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              const Icon = navItem.icon;

              // If item has no children, render as single item
              if (!navItem.children || navItem.children.length === 0) {
                const active = isActiveRoute(location.pathname, location.search, navItem.path, navItem.match);

                const linkContent = (
                  <Link
                    key={navItem.path}
                    to={navItem.path}
                    className={`flex items-center gap-3 rounded-lg transition-colors ${
                      collapsed
                        ? "lg:justify-center lg:w-10 lg:h-10 lg:mx-auto px-3"
                        : "px-3"
                    } py-2 ${
                      active
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="text-sm">{navItem.label}</span>}
                  </Link>
                );

                // Show tooltip on collapsed sidebar (desktop only)
                if (collapsed) {
                  return (
                    <div key={navItem.path}>
                      {/* Desktop: with tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild className="hidden lg:flex">
                          {linkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="hidden lg:block">
                          <p>{navItem.label}</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Mobile: without tooltip */}
                      <div className="lg:hidden">{linkContent}</div>
                    </div>
                  );
                }

                return linkContent;
              }

              // Item with children - render as group
              // Parent header should highlight only if any child is active (not the parent itself)
              const childrenActive = hasActiveChild(location.pathname, location.search, navItem.children);

              // Collapsed mode: show only icon with tooltip for parent
              if (collapsed) {
                return (
                  <div key={navItem.label}>
                    {/* Desktop: icon with tooltip */}
                    <Tooltip>
                      <TooltipTrigger asChild className="hidden lg:block">
                        <div className={`flex items-center justify-center w-10 h-10 mx-auto mb-0.5 rounded-lg cursor-default transition-colors ${
                          childrenActive
                            ? "bg-blue-50 text-blue-600 border-l-2 border-blue-600"
                            : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="hidden lg:block">
                        <p className="font-semibold mb-1">{navItem.label}</p>
                        <div className="space-y-1">
                          {navItem.children.map((child) => (
                            <p key={child.path} className="text-xs">{child.label}</p>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    {/* Mobile: show full group */}
                    <div className="lg:hidden mb-4">
                      <div className={`flex items-center gap-2 px-3 py-1.5 mb-1 ${
                        childrenActive ? "text-blue-600" : "text-gray-500"
                      }`}>
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {navItem.label}
                        </span>
                      </div>
                      <div className="space-y-0.5">
                        {navItem.children.map((child) => {
                          const ChildIcon = child.icon;
                          const active = isActiveRoute(location.pathname, location.search, child.path, child.match);
                          return (
                            <Link
                              key={child.path}
                              to={child.path}
                              className={`flex items-center gap-3 px-3 py-2 pl-6 rounded-lg transition-colors text-sm ${
                                active
                                  ? "bg-blue-50 text-blue-600 font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <ChildIcon className="w-4 h-4" />
                              <span>{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              // Expanded mode: accordion group
              const isOpen = openGroups.has(navItem.label) || childrenActive;
              return (
                <div key={navItem.label} className={`mb-1 rounded-lg overflow-hidden ${
                  childrenActive ? "border-l-2 border-blue-600" : "border-l-2 border-transparent"
                }`}>
                  {/* Clickable section header */}
                  <button
                    onClick={() => {
                      toggleGroup(navItem.label);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                      childrenActive
                        ? "bg-blue-50/60 text-blue-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        {navItem.label}
                      </span>
                    </div>
                    {isOpen
                      ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                      : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                    }
                  </button>
                  {/* Children — only rendered when open */}
                  {isOpen && (
                    <div className="space-y-0.5 pb-1 pt-0.5">
                      {navItem.children.map((child) => {
                        const ChildIcon = child.icon;
                        const active = isActiveRoute(location.pathname, location.search, child.path, child.match);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center gap-3 px-3 py-2 pl-8 rounded-lg transition-colors text-sm ${
                              active
                                ? "bg-blue-50 text-blue-600 font-medium"
                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                            }`}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* QUICK ACTIONS - Personal shortcuts */}
            {userQuickActions.length > 0 && (
              <div className="pt-3 mt-3 border-t border-gray-200 bg-blue-50/30 rounded-lg -mx-1 px-1">
                <div className={`flex items-center gap-2 py-1.5 mb-1 ${
                  collapsed ? "lg:justify-center lg:px-2 px-3" : "px-3"
                }`}>
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100">
                  <Clock className="w-2.5 h-2.5 text-blue-600" />
                </div>
                {!collapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    My Workspace
                  </span>
                )}
              </div>
                <div className="space-y-0.5">
                  {userQuickActions.map((action) => {
                    const Icon = action.icon;
                    const active = isActiveRoute(location.pathname, location.search, action.path, action.match);

                    const linkContent = (
                      <Link
                        key={action.path}
                        to={action.path}
                        className={`flex items-center rounded-lg transition-colors text-sm ${
                          collapsed ? "lg:justify-center lg:px-2 px-3 py-2 pl-6" : "justify-between px-3 py-2 pl-6"
                        } ${
                          active
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`flex items-center gap-3 ${collapsed ? "lg:gap-0" : ""}`}>
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          {!collapsed && <span>{action.label}</span>}
                        </div>
                        {!collapsed && action.badge && action.badge > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </Link>
                    );

                    // Tooltip for collapsed mode
                    if (collapsed) {
                      return (
                        <div key={action.path}>
                          {/* Desktop: with tooltip */}
                          <Tooltip>
                            <TooltipTrigger asChild className="hidden lg:flex">
                              {linkContent}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="hidden lg:flex items-center gap-2">
                              <p>{action.label}</p>
                              {action.badge && action.badge > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center text-xs">
                                  {action.badge}
                                </Badge>
                              )}
                            </TooltipContent>
                          </Tooltip>
                          {/* Mobile: without tooltip */}
                          <div className="lg:hidden">{linkContent}</div>
                        </div>
                      );
                    }

                    return linkContent;
                  })}
                </div>
              </div>
            )}
          </nav>

          {/* User profile footer — pinned to bottom */}
          <div className={`border-t border-gray-200 p-3 bg-gray-50/80 ${collapsed ? "flex justify-center" : ""}`}>
            <Link
              to="/my-account"
              className={`flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors ${
                collapsed ? "justify-center" : ""
              }`}
            >
              {/* Avatar initials */}
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-white">
                  {currentUser.name ? currentUser.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase() : "SA"}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {currentUser.name || "User"}
                  </div>
                  <div className="text-xs text-blue-600 truncate font-medium">
                    {currentRole}
                  </div>
                </div>
              )}
            </Link>
          </div>
        </aside>

        {/* Mobile Sidebar Backdrop */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-20 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content - Adjusts based on sidebar state */}
        <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 transition-all duration-300 min-w-0`}>
          {/* Route Guard - Protects all routes automatically */}
          <RouteGuard />
          <Outlet />
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        description={confirmState.description}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
      />
    </div>
    </GlobalFiltersProvider>
  );
}