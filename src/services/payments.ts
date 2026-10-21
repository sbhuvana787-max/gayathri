/**
 * payments.ts — Supabase CRUD service for the Billing Payments module.
 *
 * On create: inserts payment, updates invoice amount_paid + payment_status.
 * On refund/void: reverses the invoice amount_paid update.
 */

import { supabase } from "../lib/supabase";
import type { PaymentTxn, PaymentTxnStatus, PaymentMode } from "../lib/billing-data";

// ── UUID helper ────────────────────────────────────────────────────

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

// ── DB types ───────────────────────────────────────────────────────

export interface DbPayment {
  id: string;
  business_id: string;
  payment_number: string;
  invoice_id: string | null;
  customer_id: string | null;
  amount: number;
  mode: string;
  status: string;
  payment_date: string;
  transaction_ref: string | null;
  notes: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

/** Shape returned from the joined select */
interface DbPaymentJoined extends DbPayment {
  invoices: { invoice_number: string } | null;
  customers: { name: string; city: string | null } | null;
}

export type DbPaymentInsert = Omit<DbPayment, "id" | "created_at" | "updated_at">;
export type DbPaymentUpdate = Partial<
  Omit<DbPayment, "id" | "business_id" | "created_at" | "updated_at">
>;

// ── Invoice balance helper ─────────────────────────────────────────

async function getInvoiceBalance(
  invoiceId: string,
): Promise<{ amountPaid: number; grandTotal: number }> {
  const { data, error } = await supabase
    .from("invoices")
    .select("amount_paid, invoice_items(quantity, unit_price, discount_percent, gst_percent)")
    .eq("id", invoiceId)
    .single();
  if (error) throw error;

  const grandTotal = (
    (data.invoice_items as unknown as {
      quantity: number;
      unit_price: number;
      discount_percent: number;
      gst_percent: number;
    }[]) ?? []
  ).reduce((sum, item) => {
    const line = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
    return sum + line * (1 + item.gst_percent / 100);
  }, 0);

  return { amountPaid: (data as { amount_paid: number }).amount_paid ?? 0, grandTotal };
}

/** Compute payment_status and optionally invoice status based on paid amount vs grand total. */
function deriveInvoiceStatus(newAmountPaid: number, grandTotal: number) {
  if (newAmountPaid >= grandTotal) {
    return { payment_status: "paid", status: "paid" };
  }
  if (newAmountPaid > 0) {
    return { payment_status: "partial", status: undefined };
  }
  return { payment_status: "pending", status: undefined };
}

/** Update invoice amount_paid and payment_status. delta is positive to add, negative to reverse. */
async function adjustInvoiceBalance(invoiceId: string, delta: number): Promise<void> {
  if (!isUUID(invoiceId)) return;
  const { amountPaid, grandTotal } = await getInvoiceBalance(invoiceId);
  const newAmountPaid = Math.max(0, amountPaid + delta);
  const derived = deriveInvoiceStatus(newAmountPaid, grandTotal);
  await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      payment_status: derived.payment_status,
      ...(derived.status ? { status: derived.status } : {}),
    })
    .eq("id", invoiceId);
}

// ── Series number ──────────────────────────────────────────────────

async function generatePaymentNumber(businessId: string): Promise<string> {
  const year = new Date().getFullYear();
  const { data } = await supabase
    .from("payments")
    .select("payment_number")
    .eq("business_id", businessId)
    .like("payment_number", `PMT-${year}-%`)
    .order("payment_number", { ascending: false })
    .limit(1);
  const last = (data?.[0] as { payment_number?: string })?.payment_number ?? `PMT-${year}-0000`;
  const num = parseInt(last.split("-").pop() ?? "0", 10) + 1;
  return `PMT-${year}-${String(num).padStart(4, "0")}`;
}

// ── Adapter ────────────────────────────────────────────────────────

function dbToPayment(row: DbPaymentJoined): PaymentTxn {
  const d = new Date(row.created_at);
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return {
    id: row.id,
    paymentNumber: row.payment_number,
    invoiceId: row.invoice_id ?? "",
    customerId: row.customer_id ?? "",
    amount: row.amount,
    mode: row.mode as PaymentMode,
    status: row.status as PaymentTxnStatus,
    date: row.payment_date,
    time,
    notes: row.notes ?? "",
    transactionRef: row.transaction_ref ?? undefined,
    invoiceNumber: row.invoices?.invoice_number ?? undefined,
    customerName: row.customers?.name ?? undefined,
    customerCity: row.customers?.city ?? undefined,
    currency: row.currency,
  };
}

