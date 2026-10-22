/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, Wallet, Users, Truck } from "lucide-react";
import { fmtINR, fmtCompactINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";
import { invoiceTotal, monthKey, monthLabel, money } from "@/lib/report-model";

export function FinanceReportsTab() {
  const { model } = useReportModel();
  const months = model?.months ?? [];
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const fiscalStartMonth = model?.financialYearStartMonth ?? 4;
  const fiscalStartYear = now.getMonth() + 1 >= fiscalStartMonth ? now.getFullYear() : now.getFullYear() - 1;
  const fiscalStartKey = `${fiscalStartYear}-${String(fiscalStartMonth).padStart(2, "0")}`;
  const ytdMonths = months.filter((month: any) => month.key >= fiscalStartKey && month.key <= currentMonthKey);
  const plMonthly = months.slice(-12).map((m: any) => ({
    month: m.month,
    revenue: m.revenue,
    expenses: m.expenses,
    netProfit: m.netProfit,
  }));
  const ytdRevenue = ytdMonths.reduce((s: number, m: any) => s + m.revenue, 0);
  const ytdExpenses = ytdMonths.reduce((s: number, m: any) => s + m.expenses, 0);
  const ytdProfit = ytdRevenue - ytdExpenses;
  const payments = model?.payments ?? [];
  const flowMonths = new Map<string, number>();
  payments.forEach((p: any) =>
    flowMonths.set(
      monthKey(p.payment_date),
      (flowMonths.get(monthKey(p.payment_date)) ?? 0) + money(p.amount),
    ),
  );
  (model?.expenses ?? []).forEach((e: any) =>
    flowMonths.set(
      monthKey(e.transaction_date),
      (flowMonths.get(monthKey(e.transaction_date)) ?? 0) - money(e.amount),
    ),
  );
  ((model as any)?.transactions ?? [])
    .filter(
      (row: any) =>
        row.transaction_type === "income" && ["completed", "reconciled"].includes(row.status),
    )
    .forEach((row: any) =>
      flowMonths.set(
        monthKey(row.transaction_date),
        (flowMonths.get(monthKey(row.transaction_date)) ?? 0) + money(row.amount),
      ),
    );
  const cashFlowTrend = [...flowMonths]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ month: monthLabel(key), value }));
  if (!cashFlowTrend.length) cashFlowTrend.push({ month: "—", value: 0 });
  const receivableInvoices = (model?.validInvoices ?? []).filter(
    (i: any) => invoiceTotal(i) > money(i.amount_paid),
  );
  const financeReceivables = {
    total: model?.outstanding ?? 0,
    overdue: receivableInvoices
      .filter((i: any) => i.due_date && i.due_date < new Date().toISOString().slice(0, 10))
      .reduce((s: number, i: any) => s + invoiceTotal(i) - money(i.amount_paid), 0),
    count: receivableInvoices.length,
  };
  const financePayables = {
    total: model?.payables ?? 0,
    overdue: (model?.bills ?? [])
      .filter((b: any) => b.due_date < new Date().toISOString().slice(0, 10))
      .reduce((s: number, b: any) => s + Math.max(0, money(b.total) - money(b.amount_paid)), 0),
    count: (model?.bills ?? []).filter((b: any) => money(b.total) > money(b.amount_paid)).length,
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Finance Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Income, expenses, profit & loss, and working-capital position.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="YTD Income"
          value={fmtCompactINR(ytdRevenue)}
          icon={TrendingUp}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={0}
        />
        <KpiCard
          label="YTD Expenses"
          value={fmtCompactINR(ytdExpenses)}
          icon={TrendingDown}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={1}
        />
        <KpiCard
          label="YTD Net Profit"
          value={fmtCompactINR(ytdProfit)}
          icon={BarChart2}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={2}
        />
        <KpiCard
          label="Cash Flow (Jul)"
          value={fmtINR(cashFlowTrend[cashFlowTrend.length - 1].value)}
          icon={Wallet}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={3}
        />
        <KpiCard
          label="Receivables"
          value={fmtINR(financeReceivables.total)}
          sub={`${financeReceivables.count} invoices`}
          icon={Users}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={4}
        />
        <KpiCard
          label="Payables"
          value={fmtINR(financePayables.total)}
          sub={`${financePayables.count} bills`}
          icon={Truck}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={5}
        />
      </div>

      <ChartCard title="Profit & Loss" subtitle="Revenue vs expenses, last 12 months">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={plMonthly}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmtCompactINR(v)} width={54} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Legend />
            <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            <Bar dataKey="netProfit" fill="#6366f1" radius={[4, 4, 0, 0]} name="Net Profit" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Cash Flow Trend" subtitle="Net monthly cash movement">
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={cashFlowTrend}>
            <defs>
              <linearGradient id="ffGrad" x1="0" y1="0" x2="0" y2="1">
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
              fill="url(#ffGrad)"
              name="Cash Flow"
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SectionCard title="Receivables" subtitle="Outstanding customer invoices">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Outstanding</span>
              <span className="font-semibold">{fmtINR(financeReceivables.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className="font-semibold text-red-600">
                {fmtINR(financeReceivables.overdue)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invoice Count</span>
              <span className="font-semibold">{financeReceivables.count}</span>
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Payables" subtitle="Outstanding supplier bills">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Outstanding</span>
              <span className="font-semibold">{fmtINR(financePayables.total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overdue</span>
              <span className="font-semibold text-red-600">{fmtINR(financePayables.overdue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bill Count</span>
              <span className="font-semibold">{financePayables.count}</span>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
