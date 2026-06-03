// Mock data for the 360° Master System - Surat City Operations
// MIGRATED TO CENTRALIZED DATA - Use /src/app/data/masterData.ts
// This file maintained for backward compatibility

import {
  MASTER_CUSTOMERS,
  MASTER_LEADS,
  MASTER_COMPLAINTS,
  MASTER_INVENTORY,
  MASTER_WASH_RECORDS,
  MASTER_ATTENDANCE,
  MASTER_APPROVALS,
  MASTER_AUDIT_LOGS,
  MASTER_KPI_DATA,
} from "../data/masterData";

export const roles = [
  { id: 1, name: "Super Admin", code: "SA" },
  { id: 2, name: "Admin", code: "ADM" },
  { id: 3, name: "City Manager", code: "CM" },
  { id: 4, name: "Sr Operations Manager", code: "SOM" },
  { id: 5, name: "Operations Manager", code: "OM" },
  { id: 6, name: "Supervisor", code: "SUP" },
  { id: 7, name: "Car Washer", code: "CW" },
  { id: 8, name: "TSM", code: "TSM" },
  { id: 9, name: "TSE", code: "TSE" },
  { id: 10, name: "CCE", code: "CCE" },
  { id: 11, name: "Store Manager", code: "SM" },
  { id: 12, name: "Procurement Manager", code: "PM" },
  { id: 13, name: "Accounts", code: "ACC" },
  { id: 14, name: "HR", code: "HR" },
];

export const users = [
  { id: 1, name: "Rajesh Patel", email: "", role: "Super Admin", city: "Surat", phone: "", status: "Active", joiningDate: "2025-01-01", workingHours: "10:00-19:00" },
  { id: 2, name: "Kavita Shah", email: "", role: "Admin", city: "Surat", phone: "", status: "Active", joiningDate: "2025-01-15", workingHours: "10:00-19:00" },
  { id: 3, name: "Prakash Mehta", email: "", role: "City Manager", city: "Surat", phone: "", status: "Active", joiningDate: "2025-02-01", workingHours: "10:00-19:00" },
  { id: 4, name: "Jayesh Desai", email: "", role: "Sr Operations Manager", city: "Surat", phone: "", status: "Active", joiningDate: "2025-02-15", workingHours: "10:00-19:00" },
  { id: 5, name: "Amit Bhatt", email: "", role: "Operations Manager", city: "Surat", cluster: "Adajan", phone: "", status: "Active", joiningDate: "2025-03-01", workingHours: "10:00-19:00" },
  { id: 6, name: "Ramesh Vora", email: "", role: "Supervisor", city: "Surat", cluster: "Adajan", phone: "", status: "Active", joiningDate: "2025-04-01", workingHours: "04:00-09:00" },
  { id: 7, name: "Suresh Yadav", email: "", role: "Supervisor", city: "Surat", cluster: "Vesu", phone: "", status: "Active", joiningDate: "2025-04-15", workingHours: "04:00-09:00" },
  { id: 8, name: "Rahul Verma", email: "", role: "Car Washer", city: "Surat", cluster: "Adajan", phone: "", status: "Active", joiningDate: "2025-05-01", workingHours: "04:00-09:00" },
  { id: 9, name: "Vikram Kumar", email: "", role: "TSM", city: "Surat", phone: "", status: "Active", joiningDate: "2025-03-10", workingHours: "10:00-19:00" },
  { id: 10, name: "Neha Singh", email: "", role: "TSE", city: "Surat", phone: "", status: "Active", joiningDate: "2025-06-01", workingHours: "10:00-19:00" },
];

// Use centralized master data
export const leads = MASTER_LEADS.map((lead) => ({
  id: lead.id,
  name: lead.name,
  mobile: lead.mobile,
  source: lead.source,
  pincode: lead.pinCode,
  area: lead.area,
  carType: lead.carType,
  status: lead.status,
  assignedTo: lead.assignedTo,
  createdAt: lead.createdAt,
  sla: lead.sla,
}));

export const customers = MASTER_CUSTOMERS.map((customer) => ({
  id: customer.id,
  name: customer.name,
  plan: `${customer.plan} ${customer.subscriptionType}`,
  carNo: customer.carNo,
  model: customer.carModel,
  status: customer.status,
  mrr: customer.mrr,
  address: `${customer.area}, Surat`,
  startDate: customer.startDate,
  nextWash: customer.nextWash,
}));

export const washRecords = MASTER_WASH_RECORDS.map((record) => ({
  id: record.id,
  customerName: record.customerName,
  carNo: record.carNo,
  washer: record.washerName,
  date: record.date,
  time: record.scheduledTime,
  status: record.status,
  beforePhoto: record.beforePhoto ? "✓" : "—",
  afterPhoto: record.afterPhoto ? "✓" : "—",
  duration: record.duration ? `${record.duration} min` : "—",
  location: record.location.split(",")[0],
}));

export const attendance = MASTER_ATTENDANCE.map((att) => ({
  id: att.id,
  washer: att.employeeName,
  date: att.date,
  checkIn: att.checkIn || "—",
  checkOut: att.checkOut || "—",
  status: att.status,
  location: att.location || "—",
  washesCompleted: att.jobsCompleted || 0,
  selfieVerified: att.selfieVerified,
}));

export const complaints = MASTER_COMPLAINTS.map((complaint) => ({
  id: complaint.id,
  customer: complaint.customerName,
  carNo: complaint.carNo,
  type: complaint.type,
  severity: complaint.severity,
  description: complaint.description,
  status: complaint.status,
  assignedTo: complaint.assignedTo,
  createdAt: complaint.createdAt,
  sla: complaint.sla,
}));

export const inventory = MASTER_INVENTORY.map((item, index) => ({
  id: index + 1,
  item: item.itemName,
  category: item.category,
  stock: item.currentStock,
  unit: item.unit === "ml" ? "ml" : item.unit === "pieces" ? "Pieces" : "Units",
  minStock: item.minStockLevel,
  value: item.totalValue,
  lastRestocked: item.lastRestocked,
  vendor: item.vendor,
}));

