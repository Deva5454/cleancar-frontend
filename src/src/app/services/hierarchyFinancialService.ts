/**
 * HIERARCHY-BASED FINANCIAL SERVICE
 * Income: Always mapped to pincode
 * Expenses: City-level (rent) or Pincode-level (marketing, operations)
 */

import type {
  IncomeByPincode,
  ExpenseByLevel,
  UserWithHierarchy,
} from '../types/organizationHierarchy';
import { organizationHierarchyService } from './organizationHierarchyService';
import { getVisibilityScope } from '../types/organizationHierarchy';

export type ExpenseType = 'OFFICE_RENT' | 'MARKETING' | 'OPERATIONS' | 'MATERIAL' | 'SALARY' | 'UTILITIES';
export type ExpenseLevel = 'CITY' | 'PINCODE';

interface CreateIncomeRequest {
  pincodeId: string; // MANDATORY
  subscriptionId: string;
  customerId: string;
  packageType: string;
  amount: number;
  date: Date;
  clusterManagerId?: string;
  supervisorId?: string;
}

interface CreateExpenseRequest {
  expenseType: ExpenseType;
  level: ExpenseLevel;
  cityId?: string; // For CITY-level expenses
  pincodeId?: string; // For PINCODE-level expenses
  amount: number;
  date: Date;
  description: string;
  approvedBy?: string;
}

class HierarchyFinancialService {
  private income: IncomeByPincode[] = [];
  private expenses: ExpenseByLevel[] = [];

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Mock income data - Generate realistic monthly revenue
    const pincodes = organizationHierarchyService.getAllPincodes();
    pincodes.forEach((pincode, index) => {
      // Each pincode has 40-60 active customers generating monthly revenue
      const customerCount = 40 + Math.floor(Math.random() * 20); // 40-60 customers

      // Get teams for this pincode to assign supervisors
      const teams = organizationHierarchyService.getTeamsByPincode(pincode.id);

      for (let i = 0; i < customerCount; i++) {
        const packageType = i % 3 === 0 ? 'ELITE_WASH' : i % 2 === 0 ? 'SMART_WASH' : 'EXPRESS_WASH';
        const amount = packageType === 'ELITE_WASH' ? 1999 : packageType === 'SMART_WASH' ? 1599 : 1249;

        // Distribute customers across teams in round-robin fashion
        const teamIndex = teams.length > 0 ? i % teams.length : 0;
        const team = teams.length > 0 ? teams[teamIndex] : null;
        const supervisorId = team?.supervisorId;

        // Assign washer from the team (round-robin across washers)
        let washerId: string | undefined;
        if (team && team.washerIds.length > 0) {
          const washerIndex = i % team.washerIds.length;
          washerId = team.washerIds[washerIndex];
        }

        this.income.push({
          id: `INC-${pincode.id}-${i}`,
          pincodeId: pincode.id,
          pincode: pincode.pincode,
          cityId: pincode.cityId,
          clusterId: pincode.clusterId,
          subscriptionId: `SUB-${index}-${i}`,
          customerId: `CUST-${index}-${i}`,
          packageType,
          amount,
          date: new Date(2026, 3, 1 + (i % 30)), // Spread across April
          clusterManagerId: pincode.clusterManagerId,
          teamId: team?.id,
          supervisorId: supervisorId,
          washerId: washerId, // ✅ Now customers are assigned to specific washers
        });
      }
    });

    // Mock city-level expenses (office rent)
    this.expenses.push({
      id: 'EXP-RENT-001',
      expenseType: 'OFFICE_RENT',
      level: 'CITY',
      cityId: 'CITY-SURAT',
      amount: 50000,
      date: new Date(2026, 3, 1),
      description: 'Monthly office rent - Regional Office Surat',
      approvedBy: 'CM-SURAT-001',
      approvalDate: new Date(2026, 3, 1),
    });

