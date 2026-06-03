/**
 * SCREEN 3: MY SCHEDULE — CAR LIST
 * Job list with status badges, cover tags, and lock states
 * Design Principle: Clear job cards, one job at a time enforcement
 */

import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Car,
  MapPin,
  Lock,
  Play,
  CheckCircle,
  AlertCircle,
  Package as PackageIcon,
  User,
  Clock,
} from "lucide-react";

export type JobStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "ISSUE";

export interface JobCard {
  id: string;
  registrationNumber: string;
  ownerName: string;
  vehicleType: string;
  packageName: string;
  location: string;
  status: JobStatus;
  
  // Cover job flag
  isCover: boolean;
  
  // Lock state
  isLocked: boolean;
  lockReason?: string;
  
  // Sequence
  sequenceNumber: number;
  
  // Timing
  scheduledTime?: string;
  completedTime?: string;
}

export interface WasherMyScheduleProps {
  jobs: JobCard[];
  isCheckedIn: boolean;
  activeJobId?: string;
  
  onJobClick: (jobId: string) => void;
  onStartJob: (jobId: string) => void;
}

export function WasherMySchedule({
  jobs,
  isCheckedIn,
  activeJobId,
  onJobClick,
  onStartJob,
}: WasherMyScheduleProps) {
  const getStatusConfig = (status: JobStatus) => {
    switch (status) {
      case "PENDING":
        return {
          label: "Pending",
          color: "bg-gray-100 text-gray-700 border-gray-300",
          icon: Clock,
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          color: "bg-blue-100 text-blue-700 border-blue-300",
          icon: Play,
        };
      case "DONE":
        return {
          label: "Done",
          color: "bg-green-100 text-green-700 border-green-300",
          icon: CheckCircle,
        };
      case "ISSUE":
        return {
          label: "Issue",
          color: "bg-red-100 text-red-700 border-red-300",
          icon: AlertCircle,
        };
    }
  };

  const pendingJobs = jobs.filter(j => j.status === "PENDING");
  const inProgressJobs = jobs.filter(j => j.status === "IN_PROGRESS");
  const completedJobs = jobs.filter(j => j.status === "DONE");
  const issueJobs = jobs.filter(j => j.status === "ISSUE");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white p-6 pb-8">
        <h1 className="text-2xl font-bold mb-2">My Schedule</h1>
        <p className="text-blue-100 text-sm">
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} today
        </p>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{pendingJobs.length}</p>
            <p className="text-xs text-blue-100">Pending</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{inProgressJobs.length}</p>
            <p className="text-xs text-blue-100">Active</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{completedJobs.length}</p>
            <p className="text-xs text-blue-100">Done</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
            <p className="text-2xl font-bold">{issueJobs.length}</p>
            <p className="text-xs text-blue-100">Issues</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Not Checked In Warning */}
        {!isCheckedIn && (
          <Card className="border-2 border-amber-300 bg-amber-50 mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Lock className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">Schedule Locked</p>
                  <p className="text-sm text-amber-700">
                    Check-in first to unlock your schedule
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job List */}
        <div className="space-y-3">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No jobs scheduled for today</p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job, index) => {
              const statusConfig = getStatusConfig(job.status);
              const StatusIcon = statusConfig.icon;
              const isActive = job.id === activeJobId;

              return (
                <Card
                  key={job.id}
                  className={`border-2 ${
                    isActive ? 'border-blue-500 shadow-lg' :
                    job.isLocked ? 'border-gray-300 bg-gray-50' :
                    'border-gray-200'
                  } ${!isCheckedIn ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-blue-600">
                            {job.sequenceNumber}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg text-gray-900">
                            {job.registrationNumber}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <User className="h-3 w-3" />
                            <span>{job.ownerName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <Badge
                        variant="outline"
                        className={`${statusConfig.color} border flex items-center gap-1`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>

                    {/* Job Details Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-600">Vehicle</p>
                        <p className="text-sm font-medium text-gray-900">
                          {job.vehicleType}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Package</p>
                        <p className="text-sm font-medium text-gray-900">
                          {job.packageName}
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3 p-2 bg-gray-50 rounded">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700">{job.location}</p>
                    </div>

                    {/* Tags Row */}
                    <div className="flex items-center gap-2 mb-3">
                      {/* Cover Tag */}
                      {job.isCover && (
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 text-xs">
                          Cover Job
                        </Badge>
                      )}

                      {/* Lock State */}
                      {job.isLocked && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}

                      {/* Scheduled Time */}
                      {job.scheduledTime && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {job.scheduledTime}
                        </Badge>
                      )}

                      {/* Completed Time */}
                      {job.completedTime && job.status === "DONE" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {job.completedTime}
                        </Badge>
                      )}
                    </div>

                    {/* Lock Reason */}
                    {job.isLocked && job.lockReason && (
                      <div className="mb-3 p-2 bg-gray-100 rounded">
                        <p className="text-xs text-gray-700">
                          <Lock className="h-3 w-3 inline mr-1" />
                          {job.lockReason}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    {job.status === "PENDING" && !job.isLocked && isCheckedIn && (
                      <Button
                        onClick={() => onStartJob(job.id)}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Job
                      </Button>
                    )}

                    {job.status === "IN_PROGRESS" && (
                      <Button
                        onClick={() => onJobClick(job.id)}
                        className="w-full h-12 bg-green-600 hover:bg-green-700"
                      >
                        Continue Job
                      </Button>
                    )}

                    {job.status === "DONE" && (
                      <Button
                        onClick={() => onJobClick(job.id)}
                        variant="outline"
                        className="w-full h-12"
                      >
                        View Details
                      </Button>
                    )}

                    {job.status === "ISSUE" && (
                      <Button
                        onClick={() => onJobClick(job.id)}
                        variant="outline"
                        className="w-full h-12 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Resolve Issue
                      </Button>
                    )}

                    {job.isLocked && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Complete active job first
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
