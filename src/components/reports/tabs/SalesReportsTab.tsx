/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import {
  ResponsiveContainer,
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
import { CHART_COLORS, fmtINR, fmtCompactINR, type SalesPeriod } from "@/lib/reports-data";
import { ChartCard, SectionCard, Select, TableWrapper, Th, Td } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";
import { invoiceTotal } from "@/lib/report-model";

const periodOptions: { value: SalesPeriod; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

export function SalesReportsTab() {
  const { model } = useReportModel();
  const [period, setPeriod] = useState<SalesPeriod>("monthly");
  const invoices = model?.validInvoices ?? [];
  const customers = model?.topCustomers ?? [];
  const topProducts = model?.topProducts ?? [];
  const revenueByCategory = model?.categoriesData ?? [];
  const grouped = new Map<string, { label: string; revenue: number; orders: number }>();
  for (const invoice of invoices as any[]) {
    const date = new Date(`${invoice.invoice_date}T00:00:00`);
    let key: string;
    if (period === "daily") key = invoice.invoice_date;
    else if (period === "weekly") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      key = start.toISOString().slice(0, 10);
    } else if (period === "monthly") key = invoice.invoice_date.slice(0, 7);
    else if (period === "quarterly")
      key = `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`;
    else key = `${date.getFullYear()}`;
    const label =
      period === "daily"
        ? key
        : period === "weekly"
          ? `Week of ${key}`
          : period === "monthly"
            ? date.toLocaleDateString("en-IN", { month: "short", year: "numeric" })
            : key;
    const bucket = grouped.get(key) ?? { label, revenue: 0, orders: 0 };
    bucket.revenue += invoiceTotal(invoice);
    bucket.orders++;
    grouped.set(key, bucket);
  }
  const data = [...grouped.values()].sort((a, b) => a.label.localeCompare(b.label));
  const topCustomers = customers;
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Sales Reports</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Revenue and order trends across every reporting cadence.
          </p>
        </div>
        <Select
          value={period}
          onChange={(v) => setPeriod(v as SalesPeriod)}
          options={periodOptions}
          className="sm:w-40"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SectionCard>
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="text-xl font-bold text-foreground mt-1">{fmtINR(total)}</p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs text-muted-foreground">Total Orders</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {totalOrders.toLocaleString("en-IN")}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs text-muted-foreground">Avg. Order Value</p>
          <p className="text-xl font-bold text-foreground mt-1">
            {fmtINR(Math.round(total / Math.max(totalOrders, 1)))}
          </p>
        </SectionCard>
        <SectionCard>
          <p className="text-xs text-muted-foreground">Periods Shown</p>
          <p className="text-xl font-bold text-foreground mt-1">{data.length}</p>
        </SectionCard>
      </div>

      <ChartCard
        title={`${periodOptions.find((p) => p.value === period)?.label} Sales`}
        subtitle="Revenue by period"
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={period === "daily" ? 2 : 0} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} name="Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Top Customers" subtitle="Revenue leaders this year">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topCustomers.slice(0, 6)} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10 }}
                tickFormatter={(v) => fmtCompactINR(v)}
              />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={140} />
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue by Category" subtitle="Share of total revenue">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={revenueByCategory}
                dataKey="revenue"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
                label={({ share }: any) => `${share}%`}
              >
                {revenueByCategory.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard title="Top Products" subtitle="By units sold, this year" noPadding>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th right>Units Sold</Th>
              <Th right>Revenue</Th>
            </tr>
          </thead>
          <tbody>
            {topProducts.map((p) => (
              <tr key={p.name} className="hover:bg-slate-50">
                <Td className="font-medium">{p.name}</Td>
                <Td>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                </Td>
                <Td right>{p.unitsSold.toLocaleString("en-IN")}</Td>
                <Td right className="font-semibold text-emerald-600">
                  {fmtINR(p.revenue)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