// ── Service ────────────────────────────────────────────────────────

export const paymentsService = {
  /** Fetch all payments for a business (most recent first). */
  async getAll(businessId: string): Promise<PaymentTxn[]> {
    const { data, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        invoices!payments_invoice_id_fkey(invoice_number),
        customers!payments_customer_id_fkey(name, city)
      `,
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbPaymentJoined[]).map(dbToPayment);
  },

  /** Record a new payment and update the linked invoice balance. */
  async create(
    input: {
      invoiceId: string;
      customerId: string;
      amount: number;
      mode: PaymentMode;
      date: string;
      transactionRef?: string;
      notes?: string;
      currency?: string;
    },
    businessId: string,
  ): Promise<PaymentTxn> {
    const paymentNumber = await generatePaymentNumber(businessId);

    const insert: DbPaymentInsert = {
      business_id: businessId,
      payment_number: paymentNumber,
      invoice_id: isUUID(input.invoiceId) ? input.invoiceId : null,
      customer_id: isUUID(input.customerId) ? input.customerId : null,
      amount: input.amount,
      mode: input.mode,
      status: "received",
      payment_date: input.date,
      transaction_ref: input.transactionRef || null,
      notes: input.notes || null,
      currency: input.currency || "INR",
    };

    const { data, error } = await supabase
      .from("payments")
      .insert(insert)
      .select(
        `*, invoices!payments_invoice_id_fkey(invoice_number), customers!payments_customer_id_fkey(name, city)`,
      )
      .single();
    if (error) throw error;

    // Update invoice balance
    if (isUUID(input.invoiceId)) {
      await adjustInvoiceBalance(input.invoiceId, input.amount);

      // Insert payment allocation
      await supabase.from("payment_allocations").insert({
        payment_id: (data as DbPayment).id,
        invoice_id: input.invoiceId,
        amount_allocated: input.amount,
      });
    }

    return dbToPayment(data as DbPaymentJoined);
  },

  /** Update payment metadata (does NOT re-adjust invoice balance). */
  async update(
    id: string,
    input: {
      mode?: PaymentMode;
      date?: string;
      transactionRef?: string;
      notes?: string;
    },
  ): Promise<PaymentTxn> {
    const payload: DbPaymentUpdate = {
      ...(input.mode !== undefined ? { mode: input.mode } : {}),
      ...(input.date !== undefined ? { payment_date: input.date } : {}),
      ...(input.transactionRef !== undefined
        ? { transaction_ref: input.transactionRef || null }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    };
    const { data, error } = await supabase
      .from("payments")
      .update(payload)
      .eq("id", id)
      .select(
        `*, invoices!payments_invoice_id_fkey(invoice_number), customers!payments_customer_id_fkey(name, city)`,
      )
      .single();
    if (error) throw error;
    return dbToPayment(data as DbPaymentJoined);
  },

  /** Delete a payment. Does NOT reverse the invoice balance (admin-level action). */
  async delete(id: string, invoiceId: string, amount: number): Promise<void> {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw error;
    // Reverse invoice balance
    if (isUUID(invoiceId)) {
      await adjustInvoiceBalance(invoiceId, -amount);
    }
  },

  /** Mark a received payment as refunded and reverse the invoice balance. */
  async refund(id: string, invoiceId: string, amount: number): Promise<void> {
    const { error } = await supabase.from("payments").update({ status: "refunded" }).eq("id", id);
    if (error) throw error;
    if (isUUID(invoiceId)) {
      await adjustInvoiceBalance(invoiceId, -amount);
    }
  },

  /** Mark a payment as voided and reverse the invoice balance. */
  async void(id: string, invoiceId: string, amount: number): Promise<void> {
    const { error } = await supabase.from("payments").update({ status: "voided" }).eq("id", id);
    if (error) throw error;
    if (isUUID(invoiceId)) {
      await adjustInvoiceBalance(invoiceId, -amount);
    }
  },
};
