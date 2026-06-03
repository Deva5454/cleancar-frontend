import { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  X,
  Phone,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  MoreHorizontal,
  User,
  Activity,
  Mail,
  Target,
} from "lucide-react";
import { LeadOverviewTab } from "./panels/LeadOverviewTab";
import { LeadTimelineTab } from "./panels/LeadTimelineTab";
import { LeadCommunicationTab } from "./panels/LeadCommunicationTab";
import { LeadActionsTab } from "./panels/LeadActionsTab";

interface LeadContextPanelProps {
  lead: any;
  onClose: () => void;
}

export function LeadContextPanel({ lead, onClose }: LeadContextPanelProps) {
  const [activeTab, setActiveTab] = useState("overview");

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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] w-full h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">
                {lead.customerName}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-2">
                <span className="text-sm text-gray-500">
                  Lead ID: {lead.id}
                </span>
                <Badge variant="outline" className={getStageColor(lead.stage)}>
                  {lead.stage}
                </Badge>
                <Badge
                  variant="outline"
                  className={getTemperatureColor(lead.temperature)}
                >
                  {lead.temperature}
                </Badge>
                <Badge variant="outline">{lead.priority} Priority</Badge>
              </DialogDescription>

              {/* Mini Demo Stepper */}
              {lead.demoScheduled && (
                <div className="flex items-center gap-2 mt-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.demoScheduled ? "bg-teal-500" : "bg-gray-300"
                    }`}
                    title="Demo Scheduled"
                  />
                  <div className="w-8 h-0.5 bg-gray-300" />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.washerAssigned ? "bg-teal-500" : "bg-gray-300"
                    }`}
                    title="Washer Assigned"
                  />
                  <div className="w-8 h-0.5 bg-gray-300" />
                  <div
                    className={`w-3 h-3 rounded-full ${
                      lead.demoCompleted ? "bg-teal-500" : "bg-gray-300"
                    }`}
                    title="Demo Completed"
                  />
                  <span className="text-xs text-gray-500 ml-2">
                    Demo: {lead.demoDate}
                  </span>
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Main Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col px-6"
          >
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none"
              >
                <User className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="timeline"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none"
              >
                <Activity className="w-4 h-4 mr-2" />
                Activity & Timeline
              </TabsTrigger>
              <TabsTrigger
                value="communication"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Communication
              </TabsTrigger>
              <TabsTrigger
                value="actions"
                className="data-[state=active]:border-b-2 data-[state=active]:border-teal-600 rounded-none"
              >
                <Target className="w-4 h-4 mr-2" />
                Actions
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-6">
              <TabsContent value="overview" className="m-0">
                <LeadOverviewTab lead={lead} />
              </TabsContent>

              <TabsContent value="timeline" className="m-0">
                <LeadTimelineTab lead={lead} />
              </TabsContent>

              <TabsContent value="communication" className="m-0">
                <LeadCommunicationTab lead={lead} />
              </TabsContent>

              <TabsContent value="actions" className="m-0">
                <LeadActionsTab lead={lead} />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Persistent Quick Action Bar */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setActiveTab("actions")}
            >
              <Phone className="w-4 h-4 mr-2 text-blue-600" />
              Log Call
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setActiveTab("actions")}
            >
              <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
              Send WhatsApp
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setActiveTab("actions")}
            >
              <FileText className="w-4 h-4 mr-2 text-orange-600" />
              Send Plan & Price
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setActiveTab("actions")}
            >
              <Calendar className="w-4 h-4 mr-2 text-teal-600" />
              Schedule Demo
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => setActiveTab("actions")}
            >
              <Clock className="w-4 h-4 mr-2 text-gray-600" />
              Set Follow-Up
            </Button>
            <Button size="sm" variant="outline">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
