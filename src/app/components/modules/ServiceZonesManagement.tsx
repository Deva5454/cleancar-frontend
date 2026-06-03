import React, { useState } from "react";
import { toast } from "sonner";
import { serviceZones } from "../../lib/mockData";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Label } from "../ui/label";
import { Search, Plus, Edit, CheckCircle, XCircle, MapPin, Users, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

export function ServiceZonesManagement() {
  const [zones, setZones] = useState(serviceZones);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingZone, setEditingZone] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    pinCode: "",
    areaName: "",
    city: "Surat",
    state: "Gujarat",
    region: "South Gujarat",
    status: "Active",
    serviceable: true,
    assignedSupervisor: "",
    assignedTSE: "",
    assignedWashers: [] as string[],
  });

  // Filter zones based on search
  const filteredZones = zones.filter(zone => 
    zone.pinCode.includes(searchTerm) ||
    zone.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeZones = filteredZones.filter(z => z.status === "Active");
  const inactiveZones = filteredZones.filter(z => z.status === "Inactive");
  const expansionZones = filteredZones.filter(z => z.status === "Expansion Planned");

  return (
    <div className="space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Zones (PIN Code)</h1>
          <p className="text-sm text-gray-500 mt-1">Manage service zones by PIN code - replaces branch management</p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Service Zone
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Service Zones</p>
                <p className="text-2xl font-bold mt-1">{zones.length}</p>
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
                <p className="text-sm text-gray-500">Active & Serviceable</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{activeZones.filter(z => z.serviceable).length}</p>
              </div>
              <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Active Customers</p>
                <p className="text-2xl font-bold mt-1">{zones.reduce((sum, z) => sum + z.activeCustomers, 0)}</p>
              </div>
              <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expansion Zones</p>
                <p className="text-2xl font-bold mt-1 text-amber-600">{expansionZones.length}</p>
              </div>
              <div className="bg-amber-50 text-amber-600 p-3 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active Zones ({activeZones.length})</TabsTrigger>
          <TabsTrigger value="expansion">Expansion ({expansionZones.length})</TabsTrigger>
          <TabsTrigger value="inactive">Inactive ({inactiveZones.length})</TabsTrigger>
          <TabsTrigger value="all">All Zones</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Active Service Zones</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by PIN, area, city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-72"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Area Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Serviceable</TableHead>
                    <TableHead>Supervisor</TableHead>
                    <TableHead>TSE</TableHead>
                    <TableHead>Washers</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Jobs Today</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-bold text-blue-600">{zone.pinCode}</TableCell>
                      <TableCell className="font-medium">{zone.areaName}</TableCell>
                      <TableCell>{zone.city}</TableCell>
                      <TableCell>
                        {zone.serviceable ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600">
                            <XCircle className="w-3 h-3 mr-1" />
                            No
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{zone.assignedSupervisor || "—"}</TableCell>
                      <TableCell>{zone.assignedTSE || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{zone.assignedWashers.length} washers</Badge>
                      </TableCell>
                      <TableCell>{zone.activeCustomers}</TableCell>
                      <TableCell>
                        <span className={`font-medium ${zone.openComplaints > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {zone.openJobsToday} {zone.openComplaints > 0 && `(${zone.openComplaints} complaints)`}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toast.info(`Edit zone ${zone.pinCode}`)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              if (confirm(`Deactivating PIN ${zone.pinCode} will prevent new bookings. ${zone.activeSubscriptions} active subscriptions and ${zone.openJobsToday} scheduled jobs exist. Confirm?`)) {
                                toast.success(`Zone ${zone.pinCode} deactivated`);
                              }
                            }}
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expansion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Expansion Planned Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Area Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>TSE Assigned</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expansionZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-bold text-amber-600">{zone.pinCode}</TableCell>
                      <TableCell className="font-medium">{zone.areaName}</TableCell>
                      <TableCell>{zone.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700">
                          Expansion Planned
                        </Badge>
                      </TableCell>
                      <TableCell>{zone.assignedTSE || "Not Assigned"}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => toast.info(`Activate zone ${zone.pinCode}?`)}
                        >
                          Activate Zone
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inactive" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Inactive Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Area Name</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveZones.map((zone) => (
                    <TableRow key={zone.id} className="bg-gray-50">
                      <TableCell className="font-bold text-gray-500">{zone.pinCode}</TableCell>
                      <TableCell className="font-medium text-gray-600">{zone.areaName}</TableCell>
                      <TableCell className="text-gray-600">{zone.city}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-gray-600">
                          Inactive
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => toast.info(`Reactivate zone ${zone.pinCode}?`)}
                        >
                          Reactivate
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All Service Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PIN Code</TableHead>
                    <TableHead>Area Name</TableHead>
                    <TableHead>City / State</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Serviceable</TableHead>
                    <TableHead>Active Customers</TableHead>
                    <TableHead>Subscriptions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredZones.map((zone) => (
                    <TableRow key={zone.id}>
                      <TableCell className="font-bold">{zone.pinCode}</TableCell>
                      <TableCell className="font-medium">{zone.areaName}</TableCell>
                      <TableCell>{zone.city}, {zone.state}</TableCell>
                      <TableCell>{zone.region}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={zone.status === "Active" ? "secondary" : "outline"}
                          className={
                            zone.status === "Active" ? "bg-green-50 text-green-700" :
                            zone.status === "Expansion Planned" ? "bg-amber-50 text-amber-700" :
                            "text-gray-600"
                          }
                        >
                          {zone.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {zone.serviceable ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>{zone.activeCustomers}</TableCell>
                      <TableCell>{zone.activeSubscriptions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
