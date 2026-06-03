/**
 * Example Screen - Employee Management
 * Demonstrates usage of design system components
 */

import { useState } from "react";
import {
  PageHeader,
  StatCard,
  DataTable,
  FilterBar,
  ModalLayout,
  FormField,
  FormGrid,
  GridLayout,
  Section,
  StatusBadge,
  EmptyState,
} from "../../../app/design-system/components";
import { EmployeeCard, EmployeeCardData } from "../../../components/domain";
import { Button } from "../../../app/components/ui/button";
import {
  Users,
  UserPlus,
  Download,
  TrendingUp,
  UserCheck,
  UserX,
  Eye,
  Edit,
} from "lucide-react";

// Mock data
const mockEmployees: EmployeeCardData[] = [
  {
    id: "EMP001",
    fullName: "Rahul Verma",
    email: "",
    mobile: "",
    department: "Operations",
    designation: "Car Washer",
    status: "Active",
    dateOfJoining: "2023-01-15",
    workLocation: "Surat - Zone A",
  },
  {
    id: "EMP002",
    fullName: "Priya Sharma",
    email: "",
    mobile: "",
    department: "Sales & CRM",
    designation: "Tele Sales Executive",
    status: "Active",
    dateOfJoining: "2023-03-10",
    workLocation: "Surat - Head Office",
  },
  {
    id: "EMP003",
    fullName: "Amit Kumar",
    email: "",
    mobile: "",
    department: "Operations",
    designation: "Supervisor",
    status: "On Leave",
    dateOfJoining: "2022-06-01",
    workLocation: "Surat - Zone B",
  },
];

export function EmployeeManagementScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // Stats data
  const stats = [
    {
      title: "Total Employees",
      value: "247",
      icon: Users,
      trend: { value: "+12%", direction: "up" as const },
    },
    {
      title: "Active",
      value: "235",
      icon: UserCheck,
      iconColor: "text-green-600",
      iconBgColor: "bg-green-100",
    },
    {
      title: "On Leave",
      value: "8",
      icon: TrendingUp,
      iconColor: "text-orange-600",
      iconBgColor: "bg-orange-100",
    },
    {
      title: "Inactive",
      value: "4",
      icon: UserX,
      iconColor: "text-red-600",
      iconBgColor: "bg-red-100",
    },
  ];

  // Table columns configuration
  const columns = [
    {
      key: "fullName",
      label: "Employee",
      sortable: true,
      render: (_: any, row: EmployeeCardData) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            {row.fullName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-gray-900">{row.fullName}</div>
            <div className="text-xs text-gray-500">{row.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: "department",
      label: "Department",
      sortable: true,
    },
    {
      key: "designation",
      label: "Designation",
      sortable: true,
    },
    {
      key: "mobile",
      label: "Contact",
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => (
        <StatusBadge status={value.toLowerCase().replace(/\s+/g, "-")} />
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <PageHeader
        title="Employee Management"
        subtitle="Manage all employees and their information"
        icon={Users}
        breadcrumbs={[
          { label: "HR", onClick: () => {} },
          { label: "Employees" },
        ]}
        actions={[
          {
            label: "Export",
            onClick: () => {},
            icon: Download,
            variant: "outline",
          },
          {
            label: "Add New Employee",
            onClick: () => setShowAddModal(true),
            icon: UserPlus,
          },
        ]}
        tabs={[
          {
            label: "All Employees",
            value: "all",
            onClick: () => {},
            isActive: true,
          },
          {
            label: "Active",
            value: "active",
            onClick: () => {},
          },
          {
            label: "On Leave",
            value: "leave",
            onClick: () => {},
          },
        ]}
      />

      {/* Stats Grid */}
      <GridLayout columns={4} gap="md">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </GridLayout>

      {/* Filters */}
      <FilterBar
        searchPlaceholder="Search employees by name, email, or ID..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={[
          {
            key: "department",
            label: "Department",
            options: [
              { label: "Operations", value: "operations" },
              { label: "Sales & CRM", value: "sales" },
              { label: "HR & Admin", value: "hr" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { label: "Active", value: "active" },
              { label: "On Leave", value: "on-leave" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        activeFilters={filters}
        onFilterChange={(key, value) =>
          setFilters((prev) => ({ ...prev, [key]: value }))
        }
        onClearFilters={() => setFilters({})}
        actions={
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              Table
            </Button>
          </div>
        }
      />

      {/* Content */}
      <Section>
        {viewMode === "grid" ? (
          <GridLayout columns={3} gap="md">
            {mockEmployees.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                variant="detailed"
                onView={(emp) => console.log("View", emp)}
                onEdit={(emp) => console.log("Edit", emp)}
              />
            ))}
          </GridLayout>
        ) : (
          <DataTable
            data={mockEmployees}
            columns={columns}
            searchKeys={["fullName", "email", "id"]}
            actions={[
              {
                label: "View",
                onClick: (row) => console.log("View", row),
                icon: Eye,
                variant: "outline",
              },
              {
                label: "Edit",
                onClick: (row) => console.log("Edit", row),
                icon: Edit,
                variant: "outline",
              },
            ]}
          />
        )}
      </Section>

      {/* Add Employee Modal */}
      <ModalLayout
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Employee"
        subtitle="Enter employee details to create a new profile"
        size="lg"
        onSave={() => {
          console.log("Save employee");
          setShowAddModal(false);
        }}
        saveLabel="Create Employee"
      >
        <div className="space-y-6">
          <Section title="Personal Details" spacing="sm">
            <FormGrid columns={2}>
              <FormField
                label="Full Name"
                name="fullName"
                placeholder="Enter full name"
                required
              />
              <FormField
                label="Father / Spouse Name"
                name="fatherName"
                placeholder="Enter father/spouse name"
                required
              />
              <FormField
                label="Date of Birth"
                name="dob"
                type="date"
                required
              />
              <FormField
                label="Gender"
                name="gender"
                type="select"
                selectOptions={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                required
              />
              <FormField
                label="Mobile Number"
                name="mobile"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                required
              />
              <FormField
                label="Email"
                name="email"
                type="email"
                placeholder="employee@example.com"
                required
              />
            </FormGrid>
          </Section>

          <Section title="Employment Details" spacing="sm">
            <FormGrid columns={2}>
              <FormField
                label="Designation"
                name="designation"
                type="select"
                selectOptions={[
                  { label: "Car Washer", value: "car-washer" },
                  { label: "Supervisor", value: "supervisor" },
                  { label: "Manager", value: "manager" },
                ]}
                required
              />
              <FormField
                label="Department"
                name="department"
                type="select"
                selectOptions={[
                  { label: "Operations", value: "operations" },
                  { label: "Sales & CRM", value: "sales" },
                  { label: "HR & Admin", value: "hr" },
                ]}
                required
              />
              <FormField
                label="Work Location"
                name="workLocation"
                placeholder="e.g., Surat - Zone A"
                required
              />
              <FormField
                label="Date of Joining"
                name="dateOfJoining"
                type="date"
                required
              />
            </FormGrid>
          </Section>
        </div>
      </ModalLayout>
    </div>
  );
}
