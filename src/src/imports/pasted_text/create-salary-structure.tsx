Open src/app/components/payroll/CreateSalaryStructure.tsx.
Step 1 — Add isActive field to the SalaryStructure interface in the service.
Open src/app/services/salaryStructureService.ts. Find the SalaryStructure interface and add one field after lastUpdated:
tslastUpdated: string;
isActive: boolean;  // ← ADD THIS
Then find the add() method inside SalaryStructureStore. After the existing spread, ensure isActive defaults to true for all new structures:
tsadd(structure: Omit<SalaryStructure, 'id' | 'createdDate'>): SalaryStructure {
  const newStructure: SalaryStructure = {
    ...structure,
    id: crypto.randomUUID(),
    createdDate: new Date().toISOString(),
    isActive: structure.isActive ?? true,  // ← default true
  };

Step 2 — Add new state variables in CreateSalaryStructure.tsx.
Find the existing state declarations (around line 66). Add these three after the savedStructures state:
tsconst [searchQuery, setSearchQuery] = useState<string>("");
const [uploadRef] = useState(() => ({ current: null as HTMLInputElement | null }));
const [isUploading, setIsUploading] = useState(false);

Step 3 — Add the handleToggleActive function.
Find the existing handleDelete function. Add this new function immediately after it:
tsconst handleToggleActive = (id: string) => {
  const structure = savedStructures.find(s => s.id === id);
  if (!structure) return;
  const updated = salaryStructureService.update(id, { isActive: !structure.isActive });
  if (updated) {
    setSavedStructures(salaryStructureService.getAll());
    toast.success(
      structure.isActive
        ? `"${structure.structureName || 'Structure'}" set to Inactive`
        : `"${structure.structureName || 'Structure'}" set to Active`
    );
  }
};

Step 4 — Add the handleUploadExcel function.
Add this function after handleToggleActive:
tsconst handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  setIsUploading(true);
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("File must have a header row and at least one data row");
        setIsUploading(false);
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      let imported = 0;
      let skipped = 0;

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => { row[h] = values[idx] || "0"; });

        const structureName = row["Structure Name"] || row["structureName"];
        const roleName = row["Role"] || row["roleName"];
        const basicSalary = parseFloat(row["Basic Salary"] || row["basic"] || "0");
        const monthlyGross = parseFloat(row["Monthly Gross"] || row["monthlyGross"] || "0");

        if (!structureName || !roleName || !monthlyGross) {
          skipped++;
          continue;
        }

        const components: SalaryComponents = {
          monthlyGross,
          annualCTC: parseFloat(row["Annual CTC"] || row["annualCTC"] || "0") || monthlyGross * 12,
          basic: basicSalary,
          hra: parseFloat(row["HRA"] || row["hra"] || "0"),
          conveyance: parseFloat(row["Conveyance"] || row["conveyance"] || "1600"),
          medical: parseFloat(row["Medical"] || row["medical"] || "1250"),
          specialAllowance: parseFloat(row["Special Allowance"] || row["specialAllowance"] || "0"),
          employeePF: parseFloat(row["Employee PF"] || row["employeePF"] || "0"),
          employerPF: parseFloat(row["Employer PF"] || row["employerPF"] || "0"),
          employeeESIC: parseFloat(row["Employee ESIC"] || row["employeeESIC"] || "0"),
          employerESIC: parseFloat(row["Employer ESIC"] || row["employerESIC"] || "0"),
          professionalTax: parseFloat(row["Professional Tax"] || row["professionalTax"] || "200"),
          totalDeductions: parseFloat(row["Total Deductions"] || row["totalDeductions"] || "0"),
          netTakeHome: parseFloat(row["Net Take Home"] || row["netTakeHome"] || "0"),
          totalEmployerCost: parseFloat(row["Total Employer Cost"] || row["totalEmployerCost"] || "0"),
          totalCTC: parseFloat(row["Total CTC"] || row["totalCTC"] || "0") || monthlyGross * 12,
        };

        salaryStructureService.add({
          roleId: `ROLE-${roleName.toUpperCase().replace(/\s/g, "-")}`,
          roleName,
          structureName,
          monthlyGross,
          basicSalary,
          shiftType: (row["Shift Type"] || "full_time") as "full_time" | "part_time",
          components,
          isMetro: (row["Location"] || "Metro").toLowerCase().includes("metro"),
          applyPFCap: (row["PF Cap"] || "Yes").toLowerCase() !== "no",
          createdBy: "Bulk Upload",
          lastUpdated: new Date().toISOString(),
          isActive: true,
        });
        imported++;
      }

      setSavedStructures(salaryStructureService.getAll());
      toast.success(`Imported ${imported} structures${skipped > 0 ? `, skipped ${skipped} invalid rows` : ""}`);
    } catch (err) {
      toast.error("Failed to parse file. Please use the correct CSV format.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };
  reader.readAsText(file);
};

Step 5 — Add the handleDownloadAll function.
Add immediately after handleUploadExcel:
tsconst handleDownloadAll = () => {
  if (savedStructures.length === 0) {
    toast.error("No structures saved to download");
    return;
  }
  const headers = [
    "Structure Name", "Role", "Shift Type", "Location", "PF Cap",
    "Basic Salary", "Monthly Gross", "HRA", "Conveyance", "Medical",
    "Special Allowance", "Employee PF", "Employer PF", "Employee ESIC",
    "Employer ESIC", "Professional Tax", "Total Deductions",
    "Net Take Home", "Total CTC", "Annual CTC", "Status", "Last Updated"
  ];
  const rows = savedStructures.map(s => [
    s.structureName || "Unnamed",
    s.roleName,
    s.shiftType === "part_time" ? "Part-Time" : "Full-Time",
    s.isMetro ? "Metro" : "Non-Metro",
    s.applyPFCap ? "Yes" : "No",
    s.basicSalary ?? s.components.basic,
    s.monthlyGross,
    s.components.hra,
    s.components.conveyance,
    s.components.medical,
    s.components.specialAllowance,
    s.components.employeePF,
    s.components.employerPF,
    s.components.employeeESIC,
    s.components.employerESIC,
    s.components.professionalTax,
    s.components.totalDeductions,
    s.components.netTakeHome,
    s.components.totalCTC,
    s.components.annualCTC,
    s.isActive ? "Active" : "Inactive",
    new Date(s.lastUpdated).toLocaleDateString("en-IN"),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Salary_Structures_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${savedStructures.length} salary structures`);
};

Step 6 — Add the filtered structures computed variable.
Find the line {savedStructures.map((structure) => { (around line 1533). Just above it, add:
tsconst filteredStructures = savedStructures.filter(s => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return (
    (s.structureName || "").toLowerCase().includes(q) ||
    s.roleName.toLowerCase().includes(q)
  );
});
Then change {savedStructures.map((structure) => { to {filteredStructures.map((structure) => {

Step 7 — Update the Saved Structures tab header.
Find the <CardHeader> inside the {/* SAVED STRUCTURES TAB */} section (line ~1518):
tsx<CardHeader>
  <CardTitle>Saved Salary Structures</CardTitle>
</CardHeader>
Replace with:
tsx<CardHeader>
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <CardTitle>Saved Salary Structures ({savedStructures.length})</CardTitle>
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <input
        type="text"
        placeholder="Search by name or role..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-purple-400"
      />
      {/* Upload CSV */}
      <label className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
        <Plus className="w-4 h-4" />
        {isUploading ? "Uploading..." : "Upload CSV"}
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleUploadExcel}
          disabled={isUploading}
        />
      </label>
      {/* Download All */}
      <Button
        size="sm"
        variant="outline"
        onClick={handleDownloadAll}
        className="flex items-center gap-2"
      >
        <Download className="w-4 h-4" />
        Download All
      </Button>
    </div>
  </div>
</CardHeader>

Step 8 — Add Status column header.
Find the <TableHead className="text-right">Actions</TableHead> line. Add a new column before it:
tsx<TableHead>Status</TableHead>
<TableHead className="text-right">Actions</TableHead>

Step 9 — Add Status toggle cell and fix active/inactive search.
In each table row, find the closing </TableCell> of the last data column (PF Cap) and add a new cell for the status toggle before the Actions cell:
tsx{/* Status Toggle */}
<TableCell>
  <button
    onClick={() => handleToggleActive(structure.id)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
      structure.isActive !== false ? "bg-green-500" : "bg-gray-300"
    }`}
    title={structure.isActive !== false ? "Active — click to deactivate" : "Inactive — click to activate"}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
        structure.isActive !== false ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
  <span className={`ml-2 text-xs font-medium ${structure.isActive !== false ? "text-green-600" : "text-gray-400"}`}>
    {structure.isActive !== false ? "Active" : "Inactive"}
  </span>
</TableCell>

Step 10 — Add imports.
At the top of CreateSalaryStructure.tsx, confirm Download and Plus are imported from lucide-react. The existing import line already has Plus and various icons — check if Download is present. If not, add it:
tsimport { Save, Trash2, Eye, Edit, AlertCircle, Calculator, FileText, Settings, Plus, X, Database, Award, Download } from "lucide-react";

