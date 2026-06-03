/**
 * ShiftContext - Shift Management (MC-10)
 *
 * Manages work shifts for multi-city operations:
 * - Create/update/delete shifts
 * - City-scoped shift management
 * - Shift templates and schedules
 *
 * Single source of truth for shift data
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
import { Shift } from "../types/hr-types";
import { logger } from "../services/logger";

// ========== CONTEXT TYPE ==========

interface ShiftContextType {
  // Data
  shifts: Shift[];

  // Actions
  addShift: (shift: Omit<Shift, "id" | "createdAt">) => Shift;
  updateShift: (id: string, updates: Partial<Shift>) => Shift | null;
  deleteShift: (id: string) => void;

  // Queries
  getShiftById: (id: string) => Shift | null;
  getShiftsByCity: (cityId: string) => Shift[];
  getActiveShiftsByCity: (cityId: string) => Shift[];
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

// ========== DEFAULT SHIFTS ==========

const DEFAULT_SHIFTS: Shift[] = [
  { id: "SHIFT-MORNING-WASH", name: "Morning Wash", cityId: "CITY-SURAT", startTime: "05:00", endTime: "09:00", graceMinutes: 10, overtimeThresholdMinutes: 0, isActive: true, createdAt: new Date().toISOString() },
  { id: "SHIFT-DAY-1", name: "Day Shift 1", cityId: "CITY-SURAT", startTime: "10:00", endTime: "19:00", graceMinutes: 15, overtimeThresholdMinutes: 30, isActive: true, createdAt: new Date().toISOString() },
  { id: "SHIFT-DAY-2", name: "Day Shift 2", cityId: "CITY-SURAT", startTime: "14:00", endTime: "22:00", graceMinutes: 15, overtimeThresholdMinutes: 30, isActive: true, createdAt: new Date().toISOString() },
];

// Add storage key to DataService
declare module "../services/DataService" {
  interface DataServiceClass {
    get<T>(entityType: "SHIFTS", cityId?: string): T[];
    setAll<T>(entityType: "SHIFTS", records: T[], cityId?: string): void;
  }
}

// ========== PROVIDER ==========

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [shifts, setShifts] = useState<Shift[]>(() => {
    // Try to load from storage
    const stored = localStorage.getItem("cleancar_shifts");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        logger.debug("ShiftContext loaded from storage", { count: parsed.length });
        return parsed;
      } catch (error) {
        logger.error("ShiftContext: Failed to parse stored shifts", error);
      }
    }

    // Use defaults if nothing stored
    logger.debug("ShiftContext initialized with defaults", { count: DEFAULT_SHIFTS.length });
    return DEFAULT_SHIFTS;
  });

  const _dbShiftsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Persist to storage — wrapped in try/catch to prevent quota crash
  useEffect(() => {
    if (_dbShiftsTimer.current) clearTimeout(_dbShiftsTimer.current);
    _dbShiftsTimer.current = setTimeout(() => {
      try {
        localStorage.setItem("cleancar_shifts", JSON.stringify(shifts));
      } catch {
        console.warn("[ShiftContext] localStorage full — shifts not persisted");
      }
    }, 500);
  }, [shifts]);

  // ========== ACTIONS ==========

  const addShift = useCallback((shift: Omit<Shift, "id" | "createdAt">): Shift => {
    const newShift: Shift = {
      ...shift,
      id: `SHIFT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };

    setShifts((prev) => [...prev, newShift]);
    logger.log("ShiftContext: Shift created", { shiftId: newShift.id, name: newShift.name });
    return newShift;
  }, []);

  const updateShift = useCallback(
    (id: string, updates: Partial<Shift>): Shift | null => {
      const existingShift = shifts.find((s) => s.id === id);
      if (!existingShift) {
        logger.error("ShiftContext: Shift not found", { shiftId: id });
        return null;
      }

      const updatedShift: Shift = {
        ...existingShift,
        ...updates,
        id: existingShift.id, // Prevent ID change
        createdAt: existingShift.createdAt, // Prevent createdAt change
        updatedAt: new Date().toISOString(),
      };

      setShifts((prev) => prev.map((shift) => (shift.id === id ? updatedShift : shift)));
      logger.log("ShiftContext: Shift updated", { shiftId: id });
      return updatedShift;
    },
    [shifts]
  );

  const deleteShift = useCallback((id: string) => {
    setShifts((prev) => prev.filter((shift) => shift.id !== id));
    logger.log("ShiftContext: Shift deleted", { shiftId: id });
  }, []);

  // ========== QUERIES ==========

  const getShiftById = useCallback(
    (id: string): Shift | null => {
      return shifts.find((s) => s.id === id) || null;
    },
    [shifts]
  );

  const getShiftsByCity = useCallback(
    (cityId: string): Shift[] => {
      return shifts.filter((s) => s.cityId === cityId);
    },
    [shifts]
  );

  const getActiveShiftsByCity = useCallback(
    (cityId: string): Shift[] => {
      return shifts.filter((s) => s.cityId === cityId && s.isActive);
    },
    [shifts]
  );

  // ========== CONTEXT VALUE ==========

  const contextValue = useMemo((): ShiftContextType => ({
    shifts,
    addShift,
    updateShift,
    deleteShift,
    getShiftById,
    getShiftsByCity,
    getActiveShiftsByCity,
  }), [shifts, addShift, updateShift, deleteShift, getShiftById, getShiftsByCity, getActiveShiftsByCity]);

    return <ShiftContext.Provider value={contextValue}>{children}</ShiftContext.Provider>;
}

// ========== HOOK ==========

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    console.warn("[useShift] Called outside ShiftProvider — returning fallback"); return context as any;
  }
  return context;
}
