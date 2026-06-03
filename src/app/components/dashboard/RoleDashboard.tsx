// Dynamic dashboard component that renders based on role
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { ExecutiveDashboard } from "./ExecutiveDashboard";
import { WasherDashboard } from "./WasherDashboard";
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

  // Safety check for roleConfig
  if (!roleConfig || !roleConfig.dashboardType) {
    return <ExecutiveDashboard key={`exec__${currentRole}__${city}`} />;
  }

  // key prop forces full remount when role or city changes
  // Without this, switching from "executive" to "hr" keeps the old
  // ExecutiveDashboard DOM alive and only swaps the content inside
  const dashKey = `${roleConfig.dashboardType}__${currentRole}__${city}`;

  switch (roleConfig.dashboardType) {
    case "executive":
      return <ExecutiveDashboard key={dashKey} />;
    case "washer":
      return <WasherDashboard key={dashKey} />;
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
    default:
      return <ExecutiveDashboard key={dashKey} />;
  }
}