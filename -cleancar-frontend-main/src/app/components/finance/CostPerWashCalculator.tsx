/**
 * Cost Per Wash Calculator - Main Component
 * Tabs: Company Cost, Customer Price, Tracking Reports & Trends Dashboard
 * Last Updated: 2026-03-17
 */
import { useState } from "react";
import { Card } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { Calculator, DollarSign, TrendingUp, BarChart3, LineChart } from "lucide-react";
import { CostPerWashCompany } from "./CostPerWashCompany";
import { CostPerWashCustomer } from "./CostPerWashCustomer";
import { TrackingReports } from "./TrackingReports";
import { TrendsDashboard } from "./TrendsDashboard";

export function CostPerWashCalculator() {
  return (
    <div className="space-y-6">
      <BackButton to="/finance" />

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="w-7 h-7 text-blue-600" />
          Cost Per Wash Calculator
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Comprehensive cost analysis with company cost, customer pricing, multi-dimensional tracking, and trend visualization
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Company Cost
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Customer Price
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Tracking Reports
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart className="w-4 h-4" />
            Trends Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <CostPerWashCompany />
        </TabsContent>

        <TabsContent value="customer">
          <CostPerWashCustomer />
        </TabsContent>

        <TabsContent value="reports">
          <TrackingReports />
        </TabsContent>

        <TabsContent value="trends">
          <TrendsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}