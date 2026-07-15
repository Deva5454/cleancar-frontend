with open('src/app/components/subscription/RescheduleTab.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix getJobsForVehicleAndPhone to also match by phone alone when reg doesnt match
old = """function getJobsForVehicleAndPhone(phone: string, vehicleReg: string): UpcomingJob[] {
  const cleanReg = vehicleReg.replace(/\\s/g, "").toUpperCase();
  const cleanPhone = phone.replace(/\\D/g, "").slice(-10);
  const today = new Date().toISOString().split("T")[0];
  try {
    const localJobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
    const dsJobs = DataService.get<any>("JOBS") || [];
    const all = [...localJobs, ...dsJobs].filter((j: any) => {
      const reg = (j.vehicleDetails?.registration || j.vehicleReg || "").replace(/\\s/g,"").toUpperCase();
      const p = (j.customerPhone || "").replace(/\\D/g,"").slice(-10);
      return reg === cleanReg && (p === cleanPhone || !p) && (j.scheduledDate || "") >= today && !["Completed","Cancelled"].includes(j.status);
    });"""

new = """function getJobsForVehicleAndPhone(phone: string, vehicleReg: string): UpcomingJob[] {
  const cleanReg = vehicleReg.replace(/\\s/g, "").toUpperCase();
  const cleanPhone = phone.replace(/\\D/g, "").slice(-10);
  const today = new Date().toISOString().split("T")[0];
  try {
    const localJobs = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
    const dsJobs = DataService.get<any>("JOBS") || [];
    const all = [...localJobs, ...dsJobs].filter((j: any) => {
      const reg = (j.vehicleDetails?.registration || j.vehicleReg || "").replace(/\\s/g,"").toUpperCase();
      const p = (j.customerPhone || "").replace(/\\D/g,"").slice(-10);
      const regMatch = reg === cleanReg;
      const phoneMatch = p === cleanPhone;
      // Match by reg+phone, or phone alone if reg not provided, or reg alone if phone matches
      return (regMatch || phoneMatch) && (regMatch || phoneMatch) && (j.scheduledDate || "") >= today && !["Completed","Cancelled"].includes(j.status);
    });"""

if old in c:
    c = c.replace(old, new)
    print("Job lookup fixed")
else:
    print("Pattern not found, trying simpler fix...")
    # Simpler: just match by phone OR vehicle
    old2 = 'return reg === cleanReg && (p === cleanPhone || !p) && (j.scheduledDate || "") >= today && !["Completed","Cancelled"].includes(j.status);'
    new2 = 'return (reg === cleanReg || p === cleanPhone) && (j.scheduledDate || "") >= today && !["Completed","Cancelled"].includes(j.status);'
    if old2 in c:
        c = c.replace(old2, new2)
        print("Simple lookup fix applied")
    else:
        idx = c.find("cleanReg")
        print("cleanReg context:", repr(c[idx:idx+200]))

with open('src/app/components/subscription/RescheduleTab.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
print("Done")
