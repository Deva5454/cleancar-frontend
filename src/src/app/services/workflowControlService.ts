/**
 * Workflow Control Service
 * Manages strict execution flow with AI validation and job locking
 * ZERO bypass allowed - enforced at service layer
 */

import type {
  WorkflowState,
  JobLock,
  ActiveJobWorkflow,
  WorkflowTask,
  TaskStatus,
  AIValidationResult,
  AIValidationType,
  PhotoValidation,
  PhotoCaptureState,
  WorkflowAlert,
  AlertType,
  SLATracker,
  TaskExecutionControl,
  ValidationError,
} from "../types/workflowControl";

class WorkflowControlService {
  private workflowState: WorkflowState;
  private listeners: ((state: WorkflowState) => void)[] = [];

  constructor() {
    this.workflowState = this.initializeState();
  }

  private initializeState(): WorkflowState {
    return {
      userId: "WASHER-001",
      userName: "Rahul Verma",
      isCheckedIn: false,
      checkInTime: null,
      checkInValidation: null,
      jobLock: {
        isLocked: false,
        activeJobId: null,
        lockedAt: null,
        lockedBy: "",
        reason: "",
        canUnlock: false,
      },
      activeJob: null,
      sla: null,
      coverVisibility: {
        baseUnitsCompleted: 0,
        coverUnitsAssigned: 5,
        threshold: 25,
        isCoverVisible: false,
        coverJobs: [],
      },
      activeAlerts: [],
      offlineMode: {
        isOffline: false,
        pendingValidations: [],
        syncQueue: [],
        lastSyncTime: null,
      },
      abandonedJobs: [],
    };
  }

  // ==================== STATE MANAGEMENT ====================

