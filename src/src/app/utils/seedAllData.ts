/**
 * seedAllData — Complete 3-Month Historic Dataset
 * Covers EVERY screen in the left navigation.
 *
 * Replaces seedHistoricData.ts + seedAccountingData.ts with one unified file.
 *
 * DataService key → localStorage key mapping (buildKey convention):
 *   DataService.get("EMPLOYEES", cityId) → cleancar_CITY-SURAT_employees
 *   DataService.get("CUSTOMERS", cityId) → cleancar_CITY-SURAT_customers
 *   etc.
 *
 * Raw keys (not via DataService):
 *   cleancar_accounting_entries  (accountingEntryService)
 *   cleancar_journal_entries     (accountingEntryService)
 *   cleancar_ledger_masters      (accountingEntryService)
 *   cleancar_complaints          (customerCareExecutiveService)
 *   EMPLOYEE_DATABASE_RECORDS    (auth system)
 */

const SEED_FLAG = "ALL_DATA_SEEDED_V9";

// ─── Shared helpers ───────────────────────────────────────────────────────────
const NOW   = new Date().toISOString();
const FY    = "25-26";
const MONTHS = [2, 3, 4] as const;
const MONTH_DAYS: Record<number, number> = { 2: 28, 3: 31, 4: 30 };
const MONTH_NAMES = ["","","Feb","Mar","Apr","May"];

