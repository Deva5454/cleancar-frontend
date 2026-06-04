import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { employeeDatabaseService } from "../../services/employeeDatabaseService";
import type { EmployeeDatabaseRecord } from "../../services/employeeDatabaseService";
import { onboardingChecklistService } from "../../services/onboardingChecklistService";
import type { OnboardingTask } from "../../services/onboardingChecklistService";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building,
  Briefcase,
  User,
  X,
  Save,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Camera,
  Upload,
} from "lucide-react";
import { EmployeeStatusBadge } from "../shared/EmployeeStatusBadge";
import { hasPermission } from "../../utils/permissionEngine";
import { useRole } from "../../contexts/RoleContext";
import { useDebounce } from "../../hooks/useDebounce";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useCity } from "../../contexts/CityContext";

type EmployeeStatus = "Active" | "On Leave" | "Inactive" | "Exited";
type EmployeeType = "Full Time" | "Contract" | "Part Time";
type SkillLevel = "Skilled" | "Semi-Skilled" | "Unskilled";
type EmploymentStage = "Temporary" | "Permanent" | "Not Converted";

interface Employee {
  id: string; // Permanent ID with encoded structure (e.g., CW-395001-001)
  tempId: string; // Temporary sequential ID (e.g., TEMP-001)
  tempIdAssignedDate: string; // Date temp ID was assigned
  permanentIdAssignedDate?: string; // Date permanent ID was assigned
  conversionDueDate: string; // 7 days from date of joining
  daysInTempStatus: number; // Days elapsed since temp ID
  isOverdue: boolean; // If conversion is overdue (>7 days from joining)
  employmentStage: EmploymentStage; // Current stage
  nonConversionReason?: string; // Reason if not converted
  skillLevel: SkillLevel; // Skill classification
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
  fatherFirstName: string;
  fatherMiddleName?: string;
  fatherLastName: string;
  fatherName: string;
  dob: string;
  gender: string;
  mobile: string;
  email: string;
  permanentAddress: string;
  currentAddress: string;
  emergencyContact: string;
  designation: string;
  department: string;
  reportingManager: string;
  workLocation: string;
  pinCodes: string[]; // Multiple pincodes if covering multiple areas
  employeeType: EmployeeType;
  dateOfJoining: string;
  probationPeriod: string;
  status: EmployeeStatus;
}

// Role codes for permanent employee ID
const roleCodeMap: Record<string, string> = {
  "Car Washer": "CW",
  "Supervisor": "SUP",
  "Operations Manager": "OM",
  "Tele Sales Executive": "TSE",
  "TSM": "TSM",
  "Customer Care Executive": "CCE",
  "HR Executive": "HRE",
  "Finance Executive": "FE",
  "Store Manager": "SM",
  "City Manager": "CM",
  "Sr Operations Manager": "SOM",
};

// Extract pincode from location
const extractPincode = (location: string): string => {
  const pincodeMap: Record<string, string> = {
    "Surat - Zone A": "395001",
    "Surat - Zone B": "395002",
    "Surat - Zone C": "395009",
    "Surat - Head Office": "395010",
    "Ahmedabad - Zone A": "380001",
    "Ahmedabad - Zone B": "380002",
    "Ahmedabad - Head Office": "380010",
    "Vadodara - Zone A": "390001",
    "Vadodara - Head Office": "390010",
    "Rajkot - Zone A": "360001",
    "Rajkot - Head Office": "360010",
  };
  return pincodeMap[location] || "000000";
};

// Generate permanent employee ID with structure: ROLE-PINCODE-SEQUENCE
const generatePermanentId = (role: string, pinCodes: string[], existingEmployees: Employee[]): string => {
  const roleCode = roleCodeMap[role] || "EMP";
  const pinCodePart = pinCodes.length > 1 
    ? `${pinCodes[0]}-M` // M for Multiple pincodes
    : pinCodes[0];
  
  // Find next sequence number for this role-pincode combination
  const existingIds = existingEmployees
    .filter(emp => emp.id.startsWith(`${roleCode}-${pinCodePart}`))
    .map(emp => {
      const parts = emp.id.split('-');
      return parseInt(parts[parts.length - 1]);
    })
    .filter(num => !isNaN(num));
  
  const nextSeq = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
  return `${roleCode}-${pinCodePart}-${String(nextSeq).padStart(3, "0")}`;
};

