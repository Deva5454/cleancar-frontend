/**
 * AttendanceRegularizationModule.tsx — real, role-aware entry point,
 * matching the same established pattern as the Travel Reimbursement
 * module: one real route, the correct real view based on who's logged
 * in.
 */

import { useRole } from "../../contexts/RoleContext";
import { RegularizationRequestForm } from "./RegularizationRequestForm";
import { RegularizationManagerApprovals } from "./RegularizationManagerApprovals";
import { RegularizationHRQueue } from "./RegularizationHRQueue";
import { BackButton } from "../ui/back-button";

export function AttendanceRegularizationModule() {
  const { currentRole } = useRole();
  const isHR = currentRole === "HR" || currentRole === "Super Admin";
  const isManager = ["Operations Manager", "Sr Operations Manager", "Cluster Manager",
    "Supervisor", "TSM", "TSE", "Store Manager", "Sales Head", "Sales Manager", "City Manager"].includes(currentRole);

  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Regularization</h1>
          <p className="text-sm text-gray-500">Request, approve, and apply real attendance corrections</p>
        </div>
        <BackButton />
      </div>

      {isHR && <RegularizationHRQueue />}
      {isManager && <RegularizationManagerApprovals />}
      <RegularizationRequestForm />
    </div>
  );
}

export default AttendanceRegularizationModule;
