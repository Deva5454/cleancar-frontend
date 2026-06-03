/**
 * Storage Service
 * Centralized localStorage access with namespaced keys
 *
 * Benefits:
 * - Prevents key collisions
 * - Type-safe storage access
 * - Easy migration to other storage backends
 * - Consistent error handling
 */

export type StorageNamespace =
  | "hrdata"
  | "finance"
  | "subscription"
  | "inventory"
  | "demo"
  | "scenario"
  | "notification"
  | "job"
  | "advance"
  | "cloth"
  | "complaint"
  | "customer"
  | "lead"
  | "user"
  | "settings";

export class StorageService {
  /**
   * Generate namespaced key
   * @example getKey("hrdata", "employees") => "hrdata:employees"
   */
  private static getKey(namespace: StorageNamespace, key: string): string {
    return `${namespace}:${key}`;
  }

  /**
   * Get item from localStorage
   * @returns Parsed JSON object or null if not found
   */
  static get<T>(namespace: StorageNamespace, key: string): T | null {
    try {
      const namespacedKey = this.getKey(namespace, key);
      const item = localStorage.getItem(namespacedKey);
      if (item === null) return null;
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`[StorageService] Error reading ${namespace}:${key}:`, error);
      return null;
    }
  }

  /**
   * Set item in localStorage
   * @param data Object to store (will be JSON stringified)
   */
  static set<T>(namespace: StorageNamespace, key: string, data: T): boolean {
    try {
      const namespacedKey = this.getKey(namespace, key);
      localStorage.setItem(namespacedKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`[StorageService] Error writing ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Remove item from localStorage
   */
  static remove(namespace: StorageNamespace, key: string): boolean {
    try {
      const namespacedKey = this.getKey(namespace, key);
      localStorage.removeItem(namespacedKey);
      return true;
    } catch (error) {
      console.error(`[StorageService] Error removing ${namespace}:${key}:`, error);
      return false;
    }
  }

  /**
   * Check if item exists in localStorage
   */
  static has(namespace: StorageNamespace, key: string): boolean {
    const namespacedKey = this.getKey(namespace, key);
    return localStorage.getItem(namespacedKey) !== null;
  }

  /**
   * Clear all items in a namespace
   * @example clearNamespace("hrdata") removes all hrdata:* keys
   */
  static clearNamespace(namespace: StorageNamespace): number {
    try {
      const prefix = `${namespace}:`;
      const keysToRemove: string[] = [];

      // Find all keys with this namespace
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      // Remove them
      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (import.meta.env.DEV) console.log(`[StorageService] Cleared ${keysToRemove.length} items from ${namespace} namespace`);
      return keysToRemove.length;
    } catch (error) {
      console.error(`[StorageService] Error clearing ${namespace} namespace:`, error);
      return 0;
    }
  }

  /**
   * Get all keys in a namespace
   */
  static getNamespaceKeys(namespace: StorageNamespace): string[] {
    const prefix = `${namespace}:`;
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        // Remove namespace prefix before adding
        keys.push(key.substring(prefix.length));
      }
    }

    return keys;
  }

  /**
   * Clear all localStorage (use with caution)
   */
  static clearAll(): void {
    try {
      localStorage.clear();
      console.log("[StorageService] Cleared all localStorage");
    } catch (error) {
      console.error("[StorageService] Error clearing all localStorage:", error);
    }
  }

  /**
   * Get storage size estimate in bytes
   */
  static getStorageSize(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          total += key.length + value.length;
        }
      }
    }
    return total;
  }

  /**
   * Get storage size estimate in human-readable format
   */
  static getStorageSizeFormatted(): string {
    const bytes = this.getStorageSize();
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  /**
   * Debug: List all namespaced keys
   */
  static debug(): void {
    console.group("[StorageService] Debug Info");
    console.log("Total size:", this.getStorageSizeFormatted());
    if (import.meta.env.DEV) console.log("Total keys:", localStorage.length);

    const namespaces = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(":")) {
        const namespace = key.split(":")[0];
        namespaces.add(namespace);
      }
    }

    console.log("Namespaces:", Array.from(namespaces).sort());

    namespaces.forEach(namespace => {
      const keys = this.getNamespaceKeys(namespace as StorageNamespace);
      if (import.meta.env.DEV) console.log(`  ${namespace}:`, keys);
    });

    console.groupEnd();
  }
}

/**
 * USAGE EXAMPLES:
 *
 * // Store employees
 * StorageService.set("hrdata", "employees", employeesArray);
 *
 * // Retrieve employees
 * const employees = StorageService.get<Employee[]>("hrdata", "employees");
 *
 * // Check if exists
 * if (StorageService.has("hrdata", "employees")) { ... }
 *
 * // Remove specific item
 * StorageService.remove("hrdata", "employees");
 *
 * // Clear entire namespace
 * StorageService.clearNamespace("hrdata");
 *
 * // Debug
 * StorageService.debug();
 */
