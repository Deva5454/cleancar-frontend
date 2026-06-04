CHANGE 3 — src/app/components/layouts/RootLayout.tsx
This is the main change. Apply all 5 sub-changes below in order.
3A — Add ChevronDown and ChevronRight to the lucide-react import line. Find the existing import:
tsimport { ... Clock, BarChart, UserPlus, Database, ... } from "lucide-react";
Add ChevronDown, ChevronRight to this import. Do not remove anything already there.
3B — Destructure the new sidebar context values. Find:
ts  const {
    collapsed,
    setCollapsed,
    toggleSidebar,
    userToggled,
    setUserToggled,
  } = useSidebar();
Replace with:
ts  const {
    collapsed,
    setCollapsed,
    toggleSidebar,
    userToggled,
    setUserToggled,
    openGroups,
    toggleGroup,
    openGroup,
  } = useSidebar();
3C — Auto-open the active group on navigation. Add this useEffect immediately after the existing two useEffect blocks (after setUserToggled(false) block):
ts  // Auto-open the group containing the active route
  useEffect(() => {
    userNavigation.forEach((item) => {
      if (item.children && hasActiveChild(location.pathname, location.search, item.children)) {
        openGroup(item.label);
      }
    });
  }, [location.pathname, location.search]);
3D — Replace the "Expanded mode: show full group" block. Find this exact block (the expanded mode renderer for groups):
ts              // Expanded mode: show full group
              return (
                <div key={navItem.label} className="mb-4">
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
              );
Replace with:
ts              // Expanded mode: accordion group
              const isOpen = openGroups.has(navItem.label) || childrenActive;
              return (
                <div key={navItem.label} className={`mb-1 rounded-lg overflow-hidden ${
                  childrenActive ? "border-l-2 border-blue-600" : "border-l-2 border-transparent"
                }`}>
                  {/* Clickable section header */}
                  <button
                    onClick={() => {
                      toggleGroup(navItem.label);
                      // Also navigate to parent path
                      if (navItem.path && navItem.path !== "#") {
                        window.location.href = navItem.path;
                      }
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
3E — Remove the duplicate GST Compliance entry from Accounts children. In navigationConfig.ts, find inside the Accounts children array:
ts      { label: "GST Compliance", path: "/gst", icon: ShieldCheck, module: "accounts", match: "prefix" },
Delete this line entirely. The standalone GST Compliance top-level section already handles this.