function d(m: number, day: number) {
  return `2026-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}
function iso(m: number, day: number, h = 9) {
  return `2026-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}T${String(h).padStart(2,"0")}:00:00.000Z`;
}
function writeByCityId(baseKey: string, records: any[]) {
  const sur = records.filter(r => (r.cityId || "CITY-SURAT") === "CITY-SURAT");
  const mum = records.filter(r => r.cityId === "CITY-MUMBAI");
  localStorage.setItem(`cleancar_${baseKey}`,             JSON.stringify(records));
  localStorage.setItem(`cleancar_CITY-SURAT_${baseKey}`,  JSON.stringify(sur));
  localStorage.setItem(`cleancar_CITY-MUMBAI_${baseKey}`, JSON.stringify(mum));
}

// ─── Salary helper ────────────────────────────────────────────────────────────
function sal(gross: number) {
  const basic   = Math.round(gross * 0.4);
  const hra     = Math.round(basic * 0.5);
  const conv    = 1600;
  const special = Math.max(0, gross - basic - hra - conv);
  const pf      = Math.min(Math.round(basic * 0.12), 1800);
  const esic    = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const pt      = gross >= 12000 ? 200 : gross >= 9000 ? 150 : 80;
  const net     = gross - pf - esic - pt;
  return { gross, basic, hra, conv, special, pf, esic, pt, net,
           empf: pf, emesic: gross <= 21000 ? Math.round(gross * 0.0325) : 0 };
}

const PWD = "RGVtb0AxMjM0Q0MzNjBTQUxU";
const BASE_EMP = {
  tempIdAssignedDate: "2025-10-01", conversionDueDate: "2025-10-08",
  daysInTempStatus: 0, isOverdue: false, employmentStage: "Permanent",
  skillLevel: "Skilled", fatherName: "Demo Father",
  dob: "1992-01-01", gender: "Male",
  permanentAddress: "Demo Address, Surat", currentAddress: "Demo Address, Surat",
  emergencyContact: "9000099999", employeeType: "Full Time",
  dateOfJoining: "2025-10-01", probationPeriod: "3 months",
  status: "Active", onboardingPasswordSet: true, accountStatus: "active",
  failedLoginAttempts: 0, passwordHash: PWD,
};

// ═════════════════════════════════════════════════════════════════════════════
// 1. EMPLOYEES — 55 staff, Surat + Mumbai
// ═════════════════════════════════════════════════════════════════════════════
const EMPLOYEES_RAW: any[] = [
  // ── SURAT MANAGEMENT ──────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-SA-01",  loginMobile:"9100000001", mobile:"9100000001", fullName:"Rajesh Patel",    firstName:"Rajesh",   lastName:"Patel",    email:"rajesh@cleancar.com",   designation:"Super Admin",         department:"Management",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Board",       pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(90000) },
  { ...BASE_EMP, id:"EDB-ADM-01", loginMobile:"9100000002", mobile:"9100000002", fullName:"Kavita Shah",    firstName:"Kavita",   lastName:"Shah",   gender:"Female", email:"kavita@cleancar.com",   designation:"Admin",               department:"Management",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Rajesh Patel",pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(65000) },
  { ...BASE_EMP, id:"EDB-CM-SUR", loginMobile:"9100000003", mobile:"9100000003", fullName:"Amit Desai",     firstName:"Amit",     lastName:"Desai",    email:"amit@cleancar.com",     designation:"City Manager",         department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Rajesh Patel",pinCodes:["395001","395002","395005","395007"], dateOfJoining:"2025-08-01", ...sal(72000) },
  { ...BASE_EMP, id:"EDB-CLM-SUR1",loginMobile:"9100000004",mobile:"9100000004",fullName:"Priya Mehta",    firstName:"Priya",    lastName:"Mehta",  gender:"Female", email:"priya@cleancar.com",    designation:"Cluster Manager",     department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001","395002"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-SOM-SUR1",loginMobile:"9100000005",mobile:"9100000005",fullName:"Deepak Thakkar", firstName:"Deepak",   lastName:"Thakkar",  email:"deepak@cleancar.com",   designation:"Sr Operations Manager",department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Priya Mehta", pinCodes:["395001","395002"], dateOfJoining:"2025-09-15", ...sal(47000) },
  { ...BASE_EMP, id:"EDB-OM-SUR1", loginMobile:"9100000006",mobile:"9100000006",fullName:"Neha Rana",      firstName:"Neha",     lastName:"Rana",   gender:"Female", email:"neha@cleancar.com",     designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Deepak Thakkar",pinCodes:["395001"], dateOfJoining:"2025-10-01", ...sal(40000) },
  { ...BASE_EMP, id:"EDB-OM-SUR2", loginMobile:"9100000007",mobile:"9100000007",fullName:"Ravi Pandya",    firstName:"Ravi",     lastName:"Pandya",   email:"ravi@cleancar.com",     designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Deepak Thakkar",pinCodes:["395002"], dateOfJoining:"2025-10-01", ...sal(40000) },
  // SURAT TEAM 1 — Adajan (395001)
  { ...BASE_EMP, id:"EDB-SUP-SUR1",loginMobile:"9100000008",mobile:"9100000008",fullName:"Harish Solanki", firstName:"Harish",   lastName:"Solanki",  email:"harish@cleancar.com",   designation:"Supervisor",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Neha Rana",   pinCodes:["395001"], dateOfJoining:"2025-10-15", ...sal(28000) },
  { ...BASE_EMP, id:"EDB-CW-SUR1A",loginMobile:"9100000009",mobile:"9100000009",fullName:"Mahesh Bharwad", firstName:"Mahesh",   lastName:"Bharwad",  email:"mahesh1@cleancar.com",  designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-01", ...sal(16000), skillLevel:"Semi-Skilled" },
  { ...BASE_EMP, id:"EDB-CW-SUR1B",loginMobile:"9100000010",mobile:"9100000010",fullName:"Ramesh Koli",    firstName:"Ramesh",   lastName:"Koli",     email:"ramesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-15",...sal(14500),skillLevel:"Unskilled" },
  { ...BASE_EMP, id:"EDB-CW-SUR1C",loginMobile:"9100000011",mobile:"9100000011",fullName:"Sunil Thakor",   firstName:"Sunil",    lastName:"Thakor",   email:"sunil@cleancar.com",    designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Harish Solanki",pinCodes:["395001"],dateOfJoining:"2025-11-01", ...sal(17000) },
  // SURAT TEAM 2 — Vesu (395007)
  { ...BASE_EMP, id:"EDB-SUP-SUR2",loginMobile:"9100000012",mobile:"9100000012",fullName:"Bhavesh Modi",   firstName:"Bhavesh",  lastName:"Modi",     email:"bhavesh@cleancar.com",  designation:"Supervisor",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Ravi Pandya", pinCodes:["395007"], dateOfJoining:"2025-10-15", ...sal(27000) },
  { ...BASE_EMP, id:"EDB-CW-SUR2A",loginMobile:"9100000013",mobile:"9100000013",fullName:"Nilesh Chauhan", firstName:"Nilesh",   lastName:"Chauhan",  email:"nilesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-11-01", ...sal(16500) },
  { ...BASE_EMP, id:"EDB-CW-SUR2B",loginMobile:"9100000014",mobile:"9100000014",fullName:"Dinesh Parmar",  firstName:"Dinesh",   lastName:"Parmar",   email:"dinesh@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-11-15",...sal(15000),status:"On Leave" },
  { ...BASE_EMP, id:"EDB-CW-SUR2C",loginMobile:"9100000015",mobile:"9100000015",fullName:"Arvind Vasava",  firstName:"Arvind",   lastName:"Vasava",   email:"arvind@cleancar.com",   designation:"Car Washer",          department:"Operations",     workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Bhavesh Modi",pinCodes:["395007"],  dateOfJoining:"2025-12-15",...sal(13500),skillLevel:"Unskilled" },
  // SURAT SUPPORT
  { ...BASE_EMP, id:"EDB-TSM-SUR1",loginMobile:"9100000016",mobile:"9100000016",fullName:"Sanjay Kapoor",  firstName:"Sanjay",   lastName:"Kapoor",   email:"sanjay@cleancar.com",   designation:"TSM",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001","395002","395007"], dateOfJoining:"2025-09-01", ...sal(35000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR1",loginMobile:"9100000017",mobile:"9100000017",fullName:"Pooja Sharma",   firstName:"Pooja",    lastName:"Sharma", gender:"Female", email:"pooja@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Sanjay Kapoor",pinCodes:["395001","395002"],dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR2",loginMobile:"9100000018",mobile:"9100000018",fullName:"Ankit Trivedi",  firstName:"Ankit",    lastName:"Trivedi",  email:"ankit@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Sanjay Kapoor",pinCodes:["395005","395007"],dateOfJoining:"2025-10-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-CCE-SUR1",loginMobile:"9100000019",mobile:"9100000019",fullName:"Meera Jain",     firstName:"Meera",    lastName:"Jain",   gender:"Female", email:"meera@cleancar.com",    designation:"CCE",                 department:"Customer Care",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001","395002","395007"], dateOfJoining:"2025-09-15", ...sal(20000) },
  { ...BASE_EMP, id:"EDB-HR-SUR1",  loginMobile:"9100000020",mobile:"9100000020",fullName:"Rekha Solanki",  firstName:"Rekha",    lastName:"Solanki",gender:"Female", email:"rekha@cleancar.com",    designation:"HR",                  department:"Human Resources",workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-ACC-SUR1", loginMobile:"9100000021",mobile:"9100000021",fullName:"Chirag Doshi",   firstName:"Chirag",   lastName:"Doshi",    email:"chirag@cleancar.com",   designation:"Accounts",            department:"Finance",        workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Kavita Shah", pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(32000) },
  { ...BASE_EMP, id:"EDB-SM-SUR1",  loginMobile:"9100000022",mobile:"9100000022",fullName:"Nayan Desai",    firstName:"Nayan",    lastName:"Desai",    email:"nayan@cleancar.com",    designation:"Store Manager",       department:"Inventory",      workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",  pinCodes:["395001"], dateOfJoining:"2025-09-01", ...sal(28000) },
  // ── SALES HEAD & SALES MANAGER (Surat) ───────────────────────────────────
  { ...BASE_EMP, id:"EDB-SH-SUR1",   loginMobile:"9100000023",mobile:"9100000023",fullName:"Priya Nair",     firstName:"Priya",    lastName:"Nair",   gender:"Female", email:"priya.nair@cleancar.com",    designation:"Sales Head",    department:"Sales",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",   pinCodes:["395001","395002","395005","395007"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-SH-SUR2",   loginMobile:"9100000024",mobile:"9100000024",fullName:"Ravi Shah",      firstName:"Ravi",     lastName:"Shah",                    email:"ravi.shah@cleancar.com",     designation:"Sales Head",    department:"Sales",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Amit Desai",   pinCodes:["395001","395005","395007"],          dateOfJoining:"2025-09-15", ...sal(50000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR1", loginMobile:"9100000025",mobile:"9100000025",fullName:"Nayan Joshi",    firstName:"Nayan",    lastName:"Joshi",                   email:"nayan.joshi@cleancar.com",   designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Priya Nair",   pinCodes:["395001","395002"],                   dateOfJoining:"2025-10-01", ...sal(32000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR2", loginMobile:"9100000026",mobile:"9100000026",fullName:"Kalpesh Rathod", firstName:"Kalpesh",  lastName:"Rathod",                  email:"kalpesh.rathod@cleancar.com",designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Priya Nair",   pinCodes:["395005","395007"],                   dateOfJoining:"2025-10-15", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR3", loginMobile:"9100000027",mobile:"9100000027",fullName:"Amit Trivedi",   firstName:"Amit",     lastName:"Trivedi",                 email:"amit.trivedi@cleancar.com",  designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT",  city:"Surat",  reportingManager:"Ravi Shah",    pinCodes:["395001","395009"],                   dateOfJoining:"2025-11-01", ...sal(29000) },
  // ── SALES HEAD & SALES MANAGER (Surat) ─────────────────────────────────────
  { ...BASE_EMP, id:"EDB-SH-SUR1",   loginMobile:"9100000023",mobile:"9100000023",fullName:"Priya Nair",     firstName:"Priya",   lastName:"Nair",   gender:"Female",email:"priya.nair@cleancar.com",    designation:"Sales Head",    department:"Sales",  workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",   pinCodes:["395001","395002","395005","395007"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-SH-SUR2",   loginMobile:"9100000024",mobile:"9100000024",fullName:"Ravi Shah",      firstName:"Ravi",    lastName:"Shah",                  email:"ravi.shah@cleancar.com",     designation:"Sales Head",    department:"Sales",  workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",   pinCodes:["395001","395005","395007"],          dateOfJoining:"2025-09-15", ...sal(50000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR1", loginMobile:"9100000025",mobile:"9100000025",fullName:"Nayan Joshi",    firstName:"Nayan",   lastName:"Joshi",                  email:"nayan.joshi@cleancar.com",   designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Priya Nair",   pinCodes:["395001","395002"],                   dateOfJoining:"2025-10-01", ...sal(32000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR2", loginMobile:"9100000026",mobile:"9100000026",fullName:"Kalpesh Rathod", firstName:"Kalpesh", lastName:"Rathod",                 email:"kalpesh.rathod@cleancar.com",designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Priya Nair",   pinCodes:["395005","395007"],                   dateOfJoining:"2025-10-15", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-SMGR-SUR3", loginMobile:"9100000027",mobile:"9100000027",fullName:"Amit Trivedi",   firstName:"Amit",    lastName:"Trivedi",                email:"amit.trivedi@cleancar.com",  designation:"Sales Manager", department:"Sales",  workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Ravi Shah",    pinCodes:["395001","395009"],                   dateOfJoining:"2025-11-01", ...sal(29000) },
  // ── MUMBAI ────────────────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-CM-MUM",   loginMobile:"9200000001",mobile:"9200000001",fullName:"Ananya Singh",   firstName:"Ananya",   lastName:"Singh",  gender:"Female", email:"ananya@cleancar.com",   designation:"City Manager",        department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Rajesh Patel",pinCodes:["400001","400002","400003"], dateOfJoining:"2025-08-15", ...sal(75000) },
  { ...BASE_EMP, id:"EDB-OM-MUM1",  loginMobile:"9200000002",mobile:"9200000002",fullName:"Kiran More",     firstName:"Kiran",    lastName:"More",   gender:"Female", email:"kiran@cleancar.com",    designation:"Operations Manager",  department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],   dateOfJoining:"2025-09-15", ...sal(42000) },
  { ...BASE_EMP, id:"EDB-SUP-MUM1", loginMobile:"9200000003",mobile:"9200000003",fullName:"Santosh Yadav",  firstName:"Santosh",  lastName:"Yadav",    email:"santosh@cleancar.com",  designation:"Supervisor",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Kiran More",  pinCodes:["400001"],           dateOfJoining:"2025-10-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1A", loginMobile:"9200000004",mobile:"9200000004",fullName:"Ajay Gupta",     firstName:"Ajay",     lastName:"Gupta",    email:"ajay@cleancar.com",     designation:"Car Washer",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",pinCodes:["400001"],          dateOfJoining:"2025-11-01", ...sal(18000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1B", loginMobile:"9200000005",mobile:"9200000005",fullName:"Raju Shinde",    firstName:"Raju",     lastName:"Shinde",   email:"raju@cleancar.com",     designation:"Car Washer",          department:"Operations",     workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",pinCodes:["400001"],          dateOfJoining:"2025-11-15",...sal(16000),skillLevel:"Semi-Skilled" },
  { ...BASE_EMP, id:"EDB-TSM-MUM1", loginMobile:"9200000006",mobile:"9200000006",fullName:"Vikram Shetty",  firstName:"Vikram",   lastName:"Shetty",   email:"vikram@cleancar.com",   designation:"TSM",                 department:"Sales",          workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],  dateOfJoining:"2025-09-01", ...sal(36000) },
  { ...BASE_EMP, id:"EDB-TSE-MUM1", loginMobile:"9200000007",mobile:"9200000007",fullName:"Swati Parab",    firstName:"Swati",    lastName:"Parab",  gender:"Female", email:"swati@cleancar.com",    designation:"TSE",                 department:"Sales",          workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Vikram Shetty",pinCodes:["400001","400002"], dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-CCE-MUM1", loginMobile:"9200000008",mobile:"9200000008",fullName:"Nisha Kapoor",   firstName:"Nisha",    lastName:"Kapoor", gender:"Female", email:"nisha@cleancar.com",    designation:"CCE",                 department:"Customer Care",  workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001","400002"],  dateOfJoining:"2025-09-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-ACC-MUM1", loginMobile:"9200000009",mobile:"9200000009",fullName:"Suhas Kadam",    firstName:"Suhas",    lastName:"Kadam",    email:"suhas@cleancar.com",    designation:"Accounts",            department:"Finance",        workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001"],           dateOfJoining:"2025-09-01", ...sal(33000) },
  { ...BASE_EMP, id:"EDB-HR-MUM1",  loginMobile:"9200000010",mobile:"9200000010",fullName:"Shilpa Jadhav",  firstName:"Shilpa",   lastName:"Jadhav", gender:"Female", email:"shilpa@cleancar.com",   designation:"HR",                  department:"Human Resources",workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",pinCodes:["400001"],           dateOfJoining:"2025-09-01", ...sal(31000) },
];

// Map to Employee interface (employeeId, phone, role, joiningDate)
const EMPLOYEES = EMPLOYEES_RAW.map(e => ({
  ...e,
  employeeId: e.id,
  phone:      e.mobile,
  role:       e.designation,
  joiningDate: e.dateOfJoining,
  cityId:     e.workLocation,
}));

const SUR_EMPS = EMPLOYEES.filter(e => e.cityId === "CITY-SURAT");
const MUM_EMPS = EMPLOYEES.filter(e => e.cityId === "CITY-MUMBAI");
const WASHER_IDS_SUR = SUR_EMPS.filter(e => e.designation === "Car Washer").map(e => e.id);
const WASHER_IDS_MUM = MUM_EMPS.filter(e => e.designation === "Car Washer").map(e => e.id);

// ═════════════════════════════════════════════════════════════════════════════
// 2. SALARY STRUCTURES — needed by Payroll screens
// ═════════════════════════════════════════════════════════════════════════════
const SALARY_STRUCTURES: any[] = [
  { structureId:"SS-WASHER-SUR",     name:"Car Washer - Surat",      description:"Standard washer structure",   type:"per_car",  components:{ basic:6400,  hra:3200,  allowances:1600, deductions:1200 }, applicableRoles:["Car Washer"],         cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-SUPERVISOR-SUR", name:"Supervisor - Surat",      description:"Supervisor fixed + incentive",type:"hybrid",   components:{ basic:11200, hra:5600,  allowances:1600, deductions:2000 }, applicableRoles:["Supervisor"],         cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-OM-SUR",        name:"Operations Manager - Surat",description:"OM fixed salary",            type:"fixed",    components:{ basic:16000, hra:8000,  allowances:1600, deductions:3200 }, applicableRoles:["Operations Manager","Sr Operations Manager"], cityId:"CITY-SURAT", createdAt:NOW },
  { structureId:"SS-TSE-SUR",       name:"TSE - Surat",              description:"TSE fixed + commission",     type:"hybrid",   components:{ basic:8800,  hra:4400,  allowances:1600, deductions:1600 }, applicableRoles:["TSE"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-TSM-SUR",       name:"TSM - Surat",              description:"TSM fixed + commission",     type:"hybrid",   components:{ basic:14000, hra:7000,  allowances:1600, deductions:2800 }, applicableRoles:["TSM"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-MGMT-SUR",      name:"Management - Surat",       description:"Senior management fixed",    type:"fixed",    components:{ basic:28800, hra:14400, allowances:1600, deductions:5600 }, applicableRoles:["City Manager","Cluster Manager","Admin","Super Admin","HR","Accounts","Store Manager"], cityId:"CITY-SURAT", createdAt:NOW },
  { structureId:"SS-CCE-SUR",       name:"CCE - Surat",              description:"CCE fixed",                  type:"fixed",    components:{ basic:8000,  hra:4000,  allowances:1600, deductions:1400 }, applicableRoles:["CCE"],               cityId:"CITY-SURAT",  createdAt:NOW },
  { structureId:"SS-WASHER-MUM",    name:"Car Washer - Mumbai",      description:"Standard washer structure",   type:"per_car",  components:{ basic:7200,  hra:3600,  allowances:1600, deductions:1400 }, applicableRoles:["Car Washer"],         cityId:"CITY-MUMBAI", createdAt:NOW },
  { structureId:"SS-MGMT-MUM",      name:"Management - Mumbai",      description:"Senior management fixed",    type:"fixed",    components:{ basic:30000, hra:15000, allowances:1600, deductions:5800 }, applicableRoles:["City Manager","Operations Manager","HR","Accounts","CCE","TSM","TSE"], cityId:"CITY-MUMBAI", createdAt:NOW },
  { structureId:"SS-SUPERVISOR-MUM",name:"Supervisor - Mumbai",      description:"Supervisor fixed + incentive",type:"hybrid",  components:{ basic:12000, hra:6000,  allowances:1600, deductions:2200 }, applicableRoles:["Supervisor"],         cityId:"CITY-MUMBAI", createdAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 3. INCENTIVE PLANS — needed by Incentives, Payroll, Analytics screens
// ═════════════════════════════════════════════════════════════════════════════
const INCENTIVE_PLANS: any[] = [
  { planId:"IP-PER-CAR-SUR",    name:"Per Car Incentive — Surat",    type:"per_car",       description:"₹15 per car washed above daily quota", rules:{ perCarAmount:15 },                 applicableRoles:["Car Washer"],  payoutCycle:"monthly", minPayout:500,  maxPayout:5000,  isActive:true, cityId:"CITY-SURAT",  city:"Surat",  createdAt:NOW },
  { planId:"IP-TARGET-TSE-SUR", name:"TSE Target Incentive — Surat", type:"target_based",  description:"Monthly subscription target",          rules:{ targetCars:15, targetAmount:15000, achievementBonus:1500 }, applicableRoles:["TSE"], payoutCycle:"monthly", minPayout:0, maxPayout:8000, isActive:true, cityId:"CITY-SURAT", city:"Surat", createdAt:NOW },
  { planId:"IP-TARGET-TSM-SUR", name:"TSM Target Incentive — Surat", type:"target_based",  description:"Monthly team target",                  rules:{ targetCars:30, targetAmount:30000, achievementBonus:3000 }, applicableRoles:["TSM"], payoutCycle:"monthly", minPayout:0, maxPayout:15000, isActive:true, cityId:"CITY-SURAT", city:"Surat", createdAt:NOW },
  { planId:"IP-REV-SHARE-SUR",  name:"Supervisor Revenue Share — Surat", type:"revenue_share", description:"3% of team revenue",              rules:{ revenueSharePercentage:3 },           applicableRoles:["Supervisor"],  payoutCycle:"monthly", minPayout:1000, maxPayout:8000, isActive:true, cityId:"CITY-SURAT",  city:"Surat",  createdAt:NOW },
  { planId:"IP-PER-CAR-MUM",    name:"Per Car Incentive — Mumbai",   type:"per_car",       description:"₹18 per car washed above daily quota", rules:{ perCarAmount:18 },                 applicableRoles:["Car Washer"],  payoutCycle:"monthly", minPayout:500,  maxPayout:6000,  isActive:true, cityId:"CITY-MUMBAI", city:"Mumbai", createdAt:NOW },
  { planId:"IP-TARGET-TSE-MUM", name:"TSE Target Incentive — Mumbai",type:"target_based",  description:"Monthly subscription target",          rules:{ targetCars:15, targetAmount:18000, achievementBonus:2000 }, applicableRoles:["TSE"], payoutCycle:"monthly", minPayout:0, maxPayout:10000, isActive:true, cityId:"CITY-MUMBAI", city:"Mumbai", createdAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 4. PAYROLL RUNS — Feb / Mar / Apr 2026
// ═════════════════════════════════════════════════════════════════════════════
const PAYROLL_RUNS: any[] = [];
for (const emp of EMPLOYEES) {
  for (const m of MONTHS) {
    const td    = MONTH_DAYS[m];
    const lop   = (emp.id === "EDB-CW-SUR1B" && m === 2) ? 3
                : (emp.id === "EDB-CW-SUR2B") ? 5 : 0;
    const present = td - lop;
    const adj   = Math.round(emp.gross * present / td);
    const pf    = Math.min(Math.round(adj * 0.4 * 0.12), 1800);
    const esic  = adj <= 21000 ? Math.round(adj * 0.0075) : 0;
    const pt    = present >= 20 ? (adj >= 12000 ? 200 : adj >= 9000 ? 150 : 80) : 0;
    const incv  = emp.designation === "Car Washer" && m === 3 ? 1200
                : emp.designation === "Supervisor" && m === 4 ? 2500
                : ["TSE","TSM"].includes(emp.designation) ? 3000 + m * 200 : 0;
    const net   = adj + incv - pf - esic - pt;
    PAYROLL_RUNS.push({
      payrollId:       `PR-${emp.id}-2026-${m}`,
      employeeId:      emp.id,
      month:           `2026-${String(m).padStart(2,"0")}`,
      period:          { startDate: d(m,1), endDate: d(m, td) },
      cityId:          emp.cityId || "CITY-SURAT",
      baseSalary:      adj,
      incentiveAmount: incv,
      addOnEarnings:   0,
      allowances:      0,
      grossSalary:     adj + incv,
      pf, esic, pt,
      tds: 0, advances: 0, penalties: 0,
      totalDeductions: pf + esic + pt,
      netSalary:       net,
      presentDays:     present,
      absentDays:      lop,
      lopDays:         lop,
      workingDays:     td,
      status:          m < 4 ? "Paid" : "Processed",
      createdAt:       new Date(2026, m, 5).toISOString(),
      updatedAt:       new Date(2026, m, 5).toISOString(),
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. EMPLOYEE INCENTIVES (individual records per employee per month)
// ═════════════════════════════════════════════════════════════════════════════
const EMPLOYEE_INCENTIVES: any[] = [];
for (const emp of EMPLOYEES) {
  for (const m of MONTHS) {
    const isSur = emp.cityId === "CITY-SURAT";
    if (emp.designation === "Car Washer") {
      const washed = 80 + (m * 5);
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: isSur ? "IP-PER-CAR-SUR" : "IP-PER-CAR-MUM",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target: 90, achieved: washed, achievementPercentage: Math.round(washed/90*100),
        calculatedAmount: washed * (isSur ? 15 : 18),
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    } else if (["TSE","TSM"].includes(emp.designation)) {
      const target  = emp.designation === "TSM" ? 30 : 15;
      const achieved = target - 2 + (m % 4);
      const pct     = Math.round(achieved / target * 100);
      const base    = emp.designation === "TSM" ? 8000 : 4000;
      const earned  = pct >= 100 ? Math.round(base*1.25) : pct >= 80 ? base : pct >= 60 ? Math.round(base*0.6) : 0;
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: isSur ? (emp.designation === "TSM" ? "IP-TARGET-TSM-SUR" : "IP-TARGET-TSE-SUR")
                      : "IP-TARGET-TSE-MUM",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target, achieved, achievementPercentage: pct,
        calculatedAmount: earned,
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    } else if (emp.designation === "Supervisor") {
      const teamRev = 85000 + m * 5000;
      EMPLOYEE_INCENTIVES.push({
        employeeId: emp.id, cityId: emp.cityId,
        planId: "IP-REV-SHARE-SUR",
        currentPeriod: { startDate: d(m,1), endDate: d(m, MONTH_DAYS[m]) },
        target: 85000, achieved: teamRev, achievementPercentage: 100,
        calculatedAmount: Math.round(teamRev * 0.03),
        status: m < 4 ? "Paid" : "Approved",
        createdAt: d(m,1) + "T00:00:00.000Z",
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. ATTENDANCE RECORDS — each washer/supervisor, every working day
// ═════════════════════════════════════════════════════════════════════════════
const ATTENDANCE_RECORDS: any[] = [];
const FIELD_STAFF = EMPLOYEES.filter(e =>
  ["Car Washer","Supervisor","Operations Manager","Sr Operations Manager"].includes(e.designation)
);
for (const emp of FIELD_STAFF) {
  for (const m of MONTHS) {
    for (let day = 1; day <= MONTH_DAYS[m]; day++) {
      const dateStr = d(m, day);
      const dow     = new Date(2026, m-1, day).getDay();
      if (dow === 0) {
        ATTENDANCE_RECORDS.push({ attendanceId:`ATT-${emp.id}-${dateStr}`, employeeId:emp.id, cityId:emp.cityId, date:dateStr, status:"Week Off", createdAt:NOW });
        continue;
      }
      const isLeave  = (emp.id === "EDB-CW-SUR1B" && m===2 && day<=3)
                    || (emp.id === "EDB-CW-SUR2B" && [5,6,7,8,9].includes(day));
      const isLate   = !isLeave && day % 7 === 0;
      ATTENDANCE_RECORDS.push({
        attendanceId: `ATT-${emp.id}-${dateStr}`,
        employeeId:   emp.id,
        cityId:       emp.cityId,
        date:         dateStr,
        status:       isLeave ? "Leave" : isLate ? "Late" : "Present",
        checkInTime:  isLeave ? undefined : isLate ? "09:35:00" : "09:00:00",
        checkOutTime: isLeave ? undefined : "18:00:00",
        hoursWorked:  isLeave ? 0 : 9,
        lateMinutes:  isLate ? 35 : 0,
        workMinutes:  isLeave ? 0 : 540,
        overtimeMinutes: 0,
        flag: "NONE",
        createdAt:    NOW,
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. CUSTOMERS — 200 records (100 Surat + 100 Mumbai)
// ═════════════════════════════════════════════════════════════════════════════
const AREAS_SUR  = ["Adajan","Vesu","Dumas","Althan","Piplod","Varachha","Katargam"];
const AREAS_MUM  = ["Bandra","Andheri","Dadar","Thane","Borivali","Malad","Powai"];
const PINS_SUR   = ["395001","395005","395006","395007","395002","395003","395004"];
const PINS_MUM   = ["400001","400002","400003","400004","400005","400006","400007"];
const VEHICLES   = ["Maruti Baleno","Honda City","Hyundai Creta","Tata Nexon","Toyota Fortuner","Maruti Swift","Honda Amaze","Kia Seltos"];

const CUSTOMERS: any[] = [];

// Real Indian first and last names for authentic customer data
const FIRST_NAMES = [
  "Amit","Priya","Rahul","Sneha","Rajesh","Kavita","Vikram","Meena","Suresh","Anita",
  "Deepak","Pooja","Mahesh","Sunita","Sanjay","Rekha","Anil","Geeta","Vinod","Usha",
  "Ravi","Nita","Ajay","Seema","Rohit","Sita","Nitin","Asha","Kiran","Lata",
  "Hitesh","Bhavna","Jignesh","Hetal","Chirag","Minal","Dhaval","Pallavi","Mitesh","Komal",
  "Yash","Riya","Dev","Isha","Arjun","Nisha","Veer","Tara","Jay","Pari",
  "Sunil","Radha","Santosh","Kamla","Mohan","Sarita","Gopal","Pushpa","Satish","Savita",
  "Milind","Varsha","Shirish","Madhuri","Sachin","Jyoti","Nikhil","Swati","Manish","Smita",
  "Vijay","Shobha","Girish","Sushma","Aakash","Rashmi","Vishal","Anjali","Manoj","Sunanda",
  "Harish","Leela","Bharat","Veena","Pramod","Nalini","Ashok","Sudha","Ramesh","Indira",
  "Kamlesh","Hansa","Naresh","Sarla","Dhiraj","Mamta","Bhavesh","Vimla","Jayesh","Daksha",
];
const LAST_NAMES_SUR = [
  "Patel","Shah","Desai","Mehta","Modi","Joshi","Trivedi","Pandya","Dave","Bhatt",
  "Parmar","Chauhan","Solanki","Rana","Thakkar","Vyas","Nayak","Kapadia","Gandhi","Shukla",
  "Doshi","Kothari","Soni","Parekh","Vakil","Majmudar","Amin","Banker","Contractor","Diwan",
  "Rathod","Vaghela","Jadeja","Zala","Gohil","Makwana","Damor","Baria","Tadvi","Vasava",
  "Agarwal","Mittal","Gupta","Jain","Khandelwal","Maheshwari","Singhvi","Oswal","Lodha","Saraf",
];
const LAST_NAMES_MUM = [
  "Sharma","Singh","Kumar","Gupta","Verma","Mishra","Yadav","Tiwari","Pandey","Dubey",
  "Patil","Deshmukh","Jadhav","More","Shinde","Bhosale","Chavan","Pawar","Kamble","Gaikwad",
  "Nair","Menon","Pillai","Iyer","Krishnan","Subramaniam","Rajan","Gopal","Venkat","Chandran",
  "D'souza","Fernandes","Pereira","Rodrigues","Lobo","Gomes","Sequeira","Braganza","Noronha","Dias",
  "Sheikh","Ansari","Khan","Siddiqui","Patel","Shaikh","Qureshi","Merchant","Kapoor","Malhotra",
];
const BRANDS_SUR = ["Maruti","Hyundai","Tata","Honda","Toyota","Renault","Kia","Skoda","MG","Citroen"];
const BRANDS_MUM = ["Maruti","Mahindra","Hyundai","Toyota","Honda","Tata","Volkswagen","Kia","Nissan","Ford"];
const MODELS_BY_CAT: Record<string,string[]> = {
  SUV:      ["Creta","Nexon","Venue","XUV300","Seltos","Brezza","Hector","Taigun","Sonet","Carens"],
  Sedan:    ["City","Verna","Ciaz","Slavia","Virtus","Dzire","Amaze","Tigor","Rapid","Aura"],
  Hatchback:["Swift","Baleno","i20","Altroz","Punch","Tiago","WagonR","Celerio","Glanza","Jazz"],
};

function makeCust(i: number, city: "Surat"|"Mumbai") {
  const isMum = city === "Mumbai";
  const areas = isMum ? AREAS_MUM : AREAS_SUR;
  const pins  = isMum ? PINS_MUM  : PINS_SUR;
  const cid   = isMum ? "CITY-MUMBAI" : "CITY-SURAT";
  const idx   = i % areas.length;
  const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
  const lastNames = isMum ? LAST_NAMES_MUM : LAST_NAMES_SUR;
  const lastName  = lastNames[i % lastNames.length];
  const cat = i%3===0?"SUV":i%3===1?"Sedan":"Hatchback";
  const brand = isMum ? BRANDS_MUM[i%BRANDS_MUM.length] : BRANDS_SUR[i%BRANDS_SUR.length];
  const model = MODELS_BY_CAT[cat][i % MODELS_BY_CAT[cat].length];
  const prefix = isMum ? "MH04" : "GJ05";
  const regSuffix = String.fromCharCode(65+(i%26)) + String.fromCharCode(65+((i+3)%26)) + String(1000+i).slice(-4);
  return {
    customerId: `CUST-${city.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,"0")}`,
    firstName,
    lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i+1}@example.com`,
    phone: `${isMum?"9900":"9800"}${String(100000+i).slice(-6)}`,
    address: { line1: `${100+i} ${["Main Road","Society Block","Residency","Heights","Park"][i%5]}`, area: areas[idx], city, pinCode: pins[idx] },
    vehicleDetails: { category: cat, brand, model, color:["White","Silver","Grey","Black","Red"][i%5], registrationNumber:`${prefix}${regSuffix}` },
    leadSource: ["Walk-in","WhatsApp","Google Ads","Referral"][i%4],
    status: i%10===9 ? "Churned" : "Active",
    cityId: cid,
    createdAt: new Date(2026, 1+(i%3), 1).toISOString(),
    updatedAt: new Date(2026, 1+(i%3), 1).toISOString(),
    tags: [], notes: "",
  };
}
for (let i = 0; i < 100; i++) CUSTOMERS.push(makeCust(i, "Surat"));
for (let i = 0; i < 100; i++) CUSTOMERS.push(makeCust(i, "Mumbai"));

