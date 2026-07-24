import { MyStockContent } from "./MyStockContent";

/**
 * WasherMyStock — the mobile app's bottom-nav "Stock" tab
 * (WasherMobileShell.tsx), the screen a field washer actually opens.
 *
 * ✅ FIX (STK-DEF-01): this file previously held ~200 lines of entirely
 * hardcoded mock data (fixed balances, a frozen "6 hours remaining"
 * countdown, a fabricated "Collect from Supervisor Suresh Yadav"
 * approval message) with no import of InventoryContext at all, and its
 * Request Replenishment / Start Verification / View Stock History
 * buttons had no click handlers. It now renders the same real,
 * InventoryContext-driven MyStockContent used at the desktop route, so
 * a washer sees identical real data and real, working actions
 * regardless of which entry point they use (STK-DEF-06).
 *
 * showBackButton is false here — tab switching is already how you
 * leave this screen in the mobile shell, so a "Back" button (which
 * would navigate browser history, not switch tabs) doesn't apply.
 */
export function WasherMyStock() {
  return (
    <div className="p-4">
      <MyStockContent showBackButton={false} />
    </div>
  );
}

export default WasherMyStock;