  subscribe(listener: (state: WorkflowState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.workflowState));
  }

  getState(): WorkflowState {
    return { ...this.workflowState };
  }

  // ==================== CHECK-IN WITH AI VALIDATION ====================

  async checkIn(
    selfiePhotoUrl: string,
    firstCarPhotoUrl: string,
    gpsLocation: { latitude: number; longitude: number }
  ): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate selfie
    const selfieValidation = await this.validatePhoto(selfiePhotoUrl, "FACE_DETECTION", {});
    if (!selfieValidation.success) {
      errors.push("Face not detected in selfie");
    }

    // Validate first car photo
    const carValidation = await this.validatePhoto(firstCarPhotoUrl, "NUMBER_PLATE", {});
    if (!carValidation.success) {
      errors.push("Vehicle number plate not detected");
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Check-in successful
    const checkInTime = new Date().toISOString();
    this.workflowState.isCheckedIn = true;
    this.workflowState.checkInTime = checkInTime;
    this.workflowState.checkInValidation = {
      selfiePhoto: this.createPhotoValidation(selfiePhotoUrl, [selfieValidation]),
      firstCarPhoto: this.createPhotoValidation(firstCarPhotoUrl, [carValidation]),
      gpsLocation: {
        ...gpsLocation,
        accuracy: 10,
        timestamp: checkInTime,
      },
      isValid: true,
      validationErrors: [],
    };

    // Initialize SLA tracker
    const firstWashDeadline = new Date(new Date(checkInTime).getTime() + 5 * 60 * 1000); // 5 minutes
    this.workflowState.sla = {
      checkInTime,
      firstWashDeadline: firstWashDeadline.toISOString(),
      hasStartedFirstWash: false,
      isDelayed: false,
      delayMinutes: 0,
      totalWashesCompleted: 0,
      averageWashTime: 0,
    };

    // Create first wash alert
    this.createAlert("FIRST_WASH_START", "HIGH", "Start Your First Wash", "You have 5 minutes to start your first wash", true);

    this.notifyListeners();
    return { success: true, errors: [] };
  }

  // ==================== AI VALIDATION ====================

  async validatePhoto(
    photoUrl: string,
    validationType: AIValidationType,
    context: any
  ): Promise<AIValidationResult> {
    // Simulate AI validation (in production, call actual AI service)
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate processing

    // Mock validation logic
    const confidence = Math.random();
    const success = confidence > 0.7; // 70% confidence threshold

    const result: AIValidationResult = {
      success,
      validationType,
      confidence,
      errors: success ? [] : [`${validationType} validation failed`],
      warnings: confidence > 0.7 && confidence < 0.85 ? ["Low confidence"] : [],
      timestamp: new Date().toISOString(),
      metadata: this.generateValidationMetadata(validationType, success),
    };

    return result;
  }

  private generateValidationMetadata(type: AIValidationType, success: boolean): any {
    switch (type) {
      case "FACE_DETECTION":
        return { faceDetected: success };
      case "NUMBER_PLATE":
        return { detectedPlate: success ? "GJ01AB1234" : null };
      case "VEHICLE_DETECTION":
        return { vehicleType: success ? "SEDAN" : null };
      case "LOCATION_MATCH":
        return { locationMatch: success };
      case "DUPLICATE_CHECK":
        return { duplicateDetected: !success };
      default:
        return {};
    }
  }

  private createPhotoValidation(
    photoUrl: string,
    validationResults: AIValidationResult[]
  ): PhotoValidation {
    return {
      photoId: `PHOTO-${Date.now()}`,
      photoUrl,
      capturedAt: new Date().toISOString(),
      status: validationResults.every((r) => r.success) ? "SUCCESS" : "FAILED",
      validationResults,
      isValid: validationResults.every((r) => r.success),
      retryCount: 0,
      maxRetries: 3,
    };
  }

  // ==================== JOB LOCKING ====================

  lockJob(jobId: string, vehicleRegNo: string): { success: boolean; error?: string } {
    // Check if another job is already locked
    if (this.workflowState.jobLock.isLocked && this.workflowState.jobLock.activeJobId !== jobId) {
      return {
        success: false,
        error: "Complete current job first. Only one job can be active at a time.",
      };
    }

    // Lock the job
    this.workflowState.jobLock = {
      isLocked: true,
      activeJobId: jobId,
      lockedAt: new Date().toISOString(),
      lockedBy: this.workflowState.userName,
      reason: `Working on ${vehicleRegNo}`,
      canUnlock: false,
    };

    this.notifyListeners();
    return { success: true };
  }

  unlockJob(): void {
    this.workflowState.jobLock = {
      isLocked: false,
      activeJobId: null,
      lockedAt: null,
      lockedBy: "",
      reason: "",
      canUnlock: false,
    };
    this.notifyListeners();
  }

  isJobLocked(jobId: string): boolean {
    return (
      this.workflowState.jobLock.isLocked &&
      this.workflowState.jobLock.activeJobId !== jobId
    );
  }

  // ==================== ACTIVE JOB WORKFLOW ====================

  startJob(
    jobId: string,
    vehicleRegNo: string,
    packageType: string
  ): { success: boolean; error?: string } {
    // Check if job can be locked
    const lockResult = this.lockJob(jobId, vehicleRegNo);
    if (!lockResult.success) {
      return lockResult;
    }

    // Generate tasks based on package
    const tasks = this.generateTasksForPackage(packageType);

    // Create active job workflow
    const startTime = new Date();
    const estimatedTime = tasks.length * 3; // 3 minutes per task average
    const slaDeadline = new Date(startTime.getTime() + estimatedTime * 60 * 1000);

    this.workflowState.activeJob = {
      jobId,
      vehicleRegNo,
      packageType,
      startedAt: startTime.toISOString(),
      estimatedCompletionTime: new Date(startTime.getTime() + estimatedTime * 60 * 1000).toISOString(),
      slaDeadline: slaDeadline.toISOString(),
      isOverdue: false,
      tasks,
      currentTaskIndex: 0,
      completedTasks: 0,
      totalTasks: tasks.length,
      mandatoryPhotos: [],
      photoValidationComplete: false,
      isLocked: true,
      canComplete: false,
      blockingReasons: ["Tasks not completed", "Photos not validated"],
    };

    // Update SLA
    if (this.workflowState.sla && !this.workflowState.sla.hasStartedFirstWash) {
      this.workflowState.sla.hasStartedFirstWash = true;
      this.workflowState.sla.currentWashStartTime = startTime.toISOString();
      this.removeAlert("FIRST_WASH_START");
    }

    this.notifyListeners();
    return { success: true };
  }

  private generateTasksForPackage(packageType: string): WorkflowTask[] {
    // Base tasks (DAILY)
    const baseTasks: Omit<WorkflowTask, "taskNumber">[] = [
      {
        id: "TASK-EXTERIOR-RINSE",
        name: "Exterior Rinse",
        description: "Pre-wash rinse to remove loose dirt",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
        estimatedTime: 120,
        requiresPhoto: false,
        photoCount: 0,
        status: "ACTIVE",
        photos: [],
        validationRequired: false,
        dependencies: [],
      },
      {
        id: "TASK-FOAM-APPLICATION",
        name: "Foam Application",
        description: "Apply cleaning foam evenly",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
        estimatedTime: 180,
        requiresPhoto: true,
        photoCount: 1,
        status: "LOCKED",
        photos: [],
        validationRequired: true,
        dependencies: ["TASK-EXTERIOR-RINSE"],
      },
      {
        id: "TASK-BODY-WASH",
        name: "Body Wash",
        description: "Wash vehicle body with mitt",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
        estimatedTime: 300,
        requiresPhoto: false,
        photoCount: 0,
        status: "LOCKED",
        photos: [],
        validationRequired: false,
        dependencies: ["TASK-FOAM-APPLICATION"],
      },
      {
        id: "TASK-WHEEL-CLEAN",
        name: "Wheel Cleaning",
        description: "Clean wheels and tires",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["SMART_WASH", "ELITE_WASH"],
        estimatedTime: 240,
        requiresPhoto: true,
        photoCount: 1,
        status: "LOCKED",
        photos: [],
        validationRequired: true,
        dependencies: ["TASK-BODY-WASH"],
      },
      {
        id: "TASK-FINAL-RINSE",
        name: "Final Rinse",
        description: "Thorough final rinse",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
        estimatedTime: 120,
        requiresPhoto: false,
        photoCount: 0,
        status: "LOCKED",
        photos: [],
        validationRequired: false,
        dependencies: ["TASK-WHEEL-CLEAN"],
      },
      {
        id: "TASK-DRYING",
        name: "Drying",
        description: "Dry vehicle with microfiber towels",
        category: "DAILY",
        isConditional: false,
        requiredForPackage: ["EXPRESS_WASH", "SMART_WASH", "ELITE_WASH"],
        estimatedTime: 180,
        requiresPhoto: true,
        photoCount: 2,
        status: "LOCKED",
        photos: [],
        validationRequired: true,
        dependencies: ["TASK-FINAL-RINSE"],
      },
    ];

    // Filter tasks by package and add task numbers
    const filteredTasks = baseTasks
      .filter((task) => task.requiredForPackage.includes(packageType))
      .map((task, index) => ({
        ...task,
        taskNumber: index + 1,
      }));

    return filteredTasks;
  }

  // ==================== SEQUENTIAL TASK EXECUTION ====================

  getTaskExecutionControl(): TaskExecutionControl {
    if (!this.workflowState.activeJob) {
      return {
        canStart: false,
        blockingReasons: ["No active job"],
        nextTask: null,
        isSequential: true,
      };
    }

    const currentTask = this.workflowState.activeJob.tasks[this.workflowState.activeJob.currentTaskIndex];

    if (!currentTask) {
      return {
        canStart: false,
        blockingReasons: ["All tasks completed"],
        nextTask: null,
        isSequential: true,
      };
    }

    // Check dependencies
    const blockingReasons: string[] = [];
    for (const depId of currentTask.dependencies) {
      const depTask = this.workflowState.activeJob.tasks.find((t) => t.id === depId);
      if (depTask && depTask.status !== "COMPLETED") {
        blockingReasons.push(`Complete "${depTask.name}" first`);
      }
    }

    return {
      canStart: blockingReasons.length === 0,
      blockingReasons,
      nextTask: currentTask,
      isSequential: true,
    };
  }

  startTask(taskId: string): { success: boolean; error?: string } {
    if (!this.workflowState.activeJob) {
      return { success: false, error: "No active job" };
    }

    const taskIndex = this.workflowState.activeJob.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, error: "Task not found" };
    }

    const task = this.workflowState.activeJob.tasks[taskIndex];

    // Verify sequential execution
    if (taskIndex !== this.workflowState.activeJob.currentTaskIndex) {
      return { success: false, error: "Tasks must be completed in order" };
    }

    // Check dependencies
    for (const depId of task.dependencies) {
      const depTask = this.workflowState.activeJob.tasks.find((t) => t.id === depId);
      if (depTask && depTask.status !== "COMPLETED") {
        return { success: false, error: `Complete "${depTask.name}" first` };
      }
    }

    // Start task
    task.status = "IN_PROGRESS";
    task.startedAt = new Date().toISOString();

    this.notifyListeners();
    return { success: true };
  }

  async completeTask(taskId: string, photos: string[]): Promise<{ success: boolean; error?: string }> {
    if (!this.workflowState.activeJob) {
      return { success: false, error: "No active job" };
    }

    const task = this.workflowState.activeJob.tasks.find((t) => t.id === taskId);
    if (!task) {
      return { success: false, error: "Task not found" };
    }

    if (task.status !== "IN_PROGRESS") {
      return { success: false, error: "Task not started" };
    }

    // Validate photos if required
    if (task.requiresPhoto) {
      if (photos.length < task.photoCount) {
        return {
          success: false,
          error: `${task.photoCount} photo(s) required. Provided: ${photos.length}`,
        };
      }

      // Validate each photo
      for (const photoUrl of photos) {
        const validation = await this.validatePhoto(photoUrl, "PHOTO_QUALITY", {
          vehicleRegNo: this.workflowState.activeJob.vehicleRegNo,
        });

        const photoValidation = this.createPhotoValidation(photoUrl, [validation]);
        task.photos.push(photoValidation);

        if (!validation.success) {
          return { success: false, error: "Photo validation failed. Please retake." };
        }
      }
    }

    // Complete task
    task.status = "COMPLETED";
    task.completedAt = new Date().toISOString();

    // Move to next task
    this.workflowState.activeJob.completedTasks++;
    this.workflowState.activeJob.currentTaskIndex++;

    // Unlock next task
    const nextTask = this.workflowState.activeJob.tasks[this.workflowState.activeJob.currentTaskIndex];
    if (nextTask) {
      nextTask.status = "ACTIVE";
    }

    // Check if all tasks completed
    if (this.workflowState.activeJob.completedTasks === this.workflowState.activeJob.totalTasks) {
      this.workflowState.activeJob.canComplete = true;
      this.workflowState.activeJob.blockingReasons = [];
    }

    this.notifyListeners();
    return { success: true };
  }

  // ==================== COMPLETE JOB ====================

  canCompleteJob(): { canComplete: boolean; blockingReasons: string[] } {
    if (!this.workflowState.activeJob) {
      return { canComplete: false, blockingReasons: ["No active job"] };
    }

    const reasons: string[] = [];

    // Check all tasks completed
    if (this.workflowState.activeJob.completedTasks !== this.workflowState.activeJob.totalTasks) {
      reasons.push(`${this.workflowState.activeJob.totalTasks - this.workflowState.activeJob.completedTasks} task(s) remaining`);
    }

    // Check photos validated
    const photoTasks = this.workflowState.activeJob.tasks.filter((t) => t.requiresPhoto);
    const allPhotosValid = photoTasks.every((task) =>
      task.photos.every((photo) => photo.isValid)
    );
    if (!allPhotosValid) {
      reasons.push("Photos not validated");
    }

    return {
      canComplete: reasons.length === 0,
      blockingReasons: reasons,
    };
  }

  completeJob(): { success: boolean; error?: string } {
    const canComplete = this.canCompleteJob();
    if (!canComplete.canComplete) {
      return { success: false, error: canComplete.blockingReasons.join(", ") };
    }

    // Update base units
    this.workflowState.coverVisibility.baseUnitsCompleted++;

    // Check cover unlock
    if (
      this.workflowState.coverVisibility.baseUnitsCompleted >= this.workflowState.coverVisibility.threshold &&
      !this.workflowState.coverVisibility.isCoverVisible
    ) {
      this.workflowState.coverVisibility.isCoverVisible = true;
      this.createAlert("COVER_UNLOCK", "MEDIUM", "Cover Jobs Unlocked", "You have unlocked cover jobs. Keep washing!", false);
    }

    // Update SLA
    if (this.workflowState.sla) {
      this.workflowState.sla.totalWashesCompleted++;
    }

    // Clear active job and unlock
    this.workflowState.activeJob = null;
    this.unlockJob();

    this.notifyListeners();
    return { success: true };
  }

  // ==================== ALERTS ====================

  createAlert(
    type: AlertType,
    severity: "HIGH" | "MEDIUM" | "LOW",
    title: string,
    message: string,
    requiresAction: boolean
  ): void {
    const alert: WorkflowAlert = {
      id: `ALERT-${Date.now()}`,
      type,
      severity,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      requiresAction,
    };

    this.workflowState.activeAlerts.push(alert);
    this.notifyListeners();
  }

  removeAlert(type: AlertType): void {
    this.workflowState.activeAlerts = this.workflowState.activeAlerts.filter(
      (alert) => alert.type !== type
    );
    this.notifyListeners();
  }

  dismissAlert(alertId: string): void {
    const alert = this.workflowState.activeAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.isRead = true;
    }
    this.workflowState.activeAlerts = this.workflowState.activeAlerts.filter(
      (a) => a.id !== alertId
    );
    this.notifyListeners();
  }

  // ==================== COVER VISIBILITY ====================

  getCoverVisibility(): { visible: boolean; remaining: number } {
    return {
      visible: this.workflowState.coverVisibility.isCoverVisible,
      remaining:
        this.workflowState.coverVisibility.threshold -
        this.workflowState.coverVisibility.baseUnitsCompleted,
    };
  }

  // ==================== SLA TRACKING ====================

  checkSLA(): void {
    if (!this.workflowState.sla) return;

    const now = new Date();
    const deadline = new Date(this.workflowState.sla.firstWashDeadline);

    if (!this.workflowState.sla.hasStartedFirstWash && now > deadline) {
      this.workflowState.sla.isDelayed = true;
      this.workflowState.sla.delayMinutes = Math.floor((now.getTime() - deadline.getTime()) / 60000);

      // Create delay alert
      this.createAlert(
        "DELAY_WARNING",
        "HIGH",
        "You Are Behind Schedule",
        `You are ${this.workflowState.sla.delayMinutes} minutes late. Start your first wash immediately!`,
        true
      );
    }
  }
}

// Singleton instance
export const workflowControlService = new WorkflowControlService();
