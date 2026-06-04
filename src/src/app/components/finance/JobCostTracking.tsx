/**
 * Job Cost Tracking - Integration with Washer Job Report
 * Captures job-level cost data when job report is submitted
 * Last Updated: 2026-03-17
 */

export interface JobCostRecord {
  jobId: string;
  customerId: string;
  washerId: string;
  packageType: string;
  vehicleCategory: string;
  pinCode: string;
  
  // Material Costs
  standardMaterialCost: number;
  actualMaterialCost: number;
  materialVariance: number;
  productsUsed: {
    productId: string;
    productName: string;
    used: boolean;
    cost: number;
    reasonNotUsed?: string;
  }[];
  
  // Consumable Costs
  standardConsumableCost: number;
  actualConsumableCost: number; // Fixed - same as standard
  
  // Manpower Costs
  standardJobDuration: number; // minutes
  actualJobDuration: number; // minutes
  durationVariance: number; // minutes
  standardManpowerCost: number;
  actualManpowerCost: number;
  manpowerVariance: number;
  durationFlag?: 'amber' | 'red'; // amber if > 10 min over, red if > 20 min
  
  // Overhead
  standardOverheadCost: number;
  actualOverheadCost: number;
  
  // Totals
  totalStandardCost: number;
  totalActualCost: number;
  totalVariance: number;
  
  // EBITDA
  customerMonthlyPrice: number;
  monthlyWashCount: number;
  pricePerWash: number;
  jobLevelEBITDA: number;
  jobLevelEBITDAPercent: number;
  
  // Timestamps
  jobStartTime: Date;
  jobSubmitTime: Date;
  
  // Metadata
  submittedBy: string;
  submittedAt: Date;
}

/**
 * Calculate job-level cost when job report is submitted
 */
export function calculateJobCost(
  jobData: {
    jobId: string;
    customerId: string;
    washerId: string;
    packageType: string;
    vehicleCategory: string;
    pinCode: string;
    productsUsed: { productId: string; productName: string; used: boolean; reasonNotUsed?: string }[];
    jobStartTime: Date;
    jobSubmitTime: Date;
    customerMonthlyPrice: number;
    monthlyWashCount: number;
  },
  costConfig: {
    materialCosts: { productId: string; cost: number }[];
    consumableCost: number;
    manpowerCostPerMinute: number;
    standardDuration: number; // minutes
    overheadCost: number;
  }
): JobCostRecord {
  // Calculate actual job duration
  const actualDuration = Math.round(
    (jobData.jobSubmitTime.getTime() - jobData.jobStartTime.getTime()) / (1000 * 60)
  );
  
  // Calculate material costs
  let actualMaterialCost = 0;
  const productsWithCost = jobData.productsUsed.map((product) => {
    const productCostConfig = costConfig.materialCosts.find(
      (m) => m.productId === product.productId
    );
    const cost = product.used && productCostConfig ? productCostConfig.cost : 0;
    actualMaterialCost += cost;
    
    return {
      ...product,
      cost,
    };
  });
  
  const standardMaterialCost = costConfig.materialCosts.reduce(
    (sum, m) => sum + m.cost,
    0
  );
  const materialVariance = actualMaterialCost - standardMaterialCost;
  
  // Consumable costs (fixed)
  const standardConsumableCost = costConfig.consumableCost;
  const actualConsumableCost = costConfig.consumableCost;
  
  // Manpower costs based on duration
  const standardJobDuration = costConfig.standardDuration;
  const durationVariance = actualDuration - standardJobDuration;
  
  const standardManpowerCost = standardJobDuration * costConfig.manpowerCostPerMinute;
  const actualManpowerCost = actualDuration * costConfig.manpowerCostPerMinute;
  const manpowerVariance = actualManpowerCost - standardManpowerCost;
  
  // Duration flag
  let durationFlag: 'amber' | 'red' | undefined;
  if (durationVariance > 20) {
    durationFlag = 'red';
  } else if (durationVariance > 10) {
    durationFlag = 'amber';
  }
  
  // Overhead (fixed)
  const standardOverheadCost = costConfig.overheadCost;
  const actualOverheadCost = costConfig.overheadCost;
  
  // Total costs
  const totalStandardCost =
    standardMaterialCost +
    standardConsumableCost +
    standardManpowerCost +
    standardOverheadCost;
  
  const totalActualCost =
    actualMaterialCost +
    actualConsumableCost +
    actualManpowerCost +
    actualOverheadCost;
  
  const totalVariance = totalActualCost - totalStandardCost;
  
  // EBITDA calculation
  const pricePerWash = jobData.customerMonthlyPrice / jobData.monthlyWashCount;
  const jobLevelEBITDA = pricePerWash - totalActualCost;
  const jobLevelEBITDAPercent = (jobLevelEBITDA / pricePerWash) * 100;
  
  return {
    jobId: jobData.jobId,
    customerId: jobData.customerId,
    washerId: jobData.washerId,
    packageType: jobData.packageType,
    vehicleCategory: jobData.vehicleCategory,
    pinCode: jobData.pinCode,
    
    standardMaterialCost,
    actualMaterialCost,
    materialVariance,
    productsUsed: productsWithCost,
    
    standardConsumableCost,
    actualConsumableCost,
    
    standardJobDuration,
    actualJobDuration: actualDuration,
    durationVariance,
    standardManpowerCost,
    actualManpowerCost,
    manpowerVariance,
    durationFlag,
    
    standardOverheadCost,
    actualOverheadCost,
    
    totalStandardCost,
    totalActualCost,
    totalVariance,
    
    customerMonthlyPrice: jobData.customerMonthlyPrice,
    monthlyWashCount: jobData.monthlyWashCount,
    pricePerWash,
    jobLevelEBITDA,
    jobLevelEBITDAPercent,
    
    jobStartTime: jobData.jobStartTime,
    jobSubmitTime: jobData.jobSubmitTime,
    
    submittedBy: jobData.washerId,
    submittedAt: new Date(),
  };
}

