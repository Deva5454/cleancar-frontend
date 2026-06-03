import React, { useState } from "react";
import { toast } from "sonner";
import { expansionOpportunities } from "../../lib/mockData";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { MapPin, TrendingUp, Users, DollarSign, CheckCircle, AlertTriangle, XCircle } from "lucide-react";

export function ExpansionOpportunities() {
  const [opportunities, setOpportunities] = useState(expansionOpportunities);

  // Calculate KPIs
  const totalUnserviceableLeads = opportunities.reduce((sum, o) => sum + o.totalLeads, 0);
  const uniqueUnserviceablePINs = opportunities.length;
  const top3PINs = [...opportunities]
    .sort((a, b) => b.potentialCustomers - a.potentialCustomers)
    .slice(0, 3);
  const estimatedRevenue = top3PINs.reduce((sum, o) => sum + o.potentialCustomers, 0) * 2499; // Average subscription value

  const handleMarkForExpansion = (pinCode: string) => {
    if (confirm(`Mark PIN ${pinCode} for expansion? This will create a new zone record with "Expansion Planned" status.`)) {
      setOpportunities(opportunities.map(o => 
        o.pinCode === pinCode 
          ? { ...o, status: "Expansion Approved" }
          : o
      ));
      toast.success(`Zone ${pinCode} marked for expansion! Status changed to "Expansion Approved"`);
    }
  };

  return (
    <div className="space-y-6">
      <BackButton to="/analytics" />
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Expansion Opportunities</h1>
        <p className="text-sm text-gray-500 mt-1">Leads and enquiries from unserviceable PIN codes</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Unserviceable Leads</p>
                <p className="text-2xl font-bold mt-1">{totalUnserviceableLeads}</p>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Unique Unserviceable PINs</p>
                <p className="text-2xl font-bold mt-1">{uniqueUnserviceablePINs}</p>
                <p className="text-xs text-gray-500 mt-1">New areas</p>
              </div>
              <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Top 3 PIN Potential</p>
                <p className="text-2xl font-bold mt-1">{top3PINs.reduce((sum, o) => sum + o.potentialCustomers, 0)}</p>
                <p className="text-xs text-gray-500 mt-1">Customers</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Estimated Revenue</p>
                <p className="text-2xl font-bold mt-1">₹{(estimatedRevenue / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 mt-1">If top 3 activated</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expansion Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Unserviceable PIN Code Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PIN Code</TableHead>
                <TableHead>Area Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Total Leads</TableHead>
                <TableHead className="text-right">Enquiries</TableHead>
                <TableHead className="text-right">Potential Customers</TableHead>
                <TableHead>Lead Date Range</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((opportunity) => (
                <TableRow 
                  key={opportunity.id}
                  className={opportunity.status === "Expansion Approved" ? "bg-green-50" : ""}
                >
                  <TableCell className="font-bold text-blue-600">{opportunity.pinCode}</TableCell>
                  <TableCell className="font-medium">{opportunity.areaName}</TableCell>
                  <TableCell>{opportunity.city}</TableCell>
                  <TableCell className="text-right font-medium">{opportunity.totalLeads}</TableCell>
                  <TableCell className="text-right">{opportunity.totalEnquiries}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-bold text-purple-600">{opportunity.potentialCustomers}</span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {opportunity.earliestLeadDate}<br/>
                    to {opportunity.latestLeadDate}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        opportunity.status === "Expansion Approved" ? "secondary" :
                        opportunity.status === "Under Consideration" ? "default" :
                        opportunity.status === "Not Feasible" ? "outline" :
                        "default"
                      }
                      className={
                        opportunity.status === "Expansion Approved" ? "bg-green-100 text-green-700" :
                        opportunity.status === "Under Consideration" ? "bg-amber-100 text-amber-700" :
                        opportunity.status === "Not Feasible" ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                      }
                    >
                      {opportunity.status === "Expansion Approved" && <CheckCircle className="w-3 h-3 mr-1" />}
                      {opportunity.status === "Under Consideration" && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {opportunity.status === "Not Feasible" && <XCircle className="w-3 h-3 mr-1" />}
                      {opportunity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 max-w-xs">
                    {opportunity.notes || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {opportunity.status === "Unreviewed" || opportunity.status === "Under Consideration" ? (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleMarkForExpansion(opportunity.pinCode)}
                      >
                        Mark for Expansion
                      </Button>
                    ) : opportunity.status === "Expansion Approved" ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => toast.info(`Activate zone ${opportunity.pinCode}?`)}
                      >
                        Activate Zone
                      </Button>
                    ) : (
                      <span className="text-sm text-gray-500">No action</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Opportunities Highlight */}
      <Card className="border-purple-300 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-base text-purple-900">Top 3 Expansion Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3PINs.map((opp, index) => (
              <div key={opp.id} className="p-4 bg-white border border-purple-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    #{index + 1}
                  </Badge>
                  <span className="text-2xl font-bold text-purple-600">{opp.potentialCustomers}</span>
                </div>
                <p className="font-bold text-lg">{opp.pinCode} — {opp.areaName}</p>
                <p className="text-sm text-gray-600 mt-1">{opp.totalLeads} leads, {opp.totalEnquiries} enquiries</p>
                <p className="text-xs text-gray-500 mt-2">Est. Revenue: ₹{((opp.potentialCustomers * 2499) / 1000).toFixed(0)}K/month</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
