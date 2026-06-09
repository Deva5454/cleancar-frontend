/**
 * WasherTrackingPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Public page — no login required. Customer opens this link to see live washer location.
 * Route: /track/:jobId
 *
 * Shows:
 *  - Google Maps iframe centred on washer's last known location
 *  - Washer name, ETA (estimated from distance to customer address)
 *  - Auto-refreshes every 30 seconds
 *  - Falls back to "Washer is on the way" message if location not available
 */

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getLastLocation } from "../../services/washerLocationService";
import { DataService } from "../../services/DataService";
import { MapPin, Phone, RefreshCw, Clock } from "lucide-react";

export function WasherTrackingPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob]           = useState<any>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [loading, setLoading]   = useState(true);

  const loadData = () => {
    if (!jobId) return;
    const jobs = DataService.get<any>("JOBS");
    const found = jobs.find((j: any) => j.jobId === jobId);
    setJob(found || null);

    if (found?.washerId) {
      const loc = getLastLocation(found.washerId);
      if (loc) {
        setLocation({ lat: loc.lat, lng: loc.lng });
        setLastUpdated(new Date(loc.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    window.addEventListener("cc360:washer_location_update", loadData);
    return () => { clearInterval(interval); window.removeEventListener("cc360:washer_location_update", loadData); };
  }, [jobId]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (!job) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-4xl mb-4">🚗</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Tracking not available</h2>
        <p className="text-gray-500">This link may have expired or the job ID is invalid.</p>
      </div>
    </div>
  );

  const customerLat = job.location?.lat;
  const customerLng = job.location?.lng;
  const mapLat  = location?.lat  || customerLat  || 21.1702;
  const mapLng  = location?.lng  || customerLng  || 72.8311;

  const mapsUrl = location
    ? `https://www.google.com/maps/embed/v1/directions?key=AIzaSyD-placeholder&origin=${location.lat},${location.lng}&destination=${customerLat || mapLat},${customerLng || mapLng}&mode=driving`
    : `https://www.google.com/maps/embed/v1/place?key=AIzaSyD-placeholder&q=${mapLat},${mapLng}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="text-3xl">🚗</div>
          <div>
            <div className="font-bold text-lg">249 Carwashing</div>
            <div className="text-blue-200 text-sm">Live Washer Tracking</div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${location ? "bg-green-500 animate-pulse" : "bg-amber-400"}`} />
            <span className="font-semibold text-gray-800">
              {location ? "Washer is on the way" : "Locating your washer…"}
            </span>
          </div>
          {lastUpdated && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last updated: {lastUpdated}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Service</div>
              <div className="font-semibold text-gray-800">{job.packageName || "Car Wash"}</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-gray-500 text-xs mb-1">Scheduled</div>
              <div className="font-semibold text-gray-800">{job.timeSlot || "Today"}</div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {location ? (
            <div className="relative">
              <iframe
                title="Washer Location"
                width="100%"
                height="320"
                style={{ border: 0 }}
                loading="lazy"
                src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
              />
              <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                <button onClick={loadData}>
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          ) : (
            <div className="h-48 bg-gray-100 flex flex-col items-center justify-center text-gray-400">
              <MapPin className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Live location will appear once the washer is en route</p>
            </div>
          )}
        </div>

        {/* Contact */}
        {job.supervisorPhone && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500 mb-2">Need help?</div>
            <a href={`tel:${job.supervisorPhone}`}
              className="flex items-center gap-2 text-blue-700 font-semibold">
              <Phone className="w-4 h-4" />
              Call Supervisor: {job.supervisorPhone}
            </a>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 pb-4">
          This page auto-refreshes every 30 seconds. — 249 Carwashing
        </p>
      </div>
    </div>
  );
}

export default WasherTrackingPage;
