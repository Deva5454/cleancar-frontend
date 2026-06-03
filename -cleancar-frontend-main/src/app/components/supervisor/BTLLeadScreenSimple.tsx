/**
 * BTLLeadScreenSimple.tsx
 *
 * Supervisor BTL Lead Generation screen.
 * Updated to support BTL Activity Mode (Sales Manager Module v2.0 §14):
 *  - When an active BTL session exists, lead form shows session context banner
 *  - Submitted leads are auto-tagged with smId, locationId, btlActivityId
 *  - Session lead count is incremented on every submission
 *  - If no active session: "Free Capture" mode (no SM attribution)
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Plus, TrendingUp, Navigation, MapPin } from "lucide-react";
import { systemStateService } from "../../services/systemStateService";
import { btlAssignmentService, type BTLActivitySession } from "../../services/btlAssignmentService";
import type { VehicleType, InterestLevel } from "../../services/btlLeadService";
import { logger } from "../../services/logger";

export interface BTLLeadScreenSimpleProps {
  leads: any[];
  metrics: any;
  onSubmitLead: (
    name: string,
    mobile: string,
    vehicleType: any,
    location: { lat: number; lng: number; address: string },
    interestLevel: any,
    gpsLocation: { lat: number; lng: number },
    // BTL Activity Mode attribution (optional — only when session active)
    btlContext?: {
      smId: string;
      locationId: string;
      btlActivityId: string;
      sessionId: string;
    }
  ) => void;
  onViewPipeline: (leadId: string) => void;
}

export function BTLLeadScreenSimple({ leads, metrics, onSubmitLead, onViewPipeline }: BTLLeadScreenSimpleProps) {
  const [showCaptureForm, setShowCaptureForm] = useState(false);
  const activeSession: BTLActivitySession | null = btlAssignmentService.getActiveSession();
  logger.log("🎯 BTLLeadScreenSimple RENDERED with", leads.length, "leads");

  const handleLeadSubmitted = (
    name: string, mobile: string, vehicleType: any,
    location: any, interestLevel: any, gps: any
  ) => {
    // Build BTL attribution context from active session
    const btlContext = activeSession ? {
      smId:          activeSession.smId,
      locationId:    activeSession.locationId,
      btlActivityId: activeSession.btlActivityId,
      sessionId:     activeSession.sessionId,
    } : undefined;

    onSubmitLead(name, mobile, vehicleType, location, interestLevel, gps, btlContext);

    // Increment session lead count
    if (activeSession) {
      btlAssignmentService.incrementLeadCount(activeSession.sessionId);
    }

    setShowCaptureForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="bg-indigo-600 text-white p-4">
        <h1 className="text-xl font-bold">BTL Lead Generation</h1>
        <p className="text-sm text-indigo-200">
          {activeSession ? "BTL Activity Mode — leads auto-attributed to SM" : "Free Capture Mode"}
        </p>

        {/* Active session banner */}
        {activeSession && (
          <div className="mt-2 bg-amber-500 rounded-lg p-2 text-amber-900 text-xs font-medium">
            🔴 ACTIVE SESSION · Location: {activeSession.locationId} · SM: {activeSession.smId}<br />
            Activity ID: {activeSession.btlActivityId} · Leads this session: {activeSession.leadsSubmitted}
          </div>
        )}

        <Button
          className="w-full mt-3 h-12 bg-white text-indigo-700 hover:bg-indigo-50 font-bold"
          onClick={() => setShowCaptureForm(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          {activeSession ? "Capture BTL Lead (attributed to SM)" : "Capture New Lead"}
        </Button>
      </div>

      {/* METRICS */}
      <div className="p-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total", value: metrics?.totalLeads || 0, color: "green" },
          { label: "Converted", value: metrics?.converted || 0, color: "blue" },
          { label: "Pending", value: metrics?.pending || 0, color: "amber" },
        ].map(({ label, value, color }) => (
          <Card key={label} className={`bg-${color}-50 border-2 border-${color}-300`}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold text-${color}-700`}>{value}</p>
              <p className={`text-xs text-${color}-600 font-medium`}>{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LEADS LIST */}
      <div className="px-4 space-y-3">
        <h2 className="text-base font-bold text-gray-800">All Leads ({leads.length})</h2>

        {leads.length === 0 ? (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-8 text-center">
              <MapPin className="h-10 w-10 mx-auto text-gray-300 mb-3" />
              <p className="font-semibold text-gray-500">No leads yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap "Capture New Lead" to add your first BTL lead.</p>
            </CardContent>
          </Card>
        ) : (
          leads.map((lead, index) => (
            <Card key={lead.id || index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-900">{lead.name}</p>
                    <p className="text-sm text-gray-500">{lead.mobile}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs">{lead.status}</Badge>
                </div>

                {/* SM attribution badge */}
                {lead.smId && (
                  <div className="mb-2 px-2 py-1 bg-indigo-50 border border-indigo-200 rounded text-xs text-indigo-700">
                    🏷 SM: {lead.smId} · Location: {lead.locationId}
                  </div>
                )}

                {lead.assignedToTSEName && (
                  <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded">
                    <p className="text-xs text-indigo-700">
                      📞 Assigned to: <span className="font-bold">{lead.assignedToTSEName}</span>
                    </p>
                  </div>
                )}

                <div className="text-sm text-gray-600 space-y-0.5">
                  <p>Vehicle: {lead.vehicleType}</p>
                  <p>Interest: {lead.interestLevel}</p>
                  <p>Location: {lead.location?.address || "N/A"}</p>
                </div>

                <Button size="sm" variant="outline" className="w-full mt-3"
                  onClick={() => onViewPipeline(lead.id)}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Pipeline
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Lead Capture Form Modal */}
      {showCaptureForm && (
        <LeadCaptureForm
          activeSession={activeSession}
          onSubmit={handleLeadSubmitted}
          onCancel={() => setShowCaptureForm(false)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LEAD CAPTURE FORM
// ═══════════════════════════════════════════════════════════════════════════════

interface LeadCaptureFormProps {
  activeSession: BTLActivitySession | null;
  onSubmit: (
    name: string, mobile: string, vehicleType: VehicleType,
    location: { lat: number; lng: number; address: string },
    interestLevel: InterestLevel,
    gpsLocation: { lat: number; lng: number }
  ) => void;
  onCancel: () => void;
}

function LeadCaptureForm({ activeSession, onSubmit, onCancel }: LeadCaptureFormProps) {
  const [name, setName]               = useState("");
  const [mobile, setMobile]           = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | undefined>();
  const [location, setLocation]       = useState<{ lat: number; lng: number; address: string } | undefined>();
  const [interestLevel, setInterestLevel] = useState<InterestLevel | undefined>();
  const [gpsEnabled, setGpsEnabled]   = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean; leadId?: string; submittedDate?: Date;
  } | null>(null);

  const handleMobileChange = (value: string) => {
    setMobile(value);
    if (value.length === 10) {
      setDuplicateCheck(systemStateService.checkDuplicateLead(value));
    } else {
      setDuplicateCheck(null);
    }
  };

  const captureGPS = () => {
    setGpsEnabled(true);
    // In production: use getCurrentGps() from gpsUtils
    // For demo: use simulated Surat coords
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, address: "Current Location (GPS)" }),
        ()  => setLocation({ lat: 21.1702, lng: 72.8311, address: "Surat, Gujarat (simulated)" })
      );
    } else {
      setLocation({ lat: 21.1702, lng: 72.8311, address: "Surat, Gujarat (simulated)" });
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name?.trim() || name.trim().length < 2) e.name = "Name required (min 2 chars)";
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile))  e.mobile = "Valid 10-digit mobile required";
    if (!vehicleType)   e.vehicleType   = "Vehicle type required";
    if (!location)      e.location      = "GPS location required";
    if (!interestLevel) e.interestLevel = "Interest level required";
    if (!gpsEnabled)    e.gps           = "GPS capture is mandatory";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit(name, mobile, vehicleType!, location!, interestLevel!, { lat: location!.lat, lng: location!.lng });
  };

  const allFilled = name && mobile && vehicleType && location && interestLevel && gpsEnabled;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900">Capture BTL Lead</h2>
            {activeSession ? (
              <p className="text-xs text-indigo-600 font-medium">
                🔴 Session active — auto-tagged to {activeSession.locationId}
              </p>
            ) : (
              <p className="text-xs text-gray-500">Free capture — no SM attribution</p>
            )}
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Attribution info */}
          {activeSession && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-xs text-indigo-700 space-y-0.5">
              <p className="font-semibold">Auto-attribution (system-applied):</p>
              <p>SM ID: {activeSession.smId}</p>
              <p>Location ID: {activeSession.locationId}</p>
              <p>BTL Activity ID: {activeSession.btlActivityId}</p>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
            <input type="text" className={`w-full h-11 px-3 border rounded-xl text-sm ${errors.name ? "border-red-400" : "border-gray-300"}`}
              placeholder="Customer name" value={name} onChange={e => setName(e.target.value)} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Mobile *</label>
            <input type="tel" className={`w-full h-11 px-3 border rounded-xl text-sm ${errors.mobile ? "border-red-400" : "border-gray-300"}`}
              placeholder="10-digit mobile" value={mobile}
              onChange={e => handleMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile}</p>}
            {duplicateCheck?.isDuplicate && (
              <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                ⚠ Duplicate: Lead {duplicateCheck.leadId} submitted on {duplicateCheck.submittedDate?.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Vehicle Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["4W_SEDAN", "4W_SUV", "2W_BIKE", "2W_SCOOTER"] as VehicleType[]).map(type => (
                <button key={type} onClick={() => setVehicleType(type)}
                  className={`h-10 rounded-xl border-2 text-sm font-semibold ${
                    vehicleType === type ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700"
                  }`}>
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
            {errors.vehicleType && <p className="text-xs text-red-500 mt-1">{errors.vehicleType}</p>}
          </div>

          {/* GPS */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">GPS Location *</label>
            <button onClick={captureGPS}
              className={`w-full h-12 rounded-xl border-2 text-sm font-semibold flex items-center justify-center gap-2 ${
                location ? "border-green-400 bg-green-50 text-green-700" : "border-gray-300 text-gray-600"
              }`}>
              <Navigation className="h-4 w-4" />
              {location ? `✓ ${location.address}` : "Capture GPS Location"}
            </button>
            {errors.gps && <p className="text-xs text-red-500 mt-1">{errors.gps}</p>}
          </div>

          {/* Interest Level */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Interest Level *</label>
            <div className="grid grid-cols-3 gap-2">
              {(["HOT", "WARM", "COLD"] as InterestLevel[]).map(level => (
                <button key={level} onClick={() => setInterestLevel(level)}
                  className={`h-10 rounded-xl border-2 text-sm font-bold ${
                    interestLevel === level
                      ? level === "HOT"  ? "border-red-500 bg-red-50 text-red-700"
                      : level === "WARM" ? "border-amber-500 bg-amber-50 text-amber-700"
                      :                   "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600"
                  }`}>
                  {level}
                </button>
              ))}
            </div>
            {errors.interestLevel && <p className="text-xs text-red-500 mt-1">{errors.interestLevel}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!allFilled}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40">
              Submit Lead
            </Button>
          </div>
          {!allFilled && <p className="text-xs text-center text-gray-400">All fields required</p>}
        </div>
      </div>
    </div>
  );
}
