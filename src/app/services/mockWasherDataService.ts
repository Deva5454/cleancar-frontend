/**
 * Mock Washer Data Service
 * Provides dummy customer and job data for testing the washer module
 * NO HARD-CODED DATA in components - all data comes from this service
 *
 * Periodic services use Option B: subscription-start-date anchored scheduling.
 * computePeriodicFlagsB() from periodicScheduleService.ts is the live source.
 * The old Option A fixed-day function (computePeriodicFlags) is removed.
 */

import { computePeriodicFlagsB } from "./periodicScheduleService";
import type { PeriodicService } from "./periodicScheduleService";

export interface CustomerJob {
  id: string;
  timeSlot: string;
  customerFirstName: string;
  area: string;
  pinCode: string;
  city: string;
  addressLine1?: string;
  vehicleCategory: string;
  vehicleColor: string;
  vehicleBrand: string;
  vehicleRegistration: string;
  packageName: string;       // display name e.g. "Express Wash | Chamakti Subah"
  packageType: string;       // canonical key: "EXPRESS_WASH" | "SMART_WASH" | "ELITE_WASH" | "ELITE_2W"
  serviceFrequency: string;
  subscriptionMonth: string;
  subscriptionStartDate?: string;  // ISO date — used to compute periodic service days
  complimentaryBenefits?: string;
  jobType: "Regular" | "One-Time Demo" | "Subscription Demo" | "Ad-hoc";
  status: "Assigned" | "Acknowledged" | "In Progress" | "Completed" | "Cancelled";
  specialInstructions?: string;
  specialNotes?: string;
  startingSoon?: boolean;
  overdue?: boolean;
  isDemoAccepted?: boolean;
  memberSince?: string;
  totalWashesCompleted?: number;
  nextScheduledWash?: string;
  parkingInstructions?: string;

  // ── Periodic service flags ────────────────────────────────────────────────
  // Computed by computePeriodicFlags() based on packageType + today's date.
  // Option A: fixed calendar days (shampoo=1st, wax/shampoo+wax=15th, interior=10th & 25th).
  // Washer sees a banner when any of these are true.
  isShampooDay?:    boolean;   // true if today is the monthly/fortnightly shampoo day
  isWaxDay?:        boolean;   // true if today is the monthly/fortnightly wax day
  isGlassDay?:      boolean;   // true if today is the glass cleaning day
  isTyreDay?:       boolean;   // true if today is the tyre dressing day
  isInteriorDay?:   boolean;   // true if today is the interior vacuum day
  periodicServices?: PeriodicService[]; // full list of what's due today
}

// Re-export PeriodicService type for components that import it from here
export type { PeriodicService } from "./periodicScheduleService";
// Re-export for backward compatibility — WasherJobChecklist imports computePeriodicFlagsB
export { computePeriodicFlagsB } from "./periodicScheduleService";

export interface WasherStats {
  jobsToday: number;
  completed: number;
  inProgress: number;
  remaining: number;
  totalEarnings: number;
  unitsCompleted: number;
}

class MockWasherDataService {
  // Job cache — keyed by "washerId-date" so jobs are stable within a session
  private jobCache: Map<string, CustomerJob[]> = new Map();

  // Job status overrides — persists mutations from updateJobStatus/completeJob
  private jobStatusOverrides: Map<string, CustomerJob["status"]> = new Map();

  // Customer names pool
  private customerNames = [
    "Arjun", "Priya", "Rajesh", "Anjali", "Karan", "Sneha", "Vikram", "Pooja",
    "Rahul", "Meera", "Amit", "Divya", "Rohan", "Kavya", "Siddharth", "Ishita",
    "Nikhil", "Riya", "Aditya", "Neha", "Manish", "Sakshi", "Varun", "Tanvi"
  ];

  // Areas in Surat
  private areas = [
    "Adajan", "Vesu", "Jahangirpura", "Piplod", "Althan", "Rander", "Citylight",
    "Pal", "Magdalla", "Dumas", "Pandesara", "Udhna", "Varachha", "Katargam"
  ];

  // Vehicle data
  private vehicleData = [
    { category: "Hatchback", brands: ["Maruti", "Hyundai", "Tata"], colors: ["White", "Red", "Blue", "Silver", "Black"] },
    { category: "Mid-Size Sedan", brands: ["Honda", "Maruti", "Hyundai", "Volkswagen"], colors: ["White", "Silver", "Black", "Blue", "Grey"] },
    { category: "Compact Sedan", brands: ["Maruti", "Honda", "Hyundai"], colors: ["White", "Silver", "Red", "Blue"] },
    { category: "Mid/Large SUV", brands: ["Toyota", "Mahindra", "Tata", "Hyundai", "Kia"], colors: ["White", "Black", "Silver", "Blue", "Red"] },
    { category: "Luxury Sedan", brands: ["Mercedes", "BMW", "Audi", "Jaguar"], colors: ["Black", "White", "Silver", "Blue"] },
  ];

