/**
 * CustomerPortalAuthContext — real session state for the customer-facing
 * portal, kept separate from staff role/auth (RoleContext), since a
 * customer is a fundamentally different kind of user, not a staff role.
 *
 * Login is phone-number based, matched against the real Customer records
 * already used throughout the business side of the app (CustomerContext)
 * — not a separate, parallel customer list. There is no real SMS/OTP
 * service in this app, so this is an honest, simplified real-customer
 * lookup for now: enter the phone number on file, and if it matches a
 * real customer record, they're logged in as that customer. A real OTP
 * step would be a genuine backend addition, not something this frontend
 * alone can add safely.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

interface CustomerPortalAuthContextType {
  loggedInCustomerId: string | null;
  logout: () => void;
}

const CustomerPortalAuthContext = createContext<CustomerPortalAuthContextType | undefined>(undefined);

export const CUSTOMER_PORTAL_SESSION_KEY = "cc360_customer_portal_session";
const SESSION_KEY = CUSTOMER_PORTAL_SESSION_KEY;

export function CustomerPortalAuthProvider({ children }: { children: ReactNode }) {
  const [loggedInCustomerId, setLoggedInCustomerId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  const logout = () => {
    setLoggedInCustomerId(null);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
  };

  return (
    <CustomerPortalAuthContext.Provider value={{ loggedInCustomerId, logout }}>
      {children}
    </CustomerPortalAuthContext.Provider>
  );
}

export function useCustomerPortalAuth() {
  const ctx = useContext(CustomerPortalAuthContext);
  if (!ctx) throw new Error("useCustomerPortalAuth must be used within CustomerPortalAuthProvider");
  return ctx;
}
