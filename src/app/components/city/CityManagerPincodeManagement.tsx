/**
 * CITY MANAGER - PINCODE MANAGEMENT
 * Interface for City Manager to add/manage pincodes within their city
 */

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { MapPin, Plus, CheckCircle, AlertCircle, Users, Target } from "lucide-react";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";
import { useRole } from "../../contexts/RoleContext";
import { logger } from "../../services/logger";

export function CityManagerPincodeManagement() {
  const { currentUser } = useRole();
  const [isAddPincodeOpen, setIsAddPincodeOpen] = useState(false);

  // Form state for new pincode
  const [newPincode, setNewPincode] = useState({
    id: "",
    pincode: "",
    areaName: "",
    zoneId: "",
    clusterId: "",
    clusterManagerId: "",
    estimatedHouseholds: "",
    marketPotential: "MEDIUM" as "HIGH" | "MEDIUM" | "LOW",
  });

  // Get city data
  const cityId = currentUser.cityId || 'CITY-SURAT';
  const city = organizationHierarchyService.getCityById(cityId);
  const zones = organizationHierarchyService.getZonesByCity(cityId);
  const allClusters = organizationHierarchyService.getClustersByCity(cityId);
  const pincodes = organizationHierarchyService.getPincodesByCity(cityId);
  const activePincodes = pincodes.filter(p => p.isActive);

  // Filter clusters by selected zone
  const clusters = newPincode.zoneId
    ? allClusters.filter(c => c.zoneId === newPincode.zoneId)
    : allClusters;

  const handleAddPincode = () => {
    // In production: POST /api/city-manager/pincodes
    logger.log("Adding new pincode:", newPincode);

    // This would update the database
    // For now, show instructions to update the code
    toast.info(`To add this pincode to the system:

1. Open: src/app/services/organizationHierarchyService.ts
2. Add to pincodes array:
{
  id: '${newPincode.id}',
  pincode: '${newPincode.pincode}',
  areaName: '${newPincode.areaName}',
  cityId: '${cityId}',
  clusterId: '${newPincode.clusterId}',
  clusterManagerId: ${newPincode.clusterManagerId ? `'${newPincode.clusterManagerId}'` : 'null'},
  isActive: true,
  activationDate: new Date(),
  metadata: {
    estimatedHouseholds: ${newPincode.estimatedHouseholds},
    marketPotential: '${newPincode.marketPotential}'
  }
}

3. See NEW_PINCODE_ACTIVATION_WORKFLOW.md for complete setup process.
4. Next steps:
   - Assign Operations Manager
   - Create 2-3 initial teams
   - Hire supervisors and washers`);

    setIsAddPincodeOpen(false);
    setNewPincode({
      id: "",
      pincode: "",
      areaName: "",
      zoneId: "",
      clusterId: "",
      clusterManagerId: "",
      estimatedHouseholds: "",
      marketPotential: "MEDIUM",
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pincode Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            City Manager - {city?.name || 'Surat'} • {activePincodes.length} Active Pincodes
          </p>
        </div>
        <Dialog open={isAddPincodeOpen} onOpenChange={setIsAddPincodeOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New Pincode
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Pincode - {city?.name}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="text-sm text-purple-900">
                    <p className="font-semibold mb-1">Before Adding a Pincode:</p>
                    <ul className="space-y-1 text-purple-800">
                      <li>• Market feasibility study completed</li>
                      <li>• Estimated households identified</li>
                      <li>• Cluster assignment decided</li>
                      <li>• See: NEW_PINCODE_ACTIVATION_WORKFLOW.md</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pincodeId">Pincode ID</Label>
                  <Input
                    id="pincodeId"
                    placeholder="PIN-395010"
                    value={newPincode.id}
                    onChange={(e) => setNewPincode({ ...newPincode, id: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Format: PIN-{"{6 DIGITS}"}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode Number</Label>
                  <Input
                    id="pincode"
                    placeholder="395010"
                    maxLength={6}
                    value={newPincode.pincode}
                    onChange={(e) => setNewPincode({ ...newPincode, pincode: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">6-digit pincode</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaName">Area Name</Label>
                <Input
                  id="areaName"
                  placeholder="Vesu"
                  value={newPincode.areaName}
                  onChange={(e) => setNewPincode({ ...newPincode, areaName: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={newPincode.zoneId}
                  onValueChange={(value) => {
                    setNewPincode({
                      ...newPincode,
                      zoneId: value,
                      clusterId: "", // Reset cluster when zone changes
                      clusterManagerId: "",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cluster">Cluster</Label>
                  <Select
                    value={newPincode.clusterId}
                    onValueChange={(value) => {
                      const cluster = clusters.find(c => c.id === value);
                      setNewPincode({
                        ...newPincode,
                        clusterId: value,
                        clusterManagerId: cluster?.clusterManagerId || "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select cluster" />
                    </SelectTrigger>
                    <SelectContent>
                      {clusters.map((cluster) => (
                        <SelectItem key={cluster.id} value={cluster.id}>
                          {cluster.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="households">Estimated Households</Label>
                  <Input
                    id="households"
                    type="number"
                    placeholder="25000"
                    value={newPincode.estimatedHouseholds}
                    onChange={(e) => setNewPincode({ ...newPincode, estimatedHouseholds: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="potential">Market Potential</Label>
                <Select
                  value={newPincode.marketPotential}
                  onValueChange={(value: "HIGH" | "MEDIUM" | "LOW") =>
                    setNewPincode({ ...newPincode, marketPotential: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High - Premium area, high car ownership</SelectItem>
                    <SelectItem value="MEDIUM">Medium - Mixed residential area</SelectItem>
                    <SelectItem value="LOW">Low - Lower car ownership density</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPincode.clusterId && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900 mb-1">Cluster Manager:</p>
                  <p className="text-gray-700">
                    {newPincode.clusterManagerId || <span className="text-amber-600">Not assigned - assign later</span>}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleAddPincode}
                  disabled={
                    !newPincode.id ||
                    !newPincode.pincode ||
                    !newPincode.areaName ||
                    !newPincode.clusterId ||
                    !newPincode.estimatedHouseholds
                  }
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create Pincode
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setIsAddPincodeOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Pincodes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pincodes.map((pincode) => {
          const teams = organizationHierarchyService.getTeamsByPincode(pincode.id);
          const cluster = clusters.find(c => c.id === pincode.clusterId);

          return (
            <Card key={pincode.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <CardTitle className="text-lg">{pincode.areaName}</CardTitle>
                  </div>
                  <Badge className={pincode.isActive ? "bg-green-600" : "bg-gray-400"}>
                    {pincode.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-500">Pincode</p>
                  <p className="font-medium text-lg">{pincode.pincode}</p>
                </div>

                <div className="text-sm">
                  <p className="text-gray-500">Cluster</p>
                  <p className="font-medium">{cluster?.name}</p>
                </div>

                <div className="text-sm">
                  <p className="text-gray-500">Cluster Manager</p>
                  <p className="font-medium">
                    {pincode.clusterManagerId || <span className="text-amber-600">Not Assigned</span>}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-blue-600">{teams.length}</p>
                    <p className="text-xs text-gray-500">Teams</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-2xl font-bold text-green-600">
                      {teams.reduce((sum, t) => sum + t.washerIds.length, 0)}
                    </p>
                    <p className="text-xs text-gray-500">Washers</p>
                  </div>
                  <div className="text-center flex-1">
                    <Badge
                      variant="outline"
                      className={
                        pincode.metadata.marketPotential === "HIGH"
                          ? "border-green-500 text-green-700"
                          : pincode.metadata.marketPotential === "MEDIUM"
                          ? "border-amber-500 text-amber-700"
                          : "border-gray-500 text-gray-700"
                      }
                    >
                      {pincode.metadata.marketPotential}
                    </Badge>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Activated: {new Date(pincode.activationDate).toLocaleDateString()}</p>
                  <p>Est. Households: {pincode.metadata.estimatedHouseholds?.toLocaleString() || 'N/A'}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">🎯 City Manager Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-blue-900 mb-2">What You Can Do:</p>
            <ul className="space-y-1 text-blue-800">
              <li>✅ Add new pincode in {city?.name} (this screen)</li>
              <li>✅ Deactivate/reactivate pincode</li>
              <li>✅ Assign/reassign Cluster Managers</li>
              <li>✅ Assign/reassign Operations Managers</li>
              <li>✅ Manage city-level expansion</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-blue-900 mb-2">What You Cannot Do:</p>
            <ul className="space-y-1 text-blue-800">
              <li>❌ Add new city (Super Admin only)</li>
              <li>❌ Modify other cities</li>
              <li>❌ View other city data</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-blue-200">
            <p className="font-medium text-blue-900">📄 Documentation:</p>
            <ul className="space-y-1 text-blue-800 mt-1">
              <li>• NEW_PINCODE_ACTIVATION_WORKFLOW.md - Complete pincode setup process</li>
              <li>• HIERARCHY_MANAGEMENT_PERMISSIONS.md - Role-based permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
