/**
 * Attendance Fraud Alerts Page (MC-09)
 *
 * Admin UI for reviewing flagged attendance records:
 * - GPS_MISMATCH: Check-in outside work location
 * - TIME_ANOMALY: Impossible time gaps
 * - MULTI_DEVICE: Multiple devices same day
 * - DUPLICATE: Duplicate check-ins
 *
 * ROLE PROTECTION: Super Admin / Admin / HR only
 */

import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import { useAttendance } from "../../contexts/AttendanceContext";
import { useEmployee } from "../../contexts/EmployeeContext";
import { BackButton } from "../ui/back-button";

export function AttendanceFraudAlertsPage() {
  const { currentUser } = useRole();
  const { attendanceRecords } = useAttendance();
  const { getEmployeeById } = useEmployee();

  const [filterFlag, setFilterFlag] = useState<string>("ALL");
  const [filterEmployee, setFilterEmployee] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  // Role protection
  if (!currentUser || !["Super Admin", "Admin", "HR"].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="mt-2 text-gray-600">
            Only Super Admin, Admin, and HR can view fraud alerts.
          </p>
        </div>
      </div>
    );
  }

  // Filter flagged records
  const flaggedRecords = useMemo(() => {
    return attendanceRecords
      .filter((record) => {
        // Only show records from current city
        if (record.cityId !== currentUser.cityId) return false;

        // Only flagged records
        if (!record.flag || record.flag === "NONE") return false;

        // Filter by flag type
        if (filterFlag !== "ALL" && record.flag !== filterFlag) return false;

        // Filter by employee
        if (filterEmployee !== "ALL" && record.employeeId !== filterEmployee) return false;

        // Filter by date range
        if (record.date < dateRange.start || record.date > dateRange.end) return false;

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendanceRecords, currentUser.cityId, filterFlag, filterEmployee, dateRange]);

  // Get unique employees with flags
  const employeesWithFlags = useMemo(() => {
    const employeeIds = new Set(
      attendanceRecords
        .filter((r) => r.flag && r.flag !== "NONE" && r.cityId === currentUser.cityId)
        .map((r) => r.employeeId)
    );
    return Array.from(employeeIds).map((id) => getEmployeeById(id)).filter(Boolean);
  }, [attendanceRecords, currentUser.cityId, getEmployeeById]);

  // Statistics
  const stats = useMemo(() => {
    const cityRecords = attendanceRecords.filter((r) => r.cityId === currentUser.cityId);
    const totalFlagged = cityRecords.filter((r) => r.flag && r.flag !== "NONE").length;
    const gpsFlags = cityRecords.filter((r) => r.flag === "GPS_MISMATCH").length;
    const timeFlags = cityRecords.filter((r) => r.flag === "TIME_ANOMALY").length;
    const deviceFlags = cityRecords.filter((r) => r.flag === "MULTI_DEVICE").length;
    const duplicateFlags = cityRecords.filter((r) => r.flag === "DUPLICATE").length;

    return {
      total: totalFlagged,
      gps: gpsFlags,
      time: timeFlags,
      device: deviceFlags,
      duplicate: duplicateFlags,
    };
  }, [attendanceRecords, currentUser.cityId]);

  const getFlagBadgeColor = (flag: string) => {
    switch (flag) {
      case "GPS_MISMATCH":
        return "bg-red-100 text-red-700";
      case "TIME_ANOMALY":
        return "bg-orange-100 text-orange-700";
      case "MULTI_DEVICE":
        return "bg-yellow-100 text-yellow-700";
      case "DUPLICATE":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getFlagIcon = (flag: string) => {
    switch (flag) {
      case "GPS_MISMATCH":
        return "📍";
      case "TIME_ANOMALY":
        return "⏰";
      case "MULTI_DEVICE":
        return "📱";
      case "DUPLICATE":
        return "🔄";
      default:
        return "⚠️";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Attendance Fraud Alerts</h1>
          <p className="text-sm text-gray-600">
            Review flagged attendance records for {currentUser.cityId}
          </p>

          {/* Statistics */}
          <div className="grid grid-cols-5 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs text-gray-600 mt-1">Total Flagged</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.gps}</div>
              <div className="text-xs text-red-600 mt-1">GPS Mismatch</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{stats.time}</div>
              <div className="text-xs text-orange-600 mt-1">Time Anomaly</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.device}</div>
              <div className="text-xs text-yellow-600 mt-1">Multi-Device</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{stats.duplicate}</div>
              <div className="text-xs text-purple-600 mt-1">Duplicate</div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Flag Type</label>
              <select
                value={filterFlag}
                onChange={(e) => setFilterFlag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ALL">All Flags</option>
                <option value="GPS_MISMATCH">GPS Mismatch</option>
                <option value="TIME_ANOMALY">Time Anomaly</option>
                <option value="MULTI_DEVICE">Multi-Device</option>
                <option value="DUPLICATE">Duplicate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
              <select
                value={filterEmployee}
                onChange={(e) => setFilterEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="ALL">All Employees</option>
                {employeesWithFlags.map((emp) => (
                  <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.personalInfo.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Flagged Records List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Flagged Records ({flaggedRecords.length})
          </h2>

          {flaggedRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No flagged records found for the selected filters.
            </div>
          ) : (
            <div className="space-y-3">
              {flaggedRecords.map((record) => {
                const employee = getEmployeeById(record.employeeId);

                return (
                  <div
                    key={record.attendanceId}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xl">{getFlagIcon(record.flag!)}</span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${getFlagBadgeColor(record.flag!)}`}
                          >
                            {record.flag}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {employee?.personalInfo.fullName || record.employeeId}
                          </span>
                          <span className="text-sm text-gray-500">{record.date}</span>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">{record.flagReason}</p>

                        <div className="grid grid-cols-4 gap-4 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">Check-in:</span> {record.checkInTime || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium">Check-out:</span> {record.checkOutTime || "N/A"}
                          </div>
                          {record.gpsLat && record.gpsLng && (
                            <div>
                              <span className="font-medium">GPS:</span> {(record?.gpsLat ?? 0).toFixed(4)}, {(record?.gpsLng ?? 0).toFixed(4)}
                            </div>
                          )}
                          {record.deviceId && (
                            <div>
                              <span className="font-medium">Device:</span> {record.deviceId.slice(0, 12)}...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                          Approve
                        </button>
                        <button className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
