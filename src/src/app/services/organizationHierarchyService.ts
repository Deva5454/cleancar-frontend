/**
 * ORGANIZATION HIERARCHY SERVICE
 * Manages City → Cluster → Pincode structure
 * Enforces visibility and access control rules
 *
 * REFACTORED: Now uses DataService for persistent, dynamic city configuration
 * - Eliminates hardcoded Surat-only data
 * - Multi-city ready
 * - Data persists in localStorage via DataService
 */

import type {
  City,
  Cluster,
  Pincode,
  Team,
  UserWithHierarchy,
  PincodeAssignmentHistory,
  PincodeReassignmentRequest,
  VisibilityScope,
  ClusterManagerMetrics,
  CityManagerMetrics,
} from '../types/organizationHierarchy';
import type { Zone } from '../types/city-config.types';
import { getVisibilityScope, canAccessPincode, canReassignPincode } from '../types/organizationHierarchy';
import { DataService } from './DataService';
import { leadAssignmentEngine } from './ai/leadAssignmentEngine';
import { teleSalesManagerService } from './teleSalesManagerService';

class OrganizationHierarchyService {
  // ==================== DYNAMIC CONFIGURATION (DataService-backed) ====================

  private cities: City[] = [];
  private zones: Zone[] = [];
  private clusters: Cluster[] = [];
  private pincodes: Pincode[] = [];

  constructor() {
    this.loadConfiguration();
  }

  /**
   * Load configuration from DataService
   * If no config exists, seed with default Surat data
   */
  private loadConfiguration() {
    const stored = DataService.get("CITY_CONFIG");

    if (stored && stored.length > 0 && stored[0]) {
      const config = stored[0];
      this.cities = config.cities || [];
      this.zones = config.zones || [];
      this.clusters = config.clusters || [];
      this.pincodes = config.pincodes || [];
      console.log(`[OrgHierarchy] Loaded config: ${this.cities.length} cities, ${this.zones.length} zones, ${this.clusters.length} clusters, ${this.pincodes.length} pincodes`);
    } else {
      console.log('[OrgHierarchy] No config found, initializing with default Surat seed');
      this.initializeDefaultSuratConfig();
      this.persistConfiguration();
    }
  }

