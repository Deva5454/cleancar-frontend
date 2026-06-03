/**
 * SIMPLIFIED Escalation Screen - DIAGNOSTIC VERSION
 * Minimal version to test rendering
 */

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { logger } from "../../services/logger";

export interface EscalationScreenSimpleProps {
  issues: any[];
  summary: any;
}

export function EscalationScreenSimple({ issues, summary }: EscalationScreenSimpleProps) {
  logger.log("🚨 EscalationScreenSimple RENDERED with", issues.length, "issues");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* MEGA VISIBLE DEBUG BANNER */}
      <div className="bg-red-400 border-4 border-black p-6 m-4">
        <h1 className="text-3xl font-black text-center text-white mb-2">
          ✅ ESCALATION SCREEN IS RENDERING!
        </h1>
        <div className="bg-white p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">Issues Count: {issues.length}</p>
          <p className="text-xl font-bold text-orange-600">Open Issues: {summary?.openCount || 0}</p>
        </div>
      </div>

      {/* HEADER */}
      <div className="bg-red-600 text-white p-4">
        <h1 className="text-xl font-bold">Escalation Control Panel</h1>
        <p className="text-sm">Simplified Version for Testing</p>
      </div>

      {/* ESCALATION MATRIX */}
      <div className="p-4 space-y-3">
        <Card className="border-2 border-indigo-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">📊 Escalation Matrix</CardTitle>
            <p className="text-sm text-gray-600">Who handles what</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-100">
                    <th className="text-left py-3 px-3 font-bold">Issue Type</th>
                    <th className="text-left py-3 px-3 font-bold">Handled By</th>
                    <th className="text-right py-3 px-3 font-bold">SLA</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-amber-100 text-amber-700">Attendance</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → Ops Manager</td>
                    <td className="py-3 px-3 text-right font-semibold">15m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-red-100 text-red-700">Quality</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → Ops Manager</td>
                    <td className="py-3 px-3 text-right font-semibold">10m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-red-100 text-red-700">Damage</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → Ops Mgr → City Mgr</td>
                    <td className="py-3 px-3 text-right font-semibold text-red-600">5m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-red-100 text-red-700">Safety</Badge>
                    </td>
                    <td className="py-3 px-3 font-bold">All Managers + SOS</td>
                    <td className="py-3 px-3 text-right font-bold text-red-600">2m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-blue-100 text-blue-700">Technical</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → Ops Manager</td>
                    <td className="py-3 px-3 text-right font-semibold">20m</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 px-3">
                      <Badge className="bg-purple-100 text-purple-700">Customer</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → CRM Team</td>
                    <td className="py-3 px-3 text-right font-semibold">30m</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3">
                      <Badge className="bg-indigo-100 text-indigo-700">Incentive</Badge>
                    </td>
                    <td className="py-3 px-3">Supervisor → Finance → Super Admin</td>
                    <td className="py-3 px-3 text-right font-semibold">48h</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Auto-escalation if not resolved within SLA
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 border border-green-300 rounded p-2">
                  <p className="text-xs font-bold text-green-700">✓ Within SLA</p>
                  <p className="text-xs text-green-600">No escalation</p>
                </div>
                <div className="bg-red-50 border border-red-300 rounded p-2">
                  <p className="text-xs font-bold text-red-700">⚠️ SLA Breach</p>
                  <p className="text-xs text-red-600">Auto-escalate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ISSUES SUMMARY */}
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Issue Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{summary?.openCount || 0}</p>
                <p className="text-xs text-gray-600">Open</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{summary?.inProgressCount || 0}</p>
                <p className="text-xs text-gray-600">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary?.resolvedCount || 0}</p>
                <p className="text-xs text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ISSUES LIST */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold">All Issues ({issues.length})</h2>
          {issues.length === 0 ? (
            <Card className="border-2 border-gray-300">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-bold text-gray-600">No active issues</p>
              </CardContent>
            </Card>
          ) : (
            issues.map((issue, index) => (
              <Card key={issue.id || index} className="border-2">
                <CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold">{issue.title}</p>
                      <p className="text-sm text-gray-600">{issue.description}</p>
                    </div>
                    <Badge>{issue.status}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Type: {issue.type}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
