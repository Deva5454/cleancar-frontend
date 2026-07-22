import { useState } from "react";
import { Card, CardContent } from "../../ui/card";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../ui/select";
import { Badge } from "../../ui/badge";
import { toast } from "sonner";

const VALID_TIME_SLOTS = ["06:00", "07:00", "08:00"];

const UPCOMING_STATUSES = ["Unassigned", "Assigned", "Acknowledged", "In Progress"];

export function RescheduleCancelPanel({ jobs, updateJob, currentUser }: {
  jobs: any[]; updateJob: (jobId: string, updates: any) => void; currentUser: any;
}) {
  const upcomingJobs = jobs
    .filter((j: any) => UPCOMING_STATUSES.includes(j.status))
    .sort((a: any, b: any) => a.scheduledDate.localeCompare(b.scheduledDate));

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState(VALID_TIME_SLOTS[0]);

  const openReschedule = (job: any) => {
    setReschedulingId(job.jobId);
    setNewDate(job.scheduledDate);
    setNewTime(VALID_TIME_SLOTS.includes(job.timeSlot) ? job.timeSlot : VALID_TIME_SLOTS[0]);
  };

  const confirmReschedule = () => {
    if (!reschedulingId || !newDate) return;
    // Real validation - createJob() enforces Sunday and the 5-9AM wash
    // band, but updateJob() itself does neither, so a direct staff
    // reschedule needs the same real check applied here explicitly.
    if (new Date(newDate).getDay() === 0) {
      toast.error("Sunday is a rest day — please pick a different date");
      return;
    }
    updateJob(reschedulingId, {
      scheduledDate: newDate,
      timeSlot: newTime,
      notes: `Rescheduled by CCE (${currentUser?.name || "CCE"}) via phone`,
    });
    toast.success("Booking rescheduled");
    setReschedulingId(null);
  };

  const handleCancel = (job: any) => {
    updateJob(job.jobId, {
      status: "Cancelled",
      cancellationReason: `Cancelled by CCE (${currentUser?.name || "CCE"}) via phone`,
      cancelledAt: new Date().toISOString(),
    });
    toast.success("Booking cancelled");
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {upcomingJobs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No upcoming bookings for this customer.</p>
        ) : (
          upcomingJobs.map((job: any) => (
            <div key={job.jobId} className="border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{job.packageName}</p>
                  <p className="text-xs text-gray-500">
                    {job.scheduledDate} · {job.timeSlot} · {job.vehicleDetails?.registration || "—"}
                  </p>
                </div>
                <Badge variant="secondary">{job.status}</Badge>
              </div>
              {reschedulingId === job.jobId ? (
                <div className="mt-3 pt-3 border-t space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">New Date</Label>
                      <Input type="date" value={newDate} min={new Date().toISOString().split("T")[0]} onChange={(e) => setNewDate(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-xs">New Time</Label>
                      <Select value={newTime} onValueChange={setNewTime}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {VALID_TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setReschedulingId(null)}>Cancel</Button>
                    <Button size="sm" onClick={confirmReschedule}>Confirm Reschedule</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => openReschedule(job)}>Reschedule</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleCancel(job)}>Cancel Booking</Button>
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
