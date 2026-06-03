/**
 * SyncService — no-op stub (Supabase removed)
 * 
 * All data persists via DataService → localStorage.
 * No backend sync required.
 */

export type SyncMode = "push" | "pull" | "bidirectional";

interface SyncResult {
  success: boolean;
  synced: number;
  error?: string;
}

class SyncServiceClass {
  async push(_entityKey: string, _data: unknown[]): Promise<SyncResult> {
    return { success: true, synced: 0 };
  }

  async pull(_entityKey: string): Promise<unknown[]> {
    return [];
  }

  async sync(_entityKey: string, _mode: SyncMode = "push"): Promise<SyncResult> {
    return { success: true, synced: 0 };
  }

  async initialSync(): Promise<void> {
    return Promise.resolve();
  }
}

export const SyncService = new SyncServiceClass();
