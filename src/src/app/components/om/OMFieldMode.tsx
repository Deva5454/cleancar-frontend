/**
 * OPERATIONS MANAGER: FIELD MODE (12:00 PM - 5:00 PM)
 * Mobile-first, action-heavy interface for field operations
 * GPS-based visit logging, lead updates, quick actions
 */

import { useState } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Plus, Users, Phone, Calendar, TrendingUp, Navigation } from "lucide-react";

export interface FieldVisit {
  id: string;
  customerName: string;
  location: string;
  visitType: "PROSPECT" | "DEMO" | "FOLLOW_UP" | "SOCIETY" | "CORPORATE";
  scheduledTime?: Date;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
}

export interface OMFieldModeProps {
  visits: FieldVisit[];
  onLogVisit: (visitType: string, location: string) => void;
  onUpdateLeadStage: (leadId: string, newStage: string) => void;
  onAddProspect: (name: string, location: string, phone: string) => void;
  currentLocation?: { lat: number; lng: number };
}

export function OMFieldMode({
  visits,
  onLogVisit,
  onUpdateLeadStage,
  onAddProspect,
  currentLocation,
}: OMFieldModeProps) {
  const [showAddProspect, setShowAddProspect] = useState(false);
  const [newProspect, setNewProspect] = useState({ name: "", location: "", phone: "" });

  const handleAddProspect = () => {
    if (newProspect.name && newProspect.location && newProspect.phone) {
      onAddProspect(newProspect.name, newProspect.location, newProspect.phone);
      setNewProspect({ name: "", location: "", phone: "" });
      setShowAddProspect(false);
    }
  };

  const getVisitTypeColor = (type: FieldVisit["visitType"]) => {
    switch (type) {
      case "PROSPECT": return "bg-blue-100 text-blue-700";
      case "DEMO": return "bg-purple-100 text-purple-700";
      case "FOLLOW_UP": return "bg-yellow-100 text-yellow-700";
      case "SOCIETY": return "bg-green-100 text-green-700";
      case "CORPORATE": return "bg-orange-100 text-orange-700";
    }
  };

  const pendingVisits = visits.filter(v => v.status === "PENDING");
  const completedVisits = visits.filter(v => v.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* FIELD MODE HEADER */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold">Field Mode</h1>
              <p className="text-xs text-green-100">Active: 12:00 PM - 5:00 PM</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              <Navigation className="h-4 w-4" />
              <span className="text-sm font-semibold">GPS Active</span>
            </div>
          </div>

          {/* QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              size="sm"
              className="bg-white text-green-700 hover:bg-green-50 w-full"
              onClick={() => onLogVisit("VISIT", currentLocation ? `${currentLocation.lat},${currentLocation.lng}` : "Unknown")}
            >
              <MapPin className="h-4 w-4 mr-1" />
              Log Visit
            </Button>
            <Button
              size="sm"
              className="bg-white text-green-700 hover:bg-green-50 w-full"
              onClick={() => setShowAddProspect(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Lead
            </Button>
            <Button
              size="sm"
              className="bg-white text-green-700 hover:bg-green-50 w-full"
              onClick={() => {/* Navigate to pipeline */}}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Pipeline
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        {/* TODAY'S SCHEDULE */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900">Today's Schedule</h2>
              <Badge variant="outline" className="bg-blue-100 text-blue-700">
                {pendingVisits.length} pending
              </Badge>
            </div>

            <div className="space-y-3">
              {pendingVisits.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No scheduled visits</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => setShowAddProspect(true)}>
                    Add New Visit
                  </Button>
                </div>
              ) : (
                pendingVisits.map((visit) => (
                  <div key={visit.id} className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm">{visit.customerName}</h3>
                        <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {visit.location}
                        </p>
                      </div>
                      <Badge className={getVisitTypeColor(visit.visitType)} variant="outline">
                        {visit.visitType}
                      </Badge>
                    </div>

                    {visit.scheduledTime && (
                      <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {visit.scheduledTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => onLogVisit(visit.visitType, visit.location)}
                      >
                        Start Visit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {/* Call customer */}}
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* COMPLETED TODAY */}
        {completedVisits.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">Completed Today</h2>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  {completedVisits.length} done
                </Badge>
              </div>

              <div className="space-y-2">
                {completedVisits.map((visit) => (
                  <div key={visit.id} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-sm">{visit.customerName}</h3>
                        <p className="text-xs text-gray-600">{visit.location}</p>
                      </div>
                      <Badge className="bg-green-600 text-white text-xs">✓ Done</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-600 mb-1">Visits Today</p>
              <p className="text-2xl font-bold text-gray-900">{completedVisits.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{pendingVisits.length}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ADD PROSPECT MODAL */}
      {showAddProspect && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-0">
          <Card className="w-full max-w-md rounded-t-3xl rounded-b-none">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add New Prospect</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Customer Name</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter name"
                    value={newProspect.name}
                    onChange={(e) => setNewProspect({ ...newProspect, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Location</label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter location"
                    value={newProspect.location}
                    onChange={(e) => setNewProspect({ ...newProspect, location: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-300 rounded-lg"
                    placeholder="Enter phone"
                    value={newProspect.phone}
                    onChange={(e) => setNewProspect({ ...newProspect, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleAddProspect}
                >
                  Add Prospect
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowAddProspect(false);
                    setNewProspect({ name: "", location: "", phone: "" });
                  }}
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
