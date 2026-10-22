import test from "node:test";
import assert from "node:assert/strict";
import { buildReportModel } from "../src/lib/report-model.ts";

const emptySnapshot = {
  invoices: [],
  payments: [],
  customers: [],
  products: [],
  categories: [],
  suppliers: [],
  movements: [],
  leads: [],
  bills: [],
  transactions: [],
  purchaseOrders: [],
  receipts: [],
  creditNotes: [],
  financeSettings: { financial_year_start_month: 7 },
};

test("report months include expense-only and supplier-bill-only periods", () => {
  const model = buildReportModel({
    ...emptySnapshot,
    transactions: [
      {
        transaction_type: "expense",
        status: "completed",
        transaction_date: "2025-01-15",
        amount: 40,
      },
      {
        transaction_type: "expense",
        status: "pending",
        transaction_date: "2025-02-15",
        amount: 90,
      },
    ],
    bills: [{ bill_date: "2025-03-02", total: 30, gst_amount: 5, amount_paid: 0 }],
  });

  assert.deepEqual(
    model.months.map((month) => month.key),
    ["2025-01", "2025-03"],
  );
  assert.equal(model.months[0].expenses, 40);
  assert.equal(model.months[0].netProfit, -40);
  assert.equal(model.gstMonths[1].itcClaimed, 5);
  assert.equal(model.expenses.length, 1);
  assert.equal(model.financialYearStartMonth, 7);
});

test("invoice totals exclude drafts and subtract issued credit notes", () => {
  const model = buildReportModel({
    ...emptySnapshot,
    invoices: [
      {
        id: "inv-1",
        status: "sent",
        invoice_date: "2025-04-10",
        amount_paid: 0,
        invoice_items: [{ quantity: 2, unit_price: 100, discount_percent: 0, gst_percent: 10 }],
      },
      { id: "inv-2", status: "draft", invoice_date: "2025-04-11", invoice_items: [] },
    ],
    creditNotes: [{ invoice_id: "inv-1", status: "issued", grand_total: 22, tax_total: 2 }],
  });

  assert.equal(model.validInvoices.length, 1);
  assert.equal(model.months[0].revenue, 198);
  assert.equal(model.months[0].collected, 18);
  assert.equal(model.outstanding, 198);
});

test("report invoice totals use the billing whole-currency round-off", () => {
  const model = buildReportModel({
    ...emptySnapshot,
    invoices: [
      {
        id: "inv-rounding",
        status: "sent",
        invoice_date: "2025-04-10",
        amount_paid: 0,
        invoice_items: [{ quantity: 1, unit_price: 100, discount_percent: 0, gst_percent: 0.5 }],
      },
    ],
  });

  assert.equal(model.months[0].revenue, 101);
  assert.equal(model.outstanding, 101);
});

test("receivables reflect partial payments and exclude refunded receipts", () => {
  const model = buildReportModel({
    ...emptySnapshot,
    invoices: [
      {
        id: "inv-partial",
        status: "partial",
        payment_status: "partial",
        invoice_date: "2025-04-10",
        amount_paid: 30,
        invoice_items: [{ quantity: 1, unit_price: 100, discount_percent: 10, gst_percent: 10 }],
      },
    ],
    payments: [
      { amount: 30, status: "received", payment_date: "2025-04-12" },
      { amount: 15, status: "refunded", payment_date: "2025-04-13" },
    ],
  });

  assert.equal(model.outstanding, 69);
  assert.equal(model.paymentMonths.get("2025-04"), 30);
});

test("void credit notes do not reduce report revenue or tax", () => {
  const model = buildReportModel({
    ...emptySnapshot,
    invoices: [
      {
        id: "inv-credit",
        status: "sent",
        invoice_date: "2025-04-10",
        amount_paid: 0,
        invoice_items: [{ quantity: 1, unit_price: 100, discount_percent: 0, gst_percent: 10 }],
      },
    ],
    creditNotes: [{ invoice_id: "inv-credit", status: "voided", grand_total: 55, tax_total: 5 }],
  });

  assert.equal(model.months[0].revenue, 110);
  assert.equal(model.months[0].collected, 10);
  assert.equal(model.outstanding, 110);
});