    this.expenses.push({
      id: 'EXP-UTIL-001',
      expenseType: 'UTILITIES',
      level: 'CITY',
      cityId: 'CITY-SURAT',
      amount: 15000,
      date: new Date(2026, 3, 1),
      description: 'Electricity and water - Regional Office',
      approvedBy: 'CM-SURAT-001',
      approvalDate: new Date(2026, 3, 1),
    });

    // Mock pincode-level expenses (marketing, operations, material)
    pincodes.forEach((pincode) => {
      // Marketing expense (10-15% of revenue)
      const marketingExpense = 15000 + Math.floor(Math.random() * 10000);
      this.expenses.push({
        id: `EXP-MKTG-${pincode.id}`,
        expenseType: 'MARKETING',
        level: 'PINCODE',
        cityId: pincode.cityId,
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        clusterId: pincode.clusterId,
        amount: marketingExpense,
        date: new Date(2026, 3, 5),
        description: `Digital marketing campaign - ${pincode.areaName}`,
        approvedBy: pincode.clusterManagerId || 'CM-SURAT-001',
      });

      // Operations expense (8-12% of revenue)
      const operationsExpense = 12000 + Math.floor(Math.random() * 8000);
      this.expenses.push({
        id: `EXP-OPS-${pincode.id}`,
        expenseType: 'OPERATIONS',
        level: 'PINCODE',
        cityId: pincode.cityId,
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        clusterId: pincode.clusterId,
        amount: operationsExpense,
        date: new Date(2026, 3, 10),
        description: `Operational expenses - ${pincode.areaName}`,
        approvedBy: pincode.clusterManagerId || 'CM-SURAT-001',
      });

      // Material expense (15-20% of revenue)
      const materialExpense = 18000 + Math.floor(Math.random() * 12000);
      this.expenses.push({
        id: `EXP-MAT-${pincode.id}`,
        expenseType: 'MATERIAL',
        level: 'PINCODE',
        cityId: pincode.cityId,
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        clusterId: pincode.clusterId,
        amount: materialExpense,
        date: new Date(2026, 3, 12),
        description: `Material procurement - ${pincode.areaName}`,
        approvedBy: pincode.clusterManagerId || 'CM-SURAT-001',
      });

      // Salary expense (30-35% of revenue)
      const salaryExpense = 35000 + Math.floor(Math.random() * 15000);
      this.expenses.push({
        id: `EXP-SAL-${pincode.id}`,
        expenseType: 'SALARY',
        level: 'PINCODE',
        cityId: pincode.cityId,
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        clusterId: pincode.clusterId,
        amount: salaryExpense,
        date: new Date(2026, 3, 1),
        description: `Salary payments - ${pincode.areaName} team`,
        approvedBy: pincode.clusterManagerId || 'CM-SURAT-001',
      });
    });
  }

  // ==================== INCOME OPERATIONS ====================

  createIncome(request: CreateIncomeRequest): {
    success: boolean;
    message: string;
    incomeId?: string;
  } {
    // Validate pincode is provided
    if (!request.pincodeId) {
      return {
        success: false,
        message: 'CRITICAL: Income must be mapped to a pincode',
      };
    }

    // Validate pincode exists
    const pincode = organizationHierarchyService.getPincodeById(request.pincodeId);
    if (!pincode) {
      return {
        success: false,
        message: `Invalid pincode ID: ${request.pincodeId}`,
      };
    }

    const newIncome: IncomeByPincode = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pincodeId: request.pincodeId,
      pincode: pincode.pincode,
      cityId: pincode.cityId,
      clusterId: pincode.clusterId,
      subscriptionId: request.subscriptionId,
      customerId: request.customerId,
      packageType: request.packageType,
      amount: request.amount,
      date: request.date,
      clusterManagerId: request.clusterManagerId || pincode.clusterManagerId,
      supervisorId: request.supervisorId,
    };

    this.income.push(newIncome);

    return {
      success: true,
      message: `Income recorded for ${pincode.pincode} - ${pincode.areaName}`,
      incomeId: newIncome.id,
    };
  }

  getIncomeForUser(user: UserWithHierarchy, filters?: {
    startDate?: Date;
    endDate?: Date;
    pincodeId?: string;
  }): IncomeByPincode[] {
    const scope = getVisibilityScope(user);
    let filteredIncome = [...this.income];

    // Apply hierarchy-based filtering
    if (user.role === 'Cluster Manager') {
      // Only assigned pincodes
      filteredIncome = filteredIncome.filter((inc) => scope.pincodes.includes(inc.pincodeId));
    } else if (user.role === 'City Manager') {
      // All income in city
      if (user.cityId) {
        filteredIncome = filteredIncome.filter((inc) => inc.cityId === user.cityId);
      }
    } else if (user.role === 'Supervisor') {
      // Only assigned pincodes
      filteredIncome = filteredIncome.filter((inc) => scope.pincodes.includes(inc.pincodeId));
    }

    // Apply date filters
    if (filters?.startDate) {
      filteredIncome = filteredIncome.filter((inc) => inc.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredIncome = filteredIncome.filter((inc) => inc.date <= filters.endDate!);
    }

    if (filters?.pincodeId) {
      filteredIncome = filteredIncome.filter((inc) => inc.pincodeId === filters.pincodeId);
    }

    return filteredIncome;
  }

  // ==================== EXPENSE OPERATIONS ====================

  createExpense(request: CreateExpenseRequest): {
    success: boolean;
    message: string;
    expenseId?: string;
  } {
    // Validate level-specific requirements
    if (request.level === 'CITY' && !request.cityId) {
      return { success: false, message: 'City ID required for city-level expenses' };
    }

    if (request.level === 'PINCODE' && !request.pincodeId) {
      return { success: false, message: 'Pincode ID required for pincode-level expenses' };
    }

    // Validate expense type vs level
    if (['OFFICE_RENT', 'UTILITIES'].includes(request.expenseType) && request.level !== 'CITY') {
      return { success: false, message: `${request.expenseType} must be city-level expense` };
    }

    if (['MARKETING', 'OPERATIONS', 'MATERIAL'].includes(request.expenseType) && request.level !== 'PINCODE') {
      return { success: false, message: `${request.expenseType} must be pincode-level expense` };
    }

    let pincode;
    if (request.pincodeId) {
      pincode = organizationHierarchyService.getPincodeById(request.pincodeId);
      if (!pincode) {
        return { success: false, message: `Invalid pincode ID: ${request.pincodeId}` };
      }
    }

    const newExpense: ExpenseByLevel = {
      id: `EXP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      expenseType: request.expenseType,
      level: request.level,
      cityId: request.cityId,
      pincodeId: request.pincodeId,
      pincode: pincode?.pincode,
      clusterId: pincode?.clusterId,
      amount: request.amount,
      date: request.date,
      description: request.description,
      approvedBy: request.approvedBy,
    };

    this.expenses.push(newExpense);

    return {
      success: true,
      message: `Expense recorded successfully`,
      expenseId: newExpense.id,
    };
  }

  getExpensesForUser(user: UserWithHierarchy, filters?: {
    startDate?: Date;
    endDate?: Date;
    expenseType?: ExpenseType;
    level?: ExpenseLevel;
    pincodeId?: string;
  }): ExpenseByLevel[] {
    const scope = getVisibilityScope(user);
    let filteredExpenses = [...this.expenses];

    // Apply hierarchy-based filtering
    if (user.role === 'Cluster Manager') {
      // Only assigned pincodes + no access to city-level expenses
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.level === 'PINCODE' && exp.pincodeId && scope.pincodes.includes(exp.pincodeId)
      );
    } else if (user.role === 'City Manager') {
      // All expenses in city
      if (user.cityId) {
        filteredExpenses = filteredExpenses.filter((exp) => exp.cityId === user.cityId);
      }
    } else if (user.role === 'Supervisor') {
      // Only assigned pincodes
      filteredExpenses = filteredExpenses.filter(
        (exp) => exp.level === 'PINCODE' && exp.pincodeId && scope.pincodes.includes(exp.pincodeId)
      );
    }

    // Apply filters
    if (filters?.startDate) {
      filteredExpenses = filteredExpenses.filter((exp) => exp.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      filteredExpenses = filteredExpenses.filter((exp) => exp.date <= filters.endDate!);
    }

    if (filters?.expenseType) {
      filteredExpenses = filteredExpenses.filter((exp) => exp.expenseType === filters.expenseType);
    }

    if (filters?.level) {
      filteredExpenses = filteredExpenses.filter((exp) => exp.level === filters.level);
    }

    if (filters?.pincodeId) {
      filteredExpenses = filteredExpenses.filter((exp) => exp.pincodeId === filters.pincodeId);
    }

    return filteredExpenses;
  }

  // ==================== ANALYTICS ====================

  getFinancialSummaryByPincode(pincodeId: string, user: UserWithHierarchy, period: {
    startDate: Date;
    endDate: Date;
  }): {
    pincodeId: string;
    pincode: string;
    areaName: string;
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    incomeBreakdown: Record<string, number>;
    expenseBreakdown: Record<string, number>;
  } | null {
    // Check access
    if (!organizationHierarchyService.checkPincodeAccess(user, pincodeId)) {
      return null;
    }

    const pincode = organizationHierarchyService.getPincodeById(pincodeId);
    if (!pincode) return null;

    const pincodeIncome = this.income.filter(
      (inc) => inc.pincodeId === pincodeId && inc.date >= period.startDate && inc.date <= period.endDate
    );

    const pincodeExpenses = this.expenses.filter(
      (exp) => exp.pincodeId === pincodeId && exp.date >= period.startDate && exp.date <= period.endDate
    );

    const totalIncome = pincodeIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpenses = pincodeExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Income breakdown by package type
    const incomeBreakdown: Record<string, number> = {};
    pincodeIncome.forEach((inc) => {
      incomeBreakdown[inc.packageType] = (incomeBreakdown[inc.packageType] || 0) + inc.amount;
    });

    // Expense breakdown by type
    const expenseBreakdown: Record<string, number> = {};
    pincodeExpenses.forEach((exp) => {
      expenseBreakdown[exp.expenseType] = (expenseBreakdown[exp.expenseType] || 0) + exp.amount;
    });

    return {
      pincodeId,
      pincode: pincode.pincode,
      areaName: pincode.areaName,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      incomeBreakdown,
      expenseBreakdown,
    };
  }

  getClusterFinancialSummary(clusterManagerId: string, period: {
    startDate: Date;
    endDate: Date;
  }): {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    pincodeBreakdown: Array<{
      pincodeId: string;
      pincode: string;
      areaName: string;
      income: number;
      expenses: number;
      profit: number;
    }>;
  } {
    const assignedPincodes = organizationHierarchyService.getPincodesByClusterManager(clusterManagerId);
    const pincodeIds = assignedPincodes.map((p) => p.id);

    let totalIncome = 0;
    let totalExpenses = 0;
    const pincodeBreakdown: Array<any> = [];

    assignedPincodes.forEach((pincode) => {
      const pincodeIncome = this.income
        .filter((inc) => inc.pincodeId === pincode.id && inc.date >= period.startDate && inc.date <= period.endDate)
        .reduce((sum, inc) => sum + inc.amount, 0);

      const pincodeExpenses = this.expenses
        .filter((exp) => exp.pincodeId === pincode.id && exp.date >= period.startDate && exp.date <= period.endDate)
        .reduce((sum, exp) => sum + exp.amount, 0);

      totalIncome += pincodeIncome;
      totalExpenses += pincodeExpenses;

      pincodeBreakdown.push({
        pincodeId: pincode.id,
        pincode: pincode.pincode,
        areaName: pincode.areaName,
        income: pincodeIncome,
        expenses: pincodeExpenses,
        profit: pincodeIncome - pincodeExpenses,
      });
    });

    return {
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses,
      pincodeBreakdown,
    };
  }

  getCityFinancialSummary(cityId: string, period: {
    startDate: Date;
    endDate: Date;
  }): {
    totalIncome: number;
    totalExpenses: number;
    cityLevelExpenses: number;
    pincodeLevelExpenses: number;
    netProfit: number;
    clusterBreakdown: Array<{
      clusterId: string;
      clusterName: string;
      clusterManagerId: string | null;
      income: number;
      expenses: number;
      profit: number;
    }>;
  } {
    const clusters = organizationHierarchyService.getClustersByCity(cityId);

    const cityIncome = this.income.filter(
      (inc) => inc.cityId === cityId && inc.date >= period.startDate && inc.date <= period.endDate
    );

    const cityExpenses = this.expenses.filter(
      (exp) => exp.cityId === cityId && exp.date >= period.startDate && exp.date <= period.endDate
    );

    const totalIncome = cityIncome.reduce((sum, inc) => sum + inc.amount, 0);
    const cityLevelExpenses = cityExpenses.filter((exp) => exp.level === 'CITY').reduce((sum, exp) => sum + exp.amount, 0);
    const pincodeLevelExpenses = cityExpenses.filter((exp) => exp.level === 'PINCODE').reduce((sum, exp) => sum + exp.amount, 0);
    const totalExpenses = cityLevelExpenses + pincodeLevelExpenses;

    const clusterBreakdown = clusters.map((cluster) => {
      const clusterPincodes = organizationHierarchyService.getPincodesByCluster(cluster.id);
      const clusterPincodeIds = clusterPincodes.map((p) => p.id);

      const clusterIncome = cityIncome.filter((inc) => clusterPincodeIds.includes(inc.pincodeId)).reduce((sum, inc) => sum + inc.amount, 0);
      const clusterExpenses = cityExpenses
        .filter((exp) => exp.pincodeId && clusterPincodeIds.includes(exp.pincodeId))
        .reduce((sum, exp) => sum + exp.amount, 0);

      return {
        clusterId: cluster.id,
        clusterName: cluster.name,
        clusterManagerId: cluster.clusterManagerId,
        income: clusterIncome,
        expenses: clusterExpenses,
        profit: clusterIncome - clusterExpenses,
      };
    });

    return {
      totalIncome,
      totalExpenses,
      cityLevelExpenses,
      pincodeLevelExpenses,
      netProfit: totalIncome - totalExpenses,
      clusterBreakdown,
    };
  }

  // ==================== VALIDATION ====================

  validateFinancialData(): {
    valid: boolean;
    violations: string[];
  } {
    const violations: string[] = [];

    // Check all income has pincode
    const incomeWithoutPincode = this.income.filter((inc) => !inc.pincodeId);
    if (incomeWithoutPincode.length > 0) {
      violations.push(`${incomeWithoutPincode.length} income records missing pincode`);
    }

    // Check city-level expenses have cityId
    const cityExpensesWithoutCity = this.expenses.filter((exp) => exp.level === 'CITY' && !exp.cityId);
    if (cityExpensesWithoutCity.length > 0) {
      violations.push(`${cityExpensesWithoutCity.length} city-level expenses missing cityId`);
    }

    // Check pincode-level expenses have pincodeId
    const pincodeExpensesWithoutPincode = this.expenses.filter((exp) => exp.level === 'PINCODE' && !exp.pincodeId);
    if (pincodeExpensesWithoutPincode.length > 0) {
      violations.push(`${pincodeExpensesWithoutPincode.length} pincode-level expenses missing pincodeId`);
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}

export const hierarchyFinancialService = new HierarchyFinancialService();
