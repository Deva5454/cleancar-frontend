/**
 * OMKraDashboard.tsx — real, previously-missing screen: Operations
 * Manager's real KRA scorecard. Revenue and Retention are genuinely
 * computed from real accounting and subscription data. Lead
 * Conversion, Operational Compliance, and Customer Experience are
 * honestly shown as not yet available, rather than a fabricated score
 * - confirmed directly that no real data source exists for any of the
 * three yet.
 */

import { useState, useEffect, useMemo } from "react";
import { useCustomerSubscriptions } from "../../contexts/CustomerSubscriptionContext";
import { useCustomers } from "../../contexts/CustomerContext";
import { useFinance } from "../../contexts/FinanceContext";
import { useRole } from "../../contexts/RoleContext";
import { seedOMKraTemplateIfMissing, computeOMKraScores } from "../../services/kraOMPilot";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { AlertCircle, TrendingUp } from "lucide-react";

const CITIES = ["CITY-SURAT", "CITY-VADODARA", "CITY-AHMEDABAD"];

export function OMKraDashboard() {
  const { subscriptions } = useCustomerSubscriptions();
  const { customers } = useCustomers();
  const { getRevenueByCity } = useFinance();
  const { currentUser } = useRole();

  const [cityId, setCityId] = useState(CITIES[0]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    seedOMKraTemplateIfMissing(currentUser?.name || "System");
  }, [currentUser?.name]);

  const entries = useMemo(() => getRevenueByCity(cityId), [getRevenueByCity, cityId]);

  const { results, totalScore, realWeightCovered } = useMemo(
    () => computeOMKraScores(cityId, month, entries as any, subscriptions as any, customers as any),
    [cityId, month, entries, subscriptions, customers]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" /> Operations Manager KRA Scorecard
          </CardTitle>
          <p className="text-xs text-gray-500">Revenue and Retention are real, computed from actual revenue and subscription records</p>
        </CardHeader>
        <CardContent className="flex gap-3">
          <select value={cityId} onChange={(e) => setCityId(e.target.value)} className="border rounded px-3 py-2 text-sm">
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-2 text-sm" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {totalScore !== null ? `Partial Score: ${totalScore}%` : "No real data available yet"}
          </CardTitle>
          <p className="text-xs text-gray-500">
            {realWeightCovered < 100
              ? `Based on ${realWeightCovered}% of the real KRA structure — the remaining ${100 - realWeightCovered}% has no real data source yet, and is honestly excluded rather than counted as zero.`
              : "Based on the complete real KRA structure."}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {results.map((kra) => (
            <div key={kra.kraCode} className="border rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-gray-900">{kra.kraName} <span className="text-xs text-gray-400">({kra.kraWeight}% weight)</span></p>
                {kra.kraScore !== null ? (
                  <p className="text-sm font-semibold text-blue-700">{kra.kraScore}%</p>
                ) : (
                  <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Not yet available
                  </p>
                )}
              </div>
              {kra.kraScore !== null ? (
                <Progress value={Math.min(100, kra.kraScore)} className="h-2 mb-2" />
              ) : (
                <div className="h-2 mb-2 bg-amber-100 rounded" />
              )}
              <div className="space-y-1">
                {kra.kpiResults.map((kpi) => (
                  <div key={kpi.kpiCode} className="flex justify-between text-xs text-gray-600">
                    <span>{kpi.kpiName}</span>
                    <span>{kpi.actual !== null ? `${kpi.actual.toLocaleString("en-IN")} / ${kpi.target.toLocaleString("en-IN")} target (${kpi.achievementPct}%)` : "No real data source yet"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default OMKraDashboard;
