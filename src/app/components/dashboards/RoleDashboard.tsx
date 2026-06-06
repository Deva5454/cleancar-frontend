// Dynamic dashboard component that renders based on role
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { SupervisorDashboard } from "./SupervisorDashboard";
import { SalesDashboard } from "./SalesDashboard";
import { CustomerCareDashboard } from "./CustomerCareDashboard";
import { FinanceDashboard } from "./FinanceDashboard";
import { InventoryDashboard } from "./InventoryDashboard";
import { HRDashboard } from "./HRDashboard";
import { OperationsDashboard } from "./OperationsDashboard";
import { CityDashboard } from "./CityDashboard";
import { ProcurementDashboard } from "./ProcurementDashboard";

export function RoleDashboard() {
  const { roleConfig, currentRole } = useRole();
  const { city } = useCity();
  const navigate = useNavigate();

  // Car Washer always goes straight to the mobile shell
  useEffect(() => {
    if (roleConfig?.dashboardType === "washer") {
      navigate("/washer-core-screens", { replace: true });
    }
  }, [roleConfig?.dashboardType, navigate]);

  // Safety check for roleConfig
  if (!roleConfig || !roleConfig.dashboardType) {
    return <ExecutiveDashboard key={`exec__${currentRole}__${city}`} />;
  }

  // Car Washer is handled by the useEffect redirect above
  if (roleConfig.dashboardType === "washer") return null;

  const dashKey = `${roleConfig.dashboardType}__${currentRole}__${city}`;

  switch (roleConfig.dashboardType) {
    case "executive":
      return <ExecutiveDashboard key={dashKey} />;
    case "supervisor":
      return <SupervisorDashboard key={dashKey} />;
    case "sales":
      return <SalesDashboard key={dashKey} />;
    case "customer-care":
      return <CustomerCareDashboard key={dashKey} />;
    case "finance":
      return <FinanceDashboard key={dashKey} />;
    case "inventory":
      return <InventoryDashboard key={dashKey} />;
    case "hr":
      return <HRDashboard key={dashKey} />;
    case "operations":
      return <OperationsDashboard key={dashKey} />;
    case "city":
      return <CityDashboard key={dashKey} />;
    case "procurement":
      return <ProcurementDashboard key={dashKey} />;
    case "city-manager":
      return <CityDashboard key={dashKey} />;
    case "accounts":
      return <FinanceDashboard key={dashKey} />;
    case "admin":
    case "super-admin":
      return <ExecutiveDashboard key={dashKey} />;
    case "operational":
      return <OperationsDashboard key={dashKey} />;
    case "marketing":
      return <SalesDashboard key={dashKey} />;
    default:
      return <ExecutiveDashboard key={dashKey} />;
  }
}
