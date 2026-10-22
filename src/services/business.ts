/**
 * business.ts — reusable Supabase business-profile service
 *
 * All CRUD operations on the `business` table go through here.
 * Consumers (contexts, hooks, pages) never import supabase directly
 * for business data.
 */

import { supabase } from "../lib/supabase";
import type { Business } from "../contexts/BusinessContext";

// ── Payload type for upsert (owner_id injected by caller) ─────────

export type BusinessUpsertPayload = Omit<Business, "id" | "created_at" | "updated_at"> & {
  onboarding_completed?: boolean;
};

// ── Business service ───────────────────────────────────────────────

export const businessService = {
  /**
   * Fetch the business record that belongs to the given user.
   * Returns null when the user has not completed onboarding yet.
   */
  async getByOwner(userId: string): Promise<Business | null> {
    const { data, error } = await supabase
      .from("business")
      .select("*")
      .eq("owner_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data ?? null;
  },

  /**
   * Insert or update the business record.
   * Uses the `owner_id` unique constraint as the conflict target so
   * calling this multiple times (e.g. resume wizard) is safe.
   */
  async upsert(payload: BusinessUpsertPayload): Promise<Business> {
    const { data, error } = await supabase
      .from("business")
      .upsert(payload, { onConflict: "owner_id" })
      .select()
      .single();

    if (error) throw error;
    return data as Business;
  },

  async updateOwned(ownerId: string, patch: Partial<Business>): Promise<Business> {
    const {
      id: _id,
      owner_id: _ownerId,
      created_at: _createdAt,
      updated_at: _updatedAt,
      ...values
    } = patch;
    const { data, error } = await supabase
      .from("business")
      .update(values)
      .eq("owner_id", ownerId)
      .select()
      .single();
    if (error) throw error;
    return data as Business;
  },
};
