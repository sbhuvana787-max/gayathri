import { supabase } from "@/lib/supabase";

export type FinanceTransactionType = "income" | "expense" | "transfer";
export type FinanceTransactionStatus = "pending" | "completed" | "failed" | "reconciled" | "voided";

export interface FinanceTransaction {
  id: string;
  business_id: string;
  bank_account_id: string | null;
  transfer_to_account_id?: string | null;
  transaction_type: FinanceTransactionType;
  status: FinanceTransactionStatus;
  transaction_date: string;
  reference: string | null;
  category: string;
  counterparty: string;
  description: string;
  amount: number;
  payment_method: string;
  gst_rate: number;
  has_receipt: boolean;
  notes: string;
  created_at: string;
}

export interface FinanceAccount {
  id: string;
  business_id: string;
  bank_name: string;
  account_holder: string;
  account_number_masked: string;
  ifsc: string;
  account_type: "Current" | "Savings" | "OD" | "Cash";
  opening_balance: number;
  opening_balance_date: string;
  is_active: boolean;
}

export interface FinanceSettings {
  business_id: string;
  currency: string;
  financial_year_start_month: number;
  tax_registration_type: string;
  tds_applicable: boolean;
  default_payment_terms_days: number;
  invoice_start_number: number;
}

export interface FinancePayment {
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
  bank_account_id: string | null;
  invoices?: {
    invoice_number: string;
    customer_id: string | null;
    amount_paid: number;
    status: string;
    due_date: string | null;
    invoice_date: string;
  } | null;
  customers?: { name: string; phone: string; email: string } | null;
}

export interface FinanceInvoice {
  id: string;
  business_id: string;
  customer_id: string | null;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  status: string;
  payment_status: string;
  amount_paid: number;
  currency: string;
  is_inter_state: boolean;
  customers?: { name: string; phone: string; email: string } | null;
  invoice_items: {
    quantity: number;
    unit_price: number;
    discount_percent: number;
    gst_percent: number;
  }[];
}

export interface FinanceBill {
  id: string;
  business_id: string;
  bill_number: string;
  supplier_id: string;
  bill_date: string;
  due_date: string;
  gst_amount: number;
  total: number;
  amount_paid: number;
  payment_status: string;
  suppliers?: { name: string; phone: string; email: string } | null;
}

export interface FinanceBillPayment {
  id: string;
  business_id: string;
  purchase_bill_id: string;
  amount: number;
  payment_date: string;
  bank_account_id: string | null;
  payment_method: string;
  purchase_bills?: {
    bill_number: string;
    supplier_id: string;
    suppliers?: { name: string } | null;
  } | null;
}

export interface FinanceSnapshot {
  transactions: FinanceTransaction[];
  accounts: FinanceAccount[];
  settings: FinanceSettings | null;
  payments: FinancePayment[];
  invoices: FinanceInvoice[];
  bills: FinanceBill[];
  billPayments: FinanceBillPayment[];
}

const throwIfError = <T>(result: { data: T | null; error: unknown }) => {
  if (result.error) throw result.error;
  return result.data;
};

