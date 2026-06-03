/**
 * Workflow Control System Demo
 * Demonstrates job locking, sequential tasks, AI validation, and incentive tracking
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Lock,
  Unlock,
  Play,
  CheckCircle,
  AlertCircle,
  Camera,
  TrendingUp,
} from "lucide-react";
import { workflowControlService } from "../../services/workflowControlService";
import { incentiveEngineService } from "../../services/incentiveEngineService";
import { AlertStack } from "./AlertModal";
import { IncentiveTracker } from "./IncentiveTracker";
import { PhotoValidationCapture } from "./PhotoValidationCapture";
import type { WorkflowState, WorkflowTask } from "../../types/workflowControl";

export function WorkflowControlDemo() {
  const [workflowState, setWorkflowState] = useState<WorkflowState | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [currentPhotoTask, setCurrentPhotoTask] = useState<WorkflowTask | null>(null);

  useEffect(() => {
    // Subscribe to workflow state updates
    const unsubscribe = workflowControlService.subscribe((state) => {
      setWorkflowState(state);
    });

    // Initial state
    setWorkflowState(workflowControlService.getState());

    // Check SLA periodically
    const slaInterval = setInterval(() => {
      workflowControlService.checkSLA();
    }, 10000); // Every 10 seconds

    return () => {
      unsubscribe();
      clearInterval(slaInterval);
    };
  }, []);

  const mockJobs = [
    { id: "JOB-001", vehicleRegNo: "GJ01AB1234", packageType: "ELITE",        customerName: "Rajesh Patel" },
    { id: "JOB-002", vehicleRegNo: "GJ05CD5678", packageType: "SMART_WASH",  customerName: "Amit Shah" },
    { id: "JOB-003", vehicleRegNo: "GJ06EF9012", packageType: "EXPRESS_WASH", customerName: "Priya Desai" },
  ];

  const handleCheckIn = async () => {
    const result = await workflowControlService.checkIn(
      "selfie-url.jpg",
      "first-car-url.jpg",
      { latitude: 23.0225, longitude: 72.5714 }
    );

    if (result.success) {
      toast.success("✅ Check-in successful!");
    } else {
      toast.error(`❌ Check-in failed: ${result.errors.join(", ")}`);
    }
  };

  const handleStartJob = (jobId: string, vehicleRegNo: string, packageType: string) => {
    const result = workflowControlService.startJob(jobId, vehicleRegNo, packageType);

    if (result.success) {
      setSelectedJob(jobId);
      toast.success(`✅ Job ${vehicleRegNo} started!`);
    } else {
      toast.error(`❌ ${result.error}`);
    }
  };

  const handleStartTask = (taskId: string) => {
    const result = workflowControlService.startTask(taskId);

    if (result.success) {
      toast.success("✅ Task started!");
    } else {
      toast.error(`❌ ${result.error}`);
    }
  };

  const handleCompleteTask = async (task: WorkflowTask) => {
    if (task.requiresPhoto) {
      setCurrentPhotoTask(task);
      setShowPhotoCapture(true);
    } else {
      const result = await workflowControlService.completeTask(task.id, []);
      if (result.success) {
        toast.success("✅ Task completed!");
      } else {
        toast.error(`❌ ${result.error}`);
      }
    }
  };

  const handlePhotoValidated = async (photoUrl: string) => {
    if (!currentPhotoTask) return;

    const result = await workflowControlService.completeTask(
      currentPhotoTask.id,
      [photoUrl]
    );

    if (result.success) {
      setShowPhotoCapture(false);
      setCurrentPhotoTask(null);
      toast.success("✅ Task completed with photo!");
    } else {
      toast.error(`❌ ${result.error}`);
    }
  };

  const handleCompleteJob = () => {
    const result = workflowControlService.completeJob();

    if (result.success) {
      // Update incentive
      incentiveEngineService.completeUnit(selectedJob || "");
      setSelectedJob(null);
      toast.success("✅ Job completed! Incentive updated.");
    } else {
      toast.error(`❌ ${result.error}`);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    workflowControlService.dismissAlert(alertId);
  };

  if (!workflowState) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Workflow Control System</h1>
          <p className="text-gray-600 mt-2">
            Strict execution control • Job locking • AI validation • Incentive tracking
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Workflow Controls */}
          <div className="space-y-6">
            {/* Check-in Card */}
            {!workflowState.isCheckedIn && (
              <Card className="border-2 border-blue-300">
                <CardHeader>
                  <CardTitle>Step 1: Check-in</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Check-in with selfie + first car photo + GPS validation
                  </p>
                  <Button onClick={handleCheckIn} size="lg" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start Check-in Process
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Job List */}
            {workflowState.isCheckedIn && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Available Jobs</span>
                    {workflowState.jobLock.isLocked && (
                      <Badge className="bg-red-600">
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockJobs.map((job) => {
                    const isLocked = workflowControlService.isJobLocked(job.id);
                    const isActive = workflowState.jobLock.activeJobId === job.id;

                    return (
                      <div
                        key={job.id}
                        className={`p-4 rounded-lg border-2 ${
                          isActive
                            ? "border-green-400 bg-green-50"
                            : isLocked
                            ? "border-gray-300 bg-gray-100 opacity-50"
                            : "border-blue-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">{job.vehicleRegNo}</p>
                            <p className="text-sm text-gray-600">{job.customerName}</p>
                          </div>
                          <Badge variant="outline">{job.packageType}</Badge>
                        </div>

                        {isLocked && !isActive && (
                          <div className="flex items-center gap-2 text-red-600 text-sm">
                            <Lock className="w-4 h-4" />
                            <span>Complete current job first</span>
                          </div>
                        )}

                        {!isLocked && !isActive && (
                          <Button
                            onClick={() => handleStartJob(job.id, job.vehicleRegNo, job.packageType)}
                            size="sm"
                            className="w-full mt-2"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Job
                          </Button>
                        )}

                        {isActive && (
                          <Badge className="bg-green-600 w-full justify-center mt-2">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Active Job Tasks */}
            {workflowState.activeJob && (
              <Card className="border-2 border-green-300">
                <CardHeader>
                  <CardTitle>Active Job: {workflowState.activeJob.vehicleRegNo}</CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    {workflowState.activeJob.completedTasks}/{workflowState.activeJob.totalTasks} tasks completed
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflowState.activeJob.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 rounded-lg border-2 ${
                        task.status === "COMPLETED"
                          ? "border-green-300 bg-green-50"
                          : task.status === "IN_PROGRESS"
                          ? "border-blue-300 bg-blue-50"
                          : task.status === "ACTIVE"
                          ? "border-amber-300 bg-amber-50"
                          : "border-gray-300 bg-gray-100"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-500">#{task.taskNumber}</span>
                            <span className="font-semibold text-gray-900">{task.name}</span>
                          </div>
                          <p className="text-xs text-gray-600">{task.description}</p>
                          {task.requiresPhoto && (
                            <p className="text-xs text-purple-600 mt-1">
                              📸 {task.photoCount} photo(s) required
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            task.status === "COMPLETED"
                              ? "bg-green-600"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-600"
                              : task.status === "ACTIVE"
                              ? "bg-amber-600"
                              : "bg-gray-600"
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>

                      {/* Task Actions */}
                      {task.status === "ACTIVE" && (
                        <Button
                          onClick={() => handleStartTask(task.id)}
                          size="sm"
                          className="w-full"
                        >
                          Start Task
                        </Button>
                      )}

                      {task.status === "IN_PROGRESS" && (
                        <Button
                          onClick={() => handleCompleteTask(task)}
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Task
                        </Button>
                      )}

                      {task.status === "LOCKED" && (
                        <div className="flex items-center gap-2 text-gray-500 text-xs">
                          <Lock className="w-3 h-3" />
                          <span>Complete previous tasks first</span>
                        </div>
                      )}

                      {task.status === "COMPLETED" && (
                        <div className="flex items-center gap-2 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          <span>Completed at {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : ""}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Complete Job Button */}
                  {workflowState.activeJob.canComplete && (
                    <Button
                      onClick={handleCompleteJob}
                      size="lg"
                      className="w-full bg-green-600 hover:bg-green-700 mt-4"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Job & Update Incentive
                    </Button>
                  )}

                  {!workflowState.activeJob.canComplete && workflowState.activeJob.blockingReasons.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-red-900 mb-1">Cannot Complete:</p>
                          {workflowState.activeJob.blockingReasons.map((reason, idx) => (
                            <p key={idx} className="text-xs text-red-800">• {reason}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Incentive Tracker */}
          <div className="space-y-6">
            <IncentiveTracker />
          </div>
        </div>

        {/* Alerts */}
        {workflowState.activeAlerts.length > 0 && (
          <AlertStack
            alerts={workflowState.activeAlerts}
            onDismiss={handleDismissAlert}
          />
        )}

        {/* Photo Capture Modal */}
        {showPhotoCapture && currentPhotoTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="max-w-md w-full">
              <PhotoValidationCapture
                photoNumber={1}
                totalPhotos={currentPhotoTask.photoCount}
                taskName={currentPhotoTask.name}
                onPhotoValidated={handlePhotoValidated}
                onValidationFailed={(error) => toast.error(`Validation failed: ${error}`)}
                validatePhoto={async (photoUrl) => {
                  return await workflowControlService.validatePhoto(photoUrl, "PHOTO_QUALITY", {});
                }}
              />
              <Button
                onClick={() => {
                  setShowPhotoCapture(false);
                  setCurrentPhotoTask(null);
                }}
                variant="destructive"
                className="w-full mt-4"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
