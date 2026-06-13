/**
 * Simplified AppProvider for the /buy public page
 * Only includes providers needed by CustomerPlanPage:
 * useFinance, useCustomers, useCustomerSubscriptions, useCity
 */

import { ReactNode } from "react";
import { EventSystemProvider } from "./EventSystem";
import { RoleProvider } from "./RoleContext";
import { CityProvider } from "./CityContext";
import { CustomerProvider } from "./CustomerContext";
import { CustomerSubscriptionProvider } from "./CustomerSubscriptionContext";
import { FinanceProvider } from "./FinanceContext";
import { SidebarProvider } from "./SidebarContext";

interface AppProviderSimpleProps {
  children: ReactNode;
}

export function AppProviderSimple({ children }: AppProviderSimpleProps) {
  return (
    <EventSystemProvider>
      <RoleProvider>
        <CityProvider>
          <CustomerProvider>
            <CustomerSubscriptionProvider>
              <FinanceProvider>
                <SidebarProvider>
                  {children}
                </SidebarProvider>
              </FinanceProvider>
            </CustomerSubscriptionProvider>
          </CustomerProvider>
        </CityProvider>
      </RoleProvider>
    </EventSystemProvider>
  );
}
