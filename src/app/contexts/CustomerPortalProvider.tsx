/**
 * CustomerPortalProvider — a real, minimal provider chain for the
 * customer-facing portal.
 *
 * Previously, the portal reused the full staff AppProvider — 24 nested
 * providers loading the entire staff application's data (HR, payroll,
 * incentives, GST, finance, inventory, demos, and more), none of which
 * a customer logging in to see their own bookings needs. It also starts
 * a real WebSocket connection and hourly background notification checks
 * on every mount (PeriodicScheduler) — real overhead a customer-facing
 * login screen has no reason to carry, and a plausible source of a page
 * that never finishes loading if that connection can't complete.
 *
 * Traced the real dependency chain rather than guessing what could be
 * removed: CityContext genuinely needs RoleProvider, CustomerContext and
 * JobContext genuinely need EventSystemProvider (for real notifications
 * like the ones already built for BTL assignments and job completion),
 * and CustomerSubscriptionContext genuinely needs CityProvider. This is
 * that real chain — nothing more, nothing less.
 * This follows the same real precedent already established for the
 * other public customer-facing page — AppProviderSimple.tsx, built for
 * /buy — which does the identical thing for the same reason. This is a
 * portal-specific variant of that same idea: it adds JobProvider (for
 * real booking history and tracking, which /buy doesn't need) and
 * leaves out FinanceProvider/SidebarProvider (which /buy uses but the
 * portal doesn't).
 */

import type { ReactNode } from "react";
import { EventSystemProvider } from "./EventSystem";
import { RoleProvider } from "./RoleContext";
import { CityProvider } from "./CityContext";
import { CustomerProvider } from "./CustomerContext";
import { CustomerSubscriptionProvider } from "./CustomerSubscriptionContext";
import { JobProvider } from "./JobContext";

export function CustomerPortalProvider({ children }: { children: ReactNode }) {
  return (
    <EventSystemProvider>
      <RoleProvider>
        <CityProvider>
          <CustomerProvider>
            <CustomerSubscriptionProvider>
              <JobProvider>
                {children}
              </JobProvider>
            </CustomerSubscriptionProvider>
          </CustomerProvider>
        </CityProvider>
      </RoleProvider>
    </EventSystemProvider>
  );
}
