/**
 * TSECallbackRequests
 * Real queue of customer callback requests, submitted through the
 * customer portal. A TSE marks one as "Called" once they've actually
 * made the call - this is a real status change, not a checkbox that
 * resets.
 */
import { useState, useEffect } from "react";
import { PhoneCall, Clock } from "lucide-react";
import { toast } from "sonner";
import { accountingEntryService, type CallbackRequest } from "../../services/accountingEntryService";
import { useRole } from "../../contexts/RoleContext";

export function TSECallbackRequests({ cityId }: { cityId: string }) {
  const { currentUser } = useRole();
  const [requests, setRequests] = useState<CallbackRequest[]>([]);

  const refresh = () => setRequests(accountingEntryService.getCallbackRequests(cityId));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId]);

  const pending = requests
    .filter((r) => r.status === "Pending")
    .sort((a, b) => `${a.requestedDate}${a.requestedHour}`.localeCompare(`${b.requestedDate}${b.requestedHour}`));
  const called = requests.filter((r) => r.status === "Called");

  const handleMarkCalled = (r: CallbackRequest) => {
    const success = accountingEntryService.markCallbackDone(r.id, cityId, currentUser?.name || "TSE");
    if (!success) { toast.error("Could not update — please try again."); return; }
    toast.success(`Marked as called — ${r.customerName}`);
    refresh();
  };

  const formatHour = (h: number) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? "PM" : "AM"}`;

  return (
    <div className="p-4 space-y-4 overflow-y-auto h-full">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Callback Requests</h2>
        <p className="text-sm text-gray-500">Real requests submitted by customers through the portal, within office hours.</p>
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Pending ({pending.length})</h3>
        {pending.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">Nothing waiting right now.</div>
        ) : (
          <div className="space-y-2">
            {pending.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{r.customerName}</p>
                  <p className="text-sm text-gray-500">{r.customerPhone}</p>
                  <p className="text-xs text-blue-700 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {r.requestedDate} at {formatHour(r.requestedHour)}
                  </p>
                  {r.reason && <p className="text-xs text-gray-500 mt-1">"{r.reason}"</p>}
                </div>
                <button
                  onClick={() => handleMarkCalled(r)}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                >
                  <PhoneCall className="w-4 h-4" /> Mark Called
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="font-medium text-gray-900 mb-2">Called ({called.length})</h3>
        {called.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing here yet.</p>
        ) : (
          <div className="space-y-2">
            {called.slice(0, 10).map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                {r.customerName} — called {r.calledAt ? new Date(r.calledAt).toLocaleString() : ""} by {r.calledBy}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TSECallbackRequests;
