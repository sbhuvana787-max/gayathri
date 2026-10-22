import { supabase } from "@/lib/supabase";

/** Tenant-scoped source records used by reports. Supabase RLS remains authoritative. */
async function loadAll<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  const rows: T[] = [];
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const result = await queryPage(from, from + pageSize - 1);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
export const reportsService = {
  async snapshot(businessId: string) {
    const queries = [
      (from: number, to: number) =>
        supabase
          .from("invoices")
          .select(
            "id,customer_id,invoice_number,invoice_date,due_date,status,payment_status,amount_paid,is_inter_state,invoice_items(product_id,quantity,unit_price,discount_percent,gst_percent)",
          )
          .eq("business_id", businessId)
          .order("invoice_date")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("payments")
          .select("id,amount,status,payment_date")
          .eq("business_id", businessId)
          .order("payment_date")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("customers")
          .select("id,name,customer_group,status,created_at")
          .eq("business_id", businessId)
          .order("name")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("products")
          .select(
            "id,sku,name,category_id,current_stock,minimum_stock,cost_price,purchase_price,created_at",
          )
          .eq("business_id", businessId)
          .order("name")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("categories")
          .select("id,name")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("suppliers")
          .select("id,name")
          .eq("business_id", businessId)
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("inventory_movements")
          .select(
            "id,product_id,movement_type,adjustment_type,quantity,previous_stock,new_stock,created_at",
          )
          .eq("business_id", businessId)
          .order("created_at")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("crm_leads")
          .select("id,status,created_at")
          .eq("business_id", businessId)
          .order("created_at")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("purchase_bills")
          .select("id,supplier_id,total,gst_amount,amount_paid,bill_date,due_date")
          .eq("business_id", businessId)
          .order("bill_date")
          .order("supplier_id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("finance_transactions")
          .select("id,transaction_type,status,transaction_date,amount,category")
          .eq("business_id", businessId)
          .order("transaction_date")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("purchase_orders")
          .select("id,supplier_id,status,expected_date")
          .eq("business_id", businessId)
          .order("created_date")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("goods_received_notes")
          .select("id,purchase_order_id,received_date")
          .eq("business_id", businessId)
          .order("received_date")
          .order("id")
          .range(from, to),
      (from: number, to: number) =>
        supabase
          .from("credit_notes")
          .select("id,invoice_id,status,grand_total,tax_total,credit_note_date")
          .eq("business_id", businessId)
          .order("credit_note_date")
          .order("id")
          .range(from, to),
    ] as const;
    const results = await Promise.all([
      loadAll(queries[0]),
      loadAll(queries[1]),
      loadAll(queries[2]),
      loadAll(queries[3]),
      loadAll(queries[4]),
      loadAll(queries[5]),
      loadAll(queries[6]),
      loadAll(queries[7]),
      loadAll(queries[8]),
      loadAll(queries[9]),
      loadAll(queries[10]),
      loadAll(queries[11]),
      loadAll(queries[12]),
    ]);
    const { data: financeSettings, error: settingsError } = await supabase
      .from("finance_settings")
      .select("financial_year_start_month")
      .eq("business_id", businessId)
      .maybeSingle();
    if (settingsError) throw settingsError;
    return {
      invoices: results[0],
      payments: results[1],
      customers: results[2],
      products: results[3],
      categories: results[4],
      suppliers: results[5],
      movements: results[6],
      leads: results[7],
      bills: results[8],
      transactions: results[9],
      purchaseOrders: results[10],
      receipts: results[11],
      creditNotes: results[12],
      financeSettings,
    };
  },
};
