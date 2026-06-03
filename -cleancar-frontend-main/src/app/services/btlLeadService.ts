/**
 * ============================================================================
 * BTL LEAD GENERATION SERVICE - CRM INTEGRATED
 * ============================================================================
 *
 * ⚠️ CRITICAL INTEGRATION: BTL leads flow directly into MASTER_LEADS
 *
 * ARCHITECTURE:
 * - BTL leads are stored in MASTER_LEADS (central CRM storage)
 * - BTL-specific metadata (GPS, incentives, etc.) stored separately
 * - NO isolated in-memory storage (mockLeads[] REMOVED)
 *
 * DATA FLOW:
 * 1. Supervisor captures BTL lead → submitLead()
 * 2. Lead added to MASTER_LEADS with source: "BTL"
 * 3. Lead visible in CRM Lead Management screen
 * 4. TSE can be assigned via CRM
 * 5. Lead can be converted to subscription
 * 6. Analytics track BTL source attribution
 *
 * EVENTS EMITTED:
 * - LEAD_CREATED (source: BTL) - for analytics and notifications
 *
 * VISIBILITY:
 * - CRM: All BTL leads visible in main lead management
 * - TSE: BTL leads appear in assignment queue
 * - Analytics: BTL source tracked in conversion reports
 * - Supervisors: Can track their captured leads via CRM
 *
 * LAST INTEGRATED: 2026-04-23
 * ============================================================================
 */

import { MASTER_LEADS, type Lead } from "../data/masterData";
import { organizationHierarchyService } from "./organizationHierarchyService";

export type LeadStatus = 
  | "PENDING" 
  | "IN_TELESALES" 
  | "CONVERTED" 
  | "DISQUALIFIED" 
  | "EXPIRED";

export type InterestLevel = "HOT" | "WARM" | "COLD";
export type VehicleType = "4W_SEDAN" | "4W_SUV" | "2W_BIKE" | "2W_SCOOTER";

export interface BTLLead {
  id: string;
  name: string;
  mobile: string;
  vehicleType: VehicleType;
  location: { lat: number; lng: number; address: string };
  interestLevel: InterestLevel;
  status: LeadStatus;
  capturedDate: Date;
  daysSinceCapture: number;
  supervisorId: string;              // Creator (supervisor who captured the lead)
  supervisorName: string;
  createdBy: string;                 // Same as supervisorId - for clarity
  gpsLocation: { lat: number; lng: number };
  source: "BTL";

  // Assignment tracking (for supervisor visibility)
  assignedToTSE?: string;            // TSE ID if assigned
  assignedToTSEName?: string;        // TSE name if assigned
  assignedDate?: Date;               // When assigned to TSE
  lastActivityDate?: Date;           // Last status change or update
  lastActivityBy?: string;           // Who made last update

  // Pipeline tracking
  telesalesContactDate?: Date;
  conversionDate?: Date;
  retentionCompletedDate?: Date;
  disqualificationReason?: string;

  // Quality flags
  isDuplicate: boolean;
  isExpired: boolean;
  isLowQuality: boolean;

  // Incentive tracking
  incentive70Paid: boolean;
  incentive30Paid: boolean;
  totalIncentive: number;

  // ── BTL Activity Mode attribution (Sales Manager Module v2.0 §14) ──────────
  // Populated only when lead is submitted inside an active BTL session
  smId?: string;            // Sales Manager whose tie-up location this was
  locationId?: string;      // SM's registered tie-up location ID
  btlActivityId?: string;   // Unique session activity ID (groups all leads in one session)
  sessionId?: string;       // BTL session ID
  gpsValidated?: boolean;   // Was Supervisor within 500m at session start?
  gpsDistanceAtStart?: number; // Metres from location pin at session activation
}

export interface LeadValidation {
  isValid: boolean;
  errors: {
    name?: string;
    mobile?: string;
    vehicleType?: string;
    location?: string;
    interestLevel?: string;
    gps?: string;
  };
  isDuplicate: boolean;
  duplicateLeadId?: string;
}

export interface LeadPipelineStage {
  stage: number;
  name: string;
  completedDate?: Date;
  isCompleted: boolean;
  incentivePercentage?: number;
}

export interface SupervisorLeadMetrics {
  totalLeads: number;
  pending: number;
  inTelesales: number;
  converted: number;
  disqualified: number;
  conversionRate: number;
  lowQualityRate: number;
  totalIncentiveEarned: number;
  incentivePending: number;
}

