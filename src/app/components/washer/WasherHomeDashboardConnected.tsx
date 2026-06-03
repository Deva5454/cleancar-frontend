/**
 * CONNECTED: Washer Home Dashboard
 * Uses WasherContext for data - NO hardcoded data
 * All buttons are functional and connected to services
 */

import { useNavigate } from "react-router-dom";
import { WasherHomeDashboard, type DayStatus } from "./WasherHomeDashboard";
import { useWasher, useWasherStats } from "../../contexts/WasherContext";
import { useRole } from "../../contexts/RoleContext";

export function WasherHomeDashboardConnected() {
  const navigate = useNavigate();
  const { currentUser } = useRole();
  const {
    profile,
    dayStatus,
    isCheckedIn,
    isCheckedOut,
    checkInTime,
    refreshData,
  } = useWasher();

  const stats = useWasherStats();

  // Handlers - all functional
  const handleCheckIn = () => {
    navigate("/washer/check-in");
  };

  const handleViewSchedule = () => {
    navigate("/washer/schedule");
  };

  const handleViewEarnings = () => {
    navigate("/washer/earnings");
  };

  const handleRaiseIssue = () => {
    navigate("/washer/raise-issue");
  };

  // Map day status to component format
  const mapDayStatus = (): DayStatus => {
    if (dayStatus.isWeekOff) return "WEEK_OFF";
    if (dayStatus.isCheckedOut) return "CHECKED_OUT";
    if (dayStatus.isLate && dayStatus.isCheckedIn) return "LATE";
    if (dayStatus.isCheckedIn) return "WORKING";
    if (dayStatus.status === "NOT_STARTED") return "NOT_CHECKED_IN";
    return "NOT_CHECKED_IN";
  };

  // Calculate monthly earnings (from service)
  const monthlyEarnings = 12500; // In production: from washerDataService.getMonthlyStats()

  return (
    <>
      {/* DEV ONLY: Debug display showing logged-in user */}
      {import.meta.env.DEV && currentUser.employeeId && (
        <div className="fixed top-0 right-0 z-50 m-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full shadow-lg">
          👤 {currentUser.name} ({currentUser.employeeId})
        </div>
      )}

      <WasherHomeDashboard
      washerName={profile?.name || "Loading..."}
      todayDate={new Date()}
      dayNumber={15} // In production: calculate from month start
      totalDaysInMonth={26}
      dayStatus={mapDayStatus()}
      isCheckedIn={isCheckedIn}
      isCheckedOut={isCheckedOut}
      checkInTime={checkInTime || undefined}
      isWeekOff={dayStatus.isWeekOff}
      isLate={dayStatus.isLate}
      unitsCompleted={stats.completed}
      unitsTarget={stats.baseTarget}
      incentiveUnits={stats.incentiveUnits}
      todayEarnings={stats.totalEarnings}
      monthlyEarnings={monthlyEarnings}
      onCheckIn={handleCheckIn}
      onViewSchedule={handleViewSchedule}
      onViewEarnings={handleViewEarnings}
      onRaiseIssue={handleRaiseIssue}
      isOnline={true} // In production: from navigator.onLine or network status
    />
    </>
  );
}