export const payroll = [
  { id: 1, employee: "Suresh Kumar", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1400, deductions: 400, netSalary: 16000, status: "Approved", month: "Mar 2026" },
  { id: 2, employee: "Ramesh K.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 1000, deductions: 0, netSalary: 16000, status: "Approved", month: "Mar 2026" },
  { id: 3, employee: "Mahesh S.", role: "Car Washer", baseSalary: 15000, adhocEarnings: 600, deductions: 0, netSalary: 15600, status: "Approved", month: "Mar 2026" },
  { id: 4, employee: "Ramesh Patel", role: "Supervisor", baseSalary: 25000, adhocEarnings: 2000, deductions: 500, netSalary: 26500, status: "Pending", month: "Mar 2026" },
];

export const approvals = MASTER_APPROVALS.map((approval) => ({
  id: parseInt(approval.id.split("-")[2]),
  type: approval.type,
  requester: approval.requesterName,
  amount: approval.amount,
  item: approval.item,
  status: approval.status,
  priority: approval.priority,
  createdAt: approval.createdAt,
  approver: approval.approverRole,
}));

export const auditLogs = MASTER_AUDIT_LOGS.map((log, index) => ({
  id: index + 1,
  action: log.action,
  module: log.module,
  user: log.userName,
  details: log.details,
  timestamp: log.timestamp,
  ip: log.ip,
}));

export const kpiData = MASTER_KPI_DATA;

// PIN Code Zones - Service Zones replacing Branches/Stores
export const serviceZones = [
  { id: 1, pinCode: "395001", areaName: "Surat City", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Ramesh Vora", assignedTSE: "Neha Singh", assignedWashers: ["Rahul Verma", "Sunil Kumar"], activeCustomers: 145, activeSubscriptions: 128, openJobsToday: 32, openComplaints: 2 },
  { id: 2, pinCode: "395003", areaName: "Katargam", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Ramesh Vora", assignedTSE: "Neha Singh", assignedWashers: ["Dinesh Pal"], activeCustomers: 98, activeSubscriptions: 87, openJobsToday: 21, openComplaints: 1 },
  { id: 3, pinCode: "395004", areaName: "Udhna", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Suresh Yadav", assignedTSE: "Vikram Kumar", assignedWashers: ["Mohan Singh"], activeCustomers: 76, activeSubscriptions: 65, openJobsToday: 18, openComplaints: 0 },
  { id: 4, pinCode: "395005", areaName: "Adajan", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Ramesh Vora", assignedTSE: "Neha Singh", assignedWashers: ["Rahul Verma", "Sunil Kumar", "Dinesh Pal"], activeCustomers: 234, activeSubscriptions: 198, openJobsToday: 45, openComplaints: 3 },
  { id: 5, pinCode: "395006", areaName: "Vesu", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Suresh Yadav", assignedTSE: "Neha Singh", assignedWashers: ["Sunil Kumar", "Mohan Singh"], activeCustomers: 187, activeSubscriptions: 165, openJobsToday: 38, openComplaints: 1 },
  { id: 6, pinCode: "395007", areaName: "Althan", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Suresh Yadav", assignedTSE: "Vikram Kumar", assignedWashers: ["Dinesh Pal"], activeCustomers: 112, activeSubscriptions: 98, openJobsToday: 24, openComplaints: 2 },
  { id: 7, pinCode: "395009", areaName: "Jahangirpura", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Ramesh Vora", assignedTSE: "Neha Singh", assignedWashers: ["Rahul Verma"], activeCustomers: 89, activeSubscriptions: 76, openJobsToday: 19, openComplaints: 0 },
  { id: 8, pinCode: "395010", areaName: "Bhestan", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Active", serviceable: true, assignedSupervisor: "Suresh Yadav", assignedTSE: "Vikram Kumar", assignedWashers: ["Mohan Singh"], activeCustomers: 67, activeSubscriptions: 54, openJobsToday: 14, openComplaints: 1 },
  { id: 9, pinCode: "395012", areaName: "Piplod", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Inactive", serviceable: false, assignedSupervisor: "", assignedTSE: "", assignedWashers: [], activeCustomers: 0, activeSubscriptions: 0, openJobsToday: 0, openComplaints: 0 },
  { id: 10, pinCode: "395017", areaName: "City Light", city: "Surat", state: "Gujarat", region: "South Gujarat", status: "Expansion Planned", serviceable: false, assignedSupervisor: "", assignedTSE: "Neha Singh", assignedWashers: [], activeCustomers: 0, activeSubscriptions: 0, openJobsToday: 0, openComplaints: 0 },
];

// Expansion Opportunities - Leads from unserviceable PIN codes
export const expansionOpportunities = [
  { id: 1, pinCode: "395013", areaName: "Palanpur", city: "Surat", totalLeads: 18, totalEnquiries: 12, potentialCustomers: 8, earliestLeadDate: "2026-01-15", latestLeadDate: "2026-03-12", status: "Unreviewed", notes: "" },
  { id: 2, pinCode: "395017", areaName: "City Light", city: "Surat", totalLeads: 24, totalEnquiries: 19, potentialCustomers: 14, earliestLeadDate: "2026-01-02", latestLeadDate: "2026-03-16", status: "Expansion Approved", notes: "TSE assigned, awaiting infrastructure setup" },
  { id: 3, pinCode: "395008", areaName: "Rander", city: "Surat", totalLeads: 9, totalEnquiries: 6, potentialCustomers: 4, earliestLeadDate: "2026-02-10", latestLeadDate: "2026-03-10", status: "Under Consideration", notes: "Analyzing competitor presence" },
  { id: 4, pinCode: "394210", areaName: "Sachin", city: "Surat", totalLeads: 31, totalEnquiries: 22, potentialCustomers: 18, earliestLeadDate: "2025-12-20", latestLeadDate: "2026-03-15", status: "Under Consideration", notes: "High industrial area, evaluating parking logistics" },
  { id: 5, pinCode: "394230", areaName: "Magdalla", city: "Surat", totalLeads: 5, totalEnquiries: 3, potentialCustomers: 2, earliestLeadDate: "2026-02-28", latestLeadDate: "2026-03-11", status: "Not Feasible", notes: "Too far from current service radius" },
];

// Demo Wash Records - TSE → Supervisor → Car Washer Flow
export const demoWashes = [
  {
    id: "DW001",
    leadId: "LD005",
    
    // Customer Details
    customerName: "Rahul Kapoor",
    customerFirstName: "Rahul",
    mobile: "+91 98123 45678",
    email: "rahul.kapoor@email.com",
    
    // Address
    addressLine1: "A-204, Sunrise Residency",
    area: "Adajan",
    city: "Surat",
    pinCode: "395009",
    
    // Vehicle Details
    vehicleCategory: "Mid-Size Sedan (>4m)",
    vehicleColor: "Silver",
    vehicleRegistrationNumber: "GJ05AB1234",
    
    // Demo Details
    demoType: "One-Time Service Demo",
    demoDate: "2026-03-18",
    demoTimeSlot: "Morning 7–9 AM",
    specificTimePreference: "8:00 AM sharp",
    
    // Plan Details
    planName: "Gold Monthly",
    planPrice: 2499,
    planOfInterest: "Gold Monthly",
    
    // Special Instructions
    specialInstructions: "Customer prefers thorough interior cleaning. Vehicle parked in basement B2.",
    
    // Step 1: TSE Scheduled
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 15, 2026 10:30 AM",
    
    // Supervisor Assignment
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 2,
    
    // Step 2: Supervisor Assigned Washer
    washerAssigned: true,
    washerName: "Rahul Verma",
    washerAssignedAt: "Mar 16, 2026 11:45 AM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    // Assignment Deadline (3 hours before 7 AM = 4 AM)
    assignmentDeadline: "2026-03-18T04:00:00",
    assignmentDeadlinePassed: false,
    
    // Washer Acknowledgment
    acknowledgmentStatus: "Accepted",
    acknowledgedAt: "Mar 16, 2026 12:15 PM",
    
    // Step 3: Demo Status
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    status: "Scheduled",
    assignmentStatus: "Acknowledged by Washer",
    
    // One-time demo tracking
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    // Notifications & Timeline
    notificationsSent: ["supervisor", "operations_manager"],
    timelineEntries: [
      {
        timestamp: "2026-03-15T10:30:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-16T11:45:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Rahul Verma assigned"
      },
      {
        timestamp: "2026-03-16T12:15:00",
        actor: "Rahul Verma",
        action: "Demo acknowledged and accepted"
      }
    ]
  },
  {
    id: "DW002",
    leadId: "LD006",
    
    customerName: "Priya Sharma",
    customerFirstName: "Priya",
    mobile: "+91 98234 56789",
    email: "priya.sharma@email.com",
    
    addressLine1: "Villa 12, Green Valley Society",
    area: "Vesu",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Mid/Large SUV",
    vehicleColor: "White",
    vehicleRegistrationNumber: "GJ05AB7890",
    
    demoType: "Subscription Package Demo",
    demoDate: "2026-03-17",
    demoTimeSlot: "Mid-Morning 9–11 AM",
    
    planName: "Platinum Quarterly",
    planPrice: 7999,
    planOfInterest: "Platinum Quarterly",
    
    specialInstructions: "Focus on ceramic coating demo. White SUV needs special attention.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 14, 2026 2:15 PM",
    
    assignedSupervisor: "Suresh Yadav",
    assignedSupervisorZone: "Zone B - Vesu",
    supervisorDemosOnDate: 1,
    
    washerAssigned: false,
    washerName: null,
    washerAssignedAt: null,
    washerAssignedBy: null,
    
    // Assignment Deadline (6 AM on demo day for Subscription)
    assignmentDeadline: "2026-03-17T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Pending",
    acknowledgedAt: null,
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    status: "Pending Washer Assignment",
    assignmentStatus: "Pending",
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager"],
    timelineEntries: [
      {
        timestamp: "2026-03-14T14:15:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Suresh Yadav"
      }
    ]
  },
  {
    id: "DW003",
    leadId: "LD007",
    
    customerName: "Amit Gupta",
    customerFirstName: "Amit",
    mobile: "+91 98345 67890",
    email: "amit.g@email.com",
    
    addressLine1: "Flat 501, City Heights",
    area: "City Light",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Hatchback",
    vehicleColor: "Red",
    vehicleRegistrationNumber: "GJ05XY1234",
    
    demoType: "One-Time Service Demo",
    demoDate: "2026-03-15",
    demoTimeSlot: "Mid-Morning 9–11 AM",
    
    planName: "Silver Monthly",
    planPrice: 1499,
    planOfInterest: "Silver Monthly",
    
    tseScheduled: true,
    tseScheduledBy: "Vikram Kumar (TSM)",
    tseScheduledAt: "Mar 13, 2026 11:00 AM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 1,
    
    washerAssigned: true,
    washerName: "Sunil Kumar",
    washerAssignedAt: "Mar 14, 2026 3:30 PM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    assignmentDeadline: "2026-03-15T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted",
    acknowledgedAt: "Mar 14, 2026 4:00 PM",
    
    demoCompleted: true,
    demoCompletedAt: "Mar 15, 2026 9:45 AM",
    demoOutcome: "Converted - Gold Plan",
    jobStartedAt: "Mar 15, 2026 9:00 AM",
    servicesPerformed: ["Exterior Wash", "Interior Cleaning", "Wax Finish"],
    customerPresentDuringWash: true,
    customerVerbalFeedback: "Very impressed with the wax finish. Ready to subscribe.",
    vehicleConditionBefore: "Moderate Dust",
    vehicleConditionAfter: "Excellent",
    status: "Completed & Converted",
    assignmentStatus: "Completed",
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "tse"],
    timelineEntries: [
      {
        timestamp: "2026-03-13T11:00:00",
        actor: "Vikram Kumar (TSM)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-14T15:30:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Sunil Kumar assigned"
      },
      {
        timestamp: "2026-03-14T16:00:00",
        actor: "Sunil Kumar",
        action: "Demo acknowledged and accepted"
      },
      {
        timestamp: "2026-03-15T09:00:00",
        actor: "Sunil Kumar",
        action: "Demo started"
      },
      {
        timestamp: "2026-03-15T09:45:00",
        actor: "Sunil Kumar",
        action: "Demo completed - Converted - Gold Plan"
      }
    ]
  },
  {
    id: "DW004",
    leadId: "LD008",
    
    customerName: "Sneha Patel",
    customerFirstName: "Sneha",
    mobile: "+91 98456 78901",
    email: "sneha.patel@email.com",
    
    addressLine1: "Row House 7, Palm Gardens",
    area: "Pal",
    city: "Surat",
    pinCode: "395009",
    
    vehicleCategory: "Compact Sedan (<4m)",
    vehicleColor: "Black",
    vehicleRegistrationNumber: "GJ05MN4567",
    
    demoType: "Subscription Package Demo",
    demoDate: "2026-03-18",
    demoTimeSlot: "Evening 4–7 PM",
    specificTimePreference: "5:00 PM preferred",
    
    planName: "Gold Monthly",
    planPrice: 2499,
    planOfInterest: "Gold Monthly",
    
    specialInstructions: "Black sedan requires special care. Customer wants to see ceramic coating process.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 15, 2026 4:20 PM",
    
    assignedSupervisor: "Suresh Yadav",
    assignedSupervisorZone: "Zone B - Vesu",
    supervisorDemosOnDate: 0,
    
    washerAssigned: false,
    washerName: null,
    washerAssignedAt: null,
    washerAssignedBy: null,
    
    assignmentDeadline: "2026-03-18T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Pending",
    acknowledgedAt: null,
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    status: "Pending Washer Assignment",
    assignmentStatus: "Pending",
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager"],
    timelineEntries: [
      {
        timestamp: "2026-03-15T16:20:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Suresh Yadav"
      }
    ]
  },
  {
    id: "DW005",
    leadId: "LD009",
    
    customerName: "Vikrant Singh",
    customerFirstName: "Vikrant",
    mobile: "+91 98567 89012",
    email: "vikrant.s@email.com",
    
    addressLine1: "Tower A, 1201, Sky Heights",
    area: "Adajan",
    city: "Surat",
    pinCode: "395009",
    
    vehicleCategory: "Mid/Large SUV",
    vehicleColor: "Blue",
    vehicleRegistrationNumber: "GJ05PQ8901",
    
    demoType: "One-Time Service Demo",
    demoDate: "2026-03-14",
    demoTimeSlot: "Morning 7–9 AM",
    
    planName: "Platinum Monthly",
    planPrice: 3999,
    planOfInterest: "Platinum Monthly",
    
    tseScheduled: true,
    tseScheduledBy: "Vikram Kumar (TSM)",
    tseScheduledAt: "Mar 12, 2026 9:45 AM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 0,
    
    washerAssigned: true,
    washerName: "Rahul Verma",
    washerAssignedAt: "Mar 13, 2026 10:15 AM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    assignmentDeadline: "2026-03-14T04:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted",
    acknowledgedAt: "Mar 13, 2026 10:45 AM",
    
    demoCompleted: true,
    demoCompletedAt: "Mar 14, 2026 7:55 AM",
    demoOutcome: "Not Interested",
    jobStartedAt: "Mar 14, 2026 7:00 AM",
    servicesPerformed: ["Exterior Wash", "Interior Cleaning", "Engine Cleaning"],
    customerPresentDuringWash: false,
    customerVerbalFeedback: "Service was good but found it expensive for monthly subscription.",
    vehicleConditionBefore: "Clean",
    vehicleConditionAfter: "Excellent",
    status: "Completed - No Conversion",
    assignmentStatus: "Completed",
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "tse"],
    timelineEntries: [
      {
        timestamp: "2026-03-12T09:45:00",
        actor: "Vikram Kumar (TSM)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-13T10:15:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Rahul Verma assigned"
      },
      {
        timestamp: "2026-03-13T10:45:00",
        actor: "Rahul Verma",
        action: "Demo acknowledged and accepted"
      },
      {
        timestamp: "2026-03-14T07:00:00",
        actor: "Rahul Verma",
        action: "Demo started"
      },
      {
        timestamp: "2026-03-14T07:55:00",
        actor: "Rahul Verma",
        action: "Demo completed - Not Interested"
      }
    ]
  },
  {
    id: "DW006",
    leadId: "LD010",
    
    // Customer Details
    customerName: "Kavita Reddy",
    customerFirstName: "Kavita",
    mobile: "+91 98678 90123",
    email: "kavita.reddy@email.com",
    
    // Address
    addressLine1: "303, Ocean View Apartments",
    area: "Vesu",
    city: "Surat",
    pinCode: "395007",
    
    // Vehicle Details
    vehicleCategory: "Hatchback",
    vehicleColor: "Yellow",
    vehicleRegistrationNumber: "GJ05RS5678",
    
    // Demo Details
    demoType: "Subscription Package Demo" as const,
    demoDate: "2026-03-19",
    demoTimeSlot: "Morning 7–9 AM",
    specificTimePreference: "7:30 AM",
    
    // Plan Details
    planName: "Silver Monthly",
    planPrice: 1499,
    planOfInterest: "Silver Monthly",
    
    // Special Instructions
    specialInstructions: "Small car, easy parking. Customer wants to see the foam wash technique.",
    
    // TSE Scheduling
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 16, 2026 3:15 PM",
    
    // Supervisor Assignment
    assignedSupervisor: "Suresh Yadav",
    assignedSupervisorZone: "Zone B - Vesu",
    supervisorDemosOnDate: 3,
    
    // Washer Assignment
    washerAssigned: true,
    washerName: "Dinesh Pal",
    washerAssignedAt: "Mar 17, 2026 9:20 AM",
    washerAssignedBy: "Suresh Yadav (Supervisor)",
    
    // Assignment Deadline
    assignmentDeadline: "2026-03-19T06:00:00",
    assignmentDeadlinePassed: false,
    
    // Washer Acknowledgment
    acknowledgmentStatus: "Pending" as const,
    acknowledgedAt: null,
    
    // Demo Execution
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    
    // Status Tracking
    status: "Assigned - Awaiting Acknowledgment",
    assignmentStatus: "Assigned" as const,
    
    // One-time demo tracking
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    // Notifications & Timeline
    notificationsSent: ["supervisor", "operations_manager", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-16T15:15:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Suresh Yadav"
      },
      {
        timestamp: "2026-03-17T09:20:00",
        actor: "Suresh Yadav (Supervisor)",
        action: "Washer Dinesh Pal assigned"
      }
    ]
  },
  {
    id: "DW007",
    leadId: "LD011",
    
    customerName: "Arjun Malhotra",
    customerFirstName: "Arjun",
    mobile: "+91 98789 01234",
    email: "arjun.m@email.com",
    
    addressLine1: "Bungalow 15, Royal Enclave",
    area: "City Light",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Coupes / Convertibles (Luxury)",
    vehicleColor: "Black",
    vehicleRegistrationNumber: "GJ05TU9012",
    
    demoType: "One-Time Service Demo" as const,
    demoDate: "2026-03-18",
    demoTimeSlot: "Mid-Morning 9–11 AM",
    specificTimePreference: "10:00 AM",
    
    planName: "Platinum Quarterly",
    planPrice: 7999,
    planOfInterest: "Platinum Quarterly",
    
    specialInstructions: "High-end luxury sedan. Customer wants premium detailing demo. Park carefully.",
    
    tseScheduled: true,
    tseScheduledBy: "Vikram Kumar (TSM)",
    tseScheduledAt: "Mar 15, 2026 11:30 AM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 1,
    
    washerAssigned: true,
    washerName: "Rahul Verma",
    washerAssignedAt: "Mar 16, 2026 8:00 AM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    assignmentDeadline: "2026-03-18T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Declined" as const,
    acknowledgedAt: "Mar 16, 2026 8:45 AM",
    declineReason: "Vehicle Condition Concerns",
    declineNotes: "This is a high-end luxury car, I'm not confident with premium detailing",
    declinedBy: ["Rahul Verma"],
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    
    status: "Pending Re-assignment",
    assignmentStatus: "Declined by Washer" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-15T11:30:00",
        actor: "Vikram Kumar (TSM)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-16T08:00:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Rahul Verma assigned"
      },
      {
        timestamp: "2026-03-16T08:45:00",
        actor: "Rahul Verma",
        action: "Demo declined - Vehicle Condition Concerns"
      }
    ]
  },
  {
    id: "DW008",
    leadId: "LD012",
    
    customerName: "Meera Nair",
    customerFirstName: "Meera",
    mobile: "+91 98890 12345",
    email: "meera.nair@email.com",
    
    addressLine1: "Flat 202, Sunrise Towers",
    area: "Adajan",
    city: "Surat",
    pinCode: "395009",
    
    vehicleCategory: "Compact Sedan (<4m)",
    vehicleColor: "White",
    vehicleRegistrationNumber: "GJ05VW2345",
    
    demoType: "Subscription Package Demo" as const,
    demoDate: "2026-03-18",
    demoTimeSlot: "Mid-Morning 9–11 AM",
    
    planName: "Gold Monthly",
    planPrice: 2499,
    planOfInterest: "Gold Monthly",
    
    specialInstructions: "Regular maintenance customer. Interested in monthly package.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 16, 2026 10:00 AM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 2,
    
    washerAssigned: true,
    washerName: "Sunil Kumar",
    washerAssignedAt: "Mar 17, 2026 7:30 AM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    assignmentDeadline: "2026-03-18T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted" as const,
    acknowledgedAt: "Mar 17, 2026 7:50 AM",
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: "2026-03-18T09:15:00",
    customerPresentDuringWash: true,
    
    status: "In Progress",
    assignmentStatus: "In Progress" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-16T10:00:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-17T07:30:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Sunil Kumar assigned"
      },
      {
        timestamp: "2026-03-17T07:50:00",
        actor: "Sunil Kumar",
        action: "Demo acknowledged and accepted"
      },
      {
        timestamp: "2026-03-18T09:15:00",
        actor: "Sunil Kumar",
        action: "Demo started"
      }
    ]
  },
  {
    id: "DW009",
    leadId: "LD013",
    
    customerName: "Rohan Khanna",
    customerFirstName: "Rohan",
    mobile: "+91 98901 23456",
    email: "rohan.khanna@email.com",
    
    addressLine1: "Villa 8, Green Park Estate",
    area: "Vesu",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Mid/Large SUV",
    vehicleColor: "Grey",
    vehicleRegistrationNumber: "GJ05XY6789",
    
    demoType: "One-Time Service Demo" as const,
    demoDate: "2026-03-17",
    demoTimeSlot: "Morning 7–9 AM",
    specificTimePreference: "8:00 AM sharp",
    
    planName: "Platinum Monthly",
    planPrice: 3999,
    planOfInterest: "Platinum Monthly",
    
    specialInstructions: "Grey SUV with mud stains. Show complete exterior cleaning process.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 14, 2026 5:00 PM",
    
    assignedSupervisor: "Suresh Yadav",
    assignedSupervisorZone: "Zone B - Vesu",
    supervisorDemosOnDate: 0,
    
    washerAssigned: true,
    washerName: "Dinesh Pal",
    washerAssignedAt: "Mar 15, 2026 8:15 AM",
    washerAssignedBy: "Suresh Yadav (Supervisor)",
    
    assignmentDeadline: "2026-03-17T04:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted" as const,
    acknowledgedAt: "Mar 15, 2026 8:40 AM",
    
    demoCompleted: true,
    demoCompletedAt: "Mar 17, 2026 8:50 AM",
    demoOutcome: "Converted - Platinum Plan",
    jobStartedAt: "Mar 17, 2026 8:00 AM",
    servicesPerformed: ["Exterior Wash", "Interior Cleaning", "Engine Cleaning", "Tyre Polish"],
    customerPresentDuringWash: true,
    customerVerbalFeedback: "Excellent work! The SUV looks brand new. Happy to subscribe to Platinum plan.",
    vehicleConditionBefore: "Muddy & Dusty",
    vehicleConditionAfter: "Excellent",
    productsUsed: ["Foam Shampoo", "Interior Cleaner", "Tyre Shine", "Wax Polish"],
    
    status: "Completed & Converted",
    assignmentStatus: "Completed" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "tse", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-14T17:00:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Suresh Yadav"
      },
      {
        timestamp: "2026-03-15T08:15:00",
        actor: "Suresh Yadav (Supervisor)",
        action: "Washer Dinesh Pal assigned"
      },
      {
        timestamp: "2026-03-15T08:40:00",
        actor: "Dinesh Pal",
        action: "Demo acknowledged and accepted"
      },
      {
        timestamp: "2026-03-17T08:00:00",
        actor: "Dinesh Pal",
        action: "Demo started"
      },
      {
        timestamp: "2026-03-17T08:50:00",
        actor: "Dinesh Pal",
        action: "Demo completed - Converted - Platinum Plan"
      }
    ]
  },
  {
    id: "DW010",
    leadId: "LD014",
    
    customerName: "Sanjay Iyer",
    customerFirstName: "Sanjay",
    mobile: "+91 99012 34567",
    email: "sanjay.iyer@email.com",
    
    addressLine1: "Tower B, 805, Metro Heights",
    area: "Pal",
    city: "Surat",
    pinCode: "395009",
    
    vehicleCategory: "Hatchback",
    vehicleColor: "Blue",
    vehicleRegistrationNumber: "GJ05ZA1234",
    
    demoType: "Subscription Package Demo" as const,
    demoDate: "2026-03-19",
    demoTimeSlot: "Afternoon 12–2 PM",
    
    planName: "Silver Monthly",
    planPrice: 1499,
    planOfInterest: "Silver Monthly",
    
    tseScheduled: true,
    tseScheduledBy: "Vikram Kumar (TSM)",
    tseScheduledAt: "Mar 16, 2026 2:45 PM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 0,
    
    washerAssigned: false,
    washerName: null,
    washerAssignedAt: null,
    washerAssignedBy: null,
    
    assignmentDeadline: "2026-03-19T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Pending" as const,
    acknowledgedAt: null,
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    
    status: "Pending Washer Assignment",
    assignmentStatus: "Pending" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager"],
    timelineEntries: [
      {
        timestamp: "2026-03-16T14:45:00",
        actor: "Vikram Kumar (TSM)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      }
    ]
  },
  {
    id: "DW011",
    leadId: "LD015",
    
    customerName: "Deepika Chopra",
    customerFirstName: "Deepika",
    mobile: "+91 99123 45678",
    email: "deepika.chopra@email.com",
    
    addressLine1: "Row House 3, Silver Oaks",
    area: "Vesu",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Mid-Size Sedan (>4m)",
    vehicleColor: "Silver",
    vehicleRegistrationNumber: "GJ05BC5678",
    
    demoType: "One-Time Service Demo" as const,
    demoDate: "2026-03-20",
    demoTimeSlot: "Morning 7–9 AM",
    
    planName: "Gold Monthly",
    planPrice: 2499,
    planOfInterest: "Gold Monthly",
    
    specialInstructions: "First-time customer. Show complete service package including interior.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 17, 2026 11:15 AM",
    
    assignedSupervisor: "Suresh Yadav",
    assignedSupervisorZone: "Zone B - Vesu",
    supervisorDemosOnDate: 1,
    
    washerAssigned: true,
    washerName: "Dinesh Pal",
    washerAssignedAt: "Mar 17, 2026 2:30 PM",
    washerAssignedBy: "Suresh Yadav (Supervisor)",
    
    assignmentDeadline: "2026-03-20T04:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted" as const,
    acknowledgedAt: "Mar 17, 2026 2:55 PM",
    
    demoCompleted: false,
    demoCompletedAt: null,
    demoOutcome: null,
    jobStartedAt: null,
    customerPresentDuringWash: false,
    
    status: "Scheduled",
    assignmentStatus: "Acknowledged by Washer" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-17T11:15:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Suresh Yadav"
      },
      {
        timestamp: "2026-03-17T14:30:00",
        actor: "Suresh Yadav (Supervisor)",
        action: "Washer Dinesh Pal assigned"
      },
      {
        timestamp: "2026-03-17T14:55:00",
        actor: "Dinesh Pal",
        action: "Demo acknowledged and accepted"
      }
    ]
  },
  {
    id: "DW012",
    leadId: "LD016",
    
    customerName: "Akash Verma",
    customerFirstName: "Akash",
    mobile: "+91 99234 56789",
    email: "akash.verma@email.com",
    
    addressLine1: "Flat 1505, Crystal Towers",
    area: "City Light",
    city: "Surat",
    pinCode: "395007",
    
    vehicleCategory: "Hatchback",
    vehicleColor: "Red",
    vehicleRegistrationNumber: "GJ05DE9012",
    
    demoType: "Subscription Package Demo" as const,
    demoDate: "2026-03-18",
    demoTimeSlot: "Evening 4–7 PM",
    specificTimePreference: "6:00 PM",
    
    planName: "Silver Monthly",
    planPrice: 1499,
    planOfInterest: "Silver Monthly",
    
    specialInstructions: "Customer works till 5:30 PM, so evening slot is essential.",
    
    tseScheduled: true,
    tseScheduledBy: "Neha Singh (TSE)",
    tseScheduledAt: "Mar 15, 2026 3:45 PM",
    
    assignedSupervisor: "Ramesh Vora",
    assignedSupervisorZone: "Zone A - Adajan",
    supervisorDemosOnDate: 1,
    
    washerAssigned: true,
    washerName: "Sunil Kumar",
    washerAssignedAt: "Mar 16, 2026 10:20 AM",
    washerAssignedBy: "Ramesh Vora (Supervisor)",
    
    assignmentDeadline: "2026-03-18T06:00:00",
    assignmentDeadlinePassed: false,
    
    acknowledgmentStatus: "Accepted" as const,
    acknowledgedAt: "Mar 16, 2026 10:50 AM",
    
    demoCompleted: true,
    demoCompletedAt: "Mar 18, 2026 6:40 PM",
    demoOutcome: "Customer Rescheduled",
    jobStartedAt: "Mar 18, 2026 6:00 PM",
    servicesPerformed: ["Exterior Wash"],
    servicesSkipped: "Interior cleaning - customer rescheduled before completion",
    customerPresentDuringWash: true,
    customerVerbalFeedback: "Had to leave urgently. Will reschedule for next week.",
    vehicleConditionBefore: "Moderate Dust",
    vehicleConditionAfter: "Partially Done",
    
    status: "Completed - Customer Rescheduled",
    assignmentStatus: "Completed" as const,
    
    isPreviousDemo: false,
    tlApprovalRequired: false,
    
    notificationsSent: ["supervisor", "operations_manager", "tse", "washer"],
    timelineEntries: [
      {
        timestamp: "2026-03-15T15:45:00",
        actor: "Neha Singh (TSE)",
        action: "Demo scheduled and assigned to Ramesh Vora"
      },
      {
        timestamp: "2026-03-16T10:20:00",
        actor: "Ramesh Vora (Supervisor)",
        action: "Washer Sunil Kumar assigned"
      },
      {
        timestamp: "2026-03-16T10:50:00",
        actor: "Sunil Kumar",
        action: "Demo acknowledged and accepted"
      },
      {
        timestamp: "2026-03-18T18:00:00",
        actor: "Sunil Kumar",
        action: "Demo started"
      },
      {
        timestamp: "2026-03-18T18:40:00",
        actor: "Sunil Kumar",
        action: "Demo completed - Customer Rescheduled"
      }
    ]
  }
];

