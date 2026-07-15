"""
fix_bookings_card_v2.py — Fix Upcoming Bookings card layout (no regex)
Uses direct string replacement, not re.sub
"""
import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\supervisor\SupervisorPeriodicScheduleScreen.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_{ts}")

with open(FILE, "r", encoding="utf-8") as fh:
    content = fh.read()

OLD = '''              <Card key={job.jobId} className="border-2 border-indigo-100">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.customerName}</p>
                      <p className="text-xs text-gray-500">{job.packageName || job.packageType}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      job.status === "Unassigned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      job.status === "Assigned"   ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(job.scheduledDate)}
                      {job.timeSlot && job.timeSlot !== "TBD" ? " at " + job.timeSlot : ""}
                    </span>
                    {job.vehicleDetails?.registration && (
                      <span>Vehicle: {job.vehicleDetails.registration}</span>
                    )}
                    {job.washerDisplayName && (
                      <span className="text-blue-600">Washer: {job.washerDisplayName}</span>
                    )}
                    {job.customerPhone && (
                      <a href={`tel:${job.customerPhone}`} className="text-indigo-600 underline">{job.customerPhone}</a>
                    )}
                    {job.location?.area && (
                      <span>Area: {job.location.area}</span>
                    )}
                  </div>
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      Washer not yet assigned \u2014 go to Dashboard to assign
                    </p>
                  )}
                </CardContent>
              </Card>'''

NEW = '''              <Card key={job.jobId} className="border-2 border-indigo-100">
                <CardContent className="p-3">
                  {/* Row 1: Customer name + status badge */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{job.customerName}</p>
                      <p className="text-xs font-medium text-indigo-600">{job.packageName || job.packageType}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                      job.status === "Unassigned" ? "bg-amber-50 text-amber-700 border-amber-200" :
                      job.status === "Assigned"   ? "bg-blue-50 text-blue-700 border-blue-200" :
                      "bg-green-50 text-green-700 border-green-200"
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  {/* Row 2: Date + time prominently */}
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 mb-2">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-gray-900">
                        {formatDate(job.scheduledDate)}
                        {job.timeSlot && job.timeSlot !== "TBD" ? ` at ${job.timeSlot}` : ""}
                      </p>
                      {job.location?.area && job.location.area.length > 2 && (
                        <p className="text-xs text-gray-500">{job.location.area}</p>
                      )}
                    </div>
                  </div>
                  {/* Row 3: Vehicle + washer + phone */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {job.vehicleDetails?.registration && job.vehicleDetails.registration.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {job.vehicleDetails.registration}
                      </span>
                    )}
                    {job.washerDisplayName && (
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        Washer: {job.washerDisplayName}
                      </span>
                    )}
                    {job.customerPhone && String(job.customerPhone).replace(/[^0-9]/g, "").length >= 10 && (
                      <a href={`tel:${job.customerPhone}`}
                         className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded underline">
                        {job.customerPhone}
                      </a>
                    )}
                  </div>
                  {/* Row 4: Unassigned warning */}
                  {job.status === "Unassigned" && (
                    <p className="text-xs text-amber-600 font-medium mt-2 pt-2 border-t border-gray-100">
                      No washer assigned yet \u2014 go to Dashboard to assign
                    </p>
                  )}
                </CardContent>
              </Card>'''

if OLD in content:
    content = content.replace(OLD, NEW, 1)
    with open(FILE, "w", encoding="utf-8", newline="") as fh:
        fh.write(content)
    print("FIXED")
else:
    print("NO MATCH — showing current card area:")
    idx = content.find('key={job.jobId}')
    if idx >= 0:
        print(repr(content[idx:idx+300]))
    else:
        print("key={job.jobId} not found at all")
