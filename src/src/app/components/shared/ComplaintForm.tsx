import { useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

interface ComplaintFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ComplaintData) => void;
  userType: "customer" | "washer";
  bookingId?: string;
}

export interface ComplaintData {
  issueType: string;
  description: string;
  images: File[];
}

const CUSTOMER_ISSUE_TYPES = [
  { value: "poor_quality", label: "Poor Wash Quality" },
  { value: "delay", label: "Service Delay" },
  { value: "staff_behavior", label: "Staff Behavior Issue" },
  { value: "payment", label: "Payment Issue" },
  { value: "other", label: "Other" },
];

const WASHER_ISSUE_TYPES = [
  { value: "customer_unavailable", label: "Customer Not Available" },
  { value: "wrong_location", label: "Wrong Location" },
  { value: "payment_dispute", label: "Payment Dispute" },
  { value: "technical", label: "Technical Issue" },
  { value: "other", label: "Other" },
];

export function ComplaintForm({
  isOpen,
  onClose,
  onSubmit,
  userType,
  bookingId,
}: ComplaintFormProps) {
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const issueTypes = userType === "customer" ? CUSTOMER_ISSUE_TYPES : WASHER_ISSUE_TYPES;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!issueType || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ issueType, description, images });
      setIssueType("");
      setDescription("");
      setImages([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {userType === "customer" ? "Report an Issue" : "Raise Issue"}
          </DialogTitle>
          <DialogDescription>
            {userType === "customer"
              ? "Let us know what went wrong with your booking"
              : "Report any issues with this job"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {bookingId && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Booking ID: <span className="font-medium text-slate-900">{bookingId}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="issue-type">Issue Type *</Label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger id="issue-type">
                <SelectValue placeholder="Select issue type" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Images (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm text-muted-foreground">
                  Click to upload images
                </span>
              </label>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="relative bg-slate-100 p-2 rounded-lg group"
                  >
                    <p className="text-xs text-muted-foreground max-w-[100px] truncate">
                      {image.name}
                    </p>
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
