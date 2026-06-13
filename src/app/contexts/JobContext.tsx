/**
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
import { sendBookingConfirmed, sendWasherArrived, sendWashCompleted, sendRatingRequest, sendPackVisitLow } from "../services/whatsappService";

// Types
export interface Job {
  jobId: string;
  customerId: string; // GLOBAL IDENTITY - links to CustomerContext
  subscriptionId?: string; // Links to CustomerSubscriptionContext if from subscription
  washerId?: string; // GLOBAL IDENTITY - links to HRDataContext (employeeId)
  scheduledDate: string;
  timeSlot: string;
  status: "Unassigned" | "Assigned" | "Acknowledged" | "In Progress" | "Completed" | "Verified" | "Failed";
  jobType: "One-Time Demo" | "Subscription Demo" | "Regular" | "Add-on";
  packageName: string;
  packageType?: string;
  frequency?: string;
  offerId?: string;          // links to complimentary offer
  isComplimentary?: boolean; // true for complimentary 2W wash
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
  rescheduleRequested?: boolean;

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
  amount?: number;     // price charged for this job — used in JOB_COMPLETED event

  // Priority scheduling
  // 1 = Multi-month bundle (highest — paid bulk upfront, 1-hr TAT guaranteed)
  // 2 = Urgent wash (paid ₹100 premium, 1-hr TAT)
  // 3 = Regular job
  // When both bundle and urgent come in simultaneously, bundle (rank 1) wins — per business decision C2.
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
  completeJob: (jobId: string, verificationData?: { qualityScore: number; complianceScore: number }) => void;
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
    return stored;
  });

  const _dbJobsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { emit } = useEvents();

  // Persist to storage (local cache - instant)
    // Re-hydrate from localStorage after Supabase data loads
  useEffect(() => {
    const timer = setTimeout(() => {
      const stored_allJobs = DataService.get<Job>("JOBS");
      if (stored_allJobs.length > allJobs.length) { setAllJobs(stored_allJobs); }
    }, 1000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (_dbJobsTimer.current) clearTimeout(_dbJobsTimer.current);
    _dbJobsTimer.current = setTimeout(() => {
      if (allJobs.length > 0) DataService.setAll("JOBS", allJobs.slice(-50));
    }, 500);
  }, [allJobs]);

  // Backend sync (background, non-blocking)
  useSync("JOBS", allJobs);

  // Listen for new subscription → auto-create first job
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

  // Listen for pack purchase → auto-create first visit job
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
          frequency: d.frequency,
          vehicleDetails: { category: d.vehicleType || "hatchback", color: "", brand: "", registration: d.vehicleReg || "" },
          serviceDetails: { addOns: d.addOns || [], area: "", preferredTimeSlot: safeSlot },
          cityId: d.cityId || "CITY-SURAT",
          notes: `Pack visit 1/${d.totalVisits} — auto from ${d.subscriptionId}`,
          priorityRank: 1, // Multi-month bundle — highest priority (C2 decision: bundle > urgent wash)
        } as any);
        console.log("[JobContext] Auto-created pack visit job:", d.subscriptionId);
      } catch (err: any) {
        console.warn("[JobContext] Could not auto-create pack job:", err?.message);
      }
    };
    window.addEventListener("cc360:pack_purchased", handlePackPurchase);
    return () => window.removeEventListener("cc360:pack_purchased", handlePackPurchase);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for urgent wash purchase → auto-create job with priorityRank 2
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
          serviceDetails: { addOns: d.addOns || [], area: "", preferredTimeSlot: safeSlot, specialInstructions: "⚡ URGENT — 1-hour arrival SLA" },
          cityId: d.cityId || "CITY-SURAT",
          notes: "Urgent wash — ₹100 premium paid. 1-hour TAT. Priority rank 2 (below multi-month bundle).",
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

  // Listen for complimentary 2W job created → reload jobs so washer/supervisor see it immediately
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

  // ── DAILY SCHEDULER ──────────────────────────────────────────────────────────
  // Runs once per app session on mount. Handles all time-based background tasks:
  // 1. Advance bundle windows (Month 2, 3 activation + visit forfeiture)
  // 2. Check low visit reminders (1 visit left + ≤5 days in window)
  // 3. Weekly Sunday rating WA for monthly subscriptions
  // In production this would be a backend cron — for now it runs on app load.
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

    // Run after a short delay to avoid blocking initial render
    const timer = setTimeout(runDailyScheduler, 3000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived state — memoized so consumers only re-render when allJobs actually changes
  const unassignedJobs = useMemo(() =>
    allJobs.filter((j) => j.status === "Unassigned"), [allJobs]);

  const assignedJobs = useMemo(() =>
    allJobs.filter((j) =>
      j.status === "Assigned" || j.status === "Acknowledged" || j.status === "In Progress"
    ), [allJobs]);

  const completedJobs = useMemo(() =>
    allJobs.filter((j) => j.status === "Completed" || j.status === "Verified"), [allJobs]);

  // City-scoped helpers — useCallback for stable references
  const getJobsByCityId    = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => j.cityId === cityId), [allJobs]);
  const getUnassignedByCity = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => j.status === "Unassigned" && j.cityId === cityId), [allJobs]);
  const getAssignedByCity   = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => ["Assigned","Acknowledged","In Progress"].includes(j.status) && j.cityId === cityId), [allJobs]);
  const getCompletedByCity  = useCallback((cityId: string): Job[] =>
    allJobs.filter(j => ["Completed","Verified"].includes(j.status) && j.cityId === cityId), [allJobs]);

  const createJob = (jobData: Omit<Job, "jobId" | "createdAt" | "updatedAt">): Job => {
    // ✅ BUSINESS RULE: No jobs on Sunday (absolute rest day)
    if (jobData.scheduledDate) {
      const dayOfWeek = new Date(jobData.scheduledDate).getDay();
      if (dayOfWeek === 0) {
        throw new Error("Sunday is an absolute rest day — no jobs can be scheduled.");
      }
    }

    // ✅ BUSINESS RULE: Jobs must be within wash band 05:00–09:00
    if (jobData.timeSlot) {
      const hour = parseInt((jobData.timeSlot).split(":")[0], 10);
      if (hour < 5 || hour >= 9) {
        throw new Error("Jobs must be scheduled within the wash band: 05:00–09:00.");
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
      // when the WASHER acknowledges — not here on supervisor assign.
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
    // WA3: Stage 2 — Booking Confirmed WA fires HERE (washer has acknowledged)
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
    verificationData?: { qualityScore: number; complianceScore: number }
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
        amount:      job.amount || 0,       // ← revenue amount now flows through
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
              message: `${job.customerName} has 1 ${job.packageName} visit remaining — convert to monthly`,
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
                    `Hi ${cust.firstName || ""}! Your ${job.packageName || "wash pack"} is complete. All visits have been used. Book your next wash at 249carwashing.genxa.in/buy — 249 Carwashing`,
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
              notes: "3 consecutive failed deliveries — eligible for company-failure refund",
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
      const noop = () => { throw new Error("JobContext not available in preview"); };
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
    console.warn("[useJobs] Called outside JobProvider — returning fallback"); return {} as any; // safe fallback
  }
  return context;
}

