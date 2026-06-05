/**
 * TSEIncentiveTracker.tsx
 * Fixed: seeds demo records on first load so UI never shows all zeros
 * Fixed: reads logged-in employee ID from cc360_session
 */

import { useState, useEffect } from "react";
import { IncentivePayoutLedger } from "../incentives/IncentivePayoutLedger";
import { SubscriptionIncentiveTracker } from "../incentives/SubscriptionIncentiveTracker";
import { incentiveV6 } from "../../services/incentiveStructureV6";
import type { IncentiveTerm, IncentiveSource } from "../../services/incentiveStructureV6";

// ── Read session ──────────────────────────────────────────────────────────────
function getSession() {
  try { return JSON.parse(localStorage.getItem("cc360_session") || "{}"); } catch { return {}; }
}

// ── Seed demo records if localStorage is empty ────────────────────────────────
// Runs on every mount but only seeds if no VALID records with tranches exist.
// Guard key is cleared if existing records have no tranches (broken seed).
function seedDemoRecordsIfEmpty(employeeId: string, employeeName: string) {
  const SEED_KEY = "cc360_incentive_v6_seeded_" + employeeId;

  // Check if real/valid records already exist for this employee
  const existing = incentiveV6.getAll();
  const myRecords = existing.filter(r => r.tseId === employeeId);
  const hasValidRecords = myRecords.length > 0 &&
    myRecords.some(r => r.tranches && r.tranches.length > 0 && r.poolTotal > 0);

  // If valid records exist, nothing to do
  if (hasValidRecords) return;

  // If guard is set but records are invalid/empty, clear the guard and re-seed
  if (localStorage.getItem(SEED_KEY) && !hasValidRecords) {
    localStorage.removeItem(SEED_KEY);
    // Also clear any broken records for this employee
    const others = existing.filter(r => r.tseId !== employeeId);
    try {
      localStorage.setItem("cleancar_incentive_v6_records", JSON.stringify(others));
    } catch {}
  }

  if (localStorage.getItem(SEED_KEY)) return; // already seeded with valid data

  const today = new Date();
  const ago = (months: number) => {
    const d = new Date(today);
    d.setMonth(d.getMonth() - months);
    return d.toISOString().split("T")[0];
  };

  // Seed 5 demo subscriptions across different terms
  const demos: Array<{
    subscriptionId: string; customerId: string; customerName: string;
    planType: string; vehicleCategory: string; monthlyAmount: number;
    term: IncentiveTerm; source: IncentiveSource; activationDate: string;
    cityId: string; tseId: string; tseName: string;
  }> = [
    {
      subscriptionId: `DEMO-${employeeId}-001`, customerId: "CUST-001",
      customerName: "Ramesh Patel", planType: "SMART_WASH",
      vehicleCategory: "Hatchback / Compact Sedan", monthlyAmount: 1599,
      term: 3, source: "DIGITAL", activationDate: ago(2),
      cityId: "CITY-SURAT", tseId: employeeId, tseName: employeeName,
    },
    {
      subscriptionId: `DEMO-${employeeId}-002`, customerId: "CUST-002",
      customerName: "Sunil Shah", planType: "ELITE_WASH",
      vehicleCategory: "SUV / MUV / Sedan", monthlyAmount: 2499,
      term: 6, source: "BTL", activationDate: ago(1),
      cityId: "CITY-SURAT", tseId: employeeId, tseName: employeeName,
    },
    {
      subscriptionId: `DEMO-${employeeId}-003`, customerId: "CUST-003",
      customerName: "Priya Mehta", planType: "SMART_WASH",
      vehicleCategory: "Hatchback / Compact Sedan", monthlyAmount: 1599,
      term: 1, source: "DIGITAL", activationDate: ago(0),
      cityId: "CITY-SURAT", tseId: employeeId, tseName: employeeName,
    },
    {
      subscriptionId: `DEMO-${employeeId}-004`, customerId: "CUST-004",
      customerName: "Amit Desai", planType: "EXPRESS_WASH",
      vehicleCategory: "SUV / MUV / Sedan", monthlyAmount: 1499,
      term: 3, source: "DIGITAL", activationDate: ago(3),
      cityId: "CITY-SURAT", tseId: employeeId, tseName: employeeName,
    },
    {
      subscriptionId: `DEMO-${employeeId}-005`, customerId: "CUST-005",
      customerName: "Kavita Joshi", planType: "ELITE_WASH",
      vehicleCategory: "Luxury / Large SUV", monthlyAmount: 3499,
      term: 12, source: "BTL", activationDate: ago(1),
      cityId: "CITY-SURAT", tseId: employeeId, tseName: employeeName,
    },
  ];

  demos.forEach(d => {
    try { incentiveV6.createSubscriptionRecord(d); } catch {}
  });

  localStorage.setItem(SEED_KEY, "1");
}

interface TSEIncentiveTrackerProps {
  tseId?: string;
  name?: string;
}

export function TSEIncentiveTracker({ tseId, name }: TSEIncentiveTrackerProps) {
  const session = getSession();
  const id       = session.employeeId || tseId || "EDB-TSE-SUR1";
  const empName  = session.employeeName || name || "TSE";
  const role     = session.role || "TSE";

  const [tab, setTab] = useState<"overview" | "ledger">("overview");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Seed demo data if empty, then mark ready
    seedDemoRecordsIfEmpty(id, empName);
    // Process any overdue tranches
    incentiveV6.autoProcessDueTranches(new Date().toISOString().split("T")[0]);
    setReady(true);
  }, [id, empName]);

  if (!ready) return (
    <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
      Loading incentive data…
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        {(["overview", "ledger"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "overview" ? "Overview" : "📊 Payout Ledger"}
          </button>
        ))}
      </div>

      {tab === "ledger"
        ? <IncentivePayoutLedger employeeId={id} role="TSE" />
        : <SubscriptionIncentiveTracker employeeId={id} role="TSE" name={empName} />
      }
    </div>
  );
}
