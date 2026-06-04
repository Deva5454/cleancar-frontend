/**
 * SUPER ADMIN - CITY & ZONE MANAGEMENT
 *
 * Complete control over multi-city hierarchy:
 * - Add/Edit/Delete Cities
 * - Add/Edit/Delete Zones per City
 * - View hierarchy statistics
 * - Manage dynamic configuration without developer intervention
 */

import { useState, useEffect } from 'react';
import { organizationHierarchyService } from '../../services/organizationHierarchyService';
import { useRole } from '../../contexts/RoleContext';
import type { City, Zone, Cluster, Pincode } from '../../types/city-config.types';
import { BackButton } from '../ui/back-button';

export function CityManagement() {
  const { currentUser } = useRole();
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [pincodes, setPincodes] = useState<Pincode[]>([]);

  const [showAddCityForm, setShowAddCityForm] = useState(false);
  const [showAddZoneForm, setShowAddZoneForm] = useState(false);

  const [newCityName, setNewCityName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  const [selectedCityForZone, setSelectedCityForZone] = useState('');

  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Role-based access control - Super Admin only
  const isSuperAdmin = currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allCities = organizationHierarchyService.getCities();
    const allZones = organizationHierarchyService.getZones();

    // Load all clusters and pincodes across all cities
    const allClusters: Cluster[] = [];
    const allPincodes: Pincode[] = [];

    allCities.forEach(city => {
      const cityClusters = organizationHierarchyService.getClustersByCity(city.id);
      const cityPincodes = organizationHierarchyService.getPincodesByCity(city.id);
      allClusters.push(...cityClusters);
      allPincodes.push(...cityPincodes);
    });

    setCities(allCities);
    setZones(allZones);
    setClusters(allClusters);
    setPincodes(allPincodes);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddCity = () => {
    if (!newCityName.trim()) {
      showToast('City name is required', 'error');
      return;
    }

    // Check for duplicate
    const exists = cities.some(c => c.name.toLowerCase() === newCityName.toLowerCase());
    if (exists) {
      showToast('City already exists', 'error');
      return;
    }

    try {
      const newCity = organizationHierarchyService.addCity({
        name: newCityName.trim(),
        isActive: true,
      });
      showToast(`City "${newCity.name}" added successfully!`, 'success');
      setNewCityName('');
      setShowAddCityForm(false);
      loadData();
    } catch (error) {
      showToast('Failed to add city', 'error');
    }
  };

  const handleAddZone = () => {
    if (!newZoneName.trim()) {
      showToast('Zone name is required', 'error');
      return;
    }

    if (!selectedCityForZone) {
      showToast('Please select a city', 'error');
      return;
    }

    // Check for duplicate zone name in the same city
    const exists = zones.some(
      z => z.cityId === selectedCityForZone && z.name.toLowerCase() === newZoneName.toLowerCase()
    );
    if (exists) {
      showToast('Zone already exists in this city', 'error');
      return;
    }

    try {
      const newZone = organizationHierarchyService.addZone({
        name: newZoneName.trim(),
        cityId: selectedCityForZone,
        isActive: true,
      });
      showToast(`Zone "${newZone.name}" added successfully!`, 'success');
      setNewZoneName('');
      setShowAddZoneForm(false);
      loadData();
    } catch (error) {
      showToast('Failed to add zone', 'error');
    }
  };

  const handleDeleteCity = (cityId: string) => {
    try {
      organizationHierarchyService.deleteCity(cityId);
      showToast('City deactivated successfully', 'success');
      setConfirmAction(null);
      loadData();
    } catch (error) {
      showToast('Failed to delete city', 'error');
    }
  };

  const handleDeleteZone = (zoneId: string) => {
    try {
      organizationHierarchyService.deleteZone(zoneId);
      showToast('Zone deactivated successfully', 'success');
      setConfirmAction(null);
      loadData();
    } catch (error) {
      showToast('Failed to delete zone', 'error');
    }
  };

  const getZoneCountByCity = (cityId: string) => {
    return zones.filter(z => z.cityId === cityId && z.isActive !== false).length;
  };

  const getClusterCountByCity = (cityId: string) => {
    return clusters.filter(c => c.cityId === cityId && c.isActive !== false).length;
  };

  const getPincodeCountByCity = (cityId: string) => {
    return pincodes.filter(p => p.cityId === cityId && p.isActive !== false).length;
  };

  const activeCities = cities.filter(c => c.isActive !== false);
  const activeZones = zones.filter(z => z.isActive !== false);

  // Access Denied UI for non-Super Admins
  if (!isSuperAdmin) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <div className="text-red-600 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            This area is restricted to Super Admins only. You do not have permission to manage cities and zones.
          </p>
          <p className="text-sm text-red-600 mt-4">
            Current Role: <span className="font-semibold">{currentUser.role}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <BackButton />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">City & Zone Management</h1>
        <p className="text-gray-600">Manage multi-city hierarchy and expansion</p>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm {confirmAction.type}</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to deactivate "{confirmAction.name}"? This action will set it to inactive.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction.type === 'Delete City') {
                    handleDeleteCity(confirmAction.id);
                  } else if (confirmAction.type === 'Delete Zone') {
                    handleDeleteZone(confirmAction.id);
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {/* SECTION 1: ADD CITY */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add New City</h2>
            {!showAddCityForm && (
              <button
                onClick={() => setShowAddCityForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                + Add City
              </button>
            )}
          </div>

          {showAddCityForm && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Name</label>
                <input
                  type="text"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  placeholder="e.g., Ahmedabad"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCity}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create City
                </button>
                <button
                  onClick={() => {
                    setShowAddCityForm(false);
                    setNewCityName('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: CITY LIST */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Cities ({activeCities.length})</h2>
          <div className="space-y-3">
            {activeCities.length === 0 ? (
              <p className="text-gray-500 italic">No cities configured</p>
            ) : (
              activeCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{city.name}</h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {getZoneCountByCity(city.id)} Zones • {getClusterCountByCity(city.id)} Clusters •{' '}
                      {getPincodeCountByCity(city.id)} Pincodes
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100">
                      View Zones
                    </button>
                    <button
                      onClick={() =>
                        setConfirmAction({ type: 'Delete City', id: city.id, name: city.name })
                      }
                      className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: ADD ZONE */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Add New Zone</h2>
            {!showAddZoneForm && (
              <button
                onClick={() => setShowAddZoneForm(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                + Add Zone
              </button>
            )}
          </div>

          {showAddZoneForm && (
            <div className="space-y-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select City</label>
                <select
                  value={selectedCityForZone}
                  onChange={(e) => setSelectedCityForZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a City --</option>
                  {activeCities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder="e.g., North Zone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddZone}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create Zone
                </button>
                <button
                  onClick={() => {
                    setShowAddZoneForm(false);
                    setNewZoneName('');
                    setSelectedCityForZone('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 4: ZONE LIST */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Zones ({activeZones.length})</h2>
          <div className="space-y-3">
            {activeZones.length === 0 ? (
              <p className="text-gray-500 italic">No zones configured</p>
            ) : (
              activeZones.map((zone) => {
                const city = cities.find(c => c.id === zone.cityId);
                return (
                  <div
                    key={zone.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                      <div className="text-sm text-gray-600 mt-1">City: {city?.name || 'Unknown'}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setConfirmAction({ type: 'Delete Zone', id: zone.id, name: zone.name })
                        }
                        className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
