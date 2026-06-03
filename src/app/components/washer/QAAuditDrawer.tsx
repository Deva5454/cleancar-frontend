// QA Audit Drawer - Right-side sheet for quality assurance audits
// Triggered from job detail screen for flagged jobs
// Locks after submission
import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Star, Upload, X, ShieldCheck, AlertTriangle } from "lucide-react";
import type { CustomerJob } from "../../services/mockWasherDataService";
import { ConfirmDialog } from "../shared/ConfirmDialog";

interface QAAuditDrawerProps {
  job: CustomerJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (auditData: QAAuditData) => void;
}

export interface QAAuditData {
  jobId: string;
  ratings: {
    vehicleCleanliness: number;
    interiorCondition: number;
    timeliness: number;
    customerSatisfaction: number;
    equipmentHandling: number;
    workAreaCleanup: number;
  };
  photos: File[];
  comments: string;
  qualityScore: number; // Calculated: average of ratings * 20
  complianceScore: number; // Derived from checklist adherence
  auditedBy: string;
  auditDate: string;
}

interface ChecklistItem {
  key: keyof QAAuditData["ratings"];
  label: string;
  description: string;
}

const checklistItems: ChecklistItem[] = [
  {
    key: "vehicleCleanliness",
    label: "Vehicle Cleanliness",
    description: "Overall exterior cleanliness and finish quality",
  },
  {
    key: "interiorCondition",
    label: "Interior Condition",
    description: "Dashboard, seats, and interior surfaces cleaned properly",
  },
  {
    key: "timeliness",
    label: "Timeliness",
    description: "Job completed within scheduled time slot",
  },
  {
    key: "customerSatisfaction",
    label: "Customer Satisfaction",
    description: "Customer feedback and satisfaction level",
  },
  {
    key: "equipmentHandling",
    label: "Equipment Handling",
    description: "Proper use and care of cleaning equipment",
  },
  {
    key: "workAreaCleanup",
    label: "Work Area Cleanup",
    description: "Cleanup after service completion",
  },
];

