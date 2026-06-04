/**
 * JobContext - SINGLE SOURCE OF TRUTH for all job/work order data
 * Used across: Operations, Washer App, Supervisor Dashboard, Finance
 */

import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback, useRef} from "react";
import { useEvents } from "./EventSystem";
import { DataService } from "../services/DataService";
import { logger } from "../services/logger";
import { useSync } from "../hooks/useSync";

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
    updateJob(jobId, {
      status: "Acknowledged",
      acknowledgedAt: new Date().toISOString(),
    });
  };

  const startJob = (jobId: string) => {
    updateJob(jobId, {
      status: "In Progress",
      startedAt: new Date().toISOString(),
    });
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
    if (import.meta.hot || !import.meta.env?.PROD) {
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
    console.warn("[useJobs] Called outside JobProvider — returning fallback"); return context as any;
  }
  return context;
}
