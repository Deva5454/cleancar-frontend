/**
 * Washer Core Screens Demo
 * Showcases all 6 mandatory screens with mock data
 * Demonstrates strict attendance flow and validation
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

// Import all 6 core screens
import { WasherHomeDashboard } from "./WasherHomeDashboard";
import { WasherCheckIn } from "./WasherCheckIn";
import { WasherMySchedule } from "./WasherMySchedule";
import { WasherActiveWash } from "./WasherActiveWash";
import { WasherIncentiveTracker } from "./WasherIncentiveTracker";
import { WasherCheckOut } from "./WasherCheckOut";
import { DaySummaryScreen } from "./DaySummaryScreen";

import type { DayStatus } from "./WasherHomeDashboard";
import type { CheckInWindow, ValidationState } from "./WasherCheckIn";
import type { JobCard } from "./WasherMySchedule";
import type { WashStep, ConsumableItem } from "./WasherActiveWash";
import type { TimeBandStatus, EligibilityStatus } from "./WasherIncentiveTracker";
import type { CheckOutTiming } from "./WasherCheckOut";
import { logger } from "../../services/logger";

export function WasherCoreScreensDemo() {
  // Screen 1: Dashboard State
  const [dayStatus, setDayStatus] = useState<DayStatus>("NOT_CHECKED_IN");
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [checkInTime, setCheckInTime] = useState<Date | undefined>();

  // Screen 2: Check-In State
  const [checkInWindow, setCheckInWindow] = useState<CheckInWindow>("WITHIN");
  const [faceValidation, setFaceValidation] = useState<ValidationState>("PENDING");
  const [plateValidation, setPlateValidation] = useState<ValidationState>("PENDING");
  const [gpsValidation, setGpsValidation] = useState<ValidationState>("PENDING");
  const [checkInPhotoTaken, setCheckInPhotoTaken] = useState(false);

  // Screen 3: Schedule State
  const [activeJobId, setActiveJobId] = useState<string | undefined>();

  // Screen 4: Active Wash State
  const [washSteps, setWashSteps] = useState<WashStep[]>([
    { id: "1", name: "Exterior Wash", isCompleted: false, isActive: true, requiresPhoto: true, photoTaken: false },
    { id: "2", name: "Interior Cleaning", isCompleted: false, isActive: false, requiresPhoto: true, photoTaken: false },
    { id: "3", name: "Tire Cleaning", isCompleted: false, isActive: false, requiresPhoto: false, photoTaken: false },
    { id: "4", name: "Final Polish", isCompleted: false, isActive: false, requiresPhoto: true, photoTaken: false },
  ]);
  
  const [consumables, setConsumables] = useState<ConsumableItem[]>([
    { name: "Car Wash Shampoo", quantity: "50ml", isUsed: false },
    { name: "Tire Cleaner", quantity: "30ml", isUsed: false },
    { name: "Polish", quantity: "20ml", isUsed: false },
  ]);

  // Screen 6: Check-Out State
  const [checkOutFaceValidation, setCheckOutFaceValidation] = useState<ValidationState>("PENDING");
  const [checkOutGpsValidation, setCheckOutGpsValidation] = useState<ValidationState>("PENDING");
  const [checkOutPhotoTaken, setCheckOutPhotoTaken] = useState(false);

  // Show Day Summary
  const [showDaySummary, setShowDaySummary] = useState(false);

  // Mock Data
  const todayDate = new Date();
  
  const firstCar = {
    registrationNumber: "MH-12-AB-1234",
    ownerName: "Arjun Mehta",
    vehicleType: "Sedan",
    package: "Elite Wash",
    location: "Adajan, Surat",
  };

  const lastCar = {
    registrationNumber: "KA-05-XY-9876",
    ownerName: "Priya Sharma",
    vehicleType: "SUV",
    package: "Premium Wash",
    location: "Vesu, Surat",
    completedTime: "5:30 PM",
  };

  const mockJobs: JobCard[] = [
    {
      id: "1",
      registrationNumber: "MH-12-AB-1234",
      ownerName: "Arjun Mehta",
      vehicleType: "Sedan",
      packageName: "Elite Wash",
      location: "Adajan, Surat",
      status: "PENDING",
      isCover: false,
      isLocked: false,
      sequenceNumber: 1,
      scheduledTime: "9:00 AM",
    },
    {
      id: "2",
      registrationNumber: "KA-01-CD-5678",
      ownerName: "Rahul Verma",
      vehicleType: "Hatchback",
      packageName: "Classic Wash",
      location: "Althan, Surat",
      status: "PENDING",
      isCover: false,
      isLocked: !isCheckedIn,
      lockReason: !isCheckedIn ? "Complete check-in first" : "Complete previous job first",
      sequenceNumber: 2,
    },
    {
      id: "3",
      registrationNumber: "KA-05-XY-9876",
      ownerName: "Priya Sharma",
      vehicleType: "SUV",
      packageName: "Premium Wash",
      location: "Vesu, Surat",
      status: "PENDING",
      isCover: true,
      isLocked: !isCheckedIn,
      lockReason: !isCheckedIn ? "Complete check-in first" : undefined,
      sequenceNumber: 3,
    },
  ];

  // Handlers
  const handleCheckIn = () => {
    logger.log("Opening check-in screen...");
    // In real app, navigate to check-in screen
  };

  const handleSubmitCheckIn = () => {
    setIsCheckedIn(true);
    setCheckInTime(new Date());
    setDayStatus("WORKING");
    logger.log("Check-in submitted");
  };

  const handleStartValidation = (type: "checkin" | "checkout") => {
    if (type === "checkin") {
      setFaceValidation("VALIDATING");
      setPlateValidation("VALIDATING");
      setGpsValidation("VALIDATING");
      
      setTimeout(() => {
        setFaceValidation("SUCCESS");
        setPlateValidation("SUCCESS");
        setGpsValidation("SUCCESS");
      }, 2000);
    } else {
      setCheckOutFaceValidation("VALIDATING");
      setCheckOutGpsValidation("VALIDATING");
      
      setTimeout(() => {
        setCheckOutFaceValidation("SUCCESS");
        setCheckOutGpsValidation("SUCCESS");
      }, 2000);
    }
  };

  const handleCompleteStep = (stepId: string) => {
    setWashSteps(prev => {
      const newSteps = [...prev];
      const currentIndex = newSteps.findIndex(s => s.id === stepId);
      if (currentIndex !== -1) {
        newSteps[currentIndex].isCompleted = true;
        newSteps[currentIndex].isActive = false;
        if (currentIndex + 1 < newSteps.length) {
          newSteps[currentIndex + 1].isActive = true;
        }
      }
      return newSteps;
    });
  };

  const handleTakePhoto = (stepId: string) => {
    setWashSteps(prev =>
      prev.map(s => s.id === stepId ? { ...s, photoTaken: true } : s)
    );
  };

  const handleMarkConsumableUsed = (name: string) => {
    setConsumables(prev =>
      prev.map(c => c.name === name ? { ...c, isUsed: true } : c)
    );
  };

  const handleSubmitCheckOut = () => {
    setIsCheckedOut(true);
    setShowDaySummary(true);
  };

  if (showDaySummary) {
    return (
      <DaySummaryScreen
        summaryData={{
          date: todayDate.toISOString(),
          totalUnits: 27,
          baseUnits: 25,
          incentiveUnits: 2,
          addOnServices: 3,
          todayEarnings: 850,
          incentiveEarnings: 100,
          addOnEarnings: 150,
          totalWorkingTime: "8h 30m",
          checkInTime: "9:00 AM",
          checkOutTime: "5:30 PM",
          attendanceStatus: "Present",
          performanceRating: "Excellent",
          bonuses: ["100% completion rate"],
        }}
        onClose={() => setShowDaySummary(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Washer Core Screens Demo</h1>
              <p className="text-xs text-gray-600">6 mandatory screens + strict attendance flow</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={isCheckedIn ? "bg-green-50 text-green-700 border-green-300" : "bg-gray-100 text-gray-700"}>
                {isCheckedIn ? "Checked In" : "Not Checked In"}
              </Badge>
              {isCheckedOut && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                  Checked Out
                </Badge>
              )}
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => {
                setIsCheckedIn(false);
                setIsCheckedOut(false);
                setDayStatus("NOT_CHECKED_IN");
                setShowDaySummary(false);
              }}
              size="sm"
              variant="outline"
            >
              Reset Flow
            </Button>
            <Button
              onClick={() => handleStartValidation("checkin")}
              size="sm"
              variant="outline"
              disabled={isCheckedIn}
            >
              Auto-Validate Check-In
            </Button>
            <Button
              onClick={() => handleStartValidation("checkout")}
              size="sm"
              variant="outline"
              disabled={!isCheckedIn || isCheckedOut}
            >
              Auto-Validate Check-Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="dashboard">1. Dashboard</TabsTrigger>
            <TabsTrigger value="checkin">2. Check-In</TabsTrigger>
            <TabsTrigger value="schedule">3. Schedule</TabsTrigger>
          </TabsList>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="active">4. Active Wash</TabsTrigger>
            <TabsTrigger value="incentive">5. Incentive</TabsTrigger>
            <TabsTrigger value="checkout">6. Check-Out</TabsTrigger>
          </TabsList>

          {/* SCREEN 1: Dashboard */}
          <TabsContent value="dashboard">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 1: Home / Dashboard</CardTitle>
                <p className="text-xs text-gray-600">
                  Status overview, targets, earnings, and quick actions
                </p>
              </CardHeader>
            </Card>
            <WasherHomeDashboard
              washerName="Rajesh Kumar"
              todayDate={todayDate}
              dayNumber={15}
              totalDaysInMonth={26}
              dayStatus={dayStatus}
              isCheckedIn={isCheckedIn}
              isCheckedOut={isCheckedOut}
              checkInTime={checkInTime}
              isWeekOff={false}
              isLate={false}
              unitsCompleted={18}
              unitsTarget={25}
              incentiveUnits={0}
              todayEarnings={600}
              monthlyEarnings={12500}
              onCheckIn={handleCheckIn}
              onViewSchedule={() => logger.log("View schedule")}
              onViewEarnings={() => logger.log("View earnings")}
              onRaiseIssue={() => logger.log("Raise issue")}
              isOnline={true}
            />
          </TabsContent>

          {/* SCREEN 2: Check-In */}
          <TabsContent value="checkin">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 2: Attendance — Check-In</CardTitle>
                <p className="text-xs text-gray-600">
                  GPS + Selfie + First Car validation (mandatory, non-bypassable)
                </p>
              </CardHeader>
            </Card>
            <WasherCheckIn
              checkInWindow={checkInWindow}
              windowStartTime={new Date(todayDate.setHours(8, 30))}
              windowEndTime={new Date(todayDate.setHours(10, 0))}
              firstCar={firstCar}
              validation={{
                face: faceValidation,
                numberPlate: plateValidation,
                gps: gpsValidation,
              }}
              isCameraActive={false}
              photoTaken={checkInPhotoTaken}
              photoUrl={checkInPhotoTaken ? "https://via.placeholder.com/400x300?text=Selfie" : undefined}
              onStartCamera={() => logger.log("Start camera")}
              onTakePhoto={() => setCheckInPhotoTaken(true)}
              onRetakePhoto={() => setCheckInPhotoTaken(false)}
              onSubmitCheckIn={handleSubmitCheckIn}
              isSubmitting={false}
            />
          </TabsContent>

          {/* SCREEN 3: My Schedule */}
          <TabsContent value="schedule">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 3: My Schedule — Car List</CardTitle>
                <p className="text-xs text-gray-600">
                  Job cards with status, cover tags, and lock states
                </p>
              </CardHeader>
            </Card>
            <WasherMySchedule
              jobs={mockJobs}
              isCheckedIn={isCheckedIn}
              activeJobId={activeJobId}
              onJobClick={(id) => logger.log("Job clicked:", id)}
              onStartJob={(id) => {
                setActiveJobId(id);
                logger.log("Start job:", id);
              }}
            />
          </TabsContent>

          {/* SCREEN 4: Active Wash */}
          <TabsContent value="active">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 4: Active Wash Screen</CardTitle>
                <p className="text-xs text-gray-600">
                  Step-by-step checklist, one task at a time, with consumables
                </p>
              </CardHeader>
            </Card>
            <WasherActiveWash
              job={{
                registrationNumber: "MH-12-AB-1234",
                ownerName: "Arjun Mehta",
                vehicleType: "Sedan",
                packageName: "Elite Wash",
                location: "Adajan, Surat",
              }}
              steps={washSteps}
              consumables={consumables}
              clothBatchNumber="CLT-2024-04-08-001"
              startTime={new Date()}
              elapsedMinutes={25}
              onCompleteStep={handleCompleteStep}
              onTakePhoto={handleTakePhoto}
              onMarkConsumableUsed={handleMarkConsumableUsed}
              onMarkJobDone={() => logger.log("Job done")}
              canMarkDone={washSteps.every(s => s.isCompleted)}
            />
          </TabsContent>

          {/* SCREEN 5: Incentive Tracker */}
          <TabsContent value="incentive">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 5: Incentive Tracker</CardTitle>
                <p className="text-xs text-gray-600">
                  Read-only performance display with time band status
                </p>
              </CardHeader>
            </Card>
            <WasherIncentiveTracker
              data={{
                baseUnits: 25,
                completedUnits: 27,
                incentiveUnits: 2,
                todayIncentiveEarnings: 100,
                monthlyIncentiveUnits: 45,
                monthlyIncentiveEarnings: 2250,
                timeBandStatus: "ACTIVE",
                timeBandExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000),
                eligibilityStatus: "ELIGIBLE",
                eligibilityReason: "Meeting all criteria for incentive earnings",
                hasAttendanceImpact: false,
              }}
              currentDate={todayDate}
              monthName="April"
            />
          </TabsContent>

          {/* SCREEN 6: Check-Out */}
          <TabsContent value="checkout">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-base">Screen 6: Attendance — Check-Out</CardTitle>
                <p className="text-xs text-gray-600">
                  Last car validation + GPS + Selfie → Triggers Day Summary
                </p>
              </CardHeader>
            </Card>
            <WasherCheckOut
              checkOutTiming="ON_TIME"
              expectedCheckOutTime={new Date(todayDate.setHours(17, 30))}
              lastCar={lastCar}
              totalJobsCompleted={27}
              validation={{
                face: checkOutFaceValidation,
                gps: checkOutGpsValidation,
              }}
              isCameraActive={false}
              photoTaken={checkOutPhotoTaken}
              photoUrl={checkOutPhotoTaken ? "https://via.placeholder.com/400x300?text=Checkout+Selfie" : undefined}
              onStartCamera={() => logger.log("Start camera")}
              onTakePhoto={() => setCheckOutPhotoTaken(true)}
              onRetakePhoto={() => setCheckOutPhotoTaken(false)}
              onSubmitCheckOut={handleSubmitCheckOut}
              isSubmitting={false}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
