import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  Menu, X, Bell, LogOut, ChevronDown, ChevronRight,
  Search, MapPin, User,
} from "lucide-react";
import { Button, Avatar, Input } from "../ui/index";
import { cn } from "../../lib/utils";
import { useAuth, ROLES } from "../../contexts/AuthContext";
import { getNavForRole, type NavSection } from "../../config/navigation";
import type { Role } from "../../types";
import { formatRelativeTime } from "../../lib/utils";
import { useNotifications, useMarkNotificationRead } from "../../hooks/useQueries";

function SidebarNavItem({ item, collapsed }: { item: NavSection; collapsed: boolean }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const Icon = item.icon;

  const isActive =
    item.path === "/"
      ? location.pathname === "/"
      : location.pathname === item.path || location.pathname.startsWith(item.path + "/");

  const hasChildren = !!item.children?.length;
  const isChildActive = hasChildren
    ? item.children!.some(
        (c) => location.pathname === c.path || location.pathname.startsWith(c.path + "/"),
      )
    : false;

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (hasChildren && !collapsed) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left select-none",
            isChildActive
              ? "text-blue-700 font-semibold bg-blue-50/60"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          )}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate text-xs font-semibold uppercase tracking-wider">
            {item.label}
          </span>
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-40 flex-shrink-0" />
          )}
        </button>
        {open && (
          <div className="mt-0.5 ml-3 pl-3 border-l-2 border-gray-100 space-y-0.5">
            {item.children!.map((child) => {
              const CIcon = child.icon;
              const childActive =
                location.pathname === child.path ||
                location.pathname.startsWith(child.path + "/");
              return (
                <Link
                  key={child.path}
                  to={child.path}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors",
                    childActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  )}
                >
                  <CIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{child.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (collapsed) {
    return (
      <Link
        to={item.path}
        title={item.label}
        className={cn(
          "flex items-center justify-center w-10 h-10 mx-auto rounded-lg transition-colors",
          isActive || isChildActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
        )}
      >
        <Icon className="w-5 h-5" />
      </Link>
    );
  }

  return (
    <Link
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        isActive
          ? "bg-blue-50 text-blue-700 font-medium"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ collapsed, onMobileClose }: { collapsed: boolean; onMobileClose?: () => void }) {
  const { user } = useAuth();
  const navItems = user ? getNavForRole(user.role) : [];
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? navItems.filter(
        (n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.children?.some((c) => c.label.toLowerCase().includes(search.toLowerCase())),
      )
    : navItems;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 overflow-hidden">
      <div className={cn("border-b border-gray-100 bg-blue-50/60 flex-shrink-0", collapsed ? "p-2" : "px-3 py-2.5")}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
          {!collapsed && (
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-none mb-0.5">City</p>
              <p className="text-sm font-semibold text-blue-700 leading-none">
                {user?.cityId?.replace("CITY-", "") || "Surat"}
              </p>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="px-2 py-2 border-b border-gray-100 flex-shrink-0">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            startIcon={<Search className="w-3.5 h-3.5" />}
            className="h-7 text-xs"
          />
        </div>
      )}

      <nav
        className={cn(
          "flex-1 overflow-y-auto py-2",
          collapsed ? "px-1 space-y-1" : "px-2 space-y-0.5",
        )}
        onClick={onMobileClose}
      >
        {filtered.map((item) => (
          <SidebarNavItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      <div className={cn("border-t border-gray-100 p-2 flex-shrink-0", collapsed && "flex justify-center")}>
        <Link
          to="/my-account"
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-gray-100 transition-colors",
            collapsed && "justify-center",
          )}
        >
          <Avatar name={user?.name || "User"} size="sm" />
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-blue-600 truncate leading-tight">{user?.role}</p>
            </div>
          )}
        </Link>
      </div>
    </div>
  );
}

function Sidebar({ collapsed, mobileOpen, onMobileClose }: SidebarProps) {
  return (
    <>
      {/* Desktop: in-flow, never fixed */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out",
          collapsed ? "w-[60px]" : "w-[260px]",
        )}
      >
        <SidebarContent collapsed={collapsed} />
      </aside>

      {/* Mobile: full-screen overlay + slide-in drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" aria-modal="true">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 h-full w-[260px] shadow-2xl">
            <SidebarContent collapsed={false} onMobileClose={onMobileClose} />
          </div>
        </div>
      )}
    </>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen((o) => !o)}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-[70] w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-blue-600 font-medium">{unreadCount} new</span>
              )}
            </div>
            <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
              {(notifications ?? []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications</p>
              ) : (
                (notifications ?? []).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => { markRead.mutate(n.id); setOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                      !n.isRead && "bg-blue-50/40",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className={cn("mt-1.5 w-2 h-2 rounded-full flex-shrink-0", !n.isRead ? "bg-blue-500" : "bg-gray-200")} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.description}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{formatRelativeTime(n.timestamp)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Header({ collapsed, onToggleSidebar, onMobileMenuToggle, mobileOpen }: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onMobileMenuToggle: () => void;
  mobileOpen: boolean;
}) {
  const { user, logout, setRole } = useAuth();
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  return (
    <header className="h-[57px] bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 gap-3 flex-shrink-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={onMobileMenuToggle} className="lg:hidden">
          {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={onToggleSidebar} className="hidden lg:flex" title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <Menu className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-blue-700 leading-tight">CleanCar 360°</p>
            <p className="text-[10px] text-gray-400">Enterprise Resource Planning</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative hidden sm:block">
          <button
            type="button"
            onClick={() => setRolePickerOpen((o) => !o)}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-2.5 py-1.5 transition-colors"
          >
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="max-w-[120px] truncate">{user?.role}</span>
            <ChevronDown className="w-3 h-3 flex-shrink-0" />
          </button>
          {rolePickerOpen && (
            <>
              <div className="fixed inset-0 z-[60]" onClick={() => setRolePickerOpen(false)} />
              <div className="absolute right-0 top-9 z-[70] w-52 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 max-h-72 overflow-y-auto">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r as Role); setRolePickerOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50",
                      user?.role === r ? "text-blue-600 font-medium bg-blue-50/50" : "text-gray-700",
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <NotificationBell />

        <Button variant="ghost" size="icon-sm" onClick={logout} title="Logout">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <Header
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onMobileMenuToggle={() => setMobileOpen((o) => !o)}
        mobileOpen={mobileOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
