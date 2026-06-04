/**
 * Master Data Hook - Unified Access to Employee and Attendance Masters
 *
 * Provides seamless access to EmployeeMaster and AttendanceMaster
 * with automatic fallback to legacy data structures
 */

import { useState, useEffect, useCallback } from "react";
import {
  employeeMasterService,
  EmployeeAdapter,
  type EmployeeMaster,
  type EmployeeStatus,
} from "../services/employeeMaster";
import {
  attendanceMasterService,
  AttendanceAdapter,
  type AttendanceMaster,
  type MonthlyAttendanceSummary,
} from "../services/attendanceMaster";
import { useEmployee } from "../contexts/EmployeeContext";
import { useAttendance } from "../contexts/AttendanceContext";
import { logger } from "../services/logger";

/**
 * Hook for accessing Employee Master data
 */
export function useEmployeeMaster() {
  const [employees, setEmployees] = useState<EmployeeMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const { employees: legacyEmployees } = useEmployee();

  // Load employees from master or adapt from legacy
  useEffect(() => {
    loadEmployees();
  }, [legacyEmployees]);

  const loadEmployees = useCallback(() => {
    setLoading(true);
    try {
      let masterEmployees = employeeMasterService.getAll();

      // If no master data exists, adapt from legacy
      if (masterEmployees.length === 0 && legacyEmployees.length > 0) {
        logger.log("useMasterData: Adapting legacy employees to master");
        masterEmployees = EmployeeAdapter.batchToMaster(
          legacyEmployees.map(emp => ({
            employeeId: emp.employeeId,
            firstName: emp.firstName || emp.name?.split(' ')[0] || '',
            lastName: emp.lastName || emp.name?.split(' ').slice(1).join(' ') || '',
            email: emp.email || "",
            phone: emp.phone,
            role: emp.role,
            status: emp.status,
            joiningDate: emp.joiningDate,
            department: emp.department || "Operations",
            city: emp.city,
            cityId: emp.cityId,
            clusterId: emp.clusterId,
          }))
        );

        // Save adapted data to master storage
        masterEmployees.forEach(emp => {
          if (!employeeMasterService.getById(emp.employeeId)) {
            employeeMasterService.create({
              name: emp.name,
              phone: emp.phone,
              roleId: emp.roleId,
              cityId: emp.cityId,
              status: emp.status,
              joiningDate: emp.joiningDate,
            });
          }
        });

        // Reload after save
        masterEmployees = employeeMasterService.getAll();
      }

      setEmployees(masterEmployees);
    } catch (error) {
      logger.error("useMasterData: Failed to load employees", error);
    } finally {
      setLoading(false);
    }
  }, [legacyEmployees]);

  const getById = useCallback((employeeId: string) => {
    return employeeMasterService.getById(employeeId);
  }, []);

  const getByStatus = useCallback((status: EmployeeStatus) => {
    return employeeMasterService.getByStatus(status);
  }, []);

  const getByCity = useCallback((cityId: string) => {
    return employeeMasterService.getByCity(cityId);
  }, []);

  const create = useCallback((data: Omit<EmployeeMaster, "employeeId" | "createdAt" | "updatedAt">) => {
    const newEmployee = employeeMasterService.create(data);
    loadEmployees();
    return newEmployee;
  }, [loadEmployees]);

  const update = useCallback((employeeId: string, updates: Partial<Omit<EmployeeMaster, "employeeId" | "createdAt">>) => {
    const updated = employeeMasterService.update(employeeId, updates);
    loadEmployees();
    return updated;
  }, [loadEmployees]);

  const markAsExit = useCallback((employeeId: string, exitDate: string) => {
    const updated = employeeMasterService.markAsExit(employeeId, exitDate);
    loadEmployees();
    return updated;
  }, [loadEmployees]);

  const activate = useCallback((employeeId: string) => {
    const updated = employeeMasterService.activate(employeeId);
    loadEmployees();
    return updated;
  }, [loadEmployees]);

  const getStatusCounts = useCallback(() => {
    return employeeMasterService.getStatusCounts();
  }, []);

  return {
    employees,
    loading,
    getById,
    getByStatus,
    getByCity,
    create,
    update,
    markAsExit,
    activate,
    getStatusCounts,
    refresh: loadEmployees,
  };
}

