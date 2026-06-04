/**
 * Centralized Employee Data
 * 
 * This file contains the master employee data used across the entire CleanCar 360° system.
 * All modules (HR, Payroll, Leave Management, Performance, etc.) should import from this file
 * to ensure data consistency.
 */

// Extended Employee Interface
export interface Employee {
  id: string;
  empCode: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  cluster?: string;
  city: string;
  baseSalary: number;
  joiningDate: string;
  confirmationDate?: string | null;
  leavingDate?: string;
  lastWorkingDay?: string | null;
  status: "Active" | "On Leave" | "Notice Period" | "Resigned" | "Terminated";
  workingHours: string;
  reportingTo: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  dateOfBirth: string;
  aadhaar: string;
  pan: string;
  bankAccount: string;
  pfNumber: string;
  esiNumber: string;
  documents: {
    name: string;
    status: "Verified" | "Pending" | "Missing";
    uploadedDate?: string;
  }[];
}

// Document Types Required
export const requiredDocuments = [
  "Aadhaar Card",
  "PAN Card",
  "Bank Account Details",
  "Educational Certificates",
  "Experience Letters",
  "Address Proof",
  "Passport Size Photo",
  "Police Verification",
  "Medical Fitness Certificate",
  "Form 11 (PF Declaration)",
  "Form 2 (Pension Scheme)",
  "Appointment Letter (Signed)",
];

/**
 * Master Employee Data
 * These 10 employees are used consistently across:
 * - HR Module
 * - Payroll System
 * - Leave Management
 * - Performance Tracking
 * - Onboarding
 * - Exit & F&F Settlement
 */
