import { useState, useMemo } from "react";
import { Activity, Download, AlertTriangle, TrendingUp } from "lucide-react";
import { showExportMenu } from "../../utils/gstExportUtils";
import { gstComplianceService, type GSTTransaction, COMPANY_GST_CONFIG } from "../../services/gstComplianceService";
import { getGSTTransactionsFromEntries } from "../../services/accountingEntryService";

interface GSTINData {
  gstin: string;
  city: string;
  transactions: number;
  outputTax: number;
  itc: number;
  netPayable: number;
  riskScore: number;
  filingStatus: "Filed" | "Pending" | "Delayed";
  anomaliesCount: number;
}

interface Alert {
  id: string;
  type: "vendor-cross-city" | "duplicate-invoice" | "high-risk-vendor";
  severity: "Critical" | "High" | "Medium";
  description: string;
  gstins: string[];
  date: string;
}

const MONITORED_CITIES = ["CITY-SURAT", "CITY-MUMBAI", "CITY-AHMEDABAD"];

export function GSTMonitoringModule() {
  // Real fix: was a "Month Year" string compared via a fragile regex
  // rewrite that could never match, then unconditionally OR'd with `true`
  // — so this filter had zero effect on anything. Matches the numeric
  // month + separate year convention used across the rest of the GST cluster.
  const [selectedMonth, setSelectedMonth] = useState(4);
  const [selectedYear, setSelectedYear] = useState(2026);

  // Real fix: gstComplianceService.getTransactions() only ever reads
  // whichever ONE city is currently active app-wide — it structurally
  // cannot see another city's data no matter what's requested here. This
  // reads each monitored city's real storage directly so all three
  // genuinely contribute to the comparison below.
  // Real fix (CA observation — "Output Tax Liability is 0"): merges in
  // real GST from actual Sales revenue (posted via recordRevenue) for
  // each monitored city, same as GSTR1Module/GSTR3BModule/GSTFilingModule
  // already do — this screen previously only ever saw manually-entered
  // transactions.
  const allTransactions = useMemo(
    () => MONITORED_CITIES.flatMap(cityId => [
      ...getGSTTransactionsFromEntries(cityId),
      ...gstComplianceService.getTransactionsForCity(cityId),
    ]),
    []
  );

  const gstinData: GSTINData[] = useMemo(() => {
    return MONITORED_CITIES.map(cityId => {
      const cityTxns = allTransactions.filter(t => t.cityId === cityId);
      const monthTxns = cityTxns.filter(t => t.month === selectedMonth && t.year === selectedYear);
      const outputTax   = monthTxns.filter(t => t.transactionType === "Sale")
        .reduce((s,t) => s + t.totalTax, 0);
      const itc = monthTxns.filter(t => t.itcEligible)
        .reduce((s,t) => s + t.itcAmount, 0);
      const riskScore = monthTxns.length > 0
        ? Math.round(monthTxns.reduce((s,t) => s + t.riskScore, 0) / monthTxns.length)
        : 0;
      const hasUnfiled = monthTxns.some(t => t.status !== "Filed");
      const gstinMap: Record<string, string> = {
        "CITY-SURAT": COMPANY_GST_CONFIG.gstin,
        "CITY-MUMBAI": "27GAOPS5676E1Z5",
        "CITY-AHMEDABAD": "24GAOPS5676E2Z1",
      };
      const cityNameMap: Record<string, string> = {
        "CITY-SURAT": "Surat",
        "CITY-MUMBAI": "Mumbai",
        "CITY-AHMEDABAD": "Ahmedabad",
      };
      return {
        gstin:          gstinMap[cityId] || COMPANY_GST_CONFIG.gstin,
        city:           cityNameMap[cityId] || "Surat",
        transactions:   monthTxns.length,
        outputTax,
        itc,
        netPayable:     Math.max(0, outputTax - itc),
        riskScore,
        filingStatus:   monthTxns.length > 0 ? (hasUnfiled ? "Pending" as const : "Filed" as const) : "Pending" as const,
        anomaliesCount: monthTxns.filter(t => t.riskLevel === "Critical" || t.riskLevel === "High").length,
      };
    });
  }, [allTransactions, selectedMonth, selectedYear]);

  const alerts: Alert[] = useMemo(() => {
    const result: Alert[] = [];

    // Detect duplicate invoice numbers across cities
    const invoiceMap = new Map<string, GSTTransaction[]>();
    allTransactions.forEach(t => {
      const key = t.invoiceNumber?.trim().toLowerCase();
      if (!key) return;
      const existing = invoiceMap.get(key) || [];
      invoiceMap.set(key, [...existing, t]);
    });
    invoiceMap.forEach((txns, invNo) => {
      const cities = [...new Set(txns.map(t => t.cityId))];
      if (cities.length > 1) {
        result.push({
          id: `dup-${invNo}`,
          type: "duplicate-invoice",
          severity: "Critical",
          description: `Invoice ${invNo} found in multiple cities: ${txns.map(t => t.city).join(", ")}`,
          gstins: cities,
          date: new Date().toISOString().split("T")[0],
        });
      }
    });

    // Detect high-risk vendors transacting across cities
    const vendorCityMap = new Map<string, Set<string>>();
    allTransactions.forEach(t => {
      if (!t.partyGstin) return;
      const existing = vendorCityMap.get(t.partyGstin) || new Set();
      existing.add(t.cityId);
      vendorCityMap.set(t.partyGstin, existing);
    });
    vendorCityMap.forEach((cities, gstin) => {
      if (cities.size > 1) {
        const vendor = gstComplianceService.getVendors().find(v => v.gstin === gstin);
        if (vendor && (vendor.riskLevel === "High" || vendor.riskLevel === "Critical")) {
          result.push({
            id: `cross-${gstin}`,
            type: "vendor-cross-city",
            severity: "High",
            description: `High-risk vendor ${vendor.name} (${gstin}) is transacting across multiple cities`,
            gstins: [...cities],
            date: new Date().toISOString().split("T")[0],
          });
        }
      }
    });

    return result;
  }, [allTransactions]);

  // Real fix: this was a fully hardcoded fake 4-row array with invented
  // risk scores, presented as if it were genuine history. Now computed
  // from real transactions for the 4 real months ending at the selected
  // period — a city/month with no real transactions honestly shows 0
  // rather than a fabricated number.
  const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthlyTrends = useMemo(() => {
    const periods: { month: number; year: number }[] = [];
    let m = selectedMonth, y = selectedYear;
    for (let i = 0; i < 4; i++) {
      periods.unshift({ month: m, year: y });
      m = m === 1 ? 12 : m - 1;
      if (m === 12) y -= 1;
    }
    return periods.map(({ month, year }) => {
      const avgRiskForCity = (cityId: string) => {
        const txns = allTransactions.filter(t => t.cityId === cityId && t.month === month && t.year === year);
        return txns.length > 0 ? Math.round(txns.reduce((s, t) => s + t.riskScore, 0) / txns.length) : 0;
      };
      return {
        month: `${MONTH_NAMES[month]} ${year}`,
        gstin1: avgRiskForCity("CITY-SURAT"),
        gstin2: avgRiskForCity("CITY-MUMBAI"),
        gstin3: avgRiskForCity("CITY-AHMEDABAD"),
      };
    });
  }, [allTransactions, selectedMonth, selectedYear]);

  const kpis = useMemo(() => {
    const totalGSTINs = gstinData.length;
    const avgCompliance = Math.round(gstinData.reduce((s, g) => s + (100 - g.riskScore), 0) / totalGSTINs);
    const criticalRisk = gstinData.filter(g => g.riskScore > 60).length;
    const alertsThisMonth = alerts.length;

    return { totalGSTINs, avgCompliance, criticalRisk, alertsThisMonth };
  }, [gstinData, alerts]);

  const handleExportCityComparison = (e: React.MouseEvent) => {
    const data = gstinData.map(g => ({
      GSTIN: g.gstin,
      City: g.city,
      Transactions: g.transactions,
      "Output Tax": g.outputTax,
      ITC: g.itc,
      "Net Payable": g.netPayable,
      "Risk Score": g.riskScore,
      "Filing Status": g.filingStatus,
      "Anomalies": g.anomaliesCount
    }));
    showExportMenu(data, "gst-city-comparison", e.currentTarget as HTMLElement);
  };

  const handleExportAlerts = (e: React.MouseEvent) => {
    const data = alerts.map(a => ({
      Type: a.type,
      Severity: a.severity,
      Description: a.description,
      "Affected GSTINs": a.gstins.join(", "),
      Date: a.date
    }));
    showExportMenu(data, "gst-alerts", e.currentTarget as HTMLElement);
  };

  const handleExportTrends = (e: React.MouseEvent) => {
    const data = monthlyTrends.map(t => ({
      Month: t.month,
      "Surat (24...)": t.gstin1,
      "Mumbai (27...)": t.gstin2,
      "Ahmedabad (24...)": t.gstin3,
    }));
    showExportMenu(data, "gst-monthly-trends", e.currentTarget as HTMLElement);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical": return "text-red-700 bg-red-100 border-red-200";
      case "High": return "text-orange-700 bg-orange-100 border-orange-200";
      case "Medium": return "text-amber-700 bg-amber-100 border-amber-200";
      default: return "text-gray-700 bg-gray-100 border-gray-200";
    }
  };

  const getFilingStatusColor = (status: string) => {
    switch (status) {
      case "Filed": return "text-green-700 bg-green-100";
      case "Pending": return "text-blue-700 bg-blue-100";
      case "Delayed": return "text-red-700 bg-red-100";
      default: return "text-gray-700 bg-gray-100";
    }
  };

  const getRiskColor = (score: number) => {
    if (score < 30) return "text-green-700";
    if (score < 60) return "text-amber-700";
    if (score < 80) return "text-orange-700";
    return "text-red-700";
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Cross-GSTIN Intelligence</h1>
            <p className="text-sm text-gray-600">Monitor compliance and anomalies across multiple GSTINs</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={4}>April</option>
            <option value={3}>March</option>
            <option value={2}>February</option>
          </select>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={2026}>2026</option>
            <option value={2025}>2025</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Total GSTINs Monitored</div>
          <div className="text-2xl font-semibold text-gray-900">{kpis.totalGSTINs}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Avg Compliance Score</div>
          <div className="text-2xl font-semibold text-green-600">{kpis.avgCompliance}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">GSTINs with Critical Risk</div>
          <div className="text-2xl font-semibold text-red-600">{kpis.criticalRisk}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">Alerts This Month</div>
          <div className="text-2xl font-semibold text-orange-600">{kpis.alertsThisMonth}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">City/GSTIN Comparison</h3>
          <button
            onClick={handleExportCityComparison}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">GSTIN</th>
                <th className="pb-3 font-medium">City</th>
                <th className="pb-3 font-medium">Transactions</th>
                <th className="pb-3 font-medium">Output Tax</th>
                <th className="pb-3 font-medium">ITC</th>
                <th className="pb-3 font-medium">Net Payable</th>
                <th className="pb-3 font-medium">Risk Score</th>
                <th className="pb-3 font-medium">Filing Status</th>
                <th className="pb-3 font-medium">Anomalies</th>
              </tr>
            </thead>
            <tbody>
              {gstinData.map(g => (
                <tr key={g.gstin} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-mono text-xs">{g.gstin}</td>
                  <td className="py-3 font-medium text-gray-900">{g.city}</td>
                  <td className="py-3 text-gray-700">{g.transactions}</td>
                  <td className="py-3 text-gray-900">₹{(g?.outputTax ?? 0).toLocaleString()}</td>
                  <td className="py-3 text-green-600">₹{(g?.itc ?? 0).toLocaleString()}</td>
                  <td className="py-3 text-gray-900">₹{(g?.netPayable ?? 0).toLocaleString()}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(g.riskScore)}`}>
                      {g.riskScore}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getFilingStatusColor(g.filingStatus)}`}>
                      {g.filingStatus}
                    </span>
                  </td>
                  <td className="py-3">
                    {g.anomaliesCount > 0 ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                        {g.anomaliesCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Pattern Anomaly Alerts</h3>
          </div>
          <button
            onClick={handleExportAlerts}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="space-y-3">
          {alerts.map(alert => (
            <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                    <span className="text-xs text-gray-600">{alert.date}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-2">{alert.description}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Affected GSTINs:</span>
                    {alert.gstins.map(gstin => (
                      <span key={gstin} className="px-2 py-0.5 bg-white border border-gray-300 rounded font-mono">
                        {gstin}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Monthly Risk Score Trends by GSTIN</h3>
          </div>
          <button
            onClick={handleExportTrends}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                <th className="pb-3 font-medium">Month</th>
                <th className="pb-3 font-medium">Surat (24...)</th>
                <th className="pb-3 font-medium">Mumbai (27...)</th>
                <th className="pb-3 font-medium">Ahmedabad (24...)</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrends.map(trend => (
                <tr key={trend.month} className="border-b border-gray-100 text-sm">
                  <td className="py-3 font-medium text-gray-900">{trend.month}</td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin1)}`}>
                      {trend.gstin1}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin2)}`}>
                      {trend.gstin2}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`font-semibold ${getRiskColor(trend.gstin3)}`}>
                      {trend.gstin3}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This dashboard is read-only and provides cross-GSTIN intelligence for monitoring purposes.
          All alerts are generated automatically based on pattern analysis across cities and vendors.
        </p>
      </div>
    </div>
  );
}

export default GSTMonitoringModule;
