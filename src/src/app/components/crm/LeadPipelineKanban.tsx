import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
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
  MapPin,
  Car,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  FileText,
  LayoutGrid,
  List,
  X,
  History,
  Edit,
  ArrowRight,
  Mail,
  Download,
  Upload,
  Filter,
  Search,
  RefreshCw,
  UserPlus,
  Tag,
  Star,
} from "lucide-react";
import { ActivityTimeline } from "./ActivityTimeline";
import { LeadHistory } from "./LeadHistory";
import { useCustomers } from "../../contexts/AppProvider";
import { EventBadge, type SystemEvent } from "./EventBadge";
import { useRole } from "../../contexts/RoleContext";
import type { Customer } from "../../contexts/CustomerContext";

type LeadStage =
  | "new"
  | "contacted"
  | "interested"
  | "demo_scheduled"
  | "demo_completed"
  | "proposal"
  | "converted"
  | "lost";

type Lead = {
  id: string;
  name: string;
  mobile: string;
  society: string;
  area: string;
  numCars: number;
  carTypes: string[];
  source: string;
  campaign: string;
  assignedTo: string;
  stage: LeadStage;
  priority: "high" | "medium" | "low";
  nextFollowUp: string;
  responseTime?: number; // in minutes
  createdAt: string;
  slaStatus: "within" | "approaching" | "delayed";
};

// Mock leads removed - now using CustomerContext

const stageConfig: Record<LeadStage, { label: string; color: string; icon: any; event?: SystemEvent }> = {
  new: { label: "New Lead", color: "bg-blue-100 text-blue-800", icon: AlertCircle, event: "LEAD_CREATED" },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800", icon: Phone, event: "LEAD_ASSIGNED" },
  interested: { label: "Interested", color: "bg-indigo-100 text-indigo-800", icon: TrendingUp, event: "LEAD_QUALIFIED" },
  demo_scheduled: { label: "Demo Scheduled", color: "bg-yellow-100 text-yellow-800", icon: Calendar, event: "DEMO_SCHEDULED" },
  demo_completed: { label: "Demo Completed", color: "bg-orange-100 text-orange-800", icon: CheckCircle, event: "DEMO_COMPLETED" },
  proposal: { label: "Subscription Proposal", color: "bg-cyan-100 text-cyan-800", icon: TrendingUp, event: "DEMO_FOLLOW_UP_REQUIRED" },
  converted: { label: "Converted", color: "bg-green-100 text-green-800", icon: CheckCircle, event: "DEAL_WON" },
  lost: { label: "Lost", color: "bg-red-100 text-red-800", icon: XCircle, event: "DEAL_LOST" },
};