export function QAAuditDrawer({ job, open, onOpenChange, onSubmit }: QAAuditDrawerProps) {
  const [ratings, setRatings] = useState<QAAuditData["ratings"]>({
    vehicleCleanliness: 0,
    interiorCondition: 0,
    timeliness: 0,
    customerSatisfaction: 0,
    equipmentHandling: 0,
    workAreaCleanup: 0,
  });
  const [photos, setPhotos] = useState<File[]>([]);
  const [comments, setComments] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; description: string; onConfirm: () => void;
  }>({ open: false, title: "", description: "", onConfirm: () => {} });

  // Calculate quality score (average of ratings * 20 to get 0-100 scale)
  const calculateQualityScore = (): number => {
    const ratingValues = Object.values(ratings);
    const sum = ratingValues.reduce((acc, val) => acc + val, 0);
    const average = sum / ratingValues.length;
    return Math.round(average * 20);
  };

  // Calculate compliance score based on adherence to checklist
  const calculateComplianceScore = (): number => {
    const ratingValues = Object.values(ratings);
    const completedItems = ratingValues.filter((val) => val > 0).length;
    const totalItems = ratingValues.length;

    // Base compliance on completion rate and quality
    const completionRate = (completedItems / totalItems) * 100;
    const averageRating = ratingValues.reduce((acc, val) => acc + val, 0) / totalItems;
    const qualityFactor = (averageRating / 5) * 100;

    // Weighted: 60% completion, 40% quality
    return Math.round(completionRate * 0.6 + qualityFactor * 0.4);
  };

  const qualityScore = calculateQualityScore();
  const complianceScore = calculateComplianceScore();

  // Check if any rating is below 4 (requires photo)
  const hasLowRatings = Object.values(ratings).some((rating) => rating > 0 && rating < 4);
  const photoRequired = hasLowRatings && photos.length === 0;

  // Check if all ratings are filled
  const allRatingsComplete = Object.values(ratings).every((rating) => rating > 0);

  // Form validity
  const isValid = allRatingsComplete && (!photoRequired || photos.length > 0);

  const handleRatingChange = (key: keyof QAAuditData["ratings"], value: number) => {
    if (isSubmitted) return;
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitted) return;
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files]);
  };

  const handleRemovePhoto = (index: number) => {
    if (isSubmitted) return;
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!isValid || isSubmitted) return;

    const auditData: QAAuditData = {
      jobId: job.id,
      ratings,
      photos,
      comments,
      qualityScore,
      complianceScore,
      auditedBy: "QA Manager", // In real app: currentUser.name
      auditDate: new Date().toISOString(),
    };

    onSubmit(auditData);
    setIsSubmitted(true);
  };

  const handleClose = () => {
    if (!isSubmitted) {
      setConfirmState({
        open: true,
        title: "Unsaved Changes",
        description: "You have unsaved changes. Are you sure you want to close?",
        onConfirm: () => {
          onOpenChange(false);
          setConfirmState(s => ({ ...s, open: false }));
        }
      });
      return;
    }
    onOpenChange(false);
  };

  return (
    <>
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            QA Audit - Job #{job.id}
          </SheetTitle>
          <SheetDescription>
            Quality assurance audit for {job.customerFirstName}'s {job.packageName}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Job Info Summary */}
          <div className="bg-gray-50 rounded-lg p-3 text-sm">
            <p className="font-medium text-gray-900">{job.customerFirstName}</p>
            <p className="text-gray-600">{job.timeSlot} • {job.packageName}</p>
            <p className="text-gray-600">{job.area}, {job.pinCode}</p>
          </div>

          {/* Submission Status */}
          {isSubmitted && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm font-medium text-green-900">✓ Audit Submitted</p>
              <p className="text-xs text-green-700 mt-1">This audit has been locked and cannot be edited.</p>
            </div>
          )}

          {/* Checklist Items */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Quality Checklist</Label>
            {checklistItems.map((item) => (
              <div key={item.key} className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(item.key, star)}
                      disabled={isSubmitted}
                      className={`transition-colors ${
                        isSubmitted ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                      }`}
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= ratings[item.key]
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-sm font-medium text-gray-700 ml-2">
                    {ratings[item.key]}/5
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Photo Evidence</Label>
              {hasLowRatings && (
                <Badge variant="destructive" className="text-xs">
                  Required
                </Badge>
              )}
            </div>
            {hasLowRatings && (
              <div className="bg-amber-50 border border-amber-200 rounded p-2">
                <p className="text-xs text-amber-900 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Photo required for ratings below 4 stars
                </p>
              </div>
            )}

            {!isSubmitted && (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  disabled={isSubmitted}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isSubmitted}
                    onClick={() => document.getElementById("photo-upload")?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photos
                  </Button>
                </label>
              </div>
            )}

            {/* Photo Previews */}
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded border border-gray-200"
                    />
                    {!isSubmitted && (
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-base font-semibold">
              Comments (Optional)
            </Label>
            <Textarea
              id="comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitted}
              placeholder="Add any additional observations or notes..."
              rows={3}
            />
          </div>

          {/* Calculated Scores */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-teal-900">System Calculated Scores</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-teal-700">Quality Score</p>
                <p className="text-2xl font-bold text-teal-900">{qualityScore}/100</p>
              </div>
              <div>
                <p className="text-xs text-teal-700">Compliance Score</p>
                <p className="text-2xl font-bold text-teal-900">{complianceScore}/100</p>
              </div>
            </div>
            <p className="text-xs text-teal-600">
              Scores are automatically calculated based on your ratings and cannot be manually edited
            </p>
          </div>

          {/* Submit Button */}
          <div className="space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitted}
              className="w-full h-12 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitted ? "Audit Submitted" : "Submit QA Audit"}
            </Button>
            {!isValid && !isSubmitted && (
              <p className="text-xs text-amber-600 text-center">
                {!allRatingsComplete
                  ? "Please complete all rating items"
                  : photoRequired
                  ? "Photo evidence required for low ratings"
                  : "Please complete the form"}
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <ConfirmDialog
      open={confirmState.open}
      title={confirmState.title}
      description={confirmState.description}
      onConfirm={confirmState.onConfirm}
      onCancel={() => setConfirmState(s => ({ ...s, open: false }))}
    />
    </>
  );
}
