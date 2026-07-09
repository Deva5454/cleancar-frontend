import { useRole } from "../../contexts/RoleContext";
import { ClaimEmployeeView } from "./ClaimEmployeeView";
import { ClaimManagerView } from "./ClaimManagerView";
import { ClaimHRView } from "./ClaimHRView";

const MANAGER_ROLES = [
  "Operations Manager", "Sr Operations Manager", "Cluster Manager",
  "Supervisor", "TSM", "TSE", "Store Manager", "City Manager",
];

export default function ExpenseClaimsModule() {
  const { currentRole } = useRole();

  if (currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Admin") {
    return <ClaimHRView />;
  }
  if (MANAGER_ROLES.includes(currentRole)) {
    // Managers both submit their own claims and approve their team's —
    // default them to their approval queue, same pattern as Travel.
    return <ClaimManagerView />;
  }
  return <ClaimEmployeeView />;
}
