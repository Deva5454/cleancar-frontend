/**
 * useLocalQuery — TanStack React Query v5 wrapper for localStorage data
 *
 * Usage:
 *   const { data: employees } = useLocalQuery("employees", () => DataService.getAll("EMPLOYEES"));
 *
 * Benefits over raw useState:
 *  - Deduplicates reads (multiple components can share the same query key)
 *  - Provides loading/error states consistently
 *  - Cache invalidation via queryClient.invalidateQueries()
 *  - DevTools integration with @tanstack/react-query-devtools
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from "@tanstack/react-query";

/** Read from localStorage via any synchronous fetcher */
export function useLocalQuery<T>(
  key: string | string[],
  fetcher: () => T,
  options?: Partial<UseQueryOptions<T, Error, T, (string | string[])[]>>
) {
  return useQuery({
    queryKey: Array.isArray(key) ? key : [key],
    queryFn: () => fetcher(),
    staleTime: 1000 * 60,   // 1 min — localStorage is always available
    ...options,
  });
}

/** Write to localStorage then invalidate related queries */
export function useLocalMutation<TData, TVariables>(
  writer: (vars: TVariables) => TData,
  invalidateKeys: string[]
) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: TVariables) => {
      const result = writer(vars);
      return result;
    },
    onSuccess: () => {
      invalidateKeys.forEach(key => {
        qc.invalidateQueries({ queryKey: [key] });
      });
    },
  });
}

/** Expose queryClient for imperative cache busting */
export function useQueryInvalidate() {
  const qc = useQueryClient();
  return (keys: string[]) => {
    keys.forEach(key => qc.invalidateQueries({ queryKey: [key] }));
  };
}