// ==================== ANALYTICS MOCK DATA ====================
// Centralized mock data for analytics components
// In production, this comes from backend engines

import { CITIES } from "./constants";

export interface CityAnalyticsData {
  city: typeof CITIES[number];
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  totalExpenses: number;
  labourCost: number;
  materialCost: number;
  overheadCost: number;
  netIncome: number;
  profitMargin: number;
  unitsCompleted: number;
  activeCustomers: number;
  employeeCount: number;
  refundRate: number;
}

/**
 * Mock city analytics data
 * Used across: AnalyticsDashboard, LabourCostPerWash, EmployeeEfficiency, CityComparison
 */
export const MOCK_CITY_DATA: CityAnalyticsData[] = [
  {
    city: "SURAT",
    totalRevenue: 850000,
    totalRefunds: 85000,
    netRevenue: 765000,
    totalExpenses: 425000,
    labourCost: 285000,
    materialCost: 95000,
    overheadCost: 45000,
    netIncome: 340000,
    profitMargin: 44.4,
    unitsCompleted: 1850,
    activeCustomers: 245,
    employeeCount: 15,
    refundRate: 10.0,
  },
  {
    city: "AHMEDABAD",
    totalRevenue: 1250000,
    totalRefunds: 62500,
    netRevenue: 1187500,
    totalExpenses: 580000,
    labourCost: 398000,
    materialCost: 125000,
    overheadCost: 57000,
    netIncome: 607500,
    profitMargin: 51.2,
    unitsCompleted: 2650,
    activeCustomers: 385,
    employeeCount: 22,
    refundRate: 5.0,
  },
  {
    city: "AHMEDABAD",
    totalRevenue: 620000,
    totalRefunds: 93000,
    netRevenue: 527000,
    totalExpenses: 310000,
    labourCost: 248000,
    materialCost: 45000,
    overheadCost: 17000,
    netIncome: 217000,
    profitMargin: 41.2,
    unitsCompleted: 1380,
    activeCustomers: 168,
    employeeCount: 13,
    refundRate: 15.0,
  },
];

