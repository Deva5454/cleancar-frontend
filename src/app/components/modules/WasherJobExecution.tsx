import React, { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { 
  MapPin, Clock, Car, CheckCircle, Circle, XCircle, 
  Camera, Upload, AlertCircle, Star, User, Calendar,
  Package, TrendingUp, Info
} from "lucide-react";
import { Progress } from "../ui/progress";

// Mock job data for washer
const washerJobs = [
  {
    id: "JOB001",
    jobType: "Regular Subscription",
    customerFirstName: "Arjun",
    area: "Adajan",
    pinCode: "395005",
    scheduledTimeSlot: "7:00 AM - 9:00 AM",
    vehicleCategory: "Mid-Size Sedan (>4m)",
    vehicleColor: "Silver",
    vehicleRegistrationNumber: "GJ05AB1234",
    status: "Assigned",
    packageName: "SHINE — Chamakti Subah",
    packageType: "EXPRESS_WASH",
    serviceFrequency: "Daily",
    subscriptionDuration: "6-month plan — Month 3 of 6",
    complimentaryBenefitsRemaining: "2 of 3 Interior Clean-Ups remaining",
    memberSince: "Jan 2026",
    totalWashesCompleted: 67,
    nextScheduledWash: "Tomorrow, Mar 18",
    specialNotes: "Customer prefers no water near the bonnet area. Car has a scratch on left door — customer aware.",
    addressLine1: "A-204, Sunrise Residency",
    city: "Surat",
    parkingInstructions: "Parking in basement B2, Slot 42",
  },
  {
    id: "JOB002",
    jobType: "One-Time Demo",
    customerFirstName: "Priya",
    area: "Vesu",
    pinCode: "395006",
    scheduledTimeSlot: "9:00 AM - 11:00 AM",
    vehicleCategory: "Mid/Large SUV",
    vehicleColor: "White",
    vehicleRegistrationNumber: "GJ05CD5678",
    status: "Starting Soon",
    packageName: "ELITE — Raja Seva",
    packageType: "ELITE_WASH",
    serviceFrequency: "Daily",
    specialNotes: "Focus on ceramic coating demo. White SUV needs special attention.",
    addressLine1: "Villa 12, Green Valley Society",
    city: "Surat",
    parkingInstructions: "Main gate parking available",
  },
  {
    id: "JOB003",
    jobType: "Regular Subscription",
    customerFirstName: "Karan",
    area: "Jahangirpura",
    pinCode: "395009",
    scheduledTimeSlot: "10:00 AM - 12:00 PM",
    vehicleCategory: "Hatchback",
    vehicleColor: "Red",
    vehicleRegistrationNumber: "GJ05EF9012",
    status: "In Progress",
    packageName: "PROTECT — Raksha Plan",
    packageType: "SMART_WASH",
    serviceFrequency: "Daily",
    subscriptionDuration: "3-month plan — Month 2 of 3",
    memberSince: "Feb 2026",
    totalWashesCompleted: 18,
    nextScheduledWash: "Mar 19",
    specialNotes: "",
    addressLine1: "Flat 501, City Heights",
    city: "Surat",
    parkingInstructions: "Visitor parking near lobby",
  },
];

export function WasherJobExecution() {
  const { currentUser } = useRole();
  const [selectedJob, setSelectedJob] = useState<typeof washerJobs[0] | null>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [checklist, setChecklist] = useState({
    exteriorWash: {
      waterWash: false,
      dirtRemoval: false,
      wheelCleaning: false,
      tyreCleaning: false,
      glassCleaning: false,
      microfiberDrying: false,
    },
    qualityCheck: {
      exteriorDryClean: false,
      noWaterMarks: false,
      wheelsClean: false,
    },
    photos: {
      before: null as File | null,
      after: null as File | null,
    },
  });

  const [jobReport, setJobReport] = useState({
    vehicleConditionBefore: "",
    vehicleConditionAfter: "",
    productsUsed: [] as string[],
    issuesEncountered: "",
    customerPresent: "",
    customerFeedback: "",
    washerSelfRating: 0,
  });

  // Calculate checklist progress
  const totalChecklistItems = Object.values(checklist.exteriorWash).length + Object.values(checklist.qualityCheck).length;
  const completedItems = [...Object.values(checklist.exteriorWash), ...Object.values(checklist.qualityCheck)].filter(Boolean).length;
  const progressPercentage = (completedItems / totalChecklistItems) * 100;

  const handleChecklistToggle = (section: keyof typeof checklist, item: string) => {
    setChecklist(prev => ({
      ...prev,
      [section]: {
        ...prev[section as 'exteriorWash' | 'qualityCheck'],
        [item]: !prev[section as 'exteriorWash' | 'qualityCheck'][item as keyof typeof checklist.exteriorWash],
      },
    }));
  };

  const canSubmitReport = completedItems === totalChecklistItems && checklist.photos.before && checklist.photos.after;

  if (selectedJob) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedJob(null)}
          >
            ← Back to Jobs
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Details — {selectedJob.customerFirstName}</h1>
            <p className="text-sm text-gray-500 mt-1">{selectedJob.pinCode} — {selectedJob.area} • {selectedJob.scheduledTimeSlot}</p>
          </div>
        </div>

        {/* Job Type Badge */}
        <div className="flex gap-2">
          <Badge 
            variant={selectedJob.jobType === "One-Time Demo" ? "default" : "secondary"}
            className={selectedJob.jobType === "One-Time Demo" ? "bg-amber-500" : "bg-teal-500"}
          >
            {selectedJob.jobType}
          </Badge>
          <Badge variant="outline">{selectedJob.status}</Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">Customer & Job Info</TabsTrigger>
            <TabsTrigger value="checklist">Deliverables Checklist</TabsTrigger>
            <TabsTrigger value="report" disabled={!canSubmitReport}>
              Job Report {!canSubmitReport && "🔒"}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Customer & Job Info */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Information</CardTitle>
                <p className="text-sm text-gray-500">View permitted customer details for this job</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Customer First Name</p>
                      <p className="font-medium">{selectedJob.customerFirstName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Service Address</p>
                      <p className="font-medium">{selectedJob.addressLine1}</p>
                      <p className="text-sm text-gray-600">{selectedJob.area}, {selectedJob.city} - {selectedJob.pinCode}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Car className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Vehicle Details</p>
                      <p className="font-medium">{selectedJob.vehicleRegistrationNumber}</p>
                      <p className="text-sm text-gray-600">{selectedJob.vehicleCategory} • {selectedJob.vehicleColor}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Preferred Time Slot</p>
                      <p className="font-medium">{selectedJob.scheduledTimeSlot}</p>
                    </div>
                  </div>
                </div>

                {selectedJob.parkingInstructions && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Parking Instructions</p>
                        <p className="text-sm text-blue-800 mt-1">{selectedJob.parkingInstructions}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Subscription Package Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Package Name</p>
                      <p className="font-medium">{selectedJob.packageName}</p>
                      <Badge variant="outline" className="mt-1">{selectedJob.packageType}</Badge>
                    </div>
                  </div>
                  {selectedJob.subscriptionDuration && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Subscription Duration</p>
                        <p className="font-medium">{selectedJob.subscriptionDuration}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Service Frequency</p>
                      <p className="font-medium">{selectedJob.serviceFrequency}</p>
                    </div>
                  </div>
                  {selectedJob.complimentaryBenefitsRemaining && (
                    <div className="flex items-start gap-3">
                      <Star className="w-5 h-5 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-500">Complimentary Benefits</p>
                        <p className="font-medium text-teal-600">{selectedJob.complimentaryBenefitsRemaining}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedJob.memberSince && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-500">Customer Member Since</p>
                      <p className="font-medium">{selectedJob.memberSince}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Washes Completed</p>
                      <p className="font-medium">{selectedJob.totalWashesCompleted} washes</p>
                    </div>
                    {selectedJob.nextScheduledWash && (
                      <div>
                        <p className="text-sm text-gray-500">Next Scheduled Wash</p>
                        <p className="font-medium">{selectedJob.nextScheduledWash}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedJob.specialNotes && (
              <Card className="border-amber-300 bg-amber-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    Special Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-amber-900">{selectedJob.specialNotes}</p>
                  <p className="text-xs text-amber-700 mt-2">⚠️ These are permanent notes. Please read carefully before starting the job.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* TAB 2: Deliverables Checklist */}
          <TabsContent value="checklist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Deliverables Checklist</CardTitle>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {completedItems} of {totalChecklistItems} services completed
                    </span>
                    <span className="text-sm font-medium">{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className={`h-2 ${progressPercentage < 50 ? 'bg-red-100' : progressPercentage < 80 ? 'bg-amber-100' : 'bg-green-100'}`}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Exterior Wash Section */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg">Exterior Wash</h3>
                    <Badge variant="outline">
                      {Object.values(checklist.exteriorWash).filter(Boolean).length} / {Object.values(checklist.exteriorWash).length} complete
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'waterWash', label: 'Exterior water wash using microfiber mitt' },
                      { key: 'dirtRemoval', label: 'Removal of loose dirt, mud and dust' },
                      { key: 'wheelCleaning', label: 'Wheel surface cleaning' },
                      { key: 'tyreCleaning', label: 'Tyre basic cleaning' },
                      { key: 'glassCleaning', label: 'Exterior glass cleaning' },
                      { key: 'microfiberDrying', label: 'Microfiber drying' },
                    ].map(item => (
                      <div 
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          checklist.exteriorWash[item.key as keyof typeof checklist.exteriorWash] 
                            ? 'bg-teal-50 border border-teal-200' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                        onClick={() => handleChecklistToggle('exteriorWash', item.key)}
                      >
                        {checklist.exteriorWash[item.key as keyof typeof checklist.exteriorWash] ? (
                          <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={checklist.exteriorWash[item.key as keyof typeof checklist.exteriorWash] ? 'text-teal-900' : 'text-gray-700'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Photo Capture Prompts */}
                <div className="border-2 border-blue-300 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-blue-900">Photo Capture — Required</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label className="text-blue-900">Before Photo</Label>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-white">
                        <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-600">
                          {checklist.photos.before ? '✓ Photo captured' : 'Tap to capture'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-blue-900">After Photo</Label>
                      <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center bg-white">
                        <Upload className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-600">
                          {checklist.photos.after ? '✓ Photo captured' : 'Complete work first'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quality Check Section */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-lg text-green-900">Quality Check</h3>
                    <Badge variant="outline" className="bg-green-100 text-green-700">
                      {Object.values(checklist.qualityCheck).filter(Boolean).length} / {Object.values(checklist.qualityCheck).length} complete
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {[
                      { key: 'exteriorDryClean', label: 'Vehicle exterior dry and clean' },
                      { key: 'noWaterMarks', label: 'No water marks on glass' },
                      { key: 'wheelsClean', label: 'Wheels visibly clean' },
                    ].map(item => (
                      <div 
                        key={item.key}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          checklist.qualityCheck[item.key as keyof typeof checklist.qualityCheck] 
                            ? 'bg-green-100 border border-green-300' 
                            : 'bg-white border border-green-200 hover:bg-green-50'
                        }`}
                        onClick={() => handleChecklistToggle('qualityCheck', item.key)}
                      >
                        {checklist.qualityCheck[item.key as keyof typeof checklist.qualityCheck] ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                        <span className={checklist.qualityCheck[item.key as keyof typeof checklist.qualityCheck] ? 'text-green-900 font-medium' : 'text-gray-700'}>
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-green-700 mt-3">⚠️ All Quality Check items must be completed before you can submit the job report.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Job Report */}
          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Job Report Submission</CardTitle>
                <p className="text-sm text-gray-500">Complete all fields to submit the job report</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vehicle Condition Before Wash *</Label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                      value={jobReport.vehicleConditionBefore}
                      onChange={(e) => setJobReport({ ...jobReport, vehicleConditionBefore: e.target.value })}
                    >
                      <option value="">Select condition</option>
                      <option value="Clean">Clean</option>
                      <option value="Moderate Dust">Moderate Dust</option>
                      <option value="Heavy Dirt">Heavy Dirt</option>
                      <option value="Bird Dropping">Bird Dropping</option>
                      <option value="Tree Sap">Tree Sap</option>
                      <option value="Multiple Issues">Multiple Issues</option>
                    </select>
                  </div>
                  <div>
                    <Label>Vehicle Condition After Wash *</Label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                      value={jobReport.vehicleConditionAfter}
                      onChange={(e) => setJobReport({ ...jobReport, vehicleConditionAfter: e.target.value })}
                    >
                      <option value="">Select condition</option>
                      <option value="Excellent">Excellent</option>
                      <option value="Good">Good</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Customer Present During Service? *</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="customerPresent" 
                        value="Yes"
                        onChange={(e) => setJobReport({ ...jobReport, customerPresent: e.target.value })}
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="customerPresent" 
                        value="No"
                        onChange={(e) => setJobReport({ ...jobReport, customerPresent: e.target.value })}
                      />
                      No
                    </label>
                  </div>
                </div>

                {jobReport.customerPresent === "Yes" && (
                  <div>
                    <Label>Customer Verbal Feedback *</Label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                      rows={3}
                      placeholder="What did the customer say about the service? (minimum 15 characters)"
                      value={jobReport.customerFeedback}
                      onChange={(e) => setJobReport({ ...jobReport, customerFeedback: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <Label>Issues Encountered (Optional)</Label>
                  <textarea 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md mt-1"
                    rows={3}
                    placeholder="E.g., Deep scratch on rear bumper — customer informed and acknowledged"
                    value={jobReport.issuesEncountered}
                    onChange={(e) => setJobReport({ ...jobReport, issuesEncountered: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Your Self-Assessment (Optional)</Label>
                  <p className="text-sm text-gray-500 mb-2">How do you rate your own work for this job?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setJobReport({ ...jobReport, washerSelfRating: rating })}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          jobReport.washerSelfRating >= rating 
                            ? 'border-yellow-400 bg-yellow-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <Star className={`w-6 h-6 ${jobReport.washerSelfRating >= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                    onClick={() => {
                      if (!jobReport.vehicleConditionBefore || !jobReport.vehicleConditionAfter || !jobReport.customerPresent) {
                        toast.error('Please fill all required fields');
                        return;
                      }
                      if (jobReport.customerPresent === "Yes" && (!jobReport.customerFeedback || jobReport.customerFeedback.length < 15)) {
                        toast.error('Please provide customer feedback (minimum 15 characters)');
                        return;
                      }
                      toast.success(`Job completed successfully! Great work, ${currentUser.name}!`);
                      setSelectedJob(null);
                    }}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit Job Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Job List View
  return (
    <div className="space-y-6">
      <BackButton />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Jobs Today</h1>
        <p className="text-sm text-gray-500 mt-1">Service Zones: 395005 — Adajan, 395009 — Jahangirpura</p>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {washerJobs.map((job) => (
          <Card 
            key={job.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              job.jobType === "One-Time Demo" 
                ? 'border-amber-300 bg-amber-50' 
                : 'border-teal-300 bg-teal-50'
            }`}
            onClick={() => {
              setSelectedJob(job);
              setActiveTab("info");
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <Badge 
                  variant={job.jobType === "One-Time Demo" ? "default" : "secondary"}
                  className={job.jobType === "One-Time Demo" ? "bg-amber-500" : "bg-teal-500"}
                >
                  {job.jobType}
                </Badge>
                <Badge variant="outline">{job.status}</Badge>
              </div>

              <h3 className="font-bold text-lg mb-2">{job.customerFirstName}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{job.area} — {job.pinCode}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{job.scheduledTimeSlot}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="w-4 h-4" />
                  <span>{job.vehicleCategory} • {job.vehicleColor}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium text-gray-700">{job.packageName}</p>
                <p className="text-xs text-gray-500">{job.vehicleRegistrationNumber}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
