/**
 * State Selector Component
 *
 * Dropdown for selecting Indian state (for compliance rules)
 * Auto-detects state from city if available
 *
 * Usage:
 * <StateSelector value={state} onChange={setState} />
 */

import { useState } from "react";
import type { IndianState } from "../../services/payroll/complianceRules";
import { detectStateFromCity } from "../../services/payroll/complianceRules";
import { MapPin, ChevronDown } from "lucide-react";

interface StateSelectorProps {
  value: IndianState;
  onChange: (state: IndianState) => void;
  disabled?: boolean;
  label?: string;
  city?: string; // Auto-detect state from city
}

const STATE_OPTIONS: Array<{ code: IndianState; name: string }> = [
  { code: "GJ", name: "Gujarat" },
  { code: "MH", name: "Maharashtra" },
  { code: "KA", name: "Karnataka" },
  { code: "DL", name: "Delhi" },
  { code: "TN", name: "Tamil Nadu" },
  { code: "UP", name: "Uttar Pradesh" },
  { code: "RJ", name: "Rajasthan" },
  { code: "WB", name: "West Bengal" },
  { code: "AP", name: "Andhra Pradesh" },
  { code: "TG", name: "Telangana" },
];

export function StateSelector({
  value,
  onChange,
  disabled = false,
  label = "State",
  city,
}: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Auto-detect state from city if provided
  const detectedState = city ? detectStateFromCity(city) : null;
  const showDetectedHint = detectedState && detectedState !== value;

  const selectedState = STATE_OPTIONS.find((s) => s.code === value);

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {showDetectedHint && (
            <span className="ml-2 text-xs text-blue-600">
              (Detected: {STATE_OPTIONS.find((s) => s.code === detectedState)?.name})
            </span>
          )}
        </label>
      )}

      {/* Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between gap-2 px-3 py-2
          border rounded-lg bg-white text-left
          ${disabled ? "bg-gray-50 cursor-not-allowed" : "hover:border-gray-400"}
          ${isOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300"}
        `}
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm">
            {selectedState ? selectedState.name : "Select State"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Options List */}
          <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {STATE_OPTIONS.map((state) => (
              <button
                key={state.code}
                type="button"
                onClick={() => {
                  onChange(state.code);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-gray-50
                  ${value === state.code ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700"}
                  ${detectedState === state.code && value !== state.code ? "border-l-2 border-blue-400" : ""}
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{state.name}</span>
                  {value === state.code && (
                    <span className="text-blue-600 text-xs">✓</span>
                  )}
                  {detectedState === state.code && value !== state.code && (
                    <span className="text-blue-600 text-xs">Auto-detected</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
