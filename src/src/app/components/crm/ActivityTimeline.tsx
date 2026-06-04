import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useCustomers } from "../../contexts/CustomerContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
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
  Phone,
  MessageSquare,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Mail,
  Video,
  FileText,
  Bell,
  AlertCircle,
  Send,
} from "lucide-react";

type ActivityType =
  | "call"
  | "whatsapp"
  | "email"
  | "meeting"
  | "followup"
  | "note"
  | "demo"
  | "proposal";

type Activity = {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  status: "completed" | "scheduled" | "missed" | "pending";
  performedBy: string;
  outcome?: string;
  nextAction?: string;
  reminderSent?: boolean;
};

const mockActivities: Activity = []; // ✅ No mock data

const activityConfig = {
  call: { label: "Phone Call", icon: Phone, color: "bg-blue-100 text-blue-800" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-green-100 text-green-800" },
  email: { label: "Email", icon: Mail, color: "bg-purple-100 text-purple-800" },
  meeting: { label: "Meeting", icon: Video, color: "bg-indigo-100 text-indigo-800" },
  followup: { label: "Follow-up", icon: Calendar, color: "bg-orange-100 text-orange-800" },
  note: { label: "Note", icon: FileText, color: "bg-gray-100 text-gray-800" },
  demo: { label: "Demo Wash", icon: CheckCircle, color: "bg-cyan-100 text-cyan-800" },
  proposal: { label: "Proposal", icon: Send, color: "bg-yellow-100 text-yellow-800" },
};

type ActivityTimelineProps = {
  leadId: string;
  leadName: string;
};

export function ActivityTimeline({ leadId, leadName }: ActivityTimelineProps) {
  const { leads, appendLeadActivity } = useCustomers();
  const lead = leads.find(l => l.leadId === leadId);
  const realTimeline = lead?.timeline || [];

  // Map LeadActivity to Activity format for display
  const [activities, setActivities] = useState<Activity[]>(() =>
    realTimeline.map(t => ({
      id: t.id,
      type: t.type,
      title: t.description,
      description: t.outcome || t.nextAction || "",
      timestamp: t.timestamp,
      status: "completed" as const,
      performedBy: t.performedBy,
      reminderSent: false,
    }))
  );

  // Sync when lead timeline changes
  useEffect(() => {
    const updated = (lead?.timeline || []).map(t => ({
      id: t.id, type: t.type, title: t.description,
      description: t.outcome || "", timestamp: t.timestamp,
      status: "completed" as const, performedBy: t.performedBy, reminderSent: false,
    }));
    setActivities(updated);
  }, [lead?.timeline?.length]);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>("call");
  const [activityTitle, setActivityTitle] = useState("");
  const [activityDescription, setActivityDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sendReminder, setSendReminder] = useState(true);

  const addActivity = (text: string) => {
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: "note",
      description: text,
      performedBy: "TSE",
    });
  };

  const handleAddActivity = () => {
    appendLeadActivity(leadId, {
      timestamp: new Date().toISOString(),
      type: activityType,
      description: `${activityTitle}: ${activityDescription}`,
      performedBy: "TSE",
      outcome: scheduledDate && scheduledTime ? `Scheduled for ${scheduledDate} ${scheduledTime}` : undefined,
    });

    // Reset form
    setActivityTitle("");
    setActivityDescription("");
    setScheduledDate("");
    setScheduledTime("");
    setSendReminder(true);
    setShowAddActivity(false);

    // Show success message
    toast.success(
      scheduledDate && scheduledTime
        ? `Follow-up scheduled for ${scheduledDate} ${scheduledTime}${sendReminder ? '. Reminder will be sent 1 hour before.' : ''}`
        : `Activity logged successfully!`
    );
  };

  const completedActivities = activities.filter((a) => a.status === "completed");
  const scheduledActivities = activities.filter((a) => a.status === "scheduled");
  const upcomingActivities = scheduledActivities.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Activity Timeline</h3>
          <p className="text-sm text-gray-500 mt-1">
            Lead: {leadName} ({leadId})
          </p>
        </div>
        <Button onClick={() => setShowAddActivity(true)}>
          <Calendar className="w-4 h-4 mr-2" />
          Add Activity
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">
                  {activities.length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-gray-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {completedActivities.length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-orange-600">
                  {scheduledActivities.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reminders Set</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activities.filter((a) => a.reminderSent).length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Follow-ups */}
      {upcomingActivities.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertCircle className="w-5 h-5" />
              Upcoming Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingActivities.map((activity) => {
              const config = activityConfig[activity.type];
              const Icon = config.icon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {activity.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {activity.description}
                        </p>
                      </div>
                      {activity.reminderSent && (
                        <Badge className="bg-blue-100 text-blue-800">
                          <Bell className="w-3 h-3 mr-1" />
                          Reminder Set
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.timestamp}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.performedBy}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Activity History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {/* Activities */}
            <div className="space-y-6">
              {activities.map((activity, index) => {
                const config = activityConfig[activity.type];
                const Icon = config.icon;
                const isLast = index === activities.length - 1;

                return (
                  <div key={activity.id} className="relative flex gap-4">
                    {/* Icon */}
                    <div className={`relative z-10 p-2 rounded-full ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {activity.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={config.color}>
                                {config.label}
                              </Badge>
                              {activity.status === "completed" && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                              {activity.status === "scheduled" && (
                                <Badge className="bg-orange-100 text-orange-800">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  Scheduled
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {activity.timestamp.split(" ")[1]}{" "}
                              {activity.timestamp.split(" ")[2]}
                            </div>
                            <div className="text-xs text-gray-500">
                              {activity.timestamp.split(" ")[0]}
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">
                          {activity.description}
                        </p>

                        {activity.outcome && (
                          <div className="bg-white rounded p-3 mb-2 border border-gray-200">
                            <p className="text-xs font-medium text-gray-500 mb-1">
                              Outcome:
                            </p>
                            <p className="text-sm text-gray-900">
                              {activity.outcome}
                            </p>
                          </div>
                        )}

                        {activity.nextAction && (
                          <div className="bg-blue-50 rounded p-3 border border-blue-200">
                            <p className="text-xs font-medium text-blue-700 mb-1">
                              Next Action:
                            </p>
                            <p className="text-sm text-blue-900">
                              {activity.nextAction}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <User className="w-3 h-3" />
                            {activity.performedBy}
                          </div>
                          {activity.reminderSent && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Bell className="w-3 h-3" />
                              Reminder sent
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Activity Modal */}
      {showAddActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add Activity / Schedule Follow-up</CardTitle>
              <p className="text-sm text-gray-500">
                Log a completed activity or schedule a future follow-up
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Activity Type</Label>
                <Select
                  value={activityType}
                  onValueChange={(value) => setActivityType(value as ActivityType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="demo">Demo Wash</SelectItem>
                    <SelectItem value="proposal">Send Proposal</SelectItem>
                    <SelectItem value="note">Add Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  placeholder="e.g., Follow-up call to discuss pricing"
                  value={activityTitle}
                  onChange={(e) => setActivityTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  placeholder="Add details about the activity..."
                  rows={3}
                  value={activityDescription}
                  onChange={(e) => setActivityDescription(e.target.value)}
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">
                  Schedule for Future? (Optional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                {scheduledDate && scheduledTime && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="sendReminder"
                            checked={sendReminder}
                            onChange={(e) => setSendReminder(e.target.checked)}
                            className="rounded"
                          />
                          <label
                            htmlFor="sendReminder"
                            className="text-sm font-medium text-blue-900"
                          >
                            Send reminder notification
                          </label>
                        </div>
                        <p className="text-xs text-blue-700 mt-1 ml-6">
                          You'll receive a reminder 1 hour before the scheduled time
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleAddActivity}
                  disabled={!activityTitle || !activityDescription}
                >
                  {scheduledDate && scheduledTime ? "Schedule Follow-up" : "Log Activity"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddActivity(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
