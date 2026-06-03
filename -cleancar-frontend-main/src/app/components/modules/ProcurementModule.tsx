import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { BackButton } from "../ui/back-button";
import { ProcurementOverview } from "../procurement/ProcurementDashboard";
import { SupplierMaster } from "../procurement/SupplierMaster";
import { MaterialRequisitions } from "../procurement/MaterialRequisitions";
import { QuotationManagement } from "../procurement/QuotationManagement";
import { PurchaseOrders } from "../procurement/PurchaseOrders";
import { GoodsReceipt } from "../procurement/GoodsReceipt";
import { InvoiceMatching } from "../procurement/InvoiceMatching";
import { PurchaseReturns } from "../procurement/PurchaseReturns";
import { SupplierPayments } from "../procurement/SupplierPayments";
import { PurchaseAnalytics } from "../procurement/PurchaseAnalytics";

export function ProcurementModule() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Complete procurement lifecycle from requisition to payment
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="requisitions">Requisitions</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="goods-receipt">Goods Receipt</TabsTrigger>
          <TabsTrigger value="invoice-matching">Invoice Matching</TabsTrigger>
          <TabsTrigger value="returns">Purchase Returns</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ProcurementOverview />
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierMaster />
        </TabsContent>

        <TabsContent value="requisitions">
          <MaterialRequisitions />
        </TabsContent>

        <TabsContent value="quotations">
          <QuotationManagement />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <PurchaseOrders />
        </TabsContent>

        <TabsContent value="goods-receipt">
          <GoodsReceipt />
        </TabsContent>

        <TabsContent value="invoice-matching">
          <InvoiceMatching />
        </TabsContent>

        <TabsContent value="returns">
          <PurchaseReturns />
        </TabsContent>

        <TabsContent value="payments">
          <SupplierPayments />
        </TabsContent>

        <TabsContent value="analytics">
          <PurchaseAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