// ═════════════════════════════════════════════════════════════════════════════
// 8. LEADS — 120 leads (40 per month × 2 cities)
// ═════════════════════════════════════════════════════════════════════════════
const LEAD_SOURCES = ["Walk-in","WhatsApp","Google Ads","Referral","Cold Call","Website","Instagram"];
const LEAD_STAGES  = ["New","Contacted","Demo Scheduled","Demo Done","Converted","Lost"];
const LEADS: any[] = [];
let leadIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid  = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  const tse  = city === "Surat" ? "EDB-TSE-SUR1" : "EDB-TSE-MUM1";
  const areas = city === "Surat" ? AREAS_SUR : AREAS_MUM;
  const pins  = city === "Surat" ? PINS_SUR  : PINS_MUM;
  for (const m of MONTHS) {
    for (let i = 0; i < 80; i++) {
      const stage = LEAD_STAGES[i % LEAD_STAGES.length];
      LEADS.push({
        leadId:     `LEAD-${city.slice(0,3).toUpperCase()}-${String(leadIdx++).padStart(3,"0")}`,
        name:       `Lead ${city.slice(0,3)} ${leadIdx}`,
        mobile:     `98765${String(43200+leadIdx).slice(-5)}`,
        email:      `lead${leadIdx}@example.com`,
        area:       areas[i%7],
        pinCode:    pins[i%7],
        source:     LEAD_SOURCES[i%LEAD_SOURCES.length],
        stage,
        status:     stage,
        assignedTo: tse,
        cityId:     cid, city,
        vehicleCategory: i%3===0?"SUV":i%3===1?"Sedan":"Hatchback",
        planOfInterest: ["SHINE","PROTECT","ELITE"][i%3],
        createdAt:  new Date(2026,m-1,1+(i%28)).toISOString(),
        followUpDate: new Date(2026,m-1,5+(i%20)).toISOString(),
        convertedAt: stage==="Converted" ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        lostReason: stage==="Lost" ? ["Price too high","Not interested","Competitor","Area not serviceable"][i%4] : undefined,
        notes: `Status: ${stage}.`,
      });
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. DEMOS — needed by TSE App, Supervisor, Demo Management screens
// ═════════════════════════════════════════════════════════════════════════════
const DEMOS: any[] = [];
const DEMO_TIME_SLOTS = ["09:00 AM","11:00 AM","02:00 PM","04:00 PM"];
for (let i = 0; i < 30; i++) {
  const m   = 2 + (i % 3);
  const day = 3 + (i % 25);
  const isCompleted = i < 20;
  const isSur = i % 2 === 0;
  DEMOS.push({
    id:    `DEMO-${isSur?"SUR":"MUM"}-${String(i+1).padStart(3,"0")}`,
    leadId: `LEAD-${isSur?"SUR":"MUM"}-${String((i%20)+1).padStart(3,"0")}`,
    customerName: `Demo Customer ${i+1}`,
    customerFirstName: `Customer`,
    mobile: `98766${String(10000+i).slice(-5)}`,
    email: `demo${i+1}@example.com`,
    addressLine1: `${200+i} Demo Street`,
    area: isSur ? AREAS_SUR[i%7] : AREAS_MUM[i%7],
    city: isSur ? "Surat" : "Mumbai",
    pinCode: isSur ? PINS_SUR[i%7] : PINS_MUM[i%7],
    vehicleCategory: i%2===0 ? "Sedan" : "SUV",
    vehicleColor: "White",
    vehicleRegistrationNumber: `${isSur?"GJ05":"MH01"}${String(2000+i)}`,
    demoType: i%3===0 ? "One-Time Service Demo" : "Subscription Package Demo",
    demoDate: d(m, day),
    demoTimeSlot: DEMO_TIME_SLOTS[i%4],
    planName: ["SHINE","PROTECT","ELITE"][i%3],
    planPrice: [1199,1599,1999][i%3],
    planOfInterest: ["SHINE","PROTECT","ELITE"][i%3],
    tseScheduled: true,
    tseScheduledBy: isSur ? "EDB-TSE-SUR1" : "EDB-TSE-MUM1",
    tseScheduledAt: iso(m, day-1),
    assignedSupervisor: isSur ? "EDB-SUP-SUR1" : "EDB-SUP-MUM1",
    washerAssigned: true,
    washerName: isSur ? "Mahesh Bharwad" : "Ajay Gupta",
    washerAssignedAt: iso(m, day-1, 10),
    washerAssignedBy: isSur ? "EDB-SUP-SUR1" : "EDB-SUP-MUM1",
    assignmentDeadline: iso(m, day, 7),
    assignmentDeadlinePassed: false,
    acknowledgmentStatus: "Accepted",
    acknowledgedAt: iso(m, day-1, 11),
    demoCompleted: isCompleted,
    demoCompletedAt: isCompleted ? iso(m, day, 12) : null,
    demoOutcome: isCompleted ? (i%5===0?"Not Converted":i%3===0?"Converted":"Interested") : null,
    jobStartedAt: isCompleted ? iso(m, day, 9) : null,
    servicesPerformed: ["Exterior Wash","Tyre Dressing"],
    vehicleConditionBefore: "Dusty",
    vehicleConditionAfter: "Clean",
    productsUsed: ["Car Shampoo","Tyre Shine"],
    customerPresentDuringWash: true,
    customerVerbalFeedback: isCompleted ? "Very satisfied with the service" : undefined,
    status: isCompleted ? "Completed" : "Assigned",
    assignmentStatus: isCompleted ? "Completed" : "Assigned",
    isPreviousDemo: i%10===0,
    tlApprovalRequired: i%10===0,
    tlApprovalStatus: i%10===0 ? "Approved" : undefined,
    notificationsSent: ["TSE","Supervisor","Washer"],
    timelineEntries: [
      { timestamp: iso(m, day-1), actor: "TSE", action: "Demo scheduled" },
      { timestamp: iso(m, day-1, 10), actor: "Supervisor", action: "Washer assigned" },
      { timestamp: iso(m, day, 9), actor: "Washer", action: "Demo started" },
    ],
    cityId: isSur ? "CITY-SURAT" : "CITY-MUMBAI",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 10. SUBSCRIPTIONS — 120 records
// ═════════════════════════════════════════════════════════════════════════════
const PKG_MAP: Record<string,string> = {
  "SHINE":"Basic","PROTECT":"Standard","ELITE":"Premium"
};
const PLAN_PRICES: Record<string,number> = {
  "SHINE":1199,"PROTECT":1599,"ELITE":1999
};
const SUBS: any[] = [];
for (let i = 0; i < 120; i++) {
  const isSur  = i < 80;
  const cust   = CUSTOMERS[isSur ? i%100 : 100+(i%100)];
  const pkgKey = ["SHINE","PROTECT","ELITE"][i%3];
  const pkg    = PKG_MAP[pkgKey];
  const price  = PLAN_PRICES[pkg];
  const disc   = i%5===0 ? 100 : 0;
  const m      = 2 + (i%3);
  const day    = 1 + (i%28);
  SUBS.push({
    subscriptionId: `SUB-${isSur?"SUR":"MUM"}-${String(i+1).padStart(4,"0")}`,
    customerId:     cust.customerId,
    packageType:    pkg,
    packageName:    pkgKey,
    frequency:      ["Daily","Alternate Days","Weekly"][i%3],
    status:         i%15===0?"Cancelled": i%10===0?"Paused":"Active",
    startDate:      d(m, day),
    renewalDate:    d(Math.min(m+1,12), day),
    pricing:        { basePrice:price, discount:disc, finalPrice:price-disc, currency:"INR" },
    priceLocked:    price - disc,
    serviceDetails: { vehicleType: i%2===0?"SUV":"Sedan", addOns:i%4===0?["Interior Cleaning"]:[], preferredTimeSlot:["Morning","Afternoon","Evening"][i%3] },
    billingCycle:   ["Monthly","Quarterly","Annual"][i%3],
    paymentStatus:  i%8===0?"Pending": i%12===0?"Overdue":"Paid",
    cityId:         isSur ? "CITY-SURAT" : "CITY-MUMBAI",
    createdAt:      d(m,day)+"T08:00:00.000Z",
    updatedAt:      d(m,day)+"T08:00:00.000Z",
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 11. JOBS — 300 completed jobs
// ═════════════════════════════════════════════════════════════════════════════
const JOBS: any[] = [];
let jobIdx = 1;
for (const sub of SUBS.filter(s => s.status !== "Cancelled").slice(0, 100)) {
  const isSur   = sub.cityId === "CITY-SURAT";
  const washers = isSur ? WASHER_IDS_SUR : WASHER_IDS_MUM;
  const washer  = washers[jobIdx % Math.max(washers.length,1)];
  for (const m of MONTHS) {
    const day  = 1 + (jobIdx % 25);
    const cust = CUSTOMERS.find(c => c.customerId === sub.customerId) || CUSTOMERS[0];
    JOBS.push({
      jobId:        `JOB-${isSur?"SUR":"MUM"}-${String(jobIdx*3+m-2).padStart(5,"0")}`,
      customerId:   sub.customerId,
      subscriptionId: sub.subscriptionId,
      washerId:     washer,
      scheduledDate: d(m, day),
      timeSlot:     ["07:00 AM","09:00 AM","11:00 AM","02:00 PM"][jobIdx%4],
      status:       "Completed",
      jobType:      "Regular",
      packageName:  sub.packageName,
      vehicleDetails: { category: sub.serviceDetails.vehicleType||"Sedan", color:"White", brand:"Maruti", registration:`GJ05${String(jobIdx).padStart(4,"0")}` },
      location:     { addressLine1: cust.address?.line1||"123 Main St", area: cust.address?.area||"Adajan", city: isSur?"Surat":"Mumbai", pinCode: cust.address?.pinCode||(isSur?"395001":"400001") },
      serviceDetails: { addOns: sub.serviceDetails.addOns||[], specialInstructions:"" },
      verificationStatus: "verified",
      qualityScore:     80 + (jobIdx%20),
      complianceScore:  85 + (jobIdx%15),
      cityId:    sub.cityId,
      city:      isSur ? "Surat" : "Mumbai",
      completedAt: d(m, day)+"T12:30:00.000Z",
      createdAt:   d(m, day)+"T07:00:00.000Z",
      updatedAt:   d(m, day)+"T12:30:00.000Z",
    });
  }
  jobIdx++;
}

// ═════════════════════════════════════════════════════════════════════════════
// 12. COMPLAINTS — 72 records (12/month × 2 cities × 3 months)
// ═════════════════════════════════════════════════════════════════════════════
const COMP_TYPES  = ["Missed wash","Water on seat","Scratch on car","Not cleaned properly","Washer was late","Billing issue","App not working","Washer was rude"];
const COMP_STATUS = ["Open","In Progress","Resolved","Escalated","Closed"];
const COMPLAINTS_DS: any[] = [];   // for DataService (COMPLAINTS key)
const COMPLAINTS_RAW: any[] = [];  // for raw key (customerCareExecutiveService)
let compIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid   = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  const cce   = city === "Surat" ? "EDB-CCE-SUR1" : "EDB-CCE-MUM1";
  const custs = CUSTOMERS.filter(c => c.cityId === cid);
  for (const m of MONTHS) {
    for (let i = 0; i < 12; i++) {
      const status  = COMP_STATUS[i % COMP_STATUS.length];
      const compObj = {
        id:          `COMP-${city.slice(0,3).toUpperCase()}-${String(compIdx++).padStart(3,"0")}`,
        customerId:  custs[i%custs.length]?.customerId || `CUST-${city.slice(0,3).toUpperCase()}-001`,
        customerName: custs[i%custs.length]?.firstName+" "+custs[i%custs.length]?.lastName,
        type:        COMP_TYPES[i%COMP_TYPES.length],
        description: `Customer reported: ${COMP_TYPES[i%COMP_TYPES.length]}.`,
        status,
        priority:    i%5===0?"High": i%3===0?"Medium":"Low",
        cityId:      cid, city,
        assignedTo:  cce,
        resolvedAt:  ["Resolved","Closed"].includes(status) ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        rating:      status==="Closed" ? (3+i%3) : undefined,
        createdAt:   new Date(2026,m-1,1+(i*2)).toISOString(),
      };
      COMPLAINTS_DS.push(compObj);
      COMPLAINTS_RAW.push(compObj);
    }
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 13. INVENTORY ITEMS — 14 items (Surat + Mumbai)
// ═════════════════════════════════════════════════════════════════════════════
const INVENTORY_ITEMS: any[] = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",         category:"Cleaning Supplies", unit:"L",   centralStock:45,  reorderLevel:20, unitCost:480, cityId:"CITY-SURAT",  supervisorStock:{"EDB-SUP-SUR1":3,"EDB-SUP-SUR2":2}, washerStock:{}, lastProcurementDate:d(2,15), supplierId:"LM-SHREEJI", createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large",  category:"Equipment",         unit:"Pcs", centralStock:120, reorderLevel:50, unitCost:85,  cityId:"CITY-SURAT",  supervisorStock:{"EDB-SUP-SUR1":10,"EDB-SUP-SUR2":8}, washerStock:{"EDB-CW-SUR1A":2,"EDB-CW-SUR1B":2}, lastProcurementDate:d(3,1), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",        category:"Cleaning Supplies", unit:"L",   centralStock:30,  reorderLevel:15, unitCost:220, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",         category:"Cleaning Supplies", unit:"L",   centralStock:8,   reorderLevel:20, unitCost:150, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle",  category:"Equipment",         unit:"Pcs", centralStock:6,   reorderLevel:4,  unitCost:350, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,15), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",       category:"Consumables",       unit:"Pcs", centralStock:25,  reorderLevel:15, unitCost:650, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5),  createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",         category:"Cleaning Supplies", unit:"L",   centralStock:18,  reorderLevel:12, unitCost:185, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",      category:"Cleaning Supplies", unit:"L",   centralStock:0,   reorderLevel:10, unitCost:120, cityId:"CITY-SURAT",  supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,5),  createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-001", itemName:"Car Shampoo 5L",           category:"Cleaning Supplies", unit:"L",   centralStock:50,  reorderLevel:20, unitCost:490, cityId:"CITY-MUMBAI", supervisorStock:{"EDB-SUP-MUM1":4}, washerStock:{}, lastProcurementDate:d(3,1), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-002", itemName:"Microfiber Cloth Large",   category:"Equipment",         unit:"Pcs", centralStock:90,  reorderLevel:50, unitCost:90,  cityId:"CITY-MUMBAI", supervisorStock:{"EDB-SUP-MUM1":8}, washerStock:{}, lastProcurementDate:d(3,10), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-003", itemName:"Dashboard Polish",          category:"Cleaning Supplies", unit:"L",   centralStock:22,  reorderLevel:20, unitCost:155, cityId:"CITY-MUMBAI", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20), createdAt:NOW, updatedAt:NOW },
  { itemId:"INV-MUM-004", itemName:"Washer Uniform Set",        category:"Consumables",       unit:"Pcs", centralStock:30,  reorderLevel:15, unitCost:680, cityId:"CITY-MUMBAI", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5), createdAt:NOW, updatedAt:NOW },
];

// ═════════════════════════════════════════════════════════════════════════════
// 14. STOCK TRANSACTIONS — procurement + issuances (needed by Inventory screens)
// ═════════════════════════════════════════════════════════════════════════════
const STOCK_TRANSACTIONS: any[] = [];
let stIdx = 1;
for (const m of MONTHS) {
  // Procurement into Central
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-SUR-${m}-001`, itemId:"INV-SUR-001", type:"Procurement", quantity:20, fromLocation:"Central", toLocation:"Central", reason:"Monthly replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-SUR", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-SUR-${m}-002`, itemId:"INV-SUR-002", type:"Procurement", quantity:50, fromLocation:"Central", toLocation:"Central", reason:"Replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-SUR", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  // Issue to Supervisor
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-001`, itemId:"INV-SUR-001", type:"Issue", quantity:5, fromLocation:"Central", toLocation:"Supervisor", toId:"EDB-SUP-SUR1", reason:"Weekly issue", requestedBy:"EDB-SUP-SUR1", approvedBy:"EDB-SM-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,2)+"T08:00:00.000Z", completedAt:d(m,2)+"T09:00:00.000Z" });
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-002`, itemId:"INV-SUR-002", type:"Issue", quantity:12, fromLocation:"Central", toLocation:"Supervisor", toId:"EDB-SUP-SUR1", reason:"Weekly issue", requestedBy:"EDB-SUP-SUR1", approvedBy:"EDB-SM-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,2)+"T08:00:00.000Z", completedAt:d(m,2)+"T09:00:00.000Z" });
  // Issue to Washer
  STOCK_TRANSACTIONS.push({ transactionId:`ST-ISSUE-SUR-${m}-003`, itemId:"INV-SUR-002", type:"Issue", quantity:3, fromLocation:"Supervisor", fromId:"EDB-SUP-SUR1", toLocation:"Washer", toId:"EDB-CW-SUR1A", reason:"Daily issue", requestedBy:"EDB-CW-SUR1A", approvedBy:"EDB-SUP-SUR1", status:"Completed", cityId:"CITY-SURAT", createdAt:d(m,3)+"T07:00:00.000Z", completedAt:d(m,3)+"T07:30:00.000Z" });
  // Mumbai procurement
  STOCK_TRANSACTIONS.push({ transactionId:`ST-PROC-MUM-${m}-001`, itemId:"INV-MUM-001", type:"Procurement", quantity:25, fromLocation:"Central", toLocation:"Central", reason:"Monthly replenishment", requestedBy:"EDB-SM-SUR1", approvedBy:"EDB-CM-MUM", status:"Completed", cityId:"CITY-MUMBAI", createdAt:d(m,8)+"T09:00:00.000Z", completedAt:d(m,9)+"T10:00:00.000Z" });
  stIdx += 6;
}

// ═════════════════════════════════════════════════════════════════════════════
// 15. FINANCE (MRR, Payables, Revenues) — for FinanceContext
// ═════════════════════════════════════════════════════════════════════════════
const FINANCE_MRR: any[] = [];
for (const m of MONTHS) {
  const ms = `2026-${String(m).padStart(2,"0")}`;
  const surSubs = SUBS.filter(s => s.cityId==="CITY-SURAT" && s.status!=="Cancelled").slice(0,15);
  const mumSubs = SUBS.filter(s => s.cityId==="CITY-MUMBAI" && s.status!=="Cancelled").slice(0,12);
  surSubs.forEach((s,i) => FINANCE_MRR.push({ mrrId:`MRR-SUR-${m}-${String(i+1).padStart(3,"0")}`, month:ms, subscriptionId:s.subscriptionId, customerId:s.customerId, revenue:s.pricing.finalPrice, status:s.status==="Paused"?"Paused":"Active", cityId:"CITY-SURAT", createdAt:`${ms}-01T00:00:00.000Z`, updatedAt:`${ms}-01T00:00:00.000Z` }));
  mumSubs.forEach((s,i) => FINANCE_MRR.push({ mrrId:`MRR-MUM-${m}-${String(i+1).padStart(3,"0")}`, month:ms, subscriptionId:s.subscriptionId, customerId:s.customerId, revenue:s.pricing.finalPrice, status:s.status==="Paused"?"Paused":"Active", cityId:"CITY-MUMBAI", createdAt:`${ms}-01T00:00:00.000Z`, updatedAt:`${ms}-01T00:00:00.000Z` }));
}

const TYPE_MAP: Record<string,string> = { Vendor:"Vendor", Statutory:"Statutory", Salary:"Salary", Overdue:"Vendor" };
const FINANCE_PAYABLES: any[] = [
  { payableId:"PAY-SUR-001", type:"Vendor",    vendorName:"Shreeji Chemicals",          invoiceNumber:"INV-2026-0142", amount:18500, dueDate:d(2,28), status:"Paid",    description:"Feb chemicals supply",            cityId:"CITY-SURAT",  paidAt:d(2,25), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-002", type:"Vendor",    vendorName:"Rajkot Equipment Traders",   invoiceNumber:"INV-2026-0201", amount:12000, dueDate:d(3,15), status:"Paid",    description:"Pressure washer nozzles",         cityId:"CITY-SURAT",  paidAt:d(3,14), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-003", type:"Statutory", vendorName:"ESIC Office",                statutoryType:"ESIC",          amount:8450,  dueDate:d(3,15), status:"Paid",    description:"ESIC contribution Feb 2026",      cityId:"CITY-SURAT",  paidAt:d(3,10), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-004", type:"Statutory", vendorName:"EPFO",                       statutoryType:"PF",            amount:24600, dueDate:d(3,15), status:"Paid",    description:"PF contribution Feb 2026",        cityId:"CITY-SURAT",  paidAt:d(3,12), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-005", type:"Vendor",    vendorName:"Shreeji Chemicals",          invoiceNumber:"INV-2026-0289", amount:21000, dueDate:d(3,31), status:"Pending", description:"March chemicals supply",          cityId:"CITY-SURAT",  createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-SUR-006", type:"Statutory", vendorName:"Gujarat Professional Tax",   statutoryType:"PT",            amount:4200,  dueDate:d(4,15), status:"Pending", description:"PT Q4 FY 2025-26",               cityId:"CITY-SURAT",  createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-001", type:"Vendor",    vendorName:"Mumbai Wash Supplies",       invoiceNumber:"INV-2026-0155", amount:22000, dueDate:d(2,28), status:"Paid",    description:"Feb chemicals + equipment",       cityId:"CITY-MUMBAI", paidAt:d(2,26), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-002", type:"Statutory", vendorName:"ESIC Office",                statutoryType:"ESIC",          amount:9200,  dueDate:d(3,15), status:"Paid",    description:"ESIC contribution Feb 2026",      cityId:"CITY-MUMBAI", paidAt:d(3,11), createdAt:NOW, updatedAt:NOW },
  { payableId:"PAY-MUM-003", type:"Vendor",    vendorName:"Rapid Wash Tools",           invoiceNumber:"INV-2026-0098", amount:15500, dueDate:d(2,15), status:"Overdue", description:"Equipment repair — overdue 30+ days", cityId:"CITY-MUMBAI", createdAt:NOW, updatedAt:NOW },
];

const FINANCE_REVENUES: any[] = [];
const PM = ["UPI","UPI","UPI","Card","Cash","Bank Transfer"] as const;
for (const m of MONTHS) {
  const ms = String(m).padStart(2,"0");
  SUBS.filter(s => s.cityId==="CITY-SURAT").slice(0,12).forEach((s,i) => {
    const revCust = CUSTOMERS.find(c => c.customerId === s.customerId);
    FINANCE_REVENUES.push({ revenueId:`REV-SUR-SUB-${m}-${String(i+1).padStart(3,"0")}`, customerId:s.customerId, customerName: revCust ? `${revCust.firstName} ${revCust.lastName}` : s.customerId, subscriptionId:s.subscriptionId, packageName:s.packageName, type:"Subscription", amount:s.pricing.finalPrice, receivedDate:`2026-${ms}-01`, paymentMethod:PM[i%PM.length], invoiceNumber:`INV-SUR-${m}-${String(i+1).padStart(4,"0")}`, status:"Received", cityId:"CITY-SURAT", createdAt:`2026-${ms}-01T09:00:00.000Z` });
  });
  for (let day=5; day<=25; day+=5) {
    const otCust = CUSTOMERS[day%100]; FINANCE_REVENUES.push({ revenueId:`REV-SUR-OT-${m}-${day}`, customerId:otCust.customerId, customerName:`${otCust.firstName} ${otCust.lastName}`, packageName:"One-Time Wash", type:"One-Time", amount:499+(day%2===0?200:0), receivedDate:`2026-${ms}-${String(day).padStart(2,"0")}`, paymentMethod:"Cash", invoiceNumber:`INV-SUR-OT-${m}-${day}`, status:"Received", cityId:"CITY-SURAT", createdAt:`2026-${ms}-${String(day).padStart(2,"0")}T10:00:00.000Z` });
  }
  SUBS.filter(s => s.cityId==="CITY-MUMBAI").slice(0,8).forEach((s,i) => {
    const mumRevCust = CUSTOMERS.find(c => c.customerId === s.customerId); FINANCE_REVENUES.push({ revenueId:`REV-MUM-SUB-${m}-${String(i+1).padStart(3,"0")}`, customerId:s.customerId, customerName: mumRevCust ? `${mumRevCust.firstName} ${mumRevCust.lastName}` : s.customerId, subscriptionId:s.subscriptionId, packageName:s.packageName, type:"Subscription", amount:s.pricing.finalPrice, receivedDate:`2026-${ms}-01`, paymentMethod:PM[i%PM.length], invoiceNumber:`INV-MUM-${m}-${String(i+1).padStart(4,"0")}`, status:"Received", cityId:"CITY-MUMBAI", createdAt:`2026-${ms}-01T09:00:00.000Z` });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 16. ADVANCES
// ═════════════════════════════════════════════════════════════════════════════
const ADVANCES: any[] = [
  { id:"ADV-SUR-001", employeeId:"EDB-CW-SUR1A", type:"short_term", amount:5000, reason:"Medical emergency", status:"Approved", cityId:"CITY-SURAT", requestDate:d(2,5), approvedDate:d(2,7), deductMonth:3, deductYear:2026 },
  { id:"ADV-SUR-002", employeeId:"EDB-CW-SUR2B", type:"short_term", amount:3000, reason:"Family function",   status:"Approved", cityId:"CITY-SURAT", requestDate:d(3,1), approvedDate:d(3,3), deductMonth:4, deductYear:2026 },
  { id:"ADV-SUR-003", employeeId:"EDB-CW-SUR1C", type:"short_term", amount:8000, reason:"House rent advance", status:"Pending", cityId:"CITY-SURAT", requestDate:d(4,1) },
  { id:"ADV-MUM-001", employeeId:"EDB-CW-MUM1B", type:"short_term", amount:6000, reason:"Medical treatment", status:"Approved", cityId:"CITY-MUMBAI",requestDate:d(2,10),approvedDate:d(2,12),deductMonth:3, deductYear:2026 },
];

// ═════════════════════════════════════════════════════════════════════════════
// 17. CLOTH TRACKING
// ═════════════════════════════════════════════════════════════════════════════
const CLOTH: any[] = [];
for (const emp of EMPLOYEES.filter(e => e.designation === "Car Washer")) {
  CLOTH.push({ id:`CLT-${emp.id}`, employeeId:emp.id, cityId:emp.cityId, uniformsIssued:2, uniformsReturned:0, currentlyWith:2, lastIssuedDate:emp.dateOfJoining, condition:"Good", exchanges:[{ date:d(3,1), type:"Damaged", oldQty:1, newQty:1, reason:"Torn during work" }] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 18. ACCOUNTING — Ledgers + Entries + Journals (for Finance/Accounts/GST)
// ═════════════════════════════════════════════════════════════════════════════
const LEDGERS: any[] = [
  { id:"LM-AXB-SUR",    name:"Axis Bank",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:320000, openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-SUR",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:25000,  openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZP-SUR",    name:"Razorpay",             accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"payment_gateway", openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-DEBTOR-SUR", name:"Customer Debtors",     accountHead:"accounts_receivable", accountHeadLabel:"Accounts Receivable",  nature:"asset",     type:"customer",        openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ITC-SUR",    name:"Input Tax Credits",    accountHead:"gst_input",           accountHeadLabel:"GST Input (ITC)",      nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ADVTAX-SUR", name:"Advance Tax",          accountHead:"current_assets",      accountHeadLabel:"Current Assets",       nature:"asset",     type:"other",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-TDS194C-SUR",name:"TDS Payable 194C",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-TDS194J-SUR",name:"TDS Payable 194J",     accountHead:"tds_payable",         accountHeadLabel:"TDS Payable",          nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OCGST-SUR",  name:"Output CGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-OSGST-SUR",  name:"Output SGST",          accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SALARY-SUR", name:"Salary Payable",       accountHead:"other_liabilities",   accountHeadLabel:"Other Liabilities",    nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-PF-SUR",     name:"PF Payable",           accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ESIC-SUR",   name:"ESIC Payable",         accountHead:"duties_taxes",        accountHeadLabel:"Duties & Taxes",       nature:"liability", type:"other",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZPCHG-SUR", name:"Transaction Charges (Razorpay)", accountHead:"indirect_expenses", accountHeadLabel:"Indirect Expenses", nature:"expense", type:"expense", openingBalance:0, openingBalanceType:"Dr", city:"Surat", cityId:"CITY-SURAT", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SUBREV-SUR", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-OT-SUR",     name:"One-time Service",     accountHead:"sales_service",       accountHeadLabel:"Sales — Service",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENEW-SUR",  name:"Renewal Fees",         accountHead:"sales_renewal",       accountHeadLabel:"Sales — Renewal",      nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-LABOR-SUR",  name:"Salaries and Employee Wages", accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses", nature:"expense",   type:"expense",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-SUR",   name:"Raw Materials And Consumables",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",nature:"expense",   type:"expense",           openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RENT-SUR",   name:"Rent Expense",         accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-ELEC-SUR",   name:"Electricity Expense",  accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CONS-SUR",   name:"Consultant Expense",   accountHead:"indirect_expenses",   accountHeadLabel:"Indirect Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SHREEJI",    name:"Shreeji Chemicals",    accountHead:"accounts_payable",    accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCS1234C1Z5" },
  { id:"LM-RAJKOT",     name:"Rajkot Equipment Traders",accountHead:"accounts_payable", accountHeadLabel:"Accounts Payable",     nature:"liability", type:"vendor",          openingBalance:0,      openingBalanceType:"Cr", city:"Surat",  cityId:"CITY-SURAT",  isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", gstin:"24AABCR5678D1Z2" },
  // MUMBAI
  { id:"LM-AXB-MUM",    name:"Axis Bank",            accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"bank",            openingBalance:280000, openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CASH-MUM",   name:"Petty Cash",           accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"other",           openingBalance:20000,  openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-RZP-MUM",    name:"Razorpay",             accountHead:"cash_bank",           accountHeadLabel:"Cash & Bank",          nature:"asset",     type:"payment_gateway", openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-SUBREV-MUM", name:"Subscription - 4W",    accountHead:"sales_subscription",  accountHeadLabel:"Sales — Subscription", nature:"income",    type:"sales",           openingBalance:0,      openingBalanceType:"Cr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z", packageCode:"4W" },
  { id:"LM-LABOR-MUM",  name:"Salaries and Employee Wages",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",    nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
  { id:"LM-CHEM-MUM",   name:"Raw Materials And Consumables",accountHead:"direct_expenses",accountHeadLabel:"Direct Expenses",  nature:"expense",   type:"expense",         openingBalance:0,      openingBalanceType:"Dr", city:"Mumbai", cityId:"CITY-MUMBAI", isSystem:false, status:"Active", createdAt:"2026-01-01T00:00:00.000Z" },
];

// ── Accounting Entries (Sales + Purchases + Expenses) ────────────────────────
let accSeq = 1;
const ACC_ENTRIES: any[] = [];
function gst18(taxable: number) { return { taxableValue:taxable, gstRate:18, cgst:Math.round(taxable*0.09), sgst:Math.round(taxable*0.09), igst:0, totalBillValue:taxable+Math.round(taxable*0.18) }; }
function noGst(amt: number) { return { taxableValue:amt, gstRate:0, cgst:0, sgst:0, igst:0, totalBillValue:amt }; }

for (const m of MONTHS) {
  const ms = String(m).padStart(2,"0");
  // Surat — subscription sales
  [1150,1150,1499,1150,1999,1150,1150,1499,1150,1499,1150,1999].forEach((base,i)=>{
    const g=gst18(base);
    ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-01`, gstEntryType:"B2B", ...g, invoiceNumber:`SUB-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-SUR", creditAccount:"LM-SUBREV-SUR", paymentMode:"Bank", isRCM:false, narration:`Subscription — ${["SHINE","PROTECT","ELITE"][i%3]}`, city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  });
  // Surat — one-time washes
  [5,9,13,17,21].forEach((day,i)=>{ const g=gst18(499+(i%2===0?200:0)); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-${String(day).padStart(2,"0")}`, gstEntryType:"Unregistered", ...g, invoiceNumber:`OT-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-CASH-SUR", creditAccount:"LM-OT-SUR", paymentMode:"Cash", isRCM:false, narration:"One-time wash", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${String(day).padStart(2,"0")}T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Surat — chemical purchase (B2B, ITC)
  const chemAmt=[18500,21000,19500][m-2]; const gc=gst18(chemAmt);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`PUR/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Purchase", date:`2026-${ms}-10`, gstEntryType:"B2B", ...gc, vendorName:"Shreeji Chemicals", vendorGstin:"24AABCS1234C1Z5", vendorStateCode:"24", invoiceNumber:`SHREEJI-${m}-001`, hsnSacCode:"34022000", expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses", debitAccount:"LM-CHEM-SUR", creditAccount:"LM-SHREEJI", paymentMode:"Bank", isRCM:false, narration:"Chemicals — shampoo, tyre shine, polish", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-10T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Surat — rent (RCM)
  const rent=35000; const rcmC=Math.round(rent*0.09); const rcmS=Math.round(rent*0.09);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`EXP/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Expense", date:`2026-${ms}-01`, gstEntryType:"RCM", taxableValue:rent, gstRate:18, cgst:rcmC, sgst:rcmS, igst:0, totalBillValue:rent, vendorName:"Proprietor (Landlord)", vendorStateCode:"24", invoiceNumber:`RENT-${m}`, hsnSacCode:"997211", expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses", debitAccount:"LM-RENT-SUR", creditAccount:"LM-AXB-SUR", paymentMode:"Bank", isRCM:true, rcmCgst:rcmC, rcmSgst:rcmS, narration:"Office/depot rent — RCM", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T11:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Surat — electricity (NonGST)
  const elec=[4200,4600,5100][m-2];
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`EXP/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Expense", date:`2026-${ms}-18`, gstEntryType:"NonGST", ...noGst(elec), vendorName:"DGVCL", vendorStateCode:"24", invoiceNumber:`ELEC-${m}`, hsnSacCode:"", expenseAccount:"indirect_expenses", expenseAccountLabel:"Indirect Expenses", debitAccount:"LM-ELEC-SUR", creditAccount:"LM-AXB-SUR", paymentMode:"Bank", isRCM:false, narration:"Electricity bill", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-18T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Renewals
  [1299,1499,999].forEach((base,i)=>{ const g=gst18(base); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/SURAT/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-${String(2+i*7).padStart(2,"0")}`, gstEntryType:"B2B", ...g, invoiceNumber:`REN-SUR-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-SUR", creditAccount:"LM-RENEW-SUR", paymentMode:"Bank", isRCM:false, narration:"Subscription renewal", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${String(2+i*7).padStart(2,"0")}T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Mumbai sales
  [1280,1280,1690,1280,1280].forEach((base,i)=>{ const g=gst18(base); ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`SAL/MUMBAI/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Sales", date:`2026-${ms}-01`, gstEntryType:"B2B", ...g, invoiceNumber:`SUB-MUM-${m}-${i+1}`, hsnSacCode:"998519", debitAccount:"LM-RZP-MUM", creditAccount:"LM-SUBREV-MUM", paymentMode:"Bank", isRCM:false, narration:"Subscription Mumbai", city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-01T10:00:00.000Z`, status:"Posted", changeHistory:[] });});
  // Mumbai chemicals
  const mchemAmt=[22000,25000,21000][m-2]; const mcg=gst18(mchemAmt);
  ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:`PUR/MUMBAI/25-26/${String(accSeq).padStart(4,"0")}`, entryType:"Purchase", date:`2026-${ms}-12`, gstEntryType:"B2B", ...mcg, vendorName:"Mumbai Wash Supplies", vendorGstin:"27AABCM5432G1Z1", vendorStateCode:"27", invoiceNumber:`MWS-${m}-001`, hsnSacCode:"34022000", expenseAccount:"direct_expenses", expenseAccountLabel:"Direct Expenses", debitAccount:"LM-CHEM-MUM", creditAccount:"LM-AXB-MUM", paymentMode:"Bank", isRCM:false, narration:"Chemicals — Mumbai", city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-12T10:00:00.000Z`, status:"Posted", changeHistory:[] });
}
// Apr — asset purchase
ACC_ENTRIES.push({ id:`ACC-${String(accSeq++).padStart(5,"0")}`, voucherNumber:"AST/SURAT/25-26/0001", entryType:"AssetPurchase", date:"2026-04-10", gstEntryType:"B2B", ...gst18(45000), vendorName:"Clean Tech India", vendorGstin:"24AABCC4321F1Z3", vendorStateCode:"24", invoiceNumber:"ASSET-APR-001", hsnSacCode:"84248990", expenseAccount:"fixed_assets", expenseAccountLabel:"Fixed Assets", debitAccount:"LM-AXB-SUR", creditAccount:"LM-SHREEJI", paymentMode:"Bank", isRCM:false, narration:"Honda GX160 pressure washer — 2 units", city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:"2026-04-10T10:00:00.000Z", status:"Posted", changeHistory:[] });

// ── Journal Entries ──────────────────────────────────────────────────────────
let jvSeq2 = 1;
const jvNo2 = (city="SURAT") => `JV/${city}/25-26/${String(jvSeq2++).padStart(4,"0")}`;
const JOURNALS: any[] = [];
for (const m of MONTHS) {
  const ms   = String(m).padStart(2,"0");
  const mEnd = MONTH_DAYS[m];
  const nm   = m===4?5:m+1; const nms = String(nm).padStart(2,"0");
  // Salary disbursal
  JOURNALS.push({ id:`JV-SAL-${m}`,    voucherNumber:jvNo2(), date:`2026-${ms}-${mEnd}`, narration:`Salary disbursal — Surat — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-LABOR-SUR",accountLabel:"Salaries",debit:550000,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:513550},{accountHead:"LM-PF-SUR",accountLabel:"PF Payable",debit:0,credit:28000},{accountHead:"LM-ESIC-SUR",accountLabel:"ESIC Payable",debit:0,credit:8500},{accountHead:"LM-TDS194C-SUR",accountLabel:"TDS Payable",debit:0,credit:4200},{accountHead:"LM-SALARY-SUR",accountLabel:"Salary Payable (PT)",debit:0,credit:3600}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${mEnd}T18:00:00.000Z`, status:"Posted", changeHistory:[] });
  // PF+ESIC challan
  JOURNALS.push({ id:`JV-PF-${m}`,     voucherNumber:jvNo2(), date:`2026-${nms}-07`,    narration:`PF+ESIC challan — ${MONTH_NAMES[m]} 2026`,   lines:[{accountHead:"LM-PF-SUR",accountLabel:"PF Payable",debit:56000,credit:0},{accountHead:"LM-ESIC-SUR",accountLabel:"ESIC Payable",debit:11750,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:67750}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-07T11:00:00.000Z`, status:"Posted", changeHistory:[] });
  // TDS deposit
  JOURNALS.push({ id:`JV-TDS-${m}`,    voucherNumber:jvNo2(), date:`2026-${nms}-06`,    narration:`TDS deposit 194C — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-TDS194C-SUR",accountLabel:"TDS Payable 194C",debit:4200,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:4200}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-06T10:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Razorpay settlement
  const rzpG=[135700,140200,148500][m-2]; const rzpFee=Math.round(rzpG*0.02); const rzpNet=rzpG-rzpFee;
  JOURNALS.push({ id:`JV-RZP-${m}`,    voucherNumber:jvNo2(), date:`2026-${ms}-03`,    narration:`Razorpay settlement — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:rzpNet,credit:0},{accountHead:"LM-RZPCHG-SUR",accountLabel:"Razorpay Charges",debit:rzpFee,credit:0},{accountHead:"LM-RZP-SUR",accountLabel:"Razorpay",debit:0,credit:rzpG}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-03T14:00:00.000Z`, status:"Posted", changeHistory:[] });
  // GST payment
  const gstPay=[12600,13400,14200][m-2];
  JOURNALS.push({ id:`JV-GST-${m}`,    voucherNumber:jvNo2(), date:`2026-${nms}-20`,   narration:`GST payment CGST+SGST — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-OCGST-SUR",accountLabel:"Output CGST",debit:Math.round(gstPay/2),credit:0},{accountHead:"LM-OSGST-SUR",accountLabel:"Output SGST",debit:Math.round(gstPay/2),credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:gstPay}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:`2026-${nms}-20T12:00:00.000Z`, status:"Posted", changeHistory:[] });
  // Mumbai salary
  JOURNALS.push({ id:`JV-MUM-SAL-${m}`,voucherNumber:jvNo2("MUMBAI"), date:`2026-${ms}-${mEnd}`, narration:`Salary disbursal — Mumbai — ${MONTH_NAMES[m]} 2026`, lines:[{accountHead:"LM-LABOR-MUM",accountLabel:"Salaries Mumbai",debit:480000,credit:0},{accountHead:"LM-AXB-MUM",accountLabel:"Axis Bank Mumbai",debit:0,credit:480000}], city:"Mumbai", cityId:"CITY-MUMBAI", financialYear:FY, createdBy:"Seed", createdAt:`2026-${ms}-${mEnd}T18:30:00.000Z`, status:"Posted", changeHistory:[] });
}
// Advance tax
JOURNALS.push({ id:"JV-ADVTAX-1", voucherNumber:jvNo2(), date:"2026-03-15", narration:"Advance Tax Instalment 1 (15%) FY 25-26", lines:[{accountHead:"LM-ADVTAX-SUR",accountLabel:"Advance Tax",debit:18500,credit:0},{accountHead:"LM-AXB-SUR",accountLabel:"Axis Bank",debit:0,credit:18500}], city:"Surat", cityId:"CITY-SURAT", financialYear:FY, createdBy:"Seed", createdAt:"2026-03-15T11:00:00.000Z", status:"Posted", changeHistory:[] });

// ═════════════════════════════════════════════════════════════════════════════
// SEEDER FUNCTION
// ═════════════════════════════════════════════════════════════════════════════
export function seedAllData(): void {
  try {
    if (localStorage.getItem(SEED_FLAG)) return;

    // Clear ALL previous seed flags so every browser gets fresh data
    ["HISTORIC_DATA_SEEDED_V1","HISTORIC_DATA_SEEDED_V2","HISTORIC_DATA_SEEDED_V3",
     "HISTORIC_DATA_SEEDED_V4","HISTORIC_DATA_SEEDED_V5","ACC_SEED_V1","ACC_SEED_V2",
     "ALL_DATA_SEEDED_V1","ALL_DATA_SEEDED_V2","ALL_DATA_SEEDED_V3","ALL_DATA_SEEDED_V4",
     "ALL_DATA_SEEDED_V5","ALL_DATA_SEEDED_V6","ALL_DATA_SEEDED_V8","ALL_DATA_SEEDED_V7"
    ].forEach(f => localStorage.removeItem(f));

    // FIX: Set SEED_FLAG first — prevents infinite re-seed if quota hit mid-run
  
  // ── Seed incentive v6 records from subscriptions ───────────────────────────
  try {
    const existingIncentives = localStorage.getItem("cleancar_incentive_v6_records");
    if (!existingIncentives || JSON.parse(existingIncentives).length === 0) {
      const subs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions") || "[]");
      const incRecords: any[] = [];
      const tseId = "EDB-TSE-01"; // default TSE
      const smId  = "EDB-SM-01";
      const shId  = "EDB-SH-01";
      const tsmId = "EDB-TSM-01";
      subs.slice(0, 20).forEach((sub: any, idx: number) => {
        // Skip Express Wash Hatchback (zero pool)
        const isZero = (sub.packageType === "Express Wash" || sub.packageType === "SHINE") &&
                       (sub.vehicleType || "").toLowerCase().includes("hatchback");
        const pool = isZero ? 0 : 150;
        const term = 3 as const;
        const actDate = sub.startDate || new Date(Date.now() - idx * 7 * 24 * 3600000).toISOString().split("T")[0];
        const act = new Date(actDate);
        const m3Date = new Date(act); m3Date.setMonth(m3Date.getMonth() + 2);

        const tranches = [
          { id: `TRN-${sub.subscriptionId || "SUB"+idx}-M1`, subscriptionId: sub.subscriptionId || "SUB"+idx,
            checkMonth: "M1", dueDate: actDate, poolAmount: pool * 0.3,
            rolePayouts: pool > 0 ? [
              { role: "TSE", employeeId: tseId, employeeName: "TSE", pct: 20, amount: Math.round(pool*0.3*0.2*100)/100, status: "PAID" },
              { role: "SM",  employeeId: smId,  employeeName: "SM",  pct: 10, amount: Math.round(pool*0.3*0.1*100)/100, status: "PAID" },
            ] : [],
            status: "PAID", paidDate: actDate },
          { id: `TRN-${sub.subscriptionId || "SUB"+idx}-M3`, subscriptionId: sub.subscriptionId || "SUB"+idx,
            checkMonth: "M3", dueDate: m3Date.toISOString().split("T")[0], poolAmount: pool * 0.7,
            rolePayouts: pool > 0 ? [
              { role: "TSE", employeeId: tseId, employeeName: "TSE", pct: 20, amount: Math.round(pool*0.7*0.2*100)/100, status: m3Date <= new Date() ? "PAID" : "PENDING" },
              { role: "SM",  employeeId: smId,  employeeName: "SM",  pct: 10, amount: Math.round(pool*0.7*0.1*100)/100, status: m3Date <= new Date() ? "PAID" : "PENDING" },
            ] : [],
            status: m3Date <= new Date() ? "PAID" : "PENDING", paidDate: m3Date <= new Date() ? m3Date.toISOString().split("T")[0] : undefined },
        ];

        incRecords.push({
          id: `INC-${sub.subscriptionId || "SUB"+idx}`,
          subscriptionId: sub.subscriptionId || `SUB-${idx}`,
          customerId: sub.customerId || `CUST-${idx}`,
          customerName: sub.customerName || `Customer ${idx+1}`,
          planType: sub.packageType || "SMART_WASH",
          vehicleCategory: sub.vehicleType || "hatchback",
          monthlyAmount: sub.monthlyAmount || 1599,
          term, source: "DIGITAL", activationDate: actDate,
          status: sub.status === "Active" ? "ACTIVE" : sub.status === "Cancelled" ? "CANCELLED" : "ACTIVE",
          cityId: "CITY-SURAT",
          tseId, tseName: "Rahul Sharma",
          smId, smName: "Sales Manager",
          shId, shName: "Sales Head",
          tsmId, tsmName: "TSM",
          poolTotal: pool, isZeroPool: isZero, tranches,
          createdAt: actDate + "T00:00:00.000Z",
        });
      });
      if (incRecords.length > 0) {
        localStorage.setItem("cleancar_incentive_v6_records", JSON.stringify(incRecords));
        console.log("[Seed] Seeded", incRecords.length, "incentive v6 records");
      }
    }
  } catch(e) { console.error("[Seed] Incentive v6 seed failed:", e); }
    localStorage.setItem(SEED_FLAG, "true");

    // ── 1. EMPLOYEES ─────────────────────────────────────────────────────────
    const existEmp = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS")||"[]");
    const existIds = new Set(existEmp.map((e:any)=>e.id));
    const allEmp   = [...existEmp, ...EMPLOYEES_RAW.filter(e=>!existIds.has(e.id))];
    localStorage.setItem("EMPLOYEE_DATABASE_RECORDS", JSON.stringify(allEmp)); // auth
    localStorage.setItem("cleancar_employees",              JSON.stringify(EMPLOYEES));       // legacy fallback
    localStorage.setItem("cleancar_CITY-SURAT_employees",   JSON.stringify(SUR_EMPS));
    localStorage.setItem("cleancar_CITY-MUMBAI_employees",  JSON.stringify(MUM_EMPS));

    // ── 2. SALARY STRUCTURES ─────────────────────────────────────────────────
    writeByCityId("salary_structures", SALARY_STRUCTURES);

    // ── 3. INCENTIVE PLANS ───────────────────────────────────────────────────
    writeByCityId("incentive_plans", INCENTIVE_PLANS);

    // ── 4. PAYROLL RUNS ──────────────────────────────────────────────────────
    writeByCityId("payroll_runs", PAYROLL_RUNS);

    // ── 5. EMPLOYEE INCENTIVES ───────────────────────────────────────────────
    writeByCityId("employee_incentives", EMPLOYEE_INCENTIVES);

    // ── 6. ATTENDANCE ────────────────────────────────────────────────────────
    writeByCityId("attendance_records", ATTENDANCE_RECORDS);

    // ── 7. CUSTOMERS ─────────────────────────────────────────────────────────
    // Force-clear stale customers so real Indian names always replace generic ones
    ["cleancar_customers","cleancar_CITY-SURAT_customers","cleancar_CITY-MUMBAI_customers"]
      .forEach(k => localStorage.removeItem(k));
    writeByCityId("customers", CUSTOMERS);

    // ── 8. LEADS ─────────────────────────────────────────────────────────────
    writeByCityId("leads", LEADS);

    // ── 9. DEMOS ─────────────────────────────────────────────────────────────
    writeByCityId("demos", DEMOS);

    // ── 10. SUBSCRIPTIONS ────────────────────────────────────────────────────
    // Force-clear stale subscriptions so packageName field is always present
    ["cleancar_subscriptions","cleancar_CITY-SURAT_subscriptions","cleancar_CITY-MUMBAI_subscriptions"]
      .forEach(k => localStorage.removeItem(k));
    writeByCityId("subscriptions", SUBS);

    // ── 11. JOBS ─────────────────────────────────────────────────────────────
    writeByCityId("jobs", JOBS);

    // ── 12. COMPLAINTS (DataService + raw key for customerCareExecutiveService)
    writeByCityId("complaints", COMPLAINTS_DS);
    localStorage.setItem("cleancar_complaints", JSON.stringify(COMPLAINTS_RAW));

    // ── 13. INVENTORY ────────────────────────────────────────────────────────
    const invByCityId: Record<string,any[]> = {};
    for (const item of INVENTORY_ITEMS) {
      const cid = item.cityId || "CITY-SURAT";
      if (!invByCityId[cid]) invByCityId[cid] = [];
      invByCityId[cid].push(item);
    }
    for (const [cid, items] of Object.entries(invByCityId)) {
      localStorage.setItem(`cleancar_${cid}_inventory_items`, JSON.stringify(items));
    }

    // ── 14. STOCK TRANSACTIONS ───────────────────────────────────────────────
    writeByCityId("stock_transactions", STOCK_TRANSACTIONS);

    // ── 15. FINANCE ──────────────────────────────────────────────────────────
    writeByCityId("mrr",      FINANCE_MRR);
    writeByCityId("payables", FINANCE_PAYABLES);
    // Force-clear stale revenue data so customerName + packageName fields are always fresh
    ["cleancar_revenues","cleancar_CITY-SURAT_revenues","cleancar_CITY-MUMBAI_revenues"]
      .forEach(k => localStorage.removeItem(k));
    writeByCityId("revenues", FINANCE_REVENUES);

    // ── 16. ADVANCES ─────────────────────────────────────────────────────────
    writeByCityId("advance_management", ADVANCES);

    // ── 17. CLOTH TRACKING ───────────────────────────────────────────────────
    writeByCityId("cloth_tracking", CLOTH);

    // ── 18. ACCOUNTING LEDGERS ───────────────────────────────────────────────
    // Force-clear stale SYS-... duplicate system ledgers; seed writes canonical LM-... IDs
    localStorage.removeItem("cleancar_ledger_masters");
    localStorage.setItem("cleancar_ledger_masters", JSON.stringify(LEDGERS));

    // ── 19. ACCOUNTING ENTRIES ───────────────────────────────────────────────
    // Force-clear so entries always match the canonical ledger IDs from LEDGERS[]
    localStorage.removeItem("cleancar_accounting_entries");
    localStorage.setItem("cleancar_accounting_entries", JSON.stringify(ACC_ENTRIES));

    // ── 20. JOURNAL ENTRIES ──────────────────────────────────────────────────
    const existJournals: any[] = JSON.parse(localStorage.getItem("cleancar_journal_entries")||"[]");
    const existJvIds = new Set(existJournals.map((j:any)=>j.id));
    localStorage.setItem("cleancar_journal_entries",
      JSON.stringify([...existJournals, ...JOURNALS.filter(j=>!existJvIds.has(j.id))]));

    // ── 21. GST VENDORS (for AccountingEntry + ExpenseVoucher dropdowns) ─────
    const SEED_GST_VENDORS = [
      { id:"GST-SHREEJI", name:"Shreeji Chemicals", gstin:"24AABCS1234C1Z5", pan:"AABCS1234C", state:"Gujarat", stateCode:"24", address:"Surat, Gujarat", contactPerson:"Ramesh Shah", contactPhone:"9876501234", contactEmail:"shreeji@example.com", vendorType:"Goods", supplyType:"INTRA_STATE", paymentTerms:"30 days", bankAccountNumber:"", ifscCode:"", gstinValidated:true, gstinValidatedOn:"2026-01-01", riskScore:10, riskLevel:"Clean", filingStatus:"Regular Filer", lastFiledMonth:"2026-04", createdBy:"Seed", createdAt:"2026-01-01T00:00:00.000Z", entityType:"private_limited" },
      { id:"GST-RAJKOT",  name:"Rajkot Equipment Traders", gstin:"24AABCR5678D1Z2", pan:"AABCR5678D", state:"Gujarat", stateCode:"24", address:"Rajkot, Gujarat", contactPerson:"Vijay Patel", contactPhone:"9876509876", contactEmail:"rajkot@example.com", vendorType:"Goods", supplyType:"INTRA_STATE", paymentTerms:"45 days", bankAccountNumber:"", ifscCode:"", gstinValidated:true, gstinValidatedOn:"2026-01-01", riskScore:10, riskLevel:"Clean", filingStatus:"Regular Filer", lastFiledMonth:"2026-04", createdBy:"Seed", createdAt:"2026-01-01T00:00:00.000Z", entityType:"partnership" },
      { id:"GST-CLEANTECH",name:"Clean Tech India", gstin:"24AABCC4321F1Z3", pan:"AABCC4321F", state:"Gujarat", stateCode:"24", address:"Ahmedabad, Gujarat", contactPerson:"Amit Kumar", contactPhone:"9876543210", contactEmail:"cleantech@example.com", vendorType:"Goods", supplyType:"INTRA_STATE", paymentTerms:"30 days", bankAccountNumber:"", ifscCode:"", gstinValidated:true, gstinValidatedOn:"2026-01-01", riskScore:10, riskLevel:"Clean", filingStatus:"Regular Filer", lastFiledMonth:"2026-04", createdBy:"Seed", createdAt:"2026-01-01T00:00:00.000Z", entityType:"private_limited" },
      { id:"GST-MWS",     name:"Mumbai Wash Supplies", gstin:"27AABCM5432G1Z1", pan:"AABCM5432G", state:"Maharashtra", stateCode:"27", address:"Mumbai, Maharashtra", contactPerson:"Suresh Yadav", contactPhone:"9123456789", contactEmail:"mws@example.com", vendorType:"Goods", supplyType:"INTER_STATE", paymentTerms:"30 days", bankAccountNumber:"", ifscCode:"", gstinValidated:true, gstinValidatedOn:"2026-01-01", riskScore:15, riskLevel:"Clean", filingStatus:"Regular Filer", lastFiledMonth:"2026-04", createdBy:"Seed", createdAt:"2026-01-01T00:00:00.000Z", entityType:"proprietorship" },
      { id:"GST-DGVCL",   name:"DGVCL", gstin:"", pan:"AABCD1234E", state:"Gujarat", stateCode:"24", address:"Vadodara, Gujarat", contactPerson:"DGVCL Office", contactPhone:"1800123456", contactEmail:"dgvcl@example.com", vendorType:"Services", supplyType:"INTRA_STATE", paymentTerms:"immediate", bankAccountNumber:"", ifscCode:"", gstinValidated:false, riskScore:0, riskLevel:"Clean", filingStatus:"Unknown", createdBy:"Seed", createdAt:"2026-01-01T00:00:00.000Z", entityType:"government", isNonGST:true },
    ];
    ["CITY-SURAT","CITY-MUMBAI"].forEach(cid => {
      const key = `cleancar_${cid}_gst_vendors`;
      const existV: any[] = JSON.parse(localStorage.getItem(key)||"[]");
      const existVIds = new Set(existV.map((v:any)=>v.id));
      localStorage.setItem(key, JSON.stringify([...existV, ...SEED_GST_VENDORS.filter(v=>!existVIds.has(v.id))]));
    });

    // ── 22. SEED INVOICES from FINANCE_REVENUES ───────────────────────────────
    // Invoices are derived from revenues at render time in InvoiceManagement,
    // so revenues already seed the invoice list. No separate store needed.

    // ── 23. SEED PAYMENTS for PaymentManagement ──────────────────────────────
    const SEED_PAYMENTS = FINANCE_REVENUES.slice(0, 30).map((r: any, i: number) => ({
      id: `PAY-SEED-${String(i+1).padStart(4,"0")}`,
      paymentNumber: `RCV-${String(i+1).padStart(4,"0")}`,
      invoiceId: r.revenueId,
      invoiceNumber: r.invoiceNumber,
      customerName: r.customerId,
      paymentDate: r.receivedDate,
      paymentMode: r.paymentMethod === "Cash" ? "CASH" : r.paymentMethod === "UPI" ? "UPI" : "BANK_TRANSFER",
      paymentReference: r.invoiceNumber,
      amount: r.amount,
      city: r.cityId,
      createdAt: r.createdAt,
      createdBy: "Seed",
      type: "receipt",
    }));
    ["CITY-SURAT","CITY-MUMBAI"].forEach(cid => {
      const key = `cleancar_${cid}_payments`;
      const existP: any[] = JSON.parse(localStorage.getItem(key)||"[]");
      const existPIds = new Set(existP.map((p:any)=>p.id));
      localStorage.setItem(key, JSON.stringify([...existP, ...SEED_PAYMENTS.filter(p=>!existPIds.has(p.id) && p.city === cid)]));
    });

    // ── 24. BTL ASSIGNMENTS (for Supervisor BTL Activity Mode) ───────────────
    const SEED_BTL_ASSIGNMENTS = [
      {
        assignmentId: "BTLASS-SEED-001",
        locationId: "LOC-VB-001", locationName: "Vesu Bhumi Society",
        locationType: "society", locationGpsPin: { lat: 21.1450, lng: 72.7800 },
        locationAddress: "Vesu, Surat 395007", locationContactName: "Rajesh Shah",
        locationContactMobile: "9876541230", locationStatus: "Active",
        smId: "SM-DEMO-001", smName: "Demo Sales Manager",
        supervisorId: "DEMO-SUP-001", supervisorName: "Demo Supervisor",
        scheduledDay: "Monday", scheduledTimeSlot: "7am–9am",
        proposedActivityType: "Stall + QR display",
        briefingNotes: "Meet Mr. Rajesh at Gate 2. Bring 2 standees and 50 QR flyers. Peak footfall 7:30–8:30am when residents leave for work. Parking available inside.",
        briefingUpdatedAt: new Date(Date.now() - 2*24*60*60*1000).toISOString(),
        status: "Confirmed", confirmedAt: new Date(Date.now() - 1*24*60*60*1000).toISOString(),
        sessions: [], createdAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
        approvedAt: new Date(Date.now() - 7*24*60*60*1000).toISOString(), cityId: "CITY-SURAT",
      },
      {
        assignmentId: "BTLASS-SEED-002",
        locationId: "LOC-HP-001", locationName: "HP Petrol Pump — Adajan",
        locationType: "petrol_pump", locationGpsPin: { lat: 21.1892, lng: 72.8150 },
        locationAddress: "Adajan Road, Surat 395009", locationContactName: "Vijay Patel",
        locationContactMobile: "9823456710", locationStatus: "Active",
        smId: "SM-DEMO-001", smName: "Demo Sales Manager",
        supervisorId: "DEMO-SUP-001", supervisorName: "Demo Supervisor",
        scheduledDay: "Wednesday", scheduledTimeSlot: "5am–7am",
        proposedActivityType: "QR display at kiosk counter",
        briefingNotes: "Vijay has already placed the standee at the counter. Just check QR is still there. Can also talk to waiting customers at the pump. Very busy between 5:30–6:30am.",
        briefingUpdatedAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
        status: "Upcoming",
        sessions: [
          {
            sessionId: "SES-PAST-001", assignmentId: "BTLASS-SEED-002",
            gpsAtStart: { lat: 21.1895, lng: 72.8148 }, gpsDistanceAtStart: 38,
            gpsValidated: true, sessionStart: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
            sessionEnd: new Date(Date.now() - 7*24*60*60*1000 + 2*60*60*1000).toISOString(),
            leadsSubmitted: 4, btlActivityId: "BTL-ACT-PAST-001",
            status: "Completed", smId: "SM-DEMO-001", locationId: "LOC-HP-001",
          },
        ],
        createdAt: new Date(Date.now() - 14*24*60*60*1000).toISOString(),
        approvedAt: new Date(Date.now() - 14*24*60*60*1000).toISOString(), cityId: "CITY-SURAT",
      },
      {
        assignmentId: "BTLASS-SEED-003",
        locationId: "LOC-CR-001", locationName: "Citylight Corporate Park",
        locationType: "corporate", locationGpsPin: { lat: 21.1602, lng: 72.8501 },
        locationAddress: "Citylight Road, Surat 395005", locationContactName: "Meena Joshi",
        locationContactMobile: "9712345678", locationStatus: "At Risk",
        smId: "SM-DEMO-001", smName: "Demo Sales Manager",
        supervisorId: "DEMO-SUP-001", supervisorName: "Demo Supervisor",
        scheduledDay: "Friday", scheduledTimeSlot: "9am–11am",
        proposedActivityType: "Table top display in reception",
        briefingNotes: "Meena is the HR manager. Confirm visit 1 day before. Need to sign in at reception. QR to be placed at the visitor lounge table. Employees interested in SUV wash plans.",
        status: "Upcoming", sessions: [],
        createdAt: new Date(Date.now() - 10*24*60*60*1000).toISOString(),
        approvedAt: new Date(Date.now() - 10*24*60*60*1000).toISOString(), cityId: "CITY-SURAT",
      },
    ];
    const btlAssignKey = "cleancar_btl_assignments";
    const existingBTL: any[] = JSON.parse(localStorage.getItem(btlAssignKey)||"[]");
    const existBTLIds = new Set(existingBTL.map((a:any)=>a.assignmentId));
    localStorage.setItem(btlAssignKey, JSON.stringify([
      ...existingBTL,
      ...SEED_BTL_ASSIGNMENTS.filter(a=>!existBTLIds.has(a.assignmentId))
    ]));

    // ── 25. SM MODULE — sm_locations with real employee IDs ──────────────────
    // Uses real supervisor IDs (EDB-SUP-SUR1/SUR2) and SM IDs (EDB-SMGR-SUR1/SUR2)
    // so salesManagerService lookups in EMPLOYEE_DATABASE_RECORDS always resolve.
    const minsAgoSM = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
    const daysAgoSM = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

    const SM_LOCATIONS_SEED = [
      { id:"LOC-001", smId:"EDB-SMGR-SUR1", smName:"Nayan Joshi",    name:"Adajan Heights Society",   type:"Society",      address:"Adajan, Surat",         gpsLat:21.2154, gpsLng:72.7872, contactPerson:"Mr. Mehta (Secretary)", contactPhone:"+91 98765 11111", status:"Active",           approvedDate:daysAgoSM(45), qrCodeActive:true,  supervisorId:"EDB-SUP-SUR1", supervisorName:"Harish Solanki", leadsMTD:18, leadsMTDM1:12, leadsMTDM2:4, leadsMTDM3:2, conversionsMTD:7, conversionRatePct:39, payingCustomers:12, lastSupervisorActivity:minsAgoSM(180), activationBonusStatus:"paid",     previousPayingMilestone:10 },
      { id:"LOC-002", smId:"EDB-SMGR-SUR1", smName:"Nayan Joshi",    name:"Reliance Corporate Park",  type:"Corporate",    address:"Ring Road, Surat",      gpsLat:21.2048, gpsLng:72.8358, contactPerson:"HR Dept — Anita Shah",  contactPhone:"+91 98765 22222", status:"Active",           approvedDate:daysAgoSM(30), qrCodeActive:true,  supervisorId:"EDB-SUP-SUR2", supervisorName:"Bhavesh Modi",   leadsMTD:9,  leadsMTDM1:6,  leadsMTDM2:3, leadsMTDM3:0, conversionsMTD:4, conversionRatePct:44, payingCustomers:7,  lastSupervisorActivity:minsAgoSM(360), activationBonusStatus:"triggered",previousPayingMilestone:5  },
      { id:"LOC-003", smId:"EDB-SMGR-SUR1", smName:"Nayan Joshi",    name:"HP Petrol Pump - Vesu",    type:"Petrol Pump",  address:"Vesu, Surat",           gpsLat:21.1622, gpsLng:72.7889, contactPerson:"Rajesh Patel (Owner)",  contactPhone:"+91 98765 33333", status:"At Risk",          approvedDate:daysAgoSM(25), qrCodeActive:true,  supervisorId:"EDB-SUP-SUR1", supervisorName:"Harish Solanki", leadsMTD:3,  leadsMTDM1:3,  leadsMTDM2:0, leadsMTDM3:0, conversionsMTD:1, conversionRatePct:33, payingCustomers:2,  lastSupervisorActivity:minsAgoSM(2880),activationBonusStatus:"pending",  previousPayingMilestone:0  },
      { id:"LOC-004", smId:"EDB-SMGR-SUR2", smName:"Kalpesh Rathod", name:"Ghod Dod RWA",             type:"RWA",          address:"Ghod Dod Road, Surat",  gpsLat:21.1930, gpsLng:72.8052, contactPerson:"President RWA - Mr. Iyer",contactPhone:"+91 98765 44444",status:"Active Prospect",  approvedDate:daysAgoSM(8),  qrCodeActive:true,  supervisorId:"EDB-SUP-SUR2", supervisorName:"Bhavesh Modi",   leadsMTD:0,  leadsMTDM1:0,  leadsMTDM2:0, leadsMTDM3:0, conversionsMTD:0, conversionRatePct:0,  payingCustomers:0,  lastSupervisorActivity:"",             activationBonusStatus:"pending",  previousPayingMilestone:0  },
      { id:"LOC-005", smId:"EDB-SMGR-SUR2", smName:"Kalpesh Rathod", name:"VIP Road Mall",            type:"Shop-in-Shop", address:"VIP Road, Surat",       gpsLat:21.2178, gpsLng:72.8340, contactPerson:"Mall Manager",          contactPhone:"+91 98765 55555", status:"Inactive",         approvedDate:daysAgoSM(60), qrCodeActive:false, supervisorId:"EDB-SUP-SUR2", supervisorName:"Bhavesh Modi",   leadsMTD:0,  leadsMTDM1:0,  leadsMTDM2:0, leadsMTDM3:0, conversionsMTD:0, conversionRatePct:0,  payingCustomers:8,  lastSupervisorActivity:minsAgoSM(8640),activationBonusStatus:"paid",     previousPayingMilestone:5  },
      { id:"LOC-006", smId:"EDB-SMGR-SUR2", smName:"Kalpesh Rathod", name:"Piplod Township Society",  type:"Society",      address:"Piplod, Surat",         gpsLat:21.1512, gpsLng:72.7802, contactPerson:"Secretary",             contactPhone:"+91 98765 66666", status:"Pending Approval",                         qrCodeActive:false, supervisorId:null,            supervisorName:null,             leadsMTD:0,  leadsMTDM1:0,  leadsMTDM2:0, leadsMTDM3:0, conversionsMTD:0, conversionRatePct:0,  payingCustomers:0,  lastSupervisorActivity:"",             activationBonusStatus:"pending",  previousPayingMilestone:0  },
    ];
    const SM_BLOCK_DEALS_SEED = [
      { id:"BD-001", locationId:"LOC-001", locationName:"Adajan Heights Society",  smId:"EDB-SMGR-SUR1", vehicleCount:12, packageType:"Water + Shampoo",   commitmentTerm:3,  status:"Active",   approvedDate:daysAgoSM(30), activeVehicles:10, phase1Paid:true,  phase1Amount:3750, phase2Amount:3125, phase2CheckDate:daysAgoSM(-60), phase2Status:"pending", additionalVehicles:2 },
      { id:"BD-002", locationId:"LOC-002", locationName:"Reliance Corporate Park", smId:"EDB-SMGR-SUR1", vehicleCount:22, packageType:"PROTECT",       commitmentTerm:6,  status:"Approved", approvedDate:daysAgoSM(5),  activeVehicles:0,  phase1Paid:false, phase1Amount:7500, phase2Amount:3750, phase2CheckDate:daysAgoSM(-90), phase2Status:"pending", additionalVehicles:0 },
    ];
    // Only seed if not already present (so user-added data isn't wiped)
    if (!localStorage.getItem("sm_locations"))   localStorage.setItem("sm_locations",   JSON.stringify(SM_LOCATIONS_SEED));
    if (!localStorage.getItem("sm_block_deals")) localStorage.setItem("sm_block_deals", JSON.stringify(SM_BLOCK_DEALS_SEED));

    // ── 26. SH MODULE — sh_tce_performance with real TSE employee IDs ─────────
    // SalesHeadService reads sh_tce_performance first before falling back to seedTCEStatuses().
    // Using real IDs ensures the SH app TCE list is in sync with the employee directory.
    const SH_TCE_PERF = [
      { id:"EDB-TSE-SUR1", name:"Pooja Sharma",  closuresMTD:28, gateColor:"AMBER", slaCompliancePct:88, planMixPct:65, churnCount30d:1, lastCallTime:minsAgoSM(18), incentiveForecast:4200, status:"ON_CALL" },
      { id:"EDB-TSE-SUR2", name:"Ankit Trivedi", closuresMTD:14, gateColor:"RED",   slaCompliancePct:72, planMixPct:48, churnCount30d:3, lastCallTime:minsAgoSM(95), incentiveForecast:1800, status:"ACTIVE"  },
    ];
    if (!localStorage.getItem("sh_tce_performance")) {
      localStorage.setItem("sh_tce_performance", JSON.stringify(SH_TCE_PERF));
    }
    // Also seed sh_tce_statuses (what SalesHeadService.STORE_KEYS.TCE_STATUSES reads)
    if (!localStorage.getItem("sh_tce_statuses")) {
      localStorage.setItem("sh_tce_statuses", JSON.stringify(SH_TCE_PERF));
    }

    // ── 27. SM MODULE — per-SM leads with real customer IDs ──────────────────────
    // These leads are visible in SH app pipeline, come from SM locations,
    // and are attributed to real customers seeded in CUSTOMERS array.
    const SM_LEADS_SEED = [
      { id:"SH-L-001", customerName:"Vikram Singh",   phone:"+91 98765 43219", vehicleType:"4W", vehicleCategory:"SUV",     source:"SM-Alliance-Supervisor", status:"New",         assignedTo:null,          ageMinutes:35,  estimatedValue:2499, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT" },
      { id:"SH-L-002", customerName:"Sneha Mehta",    phone:"+91 98765 43220", vehicleType:"4W", vehicleCategory:"Hatchback",source:"SM-Alliance-QR",         status:"Contacted",   assignedTo:"EDB-TSE-SUR1",ageMinutes:62,  estimatedValue:1999, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT" },
      { id:"SH-L-003", customerName:"Rohan Patel",    phone:"+91 98765 43221", vehicleType:"4W", vehicleCategory:"Sedan",   source:"SM-Alliance-WhatsApp",   status:"Demo Booked", assignedTo:"EDB-TSE-SUR1",ageMinutes:15,  estimatedValue:1199, smId:"EDB-SMGR-SUR1", smLocationName:"Reliance Corporate Park",  cityId:"CITY-SURAT" },
      { id:"SH-L-004", customerName:"Meera Desai",    phone:"+91 98765 43222", vehicleType:"4W", vehicleCategory:"Sedan",   source:"SM-Alliance-QR",         status:"Contacted",   assignedTo:"EDB-TSE-SUR2",ageMinutes:90,  estimatedValue:699,  smId:"EDB-SMGR-SUR2", smLocationName:"Ghod Dod RWA",            cityId:"CITY-SURAT" },
      { id:"SH-L-005", customerName:"Arjun Shah",     phone:"+91 98765 43223", vehicleType:"4W", vehicleCategory:"SUV",     source:"SM-Alliance-Supervisor", status:"New",         assignedTo:null,          ageMinutes:125, estimatedValue:2499, smId:"EDB-SMGR-SUR2", smLocationName:"HP Petrol Pump - Vesu",   cityId:"CITY-SURAT" },
      { id:"SH-L-006", customerName:"Kavya Joshi",    phone:"+91 98765 43224", vehicleType:"4W", vehicleCategory:"Hatchback",source:"SM-Alliance-QR",         status:"Converted",   assignedTo:"EDB-TSE-SUR1",ageMinutes:480, estimatedValue:1999, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT", convertedAt:minsAgoSM(60) },
      { id:"SH-L-007", customerName:"Pradeep Gupta",  phone:"+91 98765 43225", vehicleType:"4W", vehicleCategory:"SUV",     source:"Digital-Inbound",        status:"Contacted",   assignedTo:"EDB-TSE-SUR2",ageMinutes:22,  estimatedValue:1699, smId:null,             smLocationName:null,                      cityId:"CITY-SURAT" },
      { id:"SH-L-008", customerName:"Nita Varma",     phone:"+91 98765 43226", vehicleType:"4W", vehicleCategory:"Hatchback",source:"SM-Alliance-Supervisor", status:"No Response", assignedTo:"EDB-TSE-SUR1",ageMinutes:360, estimatedValue:999,  smId:"EDB-SMGR-SUR3", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT" },
    ];
    if (!localStorage.getItem("sh_leads")) {
      localStorage.setItem("sh_leads", JSON.stringify(SM_LEADS_SEED));
    }

    // ── 28. BUY PAGE → SYSTEM SYNC: Seed 5 web-purchased subscriptions ─────────
    // These simulate customers who purchased from /buy page.
    // Data flows into: cleancar_web_invoices, cc360_subscriptions (via DataService SUBSCRIPTIONS key),
    // CUSTOMERS (via DataService CUSTOMERS key), FINANCE_REVENUES, SH pipeline
    const now = new Date();
    const dAgo = (d: number) => new Date(now.getTime() - d*86400000).toISOString();
    const WEB_CUSTOMERS = [
      { customerId:"WEBCUST-001", firstName:"Hetal",    lastName:"Shah",   phone:"9723456781", email:"hetal@example.com",  vehicle:"Maruti Swift",   reg:"GJ05AA1234", category:"hatchback", plan:"SHINE",     amount:1199,  cityId:"CITY-SURAT", pincode:"395007", address:"A-12 Vesu Residency, Surat", daysAgo:5  },
      { customerId:"WEBCUST-002", firstName:"Jigar",    lastName:"Patel",  phone:"9823456782", email:"jigar@example.com",  vehicle:"Hyundai Creta",  reg:"GJ05BB5678", category:"suv",       plan:"PROTECT",   amount:1999, cityId:"CITY-SURAT", pincode:"395009", address:"B-7 Adajan Heights, Surat",  daysAgo:12 },
      { customerId:"WEBCUST-003", firstName:"Minal",    lastName:"Desai",  phone:"9623456783", email:"minal@example.com",  vehicle:"Toyota Fortuner",reg:"GJ05CC9012", category:"luxury",    plan:"ELITE",  amount:3499, cityId:"CITY-SURAT", pincode:"395005", address:"C-3 Citylight Road, Surat",  daysAgo:2  },
      { customerId:"WEBCUST-004", firstName:"Rakesh",   lastName:"Thakkar",phone:"9523456784", email:"rakesh@example.com", vehicle:"Tata Nexon",     reg:"GJ05DD3456", category:"suv",       plan:"SHINE",     amount:1499, cityId:"CITY-SURAT", pincode:"395007", address:"D-15 Pal Village, Surat",    daysAgo:20 },
      { customerId:"WEBCUST-005", firstName:"Sneha",    lastName:"Agarwal",phone:"9423456785", email:"sneha@example.com",  vehicle:"Baleno",         reg:"GJ05EE7890", category:"hatchback", plan:"PROTECT",   amount:1599, cityId:"CITY-SURAT", pincode:"395005", address:"E-9 Piplod Township, Surat", daysAgo:8  },
    ];

    const existingWebInvoices: any[] = JSON.parse(localStorage.getItem("cleancar_web_invoices") || "[]");
    const existingWebIds = new Set(existingWebInvoices.map((i: any) => i.invoiceNumber));

    WEB_CUSTOMERS.forEach((wc) => {
      const invNum = `INV-WEB-${wc.daysAgo.toString().padStart(2,"0")}-${wc.customerId}`;
      if (existingWebIds.has(invNum)) return; // don't duplicate

      const purchasedAt = dAgo(wc.daysAgo);
      const grossAmount = wc.amount;
      const cgst = +(grossAmount * 0.09).toFixed(2);
      const sgst = +(grossAmount * 0.09).toFixed(2);
      const grandTotal = +(grossAmount * 1.18).toFixed(2);

      const invoice = {
        invoiceNumber:   invNum,
        invoiceDate:     new Date(purchasedAt).toLocaleDateString("en-IN"),
        customerName:    `${wc.firstName} ${wc.lastName}`,
        customerId:      wc.customerId,
        customerPhone:   wc.phone,
        customerEmail:   wc.email,
        vehicleReg:      wc.reg,
        vehicleCategory: wc.category,
        address:         wc.address,
        pincode:         wc.pincode,
        items:           [{ name: `${wc.plan} — Monthly Subscription (${wc.category})`, qty: 1, rate: grossAmount, amount: grossAmount }],
        subtotal:        grossAmount,
        cgst,
        sgst,
        grandTotal,
        paymentMethod:   "Razorpay (UPI)",
        subscriptionId:  `SUB-WEB-${wc.customerId}`,
        cityId:          wc.cityId,
        createdAt:       purchasedAt,
        status:          "PAID",
        source:          "web-buy-page",
      };
      existingWebInvoices.push(invoice);
    });
    localStorage.setItem("cleancar_web_invoices", JSON.stringify(existingWebInvoices));

    // Sync web customers into CUSTOMERS DataService key
    const customersDSKey = `cleancar_CITY-SURAT_customers`;
    const existingCustDS: any[] = JSON.parse(localStorage.getItem(customersDSKey) || "[]");
    const existingCustIds = new Set(existingCustDS.map((c: any) => c.customerId));
    WEB_CUSTOMERS.forEach(wc => {
      if (existingCustIds.has(wc.customerId)) return;
      existingCustDS.push({
        customerId:     wc.customerId,
        firstName:      wc.firstName,
        lastName:       wc.lastName,
        email:          wc.email,
        phone:          wc.phone,
        city:           "Surat",
        cityId:         wc.cityId,
        address:        { line1: wc.address, area: wc.pincode, city: "Surat", pinCode: wc.pincode },
        vehicleDetails: { category: wc.category, brand: wc.vehicle.split(" ")[0], color: "", registrationNumber: wc.reg },
        leadSource:     "Website — Buy Page",
        status:         "Active",
        tags:           ["web-signup"],
        createdAt:      dAgo(wc.daysAgo),
        updatedAt:      dAgo(wc.daysAgo),
      });
    });
    localStorage.setItem(customersDSKey, JSON.stringify(existingCustDS));

    // Sync web subscriptions into SUBSCRIPTIONS DataService key
    const subsDSKey = `cleancar_CITY-SURAT_subscriptions`;
    const existingSubsDS: any[] = JSON.parse(localStorage.getItem(subsDSKey) || "[]");
    const existingSubIds = new Set(existingSubsDS.map((s: any) => s.subscriptionId));
    WEB_CUSTOMERS.forEach(wc => {
      const subId = `SUB-WEB-${wc.customerId}`;
      if (existingSubIds.has(subId)) return;
      const startDate = dAgo(wc.daysAgo).split("T")[0];
      const renewalDate = dAgo(wc.daysAgo - 30).split("T")[0];
      existingSubsDS.push({
        subscriptionId: subId,
        customerId:     wc.customerId,
        packageType:    wc.plan.includes("Wax") ? "Premium" : wc.plan.includes("Shampoo") ? "Standard" : "Basic",
        packageName:    wc.plan,
        frequency:      "Daily",
        status:         "Active",
        startDate,
        renewalDate,
        pricing:        { basePrice: wc.amount, discount: 0, finalPrice: wc.amount, currency: "INR" },
        serviceDetails: { vehicleType: wc.category, addOns: [], preferredTimeSlot: "Morning (7am – 9am)" },
        billingCycle:   "Monthly",
        paymentStatus:  "Paid",
        cityId:         wc.cityId,
        source:         "web-buy-page",
        createdAt:      dAgo(wc.daysAgo),
      });
    });
    localStorage.setItem(subsDSKey, JSON.stringify(existingSubsDS));

    // Sync web revenues into FINANCE_REVENUES DataService key
    const revKey = `cleancar_CITY-SURAT_revenues`;
    const existingRevs: any[] = JSON.parse(localStorage.getItem(revKey) || "[]");
    const existingRevIds = new Set(existingRevs.map((r: any) => r.invoiceNumber));
    WEB_CUSTOMERS.forEach(wc => {
      const invNum = `INV-WEB-${wc.daysAgo.toString().padStart(2,"0")}-${wc.customerId}`;
      if (existingRevIds.has(invNum)) return;
      existingRevs.push({
        revenueId:      `REV-WEB-${wc.customerId}`,
        customerId:     wc.customerId,
        subscriptionId: `SUB-WEB-${wc.customerId}`,
        type:           "Subscription",
        amount:         wc.amount,
        receivedDate:   dAgo(wc.daysAgo).split("T")[0],
        paymentMethod:  "Razorpay",
        invoiceNumber:  invNum,
        status:         "Received",
        cityId:         wc.cityId,
        source:         "web-buy-page",
        createdAt:      dAgo(wc.daysAgo),
      });
    });
    localStorage.setItem(revKey, JSON.stringify(existingRevs));

    // ── 29. SH MODULE — sh_leads with SM attribution for web customers ─────────
    // Leads from buy page attributed to SM alliance locations appear in SH pipeline
    const existingSHLeads: any[] = JSON.parse(localStorage.getItem("sh_leads") || "[]");
    const existingSHIds = new Set(existingSHLeads.map((l: any) => l.id));
    const WEB_SH_LEADS = [
      { id:"SH-L-W01", customerName:"Hetal Shah",     phone:"9723456781", vehicleType:"4W", vehicleCategory:"Hatchback", source:"SM-Alliance-QR",   status:"Converted", assignedTo:"EDB-TSE-SUR1", ageMinutes:7200, estimatedValue:1199, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT", convertedAt:dAgo(5),  invoiceNumber:"INV-WEB-05-WEBCUST-001" },
      { id:"SH-L-W02", customerName:"Jigar Patel",    phone:"9823456782", vehicleType:"4W", vehicleCategory:"SUV",       source:"SM-Alliance-Supervisor",status:"Converted",assignedTo:"EDB-TSE-SUR2",ageMinutes:17280,estimatedValue:1999, smId:"EDB-SMGR-SUR1", smLocationName:"Reliance Corporate Park", cityId:"CITY-SURAT", convertedAt:dAgo(12), invoiceNumber:"INV-WEB-12-WEBCUST-002" },
      { id:"SH-L-W03", customerName:"Minal Desai",    phone:"9623456783", vehicleType:"4W", vehicleCategory:"Luxury",    source:"Digital-Inbound",  status:"Converted", assignedTo:"EDB-TSE-SUR1", ageMinutes:2880, estimatedValue:2999, smId:null,             smLocationName:null,                      cityId:"CITY-SURAT", convertedAt:dAgo(2),  invoiceNumber:"INV-WEB-02-WEBCUST-003" },
      { id:"SH-L-W04", customerName:"Rakesh Thakkar", phone:"9523456784", vehicleType:"4W", vehicleCategory:"SUV",       source:"SM-Alliance-QR",   status:"Converted", assignedTo:"EDB-TSE-SUR2", ageMinutes:28800,estimatedValue:1099, smId:"EDB-SMGR-SUR2", smLocationName:"HP Petrol Pump - Vesu",   cityId:"CITY-SURAT", convertedAt:dAgo(20), invoiceNumber:"INV-WEB-20-WEBCUST-004" },
      { id:"SH-L-W05", customerName:"Sneha Agarwal",  phone:"9423456785", vehicleType:"4W", vehicleCategory:"Hatchback", source:"SM-Alliance-WhatsApp",status:"Converted",assignedTo:"EDB-TSE-SUR1",ageMinutes:11520,estimatedValue:1499, smId:"EDB-SMGR-SUR3", smLocationName:"Piplod Township Society", cityId:"CITY-SURAT", convertedAt:dAgo(8),  invoiceNumber:"INV-WEB-08-WEBCUST-005" },
    ];
    WEB_SH_LEADS.forEach(l => { if (!existingSHIds.has(l.id)) existingSHLeads.push(l); });
    localStorage.setItem("sh_leads", JSON.stringify(existingSHLeads));

    // ── 30. SM LOCATIONS — update conversion counts from web customers ─────────
    // Reflect the web-purchased customers in the SM location conversion counts
    // so SM gate status and SH visibility are accurate.
    try {
      const smLocs: any[] = JSON.parse(localStorage.getItem("sm_locations") || "[]");
      if (smLocs.length > 0) {
        // Update LOC-001 (Adajan Heights) +2 conversions (Hetal + Jigar)
        const loc1 = smLocs.find((l: any) => l.id === "LOC-001");
        if (loc1) { loc1.conversionsMTD = Math.max(loc1.conversionsMTD, 9); loc1.payingCustomers = Math.max(loc1.payingCustomers, 14); }
        // Update LOC-003 (HP Petrol Pump) +1 conversion (Rakesh)
        const loc3 = smLocs.find((l: any) => l.id === "LOC-003");
        if (loc3) { loc3.conversionsMTD = Math.max(loc3.conversionsMTD, 3); loc3.payingCustomers = Math.max(loc3.payingCustomers, 3); loc3.status = "Active"; }
        localStorage.setItem("sm_locations", JSON.stringify(smLocs));
      }
    } catch (_) {}

    // SEED_FLAG already set at start

    // ── 31. SHIFTS ───────────────────────────────────────────────────────────
    if (!localStorage.getItem("cleancar_shifts")) {
      const SHIFTS = [
        { id: "SHIFT-A", name: "Morning Shift", startTime: "06:00", endTime: "10:00", timeBand: "BAND_A",
          days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true, cityId: "CITY-SURAT",
          description: "Early morning doorstep wash — before office hours" },
        { id: "SHIFT-B", name: "Day Shift",     startTime: "10:00", endTime: "14:00", timeBand: "BAND_B",
          days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true, cityId: "CITY-SURAT",
          description: "Mid-morning wash — society & office parking" },
        { id: "SHIFT-C", name: "Evening Shift", startTime: "17:00", endTime: "21:00", timeBand: "BAND_C",
          days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true, cityId: "CITY-SURAT",
          description: "Post-office hours — return from work" },
        { id: "SHIFT-D", name: "Morning Shift (Mumbai)", startTime: "06:00", endTime: "10:00", timeBand: "BAND_A",
          days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true, cityId: "CITY-MUMBAI",
          description: "Mumbai early morning shift" },
        { id: "SHIFT-E", name: "Day Shift (Mumbai)",     startTime: "10:00", endTime: "14:00", timeBand: "BAND_B",
          days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], active: true, cityId: "CITY-MUMBAI",
          description: "Mumbai mid-morning shift" },
      ];
      _set("cleancar_shifts", JSON.stringify(SHIFTS));
    }

    // ── 32. HR DEPARTMENTS & DESIGNATIONS ─────────────────────────────────────
    if (!localStorage.getItem("hrdata:departments")) {
      const DEPARTMENTS = [
        { id: "DEPT-OPS",   name: "Operations",       code: "OPS",  headcount: 0 },
        { id: "DEPT-SALES", name: "Sales",             code: "SALES",headcount: 0 },
        { id: "DEPT-MGMT",  name: "Management",        code: "MGMT", headcount: 0 },
        { id: "DEPT-SUP",   name: "Customer Support",  code: "CS",   headcount: 0 },
        { id: "DEPT-FIN",   name: "Finance & Accounts",code: "FIN",  headcount: 0 },
        { id: "DEPT-HR",    name: "Human Resources",   code: "HR",   headcount: 0 },
        { id: "DEPT-STORE", name: "Store & Inventory", code: "STORE",headcount: 0 },
      ];
      _set("hrdata:departments", JSON.stringify(DEPARTMENTS));
    }
    if (!localStorage.getItem("hrdata:designations")) {
      const DESIGNATIONS = [
        { id: "DES-SA",  name: "Super Admin",            department: "DEPT-MGMT",  level: 10, isOps: false },
        { id: "DES-ADM", name: "Admin",                   department: "DEPT-MGMT",  level: 9,  isOps: false },
        { id: "DES-CM",  name: "City Manager",            department: "DEPT-MGMT",  level: 8,  isOps: true  },
        { id: "DES-CLM", name: "Cluster Manager",         department: "DEPT-OPS",   level: 7,  isOps: true  },
        { id: "DES-SOM", name: "Sr Operations Manager",   department: "DEPT-OPS",   level: 6,  isOps: true  },
        { id: "DES-OM",  name: "Operations Manager",      department: "DEPT-OPS",   level: 5,  isOps: true  },
        { id: "DES-SUP", name: "Supervisor",              department: "DEPT-OPS",   level: 4,  isOps: true  },
        { id: "DES-CW",  name: "Car Washer",              department: "DEPT-OPS",   level: 1,  isOps: true  },
        { id: "DES-TSM", name: "TSM",                     department: "DEPT-SALES", level: 6,  isOps: false },
        { id: "DES-TSE", name: "TSE",                     department: "DEPT-SALES", level: 3,  isOps: false },
        { id: "DES-CCE", name: "CCE",                     department: "DEPT-SUP",   level: 3,  isOps: false },
        { id: "DES-SH",  name: "Sales Head",              department: "DEPT-SALES", level: 7,  isOps: false },
        { id: "DES-SM",  name: "Sales Manager",           department: "DEPT-SALES", level: 5,  isOps: false },
        { id: "DES-STM", name: "Store Manager",           department: "DEPT-STORE", level: 5,  isOps: false },
        { id: "DES-HR",  name: "HR",                      department: "DEPT-HR",    level: 5,  isOps: false },
        { id: "DES-ACC", name: "Accounts",                department: "DEPT-FIN",   level: 5,  isOps: false },
      ];
      _set("hrdata:designations", JSON.stringify(DESIGNATIONS));
    }
    if (!localStorage.getItem("hrdata:holidays")) {
      const HOLIDAYS_2026 = [
        { id: "HOL-01", name: "Republic Day",       date: "2026-01-26", type: "National", cityId: "ALL" },
        { id: "HOL-02", name: "Holi",               date: "2026-03-04", type: "Festival", cityId: "ALL" },
        { id: "HOL-03", name: "Ram Navami",         date: "2026-04-07", type: "Festival", cityId: "ALL" },
        { id: "HOL-04", name: "Ambedkar Jayanti",   date: "2026-04-14", type: "National", cityId: "ALL" },
        { id: "HOL-05", name: "Maharashtra Day",    date: "2026-05-01", type: "State",    cityId: "CITY-MUMBAI" },
        { id: "HOL-06", name: "Independence Day",   date: "2026-08-15", type: "National", cityId: "ALL" },
        { id: "HOL-07", name: "Gandhi Jayanti",     date: "2026-10-02", type: "National", cityId: "ALL" },
        { id: "HOL-08", name: "Dussehra",           date: "2026-10-10", type: "Festival", cityId: "ALL" },
        { id: "HOL-09", name: "Diwali",             date: "2026-10-30", type: "Festival", cityId: "ALL" },
        { id: "HOL-10", name: "Diwali Day 2",       date: "2026-10-31", type: "Festival", cityId: "ALL" },
        { id: "HOL-11", name: "Christmas",          date: "2026-12-25", type: "National", cityId: "ALL" },
      ];
      _set("cleancar_public_holidays", JSON.stringify(HOLIDAYS_2026));
    }

    // ── 33. CLOTH TRACKING ────────────────────────────────────────────────────
    if (!localStorage.getItem("cc360_cloth_items_seeded")) {
      const CLOTH_ITEMS_SEED = [];
      const CLOTH_TYPES = [
        { type: "microfibre_cloth", name: "Microfibre Cloth",    issuedTo: "washer", lifeWashes: 50  },
        { type: "wash_mitt",        name: "Wash Mitt",           issuedTo: "washer", lifeWashes: 100 },
        { type: "apron",            name: "Apron",               issuedTo: "washer", lifeWashes: 200 },
        { type: "gloves",           name: "Nitrile Gloves (pair)",issuedTo:"washer", lifeWashes: 30  },
        { type: "drying_towel",     name: "Drying Towel",        issuedTo: "washer", lifeWashes: 80  },
      ];
      const SUR_WASHERS = EMPLOYEES.filter((e: any) =>
        (e.designation === "Car Washer" || e.designation === "Supervisor") && e.cityId === "CITY-SURAT"
      );
      let clothSeq = 1;
      for (const washer of SUR_WASHERS) {
        for (const ct of CLOTH_TYPES) {
          CLOTH_ITEMS_SEED.push({
            id: `CLOTH-${String(clothSeq++).padStart(4,"0")}`,
            clothType: ct.type,
            name: ct.name,
            assignedTo: washer.id,
            assignedToName: washer.fullName,
            issuedDate: "2026-01-01",
            condition: clothSeq % 5 === 0 ? "Replace Soon" : "Good",
            washCount: Math.floor(Math.random() * ct.lifeWashes * 0.6),
            maxWashLife: ct.lifeWashes,
            cityId: "CITY-SURAT",
            status: "Active",
          });
        }
      }
      const DataSvc = { setAll: (k: string, v: any[]) => _set(k.startsWith("cleancar_") ? k : `cleancar_${k}`, JSON.stringify(v)) };
      _set("cleancar_CLOTH_ITEMS", JSON.stringify(CLOTH_ITEMS_SEED));
      _set("cleancar_CITY-SURAT_CLOTH_ITEMS", JSON.stringify(CLOTH_ITEMS_SEED));
      _set("cc360_cloth_items_seeded", "true");
    }

    // ── 34. LEAVE ADJUSTMENT POLICY ──────────────────────────────────────────
    if (!localStorage.getItem("cc360_leaveAdjustmentPolicy")) {
      const LEAVE_POLICY = {
        version: 1,
        effectiveFrom: "2026-01-01",
        casualLeave:  { entitled: 12, carryForward: 0, encashment: false },
        sickLeave:    { entitled: 7,  carryForward: 0, encashment: false },
        earnedLeave:  { entitled: 15, carryForward: 30, encashment: true },
        lopPerDay:    "salary / 26",
        graceAbsents: 1,  // absences ignored before LOP kicks in
        notes: "LOP = gross / 26 × absent days. 1 grace absent per month.",
      };
      _set("cc360_leaveAdjustmentPolicy", JSON.stringify(LEAVE_POLICY));
    }

    // ── 35. SHIFT PERSONAL CLOSURES (Sales Head) ──────────────────────────────
    if (!localStorage.getItem("sh_personal_closures_count")) {
      _set("sh_personal_closures_count", JSON.stringify({ count: 7, target: 10, month: "2026-04" }));
    }


    // ── 36-42. RICH DEMO DATA for SM/SH incentive modules ──────────────────
    // These run every seed or on version bump — they're idempotent (check before overwrite)
    const RICH_SEED_VERSION = "v2";
    const richSeedDone = localStorage.getItem("cc360_rich_seed_version") === RICH_SEED_VERSION;
    if (!richSeedDone) {
      // Clear stale sm_locations so enriched data loads fresh
      localStorage.removeItem("sm_locations");
      localStorage.removeItem("sm_block_deals");
      localStorage.removeItem("sm_alerts");
      localStorage.removeItem("sm_expenses");
      localStorage.removeItem("sh_tce_performance");
      localStorage.removeItem("sh_tce_statuses"); // force reload from new sh_tce_performance
    }

    // ── 36. SM MODULE — enrich sm_locations with more realistic data ─────────
    {
      const raw = localStorage.getItem("sm_locations");
      if (raw) {
        try {
          const locs: any[] = JSON.parse(raw);
          // Enrich existing locations with richer conversion data
          const enriched = locs.map((l: any, i: number) => ({
            ...l,
            // Ensure enough leads/conversions so gate clears visibly
            leadsMTD:      l.leadsMTD      || [22, 18, 8, 6, 4, 3][i] || 3,
            leadsMTDM1:    l.leadsMTDM1    || [14, 11, 5, 4, 2, 2][i] || 2,
            leadsMTDM2:    l.leadsMTDM2    || [5,  5,  2, 1, 1, 1][i] || 1,
            leadsMTDM3:    l.leadsMTDM3    || [3,  2,  1, 1, 1, 0][i] || 0,
            conversionsMTD:l.conversionsMTD|| [8,  6,  3, 2, 1, 0][i] || 0,
            conversionRatePct: l.conversionRatePct || [36, 33, 37, 33, 25, 0][i] || 0,
            payingCustomers:   l.payingCustomers   || [12, 9,  5, 3, 8, 0][i] || 0,
            previousPayingMilestone: l.previousPayingMilestone || [10, 5, 5, 0, 5, 0][i] || 0,
          }));
          localStorage.setItem("sm_locations", JSON.stringify(enriched));
        } catch { /**/ }
      }
    }

    // ── 37. SM MODULE — enrich sm_block_deals with all required fields ────────
    {
      const raw = localStorage.getItem("sm_block_deals");
      const daysAgoX = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
      const daysAheadX = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);
      if (raw) {
        try {
          const deals: any[] = JSON.parse(raw);
          const enriched = deals.map((d: any, i: number) => ({
            ...d,
            phase1Amount:   d.phase1Amount   ?? [3750, 3750][i] ?? 3750,
            phase2Amount:   d.phase2Amount   ?? [3125, 2500][i] ?? 3125,
            phase2CheckDate:d.phase2CheckDate|| daysAheadX([45, 20][i] || 30),
            phase2Status:   d.phase2Status   || ["pending", "due"][i]   || "pending",
            additionalVehicles: d.additionalVehicles ?? [2, 0][i] ?? 0,
            commitmentTerm: d.commitmentTerm || [3, 6][i] || 3,
            packageType:    d.packageType    || ["Shampoo + Wax", "Water Wash"][i] || "Shampoo + Wax",
          }));
          localStorage.setItem("sm_block_deals", JSON.stringify(enriched));
        } catch { /**/ }
      } else {
        // Seed fresh block deals with all fields
        const BD_FULL = [
          { id:"BD-001", locationId:"LOC-001", locationName:"Adajan Heights Society",
            vehicleCount:12, packageType:"Shampoo + Wax", commitmentTerm:3,
            status:"Active", approvedDate:daysAgoX(30),
            activeVehicles:10, phase1Paid:true, phase1Amount:3750,
            phase2Amount:3125, phase2CheckDate:daysAheadX(45), phase2Status:"pending",
            additionalVehicles:2 },
          { id:"BD-002", locationId:"LOC-002", locationName:"Reliance Corporate Park",
            vehicleCount:20, packageType:"Water Wash", commitmentTerm:6,
            status:"Active", approvedDate:daysAgoX(15),
            activeVehicles:18, phase1Paid:true, phase1Amount:3750,
            phase2Amount:3375, phase2CheckDate:daysAheadX(20), phase2Status:"due",
            additionalVehicles:0 },
          { id:"BD-003", locationId:"LOC-004", locationName:"Ghod Dod RWA",
            vehicleCount:8, packageType:"Shampoo Wash", commitmentTerm:3,
            status:"Pending Approval", approvedDate:null,
            activeVehicles:0, phase1Paid:false, phase1Amount:3750,
            phase2Amount:0, phase2CheckDate:daysAheadX(90), phase2Status:"pending",
            additionalVehicles:0 },
        ];
        localStorage.setItem("sm_block_deals", JSON.stringify(BD_FULL));
      }
    }

    // ── 38. SM MODULE — expense claims with real amounts ─────────────────────
    if (!localStorage.getItem("sm_expenses")) {
      const dAgoE = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
      const SM_EXPENSES = [
        { id:"EC-001", activityDate:dAgoE(3), locationId:"LOC-001", locationName:"Adajan Heights Society",
          activityType:"Standee & Print Materials", amount:850, hasReceipt:true, status:"Approved" },
        { id:"EC-002", activityDate:dAgoE(5), locationId:"LOC-003", locationName:"HP Petrol Pump - Vesu",
          activityType:"Travel & Refreshments", amount:350, hasReceipt:true, status:"Submitted" },
        { id:"EC-003", activityDate:dAgoE(8), locationId:"LOC-002", locationName:"Reliance Corporate Park",
          activityType:"BTL Pamphlets (500 pcs)", amount:1200, hasReceipt:true, status:"Approved" },
        { id:"EC-004", activityDate:dAgoE(12), locationId:"LOC-001", locationName:"Adajan Heights Society",
          activityType:"Society Notice Board Print", amount:450, hasReceipt:false, status:"Draft" },
        { id:"EC-005", activityDate:dAgoE(1), locationId:"LOC-006", locationName:"Piplod Township Society",
          activityType:"QR Code Standee", amount:680, hasReceipt:true, status:"Submitted" },
      ];
      localStorage.setItem("sm_expenses", JSON.stringify(SM_EXPENSES));
    }

    // ── 39. SH MODULE — 6 TSEs for full coaching bonus illustration ──────────
    {
      const existing = localStorage.getItem("sh_tce_performance");
      if (!existing || JSON.parse(existing).length < 4) {
        const mA = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
        const SH_TCE_FULL = [
          // Surat TSEs
          { id:"EDB-TSE-SUR1", name:"Pooja Sharma",   closuresMTD:28, gateColor:"AMBER",
            slaCompliancePct:88, planMixPct:65, churnCount30d:1,
            lastCallTime:mA(18), incentiveForecast:4200, status:"ON_CALL",
            monthlyTarget:35, leadsContacted:84, conversionRate:33 },
          { id:"EDB-TSE-SUR2", name:"Ankit Trivedi",  closuresMTD:14, gateColor:"RED",
            slaCompliancePct:72, planMixPct:48, churnCount30d:3,
            lastCallTime:mA(95), incentiveForecast:1800, status:"ACTIVE",
            monthlyTarget:35, leadsContacted:62, conversionRate:22 },
          { id:"EDB-TSE-SUR3", name:"Meera Joshi",    closuresMTD:31, gateColor:"GREEN",
            slaCompliancePct:94, planMixPct:71, churnCount30d:0,
            lastCallTime:mA(8),  incentiveForecast:5100, status:"ON_CALL",
            monthlyTarget:35, leadsContacted:91, conversionRate:34 },
          // Mumbai TSEs
          { id:"EDB-TSE-MUM1", name:"Rohan Nair",     closuresMTD:19, gateColor:"AMBER",
            slaCompliancePct:85, planMixPct:55, churnCount30d:2,
            lastCallTime:mA(42), incentiveForecast:2900, status:"ACTIVE",
            monthlyTarget:35, leadsContacted:74, conversionRate:25 },
          { id:"EDB-TSE-MUM2", name:"Priya Iyer",     closuresMTD:42, gateColor:"GREEN",
            slaCompliancePct:97, planMixPct:78, churnCount30d:0,
            lastCallTime:mA(5),  incentiveForecast:7200, status:"ON_CALL",
            monthlyTarget:35, leadsContacted:110, conversionRate:38 },
          { id:"EDB-TSE-MUM3", name:"Suresh Kamat",   closuresMTD:7,  gateColor:"RED",
            slaCompliancePct:61, planMixPct:40, churnCount30d:5,
            lastCallTime:mA(240),incentiveForecast:800,  status:"BREAK",
            monthlyTarget:35, leadsContacted:38, conversionRate:18 },
        ];
        localStorage.setItem("sh_tce_performance", JSON.stringify(SH_TCE_FULL));
        // Also write to sh_tce_statuses — this is the key salesHeadService actually reads
        localStorage.setItem("sh_tce_statuses", JSON.stringify(SH_TCE_FULL));
      }
    }

    // ── 40. SH MODULE — rich sh_leads pipeline ───────────────────────────────
    {
      const existing = localStorage.getItem("sh_leads");
      const exist_arr = existing ? JSON.parse(existing) : [];
      const dAgo2 = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
      const SH_EXTRA_LEADS = [
        { id:"SH-L-001", customerName:"Vikram Singh",   phone:"+91 98765 43219", vehicleType:"4W", vehicleCategory:"SUV",       source:"SM-Alliance-Supervisor", status:"New",         assignedTo:null,             ageMinutes:35,   estimatedValue:2499, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT" },
        { id:"SH-L-002", customerName:"Sneha Mehta",    phone:"+91 98765 43220", vehicleType:"4W", vehicleCategory:"Hatchback", source:"SM-Alliance-QR",          status:"Contacted",   assignedTo:"EDB-TSE-SUR1",   ageMinutes:120,  estimatedValue:1199, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT" },
        { id:"SH-L-003", customerName:"Ravi Pillai",    phone:"+91 98765 43221", vehicleType:"4W", vehicleCategory:"Sedan",     source:"SM-Alliance-WhatsApp",    status:"Demo Scheduled",assignedTo:"EDB-TSE-SUR3",  ageMinutes:200,  estimatedValue:1799, smId:"EDB-SMGR-SUR2", smLocationName:"Reliance Corporate Park", cityId:"CITY-SURAT" },
        { id:"SH-L-004", customerName:"Ketan Shah",     phone:"+91 98765 43222", vehicleType:"4W", vehicleCategory:"SUV",       source:"SM-Alliance-Supervisor", status:"Demo Done",    assignedTo:"EDB-TSE-SUR2",   ageMinutes:360,  estimatedValue:2499, smId:"EDB-SMGR-SUR1", smLocationName:"HP Petrol Pump - Vesu",   cityId:"CITY-SURAT" },
        { id:"SH-L-005", customerName:"Mala Joshi",     phone:"+91 98765 43223", vehicleType:"2W", vehicleCategory:"Scooter",   source:"SM-Alliance-QR",          status:"Converted",   assignedTo:"EDB-TSE-SUR3",   ageMinutes:7200, estimatedValue:799,  smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-SURAT", convertedAt:dAgo2(3) },
        { id:"SH-L-006", customerName:"Deepak Verma",   phone:"+91 98765 43224", vehicleType:"4W", vehicleCategory:"Luxury",    source:"SM-Alliance-Supervisor", status:"New",          assignedTo:null,             ageMinutes:15,   estimatedValue:3999, smId:"EDB-SMGR-SUR2", smLocationName:"Reliance Corporate Park", cityId:"CITY-SURAT" },
        { id:"SH-L-007", customerName:"Sunita Rao",     phone:"+91 98765 43225", vehicleType:"4W", vehicleCategory:"Hatchback", source:"SM-Alliance-QR",          status:"Contacted",   assignedTo:"EDB-TSE-MUM1",   ageMinutes:90,   estimatedValue:1199, smId:"EDB-SMGR-SUR1", smLocationName:"Adajan Heights Society",  cityId:"CITY-MUMBAI" },
        { id:"SH-L-008", customerName:"Harish Kulkarni",phone:"+91 98765 43226", vehicleType:"4W", vehicleCategory:"SUV",       source:"SM-Alliance-WhatsApp",    status:"Demo Done",   assignedTo:"EDB-TSE-MUM2",   ageMinutes:480,  estimatedValue:2499, smId:"EDB-SMGR-SUR2", smLocationName:"Reliance Corporate Park", cityId:"CITY-MUMBAI" },
      ];
      const existIds = new Set(exist_arr.map((l: any) => l.id));
      const toAdd = SH_EXTRA_LEADS.filter((l: any) => !existIds.has(l.id));
      if (toAdd.length > 0) {
        localStorage.setItem("sh_leads", JSON.stringify([...exist_arr, ...toAdd]));
      }
    }

    // ── 41. SH MODULE — personal closures count for coaching bonus demo ──────
    if (!localStorage.getItem("sh_personal_closures_count")) {
      // 14 personal closures → Slab 2 (₹20/closure) for realistic incentive demo
      localStorage.setItem("sh_personal_closures_count",
        JSON.stringify({ count: 14, target: 10, month: new Date().toISOString().slice(0, 7) })
      );
    }

    // ── 42. SM ALERTS — richer context-aware alerts ───────────────────────────
    if (!localStorage.getItem("sm_alerts")) {
      const mAlertsAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();
      const SM_ALERTS_FULL = [
        { id:"SA-001", type:"LOCATION_AT_RISK",  severity:"WARNING",  locationName:"HP Petrol Pump - Vesu",      message:"HP Petrol Pump - Vesu has only 3 leads this month (target: 8). Last supervisor visit was 2 days ago. Re-engage within 48 hours.",                      timestamp:mAlertsAgo(30),   actionRequired:true },
        { id:"SA-002", type:"LOCATION_INACTIVE", severity:"CRITICAL", locationName:"VIP Road Mall",              message:"VIP Road Mall — 0 leads this month. QR code may need repositioning. Contact mall manager within 24 hours or flag for status downgrade.",              timestamp:mAlertsAgo(60),   actionRequired:true },
        { id:"SA-003", type:"QR_ZERO_SCANS",     severity:"INFO",     locationName:"Ghod Dod RWA",               message:"Ghod Dod RWA — QR code placed 8 days ago, 0 scans. Confirm display placement with resident secretary and consider relocating to lift lobby.",       timestamp:mAlertsAgo(180),  actionRequired:false },
        { id:"SA-004", type:"GATE_AT_RISK",      severity:"WARNING",  locationName:null,                         message:"Lead gate at 30/30 — exactly at threshold. One lost lead will break the gate. Focus on Adajan Heights and Reliance park this week.",               timestamp:mAlertsAgo(15),   actionRequired:true },
        { id:"SA-005", type:"BLOCK_PENDING",     severity:"INFO",     locationName:"Piplod Township Society",    message:"Block deal BD-003 for Piplod Township (8 vehicles) awaiting Sales Head approval. Follow up to get approval before month-end.",                      timestamp:mAlertsAgo(240),  actionRequired:false },
        { id:"SA-006", type:"CONVERSION_LOW",    severity:"WARNING",  locationName:"HP Petrol Pump - Vesu",      message:"Conversion rate at HP Petrol Pump has dropped to 33% (was 55% last month). Check if washer team SLA is affecting customer experience.",              timestamp:mAlertsAgo(360),  actionRequired:true },
      ];
      localStorage.setItem("sm_alerts", JSON.stringify(SM_ALERTS_FULL));
    }

    // Mark rich seed version complete
    localStorage.setItem("cc360_rich_seed_version", RICH_SEED_VERSION);

    console.log(`[seedAllData] ✅ Complete seed done:\n` +
      `  Employees: ${EMPLOYEES.length} | Payroll: ${PAYROLL_RUNS.length} | Attendance: ${ATTENDANCE_RECORDS.length}\n` +
      `  Customers: ${CUSTOMERS.length} | Leads: ${LEADS.length} | Demos: ${DEMOS.length}\n` +
      `  Subscriptions: ${SUBS.length} | Jobs: ${JOBS.length} | Complaints: ${COMPLAINTS_DS.length}\n` +
      `  Inventory: ${INVENTORY_ITEMS.length} items | Stock txns: ${STOCK_TRANSACTIONS.length}\n` +
      `  Salary structures: ${SALARY_STRUCTURES.length} | Incentive plans: ${INCENTIVE_PLANS.length} | Employee incentives: ${EMPLOYEE_INCENTIVES.length}\n` +
      `  Accounting: ${LEDGERS.length} ledgers | ${ACC_ENTRIES.length} entries | ${JOURNALS.length} journals\n` +
      `  Finance: ${FINANCE_MRR.length} MRR | ${FINANCE_PAYABLES.length} payables | ${FINANCE_REVENUES.length} revenues`);
  } catch (err) {
    console.error("[seedAllData] Failed:", err);
  }
}

/**
 * seedExtendedModules — extended module seed (alias for seedAllData).
 * All modules are seeded in seedAllData(). This export exists for
 * compatibility with main.tsx imports.
 */
export function seedExtendedModules(): void {
  // All data is seeded in seedAllData() — nothing extra needed here.
  // This function is called by main.tsx after seedAllData() completes.
}
