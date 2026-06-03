/**
 * TSE CRM Update Screen
 * Mandatory update form after every call - blocks next lead until complete
 *
 * System Enforcements:
 * - 100% CRM compliance required
 * - Cannot mark Lost before 15 attempts
 * - Cannot mark Converted without payment confirmation
 * - Follow-up date/time required for Callback/Interested
 *
 * @component
 */

import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Save,
  X,
  AlertCircle,
  Calendar,
  Clock,
  Tag,
  FileText,
  CheckCircle,
} from "lucide-react";
import type {
  TSELead,
  CallOutcome,
  LostReason,
  CRMUpdate,
  PricingCalculation,
} from "../../types/teleSalesExecutive.types";
import {
  LEAD_ATTEMPT_LIMITS,
  QUICK_TAGS,
  SAFEGUARD_MESSAGES,
} from "../../constants/teleSalesExecutive.constants";

interface TSECRMUpdateProps {
  lead: TSELead;
  callNotes: string;
  callTags: string[];
  pricingData: PricingCalculation;
  onSubmit: (crmUpdate: CRMUpdate) => void;
  onCancel: () => void;
}

export function TSECRMUpdate({
  lead,
  callNotes,
  callTags,
  pricingData,
  onSubmit,
  onCancel,
}: TSECRMUpdateProps) {
  const [outcome, setOutcome] = useState<CallOutcome | "">("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [lostReason, setLostReason] = useState<LostReason | "">("");
  const [notes, setNotes] = useState(callNotes);
  const [tags, setTags] = useState<string[]>(callTags);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  // D3 FIX: explicit checkbox
  const [paymentLinkSent, setPaymentLinkSent] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Outcome required
    if (!outcome) {
      newErrors.outcome = "Call outcome is mandatory";
    }

    // Follow-up validation
    if ((outcome === "CALLBACK" || outcome === "INTERESTED") && !followUpDate) {
      newErrors.followUpDate = "Follow-up date required for Callback/Interested";
    }
    if ((outcome === "CALLBACK" || outcome === "INTERESTED") && !followUpTime) {
      newErrors.followUpTime = "Follow-up time required for Callback/Interested";
    }

    // Lost validation
    if (outcome === "LOST") {
      if (lead.attemptCount < LEAD_ATTEMPT_LIMITS.MIN_BEFORE_LOST) {
        // D4 FIX: show remaining attempts needed
        const remaining = LEAD_ATTEMPT_LIMITS.MIN_BEFORE_LOST - lead.attemptCount;
        newErrors.outcome = `Cannot mark Lost yet — need ${remaining} more attempt${remaining !== 1 ? "s" : ""} (${lead.attemptCount}/${LEAD_ATTEMPT_LIMITS.MIN_BEFORE_LOST} made).`;
      }
      if (!lostReason) {
        newErrors.lostReason = "Lost reason is required";
      }
    }

    // Converted validation
    if (outcome === "CONVERTED" && !paymentConfirmed) {
      newErrors.paymentConfirmed = "Payment must be confirmed before marking Converted";
    }

    // D6 FIX: NO_ANSWER — auto-suggest +2h follow-up if none set
    if (outcome === "NO_ANSWER" && !followUpDate) {
      const suggested = new Date();
      suggested.setHours(suggested.getHours() + 2);
      setFollowUpDate(suggested.toISOString().split("T")[0]);
      setFollowUpTime(suggested.toTimeString().slice(0, 5));
    }

    // Notes required
    if (!notes.trim()) {
      newErrors.notes = "Call notes are mandatory";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const crmUpdate: CRMUpdate = {
      leadId: lead.id,
      outcome: outcome as CallOutcome,
      followUpDate:
        followUpDate && followUpTime
          ? new Date(`${followUpDate}T${followUpTime}`)
          : undefined,
      followUpTime,
      conversionStatus:
        outcome === "CONVERTED" ? "CONVERTED" : outcome === "LOST" ? "LOST" : "PENDING",
      lostReason: outcome === "LOST" ? (lostReason as LostReason) : undefined,
      notes,
      tags,
      addOnOffered: pricingData.selectedAddOn?.name,
      bundleTierOffered: pricingData.selectedBundle?.tier,
      paymentLinkSent,  // D3 FIX: explicit checkbox — was auto-true for INTERESTED
      updatedAt: new Date(),
    };

    onSubmit(crmUpdate);
  };

  // D1 FIX: CONVERTED only blocked by missing payment confirmation — not attempt count
  const isConvertedDisabled = !paymentConfirmed;
  const isLostDisabled = lead.attemptCount < LEAD_ATTEMPT_LIMITS.MIN_BEFORE_LOST;

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">CRM Update Required</h2>
            <p className="text-sm text-gray-600 mt-1">
              Complete all mandatory fields to access next lead
            </p>
          </div>
          <Badge className="bg-orange-600">MANDATORY</Badge>
        </div>

        {/* Lead Summary */}
        <Card className="p-4 bg-gray-50 mb-6">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Customer</div>
              <div className="font-medium text-gray-900">{lead.customerName}</div>
            </div>
            <div>
              <div className="text-gray-600">Phone</div>
              <div className="font-medium text-gray-900">{lead.phone}</div>
            </div>
            <div>
              <div className="text-gray-600">Attempts</div>
              <div className="font-medium text-gray-900">
                {lead.attemptCount}/15
              </div>
            </div>
          </div>
        </Card>

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Call Outcome */}
          <div>
            <Label htmlFor="outcome" className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              Call Outcome *
            </Label>
            <Select value={outcome} onValueChange={(val) => setOutcome(val as CallOutcome)}>
              <SelectTrigger id="outcome" className={errors.outcome ? "border-red-500" : ""}>
                <SelectValue placeholder="Select call outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INTERESTED">Interested</SelectItem>
                <SelectItem value="NOT_INTERESTED">Not Interested</SelectItem>
                <SelectItem value="CALLBACK">Callback Scheduled</SelectItem>
                <SelectItem value="NO_ANSWER">No Answer</SelectItem>
                <SelectItem value="CONVERTED" disabled={isConvertedDisabled}>
                  Converted {isConvertedDisabled && "(Payment required)"}
                </SelectItem>
                <SelectItem value="LOST" disabled={isLostDisabled}>
                  Lost {isLostDisabled && `(Min ${LEAD_ATTEMPT_LIMITS.MIN_BEFORE_LOST} attempts)`}
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.outcome && (
              <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.outcome}
              </div>
            )}
          </div>

          {/* Follow-up Date & Time (conditional) */}
          {(outcome === "CALLBACK" || outcome === "INTERESTED") && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="followUpDate" className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Follow-up Date *
                </Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className={errors.followUpDate ? "border-red-500" : ""}
                />
                {errors.followUpDate && (
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.followUpDate}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="followUpTime" className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" />
                  Follow-up Time *
                </Label>
                <Input
                  id="followUpTime"
                  type="time"
                  value={followUpTime}
                  onChange={(e) => setFollowUpTime(e.target.value)}
                  className={errors.followUpTime ? "border-red-500" : ""}
                />
                {errors.followUpTime && (
                  <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.followUpTime}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lost Reason (conditional) */}
          {outcome === "LOST" && (
            <div>
              <Label htmlFor="lostReason" className="mb-2">
                Lost Reason *
              </Label>
              <Select value={lostReason} onValueChange={(val) => setLostReason(val as LostReason)}>
                <SelectTrigger id="lostReason" className={errors.lostReason ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRICE">Price Too High</SelectItem>
                  <SelectItem value="COMPETITOR">Went with Competitor</SelectItem>
                  <SelectItem value="NOT_INTERESTED">Not Interested Anymore</SelectItem>
                  <SelectItem value="UNREACHABLE">Unreachable (15 attempts)</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.lostReason && (
                <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.lostReason}
                </div>
              )}
            </div>
          )}

          {/* D3 FIX: Payment link sent — explicit per-call checkbox for INTERESTED */}
          {outcome === "INTERESTED" && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="paymentLinkSent"
                  checked={paymentLinkSent}
                  onChange={(e) => setPaymentLinkSent(e.target.checked)}
                  className="w-4 h-4" />
                <label htmlFor="paymentLinkSent" className="text-sm font-medium text-gray-900">
                  Payment link was sent to this customer
                </label>
              </div>
            </div>
          )}

          {/* Payment Confirmation (conditional) */}
          {outcome === "CONVERTED" && (
            <div className="p-4 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <input
                  type="checkbox"
                  id="paymentConfirmed"
                  checked={paymentConfirmed}
                  onChange={(e) => setPaymentConfirmed(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="paymentConfirmed" className="font-medium text-gray-900">
                  Payment confirmed via payment gateway
                </Label>
              </div>
              {errors.paymentConfirmed && (
                <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.paymentConfirmed}
                </div>
              )}
            </div>
          )}

          {/* Call Notes */}
          <div>
            <Label htmlFor="notes" className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              Call Notes *
              <span className="text-xs font-normal text-gray-500 ml-1">(pre-filled from in-call notes — edit or append)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Add post-call notes here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className={errors.notes ? "border-red-500" : ""}
            />
            {errors.notes && (
              <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.notes}
              </div>
            )}
          </div>

          {/* Quick Tags */}
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4" />
              Quick Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => (
                <Badge
                  key={tag}
                  variant={tags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <Card className="p-4 bg-blue-50">
            <div className="text-sm font-semibold text-gray-900 mb-2">
              Pricing Summary
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Deal Type</div>
                <Badge variant="outline">{pricingData.dealType}</Badge>
              </div>
              <div>
                <div className="text-gray-600">Final Price</div>
                <div className="font-semibold text-gray-900">
                  ₹{pricingData.finalPrice.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-gray-600">EBITDA</div>
                <div
                  className={`font-semibold ${
                    pricingData.finalEBITDA >= 35
                      ? "text-green-700"
                      : pricingData.finalEBITDA >= 30
                      ? "text-yellow-700"
                      : "text-red-700"
                  }`}
                >
                  {pricingData.finalEBITDA.toFixed(1)}%
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="gap-2">
            <Save className="w-4 h-4" />
            Save CRM Update
          </Button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-800">
          <AlertCircle className="w-4 h-4 inline mr-2" />
          <strong>System Lock:</strong> Next lead will be locked until this CRM update is submitted.
          30-minute timeout warning will trigger if not completed.
        </div>
      </Card>
    </div>
  );
}
