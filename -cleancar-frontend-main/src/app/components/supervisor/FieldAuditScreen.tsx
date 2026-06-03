/**
 * Field Audit System (3-Step Flow)
 * GPS validation, checklist, photo capture with offline support + GPS flexibility
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  MapPin,
  Clock,
  FileCheck,
  User,
} from "lucide-react";
import {
  OfflineBanner,
  LocalSaveToast,
  GPSExceptionModal,
  GPSExceptionTag,
  PhotoAuthenticityWarning,
  PhotoFlaggedTag,
} from "./SystemIndicators";
import { systemStateService } from "../../services/systemStateService";
import type {
  AuditWasher,
  AuditChecklistItem,
  PackageType,
  AuditResult,
} from "../../services/fieldAuditService";

export interface FieldAuditScreenProps {
  washers: AuditWasher[];
  todayTarget: number;
  completed: number;
  onStartAudit: (washerId: string) => void;
}

export function FieldAuditScreen({
  washers,
  todayTarget,
  completed,
  onStartAudit,
}: FieldAuditScreenProps) {
  const pending = washers.filter((w) => w.status === "PENDING").length;
  const overdue = washers.filter((w) => w.status === "OVERDUE").length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="mb-3">
          <h1 className="text-xl font-bold">Field Audit System</h1>
          <p className="text-sm text-purple-100">Quality Control Dashboard</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold">
              {completed} / {todayTarget}
            </p>
            <p className="text-xs text-purple-100">Completed</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold">{pending}</p>
            <p className="text-xs text-purple-100">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-xl font-bold text-red-200">{overdue}</p>
            <p className="text-xs text-purple-100">Overdue</p>
          </div>
        </div>
      </div>

      {/* WASHER AUDIT LIST */}
      <div className="px-4 py-4 space-y-3">
        {washers.map((washer) => {
          const statusConfig = {
            COMPLETED: {
              label: "Completed",
              color: "bg-green-100 text-green-700 border-green-300",
              icon: CheckCircle,
            },
            PENDING: {
              label: "Pending",
              color: "bg-amber-100 text-amber-700 border-amber-300",
              icon: Clock,
            },
            OVERDUE: {
              label: "Overdue",
              color: "bg-red-100 text-red-700 border-red-300",
              icon: AlertTriangle,
            },
          }[washer.status];

          const StatusIcon = statusConfig.icon;

          return (
            <Card
              key={washer.id}
              className={`border-2 ${
                washer.status === "OVERDUE"
                  ? "border-red-300 bg-red-50"
                  : washer.status === "PENDING"
                  ? "border-amber-200"
                  : "border-green-200"
              }`}
            >
              <CardContent className="p-4">
                {/* Row 1: Washer Info + Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-bold text-gray-900">{washer.name}</p>
                      <p className="text-xs text-gray-600">{washer.id}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Row 2: Audit Info */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-600">Last Audit</p>
                    <p
                      className={`font-semibold ${
                        washer.daysSinceAudit >= 4 ? "text-red-600" : "text-gray-900"
                      }`}
                    >
                      {washer.lastAuditDate
                        ? `${washer.daysSinceAudit}d ago`
                        : "No audit"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Active Job</p>
                    <p className="font-semibold text-gray-900">
                      {washer.activeJob || "None"}
                    </p>
                  </div>
                </div>

                {/* Row 3: Location */}
                {washer.currentLocation && (
                  <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {washer.currentLocation.lat.toFixed(4)},{" "}
                      {washer.currentLocation.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className={`w-full h-10 ${
                    washer.status === "OVERDUE"
                      ? "bg-red-600 hover:bg-red-700"
                      : washer.status === "PENDING"
                      ? "bg-amber-600 hover:bg-amber-700"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white font-semibold`}
                  onClick={() => onStartAudit(washer.id)}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  {washer.status === "COMPLETED" ? "View Audit" : "Start Audit"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ========== AUDIT FLOW SCREEN ==========

export interface AuditFlowScreenProps {
  washerId: string;
  washerName: string;
  packageType: PackageType;
  checklist: AuditChecklistItem[];
  gpsValid: boolean;
  gpsDistance: number;
  photosTaken: number;
  onToggleChecklistItem: (itemId: string) => void;
  onTakePhoto: () => void;
  onReportPreDamage: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AuditFlowScreen({
  washerId,
  washerName,
  packageType,
  checklist,
  gpsValid,
  gpsDistance,
  photosTaken,
  onToggleChecklistItem,
  onTakePhoto,
  onReportPreDamage,
  onSubmit,
  onCancel,
}: AuditFlowScreenProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  const packageTypeLabels = {
    WATER_WASH: "Water Wash",
    SHAMPOO_WASH: "Shampoo Wash",
    SHAMPOO_WAX: "Shampoo + Wax",
  };

  const dailyItems = checklist.filter((item) => item.category === "DAILY");
  const weeklyItems = checklist.filter((item) => item.category === "WEEKLY");
  const monthlyItems = checklist.filter((item) => item.category === "MONTHLY");

  const canSubmit = gpsValid && photosTaken > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gradient-to-br from-purple-600 to-purple-700 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-lg font-bold">Field Audit</h1>
            <p className="text-sm text-purple-100">{washerName}</p>
          </div>
          <Badge variant="outline" className="bg-white/20 text-white border-white/40">
            {packageTypeLabels[packageType]}
          </Badge>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded ${
                currentStep >= step ? "bg-white" : "bg-white/20"
              } ${step < 3 ? "mr-2" : ""}`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1 text-xs">
          <span>GPS</span>
          <span>Photos</span>
          <span>Checklist</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* STEP 1: GPS VALIDATION */}
        <Card className={`border-2 ${gpsValid ? "border-green-300" : "border-red-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Step 1: GPS Validation (Auto)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {gpsValid ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-semibold">GPS Valid - Within 10m</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">
                    GPS Invalid - {gpsDistance}m away
                  </span>
                </div>
                <p className="text-xs text-red-600">
                  ❌ You must be within 10m of the washer to start audit
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* STEP 2: PHOTO CAPTURE */}
        <Card className={`border-2 ${photosTaken > 0 ? "border-green-300" : "border-gray-300"}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Step 2: Photo Capture (Mandatory)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-gray-600">
              Photos taken: <span className="font-bold">{photosTaken}</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="h-12" onClick={onTakePhoto}>
                <Camera className="h-4 w-4 mr-2" />
                Take Photo
              </Button>
              <Button
                variant="outline"
                className="h-12 border-red-300 text-red-700 hover:bg-red-50"
                onClick={onReportPreDamage}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Pre-Damage
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 3: CHECKLIST */}
        <Card className="border-2 border-purple-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Step 3: Quality Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Daily Items */}
            {dailyItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2 uppercase">
                  Daily Checks {dailyItems.filter(i => i.isRequired).length > 0 && "(Required)"}
                </p>
                <div className="space-y-2">
                  {dailyItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => onToggleChecklistItem(item.id)}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <span className="text-sm flex-1">
                        {item.item}
                        {item.isRequired && (
                          <span className="text-red-600 ml-1">*</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Items */}
            {weeklyItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Weekly Checks</p>
                <div className="space-y-2">
                  {weeklyItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => onToggleChecklistItem(item.id)}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <span className="text-sm flex-1">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Items */}
            {monthlyItems.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-700 mb-2 uppercase">Monthly Checks</p>
                <div className="space-y-2">
                  {monthlyItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                    >
                      <input
                        type="checkbox"
                        checked={item.isCompleted}
                        onChange={() => onToggleChecklistItem(item.id)}
                        className="h-5 w-5 rounded border-gray-300"
                      />
                      <span className="text-sm flex-1">{item.item}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" className="h-12" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="h-12 bg-purple-600 hover:bg-purple-700 text-white font-bold"
            onClick={onSubmit}
            disabled={!canSubmit}
          >
            {canSubmit ? "Submit Audit" : "Complete Steps"}
          </Button>
        </div>

        {!canSubmit && (
          <p className="text-xs text-center text-red-600">
            ⚠️ GPS and at least 1 photo required
          </p>
        )}
      </div>
    </div>
  );
}

// ========== AUDIT RESULT SCREEN ==========

export interface AuditResultScreenProps {
  washerName: string;
  score: number;
  result: AuditResult;
  message: string;
  color: "green" | "amber" | "red";
  requiresFeedback: boolean;
  reAuditSchedule?: string;
  escalated: boolean;
  onClose: () => void;
  onSubmitFeedback?: (feedback: string) => void;
}

export function AuditResultScreen({
  washerName,
  score,
  result,
  message,
  color,
  requiresFeedback,
  reAuditSchedule,
  escalated,
  onClose,
  onSubmitFeedback,
}: AuditResultScreenProps) {
  const [feedback, setFeedback] = useState("");

  const colorClasses = {
    green: "from-green-600 to-green-700 border-green-300 bg-green-50",
    amber: "from-amber-600 to-amber-700 border-amber-300 bg-amber-50",
    red: "from-red-600 to-red-700 border-red-300 bg-red-50",
  };

  const resultIcons = {
    PASS: CheckCircle,
    MINOR: AlertTriangle,
    MAJOR: XCircle,
    FAILED: XCircle,
  };

  const ResultIcon = resultIcons[result];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-br ${colorClasses[color]} text-white p-6 text-center`}>
        <ResultIcon className="h-16 w-16 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">{result}</h1>
        <p className="text-3xl font-bold mb-2">{score}%</p>
        <p className="text-sm">{washerName}</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        <Card className={`border-2 ${colorClasses[color]}`}>
          <CardContent className="p-4">
            <p className="text-center font-semibold text-gray-900">{message}</p>
          </CardContent>
        </Card>

        {reAuditSchedule && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">
                <span className="font-bold">Re-audit scheduled:</span> {reAuditSchedule}
              </p>
            </CardContent>
          </Card>
        )}

        {escalated && (
          <Card className="border-2 border-red-300 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm text-red-700 font-semibold text-center">
                🔴 Escalated to {result === "FAILED" ? "City Manager" : "Ops Manager"}
              </p>
            </CardContent>
          </Card>
        )}

        {requiresFeedback && onSubmitFeedback && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Feedback Required</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg resize-none"
                placeholder="Enter feedback for the washer..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
              <Button
                className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white"
                onClick={() => onSubmitFeedback(feedback)}
                disabled={!feedback.trim()}
              >
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full h-12" onClick={onClose}>
          {requiresFeedback && !feedback.trim() ? "Skip & Close" : "Done"}
        </Button>
      </div>
    </div>
  );
}