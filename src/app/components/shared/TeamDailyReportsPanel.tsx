/**
 * TeamDailyReportsPanel.tsx
 *
 * Real, live view of daily reports submitted by a given team - shared
 * across Sales Head (viewing their Sales Managers) and City Manager
 * (viewing Sales Managers and Sales Heads), so both use one real
 * component reading from one real data source, not two separate copies.
 */
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle2, Circle, Star } from "lucide-react";
import { dailyReportService, type DailyReportSummary } from "../../services/dailyReportService";

export function TeamDailyReportsPanel({
  title,
  employees,
}: {
  title: string;
  employees: { employeeId: string; name: string }[];
}) {
  const [reports, setReports] = useState<Record<string, DailyReportSummary | null>>({});

  useEffect(() => {
    setReports(dailyReportService.getReportsForEmployees(employees.map(e => e.employeeId)));
  }, [employees.map(e => e.employeeId).join(",")]);

  const submittedCount = Object.values(reports).filter(r => r?.submitted).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span>{title}</span>
          <Badge variant="outline">{submittedCount} / {employees.length} submitted today</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {employees.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No team members to show.</p>
        )}
        {employees.map(({ employeeId, name }) => {
          const r = reports[employeeId];
          return (
            <div key={employeeId} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r?.submitted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-300" />
                  )}
                  <span className="font-medium text-gray-900 text-sm">{name}</span>
                </div>
                {r ? (
                  <Badge variant={r.submitted ? "default" : "outline"}>
                    {r.submitted ? "Submitted" : "In progress"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not submitted</Badge>
                )}
              </div>
              {r && (
                <div className="mt-2 pt-2 border-t grid grid-cols-2 md:grid-cols-4 gap-x-3 gap-y-1 text-xs text-gray-600">
                  <div><span className="text-gray-400">Leads:</span> {r.totalLeads}</div>
                  <div><span className="text-gray-400">Conversions:</span> {r.totalConversions}</div>
                  <div><span className="text-gray-400">KM:</span> {r.totalKm}</div>
                  {r.dayRating && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">Day:</span>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.dayRating! ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                  )}
                  {r.priorityForDay && (
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-400">Priority:</span> {r.priorityForDay}</div>
                  )}
                  {r.biggestWin && (
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-400">Win:</span> {r.biggestWin}</div>
                  )}
                  {r.biggestBlock && (
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-400">Blocker:</span> {r.biggestBlock}</div>
                  )}
                  {r.tomorrowTop3 && (
                    <div className="col-span-2 md:col-span-4"><span className="text-gray-400">Tomorrow:</span> {r.tomorrowTop3}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
