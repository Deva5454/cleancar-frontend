/**
 * Quick Data Verification Component
 *
 * Inline component to show data is loading from the new service
 */

import { useEffect, useState } from "react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import { Card } from "../ui/card";
import { logger } from "../../services/logger";

export function QuickDataVerification() {
  const [data, setData] = useState({
    categories: [] as any[],
    tiers: [] as any[],
    addons: [] as any[],
    combos: [] as any[],
  });

  useEffect(() => {
    const categories = subscriptionPlansService.getVehicleCategories();
    const tiers = subscriptionPlansService.getAllPlanTiers();
    const addons = subscriptionPlansService.getAddons(true);
    const combos = subscriptionPlansService.getComboOffers();

    setData({ categories, tiers, addons, combos });

    logger.log("🔍 VERIFICATION - Categories:", categories);
    logger.log("🔍 VERIFICATION - Tiers:", tiers);
    logger.log("🔍 VERIFICATION - Addons:", addons);
    logger.log("🔍 VERIFICATION - Combos:", combos);
  }, []);

  return (
    <Card className="p-4 bg-green-50 border-2 border-green-300 mb-6">
      <div className="text-sm">
        <div className="font-bold text-green-900 mb-2">
          ✅ Data Loading from NEW Dynamic System
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-700">
              {data.categories.length}
            </div>
            <div className="text-xs text-green-600">Categories</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">
              {data.tiers.length}
            </div>
            <div className="text-xs text-blue-600">Plan Tiers</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-700">
              {data.addons.length}
            </div>
            <div className="text-xs text-purple-600">Add-ons</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-700">
              {data.combos.length}
            </div>
            <div className="text-xs text-orange-600">Combos</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
