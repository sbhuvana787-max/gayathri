/**
 * invoices.ts — Supabase CRUD service for the Billing Invoices module.
 *
 * On create: inserts invoice + invoice_items + inventory stock-out movements.
 * The DB trigger (process_inventory_movement) handles stock deduction and
 * raises an error if stock would go negative.
 */

import { supabase } from "../lib/supabase";
import { inventoryMovementsService } from "./inventoryMovements";
import type {
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  PaymentStatus,
  PaymentMode,
} from "../lib/billing-data";
import type { DbProduct } from "./products";

// ── UUID validation ───────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── DB types ──────────────────────────────────────────────────────

export interface DbInvoice {
  id: string;
  business_id: string;
  customer_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  payment_status: string;
  payment_mode: string;
  amount_paid: number;
  is_inter_state: boolean;
  place_of_supply: string | null;
  notes: string | null;
  internal_notes: string | null;
  terms: string | null;
  salesperson: string | null;
  reference_number: string | null;
  po_number: string | null;
  delivery_date: string | null;
  delivery_address: string | null;
  billing_address: string | null;
  currency: string;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
}

export interface DbInvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  product_sku: string | null;
  hsn_code: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_percent: number;
  created_at: string;
}

export interface DbInvoiceWithItems extends DbInvoice {
  invoice_items: DbInvoiceItem[];
}

export type DbInvoiceInsert = Omit<DbInvoice, "id" | "created_at" | "updated_at">;
export type DbInvoiceUpdate = Partial<
  Omit<DbInvoice, "id" | "business_id" | "created_at" | "updated_at">
>;
export type DbInvoiceItemInsert = Omit<DbInvoiceItem, "id" | "created_at">;

// ── Adapters ──────────────────────────────────────────────────────

/** Map a DB invoice row (with embedded items) to the UI Invoice type. */
export function dbToInvoice(row: DbInvoiceWithItems): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    customerId: row.customer_id ?? "",
    status: row.status as InvoiceStatus,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentMode: row.payment_mode as PaymentMode,
    items: (row.invoice_items ?? []).map((item): InvoiceItem => ({
      productId: item.product_id ?? "",
      quantity: item.quantity,
      unitPrice: item.unit_price,
      discountPercent: item.discount_percent,
      gstPercent: item.gst_percent,
    })),
    createdDate: row.invoice_date,
    dueDate: row.due_date ?? "",
    amountPaid: row.amount_paid,
    notes: row.notes ?? "",
    internalNotes: row.internal_notes ?? "",
    terms: row.terms ?? "",
    placeOfSupply: row.place_of_supply ?? "Karnataka",
    isInterState: row.is_inter_state,
    salesperson: row.salesperson ?? "",
    referenceNumber: row.reference_number ?? "",
    poNumber: row.po_number ?? "",
    deliveryDate: row.delivery_date ?? "",
    deliveryAddress: row.delivery_address ?? "",
    billingAddress: row.billing_address ?? "",
    currency: row.currency,
    exchangeRate: row.exchange_rate,
  };
}

/** Map a UI Invoice to a DbInvoiceInsert. */
function invoiceToDbInsert(invoice: Invoice, businessId: string): DbInvoiceInsert {
  return {
    business_id: businessId,
    customer_id: invoice.customerId && isUUID(invoice.customerId) ? invoice.customerId : null,
    invoice_number: invoice.invoiceNumber,
    invoice_date: invoice.createdDate,
    due_date: invoice.dueDate || null,
    status: invoice.status,
    payment_status: invoice.paymentStatus,
    payment_mode: invoice.paymentMode,
    amount_paid: invoice.amountPaid,
    is_inter_state: invoice.isInterState,
    place_of_supply: invoice.placeOfSupply || null,
    notes: invoice.notes || null,
    internal_notes: invoice.internalNotes || null,
    terms: invoice.terms || null,
    salesperson: invoice.salesperson || null,
    reference_number: invoice.referenceNumber || null,
    po_number: invoice.poNumber || null,
    delivery_date: invoice.deliveryDate || null,
    delivery_address: invoice.deliveryAddress || null,
    billing_address: invoice.billingAddress || null,
    currency: invoice.currency ?? "INR",
    exchange_rate: invoice.exchangeRate ?? 1,
  };
}

// ── Service ───────────────────────────────────────────────────────

