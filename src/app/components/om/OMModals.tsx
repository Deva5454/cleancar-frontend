/**
 * OPERATIONS MANAGER - MODAL COMPONENTS
 * Reusable modals for all OM interactions
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { X, AlertTriangle, CheckCircle, FileText } from "lucide-react";

// ============================================
// REJECTION MODAL
// ============================================

export interface RejectionModalProps {
  title: string;
  entityName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectionModal({ title, entityName, onConfirm, onCancel }: RejectionModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim()) {
      onConfirm(reason);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              You are rejecting: <strong>{entityName}</strong>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Rejection Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
              placeholder="Provide a clear reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-xs text-gray-600 mt-1">
              This will be visible to the requester and audit trail
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 text-white hover:bg-red-700"
              onClick={handleConfirm}
              disabled={!reason.trim()}
            >
              Confirm Rejection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// APPROVAL MODAL (Optional Notes)
// ============================================

export interface ApprovalModalProps {
  title: string;
  entityName: string;
  onConfirm: (notes?: string) => void;
  onCancel: () => void;
}

export function ApprovalModal({ title, entityName, onConfirm, onCancel }: ApprovalModalProps) {
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    onConfirm(notes.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              You are approving: <strong>{entityName}</strong>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Approval Notes (Optional)
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              placeholder="Add any notes or conditions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              onClick={handleConfirm}
            >
              Confirm Approval
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// REQUEST INFO MODAL
// ============================================

export interface RequestInfoModalProps {
  title: string;
  entityName: string;
  onConfirm: (question: string) => void;
  onCancel: () => void;
}

export function RequestInfoModal({ title, entityName, onConfirm, onCancel }: RequestInfoModalProps) {
  const [question, setQuestion] = useState("");

  const handleConfirm = () => {
    if (question.trim()) {
      onConfirm(question);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <FileText className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              Request additional information for: <strong>{entityName}</strong>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              What information do you need? <span className="text-red-600">*</span>
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Ask a specific question..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
              onClick={handleConfirm}
              disabled={!question.trim()}
            >
              Send Request
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// DISCOUNT APPROVAL MODAL
// ============================================

export interface DiscountModalProps {
  leadName: string;
  estimatedValue: number;
  authorityLimit: number;
  onApply: (discount: number) => void;
  onRequestApproval: (discount: number) => void;
  onCancel: () => void;
}

export function DiscountModal({
  leadName,
  estimatedValue,
  authorityLimit,
  onApply,
  onRequestApproval,
  onCancel,
}: DiscountModalProps) {
  const [discount, setDiscount] = useState(0);

  const discountedPrice = estimatedValue * (1 - discount / 100);
  const requiresApproval = discount > authorityLimit;

  const handleConfirm = () => {
    if (requiresApproval) {
      onRequestApproval(discount);
    } else {
      onApply(discount);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Apply Discount</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700">
              Lead: <strong>{leadName}</strong>
            </p>
            <p className="text-sm text-gray-700">
              Original Price: <strong>₹{estimatedValue.toLocaleString()}</strong>
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Discount Percentage
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-full"
            />
            <p className="text-xs text-gray-600 mt-1">
              Your authority limit: {authorityLimit}%
            </p>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
            <p className="text-sm font-semibold text-gray-900">
              Final Price: ₹{discountedPrice.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600">
              Discount: {discount}% (₹{(estimatedValue - discountedPrice).toLocaleString()})
            </p>
          </div>

          {requiresApproval && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-900 font-semibold">
                ⚠️ Requires City Manager Approval
              </p>
              <p className="text-xs text-yellow-800">
                Discount exceeds your authority limit of {authorityLimit}%
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className={`flex-1 ${
                requiresApproval
                  ? "bg-yellow-600 hover:bg-yellow-700"
                  : "bg-green-600 hover:bg-green-700"
              } text-white`}
              onClick={handleConfirm}
              disabled={discount <= 0}
            >
              {requiresApproval ? "Request Approval" : "Apply Discount"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// WASHER DETAIL MODAL
// ============================================

export interface WasherDetailModalProps {
  washer: {
    id: string;
    name: string;
    supervisor: string;
    phone: string;
    units: { done: number; target: number };
    cover: number;
    status: string;
  };
  onClose: () => void;
  onReassign?: () => void;
}

export function WasherDetailModal({ washer, onClose, onReassign }: WasherDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Washer Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-lg font-bold text-gray-900">{washer.name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">ID</p>
                <p className="text-sm font-semibold text-gray-900">{washer.id}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">Supervisor</p>
                <p className="text-sm font-semibold text-gray-900">{washer.supervisor}</p>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
              <p className="text-sm font-semibold text-gray-900 mb-2">Today's Performance</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Units Done</span>
                <Badge className="bg-blue-600 text-white">
                  {washer.units.done} / {washer.units.target}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-700">Cover Units</span>
                <Badge className="bg-purple-600 text-white">{washer.cover}</Badge>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Status</p>
              <p className="text-sm font-semibold text-gray-900">{washer.status}</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            {onReassign && (
              <Button
                className="flex-1 bg-purple-600 text-white hover:bg-purple-700"
                onClick={onReassign}
              >
                Reassign Cover
              </Button>
            )}
            <Button
              className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// INCENTIVE BREAKDOWN MODAL
// ============================================

export interface IncentiveBreakdownModalProps {
  washer: {
    name: string;
    id: string;
    baseIncentive: number;
    kpiScore: number;
    finalIncentive: number;
    kpiBreakdown: Array<{ metric: string; achievement: number; score: number; weight: number }>;
  };
  onClose: () => void;
}

export function IncentiveBreakdownModal({ washer, onClose }: IncentiveBreakdownModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Incentive Breakdown</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Washer</p>
            <p className="text-lg font-bold text-gray-900">{washer.name}</p>
            <p className="text-xs text-gray-600">ID: {washer.id}</p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">KPI Score Breakdown</h3>
            <div className="space-y-2">
              {washer.kpiBreakdown.map((kpi) => (
                <div key={kpi.metric} className="p-3 bg-white border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-900">{kpi.metric}</span>
                    <Badge className="bg-blue-600 text-white">
                      Weight: {kpi.weight}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      Achievement: {kpi.achievement}%
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      Score: {kpi.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Base Incentive</span>
                <span className="text-lg font-bold text-gray-900">
                  ₹{washer.baseIncentive.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-300">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">KPI Multiplier</span>
                <span className="text-lg font-bold text-gray-900">{washer.kpiScore}%</span>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-500">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900">Final Incentive</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{washer.finalIncentive.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-gray-200 text-gray-900 hover:bg-gray-300"
            onClick={onClose}
          >
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