class BTLLeadService {
  private readonly MAX_CONVERSION_DAYS = 30;
  private readonly RETENTION_DAYS = 90;
  private readonly LOW_QUALITY_THRESHOLD = 0.3; // 30%
  private readonly INCENTIVE_70_PERCENT = 0.7;
  private readonly INCENTIVE_30_PERCENT = 0.3;
  private readonly BASE_INCENTIVE = 500; // ₹500 per lead

  // ⚠️ REMOVED: private mockLeads: BTLLead[] = [];
  // BTL leads now flow directly into MASTER_LEADS for CRM visibility

  // Internal tracking for BTL-specific metadata (incentives, GPS, etc.)
  private btlMetadata: Map<string, Omit<BTLLead, keyof Lead>> = new Map();

  constructor() {
    // Initialize with mock data
    this.initializeMockData();
    console.log("✅ BTL Lead Service initialized - leads flow to MASTER_LEADS");
  }

  // ========== GEOCODING ==========

  /**
   * Convert GPS coordinates to pincode
   * Uses reverse geocoding with Surat city boundaries
   */
  private getPincodeFromGPS(lat: number, lng: number): string {
    // Surat coordinates: ~21.17° N, 72.83° E
    // Simple geocoding based on lat/lng ranges

    // South Surat (Adajan, Vesu, Piplod)
    if (lat >= 21.15 && lat <= 21.20 && lng >= 72.80 && lng <= 72.85) {
      if (lng < 72.82) return "395009"; // Adajan
      if (lng < 72.84) return "395007"; // Vesu
      return "395006"; // Piplod
    }

    // North Surat (Nanpura, Athwalines, Rander)
    if (lat >= 21.18 && lat <= 21.22 && lng >= 72.81 && lng <= 72.86) {
      if (lng < 72.83) return "395001"; // Nanpura
      if (lng < 72.84) return "395002"; // Athwalines
      return "395003"; // Rander Road
    }

    // Central Surat (Udhna, Katargam)
    if (lat >= 21.16 && lat <= 21.19 && lng >= 72.78 && lng <= 72.82) {
      if (lat < 21.175) return "395004"; // Udhna
      return "395005"; // Katargam
    }

    // Default to Adajan if outside known boundaries
    console.warn(`⚠️ GPS ${lat}, ${lng} outside known Surat boundaries - defaulting to 395009 (Adajan)`);
    return "395009";
  }

  // ========== INITIALIZATION ==========

