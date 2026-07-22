import { useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Textarea } from "../../ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import { toast } from "sonner";

const VALID_TIME_SLOTS = ["06:00", "07:00", "08:00"];
const COMPLETED_STATUSES = ["Completed", "Verified"];

export function FreeRedoPanel({ customer, jobs, createJob, city, currentUser }: {
  customer: any; jobs: any[]; createJob: (job: any) => any; city: string; currentUser: any;
}) {
  const recentCompleted = jobs
    .filter((j: any) => COMPLETED_STATUSES.includes(j.status))
    .sort((a: any, b: any) => b.scheduledDate.localeCompare(a.scheduledDate))
    .slice(0, 10);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [reason, setReason] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [timeSlot, setTimeSlot] = useState(VALID_TIME_SLOTS[0]);
  const isSunday = scheduledDate ? new Date(scheduledDate).getDay() === 0 : false;

  const selectedJob = recentCompleted.find((j: any) => j.jobId === selectedJobId);

  const handleSubmit = () => {
    if (!selectedJob) { toast.error("Select the wash that needs a redo"); return; }
    if (!reason.trim()) { toast.error("Enter a reason for the free redo"); return; }
    if (isSunday) { toast.error("Sunday is a rest day — please pick a different date"); return; }
    try {
      createJob({
        customerId: customer.customerId,
        scheduledDate, timeSlot, status: "Unassigned", jobType: "Regular",
        // Genuinely no charge - a free redo, not a job with payment
        // pending, so nobody asks this customer to pay for it.
        paymentStatus: "Paid",
        finalAmount: 0,
        packageName: `Free Redo — ${selectedJob.packageName}`,
        packageType: selectedJob.packageType,
        vehicleDetails: selectedJob.vehicleDetails,
        location: selectedJob.location || {
          addressLine1: customer.address?.line1 || "", area: customer.address?.area || "",
          city: customer.address?.city || "", pinCode: customer.address?.pinCode || "",
        },
        serviceDetails: {}, cityId: city,
        notes: `Free redo for ${selectedJob.jobId}, booked by CCE (${currentUser?.name || "CCE"}) — reason: ${reason}`,
      } as any);
      toast.success(`Free redo booked for ${scheduledDate}`);
      setSelectedJobId(""); setReason("");
    } catch (err: any) {
      toast.error(err?.message || "Could not book this redo");
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {recentCompleted.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No completed washes found for this customer.</p>
        ) : (
          <div>
            <Label>Which wash needs a redo?</Label>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger><SelectValue placeholder="Select the wash" /></SelectTrigger>
              <SelectContent>
                {recentCompleted.map((j: any) => (
                  <SelectItem key={j.jobId} value={j.jobId}>{j.scheduledDate} — {j.packageName} ({j.vehicleDetails?.registration || "—"})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label>Reason for Free Redo</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What went wrong with the original wash" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Date</Label>
            <Input type="date" value={scheduledDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setScheduledDate(e.target.value)} />
            {isSunday && <p className="text-xs text-red-600 mt-1">Sunday is a rest day</p>}
          </div>
          <div>
            <Label>Time</Label>
            <Select value={timeSlot} onValueChange={setTimeSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{VALID_TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={!selectedJob || isSunday} className="w-full">Book Free Redo</Button>
      </CardContent>
    </Card>
  );
}
