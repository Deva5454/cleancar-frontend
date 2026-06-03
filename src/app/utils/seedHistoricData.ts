/**
 * seedHistoricData — 3-Month Realistic Historic Dataset
 *
 * Structure:
 * - 2 cities: Surat + Mumbai
 * - 4 washing teams per city, each with Supervisor + 3-4 Car Washers
 * - Full management hierarchy above teams
 * - 3 months: Feb, Mar, Apr 2026
 * - All incentive scenarios, taxation, attendance, payroll, CRM, complaints, inventory
 *
 * Run once on first load via seedHistoricData()
 */

// SEED_FLAG is declared inside seedHistoricData() as V5

// ── Password hash (Demo@1234) ──────────────────────────────────────────────
const PWD = "RGVtb0AxMjM0Q0MzNjBTQUxU";

// ── Salary helper ──────────────────────────────────────────────────────────
function sal(gross: number) {
  const basic = Math.round(gross * 0.4);
  const hra   = Math.round(basic * 0.5);
  const conv  = 1600;
  const special = Math.max(0, gross - basic - hra - conv);
  const pf   = Math.min(Math.round(basic * 0.12), 1800);
  const esic = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
  const pt   = gross >= 12000 ? 200 : gross >= 9000 ? 150 : 80;
  const net  = gross - pf - esic - pt;
  return { gross, basic, hra, conv, special, pf, esic, pt, net,
           empf: pf, emesic: gross <= 21000 ? Math.round(gross * 0.0325) : 0 };
}

// ── Date helpers ───────────────────────────────────────────────────────────
const d = (m: number, day: number) => `2026-0${m}-${String(day).padStart(2,"0")}`;
const ts = (m: number, day: number, h = 9) =>
  new Date(2026, m-1, day, h, 0, 0).toISOString();

// ─────────────────────────────────────────────────────────────────────────
// 1. EMPLOYEE DATABASE RECORDS (auth-capable)
// ─────────────────────────────────────────────────────────────────────────
const BASE_EMP = {
  tempIdAssignedDate: "2025-10-01", conversionDueDate: "2025-10-08",
  daysInTempStatus: 0, isOverdue: false, employmentStage: "Permanent",
  skillLevel: "Skilled", fatherName: "Demo Father", fatherFirstName: "Demo",
  fatherLastName: "Father", dob: "1992-01-01", gender: "Male",
  permanentAddress: "Demo Address, Surat", currentAddress: "Demo Address, Surat",
  emergencyContact: "9000099999", employeeType: "Full Time",
  dateOfJoining: "2025-10-01", probationPeriod: "3 months",
  status: "Active", onboardingPasswordSet: true, accountStatus: "active",
  failedLoginAttempts: 0, passwordHash: PWD,
};

