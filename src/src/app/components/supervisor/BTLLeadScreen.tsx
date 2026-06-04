/**
 * BTL (Below The Line) Lead Generation
 * 5-field validation with GPS + duplicate detection
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  AlertCircle,
  Phone,
  CheckCircle,
  XCircle,
  Plus,
  MapPin,
  Navigation,
  TrendingUp,
} from "lucide-react";
import {
  DuplicateLeadAlert,
  OfflineBanner,
  LocalSaveToast,
  OfflineEntryTag,
} from "./SystemIndicators";
import { systemStateService } from "../../services/systemStateService";
import { logger } from "../../services/logger";
import type {
  BTLLead,
  LeadStatus,
  InterestLevel,
  VehicleType,
  LeadPipelineStage,
  SupervisorLeadMetrics,
} from "../../services/btlLeadService";

export interface BTLLeadScreenProps {
  leads: BTLLead[];
  metrics: SupervisorLeadMetrics;
  onSubmitLead: (
    name: string,
    mobile: string,
    vehicleType: VehicleType,
    location: { lat: number; lng: number; address: string },
    interestLevel: InterestLevel,
    gpsLocation: { lat: number; lng: number }
  ) => void;
  onViewPipeline: (leadId: string) => void;
}

export function BTLLeadScreen({ leads, metrics, onSubmitLead, onViewPipeline }: BTLLeadScreenProps) {
  const [showCaptureForm, setShowCaptureForm] = useState(false);

  // Debug logging
  logger.log("🎯 BTLLeadScreen rendered with", leads.length, "leads");
  logger.log("📊 Metrics:", metrics);

  const statusConfig: Record<LeadStatus, { label: string; color: string; icon: any }> = {
    PENDING: {
      label: "Pending",
      color: "bg-gray-100 text-gray-700 border-gray-300",
      icon: AlertCircle,
    },
    IN_TELESALES: {
      label: "In Telesales",
      color: "bg-blue-100 text-blue-700 border-blue-300",
      icon: Phone,
    },
    CONVERTED: {
      label: "Converted",
      color: "bg-green-100 text-green-700 border-green-300",
      icon: CheckCircle,
    },
    DISQUALIFIED: {
      label: "Disqualified",
      color: "bg-red-100 text-red-700 border-red-300",
      icon: XCircle,
    },
    EXPIRED: {
      label: "Expired",
      color: "bg-orange-100 text-orange-700 border-orange-300",
      icon: XCircle,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* DEBUG PANEL - TEMPORARY */}
      <div className="bg-yellow-100 border-2 border-yellow-600 p-3 m-4">
        <p className="text-sm font-bold text-yellow-900">🔍 DEBUG INFO:</p>
        <p className="text-xs text-yellow-800">Leads array length: {leads.length}</p>
        <p className="text-xs text-yellow-800">Metrics total: {metrics.totalLeads}</p>
        <p className="text-xs text-yellow-800">Check console (F12) for detailed logs</p>
      </div>

      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">BTL Lead Generation</h1>
          <p className="text-sm text-indigo-100">Below The Line Marketing</p>
        </div>

        {/* Metrics */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 space-y-2">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics.totalLeads}</p>
              <p className="text-xs text-indigo-100">Total Leads</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-200">{metrics.converted}</p>
              <p className="text-xs text-indigo-100">Converted</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(metrics.conversionRate * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-indigo-100">Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-indigo-100">Earnings</p>
              <p className="font-bold">₹{metrics.totalIncentiveEarned.toLocaleString("en-IN")}</p>
            </div>
            <div>
              <p className="text-indigo-100">Pending (30%)</p>
              <p className="font-bold">₹{metrics.incentivePending.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Quality Warning */}
        {metrics.lowQualityRate > 0.3 && (
          <div className="mt-3 bg-red-600 border-2 border-red-400 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-bold">⚠️ LOW QUALITY ALERT</p>
                <p className="text-xs">
                  {(metrics.lowQualityRate * 100).toFixed(0)}% disqualified (threshold: 30%)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Capture Button */}
        <Button
          className="w-full mt-3 h-12 bg-white text-indigo-700 hover:bg-indigo-50 font-bold"
          onClick={() => setShowCaptureForm(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Capture New Lead
        </Button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Incentive Split Visual */}
        <Card className="border-2 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Incentive Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="h-8 bg-green-500 rounded-l-lg flex items-center justify-center text-white text-sm font-bold">
                  70% on Conversion
                </div>
              </div>
              <div className="flex-1">
                <div className="h-8 bg-blue-500 rounded-r-lg flex items-center justify-center text-white text-sm font-bold">
                  30% at 90 days
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-600">
              Base: ₹500 per converted lead
            </p>
          </CardContent>
        </Card>

        {/* Lead List */}
        {leads.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600">No leads captured yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCaptureForm(true)}
              >
                Capture Your First Lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          leads.map((lead) => {
            const config = statusConfig[lead.status];
            const StatusIcon = config.icon;

            return (
              <Card
                key={lead.id}
                className={`border-2 ${
                  lead.status === "DISQUALIFIED"
                    ? "border-red-200 bg-red-50"
                    : lead.status === "CONVERTED"
                    ? "border-green-200 bg-green-50"
                    : "border-gray-200"
                }`}
              >
                <CardContent className="p-3">
                  {/* Row 1: Name + Status */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">{lead.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{lead.mobile}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={config.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>

                  {/* Assignment Info */}
                  {lead.assignedToTSEName && (
                    <div className="mb-2 p-2 bg-indigo-50 border border-indigo-200 rounded">
                      <p className="text-xs text-indigo-700">
                        📞 Assigned to: <span className="font-bold">{lead.assignedToTSEName}</span>
                      </p>
                      {lead.assignedDate && (
                        <p className="text-xs text-indigo-600">
                          Since: {new Date(lead.assignedDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Row 2: Details */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-2 py-2 bg-gray-50 rounded">
                    <div>
                      <p className="text-gray-600">Vehicle</p>
                      <p className="font-bold text-gray-900">
                        {lead.vehicleType.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Interest</p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          lead.interestLevel === "HOT"
                            ? "bg-red-100 text-red-700 border-red-300"
                            : lead.interestLevel === "WARM"
                            ? "bg-amber-100 text-amber-700 border-amber-300"
                            : "bg-blue-100 text-blue-700 border-blue-300"
                        }`}
                      >
                        {lead.interestLevel}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-gray-600">Days</p>
                      <p className="font-bold text-gray-900">T+{lead.daysSinceCapture}</p>
                    </div>
                  </div>

                  {/* Row 3: Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{lead.location.address}</span>
                  </div>

                  {/* Last Activity */}
                  {lead.lastActivityDate && (
                    <div className="text-xs text-gray-500 mb-2">
                      Last activity: {new Date(lead.lastActivityDate).toLocaleDateString()} by {lead.lastActivityBy || 'N/A'}
                    </div>
                  )}

                  {/* Row 4: Incentive Status */}
                  {lead.status === "CONVERTED" && (
                    <div className="bg-green-100 border border-green-300 rounded p-2 mb-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-green-700">
                          {lead.incentive70Paid ? "✓" : "⏳"} 70% (₹{(lead.totalIncentive * 0.7).toFixed(0)})
                        </span>
                        <span className="font-semibold text-green-700">
                          {lead.incentive30Paid ? "✓" : "⏳"} 30% (₹{(lead.totalIncentive * 0.3).toFixed(0)})
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Flags */}
                  <div className="flex items-center gap-2 mb-2">
                    {lead.isDuplicate && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        Duplicate
                      </Badge>
                    )}
                    {lead.isExpired && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                        Expired (30+ days)
                      </Badge>
                    )}
                    {lead.isLowQuality && (
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 text-xs">
                        Low Quality
                      </Badge>
                    )}
                  </div>

                  {/* Action */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-9"
                    onClick={() => onViewPipeline(lead.id)}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Pipeline
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Capture Form Modal */}
      {showCaptureForm && (
        <LeadCaptureForm
          onSubmit={(name, mobile, vehicleType, location, interestLevel, gps) => {
            onSubmitLead(name, mobile, vehicleType, location, interestLevel, gps);
            setShowCaptureForm(false);
          }}
          onCancel={() => setShowCaptureForm(false)}
        />
      )}
    </div>
  );
}

// ========== LEAD CAPTURE FORM ==========

interface LeadCaptureFormProps {
  onSubmit: (
    name: string,
    mobile: string,
    vehicleType: VehicleType,
    location: { lat: number; lng: number; address: string },
    interestLevel: InterestLevel,
    gpsLocation: { lat: number; lng: number }
  ) => void;
  onCancel: () => void;
}

function LeadCaptureForm({ onSubmit, onCancel }: LeadCaptureFormProps) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType | undefined>();
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | undefined>();
  const [interestLevel, setInterestLevel] = useState<InterestLevel | undefined>();
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateCheck, setDuplicateCheck] = useState<{
    isDuplicate: boolean;
    leadId?: string;
    submittedDate?: Date;
  } | null>(null);

  // Check for duplicate when mobile changes
  const handleMobileChange = (value: string) => {
    setMobile(value);
    if (value.length === 10) {
      const result = systemStateService.checkDuplicateLead(value);
      setDuplicateCheck(result);
    } else {
      setDuplicateCheck(null);
    }
  };

  // Simulate GPS capture
  const captureGPS = () => {
    setGpsEnabled(true);
    setLocation({
      lat: 21.1702,
      lng: 72.8311,
      address: "Captured Location (GPS)",
    });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!name || name.trim().length < 2) {
      newErrors.name = "Name is required (minimum 2 characters)";
    }

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Valid 10-digit mobile number required";
    }

    if (!vehicleType) {
      newErrors.vehicleType = "Vehicle type is required";
    }

    if (!location) {
      newErrors.location = "Location is required (GPS pin)";
    }

    if (!interestLevel) {
      newErrors.interestLevel = "Interest level is required";
    }

    if (!gpsEnabled) {
      newErrors.gps = "GPS capture is mandatory";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit(
      name,
      mobile,
      vehicleType!,
      location!,
      interestLevel!,
      { lat: 21.1702, lng: 72.8311 }
    );
  };

  const allFieldsFilled = name && mobile && vehicleType && location && interestLevel && gpsEnabled;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Capture BTL Lead</CardTitle>
          <p className="text-xs text-gray-600">All fields are mandatory</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Name */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Name <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              className={`w-full h-10 px-3 border rounded-lg ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter customer name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
          </div>

          {/* Mobile */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">
              Mobile <span className="text-red-600">*</span>
            </label>
            <input
              type="tel"
              className={`w-full h-10 px-3 border rounded-lg ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => handleMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
            />
            {errors.mobile && <p className="text-xs text-red-600 mt-1">{errors.mobile}</p>}
            {duplicateCheck?.isDuplicate && (
              <p className="text-xs text-red-600 mt-1">
                Duplicate lead found! Lead ID: {duplicateCheck.leadId}, Submitted on: {duplicateCheck.submittedDate?.toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Vehicle Type */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Vehicle Type <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["4W_SEDAN", "4W_SUV", "2W_BIKE", "2W_SCOOTER"] as VehicleType[]).map((type) => (
                <button
                  key={type}
                  className={`h-10 rounded-lg border-2 text-sm font-semibold ${
                    vehicleType === type
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setVehicleType(type)}
                >
                  {type.replace("_", " ")}
                </button>
              ))}
            </div>
            {errors.vehicleType && <p className="text-xs text-red-600 mt-1">{errors.vehicleType}</p>}
          </div>

          {/* Location (GPS Pin) */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Location <span className="text-red-600">*</span>
            </label>
            <Button
              variant="outline"
              className={`w-full h-12 ${
                location ? "border-green-500 bg-green-50 text-green-700" : ""
              }`}
              onClick={captureGPS}
            >
              <Navigation className="h-4 w-4 mr-2" />
              {location ? `✓ ${location.address}` : "Capture GPS Location"}
            </Button>
            {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            {errors.gps && <p className="text-xs text-red-600 mt-1">{errors.gps}</p>}
          </div>

          {/* Interest Level */}
          <div>
            <label className="text-sm text-gray-600 block mb-2">
              Interest Level <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["HOT", "WARM", "COLD"] as InterestLevel[]).map((level) => (
                <button
                  key={level}
                  className={`h-10 rounded-lg border-2 text-sm font-semibold ${
                    interestLevel === level
                      ? level === "HOT"
                        ? "border-red-500 bg-red-50 text-red-700"
                        : level === "WARM"
                        ? "border-amber-500 bg-amber-50 text-amber-700"
                        : "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-300 bg-white text-gray-700"
                  }`}
                  onClick={() => setInterestLevel(level)}
                >
                  {level}
                </button>
              ))}
            </div>
            {errors.interestLevel && <p className="text-xs text-red-600 mt-1">{errors.interestLevel}</p>}
          </div>

          {/* Submit */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={handleSubmit}
              disabled={!allFieldsFilled}
            >
              Submit Lead
            </Button>
          </div>

          {!allFieldsFilled && (
            <p className="text-xs text-center text-red-600">
              ⚠️ All fields must be filled
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ========== LEAD PIPELINE VIEW ==========

export interface LeadPipelineViewProps {
  lead: BTLLead;
  pipeline: LeadPipelineStage[];
  onClose: () => void;
}

export function LeadPipelineView({ lead, pipeline, onClose }: LeadPipelineViewProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-md my-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lead Pipeline</CardTitle>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
          <p className="text-sm font-semibold text-gray-900">{lead.name}</p>
          <p className="text-xs text-gray-600">{lead.mobile}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {pipeline.map((stage, index) => (
            <div key={stage.stage} className="flex items-start gap-3">
              {/* Timeline */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center ${
                    stage.isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {stage.isCompleted ? <CheckCircle className="h-5 w-5" /> : stage.stage}
                </div>
                {index < pipeline.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      stage.isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 pb-4">
                <p className="font-semibold text-gray-900">{stage.name}</p>
                {stage.completedDate && (
                  <p className="text-xs text-gray-600">
                    {stage.completedDate.toLocaleDateString()}
                  </p>
                )}
                {stage.incentivePercentage && (
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-700 border-green-300 text-xs mt-1"
                  >
                    {stage.incentivePercentage}% Incentive
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}