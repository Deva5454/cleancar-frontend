// Dashboard for TSM and TSE roles
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Phone, UserPlus, TrendingUp, Clock, Target } from "lucide-react";
import { MASTER_LEADS, MASTER_KPI_DATA } from "../../data/masterData";
import { useRole } from "../../contexts/RoleContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BackButton } from "../ui/back-button";

export function SalesDashboard() {
  const { currentRole } = useRole();
  const navigate = useNavigate();
  const isTSM = currentRole === "TSM";

  const handleAddLead = () => {
    navigate("/leads");
  };

  const handleCall = (leadMobile: string) => {
    toast.success(`Calling ${leadMobile}...`);
  };

  // Use centralized lead data from masterData
  const myLeads = MASTER_LEADS.filter(l => l.assignedTo === "Neha Singh" || isTSM);
  const stats = {
    totalAssigned: myLeads.length,
    newLeads: myLeads.filter(l => l.status === "New").length,
    inProgress: myLeads.filter(l => l.status === "In Progress").length,
    converted: myLeads.filter(l => l.status === "Converted").length,
    conversionRate: MASTER_KPI_DATA.conversionRate, // Real conversion rate from centralized data
    callsMade: 24,
  };

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isTSM ? "Sales Manager Dashboard" : "My Sales Dashboard"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">Track leads and conversions</p>
        </div>
        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={handleAddLead}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.totalAssigned}</p>
              <p className="text-xs text-gray-500 mt-1">Total Leads</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.newLeads}</p>
              <p className="text-xs text-gray-500 mt-1">New</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.inProgress}</p>
              <p className="text-xs text-gray-500 mt-1">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
              <p className="text-xs text-gray-500 mt-1">Converted</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{stats.conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-1">Conv. Rate</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-indigo-600">{stats.callsMade}</p>
              <p className="text-xs text-gray-500 mt-1">Calls Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* My Leads */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">
            {isTSM ? "Team Leads" : "My Active Leads"}
          </h3>
          <div className="space-y-3">
            {myLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{lead.name}</p>
                    <Badge variant="outline" className="text-xs">{lead.id}</Badge>
                    <Badge variant={
                      lead.status === "New" ? "default" : 
                      lead.status === "Converted" ? "secondary" : 
                      "outline"
                    }>
                      {lead.status}
                    </Badge>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-600">
                    <span>{lead.mobile}</span>
                    <span>{lead.source}</span>
                    <span>{lead.carType}</span>
                  </div>
                  {isTSM && (
                    <p className="text-xs text-gray-500 mt-1">Assigned to: {lead.assignedTo}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <div className="text-right">
                    <p className={`text-xs font-medium ${lead.sla.includes("Overdue") ? "text-red-600" : "text-gray-600"}`}>
                      {lead.sla}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => handleCall(lead.mobile)}>
                    <Phone className="w-4 h-4 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Daily Goals */}
      <Card className="bg-gradient-to-r from-green-50 to-teal-50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Today's Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Calls Target</p>
                <p className="text-xl font-bold">{stats.callsMade}/30</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Conversions Goal</p>
                <p className="text-xl font-bold">{stats.converted}/5</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenue Target</p>
                <p className="text-xl font-bold">₹15K/₹25K</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}