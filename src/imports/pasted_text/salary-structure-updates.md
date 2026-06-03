Open src/app/services/salaryStructureService.ts.
Step 1 — Add three new fields to the SalaryStructure interface.
Find:
ts  createdBy: string;
  createdDate: string;
  lastUpdated: string;
Replace with:
ts  createdBy: string;
  createdDate: string;        // ISO date — auto-set on creation
  validFrom: string;          // YYYY-MM-DD — structure is active from this date
  validTill: string;          // YYYY-MM-DD — structure auto-expires after this date
  isActive: boolean;          // manually toggled; also auto-set false when validTill passes
  lastUpdated: string;
Step 2 — Update the add() method to accept the new fields.
Find:
ts  add(structure: Omit<SalaryStructure, 'id' | 'createdDate'>): SalaryStructure {
    const newStructure: SalaryStructure = {
      ...structure,
      id: `SS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdDate: new Date().toISOString().split('T')[0],
    };
Replace with:
ts  add(structure: Omit<SalaryStructure, 'id' | 'createdDate'>): SalaryStructure {
    const today = new Date().toISOString().split('T')[0];
    const newStructure: SalaryStructure = {
      ...structure,
      id: `SS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdDate: today,
      validFrom: structure.validFrom || today,
      validTill: structure.validTill || '',
      isActive: structure.isActive ?? true,
    };
Step 3 — Update getAll() to auto-expire structures past validTill.
Find:
ts  getAll(): SalaryStructure[] {
    return [...this.structures];
  }
Replace with:
ts  getAll(): SalaryStructure[] {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;
    this.structures = this.structures.map(s => {
      if (s.validTill && s.validTill < today && s.isActive) {
        changed = true;
        return { ...s, isActive: false, lastUpdated: today };
      }
      return s;
    });
    if (changed) this.saveToStorage();
    return [...this.structures];
  }

Now open src/app/components/payroll/CreateSalaryStructure.tsx.
Step 4 — Add state variables for the two new date fields.
Find the existing state declarations near line 66. After const [editingNameValue, setEditingNameValue] add:
tsconst [validFrom, setValidFrom] = useState<string>(new Date().toISOString().split('T')[0]);
const [validTill, setValidTill] = useState<string>('');
Step 5 — Add the two date fields to the Create Structure form.
Find the Structure Name input field inside the Create Structure tab. It is inside the Configuration Panel card. After the structure name input block, add:
tsx{/* Valid From */}
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-700">
    Valid From <span className="text-red-500">*</span>
  </Label>
  <input
    type="date"
    value={validFrom}
    onChange={e => setValidFrom(e.target.value)}
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
  />
  <p className="text-xs text-gray-500">Structure becomes active from this date</p>
</div>

{/* Valid Till */}
<div className="space-y-2">
  <Label className="text-sm font-medium text-gray-700">
    Valid Till
    <span className="ml-2 text-xs text-gray-400 font-normal">(leave blank = no expiry)</span>
  </Label>
  <input
    type="date"
    value={validTill}
    min={validFrom}
    onChange={e => setValidTill(e.target.value)}
    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
  />
  {validTill && (
    <p className="text-xs text-amber-600 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      Structure will auto-deactivate after {new Date(validTill).toLocaleDateString('en-IN')}
    </p>
  )}
</div>
Step 6 — Pass the new fields in handleSave.
Find the salaryStructureService.add({ call inside handleSave (line ~494). Add the three new fields to the object being passed:
ts    const saved = salaryStructureService.add({
      roleId: selectedRole,
      roleName: role.name,
      structureName: structureName.trim(),
      monthlyGross: components.monthlyGross,
      basicSalary: parseFloat(basicSalary),
      shiftType: shiftType as "full_time" | "part_time",
      components,
      isMetro,
      applyPFCap,
      createdBy: "Priya Mehta",
      validFrom,                                            // ← ADD
      validTill,                                            // ← ADD
      isActive: true,                                       // ← ADD
      lastUpdated: new Date().toISOString().split('T')[0],
    });
Also reset the date fields after save — add to the reset block:
ts    setValidFrom(new Date().toISOString().split('T')[0]);
    setValidTill('');
Step 7 — Add three new column headers to the Saved Structures table.
Find line 1527–1529:
tsx                    <TableHead>PF Cap</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
Replace with:
tsx                    <TableHead>PF Cap</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Valid From</TableHead>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
Step 8 — Add the new data cells in each table row.
Find the existing Last Updated table cell (line ~1604):
tsx                        <TableCell className="text-sm text-gray-500">
                          {new Date(structure.lastUpdated).toLocaleDateString("en-IN")}
                        </TableCell>
                        <TableCell className="text-right">
Replace with:
tsx                        {/* Created Date */}
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {structure.createdDate
                            ? new Date(structure.createdDate).toLocaleDateString('en-IN')
                            : '—'}
                        </TableCell>

                        {/* Valid From */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {structure.validFrom
                            ? new Date(structure.validFrom).toLocaleDateString('en-IN')
                            : '—'}
                        </TableCell>

                        {/* Valid Till */}
                        <TableCell className="text-sm whitespace-nowrap">
                          {structure.validTill ? (
                            <span className={
                              new Date(structure.validTill) < new Date()
                                ? 'text-red-600 font-medium'
                                : new Date(structure.validTill) <= new Date(Date.now() + 7 * 86400000)
                                ? 'text-amber-600 font-medium'
                                : 'text-gray-700'
                            }>
                              {new Date(structure.validTill).toLocaleDateString('en-IN')}
                              {new Date(structure.validTill) < new Date() && (
                                <span className="ml-1 text-xs bg-red-100 text-red-700 px-1 rounded">Expired</span>
                              )}
                              {new Date(structure.validTill) > new Date() &&
                               new Date(structure.validTill) <= new Date(Date.now() + 7 * 86400000) && (
                                <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1 rounded">Expiring soon</span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-xs">No expiry</span>
                          )}
                        </TableCell>

                        {/* Status Toggle */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleActive(structure.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                                structure.isActive ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                              title={structure.isActive ? 'Active — click to deactivate' : 'Inactive — click to activate'}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                                structure.isActive ? 'translate-x-5' : 'translate-x-0.5'
                              }`} />
                            </button>
                            <span className={`text-xs font-medium ${structure.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                              {structure.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>

                        {/* Last Updated */}
                        <TableCell className="text-sm text-gray-500 whitespace-nowrap">
                          {new Date(structure.lastUpdated).toLocaleDateString('en-IN')}
                        </TableCell>

                        <TableCell className="text-right">
Step 9 — Update handleDownloadAll to include the new columns.
Find the headers array inside handleDownloadAll and add "Created Date", "Valid From", "Valid Till" after "PF Cap". Then in the rows mapping add:
ts    s.components.totalCTC,
    s.components.annualCTC,
    s.createdDate || '',             // ← ADD
    s.validFrom || '',               // ← ADD
    s.validTill || 'No expiry',      // ← ADD
    s.isActive ? 'Active' : 'Inactive',
    new Date(s.lastUpdated).toLocaleDateString('en-IN'),
Step 10 — Update handleUploadExcel to read the new columns.
Inside the CSV parsing loop in handleUploadExcel, after the existing field reads, add:
ts        const validFrom = row["Valid From"] || row["validFrom"] || today;
        const validTill = row["Valid Till"] || row["validTill"] || '';
And pass them into salaryStructureService.add(...):
ts          validFrom,
          validTill,
          isActive: true,