import { useNavigate } from "react-router-dom";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Plus, Edit, Trash2, Download, X, Check, Shield, Activity, MapPin, ShieldCheck } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useEmployee } from "../../contexts/EmployeeContext";
import { useHRData } from "../../contexts/HRDataContext";
import { useCity } from "../../contexts/CityContext";
import { useRole } from "../../contexts/RoleContext";
import { useCustomRoles } from "../../contexts/CustomRoleContext";
import { EmployeePermissionOverridePanel } from "../admin/EmployeePermissionOverridePanel";

// Import Design System Components
import {
  PageHeader,
  StatusBadge,
  StatCard,
  DataTable,
  EmptyState,
  LoadingState,
  FormField,
  SuccessState,
} from "../../design-system/components";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  city: string;
  phone: string;
  status: string;
};

export function UserManagement() {
  const navigate = useNavigate();
  const { employees } = useEmployee();
  const { addEmployee, updateEmployee, deleteEmployee } = useHRData();
  const { currentRole } = useRole();
  const { city, cityInfo } = useCity();
  const { customRoles } = useCustomRoles();

  const roles = [
    { id: "1", name: "Super Admin", description: "Full system access" },
    { id: "2", name: "Admin", description: "Administrative access" },
    { id: "3", name: "City Manager", description: "City-level management" },
    { id: "4", name: "Cluster Manager", description: "Cluster management" },
    { id: "5", name: "Sr Operations Manager", description: "Senior operations management" },
    { id: "6", name: "Operations Manager", description: "Operations management" },
    { id: "7", name: "Supervisor", description: "Team supervision" },
    { id: "8", name: "Car Washer", description: "Car washing operations" },
    { id: "9", name: "TSM", description: "Tele Sales Manager" },
    { id: "10", name: "TSE", description: "Tele Sales Executive" },
    { id: "11", name: "CCE", description: "Customer Care Executive" },
    { id: "12", name: "HR", description: "Human Resources" },
    { id: "13", name: "Accounts", description: "Accounts and Finance" },
    { id: "14", name: "Store Manager", description: "Store management" },
    { id: "15", name: "Procurement Manager", description: "Procurement management" },
    { id: "16", name: "Marketing Agency", description: "Marketing operations" },
  ];

  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<any>(null);

  // Map employees to User shape
  const users: User[] = useMemo(() => employees.map(emp => ({
    id: emp.employeeId,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email || "",
    role: emp.role || "",
    city: emp.city || "",
    phone: emp.phone || "",
    status: emp.status || "Active",
  })), [employees]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Car Washer",
    city: cityInfo.displayName,
    phone: "",
    status: "Active"
  });

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create/edit user
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (editingUser) {
        // Update existing employee
        const employee = employees.find(emp => emp.employeeId === editingUser.id);
        if (employee) {
          const nameParts = formData.name.split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          updateEmployee(editingUser.id, {
            firstName,
            lastName,
            email: formData.email,
            role: formData.role as any,
            city: formData.city,
            phone: formData.phone,
            status: formData.status as any,
          });
        }
        setSuccessMessage(`User "${formData.name}" updated successfully!`);
      } else {
        // Create new employee
        const nameParts = formData.name.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        addEmployee({
          firstName,
          lastName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role as any,
          department: formData.role === "Car Washer" ? "Operations" : "Admin",
          city: formData.city,
          joiningDate: new Date().toISOString().split('T')[0],
          status: formData.status as any,
        });
        setSuccessMessage(`User "${formData.name}" created successfully!`);
      }

      // Reset form
      setIsLoading(false);
      setShowCreateModal(false);
      setEditingUser(null);
      setShowSuccess(true);
      setFormData({
        name: "",
        email: "",
        role: "Car Washer",
        city: cityInfo.displayName,
        phone: "",
        status: "Active"
      });
    }, 1000);
  };

  // Handle edit
  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.city,
      phone: user.phone,
      status: user.status
    });
    setShowCreateModal(true);
  };

  // Handle delete
  const handleDelete = (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteEmployee(userId);
      setSuccessMessage("User deleted successfully!");
      setShowSuccess(true);
    }
  };

  // Handle export
  const handleExport = () => {
    const csvContent = [
      ["ID", "Name", "Email", "Role", "City", "Phone", "Status"],
      ...users.map(u => [u.id, u.name, u.email, u.role, u.city, u.phone, u.status])
    ].map(row => row.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    setSuccessMessage("Users exported successfully!");
    setShowSuccess(true);
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="space-y-6">
        <SuccessState
          title={successMessage}
          primaryAction={{
            label: "Continue",
            onClick: () => setShowSuccess(false),
          }}
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <LoadingState message="Processing..." inCard />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="User & Access Control"
        description="Manage users, roles, and permissions"
        primaryAction={{
          label: "Create User",
          onClick: () => setShowCreateModal(true),
          icon: <Plus className="w-4 h-4 mr-2" />,
        }}
        secondaryAction={{
          label: "Export",
          onClick: handleExport,
          icon: <Download className="w-4 h-4 mr-2" />,
        }}
        breadcrumbs={[
          { label: "Dashboard", onClick: () => navigate("/") },
          { label: "User Management" },
        ]}
      />

      {/* Create/Edit User Modal */}
      {showCreateModal && (
        <Card className="border-2 border-blue-300 shadow-lg">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingUser ? "Edit User" : "Create New User"}
              </CardTitle>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingUser(null);
                  setFormData({
                    name: "",
                    email: "",
                    role: "Car Washer",
                    city: cityInfo.displayName,
                    phone: "",
                    status: "Active"
                  });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="Full Name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
                
                <FormField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="user@example.com"
                  required
                />
                
                <FormField
                  label="Role"
                  name="role"
                  type="select"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  options={roles.map(role => ({ value: role.name, label: role.name }))}
                  required
                />
                
                <FormField
                  label="City"
                  name="city"
                  type="select"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  options={[
                    { value: cityInfo.displayName, label: cityInfo.displayName },
                    { value: "Ahmedabad", label: "Ahmedabad" },
                    { value: "Vadodara", label: "Vadodara" },
                    { value: "Rajkot", label: "Rajkot" },
                  ]}
                  required
                />
                
                <FormField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98XXX XXXXX"
                  required
                />
                
                <FormField
                  label="Status"
                  name="status"
                  type="select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: "Active", label: "Active" },
                    { value: "Inactive", label: "Inactive" },
                    { value: "On Leave", label: "On Leave" },
                  ]}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Check className="w-4 h-4 mr-2" />
                  {editingUser ? "Update User" : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards - Using Design System */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={users.length.toString()}
          icon={Shield}
          variant="default"
          change={{ value: "+12%", type: "increase" }}
        />
        <StatCard
          label="Active Today"
          value={users.filter(u => u.status === "Active").length.toString()}
          icon={Activity}
          variant="success"
        />
        <StatCard
          label="Roles Defined"
          value={roles.length.toString()}
          icon={Shield}
          variant="info"
        />
        <StatCard
          label="Cities Mapped"
          value="8"
          icon={MapPin}
          variant="warning"
        />
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User List ({users.length})</TabsTrigger>
          <TabsTrigger value="roles">Role Mapping</TabsTrigger>
          <TabsTrigger value="activity">Login Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* User Table - Using Design System DataTable */}
          {filteredUsers.length === 0 ? (
            <EmptyState
              title="No users found"
              description={searchTerm ? "Try adjusting your search criteria" : "Start by creating your first user"}
              type={searchTerm ? "search" : "default"}
              actionText={!searchTerm ? "Create User" : undefined}
              onAction={!searchTerm ? () => setShowCreateModal(true) : undefined}
            />
          ) : (
            <DataTable
              data={filteredUsers}
              columns={[
                { key: "id", label: "ID", sortable: true },
                { key: "name", label: "Name", sortable: true },
                { key: "email", label: "Email", sortable: true },
                {
                  key: "role",
                  label: "Role",
                  sortable: true,
                  render: (role, user) => {
                    const employee = employees.find(e => e.employeeId === user.id);
                    const subRole = employee?.subRoleId
                      ? customRoles.find(r => r.customRoleId === employee.subRoleId)
                      : null;

                    return (
                      <div className="flex flex-col gap-1">
                        <span>{role}</span>
                        {subRole && (
                          <Badge variant="outline" className="text-xs text-purple-600 border-purple-300 w-fit">
                            {subRole.name}
                          </Badge>
                        )}
                      </div>
                    );
                  }
                },
                { key: "city", label: "City", sortable: true },
                { key: "phone", label: "Phone" },
                {
                  key: "status",
                  label: "Status",
                  align: "center",
                  render: (status) => <StatusBadge status={status} />,
                },
                {
                  key: "actions",
                  label: "Actions",
                  align: "center",
                  render: (_, user) => {
                    const employee = employees.find(e => e.employeeId === user.id);

                    return (
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {currentRole === "Super Admin" && employee && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPermissionTarget(employee)}
                            title="Manage Permissions"
                          >
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  },
                },
              ]}
              searchable
              searchPlaceholder="Search users by name, email, or role..."
              paginated
              pageSize={10}
            />
          )}
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardContent className="p-6">
              <DataTable
                data={roles.map(role => ({
                  id: role.id,
                  name: role.name,
                  description: role.description || "No description",
                  users: users.filter(u => u.role === role.name).length,
                  status: "Active",
                }))}
                columns={[
                  { key: "name", label: "Role Name", sortable: true },
                  { key: "description", label: "Description" },
                  { key: "users", label: "Users", align: "center" },
                  {
                    key: "status",
                    label: "Status",
                    align: "center",
                    render: (status) => <StatusBadge status={status} />,
                  },
                ]}
                searchable
                searchPlaceholder="Search roles..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <EmptyState
            title="Login Activity"
            description="Login activity tracking will be available in the next release"
            type="default"
          />
        </TabsContent>
      </Tabs>

      {/* Employee Permission Override Panel */}
      {permissionTarget && (
        <EmployeePermissionOverridePanel
          employeeId={permissionTarget.id}
          employeeName={permissionTarget.name}
          currentRole={permissionTarget.role}
          onClose={() => setPermissionTarget(null)}
        />
      )}
    </div>
  );
}
