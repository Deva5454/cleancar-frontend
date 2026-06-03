/**
 * Demo Management - For TSE/TSM roles
 * Shows scheduled demos with status tracking
 * Enhanced with comprehensive demo workflow
 */

import { useState } from "react";
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
import { Calendar, Clock, Phone, MapPin, Car, Plus, CheckCircle, AlertCircle, Eye } from "lucide-react";
import { DemoAssignmentStatus } from "./DemoAssignmentStatus";
import { DemoSchedulingDrawer } from "./DemoSchedulingDrawer";
import { useDemos } from "../../contexts/DemoContext";
import { useCustomers } from "../../contexts/CustomerContext";

export function DemoManagement() {
  const { demos } = useDemos();
  const { leads } = useCustomers();
  const [showScheduleDrawer, setShowScheduleDrawer] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<typeof demos[0] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Build real lead data from selected demo
  const realLeadData = selectedDemo ? (() => {
    const lead = leads.find(l => l.leadId === selectedDemo.leadId);
    return lead ? {
      leadId: lead.leadId,
      leadName: `${lead.firstName} ${lead.lastName}`,
      phone: lead.phone,
      address: lead.address,
      vehicleDetails: lead.vehicleDetails,
    } : null;
  })() : null;

  // Fallback mock lead data for demo scheduling
  const mockLeadData = {
    id: "LD999",
    name: "Demo Customer",
    mobile: "+91 98765 43210",
    area: "Adajan",
    address: "Sample Address",
    vehicleCategory: "Mid-Size Sedan (>4m)",
    planOfInterest: "Gold Monthly",
  };

  const getStatusBadge = (status: string) => {
    if (status.includes("Completed")) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" /> {status}
        </Badge>
      );
    }
    if (status.includes("Scheduled") || status.includes("In Progress")) {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" /> {status}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-orange-100 text-orange-800">
        <AlertCircle className="w-3 h-3 mr-1" /> {status}
      </Badge>
    );
  };

  const getDemoTypeBadge = (demoType: string) => {
    return (
      <Badge
        variant="outline"
        className={
          demoType === "One-Time Service Demo"
            ? "bg-amber-50 text-amber-700 border-amber-300"
            : "bg-teal-50 text-teal-700 border-teal-300"
        }
      >
        {demoType === "One-Time Service Demo" ? "One-Time" : "Subscription"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Demo Wash Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Schedule and track demo washes for interested leads
          </p>
        </div>
        <Button size="sm" onClick={() => setShowScheduleDrawer(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Demo
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Demos</p>
                <p className="text-2xl font-bold mt-1">{demos.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Assignment</p>
                <p className="text-2xl font-bold mt-1">{demos.filter((d) => !d.washerAssigned).length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold mt-1">
                  {demos.filter((d) => d.washerAssigned && !d.demoCompleted).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold mt-1">{demos.filter((d) => d.demoCompleted).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Demo List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled Demos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <div className="min-w-[900px] sm:min-w-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Demo ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Demo Type</TableHead>
                    <TableHead>Demo Date & Time</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
            <TableBody>
              {demos.map((demo) => (
                <TableRow key={demo.id}>
                  <TableCell className="font-medium">{demo.id}</TableCell>
                  <TableCell>{demo.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3 text-gray-400" />
                      {demo.mobile}
                    </div>
                  </TableCell>
                  <TableCell>{getDemoTypeBadge(demo.demoType)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      {new Date(demo.demoDate).toLocaleDateString()}
                      <br />
                      <Clock className="w-3 h-3 text-gray-400" />
                      {demo.demoTimeSlot}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Car className="w-3 h-3 text-gray-400" />
                      {demo.vehicleCategory}
                    </div>
                    <p className="text-xs text-gray-500">{demo.vehicleRegistrationNumber}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {demo.area}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(demo.status)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDemo(demo);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Scheduling Drawer */}
      <DemoSchedulingDrawer
        isOpen={showScheduleDrawer}
        onClose={() => setShowScheduleDrawer(false)}
        leadData={realLeadData || mockLeadData}
      />

      {/* Demo Details Modal */}
      {selectedDemo && showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6 rounded-t-lg">
              <h2 className="text-xl font-bold">Demo Wash Details - {selectedDemo.id}</h2>
              <p className="text-sm text-blue-100 mt-1">Complete workflow tracking from scheduling to completion</p>
            </div>
            
            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{selectedDemo.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Mobile</p>
                  <p className="font-medium">{selectedDemo.mobile}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">
                    {selectedDemo.addressLine1}, {selectedDemo.area}
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedDemo.city} - {selectedDemo.pinCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Vehicle</p>
                  <p className="font-medium">
                    {selectedDemo.vehicleCategory} {selectedDemo.vehicleColor && `(${selectedDemo.vehicleColor})`}
                  </p>
                  <p className="text-sm text-gray-500">{selectedDemo.vehicleRegistrationNumber}</p>
                </div>
              </div>

              {/* Demo Details */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-blue-700">Demo Type</p>
                  <div className="mt-1">{getDemoTypeBadge(selectedDemo.demoType)}</div>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Plan</p>
                  <p className="font-medium">
                    {selectedDemo.planName} {selectedDemo.planPrice && `- ₹${selectedDemo.planPrice}/mo`}
                  </p>
                </div>
              </div>

              {/* Status Tracker */}
              <DemoAssignmentStatus
                assignment={{
                  tseScheduled: selectedDemo.tseScheduled,
                  tseScheduledAt: selectedDemo.tseScheduledAt,
                  tseScheduledBy: selectedDemo.tseScheduledBy,
                  demoDate: selectedDemo.demoDate,
                  demoTimeSlot: selectedDemo.demoTimeSlot,
                  assignedSupervisor: selectedDemo.assignedSupervisor,
                  washerAssigned: selectedDemo.washerAssigned,
                  washerAssignedAt: selectedDemo.washerAssignedAt,
                  washerName: selectedDemo.washerName,
                  demoCompleted: selectedDemo.demoCompleted,
                  demoCompletedAt: selectedDemo.demoCompletedAt,
                  demoOutcome: selectedDemo.demoOutcome,
                }}
              />

              {/* Timeline */}
              {selectedDemo.timelineEntries && selectedDemo.timelineEntries.length > 0 && (
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-sm mb-3">Activity Timeline</h4>
                  <div className="space-y-3">
                    {selectedDemo.timelineEntries.map((entry, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-1.5"></div>
                        <div className="flex-1">
                          <p className="font-medium">{entry.action}</p>
                          <p className="text-xs text-gray-500">
                            {entry.actor} • {new Date(entry.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Status */}
              <div className="p-4 border-2 border-dashed rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Current Status</h4>
                {getStatusBadge(selectedDemo.status)}
                {!selectedDemo.washerAssigned && (
                  <p className="text-sm text-gray-600 mt-2">
                    ⏳ Waiting for supervisor <strong>{selectedDemo.assignedSupervisor}</strong> to assign a car
                    washer
                  </p>
                )}
                {selectedDemo.washerAssigned && !selectedDemo.demoCompleted && (
                  <p className="text-sm text-gray-600 mt-2">
                    👤 Assigned to <strong>{selectedDemo.washerName}</strong> • Demo scheduled for{" "}
                    <strong>
                      {new Date(selectedDemo.demoDate).toLocaleDateString()} {selectedDemo.demoTimeSlot}
                    </strong>
                  </p>
                )}
                {selectedDemo.demoCompleted && (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-600">
                      ✅ Completed on {selectedDemo.demoCompletedAt} • Outcome:{" "}
                      <strong>{selectedDemo.demoOutcome}</strong>
                    </p>
                    {selectedDemo.customerVerbalFeedback && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-900">Customer Feedback</p>
                        <p className="text-sm text-amber-800 mt-1">{selectedDemo.customerVerbalFeedback}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t flex justify-end">
              <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}