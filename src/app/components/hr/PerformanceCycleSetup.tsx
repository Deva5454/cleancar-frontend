import { useState, useMemo } from "react";
import { useRole } from "../../contexts/RoleContext";
import {
  performanceManagementService,
  type PerformanceCycle, type CyclePhase, type PhaseWindow,
} from "../../services/performanceManagementService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { ArrowRight, CalendarRange, PlayCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PHASES: CyclePhase[] = ["Goal Setting", "Self Appraisal", "Manager Review", "Calibration", "Finalized"];

const PHASE_COLOR: Record<CyclePhase, string> = {
  "Goal Setting": "bg-blue-100 text-blue-700",
  "Self Appraisal": "bg-amber-100 text-amber-700",
  "Manager Review": "bg-orange-100 text-orange-700",
  "Calibration": "bg-purple-100 text-purple-700",
  "Finalized": "bg-green-100 text-green-700",
};

function defaultWindows(startDate: string): Record<CyclePhase, PhaseWindow> {
  const start = new Date(startDate);
  const add = (days: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };
  return {
    "Goal Setting": { start: add(0), end: add(14) },
    "Self Appraisal": { start: add(15), end: add(29) },
    "Manager Review": { start: add(30), end: add(44) },
    "Calibration": { start: add(45), end: add(52) },
    "Finalized": { start: add(53), end: add(53) },
  };
}

export function PerformanceCycleSetup() {
  const { currentUser } = useRole();
  const [refresh, setRefresh] = useState(0);
  const [name, setName] = useState("");
  const [financialYear, setFinancialYear] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const cycles = useMemo(() => performanceManagementService.listCycles(), [refresh]);
  const activeCycle = useMemo(() => performanceManagementService.getActiveCycle(), [refresh]);

  const handleCreate = () => {
    if (!name.trim() || !financialYear.trim()) { toast.error("Enter a cycle name and financial year"); return; }
    if (activeCycle) { toast.error("An active cycle already exists — close it before starting a new one"); return; }

    performanceManagementService.createCycle({
      name, financialYear,
      phaseWindows: defaultWindows(startDate),
      createdBy: currentUser?.name || "HR",
    });
    toast.success("Performance cycle created — Goal Setting phase is now open");
    setName(""); setFinancialYear("");
    setRefresh((r) => r + 1);
  };

  const handleAdvance = (cycle: PerformanceCycle) => {
    performanceManagementService.advancePhase(cycle.id);
    toast.success(`Advanced to next phase`);
    setRefresh((r) => r + 1);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Start a New Performance Cycle</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Cycle Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="FY 2026-27 Annual Review" />
            </div>
            <div>
              <Label>Financial Year</Label>
              <Input value={financialYear} onChange={(e) => setFinancialYear(e.target.value)} placeholder="2026-27" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={!!activeCycle}>
            <PlayCircle className="w-4 h-4 mr-1" /> Start Cycle
          </Button>
          {activeCycle && (
            <p className="text-xs text-amber-600">
              An active cycle ("{activeCycle.name}") is already running — advance it to Finalized before starting another.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {cycles.length === 0 && <p className="text-sm text-gray-500 text-center py-8">No performance cycles yet.</p>}
        {cycles.map((cycle) => (
          <Card key={cycle.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{cycle.name}</p>
                  <p className="text-xs text-gray-400">FY {cycle.financialYear}</p>
                </div>
                <Badge className={cycle.status === "Closed" ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-700"}>
                  {cycle.status}
                </Badge>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                {PHASES.map((phase, idx) => (
                  <div key={phase} className="flex items-center gap-1">
                    <Badge className={phase === cycle.currentPhase ? PHASE_COLOR[phase] : "bg-gray-50 text-gray-400"}>
                      {phase}
                    </Badge>
                    {idx < PHASES.length - 1 && <ArrowRight className="w-3 h-3 text-gray-300" />}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <CalendarRange className="w-3 h-3" />
                {cycle.phaseWindows[cycle.currentPhase].start} → {cycle.phaseWindows[cycle.currentPhase].end}
              </div>

              {cycle.status === "Active" && (
                <Button size="sm" variant="outline" onClick={() => handleAdvance(cycle)}>
                  {cycle.currentPhase === "Calibration" ? (
                    <><CheckCircle2 className="w-4 h-4 mr-1" /> Finalize Cycle</>
                  ) : (
                    <>Advance to Next Phase <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PerformanceCycleSetup;