export const HISTORIC_EMPLOYEE_DB: any[] = [
  // ── SURAT HIERARCHY ──────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-SA-01", tempId:"T-SA-01", loginMobile:"9100000001", mobile:"9100000001",
    fullName:"Rajesh Patel", firstName:"Rajesh", lastName:"Patel",
    email:"rajesh@cleancar.com", designation:"Super Admin", department:"Management",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Board",
    pinCodes:["395001"], ...sal(90000) },
  { ...BASE_EMP, id:"EDB-ADM-01", tempId:"T-ADM-01", loginMobile:"9100000002", mobile:"9100000002",
    fullName:"Kavita Shah", firstName:"Kavita", lastName:"Shah", gender:"Female",
    email:"kavita@cleancar.com", designation:"Admin", department:"Management",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Rajesh Patel",
    pinCodes:["395001"], ...sal(65000) },
  { ...BASE_EMP, id:"EDB-CM-SUR", tempId:"T-CM-SUR", loginMobile:"9100000003", mobile:"9100000003",
    fullName:"Amit Desai", firstName:"Amit", lastName:"Desai",
    email:"amit@cleancar.com", designation:"City Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Rajesh Patel",
    pinCodes:["395001","395002","395003","395005","395006","395007"],
    dateOfJoining:"2025-08-01", ...sal(72000) },
  { ...BASE_EMP, id:"EDB-CLM-SUR1", tempId:"T-CLM-SUR1", loginMobile:"9100000004", mobile:"9100000004",
    fullName:"Priya Mehta", firstName:"Priya", lastName:"Mehta", gender:"Female",
    email:"priya@cleancar.com", designation:"Cluster Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",
    pinCodes:["395001","395002","395003"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-CLM-SUR2", tempId:"T-CLM-SUR2", loginMobile:"9100000005", mobile:"9100000005",
    fullName:"Suresh Joshi", firstName:"Suresh", lastName:"Joshi",
    email:"suresh@cleancar.com", designation:"Cluster Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",
    pinCodes:["395005","395006","395007"], dateOfJoining:"2025-09-01", ...sal(52000) },
  { ...BASE_EMP, id:"EDB-SOM-SUR1", tempId:"T-SOM-SUR1", loginMobile:"9100000006", mobile:"9100000006",
    fullName:"Deepak Thakkar", firstName:"Deepak", lastName:"Thakkar",
    email:"deepak@cleancar.com", designation:"Sr Operations Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Priya Mehta",
    pinCodes:["395001","395002"], dateOfJoining:"2025-09-15", ...sal(47000) },
  { ...BASE_EMP, id:"EDB-OM-SUR1", tempId:"T-OM-SUR1", loginMobile:"9100000007", mobile:"9100000007",
    fullName:"Neha Rana", firstName:"Neha", lastName:"Rana", gender:"Female",
    email:"neha@cleancar.com", designation:"Operations Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Deepak Thakkar",
    pinCodes:["395001"], dateOfJoining:"2025-10-01", ...sal(40000) },
  { ...BASE_EMP, id:"EDB-OM-SUR2", tempId:"T-OM-SUR2", loginMobile:"9100000008", mobile:"9100000008",
    fullName:"Ravi Pandya", firstName:"Ravi", lastName:"Pandya",
    email:"ravi@cleancar.com", designation:"Operations Manager", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Deepak Thakkar",
    pinCodes:["395002"], dateOfJoining:"2025-10-01", ...sal(40000) },
  // TEAM 1 — Adajan (395001) — Supervisor + 4 Washers
  { ...BASE_EMP, id:"EDB-SUP-SUR1", tempId:"T-SUP-SUR1", loginMobile:"9100000009", mobile:"9100000009",
    fullName:"Harish Solanki", firstName:"Harish", lastName:"Solanki",
    email:"harish@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Neha Rana",
    pinCodes:["395001"], dateOfJoining:"2025-10-15", ...sal(28000) },
  { ...BASE_EMP, id:"EDB-CW-SUR1A", tempId:"T-CW-SUR1A", loginMobile:"9100000010", mobile:"9100000010",
    fullName:"Mahesh Bharwad", firstName:"Mahesh", lastName:"Bharwad", skillLevel:"Semi-Skilled",
    email:"mahesh1@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Harish Solanki",
    pinCodes:["395001"], dateOfJoining:"2025-11-01", ...sal(16000) },
  { ...BASE_EMP, id:"EDB-CW-SUR1B", tempId:"T-CW-SUR1B", loginMobile:"9100000011", mobile:"9100000011",
    fullName:"Ramesh Koli", firstName:"Ramesh", lastName:"Koli", skillLevel:"Unskilled",
    email:"ramesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Harish Solanki",
    pinCodes:["395001"], dateOfJoining:"2025-11-15", ...sal(14500) },
  { ...BASE_EMP, id:"EDB-CW-SUR1C", tempId:"T-CW-SUR1C", loginMobile:"9100000012", mobile:"9100000012",
    fullName:"Sunil Thakor", firstName:"Sunil", lastName:"Thakor", skillLevel:"Skilled",
    email:"sunil@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Harish Solanki",
    pinCodes:["395001"], dateOfJoining:"2025-11-01", ...sal(17000) },
  { ...BASE_EMP, id:"EDB-CW-SUR1D", tempId:"T-CW-SUR1D", loginMobile:"9100000013", mobile:"9100000013",
    fullName:"Jignesh Barot", firstName:"Jignesh", lastName:"Barot", skillLevel:"Semi-Skilled",
    email:"jignesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Harish Solanki",
    pinCodes:["395001"], dateOfJoining:"2025-12-01", ...sal(15500),
    employmentStage:"Temporary" },
  // TEAM 2 — Vesu (395007) — Supervisor + 3 Washers
  { ...BASE_EMP, id:"EDB-SUP-SUR2", tempId:"T-SUP-SUR2", loginMobile:"9100000014", mobile:"9100000014",
    fullName:"Bhavesh Modi", firstName:"Bhavesh", lastName:"Modi",
    email:"bhavesh@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Ravi Pandya",
    pinCodes:["395007"], dateOfJoining:"2025-10-15", ...sal(27000) },
  { ...BASE_EMP, id:"EDB-CW-SUR2A", tempId:"T-CW-SUR2A", loginMobile:"9100000015", mobile:"9100000015",
    fullName:"Nilesh Chauhan", firstName:"Nilesh", lastName:"Chauhan", skillLevel:"Skilled",
    email:"nilesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Bhavesh Modi",
    pinCodes:["395007"], dateOfJoining:"2025-11-01", ...sal(16500) },
  { ...BASE_EMP, id:"EDB-CW-SUR2B", tempId:"T-CW-SUR2B", loginMobile:"9100000016", mobile:"9100000016",
    fullName:"Dinesh Parmar", firstName:"Dinesh", lastName:"Parmar", skillLevel:"Semi-Skilled",
    email:"dinesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Bhavesh Modi",
    pinCodes:["395007"], dateOfJoining:"2025-11-15",
    status:"On Leave", ...sal(15000) },
  { ...BASE_EMP, id:"EDB-CW-SUR2C", tempId:"T-CW-SUR2C", loginMobile:"9100000017", mobile:"9100000017",
    fullName:"Arvind Vasava", firstName:"Arvind", lastName:"Vasava", skillLevel:"Unskilled",
    email:"arvind@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Bhavesh Modi",
    pinCodes:["395007"], dateOfJoining:"2025-12-15", ...sal(13500) },
  // TEAM 3 — Dumas (395006) — Supervisor + 4 Washers
  { ...BASE_EMP, id:"EDB-SUP-SUR3", tempId:"T-SUP-SUR3", loginMobile:"9100000018", mobile:"9100000018",
    fullName:"Kamlesh Vyas", firstName:"Kamlesh", lastName:"Vyas",
    email:"kamlesh@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Neha Rana",
    pinCodes:["395006"], dateOfJoining:"2025-10-01", ...sal(29000) },
  { ...BASE_EMP, id:"EDB-CW-SUR3A", tempId:"T-CW-SUR3A", loginMobile:"9100000019", mobile:"9100000019",
    fullName:"Vijay Rathod", firstName:"Vijay", lastName:"Rathod", skillLevel:"Skilled",
    email:"vijay@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kamlesh Vyas",
    pinCodes:["395006"], dateOfJoining:"2025-10-15", ...sal(17500) },
  { ...BASE_EMP, id:"EDB-CW-SUR3B", tempId:"T-CW-SUR3B", loginMobile:"9100000020", mobile:"9100000020",
    fullName:"Tushar Gamit", firstName:"Tushar", lastName:"Gamit", skillLevel:"Semi-Skilled",
    email:"tushar@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kamlesh Vyas",
    pinCodes:["395006"], dateOfJoining:"2025-11-01", ...sal(15500) },
  { ...BASE_EMP, id:"EDB-CW-SUR3C", tempId:"T-CW-SUR3C", loginMobile:"9100000021", mobile:"9100000021",
    fullName:"Paresh Prajapati", firstName:"Paresh", lastName:"Prajapati", skillLevel:"Unskilled",
    email:"paresh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kamlesh Vyas",
    pinCodes:["395006"], dateOfJoining:"2025-11-15", ...sal(14000) },
  { ...BASE_EMP, id:"EDB-CW-SUR3D", tempId:"T-CW-SUR3D", loginMobile:"9100000022", mobile:"9100000022",
    fullName:"Mayur Chaudhari", firstName:"Mayur", lastName:"Chaudhari", skillLevel:"Skilled",
    email:"mayur@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kamlesh Vyas",
    pinCodes:["395006"], dateOfJoining:"2026-01-01", ...sal(16000), employmentStage:"Temporary" },
  // TEAM 4 — Althan (395005) — Supervisor + 3 Washers
  { ...BASE_EMP, id:"EDB-SUP-SUR4", tempId:"T-SUP-SUR4", loginMobile:"9100000023", mobile:"9100000023",
    fullName:"Girish Trivedi", firstName:"Girish", lastName:"Trivedi",
    email:"girish@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Ravi Pandya",
    pinCodes:["395005"], dateOfJoining:"2025-10-01", ...sal(26000) },
  { ...BASE_EMP, id:"EDB-CW-SUR4A", tempId:"T-CW-SUR4A", loginMobile:"9100000024", mobile:"9100000024",
    fullName:"Ankur Shah", firstName:"Ankur", lastName:"Shah", skillLevel:"Skilled",
    email:"ankur@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Girish Trivedi",
    pinCodes:["395005"], dateOfJoining:"2025-10-15", ...sal(17000) },
  { ...BASE_EMP, id:"EDB-CW-SUR4B", tempId:"T-CW-SUR4B", loginMobile:"9100000025", mobile:"9100000025",
    fullName:"Rahul Patel", firstName:"Rahul", lastName:"Patel", skillLevel:"Semi-Skilled",
    email:"rahulp@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Girish Trivedi",
    pinCodes:["395005"], dateOfJoining:"2025-11-01", ...sal(15000) },
  { ...BASE_EMP, id:"EDB-CW-SUR4C", tempId:"T-CW-SUR4C", loginMobile:"9100000026", mobile:"9100000026",
    fullName:"Ketan Gohil", firstName:"Ketan", lastName:"Gohil", skillLevel:"Unskilled",
    email:"ketan@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Girish Trivedi",
    pinCodes:["395005"], dateOfJoining:"2025-12-01", ...sal(13500),
    status:"Inactive" },
  // SUPPORT ROLES — Surat
  { ...BASE_EMP, id:"EDB-TSM-SUR1", tempId:"T-TSM-SUR1", loginMobile:"9100000027", mobile:"9100000027",
    fullName:"Sanjay Kapoor", firstName:"Sanjay", lastName:"Kapoor",
    email:"sanjay@cleancar.com", designation:"TSM", department:"Sales",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",
    pinCodes:["395001","395002","395003"], dateOfJoining:"2025-09-01", ...sal(35000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR1", tempId:"T-TSE-SUR1", loginMobile:"9100000028", mobile:"9100000028",
    fullName:"Pooja Sharma", firstName:"Pooja", lastName:"Sharma", gender:"Female",
    email:"pooja@cleancar.com", designation:"TSE", department:"Sales",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Sanjay Kapoor",
    pinCodes:["395001","395002"], dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-TSE-SUR2", tempId:"T-TSE-SUR2", loginMobile:"9100000029", mobile:"9100000029",
    fullName:"Ankit Trivedi", firstName:"Ankit", lastName:"Trivedi",
    email:"ankit@cleancar.com", designation:"TSE", department:"Sales",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Sanjay Kapoor",
    pinCodes:["395005","395006"], dateOfJoining:"2025-10-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-CCE-SUR1", tempId:"T-CCE-SUR1", loginMobile:"9100000030", mobile:"9100000030",
    fullName:"Meera Jain", firstName:"Meera", lastName:"Jain", gender:"Female",
    email:"meera@cleancar.com", designation:"CCE", department:"Customer Care",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kavita Shah",
    pinCodes:["395001","395002","395005","395006","395007"],
    dateOfJoining:"2025-09-15", ...sal(20000) },
  { ...BASE_EMP, id:"EDB-HR-SUR1", tempId:"T-HR-SUR1", loginMobile:"9100000031", mobile:"9100000031",
    fullName:"Rekha Solanki", firstName:"Rekha", lastName:"Solanki", gender:"Female",
    email:"rekha@cleancar.com", designation:"HR", department:"Human Resources",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kavita Shah",
    pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-ACC-SUR1", tempId:"T-ACC-SUR1", loginMobile:"9100000032", mobile:"9100000032",
    fullName:"Chirag Doshi", firstName:"Chirag", lastName:"Doshi",
    email:"chirag@cleancar.com", designation:"Accounts", department:"Finance",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Kavita Shah",
    pinCodes:["395001"], dateOfJoining:"2025-08-01", ...sal(32000) },
  { ...BASE_EMP, id:"EDB-SM-SUR1", tempId:"T-SM-SUR1", loginMobile:"9100000033", mobile:"9100000033",
    fullName:"Nayan Desai", firstName:"Nayan", lastName:"Desai",
    email:"nayan@cleancar.com", designation:"Store Manager", department:"Inventory",
    workLocation:"CITY-SURAT", city:"Surat", reportingManager:"Amit Desai",
    pinCodes:["395001"], dateOfJoining:"2025-09-01", ...sal(28000) },
  // ── MUMBAI HIERARCHY ─────────────────────────────────────────────────────
  { ...BASE_EMP, id:"EDB-CM-MUM", tempId:"T-CM-MUM", loginMobile:"9200000001", mobile:"9200000001",
    fullName:"Ananya Singh", firstName:"Ananya", lastName:"Singh", gender:"Female",
    email:"ananya@cleancar.com", designation:"City Manager", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Rajesh Patel",
    pinCodes:["400001","400002","400003","400004","400005"],
    dateOfJoining:"2025-08-15", ...sal(75000) },
  { ...BASE_EMP, id:"EDB-CLM-MUM1", tempId:"T-CLM-MUM1", loginMobile:"9200000002", mobile:"9200000002",
    fullName:"Vivek Naik", firstName:"Vivek", lastName:"Naik",
    email:"vivek@cleancar.com", designation:"Cluster Manager", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400001","400002","400003"], dateOfJoining:"2025-09-01", ...sal(54000) },
  { ...BASE_EMP, id:"EDB-OM-MUM1", tempId:"T-OM-MUM1", loginMobile:"9200000003", mobile:"9200000003",
    fullName:"Kiran More", firstName:"Kiran", lastName:"More", gender:"Female",
    email:"kiran@cleancar.com", designation:"Operations Manager", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Vivek Naik",
    pinCodes:["400001","400002"], dateOfJoining:"2025-09-15", ...sal(42000) },
  // TEAM 5 — Bandra (400001) — Supervisor + 4 Washers
  { ...BASE_EMP, id:"EDB-SUP-MUM1", tempId:"T-SUP-MUM1", loginMobile:"9200000004", mobile:"9200000004",
    fullName:"Santosh Yadav", firstName:"Santosh", lastName:"Yadav",
    email:"santosh@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Kiran More",
    pinCodes:["400001"], dateOfJoining:"2025-10-01", ...sal(30000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1A", tempId:"T-CW-MUM1A", loginMobile:"9200000005", mobile:"9200000005",
    fullName:"Ajay Gupta", firstName:"Ajay", lastName:"Gupta", skillLevel:"Skilled",
    email:"ajay@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",
    pinCodes:["400001"], dateOfJoining:"2025-11-01", ...sal(18000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1B", tempId:"T-CW-MUM1B", loginMobile:"9200000006", mobile:"9200000006",
    fullName:"Raju Shinde", firstName:"Raju", lastName:"Shinde", skillLevel:"Semi-Skilled",
    email:"raju@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",
    pinCodes:["400001"], dateOfJoining:"2025-11-15", ...sal(16000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1C", tempId:"T-CW-MUM1C", loginMobile:"9200000007", mobile:"9200000007",
    fullName:"Pramod Jadhav", firstName:"Pramod", lastName:"Jadhav", skillLevel:"Unskilled",
    email:"pramod@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",
    pinCodes:["400001"], dateOfJoining:"2025-12-01", ...sal(15000) },
  { ...BASE_EMP, id:"EDB-CW-MUM1D", tempId:"T-CW-MUM1D", loginMobile:"9200000008", mobile:"9200000008",
    fullName:"Nilesh Mane", firstName:"Nilesh", lastName:"Mane", skillLevel:"Skilled",
    email:"nileshm@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Santosh Yadav",
    pinCodes:["400001"], dateOfJoining:"2026-01-15", ...sal(17000), employmentStage:"Temporary" },
  // TEAM 6 — Andheri (400002)
  { ...BASE_EMP, id:"EDB-SUP-MUM2", tempId:"T-SUP-MUM2", loginMobile:"9200000009", mobile:"9200000009",
    fullName:"Hemant Patil", firstName:"Hemant", lastName:"Patil",
    email:"hemant@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Kiran More",
    pinCodes:["400002"], dateOfJoining:"2025-10-01", ...sal(29000) },
  { ...BASE_EMP, id:"EDB-CW-MUM2A", tempId:"T-CW-MUM2A", loginMobile:"9200000010", mobile:"9200000010",
    fullName:"Yogesh Kamble", firstName:"Yogesh", lastName:"Kamble", skillLevel:"Semi-Skilled",
    email:"yogesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Hemant Patil",
    pinCodes:["400002"], dateOfJoining:"2025-11-01", ...sal(16500) },
  { ...BASE_EMP, id:"EDB-CW-MUM2B", tempId:"T-CW-MUM2B", loginMobile:"9200000011", mobile:"9200000011",
    fullName:"Rohit Sawant", firstName:"Rohit", lastName:"Sawant", skillLevel:"Skilled",
    email:"rohit@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Hemant Patil",
    pinCodes:["400002"], dateOfJoining:"2025-11-01", ...sal(17500) },
  { ...BASE_EMP, id:"EDB-CW-MUM2C", tempId:"T-CW-MUM2C", loginMobile:"9200000012", mobile:"9200000012",
    fullName:"Sachin Bhosle", firstName:"Sachin", lastName:"Bhosle", skillLevel:"Unskilled",
    email:"sachin@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Hemant Patil",
    pinCodes:["400002"], dateOfJoining:"2025-12-15", ...sal(14000) },
  // TEAM 7 — Dadar (400003)
  { ...BASE_EMP, id:"EDB-SUP-MUM3", tempId:"T-SUP-MUM3", loginMobile:"9200000013", mobile:"9200000013",
    fullName:"Anil Bhatt", firstName:"Anil", lastName:"Bhatt",
    email:"anil@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Kiran More",
    pinCodes:["400003"], dateOfJoining:"2025-10-01", ...sal(28000) },
  { ...BASE_EMP, id:"EDB-CW-MUM3A", tempId:"T-CW-MUM3A", loginMobile:"9200000014", mobile:"9200000014",
    fullName:"Mahendra Dalvi", firstName:"Mahendra", lastName:"Dalvi", skillLevel:"Skilled",
    email:"mahendra@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Anil Bhatt",
    pinCodes:["400003"], dateOfJoining:"2025-11-01", ...sal(18000) },
  { ...BASE_EMP, id:"EDB-CW-MUM3B", tempId:"T-CW-MUM3B", loginMobile:"9200000015", mobile:"9200000015",
    fullName:"Sunil Kadu", firstName:"Sunil", lastName:"Kadu", skillLevel:"Semi-Skilled",
    email:"sunilk@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Anil Bhatt",
    pinCodes:["400003"], dateOfJoining:"2025-11-15", ...sal(15500) },
  { ...BASE_EMP, id:"EDB-CW-MUM3C", tempId:"T-CW-MUM3C", loginMobile:"9200000016", mobile:"9200000016",
    fullName:"Ganesh Pawar", firstName:"Ganesh", lastName:"Pawar", skillLevel:"Unskilled",
    email:"ganesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Anil Bhatt",
    pinCodes:["400003"], dateOfJoining:"2025-12-01", ...sal(14500) },
  // TEAM 8 — Thane (400004)
  { ...BASE_EMP, id:"EDB-CLM-MUM2", tempId:"T-CLM-MUM2", loginMobile:"9200000017", mobile:"9200000017",
    fullName:"Devendra Kulkarni", firstName:"Devendra", lastName:"Kulkarni",
    email:"devendra@cleancar.com", designation:"Cluster Manager", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400004","400005"], dateOfJoining:"2025-09-01", ...sal(53000) },
  { ...BASE_EMP, id:"EDB-OM-MUM2", tempId:"T-OM-MUM2", loginMobile:"9200000018", mobile:"9200000018",
    fullName:"Priya Gaikwad", firstName:"Priya", lastName:"Gaikwad", gender:"Female",
    email:"priyag@cleancar.com", designation:"Operations Manager", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Devendra Kulkarni",
    pinCodes:["400004","400005"], dateOfJoining:"2025-10-01", ...sal(41000) },
  { ...BASE_EMP, id:"EDB-SUP-MUM4", tempId:"T-SUP-MUM4", loginMobile:"9200000019", mobile:"9200000019",
    fullName:"Prakash Salunkhe", firstName:"Prakash", lastName:"Salunkhe",
    email:"prakash@cleancar.com", designation:"Supervisor", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Priya Gaikwad",
    pinCodes:["400004"], dateOfJoining:"2025-10-15", ...sal(29500) },
  { ...BASE_EMP, id:"EDB-CW-MUM4A", tempId:"T-CW-MUM4A", loginMobile:"9200000020", mobile:"9200000020",
    fullName:"Umesh Mhase", firstName:"Umesh", lastName:"Mhase", skillLevel:"Skilled",
    email:"umesh@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Prakash Salunkhe",
    pinCodes:["400004"], dateOfJoining:"2025-11-01", ...sal(17500) },
  { ...BASE_EMP, id:"EDB-CW-MUM4B", tempId:"T-CW-MUM4B", loginMobile:"9200000021", mobile:"9200000021",
    fullName:"Sambhaji Kore", firstName:"Sambhaji", lastName:"Kore", skillLevel:"Semi-Skilled",
    email:"sambhaji@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Prakash Salunkhe",
    pinCodes:["400004"], dateOfJoining:"2025-11-15", ...sal(16000) },
  { ...BASE_EMP, id:"EDB-CW-MUM4C", tempId:"T-CW-MUM4C", loginMobile:"9200000022", mobile:"9200000022",
    fullName:"Datta Waghmare", firstName:"Datta", lastName:"Waghmare", skillLevel:"Unskilled",
    email:"datta@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Prakash Salunkhe",
    pinCodes:["400004"], dateOfJoining:"2025-12-01", ...sal(14500) },
  { ...BASE_EMP, id:"EDB-CW-MUM4D", tempId:"T-CW-MUM4D", loginMobile:"9200000023", mobile:"9200000023",
    fullName:"Ramchandra Shinde", firstName:"Ramchandra", lastName:"Shinde", skillLevel:"Skilled",
    email:"ramchandra@cleancar.com", designation:"Car Washer", department:"Operations",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Prakash Salunkhe",
    pinCodes:["400004"], dateOfJoining:"2026-01-01", ...sal(16500), employmentStage:"Temporary" },
  // Mumbai support
  { ...BASE_EMP, id:"EDB-TSM-MUM1", tempId:"T-TSM-MUM1", loginMobile:"9200000024", mobile:"9200000024",
    fullName:"Vikram Shetty", firstName:"Vikram", lastName:"Shetty",
    email:"vikram@cleancar.com", designation:"TSM", department:"Sales",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400001","400002","400003"], dateOfJoining:"2025-09-01", ...sal(36000) },
  { ...BASE_EMP, id:"EDB-TSE-MUM1", tempId:"T-TSE-MUM1", loginMobile:"9200000025", mobile:"9200000025",
    fullName:"Swati Parab", firstName:"Swati", lastName:"Parab", gender:"Female",
    email:"swati@cleancar.com", designation:"TSE", department:"Sales",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Vikram Shetty",
    pinCodes:["400001","400002"], dateOfJoining:"2025-10-01", ...sal(22000) },
  { ...BASE_EMP, id:"EDB-CCE-MUM1", tempId:"T-CCE-MUM1", loginMobile:"9200000026", mobile:"9200000026",
    fullName:"Nisha Kapoor", firstName:"Nisha", lastName:"Kapoor", gender:"Female",
    email:"nisha@cleancar.com", designation:"CCE", department:"Customer Care",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400001","400002","400003","400004"],
    dateOfJoining:"2025-09-15", ...sal(21000) },
  { ...BASE_EMP, id:"EDB-ACC-MUM1", tempId:"T-ACC-MUM1", loginMobile:"9200000027", mobile:"9200000027",
    fullName:"Suhas Kadam", firstName:"Suhas", lastName:"Kadam",
    email:"suhas@cleancar.com", designation:"Accounts", department:"Finance",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400001"], dateOfJoining:"2025-09-01", ...sal(33000) },
  { ...BASE_EMP, id:"EDB-HR-MUM1", tempId:"T-HR-MUM1", loginMobile:"9200000028", mobile:"9200000028",
    fullName:"Shilpa Jadhav", firstName:"Shilpa", lastName:"Jadhav", gender:"Female",
    email:"shilpa@cleancar.com", designation:"HR", department:"Human Resources",
    workLocation:"CITY-MUMBAI", city:"Mumbai", reportingManager:"Ananya Singh",
    pinCodes:["400001"], dateOfJoining:"2025-09-01", ...sal(31000) },
];

// ─────────────────────────────────────────────────────────────────────────
// 2. CUSTOMERS (200 across both cities, 3 months of subscription history)
// ─────────────────────────────────────────────────────────────────────────
const PLANS = ["Silver Monthly","Gold Monthly","Platinum Quarterly","Gold Quarterly","Silver Quarterly"];
const PLAN_PRICES: Record<string,number> = {
  "Silver Monthly":999,"Gold Monthly":1499,"Platinum Quarterly":3999,
  "Gold Quarterly":3499,"Silver Quarterly":2499
};
const AREAS_SUR = ["Adajan","Vesu","Dumas","Althan","Piplod","Varachha","Katargam"];
const AREAS_MUM = ["Bandra","Andheri","Dadar","Thane","Borivali","Malad","Powai"];
const PINS_SUR  = ["395001","395005","395006","395007","395002","395003","395004"];
const PINS_MUM  = ["400001","400002","400003","400004","400005","400006","400007"];
const VEHICLES  = ["Maruti Suzuki Baleno","Honda City","Hyundai Creta","Tata Nexon",
                   "Toyota Fortuner","Maruti Swift","Honda Amaze","Kia Seltos",
                   "Mahindra XUV500","Ford EcoSport"];

function cust(i: number, city: "Surat"|"Mumbai") {
  const isMum = city === "Mumbai";
  const areas  = isMum ? AREAS_MUM : AREAS_SUR;
  const pins   = isMum ? PINS_MUM  : PINS_SUR;
  const cid    = isMum ? `CITY-MUMBAI` : `CITY-SURAT`;
  const idx    = i % areas.length;
  const plan   = PLANS[i % PLANS.length];
  const price  = PLAN_PRICES[plan];
  const subStart = `2025-${String(10 + (i % 3)).padStart(2,"0")}-01`;
  return {
    id: `CUST-${city.slice(0,3).toUpperCase()}-${String(i+1).padStart(3,"0")}`,
    name: `Customer ${city.slice(0,3)} ${i+1}`,
    mobile: `${isMum?"9900":"9800"}${String(100000+i).slice(-6)}`,
    email: `cust${i+1}@example.com`,
    city, cityId: cid,
    area: areas[idx], pinCode: pins[idx],
    vehicle: VEHICLES[i % VEHICLES.length],
    vehicleNumber: `${isMum?"MH01":"GJ05"}${String(1000+i)}`,
    plan, price,
    subscriptionStart: subStart,
    subscriptionStatus: i % 10 === 9 ? "Cancelled" : "Active",
    totalWashes: 12 + (i % 15),
    complaints: i % 8 === 0 ? 1 : 0,
    rating: 3.5 + (i % 3) * 0.5,
    createdAt: `2025-${String(10+(i%3)).padStart(2,"0")}-01T10:00:00.000Z`,
  };
}
export const HISTORIC_CUSTOMERS: any[] = [
  ...Array.from({length:100}, (_,i) => cust(i, "Surat")),
  ...Array.from({length:100}, (_,i) => cust(i, "Mumbai")),
];

// ─────────────────────────────────────────────────────────────────────────
// 3. PAYROLL RUNS — Feb, Mar, Apr 2026 for both cities
// ─────────────────────────────────────────────────────────────────────────
function payrollRun(employeeId: string, empSal: any, month: number, year: number,
                    presentDays: number, totalDays: number, cityId: string, incentive = 0) {
  const adjustedGross = Math.round(empSal.gross * presentDays / totalDays);
  const adjustedPf    = Math.min(Math.round(adjustedGross * 0.4 * 0.12), 1800);
  const adjustedEsic  = adjustedGross <= 21000 ? Math.round(adjustedGross * 0.0075) : 0;
  const pt = presentDays >= 20 ? (adjustedGross >= 12000 ? 200 : adjustedGross >= 9000 ? 150 : 80) : 0;
  const net = adjustedGross + incentive - adjustedPf - adjustedEsic - pt;
  return {
    id: `PR-${employeeId}-${year}-${month}`,
    employeeId, cityId, month, year,
    grossSalary: adjustedGross,
    presentDays, totalDays,
    deductions: { pf_employee: adjustedPf, esic: adjustedEsic, pt },
    incentiveAmount: incentive,
    netSalary: net,
    status: month < 4 ? "Paid" : "Processed",
    processedAt: new Date(year, month, 5).toISOString(),
  };
}

// Generate payroll for all employees, 3 months
const MONTHS = [2,3,4];
const MONTH_DAYS: Record<number,number> = {2:28, 3:31, 4:30};

export const HISTORIC_PAYROLL: any[] = [];
for (const emp of HISTORIC_EMPLOYEE_DB) {
  const s = sal(emp.gross || 20000);
  for (const m of MONTHS) {
    const td = MONTH_DAYS[m];
    // Scenarios: some employees have leaves, lop
    const lop = emp.id.includes("SUR1B") && m===2 ? 3
               : emp.id.includes("SUR2B") ? 5
               : emp.id.includes("MUM1C") && m===3 ? 2
               : 0;
    const present = td - lop;
    // Incentive scenarios
    const incentive =
      emp.designation === "Car Washer" && m === 3 ? 1200
      : emp.designation === "Supervisor" && m === 4 ? 2500
      : emp.designation === "TSE" ? 3000 + (m * 200)
      : emp.designation === "TSM" ? 5000 + (m * 500)
      : 0;
    HISTORIC_PAYROLL.push(payrollRun(
      emp.id, s, m, 2026, present, td, emp.workLocation || "CITY-SURAT", incentive
    ));
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 4. LEADS
// ─────────────────────────────────────────────────────────────────────────
const LEAD_SOURCES = ["Walk-in","WhatsApp","Google Ads","Referral","Cold Call","Website","Instagram"];
const LEAD_STAGES  = ["New","Contacted","Demo Scheduled","Demo Done","Converted","Lost"];
export const HISTORIC_LEADS: any[] = [];
let leadIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  const tse  = city === "Surat" ? "EDB-TSE-SUR1" : "EDB-TSE-MUM1";
  for (let m = 2; m <= 4; m++) {
    for (let i = 0; i < 20; i++) {
      const stage = LEAD_STAGES[i % LEAD_STAGES.length];
      HISTORIC_LEADS.push({
        id: `LEAD-${city.slice(0,3).toUpperCase()}-${String(leadIdx++).padStart(3,"0")}`,
        name: `Lead ${leadIdx}`,
        mobile: `98765${String(43200+leadIdx).slice(-5)}`,
        area: city === "Surat" ? AREAS_SUR[i%7] : AREAS_MUM[i%7],
        pinCode: city === "Surat" ? PINS_SUR[i%7] : PINS_MUM[i%7],
        source: LEAD_SOURCES[i%LEAD_SOURCES.length],
        stage,
        assignedTo: tse,
        cityId: cid, city,
        createdAt: new Date(2026,m-1,1+(i%28)).toISOString(),
        followUpDate: new Date(2026,m-1,5+(i%20)).toISOString(),
        convertedAt: stage === "Converted" ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        lostReason: stage === "Lost" ? ["Price too high","Not interested","Competitor","Area not serviceable"][i%4] : undefined,
        vehicle: VEHICLES[i%VEHICLES.length],
        notes: `Follow-up call done. Customer is ${stage === "Converted" ? "subscribed" : "considering"}.`,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 5. COMPLAINTS
// ─────────────────────────────────────────────────────────────────────────
const COMPLAINT_TYPES = [
  "Missed wash","Water on seat","Scratch on car","Not cleaned properly",
  "Washer was late","Wrong vehicle cleaned","Product smell",
  "Washer was rude","Billing issue","App not working"
];
const COMPLAINT_STATUS = ["Open","In Progress","Resolved","Escalated","Closed"];
export const HISTORIC_COMPLAINTS: any[] = [];
let compIdx = 1;
for (const city of ["Surat","Mumbai"] as const) {
  const cid = city === "Surat" ? "CITY-SURAT" : "CITY-MUMBAI";
  for (let m = 2; m <= 4; m++) {
    for (let i = 0; i < 12; i++) {
      const status = COMPLAINT_STATUS[i % COMPLAINT_STATUS.length];
      HISTORIC_COMPLAINTS.push({
        id: `COMP-${city.slice(0,3).toUpperCase()}-${String(compIdx++).padStart(3,"0")}`,
        customerId: `CUST-${city.slice(0,3).toUpperCase()}-${String((i%100)+1).padStart(3,"0")}`,
        type: COMPLAINT_TYPES[i%COMPLAINT_TYPES.length],
        description: `Customer reported: ${COMPLAINT_TYPES[i%COMPLAINT_TYPES.length]}. Incident on ${d(m,5+(i*2))}.`,
        status,
        priority: i%5===0 ? "High" : i%3===0 ? "Medium" : "Low",
        cityId: cid, city,
        assignedTo: city === "Surat" ? "EDB-CCE-SUR1" : "EDB-CCE-MUM1",
        resolvedAt: ["Resolved","Closed"].includes(status) ? new Date(2026,m-1,15+(i%10)).toISOString() : undefined,
        compensation: status === "Resolved" && i%4===0 ? "Free wash credited" : undefined,
        rating: status === "Closed" ? (3 + i%3) : undefined,
        createdAt: new Date(2026,m-1,1+(i*2)).toISOString(),
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 6. ATTENDANCE (3 months × all washers/supervisors)
// ─────────────────────────────────────────────────────────────────────────
export const HISTORIC_ATTENDANCE: any[] = [];
const WASHER_IDS = HISTORIC_EMPLOYEE_DB
  .filter(e => ["Car Washer","Supervisor"].includes(e.designation))
  .map(e => e.id);
for (const empId of WASHER_IDS) {
  const emp = HISTORIC_EMPLOYEE_DB.find(e => e.id === empId)!;
  for (let m = 2; m <= 4; m++) {
    const td = MONTH_DAYS[m];
    for (let day = 1; day <= td; day++) {
      const dateStr = `2026-${String(m).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
      // Sunday = weekly off
      const dow = new Date(2026, m-1, day).getDay();
      if (dow === 0) {
        HISTORIC_ATTENDANCE.push({ id:`ATT-${empId}-${dateStr}`, employeeId:empId,
          date:dateStr, status:"WeekOff", cityId:emp.workLocation });
        continue;
      }
      // Scenarios
      const isLeave  = (empId.includes("SUR1B") && m===2 && day<=3)
                    || (empId.includes("SUR2B") && [5,6,7,8,9].includes(day))
                    || (empId.includes("MUM1C") && m===3 && [10,11].includes(day));
      const isAbsent = !isLeave && (empId.includes("SUR4C") && day===15 && m===3);
      const isLate   = !isLeave && !isAbsent && day%7===0;
      const checkIn  = isLate ? "09:35" : "09:00";
      const checkOut = "18:00";
      HISTORIC_ATTENDANCE.push({
        id:`ATT-${empId}-${dateStr}`, employeeId:empId,
        date:dateStr, cityId:emp.workLocation,
        status: isLeave?"Leave": isAbsent?"Absent": isLate?"Late":"Present",
        checkIn: isLeave||isAbsent ? undefined : checkIn,
        checkOut: isLeave||isAbsent ? undefined : checkOut,
        workHours: isLeave||isAbsent ? 0 : 9,
        lateMinutes: isLate ? 35 : 0,
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 7. INVENTORY — Surat warehouse
// ─────────────────────────────────────────────────────────────────────────
// ✅ FIXED: field names now match InventoryItem interface exactly
export const HISTORIC_INVENTORY: any[] = [
  { itemId:"INV-SUR-001", itemName:"Car Shampoo 5L",        category:"Cleaning Supplies", unit:"L",   centralStock:45,  reorderLevel:20, unitCost:480, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,15) },
  { itemId:"INV-SUR-002", itemName:"Microfiber Cloth Large", category:"Equipment",         unit:"Pcs", centralStock:120, reorderLevel:50, unitCost:85,  cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,1)  },
  { itemId:"INV-SUR-003", itemName:"Tyre Shine 500ml",       category:"Cleaning Supplies", unit:"L",   centralStock:30,  reorderLevel:15, unitCost:220, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20) },
  { itemId:"INV-SUR-004", itemName:"Dashboard Polish",        category:"Cleaning Supplies", unit:"L",   centralStock:8,   reorderLevel:20, unitCost:150, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,10) },
  { itemId:"INV-SUR-005", itemName:"Pressure Washer Nozzle", category:"Equipment",         unit:"Pcs", centralStock:6,   reorderLevel:4,  unitCost:350, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(1,15) },
  { itemId:"INV-SUR-006", itemName:"Washer Uniform Set",      category:"Consumables",       unit:"Pcs", centralStock:25,  reorderLevel:15, unitCost:650, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5)  },
  { itemId:"INV-SUR-007", itemName:"Wheel Cleaner 1L",        category:"Cleaning Supplies", unit:"L",   centralStock:18,  reorderLevel:12, unitCost:185, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,10) },
  { itemId:"INV-SUR-008", itemName:"Glass Cleaner 500ml",     category:"Cleaning Supplies", unit:"L",   centralStock:0,   reorderLevel:10, unitCost:120, cityId:"CITY-SURAT",     supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,5)  },
  { itemId:"INV-MUM-001", itemName:"Car Shampoo 5L",          category:"Cleaning Supplies", unit:"L",   centralStock:50,  reorderLevel:20, unitCost:490, cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,1)  },
  { itemId:"INV-MUM-002", itemName:"Microfiber Cloth Large",  category:"Equipment",         unit:"Pcs", centralStock:90,  reorderLevel:50, unitCost:90,  cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,10) },
  { itemId:"INV-MUM-003", itemName:"Dashboard Polish",         category:"Cleaning Supplies", unit:"L",   centralStock:22,  reorderLevel:20, unitCost:155, cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,20) },
  { itemId:"INV-MUM-004", itemName:"Washer Uniform Set",       category:"Consumables",       unit:"Pcs", centralStock:30,  reorderLevel:15, unitCost:680, cityId:"CITY-MUMBAI",    supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,5)  },
  { itemId:"INV-AHM-001", itemName:"Car Shampoo 5L",           category:"Cleaning Supplies", unit:"L",   centralStock:35,  reorderLevel:20, unitCost:475, cityId:"CITY-AHMEDABAD", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(2,28) },
  { itemId:"INV-AHM-002", itemName:"Microfiber Cloth Large",   category:"Equipment",         unit:"Pcs", centralStock:70,  reorderLevel:50, unitCost:82,  cityId:"CITY-AHMEDABAD", supervisorStock:{}, washerStock:{}, lastProcurementDate:d(3,8)  },
];

// ─────────────────────────────────────────────────────────────────────────
// 8. FINANCE ENTRIES — MRR + Payables + Revenues
// ─────────────────────────────────────────────────────────────────────────
export const HISTORIC_MRR: any[] = [];
for (const m of MONTHS) {
  HISTORIC_MRR.push(
    { id:`MRR-SUR-${m}`, cityId:"CITY-SURAT", month:m, year:2026,
      activeSubscriptions:87+(m*3), newSubscriptions:12+(m*2), churned:3+(m%3),
      revenue: 87000+(m*4500), avgRevPerSub:1150, growthRate: 8+(m*2) },
    { id:`MRR-MUM-${m}`, cityId:"CITY-MUMBAI", month:m, year:2026,
      activeSubscriptions:72+(m*4), newSubscriptions:14+(m*2), churned:4+(m%3),
      revenue: 92000+(m*5500), avgRevPerSub:1280, growthRate: 10+(m*2) }
  );
}
export const HISTORIC_REVENUES: any[] = [];
for (const m of MONTHS) {
  for (let i = 1; i <= 15; i++) {
    HISTORIC_REVENUES.push({
      revenueId: `REV-SUR-${m}-${i}`,
      customerId: `CST-SUR-00${(i % 5) + 1}`,
      type: i % 4 === 0 ? "One-Time" : "Subscription",
      amount: i % 4 === 0 ? 499 : 1150,
      receivedDate: `2026-0${m}-${String(i).padStart(2,"0")}`,
      paymentMethod: "UPI",
      status: "Received",
      cityId: "CITY-SURAT",
      createdAt: new Date(2026, m-1, i).toISOString(),
    });
  }
}
export const HISTORIC_PAYABLES: any[] = [
  { id:"PAY-SUR-001", cityId:"CITY-SURAT", type:"Vendor", vendor:"Shreeji Chemicals",
    amount:18500, dueDate:d(2,28), status:"Paid", paidDate:d(2,25),
    description:"Feb chemicals supply", invoiceNo:"INV-2026-0142" },
  { id:"PAY-SUR-002", cityId:"CITY-SURAT", type:"Vendor", vendor:"Rajkot Equipment Traders",
    amount:12000, dueDate:d(3,15), status:"Paid", paidDate:d(3,14),
    description:"Pressure washer nozzles replacement", invoiceNo:"INV-2026-0201" },
  { id:"PAY-SUR-003", cityId:"CITY-SURAT", type:"Statutory", vendor:"ESIC Office",
    amount:8450, dueDate:d(3,15), status:"Paid", paidDate:d(3,10),
    description:"ESIC contribution Feb 2026" },
  { id:"PAY-SUR-004", cityId:"CITY-SURAT", type:"Statutory", vendor:"EPFO",
    amount:24600, dueDate:d(3,15), status:"Paid", paidDate:d(3,12),
    description:"PF contribution Feb 2026" },
  { id:"PAY-SUR-005", cityId:"CITY-SURAT", type:"Vendor", vendor:"Shreeji Chemicals",
    amount:21000, dueDate:d(3,31), status:"Pending",
    description:"March chemicals supply", invoiceNo:"INV-2026-0289" },
  { id:"PAY-SUR-006", cityId:"CITY-SURAT", type:"Statutory", vendor:"Gujarat Professional Tax",
    amount:4200, dueDate:d(4,15), status:"Pending", description:"PT Q4 FY 2025-26" },
  { id:"PAY-MUM-001", cityId:"CITY-MUMBAI", type:"Vendor", vendor:"Mumbai Wash Supplies",
    amount:22000, dueDate:d(2,28), status:"Paid", paidDate:d(2,26),
    description:"Feb chemicals + equipment", invoiceNo:"INV-2026-0155" },
  { id:"PAY-MUM-002", cityId:"CITY-MUMBAI", type:"Statutory", vendor:"ESIC Office",
    amount:9200, dueDate:d(3,15), status:"Paid", paidDate:d(3,11),
    description:"ESIC contribution Feb 2026" },
  { id:"PAY-MUM-003", cityId:"CITY-MUMBAI", type:"Overdue", vendor:"Rapid Wash Tools",
    amount:15500, dueDate:d(2,15), status:"Overdue",
    description:"Equipment repair — overdue 30+ days", invoiceNo:"INV-2026-0098" },
];

// ─────────────────────────────────────────────────────────────────────────
// 8b. REVENUE RECORDS — daily subscription + one-time wash revenue
// ─────────────────────────────────────────────────────────────────────────
// HISTORIC_REVENUES already declared above — removed duplicate export
const PAYMENT_METHODS = ["UPI","UPI","UPI","Card","Cash","Bank Transfer"] as const;
const CUSTOMER_IDS_SUR = ["CST-SUR-001","CST-SUR-002","CST-SUR-003","CST-SUR-004","CST-SUR-005",
  "CST-SUR-006","CST-SUR-007","CST-SUR-008","CST-SUR-009","CST-SUR-010"];
const CUSTOMER_IDS_MUM = ["CST-MUM-001","CST-MUM-002","CST-MUM-003","CST-MUM-004","CST-MUM-005"];

// Monthly subscription collections — 87 active subs in Surat, 72 in Mumbai
for (const m of MONTHS) {
  // Surat subscription revenue — collected on 1st of each month
  for (let i = 0; i < 12; i++) {
    const custId = CUSTOMER_IDS_SUR[i % CUSTOMER_IDS_SUR.length];
    HISTORIC_REVENUES.push({
      revenueId: `REV-SUR-SUB-${m}-${String(i+1).padStart(3,"0")}`,
      customerId: custId,
      subscriptionId: `SUB-${custId}-${m}`,
      type: "Subscription",
      amount: 1150 + (i % 3 === 0 ? 280 : 0), // mix of Basic and Premium
      receivedDate: `2026-0${m}-01`,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      invoiceNumber: `INV-SUR-${m}-${String(i+1).padStart(4,"0")}`,
      status: "Received",
      cityId: "CITY-SURAT",
      createdAt: new Date(2026, m-1, 1, 9, 0, 0).toISOString(),
    });
  }
  // Surat one-time wash revenue — spread across the month
  for (let day = 5; day <= 25; day += 4) {
    HISTORIC_REVENUES.push({
      revenueId: `REV-SUR-OT-${m}-${day}`,
      customerId: CUSTOMER_IDS_SUR[day % CUSTOMER_IDS_SUR.length],
      type: "One-Time",
      amount: 499 + (day % 2 === 0 ? 200 : 0),
      receivedDate: `2026-0${m}-${String(day).padStart(2,"0")}`,
      paymentMethod: PAYMENT_METHODS[day % PAYMENT_METHODS.length],
      invoiceNumber: `INV-SUR-OT-${m}-${day}`,
      status: "Received",
      cityId: "CITY-SURAT",
      createdAt: new Date(2026, m-1, day, 10, 0, 0).toISOString(),
    });
  }
  // Mumbai subscription revenue
  for (let i = 0; i < 8; i++) {
    const custId = CUSTOMER_IDS_MUM[i % CUSTOMER_IDS_MUM.length];
    HISTORIC_REVENUES.push({
      revenueId: `REV-MUM-SUB-${m}-${String(i+1).padStart(3,"0")}`,
      customerId: custId,
      subscriptionId: `SUB-${custId}-${m}`,
      type: "Subscription",
      amount: 1280,
      receivedDate: `2026-0${m}-01`,
      paymentMethod: PAYMENT_METHODS[i % PAYMENT_METHODS.length],
      invoiceNumber: `INV-MUM-${m}-${String(i+1).padStart(4,"0")}`,
      status: "Received",
      cityId: "CITY-MUMBAI",
      createdAt: new Date(2026, m-1, 1, 9, 0, 0).toISOString(),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 9. ADVANCE REQUESTS
// ─────────────────────────────────────────────────────────────────────────
export const HISTORIC_ADVANCES: any[] = [
  { id:"ADV-SUR-001", employeeId:"EDB-CW-SUR1A", type:"short_term", amount:5000,
    reason:"Medical emergency", status:"Approved", cityId:"CITY-SURAT",
    requestDate:d(2,5), approvedDate:d(2,7), deductMonth:3, deductYear:2026 },
  { id:"ADV-SUR-002", employeeId:"EDB-CW-SUR3B", type:"short_term", amount:3000,
    reason:"Family function", status:"Approved", cityId:"CITY-SURAT",
    requestDate:d(3,1), approvedDate:d(3,3), deductMonth:4, deductYear:2026 },
  { id:"ADV-SUR-003", employeeId:"EDB-CW-SUR4B", type:"short_term", amount:8000,
    reason:"House rent advance", status:"Pending", cityId:"CITY-SURAT",
    requestDate:d(4,1) },
  { id:"ADV-MUM-001", employeeId:"EDB-CW-MUM1B", type:"short_term", amount:6000,
    reason:"Medical treatment", status:"Approved", cityId:"CITY-MUMBAI",
    requestDate:d(2,10), approvedDate:d(2,12), deductMonth:3, deductYear:2026 },
  { id:"ADV-MUM-002", employeeId:"EDB-CW-MUM2A", type:"short_term", amount:4000,
    reason:"Travel", status:"Rejected", rejectionReason:"Advance already taken this month",
    cityId:"CITY-MUMBAI", requestDate:d(3,5) },
  { id:"ADV-MUM-003", employeeId:"EDB-CW-MUM4B", type:"short_term", amount:5500,
    reason:"Child school fees", status:"Approved", cityId:"CITY-MUMBAI",
    requestDate:d(4,2), approvedDate:d(4,4), deductMonth:5, deductYear:2026 },
];

// ─────────────────────────────────────────────────────────────────────────
// 10. INCENTIVE RECORDS — all scenarios
// ─────────────────────────────────────────────────────────────────────────
export const HISTORIC_INCENTIVES: any[] = [];
// Per car incentive — washers
for (const emp of HISTORIC_EMPLOYEE_DB.filter(e => e.designation === "Car Washer")) {
  for (const m of MONTHS) {
    const carsWashed = 80 + Math.floor(Math.random()*40);
    const ratePerCar = 15;
    const incentive  = carsWashed * ratePerCar;
    HISTORIC_INCENTIVES.push({
      id:`INC-${emp.id}-${m}`, employeeId:emp.id, type:"per_car",
      month:m, year:2026, cityId:emp.workLocation,
      carsWashed, ratePerCar, amount:incentive,
      status:"Paid", paidWith:`PR-${emp.id}-2026-${m}`,
    });
  }
}
// Target-based — TSE/TSM
for (const emp of HISTORIC_EMPLOYEE_DB.filter(e => ["TSE","TSM"].includes(e.designation))) {
  for (const m of MONTHS) {
    const target     = emp.designation === "TSM" ? 30 : 15;
    const achieved   = target - 3 + (m % 5); // varies by month
    const pct        = Math.round(achieved/target*100);
    const baseAmount = emp.designation === "TSM" ? 8000 : 4000;
    const earned     = pct >= 100 ? baseAmount * 1.25 : pct >= 80 ? baseAmount : pct >= 60 ? baseAmount*0.6 : 0;
    HISTORIC_INCENTIVES.push({
      id:`INC-${emp.id}-${m}`, employeeId:emp.id, type:"target_based",
      month:m, year:2026, cityId:emp.workLocation,
      target, achieved, achievementPct:pct, amount:earned,
      status: m < 4 ? "Paid" : "Processed",
    });
  }
}
// Revenue share — Supervisors
for (const emp of HISTORIC_EMPLOYEE_DB.filter(e => e.designation === "Supervisor")) {
  for (const m of MONTHS) {
    const teamRevenue = 85000 + (m * 5000);
    const shareRate   = 0.03; // 3%
    const earned      = Math.round(teamRevenue * shareRate);
    HISTORIC_INCENTIVES.push({
      id:`INC-${emp.id}-${m}`, employeeId:emp.id, type:"revenue_share",
      month:m, year:2026, cityId:emp.workLocation,
      teamRevenue, shareRate, amount:earned,
      status: m < 4 ? "Paid" : "Processed",
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// 11. CLOTH TRACKING
// ─────────────────────────────────────────────────────────────────────────
export const HISTORIC_CLOTH: any[] = [];
for (const emp of HISTORIC_EMPLOYEE_DB.filter(e => e.designation === "Car Washer")) {
  HISTORIC_CLOTH.push({
    id:`CLT-${emp.id}`, employeeId:emp.id, cityId:emp.workLocation,
    uniformsIssued:2, uniformsReturned:0, currentlyWith:2,
    lastIssuedDate:emp.dateOfJoining, condition:"Good",
    exchanges:[
      { date:d(3,1), type:"Damaged", oldQty:1, newQty:1, reason:"Torn during work" },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────
// SEEDER FUNCTION
// ─────────────────────────────────────────────────────────────────────────

// ── HISTORIC SUBSCRIPTIONS ────────────────────────────────────────────────
// ~150 active subscriptions linking to HISTORIC_CUSTOMERS
const PLAN_TYPES = ["Water Wash", "Water + Shampoo", "Water + Shampoo + Wax"] as const;
const FREQUENCIES = ["Daily", "Alternate Days", "Weekly", "Bi-Weekly", "Monthly"] as const;
const BILLING_CYCLES = ["Monthly", "Quarterly", "Annual"] as const;
const PLAN_BASE_PRICES: Record<string, number> = {
  "Water Wash": 699, "Water + Shampoo": 1299, "Water + Shampoo + Wax": 1999
};
const VEHICLE_TYPES = ["Hatchback", "Sedan", "SUV", "MUV", "Luxury"];

export const HISTORIC_SUBSCRIPTIONS: any[] = [];
(function() {
  let subIdx = 1;
  // Create ~120 subscriptions from first 120 customers across 3 months
  const custSample = HISTORIC_CUSTOMERS.slice(0, 120);
  for (const cust of custSample) {
    const plan = PLAN_TYPES[subIdx % PLAN_TYPES.length];
    const basePrice = PLAN_BASE_PRICES[plan];
    const discount = subIdx % 5 === 0 ? 100 : subIdx % 3 === 0 ? 50 : 0;
    const startMonth = 2 + (subIdx % 3); // Feb, Mar, Apr
    const startDay = 1 + (subIdx % 28);
    const startDate = `2026-0${startMonth}-${String(startDay).padStart(2,"0")}`;
    const billingCycle = BILLING_CYCLES[subIdx % BILLING_CYCLES.length];
    HISTORIC_SUBSCRIPTIONS.push({
      subscriptionId: `SUB-${cust.cityId === "CITY-SURAT" ? "SUR" : "MUM"}-${String(subIdx).padStart(4,"0")}`,
      customerId: cust.customerId || cust.id,
      packageType: plan,
      packageName: plan,
      frequency: FREQUENCIES[subIdx % FREQUENCIES.length],
      status: subIdx % 10 === 0 ? "Paused" : subIdx % 15 === 0 ? "Cancelled" : "Active",
      startDate,
      endDate: billingCycle === "Annual" ? `2027-0${startMonth}-${String(startDay).padStart(2,"0")}` : undefined,
      renewalDate: `2026-0${Math.min(startMonth + 1, 12)}-${String(startDay).padStart(2,"0")}`,
      pricing: {
        basePrice,
        discount,
        finalPrice: basePrice - discount,
        currency: "INR"
      },
      priceLocked: basePrice - discount,
      serviceDetails: {
        vehicleType: VEHICLE_TYPES[subIdx % VEHICLE_TYPES.length],
        addOns: subIdx % 4 === 0 ? ["Interior Cleaning"] : subIdx % 7 === 0 ? ["Tyre Shine"] : [],
        preferredTimeSlot: subIdx % 3 === 0 ? "Morning" : subIdx % 3 === 1 ? "Afternoon" : "Evening"
      },
      billingCycle,
      paymentStatus: subIdx % 8 === 0 ? "Pending" : subIdx % 12 === 0 ? "Overdue" : "Paid",
      createdAt: `${startDate}T08:00:00.000Z`,
      updatedAt: `${startDate}T08:00:00.000Z`,
      cityId: cust.cityId || "CITY-SURAT",
    });
    subIdx++;
  }
})();

// ── HISTORIC JOBS ─────────────────────────────────────────────────────────
// ~300 completed jobs linking subscriptions → customers → washers
const TIME_SLOTS = ["07:00 AM", "09:00 AM", "11:00 AM", "02:00 PM", "04:00 PM", "06:00 PM"];
const WASHER_IDS_SUR = HISTORIC_EMPLOYEE_DB
  .filter((e: any) => e.designation === "Car Washer" && e.workLocation === "CITY-SURAT")
  .map((e: any) => e.id);
const WASHER_IDS_MUM = HISTORIC_EMPLOYEE_DB
  .filter((e: any) => e.designation === "Car Washer" && e.workLocation === "CITY-MUMBAI")
  .map((e: any) => e.id);

export const HISTORIC_JOBS: any[] = [];
(function() {
  let jobIdx = 1;
  for (const sub of HISTORIC_SUBSCRIPTIONS.filter((s: any) => s.status !== "Cancelled").slice(0, 100)) {
    const issSur = sub.cityId === "CITY-SURAT";
    const washers = issSur ? WASHER_IDS_SUR : WASHER_IDS_MUM;
    const washer = washers.length > 0 ? washers[jobIdx % washers.length] : "EDB-WA-SUR1";
    // 3 completed jobs per subscription (one per month)
    for (let m = 2; m <= 4; m++) {
      const day = 1 + (jobIdx % 25);
      const scheduledDate = `2026-0${m}-${String(day).padStart(2,"0")}`;
      const cust = HISTORIC_CUSTOMERS.find((c: any) =>
        (c.customerId || c.id) === sub.customerId
      ) || HISTORIC_CUSTOMERS[0];
      HISTORIC_JOBS.push({
        jobId: `JOB-${issSur ? "SUR" : "MUM"}-${String(jobIdx * 3 + m - 2).padStart(5,"0")}`,
        customerId: sub.customerId,
        subscriptionId: sub.subscriptionId,
        washerId: washer,
        scheduledDate,
        timeSlot: TIME_SLOTS[jobIdx % TIME_SLOTS.length],
        status: "Completed",
        jobType: "Regular",
        packageName: sub.packageName,
        vehicleDetails: {
          category: sub.serviceDetails.vehicleType || "Sedan",
          color: "White",
          brand: "Maruti",
          registration: `GJ05${String(jobIdx).padStart(4,"0")}`,
        },
        location: {
          addressLine1: cust.address || "123 Main Street",
          area: cust.area || "Adajan",
          city: issSur ? "Surat" : "Mumbai",
          pinCode: cust.pinCode || (issSur ? "395009" : "400001"),
        },
        serviceDetails: {
          addOns: sub.serviceDetails.addOns || [],
          specialInstructions: "",
        },
        verificationStatus: "verified",
        qualityScore: 80 + (jobIdx % 20),
        complianceScore: 85 + (jobIdx % 15),
        cityId: sub.cityId || "CITY-SURAT",
        city: issSur ? "Surat" : "Mumbai",
        completedAt: `${scheduledDate}T${String(10 + (jobIdx % 8)).padStart(2,"0")}:30:00.000Z`,
        createdAt: `${scheduledDate}T07:00:00.000Z`,
        updatedAt: `${scheduledDate}T12:00:00.000Z`,
      });
    }
    jobIdx++;
  }
})();

export function seedHistoricData(): void {
  // ── Bump this flag version to force re-seed after fixes ─────────────────
  const SEED_FLAG = "HISTORIC_DATA_SEEDED_V5";
  try {
    if (localStorage.getItem(SEED_FLAG)) return;

    const now = new Date().toISOString();

    // ── Helper: split array by city and write 3 keys each ───────────────────
    // Writes:
    //   cleancar_<baseKey>                    ← legacy fallback (Surat reads this)
    //   cleancar_CITY-SURAT_<baseKey>         ← primary Surat
    //   cleancar_CITY-MUMBAI_<baseKey>        ← primary Mumbai
    function writeByCityId(baseKey: string, records: any[]) {
      const sur = records.filter(r => (r.cityId || "CITY-SURAT") === "CITY-SURAT");
      const mum = records.filter(r => r.cityId === "CITY-MUMBAI");
      localStorage.setItem(`cleancar_${baseKey}`,              JSON.stringify(records));
      localStorage.setItem(`cleancar_CITY-SURAT_${baseKey}`,   JSON.stringify(sur));
      localStorage.setItem(`cleancar_CITY-MUMBAI_${baseKey}`,  JSON.stringify(mum));
    }

    // ────────────────────────────────────────────────────────────────────────
    // 1. EMPLOYEES
    // FIX KEY-1: old code wrote to EMPLOYEE_DATABASE_RECORDS only.
    // EmployeeContext reads DataService "EMPLOYEES" →
    //   primary:  cleancar_CITY-SURAT_employees
    //   fallback: cleancar_employees
    // We write all three so both old auth system AND EmployeeContext work.
    // ────────────────────────────────────────────────────────────────────────
    const existingEmpDb = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]");
    const existingIds   = new Set(existingEmpDb.map((e: any) => e.id));
    const newEmps       = HISTORIC_EMPLOYEE_DB.filter(e => !existingIds.has(e.id));
    const allEmps       = [...existingEmpDb, ...newEmps];

    // Legacy auth system key (unchanged — keeps login working)
    localStorage.setItem("EMPLOYEE_DATABASE_RECORDS", JSON.stringify(allEmps));

    // DataService-compatible keys — EmployeeContext reads these
    // Employee interface uses 'employeeId' as primary key; our seed uses 'id'.
    // We map id → employeeId so EmployeeContext joins work correctly.
    const mappedEmps = allEmps.map((e: any) => ({
      ...e,
      employeeId:    e.id || e.employeeId,         // primary key EmployeeContext expects
      phone:         e.mobile || e.phone,
      joiningDate:   e.dateOfJoining || e.joiningDate,
      role:          e.designation || e.role,
      status:        e.status || "Active",
      department:    e.department || "Operations",
      city:          e.city || "Surat",
      cityId:        e.workLocation || e.cityId || "CITY-SURAT",
    }));
    const surEmps = mappedEmps.filter((e: any) => (e.cityId || "CITY-SURAT") === "CITY-SURAT");
    const mumEmps = mappedEmps.filter((e: any) => e.cityId === "CITY-MUMBAI");
    localStorage.setItem("cleancar_employees",              JSON.stringify(mappedEmps));
    localStorage.setItem("cleancar_CITY-SURAT_employees",   JSON.stringify(surEmps));
    localStorage.setItem("cleancar_CITY-MUMBAI_employees",  JSON.stringify(mumEmps));

    // ────────────────────────────────────────────────────────────────────────
    // 2. PAYROLL RUNS
    // FIX KEY-5: split by city; also map to PayrollRun interface shape
    // PayrollRun expects: { payrollId, employeeId, month:"YYYY-MM", period,
    //   cityId, baseSalary, incentiveAmount, grossSalary, pf, esic, pt,
    //   tds:0, advances:0, penalties:0, totalDeductions, netSalary,
    //   presentDays, absentDays, lopDays, workingDays, status }
    // ────────────────────────────────────────────────────────────────────────
    const mappedPayroll = HISTORIC_PAYROLL.map((p: any) => {
      const monthStr = `${p.year}-${String(p.month).padStart(2,"0")}`;
      const totalDed = (p.deductions?.pf_employee || 0) +
                       (p.deductions?.esic || 0) +
                       (p.deductions?.pt || 0);
      return {
        payrollId:       p.id,
        employeeId:      p.employeeId,
        month:           monthStr,
        period: {
          startDate: `${p.year}-${String(p.month).padStart(2,"0")}-01`,
          endDate:   `${p.year}-${String(p.month).padStart(2,"0")}-${p.totalDays || 30}`,
        },
        cityId:          p.cityId || "CITY-SURAT",
        baseSalary:      p.grossSalary || 0,
        incentiveAmount: p.incentiveAmount || 0,
        addOnEarnings:   0,
        allowances:      0,
        grossSalary:     (p.grossSalary || 0) + (p.incentiveAmount || 0),
        pf:              p.deductions?.pf_employee || 0,
        esic:            p.deductions?.esic || 0,
        pt:              p.deductions?.pt || 0,
        tds:             0,
        advances:        0,
        penalties:       0,
        totalDeductions: totalDed,
        netSalary:       p.netSalary || 0,
        presentDays:     p.presentDays || p.totalDays || 26,
        absentDays:      (p.totalDays || 26) - (p.presentDays || p.totalDays || 26),
        lopDays:         (p.totalDays || 26) - (p.presentDays || p.totalDays || 26),
        workingDays:     p.totalDays || 26,
        status:          p.status || "Paid",
        createdAt:       p.processedAt || now,
        updatedAt:       p.processedAt || now,
      };
    });
    writeByCityId("payroll_runs", mappedPayroll);

    // ────────────────────────────────────────────────────────────────────────
    // 3. CUSTOMERS
    // FIX KEY-4 + Customer interface shape
    // Customer interface expects: { customerId, firstName, lastName, email,
    //   phone, address:{line1,area,city,pinCode}, status, cityId,
    //   createdAt, updatedAt }
    // ────────────────────────────────────────────────────────────────────────
    const mappedCustomers = HISTORIC_CUSTOMERS.map((c: any) => ({
      customerId:  c.id || c.customerId,                 // ← canonical ID
      firstName:   c.name?.split(" ")[0] || c.name || "Customer",
      lastName:    c.name?.split(" ").slice(1).join(" ") || "",
      email:       c.email || `${c.id?.toLowerCase()}@example.com`,
      phone:       c.mobile || c.phone || "9800000000",
      address: {
        line1:   c.address || "123 Main Street",
        area:    c.area || "Adajan",
        city:    c.city || "Surat",
        pinCode: c.pinCode || "395001",
      },
      vehicleDetails: c.vehicle ? {
        category:           "Sedan",
        brand:              c.vehicle.split(" ")[0] || "Maruti",
        color:              "White",
        registrationNumber: c.vehicleNumber || "GJ05AB1234",
      } : undefined,
      leadSource: "Walk-in",
      status:     c.subscriptionStatus === "Cancelled" ? "Churned" : "Active",
      cityId:     c.cityId || "CITY-SURAT",
      createdAt:  c.createdAt || now,
      updatedAt:  c.createdAt || now,
      tags:       [],
      notes:      "",
    }));
    writeByCityId("customers", mappedCustomers);

    // ────────────────────────────────────────────────────────────────────────
    // 4. LEADS
    // FIX KEY-5 city split
    // ────────────────────────────────────────────────────────────────────────
    writeByCityId("leads", HISTORIC_LEADS);

    // ────────────────────────────────────────────────────────────────────────
    // 5. SUBSCRIPTIONS
    // FIX KEY-5 city split
    // CustomerSubscription expects: { subscriptionId, customerId, packageType,
    //   packageName, frequency, status, startDate, pricing:{basePrice,discount,
    //   finalPrice,currency}, priceLocked, serviceDetails, billingCycle,
    //   paymentStatus, createdAt, updatedAt }
    // ────────────────────────────────────────────────────────────────────────
    const PACKAGE_MAP: Record<string, string> = {
      "Water Wash": "Basic", "Water + Shampoo": "Standard",
      "Water + Shampoo + Wax": "Premium",
    };
    const mappedSubs = HISTORIC_SUBSCRIPTIONS.map((s: any) => ({
      ...s,
      // Ensure customerId matches the mapped customer IDs (CUST-SUR-XXX format)
      customerId: s.customerId,
      // packageType must be "Basic"|"Standard"|"Premium"|"Deluxe"
      packageType: (PACKAGE_MAP[s.packageType] || PACKAGE_MAP[s.packageName] || "Basic") as any,
      cityId: s.cityId || "CITY-SURAT",
      createdAt: s.createdAt || now,
      updatedAt: s.updatedAt || now,
    }));
    writeByCityId("subscriptions", mappedSubs);

    // ────────────────────────────────────────────────────────────────────────
    // 6. JOBS
    // FIX KEY-5 city split
    // ────────────────────────────────────────────────────────────────────────
    writeByCityId("jobs", HISTORIC_JOBS);

    // ────────────────────────────────────────────────────────────────────────
    // 7. ATTENDANCE
    // FIX KEY-5 city split
    // ────────────────────────────────────────────────────────────────────────
    writeByCityId("attendance_records", HISTORIC_ATTENDANCE);

    // ────────────────────────────────────────────────────────────────────────
    // 8. INVENTORY (already city-split correctly in original — keep as-is)
    // ────────────────────────────────────────────────────────────────────────
    const invByCityId: Record<string, any[]> = {};
    for (const item of HISTORIC_INVENTORY) {
      const cid: string = item.cityId || "CITY-SURAT";
      if (!invByCityId[cid]) invByCityId[cid] = [];
      invByCityId[cid].push({ ...item, createdAt: now, updatedAt: now });
    }
    for (const [cid, items] of Object.entries(invByCityId)) {
      localStorage.setItem(`cleancar_${cid}_inventory_items`, JSON.stringify(items));
    }

    // ────────────────────────────────────────────────────────────────────────
    // 9. FINANCE — MRR, Payables, Revenues
    // FIX KEY-2a: MRRData interface expects
    //   { mrrId, month:"YYYY-MM", subscriptionId, customerId, revenue,
    //     status:"Active"|"Churned"|"Paused", cityId, createdAt, updatedAt }
    // Seed HISTORIC_MRR has: { id, cityId, month(number), year, activeSubscriptions,
    //   newSubscriptions, churned, revenue, avgRevPerSub, growthRate }
    // These are SUMMARY records; FinanceContext also works with individual records.
    // We keep the original AND add one per-subscription MRR record per active sub.
    // ────────────────────────────────────────────────────────────────────────
    const mrrRecords: any[] = [];
    for (const mrrSummary of HISTORIC_MRR) {
      const monthStr = `${mrrSummary.year}-${String(mrrSummary.month).padStart(2,"0")}`;
      // Create individual MRR records from subscriptions for that month/city
      const subsByCityMonth = HISTORIC_SUBSCRIPTIONS.filter((s: any) =>
        s.cityId === mrrSummary.cityId &&
        s.startDate?.startsWith(`2026-0${mrrSummary.month}`)
      );
      if (subsByCityMonth.length > 0) {
        subsByCityMonth.slice(0, 20).forEach((s: any, i: number) => {
          mrrRecords.push({
            mrrId:           `MRR-${mrrSummary.cityId}-${mrrSummary.month}-${String(i+1).padStart(3,"0")}`,
            month:           monthStr,
            subscriptionId:  s.subscriptionId,
            customerId:      s.customerId,
            revenue:         s.pricing?.finalPrice || mrrSummary.avgRevPerSub || 1150,
            status:          s.status === "Cancelled" ? "Churned" : s.status === "Paused" ? "Paused" : "Active",
            cityId:          mrrSummary.cityId,
            createdAt:       `${monthStr}-01T00:00:00.000Z`,
            updatedAt:       `${monthStr}-01T00:00:00.000Z`,
          });
        });
      } else {
        // Fallback: create synthetic MRR records when no matching subs
        for (let i = 0; i < Math.min(mrrSummary.activeSubscriptions, 15); i++) {
          mrrRecords.push({
            mrrId:          `MRR-${mrrSummary.cityId}-${mrrSummary.month}-${String(i+1).padStart(3,"0")}`,
            month:          monthStr,
            subscriptionId: `SUB-SEED-${mrrSummary.cityId}-${mrrSummary.month}-${i}`,
            customerId:     `CUST-${mrrSummary.cityId === "CITY-SURAT" ? "SUR" : "MUM"}-${String((i%100)+1).padStart(3,"0")}`,
            revenue:        mrrSummary.avgRevPerSub || 1150,
            status:         "Active" as const,
            cityId:         mrrSummary.cityId,
            createdAt:      `${monthStr}-01T00:00:00.000Z`,
            updatedAt:      `${monthStr}-01T00:00:00.000Z`,
          });
        }
      }
    }
    writeByCityId("mrr", mrrRecords);

    // FIX KEY-2b: Payable interface expects
    //   { payableId, type:"Vendor"|"Statutory"|"Salary", vendorName,
    //     amount, dueDate, status:"Pending"|"Approved"|"Paid"|"Overdue",
    //     description, cityId, createdAt, updatedAt }
    // Seed uses: { id, vendor, status includes "Overdue" }
    const TYPE_MAP: Record<string, string> = {
      "Vendor":"Vendor", "Statutory":"Statutory", "Salary":"Salary", "Overdue":"Vendor",
    };
    const mappedPayables = HISTORIC_PAYABLES.map((p: any) => ({
      payableId:      p.id || p.payableId,
      type:           (TYPE_MAP[p.type] || "Vendor") as "Vendor" | "Statutory" | "Salary",
      vendorName:     p.vendor || p.vendorName || "Unknown Vendor",
      invoiceNumber:  p.invoiceNo || p.invoiceNumber,
      statutoryType:  p.type === "Statutory" ? (
        p.vendor?.includes("ESIC") ? "ESIC" :
        p.vendor?.includes("EPFO") || p.vendor?.includes("PF") ? "PF" :
        p.vendor?.includes("PT") || p.vendor?.includes("Professional") ? "PT" :
        p.vendor?.includes("TDS") ? "TDS" :
        p.vendor?.includes("GST") ? "GST" : "PF"
      ) : undefined,
      amount:         p.amount,
      dueDate:        p.dueDate,
      status:         (p.status === "Overdue" ? "Overdue" :
                       p.status === "Paid" ? "Paid" : "Pending") as "Pending"|"Approved"|"Paid"|"Overdue",
      description:    p.description || `${p.type} payment to ${p.vendor || p.vendorName}`,
      cityId:         p.cityId || "CITY-SURAT",
      paidAt:         p.paidDate,
      createdAt:      now,
      updatedAt:      now,
    }));
    writeByCityId("payables", mappedPayables);

    // FIX KEY-2c + KEY-6: Revenue interface + customerId prefix fix
    // Revenue expects: { revenueId, customerId (must match CUST-XXX), type,
    //   amount, receivedDate, paymentMethod, status, cityId, createdAt }
    // Fix: ensure customerId uses CUST- prefix (not CST-)
    const mappedRevenues = HISTORIC_REVENUES.map((r: any) => ({
      ...r,
      // FIX KEY-6: CST- → CUST- prefix alignment
      customerId: r.customerId?.replace(/^CST-/, "CUST-") || r.customerId,
      status: r.status || "Received",
      createdAt: r.createdAt || now,
    }));
    writeByCityId("revenues", mappedRevenues);

    // ────────────────────────────────────────────────────────────────────────
    // 10. INCENTIVES
    // FIX KEY-5 city split
    // ────────────────────────────────────────────────────────────────────────
    writeByCityId("employee_incentives", HISTORIC_INCENTIVES);

    // ────────────────────────────────────────────────────────────────────────
    // 11. COMPLAINTS, ADVANCES, CLOTH TRACKING
    // FIX KEY-5 city split
    // ────────────────────────────────────────────────────────────────────────
    writeByCityId("complaints",         HISTORIC_COMPLAINTS);
    writeByCityId("advance_management", HISTORIC_ADVANCES);
    writeByCityId("cloth_tracking",     HISTORIC_CLOTH);

    // ────────────────────────────────────────────────────────────────────────
    // 12. LEDGER MASTERS
    // FIX KEY-8: accountingEntryService reads cleancar_ledger_masters directly.
    // Seed default ledgers so Accounts Dashboard shows real balances.
    // ────────────────────────────────────────────────────────────────────────
    const existingLedgers = JSON.parse(
      localStorage.getItem("cleancar_ledger_masters") || "[]"
    );
    if (existingLedgers.length === 0) {
      const defaultLedgers = [
        // SURAT
        { id:"LM-CASH-SUR",     name:"Petty Cash",            accountHead:"cash_bank",           type:"other",           city:"Surat", cityId:"CITY-SURAT",  openingBalance:50000,  balance:50000,  balanceType:"Dr" },
        { id:"LM-BANK-SUR",     name:"Axis Bank",             accountHead:"cash_bank",           type:"bank",            city:"Surat", cityId:"CITY-SURAT",  openingBalance:500000, balance:500000, balanceType:"Dr" },
        { id:"LM-RAZORPAY-SUR", name:"Razorpay",              accountHead:"cash_bank",           type:"payment_gateway", city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Dr" },
        { id:"LM-RZPCHG-SUR",   name:"Razorpay Charges",      accountHead:"indirect_expenses",   type:"vendor",          city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-SALES-SUR",    name:"Sales Revenue",         accountHead:"direct_income",       type:"income",          city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-EXP-SUR",      name:"Operating Expenses",    accountHead:"indirect_expenses",   type:"expense",         city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Dr" },
        { id:"LM-GST-OUT-SUR",  name:"GST Output",            accountHead:"gst_output",          type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-GST-IN-SUR",   name:"GST Input Credit",      accountHead:"gst_input",           type:"asset",           city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Dr" },
        { id:"LM-TDS-194C-SUR", name:"TDS Payable 194C",      accountHead:"tds_payable",         type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-TDS-194J-SUR", name:"TDS Payable 194J",      accountHead:"tds_payable",         type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-DEBTORS-SUR",  name:"Customer Debtors",      accountHead:"accounts_receivable", type:"asset",           city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Dr" },
        { id:"LM-SALARY-SUR",   name:"Salary Payable",        accountHead:"salary_payable",      type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-PF-SUR",       name:"PF Payable",            accountHead:"pf_payable",          type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-ESIC-SUR",     name:"ESIC Payable",          accountHead:"esic_payable",        type:"liability",       city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-CHEM-SUR",     name:"Shreeji Chemicals",     accountHead:"accounts_payable",    type:"vendor",          city:"Surat", cityId:"CITY-SURAT",  openingBalance:0,      balance:18500,  balanceType:"Cr" },
        // MUMBAI
        { id:"LM-CASH-MUM",     name:"Petty Cash",            accountHead:"cash_bank",           type:"other",           city:"Mumbai", cityId:"CITY-MUMBAI", openingBalance:45000,  balance:45000,  balanceType:"Dr" },
        { id:"LM-BANK-MUM",     name:"HDFC Bank",             accountHead:"cash_bank",           type:"bank",            city:"Mumbai", cityId:"CITY-MUMBAI", openingBalance:450000, balance:450000, balanceType:"Dr" },
        { id:"LM-SALES-MUM",    name:"Sales Revenue",         accountHead:"direct_income",       type:"income",          city:"Mumbai", cityId:"CITY-MUMBAI", openingBalance:0,      balance:0,      balanceType:"Cr" },
        { id:"LM-EXP-MUM",      name:"Operating Expenses",    accountHead:"indirect_expenses",   type:"expense",         city:"Mumbai", cityId:"CITY-MUMBAI", openingBalance:0,      balance:0,      balanceType:"Dr" },
        { id:"LM-DEBTORS-MUM",  name:"Customer Debtors",      accountHead:"accounts_receivable", type:"asset",           city:"Mumbai", cityId:"CITY-MUMBAI", openingBalance:0,      balance:0,      balanceType:"Dr" },
      ];
      localStorage.setItem("cleancar_ledger_masters", JSON.stringify(defaultLedgers));
    }

    // ── Mark complete ────────────────────────────────────────────────────────
    localStorage.setItem(SEED_FLAG, "true");

    // Also clear old seed flags so a user who had the old broken seed
    // gets the corrected data on their next reload
    localStorage.removeItem("HISTORIC_DATA_SEEDED_V1");
    localStorage.removeItem("HISTORIC_DATA_SEEDED_V2");
    localStorage.removeItem("HISTORIC_DATA_SEEDED_V3");
    localStorage.removeItem("HISTORIC_DATA_SEEDED_V4");

    console.log(
      `[HistoricData] ✅ V5 seeded:\n` +
      `  ${HISTORIC_EMPLOYEE_DB.length} employees (3 keys each)\n` +
      `  ${HISTORIC_CUSTOMERS.length} customers (city-split)\n` +
      `  ${HISTORIC_LEADS.length} leads (city-split)\n` +
      `  ${HISTORIC_SUBSCRIPTIONS.length} subscriptions (city-split)\n` +
      `  ${HISTORIC_JOBS.length} jobs (city-split)\n` +
      `  ${HISTORIC_PAYROLL.length} payroll runs (interface-mapped)\n` +
      `  ${HISTORIC_ATTENDANCE.length} attendance records (city-split)\n` +
      `  ${HISTORIC_INCENTIVES.length} incentive records (city-split)\n` +
      `  ${mappedPayables.length} payables (interface-mapped)\n` +
      `  ${mappedRevenues.length} revenues (customerId prefix fixed)\n` +
      `  ${HISTORIC_COMPLAINTS.length} complaints\n` +
      `  Ledger masters + MRR records added`
    );
  } catch (err) {
    console.error("[HistoricData] Seed failed:", err);
  }
}
