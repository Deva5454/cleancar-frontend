/**
 * SCREEN 6: ATTENDANCE — CHECK-OUT
 * Mandatory check-out flow with last car validation
 * Design Principle: Strict validation, triggers day summary, non-bypassable
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Camera,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  Car,
  User,
  LogOut,
} from "lucide-react";

export type CheckOutTiming = "ON_TIME" | "DELAYED" | "AUTO";
export type ValidationState = "PENDING" | "VALIDATING" | "SUCCESS" | "FAILED";

export interface LastCarDetails {
  registrationNumber: string;
  ownerName: string;
  vehicleType: string;
  package: string;
  location: string;
  completedTime: string;
}

export interface CheckOutValidation {
  face: ValidationState;
  gps: ValidationState;
}

export interface WasherCheckOutProps {
  // Timing
  checkOutTiming: CheckOutTiming;
  expectedCheckOutTime?: Date;
  
  // Last car details
  lastCar: LastCarDetails;
  totalJobsCompleted: number;
  
  // Validation states
  validation: CheckOutValidation;
  
  // Camera
  isCameraActive: boolean;
  photoTaken: boolean;
  photoUrl?: string;
  
  // Actions
  onStartCamera: () => void;
  onTakePhoto: () => void;
  onRetakePhoto: () => void;
  onSubmitCheckOut: () => void;
  
  // Loading
  isSubmitting: boolean;
}

export function WasherCheckOut({
  checkOutTiming,
  expectedCheckOutTime,
  lastCar,
  totalJobsCompleted,
  validation,
  isCameraActive,
  photoTaken,
  photoUrl,
  onStartCamera,
  onTakePhoto,
  onRetakePhoto,
  onSubmitCheckOut,
  isSubmitting,
}: WasherCheckOutProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimingMessage = () => {
    switch (checkOutTiming) {
      case "ON_TIME":
        return {
          icon: CheckCircle,
          color: "bg-green-50 border-green-300 text-green-700",
          title: "On-Time Check-Out",
          message: "Great job! You're checking out on time.",
        };
      case "DELAYED":
        return {
          icon: Clock,
          color: "bg-amber-50 border-amber-300 text-amber-700",
          title: "Delayed Check-Out",
          message: "Check-out is delayed. This will be noted.",
        };
      case "AUTO":
        return {
          icon: AlertCircle,
          color: "bg-blue-50 border-blue-300 text-blue-700",
          title: "Auto Check-Out",
          message: "Auto check-out has been applied based on last job completion.",
        };
    }
  };

  const timingInfo = getTimingMessage();
  const TimingIcon = timingInfo.icon;

  const isValidationComplete =
    validation.face === "SUCCESS" &&
    validation.gps === "SUCCESS";

  const canSubmit = isValidationComplete && !isSubmitting;

  const getValidationIcon = (state: ValidationState) => {
    switch (state) {
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "VALIDATING":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "FAILED":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "PENDING":
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getValidationText = (state: ValidationState) => {
    switch (state) {
      case "SUCCESS":
        return "Verified";
      case "VALIDATING":
        return "Validating...";
      case "FAILED":
        return "Failed";
      case "PENDING":
        return "Pending";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-Out</h1>
        <p className="text-sm text-gray-600">
          {currentTime.toLocaleString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Timing Status */}
      <Card className={`border-2 ${timingInfo.color} mb-4`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
              <TimingIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{timingInfo.title}</p>
              <p className="text-sm mt-0.5">{timingInfo.message}</p>
            </div>
          </div>
          {expectedCheckOutTime && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-xs">
                Expected check-out: {expectedCheckOutTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day Summary Stats */}
      <Card className="border-2 border-blue-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {totalJobsCompleted}
              </p>
              <p className="text-xs text-gray-600 mt-1">Jobs Completed</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-gray-600">All Tasks Done</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Car Details */}
      <Card className="border-2 border-purple-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5 text-purple-600" />
            Last Car Completed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600">Registration</p>
              <p className="font-semibold text-gray-900">
                {lastCar.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Owner</p>
              <p className="font-semibold text-gray-900">{lastCar.ownerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Vehicle</p>
              <p className="text-sm text-gray-700">{lastCar.vehicleType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="text-sm text-gray-700">{lastCar.completedTime}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{lastCar.location}</p>
          </div>
        </CardContent>
      </Card>

      {/* Camera Section */}
      <Card className="border-2 border-green-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-600" />
            Capture Selfie at Last Car
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Camera View */}
          <div className="relative aspect-[4/3] bg-gray-900 rounded-lg overflow-hidden">
            {!isCameraActive && !photoTaken && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={onStartCamera}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Start Camera
                </Button>
              </div>
            )}
            
            {isCameraActive && !photoTaken && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-white text-center mb-4">
                  <User className="h-16 w-16 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Position your face in the frame</p>
                </div>
                <Button
                  onClick={onTakePhoto}
                  size="lg"
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
              </div>
            )}
            
            {photoTaken && photoUrl && (
              <img
                src={photoUrl}
                alt="Check-out selfie"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Retake Button */}
          {photoTaken && (
            <Button
              onClick={onRetakePhoto}
              variant="outline"
              className="w-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Retake Photo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Validation Checklist */}
      <Card className="border-2 border-gray-200 mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validation Checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Face Detection */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {getValidationIcon(validation.face)}
              <div>
                <p className="font-medium text-sm">Face Detected</p>
                <p className="text-xs text-gray-600">
                  {getValidationText(validation.face)}
                </p>
              </div>
            </div>
            {validation.face === "FAILED" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                Face not clear
              </Badge>
            )}
          </div>

          {/* GPS Validation */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {getValidationIcon(validation.gps)}
              <div>
                <p className="font-medium text-sm">GPS Location Matched</p>
                <p className="text-xs text-gray-600">
                  {getValidationText(validation.gps)}
                </p>
              </div>
            </div>
            {validation.gps === "FAILED" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                Wrong location
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Failure Messages */}
      {validation.face === "FAILED" && (
        <Card className="border-2 border-red-300 bg-red-50 mb-3">
          <CardContent className="p-3">
            <p className="text-sm text-red-700">
              <strong>Face not clear:</strong> Ensure good lighting and remove any obstructions
            </p>
          </CardContent>
        </Card>
      )}

      {validation.gps === "FAILED" && (
        <Card className="border-2 border-red-300 bg-red-50 mb-3">
          <CardContent className="p-3">
            <p className="text-sm text-red-700">
              <strong>Location mismatch:</strong> You must be at the last customer's location to check out
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        onClick={onSubmitCheckOut}
        disabled={!canSubmit}
        className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Submitting Check-Out...
          </>
        ) : (
          <>
            <LogOut className="h-5 w-5 mr-2" />
            Submit Check-Out
          </>
        )}
      </Button>

      {/* Help Text */}
      {!canSubmit && (
        <p className="text-xs text-center text-gray-600 mt-3">
          Complete all validations to submit check-out
        </p>
      )}

      {/* After Submit Notice */}
      <Card className="bg-blue-50 border-blue-200 mt-4">
        <CardContent className="p-3">
          <p className="text-xs text-center text-blue-700">
            After check-out, you'll see your complete day summary
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
