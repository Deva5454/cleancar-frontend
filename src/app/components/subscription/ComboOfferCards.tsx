/**
 * Combo Offer Cards Component
 *
 * Displays available combo/bundle offers for subscription plans.
 * Shows bundled pricing, savings, and validity rules.
 *
 * Features:
 * - Grid layout of combo cards
 * - Savings calculation and badge display
 * - Validity rule information
 * - Selection/CTA for checkout
 *
 * @component
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tag, TrendingDown, Info, Users } from "lucide-react";
import { subscriptionPlansService } from "../../services/subscriptionPlansService";
import type { ComboOffer } from "../../types/subscriptionPlans.types";
import { logger } from "../../services/logger";

interface ComboOfferCardsProps {
  onSelectCombo?: (comboId: string) => void;
}

export function ComboOfferCards({ onSelectCombo }: ComboOfferCardsProps) {
  const [comboOffers, setComboOffers] = useState<ComboOffer[]>([]);

  useEffect(() => {
    const loadedCombos = subscriptionPlansService.getComboOffers();
    setComboOffers(loadedCombos);
  }, []);

  if (comboOffers.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Tag className="w-5 h-5 text-green-700" />
          <h3 className="text-xl font-semibold text-gray-900">
            Combo Offers & Bundles
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          Save more with bundled plans for multiple vehicles or premium care packages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {comboOffers.map((combo) => {
          const savingPercent = combo.savingPercent;
          const isLargeSaving = savingPercent >= 15;

          return (
            <Card
              key={combo.id}
              className={`p-6 border-2 ${
                isLargeSaving
                  ? "border-green-300 bg-green-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-bold text-lg text-gray-900">
                    {combo.name}
                  </h4>
                  {isLargeSaving && (
                    <Badge className="bg-green-700">
                      <TrendingDown className="w-3 h-3 mr-1" />
                      Best Deal
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-700">{combo.description}</p>
              </div>

              {/* Pricing */}
              <div className="space-y-3 mb-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-gray-600">Regular Price:</span>
                  <span className="text-lg text-gray-500 line-through">
                    {subscriptionPlansService.formatPrice(combo.normalPrice)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <span className="font-medium text-gray-900">Combo Price:</span>
                  <span className="text-2xl font-bold text-green-700">
                    {subscriptionPlansService.formatPrice(combo.comboPrice)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-2">
                    <Badge className="bg-green-600 text-base py-1 px-3">
                      Save {subscriptionPlansService.formatPrice(combo.savingAmount)}
                    </Badge>
                    <span className="text-sm text-green-700 font-medium">
                      ({savingPercent}% off)
                    </span>
                  </div>
                </div>
              </div>

              {/* Validity Rule */}
              <Card className="p-3 bg-blue-50 border-blue-200 mb-4">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-700 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800">
                    <span className="font-medium">Validity:</span> {combo.validityRule}
                  </div>
                </div>
              </Card>

              {/* CTA */}
              <Button
                className="w-full"
                onClick={() => {
                  if (onSelectCombo) {
                    onSelectCombo(combo.id);
                  }
                  logger.log("Selected combo:", combo.id);
                }}
              >
                Select This Combo
              </Button>
            </Card>
          );
        })}
      </div>

      {/* Fleet/Society Offer Callout */}
      <Card className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg text-purple-900 mb-2">
              Society / Fleet Discounts
            </h4>
            <p className="text-purple-800 mb-4">
              Have 5+ vehicles in your society or fleet? Get <strong>15% off</strong> on
              all vehicle subscriptions when billed together. Perfect for apartment
              complexes, corporate fleets, and car rental companies.
            </p>
            <Button variant="outline" className="border-purple-600 text-purple-700">
              Contact Sales
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
