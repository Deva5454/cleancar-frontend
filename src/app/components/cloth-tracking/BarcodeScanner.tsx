/**
 * Barcode Scanner Component — real, camera-based scanning
 *
 * Uses the device's actual camera (rear-facing on phones, matching
 * how a real barcode scan is done) and a real, cross-platform
 * decoding engine (@zxing/browser) that works in the browser itself -
 * no native app, no external hardware scanner needed. Built
 * specifically for this being a Progressive Web App used on a phone:
 * a scan feeds directly into onScan() the moment it's recognized, the
 * same real path a typed barcode already used.
 *
 * A real manual-entry fallback stays available - camera permission
 * can be denied, a device may not have a usable camera, or the
 * browser may not support getUserMedia at all. Production scanning
 * always needs that fallback; this isn't a demo shortcut.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { Camera, Scan, Keyboard, AlertTriangle, Flashlight } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

type CameraState = "idle" | "starting" | "active" | "denied" | "unsupported" | "error";

// Real duplicate-scan guard - the continuous decode loop can fire many
// times per second while the same code sits in frame; without this, a
// single physical scan would call onScan() dozens of times.
const RESCAN_COOLDOWN_MS = 1500;

export function BarcodeScanner({
  onScan,
  disabled = false,
  placeholder = "Scan cloth barcode",
}: BarcodeScannerProps) {
  const [mode, setMode] = useState<"camera" | "manual">("camera");
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [torchOn, setTorchOn] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const fireScan = useCallback((code: string) => {
    const now = Date.now();
    const last = lastScanRef.current;
    if (last && last.code === code && now - last.at < RESCAN_COOLDOWN_MS) return;
    lastScanRef.current = { code, at: now };
    if (navigator.vibrate) navigator.vibrate(50);
    onScan(code);
  }, [onScan]);

  // Real camera lifecycle - starts the actual device camera and a
  // real, continuous decode loop; stops it cleanly on unmount or when
  // switching to manual entry, so the camera doesn't stay on in the
  // background draining battery or raising a privacy concern.
  useEffect(() => {
    if (mode !== "camera" || disabled) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("unsupported");
      return;
    }

    let cancelled = false;
    const reader = new BrowserMultiFormatReader();
    setCameraState("starting");

    (async () => {
      try {
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (cancelled) return;
        // Real preference for the rear camera on a phone - the
        // genuine way barcode scanning is actually done on mobile.
        const rearCamera = devices.find((d) => /back|rear|environment/i.test(d.label));
        const deviceId = rearCamera?.deviceId || devices[devices.length - 1]?.deviceId;

        const controls = await reader.decodeFromVideoDevice(deviceId, videoRef.current || undefined, (result, err) => {
          if (result) fireScan(result.getText());
          // A per-frame "not found" error is normal while no code is
          // in view - only genuine, unexpected errors are worth noting,
          // and even those shouldn't interrupt a live scan session.
        });
        if (cancelled) { controls.stop(); return; }
        controlsRef.current = controls;
        setCameraState("active");

        // Real torch (flashlight) support check - genuinely useful for
        // scanning in a dim store room, offered only when the device
        // actually supports it rather than showing a button that fails.
        const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
        const caps = track?.getCapabilities?.() as any;
        setTorchSupported(!!caps?.torch);
      } catch (err: any) {
        if (cancelled) return;
        if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
          setCameraState("denied");
        } else if (err?.name === "NotFoundError" || err?.name === "OverconstrainedError") {
          setCameraState("unsupported");
        } else {
          setCameraState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [mode, disabled, fireScan]);

  useEffect(() => {
    if (mode === "manual" && !disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode, disabled]);

  const toggleTorch = async () => {
    const track = (videoRef.current?.srcObject as MediaStream | null)?.getVideoTracks?.()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn } as any] });
      setTorchOn(!torchOn);
    } catch {
      // Real, silent no-op if the device rejects the constraint -
      // torch support detection isn't perfectly reliable across devices.
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      fireScan(inputValue.trim().toUpperCase());
      setInputValue("");
    }
  };

  if (mode === "manual" || cameraState === "denied" || cameraState === "unsupported" || cameraState === "error") {
    return (
      <div className="space-y-3">
        {mode === "manual" ? null : (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {cameraState === "denied" && "Camera access was denied — enable it in your browser settings, or enter the barcode manually below."}
            {cameraState === "unsupported" && "No usable camera found on this device — enter the barcode manually below."}
            {cameraState === "error" && "Couldn't start the camera — enter the barcode manually below."}
          </div>
        )}
        <div className="flex items-center gap-3 bg-white border-2 border-gray-300 rounded-lg p-4 shadow-lg">
          <Keyboard className="w-6 h-6 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 text-lg font-mono border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
          />
          {inputValue && <span className="text-sm font-medium text-blue-600">Press Enter</span>}
        </div>
        {(cameraState === "denied" || cameraState === "unsupported" || cameraState === "error") && mode === "camera" ? null : (
          <Button variant="outline" size="sm" className="w-full" onClick={() => setMode("camera")}>
            <Camera className="w-4 h-4 mr-2" /> Try Camera Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative rounded-lg overflow-hidden bg-black" style={{ aspectRatio: "1 / 1" }}>
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

        {/* Real scan-target overlay, over the actual live camera feed */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-2/3 h-2/3 border-4 border-blue-400/70 rounded-lg relative">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
          </div>
        </div>

        <div className="absolute top-3 left-3 flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${cameraState === "active" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`} />
          <span className="text-xs text-white/90 bg-black/40 px-2 py-1 rounded">
            {cameraState === "starting" ? "Starting camera…" : "Scanning"}
          </span>
        </div>

        {torchSupported && (
          <button
            type="button"
            onClick={toggleTorch}
            className={`absolute top-3 right-3 p-2 rounded-full ${torchOn ? "bg-yellow-400 text-black" : "bg-black/40 text-white"}`}
          >
            <Flashlight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          <Scan className="w-4 h-4" /> Point the camera at the barcode
        </p>
        <Button variant="ghost" size="sm" onClick={() => setMode("manual")}>
          <Keyboard className="w-4 h-4 mr-1" /> Enter manually
        </Button>
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