/**
 * Hook for accessing Attendance Master data
 */
export function useAttendanceMaster() {
  const [attendance, setAttendance] = useState<AttendanceMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const { attendanceRecords: legacyRecords } = useAttendance();

  // Load attendance from master or adapt from legacy
  useEffect(() => {
    loadAttendance();
  }, [legacyRecords]);

  const loadAttendance = useCallback(() => {
    setLoading(true);
    try {
      let masterAttendance = attendanceMasterService.getAll();

      // If no master data exists, adapt from legacy
      if (masterAttendance.length === 0 && legacyRecords.length > 0) {
        logger.log("useMasterData: Adapting legacy attendance to master");
        masterAttendance = AttendanceAdapter.batchToMaster(legacyRecords);

        // Save adapted data to master storage (bulk import)
        const toCreate = masterAttendance.map(rec => ({
          employeeId: rec.employeeId,
          cityId: rec.cityId,
          date: rec.date,
          checkInTime: rec.checkInTime,
          checkOutTime: rec.checkOutTime,
          status: rec.status,
          hoursWorked: rec.hoursWorked,
          workMinutes: rec.workMinutes,
          overtimeMinutes: rec.overtimeMinutes,
          lateMinutes: rec.lateMinutes,
          checkInLocation: rec.checkInLocation,
          gpsLat: rec.gpsLat,
          gpsLng: rec.gpsLng,
          deviceId: rec.deviceId,
          flag: rec.flag,
          flagReason: rec.flagReason,
          shiftId: rec.shiftId,
          expectedCheckIn: rec.expectedCheckIn,
          expectedCheckOut: rec.expectedCheckOut,
        }));

        attendanceMasterService.bulkImport(toCreate);

        // Reload after save
        masterAttendance = attendanceMasterService.getAll();
      }

      setAttendance(masterAttendance);
    } catch (error) {
      logger.error("useMasterData: Failed to load attendance", error);
    } finally {
      setLoading(false);
    }
  }, [legacyRecords]);

  const getById = useCallback((attendanceId: string) => {
    return attendanceMasterService.getById(attendanceId);
  }, []);

  const getByEmployee = useCallback((employeeId: string) => {
    return attendanceMasterService.getByEmployee(employeeId);
  }, []);

  const getByDate = useCallback((date: string) => {
    return attendanceMasterService.getByDate(date);
  }, []);

  const getByCity = useCallback((cityId: string) => {
    return attendanceMasterService.getByCity(cityId);
  }, []);

  const getByDateRange = useCallback((employeeId: string, startDate: string, endDate: string) => {
    return attendanceMasterService.getByDateRange(employeeId, startDate, endDate);
  }, []);

  const getByMonth = useCallback((employeeId: string, month: string) => {
    return attendanceMasterService.getByMonth(employeeId, month);
  }, []);

  const getFlagged = useCallback((cityId?: string) => {
    return attendanceMasterService.getFlagged(cityId);
  }, []);

  const create = useCallback((data: Omit<AttendanceMaster, "attendanceId" | "createdAt">) => {
    const newRecord = attendanceMasterService.create(data);
    loadAttendance();
    return newRecord;
  }, [loadAttendance]);

  const update = useCallback((attendanceId: string, updates: Partial<Omit<AttendanceMaster, "attendanceId" | "createdAt">>) => {
    const updated = attendanceMasterService.update(attendanceId, updates);
    loadAttendance();
    return updated;
  }, [loadAttendance]);

  const deleteRecord = useCallback((attendanceId: string) => {
    attendanceMasterService.delete(attendanceId);
    loadAttendance();
  }, [loadAttendance]);

  const getMonthlyAttendanceSummary = useCallback((employeeId: string, month: string, cityId: string): MonthlyAttendanceSummary => {
    return attendanceMasterService.getMonthlyAttendanceSummary(employeeId, month, cityId);
  }, []);

  return {
    attendance,
    loading,
    getById,
    getByEmployee,
    getByDate,
    getByCity,
    getByDateRange,
    getByMonth,
    getFlagged,
    create,
    update,
    delete: deleteRecord,
    getMonthlyAttendanceSummary,
    refresh: loadAttendance,
  };
}
