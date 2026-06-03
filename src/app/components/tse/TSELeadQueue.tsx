/**
 * TSE Lead Queue Screen
 * Central command for daily lead work with SLA countdown timers
 *
 * Priority Logic: URGENT > HIGH > NORMAL, sorted by SLA time remaining
 *
 * @component
 */

import { useState, useEffect } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
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
  Clock,
  AlertTriangle,
  AlertCircle,
  Info,
  Search,
  Filter,
  Calendar,
  User,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { teleSalesExecutiveService } from "../../services/teleSalesExecutiveService";
import type { TSELead } from "../../types/teleSalesExecutive.types";
import { SLA_THRESHOLDS, REFRESH_INTERVALS } from "../../constants/teleSalesExecutive.constants";
import { TSEWhatsAppModal } from "./TSEWhatsAppModal";

interface TSELeadQueueProps {
  onCallLead: (lead: TSELead) => void;
}

export function TSELeadQueue({ onCallLead }: TSELeadQueueProps) {
  const [leads, setLeads] = useState<TSELead[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "NEW" | "CALLBACK" | "URGENT">("ALL");
  const [whatsAppLead, setWhatsAppLead] = useState<TSELead | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load leads on mount
  useEffect(() => {
    const loadLeads = () => {
      // B1: getLeadQueue() is DEPRECATED — replace with MASTER_LEADS.filter(l => l.assignedTo === tseId)
    // Keeping for now as backend integration is pending
    const loadedLeads = teleSalesExecutiveService.getLeadQueue();
      setLeads(loadedLeads);
    };

    loadLeads();

    // Refresh every 30 seconds
    const interval = setInterval(loadLeads, REFRESH_INTERVALS.LEAD_QUEUE);
    return () => clearInterval(interval);
  }, []);

  // Update clock every second for SLA countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, REFRESH_INTERVALS.SLA_COUNTDOWN);
    return () => clearInterval(interval);
  }, []);

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !lead.customerName.toLowerCase().includes(query) &&
        !lead.phone.includes(query)
      ) {
        return false;
      }
    }

    // Status filter
    if (filterStatus === "NEW" && lead.status !== "NEW") return false;
    if (filterStatus === "CALLBACK" && lead.status !== "CALLBACK") return false;
    if (filterStatus === "URGENT" && lead.priority !== "URGENT") return false;
    // B3 FIX
    if ((filterStatus as string) === "INTERESTED" && lead.status !== "INTERESTED") return false;

    return true;
  });

  // Count stats
  const stats = {
    total: leads.length,
    new: leads.filter((l) => l.status === "NEW").length,
    callback: leads.filter((l) => l.status === "CALLBACK").length,
    urgent: leads.filter((l) => l.priority === "URGENT").length,
    slaBreach: leads.filter((l) => l.slaStatus === "BREACHED").length,
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "HIGH":
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  // B2 FIX: compute live SLA minutes from assignedAt + threshold, not static field
  const getLiveSLAMinutes = (lead: TSELead): number => {
    const deadlineMs = lead.assignedAt.getTime() + SLA_THRESHOLDS.FIRST_CALL_MINUTES * 60 * 1000;
    return Math.max(0, Math.floor((deadlineMs - currentTime.getTime()) / 60000));
  };

  const getLiveSLAStatus = (lead: TSELead): "MET" | "AT_RISK" | "BREACHED" => {
    const minsLeft = getLiveSLAMinutes(lead);
    if (minsLeft <= 0) return "BREACHED";
    if (minsLeft <= SLA_THRESHOLDS.AT_RISK_MINUTES) return "AT_RISK";
    return "MET";
  };

  const getSLABadge = (lead: TSELead) => {
    const minsLeft  = getLiveSLAMinutes(lead);
    const slaStatus = getLiveSLAStatus(lead);
    if (slaStatus === "BREACHED") {
      return <Badge className="bg-red-600">SLA BREACH</Badge>;
    }
    if (slaStatus === "AT_RISK" && minsLeft <= 2) {
      return (
        <Badge className="bg-orange-600 animate-pulse">
          {minsLeft}m left
        </Badge>
      );
    }
    if (slaStatus === "AT_RISK") {
      return <Badge className="bg-yellow-600">{minsLeft}m left</Badge>;
    }
    return <Badge variant="outline" className="text-green-700">SLA Met</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">New Leads</div>
          <div className="text-2xl font-bold text-blue-700">{stats.new}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Callbacks Due</div>
          <div className="text-2xl font-bold text-purple-700">{stats.callback}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Urgent</div>
          <div className="text-2xl font-bold text-red-700">{stats.urgent}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">SLA Breaches</div>
          <div className="text-2xl font-bold text-red-700">{stats.slaBreach}</div>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "ALL" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("ALL")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "NEW" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("NEW")}
            >
              New ({stats.new})
            </Button>
            <Button
              variant={filterStatus === "CALLBACK" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("CALLBACK")}
            >
              Callbacks ({stats.callback})
            </Button>
            <Button
              variant={filterStatus === "URGENT" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("URGENT")}
            >
              <AlertTriangle className="w-4 h-4 mr-1" />
              Urgent ({stats.urgent})
            </Button>
            {/* B3 FIX: INTERESTED status had no filter button */}
            <Button
              variant={filterStatus === ("INTERESTED" as any) ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus("INTERESTED" as any)}
            >
              Interested ({leads.filter(l => l.status === "INTERESTED").length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Lead Queue Table */}
      <Card className="p-6 overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>SLA Status</TableHead>
              <TableHead>Est. Value</TableHead>
              <TableHead className="min-w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow
                key={lead.id}
                className={
                  // B4 FIX: grey out CALLBACK leads not yet due
                  lead.status === "CALLBACK" && lead.nextFollowUpAt && lead.nextFollowUpAt > currentTime
                    ? "bg-gray-50 opacity-60"
                    : lead.slaStatus === "BREACHED"
                    ? "bg-red-50"
                    : lead.slaStatus === "AT_RISK"
                    ? "bg-yellow-50"
                    : ""
                }
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getPriorityIcon(lead.priority)}
                    <span className="text-sm font-medium">{lead.priority}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <div className="font-medium text-gray-900">
                      {lead.customerName}
                    </div>
                    <div className="text-sm text-gray-600">{lead.phone}</div>
                  </div>
                </TableCell>

                <TableCell>
                  <div>
                    <div className="font-medium">
                      {lead.vehicleCategory || lead.vehicleType}
                    </div>
                    <div className="text-xs text-gray-500">{lead.vehicleType}</div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="outline">{lead.source}</Badge>
                </TableCell>

                <TableCell>
                  <Badge
                    className={
                      lead.status === "NEW"
                        ? "bg-blue-600"
                        : lead.status === "INTERESTED"
                        ? "bg-green-600"
                        : lead.status === "CALLBACK"
                        ? "bg-purple-600"
                        : "bg-gray-600"
                    }
                  >
                    {lead.status}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span className="font-mono text-sm">{lead.attemptCount}/15</span>
                </TableCell>

                <TableCell>{getSLABadge(lead)}</TableCell>

                <TableCell>
                  <span className="font-semibold text-gray-900">
                    ₹{lead.estimatedValue.toLocaleString()}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => onCallLead(lead)}
                      disabled={
                        // B4 FIX: disable call for future scheduled callbacks
                        lead.status === "CALLBACK" &&
                        !!lead.nextFollowUpAt &&
                        lead.nextFollowUpAt > currentTime
                      }
                      title={
                        lead.status === "CALLBACK" && lead.nextFollowUpAt && lead.nextFollowUpAt > currentTime
                          ? `Scheduled for ${lead.nextFollowUpAt.toLocaleTimeString()}`
                          : "Call this lead"
                      }
                      className="gap-1.5 bg-gray-900 hover:bg-gray-700 text-white disabled:opacity-40"
                    >
                      <Phone className="w-4 h-4" />
                      {lead.status === "CALLBACK" && lead.nextFollowUpAt && lead.nextFollowUpAt > currentTime
                        ? `Due ${lead.nextFollowUpAt.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`
                        : "Call Now"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setWhatsAppLead(lead)}
                      className="gap-1.5 border-green-500 text-green-700 hover:bg-green-50 font-medium"
                      title="Send WhatsApp message"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No leads match your filters
          </div>
        )}
      </Card>

      {/* Legend */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-50 border border-red-300 rounded" />
            <span className="text-gray-700">SLA Breached</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded" />
            <span className="text-gray-700">SLA At Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              First call must be within {SLA_THRESHOLDS.FIRST_CALL_MINUTES} minutes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              Minimum {15} attempts before marking Lost
            </span>
          </div>
        </div>
      </Card>

      {/* WhatsApp Message Modal */}
      <TSEWhatsAppModal
        lead={whatsAppLead}
        open={whatsAppLead !== null}
        onClose={() => setWhatsAppLead(null)}
      />
    </div>
  );
}
