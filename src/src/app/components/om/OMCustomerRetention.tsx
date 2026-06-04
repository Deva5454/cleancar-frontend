/**
 * 5️⃣ OPERATIONS MANAGER: CUSTOMER & RETENTION VIEW
 * Prevent churn + drive upsell
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { AlertTriangle, TrendingDown, TrendingUp, DollarSign, Calendar } from "lucide-react";
import type { CustomerRetention } from "../../services/operationsManagerService";

export interface OMCustomerRetentionProps {
  customers: CustomerRetention[];
  onAssignTask: (customerId: string) => void;
  onLogResolution: (customerId: string) => void;
  onMarkUpsell: (customerId: string) => void;
}

export function OMCustomerRetention({
  customers,
  onAssignTask,
  onLogResolution,
  onMarkUpsell,
}: OMCustomerRetentionProps) {
  const getChurnRiskConfig = (risk: CustomerRetention["churnRisk"]) => {
    switch (risk) {
      case "HIGH": return { label: "🔴 High Risk", color: "bg-red-600 text-white", bgColor: "bg-red-50 border-red-300" };
      case "MEDIUM": return { label: "🟡 Medium", color: "bg-yellow-600 text-white", bgColor: "bg-yellow-50 border-yellow-300" };
      case "LOW": return { label: "🟢 Low", color: "bg-green-600 text-white", bgColor: "bg-white border-gray-200" };
    }
  };

  const getTrendIcon = (trend: CustomerRetention["satisfactionTrend"]) => {
    switch (trend) {
      case "UP": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "DOWN": return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const highRiskCount = customers.filter(c => c.churnRisk === "HIGH").length;
  const totalAtRisk = customers.filter(c => c.churnRisk !== "LOW").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-900 to-orange-800 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-2">Customer Retention</h1>
          <p className="text-sm text-orange-200">Churn Prevention & Upsell</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* SUMMARY */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="border-2 border-red-500">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">{highRiskCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total At Risk</p>
                  <p className="text-2xl font-bold text-gray-900">{totalAtRisk}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Upsell Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customers.filter(c => c.upsellOpportunity).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CUSTOMER LIST */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Churn Risk Customers</h2>
            <div className="space-y-3">
              {customers.map((customer) => {
                const riskConfig = getChurnRiskConfig(customer.churnRisk);

                return (
                  <div
                    key={customer.id}
                    className={`p-4 rounded-lg border-2 ${riskConfig.bgColor}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{customer.customerName}</h3>
                          <Badge className={riskConfig.color}>{riskConfig.label}</Badge>
                          {getTrendIcon(customer.satisfactionTrend)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {customer.packageType} • {customer.vehicleType} • Washer: {customer.assignedWasher}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Missed Washes</p>
                        <p className="font-bold text-red-600">{customer.missedWashes}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Complaints</p>
                        <p className="font-bold text-red-600">{customer.complaints}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Last Wash</p>
                        <p className="font-bold text-gray-900">
                          {Math.floor((Date.now() - customer.lastWashDate.getTime()) / (1000 * 60 * 60 * 24))} days ago
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs mb-1">Subscribed</p>
                        <p className="font-bold text-gray-900">
                          {Math.floor((Date.now() - customer.subscriptionStartDate.getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>

                    {customer.upsellOpportunity && (
                      <div className="mb-3 p-3 bg-green-100 rounded border border-green-300">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-900">Upsell Opportunity</span>
                        </div>
                        <p className="text-xs text-green-700">{customer.upsellOpportunity.suggestedPackage}</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">
                          +₹{customer.upsellOpportunity.additionalRevenue}/month potential
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => onAssignTask(customer.id)}
                      >
                        Assign Task
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onLogResolution(customer.id)}>
                        Log Resolution
                      </Button>
                      {customer.upsellOpportunity && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => onMarkUpsell(customer.id)}
                        >
                          Attempt Upsell
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
