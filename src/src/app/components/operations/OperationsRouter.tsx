/**
 * OPERATIONS ROUTER
 * Role-aware routing for Operations module
 *
 * Routes users to appropriate operations view based on their role:
 * - City Manager → City Command Center (cluster oversight)
 * - Cluster Manager → Cluster Control Tower (OM oversight)
 * - Operations Manager → Team Operations (team execution)
 * - Sr Operations Manager → Team Operations
 */

import { useRole } from "../../contexts/RoleContext";
import { CityManagerApp } from "../city/CityManagerApp";
import { ClusterManagerApp } from "../cm/ClusterManagerApp";
import { OperationsManagerApp } from "../om/OperationsManagerApp";
import { Navigate } from "react-router-dom";
import { useJobs } from "../../contexts/JobContext";
import { useCity } from "../../contexts/CityContext";

export function OperationsRouter() {
  const { currentRole } = useRole();

  // Route based on role
  switch (currentRole) {
    case "City Manager":
      return <CityManagerApp />;

    case "Cluster Manager":
      return <ClusterManagerApp />;

    case "Operations Manager":
    case "Sr Operations Manager":
      return <OperationsManagerApp />;

    case "Supervisor":
      // Supervisors have their own dedicated app
      return <Navigate to="/supervisor-app" replace />;

    case "Super Admin":
    case "Admin":
      return <MultiCityOperationsView />;

    default:
      // Other roles shouldn't have access to operations
      return <Navigate to="/" replace />;
  }
}

function MultiCityOperationsView() {
  const { allJobs } = useJobs();
  const { availableCities } = useCity();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Operations — All Cities</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableCities.map(city => {
          const cityJobs  = allJobs.filter(j => j.cityId === city.id);
          const unassigned = cityJobs.filter(j => j.status === "Unassigned").length;
          const inProgress = cityJobs.filter(j => j.status === "In Progress").length;
          const completed  = cityJobs.filter(j => j.status === "Completed" || j.status === "Verified").length;
          return (
            <div key={city.id} className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">{city.displayName}</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-700">{unassigned}</div>
                  <div className="text-xs text-amber-600">Unassigned</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-blue-700">{inProgress}</div>
                  <div className="text-xs text-blue-600">In Progress</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-700">{completed}</div>
                  <div className="text-xs text-green-600">Completed</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