  // Package pool — in sync with data/subscriptionPlans.ts CURRENT_PLAN_VERSION (SHINE/PROTECT/ELITE)
  private packages = [
    { name: "Express Wash | Chamakti Subah",  type: "EXPRESS_WASH",   frequency: "Daily", price: 1249 },
    { name: "Smart Wash | Raksha Plan",   type: "SMART_WASH", frequency: "Daily", price: 1599 },
    { name: "Elite Wash | Raja Seva",  type: "ELITE_WASH",   frequency: "Daily", price: 1999 }, // Hatchback
    { name: "Smart Wash | Raksha Plan",   type: "SMART_WASH", frequency: "Daily", price: 1999 }, // SUV tier
    { name: "Elite Wash | Raja Seva",  type: "ELITE_WASH",   frequency: "Daily", price: 2499 }, // SUV tier
    { name: "Elite Wash | Raja Seva",  type: "ELITE_WASH",   frequency: "Daily", price: 3499 }, // Luxury tier
  ];

  // Special instructions pool
  private specialInstructions = [
    "Customer prefers no water near the bonnet",
    "Avoid using high pressure on windows",
    "Extra attention to wheel cleaning required",
    "Customer sensitive to strong chemical smells",
    "Park car in original spot after wash",
    null, // Some jobs have no special instructions
    null,
    null,
  ];

  // Parking instructions pool
  private parkingInstructions = [
    "Basement parking B2, Slot 42",
    "Main gate parking available",
    "Visitor parking near lobby",
    "Underground parking - call customer for access code",
    "Society parking - left side near gate",
    "Covered parking slot 15",
    "Street parking in front of building",
    "Building parking - collect keys from guard",
  ];

  // Generate random registration number
  private generateRegNumber(): string {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";

    const part1 = letters[Math.floor(Math.random() * letters.length)] + letters[Math.floor(Math.random() * letters.length)];
    const part2 = Math.floor(Math.random() * 10).toString() + Math.floor(Math.random() * 10).toString();
    const part3 = numbers[Math.floor(Math.random() * numbers.length)] +
                  numbers[Math.floor(Math.random() * numbers.length)] +
                  numbers[Math.floor(Math.random() * numbers.length)] +
                  numbers[Math.floor(Math.random() * numbers.length)];

    return `GJ-05-${part1}-${part3}`;
  }

