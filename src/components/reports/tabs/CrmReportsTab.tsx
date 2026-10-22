/* Supabase is not generated with database row types in this project. */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Users, Target, UserX, Wallet } from "lucide-react";
import { fmtINR, fmtDate, CHART_COLORS } from "@/lib/reports-data";
import { ChartCard, KpiCard, SectionCard, TableWrapper, Th, Td, StatusPill } from "../shared";
import { useReportModel } from "@/hooks/useReportModel";

export function CrmReportsTab() {
  const { model } = useReportModel();
  const customers = model?.customerRows ?? [];
  const leadFunnel = model?.leadStages ?? [];
  const won = leadFunnel.find((row: any) => row.stage === "won")?.count ?? 0;
  const leadCount = leadFunnel.reduce((sum: number, row: any) => sum + row.count, 0);
  const leadConversionRate = leadCount ? Math.round((won / leadCount) * 1000) / 10 : 0;
  const topCustomers = customers
    .slice()
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 8)
    .map((c: any) => ({ ...c, growth: c.growth ?? 0 }));
  const inactiveCustomers = customers
    .filter(
      (c: any) => !c.last_purchase || Date.parse(c.last_purchase) < Date.now() - 90 * 86400000,
    )
    .map((c: any) => ({ name: c.name, lastOrder: c.last_purchase || "", totalSpend: c.revenue }));
  const outstandingCustomers = customers
    .filter((c: any) => c.outstanding > 0)
    .map((c: any) => ({ name: c.name, outstanding: c.outstanding, daysPastDue: c.daysPastDue }));
  const customerGrowthTrend = [
    ...new Set(customers.map((c: any) => c.created_at?.slice(0, 7)).filter(Boolean)),
  ]
    .sort()
    .map((month: any) => ({
      month,
      value: customers.filter((c: any) => c.created_at?.slice(0, 7) <= month).length,
    }));
  if (!customerGrowthTrend.length) customerGrowthTrend.push({ month: "—", value: 0 });
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">CRM Reports</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Customer growth, lead conversion, and relationship health.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard
          label="Active Customers"
          value={customerGrowthTrend[customerGrowthTrend.length - 1].value.toLocaleString("en-IN")}
          icon={Users}
          bg="bg-cyan-50"
          iconColor="text-cyan-600"
          index={0}
        />
        <KpiCard
          label="Lead Conversion"
          value={`${leadConversionRate}%`}
          icon={Target}
          bg="bg-emerald-50"
          iconColor="text-emerald-600"
          index={1}
        />
        <KpiCard
          label="Inactive Customers"
          value={inactiveCustomers.length.toString()}
          icon={UserX}
          bg="bg-red-50"
          iconColor="text-red-600"
          index={2}
        />
        <KpiCard
          label="Outstanding Customers"
          value={outstandingCustomers.length.toString()}
          icon={Wallet}
          bg="bg-amber-50"
          iconColor="text-amber-600"
          index={3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Customer Growth" subtitle="Active customers, last 12 months">
          <ResponsiveContainer width="100%" height={260}>
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

        <ChartCard
          title="Lead Conversion Funnel"
          subtitle={`${leadConversionRate}% end-to-end conversion`}
        >
          <div className="space-y-2.5">
            {leadFunnel.map((stage, i) => {
              const pct = leadCount ? Math.round((stage.count / leadCount) * 100) : 0;
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{stage.stage}</span>
                    <span className="text-muted-foreground">
                      {stage.count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      <SectionCard title="Top Customers" subtitle="By revenue, this year" noPadding>
        <TableWrapper>
          <thead>
            <tr>
              <Th>Customer</Th>
              <Th right>Orders</Th>
              <Th right>Revenue</Th>
              <Th right>Growth</Th>
            </tr>
          </thead>
          <tbody>
            {topCustomers.map((c) => (
              <tr key={c.name} className="hover:bg-slate-50">
                <Td className="font-medium">{c.name}</Td>
                <Td right>{c.orders}</Td>
                <Td right className="font-semibold">
                  {fmtINR(c.revenue)}
                </Td>
                <Td right>
                  <StatusPill
                    status={c.growth >= 0 ? "positive" : "negative"}
                    label={`${c.growth >= 0 ? "+" : ""}${c.growth}%`}
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Inactive Customers" subtitle="No orders in 90+ days" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Last Order</Th>
                <Th right>Lifetime Spend</Th>
              </tr>
            </thead>
            <tbody>
              {inactiveCustomers.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{c.name}</Td>
                  <Td>{fmtDate(c.lastOrder)}</Td>
                  <Td right>{fmtINR(c.totalSpend)}</Td>
                </tr>
              ))}
            </tbody>
          </TableWrapper>
        </SectionCard>

        <SectionCard title="Outstanding Customers" subtitle="Unpaid balances" noPadding>
          <TableWrapper>
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th right>Outstanding</Th>
                <Th right>Days Past Due</Th>
              </tr>
            </thead>
            <tbody>
              {outstandingCustomers.map((c) => (
                <tr key={c.name} className="hover:bg-slate-50">
                  <Td className="font-medium">{c.name}</Td>
                  <Td right className="font-semibold text-red-600">
                    {fmtINR(c.outstanding)}
                  </Td>
                  <Td right>
                    {c.daysPastDue > 0 ? (
                      <StatusPill status="negative" label={`${c.daysPastDue}d`} />
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
    </div>
  );
}
