// Job Detail Screen - Complete job execution with 3 tabs
// Info, Checklist, Report
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { WasherJobInfo } from "./WasherJobInfo";
import { WasherJobChecklist } from "./WasherJobChecklist";
import { WasherJobReport } from "./WasherJobReport";
import type { CustomerJob } from "../../services/mockWasherDataService";

interface WasherJobDetailProps {
  job: CustomerJob;
  onBack: () => void;
  onStartJob: () => void;
  onCompleteJob: () => void;
}

export function WasherJobDetail({ job, onBack, onStartJob, onCompleteJob }: WasherJobDetailProps) {
  const [activeTab, setActiveTab] = useState("info");
  const [checklistComplete, setChecklistComplete] = useState(false);
  const [photosComplete, setPhotosComplete] = useState(false);

  const canStartJob = job.status === "Assigned" || job.status === "Acknowledged";
  const isInProgress = job.status === "In Progress";
  const isCompleted = job.status === "Completed";
  const isVerified = job.status === "Verified";
  const isReportUnlocked = isCompleted || isVerified || (checklistComplete && photosComplete);

  const handleChecklistChange = (complete: boolean, photos: boolean, autoAdvance?: string) => {
    setChecklistComplete(complete);
    setPhotosComplete(photos);

    // Auto-advance to next tab if requested
    if (autoAdvance) {
      setActiveTab(autoAdvance);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{job.customerFirstName}</h1>
              <p className="text-sm text-gray-500">{job.timeSlot} • {job.packageName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-[73px] z-10 bg-white border-b border-gray-200">
          <TabsList className="w-full justify-start rounded-none h-12 bg-transparent border-b-0">
            <TabsTrigger value="info" className="flex-1 h-full rounded-none">
              Info
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex-1 h-full rounded-none">
              Checklist
            </TabsTrigger>
            <TabsTrigger 
              value="report" 
              className="flex-1 h-full rounded-none"
              disabled={!isReportUnlocked}
            >
              Report {!isReportUnlocked && "🔒"}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info" className="mt-0">
          <WasherJobInfo job={job} />
        </TabsContent>

        <TabsContent value="checklist" className="mt-0">
          <WasherJobChecklist 
            job={job} 
            onChecklistChange={handleChecklistChange}
            isInProgress={isInProgress}
          />
        </TabsContent>

        <TabsContent value="report" className="mt-0">
          {isReportUnlocked ? (
            <WasherJobReport job={job} onComplete={onCompleteJob} />
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">
                Complete the checklist and photos to unlock the report.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Bottom Action Button */}
      {!isCompleted && !isVerified && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          {canStartJob && (
            <Button
              onClick={onStartJob}
              className="w-full h-14 bg-teal-600 hover:bg-teal-700 text-white text-lg font-semibold"
            >
              Start Job
            </Button>
          )}
          {isInProgress && (
            <Button
              className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white text-lg font-semibold"
            >
              Resume Job
            </Button>
          )}
        </div>
      )}
      {(isCompleted || isVerified) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="space-y-2">
            <Button
              onClick={() => setActiveTab("report")}
              variant="outline"
              className="w-full h-14 text-lg font-semibold"
            >
              View Submitted Report
            </Button>
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-green-900">✓ Job Verified by System</p>
                <p className="text-xs text-green-700 mt-1">Quality and compliance checks passed</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
