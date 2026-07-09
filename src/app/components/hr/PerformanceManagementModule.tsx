import { useState } from "react";
import { useRole } from "../../contexts/RoleContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { PerformanceCycleSetup } from "./PerformanceCycleSetup";
import { CalibrationView } from "./CalibrationView";
import { GoalsAndSelfAppraisalView } from "./GoalsAndSelfAppraisalView";
import { ManagerReviewView } from "./ManagerReviewView";
import { Settings, BarChart3, Target, Users } from "lucide-react";

const MANAGER_ROLES = [
  "Operations Manager", "Sr Operations Manager", "Cluster Manager",
  "Supervisor", "TSM", "TSE", "Store Manager", "City Manager",
];

export default function PerformanceManagementModule() {
  const { currentRole } = useRole();
  const isHR = currentRole === "HR" || currentRole === "Super Admin" || currentRole === "Admin";
  const isManager = MANAGER_ROLES.includes(currentRole);

  const [tab, setTab] = useState(isHR ? "setup" : isManager ? "team" : "goals");

  if (isHR) {
    return (
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="setup"><Settings className="w-4 h-4 mr-1" /> Cycle Setup</TabsTrigger>
          <TabsTrigger value="calibration"><BarChart3 className="w-4 h-4 mr-1" /> Calibration</TabsTrigger>
        </TabsList>
        <TabsContent value="setup"><PerformanceCycleSetup /></TabsContent>
        <TabsContent value="calibration"><CalibrationView /></TabsContent>
      </Tabs>
    );
  }

  if (isManager) {
    return (
      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="team"><Users className="w-4 h-4 mr-1" /> Team Reviews</TabsTrigger>
          <TabsTrigger value="goals"><Target className="w-4 h-4 mr-1" /> My Goals</TabsTrigger>
        </TabsList>
        <TabsContent value="team"><ManagerReviewView /></TabsContent>
        <TabsContent value="goals"><GoalsAndSelfAppraisalView /></TabsContent>
      </Tabs>
    );
  }

  return <GoalsAndSelfAppraisalView />;
}
