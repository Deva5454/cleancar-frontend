/**
 * Seed Employee Data
 * Initial employee data to populate HRDataContext
 *
 * CRITICAL: This is ONLY used for seeding on first load
 * After seeding, HRDataContext + DataService maintain the data
 */

import type { Employee } from "../contexts/HRDataContext";

export const SEED_EMPLOYEES: Omit<Employee, "employeeId" | "createdAt" | "updatedAt">[] = [
  // ============================================
  // ADMIN & MANAGEMENT
  // ============================================
  {
    firstName: "Rajesh",
    lastName: "Patel",
    email: "rajesh@cleancar.com",
    phone: "+91 98765 00001",
    role: "Super Admin",
    department: "Management",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-01-01",
    baseSalary: 80000,
    incentiveEligible: false,
  },
  {
    firstName: "Kavita",
    lastName: "Shah",
    email: "kavita@cleancar.com",
    phone: "+91 98765 00002",
    role: "Admin",
    department: "Management",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-02-01",
    baseSalary: 60000,
    incentiveEligible: false,
  },
  {
    firstName: "Prakash",
    lastName: "Mehta",
    email: "prakash@cleancar.com",
    phone: "+91 98765 00003",
    role: "City Manager",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-03-01",
    baseSalary: 70000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
  },
  {
    firstName: "Jayesh",
    lastName: "Desai",
    email: "jayesh@cleancar.com",
    phone: "+91 98765 00004",
    role: "Sr Operations Manager",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-04-01",
    baseSalary: 55000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
  },
  {
    firstName: "Amit",
    lastName: "Bhatt",
    email: "amit@cleancar.com",
    phone: "+91 98765 00005",
    role: "Operations Manager",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-05-01",
    baseSalary: 45000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395009"],
  },
  {
    firstName: "Amit",
    lastName: "Kumar",
    email: "amit.kumar@cleancar.com",
    phone: "+91 98765 00015",
    role: "Cluster Manager",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2024-06-01",
    baseSalary: 50000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395009", "PIN-395007", "PIN-395006"],
  },

  // ============================================
  // SUPERVISORS
  // ============================================
  {
    firstName: "Suresh",
    lastName: "Yadav",
    email: "suresh@cleancar.com",
    phone: "+91 98765 00006",
    role: "Supervisor",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-01-01",
    baseSalary: 25000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395009"],
  },
  {
    firstName: "Ramesh",
    lastName: "Kumar",
    email: "ramesh@cleancar.com",
    phone: "+91 98765 00016",
    role: "Supervisor",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-02-01",
    baseSalary: 25000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395007"],
  },

  // ============================================
  // CAR WASHERS
  // ============================================
  {
    firstName: "Rahul",
    lastName: "Verma",
    email: "rahul@cleancar.com",
    phone: "+91 98765 00007",
    role: "Car Washer Full Time",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-06-01",
    baseSalary: 15000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395009"],
  },
  {
    firstName: "Vijay",
    lastName: "Singh",
    email: "vijay@cleancar.com",
    phone: "+91 98765 00017",
    role: "Car Washer Full Time",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-07-01",
    baseSalary: 15000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395009"],
  },
  {
    firstName: "Manoj",
    lastName: "Patel",
    email: "manoj@cleancar.com",
    phone: "+91 98765 00018",
    role: "Car Washer Full Time",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-08-01",
    baseSalary: 15000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395007"],
  },
  {
    firstName: "Dinesh",
    lastName: "Kumar",
    email: "dinesh@cleancar.com",
    phone: "+91 98765 00019",
    role: "Car Washer Part Time",
    department: "Operations",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-09-01",
    baseSalary: 8000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
    clusterId: "CLUSTER-SOUTH",
    assignedPincodes: ["PIN-395007"],
  },

  // ============================================
  // SALES & SUPPORT
  // ============================================
  {
    firstName: "Vikram",
    lastName: "Kumar",
    email: "vikram@cleancar.com",
    phone: "+91 98765 00008",
    role: "TSM",
    department: "Sales",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-01-15",
    baseSalary: 35000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
  },
  {
    firstName: "Neha",
    lastName: "Singh",
    email: "neha@cleancar.com",
    phone: "+91 98765 00009",
    role: "TSE",
    department: "Sales",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-02-01",
    baseSalary: 25000,
    incentiveEligible: true,
    cityId: "CITY-SURAT",
  },
  {
    firstName: "Anjali",
    lastName: "Reddy",
    email: "anjali@cleancar.com",
    phone: "+91 98765 00010",
    role: "CCE",
    department: "Customer Support",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-03-01",
    baseSalary: 22000,
    incentiveEligible: false,
    cityId: "CITY-SURAT",
  },

  // ============================================
  // STORE & PROCUREMENT
  // ============================================
  {
    firstName: "Sandeep",
    lastName: "Jain",
    email: "sandeep@cleancar.com",
    phone: "+91 98765 00011",
    role: "Store Manager",
    department: "Inventory",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-01-01",
    baseSalary: 30000,
    incentiveEligible: false,
  },
  {
    firstName: "Kavya",
    lastName: "Nair",
    email: "kavya@cleancar.com",
    phone: "+91 98765 00012",
    role: "Procurement Manager",
    department: "Inventory",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-02-01",
    baseSalary: 35000,
    incentiveEligible: false,
  },

  // ============================================
  // FINANCE & HR
  // ============================================
  {
    firstName: "Kavita",
    lastName: "Iyer",
    email: "kavita.i@cleancar.com",
    phone: "+91 98765 00013",
    role: "Accounts",
    department: "Finance",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-01-01",
    baseSalary: 32000,
    incentiveEligible: false,
  },
  {
    firstName: "Pooja",
    lastName: "Desai",
    email: "pooja@cleancar.com",
    phone: "+91 98765 00014",
    role: "HR",
    department: "Human Resources",
    city: "Surat",
    status: "Active",
    joiningDate: "2025-01-01",
    baseSalary: 35000,
    incentiveEligible: false,
  },
  // ============================================
  // MARKETING AGENCY
  // ============================================
  {
    firstName: "Priya",
    lastName: "Nair",
    email: "priya.nair@marketingpartner.com",
    phone: "+91 98765 00020",
    role: "Marketing Agency" as any,
    department: "Marketing",
    city: "Surat",
    cityId: "CITY-SURAT",
    status: "Active",
    joiningDate: "2025-01-01",
    baseSalary: 0, // Agency partner — no payroll processing
    incentiveEligible: false,
    assignedPincodes: [],
  },
];

/**
 * Seed employees into DataService
 * Call this once on app initialization if no employees exist
 */
export function seedEmployeesIfEmpty(
  getEmployeeCount: () => number,
  addEmployee: (emp: Omit<Employee, "employeeId" | "createdAt" | "updatedAt">) => Employee
): void {
  const count = getEmployeeCount();

  if (count === 0) {
    console.log("[SeedEmployees] No employees found. Seeding initial data...");
    SEED_EMPLOYEES.forEach((emp) => {
      addEmployee(emp);
    });
    console.log(`[SeedEmployees] Seeded ${SEED_EMPLOYEES.length} employees`);
  } else {
    console.log(`[SeedEmployees] ${count} employees already exist. Skipping seed.`);
  }
}