export function getCityData(city: typeof CITIES[number]): CityAnalyticsData | undefined {
  return MOCK_CITY_DATA.find((c) => c.city === city);
}

export function getAggregatedCityData(): CityAnalyticsData {
  const totalRevenue = MOCK_CITY_DATA.reduce((sum, city) => sum + city.totalRevenue, 0);
  const totalRefunds = MOCK_CITY_DATA.reduce((sum, city) => sum + city.totalRefunds, 0);
  const totalExpenses = MOCK_CITY_DATA.reduce((sum, city) => sum + city.totalExpenses, 0);
  const netRevenue = totalRevenue - totalRefunds;
  const netIncome = netRevenue - totalExpenses;

  return {
    city: "ALL" as any,
    totalRevenue,
    totalRefunds,
    netRevenue,
    totalExpenses,
    labourCost: MOCK_CITY_DATA.reduce((sum, city) => sum + city.labourCost, 0),
    materialCost: MOCK_CITY_DATA.reduce((sum, city) => sum + city.materialCost, 0),
    overheadCost: MOCK_CITY_DATA.reduce((sum, city) => sum + city.overheadCost, 0),
    netIncome,
    profitMargin: (netIncome / netRevenue) * 100,
    unitsCompleted: MOCK_CITY_DATA.reduce((sum, city) => sum + city.unitsCompleted, 0),
    activeCustomers: MOCK_CITY_DATA.reduce((sum, city) => sum + city.activeCustomers, 0),
    employeeCount: MOCK_CITY_DATA.reduce((sum, city) => sum + city.employeeCount, 0),
    refundRate: (totalRefunds / totalRevenue) * 100,
  };
}

