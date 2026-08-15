/**
 * TSM Shift Roster — real weekly on-duty schedule for TSE/TSM.
 *
 * Previously there was no way to configure this at all: lead
 * auto-assignment ran 24/7 against a hardcoded fake TSE list with no
 * concept of shift or week-off (see organizationHierarchyService.ts /
 * telecallerShiftService.ts). This screen is where any real staffing
 * arrangement — a weekday evening-only slot, split Sunday shifts with
 * different weekly-offs, whatever the business actually runs — gets
 * entered as data against real employees, not hardcoded to any one
 * person's hours.
 */

import { useState } from "react";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import {
  telecallerShiftService,
  DEFAULT_WEEKLY_SHIFT,
  isShiftTrackedRole,
  type WeeklyShift,
  type DayShift,
} from "../../services/telecallerShiftService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Switch } from "../ui/switch";
import { CalendarClock, Save } from "lucide-react";
import { toast } from "sonner";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function cloneWeekly(weekly: WeeklyShift): WeeklyShift {
  return weekly.map(d => ({ ...d })) as WeeklyShift;
}

export function TSMShiftRoster() {
  const { employees } = useEmployee();
  const { city } = useCity();
  const { currentUser } = useRole();

  const telecallers = employees.filter((e: any) =>
    isShiftTrackedRole(e) &&
    (e.cityId === city || e.workLocation === city || e.city === city)
  );

  // Local editable draft per employeeId, seeded from real saved shift (or
  // the default fallback) the first time each row is touched.
  const [drafts, setDrafts] = useState<Record<string, WeeklyShift>>({});
  const [savedTick, setSavedTick] = useState(0); // bump to re-read hasCustomShift after a save

  const getDraft = (employeeId: string): WeeklyShift =>
    drafts[employeeId] || cloneWeekly(telecallerShiftService.getShift(employeeId));

  const updateDay = (employeeId: string, dayIdx: number, patch: Partial<DayShift>) => {
    const current = getDraft(employeeId);
    const next = cloneWeekly(current);
    next[dayIdx] = { ...next[dayIdx], ...patch };
    setDrafts(prev => ({ ...prev, [employeeId]: next }));
  };

  const saveDraft = (employeeId: string, name: string) => {
    const draft = drafts[employeeId];
    if (!draft) return;
    telecallerShiftService.setShift(employeeId, draft, currentUser?.name);
    toast.success(`Shift roster saved for ${name}`);
    setSavedTick(t => t + 1);
  };

  const resetToDefault = (employeeId: string) => {
    setDrafts(prev => ({ ...prev, [employeeId]: cloneWeekly(DEFAULT_WEEKLY_SHIFT) }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="w-5 h-5 text-blue-600" />
        <div>
          <h2 className="text-lg font-bold">Shift Roster</h2>
          <p className="text-sm text-gray-500">
            Real weekly on-duty hours per telecaller. Leads are only offered to whoever is genuinely on shift right now.
          </p>
        </div>
      </div>

      {telecallers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-gray-500">
            No TSE/TSM employees found for this city in Employee Database.
          </CardContent>
        </Card>
      ) : (
        telecallers.map((emp: any) => {
          const employeeId = emp.employeeId || emp.id;
          const name = emp.fullName || `${emp.firstName || ""} ${emp.lastName || ""}`.trim();
          const weekly = getDraft(employeeId);
          const isDirty = !!drafts[employeeId];
          const isCustom = telecallerShiftService.hasCustomShift(employeeId);

          return (
            <Card key={employeeId}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {name}
                    <Badge variant="outline" className="font-normal">{emp.role || emp.designation}</Badge>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {isCustom
                      ? <Badge className="bg-blue-100 text-blue-700">Custom roster</Badge>
                      : <Badge variant="outline">Using default hours (Mon–Sat 9–7)</Badge>}
                    <Button size="sm" variant="ghost" onClick={() => resetToDefault(employeeId)}>
                      Reset to default
                    </Button>
                    <Button size="sm" onClick={() => saveDraft(employeeId, name)} disabled={!isDirty}>
                      <Save className="w-3.5 h-3.5 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                  {DAY_LABELS.map((label, dayIdx) => {
                    const day = weekly[dayIdx];
                    return (
                      <div key={dayIdx} className="border rounded-lg p-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold">{label}</span>
                          <Switch
                            checked={!day.isWeekOff}
                            onCheckedChange={(checked) => updateDay(employeeId, dayIdx, { isWeekOff: !checked })}
                          />
                        </div>
                        {day.isWeekOff ? (
                          <p className="text-xs text-gray-400">Week off</p>
                        ) : (
                          <div className="space-y-1">
                            <Input
                              type="time"
                              value={day.startTime}
                              onChange={(e) => updateDay(employeeId, dayIdx, { startTime: e.target.value })}
                              className="h-7 text-xs px-1"
                            />
                            <Input
                              type="time"
                              value={day.endTime}
                              onChange={(e) => updateDay(employeeId, dayIdx, { endTime: e.target.value })}
                              className="h-7 text-xs px-1"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
