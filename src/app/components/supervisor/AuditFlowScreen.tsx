/**
 * AuditFlowScreen.tsx
 * Enhanced 6-step field audit flow
 *
 * Step 0: Washer location preview + confirm start
 * Step 1: Uniform check (Yes/No)
 * Step 2: Customer lookup (mobile → auto-fill)
 * Step 3: Material checklist (package-specific)
 * Step 4: Process compliance (Yes/No + 4 video clips)
 * Step 5: Review + submit
 *
 * Scoring:
 *   Uniform     20pts
 *   Materials   30pts (−3 per missing item, min 0)
 *   Process     30pts
 *   Videos      20pts (−5 per missing clip)
 *   Pass ≥80 | Minor 60–79 | Major 40–59 | Failed <40
 */

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle, XCircle, AlertTriangle, MapPin, Phone,
  Camera, Video, User, Package, ClipboardCheck,
  ChevronRight, ChevronLeft, Loader2,
} from "lucide-react";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuditVideoClip {
  id: string;
  status: "UPLOAD_PENDING" | "UPLOADED";
  localBlobUrl: string;
  size: number;
  timestamp: string;
  clipNumber: number;
}

export interface AuditMaterialItem {
  id: string;
  name: string;
  icon: string;
  required: boolean;
  isPresent: boolean | null; // null = not checked yet
}

export interface EnhancedAuditSubmission {
  auditId: string;
  washerId: string;
  washerName: string;
  supervisorId: string;
  timestamp: string;

  // Step 0
  washerGPS: { lat: number; lng: number } | null;
  supervisorGPS: { lat: number; lng: number } | null;
  distanceMeters: number;
  gpsConfirmed: boolean;

  // Step 1
  uniformCompliant: boolean | null;

  // Step 2
  customerMobile: string;
  customerName: string;
  vehicleReg: string;
  packageType: string;
  subscriptionStatus: string;
  jobId: string;

  // Step 3
  materials: AuditMaterialItem[];
  missingMaterials: string[];

  // Step 4
  processCompliant: boolean | null;
  processNote: string;
  videoClips: AuditVideoClip[];

  // Score
  score: number;
  result: "PASS" | "MINOR" | "MAJOR" | "FAILED";
  flags: string[];
}

// ── Material lists ────────────────────────────────────────────────────────────

const MATERIAL_LISTS: Record<string, { id: string; name: string; icon: string; required: boolean }[]> = {
  EXPRESS_WASH: [
    { id: "bucket",    name: "Bucket",              icon: "🪣", required: true },
    { id: "hose",      name: "Water Hose",           icon: "🚿", required: true },
    { id: "mitt",      name: "Wash Mitt",            icon: "🧤", required: true },
    { id: "cloth1",    name: "Microfibre Cloth (1)", icon: "🧻", required: true },
    { id: "cloth2",    name: "Microfibre Cloth (2)", icon: "🧻", required: true },
    { id: "wheel",     name: "Wheel Brush",          icon: "🖌️", required: true },
  ],
  SMART_WASH: [
    { id: "bucket",    name: "Bucket",              icon: "🪣", required: true },
    { id: "hose",      name: "Water Hose",           icon: "🚿", required: true },
    { id: "mitt",      name: "Wash Mitt",            icon: "🧤", required: true },
    { id: "cloth1",    name: "Microfibre Cloth (1)", icon: "🧻", required: true },
    { id: "cloth2",    name: "Microfibre Cloth (2)", icon: "🧻", required: true },
    { id: "wheel",     name: "Wheel Brush",          icon: "🖌️", required: true },
    { id: "shampoo",   name: "Shampoo Bottle",       icon: "🧴", required: true },
    { id: "vacuum",    name: "Interior Vacuum",      icon: "🌀", required: true },
    { id: "tyre",      name: "Tyre Shine",           icon: "⚫", required: true },
  ],
  ELITE_WASH: [
    { id: "bucket",    name: "Bucket",              icon: "🪣", required: true },
    { id: "hose",      name: "Water Hose",           icon: "🚿", required: true },
    { id: "mitt",      name: "Wash Mitt",            icon: "🧤", required: true },
    { id: "cloth1",    name: "Microfibre Cloth (1)", icon: "🧻", required: true },
    { id: "cloth2",    name: "Microfibre Cloth (2)", icon: "🧻", required: true },
    { id: "wheel",     name: "Wheel Brush",          icon: "🖌️", required: true },
    { id: "shampoo",   name: "Shampoo Bottle",       icon: "🧴", required: true },
    { id: "vacuum",    name: "Interior Vacuum",      icon: "🌀", required: true },
    { id: "tyre",      name: "Tyre Shine",           icon: "⚫", required: true },
    { id: "wax",       name: "Wax Polish",           icon: "✨", required: true },
    { id: "dashboard", name: "Dashboard Cleaner",    icon: "🧹", required: true },
    { id: "glass",     name: "Glass Cleaner",        icon: "🪟", required: true },
    { id: "engine",    name: "Engine Dry Blower",    icon: "💨", required: true },
    { id: "fragrance", name: "Fragrance Spray",      icon: "🌸", required: true },
  ],
};