// ==================== CLUSTER DATA ====================

export interface ClusterAnalyticsData {
  city: typeof CITIES[number];
  cluster: string;                  // Cluster ID (e.g., "ADAJAN")
  totalRevenue: number;
  totalRefunds: number;
  netRevenue: number;
  totalExpenses: number;
  labourCost: number;
  materialCost: number;
  overheadCost: number;
  netIncome: number;
  profitMargin: number;
  unitsCompleted: number;
  activeCustomers: number;
  employeeCount: number;
  refundRate: number;
}

/**
 * Mock cluster analytics data
 * Used for city → cluster drill-down
 */
export const MOCK_CLUSTER_DATA: ClusterAnalyticsData[] = [
  // Surat clusters
  {
    city: "SURAT",
    cluster: "ADAJAN",
    totalRevenue: 320000,
    totalRefunds: 32000,
    netRevenue: 288000,
    totalExpenses: 160000,
    labourCost: 107000,
    materialCost: 36000,
    overheadCost: 17000,
    netIncome: 128000,
    profitMargin: 44.4,
    unitsCompleted: 700,
    activeCustomers: 92,
    employeeCount: 6,
    refundRate: 10.0,
  },
  {
    city: "SURAT",
    cluster: "VESU",
    totalRevenue: 280000,
    totalRefunds: 28000,
    netRevenue: 252000,
    totalExpenses: 140000,
    labourCost: 94000,
    materialCost: 31000,
    overheadCost: 15000,
    netIncome: 112000,
    profitMargin: 44.4,
    unitsCompleted: 620,
    activeCustomers: 81,
    employeeCount: 5,
    refundRate: 10.0,
  },
  {
    city: "SURAT",
    cluster: "RANDER",
    totalRevenue: 150000,
    totalRefunds: 15000,
    netRevenue: 135000,
    totalExpenses: 75000,
    labourCost: 50000,
    materialCost: 17000,
    overheadCost: 8000,
    netIncome: 60000,
    profitMargin: 44.4,
    unitsCompleted: 330,
    activeCustomers: 43,
    employeeCount: 2,
    refundRate: 10.0,
  },
  {
    city: "SURAT",
    cluster: "KATARGAM",
    totalRevenue: 100000,
    totalRefunds: 10000,
    netRevenue: 90000,
    totalExpenses: 50000,
    labourCost: 34000,
    materialCost: 11000,
    overheadCost: 5000,
    netIncome: 40000,
    profitMargin: 44.4,
    unitsCompleted: 200,
    activeCustomers: 29,
    employeeCount: 2,
    refundRate: 10.0,
  },
  // Ahmedabad clusters
  {
    city: "AHMEDABAD",
    cluster: "SATELLITE",
    totalRevenue: 420000,
    totalRefunds: 21000,
    netRevenue: 399000,
    totalExpenses: 195000,
    labourCost: 134000,
    materialCost: 42000,
    overheadCost: 19000,
    netIncome: 204000,
    profitMargin: 51.1,
    unitsCompleted: 890,
    activeCustomers: 129,
    employeeCount: 7,
    refundRate: 5.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "MANINAGAR",
    totalRevenue: 380000,
    totalRefunds: 19000,
    netRevenue: 361000,
    totalExpenses: 176000,
    labourCost: 121000,
    materialCost: 38000,
    overheadCost: 17000,
    netIncome: 185000,
    profitMargin: 51.2,
    unitsCompleted: 805,
    activeCustomers: 117,
    employeeCount: 6,
    refundRate: 5.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "VASTRAPUR",
    totalRevenue: 290000,
    totalRefunds: 14500,
    netRevenue: 275500,
    totalExpenses: 134000,
    labourCost: 92000,
    materialCost: 29000,
    overheadCost: 13000,
    netIncome: 141500,
    profitMargin: 51.4,
    unitsCompleted: 615,
    activeCustomers: 89,
    employeeCount: 5,
    refundRate: 5.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "BOPAL",
    totalRevenue: 160000,
    totalRefunds: 8000,
    netRevenue: 152000,
    totalExpenses: 75000,
    labourCost: 51000,
    materialCost: 16000,
    overheadCost: 8000,
    netIncome: 77000,
    profitMargin: 50.7,
    unitsCompleted: 340,
    activeCustomers: 50,
    employeeCount: 4,
    refundRate: 5.0,
  },
  // Ahmedabad clusters
  {
    city: "AHMEDABAD",
    cluster: "ALKAPURI",
    totalRevenue: 220000,
    totalRefunds: 33000,
    netRevenue: 187000,
    totalExpenses: 110000,
    labourCost: 88000,
    materialCost: 16000,
    overheadCost: 6000,
    netIncome: 77000,
    profitMargin: 41.2,
    unitsCompleted: 490,
    activeCustomers: 60,
    employeeCount: 5,
    refundRate: 15.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "FATEHGUNJ",
    totalRevenue: 180000,
    totalRefunds: 27000,
    netRevenue: 153000,
    totalExpenses: 90000,
    labourCost: 72000,
    materialCost: 13000,
    overheadCost: 5000,
    netIncome: 63000,
    profitMargin: 41.2,
    unitsCompleted: 400,
    activeCustomers: 49,
    employeeCount: 4,
    refundRate: 15.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "MANJALPUR",
    totalRevenue: 140000,
    totalRefunds: 21000,
    netRevenue: 119000,
    totalExpenses: 70000,
    labourCost: 56000,
    materialCost: 10000,
    overheadCost: 4000,
    netIncome: 49000,
    profitMargin: 41.2,
    unitsCompleted: 310,
    activeCustomers: 38,
    employeeCount: 3,
    refundRate: 15.0,
  },
  {
    city: "AHMEDABAD",
    cluster: "GOTRI",
    totalRevenue: 80000,
    totalRefunds: 12000,
    netRevenue: 68000,
    totalExpenses: 40000,
    labourCost: 32000,
    materialCost: 6000,
    overheadCost: 2000,
    netIncome: 28000,
    profitMargin: 41.2,
    unitsCompleted: 180,
    activeCustomers: 21,
    employeeCount: 1,
    refundRate: 15.0,
  },
];

