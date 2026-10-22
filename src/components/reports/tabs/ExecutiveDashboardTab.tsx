/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Boxes,
  Wallet,
  Users,
  ShoppingBag,
  FileText,
  Receipt,
  Activity,
  ArrowUpRight,
  Percent,
} from "lucide-react";
import {
  CHART_COLORS,
  fmtINR,
  fmtCompactINR,
  dateRangeOptions,
  type DateRangeId,
} from "@/lib/reports-data";
import { ChartCard, KpiCard, Select } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";
import { invoiceTotal, monthKey, money } from "@/lib/report-model";

function scale(value: number, multiplier: number) {
  return Math.round(value * multiplier);
}

function trend(current: number, previous: number, reverse = false) {
  const change = previous ? ((current - previous) / Math.abs(previous)) * 100 : current ? 100 : 0;
  const rounded = Math.round(change * 10) / 10;
  return {
    value: `${rounded > 0 ? "+" : ""}${rounded}%`,
    positive: reverse ? rounded <= 0 : rounded >= 0,
  };
}

export function ExecutiveDashboardTab() {
  const { model } = useReportModel();
  const today = new Date();
  const toDateInput = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const [customStart, setCustomStart] = useState(() => {
    const date = new Date(today);
    date.setMonth(date.getMonth() - 11, 1);
    return toDateInput(date);
  });
  const [customEnd, setCustomEnd] = useState(() => toDateInput(today));
  const [range, setRange] = useState<DateRangeId>(() => {
    if (typeof window === "undefined") return "this-month";
    try {
      return (
        JSON.parse(localStorage.getItem("nexora:report-settings") ?? "{}").defaultDateRange ??
        "this-month"
      );
    } catch {
      return "this-month";
    }
  });
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "yesterday") {
    start.setDate(now.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    end.setDate(now.getDate() - 1);
    end.setHours(23, 59, 59, 999);
  } else if (range === "this-week") start.setDate(now.getDate() - now.getDay());
  else if (range === "this-month") start.setDate(1);
  else if (range === "last-month") {
    start.setMonth(now.getMonth() - 1, 1);
    end.setDate(0);
    end.setHours(23, 59, 59, 999);
  } else if (range === "this-quarter") start.setMonth(Math.floor(now.getMonth() / 3) * 3, 1);
  else if (range === "this-year") start.setMonth(0, 1);
  else if (range === "custom") {
    const customStartDate = new Date(`${customStart}T00:00:00`);
    const customEndDate = new Date(`${customEnd}T23:59:59.999`);
    if (!Number.isNaN(customStartDate.getTime())) start.setTime(customStartDate.getTime());
    if (!Number.isNaN(customEndDate.getTime())) end.setTime(customEndDate.getTime());
  }
  else start.setMonth(now.getMonth() - 11, 1);
  const filteredInvoices = (model?.validInvoices ?? []).filter(
    (i: any) =>
      new Date(`${i.invoice_date}T00:00:00`) >= start &&
      new Date(`${i.invoice_date}T00:00:00`) <= end,
  );
  const revenue = filteredInvoices.reduce((s: number, i: any) => s + invoiceTotal(i), 0);
  const profit =
    revenue -
    (model?.expenses ?? [])
      .filter(
        (e: any) =>
          e.transaction_date >= start.toISOString().slice(0, 10) &&
          e.transaction_date <= end.toISOString().slice(0, 10),
      )
      .reduce((s: number, e: any) => s + money(e.amount), 0);
  const calendar = Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    const invoices = (model?.validInvoices ?? []).filter(
      (row: any) => monthKey(row.invoice_date) === key,
    );
    const monthRevenue = invoices.reduce((sum: number, row: any) => sum + invoiceTotal(row), 0);
    const monthExpenses = (model?.expenses ?? [])
      .filter((row: any) => monthKey(row.transaction_date) === key)
      .reduce((sum: number, row: any) => sum + money(row.amount), 0);
    const monthPayments = (model?.payments ?? [])
      .filter((row: any) => monthKey(row.payment_date) === key)
      .reduce((sum: number, row: any) => sum + money(row.amount), 0);
    const monthIncome = ((model as any)?.transactions ?? [])
      .filter(
        (row: any) =>
          monthKey(row.transaction_date) === key &&
          row.transaction_type === "income" &&
          ["completed", "reconciled"].includes(row.status),
      )
      .reduce((sum: number, row: any) => sum + money(row.amount), 0);
    const movements = ((model as any)?.movements ?? []).filter(
      (row: any) => row.created_at?.slice(0, 7) === key,
    );
    const customers = model?.customerRows ?? [];
    return {
      key,
      month,
      date,
      revenue: monthRevenue,
      expenses: monthExpenses,
      netProfit: monthRevenue - monthExpenses,
      cashFlow: monthPayments + monthIncome - monthExpenses,
      stockIn: movements
        .filter(
          (row: any) =>
            row.movement_type === "in" ||
            (row.movement_type === "adjustment" && row.adjustment_type === "increase"),
        )
        .reduce((sum: number, row: any) => sum + money(row.quantity), 0),
      stockOut: movements
        .filter(
          (row: any) =>
            row.movement_type === "out" ||
            (row.movement_type === "adjustment" && row.adjustment_type === "decrease"),
        )
        .reduce((sum: number, row: any) => sum + money(row.quantity), 0),
      customerCount: customers.filter(
        (row: any) => row.created_at && row.created_at.slice(0, 7) <= key,
      ).length,
    };
  });
  const monthRows = calendar;
  const revenueTrend = monthRows.map((month: any) => ({
    month: month.month,
    value: month.revenue,
  }));
  const profitTrend = monthRows.map((month: any) => ({
    month: month.month,
    value: month.netProfit,
  }));
  const cashFlowTrend = monthRows.map((month: any) => ({
    month: month.month,
    value: month.cashFlow,
  }));
  const inventoryValueTrend = monthRows.map((month: any) => {
    const value = (model?.products ?? []).reduce((sum: number, product: any) => {
      const netAfterMonth = ((model as any)?.movements ?? [])
        .filter(
          (movement: any) =>
            movement.product_id === product.id && movement.created_at?.slice(0, 7) > month.key,
        )
        .reduce(
          (net: number, movement: any) =>
            net +
            (movement.movement_type === "in" ||
            (movement.movement_type === "adjustment" && movement.adjustment_type === "increase")
              ? money(movement.quantity)
              : -money(movement.quantity)),
          0,
        );
      return (
        sum +
        Math.max(0, money(product.current_stock) - netAfterMonth) *
          money(product.cost_price || product.purchase_price)
      );
    }, 0);
    return { month: month.month, value };
  });
  const stockMovementTrend = monthRows.map((month: any) => ({
    month: month.month,
    stockIn: month.stockIn,
    stockOut: month.stockOut,
  }));
  const customerGrowthTrend = monthRows.map((month: any) => ({
    month: month.month,
    value: month.customerCount,
  }));
  const topCustomers = (model?.topCustomers ?? []).map((c: any) => ({ ...c }));
  const topProducts = model?.topProducts ?? [];
  const topCategories = model?.categoriesData ?? [];
  const expenseByCategory = model?.expenseByCategory ?? [];
  const gstCollectionTrend = monthRows.map((month: any) => ({
    month: month.month,
    value:
      (model?.gstMonths ?? []).find((row: any) => monthKeyFromMonthLabel(row.month) === month.key)
        ?.collected ?? 0,
  }));
  const outstandingPayments = filteredInvoices.reduce(
    (s: number, i: any) => s + Math.max(0, invoiceTotal(i) - money(i.amount_paid)),
    0,
  );
  const baseKpis = {
    revenue,
    profit,
    expenses: revenue - profit,
    inventoryValue: model?.stockValue ?? 0,
    outstandingPayments,
    customerGrowth: (model?.customerRows ?? []).filter(
      (customer: any) =>
        customer.created_at &&
        new Date(customer.created_at) >= start &&
        new Date(customer.created_at) <= end,
    ).length,
    productsSold: filteredInvoices.reduce(
      (sum: number, invoice: any) =>
        sum +
        (invoice.invoice_items ?? []).reduce(
          (invoiceSum: number, item: any) => invoiceSum + money(item.quantity),
          0,
        ),
      0,
    ),
    invoicesCreated: filteredInvoices.length,
    avgOrderValue: filteredInvoices.length ? revenue / filteredInvoices.length : 0,
    cashFlow:
      (model?.payments ?? [])
        .filter(
          (payment: any) =>
            payment.payment_date >= start.toISOString().slice(0, 10) &&
            payment.payment_date <= now.toISOString().slice(0, 10),
        )
        .reduce((sum: number, payment: any) => sum + money(payment.amount), 0) +
      ((model as any)?.transactions ?? [])
        .filter(
          (row: any) =>
            row.transaction_date >= start.toISOString().slice(0, 10) &&
            row.transaction_date <= end.toISOString().slice(0, 10) &&
            row.transaction_type === "income" &&
            ["completed", "reconciled"].includes(row.status),
        )
        .reduce((sum: number, row: any) => sum + money(row.amount), 0) -
      (model?.expenses ?? [])
        .filter(
          (expense: any) =>
            expense.transaction_date >= start.toISOString().slice(0, 10) &&
            expense.transaction_date <= now.toISOString().slice(0, 10),
        )
        .reduce((sum: number, expense: any) => sum + money(expense.amount), 0),
    monthlyGrowth: 0,
    netMargin: revenue ? (profit / revenue) * 100 : 0,
  };
  const periodMs = Math.max(end.getTime() - start.getTime(), 86400000);
  const previousStart = new Date(start.getTime() - periodMs);
  const previousInvoices = (model?.validInvoices ?? []).filter((i: any) => {
    const date = new Date(`${i.invoice_date}T00:00:00`);
    return date >= previousStart && date < start;
  });
  const previousRevenue = previousInvoices.reduce(
    (sum: number, invoice: any) => sum + invoiceTotal(invoice),
    0,
  );
  baseKpis.monthlyGrowth = previousRevenue
    ? Math.round(((revenue - previousRevenue) / Math.abs(previousRevenue)) * 1000) / 10
    : revenue
      ? 100
      : 0;
  const previousExpenses = (model?.expenses ?? [])
    .filter(
      (e: any) =>
        e.transaction_date >= previousStart.toISOString().slice(0, 10) &&
        e.transaction_date < start.toISOString().slice(0, 10),
    )
    .reduce((sum: number, e: any) => sum + money(e.amount), 0);
  const previousProfit = previousRevenue - previousExpenses;
  const previousProductsSold = previousInvoices.reduce(
    (sum: number, invoice: any) =>
      sum +
      (invoice.invoice_items ?? []).reduce(
        (subtotal: number, item: any) => subtotal + money(item.quantity),
        0,
      ),
    0,
  );
  const previousCustomerGrowth = (model?.customerRows ?? []).filter(
    (c: any) => c.created_at >= previousStart.toISOString() && c.created_at < start.toISOString(),
  ).length;
  const previousOrderValue = previousInvoices.length
    ? previousRevenue / previousInvoices.length
    : 0;
  const previousCashFlow =
    (model?.payments ?? [])
      .filter(
        (p: any) =>
          p.payment_date >= previousStart.toISOString().slice(0, 10) &&
          p.payment_date < start.toISOString().slice(0, 10),
      )
      .reduce((sum: number, p: any) => sum + money(p.amount), 0) +
    ((model as any)?.transactions ?? [])
      .filter(
        (row: any) =>
          row.transaction_date >= previousStart.toISOString().slice(0, 10) &&
          row.transaction_date < start.toISOString().slice(0, 10) &&
          row.transaction_type === "income" &&
          ["completed", "reconciled"].includes(row.status),
      )
      .reduce((sum: number, row: any) => sum + money(row.amount), 0) -
    previousExpenses;
  const m = 1;

  const kpis = (() => {
    const k = baseKpis;
    return [
      {
        label: "Revenue",
        value: fmtINR(scale(k.revenue, m)),
        icon: IndianRupee,
        bg: "bg-emerald-50",
        iconColor: "text-emerald-600",
        trend: trend(k.revenue, previousRevenue),
      },
      {
        label: "Profit",
        value: fmtINR(scale(k.profit, m)),
        icon: TrendingUp,
        bg: "bg-blue-50",
        iconColor: "text-blue-600",
        trend: trend(k.profit, previousProfit),
      },
      {
        label: "Expenses",
        value: fmtINR(scale(k.expenses, m)),
        icon: TrendingDown,
        bg: "bg-red-50",
        iconColor: "text-red-600",
        trend: trend(k.expenses, previousExpenses, true),
      },
      {
        label: "Inventory Value",
        value: fmtINR(scale(k.inventoryValue, m)),
        icon: Boxes,
        bg: "bg-violet-50",
        iconColor: "text-violet-600",
        trend: trend(k.inventoryValue, k.inventoryValue),
      },
      {
        label: "Outstanding Payments",
        value: fmtINR(scale(k.outstandingPayments, m)),
        icon: Wallet,
        bg: "bg-amber-50",
        iconColor: "text-amber-600",
        trend: trend(k.outstandingPayments, k.outstandingPayments, true),
      },
      {
        label: "Customer Growth",
        value: scale(k.customerGrowth, m).toLocaleString("en-IN"),
        icon: Users,
        bg: "bg-cyan-50",
        iconColor: "text-cyan-600",
        trend: trend(k.customerGrowth, previousCustomerGrowth),
      },
      {
        label: "Products Sold",
        value: scale(k.productsSold, m).toLocaleString("en-IN"),
        icon: ShoppingBag,
        bg: "bg-indigo-50",
        iconColor: "text-indigo-600",
        trend: trend(k.productsSold, previousProductsSold),
      },
      {
        label: "Invoices Created",
        value: scale(k.invoicesCreated, m).toLocaleString("en-IN"),
        icon: FileText,
        bg: "bg-sky-50",
        iconColor: "text-sky-600",
        trend: trend(k.invoicesCreated, previousInvoices.length),
      },
      {
        label: "Average Order Value",
        value: fmtINR(k.avgOrderValue),
        icon: Receipt,
        bg: "bg-fuchsia-50",
        iconColor: "text-fuchsia-600",
        trend: trend(k.avgOrderValue, previousOrderValue),
      },
      {
        label: "Cash Flow",
        value: fmtINR(scale(k.cashFlow, m)),
        icon: Activity,
        bg: "bg-teal-50",
        iconColor: "text-teal-600",
        trend: trend(k.cashFlow, previousCashFlow),
      },
      {
        label: "Monthly Growth",
        value: `${k.monthlyGrowth}%`,
        icon: ArrowUpRight,
        bg: "bg-lime-50",
        iconColor: "text-lime-600",
        trend: trend(k.revenue, previousRevenue),
      },
      {
        label: "Net Margin",
        value: `${k.netMargin}%`,
        icon: Percent,
        bg: "bg-orange-50",
        iconColor: "text-orange-600",
        trend: trend(k.netMargin, previousRevenue ? (previousProfit / previousRevenue) * 100 : 0),
      },
    ];
  })();

  return (
    <div className="space-y-6">
      {/* Header + global date range */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Executive Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The business-intelligence center — revenue, profit, inventory, and customer health at a
            glance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={range}
            onChange={(v) => setRange(v as DateRangeId)}
            options={dateRangeOptions}
            className="sm:w-48"
          />
          {range === "custom" && (
            <>
              <input
                aria-label="Report start date"
                type="date"
                value={customStart}
                max={customEnd || toDateInput(now)}
                onChange={(event) => setCustomStart(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-foreground"
              />
              <input
                aria-label="Report end date"
                type="date"
                value={customEnd}
                min={customStart}
                max={toDateInput(now)}
                onChange={(event) => setCustomEnd(event.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2 text-sm text-foreground"
              />
            </>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <KpiCard key={k.label} {...k} index={i} />
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Revenue Trend" subtitle="Last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#revGrad)"
                name="Revenue"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Profit Trend" subtitle="Net profit, last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={profitTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={false}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Cash Flow" subtitle="Net monthly cash movement">
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={cashFlowTrend}>
              <defs>
                <linearGradient id="cfGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2}
                fill="url(#cfGrad2)"
                name="Cash Flow"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Inventory Value" subtitle="Stock valuation, last 12 months">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={inventoryValueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Inventory Value" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Stock Movement" subtitle="Units in vs. out per month">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stockMovementTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Legend />
              <Bar dataKey="stockIn" fill="#10b981" radius={[4, 4, 0, 0]} name="Stock In" />
              <Bar dataKey="stockOut" fill="#ef4444" radius={[4, 4, 0, 0]} name="Stock Out" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth" subtitle="Total active customers">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={customerGrowthTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={false}
                name="Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Customers" subtitle="By revenue this year">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topCustomers.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => fmtCompactINR(v)}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={130} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Products" subtitle="By units sold">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topProducts.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={150} />
              <Tooltip />
              <Bar dataKey="unitsSold" fill="#6366f1" radius={[0, 4, 4, 0]} name="Units Sold" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Categories" subtitle="Revenue share">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={topCategories}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ share }: any) => `${share}%`}
              >
                {topCategories.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown" subtitle="By category, YTD">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={expenseByCategory}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
              >
                {expenseByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="GST Collection" subtitle="Monthly GST collected">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={gstCollectionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} name="GST Collected" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function monthKeyFromMonthLabel(label: string) {
  const d = new Date(`${label} 1`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 7);
}