export function LeadPipelineKanban() {
  const { customers, updateCustomer, leads: leadsData, updateLead, appendLeadActivity } = useCustomers();
  const { currentUser } = useRole();

  // Convert customers to leads format (filtering for lead stages)
  const leads = useMemo(() => {
    return customers
      .filter(c => c.status === "Lead" || c.status === "Demo Scheduled" || c.status === "Active")
      .map(customer => {
        // Map customer status to lead stage
        let stage: LeadStage = "new";
        if (customer.status === "Demo Scheduled") {
          stage = "demo_scheduled";
        } else if (customer.status === "Active") {
          stage = "converted";
        }

        return {
          id: customer.customerId,
          name: `${customer.firstName} ${customer.lastName}`,
          mobile: customer.phone,
          society: customer.address.line1 || "Unknown Society",
          area: customer.address.area,
          numCars: 1,
          carTypes: customer.vehicleDetails ? [customer.vehicleDetails.category] : ["Unknown"],
          source: customer.leadSource || "Unknown",
          campaign: "Unknown Campaign",
          assignedTo: customer.assignedTo || "Unassigned",
          stage,
          priority: "medium" as const,
          nextFollowUp: new Date(Date.now() + 86400000).toLocaleString(),
          createdAt: new Date(customer.createdAt).toLocaleString(),
          slaStatus: "within" as const,
        };
      });
  }, [customers]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [detailedLead, setDetailedLead] = useState<Lead | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [historyLeadId, setHistoryLeadId] = useState<string>("");
  const [historyLeadName, setHistoryLeadName] = useState<string>("");
  const [scheduleLeadId, setScheduleLeadId] = useState<string>("");
  const [scheduleLeadName, setScheduleLeadName] = useState<string>("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleType, setScheduleType] = useState("call");
  const [scheduleNotes, setScheduleNotes] = useState("");
  
  // New state for modals
  const [editLeadData, setEditLeadData] = useState<Partial<Lead>>({});
  const [reassignTo, setReassignTo] = useState("");
  const [newPriority, setNewPriority] = useState<"high" | "medium" | "low">("medium");
  const [newStage, setNewStage] = useState<LeadStage>("new");
  const [noteText, setNoteText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");

  const handleStageChange = (leadId: string, newStage: LeadStage) => {
    // Map stage to customer status
    const statusMap: Partial<Record<LeadStage, Customer["status"]>> = {
      demo_scheduled: "Demo Scheduled",
      converted: "Active",
      lost: "Inactive",
    };
    const newStatus = statusMap[newStage];

    // Update customer status if it maps to a Customer status
    if (newStatus) {
      updateCustomer(leadId, { status: newStatus });
    }

    // Persist stage to lead record (for intermediate stages)
    const lead = leadsData.find(l => l.leadId === leadId);
    if (lead) {
      updateLead(leadId, { stage: newStage });
      appendLeadActivity(leadId, {
        timestamp: new Date().toISOString(),
        type: "stage_change",
        description: `Stage changed to ${newStage.replace(/_/g, " ")}`,
        performedBy: currentUser?.name || "TSE",
        metadata: { from: lead.stage, to: newStage },
      });
    }
  };

  const executives = ["Priya Sharma", "Amit Patel", "Neha Singh", "Rahul Verma", "Sneha Gupta"];

  const stages: LeadStage[] = [
    "new",
    "contacted",
    "interested",
    "demo_scheduled",
    "demo_completed",
    "proposal",
    "converted",
    "lost",
  ];

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter((lead) => lead.stage === stage);
  };

  const getSLAColor = (status: string) => {
    switch (status) {
      case "within":
        return "text-green-600 bg-green-50";
      case "approaching":
        return "text-orange-600 bg-orange-50";
      case "delayed":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-500 bg-red-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-green-500 bg-green-50";
      default:
        return "border-gray-500 bg-gray-50";
    }
  };

  const handleCallNow = (phone: string, leadName: string) => {
    // Open phone dialer
    window.location.href = `tel:${phone}`;
    toast.info(`Calling ${leadName} at ${phone}...`);
  };

  const handleWhatsApp = (phone: string, leadName: string) => {
    // Open WhatsApp with pre-filled message
    const message = encodeURIComponent(`Hi ${leadName}, I'm reaching out from our car washing service. Would you like to learn more about our subscription plans?`);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handleScheduleFollowup = (leadId: string, leadName: string) => {
    setScheduleLeadId(leadId);
    setScheduleLeadName(leadName);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = () => {
    if (!scheduleDate || !scheduleTime) {
      toast.info("Please select both date and time for the follow-up");
      return;
    }

    const formattedDateTime = `${scheduleDate} ${scheduleTime}`;

    // Update customer with note about follow-up
    const customer = customers.find(c => c.customerId === scheduleLeadId);
    if (customer) {
      updateCustomer(customer.customerId, {
        notes: `${customer.notes || ''}\n[${new Date().toLocaleString()}] ${scheduleType.toUpperCase()} scheduled for ${formattedDateTime}. Notes: ${scheduleNotes || "None"}`,
      });
    }

    toast.info(
      `${scheduleType === "call" ? "Call" : scheduleType === "whatsapp" ? "WhatsApp" : "Demo"} scheduled with ${scheduleLeadName} for ${formattedDateTime}.\n\nNotes: ${scheduleNotes || "None"}\n\nReminder will be sent 1 hour before.`
    );

    // Reset form
    setShowScheduleModal(false);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleType("call");
    setScheduleNotes("");
    setSelectedLead(null);
  };

  const handleViewDetails = (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setSelectedLead(lead);
      setDetailedLead(lead);
      setShowDetailModal(true);
    }
  };

  const handleViewHistory = (leadId: string, leadName: string) => {
    setHistoryLeadId(leadId);
    setHistoryLeadName(leadName);
    setShowHistoryModal(true);
  };

  return (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Lead Pipeline</h3>
        <div className="flex gap-2">
          <Button
            variant={viewMode === "kanban" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("kanban")}
          >
            <LayoutGrid className="w-4 h-4 mr-2" />
            Kanban
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4 mr-2" />
            List View
          </Button>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLeadsByStage("new").length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLeadsByStage("contacted").length +
                    getLeadsByStage("interested").length +
                    getLeadsByStage("demo_scheduled").length}
                </p>
              </div>
              <Phone className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hot Leads</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLeadsByStage("demo_completed").length +
                    getLeadsByStage("proposal").length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Converted</p>
                <p className="text-2xl font-bold text-green-600">
                  {getLeadsByStage("converted").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List View Table */}
      {viewMode === "list" && (
        <Card>
          <CardHeader>
            <CardTitle>All Leads - List View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Lead ID
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Mobile
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Location
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Cars
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Source
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Stage
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Next Follow-up
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leads.map((lead) => {
                    const config = stageConfig[lead.stage];
                    return (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {lead.id}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-medium text-gray-900">
                              {lead.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lead.assignedTo}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lead.mobile}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <div className="text-sm text-gray-900">
                              {lead.society}
                            </div>
                            <div className="text-xs text-gray-500">
                              {lead.area}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant="outline">{lead.numCars} car{lead.numCars > 1 ? "s" : ""}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {lead.source}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={config.color}>{config.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge
                            className={
                              lead.priority === "high"
                                ? "bg-red-100 text-red-800"
                                : lead.priority === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }
                          >
                            {lead.priority.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {lead.nextFollowUp}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCallNow(lead.mobile, lead.name)}
                              title="Call Now"
                            >
                              <Phone className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleWhatsApp(lead.mobile, lead.name)}
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleScheduleFollowup(lead.id, lead.name)}
                              title="Schedule"
                            >
                              <Calendar className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => {
            const stageLeads = getLeadsByStage(stage);
            const config = stageConfig[stage];
            const Icon = config.icon;

            return (
              <div
                key={stage}
                className="flex-shrink-0 w-80"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const draggedLeadId = e.dataTransfer.getData("leadId");
                  if (draggedLeadId) handleStageChange(draggedLeadId, stage);
                }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </CardTitle>
                      <Badge variant="outline">{stageLeads.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                    {stageLeads.map((lead) => {
                      const leadConfig = stageConfig[lead.stage];
                      return (
                        <Card
                          key={lead.id}
                          className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(
                            lead.priority
                          )} relative`}
                          onClick={() => setSelectedLead(lead)}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData("leadId", lead.id)}
                        >
                          {/* Event Badge Overlay */}
                          {leadConfig.event && (
                            <div className="absolute -top-2 -right-2">
                              <EventBadge event={leadConfig.event} variant="subtle" position="inline" />
                            </div>
                          )}
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    {lead.name}
                                  </h4>
                                  <p className="text-xs text-gray-500">
                                    {lead.id}
                                  </p>
                                </div>
                                <Badge className={`${getSLAColor(lead.slaStatus)} text-xs`}>
                                  {lead.slaStatus === "within" && "✓ SLA"}
                                  {lead.slaStatus === "approaching" && "⏱ Near"}
                                  {lead.slaStatus === "delayed" && "⚠ Delayed"}
                                </Badge>
                              </div>

                            {/* Details */}
                            <div className="space-y-2 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span>{lead.society}, {lead.area}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Car className="w-3 h-3" />
                                <span>
                                  {lead.numCars} car{lead.numCars > 1 ? "s" : ""} ({(lead.carTypes ?? []).join(", ")})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-3 h-3" />
                                <span>{lead.assignedTo}</span>
                              </div>
                            </div>

                            {/* Source & Next Action */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{lead.nextFollowUp.split(" ")[0]}</span>
                              </div>
                            </div>

                            {/* Priority Indicator */}
                            {lead.priority === "high" && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>High Priority</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                    {stageLeads.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <p className="text-sm">No leads in this stage</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Lead Detail Modal (Simplified) */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Details - {selectedLead.name}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLead(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Lead ID</Label>
                  <p className="font-medium">{selectedLead.id}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Mobile</Label>
                  <p className="font-medium">{selectedLead.mobile}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Society</Label>
                  <p className="font-medium">{selectedLead.society}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Area</Label>
                  <p className="font-medium">{selectedLead.area}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Source</Label>
                  <p className="font-medium">{selectedLead.source}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Campaign</Label>
                  <p className="font-medium">{selectedLead.campaign}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">
                    Assigned To
                  </Label>
                  <p className="font-medium">{selectedLead.assignedTo}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Priority</Label>
                  <Badge
                    className={
                      selectedLead.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : selectedLead.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }
                  >
                    {selectedLead.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={() => handleCallNow(selectedLead.mobile, selectedLead.name)}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleWhatsApp(selectedLead.mobile, selectedLead.name)}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => handleScheduleFollowup(selectedLead.id, selectedLead.name)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => {
                  setSelectedLead(null);
                  handleViewHistory(selectedLead.id, selectedLead.name);
                }}
              >
                <History className="w-4 h-4 mr-2" />
                View Full History
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schedule Follow-up - {scheduleLeadName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowScheduleModal(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Date</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Time</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Type</Label>
                  <Select
                    value={scheduleType}
                    onValueChange={(value) => setScheduleType(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="demo">Demo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Notes</Label>
                  <Textarea
                    value={scheduleNotes}
                    onChange={(e) => setScheduleNotes(e.target.value)}
                    placeholder="Enter any additional notes"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button className="flex-1" onClick={handleConfirmSchedule}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Confirm Schedule
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowScheduleModal(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lead History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead History - {historyLeadName}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowHistoryModal(false)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <LeadHistory leadId={historyLeadId} leadName={historyLeadName} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}