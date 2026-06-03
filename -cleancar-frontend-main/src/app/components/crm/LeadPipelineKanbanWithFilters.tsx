import { useCity } from "../../contexts/CityContext";
/**
 * Lead Pipeline Kanban - WITH COMPLETE FILTER & SORT INTEGRATION
 * Enhanced version with comprehensive filtering and sorting for both Kanban and List views
 */

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useCustomers } from "../../contexts/CustomerContext";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Phone,
  MessageSquare,
  Calendar,
  User,
  MapPin,
  Car,
  AlertCircle,
  CheckCircle,
  XCircle,
  TrendingUp,
  LayoutGrid,
  List,
  X,
  Search,
  Filter,
} from "lucide-react";
import { SortableTableHeader, useTableSort } from "../common/SortableTableHeader";
import { DownloadButton } from "../common/DownloadButton";

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
  responseTime?: number;
  createdAt: string;
  slaStatus: "within" | "approaching" | "delayed";
};

// DEPRECATED: Using real leads from CustomerContext now
const mockLeads_UNUSED: Lead[] = [
  {
    id: "LD001",
    name: "Rajesh Kumar",
    mobile: "9876543210",
    society: "Prestige Lakeside",
    area: "Koramangala",
    numCars: 2,
    carTypes: ["Sedan", "SUV"],
    source: "Google Ads",
    campaign: "Surat Premium Campaign",
    assignedTo: "Priya Sharma",
    stage: "new",
    priority: "high",
    nextFollowUp: "2026-03-10 10:30 AM",
    createdAt: "2026-03-10 09:15 AM",
    slaStatus: "within",
  },
  {
    id: "LD002",
    name: "Anita Desai",
    mobile: "9123456789",
    society: "Brigade Gateway",
    area: "Rajajinagar",
    numCars: 1,
    carTypes: ["Hatchback"],
    source: "Website",
    campaign: "Organic Search",
    assignedTo: "Priya Sharma",
    stage: "contacted",
    priority: "medium",
    nextFollowUp: "2026-03-11 02:00 PM",
    responseTime: 3,
    createdAt: "2026-03-09 04:20 PM",
    slaStatus: "within",
  },
  {
    id: "LD003",
    name: "Vikram Singh",
    mobile: "9988776655",
    society: "Sobha Dream Acres",
    area: "Varthur",
    numCars: 3,
    carTypes: ["Sedan", "SUV", "Luxury"],
    source: "Referral",
    campaign: "Customer Referral Program",
    assignedTo: "Amit Patel",
    stage: "interested",
    priority: "high",
    nextFollowUp: "2026-03-10 11:00 AM",
    responseTime: 2,
    createdAt: "2026-03-08 03:45 PM",
    slaStatus: "within",
  },
  {
    id: "LD004",
    name: "Meera Reddy",
    mobile: "9445566778",
    society: "Purva Venezia",
    area: "Yelahanka",
    numCars: 2,
    carTypes: ["Sedan", "Hatchback"],
    source: "Facebook Ads",
    campaign: "Mumbai Premium Campaign",
    assignedTo: "Amit Patel",
    stage: "demo_scheduled",
    priority: "high",
    nextFollowUp: "2026-03-10 03:00 PM",
    responseTime: 4,
    createdAt: "2026-03-07 10:15 AM",
    slaStatus: "within",
  },
  {
    id: "LD005",
    name: "Suresh Nair",
    mobile: "9112233445",
    society: "Prestige Lakeside",
    area: "Koramangala",
    numCars: 1,
    carTypes: ["SUV"],
    source: "Society Campaign",
    campaign: "Prestige Lakeside Drive",
    assignedTo: "Neha Singh",
    stage: "demo_completed",
    priority: "high",
    nextFollowUp: "2026-03-10 04:30 PM",
    responseTime: 5,
    createdAt: "2026-03-06 11:30 AM",
    slaStatus: "approaching",
  },
  {
    id: "LD006",
    name: "Kavita Sharma",
    mobile: "9887766554",
    society: "Embassy Pristine",
    area: "Bellandur",
    numCars: 2,
    carTypes: ["Sedan", "Hatchback"],
    source: "WhatsApp",
    campaign: "WhatsApp Direct",
    assignedTo: "Neha Singh",
    stage: "proposal",
    priority: "high",
    nextFollowUp: "2026-03-10 05:00 PM",
    responseTime: 3,
    createdAt: "2026-03-05 02:15 PM",
    slaStatus: "within",
  },
  {
    id: "LD007",
    name: "Arjun Mehta",
    mobile: "9998887776",
    society: "Mantri Espana",
    area: "Bellandur",
    numCars: 1,
    carTypes: ["Sedan"],
    source: "Google Ads",
    campaign: "Ahmedabad Premium Campaign",
    assignedTo: "Rahul Verma",
    stage: "contacted",
    priority: "low",
    nextFollowUp: "2026-03-12 10:00 AM",
    responseTime: 6,
    createdAt: "2026-03-04 01:30 PM",
    slaStatus: "within",
  },
  {
    id: "LD008",
    name: "Deepa Iyer",
    mobile: "9776655443",
    society: "Sobha City",
    area: "Thanisandra",
    numCars: 2,
    carTypes: ["SUV", "Hatchback"],
    source: "Referral",
    campaign: "Employee Referral",
    assignedTo: "Sneha Gupta",
    stage: "new",
    priority: "medium",
    nextFollowUp: "2026-03-10 02:00 PM",
    createdAt: "2026-03-10 08:45 AM",
    slaStatus: "within",
  },
];

