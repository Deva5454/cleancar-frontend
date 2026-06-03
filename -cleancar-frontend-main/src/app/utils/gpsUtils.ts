/**
 * gpsUtils.ts — GPS validation utilities
 * Used by BTL Activity Mode for 500m Supervisor location check
 * Formula: Haversine (straight-line distance, not road distance)
 */

export interface GpsCoord { lat: number; lng: number; }

/** Haversine distance in metres between two GPS points */
export function haversineMetres(a: GpsCoord, b: GpsCoord): number {
  const R = 6371000; // Earth radius in metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** Returns true if Supervisor is within 500m of the location GPS pin */
export function isWithin500m(supervisorGps: GpsCoord, locationPin: GpsCoord): boolean {
  return haversineMetres(supervisorGps, locationPin) <= 500;
}

/** Get current device GPS as a promise */
export function getCurrentGps(): Promise<GpsCoord> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(`GPS error: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
