import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { StoreDashboard } from "../store/StoreDashboard";
import { StockPosition } from "../store/StockPosition";
import { GoodsReceipt } from "../store/GoodsReceipt";
import { StoreIssuances } from "../store/StoreIssuances";
import { StoreEquipment } from "../store/StoreEquipment";
import { StoreRequisitions } from "../store/StoreRequisitions";
import { PurchaseReturnsDispatch } from "../store/PurchaseReturnsDispatch";
import { StockVerification } from "../store/StockVerification";
import { StoreReports } from "../store/StoreReports";

export function StoreModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Central Store Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete inventory and equipment management for central store operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="stock-position">Stock Position</TabsTrigger>
          <TabsTrigger value="goods-receipt">Goods Receipt</TabsTrigger>
          <TabsTrigger value="issuances">Issuances</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="purchase-returns">Purchase Returns</TabsTrigger>
          <TabsTrigger value="stock-verification">Stock Verification</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          <StoreDashboard />
        </TabsContent>

        <TabsContent value="stock-position" className="mt-6">
          <StockPosition />
        </TabsContent>

        <TabsContent value="goods-receipt" className="mt-6">
          <GoodsReceipt />
        </TabsContent>

        <TabsContent value="issuances" className="mt-6">
          <StoreIssuances />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <StoreEquipment />
        </TabsContent>

        <TabsContent value="requisitions" className="mt-6">
          <StoreRequisitions />
        </TabsContent>

        <TabsContent value="purchase-returns" className="mt-6">
          <PurchaseReturnsDispatch />
        </TabsContent>

        <TabsContent value="stock-verification" className="mt-6">
          <StockVerification />
        </TabsContent>

        <TabsContent value="reports" className="mt-6">
          <StoreReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}
