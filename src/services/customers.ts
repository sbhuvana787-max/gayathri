/**
 * customers.ts — Supabase CRUD service for the Customers module.
 *
 * All database operations go through here. Components never import
 * supabase directly for customer data.
 */

import { supabase } from "../lib/supabase";

// ── DB types ──────────────────────────────────────────────────────

export interface Customer {
  id: string;
  business_id: string;
  customer_code: string;
  name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string;
  gst_number: string | null;
  pan_number: string | null;
  address: string | null;
  shipping_address: string | null;
  city: string | null;
  state: string | null;
  country: string;
  postal_code: string | null;
  credit_limit: number;
  credit_days: number;
  opening_balance: number;
  customer_group: string;
  status: string;
  rating: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCustomerNote {
  id: string;
  customer_id: string;
  text: string;
  author: string;
  created_at: string;
}

export type CustomerInsert = Omit<Customer, "id" | "created_at" | "updated_at">;
export type CustomerUpdate = Partial<
  Omit<Customer, "id" | "business_id" | "created_at" | "updated_at">
>;

// ── Helpers ───────────────────────────────────────────────────────

export function generateCustomerCode(): string {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `CUS-${yyyymm}-${rand}`;
}

// ── Service ───────────────────────────────────────────────────────

export const customersService = {
  // ── Customers ─────────────────────────────────────────────────

  async getAll(businessId: string): Promise<Customer[]> {
    const rows: Customer[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      rows.push(...((data ?? []) as Customer[]));
      if (!data || data.length < 1000) return rows;
    }
  },

  async getById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data as Customer | null;
  },

  async create(payload: CustomerInsert): Promise<Customer> {
    // Normalize duplicate checks within this tenant. RLS remains the authorization boundary.
    if (payload.email) {
      const { data: existing, error: duplicateLookupError } = await supabase
        .from("customers")
        .select("id")
        .eq("business_id", payload.business_id)
        .ilike("email", payload.email.trim())
        .limit(1)
        .maybeSingle();
      if (duplicateLookupError) throw duplicateLookupError;
      if (existing) throw new Error("A customer with this email already exists.");
    }

    let customerCode = payload.customer_code;
    if (!customerCode) {
      const { data, error: codeError } = await supabase.rpc("next_crm_customer_code", {
        p_business_id: payload.business_id,
      });
      if (codeError) throw codeError;
      customerCode = data as string;
    }
    const { data, error } = await supabase
      .from("customers")
      .insert({
        ...payload,
        customer_code: customerCode,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async update(id: string, payload: CustomerUpdate): Promise<Customer> {
    if (payload.email?.trim()) {
      const { data: current, error: currentError } = await supabase
        .from("customers")
        .select("business_id")
        .eq("id", id)
        .single();
      if (currentError) throw currentError;
      const { data: duplicate, error: duplicateError } = await supabase
        .from("customers")
        .select("id")
        .eq("business_id", current.business_id)
        .neq("id", id)
        .ilike("email", payload.email.trim())
        .limit(1)
        .maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) throw new Error("A customer with this email already exists.");
    }
    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase.from("customers").delete().in("id", ids);
    if (error) throw error;
  },

  async bulkUpdate(ids: string[], payload: CustomerUpdate): Promise<void> {
    if (!ids.length) return;
    const { error } = await supabase.from("customers").update(payload).in("id", ids);
    if (error) throw error;
  },

  // ── Notes ──────────────────────────────────────────────────────

  async getNotes(customerId: string): Promise<DbCustomerNote[]> {
    const { data, error } = await supabase
      .from("customer_notes")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as DbCustomerNote[];
  },

  async addNote(customerId: string, text: string, author = "You"): Promise<DbCustomerNote> {
    const { data, error } = await supabase
      .from("customer_notes")
      .insert({ customer_id: customerId, text, author })
      .select()
      .single();
    if (error) throw error;
    return data as DbCustomerNote;
  },

  async deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase.from("customer_notes").delete().eq("id", noteId);
    if (error) throw error;
  },
};