  // Generate time slot
  private generateTimeSlot(index: number): string {
    const baseHour = 5 + Math.floor(index / 2);
    const baseMinute = (index % 2) * 30;
    const endHour = baseMinute === 30 ? baseHour + 1 : baseHour;
    const endMinute = baseMinute === 30 ? 0 : 30;

    return `${baseHour.toString().padStart(2, '0')}:${baseMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  }

  // Generate random pin code
  private generatePinCode(): string {
    const base = 395000;
    const offset = Math.floor(Math.random() * 20) + 1;
    return (base + offset).toString();
  }

  // Generate mock jobs
  // Always produces exactly 3 jobs — one per plan type — starting from NOW.
  // All start as "Assigned" so the washer can demo the full check-in → wash × 3 → check-out flow.
  // Time slots are anchored to the current hour so no job is ever auto-completed.
  public getTodayJobs(washerId: string, count: number = 3): CustomerJob[] {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = `${washerId}-${today}`;

    // Return cached jobs applying any status overrides
    if (this.jobCache.has(cacheKey)) {
      const cached = this.jobCache.get(cacheKey)!;
      return cached.map(job => ({
        ...job,
        status: this.jobStatusOverrides.get(job.id) ?? job.status,
      }));
    }

    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();

    // Helper: format HH:MM
    const fmt = (hour: number, min: number) => {
      const hh = hour % 24;
      return `${String(hh).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    };

    // 3 slots starting from now, 45 min apart
    const slots = [0, 1, 2].map(i => {
      const totalMin = h * 60 + m + i * 45;
      const startH = Math.floor(totalMin / 60);
      const startM = totalMin % 60;
      const endH = Math.floor((totalMin + 30) / 60);
      const endM = (totalMin + 30) % 60;
      return `${fmt(startH, startM)} - ${fmt(endH, endM)}`;
    });

    // Fixed 3 customers, one per plan — stable across session
    const demoJobs: Array<{
      name: string; area: string; reg: string; vehicle: string;
      brand: string; color: string; address: string;
      pkg: { name: string; type: string; price: number };
      parking: string; note: string;
      subStart: string;
    }> = [
      {
        name: "Arjun", area: "Adajan", reg: "GJ-05-AK-1234",
        vehicle: "Hatchback", brand: "Maruti", color: "White",
        address: "B-204, Sunrise Residency, Adajan",
        pkg: { name: "Express Wash | Chamakti Subah", type: "EXPRESS_WASH", price: 1249 },
        parking: "Society parking - left side near gate",
        note: "Park car in original spot after wash",
        subStart: new Date(Date.now() - 10 * 86400000).toISOString().split("T")[0],
      },
      {
        name: "Priya", area: "Vesu", reg: "GJ-05-BK-5678",
        vehicle: "Mid-Size Sedan", brand: "Honda", color: "Silver",
        address: "A-301, Royal Heights, Vesu",
        pkg: { name: "Smart Wash | Raksha Plan", type: "SMART_WASH", price: 1599 },
        parking: "Covered parking slot 15",
        note: "Avoid using high pressure on windows",
        subStart: new Date(Date.now() - 5 * 86400000).toISOString().split("T")[0],
      },
      {
        name: "Vikram", area: "Citylight", reg: "GJ-05-CM-9012",
        vehicle: "Mid/Large SUV", brand: "Toyota", color: "Black",
        address: "C-101, Prime Apartments, Citylight",
        pkg: { name: "Elite Wash | Raja Seva", type: "ELITE_WASH", price: 2499 },
        parking: "Basement parking B2, Slot 42",
        note: "Extra attention to wheel cleaning required",
        subStart: new Date(Date.now() - 2 * 86400000).toISOString().split("T")[0],
      },
    ];

    const jobs: CustomerJob[] = demoJobs.map((d, i) => ({
      id: `JOB-00${i + 1}`,
      timeSlot: slots[i],
      customerFirstName: d.name,
      area: d.area,
      pinCode: `39500${i + 1}`,
      city: "Surat",
      addressLine1: d.address,
      vehicleCategory: d.vehicle,
      vehicleColor: d.color,
      vehicleBrand: d.brand,
      vehicleRegistration: d.reg,
      packageName: d.pkg.name,
      packageType: d.pkg.type,
      serviceFrequency: "Daily",
      subscriptionMonth: "6-month plan — Month 1 of 6",
      subscriptionStartDate: d.subStart,
      complimentaryBenefits: i === 2 ? "2 of 3 Interior Clean-Ups remaining" : undefined,
      jobType: "Regular" as const,
      status: "Assigned" as const,   // Always Assigned — washer starts fresh
      specialInstructions: d.note,
      specialNotes: `${d.note}. ${d.parking}`,
      startingSoon: i === 0,
      overdue: false,
      memberSince: "Jan 2026",
      totalWashesCompleted: (i + 1) * 10,
      parkingInstructions: d.parking,
      ...computePeriodicFlagsB(`JOB-00${i + 1}`, d.pkg.type, d.subStart),
    }));

    // Cache so status overrides are stable
    this.jobCache.set(cacheKey, jobs);

    return jobs.map(job => ({
      ...job,
      status: this.jobStatusOverrides.get(job.id) ?? job.status,
    }));
  }

  // Get washer stats
  public getWasherStats(washerId: string): WasherStats {
    const jobs = this.getTodayJobs(washerId);

    return {
      jobsToday: jobs.length,
      completed: jobs.filter(j => j.status === "Completed").length,
      inProgress: jobs.filter(j => j.status === "In Progress").length,
      remaining: jobs.filter(j => j.status === "Assigned").length,
      totalEarnings: 0, // Will be calculated by incentive service
      unitsCompleted: jobs.filter(j => j.status === "Completed").length,
    };
  }

  // Get jobs by status
  public getJobsByStatus(washerId: string, status: CustomerJob["status"]): CustomerJob[] {
    return this.getTodayJobs(washerId).filter(job => job.status === status);
  }

  // Get in-progress job (for resume banner)
  public getInProgressJob(washerId: string): CustomerJob | null {
    const inProgressJobs = this.getJobsByStatus(washerId, "In Progress");
    return inProgressJobs.length > 0 ? inProgressJobs[0] : null;
  }

  // Update job status (persists via override map)
  public updateJobStatus(jobId: string, newStatus: CustomerJob["status"]): void {
    this.jobStatusOverrides.set(jobId, newStatus);
  }

  // Simulate job completion
  public completeJob(jobId: string): void {
    this.updateJobStatus(jobId, "Completed");
  }

  // Clear cache — forces fresh job generation on next getTodayJobs call
  public clearCache(): void {
    this.jobCache.clear();
    this.jobStatusOverrides.clear();
  }
}

// Singleton instance
export const mockWasherDataService = new MockWasherDataService();

// Clear stale cache on load so fresh demo data is always generated
mockWasherDataService.clearCache();
