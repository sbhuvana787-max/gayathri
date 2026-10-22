/**
 * useBusinessQuery — React Query hooks for the business profile.
 *
 * Keeps server state (fetch / mutate) separate from UI state.
 * BusinessContext wraps these hooks to provide the same interface
 * the rest of the app already depends on.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { businessService, type BusinessUpsertPayload } from "../services/business";
import type { Business } from "../contexts/BusinessContext";

// ── Query keys ─────────────────────────────────────────────────────

export const businessKeys = {
  all: ["business"] as const,
  byOwner: (userId: string) => ["business", userId] as const,
};

// ── Fetch hook ─────────────────────────────────────────────────────

/**
 * Fetches (and caches) the business record for the logged-in user.
 * Pass `null` to disable the query (unauthenticated state).
 */
export function useBusinessQuery(userId: string | null) {
  return useQuery({
    queryKey: userId ? businessKeys.byOwner(userId) : businessKeys.all,
    queryFn: () => businessService.getByOwner(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 min — avoid refetching on every focus
    retry: false, // surface errors immediately; don't loop on auth errors
  });
}

// ── Mutation hook ──────────────────────────────────────────────────

/**
 * Upsert the business record. On success, invalidates the owner query
 * so the UI reflects the saved data without a manual refetch.
 */
export function useUpsertBusiness(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BusinessUpsertPayload) => businessService.upsert(payload),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: businessKeys.byOwner(userId) });
      }
    },
  });
}

export function useUpdateBusiness(userId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Business>) => {
      if (!userId) throw new Error("You must be signed in to update business settings.");
      return businessService.updateOwned(userId, patch);
    },
    onSuccess: (business) => {
      if (userId) queryClient.setQueryData(businessKeys.byOwner(userId), business);
    },
  });
}
