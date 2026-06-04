/**
 * HIERARCHY DASHBOARD
 * Role-based view of City → Cluster → Pincode structure
 * Shows correct visibility and data filtering
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import {
  Building2,
  MapPin,
  Users,
  TrendingUp,
  DollarSign,
  Target,
  AlertCircle,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { useRole } from '../../contexts/RoleContext';
import { organizationHierarchyService } from '../../services/organizationHierarchyService';
import { pincodeAwareLeadService } from '../../services/pincodeAwareLeadService';
import { hierarchyFinancialService } from '../../services/hierarchyFinancialService';
import type { UserWithHierarchy, Pincode, Cluster } from '../../types/organizationHierarchy';

export function HierarchyDashboard() {
  const { currentRole, currentUser } = useRole();
  const [selectedPincode, setSelectedPincode] = useState<string | null>(null);
  const [validationResults, setValidationResults] = useState<{ valid: boolean; violations: string[] } | null>(null);

  // Mock user with hierarchy
  const mockUser: UserWithHierarchy = {
    id: currentRole === 'City Manager' ? 'CM-SURAT-001' : 'CLM-001',
    name: currentUser.name,
    email: currentUser.email || '',
    phone: currentUser.phone || '',
    role: currentRole as any,
    cityId: 'CITY-SURAT',
    clusterId: currentRole === 'Cluster Manager' ? 'CLUSTER-SOUTH' : undefined,
    assignedPincodes:
      currentRole === 'Cluster Manager'
        ? ['PIN-395009', 'PIN-395007', 'PIN-395006']
        : currentRole === 'Supervisor'
          ? ['PIN-395009']
          : undefined,
    isActive: true,
    joiningDate: new Date('2024-01-01'),
  };

  const pincodes = organizationHierarchyService.getPincodesForUser(mockUser);
  const clusters = currentRole === 'City Manager' ? organizationHierarchyService.getClustersByCity('CITY-SURAT') : [];

  const period = {
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
  };

  // Validate system on mount
  useEffect(() => {
    const pincodeValidation = organizationHierarchyService.validatePincodeRules();
    const leadValidation = pincodeAwareLeadService.validateLeadData();
    const financialValidation = hierarchyFinancialService.validateFinancialData();

    const allViolations = [
      ...pincodeValidation.violations,
      ...leadValidation.violations,
      ...financialValidation.violations,
    ];

    setValidationResults({
      valid: allViolations.length === 0,
      violations: allViolations,
    });
  }, []);

  // Get metrics based on role
  const getMetrics = () => {
    if (currentRole === 'City Manager') {
      return hierarchyFinancialService.getCityFinancialSummary('CITY-SURAT', period);
    } else if (currentRole === 'Cluster Manager') {
      return hierarchyFinancialService.getClusterFinancialSummary('CLM-001', period);
    }
    return null;
  };

  const metrics = getMetrics();
  const leadMetrics = pincodeAwareLeadService.getLeadMetricsByPincode(mockUser);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {currentRole === 'City Manager' ? 'City Management Dashboard' : 'Cluster Management Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            City → Cluster → Pincode Hierarchy | {pincodes.length} Pincode{pincodes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Badge className={validationResults?.valid ? 'bg-green-600' : 'bg-red-600'}>
          {validationResults?.valid ? (
            <>
              <CheckCircle className="w-4 h-4 mr-1" />
              System Valid
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 mr-1" />
              {validationResults?.violations.length} Issues
            </>
          )}
        </Badge>
      </div>

      {/* Validation Issues */}
      {validationResults && !validationResults.valid && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-base text-red-900">System Validation Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {validationResults.violations.map((violation, index) => (
                <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {violation}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Income</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">₹{(metrics.totalIncome / 1000).toFixed(1)}k</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">₹{(metrics.totalExpenses / 1000).toFixed(1)}k</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Profit</p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">₹{(metrics.netProfit / 1000).toFixed(1)}k</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Pincodes</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{pincodes.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* City Manager View - Cluster Breakdown */}
      {currentRole === 'City Manager' && metrics && 'clusterBreakdown' in metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cluster Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.clusterBreakdown.map((cluster) => (
                <div key={cluster.clusterId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <Building2 className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{cluster.clusterName}</p>
                      <p className="text-sm text-gray-500">
                        {cluster.clusterManagerId ? `Manager: ${cluster.clusterManagerId}` : 'No Manager Assigned'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Income</p>
                      <p className="font-semibold text-green-600">₹{(cluster.income / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Expenses</p>
                      <p className="font-semibold text-red-600">₹{(cluster.expenses / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Profit</p>
                      <p className="font-semibold text-blue-600">₹{(cluster.profit / 1000).toFixed(1)}k</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cluster Manager View - Pincode Breakdown */}
      {currentRole === 'Cluster Manager' && metrics && 'pincodeBreakdown' in metrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pincode Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.pincodeBreakdown.map((pincode) => (
                <div key={pincode.pincodeId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <MapPin className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {pincode.pincode} - {pincode.areaName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Leads: {leadMetrics[pincode.pincodeId]?.totalLeads || 0} | Conversion:{' '}
                        {leadMetrics[pincode.pincodeId]?.conversionRate.toFixed(1) || 0}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Income</p>
                      <p className="font-semibold text-green-600">₹{(pincode.income / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Expenses</p>
                      <p className="font-semibold text-red-600">₹{(pincode.expenses / 1000).toFixed(1)}k</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Profit</p>
                      <p className="font-semibold text-blue-600">₹{(pincode.profit / 1000).toFixed(1)}k</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedPincode(pincode.pincodeId)}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pincode Details Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Accessible Pincodes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pincodes.map((pincode) => {
              const pincodeLeadMetrics = leadMetrics[pincode.id];
              return (
                <Card key={pincode.id} className="border-2 hover:border-blue-300 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {pincode.pincode} - {pincode.areaName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {organizationHierarchyService.getTeamCountByPincode(pincode.id)} Team{organizationHierarchyService.getTeamCountByPincode(pincode.id) !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge className={pincode.clusterManagerId ? 'bg-green-600' : 'bg-amber-600'}>
                        {pincode.clusterManagerId ? 'Assigned' : 'City Control'}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Total Leads</span>
                        <span className="font-medium">{pincodeLeadMetrics?.totalLeads || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Converted</span>
                        <span className="font-medium text-green-600">{pincodeLeadMetrics?.converted || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Conversion Rate</span>
                        <span className="font-medium">{pincodeLeadMetrics?.conversionRate.toFixed(1) || 0}%</span>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Market Potential</span>
                          <Badge
                            variant="outline"
                            className={
                              pincode.metadata.marketPotential === 'HIGH'
                                ? 'border-green-500 text-green-700'
                                : 'border-amber-500 text-amber-700'
                            }
                          >
                            {pincode.metadata.marketPotential}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Rules */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base text-blue-900">System Hierarchy Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-blue-900 mb-2">✓ Enforced Rules</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Each pincode has exactly ONE Cluster Manager</li>
                <li>• All leads must have pincode at creation</li>
                <li>• All income mapped to pincode</li>
                <li>• Material tracked at team-pincode level</li>
                <li>• Marketing campaigns tagged to pincode</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-900 mb-2">✓ Visibility Rules</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Cluster Manager: Only assigned pincodes</li>
                <li>• City Manager: Full city visibility</li>
                <li>• No cross-visibility between Cluster Managers</li>
                <li>• Historical data preserved on reassignment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