export const MASTER_EMPLOYEES: Employee[] = [
  // EMP-001: Rahul Mehta - Operations Manager (Resigned March 31, 2025)
  {
    id: "EMP-001",
    empCode: "RM001",
    name: "Rahul Mehta",
    email: "rahul.mehta@cleancar.com",
    phone: "+91 98765 43201",
    role: "Operations Manager",
    department: "Operations",
    city: "Surat",
    baseSalary: 45000,
    joiningDate: "2024-08-05",
    confirmationDate: "2025-01-14",
    status: "Resigned",
    lastWorkingDay: "2025-03-31",
    workingHours: "10:00-19:00",
    reportingTo: "Rajesh Patel (Super Admin)",
    address: "12, Amroli Street, Surat - 395003",
    emergencyContact: "+91 98765 43290",
    bloodGroup: "O+",
    dateOfBirth: "1990-05-15",
    aadhaar: "XXXX-XXXX-2001",
    pan: "ABCRM1234M",
    bankAccount: "ICICI-XXXXXXX2001",
    pfNumber: "GJ/SRT/0001234/001",
    esiNumber: "2001234567",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-08-05" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-08-05" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-08-05" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-08-05" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-08-05" },
    ],
  },
  
  // EMP-002: Priya Sharma - Sales Executive
  {
    id: "EMP-002",
    empCode: "PS002",
    name: "Priya Sharma",
    email: "priya.sharma@cleancar.com",
    phone: "+91 98765 43202",
    role: "Sales Executive",
    department: "Sales",
    city: "Surat",
    baseSalary: 28000,
    joiningDate: "2025-01-01",
    confirmationDate: "2025-03-15",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "10:00-19:00",
    reportingTo: "Vikram Kumar (TSM)",
    address: "B-45, Vesu Residency, Surat - 395007",
    emergencyContact: "+91 98765 43291",
    bloodGroup: "A+",
    dateOfBirth: "1995-03-22",
    aadhaar: "XXXX-XXXX-2002",
    pan: "ABCPS2345S",
    bankAccount: "HDFC-XXXXXXX2002",
    pfNumber: "GJ/SRT/0001234/002",
    esiNumber: "2002234568",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2025-01-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2025-01-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2025-01-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2025-01-01" },
      { name: "Medical Fitness Certificate", status: "Verified", uploadedDate: "2025-01-01" },
    ],
  },
  
  // EMP-003: Amit Kumar - Finance Manager
  {
    id: "EMP-003",
    empCode: "AK003",
    name: "Amit Kumar",
    email: "amit.kumar@cleancar.com",
    phone: "+91 98765 43203",
    role: "Finance Manager",
    department: "Finance",
    city: "Surat",
    baseSalary: 50000,
    joiningDate: "2024-06-15",
    confirmationDate: "2024-09-20",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "10:00-19:00",
    reportingTo: "Rajesh Patel (Super Admin)",
    address: "C-101, Adajan Heights, Surat - 395009",
    emergencyContact: "+91 98765 43292",
    bloodGroup: "B+",
    dateOfBirth: "1988-07-10",
    aadhaar: "XXXX-XXXX-2003",
    pan: "ABCAK3456K",
    bankAccount: "SBI-XXXXXXX2003",
    pfNumber: "GJ/SRT/0001234/003",
    esiNumber: "2003234569",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-06-15" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-06-15" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-06-15" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-06-15" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-06-15" },
    ],
  },
  
  // EMP-004: Neha Patel - HR Coordinator (Not Confirmed Yet)
  {
    id: "EMP-004",
    empCode: "NP004",
    name: "Neha Patel",
    email: "neha.patel@cleancar.com",
    phone: "+91 98765 43204",
    role: "HR Coordinator",
    department: "HR",
    city: "Surat",
    baseSalary: 32000,
    joiningDate: "2024-11-01",
    confirmationDate: null, // Still in probation
    status: "Active",
    lastWorkingDay: null,
    workingHours: "10:00-19:00",
    reportingTo: "Pooja Desai (HR)",
    address: "D-23, Pal Residency, Surat - 395006",
    emergencyContact: "+91 98765 43293",
    bloodGroup: "O-",
    dateOfBirth: "1997-11-30",
    aadhaar: "XXXX-XXXX-2004",
    pan: "ABCNP4567P",
    bankAccount: "AXIS-XXXXXXX2004",
    pfNumber: "GJ/SRT/0001234/004",
    esiNumber: "2004234570",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-11-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-11-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-11-01" },
      { name: "Educational Certificates", status: "Pending" },
      { name: "Medical Fitness Certificate", status: "Verified", uploadedDate: "2024-11-01" },
    ],
  },
  
  // EMP-005: Vikram Singh - Operations Supervisor (Resigned, June 30, 2025)
  {
    id: "EMP-005",
    empCode: "VS005",
    name: "Vikram Singh",
    email: "vikram.singh@cleancar.com",
    phone: "+91 98765 43205",
    role: "Operations Supervisor",
    department: "Operations",
    cluster: "Adajan",
    city: "Surat",
    baseSalary: 38000,
    joiningDate: "2024-04-10",
    confirmationDate: "2024-07-15",
    status: "Resigned",
    lastWorkingDay: "2025-06-30",
    workingHours: "07:00-16:00",
    reportingTo: "Amit Bhatt (Operations Manager)",
    address: "E-56, Magdalla Road, Surat - 395007",
    emergencyContact: "+91 98765 43294",
    bloodGroup: "AB+",
    dateOfBirth: "1992-01-18",
    aadhaar: "XXXX-XXXX-2005",
    pan: "ABCVS5678S",
    bankAccount: "ICICI-XXXXXXX2005",
    pfNumber: "GJ/SRT/0001234/005",
    esiNumber: "2005234571",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-04-10" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-04-10" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-04-10" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-04-10" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-04-10" },
    ],
  },
  
  // EMP-006: Sneha Gupta - Marketing Executive (On Maternity Leave)
  {
    id: "EMP-006",
    empCode: "SG006",
    name: "Sneha Gupta",
    email: "sneha.gupta@cleancar.com",
    phone: "+91 98765 43206",
    role: "Marketing Executive",
    department: "Marketing",
    city: "Surat",
    baseSalary: 30000,
    joiningDate: "2024-09-01",
    confirmationDate: "2024-12-05",
    status: "On Leave",
    lastWorkingDay: null,
    workingHours: "10:00-19:00",
    reportingTo: "Rajesh Patel (Super Admin)",
    address: "F-78, Citylight Road, Surat - 395007",
    emergencyContact: "+91 98765 43295",
    bloodGroup: "A-",
    dateOfBirth: "1994-09-25",
    aadhaar: "XXXX-XXXX-2006",
    pan: "ABCSG6789G",
    bankAccount: "HDFC-XXXXXXX2006",
    pfNumber: "GJ/SRT/0001234/006",
    esiNumber: "2006234572",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "Medical Fitness Certificate", status: "Verified", uploadedDate: "2024-09-01" },
    ],
  },
  
  // CW-101: Ravi Verma - Car Washer / Technician
  {
    id: "CW-101",
    empCode: "RV101",
    name: "Ravi Verma",
    email: "ravi.verma@cleancar.com",
    phone: "+91 98765 43207",
    role: "Car Washer / Technician",
    department: "Operations",
    cluster: "Adajan",
    city: "Surat",
    baseSalary: 7752,
    joiningDate: "2025-02-01",
    confirmationDate: null,
    status: "Active",
    lastWorkingDay: null,
    workingHours: "06:00-14:00",
    reportingTo: "Suresh Yadav (Supervisor)",
    address: "Plot 12, Udhna Darwaja, Surat - 395002",
    emergencyContact: "+91 98765 43296",
    bloodGroup: "B+",
    dateOfBirth: "1998-06-12",
    aadhaar: "XXXX-XXXX-2101",
    pan: "ABCRV7890V",
    bankAccount: "SBI-XXXXXXX2101",
    pfNumber: "GJ/SRT/0001234/101",
    esiNumber: "2101234573",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2025-02-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2025-02-01" },
      { name: "Address Proof", status: "Verified", uploadedDate: "2025-02-01" },
      { name: "PAN Card", status: "Pending" },
      { name: "Police Verification", status: "Pending" },
    ],
  },

  // CW-102: Suresh Yadav - Car Washer / Technician
  {
    id: "CW-102",
    empCode: "SY102",
    name: "Suresh Yadav",
    email: "suresh.yadav@cleancar.com",
    phone: "+91 98765 43208",
    role: "Car Washer / Technician",
    department: "Operations",
    cluster: "Vesu",
    city: "Surat",
    baseSalary: 7752,
    joiningDate: "2025-01-15",
    confirmationDate: null,
    status: "Active",
    lastWorkingDay: null,
    workingHours: "06:00-14:00",
    reportingTo: "Ramesh Patel (Supervisor)",
    address: "Plot 34, Kamrej Road, Surat - 395010",
    emergencyContact: "+91 98765 43297",
    bloodGroup: "O+",
    dateOfBirth: "1999-02-20",
    aadhaar: "XXXX-XXXX-2102",
    pan: "ABCSY8901Y",
    bankAccount: "AXIS-XXXXXXX2102",
    pfNumber: "GJ/SRT/0001234/102",
    esiNumber: "2102234574",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2025-01-15" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2025-01-15" },
      { name: "Address Proof", status: "Verified", uploadedDate: "2025-01-15" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2025-01-15" },
      { name: "Police Verification", status: "Pending" },
    ],
  },

  // CW-103: Dinesh Chauhan - Car Washer / Technician
  {
    id: "CW-103",
    empCode: "DC103",
    name: "Dinesh Chauhan",
    email: "dinesh.chauhan@cleancar.com",
    phone: "+91 98765 43211",
    role: "Car Washer / Technician",
    department: "Operations",
    cluster: "Adajan",
    city: "Surat",
    baseSalary: 7752,
    joiningDate: "2024-11-10",
    confirmationDate: "2025-02-10",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "06:00-14:00",
    reportingTo: "Ramesh Patel (Supervisor)",
    address: "Lane 5, Varachha Road, Surat - 395006",
    emergencyContact: "+91 98765 43300",
    bloodGroup: "A+",
    dateOfBirth: "1997-08-18",
    aadhaar: "XXXX-XXXX-2103",
    pan: "ABCDC1234C",
    bankAccount: "ICICI-XXXXXXX2103",
    pfNumber: "GJ/SRT/0001234/103",
    esiNumber: "2103234577",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-11-10" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-11-10" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-11-10" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-11-10" },
    ],
  },

  // CW-104: Mahesh Solanki - Car Washer / Technician
  {
    id: "CW-104",
    empCode: "MS104",
    name: "Mahesh Solanki",
    email: "mahesh.solanki@cleancar.com",
    phone: "+91 98765 43212",
    role: "Car Washer / Technician",
    department: "Operations",
    cluster: "Citylight",
    city: "Surat",
    baseSalary: 7752,
    joiningDate: "2024-10-15",
    confirmationDate: "2025-01-15",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "06:00-14:00",
    reportingTo: "Karthik Iyer (Supervisor)",
    address: "Block C, Rander Road, Surat - 395005",
    emergencyContact: "+91 98765 43301",
    bloodGroup: "B-",
    dateOfBirth: "1996-12-05",
    aadhaar: "XXXX-XXXX-2104",
    pan: "ABCMS2345M",
    bankAccount: "HDFC-XXXXXXX2104",
    pfNumber: "GJ/SRT/0001234/104",
    esiNumber: "2104234578",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-10-15" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-10-15" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-10-15" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-10-15" },
    ],
  },

  // CW-105: Prakash Joshi - Car Washer / Technician
  {
    id: "CW-105",
    empCode: "PJ105",
    name: "Prakash Joshi",
    email: "prakash.joshi@cleancar.com",
    phone: "+91 98765 43213",
    role: "Car Washer / Technician",
    department: "Operations",
    cluster: "Vesu",
    city: "Surat",
    baseSalary: 7752,
    joiningDate: "2024-09-01",
    confirmationDate: "2024-12-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "06:00-14:00",
    reportingTo: "Ramesh Patel (Supervisor)",
    address: "Street 7, Parvat Patiya, Surat - 395010",
    emergencyContact: "+91 98765 43302",
    bloodGroup: "O-",
    dateOfBirth: "1995-03-22",
    aadhaar: "XXXX-XXXX-2105",
    pan: "ABCPJ3456J",
    bankAccount: "SBI-XXXXXXX2105",
    pfNumber: "GJ/SRT/0001234/105",
    esiNumber: "2105234579",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-09-01" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-09-01" },
    ],
  },
  
  // TS-201: Anjali Reddy - Tele Sales Executive
  {
    id: "TS-201",
    empCode: "AR201",
    name: "Anjali Reddy",
    email: "anjali.reddy@cleancar.com",
    phone: "+91 98765 43209",
    role: "Tele Sales Executive",
    department: "Sales",
    city: "Surat",
    baseSalary: 25000,
    joiningDate: "2024-12-01",
    confirmationDate: "2025-03-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "10:00-19:00",
    reportingTo: "Vikram Kumar (TSM)",
    address: "G-12, Piplod Heights, Surat - 395007",
    emergencyContact: "+91 98765 43298",
    bloodGroup: "A+",
    dateOfBirth: "1996-04-15",
    aadhaar: "XXXX-XXXX-2201",
    pan: "ABCAR9012R",
    bankAccount: "ICICI-XXXXXXX2201",
    pfNumber: "GJ/SRT/0001234/201",
    esiNumber: "2201234575",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-12-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-12-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-12-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-12-01" },
      { name: "Medical Fitness Certificate", status: "Verified", uploadedDate: "2024-12-01" },
    ],
  },
  
  // FS-301: Karthik Iyer - Operations Supervisor
  {
    id: "FS-301",
    empCode: "KI301",
    name: "Karthik Iyer",
    email: "karthik.iyer@cleancar.com",
    phone: "+91 98765 43210",
    role: "Operations Supervisor",
    department: "Operations",
    cluster: "Citylight",
    city: "Surat",
    baseSalary: 25000,
    joiningDate: "2024-10-01",
    confirmationDate: "2025-01-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "08:00-17:00",
    reportingTo: "Amit Bhatt (Operations Manager)",
    address: "H-89, Ghod Dod Road, Surat - 395001",
    emergencyContact: "+91 98765 43299",
    bloodGroup: "AB-",
    dateOfBirth: "1991-08-05",
    aadhaar: "XXXX-XXXX-2301",
    pan: "ABCKI0123I",
    bankAccount: "HDFC-XXXXXXX2301",
    pfNumber: "GJ/SRT/0001234/301",
    esiNumber: "2301234576",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-10-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-10-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-10-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-10-01" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-10-01" },
    ],
  },

  // SUP-401: Ramesh Patel - Operations Supervisor
  {
    id: "SUP-401",
    empCode: "RP401",
    name: "Ramesh Patel",
    email: "ramesh.patel@cleancar.com",
    phone: "+91 98765 43214",
    role: "Operations Supervisor",
    department: "Operations",
    cluster: "Adajan",
    city: "Surat",
    baseSalary: 25000,
    joiningDate: "2024-07-01",
    confirmationDate: "2024-10-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "08:00-17:00",
    reportingTo: "Amit Bhatt (Operations Manager)",
    address: "Plot 45, Adajan Road, Surat - 395009",
    emergencyContact: "+91 98765 43303",
    bloodGroup: "A+",
    dateOfBirth: "1989-06-10",
    aadhaar: "XXXX-XXXX-2401",
    pan: "ABCRP4567P",
    bankAccount: "AXIS-XXXXXXX2401",
    pfNumber: "GJ/SRT/0001234/401",
    esiNumber: "2401234580",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-07-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-07-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-07-01" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-07-01" },
    ],
  },

  // SUP-402: Deepak Rana - Operations Supervisor
  {
    id: "SUP-402",
    empCode: "DR402",
    name: "Deepak Rana",
    email: "deepak.rana@cleancar.com",
    phone: "+91 98765 43215",
    role: "Operations Supervisor",
    department: "Operations",
    cluster: "Vesu",
    city: "Surat",
    baseSalary: 25000,
    joiningDate: "2024-08-15",
    confirmationDate: "2024-11-15",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "08:00-17:00",
    reportingTo: "Amit Bhatt (Operations Manager)",
    address: "Tower B, Vesu Complex, Surat - 395007",
    emergencyContact: "+91 98765 43304",
    bloodGroup: "B+",
    dateOfBirth: "1990-11-25",
    aadhaar: "XXXX-XXXX-2402",
    pan: "ABCDR5678R",
    bankAccount: "ICICI-XXXXXXX2402",
    pfNumber: "GJ/SRT/0001234/402",
    esiNumber: "2402234581",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-08-15" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-08-15" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-08-15" },
      { name: "Police Verification", status: "Verified", uploadedDate: "2024-08-15" },
    ],
  },

  // OPS-501: Amit Bhatt - Operations Manager
  {
    id: "OPS-501",
    empCode: "AB501",
    name: "Amit Bhatt",
    email: "amit.bhatt@cleancar.com",
    phone: "+91 98765 43216",
    role: "Operations Manager",
    department: "Operations",
    city: "Surat",
    baseSalary: 35000,
    joiningDate: "2024-05-01",
    confirmationDate: "2024-08-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "09:00-18:00",
    reportingTo: "Rajesh Patel (City Manager)",
    address: "Flat 302, Althan Residency, Surat - 395017",
    emergencyContact: "+91 98765 43305",
    bloodGroup: "O+",
    dateOfBirth: "1987-04-12",
    aadhaar: "XXXX-XXXX-2501",
    pan: "ABCAB6789B",
    bankAccount: "HDFC-XXXXXXX2501",
    pfNumber: "GJ/SRT/0001234/501",
    esiNumber: "2501234582",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-05-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-05-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-05-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-05-01" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-05-01" },
    ],
  },

  // CITY-601: Rajesh Patel - City Manager
  {
    id: "CITY-601",
    empCode: "RJP601",
    name: "Rajesh Patel",
    email: "rajesh.patel@cleancar.com",
    phone: "+91 98765 43217",
    role: "City Manager",
    department: "Operations",
    city: "Surat",
    baseSalary: 50000,
    joiningDate: "2024-03-01",
    confirmationDate: "2024-06-01",
    status: "Active",
    lastWorkingDay: null,
    workingHours: "09:00-18:00",
    reportingTo: "CEO",
    address: "Penthouse, City Center, Surat - 395001",
    emergencyContact: "+91 98765 43306",
    bloodGroup: "AB+",
    dateOfBirth: "1985-09-08",
    aadhaar: "XXXX-XXXX-2601",
    pan: "ABCRP7890P",
    bankAccount: "ICICI-XXXXXXX2601",
    pfNumber: "GJ/SRT/0001234/601",
    esiNumber: "2601234583",
    documents: [
      { name: "Aadhaar Card", status: "Verified", uploadedDate: "2024-03-01" },
      { name: "PAN Card", status: "Verified", uploadedDate: "2024-03-01" },
      { name: "Bank Account Details", status: "Verified", uploadedDate: "2024-03-01" },
      { name: "Educational Certificates", status: "Verified", uploadedDate: "2024-03-01" },
      { name: "Form 11 (PF Declaration)", status: "Verified", uploadedDate: "2024-03-01" },
    ],
  },
  // EMP-SH-001: Sales Head — Surat
  {
    id: "EMP-SH-001",
    empCode: "SH001",
    name: "Amit Joshi",
    email: "amit.joshi@cleancar.com",
    phone: "+91 98765 43230",
    role: "Sales Head",
    department: "Sales",
    city: "Surat",
    baseSalary: 40000,
    joiningDate: "2025-06-01",
    confirmationDate: "2025-12-01",
    status: "Active" as const,
    workingHours: "10:00-19:00",
    reportingTo: "City Manager",
    address: "45, Athwa Lines, Surat - 395001",
    emergencyContact: "+91 98765 43231",
    bloodGroup: "B+",
    dateOfBirth: "1988-03-22",
    aadhaar: "XXXX-XXXX-4401",
    pan: "ABCAJ4401A",
    bankAccount: "HDFC-XXXXXXX4401",
    pfNumber: "GJ/SRT/0004401/001",
    esiNumber: "4401234567",
    documents: [
      { name: "Aadhaar Card",          status: "Verified" as const, uploadedDate: "2025-06-01" },
      { name: "PAN Card",              status: "Verified" as const, uploadedDate: "2025-06-01" },
      { name: "Bank Account Details",  status: "Verified" as const, uploadedDate: "2025-06-01" },
      { name: "Appointment Letter (Signed)", status: "Verified" as const, uploadedDate: "2025-06-01" },
    ],
  },
  // EMP-SM-001: Sales Manager — Surat
  {
    id: "EMP-SM-001",
    empCode: "SM001",
    name: "Priya Nair",
    email: "priya.nair@cleancar.com",
    phone: "+91 98765 43240",
    role: "Sales Manager",
    department: "Sales",
    city: "Surat",
    baseSalary: 35000,
    joiningDate: "2025-08-15",
    confirmationDate: "2026-02-15",
    status: "Active" as const,
    workingHours: "08:00-18:30",
    reportingTo: "Sales Head",
    address: "72, Adajan Patiya, Surat - 395009",
    emergencyContact: "+91 98765 43241",
    bloodGroup: "A+",
    dateOfBirth: "1992-07-14",
    aadhaar: "XXXX-XXXX-5501",
    pan: "ABCPN5501B",
    bankAccount: "ICICI-XXXXXXX5501",
    pfNumber: "GJ/SRT/0005501/001",
    esiNumber: "5501234567",
    documents: [
      { name: "Aadhaar Card",          status: "Verified" as const, uploadedDate: "2025-08-15" },
      { name: "PAN Card",              status: "Verified" as const, uploadedDate: "2025-08-15" },
      { name: "Bank Account Details",  status: "Verified" as const, uploadedDate: "2025-08-15" },
      { name: "Appointment Letter (Signed)", status: "Verified" as const, uploadedDate: "2025-08-15" },
    ],
  },
];

