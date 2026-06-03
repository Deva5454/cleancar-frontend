/**
 * City Configuration Types
 *
 * Dynamic multi-city hierarchy configuration
 * Replaces hardcoded Surat-only structure
 *
 * Hierarchy: City → Zone → Cluster → Pincode
 */

export interface City {
  id: string; // e.g., "CITY-SURAT", "CITY-AHMEDABAD"
  name: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface Zone {
  id: string; // e.g., "ZONE-SOUTH"
  name: string;
  cityId: string; // Reference to City.id
  isActive?: boolean;
  createdAt?: string;
}

export interface Cluster {
  id: string; // e.g., "CLUSTER-ADAJAN"
  name: string;
  zoneId: string; // Reference to Zone.id
  cityId: string; // Denormalized for faster lookups
  isActive?: boolean;
  createdAt?: string;
}

export interface Pincode {
  code: string; // e.g., "395009"
  clusterId: string; // Reference to Cluster.id
  cityId: string; // Denormalized for faster lookups
  zoneId?: string; // Denormalized for faster lookups
  isActive?: boolean;
  createdAt?: string;
}

/**
 * Complete city configuration
 * Stored in DataService under key "CITY_CONFIG"
 */
export interface CityConfig {
  cities: City[];
  zones: Zone[];
  clusters: Cluster[];
  pincodes: Pincode[];
  version?: number; // For future migrations
  lastUpdated?: string;
}