  /**
   * Persist current configuration to DataService
   */
  private persistConfiguration() {
    const config = {
      cities: this.cities,
      zones: this.zones,
      clusters: this.clusters,
      pincodes: this.pincodes,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
    try {
      DataService.setAll("CITY_CONFIG", [config]);
    } catch (e) {
      console.warn("[OrgHierarchy] localStorage full — skipping city config persist");
    }
    console.log('[OrgHierarchy] Configuration persisted to DataService');
  }

  /**
   * Initialize default Surat configuration
   * Uses existing hardcoded Surat data as seed
   */
  private initializeDefaultSuratConfig() {
    this.cities = [
    {
      id: 'CITY-SURAT',
      name: 'Surat',
      state: 'Gujarat',
      regionalOfficeAddress: 'Plot 45, GIDC Industrial Estate, Surat - 395008',
      cityManagerId: 'CM-SURAT-001',
      isActive: true,
      activationDate: new Date('2024-01-01'),
      metadata: {
        population: 6500000,
        targetMarket: 'HIGH',
      },
    },
  ];

    this.zones = [
    {
      id: 'ZONE-SOUTH',
      name: 'South Zone',
      cityId: 'CITY-SURAT',
      isActive: true,
      createdAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: 'ZONE-NORTH',
      name: 'North Zone',
      cityId: 'CITY-SURAT',
      isActive: true,
      createdAt: new Date('2024-01-15').toISOString(),
    },
    {
      id: 'ZONE-CENTRAL',
      name: 'Central Zone',
      cityId: 'CITY-SURAT',
      isActive: true,
      createdAt: new Date('2024-02-01').toISOString(),
    },
  ];

    this.clusters = [
    {
      id: 'CLUSTER-SOUTH',
      name: 'South Surat',
      zoneId: 'ZONE-SOUTH',
      cityId: 'CITY-SURAT',
      clusterManagerId: 'CLM-001',
      pincodes: ['PIN-395009', 'PIN-395007', 'PIN-395006'],
      isActive: true,
      createdDate: new Date('2024-01-15'),
    },
    {
      id: 'CLUSTER-NORTH',
      name: 'North Surat',
      zoneId: 'ZONE-NORTH',
      cityId: 'CITY-SURAT',
      clusterManagerId: 'CLM-002',
      pincodes: ['PIN-395001', 'PIN-395002', 'PIN-395003'],
      isActive: true,
      createdDate: new Date('2024-01-15'),
    },
    {
      id: 'CLUSTER-CENTRAL',
      name: 'Central Surat',
      zoneId: 'ZONE-CENTRAL',
      cityId: 'CITY-SURAT',
      clusterManagerId: null, // Unassigned - City Manager controls
      pincodes: ['PIN-395004', 'PIN-395005'],
      isActive: true,
      createdDate: new Date('2024-02-01'),
    },
  ];

    this.pincodes = [
    // South Cluster
    {
      id: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      isActive: true,
      activationDate: new Date('2024-01-15'),
      metadata: { estimatedHouseholds: 25000, marketPotential: 'HIGH' },
    },
    {
      id: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      isActive: true,
      activationDate: new Date('2024-01-15'),
      metadata: { estimatedHouseholds: 18000, marketPotential: 'HIGH' },
    },
    {
      id: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      isActive: true,
      activationDate: new Date('2024-01-20'),
      metadata: { estimatedHouseholds: 15000, marketPotential: 'MEDIUM' },
    },
    // North Cluster
    {
      id: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      isActive: true,
      activationDate: new Date('2024-01-15'),
      metadata: { estimatedHouseholds: 12000, marketPotential: 'MEDIUM' },
    },
    {
      id: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      isActive: true,
      activationDate: new Date('2024-01-15'),
      metadata: { estimatedHouseholds: 10000, marketPotential: 'MEDIUM' },
    },
    {
      id: 'PIN-395003',
      pincode: '395003',
      areaName: 'Rander Road',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      isActive: true,
      activationDate: new Date('2024-01-15'),
      metadata: { estimatedHouseholds: 14000, marketPotential: 'HIGH' },
    },
    // Central Cluster (Unassigned CM)
    {
      id: 'PIN-395004',
      pincode: '395004',
      areaName: 'Udhna',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-CENTRAL',
      clusterManagerId: null, // City Manager controls
      isActive: true,
      activationDate: new Date('2024-02-01'),
      metadata: { estimatedHouseholds: 20000, marketPotential: 'MEDIUM' },
    },
    {
      id: 'PIN-395005',
      pincode: '395005',
      areaName: 'Katargam',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-CENTRAL',
      clusterManagerId: null,
      isActive: true,
      activationDate: new Date('2024-02-01'),
      metadata: { estimatedHouseholds: 16000, marketPotential: 'MEDIUM' },
    },
  ];
  }

  // ==================== TEAMS (OPERATIONAL UNITS) ====================

  private teams: Team[] = [
    // Adajan (PIN-395009) - 5 teams (OM: Amit Bhatt manages this pincode)
    // 2 Part-time teams (5 AM - 9 AM) + 3 Full-time teams (9 AM - 9 PM)
    {
      id: 'TEAM-001',
      name: 'Adajan Part-Time Team A',
      pincodeId: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      supervisorId: 'SUP-001',
      washerIds: ['W-001', 'W-002', 'W-003'], // 3 washers for part-time
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 15, // 4 hours shift
    },
    {
      id: 'TEAM-002',
      name: 'Adajan Part-Time Team B',
      pincodeId: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      supervisorId: 'SUP-002',
      washerIds: ['W-004', 'W-005', 'W-006'], // 3 washers for part-time
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 15, // 4 hours shift
    },
    {
      id: 'TEAM-010',
      name: 'Adajan Full-Time Team C',
      pincodeId: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      supervisorId: 'SUP-010',
      washerIds: ['W-007', 'W-031', 'W-032', 'W-033', 'W-034'], // 5 washers for full-time
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-01'),
      targetCustomersPerDay: 35, // 12 hours shift
    },
    {
      id: 'TEAM-011',
      name: 'Adajan Full-Time Team D',
      pincodeId: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      supervisorId: 'SUP-011',
      washerIds: ['W-035', 'W-036', 'W-037', 'W-038'], // 4 washers for full-time
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-10'),
      targetCustomersPerDay: 30, // 12 hours shift
    },
    {
      id: 'TEAM-012',
      name: 'Adajan Full-Time Team E',
      pincodeId: 'PIN-395009',
      pincode: '395009',
      areaName: 'Adajan',
      supervisorId: 'SUP-012',
      washerIds: ['W-039', 'W-040', 'W-041', 'W-042'], // 4 washers for full-time
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-15'),
      targetCustomersPerDay: 30, // 12 hours shift
    },
    // Vesu (PIN-395007) - 5 teams (Can be managed by another OM)
    {
      id: 'TEAM-003',
      name: 'Vesu Part-Time Team A',
      pincodeId: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      supervisorId: 'SUP-003',
      washerIds: ['W-008', 'W-009', 'W-010'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 15,
    },
    {
      id: 'TEAM-013',
      name: 'Vesu Part-Time Team B',
      pincodeId: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      supervisorId: 'SUP-013',
      washerIds: ['W-011', 'W-043', 'W-044'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-02-15'),
      targetCustomersPerDay: 15,
    },
    {
      id: 'TEAM-014',
      name: 'Vesu Full-Time Team C',
      pincodeId: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      supervisorId: 'SUP-014',
      washerIds: ['W-045', 'W-046', 'W-047', 'W-048', 'W-049'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-02-20'),
      targetCustomersPerDay: 35,
    },
    {
      id: 'TEAM-015',
      name: 'Vesu Full-Time Team D',
      pincodeId: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      supervisorId: 'SUP-015',
      washerIds: ['W-050', 'W-051', 'W-052', 'W-053'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-01'),
      targetCustomersPerDay: 30,
    },
    {
      id: 'TEAM-016',
      name: 'Vesu Full-Time Team E',
      pincodeId: 'PIN-395007',
      pincode: '395007',
      areaName: 'Vesu',
      supervisorId: 'SUP-016',
      washerIds: ['W-054', 'W-055', 'W-056', 'W-057'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-10'),
      targetCustomersPerDay: 30,
    },
    // Piplod (PIN-395006) - 5 teams (Can be managed by another OM)
    {
      id: 'TEAM-004',
      name: 'Piplod Morning Team A',
      pincodeId: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      supervisorId: 'SUP-004',
      washerIds: ['W-012', 'W-013', 'W-014'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-01-20'),
      targetCustomersPerDay: 18,
    },
    {
      id: 'TEAM-017',
      name: 'Piplod Afternoon Team B',
      pincodeId: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      supervisorId: 'SUP-017',
      washerIds: ['W-057', 'W-058', 'W-059'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-02-25'),
      targetCustomersPerDay: 16,
    },
    {
      id: 'TEAM-018',
      name: 'Piplod Full Day Team C',
      pincodeId: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      supervisorId: 'SUP-018',
      washerIds: ['W-060', 'W-061', 'W-062', 'W-063'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-05'),
      targetCustomersPerDay: 26,
    },
    {
      id: 'TEAM-019',
      name: 'Piplod Morning Team D',
      pincodeId: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      supervisorId: 'SUP-019',
      washerIds: ['W-064', 'W-065', 'W-066'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-15'),
      targetCustomersPerDay: 20,
    },
    {
      id: 'TEAM-020',
      name: 'Piplod Afternoon Team E',
      pincodeId: 'PIN-395006',
      pincode: '395006',
      areaName: 'Piplod',
      supervisorId: 'SUP-020',
      washerIds: ['W-067', 'W-068', 'W-069'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-SOUTH',
      clusterManagerId: 'CLM-001',
      createdDate: new Date('2024-03-20'),
      targetCustomersPerDay: 18,
    },
    // Nanpura (PIN-395001) - 5 teams (North Cluster - Can be managed by another OM)
    {
      id: 'TEAM-005',
      name: 'Nanpura Full Day Team A',
      pincodeId: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      supervisorId: 'SUP-005',
      washerIds: ['W-015', 'W-016', 'W-017'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 20,
    },
    {
      id: 'TEAM-021',
      name: 'Nanpura Morning Team B',
      pincodeId: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      supervisorId: 'SUP-021',
      washerIds: ['W-070', 'W-071', 'W-072', 'W-073'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-02-10'),
      targetCustomersPerDay: 24,
    },
    {
      id: 'TEAM-022',
      name: 'Nanpura Afternoon Team C',
      pincodeId: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      supervisorId: 'SUP-022',
      washerIds: ['W-074', 'W-075', 'W-076'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-02-20'),
      targetCustomersPerDay: 18,
    },
    {
      id: 'TEAM-023',
      name: 'Nanpura Full Day Team D',
      pincodeId: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      supervisorId: 'SUP-023',
      washerIds: ['W-077', 'W-078', 'W-079', 'W-080'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-03-01'),
      targetCustomersPerDay: 25,
    },
    {
      id: 'TEAM-024',
      name: 'Nanpura Morning Team E',
      pincodeId: 'PIN-395001',
      pincode: '395001',
      areaName: 'Nanpura',
      supervisorId: 'SUP-024',
      washerIds: ['W-081', 'W-082', 'W-083'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-03-10'),
      targetCustomersPerDay: 20,
    },
    // Athwalines (PIN-395002) - 5 teams (North Cluster - Can be managed by another OM)
    {
      id: 'TEAM-006',
      name: 'Athwalines Morning Team A',
      pincodeId: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      supervisorId: 'SUP-006',
      washerIds: ['W-018', 'W-019', 'W-020'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 15,
    },
    {
      id: 'TEAM-025',
      name: 'Athwalines Afternoon Team B',
      pincodeId: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      supervisorId: 'SUP-025',
      washerIds: ['W-084', 'W-085', 'W-086'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-02-15'),
      targetCustomersPerDay: 16,
    },
    {
      id: 'TEAM-026',
      name: 'Athwalines Full Day Team C',
      pincodeId: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      supervisorId: 'SUP-026',
      washerIds: ['W-087', 'W-088', 'W-089', 'W-090'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-03-01'),
      targetCustomersPerDay: 22,
    },
    {
      id: 'TEAM-027',
      name: 'Athwalines Morning Team D',
      pincodeId: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      supervisorId: 'SUP-027',
      washerIds: ['W-091', 'W-092', 'W-093'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-03-10'),
      targetCustomersPerDay: 18,
    },
    {
      id: 'TEAM-028',
      name: 'Athwalines Afternoon Team E',
      pincodeId: 'PIN-395002',
      pincode: '395002',
      areaName: 'Athwalines',
      supervisorId: 'SUP-028',
      washerIds: ['W-094', 'W-095', 'W-096'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-03-15'),
      targetCustomersPerDay: 17,
    },
    // Rander Road (PIN-395003) - 1 team
    {
      id: 'TEAM-007',
      name: 'Rander Road Full Day Team',
      pincodeId: 'PIN-395003',
      pincode: '395003',
      areaName: 'Rander Road',
      supervisorId: 'SUP-007',
      washerIds: ['W-021', 'W-022', 'W-023', 'W-024'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-NORTH',
      clusterManagerId: 'CLM-002',
      createdDate: new Date('2024-01-15'),
      targetCustomersPerDay: 22,
    },
    // Udhna (PIN-395004) - 1 team
    {
      id: 'TEAM-008',
      name: 'Udhna Morning Team',
      pincodeId: 'PIN-395004',
      pincode: '395004',
      areaName: 'Udhna',
      supervisorId: 'SUP-008',
      washerIds: ['W-025', 'W-026', 'W-027'],
      shift: 'PART_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-CENTRAL',
      clusterManagerId: null,
      createdDate: new Date('2024-02-01'),
      targetCustomersPerDay: 20,
    },
    // Katargam (PIN-395005) - 1 team
    {
      id: 'TEAM-009',
      name: 'Katargam Full Day Team',
      pincodeId: 'PIN-395005',
      pincode: '395005',
      areaName: 'Katargam',
      supervisorId: 'SUP-009',
      washerIds: ['W-028', 'W-029', 'W-030'],
      shift: 'FULL_TIME',
      status: 'ACTIVE',
      cityId: 'CITY-SURAT',
      clusterId: 'CLUSTER-CENTRAL',
      clusterManagerId: null,
      createdDate: new Date('2024-02-01'),
      targetCustomersPerDay: 18,
    },
  ];

  // ==================== MUTATION APIs (Dynamic Config Management) ====================

  /**
   * Add a new city
   */
  addCity(city: Omit<City, 'id'>): City {
    const newCity: City = {
      ...city,
      id: `CITY-${city.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
      isActive: city.isActive ?? true,
      activationDate: city.activationDate ?? new Date(),
    };
    this.cities.push(newCity);
    this.persistConfiguration();
    return newCity;
  }

  /**
   * Add a new zone
   */
  addZone(zone: Omit<Zone, 'id'>): Zone {
    const newZone: Zone = {
      ...zone,
      id: `ZONE-${zone.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
      isActive: zone.isActive ?? true,
      createdAt: zone.createdAt ?? new Date().toISOString(),
    };
    this.zones.push(newZone);
    this.persistConfiguration();
    return newZone;
  }

  /**
   * Add a new cluster
   */
  addCluster(cluster: Omit<Cluster, 'id'>): Cluster {
    const newCluster: Cluster = {
      ...cluster,
      id: `CLUSTER-${cluster.name.toUpperCase().replace(/\s+/g, '-')}-${Date.now()}`,
      isActive: cluster.isActive ?? true,
      createdDate: cluster.createdDate ?? new Date(),
    };
    this.clusters.push(newCluster);
    this.persistConfiguration();
    return newCluster;
  }

  /**
   * Add a new pincode
   */
  addPincode(pincode: Omit<Pincode, 'id'>): Pincode {
    const newPincode: Pincode = {
      ...pincode,
      id: `PIN-${pincode.pincode}`,
      isActive: pincode.isActive ?? true,
      activationDate: pincode.activationDate ?? new Date(),
    };
    this.pincodes.push(newPincode);

    // Add to cluster's pincodes array if not already there
    const cluster = this.clusters.find(c => c.id === pincode.clusterId);
    if (cluster && !cluster.pincodes.includes(newPincode.id)) {
      cluster.pincodes.push(newPincode.id);
    }

    this.persistConfiguration();
    return newPincode;
  }

  /**
   * Update a city
   */
  updateCity(cityId: string, updates: Partial<City>): void {
    const index = this.cities.findIndex(c => c.id === cityId);
    if (index !== -1) {
      this.cities[index] = { ...this.cities[index], ...updates };
      this.persistConfiguration();
    }
  }

  /**
   * Update a zone
   */
  updateZone(zoneId: string, updates: Partial<Zone>): void {
    const index = this.zones.findIndex(z => z.id === zoneId);
    if (index !== -1) {
      this.zones[index] = { ...this.zones[index], ...updates };
      this.persistConfiguration();
    }
  }

  /**
   * Update a cluster
   */
  updateCluster(clusterId: string, updates: Partial<Cluster>): void {
    const index = this.clusters.findIndex(c => c.id === clusterId);
    if (index !== -1) {
      this.clusters[index] = { ...this.clusters[index], ...updates };
      this.persistConfiguration();
    }
  }

  /**
   * Update a pincode
   */
  updatePincode(pincodeId: string, updates: Partial<Pincode>): void {
    const index = this.pincodes.findIndex(p => p.id === pincodeId);
    if (index !== -1) {
      this.pincodes[index] = { ...this.pincodes[index], ...updates };
      this.persistConfiguration();
    }
  }

  /**
   * Delete a city (soft delete - sets isActive to false)
   */
  deleteCity(cityId: string): void {
    const index = this.cities.findIndex(c => c.id === cityId);
    if (index !== -1) {
      this.cities[index].isActive = false;
      this.persistConfiguration();
    }
  }

  /**
   * Delete a zone (soft delete - sets isActive to false)
   */
  deleteZone(zoneId: string): void {
    const index = this.zones.findIndex(z => z.id === zoneId);
    if (index !== -1) {
      this.zones[index].isActive = false;
      this.persistConfiguration();
    }
  }

  /**
   * Delete a cluster (soft delete - sets isActive to false)
   */
  deleteCluster(clusterId: string): void {
    const index = this.clusters.findIndex(c => c.id === clusterId);
    if (index !== -1) {
      this.clusters[index].isActive = false;
      this.persistConfiguration();
    }
  }

  /**
   * Delete a pincode (soft delete - sets isActive to false)
   */
  deletePincode(pincodeId: string): void {
    const index = this.pincodes.findIndex(p => p.id === pincodeId);
    if (index !== -1) {
      this.pincodes[index].isActive = false;
      this.persistConfiguration();
    }
  }

  private assignmentHistory: PincodeAssignmentHistory[] = [];

  // ==================== CITY OPERATIONS ====================

  getCities(): City[] {
    return [...this.cities];
  }

  getCityById(cityId: string): City | undefined {
    return this.cities.find((c) => c.id === cityId);
  }

  getCitiesByManager(cityManagerId: string): City[] {
    return this.cities.filter((c) => c.cityManagerId === cityManagerId);
  }

  // ==================== ZONE OPERATIONS ====================

  getZones(): Zone[] {
    return [...this.zones];
  }

  getZoneById(zoneId: string): Zone | undefined {
    return this.zones.find((z) => z.id === zoneId);
  }

  getZonesByCity(cityId: string): Zone[] {
    return this.zones.filter((z) => z.cityId === cityId && z.isActive !== false);
  }

  // ==================== CLUSTER OPERATIONS ====================

  getClustersByCity(cityId: string): Cluster[] {
    return this.clusters.filter((c) => c.cityId === cityId);
  }

  getClusterById(clusterId: string): Cluster | undefined {
    return this.clusters.find((c) => c.id === clusterId);
  }

  getClustersByManager(clusterManagerId: string): Cluster[] {
    return this.clusters.filter((c) => c.clusterManagerId === clusterManagerId);
  }

  getUnassignedClusters(cityId: string): Cluster[] {
    return this.clusters.filter((c) => c.cityId === cityId && c.clusterManagerId === null);
  }

  // ==================== PINCODE OPERATIONS ====================

  getAllPincodes(): Pincode[] {
    return [...this.pincodes];
  }

  getPincodeById(pincodeId: string): Pincode | undefined {
    return this.pincodes.find((p) => p.id === pincodeId);
  }

  getPincodeByNumber(pincode: string): Pincode | undefined {
    return this.pincodes.find((p) => p.pincode === pincode);
  }

  getPincodesByCity(cityId: string): Pincode[] {
    return this.pincodes.filter((p) => p.cityId === cityId);
  }

  getPincodesByCluster(clusterId: string): Pincode[] {
    return this.pincodes.filter((p) => p.clusterId === clusterId);
  }

  getPincodesByClusterManager(clusterManagerId: string): Pincode[] {
    return this.pincodes.filter((p) => p.clusterManagerId === clusterManagerId);
  }

  getPincodesForUser(user: UserWithHierarchy): Pincode[] {
    const scope = getVisibilityScope(user);

    // Admin sees all
    if (user.role === 'Super Admin' || user.role === 'Admin') {
      return this.getAllPincodes();
    }

    // City Manager sees all pincodes in their city
    if (user.role === 'City Manager' && user.cityId) {
      return this.getPincodesByCity(user.cityId);
    }

    // Cluster Manager sees only assigned pincodes
    if (user.role === 'Cluster Manager' && scope.pincodes.length > 0) {
      return this.pincodes.filter((p) => scope.pincodes.includes(p.id));
    }

    // Supervisor sees only assigned pincodes
    if (user.role === 'Supervisor' && scope.pincodes.length > 0) {
      return this.pincodes.filter((p) => scope.pincodes.includes(p.id));
    }

    return [];
  }

  // ==================== TEAM OPERATIONS ====================

  getAllTeams(): Team[] {
    return [...this.teams];
  }

  getTeamById(teamId: string): Team | undefined {
    return this.teams.find((t) => t.id === teamId);
  }

  getTeamsByPincode(pincodeId: string): Team[] {
    return this.teams.filter((t) => t.pincodeId === pincodeId);
  }

  getTeamsByCluster(clusterId: string): Team[] {
    return this.teams.filter((t) => t.clusterId === clusterId);
  }

  getTeamsByClusterManager(clusterManagerId: string): Team[] {
    return this.teams.filter((t) => t.clusterManagerId === clusterManagerId);
  }

  getTeamsByCity(cityId: string): Team[] {
    return this.teams.filter((t) => t.cityId === cityId);
  }

  getTeamBySupervisor(supervisorId: string): Team | undefined {
    return this.teams.find((t) => t.supervisorId === supervisorId);
  }

  getActiveTeamsByPincode(pincodeId: string): Team[] {
    return this.teams.filter((t) => t.pincodeId === pincodeId && t.status === 'ACTIVE');
  }

  getTeamCountByPincode(pincodeId: string): number {
    return this.getTeamsByPincode(pincodeId).length;
  }

  getActiveTeamCountByPincode(pincodeId: string): number {
    return this.getActiveTeamsByPincode(pincodeId).length;
  }

  getTotalWashersByPincode(pincodeId: string): number {
    const teams = this.getTeamsByPincode(pincodeId);
    return teams.reduce((sum, team) => sum + team.washerIds.length, 0);
  }

  getTeamsForUser(user: UserWithHierarchy): Team[] {
    // Admin sees all
    if (user.role === 'Super Admin' || user.role === 'Admin') {
      return this.getAllTeams();
    }

    // City Manager sees all teams in their city
    if (user.role === 'City Manager' && user.cityId) {
      return this.getTeamsByCity(user.cityId);
    }

    // Cluster Manager sees teams in assigned pincodes
    if (user.role === 'Cluster Manager' && user.assignedPincodes) {
      return this.teams.filter((t) => user.assignedPincodes!.includes(t.pincodeId));
    }

    // Supervisor sees only their team
    if (user.role === 'Supervisor') {
      const team = this.getTeamBySupervisor(user.id);
      return team ? [team] : [];
    }

    return [];
  }

  // ==================== PINCODE REASSIGNMENT ====================

  reassignPincode(request: PincodeReassignmentRequest, requestedBy: UserWithHierarchy): {
    success: boolean;
    message: string;
  } {
    // Check permissions
    if (!canReassignPincode(requestedBy)) {
      return {
        success: false,
        message: 'You do not have permission to reassign pincodes',
      };
    }

    const pincode = this.getPincodeById(request.pincodeId);
    if (!pincode) {
      return { success: false, message: 'Pincode not found' };
    }

    // Create assignment history record
    const historyRecord: PincodeAssignmentHistory = {
      id: `HIST-${Date.now()}`,
      pincodeId: request.pincodeId,
      pincode: pincode.pincode,
      previousClusterManagerId: request.currentClusterManagerId,
      newClusterManagerId: request.newClusterManagerId,
      reassignedBy: request.reassignedBy,
      reassignmentDate: new Date(),
      reason: request.reason,
      preserveHistoricalMetrics: true, // Always preserve historical data
    };

    this.assignmentHistory.push(historyRecord);

    // Update pincode
    const pincodeIndex = this.pincodes.findIndex((p) => p.id === request.pincodeId);
    if (pincodeIndex !== -1) {
      this.pincodes[pincodeIndex] = {
        ...this.pincodes[pincodeIndex],
        clusterManagerId: request.newClusterManagerId,
      };
    }

    // Update cluster if needed
    if (request.newClusterManagerId) {
      const newCluster = this.clusters.find((c) => c.clusterManagerId === request.newClusterManagerId);
      if (newCluster && !newCluster.pincodes.includes(request.pincodeId)) {
        newCluster.pincodes.push(request.pincodeId);
        newCluster.lastReassignedDate = new Date();
      }
    }

    return {
      success: true,
      message: `Pincode ${pincode.pincode} (${pincode.areaName}) reassigned successfully`,
    };
  }

  getAssignmentHistory(pincodeId?: string): PincodeAssignmentHistory[] {
    if (pincodeId) {
      return this.assignmentHistory.filter((h) => h.pincodeId === pincodeId);
    }
    return [...this.assignmentHistory];
  }

  // ==================== VISIBILITY & ACCESS CONTROL ====================

  checkPincodeAccess(user: UserWithHierarchy, pincodeId: string): boolean {
    return canAccessPincode(user, pincodeId);
  }

  getAccessiblePincodeIds(user: UserWithHierarchy): string[] {
    const scope = getVisibilityScope(user);

    if (user.role === 'Super Admin' || user.role === 'Admin') {
      return this.pincodes.map((p) => p.id);
    }

    if (user.role === 'City Manager' && user.cityId) {
      return this.pincodes.filter((p) => p.cityId === user.cityId).map((p) => p.id);
    }

    return scope.pincodes;
  }

  // ==================== METRICS & REPORTING ====================

  getClusterManagerMetrics(clusterManagerId: string, period: { startDate: Date; endDate: Date }): ClusterManagerMetrics {
    const assignedPincodes = this.getPincodesByClusterManager(clusterManagerId);
    const cluster = this.clusters.find((c) => c.clusterManagerId === clusterManagerId);

    // In real implementation, aggregate from actual data
    const metrics: ClusterManagerMetrics = {
      clusterManagerId,
      clusterId: cluster?.id || '',
      assignedPincodes: assignedPincodes.map((p) => ({
        pincodeId: p.id,
        pincode: p.pincode,
        areaName: p.areaName,
        supervisors: this.getTeamCountByPincode(p.id), // ✅ FIXED: Count teams instead of accessing removed supervisors array
        activeWashers: 5, // Mock
        activeCustomers: 45, // Mock
        monthlyRevenue: 125000, // Mock
      })),
      totalRevenue: 375000,
      totalExpenses: 180000,
      totalLeads: 150,
      totalConversions: 45,
      totalActiveCustomers: 135,
      conversionRate: 30,
      revenuePerPincode: 125000,
      period,
    };

    return metrics;
  }

  getCityManagerMetrics(cityManagerId: string, cityId: string, period: { startDate: Date; endDate: Date }): CityManagerMetrics {
    const clusters = this.getClustersByCity(cityId);

    const metrics: CityManagerMetrics = {
      cityManagerId,
      cityId,
      clusters: clusters.map((c) => ({
        clusterId: c.id,
        clusterName: c.name,
        clusterManagerId: c.clusterManagerId,
        clusterManagerName: c.clusterManagerId ? `Manager ${c.clusterManagerId}` : null,
        pincodeCount: c.pincodes.length,
        revenue: 375000, // Mock
        expenses: 180000, // Mock
        activeCustomers: 135, // Mock
      })),
      totalRevenue: 1125000,
      totalExpenses: 640000,
      netProfit: 485000,
      totalActiveCustomers: 405,
      totalLeads: 450,
      totalConversions: 135,
      officeRent: 50000,
      utilities: 15000,
      period,
    };

    return metrics;
  }

  // ==================== VALIDATION ====================

  validatePincodeRules(): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check: Each pincode has exactly one cluster manager
    for (const pincode of this.pincodes) {
      const cluster = this.getClusterById(pincode.clusterId);
      if (!cluster) {
        violations.push(`Pincode ${pincode.pincode} has invalid cluster reference`);
      }

      // Pincode CM should match cluster CM
      if (pincode.clusterManagerId !== cluster?.clusterManagerId) {
        violations.push(
          `Pincode ${pincode.pincode} CM mismatch with cluster (Pincode: ${pincode.clusterManagerId}, Cluster: ${cluster?.clusterManagerId})`
        );
      }
    }

    // Check: No unassigned pincodes (if cluster has no CM, City Manager controls)
    const unassignedPincodes = this.pincodes.filter((p) => {
      const cluster = this.getClusterById(p.clusterId);
      return !cluster;
    });

    if (unassignedPincodes.length > 0) {
      violations.push(`${unassignedPincodes.length} pincodes have no valid cluster`);
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  // ==================== UTILITY FUNCTIONS ====================

  getPincodeDropdownOptions(): Array<{ value: string; label: string; pincode: string }> {
    return this.pincodes
      .filter((p) => p.isActive)
      .map((p) => ({
        value: p.id,
        label: `${p.pincode} - ${p.areaName}`,
        pincode: p.pincode,
      }));
  }

  getClusterDropdownOptions(cityId?: string): Array<{ value: string; label: string }> {
    let clusters = this.clusters;
    if (cityId) {
      clusters = clusters.filter((c) => c.cityId === cityId);
    }

    return clusters
      .filter((c) => c.isActive)
      .map((c) => ({
        value: c.id,
        label: c.name,
      }));
  }

  // ==================== TSE ASSIGNMENT BY PINCODE ====================

  /**
   * TSE-to-Pincode territory mapping
   * Each TSE is responsible for specific pincodes
   */
  private tseTerritory: Record<string, { tseId: string; tseName: string; pincodes: string[] }> = {
    'TSE-001': {
      tseId: 'TSE-001',
      tseName: 'Neha Singh',
      pincodes: ['395009', '395007'], // Adajan, Vesu
    },
    'TSE-002': {
      tseId: 'TSE-002',
      tseName: 'Amit Kumar',
      pincodes: ['395006', '395001'], // Piplod, Nanpura
    },
    'TSE-003': {
      tseId: 'TSE-003',
      tseName: 'Priya Sharma',
      pincodes: ['395002', '395003'], // Athwalines, Rander Road
    },
    'TSE-004': {
      tseId: 'TSE-004',
      tseName: 'Rajesh Patel',
      pincodes: ['395004', '395005'], // Udhna, Katargam
    },
  };

  /**
   * Default TSE for unmapped pincodes
   */
  private defaultTSE = {
    tseId: 'TSE-001',
    tseName: 'Neha Singh',
  };

  /**
   * Get TSE assigned to a pincode
   */
  getTSEForPincode(pincode: string): { tseId: string; tseName: string } | null {
    // Find TSE by pincode
    for (const tse of Object.values(this.tseTerritory)) {
      if (tse.pincodes.includes(pincode)) {
        return { tseId: tse.tseId, tseName: tse.tseName };
      }
    }

    // Return default TSE if pincode not mapped
    console.warn(`⚠️ Pincode ${pincode} not mapped to any TSE - assigning to default TSE ${this.defaultTSE.tseName}`);
    return this.defaultTSE;
  }

  /**
   * Get all pincodes assigned to a TSE
   */
  getPincodesForTSE(tseId: string): string[] {
    const tse = this.tseTerritory[tseId];
    return tse ? tse.pincodes : [];
  }

  /**
   * Get all TSEs with their territories
   */
  getAllTSETerritories(): Array<{ tseId: string; tseName: string; pincodes: string[] }> {
    return Object.values(this.tseTerritory);
  }

  /**
   * Assign lead to TSE based on pincode
   * This is the main method used by lead creation flows
   */
  assignLeadByPincode(pincode: string, lead?: {
    leadId?: string;
    source?: string;
    vehicleType?: "4W" | "2W";
    vehicleCategory?: string;
    cityId?: string;
    priority?: "URGENT" | "HIGH" | "NORMAL";
    estimatedValue?: number;
  }): {
    success: boolean;
    assignedTo: string;
    assignedToName: string;
    message: string;
    aiScore?: number;
    aiReasons?: string[];
    assignmentMethod?: string;
  } {
    try {
      // Build TSE snapshots from live performance data
      const tseCards = teleSalesManagerService.getTSEPerformanceCards();
      const tseSnapshots = tseCards.map((tse: any) => ({
        tseId: tse.id,
        tseName: tse.name,
        status: tse.status,
        conversionRate: tse.kpis.conversionRate.rate,
        crmComplianceScore: tse.kpis.crmCompliance.score,
        callsMadeToday: tse.kpis.callsMade.count,
        callsTarget: tse.kpis.callsMade.target,
        openLeadsCount: (() => {
            // TODO: replace with Supabase query: SELECT COUNT(*) FROM leads
            //       WHERE assigned_tse_id = tse.id AND stage NOT IN ('CONVERTED','LOST')
            try {
              const leads = JSON.parse(localStorage.getItem('cleancar_leads') || '[]');
              return (leads as any[]).filter((l: any) =>
                l.assignedTseId === tse.id &&
                !['CONVERTED','LOST','CANCELLED'].includes(l.stage)
              ).length;
            } catch { return 0; }
          })(),
        vehicleTypeWinRate: { "4W": tse.kpis.conversionRate.rate + 2, "2W": tse.kpis.conversionRate.rate - 4 },
        sourceWinRate: { "DIGITAL": tse.kpis.conversionRate.rate, "BTL_REFERRAL": tse.kpis.conversionRate.rate + 5 },
        avgHandleTimeMinutes: 12,
        lastAssignedAt: tse.lastActivity?.toISOString(),
        territories: ["ALL"], // all TSEs handle all cities
      }));

      const leadContext = {
        leadId: lead?.leadId || `LEAD-${Date.now()}`,
        source: lead?.source || "DIGITAL",
        vehicleType: lead?.vehicleType || "4W",
        vehicleCategory: lead?.vehicleCategory,
        cityId: lead?.cityId || "CITY-SURAT",
        pincode,
        priority: lead?.priority || "NORMAL",
        estimatedValue: lead?.estimatedValue,
      };

      const result = leadAssignmentEngine.assignLead(leadContext, tseSnapshots);

      if (result.success) {
        return {
          success: true,
          assignedTo: result.assignedTo,
          assignedToName: result.assignedToName,
          message: result.message,
          aiScore: result.score.totalScore,
          aiReasons: result.score.reasons,
          assignmentMethod: result.method,
        };
      }
    } catch (err) {
      console.warn("[assignLeadByPincode] AI scoring failed — falling back to territory match", err);
    }

    // Fallback: original territory-based assignment
    const tse = this.getTSEForPincode(pincode);
    if (!tse) {
      return { success: false, assignedTo: '', assignedToName: '', message: `No TSE available for pincode ${pincode}` };
    }
    return { success: true, assignedTo: tse.tseId, assignedToName: tse.tseName, message: `Lead assigned to ${tse.tseName} (territory fallback)`, assignmentMethod: "TERRITORY_FALLBACK" };
  }
}

export const organizationHierarchyService = new OrganizationHierarchyService();
