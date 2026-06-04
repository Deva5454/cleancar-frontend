/**
 * AttendanceContext - Attendance Management
 * PHASE 4: Domain-specific context for attendance data
 *
 * Owns:
 * - Attendance records
 * - Check-in/check-out tracking
 * - Attendance summaries
 *
 * Single source of truth for attendance
 */

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo, useRef} from "react";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";

// ========== TYPES ==========

export interface AttendanceRecord {
  attendanceId: string;
  employeeId: string;
  cityId: string; // City scope for multi-city isolation
  date: string; // YYYY-MM-DD
  checkInTime?: string; // HH:MM:SS
  checkOutTime?: string; // HH:MM:SS
  status: "Present" | "Absent" | "Late" | "Half Day" | "Leave" | "Week Off";
  hoursWorked?: number;
  lateMinutes?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  // MC-09: Fraud Detection
  gpsLat?: number;
  gpsLng?: number;
  deviceId?: string;
  flag?: "NONE" | "GPS_MISMATCH" | "TIME_ANOMALY" | "DUPLICATE" | "MULTI_DEVICE";
  flagReason?: string;
  // MC-10: Shift & Overtime
  workMinutes?: number;
  overtimeMinutes?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyAttendanceSummary {
  employeeId: string;
  month: string; // YYYY-MM
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  weekOffDays: number;
  totalHoursWorked: number;
  attendancePercentage: number;
}

// ========== CONTEXT TYPE ==========

interface AttendanceContextType {
  // Data
  attendanceRecords: AttendanceRecord[];

  // Actions
  addAttendanceRecord: (record: Omit<AttendanceRecord, "attendanceId" | "createdAt">) => AttendanceRecord;
  updateAttendance: (attendanceId: string, updates: Partial<AttendanceRecord>) => AttendanceRecord | null;
  deleteAttendance: (attendanceId: string) => void;

  // Queries
  getAttendanceByEmployee: (employeeId: string) => AttendanceRecord[];
  getAttendanceForDate: (date: string) => AttendanceRecord[];
  getAttendanceForMonth: (employeeId: string, month: string) => AttendanceRecord[];
  getAttendanceByDateRange: (employeeId: string, startDate: string, endDate: string) => AttendanceRecord[];
  getMonthlyAttendanceSummary: (employeeId: string, month: string) => MonthlyAttendanceSummary;