/**
 * Helper function to get employee by ID
 */
export function getEmployeeById(id: string): Employee | undefined {
  return MASTER_EMPLOYEES.find(emp => emp.id === id);
}

/**
 * Helper function to get employee by empCode
 */
export function getEmployeeByCode(empCode: string): Employee | undefined {
  return MASTER_EMPLOYEES.find(emp => emp.empCode === empCode);
}

/**
 * Helper function to get employees by department
 */
export function getEmployeesByDepartment(department: string): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.department === department);
}

/**
 * Helper function to get active employees
 */
export function getActiveEmployees(): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.status === "Active" || emp.status === "On Leave");
}

/**
 * Helper function to get employees by status
 */
export function getEmployeesByStatus(status: Employee["status"]): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.status === status);
}

/**
 * Helper function to get employees by role
 */
export function getEmployeesByRole(role: string): Employee[] {
  return MASTER_EMPLOYEES.filter(emp => emp.role === role && (emp.status === "Active" || emp.status === "On Leave"));
}

/**
 * Calculate average salary for a specific role from actual employee data
 */
export function getAverageSalaryByRole(role: string): number {
  const employees = getEmployeesByRole(role);
  if (employees.length === 0) return 0;

  const totalSalary = employees.reduce((sum, emp) => sum + emp.baseSalary, 0);
  return Math.round(totalSalary / employees.length);
}

/**
 * Get all salary statistics from actual employee data
 */
export function getSalaryStatistics() {
  return {
    washerCTC: getAverageSalaryByRole("Car Washer / Technician"),
    supervisorCTC: getAverageSalaryByRole("Operations Supervisor"),
    opsManagerCTC: getAverageSalaryByRole("Operations Manager"),
    cityManagerCTC: getAverageSalaryByRole("City Manager"),
  };
}

/**
 * Get headcount by role
 */
export function getHeadcountByRole(role: string): number {
  return getEmployeesByRole(role).length;
}

/**
 * Get all headcount statistics
 */
export function getHeadcountStatistics() {
  return {
    washers: getHeadcountByRole("Car Washer / Technician"),
    supervisors: getHeadcountByRole("Operations Supervisor"),
    opsManagers: getHeadcountByRole("Operations Manager"),
    cityManagers: getHeadcountByRole("City Manager"),
  };
}