// Normalise incoming packageType to our keys
function normalisePkg(raw: string): string {
  const r = (raw || "").toUpperCase().replace(/\s+/g, "_");
  if (r.includes("ELITE")) return "ELITE_WASH";
  if (r.includes("SMART") || r.includes("PROTECT") || r.includes("STANDARD")) return "SMART_WASH";
  return "EXPRESS_WASH";
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function calcScore(
  uniform: boolean | null,
  materials: AuditMaterialItem[],
  process: boolean | null,
  videos: AuditVideoClip[]
): { score: number; result: "PASS" | "MINOR" | "MAJOR" | "FAILED"; flags: string[] } {
  const flags: string[] = [];
  let score = 0;

  // Uniform — 20 pts
  if (uniform === true)  score += 20;
  else if (uniform === false) flags.push("Washer not in uniform");

  // Materials — 30 pts
  const required = materials.filter(m => m.required);
  const missing  = required.filter(m => m.isPresent === false);
  const matScore = Math.max(0, 30 - missing.length * 3);
  score += matScore;
  missing.forEach(m => flags.push(`Missing material: ${m.name}`));

  // Process — 30 pts
  if (process === true)  score += 30;
  else if (process === false) flags.push("Process not followed");

  // Videos — 20 pts (4 clips × 5 pts each)
  const captured = videos.filter(v => v.localBlobUrl).length;
  score += Math.max(0, captured * 5);
  if (captured < 4) flags.push(`Only ${captured}/4 video clips captured`);

  const result: "PASS" | "MINOR" | "MAJOR" | "FAILED" =
    score >= 80 ? "PASS" :
    score >= 60 ? "MINOR" :
    score >= 40 ? "MAJOR" : "FAILED";

  return { score, result, flags };
}

// ── Distance helper ───────────────────────────────────────────────────────────

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface AuditFlowScreenProps {
  washerId: string;
  washerName: string;
  washerGPS?: { lat: number; lng: number };
  washerSelfieUrl?: string;
  supervisorId: string;
  supervisorName: string;
  packageType?: string;
  onSubmit: (submission: EnhancedAuditSubmission) => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AuditFlowScreen({
  washerId,
  washerName,
  washerGPS,
  washerSelfieUrl,
  supervisorId,
  supervisorName,
  packageType,
  onSubmit,
  onCancel,
}: AuditFlowScreenProps) {
  const [step, setStep] = useState(0);

  // Step 0
  const [supGPS, setSupGPS]         = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [distM, setDistM]           = useState<number | null>(null);

  // Step 1
  const [uniform, setUniform]       = useState<boolean | null>(null);

  // Step 2
  const [mobile, setMobile]         = useState("");
  const [custName, setCustName]     = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [detectedPkg, setDetectedPkg] = useState(packageType || "EXPRESS_WASH");
  const [subStatus, setSubStatus]   = useState("");
  const [jobId, setJobId]           = useState("");
  const [custLookupDone, setCustLookupDone] = useState(false);

  // Step 3
  const pkgKey = normalisePkg(detectedPkg);
  const [materials, setMaterials]   = useState<AuditMaterialItem[]>(() =>
    (MATERIAL_LISTS[pkgKey] || MATERIAL_LISTS.EXPRESS_WASH).map(m => ({ ...m, isPresent: null }))
  );

  // Step 4
  const [processOk, setProcessOk]   = useState<boolean | null>(null);
  const [processNote, setProcessNote] = useState("");
  const [videos, setVideos]         = useState<AuditVideoClip[]>([]);
  const videoInputRef               = useRef<HTMLInputElement>(null);

  // Get supervisor GPS on mount
  useEffect(() => {
    setGpsLoading(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setSupGPS(gps);
        if (washerGPS) setDistM(distanceMeters(gps, washerGPS));
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { timeout: 8000 }
    );
  }, []);

  // Refresh materials when package changes
  useEffect(() => {
    const key = normalisePkg(detectedPkg);
    setMaterials((MATERIAL_LISTS[key] || MATERIAL_LISTS.EXPRESS_WASH).map(m => ({ ...m, isPresent: null })));
  }, [detectedPkg]);

  // ── Customer lookup ─────────────────────────────────────────────────────────

  const handleMobileLookup = () => {
    if (mobile.replace(/\D/g, "").length < 10) return;
    const num = mobile.replace(/\D/g, "");

    // Source 1: customers
    try {
      const raw = localStorage.getItem("cleancar_CITY-SURAT_customers");
      if (raw) {
        const custs: any[] = JSON.parse(raw);
        const c = custs.find(x => x.phone?.replace(/\D/g,"") === num || x.mobile?.replace(/\D/g,"") === num);
        if (c) {
          setCustName(`${c.firstName || ""} ${c.lastName || ""}`.trim());
          setVehicleReg(c.vehicleReg || c.vehicle?.registration || "");
          // find subscription
          try {
            const rawS = localStorage.getItem("cleancar_CITY-SURAT_subscriptions");
            if (rawS) {
              const subs: any[] = JSON.parse(rawS);
              const s = subs.find(x => x.customerId === c.customerId && x.status === "Active");
              if (s) {
                setDetectedPkg(s.packageType || s.packageName || "EXPRESS_WASH");
                setSubStatus(s.status || "Active");
              }
            }
          } catch (_) {}
          // find today's job
          try {
            const rawJ = localStorage.getItem("cleancar_CITY-SURAT_jobs");
            if (rawJ) {
              const today = new Date().toISOString().split("T")[0];
              const jobs: any[] = JSON.parse(rawJ);
              const j = jobs.find(x => x.customerId === c.customerId && x.scheduledDate === today && x.washerId === washerId);
              if (j) setJobId(j.jobId);
            }
          } catch (_) {}
          setCustLookupDone(true);
          toast.success(`Customer found: ${custName || "loaded"}`);
          return;
        }
      }
    } catch (_) {}

    // Source 2: web invoices
    try {
      const rawI = localStorage.getItem("cleancar_web_invoices");
      if (rawI) {
        const invs: any[] = JSON.parse(rawI);
        const inv = invs.find(x => x.customerPhone?.replace(/\D/g,"") === num || x.mobile?.replace(/\D/g,"") === num);
        if (inv) {
          setCustName(inv.customerName || inv.name || "");
          setVehicleReg(inv.vehicleReg || "");
          setDetectedPkg(inv.items?.[0]?.name || "EXPRESS_WASH");
          setSubStatus("Buy Page Order");
          setCustLookupDone(true);
          toast.success("Customer found in web invoices");
          return;
        }
      }
    } catch (_) {}

    // Source 3: EMPLOYEE_DATABASE_RECORDS (staff)
    try {
      const rawE = localStorage.getItem("EMPLOYEE_DATABASE_RECORDS");
      if (rawE) {
        const emps: any[] = JSON.parse(rawE);
        const e = emps.find(x => x.mobile?.replace(/\D/g,"") === num || x.loginMobile?.replace(/\D/g,"") === num);
        if (e) {
          setCustName(e.fullName || `${e.firstName} ${e.lastName}`.trim());
          setCustLookupDone(true);
          toast.success("Found in employee records");
          return;
        }
      }
    } catch (_) {}

    toast.error("No customer found for this mobile number");
  };

  // ── Material toggle ─────────────────────────────────────────────────────────

  const toggleMaterial = (id: string, present: boolean) => {
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, isPresent: present } : m));
    if (!present) {
      const item = materials.find(m => m.id === id);
      toast.warning(`Missing: ${item?.name} — flagged as non-compliant`);
    }
  };

  // ── Video capture ───────────────────────────────────────────────────────────

  const handleVideoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const clipNum = videos.length + 1;
    setVideos(prev => [...prev, {
      id: `VID-${Date.now()}`,
      status: "UPLOAD_PENDING",
      localBlobUrl: blobUrl,
      size: file.size,
      timestamp: new Date().toISOString(),
      clipNumber: clipNum,
    }]);
    toast.success(`Clip ${clipNum}/4 captured`);
    if (e.target) e.target.value = "";
  };

  const removeVideo = (id: string) => {
    setVideos(prev => {
      const v = prev.find(x => x.id === id);
      if (v?.localBlobUrl) URL.revokeObjectURL(v.localBlobUrl);
      return prev.filter(x => x.id !== id).map((x, i) => ({ ...x, clipNumber: i + 1 }));
    });
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = () => {
    const { score, result, flags } = calcScore(uniform, materials, processOk, videos);

    const submission: EnhancedAuditSubmission = {
      auditId: `AUDIT-${Date.now()}`,
      washerId,
      washerName,
      supervisorId,
      timestamp: new Date().toISOString(),
      washerGPS: washerGPS || null,
      supervisorGPS: supGPS,
      distanceMeters: distM || 0,
      gpsConfirmed: true,
      uniformCompliant: uniform,
      customerMobile: mobile,
      customerName: custName,
      vehicleReg,
      packageType: detectedPkg,
      subscriptionStatus: subStatus,
      jobId,
      materials,
      missingMaterials: materials.filter(m => m.isPresent === false).map(m => m.name),
      processCompliant: processOk,
      processNote,
      videoClips: videos,
      score,
      result,
      flags,
    };

    // Persist to localStorage
    try {
      const key = `SUPERVISOR_AUDITS_${washerId}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push(submission);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}

    onSubmit(submission);
  };

  // ── Step validation ─────────────────────────────────────────────────────────

  const canProceed = (): boolean => {
    if (step === 0) return true; // always can confirm location
    if (step === 1) return uniform !== null;
    if (step === 2) return custLookupDone && custName.length > 0;
    if (step === 3) return materials.every(m => m.isPresent !== null);
    if (step === 4) return processOk !== null && videos.length === 4;
    return true;
  };

  const resultColor = (r: "PASS" | "MINOR" | "MAJOR" | "FAILED") =>
    r === "PASS" ? "text-green-600" : r === "MINOR" ? "text-amber-600" : "text-red-600";

  const { score: previewScore, result: previewResult, flags: previewFlags } =
    calcScore(uniform, materials, processOk, videos);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold">Field Audit</h1>
            <p className="text-xs text-purple-200">{washerName}</p>
          </div>
          <button onClick={onCancel} className="text-purple-200 text-sm underline">Cancel</button>
        </div>
        {/* Progress */}
        <div className="flex gap-1">
          {["Location","Uniform","Customer","Materials","Process","Submit"].map((label, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-white" : "bg-white/30"}`} />
              <p className="text-xs text-purple-200 mt-0.5 text-center hidden sm:block">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">

        {/* ── STEP 0: Location ──────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Washer Location</h2>

            {/* Washer card */}
            <Card className="border-2 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  {washerSelfieUrl ? (
                    <img src={washerSelfieUrl} alt={washerName}
                      className="h-14 w-14 rounded-full object-cover border-2 border-purple-300" />
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-7 w-7 text-purple-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-gray-900 text-base">{washerName}</p>
                    <p className="text-xs text-gray-500">{washerId}</p>
                  </div>
                </div>

                {washerGPS ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Washer GPS</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {washerGPS.lat.toFixed(4)}, {washerGPS.lng.toFixed(4)}
                        </p>
                      </div>
                      <MapPin className="h-5 w-5 text-purple-500" />
                    </div>

                    {gpsLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />Getting your location...
                      </div>
                    ) : distM !== null ? (
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                        distM > 500 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                      }`}>
                        {distM > 500 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        {distM > 500
                          ? `GPS Mismatch — ${Math.round(distM)}m away (>500m threshold)`
                          : `${Math.round(distM)}m away — Within range`}
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://www.google.com/maps?q=${washerGPS.lat},${washerGPS.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg"
                      >
                        <MapPin className="h-4 w-4" />
                        View on Maps
                      </a>
                      {distM !== null && distM > 500 && (
                        <button
                          onClick={() => {
                            toast.warning("GPS Mismatch reported. Ops Manager notified.");
                            setStep(1);
                          }}
                          className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-lg"
                        >
                          <AlertTriangle className="h-4 w-4" />
                          Report Mismatch
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                    No GPS location available for this washer. Proceeding without location verification.
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
              onClick={() => setStep(1)}
            >
              Confirm Location & Start Audit
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* ── STEP 1: Uniform ───────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 1 — Uniform Check</h2>
            <Card className="border-2 border-gray-200">
              <CardContent className="p-6 text-center">
                <div className="mb-2">
                  {washerSelfieUrl ? (
                    <img src={washerSelfieUrl} alt={washerName}
                      className="h-20 w-20 rounded-full object-cover border-4 border-purple-300 mx-auto mb-3" />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                      <User className="h-10 w-10 text-purple-600" />
                    </div>
                  )}
                  <p className="font-bold text-gray-900 text-lg">{washerName}</p>
                  <p className="text-sm text-gray-500 mt-1">Is the washer in proper uniform?</p>
                  <p className="text-xs text-gray-400 mt-0.5">(Company t-shirt, ID card, clean appearance)</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <button
                    onClick={() => {
                      setUniform(true);
                      toast.success("Uniform compliant ✓");
                    }}
                    className={`h-16 rounded-xl font-bold text-base flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      uniform === true
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                    }`}
                  >
                    <CheckCircle className="h-6 w-6" />
                    Yes — In Uniform
                  </button>
                  <button
                    onClick={() => {
                      setUniform(false);
                      toast.warning("Non-compliance flagged. Escalation logged.");
                    }}
                    className={`h-16 rounded-xl font-bold text-base flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      uniform === false
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                    }`}
                  >
                    <XCircle className="h-6 w-6" />
                    No — Not in Uniform
                  </button>
                </div>
                {uniform === false && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                    <p className="text-xs font-semibold text-red-700 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Non-compliance flagged — audit continues with penalty
                    </p>
                    <p className="text-xs text-red-600 mt-1">−20 points deducted from score</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 2: Customer ──────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 2 — Customer Details</h2>
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Customer Mobile Number</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={e => { setMobile(e.target.value); setCustLookupDone(false); }}
                      placeholder="Enter 10-digit mobile"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm"
                    />
                    <button
                      onClick={handleMobileLookup}
                      className="px-4 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-lg"
                    >
                      Lookup
                    </button>
                  </div>
                </div>

                {custLookupDone && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-bold text-green-700">Customer Found</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Name</p>
                        <p className="font-semibold text-gray-900">{custName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Vehicle</p>
                        <p className="font-semibold text-gray-900">{vehicleReg || "—"}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Package</p>
                        <p className="font-semibold text-gray-900">
                          {detectedPkg.split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                          {subStatus || "Active"}
                        </Badge>
                      </div>
                      {jobId && (
                        <div className="col-span-2">
                          <p className="text-gray-500">Job ID</p>
                          <p className="font-semibold text-gray-900">{jobId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {!custLookupDone && (
                  <p className="text-xs text-gray-400 text-center">
                    Enter the customer's mobile number and tap Lookup to auto-fill details
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 3: Materials ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 3 — Material Check</h2>
            <p className="text-xs text-gray-500">
              Package: <strong>{detectedPkg.split("_").map(w => w.charAt(0)+w.slice(1).toLowerCase()).join(" ")}</strong>
              {" · "}{materials.length} items to check
            </p>
            <div className="space-y-2">
              {materials.map(mat => (
                <Card key={mat.id} className={`border-2 transition-all ${
                  mat.isPresent === true ? "border-green-300 bg-green-50" :
                  mat.isPresent === false ? "border-red-300 bg-red-50" :
                  "border-gray-200 bg-white"
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{mat.icon}</span>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{mat.name}</p>
                          {mat.required && <p className="text-xs text-gray-400">Required</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleMaterial(mat.id, true)}
                          className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                            mat.isPresent === true
                              ? "bg-green-600 border-green-600 text-white"
                              : "border-green-300 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => toggleMaterial(mat.id, false)}
                          className={`h-9 w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                            mat.isPresent === false
                              ? "bg-red-600 border-red-600 text-white"
                              : "border-red-300 text-red-600 hover:bg-red-50"
                          }`}
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {materials.some(m => m.isPresent === false) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700">
                  {materials.filter(m => m.isPresent === false).length} missing item(s) — flagged, −3 pts each
                </p>
              </div>
            )}
            {!materials.every(m => m.isPresent !== null) && (
              <p className="text-xs text-amber-600 text-center">Tick all items to proceed</p>
            )}
          </div>
        )}

        {/* ── STEP 4: Process + Videos ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 4 — Process Compliance</h2>

            {/* Yes/No */}
            <Card className="border-2 border-gray-200">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-gray-800 mb-3">
                  Is the washer following the correct wash process?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setProcessOk(true); toast.success("Process compliant ✓"); }}
                    className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                      processOk === true
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-green-50 text-green-700 border-green-300"
                    }`}
                  >
                    <CheckCircle className="h-5 w-5" /> Yes
                  </button>
                  <button
                    onClick={() => { setProcessOk(false); toast.warning("Process non-compliance flagged"); }}
                    className={`h-14 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${
                      processOk === false
                        ? "bg-red-600 text-white border-red-600"
                        : "bg-red-50 text-red-700 border-red-300"
                    }`}
                  >
                    <XCircle className="h-5 w-5" /> No
                  </button>
                </div>
                {processOk === false && (
                  <div className="mt-3">
                    <label className="text-xs font-bold text-gray-600">Reason (required)</label>
                    <textarea
                      value={processNote}
                      onChange={e => setProcessNote(e.target.value)}
                      placeholder="Describe what process was not followed..."
                      rows={2}
                      className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Video clips */}
            <Card className="border-2 border-indigo-200 bg-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Video Evidence</p>
                    <p className="text-xs text-gray-500">Record 4 clips of the wash in progress</p>
                  </div>
                  <Badge variant="outline" className={`${videos.length === 4 ? "bg-green-100 text-green-700 border-green-300" : "bg-amber-100 text-amber-700 border-amber-300"}`}>
                    {videos.length}/4 clips
                  </Badge>
                </div>

                {/* Captured clips */}
                {videos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {videos.map(v => (
                      <div key={v.id} className="relative bg-black rounded-lg overflow-hidden aspect-video">
                        <video src={v.localBlobUrl} className="w-full h-full object-cover" />
                        <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                          Clip {v.clipNumber}
                        </div>
                        <button
                          onClick={() => removeVideo(v.id)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs"
                        >×</button>
                        <div className="absolute bottom-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded">
                          Upload Pending
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Record button */}
                {videos.length < 4 && (
                  <>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleVideoCapture}
                    />
                    <button
                      onClick={() => videoInputRef.current?.click()}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold rounded-lg text-sm"
                    >
                      <Video className="h-4 w-4" />
                      Record Clip {videos.length + 1}
                    </button>
                  </>
                )}

                {videos.length < 4 && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    {4 - videos.length} more clip{4 - videos.length > 1 ? "s" : ""} required
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── STEP 5: Submit ────────────────────────────────────────────────── */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900">Step 5 — Review & Submit</h2>

            {/* Score card */}
            <Card className={`border-2 ${
              previewResult === "PASS" ? "border-green-300 bg-green-50" :
              previewResult === "MINOR" ? "border-amber-300 bg-amber-50" :
              "border-red-300 bg-red-50"
            }`}>
              <CardContent className="p-4 text-center">
                <p className="text-4xl font-black text-gray-900">{previewScore}</p>
                <p className="text-xs text-gray-500 mb-2">/ 100</p>
                <Badge variant="outline" className={`text-sm font-bold px-4 py-1 ${
                  previewResult === "PASS" ? "bg-green-100 text-green-700 border-green-400" :
                  previewResult === "MINOR" ? "bg-amber-100 text-amber-700 border-amber-400" :
                  previewResult === "MAJOR" ? "bg-orange-100 text-orange-700 border-orange-400" :
                  "bg-red-100 text-red-700 border-red-400"
                }`}>
                  {previewResult}
                </Badge>
              </CardContent>
            </Card>

            {/* Score breakdown */}
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-2">
                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Score Breakdown</p>
                {[
                  { label: "Uniform", pts: uniform === true ? 20 : 0, max: 20 },
                  { label: "Materials", pts: Math.max(0, 30 - materials.filter(m => m.isPresent === false).length * 3), max: 30 },
                  { label: "Process", pts: processOk === true ? 30 : 0, max: 30 },
                  { label: "Videos", pts: Math.max(0, videos.length * 5), max: 20 },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className={`font-bold ${row.pts === row.max ? "text-green-600" : row.pts > 0 ? "text-amber-600" : "text-red-600"}`}>
                      {row.pts} / {row.max}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Flags */}
            {previewFlags.length > 0 && (
              <Card className="border-2 border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {previewFlags.length} Flag(s) Recorded
                  </p>
                  {previewFlags.map((f, i) => (
                    <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-red-400 flex-shrink-0" />
                      {f}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card className="border border-gray-200">
              <CardContent className="p-4 space-y-1 text-xs text-gray-600">
                <div className="flex justify-between"><span>Washer</span><span className="font-semibold text-gray-900">{washerName}</span></div>
                <div className="flex justify-between"><span>Customer</span><span className="font-semibold text-gray-900">{custName || "—"}</span></div>
                <div className="flex justify-between"><span>Vehicle</span><span className="font-semibold text-gray-900">{vehicleReg || "—"}</span></div>
                <div className="flex justify-between"><span>Package</span><span className="font-semibold text-gray-900">{detectedPkg.split("_").map(w=>w.charAt(0)+w.slice(1).toLowerCase()).join(" ")}</span></div>
                <div className="flex justify-between"><span>Video clips</span><span className="font-semibold text-gray-900">{videos.length}/4 (Upload pending)</span></div>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
              🔒 This audit record is immutable once submitted
            </p>

            <Button
              className="w-full h-14 bg-purple-600 hover:bg-purple-700 text-white font-bold text-base"
              onClick={handleSubmit}
            >
              <ClipboardCheck className="h-5 w-5 mr-2" />
              Submit Audit — {previewScore}/100
            </Button>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────────────────── */}
        {step > 0 && step < 5 && (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => setStep(s => s - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              className="flex-1 h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
              disabled={!canProceed()}
              onClick={() => setStep(s => s + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 4 && (
          <Button
            className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
            disabled={!canProceed()}
            onClick={() => setStep(5)}
          >
            Review & Submit <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ── Re-export AuditResultScreen placeholder (existing) ───────────────────────
export { AuditResultScreen } from "./FieldAuditScreen";
