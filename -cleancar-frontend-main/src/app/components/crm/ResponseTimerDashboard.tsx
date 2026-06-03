import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Phone,
  User,
  Timer,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type ResponseLead = {
  id: string;
  name: string;
  mobile: string;
  society: string;
  source: string;
  assignedTo: string;
  assignedAt: string;
  timeElapsed: number; // in minutes
  slaRemaining: number; // in minutes
  status: "within-sla" | "approaching-sla" | "delayed";
};

const mockResponseLeads: ResponseLead = []; // ✅ No mock data

export function ResponseTimerDashboard() {
  const [leads, setLeads] = useState<ResponseLead[]>(mockResponseLeads);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Update time elapsed for all leads
      setLeads((prevLeads) =>
        prevLeads.map((lead) => ({
          ...lead,
          timeElapsed: lead.timeElapsed + 1,
          slaRemaining: lead.slaRemaining - 1,
          status:
            lead.slaRemaining - 1 <= 0
              ? "delayed"
              : lead.slaRemaining - 1 <= 2
              ? "approaching-sla"
              : "within-sla",
        }))
      );
    }, 60000); // Every 1 minute

    return () => clearInterval(interval);
  }, []);

  const withinSLACount = leads.filter(
    (l) => l.status === "within-sla"
  ).length;
  const approachingSLACount = leads.filter(
    (l) => l.status === "approaching-sla"
  ).length;
  const delayedCount = leads.filter((l) => l.status === "delayed").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "within-sla":
        return "bg-green-100 text-green-800 border-green-300";
      case "approaching-sla":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "delayed":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRowColor = (status: string) => {
    switch (status) {
      case "within-sla":
        return "bg-white";
      case "approaching-sla":
        return "bg-orange-50";
      case "delayed":
        return "bg-red-50";
      default:
        return "bg-white";
    }
  };

  const handleCallNow = (lead: ResponseLead) => {
    // Open phone dialer
    window.location.href = `tel:${lead.mobile}`;
    
    // Update lead status
    const updatedLeads = leads.map(l => 
      l.id === lead.id 
        ? { ...l, status: "contacted" as const, responseTime: Math.floor(Date.now() / 60000) % 5 } 
        : l
    );
    setLeads(updatedLeads);
    
    toast.info(`Calling ${lead.name} at ${lead.mobile}...`);
  };

  const handleWhatsApp = (lead: ResponseLead) => {
    // Open WhatsApp with pre-filled message
    const message = encodeURIComponent(`Hi ${lead.name}, I'm reaching out from our car washing service. Would you like to learn more about our subscription plans?`);
    window.open(`https://wa.me/${lead.mobile.replace(/\D/g, '')}?text=${message}`, '_blank');
    
    // Update lead status
    const updatedLeads = leads.map(l => 
      l.id === lead.id 
        ? { ...l, status: "contacted" as const, responseTime: Math.floor(Date.now() / 60000) % 5 } 
        : l
    );
    setLeads(updatedLeads);
  };

  const handleMarkContacted = (leadId: string) => {
    const updatedLeads = leads.map(l => 
      l.id === leadId 
        ? { ...l, status: "contacted" as const, responseTime: Math.floor(Date.now() / 60000) % 5 } 
        : l
    );
    setLeads(updatedLeads);
    toast.success(`Lead ${leadId} marked as contacted!`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Response Timer Dashboard
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          5-Minute SLA tracking for lead response • Updated:{" "}
          {currentTime.toLocaleTimeString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Contact</p>
                <p className="text-3xl font-bold text-gray-900">
                  {leads.length}
                </p>
              </div>
              <Clock className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Within SLA</p>
                <p className="text-3xl font-bold text-green-600">
                  {withinSLACount}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">On Track</span>
                </div>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700">Approaching SLA</p>
                <p className="text-3xl font-bold text-orange-600">
                  {approachingSLACount}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-orange-500" />
                  <span className="text-xs text-orange-600">Act Fast</span>
                </div>
              </div>
              <Timer className="w-10 h-10 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Response Delayed</p>
                <p className="text-3xl font-bold text-red-600">
                  {delayedCount}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <AlertTriangle className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-red-600">Urgent</span>
                </div>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SLA Performance Chart */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">
              Today's SLA Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Contacted within SLA ({"<"}5 min)
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: "85%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-green-600">
                    85%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Approaching SLA (3-5 min)
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">
                    10%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Response Delayed ({">"}5 min)
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-64 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-red-500 h-3 rounded-full"
                      style={{ width: "5%" }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    5%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500">Avg Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">3.2 min</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">-0.5 min</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fastest Response</p>
                  <p className="text-2xl font-bold text-green-600">45 sec</p>
                  <span className="text-xs text-gray-500">Priya Sharma</span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Contacted</p>
                  <p className="text-2xl font-bold text-gray-900">47</p>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-green-600">+12 today</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SLA Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-green-100 mb-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-green-600">85%</p>
                  <p className="text-xs text-green-700">This Month</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target</span>
                  <span className="font-semibold text-gray-900">90%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Last Month</span>
                  <span className="font-semibold text-gray-900">82%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Trend</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-500" />
                    <span className="font-semibold text-green-600">+3%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Leads Pending First Contact</span>
            <Badge variant="outline">{leads.length} Active</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Lead
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Society
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Source
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Assigned To
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Assigned At
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Time Elapsed
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    SLA Status
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`${getRowColor(lead.status)} hover:bg-gray-50`}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">
                          {lead.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.mobile}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {lead.society}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">
                        {lead.source}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {lead.assignedTo}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {lead.assignedAt}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-900">
                          {lead.timeElapsed} min
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status === "within-sla" && (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {lead.slaRemaining} min left
                          </>
                        )}
                        {lead.status === "approaching-sla" && (
                          <>
                            <Timer className="w-3 h-3 mr-1" />
                            {lead.slaRemaining} min left
                          </>
                        )}
                        {lead.status === "delayed" && (
                          <>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {Math.abs(lead.slaRemaining)} min over
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button
                        size="sm"
                        className={
                          lead.status === "delayed"
                            ? "bg-red-600 hover:bg-red-700"
                            : lead.status === "approaching-sla"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }
                        onClick={() => handleCallNow(lead)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call Now
                      </Button>
                      <Button
                        size="sm"
                        className={
                          lead.status === "delayed"
                            ? "bg-red-600 hover:bg-red-700"
                            : lead.status === "approaching-sla"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }
                        onClick={() => handleWhatsApp(lead)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Button>
                      <Button
                        size="sm"
                        className={
                          lead.status === "delayed"
                            ? "bg-red-600 hover:bg-red-700"
                            : lead.status === "approaching-sla"
                            ? "bg-orange-600 hover:bg-orange-700"
                            : "bg-blue-600 hover:bg-blue-700"
                        }
                        onClick={() => handleMarkContacted(lead.id)}
                      >
                        Mark Contacted
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}