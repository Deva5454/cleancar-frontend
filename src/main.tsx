import React from "react";
// Geist font — weights 400 (regular) and 500 (medium)
import "@fontsource/geist/400.css";
import "@fontsource/geist/500.css";
import "@fontsource/geist/600.css";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./styles/index.css";
import App from "./app/App";
import { EmergencyFallback } from "./app/EmergencyFallback";
import { seedAllData, seedExtendedModules } from "./app/utils/seedAllData";

// ── React Query client ─────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 min — data is localStorage, always fresh
      gcTime: 1000 * 60 * 30,    // 30 min cache
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Run seed SYNCHRONOUSLY before React mounts ────────────────────────────
// MUST run before createRoot so every Context useState(() => DataService.get())
// reads fresh seeded data. Running in a useEffect is too late.
try { seedAllData(); } catch (e) { console.error("Seed failed:", e); }
try { seedExtendedModules(); } catch (e) { console.error("Extended seed failed:", e); }

// AUTO-LOGIN: Set Super Admin session before React mounts
// This prevents the /login redirect loop that causes React #306
// To switch users: localStorage.clear(); location.reload() then log in manually
try {
  if (!localStorage.getItem("cc360_session")) {
    const emps = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]");
    const sa = emps.find((e: any) => e.loginMobile === "9100000001");
    if (sa) {
      // Also unlock if locked
      if (sa.accountStatus === "locked") {
        sa.accountStatus = "active";
        sa.failedLoginAttempts = 0;
        delete sa.lockedUntil;
        localStorage.setItem("EMPLOYEE_DATABASE_RECORDS", JSON.stringify(emps));
      }
      localStorage.setItem("cc360_session", JSON.stringify({
        employeeId: sa.id || "EDB-SA-01",
        employeeName: sa.fullName || "Super Admin",
        role: sa.role || "Super Admin",
        cityId: sa.cityId || "CITY-SURAT",
        loginTime: new Date().toISOString(),
      }));
    }
  }
} catch (_e) { /* non-critical */ }

// Handle Figma Make ?preview-route= query param
const params = new URLSearchParams(window.location.search);
const previewRoute = params.get("preview-route");
if (previewRoute && window.location.pathname === "/") {
  const cleanRoute = previewRoute.startsWith("/") ? previewRoute : "/" + previewRoute;
  history.replaceState(null, "", cleanRoute);
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found in index.html");

try {
  createRoot(container).render(
    <React.Fragment>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </React.Fragment>
  );
} catch (error) {
  console.error("Fatal error rendering app:", error);
  createRoot(container).render(<EmergencyFallback />);
}
 
