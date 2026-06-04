/**
 * EventSystem - Global event bus for system-wide events
 * Used to decouple modules and enable reactive updates across the app
 *
 * NOTE: This handles SYSTEM events only, not UI-only actions
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo, useRef } from "react";

// System Event Types (NO UI-only actions)
export type SystemEventType =
  | "LEAD_CONVERTED"           // Lead becomes customer
  | "DEMO_COMPLETED"            // Demo service completed
  | "SUBSCRIPTION_CREATED"      // New subscription created
  | "SUBSCRIPTION_ACTIVATED"    // Subscription goes live
  | "SUBSCRIPTION_PAUSED"       // Subscription paused
  | "SUBSCRIPTION_CANCELLED"    // Subscription cancelled
  | "JOB_CREATED"              // New job created
  | "JOB_ASSIGNED"             // Job assigned to washer
  | "JOB_COMPLETED"            // Job marked complete
  | "JOB_VERIFIED"             // Job verification complete
  | "WASHER_CHECKIN"           // Washer clocks in
  | "WASHER_CHECKOUT"          // Washer clocks out
  | "INVENTORY_ISSUED"         // Inventory issued to washer/supervisor
  | "INVENTORY_LOW_STOCK"      // Stock below reorder level
  | "PAYROLL_PROCESSED"        // Payroll run processed
  | "PAYROLL_APPROVED"         // Payroll approved by finance
  | "PAYMENT_RECEIVED"         // Customer payment received
  | "PAYMENT_MADE"             // Vendor/salary payment made
  | "QA_AUDIT_SUBMITTED"       // QA audit completed
  | "HR_OVERRIDE_APPLIED";     // HR override applied to incentive

export interface SystemEvent<T = any> {
  type: SystemEventType;
  timestamp: string;
  data: T;
  source?: string; // Module that triggered the event
}

type EventListener<T = any> = (event: SystemEvent<T>) => void;

interface EventSystemContextType {
  // Emit a system event
  emit: <T = any>(type: SystemEventType, data: T, source?: string) => void;

  // Subscribe to events
  subscribe: <T = any>(type: SystemEventType, listener: EventListener<T>) => () => void;

  // Get event history (for debugging/audit)
  getEventHistory: (type?: SystemEventType, limit?: number) => SystemEvent[];
}

const EventSystemContext = createContext<EventSystemContextType | undefined>(undefined);

export function EventSystemProvider({ children }: { children: ReactNode }) {
  const [eventHistory, setEventHistory] = useState<SystemEvent[]>([]);
  const [listeners, setListeners] = useState<Map<SystemEventType, Set<EventListener>>>(new Map());

  const emit = useCallback(<T = any>(type: SystemEventType, data: T, source?: string) => {
    const event: SystemEvent<T> = {
      type,
      timestamp: new Date().toISOString(),
      data,
      source,
    };

    // Add to history
    setEventHistory((prev) => [event, ...prev].slice(0, 1000)); // Keep last 1000 events

    // Notify all listeners for this event type
    const eventListeners = listeners.get(type);
    if (eventListeners) {
      eventListeners.forEach((listener) => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${type}:`, error);
        }
      });
    }

    // Log event (optional - can be disabled in production)
    console.log(`[EVENT] ${type}`, { data, source, timestamp: event.timestamp });
  }, [listeners]);

  const subscribe = useCallback(<T = any>(
    type: SystemEventType,
    listener: EventListener<T>
  ): (() => void) => {
    setListeners((prev) => {
      const newListeners = new Map(prev);
      const typeListeners = newListeners.get(type) || new Set();
      typeListeners.add(listener as EventListener);
      newListeners.set(type, typeListeners);
      return newListeners;
    });

    // Return unsubscribe function
    return () => {
      setListeners((prev) => {
        const newListeners = new Map(prev);
        const typeListeners = newListeners.get(type);
        if (typeListeners) {
          typeListeners.delete(listener as EventListener);
          if (typeListeners.size === 0) {
            newListeners.delete(type);
          } else {
            newListeners.set(type, typeListeners);
          }
        }
        return newListeners;
      });
    };
  }, []);

  const getEventHistory = (type?: SystemEventType, limit: number = 100): SystemEvent[] => {
    let filtered = eventHistory;
    if (type) {
      filtered = eventHistory.filter((e) => e.type === type);
    }
    return filtered.slice(0, limit);
  };

  const contextValue = useMemo(() => ({
        emit,
        subscribe,
        getEventHistory,
      }),
  [emit, subscribe, getEventHistory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <EventSystemContext.Provider
      value={contextValue}
    >
      {children}
    </EventSystemContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventSystemContext);
  if (!context) {
    console.warn("[useEvents] outside EventSystemProvider - fallback"); return context as any;
  }
  return context;
}

/**
 * Hook to subscribe to specific events
 * Automatically unsubscribes on component unmount
 */
export function useEventListener<T = any>(
  type: SystemEventType,
  listener: EventListener<T>,
  deps: React.DependencyList = []
) {
  // Use a ref to hold the context — prevents esbuild from eliminating
  // the subscribe reference as dead code
  const ctxRef = useRef(useEvents());
  ctxRef.current = useEvents();

  useEffect(() => {
    const subscribeFn = ctxRef.current?.subscribe;
    if (typeof subscribeFn !== "function") return;
    const unsubscribe = subscribeFn(type, listener);
    return () => { if (typeof unsubscribe === "function") unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, ...deps]);
}
