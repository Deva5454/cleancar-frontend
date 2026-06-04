import { useRole } from "../../contexts/RoleContext";
import { TravelEmployeeView }   from "./TravelEmployeeView";
import { TravelManagerView }    from "./TravelManagerView";
import { TravelHRView }         from "./TravelHRView";
import { TravelAdminSettings }  from "./TravelAdminSettings";
import { travelReimbursementService } from "../../services/travelReimbursementService";
import { isFieldTrackingRole } from "../../services/fieldTrackingService";

export default function TravelReimbursementModule() {
  const { currentRole, currentUser } = useRole();
  const isEnabled = travelReimbursementService.isEmployeeEnabled(currentUser?.employeeId || "");

  // Super Admin and City Manager see the full admin panel
  if (currentRole === "Super Admin" || currentRole === "Admin") {
    return <TravelAdminSettings />;
  }
  if (currentRole === "City Manager") {
    return <TravelAdminSettings cityManagerMode />;
  }
  if (currentRole === "HR") {
    return <TravelHRView />;
  }
  // Manager view includes their own trips + pending approvals tab
  if (["Operations Manager", "Sr Operations Manager", "Cluster Manager",
       "Supervisor", "TSM", "TSE", "Store Manager"].includes(currentRole)) {
    return <TravelManagerView />;
  }
  // Field-tracking roles (Sales Head, Sales Manager, Supervisor) — enabled by default.
  // All other roles — must be explicitly enabled by Admin / City Manager.
  // Rule: if travel is enabled → field tracking is active by default.
  const isFieldRole = isFieldTrackingRole(currentRole);
  const effectivelyEnabled = isFieldRole || isEnabled;

  if (!effectivelyEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">🚗</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Travel Reimbursement</h2>
        <p className="text-gray-500 text-center max-w-sm">
          This module has not been activated for your account yet.
          Please contact your City Manager or HR to enable it.
        </p>
        <p className="text-xs text-gray-400 mt-3 text-center max-w-xs">
          Note: Enabling travel reimbursement also activates GPS field tracking for your role.
        </p>
      </div>
    );
  }
  return <TravelEmployeeView />;
}
