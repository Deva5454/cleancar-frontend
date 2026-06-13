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

// AUTO-LOGIN: Always set Super Admin session before React mounts (hardcoded fallback)
// This guarantees RootLayout never redirects to /login, preventing the 3x mount loop
// To switch users: localStorage.clear(); location.reload() then log in normally
try {
  // Always unlock Super Admin first
  try {
    const emps = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]");
    const i = emps.findIndex((e: any) => e.loginMobile === "9100000001");
    if (i >= 0 && emps[i].accountStatus === "locked") {
      emps[i].accountStatus = "active"; emps[i].failedLoginAttempts = 0; delete emps[i].lockedUntil;
      localStorage.setItem("EMPLOYEE_DATABASE_RECORDS", JSON.stringify(emps));
    }
  } catch {}
  // Set session if not already set — hardcoded so it ALWAYS works on first load
  if (!localStorage.getItem("cc360_session")) {
    let empId = "EDB-SA-01", empName = "Rajesh Patel", empCity = "CITY-SURAT";
    try {
      const emps = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]");
      const sa = emps.find((e: any) => e.loginMobile === "9100000001");
      if (sa) { empId = sa.id || empId; empName = sa.fullName || empName; empCity = sa.cityId || empCity; }
    } catch {}
    localStorage.setItem("cc360_session", JSON.stringify({
      employeeId: empId, employeeName: empName,
      role: "Super Admin", cityId: empCity,
      loginTime: new Date().toISOString(),
    }));
  }
} catch (_e) { /* non-critical */}

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
 
