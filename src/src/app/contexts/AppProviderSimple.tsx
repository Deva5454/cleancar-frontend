/**
 * Simplified AppProvider for debugging
 * Wraps only essential providers to identify which one is causing issues
 */

import { ReactNode } from "react";
import { RoleProvider } from "./RoleContext";
import { CityProvider } from "./CityContext";
import { EventSystemProvider } from "./EventSystem";
import { SidebarProvider } from "./SidebarContext";

interface AppProviderSimpleProps {
  children: ReactNode;
}

export function AppProviderSimple({ children }: AppProviderSimpleProps) {
  try {
    return (
      <EventSystemProvider>
        <RoleProvider>
          <CityProvider>
            <SidebarProvider>
              {children}
            </SidebarProvider>
          </CityProvider>
        </RoleProvider>
      </EventSystemProvider>
    );
  } catch (error) {
    console.error("AppProviderSimple error:", error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-yellow-50">
        <div className="text-center p-8">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Provider Error</h2>
          <p className="text-sm text-yellow-700">One or more providers failed to initialize</p>
          <pre className="mt-4 text-xs text-left bg-white p-4 rounded">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