/**
 * Aggregate job-level costs to reporting dimensions
 */
export function aggregateJobCosts(jobs: JobCostRecord[]) {
  return {
    byWasher: aggregateByWasher(jobs),
    bySupervisor: aggregateBySupervisor(jobs),
    byPINCode: aggregateByPINCode(jobs),
    byCity: aggregateByCity(jobs),
    bySubscription: aggregateBySubscription(jobs),
    byPackage: aggregateByPackage(jobs),
  };
}

function aggregateByWasher(jobs: JobCostRecord[]) {
  const groupedByWasher = new Map<string, JobCostRecord[]>();
  
  jobs.forEach((job) => {
    if (!groupedByWasher.has(job.washerId)) {
      groupedByWasher.set(job.washerId, []);
    }
    groupedByWasher.get(job.washerId)!.push(job);
  });
  
  return Array.from(groupedByWasher.entries()).map(([washerId, washerJobs]) => ({
    washerId,
    totalWashes: washerJobs.length,
    avgActualMaterialCost:
      washerJobs.reduce((sum, j) => sum + j.actualMaterialCost, 0) / washerJobs.length,
    avgActualConsumableCost:
      washerJobs.reduce((sum, j) => sum + j.actualConsumableCost, 0) / washerJobs.length,
    avgManpowerCost:
      washerJobs.reduce((sum, j) => sum + j.actualManpowerCost, 0) / washerJobs.length,
    avgTotalActualCost:
      washerJobs.reduce((sum, j) => sum + j.totalActualCost, 0) / washerJobs.length,
    avgTotalStandardCost:
      washerJobs.reduce((sum, j) => sum + j.totalStandardCost, 0) / washerJobs.length,
    avgVariance:
      washerJobs.reduce((sum, j) => sum + j.totalVariance, 0) / washerJobs.length,
    avgJobDuration:
      washerJobs.reduce((sum, j) => sum + j.actualJobDuration, 0) / washerJobs.length,
  }));
}

function aggregateBySupervisor(jobs: JobCostRecord[]) {
  // Similar aggregation by supervisor
  // Would need supervisor-washer mapping
  return [];
}

function aggregateByPINCode(jobs: JobCostRecord[]) {
  const groupedByPIN = new Map<string, JobCostRecord[]>();
  
  jobs.forEach((job) => {
    if (!groupedByPIN.has(job.pinCode)) {
      groupedByPIN.set(job.pinCode, []);
    }
    groupedByPIN.get(job.pinCode)!.push(job);
  });
  
  return Array.from(groupedByPIN.entries()).map(([pinCode, pinJobs]) => ({
    pinCode,
    totalWashes: pinJobs.length,
    avgActualCost:
      pinJobs.reduce((sum, j) => sum + j.totalActualCost, 0) / pinJobs.length,
    avgStandardCost:
      pinJobs.reduce((sum, j) => sum + j.totalStandardCost, 0) / pinJobs.length,
    avgVariance:
      pinJobs.reduce((sum, j) => sum + j.totalVariance, 0) / pinJobs.length,
    avgEBITDA:
      pinJobs.reduce((sum, j) => sum + j.jobLevelEBITDAPercent, 0) / pinJobs.length,
  }));
}

function aggregateByCity(jobs: JobCostRecord[]) {
  // Similar aggregation by city
  // Would need PIN-to-city mapping
  return [];
}

function aggregateBySubscription(jobs: JobCostRecord[]) {
  const groupedByCustomer = new Map<string, JobCostRecord[]>();
  
  jobs.forEach((job) => {
    if (!groupedByCustomer.has(job.customerId)) {
      groupedByCustomer.set(job.customerId, []);
    }
    groupedByCustomer.get(job.customerId)!.push(job);
  });
  
  return Array.from(groupedByCustomer.entries()).map(([customerId, customerJobs]) => ({
    customerId,
    washesCompleted: customerJobs.length,
    avgActualCost:
      customerJobs.reduce((sum, j) => sum + j.totalActualCost, 0) / customerJobs.length,
    avgStandardCost:
      customerJobs.reduce((sum, j) => sum + j.totalStandardCost, 0) / customerJobs.length,
    avgEBITDA:
      customerJobs.reduce((sum, j) => sum + j.jobLevelEBITDA, 0) / customerJobs.length,
    avgEBITDAPercent:
      customerJobs.reduce((sum, j) => sum + j.jobLevelEBITDAPercent, 0) /
      customerJobs.length,
  }));
}

function aggregateByPackage(jobs: JobCostRecord[]) {
  const groupedByPackage = new Map<string, JobCostRecord[]>();
  
  jobs.forEach((job) => {
    if (!groupedByPackage.has(job.packageType)) {
      groupedByPackage.set(job.packageType, []);
    }
    groupedByPackage.get(job.packageType)!.push(job);
  });
  
  return Array.from(groupedByPackage.entries()).map(([packageType, packageJobs]) => ({
    packageType,
    totalWashes: packageJobs.length,
    avgActualCost:
      packageJobs.reduce((sum, j) => sum + j.totalActualCost, 0) / packageJobs.length,
    avgStandardCost:
      packageJobs.reduce((sum, j) => sum + j.totalStandardCost, 0) / packageJobs.length,
    avgVariance:
      packageJobs.reduce((sum, j) => sum + j.totalVariance, 0) / packageJobs.length,
    avgEBITDA:
      packageJobs.reduce((sum, j) => sum + j.jobLevelEBITDAPercent, 0) / packageJobs.length,
  }));
}
