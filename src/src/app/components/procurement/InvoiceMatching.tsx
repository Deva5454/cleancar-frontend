import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { FileText, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function InvoiceMatching() {
  const invoices = [
    { invoiceNumber: "INV-2603-045", poNumber: "PO-2026-0245", grnNumber: "GRN-2026-012", supplier: "ChemClean Industries", amount: 125000, status: "Pending Match", date: "Mar 17, 2026" },
    { invoiceNumber: "INV-2603-044", poNumber: "PO-2026-0243", grnNumber: "GRN-2026-011", supplier: "ProWash Equipment", amount: 52000, status: "Matched", date: "Mar 15, 2026", matchType: "3-Way Match" },
    { invoiceNumber: "INV-2603-043", poNumber: "PO-2026-0242", grnNumber: "GRN-2026-010", supplier: "ChemClean Industries", amount: 95000, status: "Discrepancy", date: "Mar 14, 2026", issue: "Qty mismatch" },
  ];

  const handleMatch = (invoiceNumber: string) => {
    toast.success(`${invoiceNumber} matched successfully`);
  };

  const handleViewInvoice = (invoiceNumber: string) => {
    toast.info(`Opening ${invoiceNumber} details...`);
  };

  const handleResolveDiscrepancy = (invoiceNumber: string) => {
    toast.info(`Opening discrepancy resolution for ${invoiceNumber}...`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Invoice Matching</h2>
          <p className="text-sm text-gray-500 mt-1">3-way match between PO, GRN, and supplier invoices for payment approval</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending Match</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500">Matched</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-xs text-gray-500">Discrepancy</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">₹272K</p>
            <p className="text-xs text-gray-500">Total Amount</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Supplier Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceNumber} className={`flex items-center justify-between p-4 border rounded-lg ${invoice.status === "Discrepancy" ? "border-red-300 bg-red-50" : ""}`}>
                <div className="flex items-center gap-4 flex-1">
                  <FileText className={`w-5 h-5 ${invoice.status === "Discrepancy" ? "text-red-600" : "text-blue-600"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <Badge variant={
                        invoice.status === "Pending Match" ? "destructive" :
                        invoice.status === "Matched" ? "outline" :
                        "destructive"
                      }>
                        {invoice.status}
                      </Badge>
                      {invoice.matchType && (
                        <Badge variant="secondary">{invoice.matchType}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{invoice.supplier}</span>
                      <span>•</span>
                      <span>PO: {invoice.poNumber}</span>
                      <span>•</span>
                      <span>GRN: {invoice.grnNumber}</span>
                      <span>•</span>
                      <span>{invoice.date}</span>
                    </div>
                    {invoice.issue && (
                      <p className="text-xs text-red-600 mt-1">⚠ {invoice.issue}</p>
                    )}
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold text-lg">₹{invoice.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {invoice.status === "Pending Match" && (
                    <Button size="sm" variant="default" onClick={() => handleMatch(invoice.invoiceNumber)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Match
                    </Button>
                  )}
                  {invoice.status === "Discrepancy" && (
                    <Button size="sm" variant="destructive" onClick={() => handleResolveDiscrepancy(invoice.invoiceNumber)}>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Resolve
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewInvoice(invoice.invoiceNumber)}>
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
