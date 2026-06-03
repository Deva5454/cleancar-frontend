/**
 * Barcode Scanner Component
 * Always-on scanner for cloth barcodes
 * In production: Replace with actual camera-based scanner
 */

import { useState, useEffect, useRef } from "react";
import { Camera, Scan } from "lucide-react";
import { Input } from "../ui/input";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function BarcodeScanner({
  onScan,
  disabled = false,
  placeholder = "Scan cloth barcode",
}: BarcodeScannerProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter key triggers scan
    if (e.key === "Enter" && inputValue.trim()) {
      onScan(inputValue.trim());
      setInputValue("");

      // Trigger haptic feedback (if available)
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.toUpperCase());
  };

  return (
    <div className="relative">
      {/* Camera Overlay (Visual Only) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full bg-gradient-to-b from-black/5 to-transparent rounded-lg flex items-center justify-center">
          <div className="relative">
            {/* Scan Line Animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-1 bg-blue-500/50 animate-pulse" />
            </div>

            {/* Scanner Frame */}
            <div className="w-72 h-72 border-4 border-blue-500/30 rounded-lg relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-600 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-600 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-lg" />

              {/* Center Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-blue-600/10 rounded-full p-6">
                  <Scan className="w-16 h-16 text-blue-600" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actual Scanner Input */}
      <div className="relative z-10 mt-[320px]">
        <div className="flex items-center gap-3 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
          <Camera className="w-6 h-6 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 text-lg font-mono border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
          />
          <div className="flex items-center gap-2">
            {inputValue && (
              <span className="text-sm font-medium text-blue-600">
                Press Enter
              </span>
            )}
            <div
              className={`w-3 h-3 rounded-full ${
                disabled ? "bg-gray-300" : "bg-green-500 animate-pulse"
              }`}
            />
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-3">
          {disabled
            ? "Scanner disabled"
            : "Type or scan barcode, then press Enter"}
        </p>
      </div>
    </div>
  );
}

/**
 * Scan Feedback Toast
 * Shows floating feedback after each scan
 */
interface ScanFeedbackToastProps {
  shortId: string;
  type: "EXTERIOR" | "INTERIOR";
  category: "DIRTY" | "CLEAN";
  success: boolean;
}

export function ScanFeedbackToast({
  shortId,
  type,
  category,
  success,
}: ScanFeedbackToastProps) {
  const typeColor = type === "EXTERIOR" ? "blue" : "purple";
  const categoryColor = category === "DIRTY" ? "amber" : "green";

  return (
    <div
      className={`
        fixed top-20 right-6 z-50
        animate-in slide-in-from-right-5 fade-in
        duration-300
        ${success ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}
        border-2 rounded-lg shadow-lg p-4 min-w-[200px]
      `}
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div
          className={`
          w-12 h-12 rounded-full flex items-center justify-center
          ${success ? "bg-green-100" : "bg-red-100"}
        `}
        >
          <span
            className={`text-2xl font-bold ${
              success ? "text-green-600" : "text-red-600"
            }`}
          >
            {shortId}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`
              px-2 py-0.5 rounded text-xs font-semibold
              ${
                typeColor === "blue"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }
            `}
            >
              {type}
            </span>
            <span
              className={`
              px-2 py-0.5 rounded text-xs font-semibold
              ${
                categoryColor === "amber"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              }
            `}
            >
              {category}
            </span>
          </div>
          <p
            className={`text-sm font-medium mt-1 ${
              success ? "text-green-800" : "text-red-800"
            }`}
          >
            {success ? "✓ Scanned" : "✗ Error"}
          </p>
        </div>
      </div>
    </div>
  );
}
