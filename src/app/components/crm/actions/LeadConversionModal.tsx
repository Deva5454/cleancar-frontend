import { incentiveStructureService } from "../../services/incentiveStructureService";
/**
 * LeadConversionModal - Payment-driven lead conversion
 * Enforces: Payment FIRST, then subscription details, then conversion
 * Integrated with LeadConversionService for transaction-safe conversion
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2, DollarSign, CreditCard } from "lucide-react";
import { type PaymentDetails, type SubscriptionPlan } from "../../services/leadConversionService";
import { useBusinessFlows } from "../../contexts/AppProvider";
import { useCity } from "../../contexts/CityContext";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  area: string;
  carType: string;
  leadSource: string;
  status: string;
  notes?: string;
}

interface LeadConversionModalProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function LeadConversionModal({ lead, open, onOpenChange, onSuccess }: LeadConversionModalProps) {
  // CRITICAL: Use Business Flows for orchestrated lead conversion
  const { convertLeadWithPayment } = useBusinessFlows();
  const { cityInfo } = useCity();

  // Form state
  const [paymentStatus, setPaymentStatus] = useState<"Pending" | "Paid" | "Failed">("Pending");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "UPI" | "Card" | "Net Banking" | "Cheque">("UPI");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  const [selectedPackage, setSelectedPackage] = useState<"EXPRESS_WASH" | "SMART_WASH" | "ELITE_WASH">("SMART_WASH");
  const [packageName, setPackageName] = useState("SMART_WASH");
  const [frequency, setFrequency] = useState<"Daily" | "Alternate Days" | "Weekly" | "Bi-Weekly" | "Monthly">("Weekly");
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Quarterly" | "Annual">("Monthly");
  const [basePrice, setBasePrice] = useState(() => {
    // Default: Smart Wash Hatchback — update when plan/vehicle changes
    const prices: Record<string, Record<string, number>> = {
      EXPRESS_WASH: { Hatchback: 1249, SUV: 1499, Luxury: 1999 },
      SMART_WASH:   { Hatchback: 1599, SUV: 1999, Luxury: 2699 },
      ELITE:        { Hatchback: 1999, SUV: 2499, Luxury: 3499 },
    };
    const cat = (lead?.vehicleCategory || "Hatchback").includes("SUV") ? "SUV"
      : (lead?.vehicleCategory || "").includes("Luxury") ? "Luxury" : "Hatchback";
    const plan = lead?.planOfInterest || "SMART_WASH";
    return String(prices[plan]?.[cat] ?? prices.SMART_WASH.Hatchback);
  });
  const [discount, setDiscount] = useState("0");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate final price
  const finalPrice = parseInt(basePrice || "0") - parseInt(discount || "0");

  // Validation
  const isPaymentValid = paymentStatus === "Paid" && parseFloat(paymentAmount) >= finalPrice;
  const isSubscriptionValid = selectedPackage && packageName && frequency && billingCycle && startDate;
  const canConvert = isPaymentValid && isSubscriptionValid;

  const handleConfirmConversion = async () => {
    setIsConverting(true);
    setConversionError(null);

    try {
      // Prepare payment details
      const paymentDetails: PaymentDetails = {
        paymentMethod,
        transactionId: transactionId || undefined,
        amount: parseFloat(paymentAmount),
        paymentDate,
        status: paymentStatus,
        notes: paymentNotes || undefined,
      };

      // Prepare subscription plan
      const subscriptionPlan: SubscriptionPlan = {
        packageType: selectedPackage,
        packageName,
        frequency,
        pricing: {
          basePrice: parseInt(basePrice),
          discount: parseInt(discount),
          finalPrice,
          currency: "INR",
        },
        billingCycle,
        startDate,
        addOns: [],
      };

      // Build lead object from modal data
      const leadData = {
        leadId: lead.id,
        firstName: lead.name.split(" ")[0] || lead.name,
        lastName: lead.name.split(" ").slice(1).join(" ") || "",
        email: lead.email || `${lead.mobile}@customer.com`,
        phone: lead.mobile,
        address: {
          line1: "",
          area: lead.area,
          city: cityInfo?.displayName || "Surat",
          pinCode: "",
        },
        vehicleDetails: {
          category: lead.carType,
          brand: lead.vehicleDetails?.brand || "",
          color: lead.vehicleDetails?.color || "",
          registrationNumber: lead.vehicleDetails?.registrationNumber || "",
        },
        leadSource: lead.leadSource,
        status: "Demo Completed" as const,
      };

      // CRITICAL: Use Business Flow Hook for orchestrated, transaction-safe conversion
      const result = convertLeadWithPayment(leadData, {
        leadId: lead.id,
        paymentDetails,
        subscriptionPlan,
      });

      if (result.success) {
        toast.success("Lead Converted Successfully!", {
          description: `Customer created with ${result.jobsGenerated?.length || 0} jobs scheduled`,
          duration: 5000,
        });

        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(result.error || "Conversion failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      setConversionError(errorMessage);
      toast.error("Conversion Failed", {
        description: errorMessage,
        duration: 6000,
      });
    } finally {
      setIsConverting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] sm:w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Convert Lead to Customer</DialogTitle>
            <DialogDescription>
              Complete payment and subscription details to convert {lead.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Vehicle Details Warning */}
            {!lead.vehicleDetails?.registrationNumber && (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 text-sm mb-3">
                ⚠️ Vehicle registration not captured. The washer will not have vehicle identification. Consider updating before conversion.
              </div>
            )}

            {/* Payment Section */}
            <Card className="p-4 border-2 border-purple-200 bg-purple-50">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">Payment Details (Required)</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Payment Status *</Label>
                    <Select value={paymentStatus} onValueChange={(v) => setPaymentStatus(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="Net Banking">Net Banking</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Amount Received (₹) *</Label>
                    <Input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Enter amount"
                    />
                  </div>

                  <div>
                    <Label>Payment Date *</Label>
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Transaction ID (Optional)</Label>
                  <Input
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="TXN123456"
                  />
                </div>

                {paymentStatus !== "Paid" && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">Payment Required</p>
                      <p className="text-xs text-red-700">Payment status must be "Paid" before conversion</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Subscription Section */}
            <Card className="p-4 border-2 border-blue-200 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Subscription Details (Required)</h3>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Package Type *</Label>
                    <Select value={selectedPackage} onValueChange={(v) => setSelectedPackage(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EXPRESS_WASH">Basic</SelectItem>
                        <SelectItem value="SMART_WASH">Standard</SelectItem>
                        <SelectItem value="Premium">Premium</SelectItem>
                        <SelectItem value="ELITE_WASH">Deluxe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Package Name *</Label>
                    <Input
                      value={packageName}
                      onChange={(e) => setPackageName(e.target.value)}
                      placeholder="SMART_WASH"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Service Frequency *</Label>
                    <Select value={frequency} onValueChange={(v) => setFrequency(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Alternate Days">Alternate Days</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Bi-Weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Billing Cycle *</Label>
                    <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Base Price (₹) *</Label>
                    <Input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Final Price</Label>
                    <Input value={`₹${finalPrice}`} disabled className="font-semibold" />
                  </div>
                </div>

                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </Card>

            {/* Validation Status */}
            {conversionError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Conversion Error</p>
                  <p className="text-xs text-red-700">{conversionError}</p>
                  <p className="text-xs text-red-600 mt-1">No data was saved. Lead remains unchanged.</p>
                </div>
              </div>
            )}

            {canConvert && (
              <div className="p-3 bg-green-50 border border-green-200 rounded flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-900">Ready to Convert</p>
                  <p className="text-xs text-green-700">All required details provided. Payment verified.</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConverting}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmation(true)}
              disabled={!canConvert || isConverting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Convert Lead
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lead Conversion</DialogTitle>
            <DialogDescription>
              This will create customer, subscription, and jobs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Customer Name</p>
                <p className="font-semibold">{lead.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Package</p>
                <p className="font-semibold">{packageName}</p>
              </div>
              <div>
                <p className="text-gray-500">Payment Received</p>
                <p className="font-semibold text-green-600">₹{paymentAmount}</p>
              </div>
              <div>
                <p className="text-gray-500">Billing Cycle</p>
                <p className="font-semibold">{billingCycle}</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-xs text-blue-900">
                <span className="font-semibold">What will happen:</span> Customer account will be created,
                subscription activated, jobs scheduled, and revenue tracking updated.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmation(false)} disabled={isConverting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConversion} disabled={isConverting} className="bg-green-600 hover:bg-green-700">
              {isConverting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                "Confirm Conversion"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
