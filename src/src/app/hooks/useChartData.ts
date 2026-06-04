/**
 * useChartData — Cached chart data hook.
 *
 * PHASE 1 FIX: Reduce chart render load by memoizing expensive
 * data transformations. Charts were re-computing on every context update.
 *
 * Usage:
 *   const data = useChartData("revenue_trend", () => computeRevenueData(revenues), [revenues, month]);
 */
import { useMemo, useRef } from "react";

interface CacheEntry<T> {
  data: T;
  key: string;
  timestamp: number;
}

// Module-level cache shared across all useChartData calls (survives re-renders)
const chartCache = new Map<string, CacheEntry<unknown>>();
const CHART_CACHE_TTL = 30_000; // 30 seconds

/**
 * Compute and cache chart data.
 * @param cacheKey  Unique identifier for this chart's data
 * @param compute   Function that produces the chart data
 * @param deps      Dependency values that invalidate the cache when changed
 */
export function useChartData<T>(
  cacheKey: string,
  compute: () => T,
  deps: unknown[]
): T {
  // Create a stable deps key by stringifying the dependency values
  const depsKey = JSON.stringify(deps);

  return useMemo(() => {
    const cached = chartCache.get(cacheKey);
    const now = Date.now();

    // Cache hit: same deps, not expired
    if (cached && cached.key === depsKey && (now - cached.timestamp) < CHART_CACHE_TTL) {
      return cached.data as T;
    }

    // Cache miss: compute and store
    const data = compute();
    chartCache.set(cacheKey, { data, key: depsKey, timestamp: now });
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, depsKey]);
}

/**
 * Invalidate cache entries by prefix
 */
export function invalidateChartCache(prefix?: string): void {
  if (!prefix) { chartCache.clear(); return; }
  for (const key of chartCache.keys()) {
    if (key.startsWith(prefix)) chartCache.delete(key);
  }
}
