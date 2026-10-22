import { supabase } from "../lib/supabase";

export type CrmLeadStatus =
  "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type CrmPriority = "low" | "medium" | "high";
export interface CrmLead {
  id: string;
  business_id: string;
  lead_code: string;
  name: string;
  company: string;
  contact_person: string;
  phone: string;
  email: string | null;
  source: string;
  status: CrmLeadStatus;
  expected_revenue: number;
  assigned_user: string;
  priority: CrmPriority;
  converted_customer_id: string | null;
  created_at: string;
  updated_at: string;
}
export interface CrmFollowUp {
  id: string;
  business_id: string;
  customer_id: string | null;
  lead_id: string | null;
  purpose: string;
  due_at: string;
  priority: CrmPriority;
  status: "pending" | "completed";
  notes: string;
  created_at: string;
  updated_at: string;
}
export interface CrmActivity {
  id: string;
  business_id: string;
  customer_id: string | null;
  lead_id: string | null;
  activity_type: string;
  title: string;
  details: string;
  occurred_at: string;
  created_at: string;
}
export interface CrmSettings {
  business_id: string;
  customer_number_prefix: string;
  customer_number_next_value: number;
  customer_number_format: "cust-seq" | "plain-seq" | "yyyy-seq";
  default_credit_days: number;
  default_currency: string;
  default_country: string;
  customer_categories: string[];
  updated_at: string;
}

function leadCode() {
  return `LEAD-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}
function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

export const crmService = {
  async getLeads(businessId: string) {
    const rows: CrmLead[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from("crm_leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + 999);
      throwIfError(error);
      rows.push(...((data ?? []) as CrmLead[]));
      if (!data || data.length < 1000) return rows;
    }
  },
  async saveLead(
    businessId: string,
    payload: Partial<CrmLead> & Pick<CrmLead, "name" | "company">,
    id?: string,
  ) {
    const row = { ...payload, business_id: businessId, ...(id ? {} : { lead_code: leadCode() }) };
    const query = id
      ? supabase.from("crm_leads").update(row).eq("id", id)
      : supabase.from("crm_leads").insert(row);
    const { data, error } = await query.select("*").single();
    throwIfError(error);
    return data as CrmLead;
  },
  async deleteLead(id: string) {
    const { error } = await supabase.from("crm_leads").delete().eq("id", id);
    throwIfError(error);
  },
  async convertLead(businessId: string, leadId: string) {
    const { data, error } = await supabase.rpc("convert_crm_lead", {
      p_business_id: businessId,
      p_lead_id: leadId,
    });
    throwIfError(error);
    return data as string;
  },
  async getFollowUps(businessId: string) {
    const rows: CrmFollowUp[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from("crm_follow_ups")
        .select("*")
        .eq("business_id", businessId)
        .order("due_at")
        .range(offset, offset + 999);
      throwIfError(error);
      rows.push(...((data ?? []) as CrmFollowUp[]));
      if (!data || data.length < 1000) return rows;
    }
  },
  async saveFollowUp(
    businessId: string,
    payload: Omit<CrmFollowUp, "id" | "business_id" | "created_at" | "updated_at">,
    id?: string,
  ) {
    const row = { ...payload, business_id: businessId };
    const query = id
      ? supabase.from("crm_follow_ups").update(row).eq("id", id)
      : supabase.from("crm_follow_ups").insert(row);
    const { data, error } = await query.select("*").single();
    throwIfError(error);
    return data as CrmFollowUp;
  },
  async deleteFollowUp(id: string) {
    const { error } = await supabase.from("crm_follow_ups").delete().eq("id", id);
    throwIfError(error);
  },
  async getActivities(businessId: string) {
    const { data, error } = await supabase
      .from("crm_activities")
      .select("*")
      .eq("business_id", businessId)
      .order("occurred_at", { ascending: false })
      .limit(500);
    throwIfError(error);
    return (data ?? []) as CrmActivity[];
  },
  async createActivity(payload: Omit<CrmActivity, "id" | "created_at">) {
    const { data, error } = await supabase
      .from("crm_activities")
      .insert(payload)
      .select("*")
      .single();
    throwIfError(error);
    return data as CrmActivity;
  },
  async getSettings(businessId: string) {
    const { data, error } = await supabase
      .from("crm_settings")
      .upsert({ business_id: businessId }, { onConflict: "business_id", ignoreDuplicates: true })
      .select("*")
      .maybeSingle();
    throwIfError(error);
    if (data) return data as CrmSettings;
    const { data: current, error: readError } = await supabase
      .from("crm_settings")
      .select("*")
      .eq("business_id", businessId)
      .single();
    throwIfError(readError);
    return current as CrmSettings;
  },
  async saveSettings(businessId: string, payload: Omit<CrmSettings, "business_id" | "updated_at">) {
    const { data, error } = await supabase
      .from("crm_settings")
      .upsert({ business_id: businessId, ...payload })
      .select("*")
      .single();
    throwIfError(error);
    return data as CrmSettings;
  },
};
