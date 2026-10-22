/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { reportsService } from "@/services/reports";

export type ReportsSnapshot = Awaited<ReturnType<typeof reportsService.snapshot>>;
export const money = (value: unknown) => Number(value ?? 0) || 0;
export const invoiceTotal = (invoice: any) =>
  Math.max(
    0,
    Math.round(
      (invoice.invoice_items ?? []).reduce((sum: number, item: any) => {
        const taxable =
          money(item.quantity) * money(item.unit_price) * (1 - money(item.discount_percent) / 100);
        return sum + taxable + (taxable * money(item.gst_percent)) / 100;
      }, 0) - money(invoice.credit_total),
    ),
  );
export const itemNet = (item: any) =>
  Math.round(
    money(item.quantity) * money(item.unit_price) * (1 - money(item.discount_percent) / 100) * 100,
  ) / 100;
export const monthKey = (date: string) => date?.slice(0, 7) ?? "";
export const monthLabel = (key: string) =>
  key
    ? new Date(`${key}-01T00:00:00`).toLocaleDateString("en-IN", {
        month: "short",
        year: "numeric",
      })
    : "Unknown";

export function buildReportModel(data: ReportsSnapshot) {
  const creditsByInvoice = new Map<string, { total: number; tax: number }>();
  data.creditNotes
    .filter((note: any) => ["issued", "applied"].includes(note.status) && note.invoice_id)
    .forEach((note: any) => {
      const totals = creditsByInvoice.get(note.invoice_id) ?? { total: 0, tax: 0 };
      totals.total += money(note.grand_total);
      totals.tax += money(note.tax_total);
      creditsByInvoice.set(note.invoice_id, totals);
    });
  const validInvoices = data.invoices
    .filter((row: any) => !["draft", "cancelled"].includes(row.status))
    .map((row: any) => ({
      ...row,
      credit_total: creditsByInvoice.get(row.id)?.total ?? 0,
      credit_tax: creditsByInvoice.get(row.id)?.tax ?? 0,
    }));
  const products = new Map(data.products.map((row: any) => [row.id, row]));
  const customers = new Map(data.customers.map((row: any) => [row.id, row]));
  const categories = new Map(data.categories.map((row: any) => [row.id, row.name]));
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const byMonth = new Map<string, any>();
  const customerTotals = new Map<string, any>();
  const customerYearTotals = new Map<string, { current: number; previous: number }>();
  const productTotals = new Map<string, any>();
  const categoryTotals = new Map<string, number>();
  for (const invoice of validInvoices as any[]) {
    const key = monthKey(invoice.invoice_date);
    const total = invoiceTotal(invoice);
    const bucket = byMonth.get(key) ?? {
      month: monthLabel(key),
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      value: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      collected: 0,
      itcClaimed: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      payable: 0,
    };
    bucket.revenue += total;
    bucket.value += total;
    const balance = Math.max(0, total - money(invoice.amount_paid));
    if (invoice.payment_status === "paid" || balance === 0) bucket.paid++;
    else if (
      invoice.payment_status === "overdue" ||
      (invoice.due_date && invoice.due_date < now.toISOString().slice(0, 10) && balance > 0)
    )
      bucket.overdue++;
    else bucket.pending++;
    bucket.collected += invoiceTotalTax(invoice);
    bucket.igst += invoice.is_inter_state ? invoiceTotalTax(invoice) : 0;
    bucket.cgst += invoice.is_inter_state ? 0 : invoiceTotalTax(invoice) / 2;
    bucket.sgst += invoice.is_inter_state ? 0 : invoiceTotalTax(invoice) / 2;
    byMonth.set(key, bucket);
    if (invoice.customer_id) {
      const row = customerTotals.get(invoice.customer_id) ?? {
        name: customers.get(invoice.customer_id)?.name ?? "Unknown",
        revenue: 0,
        orders: 0,
        amount: 0,
      };
      row.revenue += total;
      row.amount += total;
      row.orders++;
      customerTotals.set(invoice.customer_id, row);
      const years = customerYearTotals.get(invoice.customer_id) ?? { current: 0, previous: 0 };
      const year = Number(String(invoice.invoice_date).slice(0, 4));
      if (year === now.getFullYear()) years.current += total;
      if (year === now.getFullYear() - 1) years.previous += total;
      customerYearTotals.set(invoice.customer_id, years);
    }
    for (const item of invoice.invoice_items ?? []) {
      const p = products.get(item.product_id);
      if (!p) continue;
      const row = productTotals.get(p.id) ?? {
        name: p.name,
        sku: p.sku,
        category: categories.get(p.category_id) ?? "Uncategorized",
        unitsSold: 0,
        revenue: 0,
      };
      row.unitsSold += money(item.quantity);
      row.revenue += itemNet(item) * (1 + money(item.gst_percent) / 100);
      productTotals.set(p.id, row);
      const cat = row.category;
      const itemRevenue = itemNet(item) * (1 + money(item.gst_percent) / 100);
      categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + itemRevenue);
    }
  }
  // Include periods that contain only cash activity or supplier bills. Building
  // the timeline from invoices alone hid expense-only and bill-only months.
  const ensureMonth = (date: string) => {
    const key = monthKey(date);
    if (!key || byMonth.has(key)) return;
    byMonth.set(key, {
      key,
      month: monthLabel(key),
      revenue: 0,
      expenses: 0,
      netProfit: 0,
      value: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
      collected: 0,
      itcClaimed: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      payable: 0,
    });
  };
  data.transactions.forEach((row: any) => {
    if (row.transaction_type === "expense" && ["completed", "reconciled"].includes(row.status))
      ensureMonth(row.transaction_date);
  });
  data.payments.forEach((row: any) => {
    if (["received", "completed"].includes(row.status)) ensureMonth(row.payment_date);
  });
  data.bills.forEach((row: any) => ensureMonth(row.bill_date));
  const months = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      value.key = key;
      return value;
    });
  const topCustomers = [...customerTotals.entries()]
    .map(([id, customer]) => {
      const years = customerYearTotals.get(id) ?? { current: 0, previous: 0 };
      return {
        ...customer,
        growth: years.previous
          ? Math.round(((years.current - years.previous) / years.previous) * 1000) / 10
          : 0,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
  const allProductRows = data.products.map((p: any) => ({
    ...(productTotals.get(p.id) ?? { unitsSold: 0, revenue: 0 }),
    name: p.name,
    sku: p.sku,
    category: categories.get(p.category_id) ?? "Uncategorized",
  }));
  const topProducts = [...allProductRows].sort((a, b) => b.unitsSold - a.unitsSold);
  const leastProducts = [...allProductRows].sort((a, b) => a.unitsSold - b.unitsSold);
  const categoriesData: { name: string; revenue: number; share: number; turnoverRate: number }[] = [
    ...categoryTotals,
  ].map(([name, revenue]) => ({
    name,
    revenue,
    share: 0,
    turnoverRate: 0,
  }));
  const catTotal = categoriesData.reduce((sum, row) => sum + row.revenue, 0);
  categoriesData.forEach((row) => {
    row.share = catTotal ? Math.round((row.revenue / catTotal) * 1000) / 10 : 0;
    const categoryProducts = data.products.filter(
      (product: any) => (categories.get(product.category_id) ?? "Uncategorized") === row.name,
    );
    const sold = categoryProducts.reduce(
      (sum: number, product: any) => sum + (productTotals.get(product.id)?.unitsSold ?? 0),
      0,
    );
    const snapshots = data.movements.filter((movement: any) =>
      categoryProducts.some((product: any) => product.id === movement.product_id),
    );
    const averageStock = snapshots.length
      ? snapshots.reduce(
          (sum: number, movement: any) =>
            sum + (money(movement.previous_stock) + money(movement.new_stock)) / 2,
          0,
        ) / snapshots.length
      : categoryProducts.reduce(
          (sum: number, product: any) => sum + money(product.current_stock),
          0,
        );
    row.turnoverRate = averageStock ? Math.round((sold / averageStock) * 10) / 10 : 0;
  });
  const stockValue = data.products.reduce(
    (sum: number, p: any) => sum + money(p.current_stock) * money(p.cost_price || p.purchase_price),
    0,
  );
  const receivables = validInvoices.reduce(
    (sum: number, inv: any) => sum + Math.max(0, invoiceTotal(inv) - money(inv.amount_paid)),
    0,
  );
  const payables = data.bills.reduce(
    (sum: number, bill: any) => sum + Math.max(0, money(bill.total) - money(bill.amount_paid)),
    0,
  );
  const expenses = data.transactions.filter(
    (row: any) =>
      row.transaction_type === "expense" && ["completed", "reconciled"].includes(row.status),
  );
  const expenseMonths = new Map<string, number>();
  expenses.forEach((row: any) =>
    expenseMonths.set(
      monthKey(row.transaction_date),
      (expenseMonths.get(monthKey(row.transaction_date)) ?? 0) + money(row.amount),
    ),
  );
  for (const [key, value] of byMonth) {
    value.expenses = expenseMonths.get(key) ?? 0;
    value.netProfit = value.revenue - value.expenses;
    value.value = value.revenue;
  }
  const payments = data.payments.filter((row: any) =>
    ["received", "completed"].includes(row.status),
  );
  const paymentMonths = new Map<string, number>();
  payments.forEach((row: any) =>
    paymentMonths.set(
      monthKey(row.payment_date),
      (paymentMonths.get(monthKey(row.payment_date)) ?? 0) + money(row.amount),
    ),
  );
  return {
    financialYearStartMonth: Number(data.financeSettings?.financial_year_start_month) || 4,
    validInvoices,
    months,
    topCustomers,
    topProducts,
    leastProducts,
    categoriesData,
    salesByPeriod: months.map((row: any) => ({
      label: row.month,
      revenue: row.revenue,
      orders: validInvoices.filter(
        (inv: any) => monthKey(inv.invoice_date) === monthKeyFromLabel(row.month),
      ).length,
    })),
    invoiceStats: {
      total: validInvoices.length,
      paid: {
        count: validInvoices.filter(
          (i: any) => i.payment_status === "paid" || invoiceTotal(i) <= money(i.amount_paid),
        ).length,
        amount: validInvoices
          .filter((i: any) => i.payment_status === "paid")
          .reduce((s: number, i: any) => s + invoiceTotal(i), 0),
      },
      pending: {
        count: validInvoices.filter(
          (i: any) =>
            i.payment_status !== "paid" &&
            i.payment_status !== "overdue" &&
            invoiceTotal(i) > money(i.amount_paid) &&
            !(i.due_date && i.due_date < now.toISOString().slice(0, 10)),
        ).length,
        amount: validInvoices
          .filter(
            (i: any) =>
              i.payment_status !== "paid" &&
              i.payment_status !== "overdue" &&
              invoiceTotal(i) > money(i.amount_paid) &&
              !(i.due_date && i.due_date < now.toISOString().slice(0, 10)),
          )
          .reduce(
            (s: number, i: any) => s + Math.max(0, invoiceTotal(i) - money(i.amount_paid)),
            0,
          ),
      },
      overdue: {
        count: validInvoices.filter(
          (i: any) =>
            i.payment_status === "overdue" ||
            (i.due_date &&
              i.due_date < now.toISOString().slice(0, 10) &&
              invoiceTotal(i) > money(i.amount_paid)),
        ).length,
        amount: validInvoices
          .filter(
            (i: any) =>
              i.payment_status === "overdue" ||
              (i.due_date &&
                i.due_date < now.toISOString().slice(0, 10) &&
                invoiceTotal(i) > money(i.amount_paid)),
          )
          .reduce(
            (s: number, i: any) => s + Math.max(0, invoiceTotal(i) - money(i.amount_paid)),
            0,
          ),
      },
    },
    lowStock: data.products.filter((p: any) => money(p.current_stock) <= money(p.minimum_stock)),
    stockValue,
    deadStock: data.products
      .filter(
        (p: any) =>
          money(p.current_stock) > 0 &&
          !data.movements.some(
            (m: any) =>
              m.product_id === p.id && Date.parse(m.created_at) > Date.now() - 90 * 86400000,
          ),
      )
      .map((p: any) => {
        const lastMovement = data.movements
          .filter((m: any) => m.product_id === p.id)
          .sort((a: any, b: any) => b.created_at.localeCompare(a.created_at))[0];
        const idleSince = lastMovement?.created_at ?? p.created_at;
        return {
          ...p,
          daysIdle: idleSince ? Math.floor((Date.now() - Date.parse(idleSince)) / 86400000) : 90,
        };
      }),
    recentInvoices: [...validInvoices].sort((a: any, b: any) =>
      b.invoice_date.localeCompare(a.invoice_date),
    ),
    customerRows: data.customers.map((c: any) => ({
      ...c,
      ...(customerTotals.get(c.id) ?? { revenue: 0, orders: 0, amount: 0 }),
      outstanding: validInvoices
        .filter((i: any) => i.customer_id === c.id)
        .reduce((s: number, i: any) => s + Math.max(0, invoiceTotal(i) - money(i.amount_paid)), 0),
      daysPastDue: validInvoices
        .filter(
          (i: any) =>
            i.customer_id === c.id &&
            i.due_date &&
            i.due_date < new Date().toISOString().slice(0, 10) &&
            invoiceTotal(i) > money(i.amount_paid),
        )
        .reduce(
          (max: number, i: any) =>
            Math.max(
              max,
              Math.floor((Date.now() - new Date(`${i.due_date}T00:00:00`).getTime()) / 86400000),
            ),
          0,
        ),
    })),
    leadStages: ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"].map(
      (stage) => ({ stage, count: data.leads.filter((l: any) => l.status === stage).length }),
    ),
    currentMonth,
    outstanding: receivables,
    payables,
    expenses,
    payments,
    paymentMonths,
    gstMonths: months.map((row: any) => {
      const key = monthKeyFromLabel(row.month);
      const itcClaimed = data.bills
        .filter((bill: any) => monthKey(bill.bill_date) === key)
        .reduce((sum: number, bill: any) => sum + money(bill.gst_amount), 0);
      return { ...row, itcClaimed, payable: row.collected - itcClaimed };
    }),
    expenseByCategory: [
      ...expenses
        .reduce(
          (map: Map<string, number>, row: any) =>
            map.set(row.category, (map.get(row.category) ?? 0) + money(row.amount)),
          new Map(),
        )
        .entries(),
    ].map(([name, value]) => ({ name, value })),
    suppliers: data.suppliers,
    products: data.products.map((p: any) => ({
      ...p,
      category: categories.get(p.category_id) ?? "Uncategorized",
    })),
    bills: data.bills,
    movements: data.movements,
    transactions: data.transactions,
    purchaseOrders: data.purchaseOrders,
    receipts: data.receipts,
  };
}

function invoiceTotalTax(invoice: any) {
  return Math.max(
    0,
    (invoice.invoice_items ?? []).reduce(
      (sum: number, item: any) =>
        sum + Math.round(((itemNet(item) * money(item.gst_percent)) / 100) * 100) / 100,
      0,
    ) - money(invoice.credit_tax),
  );
}
function monthKeyFromLabel(label: string) {
  const parsed = new Date(`${label} 01`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 7);
}