// Calculate days since temp ID assignment
const calculateDaysInTemp = (assignedDate: string): number => {
  const assigned = new Date(assignedDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - assigned.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Calculate conversion due date (7 days from date of joining)
const calculateDueDate = (joiningDate: string): string => {
  const date = new Date(joiningDate);
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

// Organizational Hierarchy Mapping
const organizationalHierarchy: Record<string, Record<string, string>> = {
  "Car Washer": {
    "Surat - Zone A": "Ramesh Vora (Supervisor)",
    "Surat - Zone B": "Amit Kumar (Supervisor)",
    "Surat - Zone C": "Vijay Singh (Supervisor)",
    "Surat - Head Office": "Amit Patel (Operations Manager)",
    "Ahmedabad - Zone A": "Suresh Yadav (Supervisor)",
    "Ahmedabad - Zone B": "Krishna Patel (Supervisor)",
    "Vadodara - Zone A": "Rajesh Mehta (Supervisor)",
    "Rajkot - Zone A": "Dinesh Shah (Supervisor)",
  },
  "Supervisor": {
    "Surat - Zone A": "Amit Patel (Operations Manager)",
    "Surat - Zone B": "Amit Patel (Operations Manager)",
    "Surat - Zone C": "Amit Patel (Operations Manager)",
    "Ahmedabad - Zone A": "Prakash Kumar (Operations Manager)",
    "Ahmedabad - Zone B": "Prakash Kumar (Operations Manager)",
    "Vadodara - Zone A": "Kiran Desai (Operations Manager)",
    "Rajkot - Zone A": "Hardik Modi (Operations Manager)",
    "Surat - Head Office": "Amit Bhatt (Sr Operations Manager)",
  },
  "Operations Manager": {
    "Surat - Head Office": "Amit Bhatt (Sr Operations Manager)",
    "Ahmedabad - Head Office": "Prakash Mehta (City Manager)",
    "Vadodara - Head Office": "Vikram Shah (City Manager)",
    "Rajkot - Head Office": "Nirav Joshi (City Manager)",
  },
  "Tele Sales Executive": {
    "Surat - Head Office": "Vikram Kumar (TSM)",
    "Ahmedabad - Head Office": "Ravi Sharma (TSM)",
    "Vadodara - Head Office": "Ankit Pandya (TSM)",
    "Rajkot - Head Office": "Mohit Trivedi (TSM)",
  },
  "TSM": {
    "Surat - Head Office": "Prakash Mehta (City Manager)",
    "Ahmedabad - Head Office": "Prakash Mehta (City Manager)",
    "Vadodara - Head Office": "Vikram Shah (City Manager)",
    "Rajkot - Head Office": "Nirav Joshi (City Manager)",
  },
  "Customer Care Executive": {
    "Surat - Head Office": "Prakash Mehta (City Manager)",
    "Ahmedabad - Head Office": "Prakash Mehta (City Manager)",
    "Vadodara - Head Office": "Vikram Shah (City Manager)",
    "Rajkot - Head Office": "Nirav Joshi (City Manager)",
  },
  "HR Executive": {
    "Surat - Head Office": "Neeta Sharma (HR Manager)",
    "Ahmedabad - Head Office": "Neeta Sharma (HR Manager)",
    "Vadodara - Head Office": "Neeta Sharma (HR Manager)",
    "Rajkot - Head Office": "Neeta Sharma (HR Manager)",
  },
  "Finance Executive": {
    "Surat - Head Office": "Rajesh Agarwal (Finance Manager)",
    "Ahmedabad - Head Office": "Rajesh Agarwal (Finance Manager)",
    "Vadodara - Head Office": "Rajesh Agarwal (Finance Manager)",
    "Rajkot - Head Office": "Rajesh Agarwal (Finance Manager)",
  },
  "Store Manager": {
    "Surat - Head Office": "Karan Verma (Procurement Manager)",
    "Ahmedabad - Head Office": "Karan Verma (Procurement Manager)",
    "Vadodara - Head Office": "Karan Verma (Procurement Manager)",
    "Rajkot - Head Office": "Karan Verma (Procurement Manager)",
  },
  "City Manager": {
    "Surat - Head Office": "Amit Bhatt (Sr Operations Manager)",
    "Ahmedabad - Head Office": "Amit Bhatt (Sr Operations Manager)",
    "Vadodara - Head Office": "Amit Bhatt (Sr Operations Manager)",
    "Rajkot - Head Office": "Amit Bhatt (Sr Operations Manager)",
  },
  "Sr Operations Manager": {
    "Surat - Head Office": "Founder / Super Admin",
    "Ahmedabad - Head Office": "Founder / Super Admin",
    "Vadodara - Head Office": "Founder / Super Admin",
    "Rajkot - Head Office": "Founder / Super Admin",
  },
};

// Work location options by city
const workLocationsByCity: Record<string, string[]> = {
  "Surat": [
    "Surat - Zone A",
    "Surat - Zone B", 
    "Surat - Zone C",
    "Surat - Head Office"
  ],
  "Ahmedabad": [
    "Ahmedabad - Zone A",
    "Ahmedabad - Zone B",
    "Ahmedabad - Head Office"
  ],
  "Vadodara": [
    "Vadodara - Zone A",
    "Vadodara - Head Office"
  ],
  "Rajkot": [
    "Rajkot - Zone A",
    "Rajkot - Head Office"
  ],
};

// Mock data with all 8 scenarios
const mockEmployees: Employee[] = [
  // Scenario 1: Perfect Conversion (7 days, On Time)
  {
    id: "CW-395001-001",
    tempId: "TEMP-001",
    tempIdAssignedDate: "2026-03-11",
    permanentIdAssignedDate: "2026-03-18",
    conversionDueDate: "2026-03-18",
    daysInTempStatus: 7,
    isOverdue: false,
    employmentStage: "Permanent",
    skillLevel: "Unskilled",
    firstName: "Rajesh",
    middleName: "Kumar",
    lastName: "Patel",
    fullName: "Rajesh Kumar Patel",
    fatherFirstName: "Dinesh",
    fatherMiddleName: "Bhai",
    fatherLastName: "Patel",
    fatherName: "Dinesh Bhai Patel",
    dob: "1998-05-15",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "123, MG Road, Surat, Gujarat - 395001",
    currentAddress: "123, MG Road, Surat, Gujarat - 395001",
    emergencyContact: "",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Ramesh Vora (Supervisor)",
    workLocation: "Surat - Zone A",
    pinCodes: ["395001"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-11",
    probationPeriod: "3 months",
    status: "Active",
  },
  
  // Scenario 2: Late Conversion (10 days, Overdue by 3 days)
  {
    id: "CW-395002-001",
    tempId: "TEMP-002",
    tempIdAssignedDate: "2026-03-08",
    permanentIdAssignedDate: "2026-03-18",
    conversionDueDate: "2026-03-15",
    daysInTempStatus: 10,
    isOverdue: true,
    employmentStage: "Permanent",
    skillLevel: "Semi-Skilled",
    firstName: "Sunil",
    middleName: "",
    lastName: "Yadav",
    fullName: "Sunil Yadav",
    fatherFirstName: "Ramesh",
    fatherMiddleName: "",
    fatherLastName: "Yadav",
    fatherName: "Ramesh Yadav",
    dob: "1997-08-22",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "456, Ring Road, Surat, Gujarat - 395002",
    currentAddress: "456, Ring Road, Surat, Gujarat - 395002",
    emergencyContact: "",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Amit Kumar (Supervisor)",
    workLocation: "Surat - Zone B",
    pinCodes: ["395002"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-08",
    probationPeriod: "3 months",
    status: "Active",
  },
  
  // Scenario 3: Not Converted (Performance Issues)
  {
    id: "NOT-CONVERTED",
    tempId: "TEMP-003",
    tempIdAssignedDate: "2026-03-05",
    conversionDueDate: "2026-03-12",
    daysInTempStatus: 13,
    isOverdue: true,
    employmentStage: "Not Converted",
    nonConversionReason: "Failed to meet performance standards during trial period. Poor attendance (4 absences in 13 days) and quality issues reported by supervisor.",
    skillLevel: "Unskilled",
    firstName: "Manoj",
    middleName: "",
    lastName: "Singh",
    fullName: "Manoj Singh",
    fatherFirstName: "Arun",
    fatherMiddleName: "Kumar",
    fatherLastName: "Singh",
    fatherName: "Arun Kumar Singh",
    dob: "1999-03-10",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "789, City Center, Surat, Gujarat - 395009",
    currentAddress: "789, City Center, Surat, Gujarat - 395009",
    emergencyContact: "",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Vijay Singh (Supervisor)",
    workLocation: "Surat - Zone C",
    pinCodes: ["395009"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-05",
    probationPeriod: "3 months",
    status: "Inactive",
  },
  
  // Scenario 4: Not Converted (Did Not Join)
  {
    id: "NOT-CONVERTED",
    tempId: "TEMP-004",
    tempIdAssignedDate: "2026-03-10",
    conversionDueDate: "2026-03-17",
    daysInTempStatus: 3,
    isOverdue: false,
    employmentStage: "Not Converted",
    nonConversionReason: "Candidate did not join after temp ID assignment. Accepted offer from another company. No show on scheduled start date.",
    skillLevel: "Skilled",
    firstName: "Priya",
    middleName: "",
    lastName: "Desai",
    fullName: "Priya Desai",
    fatherFirstName: "Kiran",
    fatherMiddleName: "",
    fatherLastName: "Desai",
    fatherName: "Kiran Desai",
    dob: "1996-06-18",
    gender: "Female",
    mobile: "",
    email: "",
    permanentAddress: "321, Pal Road, Surat, Gujarat - 395010",
    currentAddress: "321, Pal Road, Surat, Gujarat - 395010",
    emergencyContact: "",
    designation: "Tele Sales Executive",
    department: "Sales & CRM",
    reportingManager: "Vikram Kumar (TSM)",
    workLocation: "Surat - Head Office",
    pinCodes: ["395010"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-10",
    probationPeriod: "3 months",
    status: "Inactive",
  },
  
  // Scenario 5: Multi-Pincode Supervisor (Pending, 4 days in)
  {
    id: "PENDING",
    tempId: "TEMP-005",
    tempIdAssignedDate: "2026-03-14",
    conversionDueDate: "2026-03-21",
    daysInTempStatus: 4,
    isOverdue: false,
    employmentStage: "Temporary",
    skillLevel: "Skilled",
    firstName: "Vikram",
    middleName: "",
    lastName: "Shah",
    fullName: "Vikram Shah",
    fatherFirstName: "Prakash",
    fatherMiddleName: "Kumar",
    fatherLastName: "Shah",
    fatherName: "Prakash Kumar Shah",
    dob: "1992-11-25",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "654, Vesu, Surat, Gujarat - 395001",
    currentAddress: "654, Vesu, Surat, Gujarat - 395001",
    emergencyContact: "",
    designation: "Supervisor",
    department: "Operations",
    reportingManager: "Amit Patel (Operations Manager)",
    workLocation: "Surat - Zone A",
    pinCodes: ["395001", "395002", "395009"], // Multiple pincodes
    employeeType: "Full Time",
    dateOfJoining: "2026-03-14",
    probationPeriod: "3 months",
    status: "Active",
  },
  
  // Scenario 6: TSE Single Pincode (Pending, 6 days - Due Tomorrow)
  {
    id: "PENDING",
    tempId: "TEMP-006",
    tempIdAssignedDate: "2026-03-12",
    conversionDueDate: "2026-03-19",
    daysInTempStatus: 6,
    isOverdue: false,
    employmentStage: "Temporary",
    skillLevel: "Skilled",
    firstName: "Anjali",
    middleName: "",
    lastName: "Mehta",
    fullName: "Anjali Mehta",
    fatherFirstName: "Suresh",
    fatherMiddleName: "Kumar",
    fatherLastName: "Mehta",
    fatherName: "Suresh Kumar Mehta",
    dob: "1995-04-12",
    gender: "Female",
    mobile: "",
    email: "",
    permanentAddress: "987, Adajan, Surat, Gujarat - 395010",
    currentAddress: "987, Adajan, Surat, Gujarat - 395010",
    emergencyContact: "",
    designation: "Tele Sales Executive",
    department: "Sales & CRM",
    reportingManager: "Vikram Kumar (TSM)",
    workLocation: "Surat - Head Office",
    pinCodes: ["395010"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-12",
    probationPeriod: "3 months",
    status: "Active",
  },
  
  // Scenario 7: Overdue Car Washer (9 days, Overdue by 2 days)
  {
    id: "PENDING",
    tempId: "TEMP-007",
    tempIdAssignedDate: "2026-03-09",
    conversionDueDate: "2026-03-16",
    daysInTempStatus: 9,
    isOverdue: true,
    employmentStage: "Temporary",
    skillLevel: "Semi-Skilled",
    firstName: "Ramesh",
    middleName: "",
    lastName: "Patil",
    fullName: "Ramesh Patil",
    fatherFirstName: "Ganesh",
    fatherMiddleName: "",
    fatherLastName: "Patil",
    fatherName: "Ganesh Patil",
    dob: "1998-09-20",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "147, Citylight, Surat, Gujarat - 395001",
    currentAddress: "147, Citylight, Surat, Gujarat - 395001",
    emergencyContact: "",
    designation: "Car Washer",
    department: "Operations",
    reportingManager: "Ramesh Vora (Supervisor)",
    workLocation: "Surat - Zone A",
    pinCodes: ["395001", "395006"], // Multiple pincodes
    employeeType: "Full Time",
    dateOfJoining: "2026-03-09",
    probationPeriod: "3 months",
    status: "Active",
  },
  
  // Scenario 8: Operations Manager (Fresh, 2 days in)
  {
    id: "PENDING",
    tempId: "TEMP-008",
    tempIdAssignedDate: "2026-03-16",
    conversionDueDate: "2026-03-23",
    daysInTempStatus: 2,
    isOverdue: false,
    employmentStage: "Temporary",
    skillLevel: "Skilled",
    firstName: "Prakash",
    middleName: "Rajendra",
    lastName: "Kumar",
    fullName: "Prakash Rajendra Kumar",
    fatherFirstName: "Rajendra",
    fatherMiddleName: "",
    fatherLastName: "Kumar",
    fatherName: "Rajendra Kumar",
    dob: "1988-01-15",
    gender: "Male",
    mobile: "",
    email: "",
    permanentAddress: "258, Varachha, Surat, Gujarat - 395010",
    currentAddress: "258, Varachha, Surat, Gujarat - 395010",
    emergencyContact: "",
    designation: "Operations Manager",
    department: "Operations",
    reportingManager: "Amit Bhatt (Sr Operations Manager)",
    workLocation: "Surat - Head Office",
    pinCodes: ["395010"],
    employeeType: "Full Time",
    dateOfJoining: "2026-03-16",
    probationPeriod: "6 months",
    status: "Active",
  },
];

function TableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="h-10 bg-gray-100 rounded animate-pulse flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function EmployeeDatabase({ openAddModal }: { openAddModal?: boolean } = {}) {
  const [employees, setEmployees] = useState<Employee[]>(() => employeeDatabaseService.getAll());
  const { employees: contextEmployees } = useEmployee();
  const { city } = useCity();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterStage, setFilterStage] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(openAddModal || false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showNotConvertModal, setShowNotConvertModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("Surat");

  // Open modal when prop changes
  useEffect(() => {
    if (openAddModal) {
      setShowAddModal(true);
    }
  }, [openAddModal]);

  // Subscribe to employee database changes
  useEffect(() => {
    const unsubscribe = employeeDatabaseService.subscribe((updatedEmployees) => {
      setEmployees(updatedEmployees);
    });
    return unsubscribe;
  }, []);
  const [isManagerFieldLocked, setIsManagerFieldLocked] = useState(true);
  const [selectedPinCodes, setSelectedPinCodes] = useState<string[]>([]);

  // PHASE 1: Collapsible section states (collapsed by default)
  const [salaryDetailsOpen, setSalaryDetailsOpen] = useState(false);
  const [incentivePlanOpen, setIncentivePlanOpen] = useState(false);
  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [nonConversionReason, setNonConversionReason] = useState("");
  const [ageValidationError, setAgeValidationError] = useState<{
    dob: string;
    years: number;
    months: number;
  } | null>(null);
  const [photographFile, setPhotographFile] = useState<File | null>(null);
  const [photographPreview, setPhotographPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({
    status: "Active",
    employeeType: "Full Time",
    probationPeriod: "3 months",
    employmentStage: "Temporary",
    skillLevel: "Unskilled",
    pinCodes: [],
  });

  const { currentUser } = useRole();
  const canDelete = hasPermission(currentUser, "hr", "delete");

  // Generate temp ID when form opens
  useEffect(() => {
    if (showAddModal) {
      const allTempIds = employees.map(e => parseInt(e.tempId.replace('TEMP-', ''))).filter(n => !isNaN(n));
      const nextTempNum = allTempIds.length > 0 ? Math.max(...allTempIds) + 1 : 1;
      const tempId = `TEMP-${String(nextTempNum).padStart(3, "0")}`;
      const today = new Date().toISOString().split('T')[0];

      setFormData(prev => ({
        ...prev,
        tempId,
        tempIdAssignedDate: today,
        dateOfJoining: today,
        conversionDueDate: calculateDueDate(today),
        daysInTempStatus: 0,
        isOverdue: false,
      }));
    }
  }, [showAddModal, employees]);

  // Manager hierarchy: who should manage each role
  const MANAGER_ROLE_FOR: Record<string, string[]> = {
    "Car Washer":             ["Supervisor"],
    "Supervisor":             ["Operations Manager", "Sr Operations Manager"],
    "Operations Manager":     ["Cluster Manager", "Sr Operations Manager"],
    "Sr Operations Manager":  ["Cluster Manager"],
    "Cluster Manager":        ["City Manager"],
    "TSE":                    ["TSM"],
    "TSM":                    ["City Manager"],
    "CCE":                    ["Admin", "City Manager"],
    "Store Manager":          ["City Manager", "Admin"],
    "HR":                     ["Admin"],
    "Accounts":               ["Admin"],
  };

  const eligibleManagers = useMemo(() => {
    if (!formData.designation || !formData.workLocation) return [];
    const managerRoles = MANAGER_ROLE_FOR[formData.designation] || [];
    return contextEmployees.filter(e =>
      managerRoles.includes(e.designation) &&
      e.status === "Active" &&
      (e.workLocation === formData.workLocation || e.cityId === city)
    );
  }, [formData.designation, formData.workLocation, contextEmployees, city]);

  // Auto-compute full name
  useEffect(() => {
    const { firstName, middleName, lastName } = formData;
    if (firstName || middleName || lastName) {
      const parts = [firstName, middleName, lastName].filter(Boolean);
      setFormData(prev => ({ ...prev, fullName: parts.join(" ") }));
    }
  }, [formData.firstName, formData.middleName, formData.lastName]);

  // Auto-compute father's full name
  useEffect(() => {
    const { fatherFirstName, fatherMiddleName, fatherLastName } = formData;
    if (fatherFirstName || fatherMiddleName || fatherLastName) {
      const parts = [fatherFirstName, fatherMiddleName, fatherLastName].filter(Boolean);
      setFormData(prev => ({ ...prev, fatherName: parts.join(" ") }));
    }
  }, [formData.fatherFirstName, formData.fatherMiddleName, formData.fatherLastName]);

  // Update pinCodes when work location changes
  useEffect(() => {
    if (formData.workLocation) {
      const pincode = extractPincode(formData.workLocation);
      if (selectedPinCodes.length === 0) {
        setSelectedPinCodes([pincode]);
        setFormData(prev => ({ ...prev, pinCodes: [pincode] }));
      }
    }
  }, [formData.workLocation]);

  // Recalculate conversion due date when date of joining changes
  useEffect(() => {
    if (formData.dateOfJoining) {
      const dueDate = calculateDueDate(formData.dateOfJoining);
      setFormData(prev => ({ ...prev, conversionDueDate: dueDate }));
    }
  }, [formData.dateOfJoining]);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      emp.id?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      emp.tempId?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      emp.email?.toLowerCase().includes(debouncedSearch.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    const matchesStage = filterStage === "all" || emp.employmentStage === filterStage;

    return matchesSearch && matchesStatus && matchesStage;
  });

  // Calculate dashboard metrics
  const tempEmployees = employees.filter(e => e.employmentStage === "Temporary");
  const onTrackTemp = tempEmployees.filter(e => !e.isOverdue && e.daysInTempStatus <= 6);
  const dueTodayTemp = tempEmployees.filter(e => !e.isOverdue && e.daysInTempStatus === 7);
  const overdueTemp = tempEmployees.filter(e => e.isOverdue);
  const permanentEmployees = employees.filter(e => e.employmentStage === "Permanent");
  const notConvertedEmployees = employees.filter(e => e.employmentStage === "Not Converted");

  const getStatusColor = (status: EmployeeStatus) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-800 border-green-300";
      case "On Leave": return "bg-orange-100 text-orange-800 border-orange-300";
      case "Inactive": return "bg-gray-100 text-gray-800 border-gray-300";
      case "Exited": return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getStageColor = (stage: EmploymentStage, isOverdue: boolean) => {
    if (stage === "Temporary" && isOverdue) return "bg-red-100 text-red-800 border-red-300";
    if (stage === "Temporary") return "bg-amber-100 text-amber-800 border-amber-300";
    if (stage === "Permanent") return "bg-green-100 text-green-800 border-green-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string): { years: number; months: number } => {
    const birthDate = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    // Adjust for day of month
    if (today.getDate() < birthDate.getDate()) {
      months--;
    }

    // Adjust for negative months
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months };
  };

  // Validate age on DOB change
  const validateAge = (dob: string) => {
    if (!dob) {
      setAgeValidationError(null);
      return;
    }

    const age = calculateAge(dob);

    if (age.years < 18) {
      setAgeValidationError({
        dob,
        years: age.years,
        months: age.months,
      });
    } else {
      setAgeValidationError(null);
    }
  };

  const handlePhotographUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
      toast.error("⚠️ Invalid file type. Please upload a JPG or PNG image.");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.info("⚠️ File size exceeds 2 MB. Please upload a smaller image.");
      return;
    }

    setPhotographFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotographPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhotograph = () => {
    setPhotographFile(null);
    setPhotographPreview(null);
  };

  const handleAddEmployee = () => {
    if (!formData.firstName || !formData.lastName || !formData.email ||
        !formData.designation || !formData.workLocation || !formData.reportingManager) {
      toast.error("⚠️ Please fill all required fields!");
      return;
    }

    if (!photographFile) {
      toast.error("⚠️ Employee photograph is required!\n\nPlease upload a passport-size photograph before submitting.");
      return;
    }

    const newEmployee: Employee = {
      id: "PENDING",
      ...formData as Employee,
      pinCodes: selectedPinCodes,
    };

    employeeDatabaseService.add(newEmployee);
    setShowAddModal(false);
    handleCloseModal();
    
    toast.success(`✅ Employee Onboarded Successfully!\n\nTemp ID: ${newEmployee.tempId}\nName: ${newEmployee.fullName}\nSkill Level: ${newEmployee.skillLevel}\nDue for Conversion: ${newEmployee.conversionDueDate}\n\nEmployee is now in TEMPORARY status. Please convert to permanent within 7 days.`);
  };

  const handleConvertToPermanent = () => {
    if (!selectedEmployee) return;

    // Validate onboarding checklist completion
    const employeeId = selectedEmployee.id === "PENDING" ? selectedEmployee.tempId : selectedEmployee.id;
    const onboardingTasks = onboardingChecklistService.getByEmployeeId(employeeId);

    // Check if all tasks are completed and verified
    const pendingTasks = onboardingTasks.filter(
      task => task.status !== "Completed" || !task.verified
    );

    if (pendingTasks.length > 0) {
      const pendingList = pendingTasks.map(task => {
        if (task.status !== "Completed") {
          return `${task.task} (Not Completed)`;
        } else if (!task.verified) {
          return `${task.task} (Not Verified by HR)`;
        }
        return task.task;
      }).join("\n• ");

      toast.success(`⚠️ Cannot convert to Permanent ID.\n\nThe following onboarding documents are pending:\n\n• ${pendingList}\n\nAll documents must be completed AND verified by HR before conversion.`);
      return;
    }

    const permanentId = generatePermanentId(
      selectedEmployee.designation,
      selectedEmployee.pinCodes,
      employees
    );

    const today = new Date().toISOString().split('T')[0];

    const updatedEmployees = employees.map(emp =>
      emp.tempId === selectedEmployee.tempId
        ? {
            ...emp,
            id: permanentId,
            employmentStage: "Permanent" as EmploymentStage,
            permanentIdAssignedDate: today
          }
        : emp
    );

    setEmployees(updatedEmployees);
    setShowConvertModal(false);
    setSelectedEmployee(null);

    toast.success(`✅ Employee Converted to Permanent!\n\nTemp ID: ${selectedEmployee.tempId}\nPermanent ID: ${permanentId}\nName: ${selectedEmployee.fullName}\n\nEmployee is now on payroll with permanent ID.`);
  };

  const handleMarkNotConverted = () => {
    if (!selectedEmployee || !nonConversionReason.trim()) {
      toast.error("⚠️ Please provide a reason for not converting this employee.");
      return;
    }
    
    const updatedEmployees = employees.map(emp => 
      emp.tempId === selectedEmployee.tempId
        ? { 
            ...emp, 
            employmentStage: "Not Converted" as EmploymentStage,
            nonConversionReason: nonConversionReason,
            status: "Inactive" as EmployeeStatus
          }
        : emp
    );
    
    setEmployees(updatedEmployees);
    setShowNotConvertModal(false);
    setSelectedEmployee(null);
    setNonConversionReason("");
    
    toast.success(`✅ Employee Marked as Not Converted\n\nTemp ID: ${selectedEmployee.tempId}\nName: ${selectedEmployee.fullName}\nReason: ${nonConversionReason}\n\nRecord archived in Employee Ledger.`);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setAgeValidationError(null);
    setPhotographFile(null);
    setPhotographPreview(null);
    setFormData({
      status: "Active",
      employeeType: "Full Time",
      probationPeriod: "3 months",
      employmentStage: "Temporary",
      skillLevel: "Unskilled",
      pinCodes: [],
    });
    setSelectedCity("Surat");
    setIsManagerFieldLocked(true);
    setSelectedPinCodes([]);

    // PHASE 1: Reset collapsible sections to collapsed state
    setSalaryDetailsOpen(false);
    setIncentivePlanOpen(false);
    setPerformanceOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Clock className="w-8 h-8 text-amber-600" />
              <div>
                <p className="text-sm text-gray-500">Temporary</p>
                <p className="text-2xl font-bold">{tempEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">On Track</p>
                <p className="text-2xl font-bold">{onTrackTemp.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-200">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueTemp.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <CheckCircle className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Permanent</p>
                <p className="text-2xl font-bold">{permanentEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by name, ID, temp ID, or email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStage || "all"} onValueChange={setFilterStage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="Temporary">Temporary</SelectItem>
                <SelectItem value="Permanent">Permanent</SelectItem>
                <SelectItem value="Not Converted">Not Converted</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus || "all"} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Employee
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee Database ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {!employees || employees.length === 0 ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Designation</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Skill Level</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Days in Temp</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.tempId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {emp.fullName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-gray-900">{emp.fullName}</div>
                            <EmployeeStatusBadge status={emp.status} size="sm" showIcon={false} />
                          </div>
                          <div className="text-xs text-amber-600 font-mono">{emp.tempId}</div>
                          {emp.employmentStage === "Permanent" && (
                            <div className="text-xs text-green-600 font-mono">{emp.id}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{emp.designation}</div>
                        <div className="text-xs text-gray-500">
                          {(emp.pinCodes?.length ?? 0) > 1 ? `${emp.pinCodes!.join(", ")} (Multi)` : (emp.pinCodes?.[0] ?? "—")}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline">{emp.skillLevel}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge className={getStageColor(emp.employmentStage, emp.isOverdue)}>
                        {emp.employmentStage}
                        {emp.isOverdue && " (Overdue)"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-sm">
                        {emp.employmentStage === "Temporary" ? (
                          <>
                            <div className={emp.isOverdue ? "text-red-600 font-bold" : "text-gray-900"}>
                              {emp.daysInTempStatus} / 7 days
                            </div>
                            <div className="text-xs text-gray-500">
                              Due: {emp.conversionDueDate}
                            </div>
                          </>
                        ) : emp.employmentStage === "Permanent" ? (
                          <span className="text-green-600">Converted ({emp.daysInTempStatus}d)</span>
                        ) : (
                          <span className="text-gray-500">N/A</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        {emp.employmentStage === "Temporary" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowConvertModal(true);
                              }}
                            >
                              Convert
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedEmployee(emp);
                                setShowNotConvertModal(true);
                              }}
                            >
                              Not Convert
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Add Employee Modal - (Keeping existing modal code but adding skill level and pincode fields) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-5xl my-8">
            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <CardTitle>Add New Employee (Onboarding)</CardTitle>
                  {formData.tempId && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                      Temp ID: {formData.tempId}
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-6">
                {/* Personal Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Personal Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <Label>First Name *</Label>
                      <Input
                        placeholder="Enter first name"
                        value={formData.firstName || ""}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Middle Name</Label>
                      <Input
                        placeholder="Enter middle name"
                        value={formData.middleName || ""}
                        onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Last Name *</Label>
                      <Input
                        placeholder="Enter last name"
                        value={formData.lastName || ""}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Full Name (Auto-generated)</Label>
                      <Input value={formData.fullName || ""} disabled className="bg-gray-50 text-gray-700 font-semibold" />
                    </div>

                    {/* Employee Photograph Upload */}
                    <div className="col-span-3">
                      <Label className="text-gray-900 font-medium mb-2 block">
                        Employee Photograph (Passport Size) *
                      </Label>
                      <div className="flex items-start gap-4">
                        <div
                          className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          onClick={() => document.getElementById("photograph-upload")?.click()}
                        >
                          {photographPreview ? (
                            <>
                              <img
                                src={photographPreview}
                                alt="Employee photograph"
                                className="w-full h-full object-cover rounded-lg"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePhotograph();
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="text-center p-4">
                              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Click to upload</p>
                              <p className="text-xs text-gray-400">or drag photo here</p>
                            </div>
                          )}
                          <input
                            id="photograph-upload"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="hidden"
                            onChange={handlePhotographUpload}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-700 mb-1">
                            Upload a clear passport-size photograph of the employee.
                          </p>
                          <p className="text-xs text-gray-500">
                            Accepted formats: JPG, PNG. Maximum size: 2 MB.
                          </p>
                          {photographFile && (
                            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                              <p className="text-xs text-green-700">
                                <CheckCircle className="w-3 h-3 inline mr-1" />
                                {photographFile.name} ({(photographFile.size / 1024).toFixed(2)} KB)
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Father's/Spouse First Name *</Label>
                      <Input
                        placeholder="Enter first name"
                        value={formData.fatherFirstName || ""}
                        onChange={(e) => setFormData({ ...formData, fatherFirstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Father's/Spouse Middle Name</Label>
                      <Input
                        placeholder="Enter middle name"
                        value={formData.fatherMiddleName || ""}
                        onChange={(e) => setFormData({ ...formData, fatherMiddleName: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Father's/Spouse Last Name *</Label>
                      <Input
                        placeholder="Enter last name"
                        value={formData.fatherLastName || ""}
                        onChange={(e) => setFormData({ ...formData, fatherLastName: e.target.value })}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label>Father's/Spouse Full Name (Auto-generated)</Label>
                      <Input value={formData.fatherName || ""} disabled className="bg-gray-50 text-gray-700" />
                    </div>

                    <div className="col-span-2">
                      <Label>Date of Birth *</Label>
                      <Input
                        type="date"
                        value={formData.dob || ""}
                        onChange={(e) => {
                          setFormData({ ...formData, dob: e.target.value });
                          validateAge(e.target.value);
                        }}
                        onBlur={(e) => validateAge(e.target.value)}
                      />
                      {ageValidationError && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-300 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-900">
                                This employee is under 18 years of age and cannot be recruited.
                              </p>
                              <p className="text-xs text-red-700 mt-1">
                                Date of birth entered: {new Date(ageValidationError.dob).toLocaleDateString("en-IN")}.{" "}
                                Age calculated: {ageValidationError.years} years {ageValidationError.months} months.{" "}
                                Minimum age for recruitment is 18 years.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Gender *</Label>
                      <Select value={formData.gender || ""} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mobile Number *</Label>
                      <Input placeholder="+91 XXXXXXXXXX" value={formData.mobile || ""} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <Label>Email *</Label>
                      <Input type="email" placeholder="employee@example.com" value={formData.email || ""} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <Label>Permanent Address *</Label>
                      <Textarea placeholder="Enter permanent address" value={formData.permanentAddress || ""} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <Label>Current Address *</Label>
                      <Textarea placeholder="Enter current address" value={formData.currentAddress || ""} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} />
                    </div>
                    <div className="col-span-3">
                      <Label>Emergency Contact *</Label>
                      <Input placeholder="+91 XXXXXXXXXX" value={formData.emergencyContact || ""} onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Briefcase className="w-5 h-5" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label>Skill Level *</Label>
                      <Select value={formData.skillLevel || ""} onValueChange={(value) => setFormData({ ...formData, skillLevel: value as SkillLevel })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Skilled">Skilled</SelectItem>
                          <SelectItem value="Semi-Skilled">Semi-Skilled</SelectItem>
                          <SelectItem value="Unskilled">Unskilled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Designation *</Label>
                      <Select value={formData.designation || ""} onValueChange={(value) => setFormData({ ...formData, designation: value })}>
                        <SelectTrigger><SelectValue placeholder="Select designation" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Car Washer">Car Washer</SelectItem>
                          <SelectItem value="Supervisor">Supervisor</SelectItem>
                          <SelectItem value="Operations Manager">Operations Manager</SelectItem>
                          <SelectItem value="Tele Sales Executive">Tele Sales Executive</SelectItem>
                          <SelectItem value="TSM">TSM</SelectItem>
                          <SelectItem value="Customer Care Executive">Customer Care Executive</SelectItem>
                          <SelectItem value="HR Executive">HR Executive</SelectItem>
                          <SelectItem value="Finance Executive">Finance Executive</SelectItem>
                          <SelectItem value="Store Manager">Store Manager</SelectItem>
                          <SelectItem value="City Manager">City Manager</SelectItem>
                          <SelectItem value="Sr Operations Manager">Sr Operations Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Department *</Label>
                      <Select value={formData.department || ""} onValueChange={(value) => setFormData({ ...formData, department: value })}>
                        <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Operations">Operations</SelectItem>
                          <SelectItem value="Sales & CRM">Sales & CRM</SelectItem>
                          <SelectItem value="Support">Support</SelectItem>
                          <SelectItem value="HR & Admin">HR & Admin</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Procurement">Procurement</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>City *</Label>
                      <Select value={selectedCity || ""} onValueChange={(value) => {
                        setSelectedCity(value);
                        setFormData({ ...formData, workLocation: "" });
                        setSelectedPinCodes([]);
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Surat">Surat</SelectItem>
                          <SelectItem value="Ahmedabad">Ahmedabad</SelectItem>
                          <SelectItem value="Vadodara">Vadodara</SelectItem>
                          <SelectItem value="Rajkot">Rajkot</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Work Location / Zone *</Label>
                      <Select value={formData.workLocation || ""} onValueChange={(value) => {
                        setFormData({ ...formData, workLocation: value });
                        const pincode = extractPincode(value);
                        if (!selectedPinCodes.includes(pincode)) {
                          setSelectedPinCodes([pincode]);
                        }
                      }}>
                        <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                        <SelectContent>
                          {workLocationsByCity[selectedCity]?.map((location) => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-2">
                      <Label>Additional Pincodes (For multi-zone coverage)</Label>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {selectedPinCodes.map(pin => (
                          <Badge key={pin} variant="outline" className="text-sm">
                            {pin}
                            {selectedPinCodes.length > 1 && (
                              <X 
                                className="w-3 h-3 ml-1 cursor-pointer" 
                                onClick={() => {
                                  const newPins = selectedPinCodes.filter(p => p !== pin);
                                  setSelectedPinCodes(newPins);
                                  setFormData({ ...formData, pinCodes: newPins });
                                }}
                              />
                            )}
                          </Badge>
                        ))}
                      </div>
                      <Input 
                        placeholder="Enter additional pincode (e.g., 395006)" 
                        className="mt-2"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const input = e.currentTarget;
                            const pincode = input.value.trim();
                            if (pincode && !selectedPinCodes.includes(pincode)) {
                              const newPins = [...selectedPinCodes, pincode];
                              setSelectedPinCodes(newPins);
                              setFormData({ ...formData, pinCodes: newPins });
                              input.value = '';
                            }
                          }
                        }}
                      />
                      <p className="text-xs text-gray-500 mt-1">Press Enter to add pincode</p>
                    </div>

                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Reporting Manager *</Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={isManagerFieldLocked ? "text-amber-600" : "text-green-600"}
                          onClick={() => setIsManagerFieldLocked(!isManagerFieldLocked)}
                        >
                          {isManagerFieldLocked ? (
                            <><Lock className="w-3 h-3 mr-2" />Locked (Click to Edit)</>
                          ) : (
                            <><Unlock className="w-3 h-3 mr-2" />Unlocked (Manual Override)</>
                          )}
                        </Button>
                      </div>
                      <Select
                        value={formData.reportingManager}
                        onValueChange={(val) => setFormData(prev => ({ ...prev, reportingManager: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={eligibleManagers.length === 0 ? "No managers found for this role" : "Select reporting manager"} />
                        </SelectTrigger>
                        <SelectContent>
                          {eligibleManagers.map(m => (
                            <SelectItem key={m.id} value={m.fullName}>
                              {m.fullName} — {m.designation} ({m.pinCodes?.[0] || "No pincode"})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {eligibleManagers.length === 0 && formData.designation && (
                        <p className="text-xs text-amber-600 mt-1">No active managers found. You can type a name manually.</p>
                      )}
                    </div>
                    
                    <div>
                      <Label>Employee Type *</Label>
                      <Select value={formData.employeeType || ""} onValueChange={(value) => setFormData({ ...formData, employeeType: value as EmployeeType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full Time">Full Time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                          <SelectItem value="Part Time">Part Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Date of Joining *</Label>
                      <Input type="date" value={formData.dateOfJoining || formData.tempIdAssignedDate || ""} onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })} />
                    </div>

                    <div>
                      <Label>Probation Period *</Label>
                      <Select value={formData.probationPeriod || ""} onValueChange={(value) => setFormData({ ...formData, probationPeriod: value })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3 months">3 months</SelectItem>
                          <SelectItem value="6 months">6 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Conversion Info */}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Onboarding Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Temp ID:</span>
                        <span className="ml-2 font-mono text-amber-700">{formData.tempId}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date of Joining:</span>
                        <span className="ml-2">{formData.dateOfJoining}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversion Due:</span>
                        <span className="ml-2 font-semibold text-blue-700">
                          {formData.conversionDueDate} (7 days from joining)
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 text-amber-700">Temporary (7 days to convert)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PHASE 1: Salary Details (Collapsible) */}
                <div className="border-t pt-6">
                  <Collapsible open={salaryDetailsOpen} onOpenChange={setSalaryDetailsOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between p-0 hover:bg-transparent"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-blue-600" />
                          Salary Details
                          <Badge variant="outline" className="ml-2 text-xs font-normal">
                            Optional
                          </Badge>
                        </h3>
                        {salaryDetailsOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label>Salary Type</Label>
                          <Select
                            value={(formData as any).salary?.type || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                salary: {
                                  ...(formData as any).salary,
                                  type: value as "fixed" | "hourly" | "per_car" | "hybrid",
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select salary type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">Fixed</SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="per_car">Per Car</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Base Salary (₹)</Label>
                          <Input
                            type="number"
                            placeholder="Enter base salary"
                            value={(formData as any).salary?.base || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salary: {
                                  ...(formData as any).salary,
                                  base: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Payment Cycle</Label>
                          <Select
                            value={(formData as any).salary?.paymentCycle || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                salary: {
                                  ...(formData as any).salary,
                                  paymentCycle: value as "weekly" | "monthly",
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment cycle" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Structure ID (Optional)</Label>
                          <Input
                            placeholder="e.g., SAL-CW-001"
                            value={(formData as any).salary?.structureId || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                salary: {
                                  ...(formData as any).salary,
                                  structureId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Salary details can be updated later from Payroll module
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* PHASE 1: Incentive Plan (Collapsible) */}
                <div className="border-t pt-6">
                  <Collapsible open={incentivePlanOpen} onOpenChange={setIncentivePlanOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between p-0 hover:bg-transparent"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Incentive Plan
                          <Badge variant="outline" className="ml-2 text-xs font-normal">
                            Optional
                          </Badge>
                        </h3>
                        {incentivePlanOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label>Incentive Type</Label>
                          <Select
                            value={(formData as any).incentives?.type || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                incentives: {
                                  ...(formData as any).incentives,
                                  type: value as "per_car" | "target_based" | "revenue_share",
                                },
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select incentive type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="per_car">Per Car</SelectItem>
                              <SelectItem value="target_based">Target Based</SelectItem>
                              <SelectItem value="revenue_share">Revenue Share</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Plan ID (Optional)</Label>
                          <Input
                            placeholder="e.g., INC-CW-2024"
                            value={(formData as any).incentives?.planId || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                incentives: {
                                  ...(formData as any).incentives,
                                  planId: e.target.value,
                                },
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Target (Units/Month)</Label>
                          <Input
                            type="number"
                            placeholder="Enter target"
                            value={(formData as any).incentives?.target || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                incentives: {
                                  ...(formData as any).incentives,
                                  target: parseFloat(e.target.value) || 0,
                                },
                              })
                            }
                          />
                        </div>

                        <div>
                          <Label>Achieved (Auto-calculated)</Label>
                          <Input
                            type="number"
                            value={(formData as any).incentives?.achieved || 0}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Incentive targets can be updated monthly from Incentive Management module
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* PHASE 1: Performance (Collapsible - Read Only) */}
                <div className="border-t pt-6">
                  <Collapsible open={performanceOpen} onOpenChange={setPerformanceOpen}>
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between p-0 hover:bg-transparent"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-600" />
                          Performance Metrics
                          <Badge variant="outline" className="ml-2 text-xs font-normal bg-gray-100">
                            Read-only
                          </Badge>
                        </h3>
                        {performanceOpen ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <Label>Total Cars Washed</Label>
                          <Input
                            type="number"
                            value={(formData as any).performance?.totalCarsWashed || 0}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label>Rating (1-5)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={(formData as any).performance?.rating || 0}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>

                        <div>
                          <Label>Attendance Score (%)</Label>
                          <Input
                            type="number"
                            value={(formData as any).performance?.attendanceScore || 0}
                            disabled
                            className="bg-gray-50"
                          />
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <p className="text-sm text-purple-800">
                          📊 Performance metrics are auto-calculated from Bookings, Attendance, and Customer Feedback modules
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={handleAddEmployee}
                    disabled={!!ageValidationError || !photographFile}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Onboard Employee (Temporary)
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleCloseModal}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Convert to Permanent Modal */}
      {showConvertModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b bg-green-50">
              <CardTitle>Convert to Permanent Employee</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Employee Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> <span className="ml-2 font-medium">{selectedEmployee.fullName}</span></div>
                    <div><span className="text-gray-600">Temp ID:</span> <span className="ml-2 font-mono text-amber-700">{selectedEmployee.tempId}</span></div>
                    <div><span className="text-gray-600">Designation:</span> <span className="ml-2">{selectedEmployee.designation}</span></div>
                    <div><span className="text-gray-600">Pincodes:</span> <span className="ml-2 font-mono">{(selectedEmployee.pinCodes ?? []).join(", ")}</span></div>
                    <div><span className="text-gray-600">Days in Temp:</span> <span className="ml-2">{selectedEmployee.daysInTempStatus} days</span></div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-green-900">Permanent ID to be Generated:</h4>
                  <p className="text-lg font-mono text-green-700">
                    {generatePermanentId(selectedEmployee.designation, selectedEmployee.pinCodes, employees)}
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    Structure: {roleCodeMap[selectedEmployee.designation]}-{(selectedEmployee.pinCodes?.length ?? 0) > 1 ? `${(selectedEmployee.pinCodes?.[0] ?? "—")}-M` : (selectedEmployee.pinCodes?.[0] ?? "—")}-XXX
                  </p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleConvertToPermanent}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirm Conversion to Permanent
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowConvertModal(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mark Not Converted Modal */}
      {showNotConvertModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="border-b bg-red-50">
              <CardTitle>Mark Employee as Not Converted</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Employee Details</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-600">Name:</span> <span className="ml-2 font-medium">{selectedEmployee.fullName}</span></div>
                    <div><span className="text-gray-600">Temp ID:</span> <span className="ml-2 font-mono text-amber-700">{selectedEmployee.tempId}</span></div>
                    <div><span className="text-gray-600">Designation:</span> <span className="ml-2">{selectedEmployee.designation}</span></div>
                    <div><span className="text-gray-600">Days in Temp:</span> <span className="ml-2">{selectedEmployee.daysInTempStatus} days</span></div>
                  </div>
                </div>
                
                <div>
                  <Label>Reason for Not Converting *</Label>
                  <Textarea
                    placeholder="Enter detailed reason why this employee is not being converted to permanent status..."
                    value={nonConversionReason}
                    onChange={(e) => setNonConversionReason(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">This will be recorded in the Employee Ledger for future reference.</p>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button variant="destructive" className="flex-1" onClick={handleMarkNotConverted}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Confirm Not Converted
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowNotConvertModal(false);
                    setNonConversionReason("");
                  }}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Employee Modal */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <Card className="w-full max-w-4xl my-8">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
                    {selectedEmployee.fullName?.charAt(0)}
                  </div>
                  <div>
                    <CardTitle>{selectedEmployee.fullName}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge className="bg-amber-100 text-amber-800">{selectedEmployee.tempId}</Badge>
                      {selectedEmployee.employmentStage === "Permanent" && (
                        <Badge className="bg-green-100 text-green-800">{selectedEmployee.id}</Badge>
                      )}
                      <Badge className={getStageColor(selectedEmployee.employmentStage, selectedEmployee.isOverdue)}>
                        {selectedEmployee.employmentStage}
                      </Badge>
                      <Badge variant="outline">{selectedEmployee.skillLevel}</Badge>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowViewModal(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              <div className="space-y-6">
                {/* Conversion Tracking */}
                {selectedEmployee.employmentStage !== "Not Converted" && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-3">📊 Conversion Tracking</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Date of Joining:</span>
                        <span className="ml-2">{selectedEmployee.dateOfJoining}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Conversion Due Date:</span>
                        <span className="ml-2 font-semibold">{selectedEmployee.conversionDueDate} (7 days from joining)</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days in Temp Status:</span>
                        <span className={`ml-2 font-bold ${selectedEmployee.isOverdue ? "text-red-600" : "text-gray-900"}`}>
                          {selectedEmployee.daysInTempStatus} / 7 days
                        </span>
                      </div>
                      {selectedEmployee.permanentIdAssignedDate && (
                        <div>
                          <span className="text-gray-600">Converted On:</span>
                          <span className="ml-2 text-green-600 font-semibold">{selectedEmployee.permanentIdAssignedDate}</span>
                        </div>
                      )}
                      {selectedEmployee.isOverdue && selectedEmployee.employmentStage === "Temporary" && (
                        <div className="col-span-2">
                          <Badge className="bg-red-100 text-red-800 border-red-300">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            OVERDUE by {selectedEmployee.daysInTempStatus - 7} days - Action Required!
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Not Converted Reason */}
                {selectedEmployee.employmentStage === "Not Converted" && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-semibold text-red-900 mb-2">❌ Not Converted</h4>
                    <p className="text-sm text-gray-700"><span className="font-semibold">Reason:</span> {selectedEmployee.nonConversionReason}</p>
                  </div>
                )}

                {/* Personal Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-gray-500">Father / Spouse Name</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.fatherName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Date of Birth</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.dob}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Gender</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.gender}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Mobile Number</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.mobile}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">Email</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.email}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">Emergency Contact</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.emergencyContact}</p>
                    </div>
                  </div>
                </div>

                {/* Employment Details */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="text-gray-500">Designation</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.designation}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Department</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Skill Level</Label>
                      <Badge className="mt-1" variant="outline">{selectedEmployee.skillLevel}</Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500">Reporting Manager</Label>
                      <p className="text-gray-900 mt-1 font-semibold text-blue-600">{selectedEmployee.reportingManager}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Work Location</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.workLocation}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Pincodes</Label>
                      <div className="flex gap-1 mt-1">
                        {selectedEmployee.pinCodes.map(pin => (
                          <Badge key={pin} variant="outline" className="font-mono">{pin}</Badge>
                        ))}
                        {(selectedEmployee.pinCodes?.length ?? 0) > 1 && (
                          <Badge className="bg-purple-100 text-purple-800">Multi-Zone</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Employee Type</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.employeeType}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Date of Joining</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.dateOfJoining}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Probation Period</Label>
                      <p className="text-gray-900 mt-1">{selectedEmployee.probationPeriod}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className={`${getStatusColor(selectedEmployee.status)} mt-1`}>
                        {selectedEmployee.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
