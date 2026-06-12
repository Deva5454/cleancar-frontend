/**
 * DataCapture.tsx
 * Field data entry for supervisors — cash collections, wash counts, attendance
 * Route: /operations/data-capture
 */
import { useState } from "react";
import { toast } from "sonner";
import { useRole } from "../../contexts/RoleContext";
import { useCity } from "../../contexts/CityContext";
import { BackButton } from "../ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DollarSign, Users, CheckCircle, Clock, AlertCircle, Plus, Save } from "lucide-react";

const CAPTURE_KEY = "FIELD_DATA_CAPTURES";

function loadCaptures() {
  try { return JSON.parse(localStorage.getItem(CAPTURE_KEY) || "[]"); } catch { return []; }
}

export function DataCapture() {
  const { currentUser } = useRole() as any;
  const { city } = useCity() as any;
  const [captures, setCaptures] = useState<any[]>(loadCaptures);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "CASH_COLLECTION",
    amount: "",
    washerName: "",
    washCount: "",
    notes: "",
    pincode: "",
  });

  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const todayKey = new Date().toISOString().split("T")[0];
  const todayCaptures = captures.filter(c => c.date === todayKey);

  const totalCash = todayCaptures.filter(c => c.type === "CASH_COLLECTION").reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
  const totalWashes = todayCaptures.filter(c => c.type === "WASH_COUNT").reduce((s, c) => s + (parseInt(c.washCount) || 0), 0);

  const handleSubmit = () => {
    if (!form.type) { toast.error("Select capture type"); return; }
    if (form.type === "CASH_COLLECTION" && !form.amount) { toast.error("Enter amount"); return; }
    if (form.type === "WASH_COUNT" && !form.washCount) { toast.error("Enter wash count"); return; }

    const record = {
      id: `DC-${Date.now()}`,
      type: form.type,
      amount: parseFloat(form.amount) || 0,
      washerName: form.washerName,
      washCount: parseInt(form.washCount) || 0,
      notes: form.notes,
      pincode: form.pincode,
      supervisorId: currentUser?.employeeId || "",
      supervisorName: currentUser?.name || "Supervisor",
      cityId: city || "CITY-SURAT",
      date: todayKey,
      capturedAt: new Date().toISOString(),
    };

    const updated = [...captures, record];
    setCaptures(updated);
    localStorage.setItem(CAPTURE_KEY, JSON.stringify(updated));
    setShowForm(false);
    setForm({ type: "CASH_COLLECTION", amount: "", washerName: "", washCount: "", notes: "", pincode: "" });
    toast.success("Data captured and saved");
  };

  const typeLabel: Record<string, string> = {
    CASH_COLLECTION: "💰 Cash Collection",
    WASH_COUNT: "🚗 Wash Count",
    ATTENDANCE: "👤 Attendance Note",
    ISSUE: "⚠️ Field Issue",
  };

  return (
    <div className="space-y-6 p-4">
      <BackButton to="/supervisor-app/dashboard" />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Field Data Capture</h1>
          <p className="text-sm text-gray-500 mt-1">{today} — Log cash, wash counts, and field issues</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" /> New Entry
        </Button>
      </div>

      {/* Today summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">₹{totalCash.toLocaleString("en-IN")}</div>
            <div className="text-xs text-gray-500">Cash Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-6 h-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-600">{totalWashes}</div>
            <div className="text-xs text-gray-500">Washes Logged</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-purple-600">{todayCaptures.length}</div>
            <div className="text-xs text-gray-500">Entries Today</div>
          </CardContent>
        </Card>
      </div>

      {/* Entry form */}
      {showForm && (
        <Card className="border-2 border-blue-200">
          <CardHeader><CardTitle className="text-base">New Data Entry</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(typeLabel).map(([val, lbl]) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, type: val }))}
                    className={`p-2 rounded-lg border text-xs font-medium text-left ${form.type === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            {form.type === "CASH_COLLECTION" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Amount (₹)</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number"
                  placeholder="Enter cash amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            )}

            {form.type === "WASH_COUNT" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Wash Count</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" type="number"
                  placeholder="Number of washes" value={form.washCount} onChange={e => setForm(f => ({ ...f, washCount: e.target.value }))} />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Washer Name (optional)</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Which washer" value={form.washerName} onChange={e => setForm(f => ({ ...f, washerName: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Area pincode" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
              <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
                placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Save Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's entries */}
      <Card>
        <CardHeader><CardTitle className="text-base">Today's Entries ({todayCaptures.length})</CardTitle></CardHeader>
        <CardContent>
          {todayCaptures.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No entries yet today</p>
              <p className="text-xs mt-1">Tap New Entry to start capturing field data</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayCaptures.slice().reverse().map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">{typeLabel[c.type] || c.type}</div>
                    {c.washerName && <div className="text-xs text-gray-500">{c.washerName}</div>}
                    {c.notes && <div className="text-xs text-gray-400 mt-0.5">{c.notes}</div>}
                  </div>
                  <div className="text-right">
                    {c.type === "CASH_COLLECTION" && <div className="text-sm font-bold text-green-600">₹{c.amount.toLocaleString("en-IN")}</div>}
                    {c.type === "WASH_COUNT" && <div className="text-sm font-bold text-blue-600">{c.washCount} washes</div>}
                    <div className="text-xs text-gray-400">{new Date(c.capturedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All history */}
      {captures.filter(c => c.date !== todayKey).length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base text-gray-500">Previous Entries</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {captures.filter(c => c.date !== todayKey).slice(-10).reverse().map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-75">
                  <div>
                    <div className="text-xs font-medium text-gray-600">{typeLabel[c.type]}</div>
                    <div className="text-xs text-gray-400">{c.date} {c.washerName && `· ${c.washerName}`}</div>
                  </div>
                  <div className="text-xs font-semibold text-gray-600">
                    {c.type === "CASH_COLLECTION" ? `₹${c.amount}` : c.type === "WASH_COUNT" ? `${c.washCount} washes` : "—"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