/**
 * Get cluster data for specific city and cluster
 */
export function getClusterData(city: typeof CITIES[number], cluster: string): ClusterAnalyticsData | undefined {
  return MOCK_CLUSTER_DATA.find((c) => c.city === city && c.cluster === cluster);
}

/**
 * Get all clusters for a city
 */
export function getCityClusters(city: typeof CITIES[number]): ClusterAnalyticsData[] {
  return MOCK_CLUSTER_DATA.filter((c) => c.city === city);
}

/**
 * Get aggregated data across all clusters in a city
 */
export function getAggregatedClusterData(city: typeof CITIES[number]): ClusterAnalyticsData {
  const clusters = getCityClusters(city);
  const totalRevenue = clusters.reduce((sum, cluster) => sum + cluster.totalRevenue, 0);
  const totalRefunds = clusters.reduce((sum, cluster) => sum + cluster.totalRefunds, 0);
  const totalExpenses = clusters.reduce((sum, cluster) => sum + cluster.totalExpenses, 0);
  const netRevenue = totalRevenue - totalRefunds;
  const netIncome = netRevenue - totalExpenses;

  return {
    city,
    cluster: "ALL",
    totalRevenue,
    totalRefunds,
    netRevenue,
    totalExpenses,
    labourCost: clusters.reduce((sum, cluster) => sum + cluster.labourCost, 0),
    materialCost: clusters.reduce((sum, cluster) => sum + cluster.materialCost, 0),
    overheadCost: clusters.reduce((sum, cluster) => sum + cluster.overheadCost, 0),
    netIncome,
    profitMargin: (netIncome / netRevenue) * 100,
    unitsCompleted: clusters.reduce((sum, cluster) => sum + cluster.unitsCompleted, 0),
    activeCustomers: clusters.reduce((sum, cluster) => sum + cluster.activeCustomers, 0),
    employeeCount: clusters.reduce((sum, cluster) => sum + cluster.employeeCount, 0),
    refundRate: (totalRefunds / totalRevenue) * 100,
  };
}