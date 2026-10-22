/**
 * payments.ts — Supabase CRUD service for the Billing Payments module.
 *
 * On create: inserts payment, updates invoice amount_paid + payment_status.
 * On refund/void: reverses the invoice amount_paid update.
 */

import { supabase } from "../lib/supabase";
import type { PaymentTxn, PaymentTxnStatus, PaymentMode } from "../lib/billing-data";

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
    const amount = Math.round(input.amount * 100) / 100;
    if (!Number.isFinite(amount) || amount <= 0)
      throw new Error("Payment must be greater than zero.");
    if (!input.invoiceId) throw new Error("Select an invoice for this payment.");
    if (!input.date) throw new Error("Payment date is required.");

    // This database routine locks the invoice, validates its current balance,
    // allocates a unique payment number, and writes the receipt and invoice
    // balance in one transaction. Never split these steps into client writes.
    const { data: paymentId, error } = await supabase.rpc("record_finance_invoice_payment", {
      p_business_id: businessId,
      p_invoice_id: input.invoiceId,
      p_amount: amount,
      p_mode: input.mode,
      p_payment_date: input.date,
      p_transaction_ref: input.transactionRef || null,
      p_notes: input.notes || null,
      p_bank_account_id: null,
    });
    if (error) throw error;
    const { data, error: readError } = await supabase
      .from("payments")
      .select(
        `*, invoices!payments_invoice_id_fkey(invoice_number), customers!payments_customer_id_fkey(name, city)`,
      )
      .eq("id", paymentId as string)
      .eq("business_id", businessId)
      .single();
    if (readError) throw readError;
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
  async delete(id: string, businessId: string): Promise<void> {
    const { error } = await supabase.rpc("delete_finance_invoice_payment", {
      p_business_id: businessId,
      p_payment_id: id,
    });
    if (error) throw error;
  },

  /** Mark a received payment as refunded and reverse the invoice balance. */
  async refund(id: string, businessId: string): Promise<void> {
    const { error } = await supabase.rpc("reverse_finance_invoice_payment", {
      p_business_id: businessId,
      p_payment_id: id,
      p_target_status: "refunded",
    });
    if (error) throw error;
  },

  /** Mark a payment as voided and reverse the invoice balance. */
  async void(id: string, businessId: string): Promise<void> {
    const { error } = await supabase.rpc("reverse_finance_invoice_payment", {
      p_business_id: businessId,
      p_payment_id: id,
      p_target_status: "voided",
    });
    if (error) throw error;
  },
};
