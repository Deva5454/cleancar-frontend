import { useState, useMemo, useEffect } from "react";
import { useCustomers } from "../../contexts/CustomerContext";
import { useCity } from "../../contexts/CityContext";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
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
  FileText,
  Calendar,
  Clock,
  MoveRight,
  XCircle,
  CheckCircle,
  ChevronRight,
  AlertCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import { useRole } from "../../contexts/RoleContext";
import { LeadContextPanel } from "./LeadContextPanel";
import { LogCallPanel } from "./actions/LogCallPanel";
import { SendMessagePanel } from "./actions/SendMessagePanel";
import { SendPlanPricePanel } from "./actions/SendPlanPricePanel";
import { ScheduleDemoPanel } from "./actions/ScheduleDemoPanel";
import { SetFollowUpPanel } from "./actions/SetFollowUpPanel";

interface FollowUpLead {
  id: string;
  customerName: string;
  mobile: string;
  email: string;
  vehicleCategory: "Hatchback" | "Sedan" | "SUV";
  planOfInterest: string;
  stage: string;
  temperature: "Hot" | "Warm" | "Cold";
  priority: "High" | "Medium" | "Low";
  urgencyReason: string;
  lastActivity: string;
  lastActivityTime: string;
  followUpDue: string;
  assignedTSE: string;
  area: string;
  demoScheduled?: boolean;
  demoDate?: string;
  washerAssigned?: boolean;
  demoCompleted?: boolean;
  createdAt: string;
  hoursOverdue?: number;
  waitingMinutes?: number;
  customerReplied?: boolean;
  postDemoDue?: boolean;
  preDemoCheckIn?: boolean;
}

