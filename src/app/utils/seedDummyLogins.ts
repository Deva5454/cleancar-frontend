/**
 * Seed Dummy Login Accounts
 * Creates one demo employee per role in EMPLOYEE_DATABASE_RECORDS
 * Runs once on first app load. Safe to call multiple times — checks before seeding.
 *
 * PASSWORD FOR ALL ACCOUNTS: Demo@1234
 * Hash = btoa("Demo@1234" + "CC360SALT") = "RGVtb0AxMjM0Q0MzNjBTQUxU"
 */

const STORAGE_KEY = "EMPLOYEE_DATABASE_RECORDS";
const SEED_FLAG   = "DUMMY_LOGINS_SEEDED_V1";

// btoa("Demo@1234CC360SALT")
const DEMO_PASSWORD_HASH = "RGVtb0AxMjM0Q0MzNjBTQUxU";

const today = new Date().toISOString().split("T")[0];

const DUMMY_ACCOUNTS = [
  {
    id: "DEMO-SA-001",
    tempId: "TEMP-DEMO-001",
    loginMobile: "9000000001",
    mobile: "9000000001",
    fullName: "Demo Super Admin",
    firstName: "Demo", lastName: "SuperAdmin",
    designation: "Super Admin",
    department: "Management",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-ADM-001",
    tempId: "TEMP-DEMO-002",
    loginMobile: "9000000002",
    mobile: "9000000002",
    fullName: "Demo Admin",
    firstName: "Demo", lastName: "Admin",
    designation: "Admin",
    department: "Management",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-CM-001",
    tempId: "TEMP-DEMO-003",
    loginMobile: "9000000003",
    mobile: "9000000003",
    fullName: "Demo City Manager",
    firstName: "Demo", lastName: "CityManager",
    designation: "City Manager",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-CLM-001",
    tempId: "TEMP-DEMO-004",
    loginMobile: "9000000004",
    mobile: "9000000004",
    fullName: "Demo Cluster Manager",
    firstName: "Demo", lastName: "ClusterManager",
    designation: "Cluster Manager",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-SOM-001",
    tempId: "TEMP-DEMO-005",
    loginMobile: "9000000005",
    mobile: "9000000005",
    fullName: "Demo Sr Operations Manager",
    firstName: "Demo", lastName: "SrOM",
    designation: "Sr Operations Manager",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-OM-001",
    tempId: "TEMP-DEMO-006",
    loginMobile: "9000000006",
    mobile: "9000000006",
    fullName: "Demo Operations Manager",
    firstName: "Demo", lastName: "OpsManager",
    designation: "Operations Manager",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-MGR-001",
    tempId: "TEMP-DEMO-007",
    loginMobile: "9000000007",
    mobile: "9000000007",
    fullName: "Demo Manager",
    firstName: "Demo", lastName: "Manager",
    designation: "Manager",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-SUP-001",
    tempId: "TEMP-DEMO-008",
    loginMobile: "9000000008",
    mobile: "9000000008",
    fullName: "Demo Supervisor",
    firstName: "Demo", lastName: "Supervisor",
    designation: "Supervisor",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-CW-001",
    tempId: "TEMP-DEMO-009",
    loginMobile: "9000000009",
    mobile: "9000000009",
    fullName: "Demo Car Washer",
    firstName: "Demo", lastName: "Washer",
    designation: "Car Washer",
    department: "Operations",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-TSM-001",
    tempId: "TEMP-DEMO-010",
    loginMobile: "9000000010",
    mobile: "9000000010",
    fullName: "Demo TSM",
    firstName: "Demo", lastName: "TSM",
    designation: "TSM",
    department: "Sales",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-TSE-001",
    tempId: "TEMP-DEMO-011",
    loginMobile: "9000000011",
    mobile: "9000000011",
    fullName: "Demo TSE",
    firstName: "Demo", lastName: "TSE",
    designation: "TSE",
    department: "Sales",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-CCE-001",
    tempId: "TEMP-DEMO-012",
    loginMobile: "9000000012",
    mobile: "9000000012",
    fullName: "Demo CCE",
    firstName: "Demo", lastName: "CCE",
    designation: "CCE",
    department: "Customer Care",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-SM-001",
    tempId: "TEMP-DEMO-013",
    loginMobile: "9000000013",
    mobile: "9000000013",
    fullName: "Demo Store Manager",
    firstName: "Demo", lastName: "StoreManager",
    designation: "Store Manager",
    department: "Inventory",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-PM-001",
    tempId: "TEMP-DEMO-014",
    loginMobile: "9000000014",
    mobile: "9000000014",
    fullName: "Demo Procurement Manager",
    firstName: "Demo", lastName: "Procurement",
    designation: "Procurement Manager",
    department: "Inventory",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-ACC-001",
    tempId: "TEMP-DEMO-015",
    loginMobile: "9000000015",
    mobile: "9000000015",
    fullName: "Demo Accounts",
    firstName: "Demo", lastName: "Accounts",
    designation: "Accounts",
    department: "Finance",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
  {
    id: "DEMO-HR-001",
    tempId: "TEMP-DEMO-016",
    loginMobile: "9000000016",
    mobile: "9000000016",
    fullName: "Demo HR",
    firstName: "Demo", lastName: "HR",
    designation: "HR",
    department: "Human Resources",
    workLocation: "CITY-SURAT",
    city: "Surat",
  },
];

const BASE_RECORD = {
  tempIdAssignedDate: today,
  conversionDueDate: today,
  daysInTempStatus: 0,
  isOverdue: false,
  employmentStage: "Permanent" as const,
  skillLevel: "Skilled" as const,
  fatherFirstName: "Demo",
  fatherLastName: "Father",
  fatherName: "Demo Father",
  dob: "1990-01-01",
  gender: "Male",
  email: "demo@cleancar.com",
  permanentAddress: "Demo Address, Surat, Gujarat",
  currentAddress: "Demo Address, Surat, Gujarat",
  emergencyContact: "9000000000",
  reportingManager: "Demo Super Admin",
  pinCodes: ["395005"],
  employeeType: "Full Time" as const,
  dateOfJoining: "2024-01-01",
  probationPeriod: "3 months",
  status: "Active" as const,
  // Auth fields
  passwordHash: DEMO_PASSWORD_HASH,
  onboardingPasswordSet: true,
  accountStatus: "active" as const,
  failedLoginAttempts: 0,
};

export function seedDummyLogins(): void {
  try {
    // Only seed once
    if (localStorage.getItem(SEED_FLAG)) return;

    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    // Add each demo account if not already present
    const existingIds = new Set(existing.map((e: any) => e.id));
    const toAdd = DUMMY_ACCOUNTS
      .filter(acc => !existingIds.has(acc.id))
      .map(acc => ({ ...BASE_RECORD, ...acc }));

    if (toAdd.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, ...toAdd]));
      console.log(`[DummyLogins] Seeded ${toAdd.length} demo accounts. Password: Demo@1234`);
    }

    localStorage.setItem(SEED_FLAG, "true");
  } catch (err) {
    console.error("[DummyLogins] Failed to seed:", err);
  }
}
