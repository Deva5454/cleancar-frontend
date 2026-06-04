/**
 * SUPER ADMIN - HIERARCHY MANAGEMENT
 * Interface for Super Admin to add/manage cities
 */

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Building2, Plus, MapPin, Users, CheckCircle, AlertCircle } from "lucide-react";
import { organizationHierarchyService } from "../../services/organizationHierarchyService";
import { logger } from "../../services/logger";

export function SuperAdminHierarchyManagement() {
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);

  // Form state for new city
  const [newCity, setNewCity] = useState({
    id: "",
    name: "",
    state: "",
    regionalOfficeAddress: "",
    cityManagerId: "",
  });

  const cities = organizationHierarchyService.getAllCities();
  const allClusters = organizationHierarchyService.getAllClusters();
  const allPincodes = organizationHierarchyService.getAllPincodes();

  const handleAddCity = () => {
    // In production: POST /api/admin/cities
    logger.log("Adding new city:", newCity);

    // This would update the database
    // For now, show instructions to update the code
    toast.info(`To add this city to the system:

1. Open: src/app/services/organizationHierarchyService.ts
2. Add to cities array:
{
  id: '${newCity.id}',
  name: '${newCity.name}',
  state: '${newCity.state}',
  regionalOfficeAddress: '${newCity.regionalOfficeAddress}',
  cityManagerId: ${newCity.cityManagerId ? `'${newCity.cityManagerId}'` : 'null'},
  isActive: true,
  activationDate: new Date(),
  metadata: {}
}

3. See NEW_CITY_EXPANSION_WORKFLOW.md for complete setup process.`);

    setIsAddCityOpen(false);
    setNewCity({
      id: "",
      name: "",
      state: "",
      regionalOfficeAddress: "",
      cityManagerId: "",
    });
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hierarchy Management</h1>
          <p className="text-sm text-gray-500 mt-1">Super Admin - Add & Manage Cities</p>
        </div>
        <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add New City
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New City</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Before Adding a City:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Board approval obtained</li>
                      <li>• Capital allocated (₹50L - ₹1Cr)</li>
                      <li>• Market research completed</li>
                      <li>• See: NEW_CITY_EXPANSION_WORKFLOW.md</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cityId">City ID</Label>
                  <Input
                    id="cityId"
                    placeholder="CITY-AHMEDABAD"
                    value={newCity.id}
                    onChange={(e) => setNewCity({ ...newCity, id: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">Format: CITY-{"{CITYNAME}"}</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cityName">City Name</Label>
                  <Input
                    id="cityName"
                    placeholder="Ahmedabad"
                    value={newCity.name}
                    onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="Gujarat"
                  value={newCity.state}
                  onChange={(e) => setNewCity({ ...newCity, state: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Regional Office Address</Label>
                <Input
                  id="address"
                  placeholder="123 Main Street, Satellite, Ahmedabad - 380015"
                  value={newCity.regionalOfficeAddress}
                  onChange={(e) => setNewCity({ ...newCity, regionalOfficeAddress: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cityManager">City Manager ID (Optional)</Label>
                <Input
                  id="cityManager"
                  placeholder="CM-AHMEDABAD-001"
                  value={newCity.cityManagerId}
                  onChange={(e) => setNewCity({ ...newCity, cityManagerId: e.target.value })}
                />
                <p className="text-xs text-gray-500">Leave empty if hiring City Manager later</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={handleAddCity}
                  disabled={!newCity.id || !newCity.name || !newCity.state}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Create City
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsAddCityOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Cities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cities.map((city) => {
          const cityClusters = allClusters.filter((c) => c.cityId === city.id);
          const cityPincodes = allPincodes.filter((p) => p.cityId === city.id);
          const activePincodes = cityPincodes.filter((p) => p.isActive);

          return (
            <Card key={city.id} className="border-2">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg">{city.name}</CardTitle>
                  </div>
                  <Badge className={city.isActive ? "bg-green-600" : "bg-gray-400"}>
                    {city.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="text-gray-500">State</p>
                  <p className="font-medium">{city.state}</p>
                </div>

                <div className="text-sm">
                  <p className="text-gray-500">City Manager</p>
                  <p className="font-medium">
                    {city.cityManagerId || <span className="text-amber-600">Not Assigned</span>}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{cityClusters.length}</p>
                    <p className="text-xs text-gray-500">Clusters</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{activePincodes.length}</p>
                    <p className="text-xs text-gray-500">Pincodes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {organizationHierarchyService.getAllTeams().filter((t) =>
                        activePincodes.some((p) => p.id === t.pincodeId)
                      ).length}
                    </p>
                    <p className="text-xs text-gray-500">Teams</p>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>Created: {new Date(city.activationDate).toLocaleDateString()}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-base text-amber-900">🔐 Super Admin Permissions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-amber-900 mb-2">What Super Admin Can Do:</p>
            <ul className="space-y-1 text-amber-800">
              <li>✅ Add new city (this screen)</li>
              <li>✅ Remove/deactivate city</li>
              <li>✅ Assign/reassign City Manager</li>
              <li>✅ Create/modify clusters</li>
              <li>✅ View all system data</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-amber-900 mb-2">What City Manager Can Do:</p>
            <ul className="space-y-1 text-amber-800">
              <li>✅ Add new pincode in their city</li>
              <li>✅ Assign Operations Managers</li>
              <li>✅ Manage city expansion</li>
              <li>❌ Cannot add new city</li>
            </ul>
          </div>

          <div className="pt-2 border-t border-amber-200">
            <p className="font-medium text-amber-900">📄 Documentation:</p>
            <ul className="space-y-1 text-amber-800 mt-1">
              <li>• NEW_CITY_EXPANSION_WORKFLOW.md - Complete city setup process</li>
              <li>• HIERARCHY_MANAGEMENT_PERMISSIONS.md - Role-based permissions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
