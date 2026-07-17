/**
 * PartyLedgerLink — a small, reusable "click to see the real detail" link.
 *
 * Renders a number or name as a real hyperlink that opens Party Ledger,
 * in a new tab, pre-selected to the right party — instead of a static
 * figure with no way to see what actually makes it up.
 *
 * Used by CreditorsReport, DebtorsReport, TrialBalance, and anywhere
 * else a vendor/customer balance is shown as a summary figure.
 */
import { ExternalLink } from "lucide-react";

export function PartyLedgerLink({
  partyId,
  partyType,
  children,
  className = "",
}: {
  partyId: string;
  partyType: "customers" | "vendors" | "employees";
  children: React.ReactNode;
  className?: string;
}) {
  const href = `/accounts/party-ledger?tab=${partyType}&party=${encodeURIComponent(partyId)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 hover:underline hover:text-purple-700 ${className}`}
      title="Open real detail in a new tab"
    >
      {children}
      <ExternalLink className="w-3 h-3 opacity-50" />
    </a>
  );
}

export default PartyLedgerLink;
