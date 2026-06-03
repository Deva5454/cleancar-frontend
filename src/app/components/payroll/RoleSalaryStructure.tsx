import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Plus, Edit, Trash2, Save, X, Copy, Database } from "lucide-react";
import { toast } from "sonner";
import { useEmployeeData } from "../../hooks/useEmployeeData";
import { salaryStructureService } from "../../services/salaryStructureService";

interface SalaryComponent {
  id: string;
  name: string;
  amount: number;
  type: "earning" | "deduction";
  isPercentage: boolean;
  percentage?: number;
}

interface RoleTemplate {
  id: string;
  roleName: string;
  fixedSalary: number;
  components: SalaryComponent[];
  createdDate: string;
  lastModified: string;
}

export function RoleSalaryStructure() {
  // PHASE 2: Migrated to useEmployeeData (dual-read from EmployeeContext + HRDataContext)
  const adapter = useEmployeeData();
  const roles = adapter?.roles?.map(r => r.label) || [];

  const saved = salaryStructureService.getAll();
  const [templates, setTemplates] = useState(saved.length > 0 ? saved.map(s => ({
    id: s.id, roleName: s.roleName, fixedSalary: s.monthlyGross,
    components: [
      { id:"c1", name:"Basic Salary", amount: s.components?.basic||Math.round(s.monthlyGross*0.5), type:"earning", isPercentage:true, percentage:50 },
      { id:"c2", name:"HRA", amount: s.components?.hra||Math.round(s.monthlyGross*0.2), type:"earning", isPercentage:true, percentage:20 },
      { id:"c3", name:"Conveyance", amount: s.components?.conveyance||1600, type:"earning", isPercentage:false },
      { id:"c4", name:"PF", amount: s.components?.employeePF||Math.round(s.monthlyGross*0.12), type:"deduction", isPercentage:true, percentage:12 },
      { id:"c5", name:"Professional Tax", amount:200, type:"deduction", isPercentage:false },
    ],
    createdDate: s.createdDate||"", lastModified: s.lastUpdated||"",
  })) : []);
  const [selectedTemplate, setSelectedTemplate] = useState<RoleTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [fixedSalary, setFixedSalary] = useState(0);
  const [components, setComponents] = useState<SalaryComponent[]>([]);

  const addComponent = (type: "earning" | "deduction") => {
    const newComponent: SalaryComponent = {
      id: `c${Date.now()}`,
      name: "",
      amount: 0,
      type,
      isPercentage: false,
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (id: string, field: string, value: any) => {
    setComponents(
      components.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value };
          if (field === "isPercentage" && value === true) {
            updated.percentage = 0;
          }
          if (field === "percentage" && c.isPercentage) {
            updated.amount = (fixedSalary * value) / 100;
          }
          return updated;
        }
        return c;
      })
    );
  };

  const removeComponent = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  const saveTemplate = () => {
    if (!newRole || fixedSalary === 0) {
      toast.error("Please fill all required fields");
      return;
    }

    const template: RoleTemplate = {
      id: `t${Date.now()}`,
      roleName: newRole,
      fixedSalary,
      components,
      createdDate: new Date().toISOString().split("T")[0],
      lastModified: new Date().toISOString().split("T")[0],
    };

    setTemplates([...templates, template]);
    setShowCreateModal(false);
    resetForm();
    toast.success(`Salary structure created for ${newRole}`);
  };

  const resetForm = () => {
    setNewRole("");
    setFixedSalary(0);
    setComponents([]);
  };

  const duplicateTemplate = (template: RoleTemplate) => {
    setNewRole(`${template.roleName} (Copy)`);
    setFixedSalary(template.fixedSalary);
    setComponents(template.components.map(c => ({ ...c, id: `c${Date.now()}_${c.id}` })));
    setShowCreateModal(true);
  };

  const totalEarnings = components
    .filter((c) => c.type === "earning")
    .reduce((sum, c) => sum + c.amount, 0);

  const totalDeductions = components
    .filter((c) => c.type === "deduction")
    .reduce((sum, c) => sum + c.amount, 0);

  const netSalary = fixedSalary + totalEarnings - totalDeductions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role-Based Salary Structure</h2>
          <p className="text-sm text-gray-600 mt-1">
            Define default salary templates for each role
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role Template
        </Button>
      </div>

      {/* Engine Label */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <Database className="w-5 h-5 text-blue-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-blue-900">Data Source: payrollEngine</p>
          <p className="text-xs text-blue-700">
            Role-based configuration • Salary calculations performed by payrollEngine
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{template.roleName}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    Fixed: ₹{(template?.fixedSalary ?? 0).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {template.components.length} Components
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Earnings:</span>
                  <span className="font-medium text-green-600">
                    +₹
                    {template.components
                      .filter((c) => c.type === "earning")
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deductions:</span>
                  <span className="font-medium text-red-600">
                    -₹
                    {template.components
                      .filter((c) => c.type === "deduction")
                      .reduce((sum, c) => sum + c.amount, 0)
                      .toLocaleString()}
                  </span>
                </div>
                <div className="pt-2 border-t flex justify-between">
                  <span className="font-medium">Net Salary:</span>
                  <span className="font-bold text-blue-600">
                    ₹
                    {(
                      template.fixedSalary +
                      template.components
                        .filter((c) => c.type === "earning")
                        .reduce((sum, c) => sum + c.amount, 0) -
                      template.components
                        .filter((c) => c.type === "deduction")
                        .reduce((sum, c) => sum + c.amount, 0)
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => duplicateTemplate(template)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Last modified: {template.lastModified}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Create Salary Structure</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label>Select Role *</Label>
                  <Select value={newRole} onValueChange={setNewRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Fixed Salary (₹) *</Label>
                  <Input
                    type="number"
                    value={fixedSalary}
                    onChange={(e) => setFixedSalary(Number(e.target.value))}
                    placeholder="Enter base salary"
                  />
                </div>
              </div>

              {/* Earnings Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-green-700">Earnings Components</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addComponent("earning")}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Earning
                  </Button>
                </div>
                <div className="space-y-2">
                  {components
                    .filter((c) => c.type === "earning")
                    .map((component) => (
                      <Card key={component.id} className="border-green-100 bg-green-50/30">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-4">
                              <Label className="text-xs">Component Name</Label>
                              <Input
                                value={component.name}
                                onChange={(e) =>
                                  updateComponent(component.id, "name", e.target.value)
                                }
                                placeholder="e.g., Basic Salary"
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={component.isPercentage ? "percentage" : "fixed"}
                                onValueChange={(v) =>
                                  updateComponent(component.id, "isPercentage", v === "percentage")
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {component.isPercentage && (
                              <div className="col-span-2">
                                <Label className="text-xs">Percentage (%)</Label>
                                <Input
                                  type="number"
                                  value={component.percentage || 0}
                                  onChange={(e) =>
                                    updateComponent(component.id, "percentage", Number(e.target.value))
                                  }
                                  className="h-8"
                                />
                              </div>
                            )}
                            <div className="col-span-3">
                              <Label className="text-xs">Amount (₹)</Label>
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) =>
                                  updateComponent(component.id, "amount", Number(e.target.value))
                                }
                                disabled={component.isPercentage}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComponent(component.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Deductions Section */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-red-700">Deduction Components</h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addComponent("deduction")}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Deduction
                  </Button>
                </div>
                <div className="space-y-2">
                  {components
                    .filter((c) => c.type === "deduction")
                    .map((component) => (
                      <Card key={component.id} className="border-red-100 bg-red-50/30">
                        <CardContent className="p-3">
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-4">
                              <Label className="text-xs">Component Name</Label>
                              <Input
                                value={component.name}
                                onChange={(e) =>
                                  updateComponent(component.id, "name", e.target.value)
                                }
                                placeholder="e.g., PF"
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-2">
                              <Label className="text-xs">Type</Label>
                              <Select
                                value={component.isPercentage ? "percentage" : "fixed"}
                                onValueChange={(v) =>
                                  updateComponent(component.id, "isPercentage", v === "percentage")
                                }
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">Fixed</SelectItem>
                                  <SelectItem value="percentage">Percentage</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {component.isPercentage && (
                              <div className="col-span-2">
                                <Label className="text-xs">Percentage (%)</Label>
                                <Input
                                  type="number"
                                  value={component.percentage || 0}
                                  onChange={(e) =>
                                    updateComponent(component.id, "percentage", Number(e.target.value))
                                  }
                                  className="h-8"
                                />
                              </div>
                            )}
                            <div className="col-span-3">
                              <Label className="text-xs">Amount (₹)</Label>
                              <Input
                                type="number"
                                value={component.amount}
                                onChange={(e) =>
                                  updateComponent(component.id, "amount", Number(e.target.value))
                                }
                                disabled={component.isPercentage}
                                className="h-8"
                              />
                            </div>
                            <div className="col-span-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeComponent(component.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Fixed Salary</p>
                      <p className="text-xl font-bold text-gray-900">
                        ₹{fixedSalary.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Earnings</p>
                      <p className="text-xl font-bold text-green-600">
                        +₹{totalEarnings.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Deductions</p>
                      <p className="text-xl font-bold text-red-600">
                        -₹{totalDeductions.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Salary</p>
                      <p className="text-xl font-bold text-blue-600">
                        ₹{netSalary.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveTemplate} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">{selectedTemplate.roleName}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <Card className="bg-gray-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-gray-600">Fixed Salary</p>
                    <p className="text-2xl font-bold">₹{(selectedTemplate?.fixedSalary ?? 0).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-green-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-green-700">Earnings</p>
                    <p className="text-2xl font-bold text-green-600">
                      +₹{selectedTemplate.components
                        .filter(c => c.type === "earning")
                        .reduce((sum, c) => sum + c.amount, 0)
                        .toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-red-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm text-red-700">Deductions</p>
                    <p className="text-2xl font-bold text-red-600">
                      -₹{selectedTemplate.components
                        .filter(c => c.type === "deduction")
                        .reduce((sum, c) => sum + c.amount, 0)
                        .toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold text-green-700">Earnings</h4>
                {selectedTemplate.components.filter(c => c.type === "earning").map(comp => (
                  <div key={comp.id} className="flex justify-between items-center p-3 bg-green-50 rounded">
                    <span>{comp.name}</span>
                    <span className="font-semibold">
                      ₹{(comp?.amount ?? 0).toLocaleString()}
                      {comp.isPercentage && <span className="text-xs text-gray-500 ml-2">({comp.percentage}%)</span>}
                    </span>
                  </div>
                ))}

                <h4 className="font-semibold text-red-700 mt-4">Deductions</h4>
                {selectedTemplate.components.filter(c => c.type === "deduction").map(comp => (
                  <div key={comp.id} className="flex justify-between items-center p-3 bg-red-50 rounded">
                    <span>{comp.name}</span>
                    <span className="font-semibold">
                      ₹{(comp?.amount ?? 0).toLocaleString()}
                      {comp.isPercentage && <span className="text-xs text-gray-500 ml-2">({comp.percentage}%)</span>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
