/**
 * OM Lead Lost Reason Modal
 * Mandatory reason capture when marking a lead as Closed-Lost
 */

import { useState } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";

export type LostReason = "Price" | "Competitor" | "No Interest" | "Timing" | "Other";

export interface LostReasonData {
  reason: LostReason;
  notes?: string;
}

export interface OMLeadLostReasonModalProps {
  leadName: string;
  onConfirm: (data: LostReasonData) => void;
  onCancel: () => void;
}

export function OMLeadLostReasonModal({
  leadName,
  onConfirm,
  onCancel,
}: OMLeadLostReasonModalProps) {
  const [selectedReason, setSelectedReason] = useState<LostReason | "">("");
  const [notes, setNotes] = useState("");

  const lostReasons: LostReason[] = ["Price", "Competitor", "No Interest", "Timing", "Other"];

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm({
      reason: selectedReason as LostReason,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Lost Reason Required</h2>
            <p className="text-sm text-gray-600 mt-1">Marking "{leadName}" as Closed-Lost</p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lost Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value as LostReason)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Select a reason...</option>
              {lostReasons.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes <span className="text-gray-400 text-xs">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context..."
              rows={4}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason}
            className="bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm Lost
          </Button>
        </div>
      </div>
    </div>
  );
}