export function MyFollowUps() {
  const { currentUser, role } = useRole();
  const { cityLeads } = useCustomers();
  const { city } = useCity();
  const [selectedLead, setSelectedLead] = useState<FollowUpLead | null>(null);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [temperatureFilter, setTemperatureFilter] = useState<string>("all");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("urgency");
  const [selectedTSE, setSelectedTSE] = useState(currentUser.name);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeActionPanel, setActiveActionPanel] = useState<{
    leadId: string;
    action: string;
  } | null>(null);
  const [actionedLeads, setActionedLeads] = useState<Set<string>>(new Set());

  const allFollowUpLeads = cityLeads
    .filter(l => l.followUpDate && l.stage !== "converted" && l.stage !== "lost")
    .map(l => ({
      id: l.leadId,
      customerName: `${l.firstName} ${l.lastName}`,
      mobile: l.phone,
      email: l.email || "",
      vehicleCategory: (l.vehicleCategory || "Sedan") as "Hatchback" | "Sedan" | "SUV",
      planOfInterest: l.planOfInterest || "CleanCar Basic",
      stage: l.stage || "new",
      temperature: (l.temperature || "Cold") as "Hot" | "Warm" | "Cold",
      priority: "Medium" as "High" | "Medium" | "Low",
      urgencyReason: l.followUpDate && l.followUpDate < new Date().toISOString().split("T")[0] ? "Follow-up overdue" : "Follow-up due",
      lastActivity: l.lastContactedAt
        ? `Last contacted ${new Date(l.lastContactedAt).toLocaleDateString("en-IN")}`
        : "No contact yet",
      lastActivityTime: l.lastContactedAt
        ? new Date(l.lastContactedAt).toLocaleString("en-IN")
        : "Never",
      followUpDue: l.followUpDate || "",
      assignedTSE: l.assignedTSE || l.assignedTo || "Unassigned",
      area: l.address?.area ?? "",
      createdAt: l.createdAt,
    }));

  // Old mock data removed
  const oldMockLeads: FollowUpLead[] = [
    {
      id: "L001",
      customerName: "Rajesh Sharma",
      mobile: "+91 98765 43210",
      email: "rajesh.sharma@email.com",
      vehicleCategory: "Sedan",
      planOfInterest: "CleanCar Premium",
      stage: "New",
      temperature: "Hot",
      priority: "High",
      urgencyReason: "New lead — no first call",
      lastActivity: "Lead created",
      lastActivityTime: "18 min ago",
      followUpDue: "2026-03-17",
      assignedTSE: "Neha Singh",
      area: "Vesu",
      createdAt: "2026-03-17T09:00:00",
      waitingMinutes: 18,
    },
    {
      id: "L002",
      customerName: "Priya Patel",
      mobile: "+91 98234 56789",
      email: "priya.patel@email.com",
      vehicleCategory: "SUV",
      planOfInterest: "CleanCar Elite",
      stage: "Contacted",
      temperature: "Warm",
      priority: "High",
      urgencyReason: "Follow-up overdue 2h",
      lastActivity: "Last call: Not Connected",
      lastActivityTime: "Mar 15, 2:30 PM",
      followUpDue: "2026-03-15",
      assignedTSE: "Neha Singh",
      area: "Adajan",
      hoursOverdue: 2,
    },
    {
      id: "L003",
      customerName: "Amit Kumar",
      mobile: "+91 99876 54321",
      email: "amit.kumar@email.com",
      vehicleCategory: "Hatchback",
      planOfInterest: "CleanCar Basic",
      stage: "Demo Done",
      temperature: "Hot",
      priority: "High",
      urgencyReason: "Post-demo follow-up due",
      lastActivity: "Demo completed — Positive feedback",
      lastActivityTime: "Mar 16, 11:00 AM",
      followUpDue: "2026-03-17",
      assignedTSE: "Neha Singh",
      area: "Citylight",
      demoScheduled: true,
      demoDate: "Mar 16, 2026",
      washerAssigned: true,
      demoCompleted: true,
      postDemoDue: true,
      createdAt: "2026-03-10T10:00:00",
    },
    {
      id: "L004",
      customerName: "Sneha Desai",
      mobile: "+91 97654 32109",
      email: "sneha.desai@email.com",
      vehicleCategory: "Sedan",
      planOfInterest: "CleanCar Premium",
      stage: "Demo Scheduled",
      temperature: "Warm",
      priority: "Medium",
      urgencyReason: "Demo in 2 days — check-in needed",
      lastActivity: "Demo scheduled for Mar 19",
      lastActivityTime: "Mar 14, 4:20 PM",
      followUpDue: "2026-03-17",
      assignedTSE: "Neha Singh",
      area: "Pal",
      demoScheduled: true,
      demoDate: "Mar 19, 2026",
      washerAssigned: true,
      preDemoCheckIn: true,
      createdAt: "2026-03-12T14:00:00",
    },
    {
      id: "L005",
      customerName: "Vikram Mehta",
      mobile: "+91 96543 21098",
      email: "vikram.mehta@email.com",
      vehicleCategory: "SUV",
      planOfInterest: "CleanCar Elite",
      stage: "Qualified",
      temperature: "Warm",
      priority: "Medium",
      urgencyReason: "Customer replied — unread",
      lastActivity: "Customer sent WhatsApp reply",
      lastActivityTime: "32 min ago",
      followUpDue: "2026-03-17",
      assignedTSE: "Neha Singh",
      area: "Vesu",
      customerReplied: true,
      createdAt: "2026-03-14T11:00:00",
    },
  ];

  // Filter leads based on role
  const myFollowUpLeads = useMemo(() => {
    let leads = allFollowUpLeads;

    // TSE sees only their leads; TSM/Team Lead can switch
    if (role === "TSE") {
      leads = leads.filter((lead) => lead.assignedTSE === currentUser.name);
    } else {
      leads = leads.filter((lead) => lead.assignedTSE === selectedTSE);
    }

    // Apply filters
    if (stageFilter.length > 0) {
      leads = leads.filter((lead) => stageFilter.includes(lead.stage));
    }

    if (temperatureFilter !== "all") {
      leads = leads.filter((lead) => lead.temperature === temperatureFilter);
    }

    if (urgencyFilter !== "all") {
      leads = leads.filter((lead) =>
        lead.urgencyReason.toLowerCase().includes(urgencyFilter.toLowerCase())
      );
    }

    if (searchQuery) {
      leads = leads.filter((lead) =>
        lead.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort leads
    if (sortBy === "urgency") {
      // Customer replies first
      leads.sort((a, b) => {
        if (a.customerReplied && !b.customerReplied) return -1;
        if (!a.customerReplied && b.customerReplied) return 1;

        // New leads with no first call
        if (a.waitingMinutes && !b.waitingMinutes) return -1;
        if (!a.waitingMinutes && b.waitingMinutes) return 1;
        if (a.waitingMinutes && b.waitingMinutes)
          return b.waitingMinutes - a.waitingMinutes;

        // Overdue follow-ups
        if (a.hoursOverdue && !b.hoursOverdue) return -1;
        if (!a.hoursOverdue && b.hoursOverdue) return 1;
        if (a.hoursOverdue && b.hoursOverdue)
          return b.hoursOverdue - a.hoursOverdue;

        // Post-demo follow-ups
        if (a.postDemoDue && !b.postDemoDue) return -1;
        if (!a.postDemoDue && b.postDemoDue) return 1;

        // Pre-demo check-ins
        if (a.preDemoCheckIn && !b.preDemoCheckIn) return -1;
        if (!a.preDemoCheckIn && b.preDemoCheckIn) return 1;

        return 0;
      });
    }

    return leads;
  }, [
    allFollowUpLeads,
    role,
    currentUser.name,
    selectedTSE,
    stageFilter,
    temperatureFilter,
    urgencyFilter,
    searchQuery,
    sortBy,
  ]);

  // Calculate response time alerts
  const newLeadsNoFirstCall = myFollowUpLeads.filter((l) => l.waitingMinutes);
  const oldestNewLead = newLeadsNoFirstCall.reduce((oldest, lead) =>
    (lead.waitingMinutes || 0) > (oldest?.waitingMinutes || 0) ? lead : oldest
  , newLeadsNoFirstCall[0]);

  // Daily performance metrics
  const dailyMetrics = {
    callsMade: 12,
    connected: 8,
    avgTalkTime: 4.5,
    followUpsDone: actionedLeads.size,
    followUpsTotal: myFollowUpLeads.length,
    messagesSent: 15,
    demosScheduled: 2,
    bookings: 1,
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      New: "bg-blue-100 text-blue-700",
      Contacted: "bg-gray-100 text-gray-700",
      Qualified: "bg-amber-100 text-amber-700",
      "Demo Scheduled": "bg-teal-100 text-teal-700",
      "Demo Done": "bg-purple-100 text-purple-700",
      "Proposal Sent": "bg-orange-100 text-orange-700",
      Negotiation: "bg-yellow-100 text-yellow-700",
      "Booking Confirmed": "bg-green-100 text-green-700",
      Lost: "bg-red-100 text-red-700",
    };
    return colors[stage] || "bg-gray-100 text-gray-700";
  };

  const getTemperatureColor = (temp: string) => {
    const colors: Record<string, string> = {
      Hot: "bg-red-100 text-red-700",
      Warm: "bg-amber-100 text-amber-700",
      Cold: "bg-blue-100 text-blue-700",
    };
    return colors[temp] || "bg-gray-100 text-gray-700";
  };

  const handleActionComplete = (leadId: string) => {
    setActionedLeads((prev) => new Set([...prev, leadId]));
    setActiveActionPanel(null);
    
    // Auto-scroll to next card
    const currentIndex = myFollowUpLeads.findIndex((l) => l.id === leadId);
    if (currentIndex < myFollowUpLeads.length - 1) {
      const nextLead = myFollowUpLeads[currentIndex + 1];
      document.getElementById(`lead-card-${nextLead.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Follow-Ups</h2>
        <p className="text-sm text-gray-500 mt-1">
          Your daily command center for lead management
        </p>
      </div>

      {/* Response Time Alert Banner */}
      {newLeadsNoFirstCall.length > 0 && oldestNewLead && (
        <Card
          className={`border-2 ${
            (oldestNewLead.waitingMinutes || 0) > 15
              ? "border-red-500 bg-red-50"
              : "border-amber-500 bg-amber-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <AlertCircle
                  className={`w-6 h-6 ${
                    (oldestNewLead.waitingMinutes || 0) > 15
                      ? "text-red-600"
                      : "text-amber-600"
                  }`}
                />
                <div>
                  <p
                    className={`font-medium ${
                      (oldestNewLead.waitingMinutes || 0) > 15
                        ? "text-red-900"
                        : "text-amber-900"
                    }`}
                  >
                    {newLeadsNoFirstCall.length} leads awaiting first contact
                  </p>
                  <p
                    className={`text-sm ${
                      (oldestNewLead.waitingMinutes || 0) > 15
                        ? "text-red-700"
                        : "text-amber-700"
                    }`}
                  >
                    Oldest: {oldestNewLead.customerName} — waiting{" "}
                    {oldestNewLead.waitingMinutes} min
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="default"
                className="bg-teal-600 hover:bg-teal-700"
                onClick={() => setUrgencyFilter("new lead")}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Daily Performance Snapshot Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 overflow-x-auto">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <Phone className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Calls Made</p>
                <p className="text-lg font-bold text-green-600">
                  {dailyMetrics.callsMade}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Connected</p>
                <p className="text-lg font-bold text-green-600">
                  {dailyMetrics.connected}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs text-gray-600">Avg Talk Time</p>
                <p className="text-lg font-bold text-amber-600">
                  {dailyMetrics.avgTalkTime} min
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs text-gray-600">Follow-Ups Done</p>
                <p className="text-lg font-bold text-blue-600">
                  {dailyMetrics.followUpsDone}/{dailyMetrics.followUpsTotal}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200">
              <MessageSquare className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs text-gray-600">Messages Sent</p>
                <p className="text-lg font-bold text-green-600">
                  {dailyMetrics.messagesSent}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-teal-50 rounded-lg border border-teal-200">
              <Calendar className="w-4 h-4 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Demos Scheduled</p>
                <p className="text-lg font-bold text-teal-600">
                  {dailyMetrics.demosScheduled}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-xs text-gray-600">Bookings Today</p>
                <p className="text-lg font-bold text-purple-600">
                  {dailyMetrics.bookings}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      {myFollowUpLeads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {actionedLeads.size} of {myFollowUpLeads.length} leads actioned
              today
            </span>
            <span className="font-medium text-teal-600">
              {Math.round((actionedLeads.size / myFollowUpLeads.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{
                width: `${(actionedLeads.size / myFollowUpLeads.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* TSE Selector for TSM/Team Lead */}
      {(role === "TSM" || role === "Team Lead") && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <label className="text-sm font-medium text-gray-700">
                View Queue For:
              </label>
              <Select value={selectedTSE} onValueChange={setSelectedTSE}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Neha Singh">Neha Singh (TSE)</SelectItem>
                  <SelectItem value="Vikram Kumar">
                    Vikram Kumar (TSE)
                  </SelectItem>
                  <SelectItem value="Anjali Reddy">
                    Anjali Reddy (CCE)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by customer name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={temperatureFilter}
              onValueChange={setTemperatureFilter}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Temps</SelectItem>
                <SelectItem value="Hot">Hot</SelectItem>
                <SelectItem value="Warm">Warm</SelectItem>
                <SelectItem value="Cold">Cold</SelectItem>
              </SelectContent>
            </Select>
            <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Urgency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="overdue">Overdue Follow-up</SelectItem>
                <SelectItem value="new lead">New Lead</SelectItem>
                <SelectItem value="post-demo">Post-Demo</SelectItem>
                <SelectItem value="customer replied">
                  Customer Reply
                </SelectItem>
                <SelectItem value="check-in">Pre-Demo Check-in</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgency">By Urgency</SelectItem>
                <SelectItem value="stage">By Stage</SelectItem>
                <SelectItem value="activity">By Activity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            Showing {myFollowUpLeads.length} leads needing action today
          </p>
        </CardContent>
      </Card>

      {/* Follow-Up Cards */}
      {myFollowUpLeads.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  You are all caught up!
                </h3>
                <p className="text-gray-500 mt-2">
                  No follow-ups pending today. Great work!
                </p>
              </div>
              <Button variant="outline" className="mt-4">
                Browse All Leads
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {myFollowUpLeads.map((lead) => (
            <Card
              key={lead.id}
              id={`lead-card-${lead.id}`}
              className={`${
                lead.waitingMinutes && lead.waitingMinutes > 15
                  ? "border-2 border-teal-400"
                  : ""
              } ${actionedLeads.has(lead.id) ? "opacity-60" : ""}`}
            >
              <CardContent className="p-5">
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {lead.customerName}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getStageColor(lead.stage)}
                      >
                        {lead.stage}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={getTemperatureColor(lead.temperature)}
                      >
                        {lead.temperature}
                      </Badge>
                      <Badge variant="outline">{lead.priority} Priority</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">{lead.vehicleCategory}</Badge>
                      <Badge variant="secondary">{lead.planOfInterest}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="default"
                        className={
                          lead.hoursOverdue
                            ? "bg-red-100 text-red-700"
                            : lead.customerReplied
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }
                      >
                        {lead.urgencyReason}
                      </Badge>
                      {lead.waitingMinutes && (
                        <span className="text-sm text-gray-600">
                          ⏱️ {lead.waitingMinutes} min
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>

                {/* Last Activity */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Last Activity:</span>{" "}
                    {lead.lastActivity}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {lead.lastActivityTime}
                  </p>
                </div>

                {/* Mini Demo Stepper */}
                {lead.demoScheduled && (
                  <div className="mb-4 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        lead.demoScheduled
                          ? "bg-teal-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <div
                      className={`w-3 h-3 rounded-full ${
                        lead.washerAssigned
                          ? "bg-teal-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <div className="w-8 h-0.5 bg-gray-300" />
                    <div
                      className={`w-3 h-3 rounded-full ${
                        lead.demoCompleted
                          ? "bg-teal-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-xs text-gray-500 ml-2">
                      Demo: {lead.demoDate}
                    </span>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() =>
                      setActiveActionPanel({ leadId: lead.id, action: "call" })
                    }
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Log Call
                  </Button>
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-teal-600 hover:bg-teal-700"
                    onClick={() =>
                      setActiveActionPanel({
                        leadId: lead.id,
                        action: "message",
                      })
                    }
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Send Message
                  </Button>
                  {["Qualified", "Demo Scheduled", "Demo Done"].includes(
                    lead.stage
                  ) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActiveActionPanel({
                          leadId: lead.id,
                          action: "plan",
                        })
                      }
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Send Plan & Price
                    </Button>
                  )}
                  {lead.stage === "Qualified" && !lead.demoScheduled && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setActiveActionPanel({
                          leadId: lead.id,
                          action: "demo",
                        })
                      }
                    >
                      <Calendar className="w-4 h-4 mr-1" />
                      Schedule Demo
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setActiveActionPanel({
                        leadId: lead.id,
                        action: "followup",
                      })
                    }
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Set Follow-Up
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setActiveActionPanel({
                        leadId: lead.id,
                        action: "stage",
                      })
                    }
                  >
                    <MoveRight className="w-4 h-4 mr-1" />
                    Move Stage
                  </Button>
                  {!lead.stage.includes("Booking") &&
                    !lead.stage.includes("Lost") && (
                      <Button size="sm" variant="outline" className="text-red-600">
                        <XCircle className="w-4 h-4 mr-1" />
                        Mark Lost
                      </Button>
                    )}
                  {actionedLeads.has(lead.id) && (
                    <Badge variant="secondary" className="ml-auto">
                      ✓ Actioned
                    </Badge>
                  )}
                </div>

                {/* Inline Action Panel */}
                {activeActionPanel?.leadId === lead.id && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    {activeActionPanel.action === "call" && (
                      <LogCallPanel
                        lead={lead}
                        onClose={() => setActiveActionPanel(null)}
                        onComplete={() => handleActionComplete(lead.id)}
                      />
                    )}
                    {activeActionPanel.action === "message" && (
                      <SendMessagePanel
                        lead={lead}
                        onClose={() => setActiveActionPanel(null)}
                        onComplete={() => handleActionComplete(lead.id)}
                      />
                    )}
                    {activeActionPanel.action === "plan" && (
                      <SendPlanPricePanel
                        lead={lead}
                        onClose={() => setActiveActionPanel(null)}
                        onComplete={() => handleActionComplete(lead.id)}
                      />
                    )}
                    {activeActionPanel.action === "demo" && (
                      <ScheduleDemoPanel
                        lead={lead}
                        onClose={() => setActiveActionPanel(null)}
                        onComplete={() => handleActionComplete(lead.id)}
                      />
                    )}
                    {activeActionPanel.action === "followup" && (
                      <SetFollowUpPanel
                        lead={lead}
                        onClose={() => setActiveActionPanel(null)}
                        onComplete={() => handleActionComplete(lead.id)}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Full Lead Context Panel */}
      {selectedLead && (
        <LeadContextPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
        />
      )}
    </div>
  );
}