  private initializeMockData() {
    const today = new Date();
    const mockLeadsData: Array<Omit<BTLLead, 'daysSinceCapture'>> = [
      {
        id: "LEAD-0001",
        name: "Rahul Sharma",
        mobile: "9876543210",
        vehicleType: "4W_SEDAN",
        location: { lat: 21.1702, lng: 72.8311, address: "Adajan, Surat" },
        interestLevel: "HOT",
        status: "CONVERTED",
        capturedDate: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        assignedToTSE: "TSE-001",
        assignedToTSEName: "Priya Mehta",
        assignedDate: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        lastActivityBy: "TSE-001",
        conversionDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: true,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0002",
        name: "Priya Patel",
        mobile: "9123456789",
        vehicleType: "4W_SUV",
        location: { lat: 21.1702, lng: 72.8311, address: "Vesu, Surat" },
        interestLevel: "WARM",
        status: "IN_TELESALES",
        capturedDate: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        assignedToTSE: "TSE-002",
        assignedToTSEName: "Amit Kumar",
        assignedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        lastActivityBy: "TSE-002",
        telesalesContactDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0003",
        name: "Amit Desai",
        mobile: "9988776655",
        vehicleType: "2W_BIKE",
        location: { lat: 21.1702, lng: 72.8311, address: "Pal, Surat" },
        interestLevel: "COLD",
        status: "PENDING",
        capturedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        lastActivityDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0004",
        name: "Sneha Shah",
        mobile: "9876501234",
        vehicleType: "4W_SEDAN",
        location: { lat: 21.1702, lng: 72.8311, address: "Citylight, Surat" },
        interestLevel: "HOT",
        status: "CONVERTED",
        capturedDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        conversionDate: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: true,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0005",
        name: "Karan Mehta",
        mobile: "9123498765",
        vehicleType: "2W_SCOOTER",
        location: { lat: 21.1702, lng: 72.8311, address: "Athwalines, Surat" },
        interestLevel: "WARM",
        status: "PENDING",
        capturedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0006",
        name: "Neha Joshi",
        mobile: "9988112233",
        vehicleType: "4W_SUV",
        location: { lat: 21.1702, lng: 72.8311, address: "Ghod Dod Road, Surat" },
        interestLevel: "HOT",
        status: "CONVERTED",
        capturedDate: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        conversionDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
        retentionCompletedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: true,
        incentive30Paid: true,
        totalIncentive: 500,
      },
      {
        id: "LEAD-0007",
        name: "Rohan Kumar",
        mobile: "9876512345",
        vehicleType: "4W_SEDAN",
        location: { lat: 21.1702, lng: 72.8311, address: "Parle Point, Surat" },
        interestLevel: "COLD",
        status: "DISQUALIFIED",
        capturedDate: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        disqualificationReason: "Not interested",
        isDuplicate: false,
        isExpired: false,
        isLowQuality: true,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 0,
      },
      {
        id: "LEAD-0008",
        name: "Divya Rao",
        mobile: "9123454321",
        vehicleType: "2W_BIKE",
        location: { lat: 21.1702, lng: 72.8311, address: "Rander, Surat" },
        interestLevel: "WARM",
        status: "IN_TELESALES",
        capturedDate: new Date(today.getTime() - 6 * 60 * 60 * 1000),
        supervisorId: "SUP-001",
        supervisorName: "Supervisor 1",
        createdBy: "SUP-001",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        telesalesContactDate: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        lastActivityDate: new Date(today.getTime() - 2 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      // TEST LEADS FROM OTHER SUPERVISORS (should NOT be visible to SUP-001)
      {
        id: "LEAD-9001",
        name: "Test Lead - SUP-002",
        mobile: "9999000001",
        vehicleType: "4W_SEDAN",
        location: { lat: 21.1702, lng: 72.8311, address: "Test Location 1" },
        interestLevel: "HOT",
        status: "PENDING",
        capturedDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-002",
        supervisorName: "Supervisor 2",
        createdBy: "SUP-002",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        lastActivityDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000),
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
      {
        id: "LEAD-9002",
        name: "Test Lead - SUP-003",
        mobile: "9999000002",
        vehicleType: "4W_SUV",
        location: { lat: 21.1702, lng: 72.8311, address: "Test Location 2" },
        interestLevel: "WARM",
        status: "IN_TELESALES",
        capturedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        supervisorId: "SUP-003",
        supervisorName: "Supervisor 3",
        createdBy: "SUP-003",
        gpsLocation: { lat: 21.1702, lng: 72.8311 },
        source: "BTL",
        assignedToTSE: "TSE-005",
        assignedToTSEName: "Test TSE",
        assignedDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        lastActivityDate: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000),
        lastActivityBy: "TSE-005",
        isDuplicate: false,
        isExpired: false,
        isLowQuality: false,
        incentive70Paid: false,
        incentive30Paid: false,
        totalIncentive: 500,
      },
    ];

    // ✅ Add mock leads to MASTER_LEADS (central CRM storage)
    mockLeadsData.forEach(btlLead => {
      const daysSinceCapture = Math.floor(
        (today.getTime() - btlLead.capturedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Parse area from address
      const area = btlLead.location.address.split(',')[0].trim() || "Surat";

      // ✅ GET PINCODE from GPS
      const pincode = this.getPincodeFromGPS(btlLead.gpsLocation.lat, btlLead.gpsLocation.lng);

      // ✅ AUTOMATIC TSE ASSIGNMENT (if not already assigned)
      let assignedTSE = btlLead.assignedToTSEName || "TSE Queue";
      if (!btlLead.assignedToTSEName) {
        const tseAssignment = organizationHierarchyService.assignLeadByPincode(pincode);
        assignedTSE = tseAssignment.success ? tseAssignment.assignedToName : "TSE Queue";
      }

      // Map vehicle type
      const carTypeMap: Record<VehicleType, string> = {
        "4W_SEDAN": "Sedan",
        "4W_SUV": "SUV",
        "2W_BIKE": "2W",
        "2W_SCOOTER": "2W"
      };

      // Map status
      const statusMap: Record<LeadStatus, "New" | "In Progress" | "Converted" | "Lost"> = {
        "PENDING": "New",
        "IN_TELESALES": "In Progress",
        "CONVERTED": "Converted",
        "DISQUALIFIED": "Lost",
        "EXPIRED": "Lost"
      };

      const timestamp = btlLead.capturedDate.toISOString().replace('T', ' ').substring(0, 16);

      // Create CRM lead
      const crmLead: Lead = {
        id: btlLead.id,
        name: btlLead.name,
        mobile: btlLead.mobile,
        source: "BTL",
        pinCode: pincode,             // ✅ Real pincode from GPS
        area,
        carType: carTypeMap[btlLead.vehicleType],
        status: statusMap[btlLead.status],
        assignedTo: assignedTSE,      // ✅ Auto-assigned by territory
        assignedToRole: "TSE",
        createdAt: timestamp,
        updatedAt: timestamp,
        sla: btlLead.status === "CONVERTED" ? "Closed" : "On Track",
        notes: `BTL lead by ${btlLead.supervisorName}. Interest: ${btlLead.interestLevel}`
      };

      // Only add if not already in MASTER_LEADS
      if (!MASTER_LEADS.find(l => l.id === btlLead.id)) {
        MASTER_LEADS.push(crmLead);
      }

      // Store BTL-specific metadata
      this.btlMetadata.set(btlLead.id, {
        vehicleType: btlLead.vehicleType,
        location: btlLead.location,
        interestLevel: btlLead.interestLevel,
        capturedDate: btlLead.capturedDate,
        daysSinceCapture,
        supervisorId: btlLead.supervisorId,
        supervisorName: btlLead.supervisorName,
        createdBy: btlLead.createdBy,
        gpsLocation: btlLead.gpsLocation,
        assignedToTSE: btlLead.assignedToTSE,
        assignedToTSEName: btlLead.assignedToTSEName,
        assignedDate: btlLead.assignedDate,
        lastActivityDate: btlLead.lastActivityDate,
        lastActivityBy: btlLead.lastActivityBy,
        telesalesContactDate: btlLead.telesalesContactDate,
        conversionDate: btlLead.conversionDate,
        retentionCompletedDate: btlLead.retentionCompletedDate,
        disqualificationReason: btlLead.disqualificationReason,
        isDuplicate: btlLead.isDuplicate,
        isExpired: btlLead.isExpired,
        isLowQuality: btlLead.isLowQuality,
        incentive70Paid: btlLead.incentive70Paid,
        incentive30Paid: btlLead.incentive30Paid,
        totalIncentive: btlLead.totalIncentive,
      });
    });

    console.log(`✅ Initialized ${mockLeadsData.length} BTL leads in MASTER_LEADS`);
  }

  // ========== HELPER: Reconstruct BTLLead from MASTER_LEADS + metadata ==========

  private getBTLLeadById(leadId: string): BTLLead | undefined {
    const crmLead = MASTER_LEADS.find(lead => lead.id === leadId && lead.source === "BTL");
    if (!crmLead) return undefined;

    const metadata = this.btlMetadata.get(leadId);
    if (!metadata) {
      return this.createBTLLeadFromCRM(crmLead);
    }

    return {
      id: crmLead.id,
      name: crmLead.name,
      mobile: crmLead.mobile,
      source: "BTL" as const,
      ...metadata,
      status: this.mapCRMStatusToBTL(crmLead.status)
    } as BTLLead;
  }

  private getBTLLeadsFromMaster(): BTLLead[] {
    // Get all BTL-sourced leads from MASTER_LEADS
    const btlCrmLeads = MASTER_LEADS.filter(lead => lead.source === "BTL");

    return btlCrmLeads.map(crmLead => {
      const metadata = this.btlMetadata.get(crmLead.id);

      // If no metadata (legacy lead), create minimal BTLLead
      if (!metadata) {
        return this.createBTLLeadFromCRM(crmLead);
      }

      // Combine CRM lead + BTL metadata
      return {
        id: crmLead.id,
        name: crmLead.name,
        mobile: crmLead.mobile,
        source: "BTL" as const,
        ...metadata,
        // Map CRM status back to BTL status
        status: this.mapCRMStatusToBTL(crmLead.status)
      } as BTLLead;
    });
  }

  private mapCRMStatusToBTL(crmStatus: Lead["status"]): LeadStatus {
    const statusMap: Record<Lead["status"], LeadStatus> = {
      "New": "PENDING",
      "In Progress": "IN_TELESALES",
      "Converted": "CONVERTED",
      "Lost": "DISQUALIFIED"
    };
    return statusMap[crmStatus];
  }

  private createBTLLeadFromCRM(crmLead: Lead): BTLLead {
    // Fallback for legacy BTL leads without metadata
    return {
      id: crmLead.id,
      name: crmLead.name,
      mobile: crmLead.mobile,
      vehicleType: "4W_SEDAN", // Default
      location: { lat: 21.1702, lng: 72.8311, address: crmLead.area },
      interestLevel: "WARM",
      status: this.mapCRMStatusToBTL(crmLead.status),
      capturedDate: new Date(crmLead.createdAt),
      daysSinceCapture: Math.floor((Date.now() - new Date(crmLead.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      supervisorId: "UNKNOWN",
      supervisorName: "Unknown",
      createdBy: "UNKNOWN",
      gpsLocation: { lat: 21.1702, lng: 72.8311 },
      source: "BTL",
      isDuplicate: false,
      isExpired: false,
      isLowQuality: false,
      incentive70Paid: false,
      incentive30Paid: false,
      totalIncentive: this.BASE_INCENTIVE
    };
  }

  // ========== LEAD RETRIEVAL ==========

  getSupervisorLeads(supervisorId: string): BTLLead[] {
    // Get BTL leads from MASTER_LEADS and filter by supervisor
    const allBTLLeads = this.getBTLLeadsFromMaster();
    const filtered = allBTLLeads.filter(l => l.supervisorId === supervisorId);
    console.log(`📋 getSupervisorLeads("${supervisorId}"):`, filtered.length, "leads found from total", allBTLLeads.length);
    return filtered;
  }

  // ========== LEAD VALIDATION ==========

  validateLead(
    name: string,
    mobile: string,
    vehicleType: VehicleType | undefined,
    location: { lat: number; lng: number; address: string } | undefined,
    interestLevel: InterestLevel | undefined,
    gpsLocation: { lat: number; lng: number } | undefined
  ): LeadValidation {
    const errors: LeadValidation["errors"] = {};
    let isValid = true;

    // Name validation
    if (!name || name.trim().length < 2) {
      errors.name = "Name is required (minimum 2 characters)";
      isValid = false;
    }

    // Mobile validation
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      errors.mobile = "Valid 10-digit mobile number is required";
      isValid = false;
    }

    // Vehicle type validation
    if (!vehicleType) {
      errors.vehicleType = "Vehicle type is required";
      isValid = false;
    }

    // Location validation
    if (!location || !location.lat || !location.lng) {
      errors.location = "Location is required (map pin)";
      isValid = false;
    }

    // Interest level validation
    if (!interestLevel) {
      errors.interestLevel = "Interest level is required";
      isValid = false;
    }

    // GPS validation (MANDATORY)
    if (!gpsLocation || !gpsLocation.lat || !gpsLocation.lng) {
      errors.gps = "GPS location is mandatory for lead capture";
      isValid = false;
    }

    // Duplicate check (real-time)
    const duplicate = this.checkDuplicateMobile(mobile);

    return {
      isValid: isValid && !duplicate.isDuplicate,
      errors,
      isDuplicate: duplicate.isDuplicate,
      duplicateLeadId: duplicate.leadId,
    };
  }

  // ========== DUPLICATE CHECK ==========

  checkDuplicateMobile(mobile: string): { isDuplicate: boolean; leadId?: string } {
    // Check MASTER_LEADS for duplicates across all sources (BTL, Website, etc.)
    const existing = MASTER_LEADS.find(lead => lead.mobile === mobile);

    if (existing) {
      return { isDuplicate: true, leadId: existing.id };
    }

    return { isDuplicate: false };
  }

  // ========== LEAD SUBMISSION ==========

  submitLead(
    name: string,
    mobile: string,
    vehicleType: VehicleType,
    location: { lat: number; lng: number; address: string },
    interestLevel: InterestLevel,
    gpsLocation: { lat: number; lng: number },
    supervisorId: string,
    supervisorName: string,
    // BTL Activity Mode attribution — only present when a session is active
    btlContext?: {
      smId: string;
      locationId: string;
      btlActivityId: string;
      sessionId: string;
    }
  ): { success: boolean; leadId?: string; error?: string } {
    // Validate first
    const validation = this.validateLead(
      name,
      mobile,
      vehicleType,
      location,
      interestLevel,
      gpsLocation
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: Object.values(validation.errors)[0] || "Validation failed"
      };
    }

    // Generate lead ID
    const leadId = `BTL-${Date.now()}`;
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 16);

    // Parse area from address (e.g., "Adajan, Surat" -> "Adajan")
    const area = location.address.split(',')[0].trim() || "Surat";

    // ✅ EXTRACT PINCODE from GPS location (enhanced geocoding)
    const pincode = this.getPincodeFromGPS(gpsLocation.lat, gpsLocation.lng);

    // ✅ AUTOMATIC TSE ASSIGNMENT based on pincode territory
    const tseAssignment = organizationHierarchyService.assignLeadByPincode(pincode);
    const assignedTSE = tseAssignment.success ? tseAssignment.assignedToName : "TSE Queue";
    const assignedTSEId = tseAssignment.success ? tseAssignment.assignedTo : "UNASSIGNED";

    // Map vehicle type to car type
    const carTypeMap: Record<VehicleType, string> = {
      "4W_SEDAN": "Sedan",
      "4W_SUV": "SUV",
      "2W_BIKE": "2W",
      "2W_SCOOTER": "2W"
    };

    // Map BTL status to CRM status
    const statusMap: Record<LeadStatus, "New" | "In Progress" | "Converted" | "Lost"> = {
      "PENDING": "New",
      "IN_TELESALES": "In Progress",
      "CONVERTED": "Converted",
      "DISQUALIFIED": "Lost",
      "EXPIRED": "Lost"
    };

    // ✅ CREATE LEAD IN MASTER_LEADS (central CRM storage)
    const crmLead: Lead = {
      id: leadId,
      name,
      mobile,
      source: "BTL",                    // CRITICAL: Source tag for analytics
      pinCode: pincode,                 // ✅ Real pincode from GPS
      area,
      carType: carTypeMap[vehicleType],
      status: "New",                    // All BTL leads start as "New"
      assignedTo: assignedTSE,          // ✅ AUTOMATIC TSE assignment by territory
      assignedToRole: "TSE",
      createdAt: timestamp,
      updatedAt: timestamp,
      sla: "2h remaining",              // Standard SLA for new leads
      notes: `BTL lead captured by ${supervisorName}. Interest: ${interestLevel}. GPS: ${gpsLocation.lat.toFixed(4)}, ${gpsLocation.lng.toFixed(4)}. ${tseAssignment.message}${btlContext ? ` | SM: ${btlContext.smId} | Location: ${btlContext.locationId} | Activity: ${btlContext.btlActivityId}` : ""}`
    };

    // Persist to localStorage under the same key CustomerContext reads from
    const STORAGE_KEY = "LEADS";
    try {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const duplicate = existing.find((l: any) => l.phone === crmLead.mobile);
      if (!duplicate) {
        existing.push({
          ...crmLead,
          leadId: crmLead.id || `BTL-${Date.now()}`,
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" ") || name.split(" ")[0],
          phone: mobile,
          email: "",
          cityId: "surat",
          city: "Surat",
          stage: "new",
          source: "BTL",
          address: { line1: "", line2: "", area, city: "Surat", state: "Gujarat", pinCode: pincode },
          vehicleCategory: carTypeMap[vehicleType],
          planOfInterest: "CleanCar Basic",
          createdAt: now.toISOString(),
          assignedTo: assignedTSE,
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      }
    } catch (e) {
      console.error("BTL lead persist failed", e);
    }

    // Push to central CRM lead storage
    MASTER_LEADS.push(crmLead);

    // ✅ STORE BTL-SPECIFIC METADATA (incentives, GPS, vehicle details)
    this.btlMetadata.set(leadId, {
      vehicleType,
      location,
      interestLevel,
      capturedDate: now,
      daysSinceCapture: 0,
      supervisorId,
      supervisorName,
      createdBy: supervisorId,
      gpsLocation,
      lastActivityDate: now,
      isDuplicate: false,
      isExpired: false,
      isLowQuality: false,
      incentive70Paid: false,
      incentive30Paid: false,
      totalIncentive: this.BASE_INCENTIVE,
      // BTL Activity Mode attribution
      ...(btlContext ? {
        smId:          btlContext.smId,
        locationId:    btlContext.locationId,
        btlActivityId: btlContext.btlActivityId,
        sessionId:     btlContext.sessionId,
      } : {}),
    });

    // ✅ EMIT LEAD_CREATED EVENT for analytics and notifications
    console.log("✅ LEAD_CREATED event:", {
      source: "BTL",
      leadId,
      supervisorId,
      area,
      pincode,
      vehicleType,
      interestLevel
    });

    // ✅ EMIT LEAD_ASSIGNED EVENT for TSE notification and analytics
    if (tseAssignment.success) {
      console.log("✅ LEAD_ASSIGNED event:", {
        leadId,
        assignedTo: assignedTSEId,
        assignedToName: assignedTSE,
        pincode,
        territory: pincode,
        source: "BTL",
        message: tseAssignment.message
      });
    }

    console.log("✅ BTL lead added to CRM:", crmLead);

    return { success: true, leadId };
  }

  // ========== LEAD PIPELINE ==========

  getLeadPipeline(leadId: string): LeadPipelineStage[] {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return [];

    const stages: LeadPipelineStage[] = [
      {
        stage: 1,
        name: "Lead Captured",
        completedDate: lead.capturedDate,
        isCompleted: true,
      },
      {
        stage: 2,
        name: "Telesales Contact",
        completedDate: lead.telesalesContactDate,
        isCompleted: !!lead.telesalesContactDate,
      },
      {
        stage: 3,
        name: "Conversion (≤30 days)",
        completedDate: lead.conversionDate,
        isCompleted: !!lead.conversionDate,
        incentivePercentage: this.INCENTIVE_70_PERCENT * 100,
      },
      {
        stage: 4,
        name: "Converted",
        completedDate: lead.conversionDate,
        isCompleted: lead.status === "CONVERTED",
      },
      {
        stage: 5,
        name: "90-Day Retention",
        completedDate: lead.retentionCompletedDate,
        isCompleted: !!lead.retentionCompletedDate,
        incentivePercentage: this.INCENTIVE_30_PERCENT * 100,
      },
      {
        stage: 6,
        name: "Final Payout",
        completedDate: lead.retentionCompletedDate,
        isCompleted: lead.incentive70Paid && lead.incentive30Paid,
      },
    ];

    return stages;
  }

  // ========== LEAD STATUS UPDATES ==========

  markInTelesales(leadId: string): { success: boolean } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false };

    lead.status = "IN_TELESALES";
    lead.telesalesContactDate = new Date();
    console.log("Lead status updated:", leadId, "→ IN_TELESALES");
    return { success: true };
  }

  markConverted(leadId: string): { success: boolean; error?: string } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false, error: "Lead not found" };

    // Check if within 30 days
    const daysSinceCapture = Math.floor(
      (new Date().getTime() - lead.capturedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCapture > this.MAX_CONVERSION_DAYS) {
      lead.status = "EXPIRED";
      lead.isExpired = true;
      console.log("⚠️ Conversion after 30 days → No incentive");
      return { success: false, error: "Conversion after 30 days - No incentive" };
    }

    lead.status = "CONVERTED";
    lead.conversionDate = new Date();
    lead.incentive70Paid = true;
    console.log("Lead converted:", leadId);
    console.log(`70% incentive (₹${lead.totalIncentive * 0.7}) paid`);

    return { success: true };
  }

  markRetentionComplete(leadId: string): { success: boolean; error?: string } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false, error: "Lead not found" };