export const invoicesService = {
  /**
   * Fetch all invoices for a business (most recent first),
   * with their invoice_items embedded.
   */
  async getAll(businessId: string): Promise<Invoice[]> {
    const rows: DbInvoiceWithItems[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*)")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      rows.push(...((data ?? []) as DbInvoiceWithItems[]));
      if (!data || data.length < 1000) return rows.map(dbToInvoice);
    }
  },

  /**
   * Create an invoice with its line items and optionally deduct stock.
   *
   * @param invoice         UI Invoice object from InvoiceBuilder
   * @param businessId      Tenant scope
   * @param dbProducts      Current product list (used for product_name snapshots)
   * @param skipMovements   When true, skip inventory stock-out movements (for duplicates/drafts)
   */
  async create(
    invoice: Invoice,
    businessId: string,
    dbProducts: DbProduct[] = [],
    skipMovements = false,
  ): Promise<Invoice> {
    const productNameMap = new Map(dbProducts.map((p) => [p.id, p.name]));
    const productSkuMap = new Map(dbProducts.map((p) => [p.id, p.sku]));

    // 1. Insert invoice row
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert(invoiceToDbInsert(invoice, businessId))
      .select()
      .single();
    if (invErr) throw invErr;
    const savedInv = inv as DbInvoice;

    // 2. Insert invoice items
    const itemsPayload: DbInvoiceItemInsert[] = invoice.items.map((item) => ({
      invoice_id: savedInv.id,
      product_id: isUUID(item.productId) ? item.productId : null,
      product_name: productNameMap.get(item.productId) ?? item.productId ?? "Unknown",
      product_sku: productSkuMap.get(item.productId) ?? null,
      hsn_code: null,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      gst_percent: item.gstPercent,
    }));

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from("invoice_items").insert(itemsPayload);
      if (itemsErr) throw itemsErr;
    }

    // 3. Create stock-out movements (skipped for duplicates/drafts without actual sale)
    if (!skipMovements)
      for (const item of invoice.items) {
        if (!item.productId || !isUUID(item.productId)) continue;
        await inventoryMovementsService.create({
          business_id: businessId,
          product_id: item.productId,
          movement_type: "out",
          adjustment_type: null,
          adjustment_reason: null,
          quantity: item.quantity,
          reference: savedInv.invoice_number,
          supplier_id: null,
          reason: "Invoice sale",
          notes: `Invoice ${savedInv.invoice_number}`,
          created_by: null,
        });
      }

    // Return mapped invoice (re-attach items from the original)
    return dbToInvoice({
      ...savedInv,
      invoice_items: itemsPayload.map((ip, idx) => ({
        id: "",
        invoice_id: savedInv.id,
        product_id: ip.product_id ?? null,
        product_name: ip.product_name,
        product_sku: ip.product_sku ?? null,
        hsn_code: ip.hsn_code ?? null,
        quantity: ip.quantity,
        unit_price: ip.unit_price,
        discount_percent: ip.discount_percent,
        gst_percent: ip.gst_percent,
        created_at: savedInv.created_at,
      })),
    });
  },

  /**
   * Update invoice metadata (does NOT re-create stock movements).
   */
  async update(id: string, invoice: Invoice, businessId: string): Promise<Invoice> {
    const payload: DbInvoiceUpdate = {
      customer_id: invoice.customerId && isUUID(invoice.customerId) ? invoice.customerId : null,
      invoice_date: invoice.createdDate,
      due_date: invoice.dueDate || null,
      status: invoice.status,
      payment_status: invoice.paymentStatus,
      payment_mode: invoice.paymentMode,
      amount_paid: invoice.amountPaid,
      is_inter_state: invoice.isInterState,
      place_of_supply: invoice.placeOfSupply || null,
      notes: invoice.notes || null,
      internal_notes: invoice.internalNotes || null,
      terms: invoice.terms || null,
      salesperson: invoice.salesperson || null,
      reference_number: invoice.referenceNumber || null,
      po_number: invoice.poNumber || null,
      delivery_date: invoice.deliveryDate || null,
      delivery_address: invoice.deliveryAddress || null,
      billing_address: invoice.billingAddress || null,
      currency: invoice.currency ?? "INR",
      exchange_rate: invoice.exchangeRate ?? 1,
    };

    const { data, error } = await supabase
      .from("invoices")
      .update(payload)
      .eq("id", id)
      .select("*, invoice_items(*)")
      .single();
    if (error) throw error;
    return dbToInvoice(data as DbInvoiceWithItems);
  },

  /** Delete an invoice (cascade deletes its items). */
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) throw error;
  },

  /** Update status/payment on multiple invoices. */
  async bulkMarkPaid(ids: string[], grandTotals: Map<string, number>): Promise<void> {
    for (const id of ids) {
      const total = grandTotals.get(id) ?? 0;
      await supabase
        .from("invoices")
        .update({ status: "paid", payment_status: "paid", amount_paid: total })
        .eq("id", id);
    }
  },
};
