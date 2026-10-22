/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FileText, CheckCircle2, Clock3, AlertTriangle, Percent, Receipt } from "lucide-react";
import { fmtINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";
import { invoiceTotal } from "@/lib/report-model";
const statusColors = ["#10b981", "#f59e0b", "#ef4444"];

export function BillingReportsTab() {
  const { model } = useReportModel();
  const invoiceStats = model?.invoiceStats ?? {
    total: 0,
    paid: { count: 0, amount: 0 },
    pending: { count: 0, amount: 0 },
    overdue: { count: 0, amount: 0 },
  };
  const all = model?.validInvoices ?? [];
  const totalAmount = all.reduce((sum: number, invoice: any) => sum + invoiceTotal(invoice), 0);
  const collectionRate = totalAmount
    ? Math.round((invoiceStats.paid.amount / totalAmount) * 1000) / 10
    : 0;
  const avgInvoiceValue = invoiceStats.total ? Math.round(totalAmount / invoiceStats.total) : 0;
  const statusPie = [
    { name: "Paid", value: invoiceStats.paid.amount },
    { name: "Pending", value: invoiceStats.pending.amount },
    { name: "Overdue", value: invoiceStats.overdue.amount },
  ];
  const months = model?.months ?? [];
  const invoiceStatusTrend = months.map((month: any) => month);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Billing Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Invoice health — collections, aging, and average deal size.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard
          label="Invoices"
          value={invoiceStats.total.toString()}
          icon={FileText}
          bg="bg-slate-100"
          iconColor="text-slate-600"
          index={0}
        />
        <KpiCard
          label="Paid"
          value={invoiceStats.paid.count.toString()}
          sub={fmtINR(invoiceStats.paid.amount)}
          icon={CheckCircle2}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <KpiCard
          label="Pending"
          value={invoiceStats.pending.count.toString()}
          sub={fmtINR(invoiceStats.pending.amount)}
          icon={Clock3}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={2}
        />
        <KpiCard
          label="Overdue"
          value={invoiceStats.overdue.count.toString()}
          sub={fmtINR(invoiceStats.overdue.amount)}
          icon={AlertTriangle}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={3}
        />
        <KpiCard
          label="Collection Rate"
          value={`${collectionRate}%`}
          icon={Percent}
          bg="bg-blue-50"
          iconColor="text-blue-600"
          index={4}
        />
        <KpiCard
          label="Avg. Invoice Value"
          value={fmtINR(avgInvoiceValue)}
          icon={Receipt}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={5}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Invoice Status Trend"
          subtitle="Paid vs pending vs overdue, last 12 months"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invoiceStatusTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} width={36} />
              <Tooltip />
              <Legend />
              <Bar dataKey="paid" stackId="a" fill="#10b981" name="Paid" />
              <Bar dataKey="pending" stackId="a" fill="#f59e0b" name="Pending" />
              <Bar
                dataKey="overdue"
                stackId="a"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                name="Overdue"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Amount by Status" subtitle="Share of total invoiced amount">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={statusPie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={85}
              >
                {statusPie.map((_, i) => (
                  <Cell key={i} fill={statusColors[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => fmtINR(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <SectionCard title="Billing Summary" subtitle="This fiscal year">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {invoiceStats.total} invoices were raised, with a{" "}
          <span className="font-semibold text-foreground">{collectionRate}%</span> collection rate.{" "}
          {invoiceStats.overdue.count} invoices worth {fmtINR(invoiceStats.overdue.amount)} are
          currently overdue and should be prioritized for follow-up.
        </p>
      </SectionCard>
    </div>
  );
}
