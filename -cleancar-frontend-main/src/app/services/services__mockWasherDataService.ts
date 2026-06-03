/**
 * Mock Washer Data Service
 * Provides dummy customer and job data for testing the washer module
 * NO HARD-CODED DATA in components - all data comes from this service
 */

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
  packageName: string;
  packageType: string;
  serviceFrequency: string;
  subscriptionMonth: string;
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
}

export interface WasherStats {
  jobsToday: number;
  completed: number;
  inProgress: number;
  remaining: number;
  totalEarnings: number;
  unitsCompleted: number;
}

class MockWasherDataService {
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

  // Package data
  private packages = [
    { name: "Water Wash", type: "Water Wash", frequency: "Weekly", price: 499 },
    { name: "Water + Shampoo", type: "Water + Shampoo", frequency: "Alternate Days", price: 799 },
    { name: "Water + Shampoo + Wax", type: "Water + Shampoo + Wax", frequency: "Daily", price: 1299 },
    { name: "Water + Shampoo + Wax", type: "Water + Shampoo + Wax", frequency: "Daily", price: 1899 },
    { name: "Water + Shampoo + Wax", type: "Water + Shampoo + Wax", frequency: "Daily", price: 2499 },
    { name: "Platinum Quarterly", type: "Water + Shampoo + Wax", frequency: "Daily", price: 6999 },
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
  public getTodayJobs(washerId: string, count: number = 12): CustomerJob[] {
    const jobs: CustomerJob[] = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let i = 0; i < count; i++) {
      const customerName = this.customerNames[Math.floor(Math.random() * this.customerNames.length)];
      const area = this.areas[Math.floor(Math.random() * this.areas.length)];
      const vehicleType = this.vehicleData[Math.floor(Math.random() * this.vehicleData.length)];
      const brand = vehicleType.brands[Math.floor(Math.random() * vehicleType.brands.length)];
      const color = vehicleType.colors[Math.floor(Math.random() * vehicleType.colors.length)];
      const packageInfo = this.packages[Math.floor(Math.random() * this.packages.length)];
      const timeSlot = this.generateTimeSlot(i);
      const specialInst = this.specialInstructions[Math.floor(Math.random() * this.specialInstructions.length)];
      const parking = this.parkingInstructions[Math.floor(Math.random() * this.parkingInstructions.length)];

      // Determine status based on time
      const [startTime] = timeSlot.split(" - ")[0].split(":");
      const slotHour = parseInt(startTime);

      let status: CustomerJob["status"] = "Assigned";
      let startingSoon = false;
      let overdue = false;

      if (slotHour < currentHour - 1) {
        status = "Completed";
      } else if (slotHour === currentHour - 1 || (slotHour === currentHour && currentMinute > 30)) {
        status = "In Progress";
      } else if (slotHour === currentHour || (slotHour === currentHour + 1 && currentMinute > 30)) {
        status = "Assigned";
        startingSoon = true;
      }

      // Random subscription details
      const monthsInPlan = [3, 6, 12][Math.floor(Math.random() * 3)];
      const currentMonth = Math.floor(Math.random() * monthsInPlan) + 1;
      const memberSinceMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const memberSince = `${memberSinceMonths[Math.floor(Math.random() * 12)]} ${2025 + Math.floor(Math.random() * 2)}`;
      const totalWashes = Math.floor(Math.random() * 150) + 10;

      jobs.push({
        id: `JOB-${(i + 1).toString().padStart(3, '0')}`,
        timeSlot,
        customerFirstName: customerName,
        area,
        pinCode: this.generatePinCode(),
        city: "Surat",
        addressLine1: `${String.fromCharCode(65 + Math.floor(Math.random() * 5))}-${Math.floor(Math.random() * 900) + 100}, ${["Sunrise", "Royal", "Green", "City", "Prime"][Math.floor(Math.random() * 5)]} ${["Residency", "Heights", "Valley", "Plaza", "Apartments"][Math.floor(Math.random() * 5)]}`,
        vehicleCategory: vehicleType.category,
        vehicleColor: color,
        vehicleBrand: brand,
        vehicleRegistration: this.generateRegNumber(),
        packageName: packageInfo.name,
        packageType: packageInfo.type,
        serviceFrequency: packageInfo.frequency,
        subscriptionMonth: `${monthsInPlan}-month plan — Month ${currentMonth} of ${monthsInPlan}`,
        complimentaryBenefits: Math.random() > 0.5 ? `${Math.floor(Math.random() * 3) + 1} of 3 Interior Clean-Ups remaining` : undefined,
        jobType: Math.random() > 0.9 ? "One-Time Demo" : "Regular",
        status,
        specialInstructions: specialInst || undefined,
        specialNotes: specialInst ? `${specialInst}. ${parking ? parking : ""}` : parking || undefined,
        startingSoon,
        overdue,
        memberSince,
        totalWashesCompleted: totalWashes,
        nextScheduledWash: status === "Completed" ? "Tomorrow" : undefined,
        parkingInstructions: parking,
      });
    }

    return jobs;
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

  // Update job status (for testing)
  public updateJobStatus(jobId: string, newStatus: CustomerJob["status"]): void {
    // In real app, this would update the backend
    console.log(`Job ${jobId} status updated to ${newStatus}`);
  }

  // Simulate job completion
  public completeJob(jobId: string): void {
    this.updateJobStatus(jobId, "Completed");
  }
}

// Singleton instance
export const mockWasherDataService = new MockWasherDataService();
