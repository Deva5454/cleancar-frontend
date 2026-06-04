import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CreditCard, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export function SupplierPayments() {
  const payments = [
    { paymentId: "PAY-2026-015", supplier: "ChemClean Industries", invoices: ["INV-2603-044"], amount: 52000, dueDate: "Mar 20, 2026", status: "Scheduled", paymentMethod: "NEFT" },
    { paymentId: "PAY-2026-014", supplier: "ProWash Equipment", invoices: ["INV-2603-043"], amount: 95000, dueDate: "Mar 18, 2026", status: "Pending Approval", paymentMethod: "RTGS" },
    { paymentId: "PAY-2026-013", supplier: "AutoCare Solutions", invoices: ["INV-2603-041", "INV-2603-042"], amount: 127000, dueDate: "Mar 15, 2026", status: "Overdue", paymentMethod: "NEFT", daysOverdue: 2 },
    { paymentId: "PAY-2026-012", supplier: "CarCare Supplies", invoices: ["INV-2603-040"], amount: 42000, dueDate: "Mar 10, 2026", status: "Paid", paymentMethod: "NEFT", paidDate: "Mar 10, 2026" },
  ];

  const handleMakePayment = (paymentId: string) => {
    toast.success(`Processing payment ${paymentId}...`);
  };

  const handleViewPayment = (paymentId: string) => {
    toast.info(`Opening ${paymentId} details...`);
  };

  const handleApprovePayment = (paymentId: string) => {
    toast.success(`Payment ${paymentId} approved`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Supplier Payments</h2>
          <p className="text-sm text-gray-500 mt-1">Track payment obligations, record payments, and manage supplier outstanding balances</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">1</p>
            <p className="text-xs text-gray-500">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">1</p>
            <p className="text-xs text-gray-500">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">1</p>
            <p className="text-xs text-gray-500">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">1</p>
            <p className="text-xs text-gray-500">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">₹316K</p>
            <p className="text-xs text-gray-500">Total Amount</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment) => (
              <div key={payment.paymentId} className={`flex items-center justify-between p-4 border rounded-lg ${payment.status === "Overdue" ? "border-red-300 bg-red-50" : ""}`}>
                <div className="flex items-center gap-4 flex-1">
                  <CreditCard className={`w-5 h-5 ${payment.status === "Overdue" ? "text-red-600" : payment.status === "Paid" ? "text-green-600" : "text-blue-600"}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{payment.paymentId}</p>
                      <Badge variant={
                        payment.status === "Pending Approval" ? "destructive" :
                        payment.status === "Scheduled" ? "default" :
                        payment.status === "Overdue" ? "destructive" :
                        "outline"
                      }>
                        {payment.status}
                      </Badge>
                      <Badge variant="secondary">{payment.paymentMethod}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span>{payment.supplier}</span>
                      <span>•</span>
                      <span>{payment.invoices.length} invoice{payment.invoices.length > 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>Due: {payment.dueDate}</span>
                      {payment.daysOverdue && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-medium">{payment.daysOverdue} days overdue</span>
                        </>
                      )}
                      {payment.paidDate && (
                        <>
                          <span>•</span>
                          <span className="text-green-600">Paid: {payment.paidDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right mr-4">
                    <p className="font-bold text-lg">₹{payment.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {payment.status === "Pending Approval" && (
                    <Button size="sm" variant="default" onClick={() => handleApprovePayment(payment.paymentId)}>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  {payment.status === "Scheduled" && (
                    <Button size="sm" variant="default" onClick={() => handleMakePayment(payment.paymentId)}>
                      <CreditCard className="w-4 h-4 mr-1" />
                      Pay Now
                    </Button>
                  )}
                  {payment.status === "Overdue" && (
                    <Button size="sm" variant="destructive" onClick={() => handleMakePayment(payment.paymentId)}>
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Pay Now
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleViewPayment(payment.paymentId)}>
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
