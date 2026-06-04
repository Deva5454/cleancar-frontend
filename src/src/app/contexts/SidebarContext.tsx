import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  userToggled: boolean;
  setUserToggled: (toggled: boolean) => void;
  openGroups: Set<string>;
  toggleGroup: (label: string) => void;
  openGroup: (label: string) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);
SidebarContext.displayName = "SidebarContext";

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("sidebarCollapsed") === "true"; }
    catch { return false; }
  });
  const [userToggled, setUserToggled] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("sidebarOpenGroups");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  const toggleSidebar = () => { setCollapsed(p => !p); setUserToggled(true); };

  const toggleGroup = (label: string) => {
    setOpenGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const openGroup = (label: string) => {
    setOpenGroups(prev => {
      if (prev.has(label)) return prev;
      const next = new Set(prev);
      next.add(label);
      return next;
    });
  };

  useEffect(() => {
    try { localStorage.setItem("sidebarCollapsed", String(collapsed)); } catch {}
  }, [collapsed]);

  useEffect(() => {
    try { localStorage.setItem("sidebarOpenGroups", JSON.stringify([...openGroups])); } catch {}
  }, [openGroups]);

  const value: SidebarContextType = {
    collapsed, setCollapsed, toggleSidebar,
    userToggled, setUserToggled,
    openGroups, toggleGroup, openGroup,
  };

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    if (import.meta.hot || !import.meta.env?.PROD) {
      return {
        collapsed: false, setCollapsed: () => {}, toggleSidebar: () => {},
        userToggled: false, setUserToggled: () => {},
        openGroups: new Set<string>(), toggleGroup: () => {}, openGroup: () => {},
      } as SidebarContextType;
    }
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}
