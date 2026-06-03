/**
 * Salary Structure Service
 * 
 * Centralized data store for all salary structures created in the system.
 * This service acts as the single source of truth for salary structures
 * across Payroll Configuration and HR modules.
 */

export interface SalaryComponents {
  monthlyGross: number;
  annualCTC: number;
  basic: number;
  hra: number;
  conveyance: number;
  medical: number;
  specialAllowance: number;
  employeePF: number;
  employerPF: number;
  employeeESIC: number;
  employerESIC: number;
  professionalTax: number;
  totalDeductions: number;
  netTakeHome: number;
  totalEmployerCost: number;
  totalCTC: number;
  // Legacy fields for backwards compatibility (same as modern fields)
  gross?: number; // Same as monthlyGross
  pf?: number; // Same as employeePF
  esic?: number; // Same as employeeESIC
}

export interface SalaryStructure {
  id: string;
  roleId: string;
  roleName: string;
  structureName?: string; // Custom name given by HR (e.g., "Senior Manager Package", "Entry Level 2024")
  monthlyGross: number;
  basicSalary?: number; // Input basic salary before proration (optional for backwards compatibility)
  shiftType?: "full_time" | "part_time"; // Optional for backwards compatibility, defaults to full_time
  components: SalaryComponents;
  isMetro: boolean;
  applyPFCap: boolean;
  createdBy: string;
  createdDate: string;        // ISO date — auto-set on creation
  validFrom: string;          // YYYY-MM-DD — structure is active from this date
  validTill: string;          // YYYY-MM-DD — structure auto-expires after this date
  isActive: boolean;          // manually toggled; also auto-set false when validTill passes
  lastUpdated: string;
}

// In-memory storage (replace with API/database in production)
class SalaryStructureStore {
  private structures: SalaryStructure[] = [];
  private listeners: Array<(structures: SalaryStructure[]) => void> = [];

  constructor() {
    // Load from localStorage if available
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('salaryStructures');
      if (stored) {
        try {
          this.structures = JSON.parse(stored);
        } catch (e) {
          console.error('Error loading salary structures:', e);
          this.structures = [];
        }
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('salaryStructures', JSON.stringify(this.structures));
    }
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.structures));
  }

  // Subscribe to changes
  subscribe(listener: (structures: SalaryStructure[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // ✅ PERF FIX: Cache validity check date so we don't run it on every call
  private lastValidityCheckDate: string = "";

  // Get all structures
  getAll(): SalaryStructure[] {
    const today = new Date().toISOString().split('T')[0];
    
    // Skip validity check if already done today — avoids saveToStorage() on every render
    if (this.lastValidityCheckDate === today) {
      return this.structures;
    }
    
    let changed = false;
    this.structures = this.structures.map(s => {
      if (s.validTill && s.validTill < today && s.isActive) {
        changed = true;
        return { ...s, isActive: false, lastUpdated: today };
      }
      return s;
    });
    if (changed) this.saveToStorage();
    return [...this.structures];
  }

  // Get structures by role
  getByRole(roleId: string): SalaryStructure[] {
    return this.structures.filter(s => s.roleId === roleId);
  }

  // Get structure by ID
  getById(id: string): SalaryStructure | undefined {
    return this.structures.find(s => s.id === id);
  }

  // Add new structure
  add(structure: Omit<SalaryStructure, 'id' | 'createdDate'>): SalaryStructure {
    const today = new Date().toISOString().split('T')[0];
    const newStructure: SalaryStructure = {
      ...structure,
      id: `SS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdDate: today,
      validFrom: structure.validFrom || today,
      validTill: structure.validTill || '',
      isActive: structure.isActive ?? true,
    };
    
    this.structures.push(newStructure);
    this.saveToStorage();
    this.notify();
    
    return newStructure;
  }

  // Update existing structure
  update(id: string, updates: Partial<SalaryStructure>): boolean {
    const index = this.structures.findIndex(s => s.id === id);
    if (index === -1) return false;

    this.structures[index] = {
      ...this.structures[index],
      ...updates,
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    this.saveToStorage();
    this.notify();
    
    return true;
  }

  // Delete structure
  delete(id: string): boolean {
    const initialLength = this.structures.length;
    this.structures = this.structures.filter(s => s.id !== id);
    
    if (this.structures.length < initialLength) {
      this.saveToStorage();
      this.notify();
      return true;
    }
    
    return false;
  }

  // Get summary statistics
  getStats() {
    const roleGroups = new Map<string, number>();
    
    this.structures.forEach(s => {
      roleGroups.set(s.roleName, (roleGroups.get(s.roleName) || 0) + 1);
    });

    return {
      total: this.structures.length,
      byRole: Array.from(roleGroups.entries()).map(([role, count]) => ({
        role,
        count,
      })),
      lastUpdated: this.structures.length > 0
        ? this.structures.reduce((latest, s) => 
            s.lastUpdated > latest ? s.lastUpdated : latest, 
            this.structures[0].lastUpdated
          )
        : null,
    };
  }

  // Clear all (for testing)
  clear() {
    this.structures = [];
    this.saveToStorage();
    this.notify();
  }

  // Clear localStorage and reset (useful after formula changes)
  clearLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('salaryStructures');
      this.structures = [];
      this.notify();
    }
  }
}

// Export singleton instance
export const salaryStructureService = new SalaryStructureStore();