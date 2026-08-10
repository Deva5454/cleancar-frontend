/**
 * SuperAdminBTLActivity.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Super Admin screen: complete, real, company-wide BTL activity visibility.
 * Reuses the same shared BTLActivityVisibilityPanel now also used by City
 * Manager - one real data source (salesManagerService), not a third copy.
 */

import { BTLActivityVisibilityPanel } from "../shared/BTLActivityVisibilityPanel";

function SuperAdminBTLActivity() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BTLActivityVisibilityPanel />
    </div>
  );
}

export default SuperAdminBTLActivity;
