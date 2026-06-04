/**
 * City Context - Central City Selection and Scoping
 *
 * Provides city context throughout the application for:
 * - Data filtering by city
 * - Navigation scoping
 * - Role-based city locking
 * - Multi-city support
 *
 * USAGE:
 * ```tsx
 * const { city, setCity, availableCities } = useCity();
 * ```
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo } from "react";
import { useRole } from "./RoleContext";

export type CityId = "CITY-SURAT" | "CITY-MUMBAI" | "CITY-AHMEDABAD";

export interface CityInfo {
  id: CityId;
  name: string;
  displayName: string;
}

export const CITIES: Record<CityId, CityInfo> = {
  "CITY-SURAT": {
    id: "CITY-SURAT",
    name: "surat",
    displayName: "Surat",
  },
  "CITY-MUMBAI": {
    id: "CITY-MUMBAI",
    name: "mumbai",
    displayName: "Mumbai",
  },
  "CITY-AHMEDABAD": {
    id: "CITY-AHMEDABAD",
    name: "ahmedabad",
    displayName: "Ahmedabad",
  },
};

interface CityContextValue {
  city: CityId;
  cityInfo: CityInfo;
  setCity: (city: CityId) => void;
  availableCities: CityInfo[];
  isLocked: boolean;
}

const CityContext = createContext<CityContextValue | undefined>(undefined);

interface CityProviderProps {
  children: ReactNode;
}

// Helper: read ?city= from the URL query string
// BrowserRouter uses /path?city=surat — city is in window.location.search
function getCityFromURL(): CityId | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const cityName = params.get("city")?.toLowerCase();
    if (!cityName) return null;
    const found = Object.values(CITIES).find(c => c.name === cityName);
    return found ? found.id : null;
  } catch {
    return null;
  }
}

// Helper: update ?city= in the URL query string without a full navigation
// BrowserRouter: city lives in window.location.search, not the hash
function updateCityInURL(cityId: CityId) {
  try {
    const params = new URLSearchParams(window.location.search);
    params.set("city", CITIES[cityId].name);
    const newURL = window.location.pathname + "?" + params.toString();
    window.history.replaceState(null, "", newURL);
  } catch {
    // Non-critical — silently ignore
  }
}

export function CityProvider({ children }: CityProviderProps) {
  const { currentUser, currentRole } = useRole();

  // Priority: URL param > user's assigned city > persisted localStorage > default Surat
  const urlCity = getCityFromURL();
  const persistedCity = localStorage.getItem("cleancar_selected_city") as CityId | null;
  const defaultCity = urlCity || (currentUser?.cityId as CityId) || persistedCity || "CITY-SURAT";
  const [city, setCityState] = useState<CityId>(defaultCity);

  // Persist city selection to localStorage whenever city changes
  // NOTE: We do NOT update the URL here — nav links already have ?city= appended
  // by attachCityToPath(). Updating URL here caused double ?city= params and
  // corrupted the HashRouter URL format (?city=surat#/route instead of #/route?city=surat)
  useEffect(() => {
    localStorage.setItem("cleancar_selected_city", city);
  }, [city]);

  // Sync city from URL on every render (catches React Router Link navigations).
  // BrowserRouter's Link/navigate() do not fire popstate, but they cause
  // re-renders in parent components which re-run this effect.
  // Only calls setCityState when the city value actually changes — no render loop.
  useEffect(() => {
    const urlCityId = getCityFromURL();
    if (urlCityId && urlCityId !== city) {
      setCityState(urlCityId);
    }
  }); // intentionally no dep array — must re-run on every render

  // Also handle browser back/forward navigation (fires popstate)
  useEffect(() => {
    const handlePopState = () => {
      const urlCityId = getCityFromURL();
      if (urlCityId && urlCityId !== city) {
        setCityState(urlCityId);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [city]);

  // Determine if city is locked based on role
  const isLocked = currentRole === "City Manager";

  // Get available cities
  const availableCities = isLocked
    ? [CITIES[defaultCity]]
    : Object.values(CITIES);

  // Sync city with user's assigned city when role is locked
  useEffect(() => {
    if (currentUser?.cityId && isLocked) {
      setCityState(currentUser.cityId as CityId);
    }
  }, [currentUser?.cityId, isLocked]);

  const setCity = (newCity: CityId) => {
    if (isLocked && newCity !== defaultCity) {
      console.warn(`City is locked to ${defaultCity} for role ${currentRole}`);
      return;
    }
    setCityState(newCity);
  };

  const cityValue = useMemo((): CityContextValue => ({
    city,
    cityInfo: CITIES[city],
    setCity,
    availableCities,
    isLocked,
  }), [city, availableCities, isLocked]); // setCity is stable

  return <CityContext.Provider value={cityValue}>{children}</CityContext.Provider>;
}

export function useCity() {
  const context = useContext(CityContext);
  if (context === undefined) {
    // PREVIEW FALLBACK: Safe defaults for Figma Make iframe, dev HMR, and standalone component previews
    // Always return fallback instead of throwing to prevent preview errors
    console.warn('useCity called outside CityProvider - using fallback defaults');
    return {
      city: "CITY-SURAT" as CityId,
      cityInfo: CITIES["CITY-SURAT"],
      setCity: (_: CityId) => {},
      availableCities: Object.values(CITIES),
      isLocked: false,
    } as CityContextValue;
  }
  return context;
}

/**
 * Utility: Attach city to URL path
 */
export function attachCityToPath(path: string, city: CityId): string {
  // Don't add city to certain paths
  const skipPaths = ["/onboarding", "/onboard", "/unauthorized"];
  if (skipPaths.some(skip => path.startsWith(skip))) {
    return path;
  }

  const cityParam = `city=${CITIES[city].name}`;

  if (path.includes("?")) {
    // Already has query params
    return path.includes("city=") ? path : `${path}&${cityParam}`;
  }

  return `${path}?${cityParam}`;
}
