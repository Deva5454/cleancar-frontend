import { useState } from "react";
import { useDemos } from "../../contexts/DemoContext";
import { useRole } from "../../contexts/RoleContext";
import { BackButton } from "../ui/back-button";
import { WasherMobileShell } from "../washer/WasherMobileShell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { WasherDemoRequest } from "../execution/WasherDemoRequest";
import { DemoJobCompletion } from "../execution/DemoJobCompletion";
import {
  Clock,
  UserCheck,
  CheckCircle,
  TrendingUp,
  DollarSign,
  MapPin,
  Camera,
  AlertCircle,
  Calendar,
  Car,
  Play,
} from "lucide-react";
import { toast } from "sonner";

// Car Washer Execution Module - Updated with mobile washer interface
export function CarWasherExecution() {
  const { currentUser, roleConfig } = useRole();
  const { demos } = useDemos();

  // Check if user is a car washer - if so, show mobile-optimized interface
  if (currentUser.role === "Car Washer") {
    return <WasherMobileShell />;
  }

  // State for non-washer roles
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [completeDemoOpen, setCompleteDemoOpen] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<any>(null);

  // Calculate stats
  const presentToday = ([] as any[]).filter(a => a.status !== "Absent").length;
  const totalWashes = ([] as any[]).length;

  // Get current washer name based on currentUser
  const currentWasher = currentUser.name;

  // Filter demos for current washer
  const myPendingDemos = demos.filter(
    d => d.status === "Demo Request Sent" && d.assignedWasher === currentWasher
  );
  const myAcceptedDemos = demos.filter(
    d => d.status === "Demo Accepted by Washer" && d.assignedWasher === currentWasher
  );
  const myInProgressDemos = demos.filter(
    d => d.status === "Demo Job Started" && d.assignedWasher === currentWasher
  );
  const myCompletedDemos = demos.filter(
    d => d.status === "Demo Completed" && d.assignedWasher === currentWasher
  );

  const handleCheckIn = () => {
    const now = new Date();
    const time = now.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setCheckInTime(time);
    setIsCheckedIn(true);
    setCheckInDialogOpen(false);
  };

  const handleCheckOut = () => {
    setIsCheckedIn(false);
    setCheckInDialogOpen(false);
  };

  const handleStartJob = (demo: any) => {
    // Demo job start would update status in real implementation
    // Notification handled by notification service
    toast.success("Demo job started");
  };

  const handleCompleteJob = (demo: any) => {
    setSelectedDemo(demo);
    setCompleteDemoOpen(true);
  };

  // For non-washer roles viewing this module, show the old interface
  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Car Washer Execution</h1>
          <p className="text-sm text-gray-500 mt-1">Track [], washes, and performance</p>
        </div>
        <Button size="sm" onClick={() => setCheckInDialogOpen(true)}>
          <Clock className="w-4 h-4 mr-2" />
          Check In/Out
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Present Today</p>
                <p className="text-2xl font-bold mt-1">{presentToday}/{([] as any[]).length}</p>
                <p className="text-xs text-green-600 mt-1">94% attendance</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Washes Today</p>
                <p className="text-2xl font-bold mt-1">{totalWashes}</p>
                <p className="text-xs text-gray-500 mt-1">Across all washers</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Time/Wash</p>
                <p className="text-2xl font-bold mt-1">24min</p>
                <p className="text-xs text-green-600 mt-1">Target: 25min</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Adhoc Earnings</p>
                <p className="text-2xl font-bold mt-1">₹3.2K</p>
                <p className="text-xs text-gray-500 mt-1">Today's extras</p>
              </div>
              <div className="bg-orange-50 text-orange-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="[]" className="space-y-4">
        <TabsList>
          <TabsTrigger value="[]">Attendance</TabsTrigger>
          <TabsTrigger value="washes">Wash Records</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="[]" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Washer Name</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Washes Done</TableHead>
                    <TableHead>Selfie Verified</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {([] as any[]).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.washer}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {record.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.washesCompleted} cars</Badge>
                      </TableCell>
                      <TableCell>
                        {record.selfieVerified ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            record.status === "Present" ? "secondary" : 
                            record.status === "Working" ? "default" : 
                            "outline"
                          }
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="washes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Wash Execution Records</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Wash ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Car Number</TableHead>
                    <TableHead>Washer</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Photos</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {([] as any[]).map((wash) => (
                    <TableRow key={wash.id}>
                      <TableCell className="font-medium">{wash.id}</TableCell>
                      <TableCell>{wash.customerName}</TableCell>
                      <TableCell>{wash.carNo}</TableCell>
                      <TableCell>{wash.washer}</TableCell>
                      <TableCell>{wash.date} {wash.time}</TableCell>
                      <TableCell>{wash.duration}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`flex items-center gap-1 ${wash.beforePhoto === "✓" ? "text-green-600" : "text-gray-400"}`}>
                            <Camera className="w-4 h-4" />
                            <span className="text-xs">Before</span>
                          </div>
                          <div className={`flex items-center gap-1 ${wash.afterPhoto === "✓" ? "text-green-600" : "text-gray-400"}`}>
                            <Camera className="w-4 h-4" />
                            <span className="text-xs">After</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={wash.status === "Completed" ? "secondary" : "default"}>
                          {wash.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([] as any[]).filter(a => a.status !== "Absent").map((washer) => (
              <Card key={washer.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-lg">{washer.washer}</p>
                      <p className="text-sm text-gray-500">{washer.location}</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Washes Completed</span>
                          <Badge variant="outline">{washer.washesCompleted}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Check In Time</span>
                          <span className="font-medium">{washer.checkIn}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Hours Worked</span>
                          <span className="font-medium">
                            {washer.checkOut === "—" ? "In Progress" : "9h 56m"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Avg Time/Car</span>
                          <span className="font-medium">
                            {washer.washesCompleted > 0 ? `${Math.round(480 / washer.washesCompleted)}min` : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                      washer.washesCompleted >= 12 ? "bg-green-100 text-green-600" :
                      washer.washesCompleted >= 8 ? "bg-blue-100 text-blue-600" :
                      "bg-orange-100 text-orange-600"
                    }`}>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{washer.washesCompleted}</p>
                        <p className="text-xs">cars</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Demo Washes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">My Demo Requests</h2>
            <p className="text-sm text-gray-500">Review and accept/decline assigned demo washes</p>
          </div>
          <div className="flex gap-2">
            {myPendingDemos.length > 0 && (
              <Badge variant="default" className="bg-amber-500">{myPendingDemos.length} Pending Response</Badge>
            )}
            {myAcceptedDemos.length > 0 && (
              <Badge variant="default" className="bg-teal-600">{myAcceptedDemos.length} Accepted</Badge>
            )}
            {myInProgressDemos.length > 0 && (
              <Badge variant="default" className="bg-blue-600">{myInProgressDemos.length} In Progress</Badge>
            )}
          </div>
        </div>
        
        {/* Pending Demo Requests */}
        {myPendingDemos.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-700">⏳ Pending Demo Requests</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPendingDemos.map(demo => (
                <WasherDemoRequest key={demo.id} demo={demo} washerName={currentWasher} />
              ))}
            </div>
          </div>
        )}

        {/* Accepted Demos - Ready to Start */}
        {myAcceptedDemos.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-base font-semibold text-gray-700">✅ Accepted - Ready to Start</h3>
            <div className="grid grid-cols-1 gap-3">
              {myAcceptedDemos.map(demo => (
                <Card key={demo.id} className="border-2 border-teal-300 bg-teal-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-teal-600">
                            {demo.demoType === "One-Time Service Demo" ? "One-Time Demo" : "Subscription Demo"}
                          </Badge>
                          <p className="font-semibold">{demo.customerFirstName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{demo.demoDate}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{demo.demoTimeSlot}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{demo.area}, {demo.pinCode}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span>{demo.vehicleCategory}</span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Address: {demo.addressLine1}, {demo.area}
                        </p>
                      </div>
                      <Button
                        onClick={() => handleStartJob(demo)}
                        className="ml-4 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* In Progress Demos */}
        {myInProgressDemos.length > 0 && (
          <div className="space-y-4 mt-8">
            <h3 className="text-base font-semibold text-gray-700">🔄 In Progress</h3>
            <div className="grid grid-cols-1 gap-3">
              {myInProgressDemos.map(demo => (
                <Card key={demo.id} className="border-2 border-blue-300 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-blue-600">In Progress</Badge>
                          <p className="font-semibold">{demo.customerFirstName}</p>
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-gray-600">Started: {new Date(demo.jobStartedAt!).toLocaleString()}</p>
                          <p className="text-gray-600">Location: {demo.addressLine1}, {demo.area}</p>
                          <p className="text-gray-600">Plan: {demo.planName}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleCompleteJob(demo)}
                        className="ml-4 bg-orange-600 hover:bg-orange-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Complete Job
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No Demos State */}
        {myPendingDemos.length === 0 && myAcceptedDemos.length === 0 && myInProgressDemos.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No demo washes assigned yet</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new assignments</p>
            </CardContent>
          </Card>
        )}

        {/* Completed Demos */}
        {myCompletedDemos.length > 0 && (
          <div className="mt-8 space-y-4">
            <h3 className="text-base font-semibold text-gray-700">✅ Completed Demos</h3>
            <div className="grid grid-cols-1 gap-3">
              {myCompletedDemos.map(demo => (
                <Card key={demo.id} className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{demo.customerFirstName}</p>
                        <p className="text-sm text-gray-600">{demo.vehicleCategory} • {demo.area}</p>
                        <p className="text-xs text-gray-500 mt-1">Completed: {demo.demoCompletedAt}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary" className="mb-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                        <p className="text-xs text-gray-600">{demo.demoOutcome}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Complete Demo Job Dialog */}
      {selectedDemo && (
        <DemoJobCompletion
          demo={selectedDemo}
          open={completeDemoOpen}
          onOpenChange={setCompleteDemoOpen}
        />
      )}

      {/* Check In/Out Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check In/Out</DialogTitle>
            <DialogDescription>
              {isCheckedIn ? "Check out to end your shift" : "Check in to start your shift"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center">
            <Button
              size="lg"
              className="w-full"
              onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
            >
              {isCheckedIn ? "Check Out" : "Check In"}
            </Button>
          </div>
          {checkInTime && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Checked in at {checkInTime}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}