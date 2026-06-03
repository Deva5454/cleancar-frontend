import { IncentivePayoutLedger } from "../incentives/IncentivePayoutLedger";
import { useState } from "react";
import { SubscriptionIncentiveTracker } from "../incentives/SubscriptionIncentiveTracker";

/**
 * TSEIncentiveTracker — tab wrapper: Overview | Payout Ledger
 */
export function TSEIncentiveTracker({ tseId, name }: { tseId?: string; name?: string }) {
  const id  = tseId || "EDB-TSE-SUR1";
  const [tab, setTab] = useState<"overview" | "ledger">("overview");

  return (
    <div className="space-y-4">
      <div className="flex gap-2 bg-gray-100 p-1 rounded-lg w-fit">
        {(["overview", "ledger"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "overview" ? "Overview" : "📊 Payout Ledger"}
          </button>
        ))}
      </div>
      {tab === "ledger" ? (
        <IncentivePayoutLedger employeeId={id} role="TSE" />
      ) : (
        <SubscriptionIncentiveTracker employeeId={id} role="TSE" name={name} />
      )}
    </div>
  );
}
