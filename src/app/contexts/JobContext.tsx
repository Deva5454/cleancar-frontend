﻿﻿﻿﻿﻿﻿﻿﻿/**
 * JobContext - SINGLE SOURCE OF TRUTH for all job/work order data
 * Used across: Operations, Washer App, Supervisor Dashboard, Finance
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef} from "react";
import { useEvents } from "./EventSystem";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";
import { recordFirstWashDate } from "../services/firstWashReminderService";
import { getBundleBySubscriptionId, recordBundleVisit, recordBundleFirstWash } from "../services/multiMonthBundleService";
import { markOfferCompleted } from "../services/complimentary2WService";
import { createUpsellTask, createPackUpsellTask } from "../services/tatTrackingService";
import { sendBookingConfirmed, sendWasherArrived, sendWashCompleted, sendRatingRequest, sendPackVisitLow, sendBeforeAfterPhotos } from "../services/whatsappService";

// Types
export interface Job {
  jobId: string;
  customerId: string; // GLOBAL IDENTITY - links to CustomerContext
  subscriptionId?: string; // Links to CustomerSubscriptionContext if from subscription
  leadId?: string; // Links to CustomerContext's lead record, when this job originated from a TSE booking a lead (see TeleSalesExecutiveApp.tsx handleCRMSubmit)
  washerId?: string; // GLOBAL IDENTITY - links to HRDataContext (employeeId)
  scheduledDate: string;
  timeSlot: string;
  status: "Unassigned" | "Assigned" | "Acknowledged" | "In Progress" | "Completed" | "Verified" | "Failed" | "Cancelled";
  jobType: "One-Time Demo" | "Subscription Demo" | "Regular" | "Add-on";
  packageName: string;
  packageType?: string;
  frequency?: string;
  offerId?: string;          // links to complimentary offer
  isComplimentary?: boolean; // true for complimentary 2W wash
  packVariant?: "waterWash" | "shampoo" | "shampooWax"; // which service type for pack2/pack4 jobs
  oneTimeVariant?: "waterWash" | "shampoo" | "shampooWax"; // which service type for onetime jobs
  vehicleDetails: {
    category: string;
    color: string;
    brand: string;
    registration: string;
  };
  location: {
    addressLine1: string;
    area: string;
    city: string;
    pinCode: string;
  };
  serviceDetails: {
    addOns?: string[];
    specialInstructions?: string;
  };
  // Verification & QA
  verificationStatus?: "verified" | "flagged" | "failed" | "pending";
  qualityScore?: number; // 0-100
  complianceScore?: number; // 0-100
  qaRequired?: boolean;
  qaAuditId?: string;
  // Failure handling
  failureReason?: string;
  cancellationReason?: string;
  cancelledAt?: string;
  rescheduleRequested?: boolean; // set by washer/staff on a Failed job — distinct from customer requests below
  // Real customer-initiated reschedule request — requires real staff
  // approval before the booking's actual date/time changes. Separate
  // fields from the flag above, which belongs to a different real
  // scenario (a washer reporting a job failed).
  rescheduleRequestStatus?: "pending" | "approved" | "rejected";
  rescheduleRequestedDate?: string;
  rescheduleRequestedSlot?: string;
  rescheduleRequestReason?: string;
  rescheduleCount?: number;
  // Real doorstep-payment gate — already read by isPaymentRequired() in
  // doorstepPaymentService.ts and by the washer app's completion check,
  // but never formally declared here. Making it explicit so any job
  // creation path has to consciously decide whether payment is pending,
  // rather than silently defaulting to "no payment needed."
  paymentStatus?: "Pending" | "Paid";

  // City isolation
  cityId: string;
  city: string;

  // Denormalized display fields (avoid lookups in list views)
  washerName?: string;
  customerName?: string;
  customerPhone?: string;

  // Flattened convenience fields
  area?: string;       // mirrors location.area
  pinCode?: string;    // mirrors location.pinCode
  vehicleType?: string;// mirrors vehicleDetails.category
  vehicleReg?: string; // mirrors vehicleDetails.registration
  units?: number;      // number of wash units in this job

  // Revenue
  amount?: number;     // price charged for this job â€” used in JOB_COMPLETED event

  // Priority scheduling
  // 1 = Multi-month bundle (highest â€” paid bulk upfront, 1-hr TAT guaranteed)
  // 2 = Urgent wash (paid â‚¹100 premium, 1-hr TAT)
  // 3 = Regular job
  // When both bundle and urgent come in simultaneously, bundle (rank 1) wins â€” per business decision C2.
  priorityRank?: 1 | 2 | 3;

  // Timestamps
  assignedAt?: string;
  acknowledgedAt?: string;
  startedAt?: string;
  completedAt?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface JobContextType {
  // All jobs
  allJobs: Job[];

  // Filtered views
  unassignedJobs: Job[];
  assignedJobs: Job[];
  completedJobs: Job[];

  // CRUD operations
  createJob: (job: Omit<Job, "jobId" | "createdAt" | "updatedAt">) => Job;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;

  // Job assignment
  assignJobToWasher: (jobId: string, washerId: string, washerName?: string) => void;
  unassignJob: (jobId: string) => void;

  // Job lifecycle
  acknowledgeJob: (jobId: string) => void;
  startJob: (jobId: string) => void;
  completeJob: (jobId: string, verificationData?: { qualityScore: number; complianceScore: number }, photoData?: { beforePhotoUrl?: string; afterPhotoUrl?: string }) => void;
  markJobAsVerified: (jobId: string, verificationStatus: "verified" | "flagged" | "failed") => void;
  markJobAsFailed: (jobId: string, reason: string, reschedule: boolean) => void;

  // Subscription-based job generation
  generateJobsFromSubscription: (subscriptionId: string, customerId: string, count: number, subscriptionData?: {
    packageName?: string;
    vehicleCategory?: string;
    vehicleRegistration?: string;
    vehicleBrand?: string;
    vehicleColor?: string;
    area?: string;
    addressLine1?: string;
    pinCode?: string;
    city?: string;
    cityId?: string;
    amount?: number;
    customerName?: string;
    customerPhone?: string;
    timeSlot?: string;
  }) => Job[];

  // Queries
  getJobById: (jobId: string) => Job | undefined;
  getJobsByCustomerId: (customerId: string) => Job[];
  getJobsByWasherId: (washerId: string) => Job[];
  getJobsByStatus: (status: Job["status"]) => Job[];
  getJobsForDate: (date: string) => Job[];

  // City-scoped queries
  getJobsByCityId: (cityId: string) => Job[];
  getUnassignedByCity: (cityId: string) => Job[];
  getAssignedByCity: (cityId: string) => Job[];
  getCompletedByCity: (cityId: string) => Job[];
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [allJobs, setAllJobs] = useState<Job[]>(() => {
    const stored = DataService.get<Job>("JOBS");
    logger.debug("JobContext loaded", { count: stored.length });

    // TEST DATA SEEDER for washer-jobs screen QA (idempotent - safe on every load)
    // Adds 10 jobs covering every status, using real seeded washer/supervisor IDs from
    // seedAllData.ts, so the data stays in sync with the rest of the app.
    const hasTestJobs = stored.some(j => j.jobId && j.jobId.startsWith("TESTJOB-"));
    if (!hasTestJobs) {
      const today = new Date().toISOString().split("T")[0];
      const WASHERS = [
        { id: "EDB-CW-SUR1A", name: "Mahesh Bharwad" },
        { id: "EDB-CW-SUR1B", name: "Ramesh Koli" },
        { id: "EDB-CW-SUR1C", name: "Sunil Thakor" },
      ];
      const CUSTOMERS = [
        { id: "TESTCUST-001", firstName: "Vikram", lastName: "Singh",  phone: "9876543210", area: "Adajan", addr: "12 Sunrise Society, Adajan" },
        { id: "TESTCUST-002", firstName: "Kavita", lastName: "Rao",    phone: "9876543211", area: "Adajan", addr: "45 Green Park, Adajan" },
        { id: "TESTCUST-003", firstName: "Suresh", lastName: "Iyer",   phone: "9876543212", area: "Adajan", addr: "78 Silver Heights, Adajan" },
        { id: "TESTCUST-004", firstName: "Meera",  lastName: "Desai",  phone: "9876543213", area: "Adajan", addr: "23 Lotus Apartments, Adajan" },
        { id: "TESTCUST-005", firstName: "Deepak", lastName: "Nair",   phone: "9876543214", area: "Adajan", addr: "56 Royal Enclave, Adajan" },
        { id: "TESTCUST-006", firstName: "Anjali", lastName: "Patel",  phone: "9876543215", area: "Adajan", addr: "89 Palm Residency, Adajan" },
        { id: "TESTCUST-007", firstName: "Rohit",  lastName: "Sharma", phone: "9876543216", area: "Adajan", addr: "34 Maple Towers, Adajan" },
        { id: "TESTCUST-008", firstName: "Pooja",  lastName: "Joshi",  phone: "9876543217", area: "Adajan", addr: "67 Orchid Villa, Adajan" },
      ];
      const PACKAGES = [
        { name: "Express Wash", type: "EXPRESS_WASH" },
        { name: "Smart Wash",   type: "SMART_WASH" },
        { name: "Elite Wash",   type: "ELITE_WASH" },
      ];
      const VEHICLES = [
        { category: "Hatchback", color: "White",  brand: "Maruti",  registration: "GJ05AB1234" },
        { category: "Sedan",     color: "Silver", brand: "Honda",   registration: "GJ05CD5678" },
        { category: "SUV",       color: "Black",  brand: "Hyundai", registration: "GJ05EF9012" },
        { category: "Hatchback", color: "Red",    brand: "Tata",    registration: "GJ05GH3456" },
        { category: "Sedan",     color: "Blue",   brand: "Maruti",  registration: "GJ05IJ7890" },
      ];
      const SLOTS = ["07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00", "16:00 - 17:00", "17:00 - 18:00"];
      const buildJob = (o: any): Job => {
        const cust = o.customer || CUSTOMERS[0];
        const veh = o.vehicle || VEHICLES[0];
        const pkg = o.pkg || PACKAGES[0];
        const washer = o.washer || WASHERS[0];
        return {
          jobId: o.jobId, customerId: cust.id, subscriptionId: o.subscriptionId,
          washerId: o.unassigned ? undefined : washer.id,
          scheduledDate: o.scheduledDate || today, timeSlot: o.timeSlot || SLOTS[0],
          status: o.status, jobType: o.jobType || "Regular",
          packageName: pkg.name, packageType: pkg.type, frequency: o.frequency,
          offerId: o.offerId, isComplimentary: o.isComplimentary || false,
          vehicleDetails: { category: veh.category, color: veh.color, brand: veh.brand, registration: veh.registration },
          location: { addressLine1: cust.addr, area: cust.area, city: "Surat", pinCode: "395001" },
          serviceDetails: { addOns: o.addOns || [], specialInstructions: o.specialInstructions || "" },
          verificationStatus: o.verificationStatus, qualityScore: o.qualityScore, complianceScore: o.complianceScore,
          failureReason: o.failureReason, rescheduleRequested: o.rescheduleRequested,
          cityId: "CITY-SURAT", city: "Surat",
          washerName: o.unassigned ? undefined : washer.name,
          customerName: `${cust.firstName} ${cust.lastName}`, customerPhone: cust.phone,
          area: cust.area, pinCode: "395001", vehicleType: veh.category, vehicleReg: veh.registration, units: 1,
        } as Job;
      };
      const testJobs: Job[] = [
        buildJob({ jobId: "TESTJOB-001", status: "Unassigned", jobType: "Add-on", customer: CUSTOMERS[0], vehicle: VEHICLES[0], pkg: PACKAGES[0], timeSlot: SLOTS[2], unassigned: true, specialInstructions: "Customer requested urgent slot." }),
        buildJob({ jobId: "TESTJOB-002", status: "Assigned", customer: CUSTOMERS[1], vehicle: VEHICLES[1], pkg: PACKAGES[1], washer: WASHERS[0], timeSlot: SLOTS[0] }),
        buildJob({ jobId: "TESTJOB-003", status: "Assigned", customer: CUSTOMERS[2], vehicle: VEHICLES[2], pkg: PACKAGES[2], washer: WASHERS[0], timeSlot: SLOTS[1] }),
        buildJob({ jobId: "TESTJOB-004", status: "Acknowledged", customer: CUSTOMERS[3], vehicle: VEHICLES[3], pkg: PACKAGES[0], washer: WASHERS[1], timeSlot: SLOTS[3] }),
        buildJob({ jobId: "TESTJOB-005", status: "In Progress", customer: CUSTOMERS[4], vehicle: VEHICLES[4], pkg: PACKAGES[1], washer: WASHERS[1], timeSlot: SLOTS[4], addOns: ["Interior Vacuum"] }),
        buildJob({ jobId: "TESTJOB-006", status: "In Progress", customer: CUSTOMERS[5], vehicle: VEHICLES[0], pkg: PACKAGES[2], washer: WASHERS[2], timeSlot: SLOTS[0], addOns: ["Dashboard Polish", "Tyre Shine"], specialInstructions: "Gate code 4521. Park in visitor slot 3." }),
        buildJob({ jobId: "TESTJOB-007", status: "Completed", customer: CUSTOMERS[6], vehicle: VEHICLES[1], pkg: PACKAGES[0], washer: WASHERS[0], timeSlot: SLOTS[0], verificationStatus: "pending" }),
        buildJob({ jobId: "TESTJOB-008", status: "Verified", customer: CUSTOMERS[7], vehicle: VEHICLES[2], pkg: PACKAGES[1], washer: WASHERS[0], timeSlot: SLOTS[1], verificationStatus: "verified", qualityScore: 92, complianceScore: 95 }),
        buildJob({ jobId: "TESTJOB-009", status: "Assigned", jobType: "Add-on", customer: CUSTOMERS[0], vehicle: { category: "2-Wheeler", color: "Black", brand: "Honda Activa", registration: "GJ05KL1111" }, pkg: PACKAGES[0], washer: WASHERS[1], timeSlot: SLOTS[2], isComplimentary: true, offerId: "TESTOFFER-001", specialInstructions: "Complimentary 2W linked to TESTJOB-002." }),
        buildJob({ jobId: "TESTJOB-010", status: "Failed", customer: CUSTOMERS[3], vehicle: VEHICLES[3], pkg: PACKAGES[0], washer: WASHERS[2], timeSlot: SLOTS[3], failureReason: "Car not accessible - gate locked.", rescheduleRequested: true }),
      ];
      logger.debug("JobContext: seeded test jobs for washer-jobs QA", { count: testJobs.length });
      try { localStorage.setItem("cc360_qa_test_jobs_cache", JSON.stringify(testJobs)); } catch (e) {}
      return [...stored, ...testJobs];
    }

    return stored;
  });

  const _dbJobsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // QA test-job re-asserter: runs after mount (and after the catch-up seeder's own
  // timer, which fires synchronously inside a setTimeout below) to guarantee the
  // TESTJOB- entries used by washer-jobs QA always survive the rolling 50-job cap.
  // Without this, the catch-up seeder can silently evict the test jobs because it
  // adds 50+ of its own jobs and the next save only keeps the most recent 50.
  useEffect(() => {
    const reassertTimer = setTimeout(() => {
      try {
        const stored: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
        const hasTestJobs = stored.some((j: any) => j.jobId && j.jobId.startsWith("TESTJOB-"));
        if (hasTestJobs) return;
        const testJobsRaw = localStorage.getItem("cc360_qa_test_jobs_cache");
        if (!testJobsRaw) return;
        const testJobs = JSON.parse(testJobsRaw);
        const withoutOldTest = stored.filter((j: any) => !j.jobId || !j.jobId.startsWith("TESTJOB-"));
        const merged = [...withoutOldTest, ...testJobs];
        localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify(merged));
        setAllJobs(merged);
        logger.debug("JobContext: re-asserted QA test jobs after catch-up seeder", { count: testJobs.length });
      } catch (e) {
        console.warn("[QA Test Jobs] Re-assert failed:", e);
      }
    }, 2000); // after the catch-up seeder's own internal timer has had time to finish
    return () => clearTimeout(reassertTimer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { emit } = useEvents();

  // Persist to storage (local cache - instant)
    // Re-hydrate from localStorage after Supabase data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored_allJobs = DataService.get<Job>("JOBS");
      if (stored_allJobs.length > allJobs.length) { setAllJobs(stored_allJobs); }
    }, 1000);
    return () => { clearTimeout(timer); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (_dbJobsTimer.current) clearTimeout(_dbJobsTimer.current);
    _dbJobsTimer.current = setTimeout(() => {
      if (allJobs.length > 0) DataService.setAll("JOBS", allJobs.slice(-50));
    }, 500);
  }, [allJobs]);

  // Backend sync (background, non-blocking)
  useSync("JOBS", allJobs);

  // Listen for new subscription â†’ auto-create first job
  useEffect(() => {
    const handleNewSubscription = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.subscriptionId) return;
      const start = new Date(d.startDate || new Date());
      if (start.getDay() === 0) start.setDate(start.getDate() + 1); // skip Sunday
      const dateStr = start.toISOString().split("T")[0];
      const rawSlot = (d.preferredTimeSlot || "06:00").slice(0, 5);
      const hour = parseInt(rawSlot.split(":")[0], 10);
      const safeSlot = (hour >= 5 && hour < 9) ? rawSlot : "06:00";
      try {
        createJob({
          customerId: d.customerId,
          subscriptionId: d.subscriptionId,
          scheduledDate: dateStr,
          timeSlot: safeSlot,
          status: "Unassigned",
          jobType: "Regular",
          packageName: d.packageName || "Subscription Wash",
          packageType: d.packageType,
          frequency: d.frequency,
          vehicleDetails: { category: d.vehicleType || "hatchback", color: "", brand: "", registration: "" },
          serviceDetails: { addOns: d.addOns || [], area: "", preferredTimeSlot: safeSlot },
          cityId: d.cityId || "CITY-SURAT",
          notes: `Auto-generated from subscription ${d.subscriptionId}`,
          priorityRank: 3, // Regular subscription job
        } as any);
        console.log("[JobContext] Auto-created job from subscription:", d.subscriptionId);
      } catch (err: any) {
        console.warn("[JobContext] Could not auto-create job:", err?.message);
      }
    };
    window.addEventListener("cc360:subscription_created", handleNewSubscription);
    return () => window.removeEventListener("cc360:subscription_created", handleNewSubscription);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for pack purchase â†’ auto-create first visit job
  useEffect(() => {
    const handlePackPurchase = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.subscriptionId || !d?.firstVisitDate) return;
      const date = new Date(d.firstVisitDate);
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      const dateStr = date.toISOString().split("T")[0];
      const safeSlot = "06:00";
      try {
        createJob({
          customerId: d.customerId,
          subscriptionId: d.subscriptionId,
          scheduledDate: dateStr,
          timeSlot: safeSlot,
          status: "Unassigned",
          jobType: "Regular",
          packageName: d.packageName || "Pack Visit",
          packageType: d.packageType,
          packVariant: d.packVariant || "shampoo",
          frequency: d.frequency,
          vehicleDetails: { category: d.vehicleType || "hatchback", color: "", brand: "", registration: d.vehicleReg || "" },
          serviceDetails: { addOns: d.addOns || [], area: "", preferredTimeSlot: safeSlot },
          cityId: d.cityId || "CITY-SURAT",
          notes: `Pack visit 1/${d.totalVisits} â€” auto from ${d.subscriptionId}`,
          priorityRank: 1, // Multi-month bundle â€” highest priority (C2 decision: bundle > urgent wash)
        } as any);
        console.log("[JobContext] Auto-created pack visit job:", d.subscriptionId);
      } catch (err: any) {
        console.warn("[JobContext] Could not auto-create pack job:", err?.message);
      }
    };
    window.addEventListener("cc360:pack_purchased", handlePackPurchase);
    return () => window.removeEventListener("cc360:pack_purchased", handlePackPurchase);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for urgent wash purchase â†’ auto-create job with priorityRank 2
  // Priority rule C2: Bundle (rank 1) > Urgent wash (rank 2) > Regular (rank 3)
  useEffect(() => {
    const handleUrgentWash = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.subscriptionId) return;
      const date = new Date(d.visitDate || new Date().toISOString().split("T")[0]);
      if (date.getDay() === 0) date.setDate(date.getDate() + 1);
      const dateStr = date.toISOString().split("T")[0];
      const safeSlot = d.visitTime && parseInt(d.visitTime.split(":")[0]) >= 5 && parseInt(d.visitTime.split(":")[0]) < 9
        ? d.visitTime : "06:00";
      try {
        createJob({
          customerId: d.customerId,
          subscriptionId: d.subscriptionId,
          scheduledDate: dateStr,
          timeSlot: safeSlot,
          status: "Unassigned",
          jobType: "Regular",
          packageName: d.packageName || "Urgent Wash",
          packageType: "urgent",
          frequency: "One-Time",
          vehicleDetails: { category: d.vehicleType || "hatchback", color: "", brand: "", registration: d.vehicleReg || "" },
          serviceDetails: { addOns: d.addOns || [], area: "", preferredTimeSlot: safeSlot, specialInstructions: "âš¡ URGENT â€” 1-hour arrival SLA" },
          cityId: d.cityId || "CITY-SURAT",
          notes: "Urgent wash â€” â‚¹100 premium paid. 1-hour TAT. Priority rank 2 (below multi-month bundle).",
          priorityRank: 2,
        } as any);
        console.log("[JobContext] Auto-created urgent wash job:", d.subscriptionId);
      } catch (err: any) {
        console.warn("[JobContext] Could not auto-create urgent job:", err?.message);
      }
    };
    window.addEventListener("cc360:urgent_wash_purchased", handleUrgentWash);
    return () => window.removeEventListener("cc360:urgent_wash_purchased", handleUrgentWash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for complimentary 2W job created â†’ reload jobs so washer/supervisor see it immediately
  useEffect(() => {
    const handleComplimentaryJob = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (!d?.jobId) return;
      // Re-load all jobs from storage so the new complimentary job appears
      try {
        const jobKey = `cleancar_${d.cityId || "CITY-SURAT"}_jobs`;
        const stored = JSON.parse(localStorage.getItem(jobKey) || "[]");
        setAllJobs(stored);
        console.log("[JobContext] Complimentary 2W job added to queue:", d.jobId);
      } catch(err) {
        console.warn("[JobContext] Could not reload jobs after complimentary job:", err);
      }
    };
    window.addEventListener("cc360:complimentary_job_created", handleComplimentaryJob);
    return () => window.removeEventListener("cc360:complimentary_job_created", handleComplimentaryJob);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // â”€â”€ DAILY SCHEDULER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Runs once per app session on mount. Handles all time-based background tasks:
  // 1. Advance bundle windows (Month 2, 3 activation + visit forfeiture)
  // 2. Check low visit reminders (1 visit left + â‰¤5 days in window)
  // 3. Weekly Sunday rating WA for monthly subscriptions
  // In production this would be a backend cron â€” for now it runs on app load.
  useEffect(() => {
    const runDailyScheduler = async () => {
      const today = new Date().toISOString().split("T")[0];
      const lastRun = localStorage.getItem("cc360_daily_scheduler_last_run");
      if (lastRun === today) return; // Already ran today this session
      localStorage.setItem("cc360_daily_scheduler_last_run", today);

      try {
        // 1. Advance bundle windows
        const { advanceBundleWindows, checkLowVisitReminders } = await import("../services/multiMonthBundleService");
        advanceBundleWindows();
        checkLowVisitReminders();
        console.info("[Scheduler] Bundle windows advanced and low-visit reminders checked");
      } catch(e) { console.warn("[Scheduler] Bundle scheduler error:", e); }

      try {
        // 2. Pack expiry reminders (7 days, 3 days, last day)
        const { sendPackExpiry7Days, sendPackExpiry3Days, sendPackExpiryLastDay } = await import("../services/whatsappService");
        const allSubs = DataService.get<any>("SUBSCRIPTIONS") || [];
        const allCustomers = DataService.get<any>("CUSTOMERS") || [];
        const reminded7  = new Set<string>(JSON.parse(localStorage.getItem("cc360_expiry_reminded_7d")  || "[]"));
        const reminded3  = new Set<string>(JSON.parse(localStorage.getItem("cc360_expiry_reminded_3d")  || "[]"));
        const remindedL  = new Set<string>(JSON.parse(localStorage.getItem("cc360_expiry_reminded_last") || "[]"));
        const todayDate  = new Date(today);

        allSubs.filter((s: any) => s.status === "Active" && s.visitsExpiry).forEach((s: any) => {
          const expiry    = new Date(s.visitsExpiry);
          const daysLeft  = Math.ceil((expiry.getTime() - todayDate.getTime()) / 86400000);
          const cust      = allCustomers.find((c: any) => c.customerId === s.customerId);
          if (!cust?.phone) return;
          const name      = cust.firstName || "Customer";
          const packName  = s.packageName || "Pack";
          const remaining = (s.visitsTotal || 0) - (s.visitsUsed || 0);

          if (daysLeft === 7 && !reminded7.has(s.subscriptionId)) {
            sendPackExpiry7Days(cust.phone, name, packName, s.visitsExpiry, remaining).catch(()=>{});
            reminded7.add(s.subscriptionId);
            localStorage.setItem("cc360_expiry_reminded_7d", JSON.stringify([...reminded7]));
          } else if (daysLeft === 3 && !reminded3.has(s.subscriptionId)) {
            sendPackExpiry3Days(cust.phone, name, packName, s.visitsExpiry, remaining).catch(()=>{});
            reminded3.add(s.subscriptionId);
            localStorage.setItem("cc360_expiry_reminded_3d", JSON.stringify([...reminded3]));
          } else if (daysLeft <= 0 && daysLeft >= -1 && !remindedL.has(s.subscriptionId)) {
            sendPackExpiryLastDay(cust.phone, name, packName, remaining).catch(()=>{});
            remindedL.add(s.subscriptionId);
            localStorage.setItem("cc360_expiry_reminded_last", JSON.stringify([...remindedL]));
          }
        });
        console.info("[Scheduler] Pack expiry reminders checked");
      } catch(e) { console.warn("[Scheduler] Pack expiry error:", e); }

      try {
        // 4. Generate tomorrow's jobs from active subscriptions (runs at 9 PM)
        const nowHour = new Date().getHours();
        const seedKey = `cc360_jobs_seeded_${today}`;
        // Run between 9 PM and 11 PM, once per day
        if (nowHour >= 21 && !localStorage.getItem(seedKey)) {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toISOString().split("T")[0];

          const activeSubs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions") || "[]")
            .filter((s: any) => s.status === "Active");
          const customers: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_customers") || "[]");
          const washers: any[] = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]")
            .filter((e: any) => e.designation === "Car Washer" && e.id.includes("SUR"));
          const existingJobs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");

          // Build pincodeâ†’washer map for round-robin assignment
          const washerByPin: Record<string, any[]> = {};
          washers.forEach((w: any) => {
            (w.pinCodes || ["395001"]).forEach((pin: string) => {
              const p = pin.replace("PIN-", "");
              if (!washerByPin[p]) washerByPin[p] = [];
              washerByPin[p].push(w);
            });
          });
          const washerIdx: Record<string, number> = {};

          const PKG_MAP: Record<string, string> = {
            Basic: "EXPRESS_WASH", SHINE: "EXPRESS_WASH",
            Standard: "SMART_WASH", PROTECT: "SMART_WASH",
            Premium: "ELITE_WASH", ELITE: "ELITE_WASH",
            EXPRESS_WASH: "EXPRESS_WASH", SMART_WASH: "SMART_WASH", ELITE_WASH: "ELITE_WASH",
          };
          const SLOTS = ["05:00 AM","05:30 AM","06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM"];

          const existingSubIds = new Set(
            existingJobs
              .filter((j: any) => j.scheduledDate === tomorrowStr)
              .map((j: any) => j.subscriptionId)
          );

          const newJobs: any[] = [];
          activeSubs.forEach((sub: any, i: number) => {
            if (existingSubIds.has(sub.subscriptionId)) return; // already have tomorrow's job
            const cust = customers.find((c: any) => c.customerId === sub.customerId) || {};
            const pin = (cust.pinCode || "395001").replace("PIN-", "");
            const available = washerByPin[pin] || washerByPin["395001"] || washers;
            if (!available || available.length === 0) return;

            const idx = washerIdx[pin] || 0;
            const washer = available[idx % available.length];
            washerIdx[pin] = idx + 1;

            const pkgType = PKG_MAP[sub.packageType || sub.packageName || ""] || "EXPRESS_WASH";
            const slotIdx = (washerIdx[pin] - 1) % SLOTS.length;

            newJobs.push({
              jobId: `JOB-${tomorrowStr}-${String(i).padStart(4, "0")}`,
              customerId: sub.customerId,
              subscriptionId: sub.subscriptionId,
              washerId: washer.id,
              scheduledDate: tomorrowStr,
              timeSlot: SLOTS[slotIdx],
              status: "Assigned", // Auto-assigned by pincode — washer sees immediately
              jobType: "Regular",
              packageName: pkgType,
              packageType: pkgType,
              customerName: `${cust.firstName || ""} ${cust.lastName || ""}`.trim() || sub.customerId,
              vehicleDetails: {
                category: sub.serviceDetails?.vehicleType || "Sedan",
                color: cust.vehicleColor || "White",
                brand: cust.vehicleBrand || "Maruti",
                registration: cust.vehicleReg || `GJ05${String(i).padStart(4, "0")}`,
              },
              location: {
                addressLine1: cust.address || "Surat",
                area: cust.area || "Adajan",
                city: "Surat",
                pinCode: pin,
              },
              serviceDetails: { addOns: sub.serviceDetails?.addOns || [], specialInstructions: "" },
              subscriptionStartDate: sub.startDate || "2026-01-01",
              cityId: "CITY-SURAT",
              city: "Surat",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });

          if (newJobs.length > 0) {
            localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...newJobs]));
            localStorage.setItem(seedKey, "1");
            console.info(`[Scheduler] Generated ${newJobs.length} jobs for ${tomorrowStr}`);

            // ── Supervisor bell notification ──────────────────────────────
            try {
              const supNotifKey = "SUPERVISOR_JOB_NOTIFICATIONS";
              const supNotifs = JSON.parse(localStorage.getItem(supNotifKey) || "[]");
              supNotifs.unshift({
                id: `NOTIF-JOBS-${tomorrowStr}`,
                type: "JOBS_SEEDED",
                title: `${newJobs.length} jobs assigned for tomorrow`,
                body: `${tomorrowStr} — All active subscription customers assigned to their washers`,
                date: tomorrowStr,
                jobCount: newJobs.length,
                washerSummary: washers.map((w: any) => ({
                  name: w.fullName || w.firstName,
                  count: newJobs.filter((j: any) => j.washerId === w.id).length,
                })).filter((w: any) => w.count > 0),
                read: false,
                createdAt: new Date().toISOString(),
              });
              localStorage.setItem(supNotifKey, JSON.stringify(supNotifs.slice(0, 30)));
            } catch(_) {}

            // ── Per-washer notifications ──────────────────────────────────
            washers.forEach((w: any) => {
              try {
                const myJobs = newJobs.filter((j: any) => j.washerId === w.id);
                if (myJobs.length === 0) return;
                const washerNotifKey = `WASHER_NOTIFICATIONS_${w.id}`;
                const washerNotifs = JSON.parse(localStorage.getItem(washerNotifKey) || "[]");
                washerNotifs.unshift({
                  id: `NOTIF-${w.id}-${tomorrowStr}`,
                  type: "JOBS_ASSIGNED",
                  title: `${myJobs.length} jobs scheduled for tomorrow`,
                  body: `${tomorrowStr} — Your wash schedule is ready. First job at ${myJobs[0]?.timeSlot || "05:00 AM"}.`,
                  date: tomorrowStr,
                  jobs: myJobs.map((j: any) => ({
                    jobId: j.jobId,
                    customerName: j.customerName,
                    timeSlot: j.timeSlot,
                    packageType: j.packageType,
                    area: j.location?.area,
                  })),
                  read: false,
                  createdAt: new Date().toISOString(),
                });
                localStorage.setItem(washerNotifKey, JSON.stringify(washerNotifs.slice(0, 50)));
              } catch(_) {}
            });

            // ── WhatsApp to each washer ───────────────────────────────────
            import("../services/whatsappService").then(ws => {
              washers.forEach((w: any) => {
                const myJobs = newJobs.filter((j: any) => j.washerId === w.id);
                if (myJobs.length === 0 || !w.mobile) return;
                const jobList = myJobs.slice(0, 5).map((j: any) =>
                  `${j.timeSlot} — ${j.customerName} (${(j.packageType||"").replace(/_/g," ")})`
                ).join("\n");
                const msg = `Hi ${w.fullName || w.firstName},\n\nTomorrow's schedule (${tomorrowStr}):\n${jobList}${myJobs.length > 5 ? `\n...and ${myJobs.length - 5} more` : ""}\n\nPlease check your app for full details.\n\n— 249 Carwashing`;
                try {
                  (ws as any).sendWhatsApp(w.mobile, msg);
                } catch(_) {}
              });
            }).catch(() => {});
          }
        }
      } catch(e) { console.warn("[Scheduler] Job seeder error:", e); }

      try {
        // 3. Weekly Sunday rating WA for monthly subscriptions
        const dayOfWeek = new Date().getDay(); // 0 = Sunday
        if (dayOfWeek === 0) {
          const lastSundayRating = localStorage.getItem("cc360_weekly_rating_last_sent");
          if (lastSundayRating !== today) {
            localStorage.setItem("cc360_weekly_rating_last_sent", today);
            const { sendWeeklyRatingRequest } = await import("../services/whatsappService");
            const customers = DataService.get<any>("CUSTOMERS") || [];
            const subs = DataService.get<any>("SUBSCRIPTIONS") || [];
            // Send to all active monthly subscription customers
            const activeMonthlyCustIds = new Set(
              subs.filter((s: any) => s.status === "Active" && s.billingCycle === "Monthly").map((s: any) => s.customerId)
            );
            customers.filter((c: any) => activeMonthlyCustIds.has(c.customerId) && c.phone).forEach((c: any) => {
              try {
                sendWeeklyRatingRequest({ customerPhone: c.phone, customerName: c.firstName || "Customer" });
              } catch {}
            });
            console.info(`[Scheduler] Weekly rating WA sent to ${activeMonthlyCustIds.size} customers`);
          }
        }
      } catch(e) { console.warn("[Scheduler] Weekly rating error:", e); }
    };

    // Catch-up seed: if no jobs for today exist, seed them now (handles missed 9 PM seed)
    const catchUpTimer = setTimeout(() => {
      try {
        const todayCatchUp = new Date().toISOString().split("T")[0];
        const catchUpKey = `cc360_catchup_seeded_${todayCatchUp}`;
        if (localStorage.getItem(catchUpKey)) return;
        const allJobsToday = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]")
          .filter((j: any) => j.scheduledDate === todayCatchUp && j.status === "Assigned");
        if (allJobsToday.length > 0) return; // Jobs exist — no catch-up needed

        const activeSubs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_subscriptions") || "[]")
          .filter((s: any) => s.status === "Active");
        const customers: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_customers") || "[]");
        const washers: any[] = JSON.parse(localStorage.getItem("EMPLOYEE_DATABASE_RECORDS") || "[]")
          .filter((e: any) => e.designation === "Car Washer" && e.id.includes("SUR"));
        const existingJobs: any[] = JSON.parse(localStorage.getItem("cleancar_CITY-SURAT_jobs") || "[]");
        const existingSubIds = new Set(existingJobs.filter((j: any) => j.scheduledDate === todayCatchUp).map((j: any) => j.subscriptionId));

        const PKG_MAP: Record<string, string> = {
          Basic:"EXPRESS_WASH",SHINE:"EXPRESS_WASH",Standard:"SMART_WASH",PROTECT:"SMART_WASH",
          Premium:"ELITE_WASH",ELITE:"ELITE_WASH",EXPRESS_WASH:"EXPRESS_WASH",SMART_WASH:"SMART_WASH",ELITE_WASH:"ELITE_WASH",
        };
        const SLOTS = ["05:00 AM","05:30 AM","06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM"];
        const washerByPin: Record<string, any[]> = {};
        washers.forEach((w: any) => {
          (w.pinCodes || ["395001"]).forEach((pin: string) => {
            const p = pin.replace("PIN-","");
            if (!washerByPin[p]) washerByPin[p] = [];
            washerByPin[p].push(w);
          });
        });
        const washerIdx: Record<string, number> = {};
        const catchUpJobs: any[] = [];

        activeSubs.forEach((sub: any, i: number) => {
          if (existingSubIds.has(sub.subscriptionId)) return;
          const cust = customers.find((c: any) => c.customerId === sub.customerId) || {};
          const pin = (cust.pinCode || "395001").replace("PIN-","");
          const available = washerByPin[pin] || washerByPin["395001"] || washers;
          if (!available?.length) return;
          const idx = washerIdx[pin] || 0;
          const washer = available[idx % available.length];
          washerIdx[pin] = idx + 1;
          const pkgType = PKG_MAP[sub.packageType || sub.packageName || ""] || "EXPRESS_WASH";
          catchUpJobs.push({
            jobId: `JOB-CATCHUP-${todayCatchUp}-${String(i).padStart(4,"0")}`,
            customerId: sub.customerId, subscriptionId: sub.subscriptionId,
            washerId: washer.id, scheduledDate: todayCatchUp,
            timeSlot: SLOTS[(washerIdx[pin]-1) % SLOTS.length],
            status: "Assigned", jobType: "Regular",
            packageName: pkgType, packageType: pkgType,
            customerName: `${cust.firstName||""} ${cust.lastName||""}`.trim() || sub.customerId,
            vehicleDetails: { category: sub.serviceDetails?.vehicleType||"Sedan", color:"White", brand:"Maruti", registration: cust.vehicleReg||`GJ05${String(i).padStart(4,"0")}` },
            location: { addressLine1: cust.address||"Surat", area: cust.area||"Adajan", city:"Surat", pinCode: pin },
            serviceDetails: { addOns: sub.serviceDetails?.addOns||[], specialInstructions:"" },
            subscriptionStartDate: sub.startDate||"2026-01-01",
            cityId:"CITY-SURAT", city:"Surat",
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          });
        });

        if (catchUpJobs.length > 0) {
          localStorage.setItem("cleancar_CITY-SURAT_jobs", JSON.stringify([...existingJobs, ...catchUpJobs]));
          localStorage.setItem(catchUpKey, "1");
          console.info(`[Catch-up Seeder] Generated ${catchUpJobs.length} jobs for ${todayCatchUp}`);

          // Supervisor notification
          try {
            const supNotifs = JSON.parse(localStorage.getItem("SUPERVISOR_JOB_NOTIFICATIONS")||"[]");
            supNotifs.unshift({ id:`NOTIF-CATCHUP-${todayCatchUp}`, type:"JOBS_SEEDED",
              title:`${catchUpJobs.length} jobs assigned for today (catch-up)`,
              body:`${todayCatchUp} — Jobs generated on app open (missed 9 PM schedule)`,
              date: todayCatchUp, jobCount: catchUpJobs.length, read: false, createdAt: new Date().toISOString() });
            localStorage.setItem("SUPERVISOR_JOB_NOTIFICATIONS", JSON.stringify(supNotifs.slice(0,30)));
          } catch(_) {}

          // Per-washer notifications
          washers.forEach((w: any) => {
            try {
              const myJobs = catchUpJobs.filter((j: any) => j.washerId === w.id);
              if (!myJobs.length) return;
              const nKey = `WASHER_NOTIFICATIONS_${w.id}`;
              const nList = JSON.parse(localStorage.getItem(nKey)||"[]");
              nList.unshift({ id:`NOTIF-CATCHUP-${w.id}-${todayCatchUp}`, type:"JOBS_ASSIGNED",
                title:`${myJobs.length} jobs ready for today`, body:`Your wash schedule for ${todayCatchUp} is ready.`,
                date: todayCatchUp, jobs: myJobs.map((j: any) => ({ jobId:j.jobId, customerName:j.customerName, timeSlot:j.timeSlot, packageType:j.packageType })),
                read: false, createdAt: new Date().toISOString() });
              localStorage.setItem(nKey, JSON.stringify(nList.slice(0,50)));
            } catch(_) {}
          });
        }
      } catch(e) { console.warn("[Catch-up Seeder] Error:", e); }
    }, 5000); // Run 5 seconds after mount

    // Run after a short delay to avoid blocking initial render
    const timer = setTimeout(runDailyScheduler, 3000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived state â€” memoized so consumers only re-render when allJobs actually changes
  const unassignedJobs = useMemo(() =>
    allJobs.filter((j) => j.status === "Unassigned"), [allJobs]);

  const assignedJobs = useMemo(() =>
    allJobs.filter((j) =>
      j.status === "Assigned" || j.status === "Acknowledged" || j.status === "In Progress"
    ), [allJobs]);

  const completedJobs = useMemo(() =>
    allJobs.filter((j) => j.status === "Completed" || j.status === "Verified"), [allJobs]);

  // City-scoped helpers â€” useCallback for stable references
  const getJobsByCityId    = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => j.cityId === cityId), [allJobs]);
  const getUnassignedByCity = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => j.status === "Unassigned" && j.cityId === cityId), [allJobs]);
  const getAssignedByCity   = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => ["Assigned","Acknowledged","In Progress"].includes(j.status) && j.cityId === cityId), [allJobs]);
  const getCompletedByCity  = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => ["Completed","Verified"].includes(j.status) && j.cityId === cityId), [allJobs]);

  const createJob = (jobData: Omit<Job, "jobId" | "createdAt" | "updatedAt">): Job => {
    // âœ… BUSINESS RULE: No jobs on Sunday (absolute rest day)
    if (jobData.scheduledDate) {
      const dayOfWeek = new Date(jobData.scheduledDate).getDay();
      if (dayOfWeek === 0) {
        throw new Error("Sunday is an absolute rest day â€” no jobs can be scheduled.");
      }
    }

    // âœ… BUSINESS RULE: Jobs must be within wash band 05:00â€“09:00
    if (jobData.timeSlot) {
      const hour = parseInt((jobData.timeSlot).split(":")[0], 10);
      if (hour < 5 || hour >= 9) {
        throw new Error("Jobs must be scheduled within the wash band: 05:00â€“09:00.");
      }
    }

    const newJob: Job = {
      ...jobData,
      jobId: `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAllJobs((prev) => [...prev, newJob]);
    // G3 FIX: emit JOB_CREATED so Inventory, Finance, Supervisor get the signal
    emit('JOB_CREATED', {
      jobId: newJob.jobId, customerId: newJob.customerId,
      cityId: newJob.cityId, packageType: newJob.packageType,
      amount: newJob.amount ?? 0, scheduledDate: newJob.scheduledDate,
    });
    return newJob;
  };

  const updateJob = (jobId: string, updates: Partial<Job>) => {
    setAllJobs((prev) =>
      prev.map((job) =>
        job.jobId === jobId
          ? { ...job, ...updates, updatedAt: new Date().toISOString() }
          : job
      )
    );
  };

  const deleteJob = (jobId: string) => {
    setAllJobs((prev) => prev.filter((j) => j.jobId !== jobId));
  };

  const assignJobToWasher = (jobId: string, washerId: string, washerName?: string) => {
    const job = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, {
      washerId,
      washerName: washerName || washerId,
      status: "Assigned",
      assignedAt: new Date().toISOString(),
    });

    // Emit event
    if (job) {
      emit("JOB_ASSIGNED", {
        jobId,
        washerId,
        washerName: washerName || washerId,
        customerName: job.customerName || job.customerId,
        scheduledDate: job.scheduledDate,
      }, "JobContext");
      // NOTE: Stage 2 WA (Booking Confirmed) fires in acknowledgeJob()
      // when the WASHER acknowledges â€” not here on supervisor assign.
      // Per customer journey doc: Stage 2 fires only after BOTH supervisor assigns AND washer accepts.
    }
  };

  const unassignJob = (jobId: string) => {
    updateJob(jobId, {
      washerId: undefined,
      status: "Unassigned",
      assignedAt: undefined,
    });
  };

  const acknowledgeJob = (jobId: string) => {
    const job = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, {
      status: "Acknowledged",
      acknowledgedAt: new Date().toISOString(),
    });
    // WA3: Stage 2 â€” Booking Confirmed WA fires HERE (washer has acknowledged)
    // Per customer journey doc: fires only after BOTH supervisor assigns AND washer accepts.
    if (job) {
      try {
        const customers: any[] = DataService.get<any>("CUSTOMERS") || [];
        const cust = customers.find((c: any) => c.customerId === job.customerId);
        if (cust?.phone) {
          sendBookingConfirmed({
            customerPhone: cust.phone,
            customerName: cust.firstName || "Customer",
            planLabel: job.packageName || "Wash",
            slot: job.timeSlot || (job as any).scheduledTime || "Morning",
            supervisorName: "",
            supervisorPhone: "",
          });
        }
      } catch {}
    }
  };

  const startJob = (jobId: string) => {
    const job = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, {
      status: "In Progress",
      startedAt: new Date().toISOString(),
    });
    // WA4: Washer Arrived notification
    if (job) {
      try {
        const customers: any[] = DataService.get<any>("CUSTOMERS") || [];
        const cust = customers.find((c: any) => c.customerId === job.customerId);
        if (cust?.phone) {
          sendWasherArrived({
            customerPhone: cust.phone,
            customerName: cust.firstName || "Customer",
            washerName: job.washerName || "your washer",
            trackingUrl: `https://249carwashing.genxa.in/track/${job.jobId}`,
            supervisorPhone: "",
          });
        }
      } catch {}
    }
  };

  const completeJob = (
    jobId: string,
    verificationData?: { qualityScore: number; complianceScore: number },
    photoData?: { beforePhotoUrl?: string; afterPhotoUrl?: string }
  ) => {
    const job = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, {
      status: "Completed",
      completedAt: new Date().toISOString(),
      verificationStatus: "pending",
      ...(verificationData || {}),
    });

    // Emit JOB_COMPLETED event
    if (job) {
      emit("JOB_COMPLETED", {
        jobId,
        washerId:    job.washerId,
        washerName:  job.washerName || job.washerId || "Unknown Washer",
        customerId:  job.customerId,
        customerName:job.customerName,
        packageName: job.packageName,
        amount:      job.amount || 0,       // â† revenue amount now flows through
        cityId:      job.cityId,
        qualityScore:  verificationData?.qualityScore,
        complianceScore: verificationData?.complianceScore,
        completedAt: new Date().toISOString(),
      }, "JobContext");

      // Record first wash date to start validity clock
      if (job.subscriptionId) {
        const isFirstWash = !allJobs.some(j =>
          j.customerId === job.customerId &&
          j.jobId !== job.jobId &&
          j.status === "Completed"
        );
        recordFirstWashDate(job.subscriptionId, new Date().toISOString().split("T")[0]);

        // G5: Credit referral reward on FIRST completed wash (not at checkout)
        if (isFirstWash) {
          try {
            import("../services/planSyncService").then(({ planSyncService }) => {
              const records = planSyncService.getReferralRecords ? planSyncService.getReferralRecords() : [];
              const pending = records.find((r: any) =>
                r.refereeCustomerId === job.customerId && r.status === "converted_pending_wash"
              );
              if (pending) {
                planSyncService.convertReferral(
                  pending.referralCode,
                  job.customerId,
                  job.customerName || job.customerId,
                  0
                );
              }
            });
          } catch {}
        }
      }

      // Multi-month bundle: record visit, recognise deferred revenue
      if (job.subscriptionId) {
        const bundle = getBundleBySubscriptionId(job.subscriptionId);
        if (bundle) {
          if (!bundle.firstWashDate) {
            recordBundleFirstWash(bundle.bundleId, new Date().toISOString().split("T")[0]);
          }
          recordBundleVisit(bundle.bundleId, job.jobId || "");
        }
      }

      // Complimentary 2W wash: mark offer as completed
      if (job.offerId && job.isComplimentary) {
        markOfferCompleted(job.offerId);
      }

      // 7-day upsell for one-time
      if (job.frequency === "One-Time" || job.frequency === "One-time") {
        createUpsellTask({ customerId: job.customerId, customerName: job.customerName || "", customerPhone: job.customerPhone || "", jobId, planLabel: job.packageName || "One-Time Wash", cityId: job.cityId || "CITY-SURAT", completedAt: new Date().toISOString() });
      }

      // Pack visit counter: decrement visitsUsed when a pack job completes
      if (job.subscriptionId) {
        const allSubs: any[] = DataService.get<any>("SUBSCRIPTIONS", job.cityId);
        const subIdx = allSubs.findIndex((s:any) => s.subscriptionId === job.subscriptionId);
        if (subIdx >= 0 && allSubs[subIdx].visitsTotal !== undefined) {
          const newUsed = (allSubs[subIdx].visitsUsed || 0) + 1;
          const remaining = allSubs[subIdx].visitsTotal - newUsed;
          allSubs[subIdx].visitsUsed = newUsed;
          allSubs[subIdx].status = remaining <= 0 ? "Exhausted" : "Active";
          DataService.setAll("SUBSCRIPTIONS", allSubs, job.cityId);
          if (remaining === 1) {
            emit("PACK_VISIT_LOW", {
              customerId:      job.customerId,
              subscriptionId:  job.subscriptionId,
              packageName:     job.packageName,
              customerName:    job.customerName,
              message: `${job.customerName} has 1 ${job.packageName} visit remaining â€” convert to monthly`,
            }, "JobContext");
            createPackUpsellTask({ customerId: job.customerId, customerName: job.customerName||"", customerPhone: job.customerPhone||"", subscriptionId: job.subscriptionId||"", packageName: job.packageName||"Pack", trigger: "PACK_VISIT_LOW", cityId: job.cityId||"CITY-SURAT" });
            // WA: Pack visit low notification to customer
            try {
              const customers = DataService.get<any>("CUSTOMERS");
              const cust = customers.find((c:any) => c.customerId === job.customerId);
              if (cust?.phone) {
                sendPackVisitLow(cust.phone, cust.firstName || "Customer", job.packageName || "Pack", 1);
              }
            } catch {}
          }
          if (remaining <= 0) {
            emit("PACK_EXHAUSTED", {
              customerId:     job.customerId,
              subscriptionId: job.subscriptionId,
              packageName:    job.packageName,
            }, "JobContext");
            // Send WA to customer: pack complete
            try {
              const customers = DataService.get<any>("CUSTOMERS");
              const cust = customers.find((c:any) => c.customerId === job.customerId);
              if (cust?.phone) {
                import("../services/whatsappService").then(({sendWhatsApp}) => {
                  sendWhatsApp(cust.phone,
                    `Hi ${cust.firstName || ""}! Your ${job.packageName || "wash pack"} is complete. All visits have been used. Book your next wash at 249carwashing.genxa.in/buy â€” 249 Carwashing`,
                    "pack_visit_reminder"
                  );
                });
              }
            } catch {}
          }
        }
      }
      // G1: Check for 3 consecutive company failures
      if (job.status === "Failed" && job.subscriptionId) {
        try {
          const sortedJobs = allJobs
            .filter(j => j.subscriptionId === job.subscriptionId && j.scheduledDate)
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
          const lastThree = sortedJobs.slice(-3);
          if (lastThree.length === 3 && lastThree.every(j => j.status === "Failed")) {
            const flags = JSON.parse(localStorage.getItem("cleancar_company_failure_flags") || "[]");
            flags.push({
              subscriptionId: job.subscriptionId,
              customerId: job.customerId,
              flaggedAt: new Date().toISOString(),
              failedJobIds: lastThree.map(j => j.jobId),
              status: "PENDING_REVIEW",
              notes: "3 consecutive failed deliveries â€” eligible for company-failure refund",
            });
            localStorage.setItem("cleancar_company_failure_flags", JSON.stringify(flags));
          }
        } catch {}
      }

      // Fix 3 & 4: Send WA on wash completion + rating request
      if (job) {
        try {
          const customers = DataService.get<any>("CUSTOMERS");
          const cust = customers?.find((c:any) => c.customerId === job.customerId);
          if (cust?.phone) {
            const allSubs2: any[] = DataService.get<any>("SUBSCRIPTIONS", job.cityId) || [];
            const sub = allSubs2.find((s:any) => s.subscriptionId === job.subscriptionId);
            const isMonthly = sub && (sub.frequency === "Daily" || sub.frequency === "Alternate Days" || sub.frequency === "Weekly");
            const isPack = sub && (sub.packageType === "PACK_2" || sub.packageType === "PACK_4");
            const isOneTime = !sub || sub.packageType === "ONE_TIME" || sub.frequency === "One-Time";

            const visitsLeft = isPack
              ? Math.max(0, (sub.visitsTotal || 0) - (sub.visitsUsed || 0))
              : undefined;

            import("../services/whatsappService").then(ws => {
              // Wash completed message
              ws.sendWashCompleted({
                customerPhone: cust.phone,
                customerName: cust.firstName || "Customer",
                planLabel: job.packageName || "Wash",
                serviceType: isMonthly ? "SUBSCRIPTION" : isPack ? "PACK" : "ONE_TIME",
                visitsRemaining: visitsLeft,
              });

              // Rating request: for pack/one-time immediately; monthly is handled by Sunday cron
              if (!isMonthly) {
                ws.sendRatingRequest({
                  customerPhone: cust.phone,
                  customerName: cust.firstName || "Customer",
                  jobId: job.jobId,
                  planLabel: job.packageName || "Wash",
                });
              }
              // Fix 6b: Before/After WA now sent live from WasherContext.addPhoto() the
              // moment both photos are submitted, independent of job completion timing.
              // (Removed the old completion-time send here to avoid sending it twice.)
            });
          }
        } catch {}
      }
    }
  };

  const markJobAsVerified = (jobId: string, verificationStatus: "verified" | "flagged" | "failed") => {
    const job = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, {
      status: verificationStatus === "verified" ? "Verified" : "Completed",
      verificationStatus,
      verifiedAt: new Date().toISOString(),
      qaRequired: verificationStatus === "flagged",
    });

    // Emit JOB_VERIFIED event
    if (job) {
      emit("JOB_VERIFIED", {
        jobId,
        verificationStatus,
        qualityScore: job.qualityScore,
        complianceScore: job.complianceScore,
        qaRequired: verificationStatus === "flagged",
      }, "JobContext");
    }
  };

  const markJobAsFailed = (jobId: string, reason: string, reschedule: boolean) => {
    const failed = allJobs.find(j => j.jobId === jobId);
    updateJob(jobId, { status: "Failed", failureReason: reason, rescheduleRequested: reschedule });

    if (reschedule && failed) {
      // Schedule replacement for next day
      const nextDate = new Date(new Date(failed.scheduledDate).getTime() + 86400000)
        .toISOString().split("T")[0];
      createJob({
        ...failed,
        scheduledDate: nextDate,
        status: "Unassigned",
        washerId: undefined,
        assignedAt: undefined,
        startedAt: undefined,
        completedAt: undefined,
        verificationStatus: undefined,
        failureReason: undefined,
        rescheduleRequested: false,
        qaAuditId: undefined,
      });
    }
  };

  const generateJobsFromSubscription = (
    subscriptionId: string,
    customerId: string,
    count: number,
    subscriptionData?: {
      packageName?: string;
      vehicleCategory?: string;
      vehicleRegistration?: string;
      vehicleBrand?: string;
      vehicleColor?: string;
      area?: string;
      addressLine1?: string;
      pinCode?: string;
      city?: string;
      cityId?: string;
      amount?: number;
      customerName?: string;
      customerPhone?: string;
      timeSlot?: string;
    }
  ): Job[] => {
    const generatedJobs: Job[] = [];
    for (let i = 0; i < count; i++) {
      const job = createJob({
        customerId,
        subscriptionId,
        scheduledDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        timeSlot: subscriptionData?.timeSlot || "07:00 - 08:00",
        status: "Unassigned",
        jobType: "Regular",
        packageName:   subscriptionData?.packageName || "Standard Package",
        customerName:  subscriptionData?.customerName,
        customerPhone: subscriptionData?.customerPhone,
        amount:        subscriptionData?.amount,
        cityId:        subscriptionData?.cityId || "CITY-SURAT",
        city:          subscriptionData?.city || "Surat",
        area:          subscriptionData?.area,
        pinCode:       subscriptionData?.pinCode,
        vehicleType:   subscriptionData?.vehicleCategory,
        vehicleReg:    subscriptionData?.vehicleRegistration,
        units: 1,
        vehicleDetails: {
          category:     subscriptionData?.vehicleCategory || "Sedan",
          color:        subscriptionData?.vehicleColor    || "Unknown",
          brand:        subscriptionData?.vehicleBrand    || "Unknown",
          registration: subscriptionData?.vehicleRegistration || "Unknown",
        },
        location: {
          addressLine1: subscriptionData?.addressLine1 || "Address from customer profile",
          area:         subscriptionData?.area    || "Unknown",
          city:         subscriptionData?.city    || "Surat",
          pinCode:      subscriptionData?.pinCode || "000000",
        },
        serviceDetails: {},
      });
      generatedJobs.push(job);
    }
    return generatedJobs;
  };

  const getJobById = (jobId: string): Job | undefined => {
    return allJobs.find((j) => j.jobId === jobId);
  };

  const getJobsByCustomerId = (customerId: string): Job[] => {
    return allJobs.filter((j) => j.customerId === customerId);
  };

  const getJobsByWasherId = (washerId: string): Job[] => {
    return allJobs.filter((j) => j.washerId === washerId);
  };

  const getJobsByStatus = (status: Job["status"]): Job[] => {
    return allJobs.filter((j) => j.status === status);
  };

  const getJobsForDate = (date: string): Job[] => {
    return allJobs.filter((j) => j.scheduledDate === date);
  };

  const jobContextValue = useMemo(() => ({
    allJobs,
    unassignedJobs,
    assignedJobs,
    completedJobs,
    createJob,
    updateJob,
    deleteJob,
    assignJobToWasher,
    unassignJob,
    acknowledgeJob,
    startJob,
    completeJob,
    markJobAsVerified,
    markJobAsFailed,
    generateJobsFromSubscription,
    getJobById,
    getJobsByCustomerId,
    getJobsByWasherId,
    getJobsByStatus,
    getJobsForDate,
    getJobsByCityId,
    getUnassignedByCity,
    getAssignedByCity,
    getCompletedByCity,
  }), [allJobs, unassignedJobs, assignedJobs, completedJobs,
       getJobsByCityId, getUnassignedByCity, getAssignedByCity, getCompletedByCity]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <JobContext.Provider value={jobContextValue}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (!context) {
    // PREVIEW FALLBACK: Safe no-op defaults for Figma Make iframe and dev HMR
    { // Always return safe fallback in all environments
      const noop = () => {};
      return {
        allJobs: [], unassignedJobs: [], assignedJobs: [], completedJobs: [],
        createJob: noop, updateJob: () => {}, deleteJob: () => {},
        assignJobToWasher: () => {}, unassignJob: () => {},
        acknowledgeJob: () => {}, startJob: () => {}, completeJob: () => {},
        markJobAsVerified: () => {}, markJobAsFailed: () => {},
        generateJobsFromSubscription: () => [], getJobById: () => undefined,
        getJobsByCustomerId: () => [], getJobsByWasherId: () => [],
        getJobsByStatus: () => [], getJobsForDate: () => [],
        getJobsByCityId: () => [], getUnassignedByCity: () => [],
        getAssignedByCity: () => [], getCompletedByCity: () => [],
      } as JobContextType;
    }
    console.warn("[useJobs] Called outside JobProvider â€” returning fallback"); return {} as any; // safe fallback
  }
  return context;
}