const stageConfig = {
  new: { label: "New Lead", color: "bg-blue-100 text-blue-800", icon: AlertCircle },
  contacted: { label: "Contacted", color: "bg-purple-100 text-purple-800", icon: Phone },
  interested: { label: "Interested", color: "bg-indigo-100 text-indigo-800", icon: TrendingUp },
  demo_scheduled: { label: "Demo Scheduled", color: "bg-yellow-100 text-yellow-800", icon: Calendar },
  demo_completed: { label: "Demo Completed", color: "bg-orange-100 text-orange-800", icon: CheckCircle },
  proposal: { label: "Subscription Proposal", color: "bg-cyan-100 text-cyan-800", icon: TrendingUp },
  converted: { label: "Converted", color: "bg-green-100 text-green-800", icon: CheckCircle },
  lost: { label: "Lost", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function LeadPipelineKanbanWithFilters() {
  const [searchParams] = useSearchParams();
  const { city: cityContextId } = useCity();
  // Use CityContext as primary source — URL param as fallback for deep links
  const { leads: contextLeads } = useCustomers();

  // Get selected city from URL
  // Derive city name from CityContext (primary) or URL param (fallback)
  const ctxCityName = cityContextId?.replace("CITY-", "").toLowerCase() || "";
  const selectedCity = ctxCityName || searchParams.get("city")?.toLowerCase() || "";

  // Map context leads to pipeline Lead format and filter by city
  const leads: Lead[] = useMemo(() => {
    const cityFilteredLeads = selectedCity
      ? contextLeads.filter(lead => lead.address?.city?.toLowerCase() === selectedCity)
      : contextLeads;

    return cityFilteredLeads.map(lead => ({
      id: lead.leadId,
      name: `${lead.firstName} ${lead.lastName}`,
      mobile: lead.phone,
      society: lead.address?.line1 || "N/A",
      area: lead.address?.area || "",
      numCars: 1,
      carTypes: lead.vehicleDetails?.category ? [lead.vehicleDetails.category] : ["Unknown"],
      source: lead.leadSource || "Unknown",
      campaign: lead.leadSource || "Unknown",
      assignedTo: lead.assignedTo || "Unassigned",
      stage: mapStatusToStage(lead.status),
      priority: "medium",
      nextFollowUp: lead.lastContact || new Date().toISOString(),
      createdAt: lead.createdAt,
      slaStatus: "within" as const,
    }));
  }, [contextLeads, selectedCity]);

  // Helper to map customer status to lead stage
  function mapStatusToStage(status: string): LeadStage {
    if (status === "Lead") return "new";
    if (status === "Demo Scheduled") return "demo_scheduled";
    if (status === "Active") return "converted";
    if (status === "Churned") return "lost";
    return "contacted";
  }

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");
  const [areaFilter, setAreaFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sort hook for list view
  const { sortState, handleSort } = useTableSort("createdAt", "desc");

  // Schedule modal states
  const [scheduleLeadId, setScheduleLeadId] = useState("");
  const [scheduleLeadName, setScheduleLeadName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleType, setScheduleType] = useState("call");
  const [scheduleNotes, setScheduleNotes] = useState("");

  // Get available TSEs from organization hierarchy
  const executives = useMemo(() => {
    const allTSEs = organizationHierarchyService.getAllTSETerritories();
    return allTSEs.map(tse => tse.tseName);
  }, []);

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

  // Filter leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        lead.name.toLowerCase().includes(searchLower) ||
        lead.mobile.includes(searchTerm) ||
        lead.society.toLowerCase().includes(searchLower) ||
        lead.area.toLowerCase().includes(searchLower) ||
        lead.id.toLowerCase().includes(searchLower);

      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;
      const matchesStage = stageFilter === "all" || lead.stage === stageFilter;
      const matchesAssigned = assignedToFilter === "all" || lead.assignedTo === assignedToFilter;
      const matchesSLA = slaFilter === "all" || lead.slaStatus === slaFilter;
      const matchesArea = areaFilter === "all" || lead.area === areaFilter;

      const leadDate = new Date(lead.createdAt);
      const matchesDateFrom = !dateFrom || leadDate >= new Date(dateFrom);
      const matchesDateTo = !dateTo || leadDate <= new Date(dateTo);

      return (
        matchesSearch &&
        matchesSource &&
        matchesPriority &&
        matchesStage &&
        matchesAssigned &&
        matchesSLA &&
        matchesArea &&
        matchesDateFrom &&
        matchesDateTo
      );
    });
  }, [leads, searchTerm, sourceFilter, priorityFilter, stageFilter, assignedToFilter, slaFilter, areaFilter, dateFrom, dateTo]);

  // Sort filtered leads (for list view)
  const sortedAndFilteredLeads = useMemo(() => {
    if (!sortState.key || !sortState.direction) {
      return filteredLeads;
    }

    return [...filteredLeads].sort((a, b) => {
      const aValue = a[sortState.key as keyof Lead];
      const bValue = b[sortState.key as keyof Lead];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortState.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredLeads, sortState]);

  // Get filtered leads by stage for Kanban
  const getFilteredLeadsByStage = (stage: LeadStage) => {
    return filteredLeads.filter((lead) => lead.stage === stage);
  };

  // Check if filters are active
  const hasActiveFilters =
    searchTerm ||
    sourceFilter !== "all" ||
    priorityFilter !== "all" ||
    stageFilter !== "all" ||
    assignedToFilter !== "all" ||
    slaFilter !== "all" ||
    areaFilter !== "all" ||
    dateFrom ||
    dateTo;

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    setPriorityFilter("all");
    setStageFilter("all");
    setAssignedToFilter("all");
    setSlaFilter("all");
    setAreaFilter("all");
    setDateFrom("");
    setDateTo("");
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
    toast.info(`📞 Calling ${leadName} at ${phone}...`);
  };

  const handleWhatsApp = (phone: string, leadName: string) => {
    const message = encodeURIComponent(
      `Hi ${leadName}, I'm reaching out from our car washing service. Would you like to learn more about our subscription plans?`
    );
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${message}`, "_blank");
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

    const updatedLeads = leads.map((lead) =>
      lead.id === scheduleLeadId ? { ...lead, nextFollowUp: formattedDateTime } : lead
    );
    setLeads(updatedLeads);

    toast.info(
      `${scheduleType === "call" ? "Call" : scheduleType === "whatsapp" ? "WhatsApp" : "Demo"} scheduled with ${scheduleLeadName} for ${formattedDateTime}.\n\nNotes: ${scheduleNotes || "None"}\n\nReminder will be sent 1 hour before.`
    );

    setShowScheduleModal(false);
    setScheduleDate("");
    setScheduleTime("");
    setScheduleType("call");
    setScheduleNotes("");
  };

  return (
    <div className="space-y-4">
      {/* Header with View Toggle */}
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

      {/* Global Filter Bar */}
      <div className="space-y-3">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Search Input */}
          <div className="flex-1 min-w-64">
            <Label className="text-xs text-gray-600 mb-1.5 block">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, mobile, society, area, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Source Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">Source</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="Google Ads">Google Ads</SelectItem>
                <SelectItem value="Website">Website</SelectItem>
                <SelectItem value="Facebook Ads">Facebook Ads</SelectItem>
                <SelectItem value="Referral">Referral</SelectItem>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Society Campaign">Society Campaign</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stage Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">Stage</Label>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="new">New Lead</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="interested">Interested</SelectItem>
                <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
                <SelectItem value="demo_completed">Demo Completed</SelectItem>
                <SelectItem value="proposal">Proposal</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">Assigned To</Label>
            <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Staff</SelectItem>
                {executives.map((exec) => (
                  <SelectItem key={exec} value={exec}>
                    {exec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SLA Status Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">SLA Status</Label>
            <Select value={slaFilter} onValueChange={setSlaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All SLA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SLA</SelectItem>
                <SelectItem value="within">Within SLA</SelectItem>
                <SelectItem value="approaching">Approaching</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Area Filter */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">Area</Label>
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                <SelectItem value="Koramangala">Koramangala</SelectItem>
                <SelectItem value="Rajajinagar">Rajajinagar</SelectItem>
                <SelectItem value="Varthur">Varthur</SelectItem>
                <SelectItem value="Yelahanka">Yelahanka</SelectItem>
                <SelectItem value="Bellandur">Bellandur</SelectItem>
                <SelectItem value="Thanisandra">Thanisandra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date From */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>

          {/* Date To */}
          <div className="min-w-48">
            <Label className="text-xs text-gray-600 mb-1.5 block">To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white">Apply Filters</Button>
            <Button variant="outline" onClick={handleClearAllFilters}>
              Clear All
            </Button>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-blue-50 rounded border border-blue-200">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Search: {searchTerm}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSearchTerm("")} />
              </Badge>
            )}
            {sourceFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Source: {sourceFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSourceFilter("all")} />
              </Badge>
            )}
            {priorityFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Priority: {priorityFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setPriorityFilter("all")} />
              </Badge>
            )}
            {stageFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Stage: {stageConfig[stageFilter as LeadStage]?.label || stageFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setStageFilter("all")} />
              </Badge>
            )}
            {assignedToFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Assigned: {assignedToFilter}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => setAssignedToFilter("all")}
                />
              </Badge>
            )}
            {slaFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                SLA: {slaFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSlaFilter("all")} />
              </Badge>
            )}
            {areaFilter !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Area: {areaFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setAreaFilter("all")} />
              </Badge>
            )}
            {(dateFrom || dateTo) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Date: {dateFrom || "Start"} – {dateTo || "End"}
                <X
                  className="w-3 h-3 cursor-pointer hover:text-red-600"
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                  }}
                />
              </Badge>
            )}
            <button
              onClick={handleClearAllFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Record Count & Download */}
        <div className="flex justify-between items-center text-sm text-gray-600 px-1">
          <span>
            Showing <span className="font-semibold text-gray-900">{filteredLeads.length}</span> of{" "}
            <span className="font-semibold text-gray-900">{leads.length}</span> leads
          </span>
          <DownloadButton
            disabled={!hasActiveFilters && !sortState.key}
            recordCount={sortedAndFilteredLeads.length}
            data={sortedAndFilteredLeads}
            columns={[
              { key: "id", label: "Lead ID" },
              { key: "name", label: "Name" },
              { key: "mobile", label: "Mobile" },
              { key: "society", label: "Society" },
              { key: "area", label: "Area" },
              { key: "numCars", label: "Number of Cars" },
              { key: "source", label: "Source" },
              { key: "campaign", label: "Campaign" },
              { key: "assignedTo", label: "Assigned To" },
              { key: "stage", label: "Stage" },
              { key: "priority", label: "Priority" },
              { key: "slaStatus", label: "SLA Status" },
              { key: "nextFollowUp", label: "Next Follow-up" },
              { key: "createdAt", label: "Created Date" },
            ]}
            filename="lead_pipeline_filtered"
          />
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">New Leads</p>
                <p className="text-2xl font-bold text-gray-900">{getFilteredLeadsByStage("new").length}</p>
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
                  {getFilteredLeadsByStage("contacted").length +
                    getFilteredLeadsByStage("interested").length +
                    getFilteredLeadsByStage("demo_scheduled").length}
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
                  {getFilteredLeadsByStage("demo_completed").length + getFilteredLeadsByStage("proposal").length}
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
                <p className="text-2xl font-bold text-green-600">{getFilteredLeadsByStage("converted").length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List View Table */}
      {viewMode === "list" && (
        <Card>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader label="Lead ID" sortKey="id" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader label="Name" sortKey="name" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader label="Mobile" sortKey="mobile" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader
                      label="Society"
                      sortKey="society"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <SortableTableHeader label="Area" sortKey="area" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader
                      label="Cars"
                      sortKey="numCars"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <SortableTableHeader label="Source" sortKey="source" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader label="Stage" sortKey="stage" currentSort={sortState} onSort={handleSort} />
                    <SortableTableHeader
                      label="Priority"
                      sortKey="priority"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Assigned To"
                      sortKey="assignedTo"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="SLA Status"
                      sortKey="slaStatus"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Next Follow-up"
                      sortKey="nextFollowUp"
                      currentSort={sortState}
                      onSort={handleSort}
                    />
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAndFilteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <Filter className="w-12 h-12 mb-3 text-gray-300" />
                          <p className="text-lg font-medium">No records match your filters</p>
                          <Button variant="outline" size="sm" className="mt-3" onClick={handleClearAllFilters}>
                            Clear Filters
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedAndFilteredLeads.map((lead) => {
                      const config = stageConfig[lead.stage];
                      return (
                        <TableRow key={lead.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{lead.id}</TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-900">{lead.name}</div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{lead.mobile}</TableCell>
                          <TableCell className="text-sm text-gray-900">{lead.society}</TableCell>
                          <TableCell className="text-sm text-gray-600">{lead.area}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">
                              {lead.numCars} car{lead.numCars > 1 ? "s" : ""}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {lead.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.color}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-sm">{lead.assignedTo}</TableCell>
                          <TableCell>
                            <Badge className={`${getSLAColor(lead.slaStatus)} text-xs`}>
                              {lead.slaStatus === "within" && "✓ Within SLA"}
                              {lead.slaStatus === "approaching" && "⏱ Approaching"}
                              {lead.slaStatus === "delayed" && "⚠ Delayed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">{lead.nextFollowUp}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCallNow(lead.mobile, lead.name)}
                                title="Call Now"
                              >
                                <Phone className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleWhatsApp(lead.mobile, lead.name)}
                                title="WhatsApp"
                              >
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleScheduleFollowup(lead.id, lead.name)}
                                title="Schedule"
                              >
                                <Calendar className="w-4 h-4 text-purple-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Kanban Board */}
      {viewMode === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
          {stages.map((stage) => {
            const stageLeads = getFilteredLeadsByStage(stage);
            const config = stageConfig[stage];
            const Icon = config.icon;

            return (
              <div key={stage} className="flex-shrink-0 w-72 sm:w-64 snap-start">
                <Card>
                  <CardHeader className="pb-3 sticky top-0 bg-white z-10">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {config.label}
                      </CardTitle>
                      <Badge variant="outline">{stageLeads.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                    {stageLeads.map((lead) => (
                      <Card
                        key={lead.id}
                        className={`cursor-pointer hover:shadow-md transition-shadow border-l-4 ${getPriorityColor(
                          lead.priority
                        )}`}
                        onClick={() => setSelectedLead(lead)}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900">{lead.name}</h4>
                                <p className="text-xs text-gray-500">{lead.id}</p>
                              </div>
                              <Badge className={`${getSLAColor(lead.slaStatus)} text-xs`}>
                                {lead.slaStatus === "within" && "✓ SLA"}
                                {lead.slaStatus === "approaching" && "⏱ Near"}
                                {lead.slaStatus === "delayed" && "⚠ Delayed"}
                              </Badge>
                            </div>

                            <div className="space-y-2 text-xs text-gray-600">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {lead.society}, {lead.area}
                                </span>
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

                            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                              <Badge variant="outline" className="text-xs">
                                {lead.source}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{lead.nextFollowUp.split(" ")[0]}</span>
                              </div>
                            </div>

                            {lead.priority === "high" && (
                              <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                <span>High Priority</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

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

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Details - {selectedLead.name}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedLead(null)}>
                  <X className="w-4 h-4" />
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
                  <Badge variant="outline">{selectedLead.source}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Campaign</Label>
                  <p className="font-medium text-sm">{selectedLead.campaign}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Assigned To</Label>
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
                <div>
                  <Label className="text-xs text-gray-500">Stage</Label>
                  <Badge className={stageConfig[selectedLead.stage].color}>
                    {stageConfig[selectedLead.stage].label}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-500">SLA Status</Label>
                  <Badge className={getSLAColor(selectedLead.slaStatus)}>
                    {selectedLead.slaStatus === "within" && "✓ Within SLA"}
                    {selectedLead.slaStatus === "approaching" && "⏱ Approaching"}
                    {selectedLead.slaStatus === "delayed" && "⚠ Delayed"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleCallNow(selectedLead.mobile, selectedLead.name);
                    setSelectedLead(null);
                  }}
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleWhatsApp(selectedLead.mobile, selectedLead.name);
                    setSelectedLead(null);
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    handleScheduleFollowup(selectedLead.id, selectedLead.name);
                    setSelectedLead(null);
                  }}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Schedule Follow-up - {scheduleLeadName}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowScheduleModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Follow-up Type</Label>
                <Select value={scheduleType} onValueChange={setScheduleType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="call">Phone Call</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Message</SelectItem>
                    <SelectItem value="demo">Demo/Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={scheduleNotes}
                  onChange={(e) => setScheduleNotes(e.target.value)}
                  placeholder="Add notes for this follow-up..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleConfirmSchedule} className="flex-1 bg-teal-600 hover:bg-teal-700">
                  Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}