  // Statistics
  getPresentCount: (date: string) => number;
  // ✅ C03 FIX: Payroll-ready days computation (Half Day = 0.5, Late = 1, Present = 1)
  computeDaysPresent: (employeeId: string, month: string) => number;
  getAbsentCount: (date: string) => number;
  getLateCount: (date: string) => number;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

// ========== PROVIDER ==========

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const _dbAttendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const stored = DataService.get<AttendanceRecord>("ATTENDANCE_RECORDS");
    logger.debug("AttendanceContext loaded", { count: stored.length });
    return stored;
  });

  // Persist to storage
  useEffect(() => {
    if (_dbAttendTimer.current) clearTimeout(_dbAttendTimer.current);
    _dbAttendTimer.current = setTimeout(() => DataService.setAll("ATTENDANCE_RECORDS", attendanceRecords), 500);
  }, [attendanceRecords]);

  // ========== ACTIONS ==========

  const addAttendanceRecord = useCallback((
    record: Omit<AttendanceRecord, "attendanceId" | "createdAt">
  ): AttendanceRecord => {
    const newRecord: AttendanceRecord = {
      ...record,
      attendanceId: `ATT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    setAttendanceRecords((prev) => [...prev, newRecord]);
    return newRecord;
  }, []);

  const updateAttendance = useCallback((attendanceId: string, updates: Partial<AttendanceRecord>): AttendanceRecord | null => {
    const existingRecord = attendanceRecords.find((r) => r.attendanceId === attendanceId);
    if (!existingRecord) {
      logger.error("AttendanceContext: Attendance record not found", { attendanceId });
      return null;
    }

    const updatedRecord: AttendanceRecord = {
      ...existingRecord,
      ...updates,
      attendanceId: existingRecord.attendanceId, // Prevent ID change
      createdAt: existingRecord.createdAt, // Prevent createdAt change
      updatedAt: new Date().toISOString(),
    };

    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.attendanceId === attendanceId ? updatedRecord : record
      )
    );

    return updatedRecord;
  }, [attendanceRecords]);

  const deleteAttendance = useCallback((attendanceId: string) => {
    setAttendanceRecords((prev) => prev.filter((record) => record.attendanceId !== attendanceId));
  }, []);

  // ========== QUERIES ==========

  const getAttendanceByEmployee = useCallback((employeeId: string): AttendanceRecord[] => {
    return attendanceRecords.filter((record) => record.employeeId === employeeId);
  }, [attendanceRecords]);

  const getAttendanceForDate = useCallback((date: string): AttendanceRecord[] => {
    return attendanceRecords.filter((record) => record.date === date);
  }, [attendanceRecords]);

  const getAttendanceForMonth = useCallback((employeeId: string, month: string): AttendanceRecord[] => {
    return attendanceRecords.filter(
      (record) => record.employeeId === employeeId && record.date.startsWith(month)
    );
  }, [attendanceRecords]);

  const getAttendanceByDateRange = useCallback((
    employeeId: string,
    startDate: string,
    endDate: string
  ): AttendanceRecord[] => {
    return attendanceRecords.filter(
      (record) =>
        record.employeeId === employeeId &&
        record.date >= startDate &&
        record.date <= endDate
    );
  }, [attendanceRecords]);

  const getMonthlyAttendanceSummary = useCallback((
    employeeId: string,
    month: string
  ): MonthlyAttendanceSummary => {
    const records = getAttendanceForMonth(employeeId, month);
    const totalDays = records.length;
    const presentDays = records.filter((r) => r.status === "Present" || r.status === "Late").length;
    const absentDays = records.filter((r) => r.status === "Absent").length;
    const lateDays = records.filter((r) => r.status === "Late").length;
    const leaveDays = records.filter((r) => r.status === "Leave").length;
    const weekOffDays = records.filter((r) => r.status === "Week Off").length;
    const totalHoursWorked = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      employeeId,
      month,
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      weekOffDays,
      totalHoursWorked,
      attendancePercentage,
    };
  }, [getAttendanceForMonth]);

  // ========== STATISTICS ==========

  // ✅ C03 FIX: Compute payroll-ready days present with half-day weighting
  const computeDaysPresent = useCallback((employeeId: string, month: string): number => {
    const records = getAttendanceForMonth(employeeId, month);
    return records.reduce((total, r) => {
      if (r.status === "Present" || r.status === "Late") return total + 1;
      if (r.status === "Half Day") return total + 0.5;
      return total; // Absent, Leave, Week Off = 0
    }, 0);
  }, [getAttendanceForMonth]);

  const getPresentCount = useCallback((date: string): number => {
    return attendanceRecords.filter(
      (r) => r.date === date && (r.status === "Present" || r.status === "Late")
    ).length;
  }, [attendanceRecords]);

  const getAbsentCount = useCallback((date: string): number => {
    return attendanceRecords.filter((r) => r.date === date && r.status === "Absent").length;
  }, [attendanceRecords]);

  const getLateCount = useCallback((date: string): number => {
    return attendanceRecords.filter((r) => r.date === date && r.status === "Late").length;
  }, [attendanceRecords]);

  // ========== CONTEXT VALUE ==========

  const contextValue = useMemo((): AttendanceContextType => ({
    attendanceRecords,
    addAttendanceRecord,
    updateAttendance,
    deleteAttendance,
    getAttendanceByEmployee,
    getAttendanceForDate,
    getAttendanceForMonth,
    getAttendanceByDateRange,
    getMonthlyAttendanceSummary,
    getPresentCount,
    computeDaysPresent,
    getAbsentCount,
    getLateCount,
  }), [attendanceRecords, addAttendanceRecord, updateAttendance, deleteAttendance, getAttendanceByEmployee, getAttendanceForDate, getAttendanceForMonth, getAttendanceByDateRange, getMonthlyAttendanceSummary, getPresentCount]);

    return <AttendanceContext.Provider value={contextValue}>{children}</AttendanceContext.Provider>;
}

// ========== HOOK ==========

export function useAttendance() {
  const context = useContext(AttendanceContext);
  if (!context) {
    // Safety fallback — return empty/no-op context instead of crashing.
    // This handles edge cases where a component renders before AttendanceProvider
    // mounts (e.g. during bootstrap or lazy-load race conditions).
    console.warn("[useAttendance] Called outside AttendanceProvider — returning empty fallback");
    return {
      attendanceRecords: [],
      addAttendanceRecord: () => ({ attendanceId: "", employeeId: "", date: "", status: "Present" as const, createdAt: "" }),
      updateAttendance: () => null,
      deleteAttendanceRecord: () => {},
      getAttendanceByEmployeeId: () => [],
      getAttendanceForDate: () => [],
      getAttendanceForMonth: () => [],
      getTodayAttendance: () => undefined,
      getMonthlyAttendanceSummary: () => ({ present: 0, absent: 0, late: 0, halfDay: 0, leave: 0, holiday: 0, total: 0 }),
      computeDaysPresent: () => 0,
      getAbsentCount: () => 0,
      getLateCount: () => 0,
    };
  }
  return context;
}
