import { useRole } from "../../contexts/RoleContext";
import { InvestmentDeclarationView } from "./InvestmentDeclarationView";
import { InvestmentDeclarationVerification } from "./InvestmentDeclarationVerification";

export default function InvestmentDeclarationModule() {
  const { currentRole } = useRole();

  if (currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Admin") {
    return <InvestmentDeclarationVerification />;
  }
  return <InvestmentDeclarationView />;
}
