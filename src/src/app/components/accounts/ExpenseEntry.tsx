import { BackButton } from "../ui/back-button";
import { Navigate } from "react-router-dom";

export function ExpenseEntry() {
  // Legacy route — redirect to the unified AccountingEntry screen
  return <Navigate to="/accounts/accounting-entry" replace />;
}