    if (lead.status !== "CONVERTED") {
      return { success: false, error: "Lead must be converted first" };
    }

    // Check if 90 days have passed
    const daysSinceConversion = Math.floor(
      (new Date().getTime() - lead.conversionDate!.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceConversion < this.RETENTION_DAYS) {
      return { success: false, error: "90-day retention period not complete" };
    }

    lead.retentionCompletedDate = new Date();
    lead.incentive30Paid = true;
    console.log("Retention complete:", leadId);
    console.log(`30% incentive (₹${lead.totalIncentive * 0.3}) paid`);

    return { success: true };
  }

  markDisqualified(leadId: string, reason: string): { success: boolean } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false };

    lead.status = "DISQUALIFIED";
    lead.disqualificationReason = reason;
    console.log("Lead disqualified:", leadId, reason);
    return { success: true };
  }

  // ========== QUALITY SCORING ==========

  checkLowQuality(supervisorId: string): { isLowQuality: boolean; rate: number } {
    const supervisorLeads = this.getBTLLeadsFromMaster().filter(l => l.supervisorId === supervisorId);
    if (supervisorLeads.length === 0) return { isLowQuality: false, rate: 0 };

    const disqualified = supervisorLeads.filter(l => l.status === "DISQUALIFIED").length;
    const rate = disqualified / supervisorLeads.length;

    return {
      isLowQuality: rate > this.LOW_QUALITY_THRESHOLD,
      rate,
    };
  }

  // ========== SUPERVISOR METRICS ==========

  getSupervisorMetrics(supervisorId: string): SupervisorLeadMetrics {
    const leads = this.getBTLLeadsFromMaster().filter(l => l.supervisorId === supervisorId);

    const pending = leads.filter(l => l.status === "PENDING").length;
    const inTelesales = leads.filter(l => l.status === "IN_TELESALES").length;
    const converted = leads.filter(l => l.status === "CONVERTED").length;
    const disqualified = leads.filter(l => l.status === "DISQUALIFIED").length;

    const conversionRate = leads.length > 0 ? converted / leads.length : 0;
    const lowQualityRate = leads.length > 0 ? disqualified / leads.length : 0;

    const totalIncentiveEarned = leads.reduce((sum, lead) => {
      let earned = 0;
      if (lead.incentive70Paid) earned += lead.totalIncentive * 0.7;
      if (lead.incentive30Paid) earned += lead.totalIncentive * 0.3;
      return sum + earned;
    }, 0);

    const incentivePending = leads.reduce((sum, lead) => {
      let pending = 0;
      if (lead.status === "CONVERTED" && !lead.incentive30Paid) {
        pending += lead.totalIncentive * 0.3;
      }
      return sum + pending;
    }, 0);

    return {
      totalLeads: leads.length,
      pending,
      inTelesales,
      converted,
      disqualified,
      conversionRate,
      lowQualityRate,
      totalIncentiveEarned,
      incentivePending,
    };
  }

  // ========== TSE ASSIGNMENT & NOTIFICATIONS ==========

  /**
   * Assign lead to TSE (Telesales Executive)
   * Supervisor maintains visibility even after assignment
   */
  assignToTSE(
    leadId: string,
    tseId: string,
    tseName: string
  ): { success: boolean; error?: string } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false, error: "Lead not found" };

    if (lead.status !== "PENDING") {
      return { success: false, error: "Only PENDING leads can be assigned to TSE" };
    }

    // Update lead assignment
    lead.assignedToTSE = tseId;
    lead.assignedToTSEName = tseName;
    lead.assignedDate = new Date();
    lead.lastActivityDate = new Date();
    lead.lastActivityBy = tseId;
    lead.status = "IN_TELESALES";

    console.log(`📞 Lead ${leadId} assigned to TSE ${tseName}`);

    // Import and trigger notification
    import('./leadNotificationService').then(({ leadNotificationService }) => {
      leadNotificationService.notifyLeadAssigned(
        lead.supervisorId,
        leadId,
        lead.name,
        tseName
      );
    });

    return { success: true };
  }

  /**
   * Update lead status with notifications
   * Supervisors are notified of status changes
   */
  updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    updatedBy: string,
    reason?: string
  ): { success: boolean; error?: string } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false, error: "Lead not found" };

    const oldStatus = lead.status;
    lead.status = newStatus;
    lead.lastActivityDate = new Date();
    lead.lastActivityBy = updatedBy;

    if (newStatus === "DISQUALIFIED" && reason) {
      lead.disqualificationReason = reason;
    }

    console.log(`🔄 Lead ${leadId} status: ${oldStatus} → ${newStatus}`);

    // Import and trigger notifications
    import('./leadNotificationService').then(({ leadNotificationService }) => {
      if (newStatus === "CONVERTED") {
        const incentive = lead.totalIncentive * this.INCENTIVE_70_PERCENT;
        leadNotificationService.notifyLeadConverted(
          lead.supervisorId,
          leadId,
          lead.name,
          incentive
        );
      } else if (newStatus === "DISQUALIFIED") {
        leadNotificationService.notifyLeadLost(
          lead.supervisorId,
          leadId,
          lead.name,
          reason || "Not specified"
        );
      } else {
        leadNotificationService.notifyStatusChange(
          lead.supervisorId,
          leadId,
          lead.name,
          oldStatus,
          newStatus
        );
      }
    });

    return { success: true };
  }

  /**
   * Mark lead as contacted by TSE
   * Supervisor gets notification when TSE makes first contact
   */
  markAsContacted(leadId: string, tseId: string, tseName: string): { success: boolean; error?: string } {
    const lead = this.getBTLLeadById(leadId);
    if (!lead) return { success: false, error: "Lead not found" };

    lead.telesalesContactDate = new Date();
    lead.lastActivityDate = new Date();
    lead.lastActivityBy = tseId;

    console.log(`📞 Lead ${leadId} contacted by TSE ${tseName}`);

    // Notify supervisor
    import('./leadNotificationService').then(({ leadNotificationService }) => {
      leadNotificationService.notifyLeadContacted(
        lead.supervisorId,
        leadId,
        lead.name,
        tseName
      );
    });

    return { success: true };
  }

  /**
   * Get leads for supervisor with full visibility
   * Even after assignment, supervisor can track their leads
   */
  getSupervisorLeadsWithTracking(supervisorId: string): BTLLead[] {
    // Supervisor sees ONLY leads they created (createdBy === supervisorId)
    const filtered = this.getBTLLeadsFromMaster().filter(l => l.createdBy === supervisorId || l.supervisorId === supervisorId);

    console.log(
      `📋 getSupervisorLeadsWithTracking("${supervisorId}"):`,
      filtered.length,
      "leads (including assigned to TSE)"
    );

    return filtered.sort((a, b) => {
      // Sort by last activity (most recent first)
      const aTime = a.lastActivityDate?.getTime() || a.capturedDate.getTime();
      const bTime = b.lastActivityDate?.getTime() || b.capturedDate.getTime();
      return bTime - aTime;
    });
  }
}

// Singleton instance
export const btlLeadService = new BTLLeadService();