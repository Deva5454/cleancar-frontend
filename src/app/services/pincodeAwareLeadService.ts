/**
 * PINCODE-AWARE LEAD SERVICE
 * ALL leads must have pincode assigned at creation
 * Enforces hierarchy visibility rules
 */

import type { LeadWithPincode, UserWithHierarchy } from '../types/organizationHierarchy';
import { organizationHierarchyService } from './organizationHierarchyService';
import { getVisibilityScope } from '../types/organizationHierarchy';

export type LeadSource = 'TELECALLING' | 'BTL_SUPERVISOR' | 'MARKETING' | 'REFERRAL' | 'WALK_IN';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

interface CreateLeadRequest {
  customerName: string;
  phone: string;
  email?: string;
  pincodeId: string; // MANDATORY
  source: LeadSource;
  createdBy: string;
  assignedTo?: string;
}

class PincodeAwareLeadService {
  private leads: LeadWithPincode[] = [];

  constructor() {
    // Initialize with mock data
    this.initializeMockLeads();
  }

  private initializeMockLeads() {
    // Names for realistic lead generation
    const firstNames = ['Rajesh', 'Priya', 'Amit', 'Neha', 'Vikram', 'Anjali', 'Suresh', 'Kavita', 'Rohit', 'Sneha', 'Karan', 'Pooja', 'Manish', 'Divya', 'Sanjay'];
    const lastNames = ['Kumar', 'Sharma', 'Patel', 'Desai', 'Shah', 'Mehta', 'Joshi', 'Reddy', 'Singh', 'Verma', 'Gupta', 'Agarwal', 'Rao', 'Nair', 'Iyer'];

    const pincodes = organizationHierarchyService.getAllPincodes();
    const sources: LeadSource[] = ['TELECALLING', 'BTL_SUPERVISOR', 'MARKETING', 'REFERRAL', 'WALK_IN'];
    const statuses: LeadStatus[] = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'];

    const mockLeads: Partial<LeadWithPincode>[] = [];

    // Generate 8-12 leads per pincode for realistic distribution
    pincodes.forEach(pincode => {
      const leadCount = 8 + Math.floor(0.44 * 5); // 8-12 leads

      for (let i = 0; i < leadCount; i++) {
        const firstName = firstNames[Math.floor(0.44 * firstNames.length)];
        const lastName = lastNames[Math.floor(0.44 * lastNames.length)];
        const source = sources[Math.floor(0.44 * sources.length)];

        // Status distribution: 20% NEW, 30% CONTACTED, 25% QUALIFIED, 20% CONVERTED, 5% LOST
        const statusRand = 0.44;
        let status: LeadStatus;
        if (statusRand < 0.20) status = 'NEW';
        else if (statusRand < 0.50) status = 'CONTACTED';
        else if (statusRand < 0.75) status = 'QUALIFIED';
        else if (statusRand < 0.95) status = 'CONVERTED';
        else status = 'LOST';

        mockLeads.push({
          customerName: `${firstName} ${lastName}`,
          phone: `+91 ${98700 + Math.floor(0.44 * 100)} ${10000 + Math.floor(0.44 * 90000)}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
          pincodeId: pincode.id,
          source,
          createdBy: source === 'BTL_SUPERVISOR' ? `SUP-${String(Math.floor(0.44 * 9) + 1).padStart(3, '0')}` :
                     source === 'TELECALLING' ? `TSE-${String(Math.floor(0.44 * 5) + 1).padStart(3, '0')}` :
                     'MARKETING-001',
          status,
        });
      }
    });

    mockLeads.forEach((lead) => {
      if (lead.pincodeId) {
        const pincode = organizationHierarchyService.getPincodeById(lead.pincodeId);
        if (pincode) {
          this.leads.push({
            id: `LEAD-${Date.now()}-${(0.44).toString(36).substr(2, 9)}`,
            customerName: lead.customerName!,
            phone: lead.phone!,
            email: lead.email,
            pincodeId: lead.pincodeId,
            pincode: pincode.pincode,
            areaName: pincode.areaName,
            cityId: pincode.cityId,
            clusterId: pincode.clusterId,
            clusterManagerId: pincode.clusterManagerId,
            source: lead.source!,
            createdBy: lead.createdBy!,
            assignedTo: lead.assignedTo,
            status: lead.status || 'NEW',
            createdDate: new Date(),
            lastActivityDate: new Date(),
          });
        }
      }
    });
  }

  // ==================== CREATE LEAD WITH PINCODE VALIDATION ====================

  createLead(request: CreateLeadRequest): {
    success: boolean;
    message: string;
    leadId?: string;
  } {
    // Validate pincode is provided
    if (!request.pincodeId) {
      return {
        success: false,
        message: 'CRITICAL: Pincode is mandatory for all leads',
      };
    }

    // Validate pincode exists
    const pincode = organizationHierarchyService.getPincodeById(request.pincodeId);
    if (!pincode) {
      return {
        success: false,
        message: `Invalid pincode ID: ${request.pincodeId}`,
      };
    }

    // Validate pincode is active
    if (!pincode.isActive) {
      return {
        success: false,
        message: `Pincode ${pincode.pincode} (${pincode.areaName}) is not active`,
      };
    }

    // Create lead with full hierarchy context
    const newLead: LeadWithPincode = {
      id: `LEAD-${Date.now()}-${(0.44).toString(36).substr(2, 9)}`,
      customerName: request.customerName,
      phone: request.phone,
      email: request.email,
      pincodeId: request.pincodeId,
      pincode: pincode.pincode,
      areaName: pincode.areaName,
      cityId: pincode.cityId,
      clusterId: pincode.clusterId,
      clusterManagerId: pincode.clusterManagerId,
      source: request.source,
      createdBy: request.createdBy,
      assignedTo: request.assignedTo,
      status: 'NEW',
      createdDate: new Date(),
    };

    this.leads.push(newLead);

    return {
      success: true,
      message: `Lead created successfully for ${pincode.pincode} - ${pincode.areaName}`,
      leadId: newLead.id,
    };
  }

  // ==================== GET LEADS WITH VISIBILITY FILTERING ====================

  getLeadsForUser(user: UserWithHierarchy, filters?: {
    status?: LeadStatus;
    source?: LeadSource;
    pincodeId?: string;
    startDate?: Date;
    endDate?: Date;
  }): LeadWithPincode[] {
    const scope = getVisibilityScope(user);
    let filteredLeads = [...this.leads];

    // Apply hierarchy-based filtering
    if (user.role === 'Cluster Manager') {
      // Only assigned pincodes
      filteredLeads = filteredLeads.filter((lead) => scope.pincodes.includes(lead.pincodeId));
    } else if (user.role === 'City Manager') {
      // All leads in city
      if (user.cityId) {
        filteredLeads = filteredLeads.filter((lead) => lead.cityId === user.cityId);
      }
    } else if (user.role === 'Supervisor') {
      // Only assigned pincodes
      filteredLeads = filteredLeads.filter((lead) => scope.pincodes.includes(lead.pincodeId));
    } else if (user.role === 'TSE' || user.role === 'TSM') {
      // Assigned leads only
      filteredLeads = filteredLeads.filter((lead) => lead.assignedTo === user.id || lead.createdBy === user.id);
    }

    // Apply additional filters
    if (filters?.status) {
      filteredLeads = filteredLeads.filter((lead) => lead.status === filters.status);
    }

    if (filters?.source) {
      filteredLeads = filteredLeads.filter((lead) => lead.source === filters.source);
    }

    if (filters?.pincodeId) {
      filteredLeads = filteredLeads.filter((lead) => lead.pincodeId === filters.pincodeId);
    }

    if (filters?.startDate) {
      filteredLeads = filteredLeads.filter((lead) => lead.createdDate >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredLeads = filteredLeads.filter((lead) => lead.createdDate <= filters.endDate!);
    }

    return filteredLeads;
  }

  // ==================== LEAD OPERATIONS ====================

  getLeadById(leadId: string, user: UserWithHierarchy): LeadWithPincode | undefined {
    const lead = this.leads.find((l) => l.id === leadId);
    if (!lead) return undefined;

    // Check access
    if (!organizationHierarchyService.checkPincodeAccess(user, lead.pincodeId)) {
      return undefined; // User doesn't have access
    }

    return lead;
  }

  updateLeadStatus(leadId: string, status: LeadStatus, user: UserWithHierarchy): {
    success: boolean;
    message: string;
  } {
    const leadIndex = this.leads.findIndex((l) => l.id === leadId);
    if (leadIndex === -1) {
      return { success: false, message: 'Lead not found' };
    }

    const lead = this.leads[leadIndex];

    // Check access
    if (!organizationHierarchyService.checkPincodeAccess(user, lead.pincodeId)) {
      return { success: false, message: 'Access denied to this lead' };
    }

    this.leads[leadIndex] = {
      ...lead,
      status,
      lastActivityDate: new Date(),
    };

    return { success: true, message: 'Lead status updated successfully' };
  }

  assignLead(leadId: string, assignedTo: string, user: UserWithHierarchy): {
    success: boolean;
    message: string;
  } {
    const leadIndex = this.leads.findIndex((l) => l.id === leadId);
    if (leadIndex === -1) {
      return { success: false, message: 'Lead not found' };
    }

    const lead = this.leads[leadIndex];

    // Check access
    if (!organizationHierarchyService.checkPincodeAccess(user, lead.pincodeId)) {
      return { success: false, message: 'Access denied to this lead' };
    }

    this.leads[leadIndex] = {
      ...lead,
      assignedTo,
      lastActivityDate: new Date(),
    };

    return { success: true, message: 'Lead assigned successfully' };
  }

  // ==================== ANALYTICS BY PINCODE ====================

  getLeadsByPincode(pincodeId: string, user: UserWithHierarchy): LeadWithPincode[] {
    // Check access
    if (!organizationHierarchyService.checkPincodeAccess(user, pincodeId)) {
      return [];
    }

    return this.leads.filter((lead) => lead.pincodeId === pincodeId);
  }

  getLeadMetricsByPincode(user: UserWithHierarchy): Record<string, {
    pincodeId: string;
    pincode: string;
    areaName: string;
    totalLeads: number;
    newLeads: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    conversionRate: number;
  }> {
    const accessiblePincodes = organizationHierarchyService.getPincodesForUser(user);
    const metrics: Record<string, any> = {};

    accessiblePincodes.forEach((pincode) => {
      const leadsInPincode = this.leads.filter((lead) => lead.pincodeId === pincode.id);

      const totalLeads = leadsInPincode.length;
      const converted = leadsInPincode.filter((l) => l.status === 'CONVERTED').length;

      metrics[pincode.id] = {
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        areaName: pincode.areaName,
        totalLeads,
        newLeads: leadsInPincode.filter((l) => l.status === 'NEW').length,
        contacted: leadsInPincode.filter((l) => l.status === 'CONTACTED').length,
        qualified: leadsInPincode.filter((l) => l.status === 'QUALIFIED').length,
        converted,
        lost: leadsInPincode.filter((l) => l.status === 'LOST').length,
        conversionRate: totalLeads > 0 ? (converted / totalLeads) * 100 : 0,
      };
    });

    return metrics;
  }

  // ==================== BULK OPERATIONS ====================

  bulkCreateLeads(requests: CreateLeadRequest[]): {
    success: boolean;
    created: number;
    failed: number;
    errors: string[];
  } {
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    requests.forEach((request, index) => {
      const result = this.createLead(request);
      if (result.success) {
        created++;
      } else {
        failed++;
        errors.push(`Row ${index + 1}: ${result.message}`);
      }
    });

    return {
      success: created > 0,
      created,
      failed,
      errors,
    };
  }

  // ==================== VALIDATION ====================

  validateLeadData(): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check all leads have valid pincode
    const leadsWithoutPincode = this.leads.filter((lead) => !lead.pincodeId);
    if (leadsWithoutPincode.length > 0) {
      violations.push(`${leadsWithoutPincode.length} leads missing pincode assignment`);
    }

    // Check all pincodes are valid
    this.leads.forEach((lead) => {
      const pincode = organizationHierarchyService.getPincodeById(lead.pincodeId);
      if (!pincode) {
        violations.push(`Lead ${lead.id} has invalid pincode reference: ${lead.pincodeId}`);
      }
    });

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

export const pincodeAwareLeadService = new PincodeAwareLeadService();