export const financeService = {
  async saveBusinessPreferences(
    businessId: string,
    currency: string,
    financialYearStartMonth: number,
    decimalPrecision: number,
    financialYear: string,
  ) {
    const { error } = await supabase.rpc("save_business_financial_preferences", {
      p_business_id: businessId,
      p_currency: currency,
      p_financial_year_start_month: financialYearStartMonth,
      p_decimal_precision: decimalPrecision,
      p_financial_year: financialYear,
    });
    if (error) throw error;
  },

  async getSnapshot(businessId: string): Promise<FinanceSnapshot> {
    const [transactions, accounts, settings, payments, invoices, bills, billPayments] =
      await Promise.all([
        supabase
          .from("finance_transactions")
          .select("*")
          .eq("business_id", businessId)
          .order("transaction_date", { ascending: false })
          .range(0, 4999),
        supabase
          .from("finance_bank_accounts")
          .select("*")
          .eq("business_id", businessId)
          .order("bank_name"),
        supabase.from("finance_settings").select("*").eq("business_id", businessId).maybeSingle(),
        supabase
          .from("payments")
          .select(
            "id,business_id,payment_number,invoice_id,customer_id,amount,mode,status,payment_date,transaction_ref,notes,currency,bank_account_id,invoices!payments_invoice_id_fkey(invoice_number,customer_id,amount_paid,status,due_date,invoice_date),customers!payments_customer_id_fkey(name,phone,email)",
          )
          .eq("business_id", businessId)
          .in("status", ["received", "completed", "refunded"])
          .order("payment_date", { ascending: false })
          .range(0, 4999),
        supabase
          .from("invoices")
          .select(
            "id,business_id,customer_id,invoice_number,invoice_date,due_date,status,payment_status,amount_paid,currency,is_inter_state,customers!invoices_customer_id_fkey(name,phone,email),invoice_items(quantity,unit_price,discount_percent,gst_percent)",
          )
          .eq("business_id", businessId)
          .not("status", "in", "(draft,cancelled)")
          .order("invoice_date", { ascending: false })
          .range(0, 4999),
        supabase
          .from("purchase_bills")
          .select(
            "id,business_id,bill_number,supplier_id,bill_date,due_date,gst_amount,total,amount_paid,payment_status,suppliers!purchase_bills_supplier_id_fkey(name,phone,email)",
          )
          .eq("business_id", businessId)
          .order("bill_date", { ascending: false })
          .range(0, 4999),
        supabase
          .from("purchase_bill_payments")
          .select(
            "id,business_id,purchase_bill_id,amount,payment_date,bank_account_id,payment_method,purchase_bills!purchase_bill_payments_purchase_bill_id_fkey(bill_number,supplier_id,suppliers!purchase_bills_supplier_id_fkey(name))",
          )
          .eq("business_id", businessId)
          .order("payment_date", { ascending: false })
          .range(0, 4999),
      ]);
    return {
      transactions: (throwIfError(transactions) ?? []) as unknown as FinanceTransaction[],
      accounts: (throwIfError(accounts) ?? []) as unknown as FinanceAccount[],
      settings: throwIfError(settings) as unknown as FinanceSettings | null,
      payments: (throwIfError(payments) ?? []) as unknown as FinancePayment[],
      invoices: (throwIfError(invoices) ?? []) as unknown as FinanceInvoice[],
      bills: (throwIfError(bills) ?? []) as unknown as FinanceBill[],
      billPayments: (throwIfError(billPayments) ?? []) as unknown as FinanceBillPayment[],
    };
  },

  async createTransaction(
    businessId: string,
    input: Omit<FinanceTransaction, "id" | "business_id" | "created_at">,
  ) {
    if (
      !input.category.trim() ||
      !input.transaction_date ||
      !Number.isFinite(input.amount) ||
      Math.round(input.amount * 100) <= 0
    ) {
      throw new Error("Enter a category, valid date, and amount greater than zero.");
    }
    const { data, error } = await supabase
      .from("finance_transactions")
      .insert({ ...input, business_id: businessId })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FinanceTransaction;
  },

  async updateTransaction(id: string, patch: Partial<FinanceTransaction>) {
    const { id: _id, business_id: _businessId, created_at: _createdAt, ...values } = patch;
    const { data, error } = await supabase
      .from("finance_transactions")
      .update(values)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FinanceTransaction;
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase.from("finance_transactions").delete().eq("id", id);
    if (error) throw error;
  },

  async createAccount(businessId: string, input: Omit<FinanceAccount, "id" | "business_id">) {
    if (!input.bank_name.trim()) throw new Error("Bank or account name is required.");
    if (!input.opening_balance_date || !Number.isFinite(input.opening_balance)) {
      throw new Error("Enter a valid opening balance and date.");
    }
    if (input.account_type !== "OD" && input.opening_balance < 0) {
      throw new Error("Only overdraft accounts can have a negative opening balance.");
    }
    const { data, error } = await supabase
      .from("finance_bank_accounts")
      .insert({ ...input, business_id: businessId })
      .select("*")
      .single();
    if (error) throw error;
    return data as unknown as FinanceAccount;
  },

  async saveSettings(
    businessId: string,
    settings: Omit<FinanceSettings, "business_id"> & {
      gstNumber: string;
      panNumber: string;
      invoicePrefix: string;
    },
  ) {
    const { error } = await supabase.rpc("save_finance_settings", {
      p_business_id: businessId,
      p_currency: settings.currency,
      p_financial_year_start_month: settings.financial_year_start_month,
      p_tax_registration_type: settings.tax_registration_type,
      p_tds_applicable: settings.tds_applicable,
      p_default_payment_terms_days: settings.default_payment_terms_days,
      p_invoice_start_number: settings.invoice_start_number,
      p_gst_number: settings.gstNumber,
      p_pan_number: settings.panNumber,
      p_invoice_prefix: settings.invoicePrefix,
    });
    if (error) throw error;
  },

  async recordBillPayment(
    businessId: string,
    billId: string,
    amount: number,
    date: string,
    method: string,
    bankAccountId: string | null,
    createdBy: string,
  ) {
    if (!Number.isFinite(amount) || Math.round(amount * 100) <= 0)
      throw new Error("Payment must be greater than zero.");
    const { error } = await supabase.rpc("record_finance_purchase_bill_payment", {
      p_business_id: businessId,
      p_purchase_bill_id: billId,
      p_amount: amount,
      p_payment_date: date,
      p_payment_method: method,
      p_bank_account_id: bankAccountId,
      p_created_by: createdBy,
    });
    if (error) throw error;
  },

  async recordInvoicePayment(
    businessId: string,
    invoiceId: string,
    amount: number,
    mode: string,
    date: string,
    bankAccountId: string | null,
  ) {
    if (!Number.isFinite(amount) || Math.round(amount * 100) <= 0)
      throw new Error("Payment must be greater than zero.");
    const { error } = await supabase.rpc("record_finance_invoice_payment", {
      p_business_id: businessId,
      p_invoice_id: invoiceId,
      p_amount: Math.round(amount * 100) / 100,
      p_mode: mode,
      p_payment_date: date,
      p_transaction_ref: null,
      p_notes: "Recorded from Finance receivables",
      p_bank_account_id: bankAccountId,
    });
    if (error) throw error;
  },

  async createTransfer(
    businessId: string,
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    date: string,
    reference: string,
    notes: string,
  ) {
    if (!Number.isFinite(amount) || Math.round(amount * 100) <= 0)
      throw new Error("Transfer amount must be greater than zero.");
    if (!date) throw new Error("Transfer date is required.");
    const { data, error } = await supabase.rpc("record_finance_transfer", {
      p_business_id: businessId,
      p_from_account_id: fromAccountId,
      p_to_account_id: toAccountId,
      p_amount: Math.round(amount * 100) / 100,
      p_transaction_date: date,
      p_reference: reference || null,
      p_notes: notes || "",
    });
    if (error) throw error;
    return data as string;
  },
};

export function invoiceTotal(invoice: FinanceInvoice): number {
  const preRoundTotal = invoice.invoice_items.reduce((sum, item) => {
    const taxable = item.quantity * item.unit_price * (1 - item.discount_percent / 100);
    return sum + taxable + (taxable * item.gst_percent) / 100;
  }, 0);
  // Match Billing's displayed total and the round-off shown on invoices.
  return Math.round(preRoundTotal);
}
