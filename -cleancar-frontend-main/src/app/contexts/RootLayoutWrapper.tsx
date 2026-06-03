import { useEffect } from "react";
import { AppProvider } from "../../contexts/AppProvider";
import { useGlobalEventHandlers } from "../../hooks/useGlobalEventHandlers";
import { initializeHRData } from "../../utils/hr-data-initializer";
import { EventMonitor } from "../crm/EventMonitor";
import { RootLayout } from "./RootLayout";

/**
 * AppShell — renders inside AppProvider so all hooks have access to contexts.
 * Hosts side-effect hooks (global event handlers, HR data init) and EventMonitor.
 */
function AppShell() {
  useGlobalEventHandlers();

  useEffect(() => {
    try { initializeHRData(); } catch (e) {
      console.error("Failed to initialize HR data:", e);
    }
  }, []);

  return (
    <>
      <RootLayout />
      <EventMonitor />
    </>
  );
}

/**
 * RootLayoutWrapper — entry point for the authenticated route tree.
 * Wraps AppProvider here so ALL route components rendered by RootLayout/Outlet
 * have access to every context (Attendance, Employee, Finance, etc.).
 *
 * WHY HERE and not in App.tsx:
 * createBrowserRouter + RouterProvider creates its own React tree that is
 * OUTSIDE any context provided by App.tsx wrappers. Placing AppProvider here,
 * inside the router tree (as a route element), makes contexts available to
 * every page component rendered via <Outlet />.
 */
export function RootLayoutWrapper() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
