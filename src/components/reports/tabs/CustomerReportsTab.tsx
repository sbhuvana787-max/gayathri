/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Gem, ShoppingCart, Wallet } from "lucide-react";
import { fmtINR, fmtDate, fmtCompactINR } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td, StatusPill } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";

export function CustomerReportsTab() {
  const { model } = useReportModel();
  const customerLifetimeValue = (model?.customerRows ?? []).map((c: any) => ({
    name: c.name,
    clv: c.revenue,
    avgOrderValue: c.orders ? c.revenue / c.orders : 0,
    orders: c.orders,
  }));
  const customerPurchaseHistory = (model?.recentInvoices ?? [])
    .slice(0, 50)
    .map((invoice: any) => ({
      customer:
        model?.customerRows.find((c: any) => c.id === invoice.customer_id)?.name ?? "Unknown",
      invoice: invoice.invoice_number,
      date: invoice.invoice_date,
      amount: invoice.invoice_items.reduce(
        (sum: number, item: any) =>
          sum +
          Number(item.quantity) *
            Number(item.unit_price) *
            (1 - Number(item.discount_percent) / 100) *
            (1 + Number(item.gst_percent) / 100),
        0,
      ),
    }));
  const avgPurchaseValue = customerPurchaseHistory.length
    ? customerPurchaseHistory.reduce((s: number, p: any) => s + p.amount, 0) /
      customerPurchaseHistory.length
    : 0;
  const customerOutstanding = (model?.customerRows ?? [])
    .filter((c: any) => c.outstanding > 0)
    .map((c: any) => ({ name: c.name, outstanding: c.outstanding, daysPastDue: c.daysPastDue }));
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Customer Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Purchase behavior, lifetime value, and outstanding balances.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Tracked Customers"
          value={customerLifetimeValue.length.toString()}
          icon={Users}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={0}
        />
        <KpiCard
          label="Avg. Customer LTV"
          value={fmtCompactINR(
            Math.round(
              customerLifetimeValue.reduce((s, c) => s + c.clv, 0) / customerLifetimeValue.length,
            ),
          )}
          icon={Gem}
          bg="bg-violet-50"
          iconColor="text-violet-600"
          index={1}
        />
        <KpiCard
          label="Avg. Purchase Value"
          value={fmtINR(avgPurchaseValue)}
          icon={ShoppingCart}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={2}
        />
        <KpiCard
          label="Outstanding Customers"
          value={customerOutstanding.length.toString()}
          icon={Wallet}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={3}
        />
      </div>

      <ChartCard title="Customer Lifetime Value" subtitle="Top customers by projected LTV">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={customerLifetimeValue} layout="vertical" margin={{ left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => fmtCompactINR(v)} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={150} />
            <Tooltip formatter={(v: number) => fmtINR(v)} />
            <Bar dataKey="clv" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Lifetime Value" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <SectionCard
        title="Recent Purchase History"
        subtitle="Latest transactions across customers"
        noPadding
      >
        <TableWrapper>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th>Invoice</Th>
              <Th>Date</Th>
              <Th right>Amount</Th>
            </tr>
          </thead>
          <tbody>
            {customerPurchaseHistory.map((p) => (
              <tr key={p.invoice} className="hover:bg-slate-50">
                <Td className="font-medium">{p.customer}</Td>
                <Td>
                  <span className="font-mono text-xs">{p.invoice}</span>
                </Td>
                <Td>{fmtDate(p.date)}</Td>
                <Td right className="font-semibold">
                  {fmtINR(p.amount)}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      <SectionCard title="Outstanding Balances" subtitle="Customers with unpaid dues" noPadding>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th right>Outstanding</Th>
              <Th right>Status</Th>
            </tr>
          </thead>
          <tbody>
            {customerOutstanding.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50">
                <Td className="font-medium">{c.name}</Td>
                <Td right className="font-semibold text-red-600">
                  {fmtINR(c.outstanding)}
                </Td>
                <Td right>
                  {c.daysPastDue > 0 ? (
                    <StatusPill status="negative" label={`${c.daysPastDue}d overdue`} />
                  ) : (
                    <StatusPill status="positive" label="Current" />
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>
    </div>
  );
}
