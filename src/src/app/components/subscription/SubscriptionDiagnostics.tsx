/**
 * Subscription System Diagnostics
 *
 * Quick diagnostic page to verify all subscription data is loading correctly
 */

import { useEffect, useState } from "react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { logger } from "../../services/logger";

export function SubscriptionDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    categories: 0,
    tiers: 0,
    addons: 0,
    combos: 0,
    errors: [] as string[],
  });

  useEffect(() => {
    try {
      const categories = subscriptionPlansService.getVehicleCategories();
      const tiers = subscriptionPlansService.getAllPlanTiers();
      const addons = subscriptionPlansService.getAddons(true);
      const combos = subscriptionPlansService.getComboOffers();

      logger.log("Diagnostics - Categories:", categories);
      logger.log("Diagnostics - Tiers:", tiers);
      logger.log("Diagnostics - Addons:", addons);
      logger.log("Diagnostics - Combos:", combos);

      setDiagnostics({
        categories: categories.length,
        tiers: tiers.length,
        addons: addons.length,
        combos: combos.length,
        errors: [],
      });
    } catch (error) {
      console.error("Diagnostics Error:", error);
      setDiagnostics((prev) => ({
        ...prev,
        errors: [String(error)],
      }));
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Subscription System Diagnostics</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-purple-600">
              {diagnostics.categories}
            </div>
            <div className="text-sm text-gray-600 mt-2">Categories</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-blue-600">
              {diagnostics.tiers}
            </div>
            <div className="text-sm text-gray-600 mt-2">Plan Tiers</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-green-600">
              {diagnostics.addons}
            </div>
            <div className="text-sm text-gray-600 mt-2">Add-ons</div>
          </Card>

          <Card className="p-6 text-center">
            <div className="text-4xl font-bold text-orange-600">
              {diagnostics.combos}
            </div>
            <div className="text-sm text-gray-600 mt-2">Combos</div>
          </Card>
        </div>

        {diagnostics.errors.length > 0 && (
          <Card className="p-6 bg-red-50 border-red-300">
            <h3 className="font-bold text-red-900 mb-2">Errors</h3>
            {diagnostics.errors.map((error, i) => (
              <div key={i} className="text-sm text-red-700 mb-1">
                {error}
              </div>
            ))}
          </Card>
        )}

        <Card className="p-6 mt-6">
          <h3 className="font-bold mb-4">Service Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span>Service Instance:</span>
              <Badge className="bg-green-600">
                {typeof subscriptionPlansService === "object" ? "OK" : "ERROR"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>getVehicleCategories:</span>
              <Badge className="bg-green-600">
                {typeof subscriptionPlansService.getVehicleCategories === "function"
                  ? "OK"
                  : "ERROR"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>getAllPlanTiers:</span>
              <Badge className="bg-green-600">
                {typeof subscriptionPlansService.getAllPlanTiers === "function"
                  ? "OK"
                  : "ERROR"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>getAddons:</span>
              <Badge className="bg-green-600">
                {typeof subscriptionPlansService.getAddons === "function" ? "OK" : "ERROR"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>getComboOffers:</span>
              <Badge className="bg-green-600">
                {typeof subscriptionPlansService.getComboOffers === "function"
                  ? "OK"
                  : "ERROR"}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 mt-6 bg-blue-50">
          <h3 className="font-bold text-blue-900 mb-2">Expected Values</h3>
          <div className="text-sm text-blue-800 space-y-1">
            <div>✓ Categories: 6 (3 × 4W, 3 × 2W)</div>
            <div>
              ✓ Tiers: ~14-16 (varies by category, some have 2-3 tiers each)
            </div>
            <div>✓ Add-ons: 6 total (5 active + 1 pending confirmation)</div>
            <div>✓ Combos: 6</div>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <a
            href="/subscription-app"
            className="text-purple-600 hover:underline mr-6"
          >
            → Go to Subscription App
          </a>
          <a href="/admin/plans" className="text-purple-600 hover:underline">
            → Go to Admin Panel
          </a>
        </div>
      </div>
    </div>
  );
}
