import { ErrorBoundary } from "../ErrorBoundary";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Outlet, Link, useLocation, Navigate, useNavigate } from "react-router-dom";
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
  TooltipProvider,
} from "../ui/tooltip";
import { toast } from "sonner";
import { ConfirmDialog } from "../shared/ConfirmDialog";

// Navigation is now fully dynamic - built from navigationConfig.ts
// No hardcoded navigation modules needed here!

// Role → dedicated app route. Roles absent from this map land on "/" (main dashboard).
const ROLE_HOME_ROUTES: Partial<Record<Role, string>> = {
  "Supervisor":          "/supervisor-app",
  "TSM":                 "/tsm-app",
  "TSE":                 "/tse-app",
  "CCE":                 "/cce-app",
  "Sales Head":          "/sh-app",
  "Sales Manager":       "/sm-app-alliance",
  "Operations Manager":  "/om-app",
  "Cluster Manager":     "/cm-app",
  "City Manager":        "/city-app",
};

export function RootLayout() {
  const isPreview = import.meta.env.MODE === "development"
    || window.location.hostname === "localhost"
    || window.location.hostname.includes("figma")
    || window.location.hash.includes("preview-route");

  // ── Session guard ────────────────────────────────────────────────────────
  // Skipped in dev/preview mode so localhost and Figma Make still work without login.
  // In production, a valid cc360_session with an employeeId is required to render
  // any authenticated page. Unauthenticated requests are sent to /login.
  const _isDevMode = import.meta.env.MODE === "development"
    || window.location.hostname === "localhost"
    || window.location.hostname.includes("figma");
  if (!_isDevMode) {
    const _session = (() => {
      try { return JSON.parse(localStorage.getItem("cc360_session") || "null"); }
      catch { return null; }
    })();
    if (!_session?.employeeId) {
      return <Navigate to="/login" replace />;
    }
  }
  // ── End session guard ────────────────────────────────────────────────────

  // Auth redirect removed — HashRouter pathname is always "/"
  // Route-level auth is handled by ProtectedRoute in routes.tsx

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
  const navigate = useNavigate();
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

  // Safe role setter — validates then navigates to the role's dedicated route.
  // navigate() here is the single source of truth for role-change routing.
  // useRoleBasedRedirect is NOT called from here — it would race with this navigate.
  const setSafeRole = useCallback((role: string) => {
    if (roleConfigurations[role as Role]) {
      setCurrentRole(role as Role);
      navigate(ROLE_HOME_ROUTES[role as Role] ?? "/");
    } else {
      console.error(`❌ Invalid role selected: "${role}". Falling back to Super Admin.`);
      setCurrentRole("Super Admin");
      navigate("/");
    }
  }, [setCurrentRole, navigate]);

  // Get valid roles from roleConfigurations (single source of truth)
  const validRoles = Object.keys(roleConfigurations) as Role[];

  // Notification handlers
  const handleMarkAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Build dynamic navigation based on user permissions with city context
  const userNavigation = useMemo(
    () => buildNavigation(currentEmployee, city),
    [currentRole, city] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const userQuickActions = useMemo(
    () => buildQuickActions(currentEmployee, city),
    [currentRole, city] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filteredNavigation = useMemo(() => sidebarSearch.trim()
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
    : userNavigation, [userNavigation, sidebarSearch]);

  // ✅ Smart Auto-Collapse Engine
  // Startup storage purge
  useEffect(() => {
    ['cc360_error_log','SYNC_RETRY_QUEUE','cc360_retry_queue','cc360_audit_trail',
     'cc360_payroll_approved_event','cc360_mrr_event'].forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
    try {
      const raw = localStorage.getItem('attendance_records');
      if (raw) {
        const recs = JSON.parse(raw);
        if (recs.length > 90) localStorage.setItem('attendance_records', JSON.stringify(recs.slice(-90)));
      }
    } catch {}
  }, []);

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

  return (
    <TooltipProvider delayDuration={300}>
    <GlobalFiltersProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
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

        <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Smart Collapsible */}
        <aside
          className={`
            hidden md:flex flex-col flex-shrink-0 overflow-hidden
            bg-white border-r border-gray-200
            transition-[width] duration-200 ease-in-out
            ${collapsed ? "w-16" : "w-64"}
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
                <div key={navItem.label} className={`mb-1 rounded-lg ${
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

        {/* Mobile Sidebar - Full overlay drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col overflow-hidden shadow-xl">
              {/* Reuse sidebar content - city header */}
              <div className="p-3 border-b border-gray-200 bg-blue-50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">City</p>
                    <p className="text-sm font-semibold text-blue-700">{CITIES[city].displayName}</p>
                  </div>
                </div>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                {filteredNavigation.map((navItem) => {
                  const Icon = navItem.icon;
                  const active = isActiveRoute(location.pathname, location.search, navItem.path, navItem.match);
                  if (!navItem.children || navItem.children.length === 0) {
                    return (
                      <Link
                        key={navItem.path}
                        to={navItem.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          active ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <span>{navItem.label}</span>
                      </Link>
                    );
                  }
                  const childActive = hasActiveChild(location.pathname, location.search, navItem.children);
                  return (
                    <div key={navItem.label}>
                      <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${childActive ? "text-blue-600" : "text-gray-400"}`}>
                        <Icon className="w-4 h-4" />
                        {navItem.label}
                      </div>
                      {navItem.children.map((child) => {
                        const CIcon = child.icon;
                        const cActive = isActiveRoute(location.pathname, location.search, child.path, child.match);
                        return (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 pl-8 rounded-lg text-sm transition-colors ${
                              cActive ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            <CIcon className="w-4 h-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content — key forces remount on every route/role change */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 min-w-0">
          <RouteGuard />
          {/* key forces remount on path change OR role change */}
          <ErrorBoundary key={`eb__${location.pathname}__${currentRole}`}>
            <Outlet key={`${location.pathname}__${currentRole}`} />
          </ErrorBoundary>
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
    </TooltipProvider>
  );
}
