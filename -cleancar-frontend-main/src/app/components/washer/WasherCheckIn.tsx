/**
 * SCREEN 2: ATTENDANCE — CHECK-IN
 * Strict check-in flow with GPS, selfie, and first car validation
 * Design Principle: Mandatory validation, clear states, non-bypassable
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
} from "lucide-react";

export type CheckInWindow = "BEFORE" | "WITHIN" | "LATE" | "MISSED";
export type ValidationState = "PENDING" | "VALIDATING" | "SUCCESS" | "FAILED";

export interface FirstCarDetails {
  registrationNumber: string;
  ownerName: string;
  vehicleType: string;
  package: string;
  location: string;
}

export interface CheckInValidation {
  face: ValidationState;
  numberPlate: ValidationState;
  gps: ValidationState;
}

export interface WasherCheckInProps {
  // Window timing
  checkInWindow: CheckInWindow;
  windowStartTime?: Date;
  windowEndTime?: Date;
  
  // First car details
  firstCar: FirstCarDetails;
  
  // Validation states
  validation: CheckInValidation;
  
  // Camera
  isCameraActive: boolean;
  photoTaken: boolean;
  photoUrl?: string;
  
  // Actions
  onStartCamera: () => void;
  onTakePhoto: () => void;
  onRetakePhoto: () => void;
  onSubmitCheckIn: () => void;
  
  // Loading
  isSubmitting: boolean;
}

export function WasherCheckIn({
  checkInWindow,
  windowStartTime,
  windowEndTime,
  firstCar,
  validation,
  isCameraActive,
  photoTaken,
  photoUrl,
  onStartCamera,
  onTakePhoto,
  onRetakePhoto,
  onSubmitCheckIn,
  isSubmitting,
}: WasherCheckInProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const getWindowMessage = () => {
    switch (checkInWindow) {
      case "BEFORE":
        return {
          icon: Clock,
          color: "bg-blue-50 border-blue-300 text-blue-700",
          title: "Check-in Not Started",
          message: windowStartTime
            ? `Check-in opens at ${windowStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "Check-in window not yet open",
        };
      case "WITHIN":
        return {
          icon: CheckCircle,
          color: "bg-green-50 border-green-300 text-green-700",
          title: "You Can Check In Now",
          message: windowEndTime
            ? `Window closes at ${windowEndTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            : "Check-in window is open",
        };
      case "LATE":
        return {
          icon: AlertCircle,
          color: "bg-amber-50 border-amber-300 text-amber-700",
          title: "Late Check-In",
          message: "Late mark will be recorded",
        };
      case "MISSED":
        return {
          icon: AlertCircle,
          color: "bg-red-50 border-red-300 text-red-700",
          title: "Check-In Window Closed",
          message: "You will be marked absent",
        };
    }
  };

  const windowInfo = getWindowMessage();
  const WindowIcon = windowInfo.icon;

  const isValidationComplete =
    validation.face === "SUCCESS" &&
    validation.numberPlate === "SUCCESS" &&
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Check-In</h1>
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

      {/* Window Status */}
      <Card className={`border-2 ${windowInfo.color} mb-4`}>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
              <WindowIcon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">{windowInfo.title}</p>
              <p className="text-sm mt-0.5">{windowInfo.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* First Car Details */}
      <Card className="border-2 border-blue-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            First Car Today
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-600">Registration</p>
              <p className="font-semibold text-gray-900">
                {firstCar.registrationNumber}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Owner</p>
              <p className="font-semibold text-gray-900">{firstCar.ownerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Vehicle</p>
              <p className="text-sm text-gray-700">{firstCar.vehicleType}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Package</p>
              <p className="text-sm text-gray-700">{firstCar.package}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 pt-2 border-t">
            <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-700">{firstCar.location}</p>
          </div>
        </CardContent>
      </Card>

      {/* Camera Section */}
      <Card className="border-2 border-purple-200 mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="h-5 w-5 text-purple-600" />
            Capture Selfie at First Car
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
                  className="bg-purple-600 hover:bg-purple-700 min-h-[48px] text-base"
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
                  className="bg-white text-purple-600 hover:bg-gray-100 min-h-[48px] text-base"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
              </div>
            )}
            
            {photoTaken && photoUrl && (
              <img
                src={photoUrl}
                alt="Check-in selfie"
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Retake Button */}
          {photoTaken && (
            <Button
              onClick={onRetakePhoto}
              variant="outline"
              className="w-full min-h-[48px] text-base"
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

          {/* Number Plate */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {getValidationIcon(validation.numberPlate)}
              <div>
                <p className="font-medium text-sm">Number Plate Detected</p>
                <p className="text-xs text-gray-600">
                  {getValidationText(validation.numberPlate)}
                </p>
              </div>
            </div>
            {validation.numberPlate === "FAILED" && (
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">
                Move closer
              </Badge>
            )}
          </div>

          {/* GPS Validation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 sm:gap-3">
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

      {validation.numberPlate === "FAILED" && (
        <Card className="border-2 border-red-300 bg-red-50 mb-3">
          <CardContent className="p-3">
            <p className="text-sm text-red-700">
              <strong>Vehicle not detected:</strong> Move closer to the vehicle and ensure number plate is visible
            </p>
          </CardContent>
        </Card>
      )}

      {validation.gps === "FAILED" && (
        <Card className="border-2 border-red-300 bg-red-50 mb-3">
          <CardContent className="p-3">
            <p className="text-sm text-red-700">
              <strong>Location mismatch:</strong> You must be at the customer's location to check in
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <div className="mobile-bottom-bar lg:relative lg:bottom-auto lg:border-0 lg:p-0">
        <Button
          onClick={onSubmitCheckIn}
          disabled={!canSubmit || checkInWindow === "BEFORE" || checkInWindow === "MISSED"}
          className="w-full sm:w-auto min-h-[52px] text-base font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Submitting Check-In...
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Submit Check-In
            </>
          )}
        </Button>

        {/* Help Text */}
        {!canSubmit && checkInWindow === "WITHIN" && (
          <p className="text-xs text-center text-gray-600 mt-3">
            Complete all validations to submit check-in
          </p>
        )}
      </div>
    </div>
  );
}
